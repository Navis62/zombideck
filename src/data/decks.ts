import type { CardSet, SpawnCounts, ZombieCard, ZombieType } from '../game/types';

// DEMO DATA: these cards are placeholders, NOT the real deck.
// Replace them with the cards from the physical decks, then set `verified: true`.
// Counts are in Danger Level order: blue, yellow, orange, red.

const spawn = (setId: string, id: string, zombie: ZombieType, counts: SpawnCounts): ZombieCard => ({
  id: `${setId}-${id}`,
  setId,
  kind: 'spawn',
  zombie,
  counts,
});

const rush = (setId: string, id: string, zombie: ZombieType, counts: SpawnCounts): ZombieCard => ({
  id: `${setId}-${id}`,
  setId,
  kind: 'rush',
  zombie,
  counts,
});

const extra = (setId: string, id: string, zombie: ZombieType): ZombieCard => ({
  id: `${setId}-${id}`,
  setId,
  kind: 'extra',
  zombie,
});

const CORE = 'core2e';
const UPGRADE = 'upgrade';

export const CARD_SETS: readonly CardSet[] = [
  {
    id: CORE,
    verified: false,
    cards: [
      spawn(CORE, '01', 'walker', [1, 2, 4, 6]),
      spawn(CORE, '02', 'walker', [2, 3, 5, 7]),
      spawn(CORE, '03', 'walker', [3, 5, 7, 9]),
      spawn(CORE, '04', 'walker', [2, 4, 6, 8]),
      spawn(CORE, '05', 'runner', [1, 2, 3, 4]),
      spawn(CORE, '06', 'runner', [0, 1, 2, 3]),
      spawn(CORE, '07', 'fatty', [1, 1, 2, 3]),
      spawn(CORE, '08', 'fatty', [0, 1, 2, 2]),
      spawn(CORE, '09', 'abomination', [0, 1, 1, 1]),
      rush(CORE, '10', 'walker', [1, 2, 3, 4]),
      rush(CORE, '11', 'runner', [1, 1, 2, 3]),
      extra(CORE, '12', 'walker'),
      extra(CORE, '13', 'runner'),
      extra(CORE, '14', 'fatty'),
    ],
  },
  {
    id: UPGRADE,
    verified: false,
    cards: [
      spawn(UPGRADE, '01', 'walker', [2, 3, 4, 6]),
      spawn(UPGRADE, '02', 'runner', [1, 1, 2, 4]),
      spawn(UPGRADE, '03', 'fatty', [1, 2, 2, 3]),
      rush(UPGRADE, '04', 'fatty', [0, 1, 1, 2]),
      extra(UPGRADE, '05', 'walker'),
    ],
  },
];

export const CARDS_BY_ID: ReadonlyMap<string, ZombieCard> = new Map(
  CARD_SETS.flatMap((set) => set.cards.map((card) => [card.id, card] as const)),
);
