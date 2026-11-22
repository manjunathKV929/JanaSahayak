import type { SupportedLanguage } from '@janasahayak/types';
import { DEFAULT_LANGUAGE, isSupportedLanguage } from './constants.js';
import { en, type TranslationDictionary } from './locales/en.js';
import { hi } from './locales/hi.js';
import { kn } from './locales/kn.js';

export const DICTIONARIES: Record<SupportedLanguage, TranslationDictionary> = {
  en,
  hi,
  kn,
};

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKeyPath = NestedKeyOf<TranslationDictionary>;

/**
 * Resolves a dot-delimited path on a nested dictionary object.
 */
function resolvePath(obj: unknown, path: string): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;

  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return typeof current === 'string' ? current : undefined;
}

/**
 * Interpolates variables in format {{varName}} with provided params.
 */
function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
    return key in params ? String(params[key]) : `{{${key}}}`;
  });
}

/**
 * Translates a key path into the target language with robust English fallback and variable interpolation.
 */
export function t(
  key: TranslationKeyPath | string,
  locale: SupportedLanguage | string = DEFAULT_LANGUAGE,
  params?: Record<string, string | number>,
): string {
  const safeLocale: SupportedLanguage = isSupportedLanguage(locale) ? locale : DEFAULT_LANGUAGE;

  // 1. Try target locale dictionary
  const dict = DICTIONARIES[safeLocale];
  let message = resolvePath(dict, key);

  // 2. Fall back to English if missing in target locale
  if (message === undefined && safeLocale !== DEFAULT_LANGUAGE) {
    message = resolvePath(DICTIONARIES[DEFAULT_LANGUAGE], key);
  }

  // 3. Fall back to raw key if not found in English
  if (message === undefined) {
    message = key;
  }

  return interpolate(message, params);
}

/**
 * Checks whether a key path exists in the given locale.
 */
export function hasTranslationKey(
  key: string,
  locale: SupportedLanguage | string = DEFAULT_LANGUAGE,
): boolean {
  const safeLocale: SupportedLanguage = isSupportedLanguage(locale) ? locale : DEFAULT_LANGUAGE;
  return resolvePath(DICTIONARIES[safeLocale], key) !== undefined;
}
