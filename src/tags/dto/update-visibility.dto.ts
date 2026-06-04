import { IsBoolean } from 'class-validator';

/**
 * Body for the tag visibility-toggle endpoint, so the admin UI can flip
 * visibility without resending the full tag payload.
 */
export class UpdateVisibilityDto {
    @IsBoolean()
    isVisible: boolean;
}
