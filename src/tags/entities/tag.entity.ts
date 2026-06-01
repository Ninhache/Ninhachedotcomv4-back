import { Locale } from '@prisma/client';

export class Tag {
  id: string;
  name: string;
  isVisible: boolean;
  hexColor: string;
  type: TagType;
  translations: TagTranslation[];
}

export class TagTranslation {
  id: string;
  locale: Locale;
  name: string;
  tag: string;
  tagId: string;
}

export enum TagType {
  TECH = 'TECH',
  QUAL = 'QUAL',
  SKILL_CATEGORY = 'SKILL_CATEGORY',
  EXPERIENCE_TECH = 'EXPERIENCE_TECH',
}
