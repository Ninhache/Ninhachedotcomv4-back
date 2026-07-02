import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CompanyKind } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

// Curated employer skills (with their translations) and the company's own
// per-locale blurb are returned on every read so the public timeline card and
// the admin form can render/seed them.
const COMPANY_INCLUDE = {
    skills: { include: { translations: true } },
    translations: true,
} as const;

@Injectable()
export class CompanyService {
    constructor(private prismaService: PrismaService) {}

    // A CLIENT must be scoped to an existing EMPLOYER. Throws if the parent is
    // missing or is itself a client. Returns the id to persist (null when the
    // owning row is an employer — employers never have a parent).
    private async resolveParentEmployerId(
        isEmployer: boolean,
        parentEmployerId?: string | null
    ): Promise<string | null> {
        if (isEmployer) return null;
        if (!parentEmployerId) return null;
        const parent = await this.prismaService.company.findUnique({
            where: { id: parentEmployerId },
        });
        if (!parent || parent.kind !== CompanyKind.EMPLOYER) {
            throw new BadRequestException(
                `parentEmployerId [${parentEmployerId}] must reference an existing EMPLOYER company`
            );
        }
        return parentEmployerId;
    }

    async create(dto: CreateCompanyDto) {
        const isEmployer = dto.kind === CompanyKind.EMPLOYER;
        const parentEmployerId = await this.resolveParentEmployerId(
            isEmployer,
            dto.parentEmployerId
        );
        return this.prismaService.company.create({
            data: {
                kind: dto.kind,
                name: dto.name,
                localisation: dto.localisation,
                siteUrl: dto.siteUrl,
                backgroundUrl: dto.backgroundUrl,
                logoUrl: dto.logoUrl,
                isVisible: dto.isVisible,
                order: dto.order ?? 0,
                // Employer-only fields are nulled for clients.
                contractType: isEmployer ? (dto.contractType ?? null) : null,
                employmentStart: isEmployer ? (dto.employmentStart ?? null) : null,
                employmentEnd: isEmployer ? (dto.employmentEnd ?? null) : null,
                parentEmployerId,
                skills: dto.skillIds?.length
                    ? { connect: dto.skillIds.map(id => ({ id })) }
                    : undefined,
                translations: dto.translations?.length
                    ? {
                          create: dto.translations.map(t => ({
                              locale: t.locale,
                              description: t.description,
                          })),
                      }
                    : undefined,
            },
            include: COMPANY_INCLUDE,
        });
    }

    findAll(kind?: CompanyKind, parentEmployerId?: string) {
        return this.prismaService.company.findMany({
            where: {
                ...(kind ? { kind } : {}),
                ...(parentEmployerId ? { parentEmployerId } : {}),
            },
            orderBy: [{ employmentStart: 'asc' }, { order: 'asc' }],
            include: COMPANY_INCLUDE,
        });
    }

    async findOne(id: string) {
        const company = await this.prismaService.company.findUnique({
            where: { id },
            include: COMPANY_INCLUDE,
        });
        if (!company) {
            throw new NotFoundException(`Company with id [${id}] not found`);
        }
        return company;
    }

    async update(id: string, dto: UpdateCompanyDto) {
        // Resolve effective kind so we can null employer-only fields when a
        // company becomes a CLIENT (or only set them when it's an EMPLOYER).
        const current = await this.findOne(id);
        const kind = dto.kind ?? current.kind;
        const isEmployer = kind === CompanyKind.EMPLOYER;
        // Use the incoming value when provided, otherwise keep the existing link
        // so a partial update doesn't accidentally orphan a client.
        const parentEmployerId = await this.resolveParentEmployerId(
            isEmployer,
            dto.parentEmployerId ?? current.parentEmployerId
        );

        return this.prismaService.company.update({
            where: { id },
            data: {
                kind: dto.kind,
                name: dto.name,
                localisation: dto.localisation,
                siteUrl: dto.siteUrl,
                backgroundUrl: dto.backgroundUrl,
                logoUrl: dto.logoUrl,
                isVisible: dto.isVisible,
                order: dto.order,
                contractType: isEmployer ? dto.contractType : null,
                employmentStart: isEmployer ? dto.employmentStart : null,
                employmentEnd: isEmployer ? dto.employmentEnd : null,
                parentEmployerId,
                // Replace the full skill set when provided; leave untouched on a
                // partial update that omits skillIds.
                skills:
                    dto.skillIds !== undefined
                        ? { set: dto.skillIds.map(id => ({ id })) }
                        : undefined,
                // Replace the full translation set when provided; leave untouched
                // on a partial update that omits translations.
                translations:
                    dto.translations !== undefined
                        ? {
                              deleteMany: {},
                              create: dto.translations.map(t => ({
                                  locale: t.locale,
                                  description: t.description,
                              })),
                          }
                        : undefined,
            },
            include: COMPANY_INCLUDE,
        });
    }

    async updateVisibility(id: string, isVisible: boolean) {
        await this.findOne(id); // 404 if it doesn't exist
        return this.prismaService.company.update({
            where: { id },
            data: { isVisible },
        });
    }

    async remove(id: string) {
        const company = await this.findOne(id);
        return this.prismaService.company.delete({ where: { id: company.id } });
    }
}
