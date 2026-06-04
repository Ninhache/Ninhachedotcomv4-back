import { Locale } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsUrl,
  ValidateNested,
} from 'class-validator';

export class CreateResumeDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResumeTranslationDto)
  translations: ResumeTranslationDto[];
}

export class ResumeTranslationDto {
  @IsEnum(Locale)
  locale: Locale;

  @IsUrl({ require_tld: false }) 
  @IsNotEmpty()
  url: string;
}
