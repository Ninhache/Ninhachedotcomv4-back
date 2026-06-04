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
    @IsUrl({ require_tld: false }) 
    @IsNotEmpty()
    image: string;

    @IsOptional()
    @IsUrl({ require_tld: false }) 
    wikiUrl?: string;

    @IsBoolean()
    isVisible: boolean;

    @IsArray()
    @IsString({ each: true })
    tagIds: string[];

    @IsArray()
    @IsString({ each: true })
    categoryIds: string[];

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CreateSkillTranslationDto)
    translations: CreateSkillTranslationDto[];
}
