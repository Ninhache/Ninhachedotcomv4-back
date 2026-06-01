import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/create-category.dto';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';

@Injectable()
export class SkillService {
    constructor(private readonly prismaService: PrismaService) {}

    async create(createSkillDto: CreateSkillDto) {
        const { categoryIds, image, isVisible, tagIds, translations, wikiUrl } =
            createSkillDto;

        return this.prismaService.skill.create({
            data: {
                image,
                isVisible,
                wikiUrl,
                translations: {
                    create: translations.map(translation => ({
                        locale: translation.locale,
                        name: translation.name,
                    })),
                },
                tags: {
                    connect: tagIds.map(id => ({ id })),
                },
                categories: {
                    connect: categoryIds.map(id => ({ id })),
                },
            },
            include: {
                categories: { include: { translations: true } },
                tags: { include: { translations: true } },
                translations: true,
            },
        });
    }

    async findAll() {
        return this.prismaService.skill.findMany({
            include: {
                categories: { include: { translations: true } },
                tags: { include: { translations: true } },
                translations: true,
            },
        });
    }

    async findOne(id: string) {
        const skill = await this.prismaService.skill.findUnique({
            where: {
                id,
            },
            include: {
                categories: { include: { translations: true } },
                tags: { include: { translations: true } },
                translations: true,
            },
        });

        if (!skill) {
            throw new NotFoundException(`Skill with id [${id}] not found`);
        }

        return skill;
    }

    async update(id: string, updateSkillDto: UpdateSkillDto) {
        const { categoryIds, image, isVisible, tagIds, translations, wikiUrl } =
            updateSkillDto;

        return this.prismaService.skill.update({
            where: {
                id,
            },
            data: {
                image,
                isVisible,
                wikiUrl,
                // Only touch a relation when its ids were actually provided,
                // so a partial PATCH doesn't silently clear tags/categories or
                // wipe every translation (deleteMany with no create).
                tags:
                    tagIds !== undefined
                        ? { set: tagIds.map(id => ({ id })) }
                        : undefined,
                categories:
                    categoryIds !== undefined
                        ? { set: categoryIds.map(id => ({ id })) }
                        : undefined,
                translations:
                    translations !== undefined
                        ? {
                              deleteMany: {},
                              create: translations.map(translation => ({
                                  locale: translation.locale,
                                  name: translation.name,
                              })),
                          }
                        : undefined,
            },
            include: {
                categories: { include: { translations: true } },
                tags: { include: { translations: true } },
                translations: true,
            },
        });
    }

    async remove(id: string) {
        const skill = await this.findOne(id);

        return this.prismaService.skill.delete({
            where: {
                id: skill.id,
            },
        });
    }

    async removeAll() {
        return this.prismaService.skill.deleteMany();
    }

    async findAllCategories() {
        return this.prismaService.skillCategory.findMany({
            where: { isVisible: true },
            include: {
                translations: true,
                skills: {
                    where: { isVisible: true },
                    include: {
                        translations: true,
                        // tag translations are needed so the frontend can build
                        // each tag's nameByLocale on the public skills view.
                        tags: { include: { translations: true } },
                    },
                },
            },
        });
    }

    // ---- Category admin CRUD ----

    private categoryInclude = {
        translations: true,
        skills: {
            include: {
                translations: true,
                tags: { include: { translations: true } },
            },
        },
    };

    async findAllCategoriesAdmin() {
        return this.prismaService.skillCategory.findMany({
            include: this.categoryInclude,
        });
    }

    async createCategory(dto: CreateCategoryDto) {
        return this.prismaService.skillCategory.create({
            data: {
                isVisible: dto.isVisible,
                translations: { create: dto.translations },
                skills: dto.skillIds
                    ? { connect: dto.skillIds.map(id => ({ id })) }
                    : undefined,
            },
            include: this.categoryInclude,
        });
    }

    async updateCategory(id: string, dto: UpdateCategoryDto) {
        const exists = await this.prismaService.skillCategory.findUnique({ where: { id } });
        if (!exists) throw new NotFoundException(`Category ${id} not found`);

        return this.prismaService.skillCategory.update({
            where: { id },
            data: {
                isVisible: dto.isVisible,
                translations: dto.translations
                    ? { deleteMany: {}, create: dto.translations }
                    : undefined,
                skills: dto.skillIds !== undefined
                    ? { set: dto.skillIds.map(id => ({ id })) }
                    : undefined,
            },
            include: this.categoryInclude,
        });
    }

    async removeCategory(id: string) {
        const exists = await this.prismaService.skillCategory.findUnique({ where: { id } });
        if (!exists) throw new NotFoundException(`Category ${id} not found`);
        return this.prismaService.skillCategory.delete({ where: { id } });
    }
}
