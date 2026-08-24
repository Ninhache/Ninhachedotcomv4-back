import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

// Prisma's error code for a unique-constraint violation — thrown here when
// `slug` collides with an existing article.
const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

// Entropy of a private review link. 24 random bytes (192 bits) is far past
// guessable and base64url-encodes to a 32-char URL-safe segment.
const PREVIEW_TOKEN_BYTES = 24;

// Categories (with their translations) are flattened out of the join table
// by toDTO; article translations are returned as-is.
const ARTICLE_INCLUDE = {
    categoryLinks: {
        include: { category: { include: { translations: true } } },
    },
    translations: true,
} as const;

@Injectable()
export class ArticleService {
    constructor(private readonly prismaService: PrismaService) {}

    // Flatten the join rows back to a plain `categories[]` array (mirrors
    // SkillService.skillToDTO).
    // `previewToken` is a credential, so it is dropped unless the caller is an
    // authenticated admin path that has to display the link back.
    private toDTO(article: any, opts: { withPreviewToken?: boolean } = {}) {
        const { categoryLinks, previewToken, ...rest } = article;
        return {
            ...rest,
            ...(opts.withPreviewToken ? { previewToken } : {}),
            categories: (categoryLinks ?? []).map((l: any) => l.category),
        };
    }

    /**
     * Reconciles an article's category memberships from the article side:
     * drops links to categories no longer listed, keeps existing ones
     * (preserving their order), and appends new ones at the end of each
     * target category (mirrors SkillService.syncCategoryLinks).
     */
    private async syncCategoryLinks(
        tx: Prisma.TransactionClient,
        articleId: string,
        categoryIds: string[]
    ) {
        if (!categoryIds.length) {
            await tx.articleOnCategory.deleteMany({ where: { articleId } });
            return;
        }
        await tx.articleOnCategory.deleteMany({
            where: { articleId, categoryId: { notIn: categoryIds } },
        });
        const existing = await tx.articleOnCategory.findMany({
            where: { articleId },
            select: { categoryId: true },
        });
        const have = new Set(existing.map(e => e.categoryId));
        for (const categoryId of categoryIds) {
            if (have.has(categoryId)) continue;
            const agg = await tx.articleOnCategory.aggregate({
                where: { categoryId },
                _max: { order: true },
            });
            await tx.articleOnCategory.create({
                data: {
                    articleId,
                    categoryId,
                    order: (agg._max.order ?? -1) + 1,
                },
            });
        }
    }

    /** Creates an article, its translations, and its category links. */
    async create(dto: CreateArticleDto) {
        try {
            return await this.prismaService.$transaction(async tx => {
                const created = await tx.article.create({
                    data: {
                        slug: dto.slug,
                        isVisible: dto.isVisible,
                        publishedAt: dto.publishedAt
                            ? new Date(dto.publishedAt)
                            : null,
                        coverImageUrl: dto.coverImageUrl ?? null,
                        tags: dto.tags ?? [],
                        order: dto.order ?? 0,
                        translations: {
                            create: dto.translations.map(t => ({
                                locale: t.locale,
                                title: t.title,
                                excerpt: t.excerpt,
                                body: t.body,
                            })),
                        },
                    },
                });
                await this.syncCategoryLinks(tx, created.id, dto.categoryIds);
                const full = await tx.article.findUnique({
                    where: { id: created.id },
                    include: ARTICLE_INCLUDE,
                });
                return this.toDTO(full, { withPreviewToken: true });
            });
        } catch (error) {
            throw this.mapSlugConflict(error);
        }
    }

    /** Visible articles only, optionally scoped to a category slug/tag. */
    async findAllPublic(category?: string, tag?: string) {
        const articles = await this.prismaService.article.findMany({
            where: {
                isVisible: true,
                ...(category
                    ? { categoryLinks: { some: { category: { slug: category } } } }
                    : {}),
                ...(tag ? { tags: { has: tag } } : {}),
            },
            orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
            include: ARTICLE_INCLUDE,
        });
        return articles.map(a => this.toDTO(a));
    }

    /** Unfiltered list (incl. drafts) for the admin CRUD table. */
    async findAllAdmin() {
        const articles = await this.prismaService.article.findMany({
            orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
            include: ARTICLE_INCLUDE,
        });
        return articles.map(a => this.toDTO(a, { withPreviewToken: true }));
    }

    /** Public single-article read. A draft or unknown slug both 404. */
    async findOneBySlug(slug: string) {
        const article = await this.prismaService.article.findFirst({
            where: { slug, isVisible: true },
            include: ARTICLE_INCLUDE,
        });
        if (!article) {
            throw new NotFoundException(`Article with slug [${slug}] not found`);
        }
        return this.toDTO(article);
    }

    /**
     * Private review read: resolves an article by its preview token and
     * deliberately ignores `isVisible`, so a draft can be proofread at a
     * shareable URL before it is published. The token is the only credential,
     * so an unknown one is an ordinary 404 with no hint it ever existed.
     */
    async findOneByPreviewToken(token: string) {
        const article = await this.prismaService.article.findFirst({
            where: { previewToken: token },
            include: ARTICLE_INCLUDE,
        });
        if (!article) {
            throw new NotFoundException('Preview link not found');
        }
        return this.toDTO(article);
    }

    /**
     * Issues (or rotates) an article's private review link. Rotation is the
     * point: writing a fresh token invalidates the previously shared URL from
     * the next request on. Returns the token alone, never a full article.
     */
    async issuePreviewToken(id: string) {
        await this.findOneOrThrow(id);
        const previewToken =
            randomBytes(PREVIEW_TOKEN_BYTES).toString('base64url');
        await this.prismaService.article.update({
            where: { id },
            data: { previewToken },
        });
        return { previewToken };
    }

    /** Revokes the review link: the shared URL 404s from the next request on. */
    async revokePreviewToken(id: string) {
        await this.findOneOrThrow(id);
        await this.prismaService.article.update({
            where: { id },
            data: { previewToken: null },
        });
        return { previewToken: null };
    }

    /**
     * Patches an article. Translations/category links are replaced wholesale
     * only when the caller sends them, so a partial PATCH leaves the existing
     * rows untouched. `publishedAt` is 3-state (omit/clear/set), except that
     * publishing an article that has never been published (`publishedAt`
     * null) without an explicit `publishedAt` backfills it to now.
     */
    async update(id: string, dto: UpdateArticleDto) {
        const current = await this.findOneOrThrow(id);
        const publishedAt =
            dto.publishedAt === undefined
                ? dto.isVisible === true && current.publishedAt === null
                    ? new Date()
                    : undefined
                : dto.publishedAt
                  ? new Date(dto.publishedAt)
                  : null;

        try {
            return await this.prismaService.$transaction(async tx => {
                await tx.article.update({
                    where: { id },
                    data: {
                        slug: dto.slug,
                        isVisible: dto.isVisible,
                        publishedAt,
                        coverImageUrl: dto.coverImageUrl,
                        tags: dto.tags,
                        order: dto.order,
                        translations:
                            dto.translations !== undefined
                                ? {
                                      deleteMany: {},
                                      create: dto.translations.map(t => ({
                                          locale: t.locale,
                                          title: t.title,
                                          excerpt: t.excerpt,
                                          body: t.body,
                                      })),
                                  }
                                : undefined,
                    },
                });
                if (dto.categoryIds !== undefined) {
                    await this.syncCategoryLinks(tx, id, dto.categoryIds);
                }
                const full = await tx.article.findUnique({
                    where: { id },
                    include: ARTICLE_INCLUDE,
                });
                return this.toDTO(full, { withPreviewToken: true });
            });
        } catch (error) {
            throw this.mapSlugConflict(error);
        }
    }

    /** Deletes an article. Cascades handle translations/category links; the
     * Project.blogCategory/blogArticle FKs SetNull automatically. */
    async remove(id: string) {
        await this.findOneOrThrow(id);
        return this.prismaService.article.delete({ where: { id } });
    }

    private async findOneOrThrow(id: string) {
        const article = await this.prismaService.article.findUnique({
            where: { id },
        });
        if (!article) {
            throw new NotFoundException(`Article with id [${id}] not found`);
        }
        return article;
    }

    // Prisma surfaces a unique-constraint clash as a generic 500; translate it
    // into a 409 the admin form can show inline. Any other error is rethrown
    // unchanged.
    private mapSlugConflict(error: unknown) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === UNIQUE_CONSTRAINT_VIOLATION
        ) {
            return new ConflictException('slug already in use');
        }
        return error;
    }
}
