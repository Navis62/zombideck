import type { CardPart, CardSet, DangerLevel, DeckParts, GameState, Piles, ZombieCard } from './types';

export type Rng = () => number;

export const DANGER_LEVELS: readonly DangerLevel[] = ['blue', 'yellow', 'orange', 'red'];
export const MAX_UNDO = 20;

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
): GameState {
  const ids = selectCards(sets, setIds, parts).map((card) => card.id);
  return {
    version: 1,
    setIds,
    piles: { draw: shuffle(ids, rng), discard: [], current: null, reshuffled: false },
    history: [],
    danger: 'blue',
  };
}

/** The drawn card goes to the discard on the next draw; an empty deck reshuffles the discard. */
export function drawCard(state: GameState, rng: Rng = Math.random): GameState {
  const { draw, discard, current } = state.piles;
  const discarded = current ? [...discard, current] : discard;
  const reshuffled = draw.length === 0;
  const available = reshuffled ? shuffle(discarded, rng) : draw;
  if (available.length === 0) return state;
  return {
    ...state,
    history: remember(state),
    piles: {
      draw: available.slice(1),
      discard: reshuffled ? [] : discarded,
      current: available[0],
      reshuffled,
    },
  };
}

/** Puts every card, including the one on display, back in the deck. */
export function reshuffleAll(state: GameState, rng: Rng = Math.random): GameState {
  const { draw, discard, current } = state.piles;
  const all = current ? [...draw, ...discard, current] : [...draw, ...discard];
  return {
    ...state,
    history: remember(state),
    piles: { draw: shuffle(all, rng), discard: [], current: null, reshuffled: false },
  };
}

/** Shuffles the cards left in the deck; the discard and the card on display stay put. */
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

/** Rejects saves that are malformed or refer to cards that no longer exist. */
export function isValidSave(value: unknown, knownCardIds: ReadonlySet<string>): value is GameState {
  const state = value as GameState | null;
  if (state?.version !== 1 || !DANGER_LEVELS.includes(state.danger)) return false;
  if (!Array.isArray(state.setIds) || !state.setIds.every((id) => typeof id === 'string')) return false;
  if (!Array.isArray(state.history)) return false;
  return [state.piles, ...state.history].every((piles) => isValidPiles(piles, knownCardIds));
}

function isValidPiles(piles: Piles | null | undefined, knownCardIds: ReadonlySet<string>): boolean {
  if (!piles || !Array.isArray(piles.draw) || !Array.isArray(piles.discard)) return false;
  const { draw, discard, current } = piles;
  if (current !== null && !knownCardIds.has(current)) return false;
  return [...draw, ...discard].every((id) => knownCardIds.has(id));
}
