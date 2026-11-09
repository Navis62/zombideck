import assert from 'node:assert/strict';
import { test } from 'node:test';

import { CARD_SETS } from '../data/decks.ts';
import {
  activeSetIds,
  ALL_PARTS,
  cardPart,
  drawCards,
  drawNextCard,
  isValidSave,
  MAX_UNDO,
  MAX_ZONES,
  newGame,
  reshuffleAll,
  selectCards,
  setDanger,
  setZones,
  shuffleDeck,
  startsNewStep,
  undo,
  upgradeSave,
  zonesOf,
} from './engine.ts';
import type { CardSet, GameState, ZombieCard } from './types.ts';

const sets: CardSet[] = [
  {
    id: 'a',
    optional: false,
    isHard: () => false,
    cards: [
      { id: 'a1', setId: 'a', kind: 'spawn', zombie: 'walker', counts: [1, 2, 3, 4] },
      { id: 'a2', setId: 'a', kind: 'rush', zombie: 'fatty', counts: [1, 1, 2, 2] },
      { id: 'a3', setId: 'a', kind: 'extra', zombie: 'fatty' },
    ],
  },
  {
    id: 'b',
    optional: true,
    isHard: () => false,
    cards: [{ id: 'b1', setId: 'b', kind: 'spawn', zombie: 'abomination', counts: [0, 0, 1, 1] }],
  },
];

const allIds = (state: GameState) => {
  const { draw, discard, drawn } = state.piles;
  return [...draw, ...discard, ...drawn].sort();
};
const drawCard = (state: GameState, rng?: () => number) => drawCards(state, undefined, rng);

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
  const withReplacement: CardSet[] = [...sets, { id: 'c', optional: true, replaces: 'a', isHard: () => false, cards: [] }];
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
    seen.push(...state.piles.drawn);
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
  assert.deepEqual(state.piles.drawn, ['b1']);
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
  assert.deepEqual(state.piles.drawn, []);
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
  assert.equal(isValidSave({ ...state, zones: 0 }, known), false);
  assert.equal(isValidSave({ ...state, zones: MAX_ZONES + 1 }, known), false);
  assert.equal(isValidSave({ ...state, danger: 'purple' }, known), false);
});

test('save validation also checks the set ids and the undo history', () => {
  const state = drawCard(newGame(sets, ['a']));
  const known = new Set(['a1', 'a2', 'a3']);
  const { setIds: _setIds, ...withoutSetIds } = state;
  assert.equal(isValidSave(withoutSetIds, known), false);
  assert.equal(isValidSave({ ...state, history: [null] }, known), false);
  assert.equal(isValidSave({ ...state, history: [{ ...state.piles, draw: ['gone'] }] }, known), false);
  assert.equal(isValidSave({ ...state, history: [{ ...state.piles, drawn: ['gone'] }] }, known), false);
  assert.equal(isValidSave({ ...state, piles: { ...state.piles, drawn: 42 } }, known), false);
});

test('each draw deals one card per Spawn Zone and undoes as a whole', () => {
  const start = setZones(newGame(sets, ['a', 'b']), 3);
  const first = drawCard(start);
  assert.equal(first.piles.drawn.length, 3);
  assert.equal(first.piles.draw.length, 1);
  assert.deepEqual(undo(first).piles, start.piles);
  // The next step discards these three, deals the last card, then reshuffles the discard for the rest.
  const second = drawCard(first);
  assert.equal(second.piles.drawn.length, 3);
  assert.equal(second.piles.reshuffled, true);
  assert.deepEqual(allIds(second), ['a1', 'a2', 'a3', 'b1']);
  assert.deepEqual(undo(second).piles, first.piles);
});

test('one card at a time fills the Spawn Zones in turn, then starts a new step', () => {
  let state = setZones(newGame(sets, ['a', 'b']), 3);
  state = drawNextCard(state);
  state = drawNextCard(state);
  assert.equal(state.piles.drawn.length, 2);
  assert.equal(state.piles.discard.length, 0);
  const before = state;
  state = drawNextCard(state);
  assert.equal(state.piles.drawn.length, 3);
  assert.deepEqual(undo(state).piles, before.piles);
  // Every zone has its card: the next one discards the step and starts the next.
  state = drawNextCard(state);
  assert.deepEqual(state.piles.drawn, [before.piles.draw[1]]);
  assert.equal(state.piles.discard.length, 3);
});

test('one card at a time: a card that draws again leaves its zone open, the cards in play never reshuffle', () => {
  const spam = (id: string) => id === 'a1';
  // Three zones, but SPAM fills none: the third zone is still open when the deck runs out.
  let state = setZones(newGame(sets, ['a']), 3);
  state = { ...state, piles: { ...state.piles, draw: ['a1', 'a2', 'a3'] } };
  state = drawNextCard(drawNextCard(drawNextCard(state, spam), spam), spam);
  assert.deepEqual(state.piles.drawn, ['a1', 'a2', 'a3']);
  assert.deepEqual(drawNextCard(state, spam), state);
});

test('one card at a time: a new Spawn step starts on an empty table or once every zone is served', () => {
  const spam = (id: string) => id === 'a1';
  let state = setZones(newGame(sets, ['a']), 2);
  state = { ...state, piles: { ...state.piles, draw: ['a1', 'a2', 'a3'] } };
  assert.equal(startsNewStep(state, spam), true);
  state = drawNextCard(state, spam);
  // SPAM serves no zone.
  assert.equal(startsNewStep(state, spam), false);
  state = drawNextCard(state, spam);
  assert.equal(startsNewStep(state, spam), false);
  state = drawNextCard(state, spam);
  assert.equal(startsNewStep(state, spam), true);
});

test('a deck smaller than the Spawn Zones deals what it has', () => {
  const state = drawCard(setZones(newGame(sets, ['b']), 4));
  assert.deepEqual(state.piles.drawn, ['b1']);
});

test('a card that draws again shares its Spawn Zone with the next card', () => {
  const spam = (id: string) => id === 'a1';
  const state = drawCards(setZones(newGame(sets, ['a', 'b'], ALL_PARTS, () => 0), 2), spam, () => 0);
  const { drawn } = state.piles;
  assert.equal(drawn.length, drawn.includes('a1') ? 3 : 2);
  assert.deepEqual(zonesOf(['a1', 'a2', 'a3'], spam), [1, 1, 2]);
  assert.deepEqual(zonesOf(['a2', 'a1', 'a3'], spam), [1, 2, 2]);
});

test('the number of Spawn Zones stays within bounds and survives undo', () => {
  const state = newGame(sets, ['a']);
  assert.equal(state.zones, 1);
  assert.equal(setZones(state, 0).zones, 1);
  assert.equal(setZones(state, MAX_ZONES + 3).zones, MAX_ZONES);
  assert.equal(undo(setZones(drawCard(state), 2)).zones, 2);
  assert.equal(newGame(sets, ['a'], ALL_PARTS, Math.random, 3).zones, 3);
});

test('a save from version 1 comes back with its card on display', () => {
  const v1 = {
    version: 1,
    setIds: ['a'],
    piles: { draw: ['a1'], discard: ['a2'], current: 'a3', reshuffled: false },
    history: [{ draw: ['a3', 'a1'], discard: ['a2'], current: null, reshuffled: false }],
    danger: 'yellow',
  };
  const upgraded = upgradeSave(v1);
  assert.ok(isValidSave(upgraded, new Set(['a1', 'a2', 'a3'])));
  assert.deepEqual(upgraded.piles, { draw: ['a1'], discard: ['a2'], drawn: ['a3'], reshuffled: false });
  assert.deepEqual(upgraded.history[0].drawn, []);
  assert.equal(upgraded.zones, 1);
  assert.equal(upgradeSave(null), null);
});

test('card ids are unique and belong to their set', () => {
  const cards = CARD_SETS.flatMap((set) => set.cards.map((card) => ({ card, set })));
  assert.equal(new Set(cards.map(({ card }) => card.id)).size, cards.length);
  assert.ok(cards.every(({ card, set }) => card.setId === set.id));
});

test('expansion cards stay out of the deck until switched on', () => {
  assert.deepEqual(activeSetIds(CARD_SETS, []), ['core2e', 'abomination']);
  assert.equal(selectCards(CARD_SETS, activeSetIds(CARD_SETS, [])).length, 40);
  const optional = CARD_SETS.filter((set) => set.optional).map((set) => set.id);
  assert.equal(selectCards(CARD_SETS, activeSetIds(CARD_SETS, optional)).length, 174);
});

test('expansion cards follow the printed numbers without gaps', () => {
  const numbers = CARD_SETS.filter((set) => set.id !== 'core2e')
    .flatMap((set) => set.cards.map((card) => Number(card.id.slice(-3))));
  assert.deepEqual(numbers, Array.from({ length: 174 }, (_, index) => index + 41));
});

test('Fort Hendrix replaces the core deck card for card', () => {
  assert.deepEqual(activeSetIds(CARD_SETS, ['fortHendrix']), ['fortHendrix', 'abomination']);
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
  const drawn = drawCard(drawCard(newGame(sets, ['a', 'b'], ALL_PARTS, () => 0), () => 0), () => 0);
  const reversed = shuffleDeck(drawn, () => 0.999);
  assert.deepEqual(reversed.piles.drawn, drawn.piles.drawn);
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

test('every set splits into easier and harder cards, Extra Activations apart', () => {
  const tally = (setId: string) => {
    const set = CARD_SETS.find((s) => s.id === setId)!;
    const result: Record<string, number> = {};
    for (const card of set.cards) result[cardPart(set, card)] = (result[cardPart(set, card)] ?? 0) + 1;
    return result;
  };
  assert.deepEqual(tally('core2e'), { easy: 18, hard: 18, extra: 4 });
  assert.deepEqual(tally('fortHendrix'), { easy: 18, hard: 18, extra: 4 });
  assert.deepEqual(tally('skinner'), { easy: 16, hard: 16, extra: 4 });
  assert.deepEqual(tally('trejo'), { easy: 4, hard: 2 });
  assert.deepEqual(tally('toxic'), { easy: 8, hard: 3 });
  assert.deepEqual(tally('berserker'), { easy: 8, hard: 3 });
  assert.deepEqual(tally('seeker'), { easy: 8, hard: 4 });
  assert.deepEqual(tally('dogz'), { easy: 6, hard: 6 });
  assert.deepEqual(tally('vip'), { easy: 6, hard: 6 });
  assert.deepEqual(tally('crowz'), { easy: 6, hard: 6 });
  assert.deepEqual(tally('zombivor'), { easy: 4, hard: 2 });
  assert.deepEqual(tally('abomination'), { easy: 3, hard: 3 });
  assert.deepEqual(tally('python'), { easy: 6, hard: 4 });
});

test('the deck keeps only the chosen parts', () => {
  const size = (parts: Parameters<typeof selectCards>[2]) => selectCards(CARD_SETS, ['core2e', 'zombivor'], parts).length;
  assert.equal(size(ALL_PARTS), 46);
  assert.equal(size({ easy: true, hard: false, extra: true }), 18 + 4 + 4);
  assert.equal(size({ easy: false, hard: true, extra: false }), 18 + 2);
  assert.equal(size({ easy: false, hard: false, extra: true }), 4);
});

test('the kit Abominations follow the share of zombie expansions switched on, easier and harder in turn', () => {
  const abominations = (expansions: string[]) =>
    selectCards(CARD_SETS, activeSetIds(CARD_SETS, expansions))
      .filter((card) => card.setId === 'abomination')
      .map((card) => card.id.slice(-3));
  const zombieSets = CARD_SETS.filter((set) => set.addsZombies).map((set) => set.id);
  assert.deepEqual(abominations([]), []);
  assert.deepEqual(abominations(['trejo', 'python']), []);
  assert.deepEqual(abominations(zombieSets), ['199', '202', '200', '203', '201', '204']);
  // 88 of the 112 zombie expansion cards: 4.7 Abominations.
  assert.deepEqual(abominations(zombieSets.filter((id) => id !== 'seeker' && id !== 'crowz')), ['199', '202', '200', '203', '201']);
  // Rue Morgue alone, 36 cards: 1.9.
  assert.deepEqual(abominations(['skinner']), ['199', '202']);
});
