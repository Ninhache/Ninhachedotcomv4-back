import { Controller, Get } from '@nestjs/common';
import { Locale } from '@prisma/client';
import { Public } from 'src/auth/public.decorator';

@Controller('locales')
export class LocalesController {
  // Public: the supported-locale list is non-sensitive and is needed both by
  // the authenticated admin UI and potentially at static-build time.
  @Public()
  @Get()
  list(): string[] {
    return Object.values(Locale);
  }
}
