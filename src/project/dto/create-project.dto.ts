import {
  IsString,
  IsOptional,
  IsArray,
  IsDateString,
  IsUrl,
} from 'class-validator';

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsDateString()
  date: string; // ISO string, ex: "2024-06-05T12:00:00Z"

  @IsOptional()
  @IsUrl()
  gitUrl?: string;

  @IsOptional()
  @IsUrl()
  visitUrl?: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  mediaUrls?: string[]; // Les URL vers des images ou vidéos

  @IsArray()
  @IsString({ each: true })
  techTagIds: string[];

  @IsArray()
  @IsString({ each: true })
  qualTagIds: string[];
}
