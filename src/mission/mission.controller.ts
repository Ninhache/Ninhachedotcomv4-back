import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    Param,
    Patch,
    Post,
    Query,
    Res,
} from '@nestjs/common';
import { AliasService } from 'src/alias/alias.service';
import { Public } from 'src/auth/public.decorator';
import { RevalidateContent } from 'src/revalidation/revalidate.decorator';
import { CreateMissionDto } from './dto/create-mission.dto';
import { FindAllMissionsQueryDto } from './dto/find-all.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';
import { UpdateVisibilityDto } from './dto/update-visibility.dto';
import { MissionService } from './mission.service';
import type { Response } from 'express';

@RevalidateContent(['missions', 'timeline'])
@Controller('missions')
export class MissionController {
    constructor(
        private readonly missionService: MissionService,
        private readonly alias: AliasService
    ) {}

    @Post()
    async create(
        @Body() dto: CreateMissionDto,
        @Res({ passthrough: true }) res: Response
    ) {
        const created = await this.missionService.create(dto);
        res.setHeader('Location', `/missions/${created.id}`);
        return created;
    }

    @Public()
    @Get()
    async findAll(@Query() query: FindAllMissionsQueryDto) {
        const missions = await this.missionService.findAll(
            query.employerCompanyId,
            query.clientCompanyId
        );
        return query.raw
            ? missions
            : this.alias.resolveObject(missions, query.locale ?? 'fr');
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return await this.missionService.findOne(id);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateMissionDto) {
        return await this.missionService.update(id, dto);
    }

    @Patch(':id/visibility')
    async updateVisibility(
        @Param('id') id: string,
        @Body() dto: UpdateVisibilityDto
    ) {
        return await this.missionService.updateVisibility(id, dto.isVisible);
    }

    @Delete(':id')
    @HttpCode(204)
    async remove(@Param('id') id: string): Promise<void> {
        // 204 No Content — must not return a body.
        await this.missionService.remove(id);
    }
}
