import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AdminModule } from './admin/admin.module';
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

        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'uploads'),
            serveRoot: '/uploads',
            serveStaticOptions: {
                index: false,
                // Uploads are user-supplied. `nosniff` stops browsers from
                // MIME-sniffing a file into something executable; the CSP
                // `sandbox` neuters scripts in a malicious SVG even if it's
                // opened directly (stored-XSS defence). We still allow SVG
                // because skill/project logos use it.
                setHeaders: res => {
                    res.setHeader('X-Content-Type-Options', 'nosniff');
                    res.setHeader('Content-Security-Policy', 'sandbox');
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
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
    ],
})
export class AppModule {}
