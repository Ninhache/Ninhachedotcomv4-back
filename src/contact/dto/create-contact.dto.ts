import { ApiProperty } from '@nestjs/swagger';
import { Locale } from '@prisma/client';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUrl,
    ValidateNested,
} from 'class-validator';

export class CreateContactTranslationDto {
    @ApiProperty({ enum: ['fr', 'en'] })
    @IsEnum(Locale)
    locale: Locale;

    @IsString()
    @IsNotEmpty()
    name: string;
}

export class CreateContactDto {
    @IsUrl({ require_tld: false })
    contactUrl: string;

    // @IsString (not @IsUrl): accepts uploaded `/uploads/…` paths and static
    // `public/` refs, not just absolute URLs.
    @IsString()
    imageUrl: string;

    @IsBoolean()
    isVisible: boolean;

    @IsOptional()
    @IsString()
    cssSize?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateContactTranslationDto)
    translations: CreateContactTranslationDto[];
}
