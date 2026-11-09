import type {
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
  UniverseId,
  ZombieCard,
} from './types';

export type Rng = () => number;

export const DANGER_LEVELS: readonly DangerLevel[] = ['blue', 'yellow', 'orange', 'red'];
export const UNIVERSE_IDS: readonly UniverseId[] = ['modern', 'fantasy'];
export const MAX_UNDO = 20;
export const MAX_ZONES = 8;

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
  if (card.kind === 'extra') return 'extra';
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
    ? { abomination: bossDeck(deck.bosses.abomination), necromancer: bossDeck(deck.bosses.necromancer), revealed: {} }
    : null;
  return {
    version: 4,
    bossRule: deck.bosses?.rule ?? null,
    universe,
    setIds,
    piles: { draw: shuffle(ids, rng), discard: [], drawn: [], reshuffled: false, bosses },
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
 * The boss decks once some cards leave the display (their bosses go to the discard of their deck) and others are
 * dealt (each one calling on a deck reveals its top card, the deck reshuffling its discard when empty).
 */
function revealBosses(
  bosses: BossPiles | null,
  leaving: readonly string[],
  dealt: readonly string[],
  trigger: BossTrigger,
  danger: DangerLevel,
  rng: Rng,
): BossPiles | null {
  if (!bosses) return null;
  const decks = { abomination: bosses.abomination, necromancer: bosses.necromancer };
  const revealed: Record<string, Revealed> = { ...bosses.revealed };
  for (const card of leaving) {
    const gone = revealed[card];
    if (!gone) continue;
    decks[gone.kind] = { ...decks[gone.kind], discard: [...decks[gone.kind].discard, gone.boss] };
    delete revealed[card];
  }
  for (const card of dealt) {
    const kind = trigger(card, danger);
    if (!kind) continue;
    const { boss, deck } = drawBoss(decks[kind], rng);
    decks[kind] = deck;
    if (boss) revealed[card] = { kind, boss };
  }
  return { ...decks, revealed };
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
  const bosses = revealBosses(state.piles.bosses, state.piles.drawn, drawn, trigger, state.danger, rng);
  return { ...state, history: remember(state), piles: { draw, discard, drawn, reshuffled, bosses } };
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
  const bosses = revealBosses(piles.bosses, newStep ? piles.drawn : [], [card], trigger, state.danger, rng);
  return { ...state, history: remember(state), piles: { draw: rest, discard, drawn, reshuffled, bosses } };
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

/** Puts every card, including the ones on display, back in the deck; the bosses go back in their decks too. */
export function reshuffleAll(state: GameState, rng: Rng = Math.random): GameState {
  const { draw, discard, drawn } = state.piles;
  const gathered = revealBosses(state.piles.bosses, drawn, [], noBosses, state.danger, rng);
  const regather = (deck: BossDeck): BossDeck => ({ draw: shuffle([...deck.draw, ...deck.discard], rng), discard: [] });
  const bosses = gathered && { abomination: regather(gathered.abomination), necromancer: regather(gathered.necromancer), revealed: {} };
  return {
    ...state,
    history: remember(state),
    piles: { draw: shuffle([...draw, ...discard, ...drawn], rng), discard: [], drawn: [], reshuffled: false, bosses },
  };
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

export function setDanger(state: GameState, danger: DangerLevel): GameState {
  return { ...state, danger };
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
): value is GameState {
  const state = value as GameState | null;
  if (state?.version !== 4 || !DANGER_LEVELS.includes(state.danger) || !UNIVERSE_IDS.includes(state.universe)) return false;
  if (state.bossRule !== null && state.bossRule !== 'oneAtATime' && state.bossRule !== 'fest') return false;
  if (!Number.isInteger(state.zones) || state.zones !== clampZones(state.zones)) return false;
  if (!Array.isArray(state.setIds) || !state.setIds.every((id) => typeof id === 'string')) return false;
  if (!Array.isArray(state.history)) return false;
  const knownCardIds = cardIdsOf(state.universe);
  return [state.piles, ...state.history].every((piles) => isValidPiles(piles, knownCardIds));
}

function isValidPiles(piles: Piles | null | undefined, knownCardIds: ReadonlySet<string>): boolean {
  if (!piles || !Array.isArray(piles.draw) || !Array.isArray(piles.discard) || !Array.isArray(piles.drawn)) return false;
  if (!isValidBosses(piles.bosses)) return false;
  return [...piles.draw, ...piles.discard, ...piles.drawn].every((id) => knownCardIds.has(id));
}

const isStrings = (value: unknown): value is string[] => Array.isArray(value) && value.every((id) => typeof id === 'string');
const isBossDeck = (deck: BossDeck | undefined) => !!deck && isStrings(deck.draw) && isStrings(deck.discard);
const BOSS_KINDS: readonly BossKind[] = ['abomination', 'necromancer'];

function isValidBosses(bosses: BossPiles | null | undefined): boolean {
  if (bosses === null) return true;
  if (!bosses || !isBossDeck(bosses.abomination) || !isBossDeck(bosses.necromancer)) return false;
  if (!bosses.revealed || typeof bosses.revealed !== 'object') return false;
  return Object.values(bosses.revealed).every(
    (shown) => !!shown && BOSS_KINDS.includes(shown.kind) && typeof shown.boss === 'string',
  );
}
