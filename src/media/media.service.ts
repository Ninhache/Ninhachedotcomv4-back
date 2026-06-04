import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MediaType, Prisma } from '@prisma/client';
import { spawn } from 'child_process';
import { rename, unlink } from 'fs/promises';
import { extname, join } from 'path';
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

// MP4/MOV containers whose `moov` atom must sit at the front for HTTP streaming.
// Screen recorders write it at the end, which plays from disk but breaks
// streaming/embedding ("could not decode h264"). We remux these with faststart.
const FASTSTART_MIMES = ['video/mp4', 'video/quicktime'];

@Injectable()
export class MediaService {
    private readonly logger = new Logger(MediaService.name);

    constructor(private readonly prisma: PrismaService) {}

    private detectMediaType(mimeType: string): MediaType {
        if (IMAGE_MIMES.includes(mimeType)) return MediaType.IMAGE;
        if (VIDEO_MIMES.includes(mimeType)) return MediaType.VIDEO;
        return MediaType.IMAGE;
    }

    private buildMediaUrl(filename: string): string {
        return `/uploads/${filename}`;
    }

    /**
     * Lossless remux of an uploaded MP4/MOV so its `moov` atom sits at the front
     * (`-movflags +faststart`), making it streamable/embeddable over HTTP.
     * No re-encode (`-c copy`). Best-effort: if ffmpeg is missing or fails, the
     * original upload is kept and the upload still succeeds.
     */
    private async faststartRemux(file: Express.Multer.File): Promise<void> {
        if (!FASTSTART_MIMES.includes(file.mimetype)) return;

        const src = file.path;
        const tmp = `${src}.faststart${extname(file.filename) || '.mp4'}`;

        try {
            await new Promise<void>((resolve, reject) => {
                const ff = spawn('ffmpeg', [
                    '-y',
                    '-loglevel',
                    'error',
                    '-i',
                    src,
                    '-c',
                    'copy',
                    '-movflags',
                    '+faststart',
                    tmp,
                ]);
                let stderr = '';
                ff.stderr.on('data', d => (stderr += d.toString()));
                ff.on('error', reject); // e.g. ffmpeg not installed
                ff.on('close', code =>
                    code === 0
                        ? resolve()
                        : reject(new Error(stderr || `ffmpeg exited ${code}`))
                );
            });
            await rename(tmp, src); // atomically swap in the faststart version
            this.logger.log(`faststart remux applied to ${file.filename}`);
        } catch (err) {
            await unlink(tmp).catch(() => {});
            this.logger.warn(
                `faststart remux skipped for ${file.filename}: ${
                    err instanceof Error ? err.message : err
                }`
            );
        }
    }

    async create(file: Express.Multer.File, createMediaDto: CreateMediaDto) {
        await this.faststartRemux(file);

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
