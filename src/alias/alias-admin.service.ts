import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RevalidationService } from 'src/revalidation/revalidation.service';
import { Locale } from '@prisma/client';
import { AliasService } from './alias.service';
import { AliasBodyDto, CreateAliasDto } from './dto/create-alias.dto';
import { UpdateAliasDto } from './dto/update-alias.dto';

// JS reserved words rejected as alias keys (a body refers to others via
// `$.<key>`). 'args' is reserved too: `$.args` is the marker's own args, so an
// alias named 'args' could never be reached through `$`.
const RESERVED = new Set([
    'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
    'default', 'delete', 'do', 'else', 'export', 'extends', 'finally', 'for',
    'function', 'if', 'import', 'in', 'instanceof', 'new', 'return', 'super',
    'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with',
    'yield', 'let', 'static', 'enum', 'await', 'implements', 'package',
    'protected', 'interface', 'private', 'public', 'null', 'true', 'false',
    'args',
]);

// v1: an alias change can affect any content, so invalidate everything.
const CONTENT_ENTITIES = ['projects', 'experiences', 'contacts', 'skills', 'profile'];

@Injectable()
export class AliasAdminService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly aliasService: AliasService,
        private readonly revalidation: RevalidationService
    ) {}

    list() {
        return this.prisma.alias.findMany({
            include: { bodies: true },
            orderBy: { key: 'asc' },
        });
    }

    async create(dto: CreateAliasDto) {
        this.assertKeyAllowed(dto.key);
        this.assertUniqueLocales(dto.bodies);

        const existing = await this.prisma.alias.findUnique({
            where: { key: dto.key },
        });
        if (existing) {
            throw new ConflictException(`alias '${dto.key}' already exists`);
        }

        const alias = await this.prisma.alias.create({
            data: {
                key: dto.key,
                bodies: { create: dto.bodies.map(b => ({ ...b })) },
            },
            include: { bodies: true },
        });

        await this.afterMutation();
        return alias;
    }

    async update(id: string, dto: UpdateAliasDto) {
        const existing = await this.prisma.alias.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException(`alias '${id}' not found`);

        if (dto.key && dto.key !== existing.key) {
            this.assertKeyAllowed(dto.key);
            const clash = await this.prisma.alias.findUnique({
                where: { key: dto.key },
            });
            if (clash) {
                throw new ConflictException(`alias '${dto.key}' already exists`);
            }
        }
        if (dto.bodies) this.assertUniqueLocales(dto.bodies);

        const alias = await this.prisma.alias.update({
            where: { id },
            data: {
                key: dto.key ?? undefined,
                // Providing bodies replaces the whole set.
                bodies: dto.bodies
                    ? { deleteMany: {}, create: dto.bodies.map(b => ({ ...b })) }
                    : undefined,
            },
            include: { bodies: true },
        });

        await this.afterMutation();
        return alias;
    }

    async remove(id: string) {
        const existing = await this.prisma.alias.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException(`alias '${id}' not found`);

        await this.prisma.alias.delete({ where: { id } }); // bodies cascade
        await this.afterMutation();
        return { ok: true as const };
    }

    /** Drop the resolver's definition cache, then broadly revalidate content. */
    private async afterMutation(): Promise<void> {
        this.aliasService.invalidate();
        const tags = [
            ...CONTENT_ENTITIES.flatMap(e => [
                e,
                ...Object.values(Locale).map(loc => `${e}:${loc}`),
            ]),
            'greeting',
        ];
        await this.revalidation.revalidate(tags);
    }

    private assertKeyAllowed(key: string): void {
        if (RESERVED.has(key)) {
            throw new BadRequestException(
                `'${key}' is a reserved word and cannot be an alias key`
            );
        }
    }

    private assertUniqueLocales(bodies: AliasBodyDto[]): void {
        const seen = new Set<string>();
        for (const b of bodies) {
            if (seen.has(b.locale)) {
                throw new BadRequestException(
                    `duplicate body locale '${b.locale}'`
                );
            }
            seen.add(b.locale);
        }
    }
}
