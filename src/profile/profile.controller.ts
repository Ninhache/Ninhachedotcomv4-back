import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/auth/public.decorator';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

@ApiTags('Profile')
@Controller('profile')
export class ProfileController {
    constructor(private readonly profileService: ProfileService) {}

    @Public()
    @Get()
    @ApiOperation({ summary: 'Get portfolio profile' })
    @ApiOkResponse({ type: ProfileResponseDto })
    get() {
        return this.profileService.get();
    }

    @Patch()
    @ApiOperation({ summary: 'Update portfolio profile' })
    @ApiOkResponse({ type: ProfileResponseDto })
    update(@Body() dto: UpdateProfileDto) {
        return this.profileService.update(dto);
    }
}
