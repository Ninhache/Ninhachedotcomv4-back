import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    Param,
    Patch,
    Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AliasAdminService } from './alias-admin.service';
import { CreateAliasDto } from './dto/create-alias.dto';
import { UpdateAliasDto } from './dto/update-alias.dto';

/**
 * Admin CRUD for aliases. Not @Public(), so the global JwtAuthGuard protects
 * every route. Each mutation invalidates the resolver cache and revalidates the
 * front, so a new alias is resolvable immediately — no redeploy.
 */
@ApiTags('Admin / Aliases')
@Controller('admin/aliases')
export class AliasAdminController {
    constructor(private readonly adminService: AliasAdminService) {}

    @Get()
    list() {
        return this.adminService.list();
    }

    @Post()
    create(@Body() dto: CreateAliasDto) {
        return this.adminService.create(dto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateAliasDto) {
        return this.adminService.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(200)
    remove(@Param('id') id: string) {
        return this.adminService.remove(id);
    }
}
