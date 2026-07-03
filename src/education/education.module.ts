import { Module } from '@nestjs/common';
import { AliasModule } from 'src/alias/alias.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EducationController } from './education.controller';
import { EducationService } from './education.service';

@Module({
    imports: [PrismaModule, AliasModule],
    controllers: [EducationController],
    providers: [EducationService],
    // Exported so TimelineModule can aggregate education into GET /timeline.
    exports: [EducationService],
})
export class EducationModule {}
