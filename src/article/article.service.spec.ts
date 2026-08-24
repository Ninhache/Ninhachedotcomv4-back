import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { ArticleService } from './article.service';

// A row shaped the way Prisma hands it back: scalars plus the two includes
// `toDTO` flattens. `previewToken` is populated on purpose — the point of this
// suite is that it only survives on the admin-facing reads.
const row = (over: Record<string, unknown> = {}) => ({
    id: 'a1',
    slug: 'un-article',
    isVisible: true,
    previewToken: 'secret-token',
    categoryLinks: [{ category: { id: 'c1', slug: 'dev', translations: [] } }],
    translations: [{ locale: 'fr', title: 'Titre' }],
    ...over,
});

describe('ArticleService: private review links', () => {
    let service: ArticleService;
    let article: {
        findMany: jest.Mock;
        findFirst: jest.Mock;
        findUnique: jest.Mock;
        update: jest.Mock;
    };

    beforeEach(async () => {
        article = {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
        };
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ArticleService,
                { provide: PrismaService, useValue: { article } },
            ],
        }).compile();
        service = module.get(ArticleService);
    });

    describe('the token never leaks on a public read', () => {
        it('strips it from the public list', async () => {
            article.findMany.mockResolvedValue([row()]);
            const [dto] = await service.findAllPublic();
            expect(dto).not.toHaveProperty('previewToken');
            expect(dto.slug).toBe('un-article');
        });

        it('strips it from the public single-article read', async () => {
            article.findFirst.mockResolvedValue(row());
            const dto = await service.findOneBySlug('un-article');
            expect(dto).not.toHaveProperty('previewToken');
        });

        it('strips it from the preview read itself', async () => {
            article.findFirst.mockResolvedValue(row());
            const dto = await service.findOneByPreviewToken('secret-token');
            expect(dto).not.toHaveProperty('previewToken');
        });

        it('keeps it on the admin list, which has to display the link', async () => {
            article.findMany.mockResolvedValue([row()]);
            const [dto] = await service.findAllAdmin();
            expect(dto.previewToken).toBe('secret-token');
        });
    });

    describe('findOneByPreviewToken', () => {
        it('resolves a draft, ignoring isVisible', async () => {
            article.findFirst.mockResolvedValue(row({ isVisible: false }));
            const dto = await service.findOneByPreviewToken('secret-token');
            expect(dto.slug).toBe('un-article');
            // The token is the only credential: no visibility filter allowed,
            // otherwise the whole feature is a no-op.
            expect(article.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { previewToken: 'secret-token' },
                }),
            );
        });

        it('404s on an unknown token', async () => {
            article.findFirst.mockResolvedValue(null);
            await expect(service.findOneByPreviewToken('nope')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('issuePreviewToken', () => {
        it('writes a fresh URL-safe token', async () => {
            article.findUnique.mockResolvedValue(row());
            const { previewToken } = await service.issuePreviewToken('a1');
            expect(previewToken).toMatch(/^[A-Za-z0-9_-]{32}$/);
            expect(article.update).toHaveBeenCalledWith({
                where: { id: 'a1' },
                data: { previewToken },
            });
        });

        it('rotates: a second call never reissues the same token', async () => {
            article.findUnique.mockResolvedValue(row());
            const first = await service.issuePreviewToken('a1');
            const second = await service.issuePreviewToken('a1');
            expect(second.previewToken).not.toBe(first.previewToken);
        });

        it('404s on an unknown article', async () => {
            article.findUnique.mockResolvedValue(null);
            await expect(service.issuePreviewToken('ghost')).rejects.toThrow(
                NotFoundException,
            );
            expect(article.update).not.toHaveBeenCalled();
        });
    });

    describe('revokePreviewToken', () => {
        it('clears the token', async () => {
            article.findUnique.mockResolvedValue(row());
            await expect(service.revokePreviewToken('a1')).resolves.toEqual({
                previewToken: null,
            });
            expect(article.update).toHaveBeenCalledWith({
                where: { id: 'a1' },
                data: { previewToken: null },
            });
        });

        it('404s on an unknown article', async () => {
            article.findUnique.mockResolvedValue(null);
            await expect(service.revokePreviewToken('ghost')).rejects.toThrow(
                NotFoundException,
            );
        });
    });
});
