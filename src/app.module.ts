import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ContactModule } from './contact/contact.module';
import { ExperienceModule } from './experience/experience.module';
import { MediaModule } from './media/media.module';
import { ProjectModule } from './project/project.module';
import { ResumeModule } from './resume/resume.module';
import { SkillModule } from './tag/skill/skill.module';
import { TagModule } from './tag/tag.module';
import { ConfigModule } from '@nestjs/config';

import configs from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: configs,
      isGlobal: true,
      cache: true,
      envFilePath: ['.env'],
      expandVariables: false,
    }),

    ProjectModule,
    SkillModule,
    TagModule,
    ExperienceModule,
    ContactModule,
    ResumeModule,
    AuthModule,
    AdminModule,
    MediaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
