import { Injectable, NotFoundException } from '@nestjs/common';
import { MediaType, Prisma } from '@prisma/client';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';

const IMAGE_MIMES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
];

const VIDEO_MIMES = ['video/mp4', 'video/webm', 'video/quicktime'];

@Injectable()
export class MediaService {
    constructor(private readonly prisma: PrismaService) {}

    private detectMediaType(mimeType: string): MediaType {
        if (IMAGE_MIMES.includes(mimeType)) return MediaType.IMAGE;
        if (VIDEO_MIMES.includes(mimeType)) return MediaType.VIDEO;
        return MediaType.IMAGE;
    }

    private buildMediaUrl(filename: string): string {
        return `/uploads/${filename}`;
    }

    async create(file: Express.Multer.File, createMediaDto: CreateMediaDto) {
        const mediaUrl = this.buildMediaUrl(file.filename);
        const type = createMediaDto.type ?? this.detectMediaType(file.mimetype);

        const data: Prisma.MediaCreateInput = {
            mediaUrl,
            type,
            originalName: file.originalname,
            mimeType: file.mimetype,
            alt: createMediaDto.alt ?? null,
            ...(createMediaDto.projectId
                ? { project: { connect: { id: createMediaDto.projectId } } }
                : {}),
        };

        return this.prisma.media.create({
            data,
            include: {
                project: true,
            },
        });
    }

    async findAll() {
        return this.prisma.media.findMany({
            include: {
                project: true,
            },
            orderBy: { id: 'asc' },
        });
    }

    async findOne(id: string) {
        const media = await this.prisma.media.findUnique({
            where: { id },
            include: { project: true },
        });

        if (!media) {
            throw new NotFoundException(`Media with id [${id}] not found`);
        }

        return media;
    }

    async update(id: string, updateMediaDto: UpdateMediaDto) {
        await this.findOne(id);

        const data: Prisma.MediaUpdateInput = {
            ...(updateMediaDto.type !== undefined
                ? { type: updateMediaDto.type }
                : {}),
            // alt absent → leave unchanged; "" → clear; a string → set it.
            ...(updateMediaDto.alt !== undefined
                ? { alt: updateMediaDto.alt }
                : {}),
            ...(updateMediaDto.projectId !== undefined
                ? updateMediaDto.projectId
                    ? { project: { connect: { id: updateMediaDto.projectId } } }
                    : { project: { disconnect: true } }
                : {}),
        };

        return this.prisma.media.update({
            where: { id },
            data,
            include: { project: true },
        });
    }

    async remove(id: string) {
        const media = await this.findOne(id);

        // Delete the DB row FIRST. If we removed the file first and the DB
        // delete then failed, we'd be left with a record pointing at a missing
        // file. A leaked file (record gone, file still on disk) is the safer
        // failure mode and is recoverable.
        const deleted = await this.prisma.media.delete({
            where: { id },
        });

        // Best-effort cleanup of the physical file for local uploads.
        if (media.mediaUrl.startsWith('/uploads/')) {
            const filename = media.mediaUrl.replace('/uploads/', '');
            const filePath = join(__dirname, '..', '..', 'uploads', filename);
            try {
                await unlink(filePath);
            } catch {
                // File may already be missing, ignore
            }
        }

        return deleted;
    }
}
