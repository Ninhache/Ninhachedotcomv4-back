import { Module } from '@nestjs/common';
import { ExperienceService } from './experience.service';
import { ExperienceController } from './experience.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AliasModule } from 'src/alias/alias.module';

@Module({
  imports: [PrismaModule, AliasModule],
  controllers: [ExperienceController],
  providers: [ExperienceService],
})
export class ExperienceModule {}
