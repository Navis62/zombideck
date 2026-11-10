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

import { BOSS_IDS, DEFAULT_THREAT, parseThreat, type Threat } from '@/data/threat';
import { cardIdsOf, UNIVERSES, withCoreBox } from '@/data/universes';
import { deviceLanguage } from '@/i18n/device-language';
import { isLanguage, type Language, type Translate, translator } from '@/i18n/translations';
import { ALL_PARTS, isValidSave, UNIVERSE_IDS, upgradeSave } from './engine';
import type { DeckParts, GameState, UniverseId } from './types';

const GAME_KEY = 'zombideck.game';
const LANGUAGE_KEY = 'zombideck.language';
const EXPANSIONS_KEY = 'zombideck.expansions';
const CARD_DISPLAY_KEY = 'zombideck.cardDisplay';
const DECK_PARTS_KEY = 'zombideck.deckParts';
const HAPTICS_KEY = 'zombideck.haptics';
const ZONE_DISPLAY_KEY = 'zombideck.zoneDisplay';
const UNIVERSE_KEY = 'zombideck.universe';
/** The bosses and Threat of each universe that doses them (see `Universe.threat`). */
const threatKey = (universe: UniverseId) => `zombideck.threat.${universe}`;

/** Each universe has its own list; the modern one keeps the key it had before there were universes. */
const expansionsKey = (universe: UniverseId) =>
  universe === 'modern' ? EXPANSIONS_KEY : `${EXPANSIONS_KEY}.${universe}`;

const isUniverse = (value: string | null): value is UniverseId => UNIVERSE_IDS.includes(value as UniverseId);
type ByUniverse<T> = Record<UniverseId, T>;
const defaultExpansions = (): ByUniverse<string[]> =>
  Object.fromEntries(
    UNIVERSE_IDS.map((universe) => [universe, [...UNIVERSES[universe].defaultExpansions]]),
  ) as unknown as ByUniverse<string[]>;

const defaultThreats = (): ByUniverse<Threat> =>
  Object.fromEntries(UNIVERSE_IDS.map((universe) => [universe, DEFAULT_THREAT])) as unknown as ByUniverse<Threat>;

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
  /** The era picked in the carousel: its sets fill the menu, the expansions and the next game. */
  universe: UniverseId;
  setUniverse: (universe: UniverseId) => void;
  /** Expansions switched on in the current universe. */
  expansions: string[];
  /** Takes the new list or, for changes made in quick succession, a function of the current one. */
  setExpansions: Dispatch<SetStateAction<string[]>>;
  /** Bosses left out and Threat of the current universe, for the next game. */
  threat: Threat;
  setThreat: Dispatch<SetStateAction<Threat>>;
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
    return isValidSave(parsed, cardIdsOf, BOSS_IDS) ? parsed : null;
  } catch {
    return null;
  }
}

/** Nothing stored yet: the universe's default expansions. */
function parseExpansions(raw: string | null, fallback: readonly string[]): string[] {
  if (!raw) return [...fallback];
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
  const [universe, setUniverse] = useState<UniverseId>('modern');
  const [allExpansions, setAllExpansions] = useState<ByUniverse<string[]>>(defaultExpansions);
  const [allThreats, setAllThreats] = useState<ByUniverse<Threat>>(defaultThreats);
  const [cardDisplay, setCardDisplay] = useState<CardDisplay>('current');
  const [deckParts, setDeckParts] = useState<DeckParts>(ALL_PARTS);
  const [haptics, setHaptics] = useState(true);
  const [zoneDisplay, setZoneDisplay] = useState<ZoneDisplay>('row');

  useEffect(() => {
    const keys = [GAME_KEY, LANGUAGE_KEY, UNIVERSE_KEY, CARD_DISPLAY_KEY, DECK_PARTS_KEY, HAPTICS_KEY, ZONE_DISPLAY_KEY];
    AsyncStorage.multiGet([...keys, ...UNIVERSE_IDS.map(expansionsKey), ...UNIVERSE_IDS.map(threatKey)])
      .then((entries) => {
        const stored = new Map(entries);
        const read = (key: string) => stored.get(key) ?? null;
        setGame(parseSave(read(GAME_KEY)));
        const savedLanguage = read(LANGUAGE_KEY);
        if (isLanguage(savedLanguage)) setLanguage(savedLanguage);
        const savedUniverse = read(UNIVERSE_KEY);
        if (isUniverse(savedUniverse)) setUniverse(savedUniverse);
        setAllExpansions(
          Object.fromEntries(
            UNIVERSE_IDS.map((id) => [id, withCoreBox(UNIVERSES[id], parseExpansions(read(expansionsKey(id)), UNIVERSES[id].defaultExpansions))]),
          ) as unknown as ByUniverse<string[]>,
        );
        setAllThreats(
          Object.fromEntries(UNIVERSE_IDS.map((id) => [id, parseThreat(read(threatKey(id)))])) as unknown as ByUniverse<Threat>,
        );
        const savedCardDisplay = read(CARD_DISPLAY_KEY);
        const savedZoneDisplay = read(ZONE_DISPLAY_KEY);
        const savedDeckParts = read(DECK_PARTS_KEY);
        const savedHaptics = read(HAPTICS_KEY);
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

  const chooseUniverse = useCallback((next: UniverseId) => {
    setUniverse(next);
    save(UNIVERSE_KEY, next, 'universe');
  }, []);

  const expansions = allExpansions[universe];
  const setExpansions = useCallback<Dispatch<SetStateAction<string[]>>>(
    (update) =>
      setAllExpansions((all) => ({
        ...all,
        [universe]: typeof update === 'function' ? update(all[universe]) : update,
      })),
    [universe],
  );

  // Saved from the state rather than in the setter, so updates computed from the current list are saved too.
  useEffect(() => {
    if (!loaded) return;
    for (const id of UNIVERSE_IDS) save(expansionsKey(id), JSON.stringify(allExpansions[id]), 'expansions');
  }, [allExpansions, loaded]);

  const threat = allThreats[universe];
  const setThreat = useCallback<Dispatch<SetStateAction<Threat>>>(
    (update) =>
      setAllThreats((all) => ({
        ...all,
        [universe]: typeof update === 'function' ? update(all[universe]) : update,
      })),
    [universe],
  );

  useEffect(() => {
    if (!loaded) return;
    for (const id of UNIVERSE_IDS) save(threatKey(id), JSON.stringify(allThreats[id]), 'threat');
  }, [allThreats, loaded]);

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
      universe,
      setUniverse: chooseUniverse,
      expansions,
      setExpansions,
      threat,
      setThreat,
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
      universe,
      chooseUniverse,
      expansions,
      setExpansions,
      threat,
      setThreat,
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
