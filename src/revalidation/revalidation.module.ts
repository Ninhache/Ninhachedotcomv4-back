import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { GreetingCron } from './greeting.cron';
import { RevalidationService } from './revalidation.service';

/**
 * Global so the APP_INTERCEPTOR (registered in AppModule) and the alias admin
 * CRUD (B6) can both inject RevalidationService without re-importing.
 *
 * The hourly GreetingCron is registered here too; it only actually schedules
 * when ScheduleModule.forRoot() is present (AppModule).
 */
@Global()
@Module({
    imports: [HttpModule],
    providers: [RevalidationService, GreetingCron],
    exports: [RevalidationService],
})
export class RevalidationModule {}
