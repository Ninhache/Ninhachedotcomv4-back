import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RevalidationService } from './revalidation.service';

/**
 * The greeting bucket logic lives in the alias body (DB), so the host can't
 * know the transition hours. Instead we invalidate the `greeting` tag every
 * hour on the hour (Europe/Paris) — body-agnostic and always correct to within
 * the hour. Cost: one home regeneration/hour, served stale in between.
 */
@Injectable()
export class GreetingCron {
    private readonly logger = new Logger(GreetingCron.name);

    constructor(private readonly revalidation: RevalidationService) {}

    @Cron('0 * * * *', {
        name: 'refresh-greeting',
        timeZone: 'Europe/Paris',
    })
    async refreshGreeting(): Promise<void> {
        this.logger.log('hourly greeting revalidation');
        await this.revalidation.revalidate(['greeting']);
    }
}
