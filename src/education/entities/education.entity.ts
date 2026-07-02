import { Locale } from '@prisma/client';

export class EducationTranslationEntity {
    locale: Locale;
    degree: string;
    description: string | null;
}

// Documentation/response shape for an Education record. The service returns
// Prisma's inferred types (with translations included) directly.
export class EducationEntity {
    id: string;
    institutionName: string;
    startDate: Date;
    endDate: Date | null;
    logoUrl: string | null;
    siteUrl: string | null;
    isVisible: boolean;
    order: number;
    translations: EducationTranslationEntity[];
}
