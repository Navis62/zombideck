import { getLocales } from 'expo-localization';

import { isLanguage, type Language } from './translations';

/** The first of the device's preferred languages that the app speaks, English otherwise. */
export function deviceLanguage(): Language {
  const match = getLocales()
    .map((locale) => locale.languageCode)
    .find(isLanguage);
  return match ?? 'en';
}
