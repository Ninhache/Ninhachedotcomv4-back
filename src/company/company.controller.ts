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
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { FindAllCompaniesQueryDto } from './dto/find-all.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UpdateVisibilityDto } from './dto/update-visibility.dto';
import type { Response } from 'express';

// Companies surface on the timeline; bust both the resource tag and the
// aggregated 'timeline' tag on every mutation.
@RevalidateContent(['companies', 'timeline'])
@Controller('companies')
export class CompanyController {
    constructor(
        private readonly companyService: CompanyService,
        private readonly alias: AliasService
    ) {}

    @Post()
    async create(
        @Body() dto: CreateCompanyDto,
        @Res({ passthrough: true }) res: Response
    ) {
        const created = await this.companyService.create(dto);
        res.setHeader('Location', `/companies/${created.id}`);
        return created;
    }

    @Public()
    @Get()
    async findAll(@Query() query: FindAllCompaniesQueryDto) {
        const companies = await this.companyService.findAll(
            query.kind,
            query.parentEmployerId
        );
        return query.raw
            ? companies
            : this.alias.resolveObject(companies, query.locale ?? 'fr');
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return await this.companyService.findOne(id);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
        return await this.companyService.update(id, dto);
    }

    @Patch(':id/visibility')
    async updateVisibility(
        @Param('id') id: string,
        @Body() dto: UpdateVisibilityDto
    ) {
        return await this.companyService.updateVisibility(id, dto.isVisible);
    }

    @Delete(':id')
    @HttpCode(204)
    async remove(@Param('id') id: string): Promise<void> {
        // 204 No Content — must not return a body.
        await this.companyService.remove(id);
    }
}
