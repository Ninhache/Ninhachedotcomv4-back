import { Module } from '@nestjs/common';
import { AliasModule } from 'src/alias/alias.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';

@Module({
    imports: [PrismaModule, AliasModule],
    controllers: [CompanyController],
    providers: [CompanyService],
    // Exported so TimelineModule can aggregate companies into GET /timeline.
    exports: [CompanyService],
})
export class CompanyModule {}
