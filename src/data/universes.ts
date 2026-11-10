import type { ArtSubject } from '../components/zombie-art';
import { type BossTrigger, type CardEffect, DANGER_LEVELS, type Tailor } from '../game/engine.ts';
import type { CardSet, UniverseId, ZombieCard } from '../game/types';
import type { TranslationKey } from '../i18n/fr.ts';
import { CARD_SETS } from './decks.ts';
import { ABOMINATIONS, FANTASY_SETS } from './fantasy.ts';
import { type Threat, tailorFantasyDeck } from './threat.ts';

export type Universe = {
  id: UniverseId;
  /** Every set of the era: core boxes, expansions and promos. */
  sets: readonly CardSet[];
  /** Expansions and promos the players switch on for the next game. */
  optionalSets: readonly CardSet[];
  /** The core boxes replace each other (Modern: core deck or Fort Hendrix) instead of being combined (Fantasy). */
  exclusiveCores: boolean;
  /** Switched on until the players choose: the core box most players start with. */
  defaultExpansions: readonly string[];
  /** The core rulebook sorts the deck into easier and harder cards, which the options can leave out. */
  deckParts: boolean;
  /** Under the title of the universe's menu. */
  tagline: TranslationKey;
  /** Zombies of the era, on its carousel card and its menu. */
  heroes: readonly ArtSubject[];
  /** The era picks its bosses one by one, in boss decks of their own (see `threat.ts`). */
  threat: boolean;
};

/** The cards of a new deck once the era has set its bosses apart, as the players chose them. */
export function tailorDeck(universe: UniverseId, threat: Threat, setIds: readonly string[]): Tailor {
  return UNIVERSES[universe].threat ? (cards) => tailorFantasyDeck(cards, threat, new Set(setIds)) : (cards) => ({ cards });
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
    heroes: ['runner', 'fatty', 'walker'],
    threat: false,
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
    threat: true,
  },
};

/** Shown in the carousel, in this order, after the playable universes. */
export type UpcomingUniverse = never;
export const UPCOMING_UNIVERSES: readonly UpcomingUniverse[] = [];

/** Every card of every universe: saves and the game screen find a card by its id, whatever its era. */
export const CARDS_BY_ID: ReadonlyMap<string, ZombieCard> = new Map(
  Object.values(UNIVERSES).flatMap((universe) => universe.sets.flatMap((set) => set.cards.map((card) => [card.id, card] as const))),
);

/** The card ids of each universe: a saved game only holds cards of its own era. */
const CARD_IDS: Readonly<Record<UniverseId, ReadonlySet<string>>> = {
  modern: new Set(UNIVERSES.modern.sets.flatMap((set) => set.cards.map((card) => card.id))),
  fantasy: new Set(UNIVERSES.fantasy.sets.flatMap((set) => set.cards.map((card) => card.id))),
};
export const cardIdsOf = (universe: UniverseId): ReadonlySet<string> => CARD_IDS[universe];

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

/**
 * With boss decks (Dead Men Tales rules): a Necromancer card reveals its Necromancer, a card that spawns an
 * Abomination at the current Danger Level reveals which one.
 */
export const bossTrigger: BossTrigger = (cardId, danger) => {
  const card = CARDS_BY_ID.get(cardId);
  if (card?.kind === 'necromancer') return 'necromancer';
  if (card?.kind === 'bossCall') return card.boss;
  if (card?.kind !== 'levels') return undefined;
  const level = card.levels[DANGER_LEVELS.indexOf(danger)];
  return level && ABOMINATIONS.has(level.zombie) ? 'abomination' : undefined;
};

const coreIds = (universe: Universe) => universe.optionalSets.filter((set) => set.core).map((set) => set.id);

/**
 * The sets the players switch on and off one by one, the ones the menu counts: expansions and promos, and the core
 * boxes when they can be combined.
 */
export const switchableSets = (universe: Universe): readonly CardSet[] =>
  universe.exclusiveCores ? universe.optionalSets.filter((set) => !set.core) : universe.optionalSets;

/**
 * Keeps at least one core box: switching off the last one switches on the first other core box, as the deck parts
 * do in the options. Where core boxes replace each other, only one stays: the changed switch wins, and old
 * preferences keep Fort Hendrix when it was enabled.
 */
export function withCoreBox(universe: Universe, expansions: readonly string[], switchedOff?: string): string[] {
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

/** "Select all": every switchable set; where core boxes replace each other, the one chosen stays. */
export function allExpansions(universe: Universe, expansions: readonly string[]): string[] {
  const all = switchableSets(universe).map((set) => set.id);
  return withCoreBox(universe, [...all, ...expansions.filter((id) => !all.includes(id))]);
}

/** "Deselect all": nothing left but one core box, the one in use (the first of them when several are combined). */
export function noExpansions(universe: Universe, expansions: readonly string[]): string[] {
  const cores = coreIds(universe);
  const inUse = universe.exclusiveCores
    ? expansions.filter((id) => cores.includes(id))
    : cores.filter((id) => expansions.includes(id)).slice(0, 1);
  return withCoreBox(universe, inUse);
}
