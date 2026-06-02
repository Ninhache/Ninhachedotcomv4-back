import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AliasModule } from 'src/alias/alias.module';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
    imports: [PrismaModule, AliasModule],
    controllers: [ProfileController],
    providers: [ProfileService],
})
export class ProfileModule {}
