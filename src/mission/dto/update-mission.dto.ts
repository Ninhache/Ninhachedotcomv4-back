import { PartialType } from '@nestjs/mapped-types';
import { CreateMissionDto } from './create-mission.dto';

// Partial so PATCH can send only the fields being changed; the service guards
// relation fields (skills/translations) against undefined.
export class UpdateMissionDto extends PartialType(CreateMissionDto) {}
