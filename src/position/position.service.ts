import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CompanyKind } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';

@Injectable()
export class PositionService {
    constructor(private prismaService: PrismaService) {}

    // A position belongs to an EMPLOYER company only. Throws if the target is a
    // CLIENT (or doesn't exist) — mirrors CompanyService's parent-employer guard.
    private async assertEmployer(companyId: string) {
        const company = await this.prismaService.company.findUnique({
            where: { id: companyId },
        });
        if (!company || company.kind !== CompanyKind.EMPLOYER) {
            throw new BadRequestException(
                `Company [${companyId}] is not an existing EMPLOYER`
            );
        }
    }

    async create(dto: CreatePositionDto) {
        const { companyId, startDate, endDate, isVisible, order, translations } =
            dto;
        await this.assertEmployer(companyId);

        return this.prismaService.position.create({
            data: {
                company: { connect: { id: companyId } },
                startDate,
                endDate: endDate ?? null,
                isVisible,
                order: order ?? 0,
                translations: {
                    create: translations.map(t => ({
                        locale: t.locale,
                        title: t.title,
                    })),
                },
            },
            include: { translations: true },
        });
    }

    findAll(companyId?: string) {
        return this.prismaService.position.findMany({
            where: { ...(companyId ? { companyId } : {}) },
            include: { translations: true },
            orderBy: [{ startDate: 'asc' }, { order: 'asc' }],
        });
    }

    async findOne(id: string) {
        const position = await this.prismaService.position.findUnique({
            where: { id },
            include: { translations: true },
        });
        if (!position) {
            throw new NotFoundException(`Position with id [${id}] not found`);
        }
        return position;
    }

    async update(id: string, dto: UpdatePositionDto) {
        const { companyId, startDate, endDate, isVisible, order, translations } =
            dto;
        if (companyId !== undefined) {
            await this.assertEmployer(companyId);
        }

        return this.prismaService.position.update({
            where: { id },
            data: {
                company:
                    companyId !== undefined
                        ? { connect: { id: companyId } }
                        : undefined,
                startDate,
                endDate,
                isVisible,
                order,
                translations:
                    translations !== undefined
                        ? {
                              deleteMany: {},
                              create: translations.map(t => ({
                                  locale: t.locale,
                                  title: t.title,
                              })),
                          }
                        : undefined,
            },
            include: { translations: true },
        });
    }

    async updateVisibility(id: string, isVisible: boolean) {
        await this.findOne(id); // 404 if it doesn't exist
        return this.prismaService.position.update({
            where: { id },
            data: { isVisible },
            include: { translations: true },
        });
    }

    async remove(id: string) {
        const position = await this.findOne(id);
        return this.prismaService.position.delete({
            where: { id: position.id },
        });
    }
}
