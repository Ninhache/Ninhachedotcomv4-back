import { Module } from '@nestjs/common';
import { AliasModule } from 'src/alias/alias.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PositionController } from './position.controller';
import { PositionService } from './position.service';

@Module({
    imports: [PrismaModule, AliasModule],
    controllers: [PositionController],
    providers: [PositionService],
    // Exported so TimelineModule can fold positions into GET /timeline.
    exports: [PositionService],
})
export class PositionModule {}
