import { ContractType, Locale } from '@prisma/client';
import { Tag } from 'src/tags/entities/tag.entity';

export class Experience {
  id: string;
  startDate: Date;
  endDate: Date;
  contractType: ContractType;
  localisation: string;
  isVisible: boolean;
  siteUrl?: string;
  tags: Tag[];
  translations: ExperienceTranslation[];
}

export class ExperienceTranslation {
  id: string;
  locale: Locale;
  jobTitle: string;
  companyName: string;
  description: string;
  experienceId: string;
}
