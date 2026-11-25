import type { CardSet, SpawnCounts, WesternActivated, WesternCard, WesternZombie } from '../game/types';

export const UNDEAD_OR_ALIVE = 'undeadOrAlive';
export const LONG_DEAD_WALKERS = 'longDeadWalkers';
export const RUNNING_WILD = 'runningWild';
export const ABOMINAPE_VS_CROCOSAUR = 'abominapeVsCrocosaur';
export const DEADSTOCK_ABOMINATIONS = 'deadstockAbominations';
export const DEAD_WEST_ABOMINATIONS = 'deadWestAbominations';
export const GEARS_AND_GUNS = 'gearsAndGuns';
export const WESTERN_PROMOS = 'westernPromos';
export const WESTERN_IRON_MAIDEN = 'westernIronMaiden';

const LEGACY_IRON_MAIDEN_PACKS = new Set(['westernIronMaiden1', 'westernIronMaiden2', 'westernIronMaiden3']);

/** Old saved preferences name three Iron Maiden packs; they are now one box. */
export const mergeWesternIronMaidenPacks = (expansions: readonly string[]): string[] =>
  [...new Set(expansions.map((id) => LEGACY_IRON_MAIDEN_PACKS.has(id) ? WESTERN_IRON_MAIDEN : id))];

// Checked on photos of the printed cards (core box #001-#037, rulebook p.4; Long-Dead Walkers #038-#045).
// #012 is identical to #011 and #045 to #044 (checked online). No easier / harder split: every card is easy.
const ids = (setId: string, from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => `${setId}-${String(from + i).padStart(3, '0')}`);

const spawn = (setId: string, from: number, to: number, zombie: WesternZombie, counts: SpawnCounts): WesternCard[] =>
  ids(setId, from, to).map((id) => ({ id, setId, kind: 'westernSpawn', zombie, counts }));

const abomination = (setId: string, from: number, to: number): WesternCard[] =>
  ids(setId, from, to).map((id) => ({ id, setId, kind: 'westernAbomination' }));

const extra = (setId: string, number: number, zombie: WesternActivated): WesternCard => ({
  id: ids(setId, number, number)[0],
  setId,
  kind: 'westernExtra',
  zombie,
});

const UNDEAD_OR_ALIVE_CARDS: WesternCard[] = [
  ...spawn(UNDEAD_OR_ALIVE, 1, 4, 'westernWalker', [2, 4, 8, 10]),
  ...spawn(UNDEAD_OR_ALIVE, 5, 8, 'westernBrute', [2, 4, 8, 10]),
  ...spawn(UNDEAD_OR_ALIVE, 9, 12, 'westernRunner', [2, 4, 8, 10]),
  ...abomination(UNDEAD_OR_ALIVE, 13, 16),
  ...spawn(UNDEAD_OR_ALIVE, 17, 20, 'westernWalker', [4, 6, 10, 12]),
  ...spawn(UNDEAD_OR_ALIVE, 21, 24, 'westernBrute', [4, 4, 8, 10]),
  ...spawn(UNDEAD_OR_ALIVE, 25, 28, 'westernRunner', [4, 4, 8, 10]),
  ...abomination(UNDEAD_OR_ALIVE, 29, 33),
  extra(UNDEAD_OR_ALIVE, 34, 'westernWalker'),
  extra(UNDEAD_OR_ALIVE, 35, 'westernWalker'),
  extra(UNDEAD_OR_ALIVE, 36, 'westernBrute'),
  extra(UNDEAD_OR_ALIVE, 37, 'westernRunner'),
];

const LONG_DEAD_WALKERS_CARDS: WesternCard[] = [
  ...spawn(LONG_DEAD_WALKERS, 38, 41, 'longDeadWalker', [2, 4, 8, 10]),
  ...spawn(LONG_DEAD_WALKERS, 42, 43, 'longDeadWalker', [4, 6, 10, 12]),
  ...spawn(LONG_DEAD_WALKERS, 44, 45, 'longDeadWalker', [4, 6, 10, 14]),
];

const easy = () => false;

/** An optional box that only brings Abominations (see `WESTERN_ABOMINATIONS`). */
const abominationBox = (id: string): CardSet => ({ id, optional: true, isHard: easy, cards: [] });

export const WESTERN_SETS: readonly CardSet[] = [
  { id: UNDEAD_OR_ALIVE, optional: true, core: true, isHard: easy, cards: UNDEAD_OR_ALIVE_CARDS },
  { id: LONG_DEAD_WALKERS, optional: true, isHard: easy, cards: LONG_DEAD_WALKERS_CARDS },
  abominationBox(RUNNING_WILD),
  abominationBox(ABOMINAPE_VS_CROCOSAUR),
  abominationBox(DEADSTOCK_ABOMINATIONS),
  abominationBox(DEAD_WEST_ABOMINATIONS),
  abominationBox(GEARS_AND_GUNS),
  abominationBox(WESTERN_PROMOS),
  abominationBox(WESTERN_IRON_MAIDEN),
];
