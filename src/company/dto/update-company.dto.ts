import { PartialType } from '@nestjs/mapped-types';
import { CreateCompanyDto } from './create-company.dto';

// Partial so PATCH can send only the fields being changed.
export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {}
