import { de } from './de.ts';
import { en } from './en.ts';
import { es } from './es.ts';
import { fr } from './fr.ts';
import { it } from './it.ts';
import { pl } from './pl.ts';
import { pt } from './pt.ts';

export type { TranslationKey } from './fr.ts';

// To add a language: add its file in this folder, then add it to TRANSLATIONS and LANGUAGE_NAMES.
export const TRANSLATIONS = { fr, en, de, es, it, pl, pt };
export type Language = keyof typeof TRANSLATIONS;
export const LANGUAGE_NAMES: Record<Language, string> = {
  fr: 'Français',
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  it: 'Italiano',
  pl: 'Polski',
  pt: 'Português (BR)',
};
