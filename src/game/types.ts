export type ZombieType =
  | 'walker'
  | 'runner'
  | 'fatty'
  | 'abomination'
  | 'toxicWalker'
  | 'toxicRunner'
  | 'toxicFatty'
  | 'berserkerWalker'
  | 'berserkerRunner'
  | 'berserkerFatty'
  | 'skinnerWalker'
  | 'skinnerRunner'
  | 'skinnerFatty'
  | 'dog'
  | 'crow'
  | 'seeker'
  | 'vip'
  | 'lostZombivor'
  | 'sillyWalker'
  | 'inquisitor';
export type DangerLevel = 'blue' | 'yellow' | 'orange' | 'red';

/** Zombie counts, in Danger Level order: blue, yellow, orange, red. */
export type SpawnCounts = readonly [number, number, number, number];

export type ZombieCard =
  | {
      id: string;
      setId: string;
      kind: 'spawn' | 'rush';
      zombie: ZombieType;
      counts: SpawnCounts;
      /** Shooters symbol (M4A1 barrel in a red circle) printed on some Fort Hendrix cards. */
      shooter?: true;
    }
  | { id: string; setId: string; kind: 'extra'; zombie: ZombieType }
  | { id: string; setId: string; kind: 'trejo' }
  | { id: string; setId: string; kind: 'trejoRush' }
  | { id: string; setId: string; kind: 'spam' };

export type CardSet = {
  id: string;
  /** False while the cards have not been checked against the physical deck. */
  verified: boolean;
  /** Expansions and promos are switched on in the options; the rest is always in the deck. */
  optional: boolean;
  /** Set taken out of the deck while this one is switched on. */
  replaces?: string;
  cards: readonly ZombieCard[];
};

export type Piles = {
  draw: string[];
  discard: string[];
  current: string | null;
  reshuffled: boolean;
};

export type GameState = {
  version: 1;
  setIds: string[];
  piles: Piles;
  /** Piles before each recent draw or shuffle, oldest first, for undo. */
  history: Piles[];
  /** Chosen by the players, who track their own XP. */
  danger: DangerLevel;
};
