import { Module } from '@nestjs/common';
import { AliasModule } from 'src/alias/alias.module';
import { CompanyModule } from 'src/company/company.module';
import { EducationModule } from 'src/education/education.module';
import { MissionModule } from 'src/mission/mission.module';
import { PositionModule } from 'src/position/position.module';
import { TimelineController } from './timeline.controller';
import { TimelineService } from './timeline.service';

@Module({
    imports: [
        CompanyModule,
        MissionModule,
        PositionModule,
        EducationModule,
        AliasModule,
    ],
    controllers: [TimelineController],
    providers: [TimelineService],
})
export class TimelineModule {}
