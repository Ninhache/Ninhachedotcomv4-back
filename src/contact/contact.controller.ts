import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    Param,
    Patch,
    Post,
    Query,
    Res,
} from '@nestjs/common';
import { AliasService } from 'src/alias/alias.service';
import { isRaw } from 'src/alias/raw';
import {
    ApiCreatedResponse,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from 'src/auth/public.decorator';
import { RevalidateContent } from 'src/revalidation/revalidate.decorator';
import { ContactService } from './contact.service';
import { ContactResponseDto } from './dto/contacts-response.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@ApiTags('Contact')
@RevalidateContent('contacts')
@Controller('contact')
export class ContactController {
    constructor(
        private readonly contactService: ContactService,
        private readonly alias: AliasService
    ) {}

    @Post()
    @ApiOperation({ summary: 'Create a contact' })
    @ApiCreatedResponse({ type: ContactResponseDto })
    async create(
        @Body() dto: CreateContactDto,
        @Res({ passthrough: true }) res: Response
    ) {
        const created = await this.contactService.create(dto);
        res.setHeader('Location', `/contact/${created.id}`);
        return created;
    }

    @Public()
    @Get()
    @ApiOperation({ summary: 'List all contacts' })
    @ApiOkResponse({ type: [ContactResponseDto] })
    async findAll(@Query('locale') locale = 'fr', @Query('raw') raw?: string) {
        const contacts = await this.contactService.findAll();
        return isRaw(raw) ? contacts : this.alias.resolveObject(contacts, locale);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a contact by ID' })
    @ApiOkResponse({ type: ContactResponseDto })
    @ApiNotFoundResponse({ description: 'Contact not found' })
    async findOne(@Param('id') id: string) {
        return await this.contactService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a contact' })
    @ApiOkResponse({ type: ContactResponseDto })
    @ApiNotFoundResponse({ description: 'Contact not found' })
    async update(@Param('id') id: string, @Body() dto: UpdateContactDto) {
        return await this.contactService.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(204)
    @ApiOperation({ summary: 'Delete a contact' })
    @ApiNoContentResponse({ description: 'Contact deleted' })
    @ApiNotFoundResponse({ description: 'Contact not found' })
    async remove(@Param('id') id: string) {
        return await this.contactService.remove(id);
    }
}
