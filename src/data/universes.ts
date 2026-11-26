import type { ArtSubject } from '../components/zombie-art';
import {
  type BossPowers,
  type BossTrigger,
  type CardEffect,
  DANGER_LEVELS,
  type Deck,
  noPowers,
  powersOf,
  type Tailor,
} from '../game/engine.ts';
import type { BossRule, CardSet, UniverseId, ZombieCard } from '../game/types';
import type { TranslationKey } from '../i18n/fr.ts';
import { CARD_SETS } from './decks.ts';
import { ABOMINATIONS, FANTASY_SETS } from './fantasy.ts';
import { INVADER_SETS } from './invader.ts';
import { mergeWesternIronMaidenPacks, WESTERN_SETS } from './western.ts';
import {
  ABOMINATION_BOSSES,
  BIG_BOSSES,
  type Boss,
  BOSS_RULES,
  CORE_NECROMANCERS,
  DIVINE_BEASTS,
  FANTASY_BOSS_COPIES,
  FANTASY_BOSS_IDS,
  LORD_OF_SKULLS_ESCORT,
  MODERN_ABOMINATIONS,
  MODERN_BOSS_COPIES,
  MODERN_BOSS_IDS,
  NECROMANCER_BOSSES,
  SET_ABOMINATIONS,
  tailorFantasyDeck,
  tailorModernDeck,
  tailorWesternDeck,
  type Threat,
  WESTERN_ABOMINATIONS,
  WESTERN_BOSS_COPIES,
  WESTERN_BOSS_IDS,
  WESTERN_BOSS_RULES,
} from './threat.ts';

export type Universe = {
  id: UniverseId;
  sets: readonly CardSet[];
  optionalSets: readonly CardSet[];
  /** Core boxes replace each other (Modern) instead of combining (Fantasy). */
  exclusiveCores: boolean;
  defaultExpansions: readonly string[];
  /** The core rulebook sorts cards into easier and harder parts. */
  deckParts: boolean;
  tagline: TranslationKey;
  heroes: readonly ArtSubject[];
  /** Boss decks of the era (see `threat.ts`); `null` where it has none. */
  bosses: BossDecks | null;
};

export type BossDecks = {
  abominations: readonly Boss[];
  necromancers: readonly Boss[];
  ids: ReadonlySet<string>;
  /** Most cards of a boss a save may hold, where known. */
  copies: ReadonlyMap<string, number>;
  rules: readonly BossRule[];
  tailor: (cards: readonly ZombieCard[], threat: Threat, setIds: ReadonlySet<string>) => Deck;
  bossPowers: BossPowers;
  /** Players may also draw Abominations by hand. */
  manualDraw: boolean;
};

export function tailorDeck(universe: UniverseId, threat: Threat, setIds: readonly string[]): Tailor {
  const { bosses } = UNIVERSES[universe];
  return bosses ? (cards) => bosses.tailor(cards, threat, new Set(setIds)) : (cards) => ({ cards });
}

export const UNIVERSES: Readonly<Record<UniverseId, Universe>> = {
  modern: {
    id: 'modern',
    sets: CARD_SETS,
    optionalSets: CARD_SETS.filter((set) => set.optional || set.core),
    exclusiveCores: true,
    defaultExpansions: ['core2e'],
    deckParts: true,
    tagline: 'menu.tagline',
    heroes: ['walkerSign', 'runnerKneePads', 'fattySecurity'],
    bosses: {
      abominations: MODERN_ABOMINATIONS,
      necromancers: [],
      ids: MODERN_BOSS_IDS,
      copies: MODERN_BOSS_COPIES,
      rules: BOSS_RULES,
      tailor: tailorModernDeck,
      bossPowers: powersOf(MODERN_ABOMINATIONS),
      manualDraw: true,
    },
  },
  fantasy: {
    id: 'fantasy',
    sets: FANTASY_SETS,
    optionalSets: FANTASY_SETS.filter((set) => set.optional),
    exclusiveCores: false,
    defaultExpansions: ['blackPlague'],
    deckParts: false,
    tagline: 'menu.taglineFantasy',
    heroes: ['fantasyRunner', 'orcFatty', 'necromancer'],
    bosses: {
      abominations: [...SET_ABOMINATIONS, ...ABOMINATION_BOSSES, ...BIG_BOSSES],
      necromancers: [...CORE_NECROMANCERS, ...NECROMANCER_BOSSES],
      ids: FANTASY_BOSS_IDS,
      copies: FANTASY_BOSS_COPIES,
      rules: BOSS_RULES,
      tailor: tailorFantasyDeck,
      bossPowers: powersOf([...ABOMINATION_BOSSES, ...DIVINE_BEASTS, ...LORD_OF_SKULLS_ESCORT, ...NECROMANCER_BOSSES]),
      manualDraw: true,
    },
  },
  invader: {
    id: 'invader',
    sets: INVADER_SETS,
    optionalSets: INVADER_SETS.filter((set) => set.optional),
    exclusiveCores: false,
    defaultExpansions: ['invader'],
    deckParts: true,
    tagline: 'menu.taglineInvader',
    heroes: ['hunter', 'tank', 'worker'],
    bosses: null,
  },
  western: {
    id: 'western',
    sets: WESTERN_SETS,
    optionalSets: WESTERN_SETS.filter((set) => set.optional),
    exclusiveCores: false,
    defaultExpansions: ['undeadOrAlive'],
    deckParts: false,
    tagline: 'menu.taglineWestern',
    heroes: ['westernRunner', 'westernBrute', 'westernWalker'],
    bosses: {
      abominations: WESTERN_ABOMINATIONS,
      necromancers: [],
      ids: WESTERN_BOSS_IDS,
      copies: WESTERN_BOSS_COPIES,
      rules: WESTERN_BOSS_RULES,
      tailor: tailorWesternDeck,
      bossPowers: noPowers,
      manualDraw: true,
    },
  },
};

export type UpcomingUniverse = never;
export const UPCOMING_UNIVERSES: readonly UpcomingUniverse[] = [];

export const CARDS_BY_ID: ReadonlyMap<string, ZombieCard> = new Map(
  Object.values(UNIVERSES).flatMap((universe) => universe.sets.flatMap((set) => set.cards.map((card) => [card.id, card] as const))),
);

const CARD_IDS: Readonly<Record<UniverseId, ReadonlySet<string>>> = {
  modern: new Set(UNIVERSES.modern.sets.flatMap((set) => set.cards.map((card) => card.id))),
  fantasy: new Set(UNIVERSES.fantasy.sets.flatMap((set) => set.cards.map((card) => card.id))),
  invader: new Set(UNIVERSES.invader.sets.flatMap((set) => set.cards.map((card) => card.id))),
  western: new Set(UNIVERSES.western.sets.flatMap((set) => set.cards.map((card) => card.id))),
};
export const cardIdsOf = (universe: UniverseId): ReadonlySet<string> => CARD_IDS[universe];
export const bossIdsOf = (universe: UniverseId): ReadonlySet<string> => UNIVERSES[universe].bosses?.ids ?? new Set();
export const bossCopiesOf = (universe: UniverseId): ReadonlyMap<string, number> => UNIVERSES[universe].bosses?.copies ?? new Map();

/** What a card does to the Spawn step: SPAM draws again, Double Spawn doubles the next zone, Enter the Horde ends it. */
export const cardEffect: CardEffect = (cardId) => {
  switch (CARDS_BY_ID.get(cardId)?.kind) {
    case 'spam':
      return 'drawAgain';
    case 'doubleSpawn':
      return 'double';
    case 'enterHorde':
      return 'endStep';
    default:
      return 'spawn';
  }
};

/** Danny Trejo cards, which the engine tracks apart from the bosses. */
export const isTrejoCard = (cardId: string): boolean => {
  const kind = CARDS_BY_ID.get(cardId)?.kind;
  return kind === 'trejo' || kind === 'trejoRush';
};

export const bossTrigger: BossTrigger = (cardId, danger) => {
  const card = CARDS_BY_ID.get(cardId);
  if (card?.kind === 'westernAbomination') return 'abomination';
  if (card?.kind === 'spawn') return card.zombie === 'abomination' && card.counts[DANGER_LEVELS.indexOf(danger)] > 0 ? 'abomination' : undefined; // rulebook p.17
  if (card?.kind === 'necromancer') return 'necromancer';
  if (card?.kind === 'bossCall') return card.boss;
  if (card?.kind !== 'levels') return undefined;
  const level = card.levels[DANGER_LEVELS.indexOf(danger)];
  return level && ABOMINATIONS.has(level.zombie) ? 'abomination' : undefined;
};

const coreIds = (universe: Universe) => universe.optionalSets.filter((set) => set.core).map((set) => set.id);

/** The sets the menu lists: expansions and promos, plus the core boxes when they can be combined. */
export const switchableSets = (universe: Universe): readonly CardSet[] =>
  universe.exclusiveCores ? universe.optionalSets.filter((set) => !set.core) : universe.optionalSets;

function withRequiredBoxes(universe: Universe, expansions: readonly string[], switchedOff?: string): string[] {
  let list = [...expansions];
  for (const set of universe.optionalSets) {
    if (!set.requires || !list.includes(set.id) || list.includes(set.requires)) continue;
    list = switchedOff === set.requires ? list.filter((id) => id !== set.id) : [...list, set.requires];
  }
  return list;
}

/** Keeps one core box on (exclusive cores: exactly one, the changed switch winning) and the boxes an expansion requires. */
export function withCoreBox(universe: Universe, storedExpansions: readonly string[], switchedOff?: string): string[] {
  const expansions = withRequiredBoxes(
    universe,
    universe.id === 'western' ? mergeWesternIronMaidenPacks(storedExpansions) : storedExpansions,
    switchedOff,
  );
  const cores = coreIds(universe);
  if (universe.exclusiveCores) {
    const selected = cores.filter((id) => expansions.includes(id));
    const chosen = switchedOff && selected.includes(switchedOff) ? switchedOff : selected.at(-1)
      ?? cores.find((id) => id !== switchedOff) ?? cores[0];
    return [...expansions.filter((id) => !cores.includes(id)), chosen];
  }
  if (cores.length === 0 || cores.some((id) => expansions.includes(id))) return [...expansions];
  return [...expansions, cores.find((id) => id !== switchedOff) ?? cores[0]];
}

export function allExpansions(universe: Universe, expansions: readonly string[]): string[] {
  const all = switchableSets(universe).map((set) => set.id);
  return withCoreBox(universe, [...all, ...expansions.filter((id) => !all.includes(id))]);
}

export function noExpansions(universe: Universe, expansions: readonly string[]): string[] {
  const cores = coreIds(universe);
  const inUse = universe.exclusiveCores
    ? expansions.filter((id) => cores.includes(id))
    : cores.filter((id) => expansions.includes(id)).slice(0, 1);
  return withCoreBox(universe, inUse);
}
