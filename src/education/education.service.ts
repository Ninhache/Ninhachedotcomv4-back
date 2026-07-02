import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEducationDto } from './dto/create-education.dto';
import { UpdateEducationDto } from './dto/update-education.dto';

@Injectable()
export class EducationService {
    constructor(private prismaService: PrismaService) {}

    async create(dto: CreateEducationDto) {
        const {
            institutionName,
            startDate,
            endDate,
            logoUrl,
            siteUrl,
            isVisible,
            order,
            translations,
        } = dto;

        return this.prismaService.education.create({
            data: {
                institutionName,
                startDate,
                endDate: endDate ?? null,
                logoUrl,
                siteUrl,
                isVisible,
                order: order ?? 0,
                translations: {
                    create: translations.map(t => ({
                        locale: t.locale,
                        degree: t.degree,
                        description: t.description,
                    })),
                },
            },
            include: { translations: true },
        });
    }

    findAll() {
        return this.prismaService.education.findMany({
            include: { translations: true },
            orderBy: [{ startDate: 'asc' }, { order: 'asc' }],
        });
    }

    async findOne(id: string) {
        const education = await this.prismaService.education.findUnique({
            where: { id },
            include: { translations: true },
        });
        if (!education) {
            throw new NotFoundException(`Education with id [${id}] not found`);
        }
        return education;
    }

    update(id: string, dto: UpdateEducationDto) {
        const {
            institutionName,
            startDate,
            endDate,
            logoUrl,
            siteUrl,
            isVisible,
            order,
            translations,
        } = dto;

        return this.prismaService.education.update({
            where: { id },
            data: {
                institutionName,
                startDate,
                endDate,
                logoUrl,
                siteUrl,
                isVisible,
                order,
                translations:
                    translations !== undefined
                        ? {
                              deleteMany: {},
                              create: translations.map(t => ({
                                  locale: t.locale,
                                  degree: t.degree,
                                  description: t.description,
                              })),
                          }
                        : undefined,
            },
            include: { translations: true },
        });
    }

    async updateVisibility(id: string, isVisible: boolean) {
        await this.findOne(id); // 404 if it doesn't exist
        return this.prismaService.education.update({
            where: { id },
            data: { isVisible },
            include: { translations: true },
        });
    }

    async remove(id: string) {
        const education = await this.findOne(id);
        return this.prismaService.education.delete({
            where: { id: education.id },
        });
    }
}
