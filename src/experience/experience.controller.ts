import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    Param,
    Patch,
    Post,
    Res,
    UseGuards,
} from '@nestjs/common';
import { Public } from 'src/auth/public.decorator';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import { UpdateVisibilityDto } from './dto/update-visibility.dto';
import { ExperienceService } from './experience.service';
import type { Response } from 'express';

@Controller('experiences')
export class ExperienceController {
    constructor(private readonly experienceService: ExperienceService) {}

    @Post()
    async create(
        @Body() createExperienceDto: CreateExperienceDto,
        @Res({ passthrough: true }) res: Response
    ) {
        const created =
            await this.experienceService.create(createExperienceDto);
        res.setHeader('Location', `/experiences/${created.id}`);

        return created;
    }

    @Public()
    @Get()
    async findAll() {
        return this.experienceService.findAll();
    }

    @Get('/:id')
    async findOne(@Param('id') id: string) {
        return await this.experienceService.findOne(id);
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() updateExperienceDto: UpdateExperienceDto
    ) {
        return await this.experienceService.update(id, updateExperienceDto);
    }

    @Patch(':id/visibility')
    async updateVisibility(
        @Param('id') id: string,
        @Body() dto: UpdateVisibilityDto
    ) {
        return await this.experienceService.updateVisibility(id, dto.isVisible);
    }

    @Delete(':id')
    @HttpCode(204)
    async remove(@Param('id') id: string) {
        return await this.experienceService.remove(id);
    }
}
