import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule';
import { Test } from '@nestjs/testing';
import configs from '../../config';
import { ContactModule } from '../../contact/contact.module';
import { ExperienceModule } from '../../experience/experience.module';
import { PrismaService } from '../../prisma/prisma.service';
import { ProfileModule } from '../../profile/profile.module';
import { ProjectModule } from '../../project/project.module';
import { RevalidationInterceptor } from '../../revalidation/revalidation.interceptor';
import { RevalidationModule } from '../../revalidation/revalidation.module';
import { SkillModule } from '../../skill/skill.module';

// Regression: verifies the 5 public content controllers resolve AliasService
// (B3) and that the RevalidationInterceptor resolves RevalidationService (B4).
// Prisma is stubbed; ConfigModule supplies the ConfigService both depend on.
// (Avoids AppModule so the uuid v13 ESM/jest incompatibility in MediaModule
// doesn't get in the way.)
it('content controllers + revalidation interceptor resolve their deps', async () => {
    const moduleRef = await Test.createTestingModule({
        imports: [
            ConfigModule.forRoot({ load: configs, isGlobal: true }),
            ScheduleModule.forRoot(),
            RevalidationModule,
            ProjectModule,
            ExperienceModule,
            ContactModule,
            ProfileModule,
            SkillModule,
        ],
        providers: [
            { provide: APP_INTERCEPTOR, useClass: RevalidationInterceptor },
        ],
    })
        .overrideProvider(PrismaService)
        .useValue({
            onModuleInit: async () => {},
            $connect: async () => {},
            $on: () => {},
        })
        .compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    // B5: the hourly greeting cron is registered.
    const registry = app.get(SchedulerRegistry);
    expect(() => registry.getCronJob('refresh-greeting')).not.toThrow();

    await app.close();
});
