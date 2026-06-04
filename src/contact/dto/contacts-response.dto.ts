import { ApiProperty } from '@nestjs/swagger';
import { Locale } from '@prisma/client';

export class ContactTranslationResponseDto {
    id: string;

    @ApiProperty({ enum: ['fr', 'en'] })
    locale: Locale;

    name: string;
    contactId: string;
}

export class ContactResponseDto {
    id: string;
    contactUrl: string;
    imageUrl: string;
    isVisible: boolean;
    cssSize?: string | null;
    translations: ContactTranslationResponseDto[];

    @ApiProperty({
        type: 'object',
        properties: {
            fr: { type: 'string' },
            en: { type: 'string' },
        },
        example: { fr: 'LinkedIn', en: 'LinkedIn' },
    })
    nameByLocale: Record<string, string>;
}
