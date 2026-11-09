import type { CardSet, UniverseId } from '../game/types';
import { CARD_SETS, OPTIONAL_SETS } from './decks.ts';

export type Universe = {
  id: UniverseId;
  /** Every set of the era: core boxes, expansions and promos. */
  sets: readonly CardSet[];
  /** Expansions and promos the players switch on for the next game. */
  optionalSets: readonly CardSet[];
  /** The core rulebook sorts the deck into easier and harder cards, which the options can leave out. */
  deckParts: boolean;
};

export const UNIVERSES: Readonly<Record<UniverseId, Universe>> = {
  modern: { id: 'modern', sets: CARD_SETS, optionalSets: OPTIONAL_SETS, deckParts: true },
};

/** Shown in the carousel, in this order, after the playable universes. */
export type UpcomingUniverse = 'fantasy';
export const UPCOMING_UNIVERSES: readonly UpcomingUniverse[] = ['fantasy'];
