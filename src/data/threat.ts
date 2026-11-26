import type { BossPower, Deck } from '../game/engine.ts';
import type {
  BossRule,
  CardSet,
  FantasyNecromancer,
  FantasyZombie,
  NamedAbomination,
  NamedModernAbomination,
  NamedNecromancer,
  WesternAbomination,
  ZombieCard,
} from '../game/types';
import { CARD_SETS } from './decks.ts';
import { WESTERN_IRON_MAIDEN, WESTERN_SETS } from './western.ts';

// Fantasy bosses follow White Death, extended to every box by Dead Men Tales; the core Abominations and Necromancers stay in the Zombie deck.
// "If there is no Abomination on the board: Draw an Abomination card, then spawn it. If there is already an
// Abomination: It gets an extra Activation." (White Death #457-#462)
// "Playing with several Necromancers is done in the same way as playing with several Abominations."

export const BOSS_RULES: readonly BossRule[] = ['oneAtATime', 'fest'];
/** No Abomination Fest in the Western rulebooks. */
export const WESTERN_BOSS_RULES: readonly BossRule[] = ['oneAtATime'];

export type Threat = { bossRule: BossRule; off: string[] };
export const DEFAULT_THREAT: Threat = { bossRule: 'oneAtATime', off: [] };


export type ListedBoss = FantasyZombie | FantasyNecromancer | NamedAbomination | NamedNecromancer | NamedModernAbomination | WesternAbomination;
export type Boss<Zombie extends string = ListedBoss> = {
  zombie: Zombie;
  setId: string;
  /** How many identical cards of this boss the box holds in its boss deck (one by default). */
  copies?: number;
  /** What the boss does when revealed (SPAM, Batman Who Laughs, Gozer): see `BossPower`. */
  power?: BossPower<Zombie>;
};
export const ABOMINATION_BOSSES: readonly Boss[] = [
  { zombie: 'ablobination', setId: 'zombieBosses' },
  { zombie: 'abominatroll', setId: 'zombieBosses' },
  { zombie: 'abominotaur', setId: 'zombieBosses' },
  { zombie: 'abominalpha', setId: 'specialGuests' },
  { zombie: 'abominarat', setId: 'specialGuests' },
  { zombie: 'gorgomination', setId: 'hordeBox' },
  { zombie: 'hordeBrother', setId: 'hordeBox' },
  { zombie: 'siegeBreaker', setId: 'hordeBox' },
  { zombie: 'swampLurker', setId: 'hordeBox' },
  { zombie: 'abominabunny', setId: 'hordeBox' },
  { zombie: 'magentaCovfefe', setId: 'hordeBox' },
  { zombie: 'vaultWarden', setId: 'hordeBox' },
  { zombie: 'werezombie', setId: 'hordeBox' },
  { zombie: 'chromatiz', setId: 'hordeBox' },
  { zombie: 'swampTroll', setId: 'ratKingSwampTroll' },
  { zombie: 'amaterasu', setId: 'frozenFortress' },
  { zombie: 'asura', setId: 'frozenFortress' },
  { zombie: 'bishamon', setId: 'frozenFortress' },
  { zombie: 'chimimoryo', setId: 'frozenFortress' },
  { zombie: 'hachiman', setId: 'frozenFortress' },
  { zombie: 'kijin', setId: 'frozenFortress' },
  { zombie: 'kumiho', setId: 'frozenFortress' },
  { zombie: 'nian', setId: 'frozenFortress' },
  { zombie: 'qilin', setId: 'frozenFortress' },
  { zombie: 'redHare', setId: 'frozenFortress' },
  { zombie: 'shakokiDogu', setId: 'frozenFortress' },
  { zombie: 'sojobo', setId: 'frozenFortress' },
  { zombie: 'susanoWo', setId: 'frozenFortress' },
  { zombie: 'takemikazuchi', setId: 'frozenFortress' },
  { zombie: 'toyol', setId: 'frozenFortress' },
  { zombie: 'yeti', setId: 'frozenFortress' },
  { zombie: 'reaper', setId: 'massiveDarkness2' },
  { zombie: 'baalberith', setId: 'massiveDarkness2' },
  { zombie: 'horseman', setId: 'massiveDarkness2' },
  { zombie: 'queenCaenedra', setId: 'massiveDarkness2' },
  { zombie: 'hugBear', setId: 'massiveDarkness2' },
  { zombie: 'banshee', setId: 'massiveDarkness2' },
  { zombie: 'cerberus', setId: 'massiveDarkness2' },
  { zombie: 'pharaohEddie', setId: 'ironMaiden' },
  { zombie: 'samuraiEddie', setId: 'ironMaiden' },
  { zombie: 'mummyEddie', setId: 'ironMaiden' },
  { zombie: 'wickerManEddie', setId: 'ironMaiden' },
  { zombie: 'fearEddie', setId: 'ironMaiden' },
  { zombie: 'lordJanas', setId: 'comicBookExtras2' },
  { zombie: 'marike', setId: 'comicBookExtras2' },
  { zombie: 'bebop', setId: 'bebopRocksteady' },
  { zombie: 'dongZhuo', setId: 'warlordsMiddleKingdom' },
  { zombie: 'rocksteady', setId: 'bebopRocksteady' },
  // "Upon drawing their Abomination card, remove it from the game and spawn the Vermillion Bird first."
  { zombie: 'divineBeast', setId: 'divineBeasts', power: { kind: 'chain', first: 'vermillionBird' } },
];
// Divine Beasts rulebook: each spawns when the previous one is eliminated; "When the Azure Dragon is eliminated, they are gone for good."
// In no menu and no deck: the Divine Beasts card spawns the first.
export const DIVINE_BEASTS: readonly Boss[] = [
  { zombie: 'vermillionBird', setId: 'divineBeasts', power: { kind: 'chained', card: 'divineBeast', next: 'whiteTiger' } },
  { zombie: 'whiteTiger', setId: 'divineBeasts', power: { kind: 'chained', card: 'divineBeast', next: 'blackTortoise' } },
  { zombie: 'blackTortoise', setId: 'divineBeasts', power: { kind: 'chained', card: 'divineBeast', next: 'azureDragon' } },
  { zombie: 'azureDragon', setId: 'divineBeasts', power: { kind: 'chained', card: 'divineBeast' } },
];
/** Not Abominations by the rules, yet they join the Abomination deck. */
export const BIG_BOSSES: readonly Boss[] = [
  { zombie: 'feralDragon', setId: 'hordeBox' },
  { zombie: 'zombieGiant', setId: 'hordeBox' },
  { zombie: 'necromanticDragon', setId: 'noRestForTheWicked' },
];
export const NECROMANCER_BOSSES: readonly Boss[] = [
  { zombie: 'countTemeraire', setId: 'hordeBox' },
  { zombie: 'queenSevera', setId: 'hordeBox' },
  { zombie: 'toMeKuPa', setId: 'specialGuests' },
  { zombie: 'blackheart', setId: 'specialGuests' },
  { zombie: 'ostokar', setId: 'specialGuests' },
  { zombie: 'evilTroy', setId: 'specialGuests' },
  { zombie: 'queenMedea', setId: 'specialGuests' },
  { zombie: 'grin', setId: 'specialGuests' },
  { zombie: 'erikSummoner', setId: 'specialGuests' },
  { zombie: 'innsmouth', setId: 'specialGuests' },
  { zombie: 'faolan', setId: 'specialGuests' },
  // "Spawns with both Doom and Gloom, if they are in the Zombie reserve" (Lord of Skulls #279-#284, fan wiki).
  { zombie: 'lordOfSkulls', setId: 'specialGuests', power: { kind: 'brings', bosses: ['doom', 'gloom'], bossKind: 'abomination' } },
  // Printed as a spawn card: his picture over the Swarms of Ratz.
  { zombie: 'ratKing', setId: 'ratKingSwampTroll' },
  { zombie: 'bomoh', setId: 'frozenFortress' },
  { zombie: 'deathNotes', setId: 'frozenFortress' },
  { zombie: 'hannya', setId: 'frozenFortress' },
  { zombie: 'kaguya', setId: 'frozenFortress' },
  { zombie: 'tengu', setId: 'frozenFortress' },
  { zombie: 'yukiOnna', setId: 'frozenFortress' },
  { zombie: 'mummRa', setId: 'thundercats' },
  { zombie: 'grandVizier', setId: 'compagniaDellaForca' },
  { zombie: 'theSparrow', setId: 'compagniaDellaForca' },
  { zombie: 'reaperEddie', setId: 'ironMaiden' },
  { zombie: 'shamanEddie', setId: 'ironMaiden' },
  { zombie: 'erinn', setId: 'comicBookExtras2' },
  { zombie: 'zhangJiao', setId: 'warlordsMiddleKingdom' },
  { zombie: 'fumaKotaro', setId: 'warlordsRisingSun', copies: 3, power: { kind: 'single' } },
  // Timecrash rulebook p.3 and p.8: the unnumbered "Shredder" Necromancer card, for White Death's Necromancer deck.
  { zombie: 'shredder', setId: 'timecrash' },
];
/** Doom and Gloom have no card: the Lord of Skulls brings them (fan wiki); in no deck and no menu. */
export const LORD_OF_SKULLS_ESCORT: readonly Boss[] = [
  { zombie: 'doom', setId: 'specialGuests', power: { kind: 'escort' } },
  { zombie: 'gloom', setId: 'specialGuests', power: { kind: 'escort' } },
];

/** The Necromancers of a box, which the Necromancer deck starts with. */
export const CORE_NECROMANCERS: readonly Boss<FantasyNecromancer>[] = [
  { zombie: 'necromancer', setId: 'blackPlague' },
  { zombie: 'orcNecromancer', setId: 'greenHorde' },
  { zombie: 'defilerNecromancer', setId: 'whiteDeath' },
];
/** The Abominations of a box, which the Abomination deck starts with. */
export const SET_ABOMINATIONS: readonly Boss<FantasyZombie>[] = [
  { zombie: 'fantasyAbomination', setId: 'blackPlague' },
  { zombie: 'orcAbomination', setId: 'greenHorde' },
  { zombie: 'khanAbomination', setId: 'whiteDeath' },
  { zombie: 'godEaterAbomination', setId: 'eternalEmpire' },
  { zombie: 'taintedAbomination', setId: 'friendsAndFoes' },
  { zombie: 'wolfbomination', setId: 'wulfsburg' },
];

const DECK_BOSSES = new Set<string>(
  [...SET_ABOMINATIONS, ...ABOMINATION_BOSSES, ...BIG_BOSSES, ...CORE_NECROMANCERS, ...NECROMANCER_BOSSES].map((boss) => boss.zombie),
);
export const FANTASY_BOSS_IDS: ReadonlySet<string> = new Set([
  ...DECK_BOSSES,
  ...DIVINE_BEASTS.map((boss) => boss.zombie),
  ...LORD_OF_SKULLS_ESCORT.map((boss) => boss.zombie),
]);

/** Most cards of each boss the boxes hold; absent from the map means unknown. */
function copiesOf(bosses: readonly Boss[]): ReadonlyMap<string, number> {
  const total = new Map<string, number>();
  for (const boss of bosses) total.set(boss.zombie, (total.get(boss.zombie) ?? 0) + (boss.copies ?? 1));
  return total;
}
// The core boxes' generic bosses are limited by their cards in the deck, not by a count.
const GENERIC_BOSSES = new Set<string>([...SET_ABOMINATIONS, ...CORE_NECROMANCERS].map((boss) => boss.zombie));
export const FANTASY_BOSS_COPIES: ReadonlyMap<string, number> = new Map(
  [...copiesOf([...ABOMINATION_BOSSES, ...DIVINE_BEASTS, ...LORD_OF_SKULLS_ESCORT, ...BIG_BOSSES, ...NECROMANCER_BOSSES])].filter(([boss]) => !GENERIC_BOSSES.has(boss)),
);

const namedZombie = (card: ZombieCard) =>
  card.kind === 'levels' && (card.title === 'named' || card.plural)
    ? (card.boss ?? card.levels.find((level) => level)?.zombie)
    : undefined;

/** The fantasy deck of the sets switched on: named bosses leave it for their boss decks (Frozen Fortress's too, hence `setIds`). */
export function tailorFantasyDeck(cards: readonly ZombieCard[], threat: Threat, setIds: ReadonlySet<string>): Deck {
  const inPlay = (boss: { setId: string }) => setIds.has(boss.setId);
  const chosen = (boss: Boss) => inPlay(boss) && !threat.off.includes(boss.zombie);
  const named = (card: ZombieCard) => {
    const zombie = card.kind === 'necromancer' ? card.zombie : namedZombie(card);
    return zombie !== undefined && DECK_BOSSES.has(zombie) && !CORE_NECROMANCERS.some((core) => core.zombie === zombie);
  };
  return {
    cards: cards.filter((card) => !named(card)),
    bosses: {
      rule: threat.bossRule,
      abomination: [
        ...SET_ABOMINATIONS.filter(chosen),
        ...ABOMINATION_BOSSES.filter(chosen),
        ...BIG_BOSSES.filter(chosen),
      ].map((boss) => boss.zombie),
      necromancer: [
        ...CORE_NECROMANCERS.filter(chosen),
        ...NECROMANCER_BOSSES.filter(chosen).flatMap((boss) => Array<Boss>(boss.copies ?? 1).fill(boss)),
      ].map((boss) => boss.zombie),
    },
  };
}

/**
 * Named modern Abominations, each in the set whose box holds it (rulebook p.17: "If there is no Abomination on the
 * board, draw a card from the Abomination deck. Then, place the corresponding Abomination in the Spawn Zone. If there
 * is already an Abomination on the board, it gets an extra Activation."; p.30 for the Abomination Fest).
 * Core ones belong to `core2e`; the Kit's to `abomination`. Rules are in `card.<id>Rule`.
 */
export const MODERN_ABOMINATIONS: readonly Boss<NamedModernAbomination>[] = [
  { zombie: 'hobomination', setId: 'core2e' },
  { zombie: 'abominawild', setId: 'core2e' },
  { zombie: 'abominacop', setId: 'core2e' },
  { zombie: 'patientZero', setId: 'core2e' },
  { zombie: 'abombAbomination', setId: 'abomination' },
  { zombie: 'berserkerAbomination', setId: 'abomination' },
  { zombie: 'toxicAbomination', setId: 'abomination' },
  { zombie: 'homelander', setId: 'theBoys' },
  { zombie: 'aTrain', setId: 'theBoys' },
  { zombie: 'blackNoir', setId: 'theBoys' },
  { zombie: 'queenMaeve', setId: 'theBoys' },
  { zombie: 'soldierBoy', setId: 'theBoys' },
  { zombie: 'theDeep', setId: 'theBoys' },
  { zombie: 'starlight', setId: 'theBoys' },
  { zombie: 'translucent', setId: 'theBoys' },
  { zombie: 'alphaVampire', setId: 'supernatural', power: { kind: 'drawOnDeath' } },
  { zombie: 'wendigo', setId: 'supernatural' },
  { zombie: 'leviathan', setId: 'supernatural' },
  { zombie: 'blackDog', setId: 'supernatural' },
  { zombie: 'crowley', setId: 'supernatural' },
  { zombie: 'archangelMichael', setId: 'supernatural' },
  { zombie: 'zuul', setId: 'ghostbusters', power: { kind: 'unblocks' } },
  { zombie: 'vinzClortho', setId: 'ghostbusters', power: { kind: 'unblocks' } },
  { zombie: 'stayPuft', setId: 'ghostbusters' },
  { zombie: 'gozer', setId: 'ghostbusters', power: { kind: 'absorb', draw: 3, keep: 2 } },
  { zombie: 'nudeOrganist', setId: 'python' },
  { zombie: 'undeadParrot', setId: 'python' },
  { zombie: 'gumbys', setId: 'python' },
  { zombie: 'theFoot', setId: 'python' },
  { zombie: 'fishSlappingDancer', setId: 'python' },
  { zombie: 'hellsGrannies', setId: 'python' },
  { zombie: 'greenwichCrew', setId: 'python' },
  { zombie: 'spam', setId: 'python', copies: 2, power: { kind: 'cantrip' } },
  { zombie: 'eddieAsylum', setId: 'ironMaidenModern' },
  { zombie: 'eddieOriginal', setId: 'ironMaidenModern' },
  { zombie: 'eddieCyborg', setId: 'ironMaidenModern' },
  { zombie: 'eddieMummy', setId: 'ironMaidenModern' },
  { zombie: 'eddieUndead', setId: 'ironMaidenModern' },
  { zombie: 'eddieTrooper', setId: 'ironMaidenModern' },
  { zombie: 'eddieBassist', setId: 'ironMaidenModern' },
  { zombie: 'eddieReaper', setId: 'ironMaidenModern' },
  { zombie: 'eddieFear', setId: 'ironMaidenModern' },
  { zombie: 'eddieWicker', setId: 'ironMaidenModern' },
  { zombie: 'eddiePharaoh', setId: 'ironMaidenModern' },
  { zombie: 'eddieKiller', setId: 'ironMaidenModern' },
  { zombie: 'batabomination', setId: 'kickstarterAbominations' },
  { zombie: 'bigfoot', setId: 'kickstarterAbominations' },
  { zombie: 'cthulhu', setId: 'kickstarterAbominations' },
  { zombie: 'bearmanboar', setId: 'kickstarterAbominations' },
  { zombie: 'lankyman', setId: 'kickstarterAbominations' },
  { zombie: 'actualCannibal', setId: 'kickstarterAbominations' },
  { zombie: 'sewerCrocodile', setId: 'urbanLegends' },
  { zombie: 'killerClown', setId: 'urbanLegends' },
  { zombie: 'chupacabra', setId: 'urbanLegends' },
  { zombie: 'abductor', setId: 'urbanLegends' },
  { zombie: 'batmanEarth12', setId: 'darkNightsMetal' },
  { zombie: 'batmanEarth44', setId: 'darkNightsMetal' },
  { zombie: 'batmanWhoLaughs', setId: 'darkNightsMetal', power: { kind: 'bringsAlong', boss: 'theRobins', unblocks: true } },
  { zombie: 'theRobins', setId: 'darkNightsMetal' },
  { zombie: 'loboBatman', setId: 'darkNightsMetal' },
  { zombie: 'batmanEarth1', setId: 'darkNightsMetal' },
  { zombie: 'batmanEarth11', setId: 'darkNightsMetal' },
  { zombie: 'batmanEarth32', setId: 'darkNightsMetal' },
  { zombie: 'batmanEarth52', setId: 'darkNightsMetal' },
];

/** The sets whose boxes are in play: those switched on plus the ones they replace (Fort Hendrix keeps the core box's Abominations). */
export function presentSetIds(sets: readonly CardSet[], setIds: Iterable<string>): Set<string> {
  const present = new Set(setIds);
  for (const set of sets) if (set.replaces && present.has(set.id)) present.add(set.replaces);
  return present;
}

/** The modern deck: no card leaves it; without a named Abomination switched on there is no boss deck. */
function abominationTailor(sets: readonly CardSet[], listed: readonly Boss<string>[], rules: readonly BossRule[] = BOSS_RULES) {
  return (
    cards: readonly ZombieCard[],
    threat: Threat,
    setIds: ReadonlySet<string>,
    abominations: readonly Boss<string>[] = listed,
  ): Deck => {
    const present = presentSetIds(sets, setIds);
    const chosen = abominations.filter((boss) => present.has(boss.setId) && !threat.off.includes(boss.zombie));
    if (chosen.length === 0) return { cards: [...cards] };
    return {
      cards: [...cards],
      bosses: {
        rule: rules.includes(threat.bossRule) ? threat.bossRule : rules[0],
        abomination: chosen.flatMap((boss) => Array<string>(boss.copies ?? 1).fill(boss.zombie)),
        necromancer: [],
      },
    };
  };
}

export const tailorModernDeck = abominationTailor(CARD_SETS, MODERN_ABOMINATIONS);

/** Named Western Abominations, each in its box, as printed (rules in `card.<id>Rule`); the core text cards (#013-#016, #029-#033) call on this deck. */
export const WESTERN_ABOMINATIONS: readonly Boss<WesternAbomination>[] = [
  { zombie: 'bowlerHat', setId: 'undeadOrAlive' },
  { zombie: 'nightmareHorse', setId: 'runningWild' },
  { zombie: 'abominape', setId: 'abominapeVsCrocosaur' },
  { zombie: 'crocosaur', setId: 'abominapeVsCrocosaur' },
  { zombie: 'abominabear', setId: 'deadstockAbominations' },
  { zombie: 'texasDeadhorn', setId: 'deadstockAbominations' },
  { zombie: 'bizon', setId: 'deadstockAbominations' },
  { zombie: 'bloodBull', setId: 'deadstockAbominations' },
  { zombie: 'littleTrickster', setId: 'deadWestAbominations' },
  { zombie: 'goreGeyser', setId: 'deadWestAbominations' },
  { zombie: 'meltingPot', setId: 'deadWestAbominations' },
  { zombie: 'plymouthHound', setId: 'deadWestAbominations' },
  { zombie: 'pusbag', setId: 'deadWestAbominations' },
  { zombie: 'greatTrickster', setId: 'deadWestAbominations' },
  { zombie: 'cactusQueen', setId: 'deadWestAbominations' },
  { zombie: 'alphaBane', setId: 'deadWestAbominations' },
  { zombie: 'deathgrasp', setId: 'deadWestAbominations' },
  { zombie: 'fatMace', setId: 'deadWestAbominations' },
  { zombie: 'swampTongue', setId: 'deadWestAbominations' },
  { zombie: 'rottenClaw', setId: 'deadWestAbominations' },
  { zombie: 'westernWendigo', setId: 'westernPromos' },
  { zombie: 'steamMonster', setId: 'gearsAndGuns' },
  { zombie: 'westernUndeadEddie', setId: WESTERN_IRON_MAIDEN },
  { zombie: 'westernTrooperEddie', setId: WESTERN_IRON_MAIDEN },
  { zombie: 'westernShamanEddie', setId: WESTERN_IRON_MAIDEN },
  { zombie: 'westernAsylumEddie', setId: WESTERN_IRON_MAIDEN },
  { zombie: 'westernBountyHunterEddie', setId: WESTERN_IRON_MAIDEN },
  { zombie: 'westernFearEddie', setId: WESTERN_IRON_MAIDEN },
  { zombie: 'westernWickerEddie', setId: WESTERN_IRON_MAIDEN },
];

export const tailorWesternDeck = abominationTailor(WESTERN_SETS, WESTERN_ABOMINATIONS, WESTERN_BOSS_RULES);

export const MODERN_BOSS_IDS: ReadonlySet<string> = new Set(MODERN_ABOMINATIONS.map((boss) => boss.zombie));
export const MODERN_BOSS_COPIES: ReadonlyMap<string, number> = copiesOf(MODERN_ABOMINATIONS);
export const WESTERN_BOSS_IDS: ReadonlySet<string> = new Set(WESTERN_ABOMINATIONS.map((boss) => boss.zombie));
export const WESTERN_BOSS_COPIES: ReadonlyMap<string, number> = copiesOf(WESTERN_ABOMINATIONS);

export type BossName = FantasyZombie | FantasyNecromancer | NamedModernAbomination | WesternAbomination;
export const isBossName = (boss: string): boss is BossName =>
  FANTASY_BOSS_IDS.has(boss) || MODERN_BOSS_IDS.has(boss) || WESTERN_BOSS_IDS.has(boss);
/** A named Abomination that always prints a rule: the modern ones and the Western ones. */
export const isModernAbomination = (boss: string): boss is NamedModernAbomination | WesternAbomination =>
  MODERN_BOSS_IDS.has(boss) || WESTERN_BOSS_IDS.has(boss);

export const isWesternAbomination = (boss: string): boss is WesternAbomination => WESTERN_BOSS_IDS.has(boss);

const isBossRule = (value: unknown): value is BossRule => BOSS_RULES.includes(value as BossRule);

/** Stored choices, checked: anything unreadable or unsupported falls back to the defaults. */
export function parseThreat(raw: string | null, rules: readonly BossRule[] = BOSS_RULES): Threat {
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== 'object') return DEFAULT_THREAT;
    const { bossRule, off } = parsed as Record<string, unknown>;
    return {
      bossRule: isBossRule(bossRule) && rules.includes(bossRule) ? bossRule : (rules[0] ?? DEFAULT_THREAT.bossRule),
      off: Array.isArray(off) ? off.filter((id): id is string => typeof id === 'string') : [],
    };
  } catch {
    return DEFAULT_THREAT;
  }
}
