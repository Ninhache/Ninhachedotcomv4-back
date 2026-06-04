import { ApiProperty } from '@nestjs/swagger';
import { Locale } from '@prisma/client';

export class ResumeTranslationDto {
    id: string;

    @ApiProperty({ enum: ['fr', 'en'] })
    locale: Locale;

    url: string;
    resumeId: string;
}

export class ResumeDto {
    id: string;
    updatedAt: Date;
    translations: ResumeTranslationDto[];
}
