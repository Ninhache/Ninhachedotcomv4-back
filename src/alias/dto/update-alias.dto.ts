import { PartialType } from '@nestjs/mapped-types';
import { CreateAliasDto } from './create-alias.dto';

// Both key and bodies optional; when `bodies` is provided it replaces the set.
export class UpdateAliasDto extends PartialType(CreateAliasDto) {}
