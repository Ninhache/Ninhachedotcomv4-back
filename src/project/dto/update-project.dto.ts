import { ProjectNature } from '@prisma/client';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsDateString,
    IsEnum,
    IsOptional,
    IsString,
    IsUrl,
    Matches,
    ValidateNested,
} from 'class-validator';
import { CreateProjectTranslationDto } from './create-project.dto';

export class UpdateProjectDto {
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string | null;

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
    @Matches(/^(https?:\/\/.+|\/.+)$/i, {
        message: 'logoUrl must be an absolute URL or a root-relative path',
    })
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
    skillIds?: string[];

    @IsOptional()
    @IsArray()
    @IsEnum(ProjectNature, { each: true })
    natures?: ProjectNature[];

    // Optional cross-links to the blog (« voir les articles » / « lire
    // l'article »). Independent of each other; both nullable in the schema.
    @IsOptional()
    @IsString()
    blogCategoryId?: string;

    @IsOptional()
    @IsString()
    blogArticleId?: string;
}
