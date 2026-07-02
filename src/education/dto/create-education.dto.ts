import { Locale } from '@prisma/client';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsDateString,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';

export class CreateEducationTranslationDto {
    @IsEnum(Locale)
    locale: Locale;

    @IsString()
    @IsNotEmpty()
    degree: string;

    @IsOptional()
    @IsString()
    description?: string;
}

export class CreateEducationDto {
    @IsString()
    @IsNotEmpty()
    institutionName: string;

    @IsDateString()
    startDate: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @IsString()
    logoUrl?: string;

    @IsOptional()
    @IsString()
    siteUrl?: string;

    @IsBoolean()
    isVisible: boolean;

    @IsOptional()
    @IsInt()
    order?: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateEducationTranslationDto)
    translations: CreateEducationTranslationDto[];
}
