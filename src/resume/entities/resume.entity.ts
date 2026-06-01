import { Locale } from '@prisma/client';

export class Resume {
  id: string;
  updatedAt: Date;
  translations: ResumeTranslation[];
}

export class ResumeTranslation {
  id: string;
  locale: Locale;
  url: string;
  resumeId: string;
}
