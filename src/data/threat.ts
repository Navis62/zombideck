import type { Deck } from '../game/engine.ts';
import type { BossRule, FantasyNecromancer, FantasyZombie, NamedAbomination, NamedNecromancer, ZombieCard } from '../game/types';

// The fantasy deck and its bosses, as White Death prints it and Dead Men Tales (work-in-progress rulebook) extends it
// to every fantasy box; Frozen Fortress gives each Black Plague and Green Horde boss a card of that kind.
// - The Zombie deck keeps the Abominations and Necromancers of its core boxes, and the named ones leave it.
// - "If there is no Abomination on the board: Draw an Abomination card, then spawn it. If there is already an
//   Abomination: It gets an extra Activation." (White Death #457-#462; the Necromancer! cards say the same.)
// - "The Abomination deck adds diversity and maintains the balance of the Zombie deck": one card for each Abomination
//   players want. In the Abomination Fest, all of them get an Extra Activation, then one more arrives.
// - "Playing with several Necromancers is done in the same way as playing with several Abominations."

export const BOSS_RULES: readonly BossRule[] = ['oneAtATime', 'fest'];

/** The players' choices for the fantasy deck: how Abominations arrive, and the bosses they leave out (none by default). */
export type Threat = { bossRule: BossRule; off: string[] };
export const DEFAULT_THREAT: Threat = { bossRule: 'oneAtATime', off: [] };

/** Bosses picked one by one, in the order of the expansions menu. */
export type Boss = { zombie: NamedAbomination | NamedNecromancer; setId: string };
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
/** The bosses a saved boss deck may hold. */
export const BOSS_IDS: ReadonlySet<string> = DECK_BOSSES;

const namedZombie = (card: ZombieCard) =>
  card.kind === 'levels' && card.title === 'named' ? (card.boss ?? card.levels.find((level) => level)?.zombie) : undefined;

/**
 * Builds the fantasy deck from the cards of the sets switched on: it keeps the cards of its core boxes, Necromancers
 * and Abominations included, and loses every named boss (the Wolfbomination too); each boss of the sets switched on
 * is one card of its deck, Frozen Fortress's too though it prints no spawn card (hence `setIds`).
 */
export function tailorFantasyDeck(
  cards: readonly ZombieCard[],
  threat: Threat,
  setIds: ReadonlySet<string> = new Set(cards.map((card) => card.setId)),
): Deck {
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
      necromancer: [...CORE_NECROMANCERS.filter(inPlay), ...NECROMANCER_BOSSES.filter(chosen)].map((boss) => boss.zombie),
    },
  };
}

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
