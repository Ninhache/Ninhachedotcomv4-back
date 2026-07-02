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
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { FindAllArticlesQueryDto } from './dto/find-all.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import type { Response } from 'express';

@RevalidateContent('articles')
@Controller('articles')
export class ArticleController {
    constructor(
        private readonly articleService: ArticleService,
        private readonly alias: AliasService
    ) {}

    @Public()
    @Get()
    async findAll(@Query() query: FindAllArticlesQueryDto) {
        const articles = await this.articleService.findAllPublic(
            query.category,
            query.tag
        );
        return query.raw
            ? articles
            : this.alias.resolveObject(articles, query.locale ?? 'fr');
    }

    // Admin-only: unfiltered list (incl. drafts), returned raw so the editor
    // never freezes a resolved alias value back into the body/excerpt.
    // Declared before ':slug' so 'admin' isn't matched as a slug.
    @Get('admin')
    findAllAdmin() {
        return this.articleService.findAllAdmin();
    }

    @Public()
    @Get(':slug')
    async findOne(
        @Param('slug') slug: string,
        @Query() query: FindAllArticlesQueryDto
    ) {
        const article = await this.articleService.findOneBySlug(slug);
        return query.raw
            ? article
            : this.alias.resolveObject(article, query.locale ?? 'fr');
    }

    @Post()
    async create(
        @Body() dto: CreateArticleDto,
        @Res({ passthrough: true }) res: Response
    ) {
        const created = await this.articleService.create(dto);
        res.setHeader('Location', `/articles/${created.id}`);
        return created;
    }

    // No dedicated visibility route: the admin PATCHes {isVisible} here.
    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateArticleDto) {
        return this.articleService.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(204)
    async remove(@Param('id') id: string): Promise<void> {
        // 204 No Content — must not return a body.
        await this.articleService.remove(id);
    }
}
