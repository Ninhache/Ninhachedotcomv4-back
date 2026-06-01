import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsDateString,
    IsOptional,
    IsString,
    IsUrl,
    ValidateNested,
} from 'class-validator';
import { CreateProjectTranslationDto } from './create-project.dto';

export class UpdateProjectDto {
    @IsOptional()
    @IsDateString()
    date?: string;

    @IsOptional()
    @IsUrl({ require_tld: false })
    gitUrl?: string;

    @IsOptional()
    @IsUrl({ require_tld: false })
    visitUrl?: string;

    @IsOptional()
    @IsUrl({ require_tld: false })
    playUrl?: string;

    @IsOptional()
    @IsString()
    logoUrl?: string;

    @IsOptional()
    @IsBoolean()
    isVisible?: boolean;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    mediaIds?: string[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateProjectTranslationDto)
    translations?: CreateProjectTranslationDto[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    techTagIds?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    qualTagIds?: string[];
}
