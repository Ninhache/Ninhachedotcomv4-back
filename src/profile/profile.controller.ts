import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AliasService } from 'src/alias/alias.service';
import { isRaw } from 'src/alias/raw';
import { Public } from 'src/auth/public.decorator';
import { RevalidateContent } from 'src/revalidation/revalidate.decorator';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

@ApiTags('Profile')
@RevalidateContent('profile', { greeting: true })
@Controller('profile')
export class ProfileController {
    constructor(
        private readonly profileService: ProfileService,
        private readonly alias: AliasService
    ) {}

    @Public()
    @Get()
    @ApiOperation({ summary: 'Get portfolio profile' })
    @ApiOkResponse({ type: ProfileResponseDto })
    async get(@Query('locale') locale = 'fr', @Query('raw') raw?: string) {
        const profile = await this.profileService.get();
        return isRaw(raw) ? profile : this.alias.resolveObject(profile, locale);
    }

    @Patch()
    @ApiOperation({ summary: 'Update portfolio profile' })
    @ApiOkResponse({ type: ProfileResponseDto })
    update(@Body() dto: UpdateProfileDto) {
        return this.profileService.update(dto);
    }
}
