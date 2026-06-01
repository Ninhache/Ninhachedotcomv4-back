import { Locale, TagType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsHexColor,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateTagDto {
  @IsBoolean()
  isVisible: boolean;

  @IsHexColor()
  hexColor: string;

  @IsEnum(TagType)
  type: TagType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTagTranslationDto)
  translations: CreateTagTranslationDto[];
}

export class CreateTagTranslationDto {
  @IsEnum(Locale)
  locale: Locale;

  @IsString()
  @IsNotEmpty()
  name: string;
}
