import assert from 'node:assert/strict';
import { test } from 'node:test';

import { CARD_SETS } from '../data/decks.ts';
import {
  activeSetIds,
  drawCard,
  isValidSave,
  MAX_UNDO,
  newGame,
  reshuffleAll,
  selectCards,
  setDanger,
  shuffleDeck,
  undo,
} from './engine.ts';
import type { CardSet, GameState, ZombieCard } from './types.ts';

const sets: CardSet[] = [
  {
    id: 'a',
    optional: false,
    cards: [
      { id: 'a1', setId: 'a', kind: 'spawn', zombie: 'walker', counts: [1, 2, 3, 4] },
      { id: 'a2', setId: 'a', kind: 'rush', zombie: 'fatty', counts: [1, 1, 2, 2] },
      { id: 'a3', setId: 'a', kind: 'extra', zombie: 'fatty' },
    ],
  },
  {
    id: 'b',
    optional: true,
    cards: [{ id: 'b1', setId: 'b', kind: 'spawn', zombie: 'abomination', counts: [0, 0, 1, 1] }],
  },
];

const allIds = (state: GameState) => {
  const { draw, discard, current } = state.piles;
  return [...draw, ...discard, ...(current ? [current] : [])].sort();
};

test('selects cards by set', () => {
  assert.deepEqual(selectCards(sets, ['a']).map((c) => c.id), ['a1', 'a2', 'a3']);
  assert.deepEqual(selectCards(sets, ['b']).map((c) => c.id), ['b1']);
});

test('non-optional sets are always active, optional ones only when enabled', () => {
  assert.deepEqual(activeSetIds(sets, []), ['a']);
  assert.deepEqual(activeSetIds(sets, ['b']), ['a', 'b']);
  assert.deepEqual(activeSetIds(sets, ['gone']), ['a']);
});

test('a set that replaces another takes it out of the deck only when switched on', () => {
  const withReplacement: CardSet[] = [...sets, { id: 'c', optional: true, replaces: 'a', cards: [] }];
  assert.deepEqual(activeSetIds(withReplacement, []), ['a']);
  assert.deepEqual(activeSetIds(withReplacement, ['c']), ['c']);
  assert.deepEqual(activeSetIds(withReplacement, ['b', 'c']), ['b', 'c']);
});

test('a full cycle sees each card once, then reshuffles the discard', () => {
  let state = newGame(sets, ['a', 'b']);
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
  let state = newGame(sets, ['b']);
  state = drawCard(state);
  state = drawCard(state);
  assert.equal(state.piles.current, 'b1');
  assert.equal(state.piles.reshuffled, true);
});

test('drawing from an empty selection changes nothing', () => {
  const state = newGame(sets, []);
  assert.equal(drawCard(state), state);
});

test('undo steps back through every draw, down to the new game', () => {
  const start = newGame(sets, ['a', 'b']);
  const first = drawCard(start);
  const second = drawCard(first);
  assert.deepEqual(undo(second).piles, first.piles);
  const undone = undo(undo(second));
  assert.deepEqual(undone.piles, start.piles);
  assert.equal(undo(undone), undone);
});

test('undo can step back over an automatic reshuffle', () => {
  const emptied = drawCard(newGame(sets, ['b']));
  const reshuffled = drawCard(emptied);
  assert.equal(reshuffled.piles.reshuffled, true);
  assert.deepEqual(undo(reshuffled).piles, emptied.piles);
});

test('undo history is capped', () => {
  let state = newGame(sets, ['a', 'b']);
  for (let i = 0; i < MAX_UNDO + 5; i++) state = drawCard(state);
  assert.equal(state.history.length, MAX_UNDO);
});

test('manual reshuffle keeps every card, including the one on display', () => {
  const state = reshuffleAll(drawCard(drawCard(newGame(sets, ['a', 'b']))));
  assert.equal(state.piles.current, null);
  assert.equal(state.piles.draw.length, 4);
  assert.deepEqual(allIds(state), ['a1', 'a2', 'a3', 'b1']);
});

test('a game starts at blue and undo keeps the chosen danger level', () => {
  const state = newGame(sets, ['a']);
  assert.equal(state.danger, 'blue');
  const next = setDanger(drawCard(state), 'orange');
  assert.equal(next.danger, 'orange');
  assert.equal(undo(next).danger, 'orange');
});

test('save validation', () => {
  const state = drawCard(newGame(sets, ['a']));
  const known = new Set(['a1', 'a2', 'a3']);
  assert.equal(isValidSave(JSON.parse(JSON.stringify(state)), known), true);
  assert.equal(isValidSave(state, new Set(['a1'])), false);
  assert.equal(isValidSave(null, known), false);
  assert.equal(isValidSave({ version: 2 }, known), false);
  assert.equal(isValidSave({ ...state, danger: 'purple' }, known), false);
});

test('save validation also checks the set ids and the undo history', () => {
  const state = drawCard(newGame(sets, ['a']));
  const known = new Set(['a1', 'a2', 'a3']);
  const { setIds: _setIds, ...withoutSetIds } = state;
  assert.equal(isValidSave(withoutSetIds, known), false);
  assert.equal(isValidSave({ ...state, history: [null] }, known), false);
  assert.equal(isValidSave({ ...state, history: [{ ...state.piles, draw: ['gone'] }] }, known), false);
  assert.equal(isValidSave({ ...state, history: [{ ...state.piles, current: 'gone' }] }, known), false);
  assert.equal(isValidSave({ ...state, piles: { ...state.piles, current: 42 } }, known), false);
});

test('card ids are unique and belong to their set', () => {
  const cards = CARD_SETS.flatMap((set) => set.cards.map((card) => ({ card, set })));
  assert.equal(new Set(cards.map(({ card }) => card.id)).size, cards.length);
  assert.ok(cards.every(({ card, set }) => card.setId === set.id));
});

test('expansion cards stay out of the deck until switched on', () => {
  assert.deepEqual(activeSetIds(CARD_SETS, []), ['core2e']);
  const optional = CARD_SETS.filter((set) => set.optional).map((set) => set.id);
  assert.equal(selectCards(CARD_SETS, activeSetIds(CARD_SETS, optional)).length, 174);
});

test('expansion cards follow the printed numbers without gaps', () => {
  const numbers = CARD_SETS.filter((set) => set.optional)
    .flatMap((set) => set.cards.map((card) => Number(card.id.slice(-3))));
  assert.deepEqual(numbers, Array.from({ length: 174 }, (_, index) => index + 41));
});

test('Fort Hendrix replaces the core deck card for card', () => {
  assert.deepEqual(activeSetIds(CARD_SETS, ['fortHendrix']), ['fortHendrix']);
  const counts = ({ id, setId, ...card }: ZombieCard) => ({ ...card, shooter: undefined });
  assert.deepEqual(selectCards(CARD_SETS, ['fortHendrix']).map(counts), selectCards(CARD_SETS, ['core2e']).map(counts));
});

test('the core deck matches the rulebook', () => {
  const cards = selectCards(CARD_SETS, ['core2e']);
  assert.equal(cards.length, 40);
  assert.deepEqual(cards.filter((c) => c.kind === 'extra').map((c) => c.id), [
    'core2e-037', 'core2e-038', 'core2e-039', 'core2e-040',
  ]);
  assert.ok(cards.every((c) => c.kind !== 'rush' || c.zombie === 'walker' || c.zombie === 'fatty'));
});

test('shuffling the deck leaves the discard and the card on display alone, and can be undone', () => {
  const drawn = drawCard(drawCard(newGame(sets, ['a', 'b'], () => 0), () => 0), () => 0);
  const reversed = shuffleDeck(drawn, () => 0.999);
  assert.equal(reversed.piles.current, drawn.piles.current);
  assert.deepEqual(reversed.piles.discard, drawn.piles.discard);
  assert.deepEqual([...reversed.piles.draw].sort(), [...drawn.piles.draw].sort());
  assert.deepEqual(undo(reversed).piles, drawn.piles);
});

test('every expansion has a name in every language', async () => {
  const { TRANSLATIONS } = await import('../i18n/translations.ts');
  for (const [language, texts] of Object.entries(TRANSLATIONS)) {
    for (const set of CARD_SETS.filter((s) => s.optional)) {
      assert.ok((texts as Record<string, string>)[`set.${set.id}`], `${language}: set.${set.id}`);
    }
  }
});
