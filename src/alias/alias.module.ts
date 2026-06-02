import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AliasAdminController } from './alias-admin.controller';
import { AliasAdminService } from './alias-admin.service';
import { AliasService } from './alias.service';

/**
 * Provides the alias resolution engine + admin CRUD. AliasService is exported
 * so content modules (B3) can pipe payloads through `resolveObject(...)`. The
 * admin CRUD (B6) invalidates the resolver cache after each mutation.
 * RevalidationService is supplied by the global RevalidationModule.
 */
@Module({
    imports: [PrismaModule],
    controllers: [AliasAdminController],
    providers: [AliasService, AliasAdminService],
    exports: [AliasService],
})
export class AliasModule {}
