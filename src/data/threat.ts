import { type Deck, type Rng, shuffle } from '../game/engine.ts';
import type { BossRule, FantasyNecromancer, FantasyZombie, NamedAbomination, NamedNecromancer, ZombieCard } from '../game/types';

// Two ways to build the fantasy deck with its bosses; the players choose.
//
// Classic (Black Plague, Green Horde and their expansions): the bosses are cards of the Zombie deck.
// - Necromancer Cabals (Black Plague and Green Horde rulebooks): "Sort out the six standard Necromancer cards from the
//   Zombie pile, and replace them in any combination you see fit with your favorite Necromancer cards." Six cards per
//   core box switched on, so mixing both boxes keeps the share of Necromancers of a single box.
// - Abominations (Zombie Bosses, Horde Box): "simply add the corresponding Zombie cards to the standard Zombie pile",
//   one Abomination at a time; the Horde Box lets players remove some of the Zombie Giant's cards to suit their
//   playstyle. The Threat sets how many named Abomination cards go in, per core box switched on.
// - Fatty Bursters are Fatties, not Abominations: they always come with the Horde Box.
//
// Dead Men Tales (work-in-progress rulebook): the Zombie deck keeps the Abominations and Necromancers of its core
// boxes, and the named ones leave it. "The Abomination deck adds diversity and maintains the balance of the Zombie
// deck": one card for each Abomination players want, drawn whenever an Abomination should spawn. If one is already on
// the board, it gets an Extra Activation instead; in the Abomination Fest, all of them do, then one more arrives.
// "Playing with several Necromancers is done in the same way as playing with several Abominations." Cabals are not
// played that way.

/** Which rules build the fantasy deck: bosses among the Zombie cards, or drawn from their own decks. */
export type ThreatMode = 'classic' | 'deadMenTales';
export const THREAT_MODES: readonly ThreatMode[] = ['classic', 'deadMenTales'];
export const BOSS_RULES: readonly BossRule[] = ['oneAtATime', 'fest'];

/** How hard the fantasy deck hits: the named Abomination cards it takes per core box switched on. */
export type ThreatLevel = 'calm' | 'standard' | 'hard' | 'nightmare';
export const THREAT_LEVELS: readonly ThreatLevel[] = ['calm', 'standard', 'hard', 'nightmare'];
/** One named Abomination (4 cards) per core box at Standard, as when a single Abomination pack is added. */
export const THREAT_BUDGET: Readonly<Record<ThreatLevel, number>> = { calm: 2, standard: 4, hard: 8, nightmare: Infinity };

/**
 * The players' choices for the fantasy deck: the rules, the Threat (classic) or how Abominations arrive (Dead Men
 * Tales), and the bosses they leave out (none by default).
 */
export type Threat = { mode: ThreatMode; level: ThreatLevel; bossRule: BossRule; off: string[] };
export const DEFAULT_THREAT: Threat = { mode: 'classic', level: 'standard', bossRule: 'oneAtATime', off: [] };

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
];
/** Not Abominations by the rules, picked one by one but outside the Threat's budget. */
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
];

const CORE_NECROMANCERS: readonly { zombie: FantasyNecromancer; setId: string }[] = [
  { zombie: 'necromancer', setId: 'blackPlague' },
  { zombie: 'orcNecromancer', setId: 'greenHorde' },
];
/** The Abominations printed among the spawn cards of a set, which the Dead Men Tales Abomination deck starts with. */
const SET_ABOMINATIONS: readonly { zombie: FantasyZombie; setId: string }[] = [
  { zombie: 'fantasyAbomination', setId: 'blackPlague' },
  { zombie: 'orcAbomination', setId: 'greenHorde' },
  { zombie: 'taintedAbomination', setId: 'friendsAndFoes' },
  { zombie: 'wolfbomination', setId: 'wulfsburg' },
];
export const NECROMANCER_CARDS_PER_CORE = 6;
/** The Feral Dragon keeps half of its 8 cards below Nightmare: only one Dragon can be on the board anyway. */
const DRAGON_CARDS = 4;

const ABOMINATION_ZOMBIES = new Set<string>([...ABOMINATION_BOSSES, ...BIG_BOSSES].map((boss) => boss.zombie));
/** Every boss a Dead Men Tales deck can hold: its cards leave the Zombie deck. */
const DECK_BOSSES = new Set<string>(
  [...SET_ABOMINATIONS, ...ABOMINATION_BOSSES, ...BIG_BOSSES, ...CORE_NECROMANCERS, ...NECROMANCER_BOSSES].map((boss) => boss.zombie),
);
/** The bosses a saved boss deck may hold. */
export const BOSS_IDS: ReadonlySet<string> = DECK_BOSSES;

const namedZombie = (card: ZombieCard) =>
  card.kind === 'levels' && card.title === 'named' ? (card.boss ?? card.levels.find((level) => level)?.zombie) : undefined;

/** The boss a card spawns: a Necromancer, or the named Abomination printed across its levels. */
function bossOf(card: ZombieCard): string | undefined {
  if (card.kind === 'necromancer') return card.zombie;
  if (card.kind === 'levels' && card.boss && NECROMANCER_BOSSES.some((boss) => boss.zombie === card.boss)) return card.boss;
  const zombie = namedZombie(card);
  return zombie && ABOMINATION_ZOMBIES.has(zombie) ? zombie : undefined;
}

/** `total` cards dealt in turn to each pile, as long as it has some left. */
function dealInTurn(piles: readonly (readonly ZombieCard[])[], total: number): ZombieCard[] {
  const taken = piles.map(() => 0);
  let left = total;
  while (left > 0 && piles.some((pile, i) => taken[i] < pile.length)) {
    piles.forEach((pile, i) => {
      if (left > 0 && taken[i] < pile.length) {
        taken[i]++;
        left--;
      }
    });
  }
  return piles.flatMap((pile, i) => pile.slice(0, taken[i]));
}

/**
 * Builds the fantasy deck from the cards of the sets switched on: six Necromancer cards per core box, shared between
 * the standard and the named Necromancers chosen, and the named Abomination cards the Threat allows: whole
 * Abominations among the ones chosen (in a random order, so a small budget does not always favor the same ones).
 */
export function tailorFantasyDeck(cards: readonly ZombieCard[], threat: Threat, rng: Rng = Math.random): Deck {
  return threat.mode === 'deadMenTales' ? bossDecks(cards, threat) : { cards: classicDeck(cards, threat, rng) };
}

function classicDeck(cards: readonly ZombieCard[], threat: Threat, rng: Rng): ZombieCard[] {
  const setIds = new Set(cards.map((card) => card.setId));
  const cores = CORE_NECROMANCERS.filter((core) => setIds.has(core.setId)).length;
  const chosen = (boss: Boss) => setIds.has(boss.setId) && !threat.off.includes(boss.zombie);
  const cardsOf = (zombie: string) => cards.filter((card) => bossOf(card) === zombie);

  const necromancers = [
    ...CORE_NECROMANCERS.filter((core) => setIds.has(core.setId)),
    ...NECROMANCER_BOSSES.filter(chosen),
  ].map((boss) => cardsOf(boss.zombie));
  const abominations = shuffle(ABOMINATION_BOSSES.filter(chosen), rng).map((boss) => cardsOf(boss.zombie));
  const budget = THREAT_BUDGET[threat.level] * cores;
  const big = BIG_BOSSES.filter(chosen).flatMap((boss) => {
    const all = cardsOf(boss.zombie);
    return boss.zombie === 'feralDragon' && threat.level !== 'nightmare' ? all.slice(0, DRAGON_CARDS) : all;
  });
  const kept = new Set([
    ...dealInTurn(necromancers, NECROMANCER_CARDS_PER_CORE * cores),
    // One Abomination at a time, as the rulebooks add them: whole ones in a random order, the last one cut short.
    ...abominations.flat().slice(0, budget),
    ...big,
  ]);
  return cards.filter((card) => bossOf(card) === undefined || kept.has(card));
}

/**
 * Dead Men Tales: the Zombie deck keeps the cards of its core boxes, Necromancers and Abominations included, and loses
 * every named one (the Wolfbomination too); each boss of the sets switched on is one card of its deck.
 */
function bossDecks(cards: readonly ZombieCard[], threat: Threat): Deck {
  const setIds = new Set(cards.map((card) => card.setId));
  const inPlay = (boss: { setId: string }) => setIds.has(boss.setId);
  const chosen = (boss: Boss) => inPlay(boss) && !threat.off.includes(boss.zombie);
  // The named bosses (Wolfbomination included) leave the Zombie deck for their own; the rest stays, Fatty Bursters too.
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

const isThreatLevel = (value: unknown): value is ThreatLevel => THREAT_LEVELS.includes(value as ThreatLevel);
const isThreatMode = (value: unknown): value is ThreatMode => THREAT_MODES.includes(value as ThreatMode);
const isBossRule = (value: unknown): value is BossRule => BOSS_RULES.includes(value as BossRule);

/** Stored choices, checked: anything unreadable falls back to the defaults (every boss in, Standard). */
export function parseThreat(raw: string | null): Threat {
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== 'object') return DEFAULT_THREAT;
    const { mode, level, bossRule, off } = parsed as Record<string, unknown>;
    return {
      mode: isThreatMode(mode) ? mode : DEFAULT_THREAT.mode,
      level: isThreatLevel(level) ? level : DEFAULT_THREAT.level,
      bossRule: isBossRule(bossRule) ? bossRule : DEFAULT_THREAT.bossRule,
      off: Array.isArray(off) ? off.filter((id): id is string => typeof id === 'string') : [],
    };
  } catch {
    return DEFAULT_THREAT;
  }
}
