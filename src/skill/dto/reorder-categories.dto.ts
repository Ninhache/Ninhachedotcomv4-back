import { Type } from 'class-transformer';
import {
    ArrayMinSize,
    IsArray,
    IsInt,
    IsString,
    Min,
    ValidateNested,
} from 'class-validator';

export class ReorderCategoryItemDto {
    @IsString()
    id: string;

    @IsInt()
    @Min(0)
    order: number;
}

export class ReorderCategoriesDto {
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => ReorderCategoryItemDto)
    items: ReorderCategoryItemDto[];
}
