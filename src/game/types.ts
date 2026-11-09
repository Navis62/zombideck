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
/** Zombie types printed on Rush cards; their name takes its own form in the Rush title ("Walker Rush!"). */
export type RushZombie =
  | 'walker'
  | 'fatty'
  | 'toxicWalker'
  | 'toxicFatty'
  | 'berserkerWalker'
  | 'berserkerFatty'
  | 'skinnerWalker'
  | 'skinnerFatty';
/** Zombie types printed on Extra Activation cards; "All Walkers" takes its own form in some languages. */
export type ExtraZombie = 'walker' | 'runner' | 'fatty' | 'skinnerWalker' | 'skinnerRunner' | 'skinnerFatty';
export type DangerLevel = 'blue' | 'yellow' | 'orange' | 'red';

/** A Zombicide era with its own boxes, zombies and cards, chosen when the app opens. */
export type UniverseId = 'modern';

/** Zombie counts, in Danger Level order: blue, yellow, orange, red. */
export type SpawnCounts = readonly [number, number, number, number];

type SpawnCard<Kind, Zombie> = {
  id: string;
  setId: string;
  kind: Kind;
  zombie: Zombie;
  counts: SpawnCounts;
  /** Shooters symbol (M4A1 barrel in a red circle) printed on some Fort Hendrix cards. */
  shooter?: true;
};

export type ZombieCard =
  | SpawnCard<'spawn', ZombieType>
  | SpawnCard<'rush', RushZombie>
  | { id: string; setId: string; kind: 'extra'; zombie: ExtraZombie }
  | { id: string; setId: string; kind: 'trejo' }
  | { id: string; setId: string; kind: 'trejoRush' }
  | { id: string; setId: string; kind: 'spam' };

export type CardSet = {
  id: string;
  /** Expansions and promos are switched on in the options; the rest is always in the deck. */
  optional: boolean;
  /** Set taken out of the deck while this one is switched on. */
  replaces?: string;
  /** Zombie expansion that dilutes the Abominations of the deck (see `scaled`). */
  addsZombies?: true;
  /**
   * Abomination cards of the upgrade kit: never switched on by hand, the deck takes as many of them as the share of
   * zombie expansions switched on (all of them: every card).
   */
  scaled?: true;
  /** Harder part of the set, as the core rulebook sorts its deck; the other cards are the easier part. */
  isHard: (card: ZombieCard) => boolean;
  cards: readonly ZombieCard[];
};

/** Which part of the deck a card belongs to: the easier or harder spawn cards, or the Extra Activations. */
export type CardPart = 'easy' | 'hard' | 'extra';
export type DeckParts = { easy: boolean; hard: boolean; extra: boolean };

export type Piles = {
  draw: string[];
  discard: string[];
  /** Cards of the last Spawn step, in Spawn Zone order; they go to the discard on the next draw. */
  drawn: string[];
  reshuffled: boolean;
};

export type GameState = {
  version: 3;
  /** The game's era: its sets, its cards and the menu it is resumed from. */
  universe: UniverseId;
  setIds: string[];
  piles: Piles;
  /** Piles before each recent draw or shuffle, oldest first, for undo: a whole Spawn step undoes at once. */
  history: Piles[];
  /** Chosen by the players, who track their own XP. */
  danger: DangerLevel;
  /** Spawn Zones on the board: each draw deals one card to each of them. */
  zones: number;
};
