import { Module } from '@nestjs/common';
import { AliasModule } from 'src/alias/alias.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MissionController } from './mission.controller';
import { MissionService } from './mission.service';

@Module({
    imports: [PrismaModule, AliasModule],
    controllers: [MissionController],
    providers: [MissionService],
    // Exported so TimelineModule can aggregate missions into GET /timeline.
    exports: [MissionService],
})
export class MissionModule {}
