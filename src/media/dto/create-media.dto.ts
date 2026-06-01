import { ApiPropertyOptional } from '@nestjs/swagger';
import { MediaType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateMediaDto {
    @ApiPropertyOptional({
        enum: MediaType,
        description: 'Media type (auto-detected from file if not provided)',
    })
    @IsOptional()
    @IsEnum(MediaType)
    type?: MediaType;

    @ApiPropertyOptional({
        description: 'Project ID to associate the media with',
    })
    @IsOptional()
    @IsString()
    projectId?: string;
}
