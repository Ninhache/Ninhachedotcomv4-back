import { ApiPropertyOptional } from '@nestjs/swagger';
import { Locale } from '@prisma/client';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsEnum,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';

export class UpdateProfileTranslationDto {
    @ApiPropertyOptional({ enum: ['fr', 'en'] })
    @IsEnum(Locale)
    locale: Locale;

    @IsOptional()
    @IsString()
    greeting?: string;

    @IsOptional()
    @IsString()
    profession?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    skillsTitle?: string;

    // The public "Who am I?" paragraph. May contain a literal <projects>…</projects>
    // marker and @@ alias tokens — stored verbatim, resolved/escaped by the reader.
    @IsOptional()
    @IsString()
    introduction?: string;
}

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    name?: string;

    // Portrait URL (locale-independent), typically a /uploads/... path returned
    // by POST /media.
    @IsOptional()
    @IsString()
    imageUrl?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateProfileTranslationDto)
    translations?: UpdateProfileTranslationDto[];
}
