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

export type UniverseId = 'modern' | 'fantasy' | 'invader' | 'western';

export type NamedModernAbomination =
  | 'hobomination'
  | 'abominawild'
  | 'abominacop'
  | 'patientZero'
  | 'abombAbomination'
  | 'berserkerAbomination'
  | 'toxicAbomination'
  | 'homelander'
  | 'aTrain'
  | 'blackNoir'
  | 'queenMaeve'
  | 'soldierBoy'
  | 'theDeep'
  | 'starlight'
  | 'translucent'
  | 'alphaVampire'
  | 'wendigo'
  | 'leviathan'
  | 'blackDog'
  | 'crowley'
  | 'archangelMichael'
  | 'zuul'
  | 'vinzClortho'
  | 'stayPuft'
  | 'gozer'
  | 'nudeOrganist'
  | 'undeadParrot'
  | 'gumbys'
  | 'theFoot'
  | 'fishSlappingDancer'
  | 'hellsGrannies'
  | 'greenwichCrew'
  | 'spam'
  | 'eddieAsylum'
  | 'eddieOriginal'
  | 'eddieCyborg'
  | 'eddieMummy'
  | 'eddieUndead'
  | 'eddieTrooper'
  | 'eddieBassist'
  | 'eddieReaper'
  | 'eddieFear'
  | 'eddieWicker'
  | 'eddiePharaoh'
  | 'eddieKiller'
  | 'batabomination'
  | 'bigfoot'
  | 'cthulhu'
  | 'bearmanboar'
  | 'lankyman'
  | 'actualCannibal'
  | 'sewerCrocodile'
  | 'killerClown'
  | 'chupacabra'
  | 'abductor'
  | 'batmanEarth12'
  | 'batmanEarth44'
  | 'batmanWhoLaughs'
  | 'theRobins'
  | 'loboBatman'
  | 'batmanEarth1'
  | 'batmanEarth11'
  | 'batmanEarth32'
  | 'batmanEarth52';

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

export type ModernCard =
  | SpawnCard<'spawn', ZombieType>
  | SpawnCard<'rush', RushZombie>
  | { id: string; setId: string; kind: 'extra'; zombie: ExtraZombie }
  | { id: string; setId: string; kind: 'trejo' }
  | { id: string; setId: string; kind: 'trejoRush' }
  | { id: string; setId: string; kind: 'spam' };

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
  | 'wdWalker'
  | 'wdRunner'
  | 'wdBrute'
  | 'khanAbomination'
  | 'eeWalker'
  | 'eeRunner'
  | 'eeBrute'
  | 'wardenBrute'
  | 'godEaterAbomination'
  | 'ratz'
  | 'ratKing'
  | SpawnedZombie
  | NamedAbomination;
/** Zombies of the Kickstarter packs, spawned by count like the Walkers of the core boxes. */
export type SpawnedZombie =
  | 'fantasyBerserkerWalker'
  | 'deadboltWalker'
  | 'terrorcottaWalker'
  | 'climber'
  | 'footNinja';
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
  | 'magentaCovfefe'
  | 'vaultWarden'
  | 'werezombie'
  | 'chromatiz'
  | 'abominalpha'
  | 'abominarat'
  | 'swampTroll'
  | 'necromanticDragon'
  | 'amaterasu'
  | 'asura'
  | 'bishamon'
  | 'chimimoryo'
  | 'hachiman'
  | 'kijin'
  | 'kumiho'
  | 'nian'
  | 'qilin'
  | 'redHare'
  | 'shakokiDogu'
  | 'sojobo'
  | 'susanoWo'
  | 'takemikazuchi'
  | 'toyol'
  | 'yeti'
  | 'divineBeast'
  | 'vermillionBird'
  | 'whiteTiger'
  | 'blackTortoise'
  | 'azureDragon'
  | 'reaper'
  | 'baalberith'
  | 'horseman'
  | 'queenCaenedra'
  | 'hugBear'
  | 'banshee'
  | 'cerberus'
  | 'lordJanas'
  | 'marike'
  | 'bebop'
  | 'rocksteady'
  | 'pharaohEddie'
  | 'samuraiEddie'
  | 'mummyEddie'
  | 'wickerManEddie'
  | 'fearEddie'
  | 'dongZhuo'
  // Lord of Skulls' escort: no card of their own (`LORD_OF_SKULLS_ESCORT`, threat.ts).
  | 'doom'
  | 'gloom';
export type FantasyActivated =
  | 'fantasyWalker'
  | 'fantasyRunner'
  | 'fantasyFatty'
  | 'orcWalker'
  | 'orcRunner'
  | 'orcFatty'
  | 'wdWalker'
  | 'wdRunner'
  | 'wdBrute'
  | 'eeWalker'
  | 'eeRunner'
  | 'eeBrute';
/** Necromancers with a name: the normal Necromancer rules, plus one of their own. */
export type NamedNecromancer =
  | 'countTemeraire'
  | 'queenSevera'
  | 'ratKing'
  | 'bomoh'
  | 'deathNotes'
  | 'hannya'
  | 'kaguya'
  | 'tengu'
  | 'yukiOnna'
  | 'toMeKuPa'
  | 'blackheart'
  | 'ostokar'
  | 'evilTroy'
  | 'queenMedea'
  | 'grin'
  | 'erikSummoner'
  | 'innsmouth'
  | 'faolan'
  | 'lordOfSkulls'
  | 'erinn'
  | 'grandVizier'
  | 'theSparrow'
  | 'mummRa'
  | 'reaperEddie'
  | 'shamanEddie'
  | 'zhangJiao'
  | 'fumaKotaro'
  | 'shredder';
export type FantasyNecromancer = 'necromancer' | 'orcNecromancer' | 'defilerNecromancer' | NamedNecromancer;

/** Title printed on a fantasy spawn card when it is not the core box one ("Zombies Invasion", "Assemble the HORDE!"). */
export type FantasyTitle =
  | 'wolfzInvasion'
  | 'npcInvasion'
  | 'deadeyeWalkers'
  | 'murderOfCrowz'
  | 'taintHorde'
  | 'spectralWalkers'
  | 'swarmOfRatz'
  /** The zombie type its levels spawn, as White Death prints "Walkers". */
  | 'zombies'
  | 'named';

/** A line printed under the Danger Levels of some cards ("All Terrorcotta Walker groups under 5 are set to 5!"). */
export type FantasyNote = 'terrorcottaNote' | 'footNinjasNote';

/** What one Danger Level of a fantasy card spawns; `null` is "Nothing in sight!". */
export type FantasyLevel = { zombie: FantasyZombie; count: number } | null;

type FantasyBase = { id: string; setId: string };
/** `horde`: Green Horde sets one more zombie of the type aside at each level (not for an Abomination). */
export type FantasyCard =
  | (FantasyBase & {
      kind: 'levels';
      levels: readonly [FantasyLevel, FantasyLevel, FantasyLevel, FantasyLevel];
      horde?: true;
      title?: FantasyTitle;
      /** The named zombie pictured above levels that spawn others (the Rat King and his Swarms of Ratz). */
      boss?: FantasyZombie;
      /** One more zombie the card adds, printed under the levels (Eternal Empire: "Add 1 Warden Brute."). */
      adds?: FantasyZombie;
      /** The rule printed under the levels, when it is not one extra zombie. */
      note?: FantasyNote;
      /** A named zombie printed in the plural ("Divine Beasts"), with "Nothing" at Blue: no "!" after its name. */
      plural?: true;
    })
  | (FantasyBase & { kind: 'activation'; zombie: FantasyActivated })
  | (FantasyBase & { kind: 'necromancer'; zombie: FantasyNecromancer })
  | (FantasyBase & { kind: 'doubleSpawn' })
  | (FantasyBase & { kind: 'enterHorde' })
  /** White Death "Abomination!" and "Necromancer!": draw from that boss deck, or its boss on the board gets an Extra Activation. */
  | (FantasyBase & { kind: 'bossCall'; boss: BossKind; chi?: true })
  | (FantasyBase & { kind: 'zombieSiege' });

export type InvaderXeno =
  | 'worker'
  | 'tank'
  | 'hunter'
  | 'drillerWorker'
  | 'drillerTank'
  | 'drillerHunter'
  | 'drillerBlitzer'
  | 'flinger'
  | 'seekerWorker'
  | 'xenomoth'
  | 'biter';
export type InvaderAbomination =
  | 'spoilerAbomination'
  | 'drillerAbomination'
  | 'juggernaut'
  | 'babyface'
  | 'buddyBot'
  | 'irisSentryGun'
  | 'motherInLaw'
  | 'shadow'
  | 'stomper'
  | 'widowmaker'
  | 'broodMother'
  | 'xeniumHorror'
  | 'thraex'
  | 'gutslug'
  | 'stepmother'
  | 'shaila'
  | 'dimbutcher'
  | 'synkrasis'
  | 'cyborgEddieAbomination'
  | 'samuraiEddieAbomination'
  | 'bassistEddieAbomination'
  | 'bountyHunterEddieAbomination';
export type InvaderZone = 'mold' | 'pit';

type InvaderBase = { id: string; setId: string };
/** Card ids are `<setId>-<printed number on 3 digits>`; two sets may share a number. */
export type InvaderCard =
  | (InvaderBase & { kind: 'xeno'; zombie: InvaderXeno; counts: SpawnCounts })
  /** No levels: Abominations on the board get an Activation, then this one spawns; `spawnZone` adds a third step. */
  | (InvaderBase & { kind: 'xenoAbomination'; zombie: InvaderAbomination; spawnZone?: true })
  /** No levels: `count` Xenos on each Active Mold Zone / in each Open Pit Zone. */
  | (InvaderBase & { kind: 'zoneSpawn'; zone: InvaderZone; zombie: InvaderXeno; count: number })
  /** All Xenos of this type on Red, Orange and Yellow get an Activation; no one on Blue. */
  | (InvaderBase & { kind: 'xenoExtra'; zombie: InvaderXeno });

export type WesternZombie = 'westernWalker' | 'westernRunner' | 'westernBrute' | 'longDeadWalker';
export type WesternActivated = 'westernWalker' | 'westernRunner' | 'westernBrute';
/** `westernWendigo` is not the Modern `wendigo`. */
export type WesternAbomination =
  | 'bowlerHat'
  | 'nightmareHorse'
  | 'abominape'
  | 'crocosaur'
  | 'abominabear'
  | 'texasDeadhorn'
  | 'bizon'
  | 'bloodBull'
  | 'littleTrickster'
  | 'goreGeyser'
  | 'meltingPot'
  | 'plymouthHound'
  | 'pusbag'
  | 'greatTrickster'
  | 'cactusQueen'
  | 'alphaBane'
  | 'deathgrasp'
  | 'fatMace'
  | 'swampTongue'
  | 'rottenClaw'
  | 'westernWendigo'
  | 'steamMonster'
  | 'westernUndeadEddie'
  | 'westernTrooperEddie'
  | 'westernShamanEddie'
  | 'westernAsylumEddie'
  | 'westernBountyHunterEddie'
  | 'westernFearEddie'
  | 'westernWickerEddie';

type WesternBase = { id: string; setId: string };
/** Card ids are `<setId>-<printed number on 3 digits>`. */
export type WesternCard =
  | (WesternBase & { kind: 'westernSpawn'; zombie: WesternZombie; counts: SpawnCounts })
  /** The text card, no levels: it calls on the Abomination deck (the generic Abomination of the core box). */
  | (WesternBase & { kind: 'westernAbomination' })
  /** All zombies of this type on Red, Orange and Yellow get an Activation; no one on Blue. */
  | (WesternBase & { kind: 'westernExtra'; zombie: WesternActivated });

export type ZombieCard = ModernCard | FantasyCard | InvaderCard | WesternCard;

const FANTASY_KINDS: ReadonlySet<ZombieCard['kind']> = new Set([
  'levels',
  'activation',
  'necromancer',
  'doubleSpawn',
  'enterHorde',
  'bossCall',
  'zombieSiege',
]);
export const isFantasyCard = (card: ZombieCard): card is FantasyCard => FANTASY_KINDS.has(card.kind);

const INVADER_KINDS: ReadonlySet<ZombieCard['kind']> = new Set(['xeno', 'xenoAbomination', 'zoneSpawn', 'xenoExtra']);
export const isInvaderCard = (card: ZombieCard): card is InvaderCard => INVADER_KINDS.has(card.kind);

const WESTERN_KINDS: ReadonlySet<ZombieCard['kind']> = new Set(['westernSpawn', 'westernAbomination', 'westernExtra']);
export const isWesternCard = (card: ZombieCard): card is WesternCard => WESTERN_KINDS.has(card.kind);

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
  /** Upgrade kit Abominations: never switched on by hand, the deck takes the share of zombie expansions in play. */
  scaled?: true;
  /** Harder part of the set, as the core rulebook sorts its deck; the other cards are the easier part. */
  isHard: (card: ZombieCard) => boolean;
  cards: readonly ZombieCard[];
};

export type CardPart = 'easy' | 'hard' | 'extra';
export type DeckParts = { easy: boolean; hard: boolean; extra: boolean };

export type BossKind = 'abomination' | 'necromancer';
export type BossDeck = { draw: string[]; discard: string[] };
/** Dead Men Tales boss decks; `revealed` holds the boss revealed for each card of `drawn`. */
/** `boss` is empty when every boss of the deck is already on display: the ones on the board get an Extra Activation. */
export type Revealed = {
  kind: BossKind;
  boss: string;
  /** One at a time, with `boss` empty: the boss in play that gets the Extra Activation (no card was drawn). */
  activates?: string;
  /** Cantrip cards (SPAM) drawn on the way to `boss`: they leave with it. Absent in Fantasy. */
  spam?: string[];
  along?: string[];
  /** Candidates of a boss that absorbs others (Gozer): `keep` of the `offered` ones stay, until the players choose. */
  choice?: { offered: string[]; keep: number };
  gained?: string[];
  /** Abomination Fest: the bosses in play that get an Extra Activation before this card draws its own. */
  activated?: string[];
  /** No boss of this kind is left on the board or on display (the one named was removed); not the same as the deck being out. */
  none?: true;
  /**
   * The Trejobomination (Danny Trejo, `Piles.trejo`) also gets the Extra Activation of this Abomination card: alone, with
   * `boss` empty, or beside `activates` (named boss) or a newly revealed boss. Abomination groups only.
   */
  trejo?: true;
  /** Bosses of this group (`boss`, `along`, `gained`) the players removed during the Spawn step: they are already in the discard. */
  gone?: string[];
};
export type BoardBoss = { kind: BossKind; boss: string };
export const NO_BOSS = '';
/** `boss` when the game never had a boss of that kind (an empty deck from the start, not an exhausted one). */
export const NO_DECK = '-';
export type BossPiles = {
  abomination: BossDeck;
  necromancer: BossDeck;
  revealed: Record<string, Revealed>;
  /** Abominations drawn by hand, not by a card: they leave with the next Spawn step. Empty in Fantasy. */
  manual: Revealed[];
  /** Bosses of earlier Spawn steps still alive, oldest first, each on its own; none is in a deck. */
  onBoard: BoardBoss[];
};
export type BossRule = 'oneAtATime' | 'fest';

/**
 * Danny Trejo: where the Trejo of the board stands. A Trejo card spawns a Trejo Walker when there is none, turns it into
 * the Trejobomination when there is one, and gives the Trejobomination an Extra Activation when it is there. The
 * Trejobomination is not a boss of `Piles.bosses`.
 */
export type TrejoStage = 'none' | 'walker' | 'abomination';
/** Which of the three choices (1 Activate, 2 Transform, 3 Spawn) a Trejo card of `drawn` resolved to. */
export type TrejoChoice = 1 | 2 | 3;
export type TrejoPiles = { stage: TrejoStage; resolved: Record<string, TrejoChoice> };

export type Piles = {
  draw: string[];
  discard: string[];
  drawn: string[];
  reshuffled: boolean;
  /** Only with boss decks (`GameState.bossRule`); `null` when the deck holds its bosses. */
  bosses: BossPiles | null;
  /** Trejo of the board and what each Trejo card on display resolved to. */
  trejo: TrejoPiles;
};

export type GameState = {
  version: 9;
  /** Boss decks in play and how their bosses arrive; `null`: the bosses are cards of the Zombie deck. */
  bossRule: BossRule | null;
  universe: UniverseId;
  setIds: string[];
  piles: Piles;
  /** Piles before each recent draw or shuffle, oldest first, for undo: a whole Spawn step undoes at once. */
  history: Piles[];
  danger: DangerLevel;
  zones: number;
};
