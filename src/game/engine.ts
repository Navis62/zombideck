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
import { NO_BOSS, NO_DECK } from './types.ts';

export type Rng = () => number;

export const DANGER_LEVELS: readonly DangerLevel[] = ['blue', 'yellow', 'orange', 'red'];
export const UNIVERSE_IDS: readonly UniverseId[] = ['modern', 'fantasy', 'invader', 'western'];

/** Each universe keeps its own game: starting one never replaces another's. */
export const gameKey = (universe: UniverseId) => `zombideck.game.${universe}`;
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
    ? { abomination: bossDeck(deck.bosses.abomination), necromancer: bossDeck(deck.bosses.necromancer), revealed: {}, manual: [] }
    : null;
  return {
    version: 6,
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

/**
 * What a boss does when it is revealed, besides being on display (modern Abominations):
 * - `cantrip` (SPAM): not a boss; it is set aside and the next card of the deck is drawn instead;
 * - `absorb` (Gozer): `draw` more cards are drawn, the players keep `keep` of them with the boss;
 * - `bringsAlong` (Batman Who Laughs): another boss comes with it, taken from the deck or the discard.
 */
export type BossPower<Z extends string = string> =
  | { kind: 'cantrip' }
  | { kind: 'absorb'; draw: number; keep: number }
  | { kind: 'bringsAlong'; boss: Z };
export type BossPowers = (boss: string) => BossPower | undefined;
export const noPowers: BossPowers = () => undefined;

/** The powers of a list of bosses, by boss id. */
export function powersOf(bosses: readonly { zombie: string; power?: BossPower }[]): BossPowers {
  const byBoss = new Map(bosses.flatMap((boss) => (boss.power ? [[boss.zombie, boss.power] as const] : [])));
  return (boss) => byBoss.get(boss);
}

const isRealBoss = (boss: string) => boss !== NO_BOSS && boss !== NO_DECK;

/** Every card of a revealed group: its boss, the SPAMs set aside, the bosses brought along, offered or gained. */
export const groupCards = (group: Revealed): string[] => [
  ...(isRealBoss(group.boss) ? [group.boss] : []),
  ...(group.spam ?? []),
  ...(group.along ?? []),
  ...(group.choice?.offered ?? []),
  ...(group.gained ?? []),
];

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
  powers: BossPowers,
  rule: BossRule | null,
  /** The groups drawn by hand leave too (a new Spawn step starts). */
  releaseManual = false,
): BossPiles | null {
  if (!bosses) return null;
  const decks = { abomination: bosses.abomination, necromancer: bosses.necromancer };
  const revealed: Record<string, Revealed> = { ...bosses.revealed };
  let manual = bosses.manual;
  for (const card of leaving) {
    const gone = revealed[card];
    if (!gone) continue;
    discardGroup(decks, gone);
    delete revealed[card];
  }
  if (releaseManual) {
    for (const gone of manual) discardGroup(decks, gone);
    manual = [];
  }
  for (const card of dealt) {
    const kind = trigger(card, danger);
    if (!kind) continue;
    // Dead Men Tales, rulebook p.17 and White Death cards #457-462: "If there is no Abomination on the board: draw an
    // Abomination card, then spawn it. If there is already an Abomination: it gets an extra Activation." The step is
    // resolved zone after zone, so a card whose boss of this kind is already on display (revealed earlier in the step, or
    // drawn by hand) draws nothing: the boss on display gets the Activation. The Abomination Fest draws for every card.
    const inPlay = rule === 'oneAtATime' ? firstBoss([...Object.values(revealed), ...manual], kind) : undefined;
    revealed[card] = inPlay ? { kind, boss: NO_BOSS, activates: inPlay } : revealOne(decks, [...Object.values(revealed), ...manual], kind, rng, powers);
  }
  return { ...decks, revealed, manual };
}

/** The first real boss of a kind among the groups on display. */
const firstBoss = (groups: readonly Revealed[], kind: BossKind) => groups.find((group) => group.kind === kind && isRealBoss(group.boss))?.boss;

/**
 * Once the cards of a step are in their zone order, the first card calling on a boss deck is the one that reveals the
 * boss, the later ones only name it. A boss revealed by a later card (a Danger Level change made an earlier card call)
 * moves to the first one; every Extra Activation then names the first boss on display.
 */
function orderActivations(bosses: BossPiles, drawn: readonly string[]): BossPiles {
  const revealed: Record<string, Revealed> = { ...bosses.revealed };
  for (const kind of BOSS_KINDS) {
    const cards = drawn.filter((card) => revealed[card]?.kind === kind);
    const owner = cards.find((card) => isRealBoss(revealed[card].boss));
    if (owner !== undefined && owner !== cards[0] && !isRealBoss(revealed[cards[0]].boss)) {
      revealed[cards[0]] = revealed[owner];
      revealed[owner] = { kind, boss: NO_BOSS };
    }
    const named = firstBoss([...cards.map((card) => revealed[card]), ...bosses.manual], kind);
    for (const card of cards) {
      const group = revealed[card];
      if (group.boss !== NO_BOSS) continue;
      const { activates: _old, ...bare } = group;
      revealed[card] = named ? { ...bare, activates: named } : bare;
    }
  }
  return { ...bosses, revealed };
}

type Decks = { abomination: BossDeck; necromancer: BossDeck };

/** A group that leaves the display puts all its cards in the discard of its boss deck. */
function discardGroup(decks: Decks, group: Revealed) {
  const cards = groupCards(group);
  if (cards.length > 0) decks[group.kind] = { ...decks[group.kind], discard: [...decks[group.kind].discard, ...cards] };
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
  const boss = pull();
  const power = boss === undefined ? undefined : powers(boss);
  const group: Revealed = { kind, boss: '' };
  if (boss === undefined) {
    // Every boss of the deck is on display already: the card still calls on it, they get an Extra Activation.
    // With none on display either, the game never had a boss of this kind (SPAMs set aside do not count as bosses).
    const onDisplay = shown.some((other) => other.kind === kind && isRealBoss(other.boss));
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
  const bosses = revealBosses(state.piles.bosses, state.piles.drawn, drawn, trigger, state.danger, rng, powers, state.bossRule, true);
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
  powers: BossPowers = noPowers,
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
  const bosses = revealBosses(piles.bosses, newStep ? piles.drawn : [], [card], trigger, state.danger, rng, powers, state.bossRule, newStep);
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
  const gathered = revealBosses(state.piles.bosses, drawn, [], noBosses, state.danger, rng, noPowers, null, true);
  const regather = (deck: BossDeck): BossDeck => ({ draw: shuffle([...deck.draw, ...deck.discard], rng), discard: [] });
  const bosses = gathered && { abomination: regather(gathered.abomination), necromancer: regather(gathered.necromancer), revealed: {}, manual: [] };
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
  const next = revealBosses(bosses, leaving, calling, trigger, danger, rng, powers, state.bossRule);
  return { ...state, danger, piles: { ...state.piles, bosses: next && oneAtATime ? orderActivations(next, drawn) : next } };
}

/**
 * Draws an Abomination by hand, for the players who deal the Abomination deck themselves: it shows beside the cards
 * and leaves with the next Spawn step. Unchanged without an Abomination deck or with nothing left in it.
 */
export function drawAbomination(state: GameState, rng: Rng = Math.random, powers: BossPowers = noPowers): GameState {
  const { bosses } = state.piles;
  if (!bosses || bosses.abomination.draw.length + bosses.abomination.discard.length === 0) return state;
  const decks = { abomination: bosses.abomination, necromancer: bosses.necromancer };
  const group = revealOne(decks, [...Object.values(bosses.revealed), ...bosses.manual], 'abomination', rng, powers);
  const next: BossPiles = { ...decks, revealed: bosses.revealed, manual: [...bosses.manual, group] };
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
  if (state?.version !== 6 || !DANGER_LEVELS.includes(state.danger) || !UNIVERSE_IDS.includes(state.universe)) return false;
  if (state.bossRule !== null && state.bossRule !== 'oneAtATime' && state.bossRule !== 'fest') return false;
  if (!Number.isInteger(state.zones) || state.zones !== clampZones(state.zones)) return false;
  if (!Array.isArray(state.setIds) || !state.setIds.every((id) => typeof id === 'string')) return false;
  if (!Array.isArray(state.history)) return false;
  const knownCardIds = cardIdsOf(state.universe);
  const bossIds = bossIdsOf?.(state.universe);
  const bossCopies = bossCopiesOf?.(state.universe);
  return [state.piles, ...state.history].every(
    (piles) => isValidPiles(piles, knownCardIds) && (piles.bosses === null) === (state.bossRule === null) && isValidBosses(piles.bosses, bossIds, bossCopies),
  );
}

function isValidPiles(piles: Piles | null | undefined, knownCardIds: ReadonlySet<string>): boolean {
  if (!piles || !Array.isArray(piles.draw) || !Array.isArray(piles.discard) || !Array.isArray(piles.drawn)) return false;
  return [...piles.draw, ...piles.discard, ...piles.drawn].every((id) => knownCardIds.has(id));
}

const isStrings = (value: unknown): value is string[] => Array.isArray(value) && value.every((id) => typeof id === 'string');
const isBossDeck = (deck: BossDeck | undefined) => !!deck && isStrings(deck.draw) && isStrings(deck.discard);
const BOSS_KINDS: readonly BossKind[] = ['abomination', 'necromancer'];

function isValidBosses(bosses: BossPiles | null | undefined, bossIds?: ReadonlySet<string>, bossCopies?: ReadonlyMap<string, number>): boolean {
  if (bosses === null) return true;
  if (!bosses || !isBossDeck(bosses.abomination) || !isBossDeck(bosses.necromancer)) return false;
  if (!bosses.revealed || typeof bosses.revealed !== 'object') return false;
  const known = (boss: string) => !bossIds || bossIds.has(boss);
  const decks = [bosses.abomination, bosses.necromancer].flatMap((deck) => [...deck.draw, ...deck.discard]);
  if (!Array.isArray(bosses.manual)) return false;
  const groups = [...Object.values(bosses.revealed), ...bosses.manual];
  if (!decks.every(known) || !groups.every((shown) => isValidRevealed(shown, known))) return false;
  // An Extra Activation names a boss of its kind that is on display.
  if (!groups.every((shown) => shown.activates === undefined || groups.some((other) => other.kind === shown.kind && other.boss === shown.activates))) return false;
  return withinCopies([...decks, ...groups.flatMap(groupCards)], bossCopies);
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
  if (!knownList(shown.spam) || !knownList(shown.along) || !knownList(shown.gained)) return false;
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
