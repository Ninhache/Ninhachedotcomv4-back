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

export class CreatePositionTranslationDto {
    @IsEnum(Locale)
    locale: Locale;

    @IsString()
    @IsNotEmpty()
    title: string;
}

export class CreatePositionDto {
    @IsString()
    @IsNotEmpty()
    companyId: string;

    @IsDateString()
    startDate: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsBoolean()
    isVisible: boolean;

    @IsOptional()
    @IsInt()
    order?: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreatePositionTranslationDto)
    translations: CreatePositionTranslationDto[];
}
