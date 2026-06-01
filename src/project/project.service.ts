import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

type ProjectWithRelations = Prisma.ProjectGetPayload<{
    include: {
        media: true;
        techTags: { include: { translations: true } };
        qualTags: { include: { translations: true } };
        translations: true;
    };
}>;

@Injectable()
export class ProjectService {
    constructor(private prismaService: PrismaService) {}

    private toDTO(project: ProjectWithRelations) {
        const { media, techTags, qualTags, ...rest } = project;
        return {
            ...rest,
            medias: media,
            techTagIds: techTags.map(t => t.id),
            qualTagIds: qualTags.map(t => t.id),
            techTags,
            qualTags,
        };
    }

    async create(createProjectDto: CreateProjectDto) {
        const {
            date,
            qualTagIds,
            techTagIds,
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
                date: new Date(date),
                gitUrl: gitUrl ?? null,
                visitUrl: visitUrl ?? null,
                playUrl: playUrl ?? null,
                logoUrl: logoUrl ?? null,
                isVisible,

                qualTags: {
                    connect: (qualTagIds ?? []).map(id => ({ id })),
                },
                techTags: {
                    connect: (techTagIds ?? []).map(id => ({ id })),
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
                qualTags: { include: { translations: true } },
                techTags: { include: { translations: true } },
                translations: true,
            },
        });

        return this.toDTO(project);
    }

    async findAll() {
        const projects = await this.prismaService.project.findMany({
            include: {
                media: true,
                qualTags: { include: { translations: true } },
                techTags: { include: { translations: true } },
                translations: true,
            },
            orderBy: { date: 'desc' },
        });

        return projects.map(p => this.toDTO(p));
    }

    async findOne(id: string) {
        const project = await this.prismaService.project.findUnique({
            where: { id },
            include: {
                media: true,
                qualTags: { include: { translations: true } },
                techTags: { include: { translations: true } },
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
                date: dto.date ? new Date(dto.date) : undefined,
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

                techTags: dto.techTagIds
                    ? { set: dto.techTagIds.map(id => ({ id })) }
                    : undefined,
                qualTags: dto.qualTagIds
                    ? { set: dto.qualTagIds.map(id => ({ id })) }
                    : undefined,

                media:
                    dto.mediaIds !== undefined
                        ? { set: dto.mediaIds.map(id => ({ id })) }
                        : undefined,
            },
            include: {
                media: true,
                qualTags: { include: { translations: true } },
                techTags: { include: { translations: true } },
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
