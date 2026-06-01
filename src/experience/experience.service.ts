import {
    Injectable,
    NotFoundException,
    NotImplementedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';

@Injectable()
export class ExperienceService {
    constructor(private prismaService: PrismaService) {}

    async create(createExperienceDto: CreateExperienceDto) {
        const {
            translations,
            companyName,
            startDate,
            endDate,
            contractType,
            isVisible,
            localisation,
            siteUrl,
            imageUrl,
            order,
            tagIds,
        } = createExperienceDto;
        return this.prismaService.experience.create({
            data: {
                contractType,
                isVisible,
                localisation,
                siteUrl,
                imageUrl,
                order: order ?? 0,
                companyName,
                startDate,
                endDate,
                tags: {
                    connect: tagIds.map(id => ({ id })),
                },
                translations: {
                    create: translations.map(translation => ({
                        locale: translation.locale,
                        description: translation.description,
                        jobTitle: translation.jobTitle,
                    })),
                },
            },
            include: {
                translations: true,
                tags: true,
            },
        });
    }

    findAll() {
        return this.prismaService.experience.findMany({
            include: {
                tags: { include: { translations: true } },
                translations: true,
            },
            orderBy: { order: 'asc' },
        });
    }

    async findOne(id: string) {
        const experience = await this.prismaService.experience.findUnique({
            where: { id },
            include: {
                tags: true,
                translations: true,
            },
        });

        if (!experience) {
            throw new NotFoundException(`Experience with id [${id}] not found`);
        }

        return experience;
    }

    update(id: string, updateExperienceDto: UpdateExperienceDto) {
        const {
            companyName,
            startDate,
            endDate,
            contractType,
            isVisible,
            localisation,
            siteUrl,
            imageUrl,
            order,
            translations,
            tagIds,
        } = updateExperienceDto;

        return this.prismaService.experience.update({
            where: {
                id,
            },
            data: {
                companyName,
                startDate,
                endDate,
                contractType,
                isVisible,
                localisation,
                siteUrl,
                imageUrl,
                order,
                // Guard relations so a partial PATCH (e.g. visibility only)
                // doesn't wipe tags/translations by mapping over undefined.
                tags:
                    tagIds !== undefined
                        ? { set: tagIds.map(id => ({ id })) }
                        : undefined,
                translations:
                    translations !== undefined
                        ? {
                              deleteMany: {},
                              create: translations.map(translation => ({
                                  locale: translation.locale,
                                  jobTitle: translation.jobTitle,
                                  description: translation.description,
                              })),
                          }
                        : undefined,
            },
            include: {
                translations: true,
                tags: true,
            },
        });
    }

    /**
     * Toggle/set only the visibility flag, without touching the rest of the
     * experience. Backs `PATCH /experiences/:id/visibility`.
     */
    async updateVisibility(id: string, isVisible: boolean) {
        await this.findOne(id); // 404 if it doesn't exist
        return this.prismaService.experience.update({
            where: { id },
            data: { isVisible },
            include: {
                translations: true,
                tags: true,
            },
        });
    }

    async remove(id: string) {
        const experience = await this.findOne(id);

        return this.prismaService.experience.delete({
            where: {
                id: experience.id,
            },
        });
    }

    async removeAll() {
        return this.prismaService.experience.deleteMany();
    }
}
