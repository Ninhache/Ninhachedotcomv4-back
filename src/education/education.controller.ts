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
import { CreateEducationDto } from './dto/create-education.dto';
import { UpdateEducationDto } from './dto/update-education.dto';
import { UpdateVisibilityDto } from './dto/update-visibility.dto';
import { EducationService } from './education.service';
import type { Response } from 'express';

@RevalidateContent(['education', 'timeline'])
@Controller('education')
export class EducationController {
    constructor(
        private readonly educationService: EducationService,
        private readonly alias: AliasService
    ) {}

    @Post()
    async create(
        @Body() dto: CreateEducationDto,
        @Res({ passthrough: true }) res: Response
    ) {
        const created = await this.educationService.create(dto);
        res.setHeader('Location', `/education/${created.id}`);
        return created;
    }

    @Public()
    @Get()
    async findAll(@Query('locale') locale = 'fr', @Query('raw') raw?: string) {
        const education = await this.educationService.findAll();
        return isRaw(raw)
            ? education
            : this.alias.resolveObject(education, locale);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return await this.educationService.findOne(id);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateEducationDto) {
        return await this.educationService.update(id, dto);
    }

    @Patch(':id/visibility')
    async updateVisibility(
        @Param('id') id: string,
        @Body() dto: UpdateVisibilityDto
    ) {
        return await this.educationService.updateVisibility(id, dto.isVisible);
    }

    @Delete(':id')
    @HttpCode(204)
    async remove(@Param('id') id: string): Promise<void> {
        // 204 No Content — must not return a body.
        await this.educationService.remove(id);
    }
}
