import { INestApplication, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { ENVIRONMENT_TYPE } from './constant/environment';

export default async function swaggerInit(app: INestApplication) {
    const configService = app.get(ConfigService);
    const env = configService.get<ENVIRONMENT_TYPE>('app.env');
    const logger = new Logger('NestJs-Swagger');

    if (env === 'production') return;

    const docName = configService.get<string>('doc.name') ?? 'API';
    const docDesc = configService.get<string>('doc.description') ?? '';
    const docVersion = configService.get<string>('doc.version') ?? '0.0.0';

    const rawPrefix = configService.get<string>('doc.prefix');
    const docPrefix =
        rawPrefix && rawPrefix.trim()
            ? rawPrefix.trim().replace(/\/+$/, '')
            : 'docs';

    const swaggerConfig = new DocumentBuilder()
        .setTitle(docName)
        .setDescription(docDesc)
        .setVersion(docVersion)
        .addCookieAuth('session_id')
        .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig, {
        deepScanRoutes: true,
    });

    try {
        writeFileSync('swagger.json', JSON.stringify(document, null, 2));
    } catch (e) {
        logger.warn(`Could not write swagger.json: ${String(e)}`);
    }

    SwaggerModule.setup(docPrefix, app, document, {
        jsonDocumentUrl: 'json',
        yamlDocumentUrl: 'yaml',
        explorer: true,
    });

    logger.log(`Swagger UI: http://localhost:<port>/${docPrefix}`);
    logger.log(`OpenAPI JSON: http://localhost:<port>/${docPrefix}/json`);
}
