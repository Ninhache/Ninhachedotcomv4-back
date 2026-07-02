import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { CompanyKind } from '@prisma/client';

export class FindAllCompaniesQueryDto {
    // Admin pickers filter to one kind (EMPLOYER for the employer select,
    // CLIENT for the optional client select on the mission form).
    @IsOptional()
    @IsEnum(CompanyKind)
    kind?: CompanyKind;

    // Scope CLIENT reads to one employer's clients (hierarchical admin).
    @IsOptional()
    @IsString()
    parentEmployerId?: string;

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
