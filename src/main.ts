import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AppEnvDto } from './config/dto/app.env.dto';

/**
 * Validates the environment variables against the AppEnvDto schema.
 * Throws an error if any environment variable is invalid.
 */
async function validateEnvironmentVariables() {
  const environmentInstance = plainToInstance(AppEnvDto, process.env);
  const validationErrors = await validate(environmentInstance);
  if (validationErrors.length > 0) {
    throw new Error(
      `Invalid environment variables: ${JSON.stringify(
        validationErrors.map((error) => error.constraints),
      )}`,
    );
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3000;

  await validateEnvironmentVariables();

  console.log(`Waiting on port http://localhost:${port}`);
  await app.listen(port);
}
bootstrap();
