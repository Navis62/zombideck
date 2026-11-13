import assert from 'node:assert/strict';
import { test } from 'node:test';

import { CARD_SETS, OPTIONAL_SETS } from '../data/decks.ts';
import { BOSS_RULE_IDS, BOSSES_WITHOUT_RULE, FANTASY_SETS } from '../data/fantasy.ts';
import { BOSS_IDS, DEFAULT_THREAT, parseThreat, tailorFantasyDeck, type Threat } from '../data/threat.ts';
import { allExpansions, bossTrigger as fantasyBossTrigger, CARDS_BY_ID, cardEffect, cardIdsOf, noExpansions, switchableSets, UNIVERSES, withCoreBox } from '../data/universes.ts';
import {
  activeSetIds,
  ALL_PARTS,
  cardPart,
  DANGER_LEVELS,
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
  type SpawnEffect,
  startsNewStep,
  pendingZones,
  undo,
  upgradeSave,
  zonesOf,
} from './engine.ts';
import type { BossKind, CardSet, GameState, Piles, ZombieCard } from './types.ts';
import { NO_BOSS, NO_DECK } from './types.ts';

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
  assert.equal(isValidSave(JSON.parse(JSON.stringify(state)), () => known), true);
  assert.equal(isValidSave(state, () => new Set(['a1'])), false);
  assert.equal(isValidSave(null, () => known), false);
  assert.equal(isValidSave({ version: 2 }, () => known), false);
  assert.equal(isValidSave({ ...state, zones: 0 }, () => known), false);
  assert.equal(isValidSave({ ...state, zones: MAX_ZONES + 1 }, () => known), false);
  assert.equal(isValidSave({ ...state, danger: 'purple' }, () => known), false);
  assert.equal(isValidSave({ ...state, universe: 'steampunk' }, () => known), false);
});

test('save validation also checks the set ids and the undo history', () => {
  const state = drawCard(newGame(sets, ['a']));
  const known = new Set(['a1', 'a2', 'a3']);
  const { setIds: _setIds, ...withoutSetIds } = state;
  assert.equal(isValidSave(withoutSetIds, () => known), false);
  assert.equal(isValidSave({ ...state, history: [null] }, () => known), false);
  assert.equal(isValidSave({ ...state, history: [{ ...state.piles, draw: ['gone'] }] }, () => known), false);
  assert.equal(isValidSave({ ...state, history: [{ ...state.piles, drawn: ['gone'] }] }, () => known), false);
  assert.equal(isValidSave({ ...state, piles: { ...state.piles, drawn: 42 } }, () => known), false);
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
  const spam = (id: string): SpawnEffect => (id === 'a1' ? 'drawAgain' : 'spawn');
  // Three zones, but SPAM fills none: the third zone is still open when the deck runs out.
  let state = setZones(newGame(sets, ['a']), 3);
  state = { ...state, piles: { ...state.piles, draw: ['a1', 'a2', 'a3'] } };
  state = drawNextCard(drawNextCard(drawNextCard(state, spam), spam), spam);
  assert.deepEqual(state.piles.drawn, ['a1', 'a2', 'a3']);
  assert.deepEqual(drawNextCard(state, spam), state);
});

test('one card at a time: a new Spawn step starts on an empty table or once every zone is served', () => {
  const spam = (id: string): SpawnEffect => (id === 'a1' ? 'drawAgain' : 'spawn');
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

// Double Spawn and Enter the Horde, on a deck in a known order: d = Double Spawn, h = Enter the Horde, a1..a6 plain.
const stacked = (zones: number, draw: string[]) => {
  const state = setZones(newGame(sets, ['a']), zones);
  return { ...state, piles: { ...state.piles, draw } };
};
const fantasyEffect = (id: string): SpawnEffect => (id.startsWith('d') ? 'double' : id.startsWith('h') ? 'endStep' : 'spawn');

test('a Double Spawn sends two cards to the next zone', () => {
  const state = drawCards(stacked(3, ['a1', 'd1', 'a2', 'a3', 'a4', 'a5']), fantasyEffect);
  assert.deepEqual(state.piles.drawn, ['a1', 'd1', 'a2', 'a3']);
  assert.deepEqual(zonesOf(state.piles.drawn, fantasyEffect, 3), [1, 2, 3, 3]);
});

test('two Double Spawns for one zone send four cards to the next one', () => {
  const state = drawCards(stacked(4, ['d1', 'd2', 'd3', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6']), fantasyEffect);
  // Zone 1 draws a Double Spawn: zone 2 draws two cards, both Double Spawns: zone 3 draws four, zone 4 one.
  assert.deepEqual(state.piles.drawn, ['d1', 'd2', 'd3', 'a1', 'a2', 'a3', 'a4', 'a5']);
  assert.deepEqual(zonesOf(state.piles.drawn, fantasyEffect, 4), [1, 2, 2, 3, 3, 3, 3, 4]);
});

test('a Double Spawn for the last zone gives the first zone an extra double spawn', () => {
  const state = drawCards(stacked(2, ['a1', 'd1', 'a2', 'a3', 'a4']), fantasyEffect);
  assert.deepEqual(state.piles.drawn, ['a1', 'd1', 'a2', 'a3']);
  assert.deepEqual(zonesOf(state.piles.drawn, fantasyEffect, 2), [1, 2, 1, 1]);
});

test('Enter the Horde ends the Spawn step', () => {
  const state = drawCards(stacked(4, ['a1', 'h1', 'a2']), fantasyEffect);
  assert.deepEqual(state.piles.drawn, ['a1', 'h1']);
  assert.equal(startsNewStep(state, fantasyEffect), true);
});

test('one zone at a time follows Double Spawns and lists the zones still waiting', () => {
  let state = stacked(3, ['a1', 'd1', 'a2', 'a3', 'a4']);
  assert.deepEqual(pendingZones(state, fantasyEffect), [1, 2, 3]);
  state = drawNextCard(drawNextCard(state, fantasyEffect), fantasyEffect);
  assert.deepEqual(pendingZones(state, fantasyEffect), [3, 3]);
  state = drawNextCard(state, fantasyEffect);
  assert.deepEqual(pendingZones(state, fantasyEffect), [3]);
  assert.equal(startsNewStep(state, fantasyEffect), false);
  state = drawNextCard(state, fantasyEffect);
  assert.equal(startsNewStep(state, fantasyEffect), true);
  assert.deepEqual(pendingZones(state, fantasyEffect), []);
});

test('a deck smaller than the Spawn Zones deals what it has', () => {
  const state = drawCard(setZones(newGame(sets, ['b']), 4));
  assert.deepEqual(state.piles.drawn, ['b1']);
});

test('a card that draws again shares its Spawn Zone with the next card', () => {
  const spam = (id: string): SpawnEffect => (id === 'a1' ? 'drawAgain' : 'spawn');
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
  assert.ok(isValidSave(upgraded, () => new Set(['a1', 'a2', 'a3'])));
  assert.deepEqual(upgraded.piles, { draw: ['a1'], discard: ['a2'], drawn: ['a3'], reshuffled: false, bosses: null });
  assert.deepEqual(upgraded.history[0].drawn, []);
  assert.equal(upgraded.zones, 1);
  assert.equal(upgraded.universe, 'modern');
  assert.equal(upgradeSave(null), null);
});

/** A save as an older version wrote it: no boss decks, no boss rule. */
const withoutBosses = ({ bossRule: _bossRule, piles, history, ...game }: GameState) => {
  const strip = ({ bosses: _bosses, ...rest }: Piles) => rest;
  return { ...game, piles: strip(piles), history: history.map(strip) };
};

test('a save from version 2 comes back in the modern universe, its game untouched', () => {
  const game = drawCard(setZones(newGame(sets, ['a']), 2));
  const { universe: _universe, ...v2 } = { ...withoutBosses(game), version: 2 };
  const upgraded = upgradeSave(JSON.parse(JSON.stringify(v2)));
  assert.ok(isValidSave(upgraded, () => new Set(['a1', 'a2', 'a3'])));
  assert.deepEqual(upgraded, game);
});

test('a save from version 3 comes back without boss decks, its game untouched', () => {
  const game = drawCard(drawCard(newGame(sets, ['a'])));
  const v3 = { ...withoutBosses(game), version: 3 };
  const upgraded = upgradeSave(JSON.parse(JSON.stringify(v3)));
  assert.ok(isValidSave(upgraded, () => new Set(['a1', 'a2', 'a3'])));
  assert.deepEqual(upgraded, game);
  assert.equal(isValidSave(v3, () => new Set(['a1', 'a2', 'a3'])), false);
});

test('a new game belongs to the universe it is started in', () => {
  assert.equal(newGame(sets, ['a']).universe, 'modern');
  assert.equal(newGame(sets, ['a'], ALL_PARTS, Math.random, 1, 'modern').universe, 'modern');
});

test('card ids are unique and belong to their set', () => {
  const cards = CARD_SETS.flatMap((set) => set.cards.map((card) => ({ card, set })));
  assert.equal(new Set(cards.map(({ card }) => card.id)).size, cards.length);
  assert.ok(cards.every(({ card, set }) => card.setId === set.id));
});

test('expansion cards stay out of the deck until switched on', () => {
  assert.deepEqual(activeSetIds(CARD_SETS, []), ['core2e', 'abomination']);
  assert.equal(selectCards(CARD_SETS, activeSetIds(CARD_SETS, [])).length, 40);
  const optional = OPTIONAL_SETS.map((set) => set.id);
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
    for (const set of Object.values(UNIVERSES).flatMap((universe) => universe.optionalSets)) {
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

const fantasyCard = (id: string) => {
  const card = CARDS_BY_ID.get(id);
  assert.ok(card, id);
  return card;
};
const levelsOf = (id: string) => {
  const card = fantasyCard(id);
  assert.equal(card.kind, 'levels');
  return card.kind === 'levels' ? card.levels : [];
};

test('Black Plague and Green Horde have their 54 cards each, numbered without gaps', () => {
  const numbers = (setId: string) => FANTASY_SETS.find((set) => set.id === setId)?.cards.map((card) => Number(card.id.slice(-3)));
  assert.deepEqual(numbers('blackPlague'), Array.from({ length: 54 }, (_, i) => 1 + i));
  assert.deepEqual(numbers('greenHorde'), Array.from({ length: 54 }, (_, i) => 167 + i));
});

test('the fantasy expansions follow the printed numbers: #055-#116, #253-#266, #285-#350', () => {
  const ids = ['wulfsburg', 'npc1', 'npc2', 'zombieBosses', 'deadeyeWalkers', 'fantasyCrowz', 'friendsAndFoes', 'hordeBox'];
  const cards = ids.flatMap((id) => FANTASY_SETS.find((set) => set.id === id)?.cards ?? []);
  const range = (first: number, last: number) => Array.from({ length: last - first + 1 }, (_, i) => first + i);
  const printed = [...range(55, 116), ...range(253, 266), ...range(285, 350)];
  assert.deepEqual(cards.map((card) => Number(card.id.slice(-3))), printed);
  assert.ok(ids.every((id) => UNIVERSES.fantasy.optionalSets.some((set) => set.id === id && !set.core)));
});

test('the fantasy expansion cards match the printed cards', () => {
  const counts = (id: string) => levelsOf(id).map((level) => level && `${level.zombie} ${level.count}`);
  assert.deepEqual(counts('wulfsburg-060'), ['wolfz 3', 'wolfz 4', 'wolfz 5', 'wolfz 6']);
  assert.deepEqual(counts('wulfsburg-062'), [null, 'wolfbomination 1', 'wolfbomination 1', 'wolfbomination 1']);
  // The fan wiki has #064 as 1/3/4/4 and #065 with 5 at Red.
  assert.deepEqual(counts('npc1-064'), ['npcWalker 1', 'npcWalker 1', 'npcWalker 6', 'npcWalker 7']);
  assert.deepEqual(counts('npc1-065'), ['npcWalker 1', 'npcWalker 2', 'npcWalker 2', 'npcWalker 8']);
  assert.deepEqual(counts('npc2-083'), [null, 'npcWalker 4', 'npcWalker 4', 'npcWalker 5']);
  assert.deepEqual(counts('npc2-086'), ['npcWalker 2', 'npcWalker 3', 'npcWalker 4', 'npcWalker 4']);
  assert.deepEqual(counts('deadeyeWalkers-104'), ['deadeyeWalker 3', 'deadeyeWalker 4', 'deadeyeWalker 5', 'deadeyeWalker 6']);
  assert.deepEqual(counts('fantasyCrowz-113'), ['crowz 2', 'crowz 3', 'crowz 4', 'crowz 5']);
  // Friends and Foes as printed: the fan wiki adds the Horde zombie to the counts, except Red on #253.
  assert.deepEqual(counts('friendsAndFoes-253'), ['taintedAbomination 1', 'taintedWalker 1', 'taintedWalker 5', 'taintedWalker 2']);
  assert.deepEqual(counts('friendsAndFoes-264'), ['taintedWalker 1', 'taintedWalker 3', 'taintedWalker 5', 'taintedWalker 3']);
  const tainted = fantasyCard('friendsAndFoes-260');
  assert.equal(tainted.kind === 'levels' && tainted.horde, true);
  assert.equal(fantasyCard('friendsAndFoes-266').kind, 'enterHorde');
  assert.deepEqual(counts('zombieBosses-098'), [null, 'abominotaur 1', 'abominotaur 1', 'abominotaur 1']);
  assert.deepEqual(counts('hordeBox-293'), [null, 'fattyBurster 1', 'fattyBurster 1', 'fattyBurster 1']);
  // Chromatiz is an Abomination (the fan wiki lists it as a Necromancer).
  assert.deepEqual(counts('hordeBox-348'), [null, 'chromatiz 1', 'chromatiz 1', 'chromatiz 1']);
  const necromancerOf = (id: string) => {
    const card = fantasyCard(id);
    return card.kind === 'necromancer' ? card.zombie : card.kind;
  };
  assert.deepEqual(['hordeBox-335', 'hordeBox-340', 'hordeBox-341', 'hordeBox-346'].map(necromancerOf), [
    'countTemeraire',
    'countTemeraire',
    'queenSevera',
    'queenSevera',
  ]);
});

test('No Rest for the Wicked, the Special Guests and the Rat King follow the printed numbers: #117-#166, #221-#252, #267-#284, #351-#360', () => {
  const numbers = (setId: string) => FANTASY_SETS.find((set) => set.id === setId)?.cards.map((card) => Number(card.id.slice(-3)));
  const range = (first: number, last: number) => Array.from({ length: last - first + 1 }, (_, i) => first + i);
  assert.deepEqual(numbers('noRestForTheWicked'), range(221, 252));
  assert.deepEqual(numbers('specialGuests'), [...range(117, 166), ...range(267, 284)]);
  assert.deepEqual(numbers('ratKingSwampTroll'), range(351, 360));
});

test('No Rest for the Wicked, the Special Guests and the Rat King match the printed cards', () => {
  const counts = (id: string) => levelsOf(id).map((level) => level && `${level.zombie} ${level.count}`);
  assert.deepEqual(counts('noRestForTheWicked-228'), [null, 'necromanticDragon 1', 'necromanticDragon 1', 'necromanticDragon 1']);
  // Spectral Walkers, Blue to Yellow to Orange to Red, checked card by card.
  assert.deepEqual(counts('noRestForTheWicked-229'), ['spectralWalker 1', 'spectralWalker 1', 'spectralWalker 5', 'spectralWalker 2']);
  assert.deepEqual(counts('noRestForTheWicked-237'), ['spectralWalker 1', 'spectralWalker 2', 'spectralWalker 2', 'spectralWalker 8']);
  assert.deepEqual(counts('noRestForTheWicked-240'), ['spectralWalker 1', 'spectralWalker 3', 'spectralWalker 5', 'spectralWalker 3']);
  assert.deepEqual(counts('noRestForTheWicked-252'), ['ratz 2', 'ratz 3', 'ratz 4', 'ratz 5']);
  assert.deepEqual(counts('specialGuests-117'), [null, 'abominalpha 1', 'abominalpha 1', 'abominalpha 1']);
  assert.deepEqual(counts('specialGuests-124'), [null, 'abominarat 1', 'abominarat 1', 'abominarat 1']);
  // The Rat King spawns Swarms of Ratz under his picture (the fan wiki has the Rat King on every level).
  const ratKing = fantasyCard('ratKingSwampTroll-356');
  assert.equal(ratKing.kind === 'levels' && ratKing.boss, 'ratKing');
  assert.deepEqual(counts('ratKingSwampTroll-351'), ['ratz 1', 'ratz 2', 'ratz 4', 'ratz 6']);
  assert.deepEqual(counts('ratKingSwampTroll-360'), [null, 'swampTroll 1', 'swampTroll 1', 'swampTroll 1']);
  const necromancerOf = (id: string) => {
    const card = fantasyCard(id);
    return card.kind === 'necromancer' ? card.zombie : card.kind;
  };
  assert.deepEqual(
    ['125', '134', '140', '148', '149', '160', '162', '268', '274', '284'].map((n) => necromancerOf(`specialGuests-${n}`)),
    ['toMeKuPa', 'blackheart', 'ostokar', 'evilTroy', 'queenMedea', 'grin', 'erikSummoner', 'innsmouth', 'faolan', 'lordOfSkulls'],
  );
});

test('the fantasy cards keep the corrections checked on the printed cards', () => {
  // #017 and #029: Runners at Red, where the fan wiki has Walkers.
  for (const id of ['blackPlague-017', 'blackPlague-029']) {
    assert.deepEqual(levelsOf(id)[3], { zombie: 'fantasyRunner', count: 6 });
  }
  // #034 is the twin of #022, the fan wiki swaps its zombie types.
  assert.deepEqual(levelsOf('blackPlague-034'), levelsOf('blackPlague-022'));
  assert.deepEqual(levelsOf('blackPlague-034'), [
    { zombie: 'fantasyFatty', count: 1 },
    { zombie: 'fantasyWalker', count: 2 },
    { zombie: 'fantasyFatty', count: 2 },
    { zombie: 'fantasyWalker', count: 7 },
  ]);
  // Green Horde counts as printed, the Horde zombie apart (the fan wiki adds it), #171 at Yellow included.
  assert.deepEqual(levelsOf('greenHorde-167'), [null, { zombie: 'orcRunner', count: 4 }, { zombie: 'orcWalker', count: 5 }, { zombie: 'orcFatty', count: 2 }]);
  assert.deepEqual(levelsOf('greenHorde-171')[1], { zombie: 'orcFatty', count: 1 });
});

test('every Green Horde and Friends and Foes spawn card carries the Horde symbol, no other card does', () => {
  for (const set of FANTASY_SETS) {
    for (const card of set.cards.filter((each) => each.kind === 'levels')) {
      assert.equal(card.kind === 'levels' && !!card.horde, set.id === 'greenHorde' || set.id === 'friendsAndFoes', card.id);
    }
  }
});

test('Double Spawn, Enter the Horde and SPAM change the Spawn step, the other cards do not', () => {
  assert.equal(cardEffect('blackPlague-047'), 'double');
  assert.equal(cardEffect('greenHorde-213'), 'endStep');
  assert.equal(cardEffect('python-213'), 'drawAgain');
  assert.equal(cardEffect('blackPlague-041'), 'spawn');
  assert.equal(cardEffect('core2e-001'), 'spawn');
});

test('the fantasy universe plays Black Plague, Green Horde or both, never neither', () => {
  const fantasy = UNIVERSES.fantasy;
  assert.equal(selectCards(fantasy.sets, ['blackPlague', 'greenHorde']).length, 108);
  assert.deepEqual(withCoreBox(fantasy, [], 'blackPlague'), ['greenHorde']);
  assert.deepEqual(withCoreBox(fantasy, [], 'greenHorde'), ['blackPlague']);
  assert.deepEqual(withCoreBox(fantasy, ['greenHorde']), ['greenHorde']);
  assert.deepEqual(withCoreBox(UNIVERSES.modern, []), ['core2e']);
});

test('Modern core boxes alternate, preserve expansions and restore old preferences', () => {
  const modern = UNIVERSES.modern;
  assert.deepEqual(modern.optionalSets.filter((set) => set.core).map((set) => set.id), ['core2e', 'fortHendrix']);
  assert.deepEqual(withCoreBox(modern, ['toxic']), ['toxic', 'core2e']);
  assert.deepEqual(withCoreBox(modern, ['fortHendrix', 'toxic']), ['toxic', 'fortHendrix']);
  assert.deepEqual(withCoreBox(modern, ['core2e', 'fortHendrix'], 'fortHendrix'), ['fortHendrix']);
  assert.deepEqual(withCoreBox(modern, ['core2e', 'fortHendrix'], 'core2e'), ['core2e']);
  assert.deepEqual(withCoreBox(modern, ['toxic'], 'core2e'), ['toxic', 'fortHendrix']);
  assert.deepEqual(withCoreBox(modern, ['toxic'], 'fortHendrix'), ['toxic', 'core2e']);
  assert.deepEqual(activeSetIds(modern.sets, withCoreBox(modern, ['fortHendrix'])), ['fortHendrix', 'abomination']);
  assert.deepEqual(activeSetIds(modern.sets, withCoreBox(modern, ['core2e'])), ['core2e', 'abomination']);
});

test('select all and deselect all keep the core box in use', () => {
  const modern = UNIVERSES.modern;
  const expansionIds = modern.optionalSets.filter((set) => !set.core).map((set) => set.id);
  assert.deepEqual(noExpansions(modern, ['fortHendrix', 'toxic']), ['fortHendrix']);
  assert.deepEqual(noExpansions(modern, ['toxic']), ['core2e']);
  assert.deepEqual(allExpansions(modern, ['fortHendrix']), [...expansionIds, 'fortHendrix']);
  const fantasy = UNIVERSES.fantasy;
  assert.deepEqual(allExpansions(fantasy, []), FANTASY_SETS.map((set) => set.id));
  assert.deepEqual(noExpansions(fantasy, ['greenHorde']), ['greenHorde']);
  assert.deepEqual(noExpansions(fantasy, ['blackPlague', 'greenHorde']), ['blackPlague']);
  assert.deepEqual(switchableSets(modern).length, modern.optionalSets.length - 2);
  assert.deepEqual(switchableSets(fantasy).map((set) => set.id), FANTASY_SETS.map((set) => set.id));
});

test('a save holds only cards of its own universe', () => {
  const fantasy = newGame(UNIVERSES.fantasy.sets, ['blackPlague'], ALL_PARTS, () => 0, 1, 'fantasy');
  assert.ok(isValidSave(fantasy, cardIdsOf));
  assert.equal(isValidSave({ ...fantasy, universe: 'modern' }, cardIdsOf), false);
});

test('card ids are unique across every universe', () => {
  const ids = Object.values(UNIVERSES).flatMap((universe) => universe.sets.flatMap((set) => set.cards.map((card) => card.id)));
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(CARDS_BY_ID.size, ids.length);
});

// The fantasy deck sets its bosses apart as White Death and Dead Men Tales build it: see src/data/threat.ts.
const fantasyDeck = (setIds: string[], threat: Threat = DEFAULT_THREAT) =>
  tailorFantasyDeck(selectCards(FANTASY_SETS, setIds), threat, new Set(setIds));
const bossCount = (cards: readonly ZombieCard[]) => {
  const counts: Record<string, number> = {};
  for (const card of cards) {
    const zombie =
      card.kind === 'necromancer' ? card.zombie : card.kind === 'levels' && card.title === 'named' ? card.levels[1]?.zombie : undefined;
    if (zombie) counts[zombie] = (counts[zombie] ?? 0) + 1;
  }
  return counts;
};

test('the fantasy deck keeps the core Abominations and Necromancers, the named bosses go to their decks', () => {
  const setIds = ['blackPlague', 'greenHorde', 'wulfsburg', 'zombieBosses', 'friendsAndFoes', 'hordeBox'];
  const all = selectCards(FANTASY_SETS, setIds);
  const deck = fantasyDeck(setIds, { bossRule: 'fest', off: ['abominabunny', 'queenSevera'] });
  assert.deepEqual(bossCount(deck.cards), { necromancer: 6, orcNecromancer: 6, fattyBurster: 6 });
  assert.equal(deck.bosses?.rule, 'fest');
  assert.deepEqual(deck.bosses?.necromancer, ['necromancer', 'orcNecromancer', 'countTemeraire']);
  assert.deepEqual(deck.bosses?.abomination, [
    'fantasyAbomination', 'orcAbomination', 'taintedAbomination', 'wolfbomination',
    'ablobination', 'abominatroll', 'abominotaur', 'gorgomination', 'hordeBrother', 'siegeBreaker', 'swampLurker',
    'magentaCovefe', 'vaultWarden', 'werezombie', 'chromatiz', 'feralDragon', 'zombieGiant',
  ]);
  // Every other card stays: only the named bosses leave the Zombie deck, Fatty Bursters stay.
  assert.equal(deck.cards.length, all.length - 2 - 12 - 54 + 6 - 12);
});

test('the new bosses join their decks: the Necromantic Dragon with the Abominations, the Rat King with the Necromancers', () => {
  const setIds = ['blackPlague', 'noRestForTheWicked', 'specialGuests', 'ratKingSwampTroll'];
  const deck = fantasyDeck(setIds);
  assert.deepEqual(deck.bosses?.abomination, ['fantasyAbomination', 'abominalpha', 'abominarat', 'swampTroll', 'necromanticDragon']);
  assert.equal(deck.bosses?.necromancer.length, 12);
  assert.equal(deck.bosses?.necromancer.at(-1), 'ratKing');
  assert.deepEqual(bossCount(deck.cards), { necromancer: 6 });
  assert.equal(deck.cards.filter((card) => card.kind === 'levels' && card.boss === 'ratKing').length, 0);
});

test('White Death has its 56 cards, #429-#484, as printed', () => {
  const cards = FANTASY_SETS.find((set) => set.id === 'whiteDeath')?.cards ?? [];
  assert.deepEqual(cards.map((card) => Number(card.id.slice(-3))), Array.from({ length: 56 }, (_, i) => 429 + i));
  const counts = (id: string) => levelsOf(id).map((level) => level && `${level.zombie} ${level.count}`);
  // Blue to Red; the cards print them Red first, beside one picture of the zombie type.
  assert.deepEqual(counts('whiteDeath-429'), ['wdWalker 2', 'wdWalker 4', 'wdWalker 6', 'wdWalker 8']);
  assert.deepEqual(counts('whiteDeath-448'), ['wdWalker 4', 'wdWalker 6', 'wdWalker 8', 'wdWalker 10']);
  assert.deepEqual(counts('whiteDeath-435'), ['wdBrute 2', 'wdBrute 2', 'wdBrute 6', 'wdBrute 8']);
  assert.deepEqual(counts('whiteDeath-452'), ['wdBrute 4', 'wdBrute 4', 'wdBrute 6', 'wdBrute 8']);
  assert.deepEqual(counts('whiteDeath-442'), ['wdRunner 2', 'wdRunner 2', 'wdRunner 6', 'wdRunner 8']);
  assert.deepEqual(counts('whiteDeath-453'), ['wdRunner 4', 'wdRunner 4', 'wdRunner 6', 'wdRunner 8']);
  const kind = (id: string) => {
    const card = fantasyCard(id);
    return card.kind === 'bossCall' ? `${card.kind} ${card.boss}` : card.kind === 'activation' ? `${card.kind} ${card.zombie}` : card.kind;
  };
  assert.deepEqual(['457', '462', '463', '471', '472', '480', '481', '482', '483', '484'].map((n) => kind(`whiteDeath-${n}`)), [
    'bossCall abomination', 'bossCall abomination', 'bossCall necromancer', 'bossCall necromancer', 'zombieSiege', 'zombieSiege',
    'activation wdWalker', 'activation wdWalker', 'activation wdBrute', 'activation wdRunner',
  ]);
});

test('White Death draws its bosses from decks starting with the Khan Abomination and the Defiler Necromancer', () => {
  for (const danger of DANGER_LEVELS) {
    assert.equal(fantasyBossTrigger('whiteDeath-457', danger), 'abomination');
    assert.equal(fantasyBossTrigger('whiteDeath-463', danger), 'necromancer');
    assert.equal(fantasyBossTrigger('whiteDeath-429', danger), undefined);
    assert.equal(fantasyBossTrigger('whiteDeath-472', danger), undefined);
  }
  const alone = fantasyDeck(['whiteDeath']);
  assert.equal(alone.cards.length, 56);
  assert.deepEqual(alone.bosses?.abomination, ['khanAbomination']);
  assert.deepEqual(alone.bosses?.necromancer, ['defilerNecromancer']);
  const mixed = fantasyDeck(['blackPlague', 'whiteDeath', 'zombieBosses'], { bossRule: 'oneAtATime', off: ['abominotaur'] });
  assert.equal(mixed.cards.length, 54 + 56);
  assert.deepEqual(mixed.bosses?.abomination, ['fantasyAbomination', 'khanAbomination', 'ablobination', 'abominatroll']);
  assert.deepEqual(mixed.bosses?.necromancer, ['necromancer', 'defilerNecromancer']);
});

test('Eternal Empire has its 56 cards, #485-#540, its Brutes adding a Warden Brute', () => {
  const cards = FANTASY_SETS.find((set) => set.id === 'eternalEmpire')?.cards ?? [];
  assert.deepEqual(cards.map((card) => Number(card.id.slice(-3))), Array.from({ length: 56 }, (_, i) => 485 + i));
  const counts = (id: string) => levelsOf(id).map((level) => level && `${level.zombie} ${level.count}`);
  assert.deepEqual(counts('eternalEmpire-485'), ['eeWalker 2', 'eeWalker 4', 'eeWalker 6', 'eeWalker 8']);
  assert.deepEqual(counts('eternalEmpire-504'), ['eeWalker 4', 'eeWalker 6', 'eeWalker 8', 'eeWalker 10']);
  assert.deepEqual(counts('eternalEmpire-494'), ['eeBrute 2', 'eeBrute 2', 'eeBrute 6', 'eeBrute 8']);
  assert.deepEqual(counts('eternalEmpire-508'), ['eeBrute 4', 'eeBrute 4', 'eeBrute 6', 'eeBrute 8']);
  assert.deepEqual(counts('eternalEmpire-495'), ['eeRunner 2', 'eeRunner 2', 'eeRunner 6', 'eeRunner 8']);
  assert.deepEqual(counts('eternalEmpire-512'), ['eeRunner 4', 'eeRunner 4', 'eeRunner 6', 'eeRunner 8']);
  const adds = (id: string) => {
    const card = fantasyCard(id);
    return card.kind === 'levels' ? card.adds : undefined;
  };
  assert.deepEqual(['491', '508', '485', '509'].map((n) => adds(`eternalEmpire-${n}`)), ['wardenBrute', 'wardenBrute', undefined, undefined]);
  const abomination = fantasyCard('eternalEmpire-513');
  assert.equal(abomination.kind === 'bossCall' && abomination.boss === 'abomination' && abomination.chi, true);
  const necromancer = fantasyCard('eternalEmpire-527');
  assert.equal(necromancer.kind === 'bossCall' && necromancer.boss === 'necromancer' && !necromancer.chi, true);
  assert.equal(fantasyCard('eternalEmpire-536').kind, 'zombieSiege');
  const deck = fantasyDeck(['eternalEmpire']);
  assert.deepEqual(deck.bosses?.abomination, ['godEaterAbomination']);
  // No Necromancer of its own: its Necromancer cards call on the ones of the other boxes.
  assert.deepEqual(deck.bosses?.necromancer, []);
});

test('Frozen Fortress adds sixteen Abominations and six Necromancers to the boss decks, and no spawn card', () => {
  const deck = fantasyDeck(['whiteDeath', 'frozenFortress'], { bossRule: 'oneAtATime', off: ['yeti', 'tengu'] });
  assert.equal(deck.cards.length, 56);
  assert.equal(deck.bosses?.abomination.length, 1 + 15);
  assert.deepEqual(deck.bosses?.necromancer, ['defilerNecromancer', 'bomoh', 'deathNotes', 'hannya', 'kaguya', 'yukiOnna']);
});

// Warlords of the Middle Kingdom (Abomination card Dong Zhuo, Necromancer card Zhang Jiao) and of the Rising Sun (three
// identical Fūma Kotarō Necromancer cards): boss cards only, no spawn card (components listed on the Zombicide wiki).
test('the Warlords boxes add their boss cards to the boss decks, three copies of Fūma Kotarō, and no spawn card', () => {
  const sets = ['whiteDeath', 'warlordsMiddleKingdom', 'warlordsRisingSun'];
  const deck = fantasyDeck(sets);
  assert.equal(deck.cards.length, fantasyDeck(['whiteDeath']).cards.length);
  assert.deepEqual(deck.bosses?.abomination, ['khanAbomination', 'dongZhuo']);
  assert.deepEqual(deck.bosses?.necromancer, ['defilerNecromancer', 'zhangJiao', 'fumaKotaro', 'fumaKotaro', 'fumaKotaro']);
  assert.deepEqual(fantasyDeck(['whiteDeath']).bosses?.necromancer, ['defilerNecromancer']);
  // One switch per boss: turning Fūma Kotarō off removes his three cards.
  const off = fantasyDeck(sets, { bossRule: 'oneAtATime', off: ['fumaKotaro', 'dongZhuo'] });
  assert.deepEqual(off.bosses?.necromancer, ['defilerNecromancer', 'zhangJiao']);
  assert.deepEqual(off.bosses?.abomination, ['khanAbomination']);
});

test('every boss but the two generic Necromancers and those whose cards print no rule has a rule, translated in every language', async () => {
  const { TRANSLATIONS } = await import('../i18n/translations.ts');
  const texts = TRANSLATIONS as Record<string, Record<string, string>>;
  const params = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
  assert.equal(new Set(BOSS_RULE_IDS).size, BOSS_RULE_IDS.length, 'duplicate in BOSS_RULE_IDS');
  // The Abominations of the Kickstarter packs print a picture and no rule: nothing to show for them.
  assert.deepEqual(
    [...BOSS_IDS].filter((id) => !(BOSS_RULE_IDS as readonly string[]).includes(id)).sort(),
    ['necromancer', 'orcNecromancer', ...BOSSES_WITHOUT_RULE].sort(),
  );
  for (const id of BOSS_RULE_IDS) {
    const key = `card.${id}Rule`;
    assert.ok(texts.en[key]?.trim(), `en: ${key}`);
    for (const [language, language_texts] of Object.entries(texts)) {
      assert.ok(language_texts[key]?.trim(), `${language}: ${key}`);
      assert.deepEqual(params(language_texts[key]), params(texts.en[key]), `${language}: ${key} parameters`);
    }
  }
});

test('a new game deals the tailored deck', () => {
  const setIds = ['blackPlague', 'hordeBox', 'frozenFortress'];
  const game = newGame(FANTASY_SETS, setIds, ALL_PARTS, () => 0, 1, 'fantasy', (cards) =>
    tailorFantasyDeck(cards, DEFAULT_THREAT, new Set(setIds)),
  );
  assert.equal(game.piles.draw.length, fantasyDeck(setIds).cards.length);
  // Frozen Fortress prints no spawn card, yet its bosses are in the boss decks.
  assert.ok(game.piles.bosses?.abomination.draw.includes('yeti'));
});

test('stored boss choices are checked, every boss in and one at a time by default', () => {
  assert.deepEqual(parseThreat(null), DEFAULT_THREAT);
  assert.deepEqual(parseThreat('not json'), DEFAULT_THREAT);
  assert.deepEqual(parseThreat('{"bossRule":"party","off":["queenSevera",3]}'), { bossRule: 'oneAtATime', off: ['queenSevera'] });
  assert.deepEqual(parseThreat('{"bossRule":"fest","off":[]}'), { bossRule: 'fest', off: [] });
  // Choices saved under the classic rules, gone since: only what still applies is kept.
  assert.deepEqual(parseThreat('{"mode":"classic","level":"hard","bossRule":"fest","off":["grin"]}'), { bossRule: 'fest', off: ['grin'] });
});

// Boss decks (Dead Men Tales rules): a card calling on a deck reveals its top boss.
const bossGame = () =>
  newGame(sets, ['a'], ALL_PARTS, () => 0, 1, 'modern', (cards) => ({
    cards,
    bosses: { rule: 'oneAtATime', abomination: ['x', 'y'], necromancer: ['n'] },
  }));
/** In the test sets, card a1 spawns an Abomination at every level and a2 is a Necromancer. */
const bossTrigger = (cardId: string): BossKind | undefined =>
  cardId === 'a1' ? 'abomination' : cardId === 'a2' ? 'necromancer' : undefined;
const dealAll = (state: GameState) => drawCards(state, undefined, () => 0, bossTrigger);

test('a card that calls on a boss deck reveals its top boss, and its boss goes to that deck\'s discard after the step', () => {
  let state = bossGame();
  assert.equal(state.bossRule, 'oneAtATime');
  const firstAbomination = state.piles.bosses?.abomination.draw[0];
  while (!state.piles.drawn.includes('a1')) state = dealAll(state);
  assert.deepEqual(state.piles.bosses?.revealed.a1, { kind: 'abomination', boss: firstAbomination });
  assert.equal(state.piles.bosses?.abomination.draw.length, 1);
  const next = dealAll(state);
  assert.equal(next.piles.bosses?.revealed.a1, undefined);
  assert.deepEqual(next.piles.bosses?.abomination.discard, [firstAbomination]);
});

test('a boss deck reshuffles its discard when empty, and undo brings the revealed bosses back', () => {
  let state = bossGame();
  const seen: string[] = [];
  for (let i = 0; i < 12; i++) {
    state = dealAll(state);
    const shown = state.piles.bosses?.revealed.a1;
    if (shown) seen.push(shown.boss);
  }
  assert.ok(seen.length >= 3, 'the abomination deck ran out and came back');
  assert.ok(seen.every((boss) => boss === 'x' || boss === 'y'));
  const before = state;
  assert.deepEqual(undo(dealAll(before)).piles, before.piles);
});

test('reshuffling everything puts every boss back in its deck', () => {
  let state = bossGame();
  for (let i = 0; i < 3; i++) state = dealAll(state);
  const bosses = reshuffleAll(state, () => 0).piles.bosses;
  assert.deepEqual([...(bosses?.abomination.draw ?? [])].sort(), ['x', 'y']);
  assert.deepEqual(bosses?.necromancer.draw, ['n']);
  assert.deepEqual(bosses?.revealed, {});
  assert.deepEqual(bosses?.abomination.discard, []);
});

test('a game without boss decks reveals nothing, and saves with broken boss decks are rejected', () => {
  const plain = dealAll(newGame(sets, ['a']));
  assert.equal(plain.piles.bosses, null);
  const state = dealAll(bossGame());
  const known = () => new Set(['a1', 'a2', 'a3']);
  assert.ok(isValidSave(JSON.parse(JSON.stringify(state)), known));
  assert.equal(isValidSave({ ...state, bossRule: 'party' }, known), false);
  const broken = { ...state, piles: { ...state.piles, bosses: { ...state.piles.bosses, revealed: { a1: { kind: 'dragon', boss: 'x' } } } } };
  assert.equal(isValidSave(broken, known), false);
});

/** A boss game where a1 and a3 spawn an Abomination at Blue only, and a2 is a Necromancer. */
const dangerTrigger = (cardId: string, danger: string): BossKind | undefined =>
  cardId === 'a2' ? 'necromancer' : (cardId === 'a1' || cardId === 'a3') && danger === 'blue' ? 'abomination' : undefined;
const oneBossGame = () =>
  newGame(sets, ['a'], ALL_PARTS, () => 0, 3, 'modern', (cards) => ({
    cards,
    bosses: { rule: 'oneAtATime', abomination: ['x'], necromancer: ['n'] },
  }));

test('a card calling on an empty boss deck still says the bosses on the board get an Extra Activation', () => {
  const state = drawCards(oneBossGame(), undefined, () => 0, dangerTrigger);
  const revealed = state.piles.bosses?.revealed ?? {};
  assert.deepEqual([revealed.a1?.boss, revealed.a3?.boss].sort(), [NO_BOSS, 'x']);
  // The empty reveal is not a card: the next step puts only x back in its deck.
  const next = drawCards(state, undefined, () => 0, dangerTrigger);
  assert.ok(next.piles.bosses?.abomination.draw.concat(next.piles.bosses.abomination.discard).every((boss) => boss === 'x'));
});

test('a card calling on a boss deck that never held a boss says so, not that the bosses are on the board', () => {
  const game = newGame(sets, ['a'], ALL_PARTS, () => 0, 3, 'modern', (cards) => ({
    cards,
    bosses: { rule: 'oneAtATime', abomination: ['x'], necromancer: [] },
  }));
  const state = drawCards(game, undefined, () => 0, dangerTrigger);
  assert.equal(state.piles.bosses?.revealed.a2?.boss, NO_DECK);
  // An exhausted deck is another thing: its bosses are on display.
  assert.equal(drawCards(oneBossGame(), undefined, () => 0, dangerTrigger).piles.bosses?.revealed.a2?.boss, 'n');
  assert.ok(isValidSave(JSON.parse(JSON.stringify(state)), () => new Set(['a1', 'a2', 'a3']), new Set(['x'])));
});

test('changing the Danger Level gives back the bosses no card calls on and reveals the new ones', () => {
  const blue = drawCards(oneBossGame(), undefined, () => 0, dangerTrigger);
  const red = setDanger(blue, 'red', dangerTrigger, () => 0);
  assert.deepEqual(Object.keys(red.piles.bosses?.revealed ?? {}), ['a2']);
  assert.deepEqual(red.piles.bosses?.abomination.discard, ['x']);
  const back = setDanger(red, 'blue', dangerTrigger, () => 0);
  assert.deepEqual(Object.keys(back.piles.bosses?.revealed ?? {}).sort(), ['a1', 'a2', 'a3']);
  // Without boss decks, only the level changes.
  assert.equal(setDanger(newGame(sets, ['a']), 'red', dangerTrigger).danger, 'red');
});

test('a save keeps its boss decks and its rule together, with known bosses only', () => {
  const state = drawCards(oneBossGame(), undefined, () => 0, dangerTrigger);
  const known = () => new Set(['a1', 'a2', 'a3']);
  const bosses = new Set(['x', 'n']);
  assert.ok(isValidSave(JSON.parse(JSON.stringify(state)), known, bosses));
  assert.equal(isValidSave({ ...state, bossRule: null }, known, bosses), false);
  assert.equal(isValidSave({ ...newGame(sets, ['a']), bossRule: 'fest' }, known, bosses), false);
  assert.equal(isValidSave(state, known, new Set(['n'])), false);
});


// Kickstarter packs and Special Guest boxes: transcribed from sheets of 12 printed cards, Red first on the
// cards and Blue first here. Every total below is the count of cards printed on those sheets.
const NEW_SETS: readonly (readonly [string, number])[] = [
  ['massiveDarkness2', 28],
  ['thundercats', 4],
  ['compagniaDellaForca', 12],
  ['ironMaiden', 32],
  ['comicBookExtras2', 14],
  ['timecrash', 6],
  ['berserkerWalkers', 12],
  ['climbersTerrorcotta', 18],
  ['crossfirePack', 6],
  ['bebopRocksteady', 6],
  ['divineBeasts', 1],
];
const setCards = (setId: string) => FANTASY_SETS.find((set) => set.id === setId)?.cards ?? [];
const printedNumbers = (setId: string) => setCards(setId).map((card) => Number(card.id.slice(-3)));
const rangeOf = (first: number, last: number) => Array.from({ length: last - first + 1 }, (_, i) => first + i);

test('the Kickstarter packs have the cards printed on their sheets, numbered without gaps', () => {
  for (const [setId, total] of NEW_SETS) {
    assert.equal(setCards(setId).length, total, setId);
    assert.ok(UNIVERSES.fantasy.optionalSets.some((set) => set.id === setId && !set.core), setId);
  }
  assert.deepEqual(printedNumbers('massiveDarkness2'), rangeOf(361, 388));
  assert.deepEqual(printedNumbers('thundercats'), rangeOf(367, 370));
  assert.deepEqual(printedNumbers('compagniaDellaForca'), rangeOf(371, 382));
  assert.deepEqual(printedNumbers('comicBookExtras2'), rangeOf(403, 416));
  assert.deepEqual(printedNumbers('timecrash'), rangeOf(541, 546));
  assert.deepEqual(printedNumbers('berserkerWalkers'), rangeOf(547, 558));
  assert.deepEqual(printedNumbers('climbersTerrorcotta'), rangeOf(559, 576));
  assert.deepEqual(printedNumbers('crossfirePack'), rangeOf(577, 582));
  assert.deepEqual(printedNumbers('bebopRocksteady'), rangeOf(583, 588));
  // The Divine Beasts card is printed without a number: its id is divineBeasts-card.
  assert.deepEqual(setCards('divineBeasts').map((card) => card.id), ['divineBeasts-card']);
  // Iron Maiden: the 32 official Fantasy Eddies, #371-#402.
  assert.deepEqual(printedNumbers('ironMaiden'), rangeOf(371, 402));
});

test('the spawn cards of the packs match the printed counts, Blue to Red', () => {
  const counts = (id: string) => levelsOf(id).map((level) => level && `${level.zombie} ${level.count}`);
  assert.deepEqual(counts('berserkerWalkers-547'), ['fantasyBerserkerWalker 2', 'fantasyBerserkerWalker 4', 'fantasyBerserkerWalker 6', 'fantasyBerserkerWalker 8']);
  assert.deepEqual(counts('berserkerWalkers-558'), ['fantasyBerserkerWalker 4', 'fantasyBerserkerWalker 6', 'fantasyBerserkerWalker 8', 'fantasyBerserkerWalker 10']);
  assert.deepEqual(counts('crossfirePack-579'), ['deadboltWalker 2', 'deadboltWalker 4', 'deadboltWalker 6', 'deadboltWalker 8']);
  assert.deepEqual(counts('crossfirePack-580'), ['deadboltWalker 4', 'deadboltWalker 6', 'deadboltWalker 8', 'deadboltWalker 10']);
  assert.deepEqual(counts('climbersTerrorcotta-559'), Array(4).fill('terrorcottaWalker 5'));
  assert.deepEqual(counts('climbersTerrorcotta-564'), Array(4).fill('terrorcottaWalker 5'));
  assert.deepEqual(counts('climbersTerrorcotta-565'), ['climber 2', 'climber 4', 'climber 6', 'climber 8']);
  assert.deepEqual(counts('climbersTerrorcotta-576'), ['climber 4', 'climber 6', 'climber 8', 'climber 10']);
  assert.deepEqual(counts('timecrash-546'), ['footNinja 1', 'footNinja 2', 'footNinja 3', 'footNinja 4']);
  // The footers printed under the levels.
  const note = (id: string) => {
    const card = fantasyCard(id);
    return card.kind === 'levels' ? card.note : undefined;
  };
  assert.deepEqual([note('climbersTerrorcotta-562'), note('climbersTerrorcotta-565'), note('timecrash-541')], ['terrorcottaNote', undefined, 'footNinjasNote']);
});

test('bosses printed as one picture spawn at Blue only where the card prints no "Nothing in sight!"', () => {
  const counts = (id: string) => levelsOf(id).map((level) => level && `${level.zombie} ${level.count}`);
  assert.deepEqual(counts('massiveDarkness2-361'), [null, 'reaper 1', 'reaper 1', 'reaper 1']);
  assert.deepEqual(counts('massiveDarkness2-388'), [null, 'cerberus 1', 'cerberus 1', 'cerberus 1']);
  for (const id of ['583', '585', '586', '588']) assert.equal(levelsOf(`bebopRocksteady-${id}`)[0]?.count, 1, id);
  assert.deepEqual(counts('divineBeasts-card'), [null, 'divineBeast 1', 'divineBeast 1', 'divineBeast 1']);
  // Divine Beasts print their plural name as title and in the boxes, "Nothing" at Blue: no "!" and no singular.
  const beasts = fantasyCard('divineBeasts-card');
  assert.equal(beasts.kind === 'levels' && beasts.title === 'zombies' && beasts.plural, true);
  assert.deepEqual(counts('comicBookExtras2-413'), [null, 'marike 1', 'marike 1', 'marike 1']);
  assert.deepEqual(counts('ironMaiden-377'), [null, 'pharaohEddie 1', 'pharaohEddie 1', 'pharaohEddie 1']);
  assert.deepEqual(counts('ironMaiden-399'), [null, 'fearEddie 1', 'fearEddie 1', 'fearEddie 1']);
});

test('the Necromancers of the packs sit where their sheets print them', () => {
  const necromancerOf = (id: string) => {
    const card = fantasyCard(id);
    return card.kind === 'necromancer' ? card.zombie : card.kind;
  };
  assert.deepEqual(
    ['comicBookExtras2-403', 'comicBookExtras2-408', 'compagniaDellaForca-371', 'compagniaDellaForca-376', 'compagniaDellaForca-377', 'compagniaDellaForca-382',
      'thundercats-367', 'thundercats-370',
      'ironMaiden-371', 'ironMaiden-376', 'ironMaiden-385', 'ironMaiden-390'].map(necromancerOf),
    ['erinn', 'erinn', 'grandVizier', 'grandVizier', 'theSparrow', 'theSparrow', 'mummRa', 'mummRa',
      'reaperEddie', 'reaperEddie', 'shamanEddie', 'shamanEddie'],
  );
  assert.equal(setCards('ironMaiden').filter((card) => card.kind === 'necromancer').length, 12);
});

test('the bosses of the packs join their decks, the Divine Beasts and the spawned zombies stay in the Zombie deck', () => {
  const setIds = ['blackPlague', ...NEW_SETS.map(([id]) => id)];
  const deck = fantasyDeck(setIds);
  const bosses = [...(deck.bosses?.abomination ?? []), ...(deck.bosses?.necromancer ?? [])];
  for (const boss of BOSSES_WITHOUT_RULE) assert.ok(bosses.includes(boss), boss);
  for (const boss of ['mummRa', 'grandVizier', 'theSparrow', 'erinn', 'reaperEddie', 'shamanEddie']) {
    assert.ok(deck.bosses?.necromancer.includes(boss), boss);
  }
  assert.equal(deck.bosses?.abomination.length, 1 + BOSSES_WITHOUT_RULE.length);
  assert.equal(deck.bosses?.necromancer.length, 1 + 6);
  // Only Black Plague's 54 cards, the spawn cards (12 Berserker + 18 Climbers and Terrorcotta + 6 Crossfire + 6 Foot Ninjas) and the Divine Beasts card stay.
  assert.equal(deck.cards.length, 54 + 12 + 18 + 6 + 6 + 1);
  assert.ok(deck.cards.some((card) => card.id === 'divineBeasts-card'));
  assert.equal(fantasyBossTrigger('divineBeasts-card', 'red'), undefined);
  // The Iron Maiden Eddies are Abominations like the other named bosses.
  assert.equal(fantasyBossTrigger('ironMaiden-377', 'yellow'), 'abomination');
  assert.equal(fantasyBossTrigger('ironMaiden-377', 'blue'), undefined);
  assert.equal(fantasyBossTrigger('ironMaiden-399', 'red'), 'abomination');
  assert.equal(fantasyBossTrigger('ironMaiden-371', 'red'), 'necromancer');
  assert.equal(fantasyBossTrigger('ironMaiden-385', 'blue'), 'necromancer');
});
