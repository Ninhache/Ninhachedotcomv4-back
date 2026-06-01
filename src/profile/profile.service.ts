import { Injectable } from '@nestjs/common';
import { Locale } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

// Neutral placeholder used only to guarantee a Profile row exists when the
// public endpoint is hit before anything has been seeded/edited. Real initial
// content lives in prisma/seed.ts (and is set by the admin via PATCH /profile),
// so no stale personal data is baked into service logic.
const EMPTY_PROFILE = {
    name: '',
    translations: [
        {
            locale: Locale.fr,
            greeting: '',
            profession: '',
            description: '',
            skillsTitle: '',
        },
        {
            locale: Locale.en,
            greeting: '',
            profession: '',
            description: '',
            skillsTitle: '',
        },
    ],
};

@Injectable()
export class ProfileService {
    constructor(private readonly prisma: PrismaService) {}

    private toDTO(profile: any): ProfileResponseDto {
        return {
            id: profile.id,
            name: profile.name,
            updatedAt: profile.updatedAt.toISOString(),
            translations: profile.translations.map((t: any) => ({
                locale: t.locale,
                greeting: t.greeting,
                profession: t.profession,
                description: t.description,
                skillsTitle: t.skillsTitle,
            })),
        };
    }

    async get(): Promise<ProfileResponseDto> {
        let profile = await this.prisma.profile.findFirst({
            include: { translations: true },
        });

        if (!profile) {
            profile = await this.prisma.profile.create({
                data: {
                    name: EMPTY_PROFILE.name,
                    translations: { create: EMPTY_PROFILE.translations },
                },
                include: { translations: true },
            });
        }

        return this.toDTO(profile);
    }

    async update(dto: UpdateProfileDto): Promise<ProfileResponseDto> {
        let profile = await this.prisma.profile.findFirst({ select: { id: true } });

        if (!profile) {
            await this.get(); // seed defaults
            profile = await this.prisma.profile.findFirst({ select: { id: true } });
        }

        const updated = await this.prisma.profile.update({
            where: { id: profile!.id },
            data: {
                name: dto.name,
                translations: dto.translations
                    ? {
                          deleteMany: {},
                          create: dto.translations.map(t => ({
                              locale: t.locale,
                              greeting: t.greeting ?? '',
                              profession: t.profession ?? '',
                              description: t.description ?? '',
                              skillsTitle: t.skillsTitle ?? '',
                          })),
                      }
                    : undefined,
            },
            include: { translations: true },
        });

        return this.toDTO(updated);
    }
}
