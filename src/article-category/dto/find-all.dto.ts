import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class FindAllArticleCategoriesQueryDto {
    @IsOptional()
    @IsString()
    locale?: string; // 'fr' | 'en' — for alias resolution

    // Accepted (and effectively ignored) so admin reads passing ?raw=true aren't
    // rejected by the global forbidNonWhitelisted ValidationPipe.
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === '1')
    @IsBoolean()
    raw?: boolean;
}
