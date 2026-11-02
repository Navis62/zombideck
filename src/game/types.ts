export type ZombieType = 'walker' | 'runner' | 'fatty' | 'abomination';
export type DangerLevel = 'blue' | 'yellow' | 'orange' | 'red';

/** Zombie counts, in Danger Level order: blue, yellow, orange, red. */
export type SpawnCounts = readonly [number, number, number, number];

export type ZombieCard =
  | { id: string; setId: string; kind: 'spawn' | 'rush'; zombie: ZombieType; counts: SpawnCounts }
  | { id: string; setId: string; kind: 'extra'; zombie: ZombieType };

export type CardSet = {
  id: string;
  /** False while the cards have not been checked against the physical deck. */
  verified: boolean;
  cards: readonly ZombieCard[];
};

export type Piles = {
  draw: string[];
  discard: string[];
  current: string | null;
  reshuffled: boolean;
};

export type Survivor = { id: number; name: string; xp: number };

export type GameState = {
  version: 1;
  setIds: string[];
  excludedZombies: ZombieType[];
  piles: Piles;
  /** Piles before the last draw or shuffle, for undo. */
  previous: Piles | null;
  survivors: Survivor[];
};
