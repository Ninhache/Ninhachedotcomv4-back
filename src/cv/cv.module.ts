import { Module } from '@nestjs/common';
import { AliasModule } from 'src/alias/alias.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ResumeModule } from 'src/resume/resume.module';
import { CvController } from './cv.controller';
import { CvService } from './cv.service';

@Module({
    // RevalidationService is global; ResumeModule provides ResumeService for the
    // optional `publish` (promote a generated PDF to the public Resume);
    // AliasModule resolves @@markers (@@age, @@email...) in CV content.
    imports: [PrismaModule, ResumeModule, AliasModule],
    controllers: [CvController],
    providers: [CvService],
})
export class CvModule {}
