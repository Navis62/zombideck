import { de } from './de.ts';
import { en } from './en.ts';
import { es } from './es.ts';
import { fr } from './fr.ts';
import { it } from './it.ts';
import { pl } from './pl.ts';
import { pt } from './pt.ts';
import { ru } from './ru.ts';

import type { TranslationKey } from './fr.ts';

export type { TranslationKey };

// To add a language: add its file in this folder, then add it to TRANSLATIONS and LANGUAGE_NAMES.
export const TRANSLATIONS = { fr, en, de, es, it, pl, pt, ru };
export type Language = keyof typeof TRANSLATIONS;
export const LANGUAGE_NAMES: Record<Language, string> = {
  fr: 'Français',
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  it: 'Italiano',
  pl: 'Polski',
  pt: 'Português (BR)',
  ru: 'Русский',
};

export type Translate = (key: TranslationKey, params?: Record<string, string | number>) => string;

/** Translates the interface and what is printed on the cards alike. */
export const translator =
  (language: Language): Translate =>
  (key, params = {}) =>
    Object.entries(params).reduce(
      (text, [name, value]) => text.replace(`{${name}}`, String(value)),
      TRANSLATIONS[language][key] as string,
    );

export const isLanguage = (value: string | null | undefined): value is Language =>
  !!value && value in LANGUAGE_NAMES;
