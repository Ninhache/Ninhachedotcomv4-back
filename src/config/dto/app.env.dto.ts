import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class AppEnvDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  JWT_SECRET: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  ADMIN_PWD: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  TRUSTED_ORIGINS: string;

  @IsNumber({
    allowInfinity: false,
    allowNaN: false,
    maxDecimalPlaces: 0,
  })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  @Type(() => Number)
  APP_PORT: number;
}
