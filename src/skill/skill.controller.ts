import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
} from '@nestjs/common';
import { Public } from 'src/auth/public.decorator';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/create-category.dto';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { SkillService } from './skill.service';

@Controller('skill')
export class SkillController {
    constructor(private readonly skillService: SkillService) {}

    // ---- Categories (static routes first, before :id param) ----

    @Public()
    @Get('categories')
    findAllCategories() {
        return this.skillService.findAllCategories();
    }

    @Get('categories/admin')
    findAllCategoriesAdmin() {
        return this.skillService.findAllCategoriesAdmin();
    }

    @Post('categories')
    createCategory(@Body() dto: CreateCategoryDto) {
        return this.skillService.createCategory(dto);
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
    findAll() {
        return this.skillService.findAll();
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
