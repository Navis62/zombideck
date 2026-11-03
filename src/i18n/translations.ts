import { de } from './de';
import { en } from './en';
import { fr } from './fr';
import { it } from './it';
import { pl } from './pl';
import { pt } from './pt';

export type { TranslationKey } from './fr';

// To add a language: add its file in this folder, then add it to TRANSLATIONS, LANGUAGE_NAMES and
// CARD_LANGUAGE_NAMES.
export const TRANSLATIONS = { fr, en, de, it, pl, pt };
export type Language = keyof typeof TRANSLATIONS;
export const LANGUAGE_NAMES: Record<Language, string> = {
  fr: 'Français',
  en: 'English',
  de: 'Deutsch',
  it: 'Italiano',
  pl: 'Polski',
  pt: 'Português (BR)',
};
/** Edition badge on the card face: the original English cards (VO) or a translated edition. */
export const CARD_LANGUAGE_NAMES: Record<Language, string> = { fr: 'VF', en: 'VO', de: 'DE', it: 'IT', pl: 'PL', pt: 'PT' };
