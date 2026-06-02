import { MediaType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateMediaDto {
    @IsOptional()
    @IsEnum(MediaType)
    type?: MediaType;

    @IsOptional()
    @IsString()
    projectId?: string;

    // Alt text for the media. An empty string clears it.
    @IsOptional()
    @IsString()
    alt?: string;
}
