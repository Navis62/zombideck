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
import { WESTERN_SETS } from './western.ts';

// The fantasy deck and its bosses, as White Death prints it and Dead Men Tales (work-in-progress rulebook) extends it
// to every fantasy box; Frozen Fortress gives each Black Plague and Green Horde boss a card of that kind.
// - The Zombie deck keeps the Abominations and Necromancers of its core boxes, and the named ones leave it.
// - "If there is no Abomination on the board: Draw an Abomination card, then spawn it. If there is already an
//   Abomination: It gets an extra Activation." (White Death #457-#462; the Necromancer! cards say the same.)
// - "The Abomination deck adds diversity and maintains the balance of the Zombie deck": one card for each Abomination
//   players want. In the Abomination Fest, all of them get an Extra Activation, then one more arrives.
// - "Playing with several Necromancers is done in the same way as playing with several Abominations."

export const BOSS_RULES: readonly BossRule[] = ['oneAtATime', 'fest'];
/** Western rulebooks have no Abomination Fest: its Abominations arrive one at a time. */
export const WESTERN_BOSS_RULES: readonly BossRule[] = ['oneAtATime'];

/** The players' choices for the fantasy deck: how Abominations arrive, and the bosses they leave out (none by default). */
export type Threat = { bossRule: BossRule; off: string[] };
export const DEFAULT_THREAT: Threat = { bossRule: 'oneAtATime', off: [] };

/** Bosses picked one by one, in the order of the expansions menu. */
/** `copies`: how many identical cards of this boss the box holds in its boss deck (one by default). */
/** The bosses the players switch on and off one by one. */
export type ListedBoss = NamedAbomination | NamedNecromancer | NamedModernAbomination | WesternAbomination;
export type Boss<Zombie extends string = ListedBoss> = {
  zombie: Zombie;
  setId: string;
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
  { zombie: 'magentaCovefe', setId: 'hordeBox' },
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
];
/** Not Abominations by the rules, but they join the Abomination deck all the same. */
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
  { zombie: 'lordOfSkulls', setId: 'specialGuests' },
  // A Necromancer printed as a spawn card: his picture over the Swarms of Ratz he brings.
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
  // Three identical cards, all in the Necromancer deck.
  { zombie: 'fumaKotaro', setId: 'warlordsRisingSun', copies: 3 },
];

const CORE_NECROMANCERS: readonly { zombie: FantasyNecromancer; setId: string }[] = [
  { zombie: 'necromancer', setId: 'blackPlague' },
  { zombie: 'orcNecromancer', setId: 'greenHorde' },
  { zombie: 'defilerNecromancer', setId: 'whiteDeath' },
];
/** The Abominations of a box, which the Abomination deck starts with (White Death: its Khan Abomination card). */
const SET_ABOMINATIONS: readonly { zombie: FantasyZombie; setId: string }[] = [
  { zombie: 'fantasyAbomination', setId: 'blackPlague' },
  { zombie: 'orcAbomination', setId: 'greenHorde' },
  { zombie: 'khanAbomination', setId: 'whiteDeath' },
  { zombie: 'godEaterAbomination', setId: 'eternalEmpire' },
  { zombie: 'taintedAbomination', setId: 'friendsAndFoes' },
  { zombie: 'wolfbomination', setId: 'wulfsburg' },
];

/** Every boss a boss deck can hold: its cards leave the Zombie deck. */
const DECK_BOSSES = new Set<string>(
  [...SET_ABOMINATIONS, ...ABOMINATION_BOSSES, ...BIG_BOSSES, ...CORE_NECROMANCERS, ...NECROMANCER_BOSSES].map((boss) => boss.zombie),
);
/** The bosses a saved fantasy boss deck may hold. */
export const FANTASY_BOSS_IDS: ReadonlySet<string> = DECK_BOSSES;

/** How many cards of each boss the boxes can hold at most; a boss absent from the map has no known bound. */
function copiesOf(bosses: readonly Boss[]): ReadonlyMap<string, number> {
  const total = new Map<string, number>();
  for (const boss of bosses) total.set(boss.zombie, (total.get(boss.zombie) ?? 0) + (boss.copies ?? 1));
  return total;
}
// The generic Abominations and Necromancers of the core boxes are not bounded here: their cards are those of the deck.
const GENERIC_BOSSES = new Set<string>([...SET_ABOMINATIONS, ...CORE_NECROMANCERS].map((boss) => boss.zombie));
export const FANTASY_BOSS_COPIES: ReadonlyMap<string, number> = new Map(
  [...copiesOf([...ABOMINATION_BOSSES, ...BIG_BOSSES, ...NECROMANCER_BOSSES])].filter(([boss]) => !GENERIC_BOSSES.has(boss)),
);

const namedZombie = (card: ZombieCard) =>
  card.kind === 'levels' && card.title === 'named' ? (card.boss ?? card.levels.find((level) => level)?.zombie) : undefined;

/**
 * Builds the fantasy deck from the cards of the sets switched on: it keeps the cards of its core boxes, Necromancers
 * and Abominations included, and loses every named boss (the Wolfbomination too); each boss of the sets switched on
 * is one card of its deck, Frozen Fortress's too though it prints no spawn card (hence `setIds`).
 */
export function tailorFantasyDeck(cards: readonly ZombieCard[], threat: Threat, setIds: ReadonlySet<string>): Deck {
  const inPlay = (boss: { setId: string }) => setIds.has(boss.setId);
  const chosen = (boss: Boss) => inPlay(boss) && !threat.off.includes(boss.zombie);
  // The named bosses leave the Zombie deck for their own; the rest stays, Fatty Bursters too.
  const named = (card: ZombieCard) => {
    const zombie = card.kind === 'necromancer' ? card.zombie : namedZombie(card);
    return zombie !== undefined && DECK_BOSSES.has(zombie) && !CORE_NECROMANCERS.some((core) => core.zombie === zombie);
  };
  return {
    cards: cards.filter((card) => !named(card)),
    bosses: {
      rule: threat.bossRule,
      abomination: [
        ...SET_ABOMINATIONS.filter(inPlay),
        ...ABOMINATION_BOSSES.filter(chosen),
        ...BIG_BOSSES.filter(chosen),
      ].map((boss) => boss.zombie),
      necromancer: [
        ...CORE_NECROMANCERS.filter(inPlay),
        ...NECROMANCER_BOSSES.filter(chosen).flatMap((boss) => Array<Boss>(boss.copies ?? 1).fill(boss)),
      ].map((boss) => boss.zombie),
    },
  };
}

/**
 * The named Abominations of the modern era (Zombicide 2nd edition rulebook p.17: "If there is no Abomination on the
 * board, draw a card from the Abomination deck. Then, place the corresponding Abomination in the Spawn Zone. If there
 * is already an Abomination on the board, it gets an extra Activation."; p.30 for the Abomination Fest). Each one
 * belongs to the set whose box holds it; the ones of the core box belong to `core2e`, and stay when Fort Hendrix
 * replaces it. Only transcribed bosses are available. The card text is in the translations
 * (`card.<id>Rule`); the Kit's Abominations belong to `abomination` (its box is always in play).
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
  { zombie: 'alphaVampire', setId: 'supernatural' },
  { zombie: 'wendigo', setId: 'supernatural' },
  { zombie: 'leviathan', setId: 'supernatural' },
  { zombie: 'blackDog', setId: 'supernatural' },
  { zombie: 'crowley', setId: 'supernatural' },
  { zombie: 'archangelMichael', setId: 'supernatural' },
  { zombie: 'zuul', setId: 'ghostbusters' },
  { zombie: 'vinzClortho', setId: 'ghostbusters' },
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
  { zombie: 'batmanWhoLaughs', setId: 'darkNightsMetal', power: { kind: 'bringsAlong', boss: 'theRobins' } },
  { zombie: 'theRobins', setId: 'darkNightsMetal' },
  { zombie: 'loboBatman', setId: 'darkNightsMetal' },
  { zombie: 'batmanEarth1', setId: 'darkNightsMetal' },
  { zombie: 'batmanEarth11', setId: 'darkNightsMetal' },
  { zombie: 'batmanEarth32', setId: 'darkNightsMetal' },
  { zombie: 'batmanEarth52', setId: 'darkNightsMetal' },
];

/**
 * The sets whose boxes are in play: those switched on, and the ones they replace (Fort Hendrix brings the core box's
 * Abominations along, though `activeSetIds` leaves the core set out). Menu and deck use it alike.
 */
export function presentSetIds(sets: readonly CardSet[], setIds: Iterable<string>): Set<string> {
  const present = new Set(setIds);
  for (const set of sets) if (set.replaces && present.has(set.id)) present.add(set.replaces);
  return present;
}

/**
 * Builds the modern deck: no card leaves it (the generic Abomination cards, the upgrade kit's included, are the ones
 * that call on the Abomination deck). With no named Abomination available and switched on, there is no boss deck and
 * the game plays as the printed deck does. The Necromancer deck stays empty: the era has no Necromancers.
 */
function abominationTailor(sets: readonly CardSet[], listed: readonly Boss<string>[]) {
  return (
    cards: readonly ZombieCard[],
    threat: Threat,
    setIds: ReadonlySet<string>,
    abominations: readonly Boss<string>[] = listed,
  ): Deck => {
    const present = presentSetIds(sets, setIds);
    const chosen = abominations.filter((boss) => present.has(boss.setId) && !threat.off.includes(boss.zombie));
    // Once the deck runs out, its discard is reshuffled as in Fantasy; the 2nd edition rulebook gives no rule for it.
    if (chosen.length === 0) return { cards: [...cards] };
    return {
      cards: [...cards],
      bosses: {
        rule: threat.bossRule,
        abomination: chosen.flatMap((boss) => Array<string>(boss.copies ?? 1).fill(boss.zombie)),
        necromancer: [],
      },
    };
  };
}

export const tailorModernDeck = abominationTailor(CARD_SETS, MODERN_ABOMINATIONS);

/**
 * The named Abominations of the Wild West era (Undead or Alive and its boxes), each one in the box that holds it,
 * as printed on its card (the rule is in the translations, `card.<id>Rule`). The core box's text cards (#013-#016,
 * #029-#033) call on this deck, which starts with the Bowler Hat of the core box. The Wendigo is an event promo (`westernPromos`).
 */
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
];

export const tailorWesternDeck = abominationTailor(WESTERN_SETS, WESTERN_ABOMINATIONS);

/** The bosses a saved modern boss deck may hold. */
export const MODERN_BOSS_IDS: ReadonlySet<string> = new Set(MODERN_ABOMINATIONS.map((boss) => boss.zombie));
export const MODERN_BOSS_COPIES: ReadonlyMap<string, number> = copiesOf(MODERN_ABOMINATIONS);
/** The bosses a saved Western boss deck may hold. */
export const WESTERN_BOSS_IDS: ReadonlySet<string> = new Set(WESTERN_ABOMINATIONS.map((boss) => boss.zombie));
export const WESTERN_BOSS_COPIES: ReadonlyMap<string, number> = copiesOf(WESTERN_ABOMINATIONS);

/** Every boss a boss deck can reveal: a card shows its name, picture and rule. */
export type BossName = FantasyZombie | FantasyNecromancer | NamedModernAbomination | WesternAbomination;
export const isBossName = (boss: string): boss is BossName =>
  FANTASY_BOSS_IDS.has(boss) || MODERN_BOSS_IDS.has(boss) || WESTERN_BOSS_IDS.has(boss);
/** A named Abomination that always prints a rule: the modern ones and the Western ones. */
export const isModernAbomination = (boss: string): boss is NamedModernAbomination | WesternAbomination =>
  MODERN_BOSS_IDS.has(boss) || WESTERN_BOSS_IDS.has(boss);

const isBossRule = (value: unknown): value is BossRule => BOSS_RULES.includes(value as BossRule);

/** Stored choices, checked: anything unreadable falls back to the defaults (every boss in, one at a time). */
export function parseThreat(raw: string | null): Threat {
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== 'object') return DEFAULT_THREAT;
    const { bossRule, off } = parsed as Record<string, unknown>;
    return {
      bossRule: isBossRule(bossRule) ? bossRule : DEFAULT_THREAT.bossRule,
      off: Array.isArray(off) ? off.filter((id): id is string => typeof id === 'string') : [],
    };
  } catch {
    return DEFAULT_THREAT;
  }
}
