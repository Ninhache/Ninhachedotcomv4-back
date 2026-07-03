import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { AliasService } from 'src/alias/alias.service';
import { isRaw } from 'src/alias/raw';
import { Public } from 'src/auth/public.decorator';
import { RevalidateContent } from 'src/revalidation/revalidate.decorator';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/create-category.dto';
import { CreateSkillDto } from './dto/create-skill.dto';
import { ReorderCategoriesDto } from './dto/reorder-categories.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { SkillService } from './skill.service';

// A skill mutation now ripples into project cards and experience/timeline cards
// (skills are the unified tech-stack entity), so revalidate those tags too.
@RevalidateContent(['skills', 'projects', 'companies', 'timeline'])
@Controller('skill')
export class SkillController {
    constructor(
        private readonly skillService: SkillService,
        private readonly alias: AliasService
    ) {}

    // ---- Categories (static routes first, before :id param) ----

    @Public()
    @Get('categories')
    async findAllCategories(
        @Query('locale') locale = 'fr',
        @Query('raw') raw?: string
    ) {
        const data = await this.skillService.findAllCategories();
        return isRaw(raw) ? data : this.alias.resolveObject(data, locale);
    }

    @Get('categories/admin')
    async findAllCategoriesAdmin(
        @Query('locale') locale = 'fr',
        @Query('raw') raw?: string
    ) {
        const data = await this.skillService.findAllCategoriesAdmin();
        return isRaw(raw) ? data : this.alias.resolveObject(data, locale);
    }

    @Post('categories')
    createCategory(@Body() dto: CreateCategoryDto) {
        return this.skillService.createCategory(dto);
    }

    // Static route — declared before 'categories/:id' so 'reorder' isn't matched
    // as an :id. Admin-only (guarded by the global JwtAuthGuard, not @Public).
    @Patch('categories/reorder')
    reorderCategories(@Body() dto: ReorderCategoriesDto) {
        return this.skillService.reorderCategories(dto.items);
    }

    @Patch('categories/:id')
    updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
        return this.skillService.updateCategory(id, dto);
    }

    @Delete('categories/:id')
    removeCategory(@Param('id') id: string) {
        return this.skillService.removeCategory(id);
    }

    // ---- Skills ----

    @Post()
    create(@Body() createSkillDto: CreateSkillDto) {
        return this.skillService.create(createSkillDto);
    }

    // Admin-only: the unfiltered list includes hidden skills. The public
    // portfolio reads skills through GET /skill/categories instead.
    @Get()
    async findAll(
        @Query('locale') locale = 'fr',
        @Query('raw') raw?: string
    ) {
        const data = await this.skillService.findAll();
        return isRaw(raw) ? data : this.alias.resolveObject(data, locale);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.skillService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateSkillDto: UpdateSkillDto) {
        return this.skillService.update(id, updateSkillDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.skillService.remove(id);
    }
}
