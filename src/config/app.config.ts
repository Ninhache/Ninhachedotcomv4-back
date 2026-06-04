import { registerAs } from '@nestjs/config';
import { ENVIRONMENT_TYPE } from 'src/constant/environment';

export default registerAs('app', () => ({
    port: parseInt(process.env.APP_PORT ?? '5000', 10),
    cors: process.env.TRUSTED_ORIGINS,
    env: (process.env.NODE_ENV ?? 'develop') as ENVIRONMENT_TYPE,
}));
