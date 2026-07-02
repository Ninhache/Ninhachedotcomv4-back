import { IsBoolean } from 'class-validator';

/**
 * Body for the visibility-toggle endpoint. Kept separate from the full update
 * DTO so the admin UI can flip visibility without resending the whole company.
 */
export class UpdateVisibilityDto {
    @IsBoolean()
    isVisible: boolean;
}
