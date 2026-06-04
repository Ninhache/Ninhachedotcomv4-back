import { Locale } from '@prisma/client';
import { Type } from 'class-transformer';
import {
    ArrayMinSize,
    IsArray,
    IsIn,
    IsNotEmpty,
    IsString,
    Matches,
    ValidateNested,
} from 'class-validator';

export class AliasBodyDto {
    @IsString()
    @IsIn(Object.values(Locale))
    locale: string;

    @IsString()
    @IsNotEmpty()
    code: string;
}

export class CreateAliasDto {
    // Same grammar as a marker key: letter then word chars. Reserved JS words
    // are rejected in the service (a body referencing `$.<key>` must be valid).
    @IsString()
    @Matches(/^[a-zA-Z][a-zA-Z0-9_]*$/, {
        message: 'key must be a slug: a letter followed by letters/digits/_',
    })
    key: string;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => AliasBodyDto)
    bodies: AliasBodyDto[];
}
