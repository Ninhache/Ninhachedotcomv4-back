import { Locale } from '@prisma/client';

export class MissionTranslationEntity {
    locale: Locale;
    title: string;
    context: string | null;
    tasks: string[];
}

// Documentation/response shape for a Mission. The service returns Prisma's
// inferred types (with skills + translations included) directly.
export class MissionEntity {
    id: string;
    employerCompanyId: string;
    clientCompanyId: string | null;
    startDate: Date;
    endDate: Date | null;
    isVisible: boolean;
    order: number;
    translations: MissionTranslationEntity[];
}
