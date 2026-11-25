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

/** `drawAgain` is SPAM, `double` Double Spawn, `endStep` Enter the Horde. */
export type SpawnEffect = 'spawn' | 'drawAgain' | 'double' | 'endStep';
export type CardEffect = (cardId: string) => SpawnEffect;
const plainCards: CardEffect = () => 'spawn';

/** The boss deck a card calls on at a Danger Level, if any: an Abomination it spawns, a Necromancer. */
export type BossTrigger = (cardId: string, danger: DangerLevel) => BossKind | undefined;
const noBosses: BossTrigger = () => undefined;

/**
 * Powers of the modern Abominations (SPAM `cantrip`, Gozer `absorb`, Batman Who Laughs `bringsAlong`, Zuul and Vinz
 * Clortho `unblocks`, Alpha Vampire `drawOnDeath`), of the Divine Beasts `chain`/`chained` and of the Lord of Skulls
 * `brings`; an `escort` has no card, so it never goes into a pile.
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

function bringing(group: Revealed, powers: BossPowers) {
  const power = isRealBoss(group.boss) ? powers(group.boss) : undefined;
  return power?.kind === 'brings' ? power : undefined;
}

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

const boardGroups = (onBoard: readonly BoardBoss[]): Revealed[] => onBoard.map(({ kind, boss }) => ({ kind, boss }));
const shownGroups = (bosses: BossPiles, revealed = bosses.revealed, manual = bosses.manual): Revealed[] => [
  ...boardGroups(bosses.onBoard),
  ...Object.values(revealed),
  ...manual,
];

const unblocks = (power: BossPower | undefined) => power?.kind === 'unblocks' || (power?.kind === 'bringsAlong' && !!power.unblocks);

// Dead Men Tales rulebook p.17: one at a time, a boss of the kind in play gets an Extra Activation instead of a draw (unless
// one lets others spawn); in the Fest all get it and a new one comes. The Trejobomination counts as one but never blocks.
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

// The 2nd edition rulebook is silent on an empty Abomination deck: it reshuffles its discard, as in Dead Men Tales.
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

/** Leaving bosses go `to` the board (a Spawn step went by) or back to the discard of their deck. */
function revealBosses(
  bosses: BossPiles | null,
  leaving: readonly string[],
  dealt: readonly string[],
  trigger: BossTrigger,
  danger: DangerLevel,
  rng: Rng,
  powers: BossPowers,
  rule: BossRule | null,
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

const firstBoss = (groups: readonly Revealed[], kind: BossKind) => groups.filter((group) => group.kind === kind).flatMap(liveBosses)[0];

/** In zone order, the first card calling on a boss deck reveals the boss and the later ones only name it. */
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

function retire(decks: Decks, group: Revealed, boss: string): Revealed {
  const { choice, ...rest } = group;
  // A boss that waits for its choice leaves without it: the candidates go back to the discard.
  const pending = choice && group.boss === boss;
  if (pending) discardCards(decks, group.kind, choice.offered);
  return { ...(pending ? rest : group), gone: [...(group.gone ?? []), boss] };
}

type Placed = { revealed: Record<string, Revealed>; manual: Revealed[]; onBoard: BoardBoss[] };

/** A `single` boss revealed in `card`'s group replaces the copy in play, wherever it is. */
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

/** Reveals the next boss of a deck, applying its powers; `shown` keeps a boss already on display from coming twice. */
function revealOne(decks: Decks, shown: readonly Revealed[], kind: BossKind, rng: Rng, powers: BossPowers): Revealed {
  const spam: string[] = [];
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

// Black Plague Double Spawn: each one gives the next zone two cards (two give four), wrapping from the last zone to the
// first even if it already spawned; the chain goes on until a zone draws no Double Spawn.
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

// An empty deck takes the discard back, never the cards being dealt.
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

/** A zone owed two cards by a Double Spawn is listed twice; empty once the step is over. */
export function pendingZones(state: GameState, effect: CardEffect = plainCards): number[] {
  const plan = planOf(state.piles.drawn, effect, state.zones);
  if (plan.done) return [];
  const current = Array.from({ length: plan.need }, () => plan.zone);
  // After a Double Spawn on the last zone, only the zone being served is known to come.
  if (plan.extra) return current;
  return [...current, ...Array.from({ length: state.zones - plan.zone }, (_, i) => plan.zone + 1 + i)];
}

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

/** Zones are numbered from 1. */
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

// The bosses on the board go back into their decks too.
export function reshuffleAll(state: GameState, rng: Rng = Math.random, powers: BossPowers = noPowers): GameState {
  const { draw, discard, drawn } = state.piles;
  const gathered = revealBosses(state.piles.bosses, drawn, [], noBosses, state.danger, rng, powers, null, true);
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

// The discard and the cards on display stay put.
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

export function drawAbomination(state: GameState, rng: Rng = Math.random, powers: BossPowers = noPowers): GameState {
  const { bosses } = state.piles;
  if (!bosses) return state;
  const decks = { abomination: bosses.abomination, necromancer: bosses.necromancer };
  const group = arrive(decks, shownGroups(bosses), 'abomination', rng, powers, state.bossRule, state.piles.trejo.stage === 'abomination');
  // Nothing left to draw still gives the Extra Activation to the Abominations on the board, the Trejobomination too.
  if (group.activates === undefined && group.activated === undefined && !group.trejo && bosses.abomination.draw.length + bosses.abomination.discard.length === 0) return state;
  const next: BossPiles = { ...bosses, ...decks, manual: [...bosses.manual, group, ...escortsOf(group, shownGroups(bosses), powers)] };
  const named = state.bossRule === 'oneAtATime' ? orderActivations(next, state.piles.drawn) : next;
  return { ...state, history: remember(state), piles: { ...state.piles, bosses: named } };
}

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

export type BossTarget =
  | { from: 'board'; boss: string }
  | { from: 'step'; card: string; boss: string }
  | { from: 'manual'; index: number; boss: string };

const isLive = (bosses: BossPiles, kind: BossKind, boss: string) => shownGroups(bosses).some((group) => group.kind === kind && liveBosses(group).includes(boss));

/** The removed boss's card goes to the discard of its deck; unchanged if the boss is not there. */
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

export function pendingChoice(state: GameState): Waiting | undefined {
  const group = waitingGroup(state)?.group;
  return group?.choice ? { boss: group.boss, offered: group.choice.offered, keep: group.choice.keep } : undefined;
}

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

export function upgradeSave(value: unknown): unknown {
  return upgradeFromV3(upgradeFromV2(upgradeFromV1(value)));
}

function upgradeFromV1(value: unknown): unknown {
  const save = value as { version?: number; piles?: PilesV1; history?: PilesV1[] } | null;
  if (save?.version !== 1 || !save.piles || !Array.isArray(save.history)) return value;
  const upgrade = ({ current, ...piles }: PilesV1): Piles => ({ ...piles, drawn: current === null ? [] : [current] });
  return { ...save, version: 2, zones: 1, piles: upgrade(save.piles), history: save.history.map(upgrade) };
}

function upgradeFromV2(value: unknown): unknown {
  const save = value as { version?: number } | null;
  return save?.version === 2 ? { ...save, version: 3, universe: 'modern' } : value;
}

function upgradeFromV3(value: unknown): unknown {
  const save = value as { version?: number; piles?: object; history?: unknown } | null;
  if (save?.version !== 3 || !save.piles || !Array.isArray(save.history)) return value;
  const upgrade = (piles: object) => ({ ...piles, bosses: null });
  return { ...save, version: 4, bossRule: null, piles: upgrade(save.piles), history: save.history.map(upgrade) };
}

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

// A removal leaves the group the same one for the screen reader, only shorter.
const groupSignature = (group: Revealed): string => [group.kind, group.boss, group.activates ?? '', group.choice ? 'choosing' : ''].join('|');

// Groups are compared by content, one for one: two identical groups after one before leave one new.
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
