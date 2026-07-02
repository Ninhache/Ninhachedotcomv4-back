import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsIn,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';
import { CvSelectionDto } from './cv-selection.dto';

export type CvLocaleOption = 'fr' | 'en' | 'both';

export class GenerateCvDto {
    /** 'both' generates the FR and EN PDFs in one call. */
    @IsOptional()
    @IsIn(['fr', 'en', 'both'])
    locale?: CvLocaleOption;

    /** Template key (see src/cv/latex/templates). Defaults to "international". */
    @IsOptional()
    @IsString()
    template?: string;

    /** What to include. When omitted, the persisted CvConfig selection is used. */
    @IsOptional()
    @ValidateNested()
    @Type(() => CvSelectionDto)
    selection?: CvSelectionDto;

    /** Promote the generated PDF(s) to the public Resume (GET /resume). */
    @IsOptional()
    @IsBoolean()
    publish?: boolean;

    /** Persist the supplied template/selection onto the CvConfig singleton. */
    @IsOptional()
    @IsBoolean()
    save?: boolean;
}
