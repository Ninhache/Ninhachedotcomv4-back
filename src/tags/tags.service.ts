import { Injectable, NotFoundException } from '@nestjs/common';
import { Locale, Prisma, TagType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { FindAllTagsQueryDto } from './dto/find-all.dto';
import { TagResponseDTO } from './dto/tags-response.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagsService {
    constructor(private prisma: PrismaService) {}

    private toDTO(
        tag: Prisma.TagGetPayload<{ include: { translations: true } }>
    ): TagResponseDTO {
        const nameByLocale = tag.translations.reduce(
            (acc, t) => {
                acc[t.locale as Locale] = t.name;
                return acc;
            },
            {} as Record<Locale, string>
        );
        return {
            id: tag.id,
            type: tag.type as TagType,
            isVisible: tag.isVisible,
            hexColor: tag.hexColor,
            translations: tag.translations.map(t => ({
                id: t.id,
                locale: t.locale as Locale,
                name: t.name,
            })),
            nameByLocale,
        };
    }

    async create(dto: CreateTagDto): Promise<TagResponseDTO> {
        const allLocales = Object.values(Locale);
        const provided = new Map(dto.translations.map(t => [t.locale, t.name]));
        const fallbackName = dto.translations[0]?.name ?? 'Unnamed';

        const finalTranslations = allLocales.map(loc => ({
            locale: loc,
            name: provided.get(loc) ?? fallbackName,
        }));

        const created = await this.prisma.tag.create({
            data: {
                type: dto.type,
                isVisible: dto.isVisible,
                hexColor: dto.hexColor,
                translations: { create: finalTranslations },
            },
            include: { translations: true },
        });

        return this.toDTO(created);
    }

    async findAll(query: FindAllTagsQueryDto): Promise<TagResponseDTO[]> {
        const { type, visibleOnly, q, locale } = query;

        const where: Prisma.TagWhereInput = {
            ...(type ? { type } : {}),
            ...(visibleOnly ? { isVisible: true } : {}),
            ...(q
                ? {
                      translations: {
                          some: {
                              name: { contains: q, mode: 'insensitive' },
                              ...(locale ? { locale } : {}),
                          },
                      },
                  }
                : {}),
        };

        const tags = await this.prisma.tag.findMany({
            where,
            include: { translations: true },
            orderBy: { id: 'asc' },
        });

        if (locale) {
            tags.sort((a, b) => {
                const an =
                    a.translations.find(t => t.locale === locale)?.name ?? '';
                const bn =
                    b.translations.find(t => t.locale === locale)?.name ?? '';
                return an.localeCompare(bn, locale);
            });
        }

        return tags.map(t => this.toDTO(t));
    }

    async findOne(id: string): Promise<TagResponseDTO> {
        const tag = await this.prisma.tag.findFirst({
            where: { id },
            include: { translations: true },
        });
        if (!tag) throw new NotFoundException(`Tag with id [${id}] not found`);
        return this.toDTO(tag);
    }

    async update(id: string, dto: UpdateTagDto): Promise<TagResponseDTO> {
        const existing = await this.prisma.tag.findFirst({
            where: { id },
            include: { translations: true },
        });
        if (!existing)
            throw new NotFoundException(`Tag with id [${id}] not found`);

        const data: Prisma.TagUpdateInput = {};

        if (dto.type !== undefined) data.type = dto.type as TagType;
        if (dto.isVisible !== undefined) data.isVisible = dto.isVisible;
        if (dto.hexColor !== undefined) data.hexColor = dto.hexColor;

        if (dto.translations?.length) {
            data.translations = {
                upsert: dto.translations.map(translation => ({
                    where: {
                        tagId_locale: { tagId: id, locale: translation.locale },
                    },
                    update: { name: translation.name },
                    create: {
                        locale: translation.locale,
                        name: translation.name,
                    },
                })),
            };
        }

        if (!Object.keys(data).length) {
            return this.toDTO(existing);
        }

        const updated = await this.prisma.tag.update({
            where: { id },
            data,
            include: { translations: true },
        });

        return this.toDTO(updated);
    }

    async remove(id: string): Promise<TagResponseDTO> {
        const existing = await this.prisma.tag.findFirst({
            where: { id },
            include: { translations: true },
        });
        if (!existing)
            throw new NotFoundException(`Tag with id [${id}] not found`);

        await this.prisma.tag.delete({ where: { id } });
        return this.toDTO(existing);
    }

    /**
     * Set only the visibility flag. Backs `PATCH /tags/:id/visibility` so the
     * admin UI can toggle a tag without resending its translations/colour.
     */
    async setVisibility(
        id: string,
        isVisible: boolean
    ): Promise<TagResponseDTO> {
        const existing = await this.prisma.tag.findFirst({ where: { id } });
        if (!existing)
            throw new NotFoundException(`Tag with id [${id}] not found`);

        const updated = await this.prisma.tag.update({
            where: { id },
            data: { isVisible },
            include: { translations: true },
        });
        return this.toDTO(updated);
    }
}
