import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  type Dispatch,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { CARDS_BY_ID } from '@/data/decks';
import { deviceLanguage } from '@/i18n/device-language';
import { isLanguage, type Language, type Translate, translator } from '@/i18n/translations';
import { ALL_PARTS, isValidSave, upgradeSave } from './engine';
import type { DeckParts, GameState } from './types';

const GAME_KEY = 'zombideck.game';
const LANGUAGE_KEY = 'zombideck.language';
const EXPANSIONS_KEY = 'zombideck.expansions';
const CARD_DISPLAY_KEY = 'zombideck.cardDisplay';
const DECK_PARTS_KEY = 'zombideck.deckParts';
const HAPTICS_KEY = 'zombideck.haptics';
const ZONE_DISPLAY_KEY = 'zombideck.zoneDisplay';

/** Spawn cards show every Danger Level, or only the current one. */
export type CardDisplay = 'all' | 'current';
const isCardDisplay = (value: string | null): value is CardDisplay => value === 'all' || value === 'current';

/** With several Spawn Zones: every zone's card at once, side by side, or one zone per tap. */
export type ZoneDisplay = 'row' | 'sequence';
const isZoneDisplay = (value: string | null): value is ZoneDisplay => value === 'row' || value === 'sequence';

type AppContextValue = {
  game: GameState | null;
  setGame: (update: (game: GameState | null) => GameState | null) => void;
  language: Language;
  setLanguage: (language: Language) => void;
  expansions: string[];
  /** Takes the new list or, for changes made in quick succession, a function of the current one. */
  setExpansions: Dispatch<SetStateAction<string[]>>;
  cardDisplay: CardDisplay;
  setCardDisplay: (cardDisplay: CardDisplay) => void;
  deckParts: DeckParts;
  setDeckParts: (deckParts: DeckParts) => void;
  /** Vibrate when a card is drawn. */
  haptics: boolean;
  setHaptics: (haptics: boolean) => void;
  zoneDisplay: ZoneDisplay;
  setZoneDisplay: (zoneDisplay: ZoneDisplay) => void;
  /** Translates the interface and what is printed on the cards alike. */
  t: Translate;
};

const AppContext = createContext<AppContextValue | null>(null);

function save(key: string, value: string, what: string) {
  AsyncStorage.setItem(key, value).catch((error) => console.warn(`Could not save the ${what}`, error));
}

function parseSave(raw: string | null): GameState | null {
  if (!raw) return null;
  try {
    const parsed = upgradeSave(JSON.parse(raw));
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

function parseDeckParts(raw: string | null): DeckParts {
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== 'object') return ALL_PARTS;
    const { easy, hard, extra } = parsed as Record<string, unknown>;
    if (typeof easy !== 'boolean' || typeof hard !== 'boolean' || typeof extra !== 'boolean') return ALL_PARTS;
    return easy || hard ? { easy, hard, extra } : ALL_PARTS;
  } catch {
    return ALL_PARTS;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [game, setGame] = useState<GameState | null>(null);
  const [language, setLanguage] = useState<Language>(deviceLanguage);
  const [expansions, setExpansions] = useState<string[]>([]);
  const [cardDisplay, setCardDisplay] = useState<CardDisplay>('current');
  const [deckParts, setDeckParts] = useState<DeckParts>(ALL_PARTS);
  const [haptics, setHaptics] = useState(true);
  const [zoneDisplay, setZoneDisplay] = useState<ZoneDisplay>('row');

  useEffect(() => {
    AsyncStorage.multiGet([GAME_KEY, LANGUAGE_KEY, EXPANSIONS_KEY, CARD_DISPLAY_KEY, DECK_PARTS_KEY, HAPTICS_KEY, ZONE_DISPLAY_KEY])
      .then(([[, savedGame], [, savedLanguage], [, savedExpansions], [, savedCardDisplay], [, savedDeckParts], [, savedHaptics], [, savedZoneDisplay]]) => {
        setGame(parseSave(savedGame));
        if (isLanguage(savedLanguage)) setLanguage(savedLanguage);
        setExpansions(parseExpansions(savedExpansions));
        if (isCardDisplay(savedCardDisplay)) setCardDisplay(savedCardDisplay);
        setDeckParts(parseDeckParts(savedDeckParts));
        setHaptics(savedHaptics !== 'off');
        if (isZoneDisplay(savedZoneDisplay)) setZoneDisplay(savedZoneDisplay);
      })
      .catch((error) => console.warn('Could not load the saved game', error))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    // No game can mean the save failed to load: leave it in storage until a new game replaces it.
    if (!loaded || !game) return;
    save(GAME_KEY, JSON.stringify(game), 'game');
  }, [game, loaded]);

  const chooseLanguage = useCallback((next: Language) => {
    setLanguage(next);
    save(LANGUAGE_KEY, next, 'language');
  }, []);

  // Saved from the state rather than in the setter, so updates computed from the current list are saved too.
  useEffect(() => {
    if (loaded) save(EXPANSIONS_KEY, JSON.stringify(expansions), 'expansions');
  }, [expansions, loaded]);

  const chooseCardDisplay = useCallback((next: CardDisplay) => {
    setCardDisplay(next);
    save(CARD_DISPLAY_KEY, next, 'card display');
  }, []);

  const chooseDeckParts = useCallback((next: DeckParts) => {
    setDeckParts(next);
    save(DECK_PARTS_KEY, JSON.stringify(next), 'deck parts');
  }, []);

  const chooseHaptics = useCallback((next: boolean) => {
    setHaptics(next);
    save(HAPTICS_KEY, next ? 'on' : 'off', 'vibration');
  }, []);

  const chooseZoneDisplay = useCallback((next: ZoneDisplay) => {
    setZoneDisplay(next);
    save(ZONE_DISPLAY_KEY, next, 'zone display');
  }, []);

  const value = useMemo(
    () => ({
      game,
      setGame,
      language,
      setLanguage: chooseLanguage,
      expansions,
      setExpansions,
      cardDisplay,
      setCardDisplay: chooseCardDisplay,
      deckParts,
      setDeckParts: chooseDeckParts,
      haptics,
      setHaptics: chooseHaptics,
      zoneDisplay,
      setZoneDisplay: chooseZoneDisplay,
      t: translator(language),
    }),
    [
      game,
      language,
      chooseLanguage,
      expansions,
      cardDisplay,
      chooseCardDisplay,
      deckParts,
      chooseDeckParts,
      haptics,
      chooseHaptics,
      zoneDisplay,
      chooseZoneDisplay,
    ],
  );

  if (!loaded) return null;
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}
