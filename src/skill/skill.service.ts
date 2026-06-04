import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/create-category.dto';
import { CreateSkillDto } from './dto/create-skill.dto';
import { ReorderCategoryItemDto } from './dto/reorder-categories.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';

@Injectable()
export class SkillService {
    constructor(private readonly prismaService: PrismaService) {}

    // ---- includes / mappers -------------------------------------------------

    private skillInclude: Prisma.SkillInclude = {
        categoryLinks: { include: { category: { include: { translations: true } } } },
        tags: { include: { translations: true } },
        translations: true,
    };

    private categoryInclude(visibleSkillsOnly: boolean): Prisma.SkillCategoryInclude {
        return {
            translations: true,
            skillLinks: {
                where: visibleSkillsOnly ? { skill: { isVisible: true } } : undefined,
                orderBy: { order: 'asc' },
                include: {
                    skill: {
                        include: {
                            translations: true,
                            // tag translations are needed so the frontend can build
                            // each tag's nameByLocale on the public skills view.
                            tags: { include: { translations: true } },
                        },
                    },
                },
            },
        };
    }

    // Flatten the join rows back to the historical response shape: a skill keeps
    // a `categories[]` array, a category keeps an ordered `skills[]` array.
    private skillToDTO(skill: any) {
        const { categoryLinks, ...rest } = skill;
        return { ...rest, categories: (categoryLinks ?? []).map((l: any) => l.category) };
    }

    private categoryToDTO(category: any) {
        const { skillLinks, ...rest } = category;
        return { ...rest, skills: (skillLinks ?? []).map((l: any) => l.skill) };
    }

    /**
     * Reconcile a skill's category memberships from the skill side: drop links to
     * categories no longer listed, keep existing ones (preserving their order),
     * and append new ones at the end of each target category. The authoritative
     * per-category order is set from the category side (see create/updateCategory).
     */
    private async syncCategoryLinks(
        tx: Prisma.TransactionClient,
        skillId: string,
        categoryIds: string[]
    ) {
        if (!categoryIds.length) {
            await tx.skillOnCategory.deleteMany({ where: { skillId } });
            return;
        }
        await tx.skillOnCategory.deleteMany({
            where: { skillId, categoryId: { notIn: categoryIds } },
        });
        const existing = await tx.skillOnCategory.findMany({
            where: { skillId },
            select: { categoryId: true },
        });
        const have = new Set(existing.map(e => e.categoryId));
        for (const categoryId of categoryIds) {
            if (have.has(categoryId)) continue;
            const agg = await tx.skillOnCategory.aggregate({
                where: { categoryId },
                _max: { order: true },
            });
            await tx.skillOnCategory.create({
                data: { skillId, categoryId, order: (agg._max.order ?? -1) + 1 },
            });
        }
    }

    // ---- Skills -------------------------------------------------------------

    async create(createSkillDto: CreateSkillDto) {
        const { categoryIds, image, isVisible, tagIds, translations, wikiUrl } =
            createSkillDto;

        return this.prismaService.$transaction(async tx => {
            const created = await tx.skill.create({
                data: {
                    image,
                    isVisible,
                    wikiUrl,
                    translations: {
                        create: translations.map(t => ({
                            locale: t.locale,
                            name: t.name,
                        })),
                    },
                    tags: { connect: tagIds.map(id => ({ id })) },
                },
            });
            await this.syncCategoryLinks(tx, created.id, categoryIds);
            const full = await tx.skill.findUnique({
                where: { id: created.id },
                include: this.skillInclude,
            });
            return this.skillToDTO(full);
        });
    }

    async findAll() {
        const skills = await this.prismaService.skill.findMany({
            include: this.skillInclude,
        });
        return skills.map(s => this.skillToDTO(s));
    }

    async findOne(id: string) {
        const skill = await this.prismaService.skill.findUnique({
            where: { id },
            include: this.skillInclude,
        });

        if (!skill) {
            throw new NotFoundException(`Skill with id [${id}] not found`);
        }

        return this.skillToDTO(skill);
    }

    async update(id: string, updateSkillDto: UpdateSkillDto) {
        const { categoryIds, image, isVisible, tagIds, translations, wikiUrl } =
            updateSkillDto;

        return this.prismaService.$transaction(async tx => {
            await tx.skill.update({
                where: { id },
                data: {
                    image,
                    isVisible,
                    wikiUrl,
                    // Only touch a relation when its ids were actually provided,
                    // so a partial PATCH doesn't silently clear tags or wipe every
                    // translation (deleteMany with no create).
                    tags:
                        tagIds !== undefined
                            ? { set: tagIds.map(id => ({ id })) }
                            : undefined,
                    translations:
                        translations !== undefined
                            ? {
                                  deleteMany: {},
                                  create: translations.map(t => ({
                                      locale: t.locale,
                                      name: t.name,
                                  })),
                              }
                            : undefined,
                },
            });
            if (categoryIds !== undefined) {
                await this.syncCategoryLinks(tx, id, categoryIds);
            }
            const full = await tx.skill.findUnique({
                where: { id },
                include: this.skillInclude,
            });
            return this.skillToDTO(full);
        });
    }

    async remove(id: string) {
        const skill = await this.findOne(id);

        return this.prismaService.skill.delete({
            where: { id: skill.id },
        });
    }

    async removeAll() {
        return this.prismaService.skill.deleteMany();
    }

    // ---- Categories ---------------------------------------------------------

    async findAllCategories() {
        const categories = await this.prismaService.skillCategory.findMany({
            where: { isVisible: true },
            orderBy: [{ order: 'asc' }, { id: 'asc' }],
            include: this.categoryInclude(true),
        });
        return categories.map(c => this.categoryToDTO(c));
    }

    async findAllCategoriesAdmin() {
        const categories = await this.prismaService.skillCategory.findMany({
            orderBy: [{ order: 'asc' }, { id: 'asc' }],
            include: this.categoryInclude(false),
        });
        return categories.map(c => this.categoryToDTO(c));
    }

    async createCategory(dto: CreateCategoryDto) {
        return this.prismaService.$transaction(async tx => {
            const agg = await tx.skillCategory.aggregate({ _max: { order: true } });
            const category = await tx.skillCategory.create({
                data: {
                    isVisible: dto.isVisible,
                    order: (agg._max.order ?? -1) + 1, // append at the end
                    translations: { create: dto.translations },
                },
            });
            if (dto.skillIds?.length) {
                // array order becomes the per-category display order
                await tx.skillOnCategory.createMany({
                    data: dto.skillIds.map((skillId, index) => ({
                        skillId,
                        categoryId: category.id,
                        order: index,
                    })),
                });
            }
            const full = await tx.skillCategory.findUnique({
                where: { id: category.id },
                include: this.categoryInclude(false),
            });
            return this.categoryToDTO(full);
        });
    }

    async updateCategory(id: string, dto: UpdateCategoryDto) {
        const exists = await this.prismaService.skillCategory.findUnique({
            where: { id },
        });
        if (!exists) throw new NotFoundException(`Category ${id} not found`);

        return this.prismaService.$transaction(async tx => {
            await tx.skillCategory.update({
                where: { id },
                data: {
                    isVisible: dto.isVisible,
                    translations: dto.translations
                        ? { deleteMany: {}, create: dto.translations }
                        : undefined,
                },
            });
            if (dto.skillIds !== undefined) {
                // Replace this category's skill links so the array order becomes
                // the authoritative per-category display order.
                await tx.skillOnCategory.deleteMany({ where: { categoryId: id } });
                if (dto.skillIds.length) {
                    await tx.skillOnCategory.createMany({
                        data: dto.skillIds.map((skillId, index) => ({
                            skillId,
                            categoryId: id,
                            order: index,
                        })),
                    });
                }
            }
            const full = await tx.skillCategory.findUnique({
                where: { id },
                include: this.categoryInclude(false),
            });
            return this.categoryToDTO(full);
        });
    }

    async reorderCategories(items: ReorderCategoryItemDto[]) {
        await this.prismaService.$transaction(
            items.map(item =>
                this.prismaService.skillCategory.update({
                    where: { id: item.id },
                    data: { order: item.order },
                })
            )
        );
        return this.findAllCategoriesAdmin();
    }

    async removeCategory(id: string) {
        const exists = await this.prismaService.skillCategory.findUnique({
            where: { id },
        });
        if (!exists) throw new NotFoundException(`Category ${id} not found`);
        return this.prismaService.skillCategory.delete({ where: { id } });
    }
}
