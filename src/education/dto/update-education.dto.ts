import { PartialType } from '@nestjs/mapped-types';
import { CreateEducationDto } from './create-education.dto';

// Partial so PATCH can send only the fields being changed; the service guards
// translations against undefined.
export class UpdateEducationDto extends PartialType(CreateEducationDto) {}
