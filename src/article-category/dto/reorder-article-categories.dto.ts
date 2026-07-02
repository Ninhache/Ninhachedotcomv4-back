import { Type } from 'class-transformer';
import {
    ArrayMinSize,
    IsArray,
    IsInt,
    IsString,
    Min,
    ValidateNested,
} from 'class-validator';

export class ReorderArticleCategoryItemDto {
    @IsString()
    id: string;

    @IsInt()
    @Min(0)
    order: number;
}

export class ReorderArticleCategoriesDto {
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => ReorderArticleCategoryItemDto)
    items: ReorderArticleCategoryItemDto[];
}
