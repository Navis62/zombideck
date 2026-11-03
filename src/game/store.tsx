import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { CARDS_BY_ID } from '@/data/decks';
import { LANGUAGE_NAMES, TRANSLATIONS, type Language, type TranslationKey } from '@/i18n/translations';
import { isValidSave } from './engine';
import type { GameState } from './types';

const GAME_KEY = 'zombideck.game';
const LANGUAGE_KEY = 'zombideck.language';
const EXPANSIONS_KEY = 'zombideck.expansions';

type Translate = (key: TranslationKey, params?: Record<string, string | number>) => string;

const translator =
  (language: Language): Translate =>
  (key, params = {}) =>
    Object.entries(params).reduce(
      (text, [name, value]) => text.replace(`{${name}}`, String(value)),
      TRANSLATIONS[language][key] as string,
    );

type AppContextValue = {
  game: GameState | null;
  setGame: (update: (game: GameState | null) => GameState | null) => void;
  language: Language;
  setLanguage: (language: Language) => void;
  expansions: string[];
  setExpansions: (expansions: string[]) => void;
  /** Translates the interface and what is printed on the cards alike. */
  t: Translate;
};

const AppContext = createContext<AppContextValue | null>(null);

const isLanguage = (value: string | null | undefined): value is Language =>
  !!value && value in LANGUAGE_NAMES;

function deviceLanguage(): Language {
  const code = getLocales()[0].languageCode;
  return isLanguage(code) ? code : 'en';
}

function parseSave(raw: string | null): GameState | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isValidSave(parsed, new Set(CARDS_BY_ID.keys())) ? parsed : null;
  } catch {
    return null;
  }
}

function parseExpansions(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [game, setGame] = useState<GameState | null>(null);
  const [language, setLanguage] = useState<Language>(deviceLanguage);
  const [expansions, setExpansions] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.multiGet([GAME_KEY, LANGUAGE_KEY, EXPANSIONS_KEY])
      .then(([[, savedGame], [, savedLanguage], [, savedExpansions]]) => {
        setGame(parseSave(savedGame));
        if (isLanguage(savedLanguage)) setLanguage(savedLanguage);
        setExpansions(parseExpansions(savedExpansions));
      })
      .catch((error) => console.warn('Could not load the saved game', error))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    // No game can mean the save failed to load: leave it in storage until a new game replaces it.
    if (!loaded || !game) return;
    AsyncStorage.setItem(GAME_KEY, JSON.stringify(game)).catch((error) =>
      console.warn('Could not save the game', error),
    );
  }, [game, loaded]);

  const chooseLanguage = useCallback((next: Language) => {
    setLanguage(next);
    AsyncStorage.setItem(LANGUAGE_KEY, next).catch((error) =>
      console.warn('Could not save the language', error),
    );
  }, []);

  const chooseExpansions = useCallback((next: string[]) => {
    setExpansions(next);
    AsyncStorage.setItem(EXPANSIONS_KEY, JSON.stringify(next)).catch((error) =>
      console.warn('Could not save the expansions', error),
    );
  }, []);

  const value = useMemo(
    () => ({
      game,
      setGame,
      language,
      setLanguage: chooseLanguage,
      expansions,
      setExpansions: chooseExpansions,
      t: translator(language),
    }),
    [game, language, chooseLanguage, expansions, chooseExpansions],
  );

  if (!loaded) return null;
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}
