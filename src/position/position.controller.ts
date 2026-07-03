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
import { CreatePositionDto } from './dto/create-position.dto';
import { FindAllPositionsQueryDto } from './dto/find-all.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { UpdateVisibilityDto } from './dto/update-visibility.dto';
import { PositionService } from './position.service';
import type { Response } from 'express';

@RevalidateContent(['positions', 'timeline'])
@Controller('positions')
export class PositionController {
    constructor(
        private readonly positionService: PositionService,
        private readonly alias: AliasService
    ) {}

    @Post()
    async create(
        @Body() dto: CreatePositionDto,
        @Res({ passthrough: true }) res: Response
    ) {
        const created = await this.positionService.create(dto);
        res.setHeader('Location', `/positions/${created.id}`);
        return created;
    }

    @Public()
    @Get()
    async findAll(@Query() query: FindAllPositionsQueryDto) {
        const positions = await this.positionService.findAll(query.companyId);
        return query.raw
            ? positions
            : this.alias.resolveObject(positions, query.locale ?? 'fr');
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return await this.positionService.findOne(id);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: UpdatePositionDto) {
        return await this.positionService.update(id, dto);
    }

    @Patch(':id/visibility')
    async updateVisibility(
        @Param('id') id: string,
        @Body() dto: UpdateVisibilityDto
    ) {
        return await this.positionService.updateVisibility(id, dto.isVisible);
    }

    @Delete(':id')
    @HttpCode(204)
    async remove(@Param('id') id: string): Promise<void> {
        // 204 No Content — must not return a body.
        await this.positionService.remove(id);
    }
}
