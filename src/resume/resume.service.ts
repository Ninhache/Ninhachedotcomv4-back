import { Injectable, NotFoundException } from '@nestjs/common';
import { Locale } from '@prisma/client';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResumeDto } from './dto/resume.dto';

@Injectable()
export class ResumeService {
    constructor(private prismaService: PrismaService) {}

    private buildUrl(filename: string): string {
        return `/uploads/${filename}`;
    }

    async create(
        localeFiles: { locale: 'fr' | 'en'; file: Express.Multer.File }[]
    ): Promise<ResumeDto> {
        // Multer has already written the new files to disk by the time we get
        // here. We must not delete the old resume's files until the new record
        // is safely committed, otherwise a DB failure would leave the system
        // with no resume at all (old files gone, new record never written).
        const newFilenames = localeFiles.map(({ file }) => file.filename);

        try {
            const { resume, oldUrls } = await this.prismaService.$transaction(
                async tx => {
                    const oldResumes = await tx.resume.findMany({
                        include: { translations: true },
                    });
                    const oldUrls = oldResumes.flatMap(r =>
                        r.translations.map(t => t.url)
                    );

                    await tx.resume.deleteMany();

                    const resume = await tx.resume.create({
                        data: {
                            translations: {
                                create: localeFiles.map(({ locale, file }) => ({
                                    locale: locale as Locale,
                                    url: this.buildUrl(file.filename),
                                })),
                            },
                        },
                        include: { translations: true },
                    });

                    return { resume, oldUrls };
                }
            );

            // Commit succeeded: now it's safe to remove the superseded files.
            await Promise.all(oldUrls.map(url => this.unlinkByUrl(url)));

            return resume;
        } catch (err) {
            // Transaction rolled back: clean up the freshly uploaded files so
            // they don't leak on disk, then surface the original error.
            await Promise.all(
                newFilenames.map(filename => this.unlinkByFilename(filename))
            );
            throw err;
        }
    }

    async findCurrentResume(): Promise<ResumeDto> {
        const resume = await this.prismaService.resume.findFirst({
            select: {
                id: true,
                translations: true,
                updatedAt: true,
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });

        if (!resume) {
            throw new NotFoundException('No current Resume');
        }

        return resume;
    }

    /** Absolute path to the uploads directory, used to contain file deletes. */
    private get uploadsDir(): string {
        return join(__dirname, '..', '..', 'uploads');
    }

    /** Best-effort delete of a stored file referenced by its `/uploads/...` URL. */
    private async unlinkByUrl(url: string): Promise<void> {
        if (!url.startsWith('/uploads/')) return;
        await this.unlinkByFilename(url.replace('/uploads/', ''));
    }

    /**
     * Best-effort delete of a file inside the uploads dir. Guards against path
     * traversal: a crafted filename must still resolve under uploadsDir.
     */
    private async unlinkByFilename(filename: string): Promise<void> {
        const base = this.uploadsDir;
        const filePath = join(base, filename);
        if (filePath !== join(base, '.') && !filePath.startsWith(base + '/')) {
            // Resolved outside the uploads directory — refuse to delete.
            return;
        }
        try {
            await unlink(filePath);
        } catch {
            // File may already be missing, ignore.
        }
    }
}
