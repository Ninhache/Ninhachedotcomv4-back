import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class FindAllPositionsQueryDto {
    @IsOptional()
    @IsString()
    companyId?: string;

    @IsOptional()
    @IsString()
    locale?: string; // 'fr' | 'en' — for alias resolution

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === '1')
    @IsBoolean()
    raw?: boolean;
}
