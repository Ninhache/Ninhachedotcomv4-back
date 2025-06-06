import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AppEnvDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  JWT_SECRET: string;
}
