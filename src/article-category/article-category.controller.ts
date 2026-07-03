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
import { ArticleCategoryService } from './article-category.service';
import { CreateArticleCategoryDto } from './dto/create-article-category.dto';
import { FindAllArticleCategoriesQueryDto } from './dto/find-all.dto';
import { ReorderArticleCategoriesDto } from './dto/reorder-article-categories.dto';
import { UpdateArticleCategoryDto } from './dto/update-article-category.dto';
import type { Response } from 'express';

// A category mutation can change which articles surface under a filter, so
// bust both the resource tag and the 'articles' tag.
@RevalidateContent(['article-categories', 'articles'])
@Controller('article-categories')
export class ArticleCategoryController {
    constructor(
        private readonly articleCategoryService: ArticleCategoryService,
        private readonly alias: AliasService
    ) {}

    @Public()
    @Get()
    async findAll(@Query() query: FindAllArticleCategoriesQueryDto) {
        const categories = await this.articleCategoryService.findAllPublic();
        return query.raw
            ? categories
            : this.alias.resolveObject(categories, query.locale ?? 'fr');
    }

    // Admin-only: unfiltered list (incl. hidden categories), returned raw so
    // the editor never freezes a resolved alias value back into a name.
    @Get('admin')
    findAllAdmin() {
        return this.articleCategoryService.findAllAdmin();
    }

    // Static route — declared before ':id' so 'reorder' isn't matched as an id.
    @Patch('reorder')
    reorder(@Body() dto: ReorderArticleCategoriesDto) {
        return this.articleCategoryService.reorder(dto.items);
    }

    @Post()
    async create(
        @Body() dto: CreateArticleCategoryDto,
        @Res({ passthrough: true }) res: Response
    ) {
        const created = await this.articleCategoryService.create(dto);
        res.setHeader('Location', `/article-categories/${created.id}`);
        return created;
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateArticleCategoryDto) {
        return this.articleCategoryService.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(204)
    async remove(@Param('id') id: string): Promise<void> {
        // 204 No Content — must not return a body.
        await this.articleCategoryService.remove(id);
    }
}
