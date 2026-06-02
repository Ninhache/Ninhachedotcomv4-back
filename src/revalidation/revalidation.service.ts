import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

/**
 * Emits cache-tag invalidations to the front-end. Calls
 * `POST {FRONT_URL}/api/revalidate` with the shared secret header.
 *
 * Failures are logged and swallowed — revalidation must NEVER fail the
 * mutation that triggered it (front down != write failed).
 */
@Injectable()
export class RevalidationService {
    private readonly logger = new Logger(RevalidationService.name);

    constructor(
        private readonly http: HttpService,
        private readonly config: ConfigService
    ) {}

    async revalidate(tags: string[]): Promise<void> {
        if (!tags.length) return;

        const frontUrl = this.config.get<string>('revalidation.frontUrl');
        const secret = this.config.get<string>('revalidation.secret');
        if (!frontUrl || !secret) {
            this.logger.warn(
                'revalidation skipped: FRONT_URL / REVALIDATE_SECRET not set'
            );
            return;
        }

        try {
            await firstValueFrom(
                this.http.post(
                    `${frontUrl}/api/revalidate`,
                    { tags },
                    { headers: { 'x-revalidate-secret': secret } }
                )
            );
            this.logger.log(`revalidated tags: ${tags.join(', ')}`);
        } catch (e) {
            this.logger.error(
                `revalidate failed for [${tags.join(', ')}]: ${
                    e instanceof Error ? e.message : String(e)
                }`
            );
        }
    }
}
