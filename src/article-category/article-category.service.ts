import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateArticleCategoryDto } from './dto/create-article-category.dto';
import { ReorderArticleCategoryItemDto } from './dto/reorder-article-categories.dto';
import { UpdateArticleCategoryDto } from './dto/update-article-category.dto';

// Prisma's error code for a unique-constraint violation — thrown here when
// `slug` collides with an existing category.
const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

// Article membership (skills/skills-style join) is read from the Article side
// (see ArticleService.toDTO); a category only needs to carry its own name.
const ARTICLE_CATEGORY_INCLUDE = {
    translations: true,
} as const;

@Injectable()
export class ArticleCategoryService {
    constructor(private readonly prismaService: PrismaService) {}

    /** Visible categories only, ordered for the public /blog filter bar. */
    findAllPublic() {
        return this.prismaService.articleCategory.findMany({
            where: { isVisible: true },
            orderBy: [{ order: 'asc' }, { id: 'asc' }],
            include: ARTICLE_CATEGORY_INCLUDE,
        });
    }

    /** Unfiltered list (incl. hidden categories) for the admin CRUD table. */
    findAllAdmin() {
        return this.prismaService.articleCategory.findMany({
            orderBy: [{ order: 'asc' }, { id: 'asc' }],
            include: ARTICLE_CATEGORY_INCLUDE,
        });
    }

    /** Creates a category with its translations. Throws 409 on a slug clash. */
    async create(dto: CreateArticleCategoryDto) {
        try {
            return await this.prismaService.articleCategory.create({
                data: {
                    slug: dto.slug,
                    isVisible: dto.isVisible,
                    order: dto.order ?? 0,
                    translations: { create: dto.translations },
                },
                include: ARTICLE_CATEGORY_INCLUDE,
            });
        } catch (error) {
            throw this.mapSlugConflict(error);
        }
    }

    /**
     * Patches a category. Translations are replaced wholesale only when the
     * caller sends the array, so a partial PATCH omitting `translations`
     * leaves the existing rows untouched (mirrors SkillService.updateCategory).
     */
    async update(id: string, dto: UpdateArticleCategoryDto) {
        await this.findOneOrThrow(id);
        try {
            return await this.prismaService.articleCategory.update({
                where: { id },
                data: {
                    slug: dto.slug,
                    isVisible: dto.isVisible,
                    order: dto.order,
                    translations:
                        dto.translations !== undefined
                            ? { deleteMany: {}, create: dto.translations }
                            : undefined,
                },
                include: ARTICLE_CATEGORY_INCLUDE,
            });
        } catch (error) {
            throw this.mapSlugConflict(error);
        }
    }

    /** Deletes a category. Cascades handle translations/article links. */
    async remove(id: string) {
        await this.findOneOrThrow(id);
        return this.prismaService.articleCategory.delete({ where: { id } });
    }

    /** Bulk-persists the admin drag-reorder, then returns the fresh list. */
    async reorder(items: ReorderArticleCategoryItemDto[]) {
        await this.prismaService.$transaction(
            items.map(item =>
                this.prismaService.articleCategory.update({
                    where: { id: item.id },
                    data: { order: item.order },
                })
            )
        );
        return this.findAllAdmin();
    }

    private async findOneOrThrow(id: string) {
        const category = await this.prismaService.articleCategory.findUnique({
            where: { id },
        });
        if (!category) {
            throw new NotFoundException(
                `ArticleCategory with id [${id}] not found`
            );
        }
        return category;
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
