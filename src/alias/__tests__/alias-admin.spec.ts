import { BadRequestException, ConflictException } from '@nestjs/common';
import { AliasAdminService } from '../alias-admin.service';
import { AliasService } from '../alias.service';

// Minimal in-memory Prisma double backing the alias table.
function makeAdmin() {
    const rows: any[] = [];
    const prisma = {
        alias: {
            findMany: jest.fn(async () => rows.map(r => ({ ...r }))),
            findUnique: jest.fn(async ({ where }: any) => {
                const match = rows.find(r =>
                    where.key !== undefined
                        ? r.key === where.key
                        : r.id === where.id
                );
                return match ? { ...match } : null;
            }),
            create: jest.fn(async ({ data }: any) => {
                const row = {
                    id: `id_${data.key}`,
                    key: data.key,
                    bodies: data.bodies.create.map((b: any, i: number) => ({
                        id: `b${i}`,
                        aliasId: `id_${data.key}`,
                        ...b,
                    })),
                };
                rows.push(row);
                return { ...row };
            }),
            update: jest.fn(async ({ where, data }: any) => {
                const row = rows.find(r => r.id === where.id);
                if (data.key) row.key = data.key;
                if (data.bodies)
                    row.bodies = data.bodies.create.map((b: any, i: number) => ({
                        id: `b${i}`,
                        aliasId: row.id,
                        ...b,
                    }));
                return { ...row };
            }),
            delete: jest.fn(async ({ where }: any) => {
                const i = rows.findIndex(r => r.id === where.id);
                return rows.splice(i, 1)[0];
            }),
        },
        project: { count: jest.fn(async () => 0) },
    };
    const config = {
        get: (k: string) =>
            ({ 'alias.evalTimeoutMs': 50, 'alias.evalMaxDepth': 20 } as Record<
                string,
                number
            >)[k],
    };
    const aliasService = new AliasService(prisma as never, config as never);
    const revalidation = { revalidate: jest.fn(async () => {}) };
    const admin = new AliasAdminService(
        prisma as never,
        aliasService,
        revalidation as never
    );
    return { admin, aliasService, revalidation };
}

describe('AliasAdminService', () => {
    it('creates an alias that is resolvable immediately (no redeploy)', async () => {
        const { admin, aliasService, revalidation } = makeAdmin();

        await admin.create({
            key: 'phone',
            bodies: [
                { locale: 'fr', code: "return '06 12 34 56 78';" },
                { locale: 'en', code: "return '06 12 34 56 78';" },
            ],
        });

        // cache invalidated + front revalidated
        expect(revalidation.revalidate).toHaveBeenCalled();

        // immediately resolvable
        await expect(aliasService.resolveText('@@phone', 'fr')).resolves.toBe(
            '06 12 34 56 78'
        );
    });

    it('rejects a reserved JS word as key', async () => {
        const { admin } = makeAdmin();
        await expect(
            admin.create({
                key: 'return',
                bodies: [{ locale: 'fr', code: "return 'x';" }],
            })
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects duplicate body locales', async () => {
        const { admin } = makeAdmin();
        await expect(
            admin.create({
                key: 'dup',
                bodies: [
                    { locale: 'fr', code: "return '1';" },
                    { locale: 'fr', code: "return '2';" },
                ],
            })
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a duplicate key', async () => {
        const { admin } = makeAdmin();
        const body = { bodies: [{ locale: 'fr', code: "return 'x';" }] };
        await admin.create({ key: 'phone', ...body });
        await expect(admin.create({ key: 'phone', ...body })).rejects.toBeInstanceOf(
            ConflictException
        );
    });

    it('deletes an alias and reports ok', async () => {
        const { admin } = makeAdmin();
        const created = await admin.create({
            key: 'phone',
            bodies: [{ locale: 'fr', code: "return 'x';" }],
        });
        await expect(admin.remove((created as any).id)).resolves.toEqual({
            ok: true,
        });
    });
});
