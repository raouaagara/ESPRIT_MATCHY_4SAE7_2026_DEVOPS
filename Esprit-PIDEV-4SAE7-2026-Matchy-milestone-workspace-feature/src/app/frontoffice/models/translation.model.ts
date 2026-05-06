export interface ContentTranslation {
  translationId?: number;
  contentId?: number;
  languageCode: string;
  translatedTitle: string;
  translatedDescription: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Language {
  code: string;
  name: string;
  flag: string;
}