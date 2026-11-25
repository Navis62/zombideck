import type { CardSet, InvaderAbomination, InvaderCard, InvaderXeno, InvaderZone, SpawnCounts, ZombieCard } from '../game/types';
import { numberOf } from './card-number.ts';

export const INVADER = 'invader';
export const DARK_SIDE = 'darkSide';
export const BLACK_OPS = 'blackOps';
export const DARK_SIDE_EXTRAS = 'darkSideExtras';
export const CIVILIAN_EXTRAS = 'civilianExtras';
export const SOLDIER_EXTRAS = 'soldierExtras';
export const PROMO_XENOS = 'promoXenos';
export const PROJECT_ELITE = 'projectElite';
export const COMIC_BOOK_1 = 'comicBook1';
export const COMIC_BOOK_2 = 'comicBook2';
export const COMIC_BOOK_2_ANDROID = 'comicBook2Android';
export const IRON_MAIDEN_1 = 'ironMaiden1';
export const IRON_MAIDEN_2 = 'ironMaiden2';

// Core boxes only (rulebook p.37): in each, #1-25 are easy, #26-50 hard, #51-54 Extra Activations; Dark Side starts at 61.
const CORE_BOX_NUMBERS = 60;
const isHardCard = (card: ZombieCard) => {
  const numberInBox = numberOf(card) % CORE_BOX_NUMBERS;
  return numberInBox >= 26 && numberInBox <= 50;
};

// Transcribed from the Atomic Asteroidz card images; numbers come from their file names. Rows are reversed (printed Red first).

const ids = (setId: string, from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => `${setId}-${String(from + i).padStart(3, '0')}`);

const xeno = (setId: string, from: number, to: number, zombie: InvaderXeno, counts: SpawnCounts): InvaderCard[] =>
  ids(setId, from, to).map((id) => ({ id, setId, kind: 'xeno', zombie, counts }));

const abomination = (setId: string, from: number, to: number, zombie: InvaderAbomination, spawnZone?: true): InvaderCard[] =>
  ids(setId, from, to).map((id) => ({ id, setId, kind: 'xenoAbomination', zombie, ...(spawnZone && { spawnZone }) }));

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
  ...xeno(INVADER, 1, 6, 'worker', [2, 4, 6, 8]),
  ...xeno(INVADER, 7, 10, 'tank', [2, 2, 6, 8]),
  ...xeno(INVADER, 11, 15, 'hunter', [2, 2, 6, 8]),
  ...abomination(INVADER, 16, 21, 'spoilerAbomination'),
  ...zoneSpawn(INVADER, [22, 47], 'mold', 'worker', 1),
  ...zoneSpawn(INVADER, [23, 48], 'mold', 'worker', 2),
  ...zoneSpawn(INVADER, [24, 49], 'mold', 'tank', 1),
  ...zoneSpawn(INVADER, [25, 50], 'mold', 'hunter', 1),
  ...xeno(INVADER, 26, 31, 'worker', [4, 6, 8, 10]),
  ...xeno(INVADER, 32, 35, 'tank', [4, 4, 6, 8]),
  ...xeno(INVADER, 36, 40, 'hunter', [4, 4, 6, 8]),
  ...abomination(INVADER, 41, 46, 'spoilerAbomination'),
  extra(INVADER, 51, 'worker'),
  extra(INVADER, 52, 'worker'),
  extra(INVADER, 53, 'tank'),
  extra(INVADER, 54, 'hunter'),
].sort((a, b) => a.id.localeCompare(b.id));

const DARK_SIDE_CARDS: InvaderCard[] = [
  ...xeno(DARK_SIDE, 61, 66, 'drillerWorker', [2, 4, 6, 8]),
  ...xeno(DARK_SIDE, 67, 70, 'drillerTank', [2, 2, 6, 8]),
  ...xeno(DARK_SIDE, 71, 75, 'drillerHunter', [2, 2, 6, 8]),
  ...abomination(DARK_SIDE, 76, 81, 'drillerAbomination'),
  ...zoneSpawn(DARK_SIDE, [82, 107], 'pit', 'drillerWorker', 1),
  ...zoneSpawn(DARK_SIDE, [83, 108], 'pit', 'drillerWorker', 2),
  ...zoneSpawn(DARK_SIDE, [84, 109], 'pit', 'drillerTank', 1),
  ...zoneSpawn(DARK_SIDE, [85, 110], 'pit', 'drillerHunter', 1),
  ...xeno(DARK_SIDE, 86, 91, 'drillerWorker', [4, 6, 8, 10]),
  ...xeno(DARK_SIDE, 92, 95, 'drillerTank', [4, 4, 6, 8]),
  ...xeno(DARK_SIDE, 96, 100, 'drillerHunter', [4, 4, 6, 8]),
  ...abomination(DARK_SIDE, 101, 106, 'drillerAbomination'),
  extra(DARK_SIDE, 111, 'drillerWorker'),
  extra(DARK_SIDE, 112, 'drillerWorker'),
  extra(DARK_SIDE, 113, 'drillerTank'),
  extra(DARK_SIDE, 114, 'drillerHunter'),
].sort((a, b) => a.id.localeCompare(b.id));

// Expansions: same source; product names from the fandom wiki "SciFi Products". The booklets give no easier / harder split.
// Chosen like the core boxes: higher counts hard (Driller Blitzer 2/2/4/6, Biters 4/6/8/10), 2/4/6/8 and Mold Spawn easy,
// each named Abomination's range halved (lower half easy).
// The Promo Xenos' Flingers and Seeker Workers reuse the Civilian Extras numbers, so they are numbered 190-204 to keep ids unique;
// no `replaces` between the two: owners of both shuffle both in.
// The Seeker Workers' rule (Seeker reference card) is a footer on their spawn cards only (`XENO_RULES`), not on Mold Spawn.
/** Ids of the harder cards of the expansions, filled as the cards are built so a range cannot drift from its split. */
const HARD_IDS = new Set<string>();
const isHardExpansionCard = (card: ZombieCard) => HARD_IDS.has(card.id);

/** Xenos whose higher counts make them the harder cards. */
const hardXeno = (setId: string, from: number, to: number, zombie: InvaderXeno, counts: SpawnCounts): InvaderCard[] => {
  const cards = xeno(setId, from, to, zombie, counts);
  for (const card of cards) HARD_IDS.add(card.id);
  return cards;
};

/** A named Abomination of an expansion: the first half of its printed range is easy, the second half hard. */
const abominationHalves = (setId: string, from: number, to: number, zombie: InvaderAbomination, spawnZone?: true): InvaderCard[] => {
  const cards = abomination(setId, from, to, zombie, spawnZone);
  for (const card of cards.slice(Math.ceil(cards.length / 2))) HARD_IDS.add(card.id);
  return cards;
};

/** The Civilian Pack Xenos in print order: 6 Flingers, 9 Seeker Workers, 2 Mold Spawn (1 Seeker Worker), 6 Xenomoths. */
const civilianXenos = (setId: string, first: number): InvaderCard[] => {
  const n = (offset: number) => first + offset;
  return [
    ...xeno(setId, n(0), n(5), 'flinger', [2, 4, 6, 8]),
    ...xeno(setId, n(6), n(14), 'seekerWorker', [2, 4, 6, 8]),
    ...zoneSpawn(setId, [n(15), n(16)], 'mold', 'seekerWorker', 1),
    ...xeno(setId, n(17), n(22), 'xenomoth', [2, 4, 6, 8]),
  ];
};

const BLACK_OPS_CARDS = abominationHalves(BLACK_OPS, 55, 60, 'juggernaut');

const DARK_SIDE_EXTRAS_CARDS = [
  // Easy 115-117, hard 118-120
  ...xeno(DARK_SIDE_EXTRAS, 115, 117, 'drillerBlitzer', [1, 2, 3, 4]),
  ...hardXeno(DARK_SIDE_EXTRAS, 118, 120, 'drillerBlitzer', [2, 2, 4, 6]),
];

const CIVILIAN_EXTRAS_CARDS: InvaderCard[] = [
  ...abominationHalves(CIVILIAN_EXTRAS, 121, 124, 'babyface'),
  ...abominationHalves(CIVILIAN_EXTRAS, 125, 128, 'buddyBot'),
  ...abominationHalves(CIVILIAN_EXTRAS, 129, 132, 'irisSentryGun'),
  ...abominationHalves(CIVILIAN_EXTRAS, 133, 136, 'motherInLaw'),
  ...abominationHalves(CIVILIAN_EXTRAS, 137, 140, 'shadow'),
  ...abominationHalves(CIVILIAN_EXTRAS, 141, 146, 'stomper'),
  ...abominationHalves(CIVILIAN_EXTRAS, 147, 150, 'widowmaker'),
  ...civilianXenos(CIVILIAN_EXTRAS, 151),
];

const SOLDIER_EXTRAS_CARDS = [
  ...abominationHalves(SOLDIER_EXTRAS, 174, 179, 'broodMother'),
  ...abominationHalves(SOLDIER_EXTRAS, 180, 183, 'xeniumHorror'),
];

/** The same cards as the Dark Side Extras and Civilian Extras Xenos, printed again with numbers of their own. */
const PROMO_XENOS_CARDS = [
  ...xeno(PROMO_XENOS, 184, 186, 'drillerBlitzer', [1, 2, 3, 4]),
  ...hardXeno(PROMO_XENOS, 187, 189, 'drillerBlitzer', [2, 2, 4, 6]),
  ...civilianXenos(PROMO_XENOS, 190),
];

const PROJECT_ELITE_CARDS = [
  ...hardXeno(PROJECT_ELITE, 213, 218, 'biter', [4, 6, 8, 10]),
  ...abominationHalves(PROJECT_ELITE, 219, 224, 'thraex'),
  ...abominationHalves(PROJECT_ELITE, 225, 230, 'gutslug'),
];

const COMIC_BOOK_1_CARDS = abominationHalves(COMIC_BOOK_1, 231, 236, 'stepmother', true);

const COMIC_BOOK_2_CARDS = [
  ...abominationHalves(COMIC_BOOK_2, 135, 140, 'shaila'),
  ...abominationHalves(COMIC_BOOK_2, 141, 146, 'dimbutcher'),
];

const COMIC_BOOK_2_ANDROID_CARDS = abominationHalves(COMIC_BOOK_2_ANDROID, 129, 134, 'synkrasis');

// Iron Maiden Packs 1 and 2 (wiki sci-fi sections) print the same numbers 121-128, hence two sets.
const IRON_MAIDEN_1_CARDS = [
  ...abominationHalves(IRON_MAIDEN_1, 121, 124, 'cyborgEddieAbomination'),
  ...abominationHalves(IRON_MAIDEN_1, 125, 128, 'samuraiEddieAbomination'),
];

const IRON_MAIDEN_2_CARDS = [
  ...abominationHalves(IRON_MAIDEN_2, 121, 124, 'bassistEddieAbomination'),
  ...abominationHalves(IRON_MAIDEN_2, 125, 128, 'bountyHunterEddieAbomination'),
];

const expansion = (id: string, cards: InvaderCard[]): CardSet => ({
  id,
  optional: true,
  isHard: isHardExpansionCard,
  cards,
});

export const INVADER_SETS: readonly CardSet[] = [
  { id: INVADER, optional: true, core: true, isHard: isHardCard, cards: INVADER_CARDS },
  { id: DARK_SIDE, optional: true, core: true, isHard: isHardCard, cards: DARK_SIDE_CARDS },
  expansion(BLACK_OPS, BLACK_OPS_CARDS),
  expansion(DARK_SIDE_EXTRAS, DARK_SIDE_EXTRAS_CARDS),
  expansion(CIVILIAN_EXTRAS, CIVILIAN_EXTRAS_CARDS),
  expansion(SOLDIER_EXTRAS, SOLDIER_EXTRAS_CARDS),
  expansion(PROMO_XENOS, PROMO_XENOS_CARDS),
  expansion(PROJECT_ELITE, PROJECT_ELITE_CARDS),
  expansion(COMIC_BOOK_1, COMIC_BOOK_1_CARDS),
  expansion(COMIC_BOOK_2, COMIC_BOOK_2_CARDS),
  expansion(COMIC_BOOK_2_ANDROID, COMIC_BOOK_2_ANDROID_CARDS),
  expansion(IRON_MAIDEN_1, IRON_MAIDEN_1_CARDS),
  expansion(IRON_MAIDEN_2, IRON_MAIDEN_2_CARDS),
];
