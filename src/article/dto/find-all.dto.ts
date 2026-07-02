import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class FindAllArticlesQueryDto {
    // Filters the public list to one category, by slug (e.g. /blog?cat=wakfuli).
    @IsOptional()
    @IsString()
    category?: string;

    // Filters the public list to one freeform tag.
    @IsOptional()
    @IsString()
    tag?: string;

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
