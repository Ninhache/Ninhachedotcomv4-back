import { Locale, TagType } from '@prisma/client';

export type TagTranslationDTO = {
  id: string;
  locale: Locale;
  name: string;
};

export type TagResponseDTO = {
  id: string;
  type: TagType;
  isVisible: boolean;
  hexColor: string;
  translations: TagTranslationDTO[];
  nameByLocale: Record<Locale, string>;
};

export type TagListResponseDTO = {
  items: TagResponseDTO[];
};
