import { CompanyKind, ContractType, Locale } from '@prisma/client';
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

// Per-locale editorial blurb. `description` non-empty so a translation row is
// only ever created with real copy (the front omits blank locales entirely).
export class CreateCompanyTranslationDto {
    @IsEnum(Locale)
    locale: Locale;

    @IsString()
    @IsNotEmpty()
    description: string;
}

export class CreateCompanyDto {
    @IsEnum(CompanyKind)
    kind: CompanyKind;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsOptional()
    @IsString()
    localisation?: string;

    @IsOptional()
    @IsString()
    siteUrl?: string;

    // Large illustration image (« fond ») shown on the public experience card.
    @IsOptional()
    @IsString()
    backgroundUrl?: string;

    // The company's actual logo — used by the standalone timeline app.
    @IsOptional()
    @IsString()
    logoUrl?: string;

    @IsBoolean()
    isVisible: boolean;

    @IsOptional()
    @IsInt()
    order?: number;

    // Employer-only fields. Cleared by the service when kind = CLIENT so a
    // company switched from employer to client doesn't keep stale contract data.
    @IsOptional()
    @IsEnum(ContractType)
    contractType?: ContractType;

    @IsOptional()
    @IsDateString()
    employmentStart?: string;

    @IsOptional()
    @IsDateString()
    employmentEnd?: string;

    // CLIENT-only: the employer this client was engaged through. Cleared by the
    // service when kind = EMPLOYER; required-shape validated (must point at an
    // EMPLOYER) in the service.
    @IsOptional()
    @IsString()
    parentEmployerId?: string;

    // EMPLOYER-level curated skills (ids from the skill pool) for the public
    // card. Optional: clients and skill-less companies simply send nothing.
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    skillIds?: string[];

    // Translatable blurb (fr/en). Optional and replace-on-update in the service:
    // sending the array overwrites the set, omitting it leaves it untouched.
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateCompanyTranslationDto)
    translations?: CreateCompanyTranslationDto[];
}
