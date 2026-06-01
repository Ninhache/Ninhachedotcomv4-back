import { ApiProperty } from '@nestjs/swagger';

export class ProfileTranslationResponseDto {
    @ApiProperty({ enum: ['fr', 'en'] })
    locale: string;

    @ApiProperty()
    greeting: string;

    @ApiProperty()
    profession: string;

    @ApiProperty()
    description: string;

    @ApiProperty()
    skillsTitle: string;
}

export class ProfileResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    updatedAt: string;

    @ApiProperty({ type: [ProfileTranslationResponseDto] })
    translations: ProfileTranslationResponseDto[];
}
