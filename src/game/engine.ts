import type { CardSet, DangerLevel, GameState, Piles, ZombieCard } from './types';

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

export function selectCards(sets: readonly CardSet[], setIds: readonly string[]): ZombieCard[] {
  return sets.filter((set) => setIds.includes(set.id)).flatMap((set) => set.cards);
}

export function newGame(sets: readonly CardSet[], setIds: string[], rng: Rng = Math.random): GameState {
  const ids = selectCards(sets, setIds).map((card) => card.id);
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
