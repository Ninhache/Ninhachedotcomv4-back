import { registerAs } from '@nestjs/config';

export default registerAs('doc', () => ({
    name: `Back APIs Specification`,
    description: 'Section for describe whole APIs',
    version: '1.0',
    prefix: '/docs',
}));
