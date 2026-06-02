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
import { isRaw } from 'src/alias/raw';
import { Public } from 'src/auth/public.decorator';
import { RevalidateContent } from 'src/revalidation/revalidate.decorator';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import { UpdateVisibilityDto } from './dto/update-visibility.dto';
import { ExperienceService } from './experience.service';
import type { Response } from 'express';

@RevalidateContent('experiences')
@Controller('experiences')
export class ExperienceController {
    constructor(
        private readonly experienceService: ExperienceService,
        private readonly alias: AliasService
    ) {}

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
    async findAll(@Query('locale') locale = 'fr', @Query('raw') raw?: string) {
        const experiences = await this.experienceService.findAll();
        return isRaw(raw)
            ? experiences
            : this.alias.resolveObject(experiences, locale);
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
    async remove(@Param('id') id: string): Promise<void> {
        // 204 No Content — must not return a body.
        await this.experienceService.remove(id);
    }
}
