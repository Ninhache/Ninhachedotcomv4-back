import { Module } from '@nestjs/common';
import { ContactService } from './contact.service';
import { ContactController } from './contact.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AliasModule } from 'src/alias/alias.module';

@Module({
  imports: [PrismaModule, AliasModule],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}
