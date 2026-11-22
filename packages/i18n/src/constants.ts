import type { LanguageMeta, SupportedLanguage } from '@janasahayak/types';

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

export const SUPPORTED_LANGUAGES_LIST: readonly SupportedLanguage[] = ['en', 'hi', 'kn'] as const;

export const LANGUAGE_METADATA: Record<SupportedLanguage, LanguageMeta> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    script: 'Latin',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    direction: 'ltr',
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    script: 'Devanagari',
    fontFamily: '"Noto Sans Devanagari", system-ui, -apple-system, sans-serif',
    direction: 'ltr',
  },
  kn: {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    script: 'Kannada',
    fontFamily: '"Noto Sans Kannada", system-ui, -apple-system, sans-serif',
    direction: 'ltr',
  },
};

export function isSupportedLanguage(lang: unknown): lang is SupportedLanguage {
  return typeof lang === 'string' && (SUPPORTED_LANGUAGES_LIST as readonly string[]).includes(lang);
}

export function getLanguageMeta(code: SupportedLanguage): LanguageMeta {
  return LANGUAGE_METADATA[code] ?? LANGUAGE_METADATA.en;
}
