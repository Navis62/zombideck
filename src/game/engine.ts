import type { CardPart, CardSet, DangerLevel, DeckParts, GameState, Piles, ZombieCard } from './types';

export type Rng = () => number;

export const DANGER_LEVELS: readonly DangerLevel[] = ['blue', 'yellow', 'orange', 'red'];
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

export function newGame(
  sets: readonly CardSet[],
  setIds: string[],
  parts: DeckParts = ALL_PARTS,
  rng: Rng = Math.random,
  zones = 1,
): GameState {
  const ids = selectCards(sets, setIds, parts).map((card) => card.id);
  return {
    version: 2,
    setIds,
    piles: { draw: shuffle(ids, rng), discard: [], drawn: [], reshuffled: false },
    history: [],
    danger: 'blue',
    zones: clampZones(zones),
  };
}

/** Cards such as SPAM say "draw the next card": they come out with the card of their zone instead of filling it. */
export type DrawsAgain = (cardId: string) => boolean;

/**
 * Deals one card to each Spawn Zone. The cards of the previous step go to the discard first; an empty deck
 * reshuffles the discard, never the cards being dealt.
 */
export function drawCards(state: GameState, drawsAgain: DrawsAgain = () => false, rng: Rng = Math.random): GameState {
  let draw = state.piles.draw;
  let discard = [...state.piles.discard, ...state.piles.drawn];
  const drawn: string[] = [];
  let reshuffled = false;
  let filled = 0;
  while (filled < state.zones) {
    if (draw.length === 0) {
      if (discard.length === 0) break;
      draw = shuffle(discard, rng);
      discard = [];
      reshuffled = true;
    }
    const [card, ...rest] = draw;
    draw = rest;
    drawn.push(card);
    if (!drawsAgain(card)) filled++;
  }
  if (drawn.length === 0) return state;
  return { ...state, history: remember(state), piles: { draw, discard, drawn, reshuffled } };
}

/**
 * Deals the card of the next Spawn Zone only, for players who take the zones one at a time. Once every zone has its
 * card, the next draw starts a new Spawn step and discards the previous one.
 */
export function drawNextCard(state: GameState, drawsAgain: DrawsAgain = () => false, rng: Rng = Math.random): GameState {
  const { piles } = state;
  const filled = piles.drawn.filter((card) => !drawsAgain(card)).length;
  const newStep = filled >= state.zones;
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
  return { ...state, history: remember(state), piles: { draw: rest, discard, drawn, reshuffled } };
}

/** The Spawn Zone (from 1) of each card dealt: a card that draws again shares its zone with the next one. */
export function zonesOf(drawn: readonly string[], drawsAgain: DrawsAgain = () => false): number[] {
  let zone = 1;
  return drawn.map((card) => {
    const current = zone;
    if (!drawsAgain(card)) zone++;
    return current;
  });
}

const clampZones = (zones: number) => Math.min(MAX_ZONES, Math.max(1, Math.round(zones)));

/** Takes effect on the next draw; not something to undo. */
export function setZones(state: GameState, zones: number): GameState {
  return { ...state, zones: clampZones(zones) };
}

/** Puts every card, including the ones on display, back in the deck. */
export function reshuffleAll(state: GameState, rng: Rng = Math.random): GameState {
  const { draw, discard, drawn } = state.piles;
  return {
    ...state,
    history: remember(state),
    piles: { draw: shuffle([...draw, ...discard, ...drawn], rng), discard: [], drawn: [], reshuffled: false },
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

/** Brings a save from an older version of the app up to date; anything else comes back unchanged. */
export function upgradeSave(value: unknown): unknown {
  const save = value as { version?: number; piles?: PilesV1; history?: PilesV1[] } | null;
  if (save?.version !== 1 || !save.piles || !Array.isArray(save.history)) return value;
  // Version 1 had a single card on display and no Spawn Zones.
  const upgrade = ({ current, ...piles }: PilesV1): Piles => ({ ...piles, drawn: current === null ? [] : [current] });
  return { ...save, version: 2, zones: 1, piles: upgrade(save.piles), history: save.history.map(upgrade) };
}

/** Rejects saves that are malformed or refer to cards that no longer exist. */
export function isValidSave(value: unknown, knownCardIds: ReadonlySet<string>): value is GameState {
  const state = value as GameState | null;
  if (state?.version !== 2 || !DANGER_LEVELS.includes(state.danger)) return false;
  if (!Number.isInteger(state.zones) || state.zones !== clampZones(state.zones)) return false;
  if (!Array.isArray(state.setIds) || !state.setIds.every((id) => typeof id === 'string')) return false;
  if (!Array.isArray(state.history)) return false;
  return [state.piles, ...state.history].every((piles) => isValidPiles(piles, knownCardIds));
}

function isValidPiles(piles: Piles | null | undefined, knownCardIds: ReadonlySet<string>): boolean {
  if (!piles || !Array.isArray(piles.draw) || !Array.isArray(piles.discard) || !Array.isArray(piles.drawn)) return false;
  return [...piles.draw, ...piles.discard, ...piles.drawn].every((id) => knownCardIds.has(id));
}
