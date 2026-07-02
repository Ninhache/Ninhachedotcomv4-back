import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ResumeController } from './resume.controller';
import { ResumeService } from './resume.service';

@Module({
  imports: [PrismaModule],
  controllers: [ResumeController],
  providers: [ResumeService],
  // Exported so CvModule can promote a generated PDF to the public Resume.
  exports: [ResumeService],
})
export class ResumeModule {}
