import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Locale, Prisma, TagType } from '@prisma/client';

export class FindAllTagsQueryDto {
  @IsOptional()
  @IsEnum(TagType)
  type?: TagType;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === '1')
  @IsBoolean()
  visibleOnly?: boolean;

  @IsOptional()
  @IsEnum(Locale)
  locale?: Locale; // 'fr' | 'en'

  @IsOptional()
  @IsString()
  q?: string; // recherche par TagTranslation.name

  // Accepted (and ignored here) so admin/editor reads passing ?raw=true aren't
  // rejected by the global forbidNonWhitelisted ValidationPipe.
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === '1')
  @IsBoolean()
  raw?: boolean;
}
