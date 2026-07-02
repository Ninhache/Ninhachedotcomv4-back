import { Locale } from '@prisma/client';
import { Type } from 'class-transformer';
import {
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Matches,
    ValidateNested,
} from 'class-validator';

// Per-locale category name. Non-empty so a translation row is only ever
// created with real copy (mirrors CreateCompanyTranslationDto).
export class CreateArticleCategoryTranslationDto {
    @IsEnum(Locale)
    locale: Locale;

    @IsString()
    @IsNotEmpty()
    name: string;
}

export class CreateArticleCategoryDto {
    // Drives the public /blog?cat=<slug> filter; kebab-case only.
    @IsString()
    @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
        message: 'slug must be kebab-case (lowercase letters, digits, hyphens)',
    })
    slug: string;

    @IsBoolean()
    isVisible: boolean;

    @IsOptional()
    @IsInt()
    order?: number;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CreateArticleCategoryTranslationDto)
    translations: CreateArticleCategoryTranslationDto[];
}
