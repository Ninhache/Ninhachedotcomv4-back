import { Module } from '@nestjs/common';
import { LocalesController } from './locales.controller';

@Module({
  controllers: [LocalesController],
  providers: [],
})
export class LocalesModule {}
