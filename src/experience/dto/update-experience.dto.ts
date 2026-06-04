import { PartialType } from '@nestjs/mapped-types';
import { CreateExperienceDto } from './create-experience.dto';

// Partial so PATCH can send only the fields being changed; the service guards
// relation fields (tags/translations) against undefined.
export class UpdateExperienceDto extends PartialType(CreateExperienceDto) {}
