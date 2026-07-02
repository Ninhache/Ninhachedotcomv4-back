import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

type ProjectWithRelations = Prisma.ProjectGetPayload<{
    include: {
        media: true;
        skills: { include: { translations: true } };
        translations: true;
    };
}>;

@Injectable()
export class ProjectService {
    constructor(private prismaService: PrismaService) {}

    private toDTO(project: ProjectWithRelations) {
        const { media, skills, startDate, endDate, ...rest } = project;
        return {
            ...rest,
            startDate: startDate.toISOString(),
            endDate: endDate ? endDate.toISOString() : null,
            medias: media,
            // Write side accepts ids; read side returns full objects. `natures`
            // is a scalar enum array carried through `...rest`.
            skillIds: skills.map(s => s.id),
            skills,
        };
    }

    async create(createProjectDto: CreateProjectDto) {
        const {
            startDate,
            endDate,
            natures,
            skillIds,
            gitUrl,
            mediaIds,
            visitUrl,
            playUrl,
            logoUrl,
            translations,
            isVisible,
        } = createProjectDto;

        const project = await this.prismaService.project.create({
            data: {
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                gitUrl: gitUrl ?? null,
                visitUrl: visitUrl ?? null,
                playUrl: playUrl ?? null,
                logoUrl: logoUrl ?? null,
                isVisible,

                natures: natures ?? [],
                skills: {
                    connect: (skillIds ?? []).map(id => ({ id })),
                },

                media: mediaIds?.length
                    ? { connect: mediaIds.map(id => ({ id })) }
                    : undefined,

                translations: translations?.length
                    ? {
                          create: translations.map(t => ({
                              locale: t.locale,
                              name: t.name,
                              description: t.description,
                              type: t.type ?? null,
                          })),
                      }
                    : undefined,
            },
            include: {
                media: true,
                skills: { include: { translations: true } },
                translations: true,
            },
        });

        return this.toDTO(project);
    }

    async findAll() {
        const projects = await this.prismaService.project.findMany({
            include: {
                media: true,
                skills: { include: { translations: true } },
                translations: true,
            },
            orderBy: { startDate: 'desc' },
        });

        return projects.map(p => this.toDTO(p));
    }

    async findOne(id: string) {
        const project = await this.prismaService.project.findUnique({
            where: { id },
            include: {
                media: true,
                skills: { include: { translations: true } },
                translations: true,
            },
        });

        if (!project) {
            throw new NotFoundException(`Project with id [${id}] not found`);
        }

        return this.toDTO(project);
    }

    async update(id: string, dto: UpdateProjectDto) {
        const project = await this.prismaService.project.update({
            where: { id },
            data: {
                startDate: dto.startDate ? new Date(dto.startDate) : undefined,
                // `endDate` absent (undefined) → leave unchanged; explicit null
                // → clear (mark ongoing); a date string → set it.
                endDate:
                    dto.endDate === undefined
                        ? undefined
                        : dto.endDate
                          ? new Date(dto.endDate)
                          : null,
                gitUrl: dto.gitUrl,
                visitUrl: dto.visitUrl,
                playUrl: dto.playUrl,
                logoUrl: dto.logoUrl,
                isVisible: dto.isVisible,

                translations: dto.translations
                    ? {
                          deleteMany: {},
                          create: dto.translations.map(t => ({
                              locale: t.locale,
                              name: t.name,
                              description: t.description,
                          })),
                      }
                    : undefined,

                skills: dto.skillIds
                    ? { set: dto.skillIds.map(id => ({ id })) }
                    : undefined,
                natures: dto.natures !== undefined ? dto.natures : undefined,

                media:
                    dto.mediaIds !== undefined
                        ? { set: dto.mediaIds.map(id => ({ id })) }
                        : undefined,
            },
            include: {
                media: true,
                skills: { include: { translations: true } },
                translations: true,
            },
        });

        return this.toDTO(project);
    }

    async deleteById(id: string) {
        return this.prismaService.project.delete({
            where: {
                id: id,
            },
        });
    }
}
