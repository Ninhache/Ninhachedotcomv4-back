import { Locale } from '@prisma/client';
import { Type } from 'class-transformer';
import {
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUrl,
    ValidateNested,
} from 'class-validator';

export class CreateSkillTranslationDto {
    @IsEnum(Locale)
    locale: Locale;

    @IsString()
    @IsNotEmpty()
    name: string;
}

export class CreateSkillDto {
    // Optional now: skills migrated from the former TECH tag pool have no SVG
    // yet; the author fills them in later from the admin.
    // @IsString (not @IsUrl): accepts uploaded `/uploads/…` paths and static
    // `public/` refs (e.g. `svg/skills/C.svg`), not just absolute URLs.
    @IsOptional()
    @IsString()
    image?: string;

    @IsOptional()
    @IsUrl({ require_tld: false })
    wikiUrl?: string;

    @IsBoolean()
    isVisible: boolean;

    @IsArray()
    @IsString({ each: true })
    categoryIds: string[];

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CreateSkillTranslationDto)
    translations: CreateSkillTranslationDto[];
}
