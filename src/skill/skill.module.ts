import { Module } from '@nestjs/common';
import { SkillService } from './skill.service';
import { SkillController } from './skill.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AliasModule } from 'src/alias/alias.module';

@Module({
  imports: [PrismaModule, AliasModule],
  controllers: [SkillController],
  providers: [SkillService],
})
export class SkillModule {}
