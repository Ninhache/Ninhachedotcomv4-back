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

    /**
     * Private review link. `@Public()` on purpose: the token in the URL *is*
     * the credential, and this is the only route that will serve a draft.
     * Two segments, so it cannot collide with the one-segment `:slug` below.
     */
    @Public()
    @Get('preview/:token')
    async findOneByPreviewToken(
        @Param('token') token: string,
        @Query() query: FindAllArticlesQueryDto
    ) {
        const article = await this.articleService.findOneByPreviewToken(token);
        return query.raw
            ? article
            : this.alias.resolveObject(article, query.locale ?? 'fr');
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
    /**
     * Issues or rotates the review link, returning `{ previewToken }`. This and
     * the DELETE below trip the class-level `@RevalidateContent('articles')`:
     * the extra tag bust is useless but harmless, and not worth an opt-out
     * mechanism for two rare clicks.
     */
    @Post(':id/preview-token')
    issuePreviewToken(@Param('id') id: string) {
        return this.articleService.issuePreviewToken(id);
    }

    /** Revokes the review link; the shared URL 404s from then on. */
    @Delete(':id/preview-token')
    revokePreviewToken(@Param('id') id: string) {
        return this.articleService.revokePreviewToken(id);
    }

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
