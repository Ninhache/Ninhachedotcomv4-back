import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    Param,
    Patch,
    Post,
    Res,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import type { Response } from 'express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { MediaService } from './media.service';

const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'video/quicktime',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const uploadStorage = diskStorage({
    destination: join(__dirname, '..', '..', 'uploads'),
    filename: (_req, file, cb) => {
        const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

@Controller('media')
export class MediaController {
    constructor(private readonly mediaService: MediaService) {}

    @Post()
    @UseInterceptors(
        FileInterceptor('file', {
            storage: uploadStorage,
            limits: { fileSize: MAX_FILE_SIZE },
            fileFilter: (_req, file, cb) => {
                if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
                    cb(null, true);
                } else {
                    cb(
                        new BadRequestException(
                            `Invalid file type: ${file.mimetype}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`
                        ),
                        false
                    );
                }
            },
        })
    )
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            required: ['file'],
            properties: {
                file: { type: 'string', format: 'binary' },
                type: { type: 'string', enum: ['IMAGE', 'VIDEO'] },
                projectId: { type: 'string' },
            },
        },
    })
    async create(
        @UploadedFile() file: Express.Multer.File,
        @Body() createMediaDto: CreateMediaDto,
        @Res({ passthrough: true }) res: Response
    ) {
        if (!file) {
            throw new BadRequestException('File is required');
        }

        const created = await this.mediaService.create(file, createMediaDto);
        res.setHeader('Location', `/media/${created.id}`);

        return created;
    }

    @Get()
    async findAll() {
        return await this.mediaService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return await this.mediaService.findOne(id);
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() updateMediaDto: UpdateMediaDto
    ) {
        return await this.mediaService.update(id, updateMediaDto);
    }

    @Delete(':id')
    @HttpCode(204)
    async remove(@Param('id') id: string): Promise<void> {
        // 204 No Content — must not return a body.
        await this.mediaService.remove(id);
    }
}
