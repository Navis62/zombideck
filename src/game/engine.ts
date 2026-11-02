import type { CardSet, DangerLevel, GameState, Survivor, ZombieCard, ZombieType } from './types';

export type Rng = () => number;

export const DANGER_LEVELS: readonly DangerLevel[] = ['blue', 'yellow', 'orange', 'red'];
export const DEFAULT_SURVIVORS = 6;

export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function selectCards(
  sets: readonly CardSet[],
  setIds: readonly string[],
  excludedZombies: readonly ZombieType[],
): ZombieCard[] {
  return sets
    .filter((set) => setIds.includes(set.id))
    .flatMap((set) => set.cards)
    .filter((card) => !excludedZombies.includes(card.zombie));
}

export function newGame(
  sets: readonly CardSet[],
  setIds: string[],
  excludedZombies: ZombieType[],
  rng: Rng = Math.random,
): GameState {
  const ids = selectCards(sets, setIds, excludedZombies).map((card) => card.id);
  const survivors: Survivor[] = Array.from({ length: DEFAULT_SURVIVORS }, (_, i) => ({
    id: i + 1,
    name: '',
    xp: 0,
  }));
  return {
    version: 1,
    setIds,
    excludedZombies,
    piles: { draw: shuffle(ids, rng), discard: [], current: null, reshuffled: false },
    previous: null,
    survivors,
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
    previous: state.piles,
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
    previous: state.piles,
    piles: { draw: shuffle(all, rng), discard: [], current: null, reshuffled: false },
  };
}

export function undo(state: GameState): GameState {
  return state.previous ? { ...state, piles: state.previous, previous: null } : state;
}

export function dangerForXp(xp: number): DangerLevel {
  if (xp >= 43) return 'red';
  if (xp >= 19) return 'orange';
  if (xp >= 7) return 'yellow';
  return 'blue';
}

/** Spawns follow the highest Danger Level among the Survivors. */
export function partyDanger(survivors: readonly Survivor[]): DangerLevel {
  const highestXp = Math.max(0, ...survivors.map((survivor) => survivor.xp));
  return dangerForXp(highestXp);
}

export function changeXp(state: GameState, survivorId: number, delta: number): GameState {
  return {
    ...state,
    survivors: state.survivors.map((survivor) =>
      survivor.id === survivorId ? { ...survivor, xp: Math.max(0, survivor.xp + delta) } : survivor,
    ),
  };
}

export function renameSurvivor(state: GameState, survivorId: number, name: string): GameState {
  return {
    ...state,
    survivors: state.survivors.map((survivor) =>
      survivor.id === survivorId ? { ...survivor, name } : survivor,
    ),
  };
}

export function addSurvivor(state: GameState): GameState {
  const id = Math.max(0, ...state.survivors.map((survivor) => survivor.id)) + 1;
  return { ...state, survivors: [...state.survivors, { id, name: '', xp: 0 }] };
}

export function removeSurvivor(state: GameState, survivorId: number): GameState {
  return { ...state, survivors: state.survivors.filter((survivor) => survivor.id !== survivorId) };
}

/** Rejects saves that are malformed or refer to cards that no longer exist. */
export function isValidSave(value: unknown, knownCardIds: ReadonlySet<string>): value is GameState {
  const state = value as GameState | null;
  if (state?.version !== 1 || !Array.isArray(state.survivors) || !state.piles) return false;
  const { draw, discard, current } = state.piles;
  if (!Array.isArray(draw) || !Array.isArray(discard)) return false;
  const ids = current ? [...draw, ...discard, current] : [...draw, ...discard];
  return ids.every((id) => knownCardIds.has(id));
}
