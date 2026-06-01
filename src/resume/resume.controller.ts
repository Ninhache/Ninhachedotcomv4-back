import {
    BadRequestException,
    Controller,
    Get,
    Post,
    UploadedFiles,
    UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOkResponse } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ResumeDto } from './dto/resume.dto';
import { ResumeService } from './resume.service';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const uploadStorage = diskStorage({
    destination: join(__dirname, '..', '..', 'uploads'),
    filename: (_req, file, cb) => {
        const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

@Controller('resume')
export class ResumeController {
    constructor(private readonly resumeService: ResumeService) {}

    @Post()
    @UseInterceptors(
        FileFieldsInterceptor(
            [
                { name: 'fr', maxCount: 1 },
                { name: 'en', maxCount: 1 },
            ],
            {
                storage: uploadStorage,
                limits: { fileSize: MAX_FILE_SIZE },
                fileFilter: (_req, file, cb) => {
                    if (file.mimetype === 'application/pdf') {
                        cb(null, true);
                    } else {
                        cb(
                            new BadRequestException(
                                `Invalid file type: ${file.mimetype}. Only application/pdf is allowed.`
                            ),
                            false
                        );
                    }
                },
            }
        )
    )
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                fr: {
                    type: 'string',
                    format: 'binary',
                    description: 'French resume PDF',
                },
                en: {
                    type: 'string',
                    format: 'binary',
                    description: 'English resume PDF',
                },
            },
        },
    })
    create(
        @UploadedFiles()
        files: { fr?: Express.Multer.File[]; en?: Express.Multer.File[] }
    ) {
        if (!files?.fr?.length && !files?.en?.length) {
            throw new BadRequestException(
                'At least one PDF file is required (field name: "fr" or "en")'
            );
        }

        const localeFiles: {
            locale: 'fr' | 'en';
            file: Express.Multer.File;
        }[] = [];

        if (files.fr?.length) {
            localeFiles.push({ locale: 'fr', file: files.fr[0] });
        }
        if (files.en?.length) {
            localeFiles.push({ locale: 'en', file: files.en[0] });
        }

        return this.resumeService.create(localeFiles);
    }

    @Get()
    @ApiOkResponse({ type: ResumeDto })
    findCurrentResume() {
        return this.resumeService.findCurrentResume();
    }
}
