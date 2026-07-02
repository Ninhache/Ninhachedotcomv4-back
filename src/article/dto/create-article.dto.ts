import { Locale } from '@prisma/client';
import { Type } from 'class-transformer';
import {
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsDateString,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Matches,
    ValidateNested,
} from 'class-validator';

// Per-locale editorial content. All three are required so a translation row
// is only ever created with real copy (mirrors CreateCompanyTranslationDto).
export class CreateArticleTranslationDto {
    @IsEnum(Locale)
    locale: Locale;

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    excerpt: string;

    @IsString()
    @IsNotEmpty()
    body: string;
}

export class CreateArticleDto {
    // Drives the public /blog/<slug> route; kebab-case only.
    @IsString()
    @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
        message: 'slug must be kebab-case (lowercase letters, digits, hyphens)',
    })
    slug: string;

    @IsBoolean()
    isVisible: boolean;

    @IsOptional()
    @IsDateString()
    publishedAt?: string;

    // Plain string (not @IsUrl): accepts uploaded `/uploads/…` paths as well
    // as absolute external URLs (mirrors Mission.imageUrl).
    @IsOptional()
    @IsString()
    coverImageUrl?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @IsOptional()
    @IsInt()
    order?: number;

    @IsArray()
    @IsString({ each: true })
    categoryIds: string[];

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CreateArticleTranslationDto)
    translations: CreateArticleTranslationDto[];
}
