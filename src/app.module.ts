import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AdminModule } from './admin/admin.module';
import { AliasModule } from './alias/alias.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import configs from './config';
import { ContactModule } from './contact/contact.module';
import { ExperienceModule } from './experience/experience.module';
import { LocalesModule } from './locales/locales.module';
import { MediaModule } from './media/media.module';
import { ProfileModule } from './profile/profile.module';
import { ProjectModule } from './project/project.module';
import { ResumeModule } from './resume/resume.module';
import { RevalidationModule } from './revalidation/revalidation.module';
import { RevalidationInterceptor } from './revalidation/revalidation.interceptor';
import { SkillModule } from './skill/skill.module';
import { TagModule } from './tags/tags.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            load: configs,
            isGlobal: true,
            cache: true,
            envFilePath: ['.env'],
            expandVariables: false,
        }),

        ScheduleModule.forRoot(),

        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'uploads'),
            serveRoot: '/uploads',
            serveStaticOptions: {
                index: false,
                // Uploads are user-supplied. `nosniff` (on everything) stops
                // browsers MIME-sniffing a file into something executable.
                // The CSP `sandbox` is only needed for types that can carry
                // active content (SVG/HTML) — applying it to video/images is
                // overly broad and breaks direct <video> playback (a raw
                // <video> fetches this response directly, unlike <img> which
                // the front launders through next/image). So scope it.
                setHeaders: (res, filePath) => {
                    res.setHeader('X-Content-Type-Options', 'nosniff');
                    if (/\.(svgz?|x?html?)$/i.test(filePath)) {
                        res.setHeader('Content-Security-Policy', 'sandbox');
                    }
                },
            },
        }),

        LocalesModule,
        ProjectModule,
        SkillModule,
        TagModule,
        ExperienceModule,
        ContactModule,
        ProfileModule,
        ResumeModule,
        AuthModule,
        AdminModule,
        MediaModule,
        AliasModule,
        RevalidationModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: RevalidationInterceptor,
        },
    ],
})
export class AppModule {}
