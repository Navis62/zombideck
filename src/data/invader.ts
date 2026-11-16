import type { CardSet, InvaderAbomination, InvaderCard, InvaderXeno, InvaderZone, SpawnCounts, ZombieCard } from '../game/types';

export const INVADER = 'invader';
export const DARK_SIDE = 'darkSide';

/**
 * Card ids are `<setId>-<printed number>`: `invader-001`..`invader-054`, `darkSide-061`..`darkSide-114`.
 * Easy cards are #1-25 and #61-85, hard ones #26-50 and #86-110, Extra Activations #51-54 and #111-114: the
 * number within its box (the printed number modulo 60) tells the part, `cardPart` spots the extra kind.
 */
const isHardCard = (card: ZombieCard) => {
  const number = Number(card.id.slice(card.id.lastIndexOf('-') + 1)) % 60;
  return number >= 26 && number <= 50;
};

/*
 * Transcribed on 2026-11-16 from the printed card images published on the Atomic Asteroidz site
 * (zombicide.atomic-asteroidz.fr, sci-fi deck config). The printed numbers are not visible on those images:
 * they come from the image file names, and the 25 easy / 25 hard / 4 extra split matches the rulebooks (p.37).
 * Photos of the owner's own cards may correct this later.
 * The card lists Red first; `counts` is Blue, Yellow, Orange, Red, so each row below is reversed.
 */

const ids = (setId: string, from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => `${setId}-${String(from + i).padStart(3, '0')}`);

const xeno = (setId: string, from: number, to: number, zombie: InvaderXeno, counts: SpawnCounts): InvaderCard[] =>
  ids(setId, from, to).map((id) => ({ id, setId, kind: 'xeno', zombie, counts }));

const abomination = (setId: string, from: number, to: number, zombie: InvaderAbomination): InvaderCard[] =>
  ids(setId, from, to).map((id) => ({ id, setId, kind: 'xenoAbomination', zombie }));

const zoneSpawn = (
  setId: string,
  numbers: readonly [number, number],
  zone: InvaderZone,
  zombie: InvaderXeno,
  count: number,
): InvaderCard[] => numbers.map((n) => ({ id: ids(setId, n, n)[0], setId, kind: 'zoneSpawn', zone, zombie, count }));

const extra = (setId: string, number: number, zombie: InvaderXeno): InvaderCard => ({
  id: ids(setId, number, number)[0],
  setId,
  kind: 'xenoExtra',
  zombie,
});

const INVADER_CARDS: InvaderCard[] = [
  // Easy: 001-025
  ...xeno(INVADER, 1, 6, 'worker', [2, 4, 6, 8]),
  ...xeno(INVADER, 7, 10, 'tank', [2, 2, 6, 8]),
  ...xeno(INVADER, 11, 15, 'hunter', [2, 2, 6, 8]),
  ...abomination(INVADER, 16, 21, 'spoilerAbomination'),
  ...zoneSpawn(INVADER, [22, 47], 'mold', 'worker', 1),
  ...zoneSpawn(INVADER, [23, 48], 'mold', 'worker', 2),
  ...zoneSpawn(INVADER, [24, 49], 'mold', 'tank', 1),
  ...zoneSpawn(INVADER, [25, 50], 'mold', 'hunter', 1),
  // Hard: 026-050
  ...xeno(INVADER, 26, 31, 'worker', [4, 6, 8, 10]),
  ...xeno(INVADER, 32, 35, 'tank', [4, 4, 6, 8]),
  ...xeno(INVADER, 36, 40, 'hunter', [4, 4, 6, 8]),
  ...abomination(INVADER, 41, 46, 'spoilerAbomination'),
  // Extra Activation: 051-054 (all on Red, Orange and Yellow; no one on Blue)
  extra(INVADER, 51, 'worker'),
  extra(INVADER, 52, 'worker'),
  extra(INVADER, 53, 'tank'),
  extra(INVADER, 54, 'hunter'),
].sort((a, b) => a.id.localeCompare(b.id));

const DARK_SIDE_CARDS: InvaderCard[] = [
  // Easy: 061-085
  ...xeno(DARK_SIDE, 61, 66, 'drillerWorker', [2, 4, 6, 8]),
  ...xeno(DARK_SIDE, 67, 70, 'drillerTank', [2, 2, 6, 8]),
  ...xeno(DARK_SIDE, 71, 75, 'drillerHunter', [2, 2, 6, 8]),
  ...abomination(DARK_SIDE, 76, 81, 'drillerAbomination'),
  ...zoneSpawn(DARK_SIDE, [82, 107], 'pit', 'drillerWorker', 1),
  ...zoneSpawn(DARK_SIDE, [83, 108], 'pit', 'drillerWorker', 2),
  ...zoneSpawn(DARK_SIDE, [84, 109], 'pit', 'drillerTank', 1),
  ...zoneSpawn(DARK_SIDE, [85, 110], 'pit', 'drillerHunter', 1),
  // Hard: 086-110
  ...xeno(DARK_SIDE, 86, 91, 'drillerWorker', [4, 6, 8, 10]),
  ...xeno(DARK_SIDE, 92, 95, 'drillerTank', [4, 4, 6, 8]),
  ...xeno(DARK_SIDE, 96, 100, 'drillerHunter', [4, 4, 6, 8]),
  ...abomination(DARK_SIDE, 101, 106, 'drillerAbomination'),
  // Extra Activation: 111-114
  extra(DARK_SIDE, 111, 'drillerWorker'),
  extra(DARK_SIDE, 112, 'drillerWorker'),
  extra(DARK_SIDE, 113, 'drillerTank'),
  extra(DARK_SIDE, 114, 'drillerHunter'),
].sort((a, b) => a.id.localeCompare(b.id));

/** Both boxes are core boxes that combine. */
export const INVADER_SETS: readonly CardSet[] = [
  { id: INVADER, optional: true, core: true, isHard: isHardCard, cards: INVADER_CARDS },
  { id: DARK_SIDE, optional: true, core: true, isHard: isHardCard, cards: DARK_SIDE_CARDS },
];
