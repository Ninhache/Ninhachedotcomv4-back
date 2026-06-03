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

    @ApiProperty()
    introduction: string;
}

export class ProfileResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty({ nullable: true })
    imageUrl: string | null;

    @ApiProperty()
    updatedAt: string;

    @ApiProperty({ type: [ProfileTranslationResponseDto] })
    translations: ProfileTranslationResponseDto[];
}
