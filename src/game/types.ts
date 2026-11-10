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
export type UniverseId = 'modern' | 'fantasy';

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

/** Cards of the modern era: one zombie type per card, a count per Danger Level. */
export type ModernCard =
  | SpawnCard<'spawn', ZombieType>
  | SpawnCard<'rush', RushZombie>
  | { id: string; setId: string; kind: 'extra'; zombie: ExtraZombie }
  | { id: string; setId: string; kind: 'trejo' }
  | { id: string; setId: string; kind: 'trejoRush' }
  | { id: string; setId: string; kind: 'spam' };

/** Zombies of the fantasy era (Black Plague, Green Horde). */
export type FantasyZombie =
  | 'fantasyWalker'
  | 'fantasyRunner'
  | 'fantasyFatty'
  | 'fantasyAbomination'
  | 'orcWalker'
  | 'orcRunner'
  | 'orcFatty'
  | 'orcAbomination'
  | 'wolfz'
  | 'wolfbomination'
  | 'npcWalker'
  | 'deadeyeWalker'
  | 'crowz'
  | 'taintedWalker'
  | 'taintedAbomination'
  | 'spectralWalker'
  | 'ratz'
  | 'ratKing'
  | NamedAbomination;
/** Abominations with a name, printed as a picture across the levels instead of a count. */
export type NamedAbomination =
  | 'ablobination'
  | 'abominatroll'
  | 'abominotaur'
  | 'feralDragon'
  | 'fattyBurster'
  | 'zombieGiant'
  | 'gorgomination'
  | 'hordeBrother'
  | 'siegeBreaker'
  | 'swampLurker'
  | 'abominabunny'
  | 'magentaCovefe'
  | 'vaultWarden'
  | 'werezombie'
  | 'chromatiz'
  | 'abominalpha'
  | 'abominarat'
  | 'swampTroll'
  | 'necromanticDragon';
/** Zombies an Extra Activation card can name. */
export type FantasyActivated = 'fantasyWalker' | 'fantasyRunner' | 'fantasyFatty' | 'orcWalker' | 'orcRunner' | 'orcFatty';
/** Necromancers with a name: the normal Necromancer rules, plus one of their own. */
export type NamedNecromancer =
  | 'countTemeraire'
  | 'queenSevera'
  | 'ratKing'
  | 'toMeKuPa'
  | 'blackheart'
  | 'ostokar'
  | 'evilTroy'
  | 'queenMedea'
  | 'grin'
  | 'erikSummoner'
  | 'innsmouth'
  | 'faolan'
  | 'lordOfSkulls';
export type FantasyNecromancer = 'necromancer' | 'orcNecromancer' | NamedNecromancer;

/** Title printed on a fantasy spawn card when it is not the core box one ("Zombies Invasion", "Assemble the HORDE!"). */
export type FantasyTitle =
  | 'wolfzInvasion'
  | 'npcInvasion'
  | 'deadeyeWalkers'
  | 'murderOfCrowz'
  | 'taintHorde'
  | 'spectralWalkers'
  | 'swarmOfRatz'
  | 'named';

/** What one Danger Level of a fantasy card spawns; `null` is "Nothing in sight!". */
export type FantasyLevel = { zombie: FantasyZombie; count: number } | null;

type FantasyBase = { id: string; setId: string };
/**
 * Cards of the fantasy era. Unlike the modern ones, each Danger Level of a spawn card can bring a different zombie
 * type. `horde` is the Horde symbol of Green Horde: each level also sets one more zombie of its type aside for the
 * Horde (not for an Abomination).
 */
export type FantasyCard =
  | (FantasyBase & {
      kind: 'levels';
      levels: readonly [FantasyLevel, FantasyLevel, FantasyLevel, FantasyLevel];
      horde?: true;
      title?: FantasyTitle;
      /** The named zombie pictured above levels that spawn others (the Rat King and his Swarms of Ratz). */
      boss?: FantasyZombie;
    })
  | (FantasyBase & { kind: 'activation'; zombie: FantasyActivated })
  | (FantasyBase & { kind: 'necromancer'; zombie: FantasyNecromancer })
  | (FantasyBase & { kind: 'doubleSpawn' })
  | (FantasyBase & { kind: 'enterHorde' });

export type ZombieCard = ModernCard | FantasyCard;

const FANTASY_KINDS: ReadonlySet<ZombieCard['kind']> = new Set(['levels', 'activation', 'necromancer', 'doubleSpawn', 'enterHorde']);
export const isFantasyCard = (card: ZombieCard): card is FantasyCard => FANTASY_KINDS.has(card.kind);

export type CardSet = {
  id: string;
  /** Expansions and promos are switched on in the options; the rest is always in the deck. */
  optional: boolean;
  /** A core box that can be played alone: a universe made of several needs at least one switched on. */
  core?: true;
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

/** Which boss deck a drawn card calls on: the Abomination it spawns, or the Necromancer. */
export type BossKind = 'abomination' | 'necromancer';
/** A deck of bosses (zombie ids), one card per boss, drawn and reshuffled like the Zombie deck. */
export type BossDeck = { draw: string[]; discard: string[] };
/**
 * The Abomination and Necromancer decks of the Dead Men Tales rules: a drawn card that spawns one of them reveals
 * which, from its deck. `revealed` holds the boss revealed for each card of `drawn`.
 */
/** `boss` is empty when every boss of the deck is already on display: the ones on the board get an Extra Activation. */
export type Revealed = { kind: BossKind; boss: string };
export const NO_BOSS = '';
export type BossPiles = { abomination: BossDeck; necromancer: BossDeck; revealed: Record<string, Revealed> };
/** Dead Men Tales: one Abomination at a time (the one on the board gets an Extra Activation), or the Abomination Fest. */
export type BossRule = 'oneAtATime' | 'fest';

export type Piles = {
  draw: string[];
  discard: string[];
  /** Cards of the last Spawn step, in Spawn Zone order; they go to the discard on the next draw. */
  drawn: string[];
  reshuffled: boolean;
  /** Only with boss decks (`GameState.bossRule`); `null` when the deck holds its bosses. */
  bosses: BossPiles | null;
};

export type GameState = {
  version: 4;
  /** Boss decks in play and how their bosses arrive; `null`: the bosses are cards of the Zombie deck. */
  bossRule: BossRule | null;
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
