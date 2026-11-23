import type {
  BoardBoss,
  BossDeck,
  BossKind,
  BossPiles,
  BossRule,
  CardPart,
  CardSet,
  DangerLevel,
  DeckParts,
  GameState,
  Piles,
  Revealed,
  TrejoPiles,
  UniverseId,
  ZombieCard,
} from './types';
import { NO_BOSS, NO_DECK } from './types.ts';

export type Rng = () => number;

export const DANGER_LEVELS: readonly DangerLevel[] = ['blue', 'yellow', 'orange', 'red'];
export const UNIVERSE_IDS: readonly UniverseId[] = ['modern', 'fantasy', 'invader', 'western'];

/** Each universe keeps its own game: starting one never replaces another's. */
export const gameKey = (universe: UniverseId) => `zombideck.game.${universe}`;
export const MAX_UNDO = 20;
export const MAX_ZONES = 8;

const NO_TREJO: TrejoPiles = { stage: 'none', resolved: {} };
/** Whether a card is a Trejo card (Danny Trejo set); the engine does not know the cards. */
export type IsTrejoCard = (cardId: string) => boolean;
const noTrejo: IsTrejoCard = () => false;

/** Resolves the Trejo cards among `cards`, in order, from the stage of the board. */
function resolveTrejo(from: TrejoPiles['stage'], cards: readonly string[], isTrejo: IsTrejoCard, kept: TrejoPiles['resolved'] = {}): TrejoPiles {
  let stage = from;
  const resolved = { ...kept };
  for (const card of cards) {
    if (!isTrejo(card)) continue;
    if (stage === 'none') {
      resolved[card] = 3;
      stage = 'walker';
    } else if (stage === 'walker') {
      resolved[card] = 2;
      stage = 'abomination';
    } else {
      resolved[card] = 1;
    }
  }
  return { stage, resolved };
}

/**
 * Whether the Trejobomination is on the board, as an Abomination, when a card of `drawn` is dealt: it is there (stage
 * `abomination`) and the card comes after the last card of the step that transformed it (zone order decides). Derived,
 * never saved.
 */
export function trejoOnBoardAt(trejo: TrejoPiles, drawn: readonly string[]): (card: string) => boolean {
  let transformed = -1;
  drawn.forEach((card, i) => {
    if (trejo.resolved[card] === 2) transformed = i;
  });
  return (card) => trejo.stage === 'abomination' && drawn.indexOf(card) > transformed;
}

const remember = (state: GameState) => [...state.history, state.piles].slice(-MAX_UNDO);

export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function activeSetIds(sets: readonly CardSet[], expansions: readonly string[]): string[] {
  const active = sets.filter((set) => !set.optional || expansions.includes(set.id));
  return active
    .filter((set) => !active.some((other) => other.replaces === set.id))
    .map((set) => set.id);
}

export const ALL_PARTS: DeckParts = { easy: true, hard: true, extra: true };

export function cardPart(set: CardSet, card: ZombieCard): CardPart {
  if (card.kind === 'extra' || card.kind === 'xenoExtra' || card.kind === 'westernExtra') return 'extra';
  return set.isHard(card) ? 'hard' : 'easy';
}

const zombieCards = (sets: readonly CardSet[]) =>
  sets.filter((set) => set.addsZombies).reduce((total, set) => total + set.cards.length, 0);

/** The cards of a scaled set, easier and harder in turn, as many as the share of zombie expansions switched on. */
function scaledCards(set: CardSet, share: number): readonly ZombieCard[] {
  const easy = set.cards.filter((card) => !set.isHard(card));
  const hard = set.cards.filter((card) => set.isHard(card));
  const alternate = easy.flatMap((card, i) => [card, ...(hard[i] ? [hard[i]] : [])]).concat(hard.slice(easy.length));
  return alternate.slice(0, Math.round(set.cards.length * share));
}

export function selectCards(
  sets: readonly CardSet[],
  setIds: readonly string[],
  parts: DeckParts = ALL_PARTS,
): ZombieCard[] {
  const active = sets.filter((set) => setIds.includes(set.id));
  const share = zombieCards(sets) ? zombieCards(active) / zombieCards(sets) : 0;
  return active.flatMap((set) =>
    (set.scaled ? scaledCards(set, share) : set.cards).filter((card) => parts[cardPart(set, card)]),
  );
}

/** The bosses of the Abomination and Necromancer decks, when the bosses are not cards of the Zombie deck. */
export type BossSetup = { rule: BossRule; abomination: string[]; necromancer: string[] };
/** A new deck: its cards and, with the Dead Men Tales rules, its boss decks. */
export type Deck = { cards: ZombieCard[]; bosses?: BossSetup };
/** Last say on the cards of a new deck, such as the fantasy era dosing its bosses. */
export type Tailor = (cards: ZombieCard[], rng: Rng) => Deck;
const keepAll: Tailor = (cards) => ({ cards });

export function newGame(
  sets: readonly CardSet[],
  setIds: string[],
  parts: DeckParts = ALL_PARTS,
  rng: Rng = Math.random,
  zones = 1,
  universe: UniverseId = 'modern',
  tailor: Tailor = keepAll,
): GameState {
  const deck = tailor(selectCards(sets, setIds, parts), rng);
  const ids = deck.cards.map((card) => card.id);
  const bossDeck = (bosses: readonly string[]): BossDeck => ({ draw: shuffle(bosses, rng), discard: [] });
  const bosses = deck.bosses
    ? { abomination: bossDeck(deck.bosses.abomination), necromancer: bossDeck(deck.bosses.necromancer), revealed: {}, manual: [], onBoard: [] }
    : null;
  return {
    version: 9,
    bossRule: deck.bosses?.rule ?? null,
    universe,
    setIds,
    piles: { draw: shuffle(ids, rng), discard: [], drawn: [], reshuffled: false, bosses, trejo: NO_TREJO },
    history: [],
    danger: 'blue',
    zones: clampZones(zones),
  };
}

/**
 * What a card does to the Spawn step, besides what it spawns:
 * - `spawn`: it serves its Spawn Zone;
 * - `drawAgain` (SPAM, "draw the next card"): it comes out with the next card, which serves the same zone;
 * - `double` (Double Spawn): nothing spawns there, and the next zone gets two cards instead of one;
 * - `endStep` (Enter the Horde): the Horde spawns there and the Spawn step ends.
 */
export type SpawnEffect = 'spawn' | 'drawAgain' | 'double' | 'endStep';
export type CardEffect = (cardId: string) => SpawnEffect;
const plainCards: CardEffect = () => 'spawn';

/** The boss deck a card calls on at a Danger Level, if any: an Abomination it spawns, a Necromancer. */
export type BossTrigger = (cardId: string, danger: DangerLevel) => BossKind | undefined;
const noBosses: BossTrigger = () => undefined;

/**
 * What a boss does when it is revealed, besides being on display (modern Abominations):
 * - `cantrip` (SPAM): not a boss; it is set aside and the next card of the deck is drawn instead;
 * - `absorb` (Gozer): `draw` more cards are drawn, the players keep `keep` of them with the boss;
 * - `bringsAlong` (Batman Who Laughs): another boss comes with it, taken from the deck or the discard; `unblocks`
 *   as below;
 * - `unblocks` (Zuul, Vinz Clortho): "spawn Abominations as if there were no Abominations on the board" while it is
 *   there, so a new Abomination card draws a new one instead of activating the one on the board;
 * - `drawOnDeath` (Alpha Vampire): when removed, the next Abomination of the deck spawns;
 * - `chain` (a boss-deck card that stands for a chain of bosses): it reveals `first`, then leaves the game (in no pile);
 * - `chained` (a boss of such a chain, standing for `card`): removed, it leaves the game (no discard) and `next` arrives,
 *   none ending the chain; sent back to the deck, it sends `card` instead, once;
 * - `single`: a new copy replaces the one in play;
 * - `brings` (Lord of Skulls: Doom and Gloom): when revealed, each boss of `bosses` not already in play arrives from the
 *   reserve as its own group of `bossKind`, drawn by hand (no deck is touched);
 * - `escort`: such a boss has no card: it is never put in a pile (removed, sent back or reshuffled, it leaves the game)
 *   and comes back with the next reveal of its bringer.
 */
export type BossPower<Z extends string = string> =
  | { kind: 'cantrip' }
  | { kind: 'absorb'; draw: number; keep: number }
  | { kind: 'bringsAlong'; boss: Z; unblocks?: true }
  | { kind: 'unblocks' }
  | { kind: 'drawOnDeath' }
  | { kind: 'chain'; first: Z }
  | { kind: 'chained'; card: Z; next?: Z }
  | { kind: 'single' }
  | { kind: 'brings'; bosses: readonly Z[]; bossKind: BossKind }
  | { kind: 'escort' };
export type BossPowers = (boss: string) => BossPower | undefined;
export const noPowers: BossPowers = () => undefined;

/** The powers of a list of bosses, by boss id. */
export function powersOf(bosses: readonly { zombie: string; power?: BossPower }[]): BossPowers {
  const byBoss = new Map(bosses.flatMap((boss) => (boss.power ? [[boss.zombie, boss.power] as const] : [])));
  return (boss) => byBoss.get(boss);
}

const isRealBoss = (boss: string) => boss !== NO_BOSS && boss !== NO_DECK;

const withoutGone = (list: readonly string[], gone: readonly string[] = []) => {
  const rest = [...list];
  for (const boss of gone) {
    const at = rest.indexOf(boss);
    if (at >= 0) rest.splice(at, 1);
  }
  return rest;
};
const bossList = (group: Revealed): string[] => [...(isRealBoss(group.boss) ? [group.boss] : []), ...(group.along ?? []), ...(group.gained ?? [])];

/** The bosses of a revealed group still alive: its boss, the ones brought along or gained, less those removed. */
export const liveBosses = (group: Revealed): string[] => withoutGone(bossList(group), group.gone);

/** What the boss of a revealed group brings from the reserve (`brings`), if it brings anything. */
function bringing(group: Revealed, powers: BossPowers) {
  const power = isRealBoss(group.boss) ? powers(group.boss) : undefined;
  return power?.kind === 'brings' ? power : undefined;
}

/** The groups of the escorts a revealed boss brings: each one not in play yet, on its own. */
function escortsOf(group: Revealed, shown: readonly Revealed[], powers: BossPowers): Revealed[] {
  const bringer = bringing(group, powers);
  const live = new Set(shown.flatMap(liveBosses));
  const arriving: Revealed[] = [];
  for (const boss of bringer?.bosses ?? []) {
    if (live.has(boss)) continue;
    live.add(boss);
    arriving.push({ kind: bringer!.bossKind, boss });
  }
  return arriving;
}

/** Fest: a boss that left no longer gets the Extra Activation shown on the cards (a group left with none says so). */
function forgetBoss(revealed: Record<string, Revealed>, manual: Revealed[], kind: BossKind, boss: string) {
  const without = (group: Revealed): Revealed => {
    if (!group.activated?.includes(boss) || group.kind !== kind) return group;
    const { activated, ...rest } = group;
    const left = withoutGone(activated, [boss]);
    const next: Revealed = left.length > 0 ? { ...rest, activated: left } : rest;
    return left.length === 0 && group.boss === NO_BOSS && !group.trejo ? { ...next, none: true } : next;
  };
  return {
    revealed: Object.fromEntries(Object.entries(revealed).map(([card, group]) => [card, without(group)])),
    manual: manual.map(without).filter((group) => !group.none),
  };
}

/** Cards of a group that are no boss in play: the SPAMs set aside and the candidates not chosen. */
const idleCards = (group: Revealed): string[] => [...(group.spam ?? []), ...(group.choice?.offered ?? [])];

/** Every card of a revealed group still out of the decks: its live bosses, the SPAMs set aside, the candidates offered. */
export const groupCards = (group: Revealed): string[] => [...liveBosses(group), ...idleCards(group)];

/** The board as groups, so that it counts with the ones on display. */
const boardGroups = (onBoard: readonly BoardBoss[]): Revealed[] => onBoard.map(({ kind, boss }) => ({ kind, boss }));
const shownGroups = (bosses: BossPiles, revealed = bosses.revealed, manual = bosses.manual): Revealed[] => [
  ...boardGroups(bosses.onBoard),
  ...Object.values(revealed),
  ...manual,
];

const unblocks = (power: BossPower | undefined) => power?.kind === 'unblocks' || (power?.kind === 'bringsAlong' && !!power.unblocks);

/**
 * How a card calling on a boss deck arrives, given every group on the board and on display: with the one at a time
 * rule, a boss of its kind already there is named and gets the Extra Activation (nothing is drawn), unless one lets
 * others spawn; in the Abomination Fest the bosses there all get it and a new one is revealed. The Trejobomination
 * (`trejoOnBoard`) is an Abomination of the board too: it gets the Extra Activation beside the named bosses (`trejo` on
 * the group) and, alone, nothing is drawn; it never blocks a boss that lets others spawn.
 */
function arrive(decks: Decks, shown: readonly Revealed[], kind: BossKind, rng: Rng, powers: BossPowers, rule: BossRule | null, trejoOnBoard = false): Revealed {
  const live = shown.filter((group) => group.kind === kind).flatMap(liveBosses);
  const open = kind === 'abomination' && live.some((boss) => unblocks(powers(boss)));
  const trejo = kind === 'abomination' && trejoOnBoard;
  if (rule === 'oneAtATime' && (live.length > 0 || trejo) && !open) {
    return { kind, boss: NO_BOSS, ...(live.length > 0 ? { activates: live[0] } : {}), ...(trejo ? { trejo: true as const } : {}) };
  }
  const group = revealOne(decks, shown, kind, rng, powers);
  if (rule === 'fest' && live.length > 0) group.activated = live;
  if (trejo) {
    group.trejo = true;
    // The Trejobomination is an Abomination: the game did have one, an empty deck is only exhausted.
    if (group.boss === NO_DECK) group.boss = NO_BOSS;
    // One at a time, a boss that lets others spawn leaves an empty deck: the named bosses still get theirs.
    if (rule === 'oneAtATime' && group.boss === NO_BOSS && group.activates === undefined && live.length > 0) group.activates = live[0];
  }
  return group;
}

// An exhausted deck reshuffles its discard, in every era. The 2nd edition rulebook gives no rule for it: this extends
// the Dead Men Tales one to the modern Abomination deck.
function drawBoss(deck: BossDeck, rng: Rng): { boss?: string; deck: BossDeck } {
  let { draw, discard } = deck;
  if (draw.length === 0) {
    if (discard.length === 0) return { deck };
    draw = shuffle(discard, rng);
    discard = [];
  }
  const [boss, ...rest] = draw;
  return { boss, deck: { draw: rest, discard } };
}

/**
 * The boss decks once some cards leave the display and others are dealt (each one calling on a deck reveals its top
 * card, the deck reshuffling its discard when empty). The bosses that leave go to the board (`to: 'board'`: a Spawn
 * step went by) or back to the discard of their deck (`'deck'`: the card changed its mind or the game restarts).
 */
function revealBosses(
  bosses: BossPiles | null,
  leaving: readonly string[],
  dealt: readonly string[],
  trigger: BossTrigger,
  danger: DangerLevel,
  rng: Rng,
  powers: BossPowers,
  rule: BossRule | null,
  /** The groups drawn by hand leave too (a new Spawn step starts). */
  releaseManual = false,
  to: 'board' | 'deck' = 'deck',
  /** Whether the Trejobomination is on the board for a card dealt (an Abomination card then names it too). */
  trejoOnBoard: (card: string) => boolean = () => false,
): BossPiles | null {
  if (!bosses) return null;
  const decks = { abomination: bosses.abomination, necromancer: bosses.necromancer };
  let revealed: Record<string, Revealed> = { ...bosses.revealed };
  let manual = bosses.manual;
  let onBoard = bosses.onBoard;
  const leave = (group: Revealed) => {
    if (to === 'deck') {
      // A bringer that goes back to its deck takes the escorts it brought: they have no card to go back with.
      const bringer = bringing(group, powers);
      for (const escort of bringer?.bosses ?? []) {
        // An Extra Activation by hand that named the escort goes with it.
        manual = manual.filter((other) => !(other.boss === escort && liveBosses(other).includes(escort)) && other.activates !== escort);
        ({ revealed, manual } = forgetBoss(revealed, manual, bringer!.bossKind, escort));
      }
      return discardGroup(decks, group, powers);
    }
    onBoard = [...onBoard, ...liveBosses(group).map((boss) => ({ kind: group.kind, boss }))];
    discardCards(decks, group.kind, idleCards(group));
  };
  for (const card of leaving) {
    const group = revealed[card];
    if (!group) continue;
    leave(group);
    delete revealed[card];
  }
  if (releaseManual) {
    manual.forEach(leave);
    manual = [];
  }
  for (const card of dealt) {
    const kind = trigger(card, danger);
    if (!kind) continue;
    // Dead Men Tales, rulebook p.17 and White Death cards #457-462: "If there is no Abomination on the board: draw an
    // Abomination card, then spawn it. If there is already an Abomination: it gets an extra Activation." The step is
    // resolved zone after zone, so a boss of this kind already on the board (an earlier step), revealed earlier in the
    // step or drawn by hand is named and activated: nothing is drawn. The Abomination Fest draws for every card.
    const group = arrive(decks, shownGroups({ ...bosses, onBoard }, revealed, manual), kind, rng, powers, rule, trejoOnBoard(card));
    revealed[card] = group;
    if (powers(group.boss)?.kind === 'single') {
      const next = supersede(decks, { revealed, manual, onBoard }, card, group);
      revealed = next.revealed;
      manual = next.manual;
      onBoard = next.onBoard;
    }
    manual = [...manual, ...escortsOf(group, shownGroups({ ...bosses, onBoard }, revealed, manual), powers)];
  }
  return { ...decks, revealed, manual, onBoard };
}

/** The first live boss of a kind among the groups on display. */
const firstBoss = (groups: readonly Revealed[], kind: BossKind) => groups.filter((group) => group.kind === kind).flatMap(liveBosses)[0];

/**
 * Once the cards of a step are in their zone order, the first card calling on a boss deck is the one that reveals the
 * boss, the later ones only name it. A boss revealed by a later card (a Danger Level change made an earlier card call)
 * moves to the first one; every Extra Activation then names the first boss on display.
 */
function orderActivations(bosses: BossPiles, drawn: readonly string[]): BossPiles {
  const revealed: Record<string, Revealed> = { ...bosses.revealed };
  for (const kind of BOSS_KINDS) {
    const cards = drawn.filter((card) => revealed[card]?.kind === kind);
    const owner = cards.find((card) => liveBosses(revealed[card]).length > 0);
    if (owner !== undefined && owner !== cards[0] && !isRealBoss(revealed[cards[0]].boss)) {
      // The Trejobomination activation stays with the first card.
      revealed[cards[0]] = revealed[cards[0]].trejo ? { ...revealed[owner], trejo: true } : revealed[owner];
      revealed[owner] = { kind, boss: NO_BOSS };
    }
    const named = bosses.onBoard.find((boss) => boss.kind === kind)?.boss ?? firstBoss([...cards.map((card) => revealed[card]), ...bosses.manual], kind);
    for (const card of cards) {
      const group = revealed[card];
      if (group.boss !== NO_BOSS) continue;
      const { activates: _old, none: _none, ...bare } = group;
      // With no boss of this kind left anywhere, `none` tells the screen (not the deck being out of bosses).
      revealed[card] = named ? { ...bare, activates: named } : group.trejo ? bare : { ...bare, none: true };
    }
  }
  return { ...bosses, revealed };
}

type Decks = { abomination: BossDeck; necromancer: BossDeck };

/** A group that leaves the display puts all its cards in the discard of its boss deck. */
function discardGroup(decks: Decks, group: Revealed, powers: BossPowers) {
  discardCards(decks, group.kind, cardsBackToDeck(groupCards(group), [...decks[group.kind].draw, ...decks[group.kind].discard], powers));
}

/** What goes back in a deck for these bosses: a chained one sends its card, once, unless the card is already `kept`. */
function cardsBackToDeck(bosses: readonly string[], kept: readonly string[], powers: BossPowers): string[] {
  const back: string[] = [];
  for (const boss of bosses) {
    const power = powers(boss);
    if (power?.kind === 'escort') continue;
    if (power?.kind !== 'chained') back.push(boss);
    else if (!kept.includes(power.card) && !back.includes(power.card)) back.push(power.card);
  }
  return back;
}

/** A group whose boss is removed: it stays on display as gone, its pending candidates go to the discard. */
function retire(decks: Decks, group: Revealed, boss: string): Revealed {
  const { choice, ...rest } = group;
  // A boss that waits for its choice leaves without it: the candidates go back to the discard.
  const pending = choice && group.boss === boss;
  if (pending) discardCards(decks, group.kind, choice.offered);
  return { ...(pending ? rest : group), gone: [...(group.gone ?? []), boss] };
}

type Placed = { revealed: Record<string, Revealed>; manual: Revealed[]; onBoard: BoardBoss[] };

/**
 * A `single` boss was just revealed in `card`'s group: the copy in play (on the board, else in another card of the step,
 * else drawn by hand) is removed and discarded, and no longer gets the Extra Activation shown on the new card.
 */
function supersede(decks: Decks, placed: Placed, card: string, group: Revealed): Placed {
  const { boss, kind } = group;
  let { revealed, manual, onBoard } = placed;
  const at = onBoard.findIndex((other) => other.boss === boss);
  const other = Object.keys(revealed).find((key) => key !== card && liveBosses(revealed[key]).includes(boss));
  const byHand = manual.findIndex((other) => liveBosses(other).includes(boss));
  if (at >= 0) onBoard = onBoard.filter((_, i) => i !== at);
  else if (other !== undefined) revealed = { ...revealed, [other]: retire(decks, revealed[other], boss) };
  else if (byHand >= 0) manual = manual.map((g, i) => (i === byHand ? retire(decks, g, boss) : g));
  else return placed;
  discardCards(decks, kind, [boss]);
  const { activated, ...bare } = group;
  const left = withoutGone(activated ?? [], [boss]);
  revealed = { ...revealed, [card]: left.length > 0 ? { ...bare, activated: left } : bare };
  return { revealed, manual, onBoard };
}

function discardCards(decks: Decks, kind: BossKind, cards: readonly string[]) {
  if (cards.length > 0) decks[kind] = { ...decks[kind], discard: [...decks[kind].discard, ...cards] };
}

/**
 * Reveals the next boss of a deck (`decks` is updated), with its powers: SPAMs are set aside, a boss that absorbs
 * draws its candidates, one that brings another along takes it from the deck or the discard. `shown` is every group
 * on display: a boss already there is not brought along twice.
 */
function revealOne(decks: Decks, shown: readonly Revealed[], kind: BossKind, rng: Rng, powers: BossPowers): Revealed {
  const spam: string[] = [];
  // The next card that is not a cantrip; cantrips are set aside on the way.
  const pull = (): string | undefined => {
    for (;;) {
      const { boss, deck } = drawBoss(decks[kind], rng);
      decks[kind] = deck;
      if (boss === undefined || powers(boss)?.kind !== 'cantrip') return boss;
      spam.push(boss);
    }
  };
  const drawn = pull();
  const power = drawn === undefined ? undefined : powers(drawn);
  // A chain card is not a boss: it stands for the first beast and leaves the game.
  const boss = power?.kind === 'chain' ? power.first : drawn;
  const group: Revealed = { kind, boss: '' };
  if (boss === undefined) {
    // Every boss of the deck is on display already: the card still calls on it, they get an Extra Activation.
    // With none on display either, the game never had a boss of this kind (SPAMs set aside do not count as bosses).
    const onDisplay = shown.some((other) => other.kind === kind && liveBosses(other).length > 0);
    group.boss = onDisplay ? NO_BOSS : NO_DECK;
  } else {
    group.boss = boss;
  }
  if (power?.kind === 'bringsAlong') {
    const target = power.boss;
    const displayed = [...shown, group].some((other) => groupCards(other).includes(target));
    const taken = displayed ? false : takeFrom(decks, kind, target);
    if (taken) group.along = [target];
  }
  if (power?.kind === 'absorb') {
    const offered: string[] = [];
    while (offered.length < power.draw) {
      const candidate = pull();
      if (candidate === undefined) break;
      offered.push(candidate);
    }
    if (offered.length <= power.keep) {
      if (offered.length > 0) group.gained = offered;
    } else {
      group.choice = { offered, keep: power.keep };
    }
  }
  if (spam.length > 0) group.spam = spam;
  return group;
}

/** Removes one copy of a boss from the deck, else from its discard; whether there was one. */
function takeFrom(decks: Decks, kind: BossKind, boss: string): boolean {
  const { draw, discard } = decks[kind];
  const inDraw = draw.indexOf(boss);
  if (inDraw >= 0) {
    decks[kind] = { draw: draw.filter((_, i) => i !== inDraw), discard };
    return true;
  }
  const inDiscard = discard.indexOf(boss);
  if (inDiscard < 0) return false;
  decks[kind] = { draw, discard: discard.filter((_, i) => i !== inDiscard) };
  return true;
}

/** Where a Spawn step stands after some cards: the zone being served and how many cards it still needs. */
type StepPlan = { zone: number; need: number; doubles: number; extra: boolean; done: boolean };
const START: StepPlan = { zone: 1, need: 1, doubles: 0, extra: false, done: false };

/**
 * Follows the Black Plague rules for Double Spawn: each one drawn for a zone gives the next zone two cards (two
 * Double Spawns, four cards). One drawn for the last zone gives the first zone an extra double spawn, even if it
 * already spawned, and so on until a zone draws no Double Spawn.
 */
function nextPlan(plan: StepPlan, effect: SpawnEffect, zones: number): StepPlan {
  if (plan.done) return plan;
  if (effect === 'endStep') return { ...plan, done: true };
  if (effect === 'drawAgain') return plan;
  const doubles = plan.doubles + (effect === 'double' ? 1 : 0);
  const need = plan.need - 1;
  if (need > 0) return { ...plan, need, doubles };
  if (doubles > 0) {
    const last = plan.zone >= zones;
    return { zone: last ? 1 : plan.zone + 1, need: doubles * 2, doubles: 0, extra: plan.extra || last, done: false };
  }
  if (plan.extra || plan.zone >= zones) return { ...plan, need: 0, doubles: 0, done: true };
  return { zone: plan.zone + 1, need: 1, doubles: 0, extra: false, done: false };
}

const planOf = (drawn: readonly string[], effect: CardEffect, zones: number) =>
  drawn.reduce((plan, card) => nextPlan(plan, effect(card), zones), START);

/**
 * Deals one card to each Spawn Zone, more when cards ask for it. The cards of the previous step go to the discard
 * first; an empty deck reshuffles the discard, never the cards being dealt.
 */
export function drawCards(
  state: GameState,
  effect: CardEffect = plainCards,
  rng: Rng = Math.random,
  trigger: BossTrigger = noBosses,
  powers: BossPowers = noPowers,
  isTrejo: IsTrejoCard = noTrejo,
): GameState {
  let draw = state.piles.draw;
  let discard = [...state.piles.discard, ...state.piles.drawn];
  const drawn: string[] = [];
  let reshuffled = false;
  let plan = START;
  while (!plan.done) {
    if (draw.length === 0) {
      if (discard.length === 0) break;
      draw = shuffle(discard, rng);
      discard = [];
      reshuffled = true;
    }
    const [card, ...rest] = draw;
    draw = rest;
    drawn.push(card);
    plan = nextPlan(plan, effect(card), state.zones);
  }
  if (drawn.length === 0) return state;
  // The Trejo cards resolve first: an Abomination card dealt after a transform finds the Trejobomination on the board.
  const trejo = resolveTrejo(state.piles.trejo.stage, drawn, isTrejo);
  const bosses = revealBosses(state.piles.bosses, state.piles.drawn, drawn, trigger, state.danger, rng, powers, state.bossRule, true, 'board', trejoOnBoardAt(trejo, drawn));
  return { ...state, history: remember(state), piles: { draw, discard, drawn, reshuffled, bosses, trejo } };
}

/** Whether the next card dealt one zone at a time opens a new Spawn step: none on display, or the step is over. */
export function startsNewStep(state: GameState, effect: CardEffect = plainCards): boolean {
  const { drawn } = state.piles;
  return drawn.length === 0 || planOf(drawn, effect, state.zones).done;
}

/**
 * The zone of each card still to come in the current step, in order: a zone owed two cards by a Double Spawn is
 * listed twice. None once the step is over.
 */
export function pendingZones(state: GameState, effect: CardEffect = plainCards): number[] {
  const plan = planOf(state.piles.drawn, effect, state.zones);
  if (plan.done) return [];
  const current = Array.from({ length: plan.need }, () => plan.zone);
  // After a Double Spawn on the last zone, only the zone being served is known to come.
  if (plan.extra) return current;
  return [...current, ...Array.from({ length: state.zones - plan.zone }, (_, i) => plan.zone + 1 + i)];
}

/**
 * Deals the card of the next Spawn Zone only, for players who take the zones one at a time. Once the step is over,
 * the next draw starts a new one and discards the previous cards.
 */
export function drawNextCard(
  state: GameState,
  effect: CardEffect = plainCards,
  rng: Rng = Math.random,
  trigger: BossTrigger = noBosses,
  powers: BossPowers = noPowers,
  isTrejo: IsTrejoCard = noTrejo,
): GameState {
  const { piles } = state;
  const newStep = startsNewStep(state, effect);
  let draw = piles.draw;
  let discard = newStep ? [...piles.discard, ...piles.drawn] : piles.discard;
  let reshuffled = !newStep && piles.reshuffled;
  if (draw.length === 0) {
    if (discard.length === 0) return state;
    draw = shuffle(discard, rng);
    discard = [];
    reshuffled = true;
  }
  const [card, ...rest] = draw;
  const drawn = newStep ? [card] : [...piles.drawn, card];
  const trejo = resolveTrejo(piles.trejo.stage, [card], isTrejo, newStep ? {} : piles.trejo.resolved);
  const bosses = revealBosses(piles.bosses, newStep ? piles.drawn : [], [card], trigger, state.danger, rng, powers, state.bossRule, newStep, 'board', trejoOnBoardAt(trejo, drawn));
  return { ...state, history: remember(state), piles: { draw: rest, discard, drawn, reshuffled, bosses, trejo } };
}

/**
 * The Spawn Zone (from 1) of each card dealt: a card that draws again shares its zone with the next one, a Double
 * Spawn sends two cards to the next zone, back to the first one after the last.
 */
export function zonesOf(drawn: readonly string[], effect: CardEffect = plainCards, zones = MAX_ZONES): number[] {
  let plan = START;
  return drawn.map((card) => {
    const zone = plan.zone;
    plan = nextPlan(plan, effect(card), zones);
    return zone;
  });
}

const clampZones = (zones: number) => Math.min(MAX_ZONES, Math.max(1, Math.round(zones)));

/** Takes effect on the next draw; not something to undo. */
export function setZones(state: GameState, zones: number): GameState {
  return { ...state, zones: clampZones(zones) };
}

/** Puts every card, including the ones on display, back in the deck; the bosses, the ones on the board too, go back in their decks. */
export function reshuffleAll(state: GameState, rng: Rng = Math.random, powers: BossPowers = noPowers): GameState {
  const { draw, discard, drawn } = state.piles;
  const gathered = revealBosses(state.piles.bosses, drawn, [], noBosses, state.danger, rng, powers, null, true);
  // The board empties too: its bosses go back in their decks with the rest.
  const regather = (kind: BossKind): BossDeck => {
    const deck = gathered![kind];
    const board = gathered!.onBoard.filter((boss) => boss.kind === kind).map((boss) => boss.boss);
    const kept = [...deck.draw, ...deck.discard];
    return { draw: shuffle([...kept, ...cardsBackToDeck(board, kept, powers)], rng), discard: [] };
  };
  const bosses = gathered && { abomination: regather('abomination'), necromancer: regather('necromancer'), revealed: {}, manual: [], onBoard: [] };
  return {
    ...state,
    history: remember(state),
    piles: { draw: shuffle([...draw, ...discard, ...drawn], rng), discard: [], drawn: [], reshuffled: false, bosses, trejo: NO_TREJO },
  };
}

/** The players killed the Trejobomination: the next Trejo card spawns a Walker again. The cards on display keep their resolution. */
export function removeTrejo(state: GameState): GameState {
  const { bosses } = state.piles;
  // The groups that named it no longer do: one left with nothing to name says `none`, or goes if drawn by hand.
  const without = (group: Revealed): Revealed => {
    if (!group.trejo) return group;
    const { trejo: _trejo, ...rest } = group;
    return rest.boss === NO_BOSS && rest.activates === undefined && !rest.activated?.length ? { ...rest, none: true } : rest;
  };
  const next = bosses && {
    ...bosses,
    revealed: Object.fromEntries(Object.entries(bosses.revealed).map(([card, group]) => [card, without(group)])),
    manual: bosses.manual.map(without).filter((group) => !group.none),
  };
  return { ...state, history: remember(state), piles: { ...state.piles, bosses: next, trejo: { ...state.piles.trejo, stage: 'none' } } };
}

/** Shuffles the cards left in the deck; the discard and the cards on display stay put. */
export function shuffleDeck(state: GameState, rng: Rng = Math.random): GameState {
  return {
    ...state,
    history: remember(state),
    piles: { ...state.piles, draw: shuffle(state.piles.draw, rng), reshuffled: false },
  };
}

export function undo(state: GameState): GameState {
  const piles = state.history.at(-1);
  return piles ? { ...state, piles, history: state.history.slice(0, -1) } : state;
}

/**
 * Takes effect at once on the cards on display: a card that no longer calls on a boss deck at the new level gives its
 * boss back, one that now calls on one reveals it. Not something to undo.
 */
export function setDanger(
  state: GameState,
  danger: DangerLevel,
  trigger: BossTrigger = noBosses,
  rng: Rng = Math.random,
  powers: BossPowers = noPowers,
): GameState {
  const { bosses, drawn } = state.piles;
  if (!bosses) return { ...state, danger };
  const oneAtATime = state.bossRule === 'oneAtATime';
  // An Extra Activation holds no card: it is worked out again, in zone order, in case the boss it named left.
  const leaving = drawn.filter(
    (card) => bosses.revealed[card] && (trigger(card, danger) !== bosses.revealed[card].kind || (oneAtATime && bosses.revealed[card].boss === NO_BOSS)),
  );
  const calling = drawn.filter((card) => trigger(card, danger) && (!bosses.revealed[card] || leaving.includes(card)));
  const next = revealBosses(bosses, leaving, calling, trigger, danger, rng, powers, state.bossRule, false, 'deck', trejoOnBoardAt(state.piles.trejo, drawn));
  return { ...state, danger, piles: { ...state.piles, bosses: next && oneAtATime ? orderActivations(next, drawn) : next } };
}

/**
 * Draws an Abomination by hand, for the players who deal the Abomination deck themselves: it shows beside the cards
 * and leaves with the next Spawn step (for the board). With the one at a time rule and an Abomination already on the
 * board or on display, it gets an Extra Activation instead (named by a group without boss). Unchanged without an
 * Abomination deck or with nothing left in it.
 */
export function drawAbomination(state: GameState, rng: Rng = Math.random, powers: BossPowers = noPowers): GameState {
  const { bosses } = state.piles;
  if (!bosses) return state;
  const decks = { abomination: bosses.abomination, necromancer: bosses.necromancer };
  const group = arrive(decks, shownGroups(bosses), 'abomination', rng, powers, state.bossRule, state.piles.trejo.stage === 'abomination');
  // Nothing left to draw still gives the Extra Activation to the Abominations on the board, the Trejobomination too.
  if (group.activates === undefined && group.activated === undefined && !group.trejo && bosses.abomination.draw.length + bosses.abomination.discard.length === 0) return state;
  const next: BossPiles = { ...bosses, ...decks, manual: [...bosses.manual, group, ...escortsOf(group, shownGroups(bosses), powers)] };
  // A boss now on display is the one the cards without boss name (and no longer "none").
  const named = state.bossRule === 'oneAtATime' ? orderActivations(next, state.piles.drawn) : next;
  return { ...state, history: remember(state), piles: { ...state.piles, bosses: named } };
}

/**
 * One at a time: the Extra Activations name a boss that is still in play. One that named a boss that left names another
 * one, or goes if none is left.
 */
function nameActivations(bosses: BossPiles, drawn: readonly string[]): BossPiles {
  const next = orderActivations(bosses, drawn);
  const named = (group: Revealed) => next.onBoard.find((boss) => boss.kind === group.kind)?.boss ?? firstBoss(shownGroups(next), group.kind);
  return {
    ...next,
    manual: next.manual.flatMap((group) => {
      if (group.activates === undefined || isLive(next, group.kind, group.activates)) return [group];
      const boss = named(group);
      if (boss !== undefined) return [{ ...group, activates: boss }];
      // The Trejobomination still gets its activation when no named boss is left.
      const { activates: _gone, ...rest } = group;
      return group.trejo ? [rest] : [];
    }),
  };
}

/** Where a boss to remove is: on the board, in a card of the last Spawn step, or among the ones drawn by hand. */
export type BossTarget =
  | { from: 'board'; boss: string }
  | { from: 'step'; card: string; boss: string }
  | { from: 'manual'; index: number; boss: string };

const isLive = (bosses: BossPiles, kind: BossKind, boss: string) => shownGroups(bosses).some((group) => group.kind === kind && liveBosses(group).includes(boss));

/**
 * The players removed a boss (killed, fled): its card goes to the discard of its deck, where it can come back after a
 * reshuffle. A boss removed from a card of the current Spawn step does not go on the board at the next draw. A boss
 * that draws another when it dies (`drawOnDeath`) reveals the next one, drawn by hand. Unchanged if the boss is not there.
 */
export function removeFromBoard(state: GameState, target: BossTarget, rng: Rng = Math.random, powers: BossPowers = noPowers): GameState {
  const bosses = state.piles.bosses;
  if (!bosses) return state;
  const decks = { abomination: bosses.abomination, necromancer: bosses.necromancer };
  let { revealed, manual, onBoard } = bosses;
  const power = powers(target.boss);
  let kind: BossKind;
  if (target.from === 'board') {
    const at = onBoard.findIndex((boss) => boss.boss === target.boss);
    if (at < 0) return state;
    kind = onBoard[at].kind;
    onBoard = onBoard.filter((_, i) => i !== at);
  } else {
    const group = target.from === 'step' ? revealed[target.card] : manual[target.index];
    if (!group || !liveBosses(group).includes(target.boss)) return state;
    kind = group.kind;
    const next = retire(decks, group, target.boss);
    if (target.from === 'step') revealed = { ...revealed, [target.card]: next };
    else manual = manual.map((other, i) => (i === target.index ? next : other));
  }
  if (power?.kind === 'drawOnDeath' && decks[kind].draw.length + decks[kind].discard.length > 0) {
    const arrival = revealOne(decks, shownGroups({ ...bosses, onBoard }, revealed, manual), kind, rng, powers);
    // A SPAM drawn on the way is a card too: the group keeps it even with no boss behind it.
    if (isRealBoss(arrival.boss) || arrival.spam) {
      manual = [...manual, arrival, ...escortsOf(arrival, shownGroups({ ...bosses, onBoard }, revealed, manual), powers)];
    }
  }
  // A chained boss leaves the game; the next one of the chain arrives, drawn by hand.
  if (power?.kind === 'chained') {
    if (power.next !== undefined) manual = [...manual, { kind, boss: power.next }];
  } else if (power?.kind !== 'escort') discardCards(decks, kind, [target.boss]);
  ({ revealed, manual } = forgetBoss(revealed, manual, kind, target.boss));
  let next: BossPiles = { ...decks, revealed, manual, onBoard };
  if (state.bossRule === 'oneAtATime') next = nameActivations(next, state.piles.drawn);
  return { ...state, history: remember(state), piles: { ...state.piles, bosses: next } };
}

type Waiting = { boss: string; offered: string[]; keep: number };

/** Where the first group waiting for a choice is: a card of the last Spawn step (in order), else one drawn by hand. */
function waitingGroup(state: GameState): { group: Revealed; card?: string; index?: number } | undefined {
  const { bosses, drawn } = state.piles;
  if (!bosses) return undefined;
  for (const card of drawn) {
    const group = bosses.revealed[card];
    if (group?.choice) return { group, card };
  }
  const index = bosses.manual.findIndex((group) => group.choice);
  return index >= 0 ? { group: bosses.manual[index], index } : undefined;
}

/** The boss waiting for the players to keep some of its candidates, if any. */
export function pendingChoice(state: GameState): Waiting | undefined {
  const group = waitingGroup(state)?.group;
  return group?.choice ? { boss: group.boss, offered: group.choice.offered, keep: group.choice.keep } : undefined;
}

/**
 * Keeps the picked candidates with the boss waiting for them and discards the others. `picked` must be `keep` of the
 * offered cards; anything else changes nothing.
 */
export function chooseGained(state: GameState, picked: readonly string[]): GameState {
  const found = waitingGroup(state);
  const bosses = state.piles.bosses;
  if (!found?.group.choice || !bosses) return state;
  const { offered, keep } = found.group.choice;
  const rest = [...offered];
  for (const card of picked) {
    const at = rest.indexOf(card);
    if (at < 0) return state;
    rest.splice(at, 1);
  }
  if (picked.length !== keep) return state;
  const { choice: _choice, ...others } = found.group;
  const group: Revealed = { ...others, gained: [...picked] };
  const kind = group.kind;
  const deck = bosses[kind];
  const next: BossPiles = {
    ...bosses,
    [kind]: { ...deck, discard: [...deck.discard, ...rest] },
    revealed: found.card === undefined ? bosses.revealed : { ...bosses.revealed, [found.card]: group },
    manual: found.index === undefined ? bosses.manual : bosses.manual.map((other, i) => (i === found.index ? group : other)),
  };
  return { ...state, history: remember(state), piles: { ...state.piles, bosses: next } };
}

type PilesV1 = Omit<Piles, 'drawn'> & { current: string | null };

/** Brings a save from an older version of the app up to date, one version at a time; anything else is unchanged. */
export function upgradeSave(value: unknown): unknown {
  return upgradeFromV3(upgradeFromV2(upgradeFromV1(value)));
}

function upgradeFromV1(value: unknown): unknown {
  const save = value as { version?: number; piles?: PilesV1; history?: PilesV1[] } | null;
  if (save?.version !== 1 || !save.piles || !Array.isArray(save.history)) return value;
  // Version 1 had a single card on display and no Spawn Zones.
  const upgrade = ({ current, ...piles }: PilesV1): Piles => ({ ...piles, drawn: current === null ? [] : [current] });
  return { ...save, version: 2, zones: 1, piles: upgrade(save.piles), history: save.history.map(upgrade) };
}

function upgradeFromV2(value: unknown): unknown {
  const save = value as { version?: number } | null;
  // Version 2 knew only the modern era, before the universes were chosen at launch.
  return save?.version === 2 ? { ...save, version: 3, universe: 'modern' } : value;
}

function upgradeFromV3(value: unknown): unknown {
  const save = value as { version?: number; piles?: object; history?: unknown } | null;
  if (save?.version !== 3 || !save.piles || !Array.isArray(save.history)) return value;
  // Version 3 had no boss decks: its bosses were cards of the Zombie deck.
  const upgrade = (piles: object) => ({ ...piles, bosses: null });
  return { ...save, version: 4, bossRule: null, piles: upgrade(save.piles), history: save.history.map(upgrade) };
}

/** Rejects saves that are malformed or refer to cards that no longer exist in their universe. */
export function isValidSave(
  value: unknown,
  cardIdsOf: (universe: UniverseId) => ReadonlySet<string>,
  /** The bosses a boss deck of each universe may hold; any name when not given. */
  bossIdsOf?: (universe: UniverseId) => ReadonlySet<string>,
  /** The most cards of each boss a game of the universe holds; a boss without an entry is not bounded. */
  bossCopiesOf?: (universe: UniverseId) => ReadonlyMap<string, number>,
): value is GameState {
  const state = value as GameState | null;
  // Closed beta: no migration, a game saved by an older version is rejected.
  if (state?.version !== 9 || !DANGER_LEVELS.includes(state.danger) || !UNIVERSE_IDS.includes(state.universe)) return false;
  if (state.bossRule !== null && state.bossRule !== 'oneAtATime' && state.bossRule !== 'fest') return false;
  if (!Number.isInteger(state.zones) || state.zones !== clampZones(state.zones)) return false;
  if (!Array.isArray(state.setIds) || !state.setIds.every((id) => typeof id === 'string')) return false;
  if (!Array.isArray(state.history)) return false;
  const knownCardIds = cardIdsOf(state.universe);
  const bossIds = bossIdsOf?.(state.universe);
  const bossCopies = bossCopiesOf?.(state.universe);
  return [state.piles, ...state.history].every(
    (piles) =>
      isValidPiles(piles, knownCardIds) &&
      (piles.bosses === null) === (state.bossRule === null) &&
      isValidBosses(piles.bosses, bossIds, bossCopies, piles.trejo.stage === 'abomination'),
  );
}

function isValidPiles(piles: Piles | null | undefined, knownCardIds: ReadonlySet<string>): boolean {
  if (!piles || !Array.isArray(piles.draw) || !Array.isArray(piles.discard) || !Array.isArray(piles.drawn)) return false;
  if (!isValidTrejo(piles.trejo, piles.drawn)) return false;
  return [...piles.draw, ...piles.discard, ...piles.drawn].every((id) => knownCardIds.has(id));
}

const TREJO_STAGES: readonly string[] = ['none', 'walker', 'abomination'];

function isValidTrejo(trejo: TrejoPiles | undefined, drawn: readonly string[]): boolean {
  if (!trejo || !TREJO_STAGES.includes(trejo.stage) || !trejo.resolved || typeof trejo.resolved !== 'object') return false;
  return Object.entries(trejo.resolved).every(([card, choice]) => drawn.includes(card) && (choice === 1 || choice === 2 || choice === 3));
}

const isStrings = (value: unknown): value is string[] => Array.isArray(value) && value.every((id) => typeof id === 'string');
const isBossDeck = (deck: BossDeck | undefined) => !!deck && isStrings(deck.draw) && isStrings(deck.discard);
const BOSS_KINDS: readonly BossKind[] = ['abomination', 'necromancer'];

function isValidBosses(bosses: BossPiles | null | undefined, bossIds?: ReadonlySet<string>, bossCopies?: ReadonlyMap<string, number>, trejoOnBoard = false): boolean {
  if (bosses === null) return true;
  if (!bosses || !isBossDeck(bosses.abomination) || !isBossDeck(bosses.necromancer)) return false;
  if (!bosses.revealed || typeof bosses.revealed !== 'object') return false;
  const known = (boss: string) => !bossIds || bossIds.has(boss);
  const decks = [bosses.abomination, bosses.necromancer].flatMap((deck) => [...deck.draw, ...deck.discard]);
  if (!Array.isArray(bosses.manual) || !Array.isArray(bosses.onBoard)) return false;
  if (!bosses.onBoard.every((boss) => !!boss && BOSS_KINDS.includes(boss.kind) && typeof boss.boss === 'string' && isRealBoss(boss.boss) && known(boss.boss))) return false;
  const groups = [...Object.values(bosses.revealed), ...bosses.manual];
  if (!decks.every(known) || !groups.every((shown) => isValidRevealed(shown, known))) return false;
  // The Trejobomination activation needs the Trejobomination on the board.
  if (!trejoOnBoard && groups.some((shown) => shown.trejo)) return false;
  // An Extra Activation names a boss of its kind that is on the board or on display.
  const alive = shownGroups(bosses);
  if (!groups.every((shown) => shown.activates === undefined || alive.some((other) => other.kind === shown.kind && liveBosses(other).includes(shown.activates!)))) return false;
  return withinCopies([...decks, ...groups.flatMap(groupCards), ...bosses.onBoard.map((boss) => boss.boss)], bossCopies);
}

/** A card cannot be in two places: no boss lies more often, across decks and display, than the boxes print it. */
function withinCopies(cards: readonly string[], bossCopies?: ReadonlyMap<string, number>): boolean {
  if (!bossCopies) return true;
  const counts = new Map<string, number>();
  for (const card of cards) counts.set(card, (counts.get(card) ?? 0) + 1);
  return [...counts].every(([card, count]) => count <= (bossCopies.get(card) ?? Infinity));
}

function isValidRevealed(shown: Revealed | undefined, known: (boss: string) => boolean): boolean {
  if (!shown || !BOSS_KINDS.includes(shown.kind) || typeof shown.boss !== 'string') return false;
  if (isRealBoss(shown.boss) && !known(shown.boss)) return false;
  if (shown.activates !== undefined && (shown.boss !== NO_BOSS || typeof shown.activates !== 'string' || !isRealBoss(shown.activates))) return false;
  const knownList = (list: unknown) => list === undefined || (isStrings(list) && list.every(known));
  if (!knownList(shown.spam) || !knownList(shown.along) || !knownList(shown.gained) || !knownList(shown.activated) || !knownList(shown.gone)) return false;
  // `none` marks an Extra Activation with no boss left to name.
  if (shown.none !== undefined && (shown.none !== true || shown.boss !== NO_BOSS || shown.activates !== undefined)) return false;
  // `trejo`: the Trejobomination, an Abomination of the board, also gets the Extra Activation; `none` says nobody does.
  if (shown.trejo !== undefined && (shown.trejo !== true || shown.kind !== 'abomination' || shown.none !== undefined)) return false;
  // What was removed from a group was in it.
  if (shown.gone !== undefined && withoutGone(bossList(shown), shown.gone).length !== bossList(shown).length - shown.gone.length) return false;
  const { choice } = shown;
  if (choice === undefined) return true;
  // A choice is pending until the players keep some cards, which then become `gained`: never both.
  if (shown.gained !== undefined) return false;
  return (
    !!choice &&
    knownList(choice.offered) &&
    Array.isArray(choice.offered) &&
    Number.isInteger(choice.keep) &&
    choice.keep > 0 &&
    choice.keep < choice.offered.length
  );
}

/**
 * What makes a group the same one for the screen reader: rebuilding it (an Extra Activation, a superseded boss) changes
 * nothing, and neither does a removal (`gone`, the live bosses, a Fest `activated` list shrinking or `none`): that is
 * the same group, shorter. A different boss, a different boss named by an Extra Activation, or Gozer's choice made, is.
 */
const groupSignature = (group: Revealed): string => [group.kind, group.boss, group.activates ?? '', group.choice ? 'choosing' : ''].join('|');

/**
 * The groups of `after` that were not in `before`, to read out what an action brought: those drawn by hand (`manual`), or
 * also those of the cards (`all`). Groups are compared by content, not identity (the engine rebuilds groups it does not
 * change), one for one: two identical groups after one before leave one new. For a new Spawn step, `before` is what
 * stayed on display, so pass it with `manual: []`.
 */
export function newGroups(before: BossPiles | null | undefined, after: BossPiles | null | undefined, scope: 'manual' | 'all'): Revealed[] {
  if (!after) return [];
  const listed = (bosses: BossPiles) => (scope === 'all' ? [...Object.values(bosses.revealed), ...bosses.manual] : bosses.manual);
  const seen = new Map<string, number>();
  for (const group of before ? listed(before) : []) seen.set(groupSignature(group), (seen.get(groupSignature(group)) ?? 0) + 1);
  return listed(after).filter((group) => {
    const key = groupSignature(group);
    const left = seen.get(key) ?? 0;
    if (left > 0) seen.set(key, left - 1);
    return left === 0;
  });
}
