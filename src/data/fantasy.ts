import type {
  BossKind,
  CardSet,
  FantasyActivated,
  FantasyCard,
  FantasyLevel,
  FantasyNecromancer,
  FantasyTitle,
  FantasyZombie,
  FantasyNote,
  NamedAbomination,
  NamedNecromancer,
  SpawnedZombie,
  ZombieCard,
} from '../game/types';

// Checked card by card against the printed cards. Levels run Blue to Red (printed Red first):
// a zombie letter and a count ("W5"), "A" for the Abomination, "-" for "Nothing in sight!".

const BLACK_PLAGUE = 'blackPlague';
const GREEN_HORDE = 'greenHorde';
const WULFSBURG = 'wulfsburg';
const NPC_1 = 'npc1';
const NPC_2 = 'npc2';
const DEADEYE = 'deadeyeWalkers';
// Not "crowz": the modern Murder of Crowz already has that id.
const FANTASY_CROWZ = 'fantasyCrowz';
const ZOMBIE_BOSSES = 'zombieBosses';
const FRIENDS_AND_FOES = 'friendsAndFoes';
const HORDE_BOX = 'hordeBox';
const NO_REST = 'noRestForTheWicked';
const SPECIAL_GUESTS = 'specialGuests';
const RAT_KING = 'ratKingSwampTroll';
const WHITE_DEATH = 'whiteDeath';
const ETERNAL_EMPIRE = 'eternalEmpire';
// Printed after Eternal Empire; their numbers overlap, which the set prefix of the ids keeps apart.
const MASSIVE_DARKNESS_2 = 'massiveDarkness2';
const THUNDERCATS = 'thundercats';
const COMPAGNIA = 'compagniaDellaForca';
const IRON_MAIDEN = 'ironMaiden';
const COMIC_BOOK_EXTRAS_2 = 'comicBookExtras2';
const TIMECRASH = 'timecrash';
const BERSERKER_WALKERS = 'berserkerWalkers';
const CLIMBERS_TERRORCOTTA = 'climbersTerrorcotta';
const CROSSFIRE = 'crossfirePack';
const BEBOP_ROCKSTEADY = 'bebopRocksteady';
const DIVINE_BEASTS = 'divineBeasts';

type Letter = 'W' | 'R' | 'F' | 'A';
/** The zombies a set prints; a letter it has none of cannot be read. */
type Zombies = Partial<Record<Letter, FantasyZombie>>;
const STANDARD: Zombies = {
  W: 'fantasyWalker',
  R: 'fantasyRunner',
  F: 'fantasyFatty',
  A: 'fantasyAbomination',
};
const ORC: Zombies = { W: 'orcWalker', R: 'orcRunner', F: 'orcFatty', A: 'orcAbomination' };
const WOLFZ: Zombies = { W: 'wolfz', A: 'wolfbomination' };
const NPC: Zombies = { W: 'npcWalker' };
const DEADEYE_WALKERS: Zombies = { W: 'deadeyeWalker' };
const CROWZ: Zombies = { W: 'crowz' };
const TAINTED: Zombies = { W: 'taintedWalker', A: 'taintedAbomination' };
const SPECTRAL: Zombies = { W: 'spectralWalker' };
const RATZ: Zombies = { W: 'ratz' };
// White Death prints "Brutes" for "Fatty".
const WHITE_DEATH_ZOMBIES: Zombies = { W: 'wdWalker', R: 'wdRunner', F: 'wdBrute' };

function level(spec: string, zombies: Zombies): FantasyLevel {
  if (spec === '-') return null;
  if (spec === 'A' && zombies.A) return { zombie: zombies.A, count: 1 };
  const match = /^([WRF])([1-9]\d*)$/.exec(spec);
  if (!match) throw new Error(`Unreadable level "${spec}"`);
  const [, letter, count] = match;
  const zombie = zombies[letter as Letter];
  if (!zombie) throw new Error(`No zombie "${letter}" in this set: "${spec}"`);
  return { zombie, count: Number(count) };
}

type Specs = readonly [string, string, string, string];

const levels = (
  setId: string,
  id: string,
  specs: Specs,
  zombies: Zombies,
  extra: { horde?: true; title?: FantasyTitle; boss?: FantasyZombie; adds?: FantasyZombie; note?: FantasyNote; plural?: true } = {},
): FantasyCard => ({
  id: `${setId}-${id}`,
  setId,
  kind: 'levels',
  levels: [level(specs[0], zombies), level(specs[1], zombies), level(specs[2], zombies), level(specs[3], zombies)],
  ...extra,
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

// As printed: the Horde symbol's extra zombie is not counted (the fan wiki adds it). #179-#190 come back as #191-#202.
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
  ...GREEN_HORDE_SPAWNS.map((specs, i) => levels(GREEN_HORDE, number(167 + i), specs, ORC, { horde: true })),
  ...GREEN_HORDE_TWINS.map((specs, i) => levels(GREEN_HORDE, number(179 + i), specs, ORC, { horde: true })),
  ...GREEN_HORDE_TWINS.map((specs, i) => levels(GREEN_HORDE, number(191 + i), specs, ORC, { horde: true })),
  activation(GREEN_HORDE, '203', 'orcWalker'),
  activation(GREEN_HORDE, '204', 'orcWalker'),
  activation(GREEN_HORDE, '205', 'orcFatty'),
  activation(GREEN_HORDE, '206', 'orcRunner'),
  ...copies(207, 6, (id) => necromancer(GREEN_HORDE, id, 'orcNecromancer')),
  ...copies(213, 8, (id) => special(GREEN_HORDE, id, 'enterHorde')),
];

// Wulfsburg: #055-#057 come back as #058-#060, then two Wolfbominations.
const WOLFZ_SPAWNS: readonly Specs[] = [
  ['W1', 'W2', 'W3', 'W4'], // 055 and 058
  ['W2', 'W3', 'W4', 'W5'],
  ['W3', 'W4', 'W5', 'W6'], // 057 and 060
];
const wulfsburgCards: ZombieCard[] = [
  ...[...WOLFZ_SPAWNS, ...WOLFZ_SPAWNS].map((specs, i) => levels(WULFSBURG, number(55 + i), specs, WOLFZ, { title: 'wolfzInvasion' })),
  ...copies(61, 2, (id) => levels(WULFSBURG, id, ['-', 'A', 'A', 'A'], WOLFZ, { title: 'named' })),
];

// N.P.C. 1 and 2 print the same four cards in turn, three times each (the fan wiki has #064 and #065 wrong).
const NPC_SPAWNS: readonly Specs[] = [
  ['-', 'W4', 'W4', 'W5'], // 063, 067, 071; 075, 079, 083
  ['W1', 'W1', 'W6', 'W7'],
  ['W1', 'W2', 'W2', 'W8'],
  ['W2', 'W3', 'W4', 'W4'], // 066, 070, 074; 078, 082, 086
];
const npcCards = (setId: string, first: number): ZombieCard[] =>
  Array.from({ length: 12 }, (_, i) => levels(setId, number(first + i), NPC_SPAWNS[i % 4], NPC, { title: 'npcInvasion' }));

// Deadeye Walkers: #099-#101 come back as #102-#104.
const DEADEYE_SPAWNS: readonly Specs[] = [
  ['W1', 'W2', 'W3', 'W4'], // 099 and 102
  ['W2', 'W3', 'W4', 'W5'],
  ['W3', 'W4', 'W5', 'W6'], // 101 and 104
];
const deadeyeCards: ZombieCard[] = [...DEADEYE_SPAWNS, ...DEADEYE_SPAWNS].map((specs, i) =>
  levels(DEADEYE, number(99 + i), specs, DEADEYE_WALKERS, { title: 'deadeyeWalkers' }),
);

// Murder of Crowz: twelve identical cards.
const crowzCards: ZombieCard[] = copies(105, 12, (id) =>
  levels(FANTASY_CROWZ, id, ['W2', 'W3', 'W4', 'W5'], CROWZ, { title: 'murderOfCrowz' }),
);

/** Named Abominations spawn at Yellow to Red; `atBlue` cards print no Blue text and spawn at every level. */
const namedAbomination = (setId: string, id: string, zombie: NamedAbomination, atBlue = false): FantasyCard =>
  levels(setId, id, [atBlue ? 'A' : '-', 'A', 'A', 'A'], { A: zombie }, { title: 'named' });
/** Boss, set, first printed number, copies, and how many of the first copies spawn at Blue too. */
const NAMED_ABOMINATIONS: readonly (readonly [NamedAbomination, string, number, number, number?])[] = [
  ['ablobination', 'zombieBosses', 87, 4],
  ['abominatroll', 'zombieBosses', 91, 4],
  ['abominotaur', 'zombieBosses', 95, 4],
  ['abominalpha', SPECIAL_GUESTS, 117, 4],
  ['abominarat', SPECIAL_GUESTS, 121, 4],
  ['necromanticDragon', NO_REST, 221, 8],
  ['feralDragon', 'hordeBox', 285, 8],
  ['fattyBurster', 'hordeBox', 293, 6],
  ['zombieGiant', 'hordeBox', 299, 4],
  ['gorgomination', 'hordeBox', 303, 4],
  ['hordeBrother', 'hordeBox', 307, 4],
  ['siegeBreaker', 'hordeBox', 311, 4],
  ['swampLurker', 'hordeBox', 315, 4],
  ['abominabunny', 'hordeBox', 319, 4],
  ['magentaCovfefe', 'hordeBox', 323, 4],
  ['vaultWarden', 'hordeBox', 327, 4],
  ['werezombie', 'hordeBox', 331, 4],
  ['chromatiz', 'hordeBox', 347, 4],
  ['swampTroll', RAT_KING, 357, 4],
  // Massive Darkness 2: seven bosses, four cards each.
  ['reaper', MASSIVE_DARKNESS_2, 361, 4],
  ['baalberith', MASSIVE_DARKNESS_2, 365, 4],
  ['horseman', MASSIVE_DARKNESS_2, 369, 4],
  ['queenCaenedra', MASSIVE_DARKNESS_2, 373, 4],
  ['hugBear', MASSIVE_DARKNESS_2, 377, 4],
  ['banshee', MASSIVE_DARKNESS_2, 381, 4],
  ['cerberus', MASSIVE_DARKNESS_2, 385, 4],
  ['lordJanas', COMIC_BOOK_EXTRAS_2, 409, 4],
  ['marike', COMIC_BOOK_EXTRAS_2, 413, 4],
  ['bebop', BEBOP_ROCKSTEADY, 583, 3, 3],
  ['rocksteady', BEBOP_ROCKSTEADY, 586, 3, 3],
];
const namedCards = (setId: string) =>
  NAMED_ABOMINATIONS.filter(([, set]) => set === setId).flatMap(([zombie, , first, count, atBlue = 0]) =>
    copies(first, count, (id) => namedAbomination(setId, id, zombie, Number(id) < first + atBlue)),
  );
const namedNecromancers = (setId: string, first: number, zombie: NamedNecromancer, count = 6) =>
  copies(first, count, (id) => necromancer(setId, id, zombie));

// Not in the table above (see `eddie`).
const IRON_MAIDEN_ABOMINATIONS: readonly NamedAbomination[] = [
  'pharaohEddie', 'samuraiEddie', 'mummyEddie', 'wickerManEddie', 'fearEddie',
];
/** Zombies printed without a count: their picture stands for one. */
export const NAMED_ZOMBIES: ReadonlySet<FantasyZombie> = new Set([
  'wolfbomination',
  ...NAMED_ABOMINATIONS.map(([zombie]) => zombie),
  ...IRON_MAIDEN_ABOMINATIONS,
  'divineBeast',
]);
/** Named zombies that are not Abominations by the rules. */
const NOT_ABOMINATIONS: ReadonlySet<FantasyZombie> = new Set([
  'fattyBurster',
  'feralDragon',
  'zombieGiant',
  'necromanticDragon',
  'divineBeast',
]);
export const ABOMINATIONS: ReadonlySet<FantasyZombie> = new Set([
  'fantasyAbomination',
  'orcAbomination',
  'taintedAbomination',
  'khanAbomination',
  'godEaterAbomination',
  ...[...NAMED_ZOMBIES].filter((zombie) => !NOT_ABOMINATIONS.has(zombie)),
]);
/** Bosses with a rule (`card.<id>Rule`) shown when revealed; the groups at the end come from the sources noted. */
export const BOSS_RULE_IDS = [
  'fantasyAbomination',
  'orcAbomination',
  'taintedAbomination',
  'wolfbomination',
  'ablobination',
  'abominatroll',
  'abominotaur',
  'abominalpha',
  'abominarat',
  'gorgomination',
  'hordeBrother',
  'siegeBreaker',
  'swampLurker',
  'abominabunny',
  'magentaCovfefe',
  'vaultWarden',
  'werezombie',
  'chromatiz',
  'swampTroll',
  'feralDragon',
  'necromanticDragon',
  'zombieGiant',
  'khanAbomination',
  'godEaterAbomination',
  'defilerNecromancer',
  'amaterasu',
  'asura',
  'bishamon',
  'chimimoryo',
  'hachiman',
  'kijin',
  'kumiho',
  'nian',
  'qilin',
  'redHare',
  'shakokiDogu',
  'sojobo',
  'susanoWo',
  'takemikazuchi',
  'toyol',
  'yeti',
  'bomoh',
  'deathNotes',
  'hannya',
  'kaguya',
  'tengu',
  'yukiOnna',
  'toMeKuPa',
  'blackheart',
  'ostokar',
  'evilTroy',
  'queenMedea',
  'grin',
  'erikSummoner',
  'innsmouth',
  'faolan',
  'lordOfSkulls',
  'countTemeraire',
  'queenSevera',
  'ratKing',
  'erinn',
  'grandVizier',
  'theSparrow',
  'mummRa',
  'reaperEddie',
  'shamanEddie',
  'dongZhuo',
  'zhangJiao',
  'fumaKotaro',
  // Massive Darkness 2 "Heroes and Enemies in Zombicide Fantasy" sheet.
  'reaper',
  'baalberith',
  'horseman',
  'queenCaenedra',
  'hugBear',
  'banshee',
  'cerberus',
  // Fan wiki.
  'lordJanas',
  'marike',
  'bebop',
  'rocksteady',
  'pharaohEddie',
  'samuraiEddie',
  'mummyEddie',
  'wickerManEddie',
  'fearEddie',
  // Doom and Gloom have no card: their rule comes with the Lord of Skulls (fan wiki).
  'doom',
  'gloom',
  // Divine Beasts reference cards, which win over the rulebook ("Combat Action" and "2 hits in a single Melee Action" for the White Tiger).
  'vermillionBird',
  'whiteTiger',
  'blackTortoise',
  'azureDragon',
  // Timecrash rulebook p.3 and p.8.
  'shredder',
] as const;
/** The Divine Beasts card stands for the chain of beasts, each with its own rule above. */
export const BOSSES_WITHOUT_RULE = ['divineBeast'] as const;
export type BossRuleId = (typeof BOSS_RULE_IDS)[number];
/** Necromancers with a name: the normal Necromancer rules, plus one of their own. */
export const NAMED_NECROMANCERS: ReadonlySet<FantasyNecromancer> = new Set<NamedNecromancer>([
  'countTemeraire',
  'queenSevera',
  'ratKing',
  'toMeKuPa',
  'blackheart',
  'ostokar',
  'evilTroy',
  'queenMedea',
  'grin',
  'erikSummoner',
  'innsmouth',
  'faolan',
  'lordOfSkulls',
  'bomoh',
  'deathNotes',
  'hannya',
  'kaguya',
  'tengu',
  'yukiOnna',
  'erinn',
  'grandVizier',
  'theSparrow',
  'mummRa',
  'reaperEddie',
  'shamanEddie',
  'zhangJiao',
  'fumaKotaro',
  'shredder',
]);
/** Necromancers whose card does not start with "Normal Necromancer rules". */
export const PLAIN_RULE_NECROMANCERS: ReadonlySet<FantasyNecromancer> = new Set<NamedNecromancer>(['mummRa', 'zhangJiao', 'fumaKotaro', 'shredder']);

// Friends and Foes: as printed (the fan wiki adds the Horde zombie to most counts).
const TAINTED_SPAWNS: readonly Specs[] = [
  ['A', 'W1', 'W5', 'W2'], // 253
  ['W2', 'A', 'W1', 'W3'],
  ['W2', 'W1', 'A', 'W6'], // 255
  ['W1', 'W3', 'W2', 'A'],
  ['W1', 'W2', 'W3', 'W6'],
  ['W1', 'W1', 'W4', 'W5'],
  ['W1', 'W4', 'W2', 'W3'],
  ['W1', 'W1', 'W6', 'W2'], // 260
  ['W1', 'W2', 'W2', 'W8'],
  ['W1', 'W2', 'W2', 'W7'],
  ['W1', 'W4', 'W4', 'W3'],
  ['W1', 'W3', 'W5', 'W3'], // 264
];
const friendsAndFoesCards: ZombieCard[] = [
  ...TAINTED_SPAWNS.map((specs, i) =>
    levels(FRIENDS_AND_FOES, number(253 + i), specs, TAINTED, { horde: true, title: 'taintHorde' }),
  ),
  ...copies(265, 2, (id) => special(FRIENDS_AND_FOES, id, 'enterHorde')),
];

// Sorted by id: the Necromancers fall between Werezombie (#331-#334) and Chromatiz (#347-#350).
const hordeBoxCards: ZombieCard[] = [
  ...namedCards(HORDE_BOX),
  ...namedNecromancers(HORDE_BOX, 335, 'countTemeraire'),
  ...namedNecromancers(HORDE_BOX, 341, 'queenSevera'),
].sort((a, b) => a.id.localeCompare(b.id));

const SPECTRAL_SPAWNS: readonly Specs[] = [
  ['W1', 'W1', 'W5', 'W2'], // 229
  ['W2', 'W1', 'W1', 'W3'],
  ['W2', 'W1', 'W1', 'W6'],
  ['W1', 'W3', 'W2', 'W1'],
  ['W1', 'W2', 'W3', 'W6'],
  ['W1', 'W1', 'W4', 'W5'],
  ['W1', 'W4', 'W2', 'W3'], // 235
  ['W1', 'W1', 'W6', 'W2'],
  ['W1', 'W2', 'W2', 'W8'],
  ['W1', 'W2', 'W2', 'W7'],
  ['W1', 'W4', 'W4', 'W3'],
  ['W1', 'W3', 'W5', 'W3'], // 240
];
const noRestCards: ZombieCard[] = [
  ...namedCards(NO_REST),
  ...SPECTRAL_SPAWNS.map((specs, i) => levels(NO_REST, number(229 + i), specs, SPECTRAL, { title: 'spectralWalkers' })),
  ...copies(241, 12, (id) => levels(NO_REST, id, ['W2', 'W3', 'W4', 'W5'], RATZ, { title: 'swarmOfRatz' })),
];

const specialGuestCards: ZombieCard[] = [
  ...namedCards(SPECIAL_GUESTS),
  ...namedNecromancers(SPECIAL_GUESTS, 125, 'toMeKuPa'),
  ...namedNecromancers(SPECIAL_GUESTS, 131, 'blackheart'),
  ...namedNecromancers(SPECIAL_GUESTS, 137, 'ostokar'),
  ...namedNecromancers(SPECIAL_GUESTS, 143, 'evilTroy'),
  ...namedNecromancers(SPECIAL_GUESTS, 149, 'queenMedea'),
  ...namedNecromancers(SPECIAL_GUESTS, 155, 'grin'),
  ...namedNecromancers(SPECIAL_GUESTS, 161, 'erikSummoner'),
  ...namedNecromancers(SPECIAL_GUESTS, 267, 'innsmouth'),
  ...namedNecromancers(SPECIAL_GUESTS, 273, 'faolan'),
  ...namedNecromancers(SPECIAL_GUESTS, 279, 'lordOfSkulls'),
];

const ratKingCards: ZombieCard[] = [
  ...copies(351, 6, (id) => levels(RAT_KING, id, ['W1', 'W2', 'W4', 'W6'], RATZ, { title: 'named', boss: 'ratKing' })),
  ...namedCards(RAT_KING),
];

// White Death: its Abomination and Necromancer cards draw from the boss decks (Khan, Defiler).
const bossCall = (id: string, boss: BossKind): FantasyCard => ({ id: `${WHITE_DEATH}-${id}`, setId: WHITE_DEATH, kind: 'bossCall', boss });
const whiteDeathSpawns = (first: number, count: number, specs: Specs) =>
  copies(first, count, (id) => levels(WHITE_DEATH, id, specs, WHITE_DEATH_ZOMBIES, { title: 'zombies' }));
const whiteDeathCards: ZombieCard[] = [
  ...whiteDeathSpawns(429, 6, ['W2', 'W4', 'W6', 'W8']),
  ...whiteDeathSpawns(435, 4, ['F2', 'F2', 'F6', 'F8']),
  ...whiteDeathSpawns(439, 4, ['R2', 'R2', 'R6', 'R8']),
  ...whiteDeathSpawns(443, 6, ['W4', 'W6', 'W8', 'W10']),
  ...whiteDeathSpawns(449, 4, ['F4', 'F4', 'F6', 'F8']),
  ...whiteDeathSpawns(453, 4, ['R4', 'R4', 'R6', 'R8']),
  ...copies(457, 6, (id) => bossCall(id, 'abomination')),
  ...copies(463, 9, (id) => bossCall(id, 'necromancer')),
  ...copies(472, 9, (id) => ({ id: `${WHITE_DEATH}-${id}`, setId: WHITE_DEATH, kind: 'zombieSiege' }) as FantasyCard),
  activation(WHITE_DEATH, '481', 'wdWalker'),
  activation(WHITE_DEATH, '482', 'wdWalker'),
  activation(WHITE_DEATH, '483', 'wdBrute'),
  activation(WHITE_DEATH, '484', 'wdRunner'),
];

// Eternal Empire: White Death's cards 56 numbers later; Brutes bring a Warden Brute, Abominations cost each Survivor 1 Chi.
const EE_ZOMBIES: Zombies = { W: 'eeWalker', R: 'eeRunner', F: 'eeBrute' };
const eeSpawns = (first: number, count: number, specs: Specs, adds?: FantasyZombie) =>
  copies(first, count, (id) => levels(ETERNAL_EMPIRE, id, specs, EE_ZOMBIES, { title: 'zombies', ...(adds && { adds }) }));
const eternalEmpireCards: ZombieCard[] = [
  ...eeSpawns(485, 6, ['W2', 'W4', 'W6', 'W8']),
  ...eeSpawns(491, 4, ['F2', 'F2', 'F6', 'F8'], 'wardenBrute'),
  ...eeSpawns(495, 4, ['R2', 'R2', 'R6', 'R8']),
  ...eeSpawns(499, 6, ['W4', 'W6', 'W8', 'W10']),
  ...eeSpawns(505, 4, ['F4', 'F4', 'F6', 'F8'], 'wardenBrute'),
  ...eeSpawns(509, 4, ['R4', 'R4', 'R6', 'R8']),
  ...copies(513, 6, (id) => ({ id: `${ETERNAL_EMPIRE}-${id}`, setId: ETERNAL_EMPIRE, kind: 'bossCall', boss: 'abomination', chi: true }) as FantasyCard),
  ...copies(519, 9, (id) => ({ id: `${ETERNAL_EMPIRE}-${id}`, setId: ETERNAL_EMPIRE, kind: 'bossCall', boss: 'necromancer' }) as FantasyCard),
  ...copies(528, 9, (id) => ({ id: `${ETERNAL_EMPIRE}-${id}`, setId: ETERNAL_EMPIRE, kind: 'zombieSiege' }) as FantasyCard),
  activation(ETERNAL_EMPIRE, '537', 'eeWalker'),
  activation(ETERNAL_EMPIRE, '538', 'eeWalker'),
  activation(ETERNAL_EMPIRE, '539', 'eeBrute'),
  activation(ETERNAL_EMPIRE, '540', 'eeRunner'),
];

// Boss cards only, no spawn card: Frozen Fortress and the Warlords boxes.
const FROZEN_FORTRESS = 'frozenFortress';
const WARLORDS_MIDDLE_KINGDOM = 'warlordsMiddleKingdom';
const WARLORDS_RISING_SUN = 'warlordsRisingSun';

// The packs below are sheets of 12 cards, one zombie type each.
const spawned = (setId: string, first: number, specs: readonly Specs[], zombie: SpawnedZombie, extra: { note?: FantasyNote } = {}) =>
  specs.map((spec, i) => levels(setId, number(first + i), spec, { W: zombie }, { title: 'zombies', ...extra }));
const SPAWNS_2468: Specs = ['W2', 'W4', 'W6', 'W8'];
const SPAWNS_46810: Specs = ['W4', 'W6', 'W8', 'W10'];

// Berserker Walkers: #547-#552 as 2/4/6/8, #553-#558 as 4/6/8/10.
const berserkerWalkerCards: ZombieCard[] = [
  ...spawned(BERSERKER_WALKERS, 547, Array(6).fill(SPAWNS_2468), 'fantasyBerserkerWalker'),
  ...spawned(BERSERKER_WALKERS, 553, Array(6).fill(SPAWNS_46810), 'fantasyBerserkerWalker'),
];

// Terrorcotta Walkers (always 5, "All Terrorcotta Walker groups under 5, are set to 5!"), then Climbers.
const climbersTerrorcottaCards: ZombieCard[] = [
  ...spawned(CLIMBERS_TERRORCOTTA, 559, Array(6).fill(['W5', 'W5', 'W5', 'W5']), 'terrorcottaWalker', { note: 'terrorcottaNote' }),
  ...spawned(CLIMBERS_TERRORCOTTA, 565, Array(6).fill(SPAWNS_2468), 'climber'),
  ...spawned(CLIMBERS_TERRORCOTTA, 571, Array(6).fill(SPAWNS_46810), 'climber'),
];

// Crossfire Pack: Deadbolt Walkers, #577-#579 as 2/4/6/8, #580-#582 as 4/6/8/10.
const crossfireCards: ZombieCard[] = [
  ...spawned(CROSSFIRE, 577, Array(3).fill(SPAWNS_2468), 'deadboltWalker'),
  ...spawned(CROSSFIRE, 580, Array(3).fill(SPAWNS_46810), 'deadboltWalker'),
];

// Timecrash: Foot Ninjas, six identical cards.
const timecrashCards: ZombieCard[] = spawned(TIMECRASH, 541, Array(6).fill(['W1', 'W2', 'W3', 'W4']), 'footNinja', {
  note: 'footNinjasNote',
});

const massiveDarkness2Cards: ZombieCard[] = namedCards(MASSIVE_DARKNESS_2);
const comicBookExtras2Cards: ZombieCard[] = [
  ...namedNecromancers(COMIC_BOOK_EXTRAS_2, 403, 'erinn'),
  ...namedCards(COMIC_BOOK_EXTRAS_2),
];
const compagniaCards: ZombieCard[] = [
  ...namedNecromancers(COMPAGNIA, 371, 'grandVizier'),
  ...namedNecromancers(COMPAGNIA, 377, 'theSparrow'),
];
const thundercatsCards: ZombieCard[] = namedNecromancers(THUNDERCATS, 367, 'mummRa', 4);
const bebopRocksteadyCards: ZombieCard[] = namedCards(BEBOP_ROCKSTEADY);
// The Divine Beasts card is printed without a number (hence the id `divineBeasts-card`).
const divineBeastCards: ZombieCard[] = [
  levels(DIVINE_BEASTS, 'card', ['-', 'A', 'A', 'A'], { A: 'divineBeast' }, { title: 'zombies', plural: true }),
];

// Iron Maiden packs 1 to 3: #371-#402.
const eddie = (first: number, zombie: NamedAbomination | NamedNecromancer, count: number): ZombieCard[] =>
  copies(first, count, (id) =>
    NAMED_NECROMANCERS.has(zombie as NamedNecromancer)
      ? necromancer(IRON_MAIDEN, id, zombie as NamedNecromancer)
      : namedAbomination(IRON_MAIDEN, id, zombie as NamedAbomination),
  );
const ironMaidenCards: ZombieCard[] = [
  ...eddie(371, 'reaperEddie', 6),
  ...eddie(377, 'pharaohEddie', 4),
  ...eddie(381, 'samuraiEddie', 4),
  ...eddie(385, 'shamanEddie', 6),
  ...eddie(391, 'mummyEddie', 4),
  ...eddie(395, 'wickerManEddie', 4),
  ...eddie(399, 'fearEddie', 4),
];

const noHardCards = () => false;

// "All fantasy Zombicide contents are compatible": the core boxes can be mixed.
export const FANTASY_SETS: readonly CardSet[] = [
  { id: BLACK_PLAGUE, optional: true, core: true, isHard: noHardCards, cards: blackPlagueCards },
  { id: GREEN_HORDE, optional: true, core: true, isHard: noHardCards, cards: greenHordeCards },
  { id: WHITE_DEATH, optional: true, core: true, isHard: noHardCards, cards: whiteDeathCards },
  { id: ETERNAL_EMPIRE, optional: true, core: true, isHard: noHardCards, cards: eternalEmpireCards },
  { id: WULFSBURG, optional: true, isHard: noHardCards, cards: wulfsburgCards },
  { id: NPC_1, optional: true, isHard: noHardCards, cards: npcCards(NPC_1, 63) },
  { id: NPC_2, optional: true, isHard: noHardCards, cards: npcCards(NPC_2, 75) },
  { id: ZOMBIE_BOSSES, optional: true, isHard: noHardCards, cards: namedCards(ZOMBIE_BOSSES) },
  { id: DEADEYE, optional: true, isHard: noHardCards, cards: deadeyeCards },
  { id: FANTASY_CROWZ, optional: true, isHard: noHardCards, cards: crowzCards },
  { id: FRIENDS_AND_FOES, optional: true, isHard: noHardCards, cards: friendsAndFoesCards },
  { id: HORDE_BOX, optional: true, isHard: noHardCards, cards: hordeBoxCards },
  { id: NO_REST, optional: true, isHard: noHardCards, cards: noRestCards },
  { id: SPECIAL_GUESTS, optional: true, isHard: noHardCards, cards: specialGuestCards },
  { id: RAT_KING, optional: true, isHard: noHardCards, cards: ratKingCards },
  { id: FROZEN_FORTRESS, optional: true, isHard: noHardCards, cards: [] },
  { id: WARLORDS_MIDDLE_KINGDOM, optional: true, isHard: noHardCards, cards: [] },
  { id: WARLORDS_RISING_SUN, optional: true, isHard: noHardCards, cards: [] },
  { id: MASSIVE_DARKNESS_2, optional: true, isHard: noHardCards, cards: massiveDarkness2Cards },
  { id: THUNDERCATS, optional: true, isHard: noHardCards, cards: thundercatsCards },
  { id: COMPAGNIA, optional: true, isHard: noHardCards, cards: compagniaCards },
  { id: IRON_MAIDEN, optional: true, isHard: noHardCards, cards: ironMaidenCards },
  { id: COMIC_BOOK_EXTRAS_2, optional: true, isHard: noHardCards, cards: comicBookExtras2Cards },
  { id: TIMECRASH, optional: true, isHard: noHardCards, cards: timecrashCards },
  { id: BERSERKER_WALKERS, optional: true, isHard: noHardCards, cards: berserkerWalkerCards },
  { id: CLIMBERS_TERRORCOTTA, optional: true, isHard: noHardCards, cards: climbersTerrorcottaCards },
  { id: CROSSFIRE, optional: true, isHard: noHardCards, cards: crossfireCards },
  { id: BEBOP_ROCKSTEADY, optional: true, isHard: noHardCards, cards: bebopRocksteadyCards },
  { id: DIVINE_BEASTS, optional: true, isHard: noHardCards, cards: divineBeastCards },
];
