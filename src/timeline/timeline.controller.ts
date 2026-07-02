import { Controller, Get, Query } from '@nestjs/common';
import { AliasService } from 'src/alias/alias.service';
import { isRaw } from 'src/alias/raw';
import { Public } from 'src/auth/public.decorator';
import { TimelineService } from './timeline.service';

// Single aggregated read for the public timeline section. No @RevalidateContent
// here — the Company/Mission/Education controllers each emit the shared
// 'timeline' tag on mutation, which is what this endpoint is cached under.
@Controller('timeline')
export class TimelineController {
    constructor(
        private readonly timelineService: TimelineService,
        private readonly alias: AliasService
    ) {}

    @Public()
    @Get()
    async getTimeline(
        @Query('locale') locale = 'fr',
        @Query('raw') raw?: string
    ) {
        const data = await this.timelineService.getTimeline();
        return isRaw(raw) ? data : this.alias.resolveObject(data, locale);
    }
}
