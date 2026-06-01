import { ConfigService } from '@nestjs/config';
import { NestFactory, NestApplication } from '@nestjs/core';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import swaggerInit from 'src/swagger';
import { AppModule } from './app.module';
import { AppEnvDto } from './config/dto/app.env.dto';
import { ValidationPipe } from '@nestjs/common';

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
                validationErrors.map(error => error.constraints)
            )}`
        );
    }
}

async function bootstrap() {
    // Validate env BEFORE building the DI container, so a bad/missing
    // JWT_SECRET fails fast instead of letting modules boot with undefined.
    await validateEnvironmentVariables();

    // CORS origins come from TRUSTED_ORIGINS (comma-separated for multi-origin
    // setups, e.g. local + deployed frontend). Falls back to localhost dev.
    const trustedOrigins = (
        process.env.TRUSTED_ORIGINS ?? 'http://localhost:3001'
    )
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean);

    const app = await NestFactory.create<NestApplication>(AppModule, {
        cors: {
            origin: trustedOrigins,
            methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
            preflightContinue: false,
            optionsSuccessStatus: 204,
            credentials: true,
        },
    });

    const configService = app.get(ConfigService);
    const port = configService.get<number>('app.port')!;

    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
        })
    );

    await swaggerInit(app);

    await app.listen(port);
    console.log(`Waiting on port http://localhost:${port}`);
}
bootstrap();
