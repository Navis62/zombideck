import assert from 'node:assert/strict';
import { test } from 'node:test';

import { CARD_SETS } from '../data/decks.ts';
import {
  addSurvivor,
  changeXp,
  dangerForXp,
  drawCard,
  isValidSave,
  newGame,
  partyDanger,
  removeSurvivor,
  reshuffleAll,
  selectCards,
  undo,
} from './engine.ts';
import type { CardSet, GameState } from './types.ts';

const sets: CardSet[] = [
  {
    id: 'a',
    verified: true,
    cards: [
      { id: 'a1', setId: 'a', kind: 'spawn', zombie: 'walker', counts: [1, 2, 3, 4] },
      { id: 'a2', setId: 'a', kind: 'rush', zombie: 'runner', counts: [1, 1, 2, 2] },
      { id: 'a3', setId: 'a', kind: 'extra', zombie: 'fatty' },
    ],
  },
  {
    id: 'b',
    verified: true,
    cards: [{ id: 'b1', setId: 'b', kind: 'spawn', zombie: 'abomination', counts: [0, 0, 1, 1] }],
  },
];

const allIds = (state: GameState) => {
  const { draw, discard, current } = state.piles;
  return [...draw, ...discard, ...(current ? [current] : [])].sort();
};

test('selects cards by set and excluded zombie type', () => {
  assert.deepEqual(selectCards(sets, ['a'], ['runner']).map((c) => c.id), ['a1', 'a3']);
  assert.deepEqual(selectCards(sets, ['a', 'b'], ['abomination']).map((c) => c.id), ['a1', 'a2', 'a3']);
});

test('a full cycle sees each card once, then reshuffles the discard', () => {
  let state = newGame(sets, ['a', 'b'], []);
  const seen: string[] = [];
  for (let i = 0; i < 4; i++) {
    state = drawCard(state);
    assert.equal(state.piles.reshuffled, false);
    seen.push(state.piles.current as string);
  }
  assert.deepEqual([...seen].sort(), ['a1', 'a2', 'a3', 'b1']);
  assert.equal(state.piles.draw.length, 0);
  assert.equal(state.piles.discard.length, 3);

  state = drawCard(state);
  assert.equal(state.piles.reshuffled, true);
  assert.deepEqual(allIds(state), ['a1', 'a2', 'a3', 'b1']);
  assert.equal(state.piles.discard.length, 0);
  assert.equal(state.piles.draw.length, 3);
});

test('reshuffling one single card draws it again', () => {
  let state = newGame(sets, ['b'], []);
  state = drawCard(state);
  state = drawCard(state);
  assert.equal(state.piles.current, 'b1');
  assert.equal(state.piles.reshuffled, true);
});

test('drawing from an empty selection changes nothing', () => {
  const state = newGame(sets, [], []);
  assert.equal(drawCard(state), state);
});

test('undo restores the previous piles, once', () => {
  const start = drawCard(newGame(sets, ['a', 'b'], []));
  const next = drawCard(start);
  const undone = undo(next);
  assert.deepEqual(undone.piles, start.piles);
  assert.equal(undone.previous, null);
  assert.equal(undo(undone), undone);
});

test('manual reshuffle keeps every card, including the one on display', () => {
  const state = reshuffleAll(drawCard(drawCard(newGame(sets, ['a', 'b'], []))));
  assert.equal(state.piles.current, null);
  assert.equal(state.piles.draw.length, 4);
  assert.deepEqual(allIds(state), ['a1', 'a2', 'a3', 'b1']);
});

test('danger thresholds', () => {
  assert.deepEqual([0, 6, 7, 18, 19, 42, 43].map(dangerForXp), [
    'blue', 'blue', 'yellow', 'yellow', 'orange', 'orange', 'red',
  ]);
});

test('party danger follows the highest survivor and XP stays positive', () => {
  let state = newGame(sets, ['a'], []);
  assert.equal(partyDanger(state.survivors), 'blue');
  state = changeXp(state, 2, 19);
  assert.equal(partyDanger(state.survivors), 'orange');
  state = changeXp(state, 1, -5);
  assert.equal(state.survivors[0].xp, 0);
  state = removeSurvivor(state, 2);
  assert.equal(partyDanger(state.survivors), 'blue');
  assert.equal(partyDanger([]), 'blue');
});

test('new survivors get a fresh id', () => {
  let state = removeSurvivor(newGame(sets, ['a'], []), 1);
  state = addSurvivor(state);
  assert.equal(new Set(state.survivors.map((s) => s.id)).size, state.survivors.length);
});

test('save validation', () => {
  const state = drawCard(newGame(sets, ['a'], []));
  const known = new Set(['a1', 'a2', 'a3']);
  assert.equal(isValidSave(JSON.parse(JSON.stringify(state)), known), true);
  assert.equal(isValidSave(state, new Set(['a1'])), false);
  assert.equal(isValidSave(null, known), false);
  assert.equal(isValidSave({ version: 2 }, known), false);
});

test('demo card ids are unique and belong to their set', () => {
  const cards = CARD_SETS.flatMap((set) => set.cards.map((card) => ({ card, set })));
  assert.equal(new Set(cards.map(({ card }) => card.id)).size, cards.length);
  assert.ok(cards.every(({ card, set }) => card.setId === set.id));
});
