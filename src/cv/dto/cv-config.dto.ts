import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { CvSelectionDto } from './cv-selection.dto';

/** Body for PUT /cv/config — persists the generator's template + selection. */
export class UpdateCvConfigDto {
    @IsOptional()
    @IsString()
    template?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => CvSelectionDto)
    selection?: CvSelectionDto;
}
