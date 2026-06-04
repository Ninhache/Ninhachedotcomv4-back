import { IsBoolean } from 'class-validator';

/**
 * Body for the visibility-toggle endpoint. Kept separate from the full
 * update DTO so the admin UI can flip visibility without resending the
 * entire experience payload.
 */
export class UpdateVisibilityDto {
    @IsBoolean()
    isVisible: boolean;
}
