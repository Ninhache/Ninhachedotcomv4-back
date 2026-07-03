import { Module } from '@nestjs/common';
import { AliasModule } from 'src/alias/alias.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ArticleCategoryController } from './article-category.controller';
import { ArticleCategoryService } from './article-category.service';

@Module({
    imports: [PrismaModule, AliasModule],
    controllers: [ArticleCategoryController],
    providers: [ArticleCategoryService],
    // Exported for parity with CompanyModule/SkillModule in case another
    // module needs to validate/resolve category ids later.
    exports: [ArticleCategoryService],
})
export class ArticleCategoryModule {}
