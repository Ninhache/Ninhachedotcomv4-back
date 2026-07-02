import { PartialType } from '@nestjs/mapped-types';
import { CreateArticleDto } from './create-article.dto';

// Partial so PATCH can send only the fields being changed.
export class UpdateArticleDto extends PartialType(CreateArticleDto) {}
