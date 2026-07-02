import { PartialType } from '@nestjs/mapped-types';
import { CreateArticleCategoryDto } from './create-article-category.dto';

// Partial so PATCH can send only the fields being changed.
export class UpdateArticleCategoryDto extends PartialType(
    CreateArticleCategoryDto
) {}
