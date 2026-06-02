import { Locale } from '@prisma/client';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsDateString,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUrl,
    ValidateNested,
} from 'class-validator';

export class CreateProjectDto {
    @IsDateString()
    startDate: string;

    @IsOptional()
    @IsDateString()
    endDate?: string | null;

    @IsOptional()
    @IsUrl({ require_tld: false })
    gitUrl?: string;

    @IsOptional()
    @IsUrl({ require_tld: false })
    visitUrl?: string;

    @IsOptional()
    @IsUrl({ require_tld: false })
    playUrl?: string;

    @IsOptional()
    @IsString()
    logoUrl?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    mediaIds?: string[];

    @IsArray()
    @IsString({ each: true })
    techTagIds: string[];

    @IsArray()
    @IsString({ each: true })
    qualTagIds: string[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateProjectTranslationDto)
    translations: CreateProjectTranslationDto[];

    @IsBoolean()
    isVisible: boolean;
}

export class CreateProjectTranslationDto {
    @IsEnum(Locale)
    locale: Locale;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsOptional()
    @IsString()
    type?: string;
}
