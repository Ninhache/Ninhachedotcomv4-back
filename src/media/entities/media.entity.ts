import { MediaType } from '@prisma/client';

export class Media {
    id: string;
    mediaUrl: string;
    type: MediaType;
    originalName: string | null;
    mimeType: string | null;
    projectId: string | null;
}
