import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMissionDto } from './dto/create-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';

// Shared read shape: a mission always travels with its translations and skills.
// `imageUrl` is a plain scalar column, so it comes back without an include.
const MISSION_INCLUDE = {
    translations: true,
    skills: { include: { translations: true } },
} satisfies Prisma.MissionInclude;

@Injectable()
export class MissionService {
    constructor(private prismaService: PrismaService) {}

    async create(dto: CreateMissionDto) {
        const {
            employerCompanyId,
            clientCompanyId,
            startDate,
            endDate,
            isVisible,
            order,
            imageUrl,
            skillIds,
            translations,
        } = dto;

        return this.prismaService.mission.create({
            data: {
                employerCompany: { connect: { id: employerCompanyId } },
                clientCompany: clientCompanyId
                    ? { connect: { id: clientCompanyId } }
                    : undefined,
                startDate,
                endDate: endDate ?? null,
                isVisible,
                order: order ?? 0,
                // Empty string means "no image" → store null.
                imageUrl: imageUrl || null,
                skills: { connect: skillIds.map(id => ({ id })) },
                translations: {
                    create: translations.map(t => ({
                        locale: t.locale,
                        title: t.title,
                        context: t.context,
                        tasks: t.tasks,
                    })),
                },
            },
            include: MISSION_INCLUDE,
        });
    }

    findAll(employerCompanyId?: string, clientCompanyId?: string) {
        return this.prismaService.mission.findMany({
            where: {
                ...(employerCompanyId ? { employerCompanyId } : {}),
                ...(clientCompanyId ? { clientCompanyId } : {}),
            },
            include: MISSION_INCLUDE,
            orderBy: [{ startDate: 'asc' }, { order: 'asc' }],
        });
    }

    async findOne(id: string) {
        const mission = await this.prismaService.mission.findUnique({
            where: { id },
            include: MISSION_INCLUDE,
        });
        if (!mission) {
            throw new NotFoundException(`Mission with id [${id}] not found`);
        }
        return mission;
    }

    update(id: string, dto: UpdateMissionDto) {
        const {
            employerCompanyId,
            clientCompanyId,
            startDate,
            endDate,
            isVisible,
            order,
            imageUrl,
            skillIds,
            translations,
        } = dto;

        return this.prismaService.mission.update({
            where: { id },
            data: {
                employerCompany:
                    employerCompanyId !== undefined
                        ? { connect: { id: employerCompanyId } }
                        : undefined,
                // A present-but-empty clientCompanyId disconnects the client;
                // undefined leaves it untouched.
                clientCompany:
                    clientCompanyId !== undefined
                        ? clientCompanyId
                            ? { connect: { id: clientCompanyId } }
                            : { disconnect: true }
                        : undefined,
                startDate,
                endDate,
                isVisible,
                order,
                // Present-but-empty ('') clears the image; undefined leaves it.
                imageUrl:
                    imageUrl !== undefined ? imageUrl || null : undefined,
                // Guard relations so a partial PATCH doesn't wipe them.
                skills:
                    skillIds !== undefined
                        ? { set: skillIds.map(id => ({ id })) }
                        : undefined,
                translations:
                    translations !== undefined
                        ? {
                              deleteMany: {},
                              create: translations.map(t => ({
                                  locale: t.locale,
                                  title: t.title,
                                  context: t.context,
                                  tasks: t.tasks,
                              })),
                          }
                        : undefined,
            },
            include: MISSION_INCLUDE,
        });
    }

    async updateVisibility(id: string, isVisible: boolean) {
        await this.findOne(id); // 404 if it doesn't exist
        return this.prismaService.mission.update({
            where: { id },
            data: { isVisible },
            include: MISSION_INCLUDE,
        });
    }

    async remove(id: string) {
        const mission = await this.findOne(id);
        return this.prismaService.mission.delete({
            where: { id: mission.id },
        });
    }
}
