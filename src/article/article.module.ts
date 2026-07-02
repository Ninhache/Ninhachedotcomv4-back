import { Module } from '@nestjs/common';
import { AliasModule } from 'src/alias/alias.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';

@Module({
    imports: [PrismaModule, AliasModule],
    controllers: [ArticleController],
    providers: [ArticleService],
    exports: [ArticleService],
})
export class ArticleModule {}
