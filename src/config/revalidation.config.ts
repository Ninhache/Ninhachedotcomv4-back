import { registerAs } from '@nestjs/config';

/**
 * Front-end revalidation target. The back-end POSTs tag-invalidation requests
 * to `${frontUrl}/api/revalidate` with the shared `secret` (see B4).
 */
export default registerAs('revalidation', () => ({
    frontUrl: process.env.FRONT_URL,
    secret: process.env.REVALIDATE_SECRET,
}));
