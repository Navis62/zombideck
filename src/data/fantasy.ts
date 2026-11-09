import type { CardSet, FantasyActivated, FantasyCard, FantasyLevel, FantasyNecromancer, FantasyZombie, ZombieCard } from '../game/types';

// Fantasy era cards, transcribed from the printed cards (checked card by card against pictures of the decks).
// Levels are in Danger Level order: blue, yellow, orange, red (the cards print them top-down, red first).
// Each level is written as a zombie letter and a count ("W5"), "A" for the Abomination, "-" for "Nothing in sight!".

const BLACK_PLAGUE = 'blackPlague';
const GREEN_HORDE = 'greenHorde';

type Letter = 'W' | 'R' | 'F' | 'A';
const STANDARD: Record<Letter, FantasyZombie> = {
  W: 'fantasyWalker',
  R: 'fantasyRunner',
  F: 'fantasyFatty',
  A: 'fantasyAbomination',
};
const ORC: Record<Letter, FantasyZombie> = { W: 'orcWalker', R: 'orcRunner', F: 'orcFatty', A: 'orcAbomination' };

function level(spec: string, zombies: Record<Letter, FantasyZombie>): FantasyLevel {
  if (spec === '-') return null;
  if (spec === 'A') return { zombie: zombies.A, count: 1 };
  // A Walker, Runner or Fatty level always prints its count: a missing one is a transcription slip.
  const match = /^([WRF])([1-9]\d*)$/.exec(spec);
  if (!match) throw new Error(`Unreadable level "${spec}"`);
  const [, letter, count] = match;
  return { zombie: zombies[letter as Letter], count: Number(count) };
}

type Specs = readonly [string, string, string, string];

const levels = (setId: string, id: string, specs: Specs, zombies: Record<Letter, FantasyZombie>, horde?: true): FantasyCard => ({
  id: `${setId}-${id}`,
  setId,
  kind: 'levels',
  levels: [level(specs[0], zombies), level(specs[1], zombies), level(specs[2], zombies), level(specs[3], zombies)],
  ...(horde && { horde }),
});

const activation = (setId: string, id: string, zombie: FantasyActivated): FantasyCard => ({
  id: `${setId}-${id}`,
  setId,
  kind: 'activation',
  zombie,
});

const necromancer = (setId: string, id: string, zombie: FantasyNecromancer): FantasyCard => ({
  id: `${setId}-${id}`,
  setId,
  kind: 'necromancer',
  zombie,
});

const special = (setId: string, id: string, kind: 'doubleSpawn' | 'enterHorde'): FantasyCard => ({
  id: `${setId}-${id}`,
  setId,
  kind,
});

const number = (n: number) => String(n).padStart(3, '0');
/** Cards printed several times with the same content, from `first` on. */
const copies = (first: number, count: number, make: (id: string) => FantasyCard) =>
  Array.from({ length: count }, (_, i) => make(number(first + i)));

// Black Plague #013-#024 come back as #025-#036, card for card.
const BLACK_PLAGUE_SPAWNS: readonly Specs[] = [
  ['-', 'R2', 'W5', 'F2'], // 001
  ['-', 'F2', 'W5', 'W5'],
  ['-', 'W4', 'R3', 'R2'],
  ['W1', 'R1', 'F3', 'F3'],
  ['W1', 'F1', 'W4', 'W5'], // 005
  ['W1', 'W2', 'R1', 'R3'],
  ['W2', 'R1', 'F1', 'F3'],
  ['W3', 'F1', 'W4', 'W6'],
  ['F1', 'W2', 'R2', 'R3'],
  ['F1', 'W2', 'F2', 'W5'], // 010
  ['R1', 'W3', 'W3', 'W6'],
  ['R1', 'W3', 'W3', 'W5'],
];
const BLACK_PLAGUE_TWINS: readonly Specs[] = [
  ['A', 'R1', 'W5', 'F2'], // 013 and 025
  ['W2', 'A', 'F1', 'R3'],
  ['W2', 'F1', 'A', 'W6'], // 015 and 027
  ['W1', 'W3', 'R2', 'A'],
  ['W1', 'R2', 'F3', 'R6'], // 017 and 029: Runners at Red on the cards (the fan wiki says Walkers)
  ['R1', 'F1', 'W4', 'W5'],
  ['W1', 'W4', 'R2', 'F3'],
  ['F1', 'R1', 'W6', 'R2'], // 020 and 032
  ['W1', 'F2', 'R2', 'W8'],
  ['F1', 'W2', 'F2', 'W7'], // 022 and 034
  ['R1', 'W4', 'W4', 'F3'],
  ['F1', 'W3', 'W5', 'R3'], // 024 and 036
];

// The levels as printed: the Horde symbol beside each one stands for the extra zombie set aside for the Horde, not
// counted here (the fan wiki adds it to most counts). Green Horde #179-#190 come back as #191-#202.
const GREEN_HORDE_SPAWNS: readonly Specs[] = [
  ['-', 'R4', 'W5', 'F2'], // 167
  ['-', 'F2', 'W5', 'W5'],
  ['-', 'W4', 'R6', 'R6'],
  ['W1', 'R3', 'F3', 'F3'], // 170
  ['W1', 'F1', 'W4', 'W5'],
  ['W1', 'W2', 'R4', 'R7'],
  ['W2', 'R3', 'F1', 'F3'],
  ['W3', 'F1', 'W4', 'W6'],
  ['F1', 'W2', 'R5', 'R7'], // 175
  ['F1', 'W2', 'F2', 'W5'],
  ['R2', 'W3', 'W3', 'W6'],
  ['R2', 'W3', 'W3', 'W5'],
];
const GREEN_HORDE_TWINS: readonly Specs[] = [
  ['A', 'R3', 'W5', 'F2'], // 179 and 191
  ['W2', 'A', 'F1', 'R7'], // 180 and 192
  ['W2', 'F1', 'A', 'W6'],
  ['W1', 'W3', 'R5', 'A'],
  ['W1', 'R4', 'F3', 'W6'],
  ['R2', 'F1', 'W4', 'W5'],
  ['W1', 'W4', 'R5', 'F3'], // 185 and 197
  ['F1', 'R3', 'W6', 'R6'],
  ['W1', 'F2', 'R5', 'W8'],
  ['F1', 'W2', 'F2', 'W7'],
  ['R2', 'W4', 'W4', 'F3'],
  ['F1', 'W3', 'W5', 'R7'], // 190 and 202
];

const blackPlagueCards: ZombieCard[] = [
  ...BLACK_PLAGUE_SPAWNS.map((specs, i) => levels(BLACK_PLAGUE, number(1 + i), specs, STANDARD)),
  ...BLACK_PLAGUE_TWINS.map((specs, i) => levels(BLACK_PLAGUE, number(13 + i), specs, STANDARD)),
  ...BLACK_PLAGUE_TWINS.map((specs, i) => levels(BLACK_PLAGUE, number(25 + i), specs, STANDARD)),
  activation(BLACK_PLAGUE, '037', 'fantasyWalker'),
  activation(BLACK_PLAGUE, '038', 'fantasyWalker'),
  activation(BLACK_PLAGUE, '039', 'fantasyFatty'),
  activation(BLACK_PLAGUE, '040', 'fantasyRunner'),
  ...copies(41, 6, (id) => necromancer(BLACK_PLAGUE, id, 'necromancer')),
  ...copies(47, 8, (id) => special(BLACK_PLAGUE, id, 'doubleSpawn')),
];

const greenHordeCards: ZombieCard[] = [
  ...GREEN_HORDE_SPAWNS.map((specs, i) => levels(GREEN_HORDE, number(167 + i), specs, ORC, true)),
  ...GREEN_HORDE_TWINS.map((specs, i) => levels(GREEN_HORDE, number(179 + i), specs, ORC, true)),
  ...GREEN_HORDE_TWINS.map((specs, i) => levels(GREEN_HORDE, number(191 + i), specs, ORC, true)),
  activation(GREEN_HORDE, '203', 'orcWalker'),
  activation(GREEN_HORDE, '204', 'orcWalker'),
  activation(GREEN_HORDE, '205', 'orcFatty'),
  activation(GREEN_HORDE, '206', 'orcRunner'),
  ...copies(207, 6, (id) => necromancer(GREEN_HORDE, id, 'orcNecromancer')),
  ...copies(213, 8, (id) => special(GREEN_HORDE, id, 'enterHorde')),
];

const noHardCards = () => false;

/** Two core boxes, each playable alone; "all fantasy Zombicide contents are compatible", so both can be mixed. */
export const FANTASY_SETS: readonly CardSet[] = [
  { id: BLACK_PLAGUE, optional: true, core: true, isHard: noHardCards, cards: blackPlagueCards },
  { id: GREEN_HORDE, optional: true, core: true, isHard: noHardCards, cards: greenHordeCards },
];
