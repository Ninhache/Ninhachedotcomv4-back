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

export class CreateMissionTranslationDto {
    @IsEnum(Locale)
    locale: Locale;

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsOptional()
    @IsString()
    context?: string;

    @IsArray()
    @IsString({ each: true })
    tasks: string[];
}

export class CreateMissionDto {
    @IsString()
    @IsNotEmpty()
    employerCompanyId: string;

    @IsOptional()
    @IsString()
    clientCompanyId?: string;

    @IsDateString()
    startDate: string;

    // Omitted/null = ongoing mission.
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsBoolean()
    isVisible: boolean;

    @IsOptional()
    @IsInt()
    order?: number;

    // Optional illustration: a path/URL string (uploaded `/uploads/...` path,
    // static `public/` ref, or external URL). Empty string on PATCH clears it;
    // omitted leaves it untouched.
    @IsOptional()
    @IsString()
    imageUrl?: string;

    @IsArray()
    @IsString({ each: true })
    skillIds: string[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateMissionTranslationDto)
    translations: CreateMissionTranslationDto[];
}
