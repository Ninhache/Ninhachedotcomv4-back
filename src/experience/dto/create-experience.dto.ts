import { ContractType, Locale } from '@prisma/client'; // idem
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

export class CreateExperienceDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsEnum(ContractType)
  contractType: ContractType;

  @IsString()
  localisation: string;

  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsBoolean()
  isVisible: boolean;

  @IsOptional()
  @IsString()
  siteUrl?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsArray()
  @IsString({ each: true })
  tagIds: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateExperienceTranslationDto)
  translations: CreateExperienceTranslationDto[];
}

export class CreateExperienceTranslationDto {
  @IsEnum(Locale)
  locale: Locale;

  @IsString()
  @IsNotEmpty()
  jobTitle: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}
