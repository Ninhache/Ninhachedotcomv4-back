import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AliasModule } from 'src/alias/alias.module';

@Module({
  imports: [PrismaModule, AliasModule],
  controllers: [ProjectController],
  providers: [ProjectService],
})
export class ProjectModule {}
