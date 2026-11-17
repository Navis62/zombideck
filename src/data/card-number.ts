import type { ZombieCard } from '../game/types';

/** The printed number of a card: the last three digits of its id (`core2e-037` is 37), whatever the universe. */
export const numberOf = (card: ZombieCard) => Number(card.id.slice(-3));

/** Whether the printed number of a card is within `from`..`to` (inclusive): how a set tells its harder part. */
export const hardBetween = (from: number, to: number) => (card: ZombieCard) =>
  numberOf(card) >= from && numberOf(card) <= to;
