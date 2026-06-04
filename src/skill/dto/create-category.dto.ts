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
    ValidateNested,
} from 'class-validator';

export class CategoryTranslationDto {
    @IsEnum(Locale)
    locale: Locale;

    @IsString()
    @IsNotEmpty()
    name: string;
}

export class CreateCategoryDto {
    @IsBoolean()
    isVisible: boolean;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CategoryTranslationDto)
    translations: CategoryTranslationDto[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    skillIds?: string[];
}

export class UpdateCategoryDto {
    @IsOptional()
    @IsBoolean()
    isVisible?: boolean;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CategoryTranslationDto)
    translations?: CategoryTranslationDto[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    skillIds?: string[];
}
