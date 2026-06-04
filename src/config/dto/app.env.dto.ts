import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
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

  // Base URL of the Next.js front-end the back-end revalidates against.
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  FRONT_URL: string;

  // Shared secret sent in the x-revalidate-secret header (must match the front).
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  REVALIDATE_SECRET: string;

  // Per-execution sandbox timeout (ms). Optional; defaults to 50 in config.
  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  ALIAS_EVAL_TIMEOUT_MS?: number;

  // Composition / anti-cycle depth guard. Optional; defaults to 20 in config.
  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  ALIAS_EVAL_MAX_DEPTH?: number;
}
