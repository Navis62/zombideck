import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

import { modernTextSize, wrappedLines } from '../components/modern-text.ts';
import { variantFor } from '../data/card-number.ts';
import { CARD_SETS, OPTIONAL_SETS } from '../data/decks.ts';
import { BOSS_RULE_IDS, BOSSES_WITHOUT_RULE, FANTASY_SETS } from '../data/fantasy.ts';
import { WESTERN_SETS } from '../data/western.ts';
import { en } from '../i18n/en.ts';
import { type Boss, DEFAULT_THREAT, FANTASY_BOSS_IDS, MODERN_ABOMINATIONS, MODERN_BOSS_IDS, parseThreat, WESTERN_ABOMINATIONS, WESTERN_BOSS_IDS, WESTERN_BOSS_RULES, presentSetIds, tailorFantasyDeck, tailorModernDeck, tailorWesternDeck, type Threat } from '../data/threat.ts';
import { allExpansions, tailorDeck, bossCopiesOf, bossIdsOf, bossTrigger as fantasyBossTrigger, CARDS_BY_ID, cardEffect, cardIdsOf, isTrejoCard, noExpansions, switchableSets, UNIVERSES, withCoreBox } from '../data/universes.ts';
import {
  activeSetIds,
  ALL_PARTS,
  cardPart,
  DANGER_LEVELS,
  drawCards,
  drawNextCard,
  gameKey,
  isValidSave,
  MAX_UNDO,
  MAX_ZONES,
  newGame,
  removeTrejo,
  reshuffleAll,
  selectCards,
  setDanger,
  setZones,
  shuffleDeck,
  type SpawnEffect,
  startsNewStep,
  pendingZones,
  undo,
  UNIVERSE_IDS,
  upgradeSave,
  zonesOf,
  type BossPower,
  type BossPowers,
  type BossTrigger,
  chooseGained,
  drawAbomination,
  groupCards,
  liveBosses,
  newGroups,
  pendingChoice,
  powersOf,
  removeFromBoard,
} from './engine.ts';
import type { BossKind, BossPiles, BossRule, CardSet, GameState, Piles, Revealed, ZombieCard } from './types.ts';
import { isInvaderCard, isWesternCard, NO_BOSS, NO_DECK } from './types.ts';

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
  const upgraded = upgradeSave(v1) as GameState;
  // Closed beta: the upgrade steps stop at version 4 and the game, now at version 5, rejects the result.
  assert.equal(isValidSave(upgraded, () => new Set(['a1', 'a2', 'a3'])), false);
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
  assert.deepEqual(upgraded, { ...game, version: 4 });
});

test('a save from version 3 comes back without boss decks, its game untouched', () => {
  const game = drawCard(drawCard(newGame(sets, ['a'])));
  const v3 = { ...withoutBosses(game), version: 3 };
  const upgraded = upgradeSave(JSON.parse(JSON.stringify(v3)));
  assert.deepEqual(upgraded, { ...game, version: 4 });
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

test('an Invader save is valid and refuses a card of another universe', () => {
  const invader = newGame(UNIVERSES.invader.sets, ['invader'], ALL_PARTS, () => 0, 1, 'invader');
  assert.equal(invader.universe, 'invader');
  assert.ok(isValidSave(JSON.parse(JSON.stringify(invader)), cardIdsOf));
  const modernId = CARD_SETS[0].cards[0].id;
  assert.equal(isValidSave({ ...invader, piles: { ...invader.piles, draw: [modernId] } }, cardIdsOf), false);
  assert.equal(isValidSave({ ...invader, universe: 'modern', piles: { ...invader.piles, draw: [modernId] } }, cardIdsOf), true);
});

test('the Invader and Dark Side boxes combine, with no boss deck', () => {
  const invader = UNIVERSES.invader;
  assert.deepEqual(invader.sets.filter((set) => set.core).map((set) => set.id), ['invader', 'darkSide']);
  assert.ok(invader.sets.filter((set) => !set.core).every((set) => set.optional));
  assert.equal(invader.exclusiveCores, false);
  assert.equal(invader.bosses, null);
  assert.deepEqual(invader.defaultExpansions, ['invader']);
  assert.ok(UNIVERSE_IDS.includes('invader'));
});

test('an Invader Extra Activation card is its own part of the deck', () => {
  const [set] = UNIVERSES.invader.sets;
  const extra: ZombieCard = { id: 'invader-051', setId: 'invader', kind: 'xenoExtra', zombie: 'worker' };
  const spawn: ZombieCard = { id: 'invader-001', setId: 'invader', kind: 'xeno', zombie: 'worker', counts: [2, 4, 6, 8] };
  const hardSpawn: ZombieCard = { ...spawn, id: 'invader-026' };
  assert.equal(cardPart(set, extra), 'extra');
  assert.equal(cardPart(set, spawn), 'easy');
  assert.equal(cardPart(set, hardSpawn), 'hard');
  assert.equal(cardPart(UNIVERSES.invader.sets[1], { ...spawn, id: 'darkSide-086', setId: 'darkSide' }), 'hard');
  assert.equal(cardPart(UNIVERSES.invader.sets[1], { ...spawn, id: 'darkSide-061', setId: 'darkSide' }), 'easy');
});

test('each Invader box has 54 cards: 25 easy, 25 hard and 4 Extra Activation, numbered without gaps', () => {
  // Source: Invader rulebook p.37 and Dark Side rulebook p.37 (25 easy / 25 hard / 4 extra per box).
  const firstNumber = { invader: 1, darkSide: 61 };
  for (const set of UNIVERSES.invader.sets.filter((set) => set.core)) {
    assert.equal(set.cards.length, 54, set.id);
    const parts = { easy: 0, hard: 0, extra: 0 };
    for (const card of set.cards) parts[cardPart(set, card)] += 1;
    assert.deepEqual(parts, { easy: 25, hard: 25, extra: 4 }, set.id);
    const first = firstNumber[set.id as keyof typeof firstNumber];
    const expected = Array.from({ length: 54 }, (_, i) => `${set.id}-${String(first + i).padStart(3, '0')}`);
    assert.deepEqual(set.cards.map((card) => card.id).sort(), expected, set.id);
    assert.ok(set.cards.every((card) => card.setId === set.id));
  }
});

test('the Invader and Dark Side boxes hold the same kinds of cards (Atomic Asteroidz card images, 2026-11-16)', () => {
  const [invader, darkSide] = UNIVERSES.invader.sets;
  const count = (set: typeof invader, test: (card: ZombieCard) => boolean) => set.cards.filter(test).length;
  const workers = (card: ZombieCard) => card.kind === 'xeno' && card.zombie.endsWith('orker');
  const tanks = (card: ZombieCard) => card.kind === 'xeno' && card.zombie.endsWith('ank');
  const hunters = (card: ZombieCard) => card.kind === 'xeno' && card.zombie.endsWith('unter');
  for (const set of [invader, darkSide]) {
    assert.equal(count(set, workers), 12, set.id);
    assert.equal(count(set, tanks), 8, set.id);
    assert.equal(count(set, hunters), 10, set.id);
    assert.equal(count(set, (card) => card.kind === 'xenoAbomination'), 12, set.id);
    assert.equal(count(set, (card) => card.kind === 'zoneSpawn'), 8, set.id);
    assert.equal(count(set, (card) => card.kind === 'xenoExtra'), 4, set.id);
  }
  assert.ok(invader.cards.every((card) => card.kind !== 'zoneSpawn' || card.zone === 'mold'));
  assert.ok(darkSide.cards.every((card) => card.kind !== 'zoneSpawn' || card.zone === 'pit'));
});

test('Invader counts are listed Blue, Yellow, Orange, Red (the printed card lists Red first)', () => {
  const byId = (id: string) => CARDS_BY_ID.get(id);
  const countsOf = (id: string) => {
    const card = byId(id);
    assert.equal(card?.kind, 'xeno');
    return card?.kind === 'xeno' ? card.counts : [];
  };
  assert.deepEqual(byId('invader-001'), { id: 'invader-001', setId: 'invader', kind: 'xeno', zombie: 'worker', counts: [2, 4, 6, 8] });
  assert.deepEqual(countsOf('invader-026'), [4, 6, 8, 10]);
  assert.deepEqual(countsOf('invader-007'), [2, 2, 6, 8]);
  assert.deepEqual(countsOf('invader-032'), [4, 4, 6, 8]);
  assert.deepEqual(countsOf('darkSide-096'), [4, 4, 6, 8]);
  assert.deepEqual(byId('darkSide-083'), { id: 'darkSide-083', setId: 'darkSide', kind: 'zoneSpawn', zone: 'pit', zombie: 'drillerWorker', count: 2 });
  assert.deepEqual(byId('invader-053'), { id: 'invader-053', setId: 'invader', kind: 'xenoExtra', zombie: 'tank' });
});

// Source: the owner's transcription of 2026-11-17 from the Atomic Asteroidz card images (printed numbers from the file
// names); [set, first number, last number, easy, hard]. No rulebook sorts these cards: the split is the owner's choice
// of 2026-11-17 (see src/data/invader.ts): higher-count Xenos (Driller Blitzer 2/2/4/6, Biters) are hard, 2/4/6/8
// Xenos and Mold Spawn are easy, each named Abomination is half easy (lower numbers) and half hard.
const INVADER_EXPANSIONS: readonly (readonly [string, number, number, number, number])[] = [
  ['blackOps', 55, 60, 3, 3],
  ['darkSideExtras', 115, 120, 3, 3],
  ['civilianExtras', 121, 173, 38, 15],
  ['soldierExtras', 174, 183, 5, 5],
  ['promoXenos', 184, 212, 26, 3],
  ['projectElite', 213, 230, 6, 12],
  ['comicBook1', 231, 236, 3, 3],
  ['comicBook2', 135, 146, 6, 6],
  ['comicBook2Android', 129, 134, 3, 3],
  ['ironMaiden1', 121, 128, 4, 4],
  ['ironMaiden2', 121, 128, 4, 4],
];

test('the Invader expansions hold the printed cards, numbered without gaps, and sort easy / hard as the owner chose', () => {
  const sets = UNIVERSES.invader.sets;
  assert.deepEqual(sets.filter((set) => !set.core).map((set) => set.id), INVADER_EXPANSIONS.map(([id]) => id));
  for (const [id, first, last, easy, hard] of INVADER_EXPANSIONS) {
    const set = sets.find((candidate) => candidate.id === id);
    assert.ok(set?.optional && !set.core && !set.replaces, id);
    const parts = { easy: 0, hard: 0, extra: 0 };
    for (const card of set.cards) parts[cardPart(set, card)] += 1;
    assert.deepEqual(parts, { easy, hard, extra: 0 }, id);
    const expected = Array.from({ length: last - first + 1 }, (_, i) => `${id}-${String(first + i).padStart(3, '0')}`);
    assert.deepEqual(set.cards.map((card) => card.id).sort(), expected, id);
    assert.ok(set.cards.every((card) => card.setId === id), id);
  }
  // 6 + 6 + 53 + 10 + 29 + 18 + 6 + 12 + 6 + 8 + 8 cards over the eleven expansions.
  assert.equal(sets.filter((set) => !set.core).reduce((total, set) => total + set.cards.length, 0), 162);
});

test('each Invader expansion holds the cards of its box (Atomic Asteroidz card images, 2026-11-17)', () => {
  const cards = (id: string) => UNIVERSES.invader.sets.find((set) => set.id === id)?.cards ?? [];
  const tally = (id: string) => {
    const result: Record<string, number> = {};
    for (const card of cards(id)) {
      assert.ok(isInvaderCard(card), card.id);
      const key = card.kind === 'zoneSpawn' ? `${card.zombie} mold×${card.count}` : card.zombie;
      result[key] = (result[key] ?? 0) + 1;
    }
    return result;
  };
  assert.deepEqual(tally('blackOps'), { juggernaut: 6 });
  assert.deepEqual(tally('darkSideExtras'), { drillerBlitzer: 6 });
  assert.deepEqual(tally('civilianExtras'), {
    babyface: 4, buddyBot: 4, irisSentryGun: 4, motherInLaw: 4, shadow: 4, stomper: 6, widowmaker: 4,
    flinger: 6, seekerWorker: 9, 'seekerWorker mold×1': 2, xenomoth: 6,
  });
  assert.deepEqual(tally('soldierExtras'), { broodMother: 6, xeniumHorror: 4 });
  assert.deepEqual(tally('promoXenos'), { drillerBlitzer: 6, flinger: 6, seekerWorker: 9, 'seekerWorker mold×1': 2, xenomoth: 6 });
  assert.deepEqual(tally('projectElite'), { biter: 6, thraex: 6, gutslug: 6 });
  assert.deepEqual(tally('comicBook1'), { stepmother: 6 });
  assert.deepEqual(tally('comicBook2'), { shaila: 6, dimbutcher: 6 });
  assert.deepEqual(tally('comicBook2Android'), { synkrasis: 6 });
  // Iron Maiden Packs 1 and 2: photos of the printed cards (CMON unboxing video, 2026-11-17), both numbered 121-128.
  assert.deepEqual(tally('ironMaiden1'), { cyborgEddieAbomination: 4, samuraiEddieAbomination: 4 });
  assert.deepEqual(tally('ironMaiden2'), { bassistEddieAbomination: 4, bountyHunterEddieAbomination: 4 });
  // The Promo Xenos repeat the Dark Side Extras and Civilian Extras Xenos with numbers of their own.
  const shape = (card: ZombieCard) =>
    isInvaderCard(card) ? (card.kind === 'xeno' ? [card.zombie, ...card.counts] : [card.kind, card.zombie]) : [];
  const promo = cards('promoXenos').map(shape).sort();
  const twin = [...cards('darkSideExtras'), ...cards('civilianExtras').filter((card) => card.kind !== 'xenoAbomination')].map(shape).sort();
  assert.deepEqual(promo, twin);
});

test('the Invader expansions pin which cards are easy and which are hard (owner choice, 2026-11-17)', () => {
  const partOf = (id: string) => {
    const card = CARDS_BY_ID.get(id);
    const set = UNIVERSES.invader.sets.find((candidate) => candidate.id === card?.setId);
    assert.ok(card && set, id);
    return cardPart(set, card);
  };
  for (const id of ['civilianExtras-121', 'civilianExtras-122', 'civilianExtras-151', 'civilianExtras-166', 'ironMaiden1-121', 'ironMaiden1-122', 'ironMaiden1-125', 'ironMaiden1-126', 'ironMaiden2-122', 'projectElite-219', 'blackOps-057']) {
    assert.equal(partOf(id), 'easy', id);
  }
  for (const id of ['civilianExtras-123', 'civilianExtras-124', 'promoXenos-187', 'projectElite-213', 'projectElite-224', 'ironMaiden1-123', 'ironMaiden1-124', 'ironMaiden1-127', 'ironMaiden1-128', 'ironMaiden2-123', 'blackOps-058']) {
    assert.equal(partOf(id), 'hard', id);
  }
});

test('Invader expansion counts are listed Blue, Yellow, Orange, Red, and only the Stepmother has a third step', () => {
  const byId = (id: string) => CARDS_BY_ID.get(id);
  assert.deepEqual(byId('darkSideExtras-115'), { id: 'darkSideExtras-115', setId: 'darkSideExtras', kind: 'xeno', zombie: 'drillerBlitzer', counts: [1, 2, 3, 4] });
  assert.deepEqual(byId('darkSideExtras-118'), { id: 'darkSideExtras-118', setId: 'darkSideExtras', kind: 'xeno', zombie: 'drillerBlitzer', counts: [2, 2, 4, 6] });
  assert.deepEqual(byId('promoXenos-187'), { id: 'promoXenos-187', setId: 'promoXenos', kind: 'xeno', zombie: 'drillerBlitzer', counts: [2, 2, 4, 6] });
  assert.deepEqual(byId('projectElite-213'), { id: 'projectElite-213', setId: 'projectElite', kind: 'xeno', zombie: 'biter', counts: [4, 6, 8, 10] });
  assert.deepEqual(byId('civilianExtras-166'), { id: 'civilianExtras-166', setId: 'civilianExtras', kind: 'zoneSpawn', zone: 'mold', zombie: 'seekerWorker', count: 1 });
  assert.deepEqual(byId('comicBook1-231'), { id: 'comicBook1-231', setId: 'comicBook1', kind: 'xenoAbomination', zombie: 'stepmother', spawnZone: true });
  const thirdStep = UNIVERSES.invader.sets.flatMap((set) => set.cards).filter((card) => card.kind === 'xenoAbomination' && card.spawnZone);
  assert.deepEqual([...new Set(thirdStep.map((card) => (isInvaderCard(card) ? card.zombie : '')))], ['stepmother']);
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
    'magentaCovfefe', 'vaultWarden', 'werezombie', 'chromatiz', 'feralDragon', 'zombieGiant',
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
    [...FANTASY_BOSS_IDS].filter((id) => !(BOSS_RULE_IDS as readonly string[]).includes(id)).sort(),
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

test('every translation key uses the same {placeholders} in every language as in French', async () => {
  const { TRANSLATIONS } = await import('../i18n/translations.ts');
  const texts = TRANSLATIONS as Record<string, Record<string, string>>;
  const params = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
  // The spawn-zone cards fill {count} and {zombies} at draw time: a language that drops or renames one shows it raw.
  for (const key of ['card.moldSpawnTitle', 'card.moldSpawnRule', 'card.pitSpawnTitle', 'card.pitSpawnRule']) {
    assert.ok(texts.fr[key]?.trim(), `fr: ${key}`);
  }
  for (const key of Object.keys(texts.fr)) {
    for (const [language, language_texts] of Object.entries(texts)) {
      assert.deepEqual(params(language_texts[key] ?? ''), params(texts.fr[key]), `${language}: ${key} placeholders`);
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

test('a Western game never plays the Abomination Fest, even from a saved choice', () => {
  // The Western rulebooks have no Abomination Fest, and its options screen offers no choice.
  assert.deepEqual(parseThreat('{"bossRule":"fest","off":[]}', WESTERN_BOSS_RULES), { bossRule: 'oneAtATime', off: [] });
  const cards = WESTERN_SETS.flatMap((set) => set.cards);
  const deck = tailorWesternDeck(cards, { bossRule: 'fest', off: [] }, new Set(['undeadOrAlive']));
  assert.equal(deck.bosses?.rule, 'oneAtATime');
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

test('a card that calls on a boss deck reveals its top boss, and its boss goes on the board after the step', () => {
  let state = bossGame();
  assert.equal(state.bossRule, 'oneAtATime');
  const firstAbomination = state.piles.bosses?.abomination.draw[0];
  while (!state.piles.drawn.includes('a1')) state = dealAll(state);
  assert.deepEqual(state.piles.bosses?.revealed.a1, { kind: 'abomination', boss: firstAbomination });
  assert.equal(state.piles.bosses?.abomination.draw.length, 1);
  const next = dealAll(state);
  assert.equal(next.piles.bosses?.revealed.a1, undefined);
  assert.deepEqual(next.piles.bosses?.onBoard.filter((boss) => boss.kind === 'abomination'), [{ kind: 'abomination', boss: firstAbomination }]);
  assert.deepEqual(next.piles.bosses?.abomination.discard, []);
});

test('a boss deck reshuffles its discard when empty, and undo brings the revealed bosses back', () => {
  let state = bossGame();
  const seen: string[] = [];
  for (let i = 0; i < 12; i++) {
    state = dealAll(state);
    const shown = state.piles.bosses?.revealed.a1;
    if (shown) seen.push(shown.boss);
    // The players remove what is on the board, so the discard comes back when the deck is empty.
    for (const { boss } of state.piles.bosses?.onBoard ?? []) state = removeFromBoard(state, { from: 'board', boss });
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
  assert.ok(isValidSave(JSON.parse(JSON.stringify(state)), () => new Set(['a1', 'a2', 'a3']), () => new Set(['x'])));
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
  const bosses = () => new Set(['x', 'n']);
  assert.ok(isValidSave(JSON.parse(JSON.stringify(state)), known, bosses));
  assert.equal(isValidSave({ ...state, bossRule: null }, known, bosses), false);
  assert.equal(isValidSave({ ...newGame(sets, ['a']), bossRule: 'fest' }, known, bosses), false);
  assert.equal(isValidSave(state, known, () => new Set(['n'])), false);
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

const BEASTS_IN_ORDER = ['vermillionBird', 'whiteTiger', 'blackTortoise', 'azureDragon'];
/** The Abominations the packs of `NEW_SETS` add to the Abomination deck: Massive Darkness 2, Comic Book Extras Vol. 2, Bebop & Rocksteady, Iron Maiden. */
const PACK_ABOMINATIONS = [
  'reaper', 'baalberith', 'horseman', 'queenCaenedra', 'hugBear', 'banshee', 'cerberus',
  'lordJanas', 'marike', 'bebop', 'rocksteady',
  'pharaohEddie', 'samuraiEddie', 'mummyEddie', 'wickerManEddie', 'fearEddie',
];

test('the bosses of the packs join their decks, the spawned zombies stay in the Zombie deck and the Divine Beasts card goes to the Abomination deck', () => {
  const setIds = ['blackPlague', ...NEW_SETS.map(([id]) => id)];
  const deck = fantasyDeck(setIds);
  const bosses = [...(deck.bosses?.abomination ?? []), ...(deck.bosses?.necromancer ?? [])];
  // The four Divine Beasts are revealed by their card, they are in no deck.
  for (const boss of PACK_ABOMINATIONS) assert.ok(bosses.includes(boss), boss);
  // Timecrash's Shredder is a Necromancer boss; Doom and Gloom (Lord of Skulls' escort) have no card and join no deck.
  for (const boss of ['mummRa', 'grandVizier', 'theSparrow', 'erinn', 'reaperEddie', 'shamanEddie', 'shredder']) {
    assert.ok(deck.bosses?.necromancer.includes(boss), boss);
  }
  // Black Plague's Abomination, the 16 pack Abominations and the Divine Beasts card.
  assert.equal(deck.bosses?.abomination.length, 1 + PACK_ABOMINATIONS.length + 1);
  // Black Plague's Necromancer, the six Necromancers of the packs and Shredder.
  assert.equal(deck.bosses?.necromancer.length, 1 + 6 + 1);
  for (const boss of ['doom', 'gloom']) {
    assert.ok(!bosses.includes(boss), boss);
  }
  // Only Black Plague's 54 cards and the spawn cards (12 Berserker + 18 Climbers and Terrorcotta + 6 Crossfire + 6 Foot Ninjas) stay.
  assert.equal(deck.cards.length, 54 + 12 + 18 + 6 + 6);
  // The Divine Beasts card is the pack's White Death Abomination card: it is dealt from the Abomination deck, once.
  assert.ok(!deck.cards.some((card) => card.id === 'divineBeasts-card'));
  assert.equal(deck.bosses?.abomination.filter((boss) => boss === 'divineBeast').length, 1);
  for (const beast of ['vermillionBird', 'whiteTiger', 'blackTortoise', 'azureDragon']) {
    assert.ok(!deck.bosses?.abomination.includes(beast), beast);
    assert.ok(!deck.bosses?.necromancer.includes(beast), beast);
  }
  // The Iron Maiden Eddies are Abominations like the other named bosses.
  assert.equal(fantasyBossTrigger('ironMaiden-377', 'yellow'), 'abomination');
  assert.equal(fantasyBossTrigger('ironMaiden-377', 'blue'), undefined);
  assert.equal(fantasyBossTrigger('ironMaiden-399', 'red'), 'abomination');
  assert.equal(fantasyBossTrigger('ironMaiden-371', 'red'), 'necromancer');
  assert.equal(fantasyBossTrigger('ironMaiden-385', 'blue'), 'necromancer');
});

test('each universe saves its game under its own key, apart from the old shared one', () => {
  const keys = UNIVERSE_IDS.map(gameKey);
  assert.equal(new Set(keys).size, UNIVERSE_IDS.length);
  for (const key of keys) {
    assert.ok(key.startsWith('zombideck.game.'));
    assert.notEqual(key, 'zombideck.game');
  }
});

// Modern Abomination deck (2nd edition rulebook p.17): the generic Abomination cards call on named ones.
const modernSetIds = ['core2e', 'abomination'];
const modernDeck = (setIds: string[], abominations: readonly Boss<string>[], threat: Threat = DEFAULT_THREAT) =>
  tailorModernDeck(selectCards(CARD_SETS, setIds), threat, new Set(setIds), abominations);
const TEST_ABOMINATIONS: Boss<string>[] = [
  { zombie: 'testA', setId: 'core2e' },
  { zombie: 'testB', setId: 'core2e' },
  { zombie: 'testC', setId: 'toxic' },
];

test('the modern deck has no boss deck while no named Abomination is selected, and keeps every card', () => {
  // Abominations of a box that is not in play (toxic) leave the deck without bosses, as an empty list does.
  const elsewhere: Boss<string>[] = [{ zombie: 'testC', setId: 'toxic' }];
  const deck = modernDeck(modernSetIds, elsewhere);
  assert.equal(deck.bosses, undefined);
  assert.equal(deck.cards.length, selectCards(CARD_SETS, modernSetIds).length);
  const game = newGame(CARD_SETS, modernSetIds, ALL_PARTS, () => 0, 1, 'modern', (cards) => tailorModernDeck(cards, DEFAULT_THREAT, new Set(modernSetIds), elsewhere));
  assert.equal(game.bossRule, null);
  assert.equal(game.piles.bosses, null);
  // The guard holds for an empty list whatever the sets in play, and the era has no Necromancers.
  assert.equal(modernDeck(modernSetIds, []).bosses, undefined);
  assert.equal(UNIVERSES.modern.bosses?.necromancers.length, 0);
});

test('the modern Abomination deck holds the named Abominations of the boxes in play, the Necromancer deck stays empty', () => {
  const deck = modernDeck(['core2e', 'abomination'], TEST_ABOMINATIONS);
  assert.deepEqual(deck.bosses?.abomination, ['testA', 'testB']);
  assert.deepEqual(deck.bosses?.necromancer, []);
  assert.equal(deck.cards.length, selectCards(CARD_SETS, ['core2e', 'abomination']).length, 'no card leaves the Zombie deck');
  assert.deepEqual(modernDeck(['core2e', 'toxic'], TEST_ABOMINATIONS).bosses?.abomination, ['testA', 'testB', 'testC']);
  assert.deepEqual(modernDeck(['core2e'], TEST_ABOMINATIONS, { bossRule: 'fest', off: ['testA'] }).bosses, {
    rule: 'fest',
    abomination: ['testB'],
    necromancer: [],
  });
  // Every Abomination switched off: back to the printed deck.
  assert.equal(modernDeck(['core2e'], TEST_ABOMINATIONS, { bossRule: 'oneAtATime', off: ['testA', 'testB'] }).bosses, undefined);
});

test('the Abominations of the core box stay when Fort Hendrix replaces it', () => {
  const setIds = activeSetIds(CARD_SETS, ['fortHendrix']);
  assert.ok(!setIds.includes('core2e'));
  assert.deepEqual(modernDeck(setIds, TEST_ABOMINATIONS).bosses?.abomination, ['testA', 'testB']);
});

test('a modern card spawning an Abomination calls on its deck from the first Danger Level it spawns at', () => {
  // core2e-017 is 0/1/1/1, core2e-035 is 1/1/1/1.
  assert.equal(fantasyBossTrigger('core2e-017', 'blue'), undefined);
  assert.equal(fantasyBossTrigger('core2e-017', 'yellow'), 'abomination');
  assert.equal(fantasyBossTrigger('core2e-035', 'blue'), 'abomination');
  assert.equal(fantasyBossTrigger('fortHendrix-057', 'blue'), undefined);
  assert.equal(fantasyBossTrigger('fortHendrix-075', 'blue'), 'abomination');
  // Other modern cards call on nothing.
  assert.equal(fantasyBossTrigger('core2e-001', 'red'), undefined);
});

test('a modern game reveals an Abomination at Yellow for a 0/1/1/1 card and at Blue for a 1/1/1/1 card', () => {
  const ids = ['core2e-017', 'core2e-035'];
  const game = (card: string) => {
    const start = newGame(CARD_SETS, ['core2e'], ALL_PARTS, () => 0, 1, 'modern', (cards) => ({
      cards: cards.filter((c) => c.id === card),
      bosses: { rule: 'oneAtATime', abomination: ['testA'], necromancer: [] },
    }));
    return drawCards(start, cardEffect, () => 0, fantasyBossTrigger);
  };
  const slow = game(ids[0]);
  assert.deepEqual(slow.piles.bosses?.revealed, {});
  const yellow = setDanger(slow, 'yellow', fantasyBossTrigger, () => 0);
  assert.deepEqual(yellow.piles.bosses?.revealed[ids[0]], { kind: 'abomination', boss: 'testA' });
  assert.deepEqual(game(ids[1]).piles.bosses?.revealed[ids[1]], { kind: 'abomination', boss: 'testA' });
});

test('saves keep their boss decks to the bosses of their own universe', () => {
  const modernSave = (bosses: Piles['bosses'], bossRule: GameState['bossRule']) => {
    const game = newGame(CARD_SETS, ['core2e'], ALL_PARTS, () => 0, 1, 'modern');
    return JSON.parse(JSON.stringify({ ...game, bossRule, piles: { ...game.piles, bosses } }));
  };
  // An old modern game (no boss decks) reloads.
  const old = newGame(CARD_SETS, ['core2e'], ALL_PARTS, () => 0, 1, 'modern');
  assert.ok(isValidSave(JSON.parse(JSON.stringify(old)), cardIdsOf, bossIdsOf));
  const deck = (boss: string) => ({ draw: [boss], discard: [] });
  const withBoss = (boss: string) => modernSave({ abomination: deck(boss), necromancer: { draw: [], discard: [] }, revealed: {}, manual: [], onBoard: [] }, 'oneAtATime');
  assert.equal(isValidSave(withBoss('abominalpha'), cardIdsOf, bossIdsOf), false, 'a Fantasy boss in a modern save');
  assert.equal(isValidSave(withBoss('abominalpha'), cardIdsOf), true, 'any boss when no list is given');
  // The same boss deck is valid in a Fantasy save.
  const fantasy = newGame(FANTASY_SETS, ['blackPlague'], ALL_PARTS, () => 0, 1, 'fantasy', (cards) => tailorFantasyDeck(cards, DEFAULT_THREAT, new Set(['blackPlague'])));
  assert.ok(isValidSave(JSON.parse(JSON.stringify(fantasy)), cardIdsOf, bossIdsOf));
  assert.ok(isValidSave(JSON.parse(JSON.stringify(fantasy)), cardIdsOf, bossIdsOf, bossCopiesOf));
});

test('a Fantasy game with every box on and some bosses revealed passes the copies check', () => {
  const everything = FANTASY_SETS.filter((set) => set.optional || set.core).map((set) => set.id);
  const start = newGame(FANTASY_SETS, everything, ALL_PARTS, () => 0, 1, 'fantasy', (cards) => tailorFantasyDeck(cards, DEFAULT_THREAT, new Set(everything)));
  const played = drawCards(start, cardEffect, () => 0, fantasyBossTrigger);
  assert.ok(isValidSave(JSON.parse(JSON.stringify(played)), cardIdsOf, bossIdsOf, bossCopiesOf));
});

test('the sets in play include the ones they replace, for the menu and the deck alike', () => {
  assert.deepEqual([...presentSetIds(CARD_SETS, ['fortHendrix', 'toxic'])].sort(), ['core2e', 'fortHendrix', 'toxic']);
  assert.deepEqual([...presentSetIds(CARD_SETS, ['core2e'])], ['core2e']);
  assert.deepEqual([...presentSetIds(CARD_SETS, [])], []);
  assert.deepEqual([...presentSetIds(FANTASY_SETS, ['blackPlague', 'greenHorde'])], ['blackPlague', 'greenHorde']);
});

// The Abominations printed in The Boys box, as listed in MODERN_ABOMINATIONS (src/data/threat.ts).
const THE_BOYS_ABOMINATIONS = ['homelander', 'aTrain', 'blackNoir', 'queenMaeve', 'soldierBoy', 'theDeep', 'starlight', 'translucent'];

test('the Abominations of The Boys join the Abomination deck only with that box enabled, and can be excluded', () => {
  const withoutIds = activeSetIds(CARD_SETS, ['core2e']);
  const setIds = activeSetIds(CARD_SETS, ['core2e', 'theBoys']);
  const cards = selectCards(CARD_SETS, setIds);
  assert.equal(cards.length, 40, 'The Boys does not add Zombie cards');
  const tailor = (ids: string[], off: string[] = []) => tailorModernDeck(selectCards(CARD_SETS, ids), { ...DEFAULT_THREAT, off }, new Set(ids));
  const ofTheBoys = (deck: ReturnType<typeof tailor>) => (deck.bosses?.abomination ?? []).filter((boss) => THE_BOYS_ABOMINATIONS.includes(boss));
  assert.deepEqual(ofTheBoys(tailor(withoutIds)), []);
  assert.deepEqual(ofTheBoys(tailor(setIds)).sort(), [...THE_BOYS_ABOMINATIONS].sort());
  const excluded = ofTheBoys(tailor(setIds, ['queenMaeve']));
  assert.ok(!excluded.includes('queenMaeve'));
  assert.equal(excluded.length, THE_BOYS_ABOMINATIONS.length - 1);
  // With only Queen Maeve available she is the boss revealed, and excluding her leaves no boss deck.
  const maeve: Boss<string>[] = [{ zombie: 'queenMaeve', setId: 'theBoys' }];
  assert.equal(modernDeck(withoutIds, maeve).bosses, undefined);
  assert.deepEqual(modernDeck(setIds, maeve).bosses?.abomination, ['queenMaeve']);
  assert.equal(modernDeck(setIds, maeve, { ...DEFAULT_THREAT, off: ['queenMaeve'] }).bosses, undefined);
  const game = newGame(CARD_SETS, setIds, ALL_PARTS, () => 0, 1, 'modern', () => ({
    ...modernDeck(setIds, maeve), cards: cards.filter((card) => card.id === 'core2e-035'),
  }));
  const dealt = drawCards(game, cardEffect, () => 0, fantasyBossTrigger);
  assert.equal(dealt.piles.bosses?.revealed['core2e-035']?.boss, 'queenMaeve');
});

test('every modern Abomination has a name and a rule in every language, in a set of its universe', async () => {
  const { TRANSLATIONS } = await import('../i18n/translations.ts');
  const texts = TRANSLATIONS as Record<string, Record<string, string>>;
  const params = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
  const setIds = CARD_SETS.map((set) => set.id);
  const names = MODERN_ABOMINATIONS.map((boss) => boss.zombie);
  assert.equal(new Set(names).size, names.length, 'duplicate in MODERN_ABOMINATIONS');
  for (const boss of MODERN_ABOMINATIONS) {
    assert.ok(setIds.includes(boss.setId), `${boss.zombie}: unknown set ${boss.setId}`);
    for (const key of [`zombie.${boss.zombie}.one`, `zombie.${boss.zombie}.other`, `card.${boss.zombie}Rule`]) {
      assert.ok(texts.en[key]?.trim(), `en: ${key}`);
      for (const [language, language_texts] of Object.entries(texts)) {
        assert.ok(language_texts[key]?.trim(), `${language}: ${key}`);
        assert.deepEqual(params(language_texts[key]), params(texts.en[key]), `${language}: ${key} parameters`);
      }
    }
  }
  // The picture of each one is checked by the compiler: `ART` holds every `ArtSubject`, `NamedModernAbomination` included.
});

test('every bringsAlong target is itself a modern Abomination', () => {
  const ids = new Set(MODERN_ABOMINATIONS.map((boss) => boss.zombie));
  const brought = MODERN_ABOMINATIONS.flatMap((boss) => (boss.power?.kind === 'bringsAlong' ? [boss.power.boss] : []));
  assert.ok(brought.length > 0, 'no bringsAlong power left to check');
  for (const target of brought) assert.ok(ids.has(target), `unknown bringsAlong target ${target}`);
});

test('every absorb power keeps fewer cards than it draws', () => {
  const absorbs = MODERN_ABOMINATIONS.flatMap((boss) => (boss.power?.kind === 'absorb' ? [{ boss: boss.zombie, ...boss.power }] : []));
  assert.ok(absorbs.length > 0, 'no absorb power left to check');
  for (const { boss, draw, keep } of absorbs) assert.ok(keep >= 1 && keep < draw, `${boss}: keeps ${keep} of ${draw}`);
});

test('the modern deck holds exactly two SPAM cards, both cantrips', () => {
  const spams = MODERN_ABOMINATIONS.filter((boss) => boss.power?.kind === 'cantrip');
  assert.equal(spams.reduce((total, boss) => total + (boss.copies ?? 1), 0), 2);
  assert.equal(modernDeck(['core2e', 'python'], MODERN_ABOMINATIONS).bosses?.abomination.filter((boss) => boss === 'spam').length, 2);
});

test('every modern Abomination has an illustration', () => {
  // zombie-art.tsx pulls in React Native, so the test reads its source instead of importing it.
  const file = new URL('../components/zombie-art.tsx', import.meta.url);
  const source = readFileSync(file, 'utf8');
  const block = source.slice(source.indexOf('const MODERN_OFFICIAL'), source.indexOf('const FANTASY_ART'));
  // Both tables: the official cut-outs (`key: { source: require(...) }`) and the cartoon drawings (`key: require(...)`).
  const art = new Map([...block.matchAll(/^\s+(\w+): (?:\{ source: )?require\('([^']+)'\)/gm)].map((match) => [match[1], match[2]]));
  for (const boss of MODERN_ABOMINATIONS) {
    const path = art.get(boss.zombie);
    assert.ok(path, `${boss.zombie}: no MODERN_OFFICIAL or MODERN_ART entry`);
    assert.ok(existsSync(new URL(path, file)), `${boss.zombie}: missing file ${path}`);
  }
});

test('a modern game with Abominations reveals, undoes, reshuffles and follows the Danger Level', () => {
  const cardIds = ['core2e-017', 'core2e-035'];
  const abominations: Boss<string>[] = [
    { zombie: 'testA', setId: 'core2e' },
    { zombie: 'testB', setId: 'fortHendrix' },
  ];
  const setIds = ['core2e'];
  const start = newGame(CARD_SETS, setIds, ALL_PARTS, () => 0, 2, 'modern', (cards) => {
    const deck = tailorModernDeck(cards, DEFAULT_THREAT, new Set(setIds), abominations);
    return { ...deck, cards: deck.cards.filter((card) => cardIds.includes(card.id)) };
  });
  assert.equal(start.bossRule, 'oneAtATime');
  assert.deepEqual(start.piles.bosses?.abomination.draw, ['testA']);
  const dealt = drawCards(start, cardEffect, () => 0, fantasyBossTrigger);
  // At Blue only the 1/1/1/1 card calls on the deck; with a single boss, the deck is then empty.
  assert.deepEqual(dealt.piles.bosses?.revealed, { 'core2e-035': { kind: 'abomination', boss: 'testA' } });
  assert.deepEqual(dealt.piles.bosses?.abomination.draw, []);
  // The 0/1/1/1 card calls at Yellow: every boss is on display already, so it still says they get an Extra Activation.
  const yellow = setDanger(dealt, 'yellow', fantasyBossTrigger, () => 0);
  assert.deepEqual(Object.keys(yellow.piles.bosses?.revealed ?? {}).sort(), cardIds);
  assert.equal(yellow.piles.bosses?.revealed['core2e-017']?.boss, NO_BOSS);
  // Back to Blue, it gives its call back; undo restores the piles before the draw.
  const blue = setDanger(yellow, 'blue', fantasyBossTrigger, () => 0);
  assert.deepEqual(Object.keys(blue.piles.bosses?.revealed ?? {}), ['core2e-035']);
  assert.deepEqual(undo(dealt).piles, start.piles);
  const reshuffled = reshuffleAll(dealt, () => 0).piles.bosses;
  assert.deepEqual(reshuffled?.abomination.draw, ['testA']);
  assert.deepEqual(reshuffled?.revealed, {});
});

// Special powers of the modern Abominations, tested with made-up bosses: SPAM-like cantrips, a boss that brings
// another along (bwl brings robins), a boss that absorbs candidates (gozer: three drawn, two kept).
const POWERS: Record<string, BossPower> = {
  spam: { kind: 'cantrip' },
  spam2: { kind: 'cantrip' },
  bwl: { kind: 'bringsAlong', boss: 'robins' },
  gozer: { kind: 'absorb', draw: 3, keep: 2 },
  gozer2: { kind: 'absorb', draw: 2, keep: 1 },
  zuul: { kind: 'unblocks' },
  vamp: { kind: 'drawOnDeath' },
};
const powers: BossPowers = (boss) => POWERS[boss];
const bossesOf = (state: GameState): BossPiles => {
  assert.ok(state.piles.bosses);
  return state.piles.bosses;
};
const firstOnly: BossTrigger = (id) => (id === 'a1' ? 'abomination' : undefined);
const firstTwo: BossTrigger = (id) => (id === 'a1' || id === 'a2' ? 'abomination' : undefined);
/** A game whose Zombie deck is a1, a2, a3, a1 calling on the Abomination deck stacked as given. */
const powerGame = (draw: string[], discard: string[] = [], zones = 1, rule: BossRule = 'oneAtATime') => {
  const start = newGame(sets, ['a'], ALL_PARTS, () => 0, zones, 'modern', (cards) => ({
    cards,
    bosses: { rule, abomination: [], necromancer: [] },
  }));
  const bosses = bossesOf(start);
  return { ...start, piles: { ...start.piles, draw: ['a1', 'a2', 'a3'], bosses: { ...bosses, abomination: { draw, discard } } } };
};
const step = (state: GameState, trigger: BossTrigger = firstOnly) => drawCards(state, undefined, () => 0, trigger, powers);
const manualDraw = (state: GameState) => drawAbomination(state, () => 0, powers);
const shownGroups = (state: GameState) => {
  const bosses = bossesOf(state);
  return [...Object.values(bosses.revealed), ...bosses.manual];
};
/** Every boss card of the game, wherever it lies. */
const bossCardsOf = (state: GameState) => {
  const { abomination, necromancer } = bossesOf(state);
  return [...abomination.draw, ...abomination.discard, ...necromancer.draw, ...necromancer.discard, ...shownGroups(state).flatMap(groupCards), ...boardOf(state)].sort();
};
const discardOf = (state: GameState) => [...bossesOf(state).abomination.discard].sort();
const boardOf = (state: GameState) => bossesOf(state).onBoard.map((boss) => boss.boss);

test('a SPAM drawn for an Abomination is set aside and the next card is the boss', () => {
  const state = step(powerGame(['spam', 'x', 'y']));
  assert.deepEqual(bossesOf(state).revealed.a1, { kind: 'abomination', boss: 'x', spam: ['spam'] });
  assert.deepEqual(bossesOf(state).abomination.draw, ['y']);
  // The SPAM goes to the discard, the boss on the board.
  assert.deepEqual(discardOf(step(state)), ['spam']);
  assert.deepEqual(boardOf(step(state)), ['x']);
});

test('two SPAMs in a row are both set aside', () => {
  const state = step(powerGame(['spam', 'spam2', 'x']));
  assert.deepEqual(bossesOf(state).revealed.a1, { kind: 'abomination', boss: 'x', spam: ['spam', 'spam2'] });
});

test('a SPAM that empties the Abomination deck with none on display says the deck is empty, not that all are in play', () => {
  const state = step(powerGame(['spam']));
  assert.deepEqual(bossesOf(state).revealed.a1, { kind: 'abomination', boss: NO_DECK, spam: ['spam'] });
  assert.deepEqual(discardOf(step(state)), ['spam']);
});

test('a SPAM that empties the Abomination deck while another is on display gives an Extra Activation and still goes to the discard', () => {
  const state = step(powerGame(['x', 'spam'], [], 2, 'fest'), firstTwo);
  assert.deepEqual(bossesOf(state).revealed.a1, { kind: 'abomination', boss: 'x' });
  assert.deepEqual(bossesOf(state).revealed.a2, { kind: 'abomination', boss: NO_BOSS, spam: ['spam'], activated: ['x'] });
  assert.deepEqual(discardOf(step(state)), ['spam']);
  assert.deepEqual(boardOf(step(state)), ['x']);
});

test('a SPAM and a boss are not reshuffled back in while they are on display', () => {
  // The discard is reshuffled once the deck is empty, but only what is in it.
  const state = step(powerGame(['spam'], ['x', 'y']));
  assert.deepEqual(bossesOf(state).revealed.a1?.spam, ['spam']);
  assert.deepEqual([bossesOf(state).revealed.a1?.boss, ...bossesOf(state).abomination.draw].sort(), ['x', 'y']);
  assert.deepEqual(bossesOf(state).abomination.discard, []);
});

test('a boss that brings another along takes it from the deck, then from the discard', () => {
  const fromDeck = step(powerGame(['bwl', 'x', 'robins']));
  assert.deepEqual(bossesOf(fromDeck).revealed.a1, { kind: 'abomination', boss: 'bwl', along: ['robins'] });
  assert.deepEqual(bossesOf(fromDeck).abomination.draw, ['x']);
  const fromDiscard = step(powerGame(['bwl', 'x'], ['robins', 'z']));
  assert.deepEqual(bossesOf(fromDiscard).revealed.a1?.along, ['robins']);
  assert.deepEqual(bossesOf(fromDiscard).abomination.draw, ['x']);
  assert.deepEqual(bossesOf(fromDiscard).abomination.discard, ['z']);
  // The deck comes first, and only one card is taken.
  const both = step(powerGame(['bwl', 'robins'], ['robins']));
  assert.deepEqual(bossesOf(both).abomination.draw, []);
  assert.deepEqual(bossesOf(both).abomination.discard, ['robins']);
});

test('a boss that brings another along does nothing when it is on display or missing', () => {
  // On another card of the same step.
  const sameStep = step(powerGame(['robins', 'bwl', 'x', 'robins'], [], 2, 'fest'), firstTwo);
  assert.deepEqual(bossesOf(sameStep).revealed.a2, { kind: 'abomination', boss: 'bwl', activated: ['robins'] });
  assert.deepEqual(bossesOf(sameStep).abomination.draw, ['x', 'robins']);
  // In a group drawn by hand.
  const byHand = manualDraw(manualDraw(powerGame(['robins', 'bwl', 'robins'])));
  assert.deepEqual(byHand.piles.bosses?.manual[1], { kind: 'abomination', boss: NO_BOSS, activates: 'robins' });
  // Among the candidates of a boss that absorbs.
  const offered = manualDraw(step(powerGame(['gozer', 'robins', 'p', 'q', 'bwl', 'robins'], [], 1, 'fest')));
  assert.deepEqual(offered.piles.bosses?.manual[0], { kind: 'abomination', boss: 'bwl', activated: ['gozer'] });
  // Among what a boss absorbed.
  const gained = manualDraw(chooseGained(step(powerGame(['gozer', 'robins', 'p', 'q', 'bwl', 'robins'], [], 1, 'fest')), ['robins', 'p']));
  assert.deepEqual(gained.piles.bosses?.manual[0], { kind: 'abomination', boss: 'bwl', activated: ['gozer', 'robins', 'p'] });
  // Nowhere in the game.
  assert.deepEqual(step(powerGame(['bwl', 'x'])).piles.bosses?.revealed.a1, { kind: 'abomination', boss: 'bwl' });
});

test('the boss brought along leaves with the one that brought it', () => {
  const state = step(powerGame(['bwl', 'x', 'robins']));
  assert.deepEqual(boardOf(step(state)), ['bwl', 'robins']);
  assert.deepEqual(discardOf(step(state)), []);
});

test('a boss that absorbs offers its candidates and waits for the players to choose', () => {
  const state = step(powerGame(['gozer', 'p', 'q', 'r', 's']));
  assert.deepEqual(bossesOf(state).revealed.a1, { kind: 'abomination', boss: 'gozer', choice: { offered: ['p', 'q', 'r'], keep: 2 } });
  assert.deepEqual(pendingChoice(state), { boss: 'gozer', offered: ['p', 'q', 'r'], keep: 2 });
  assert.deepEqual(bossesOf(state).abomination.draw, ['s']);
  assert.equal(pendingChoice(step(powerGame(['x']))), undefined);
});

test('a SPAM among the candidates is set aside and another candidate is drawn; a boss that brings another along brings nothing there', () => {
  const state = step(powerGame(['gozer', 'spam', 'p', 'q', 'r']));
  assert.deepEqual(bossesOf(state).revealed.a1, { kind: 'abomination', boss: 'gozer', spam: ['spam'], choice: { offered: ['p', 'q', 'r'], keep: 2 } });
  const robins = step(powerGame(['gozer', 'bwl', 'p', 'q', 'robins']));
  assert.deepEqual(bossesOf(robins).revealed.a1?.choice?.offered, ['bwl', 'p', 'q']);
  assert.equal(bossesOf(robins).revealed.a1?.along, undefined);
  assert.deepEqual(bossesOf(robins).abomination.draw, ['robins']);
});

test('choosing keeps the picked candidates with the boss and discards the others', () => {
  const pending = step(powerGame(['gozer', 'p', 'q', 'r', 's']));
  const chosen = chooseGained(pending, ['p', 'r']);
  assert.deepEqual(bossesOf(chosen).revealed.a1, { kind: 'abomination', boss: 'gozer', gained: ['p', 'r'] });
  assert.deepEqual(bossesOf(chosen).abomination.discard, ['q']);
  assert.equal(pendingChoice(chosen), undefined);
  // The boss and its gains go on the board together, each on its own.
  assert.deepEqual(boardOf(step(chosen)), ['gozer', 'p', 'r']);
  assert.deepEqual(discardOf(step(chosen)), ['q']);
});

test('a boss that absorbs keeps what there is when too few candidates remain', () => {
  const two = step(powerGame(['gozer', 'p', 'q']));
  assert.deepEqual(bossesOf(two).revealed.a1, { kind: 'abomination', boss: 'gozer', gained: ['p', 'q'] });
  const one = step(powerGame(['gozer', 'p']));
  assert.deepEqual(bossesOf(one).revealed.a1, { kind: 'abomination', boss: 'gozer', gained: ['p'] });
  const none = step(powerGame(['gozer']));
  assert.deepEqual(bossesOf(none).revealed.a1, { kind: 'abomination', boss: 'gozer' });
  assert.equal(pendingChoice(none), undefined);
});

test('drawing the candidates reshuffles the discard without touching the bosses on display', () => {
  const state = step(powerGame(['x', 'gozer'], ['p', 'q', 'r'], 2, 'fest'), firstTwo);
  assert.deepEqual(bossesOf(state).revealed.a1, { kind: 'abomination', boss: 'x' });
  const group = bossesOf(state).revealed.a2;
  assert.deepEqual([...(group?.choice?.offered ?? [])].sort(), ['p', 'q', 'r']);
  assert.deepEqual(bossesOf(state).abomination, { draw: [], discard: [] });
});

test('a choice of the wrong size or with cards that were not offered changes nothing', () => {
  const pending = step(powerGame(['gozer', 'p', 'q', 'r']));
  for (const picked of [[], ['p'], ['p', 'q', 'r'], ['p', 'zzz'], ['p', 'p']]) {
    assert.equal(chooseGained(pending, picked), pending, JSON.stringify(picked));
  }
  const calm = step(powerGame(['x']));
  assert.equal(chooseGained(calm, ['x']), calm);
});

test('a pending choice comes back with undo, and the first group waiting is the one that is chosen', () => {
  const pending = step(powerGame(['gozer', 'p', 'q', 'r', 'gozer2', 's', 't'], [], 1, 'fest'));
  const chosen = chooseGained(pending, ['p', 'q']);
  assert.deepEqual(undo(chosen).piles, pending.piles);
  assert.deepEqual(pendingChoice(undo(chosen)), { boss: 'gozer', offered: ['p', 'q', 'r'], keep: 2 });
  // A second boss drawn by hand waits behind the first.
  const two = manualDraw(pending);
  assert.deepEqual(pendingChoice(two)?.boss, 'gozer');
  const next = chooseGained(two, ['p', 'q']);
  assert.deepEqual(pendingChoice(next), { boss: 'gozer2', offered: ['s', 't'], keep: 1 });
  const last = chooseGained(next, ['t']);
  assert.equal(pendingChoice(last), undefined);
  assert.deepEqual(bossesOf(last).manual[0], { kind: 'abomination', boss: 'gozer2', gained: ['t'], activated: ['gozer'] });
  assert.deepEqual(bossesOf(last).abomination.discard, ['r', 's']);
});

test('drawing while a choice is pending discards the boss with all its candidates', () => {
  const pending = step(powerGame(['gozer', 'p', 'q', 'r', 's']));
  const next = step(pending);
  assert.equal(pendingChoice(next), undefined);
  assert.deepEqual(discardOf(next), ['p', 'q', 'r']);
  assert.deepEqual(boardOf(next), ['gozer']);
  assert.deepEqual(undo(next).piles, pending.piles);
});

test('an Abomination drawn by hand shows beside the cards, undoes at once and leaves with the next Spawn step', () => {
  const start = powerGame(['spam', 'x', 'y']);
  const drawn = manualDraw(start);
  assert.deepEqual(bossesOf(drawn).manual, [{ kind: 'abomination', boss: 'x', spam: ['spam'] }]);
  assert.deepEqual(bossesOf(drawn).revealed, {});
  assert.deepEqual(undo(drawn).piles, start.piles);
  const next = step(drawn, () => undefined);
  assert.deepEqual(bossesOf(next).manual, []);
  assert.deepEqual(discardOf(next), ['spam']);
  assert.deepEqual(boardOf(next), ['x']);
  // Two by hand pile up.
  assert.equal(bossesOf(manualDraw(drawn)).manual.length, 2);
});

test('an Abomination drawn by hand stays through the zones of a Spawn step taken one at a time', () => {
  const effect = () => 'spawn' as const;
  const next = (state: GameState) => drawNextCard(state, effect, () => 0, () => undefined, powers);
  const first = next(powerGame(['x', 'y'], [], 2));
  const held = manualDraw(first);
  const second = next(held);
  assert.equal(bossesOf(second).manual.length, 1, 'same step');
  const third = next(second);
  assert.deepEqual(bossesOf(third).manual, [], 'a new step');
  assert.deepEqual(boardOf(third), ['x']);
});

test('drawing an Abomination by hand does nothing without a boss deck or with nothing left to draw', () => {
  const plain = newGame(sets, ['a']);
  assert.equal(drawAbomination(plain, () => 0, powers), plain);
  const empty = powerGame([]);
  assert.equal(drawAbomination(empty, () => 0, powers), empty);
});

test('reshuffling everything brings back every group, the ones drawn by hand included', () => {
  const state = manualDraw(step(powerGame(['gozer', 'p', 'q', 'r', 'bwl', 'robins', 's'])));
  const all = bossCardsOf(state);
  const fresh = reshuffleAll(state, () => 0);
  assert.deepEqual(bossesOf(fresh).manual, []);
  assert.deepEqual(bossesOf(fresh).revealed, {});
  assert.deepEqual([...bossesOf(fresh).abomination.draw].sort(), all);
  assert.deepEqual(bossesOf(fresh).abomination.discard, []);
  assert.deepEqual(undo(fresh).piles, state.piles);
});

test('a card that stops calling on a boss deck at the new Danger Level gives back its whole group', () => {
  const blueOnly: BossTrigger = (id, danger) => (id === 'a1' && danger === 'blue' ? 'abomination' : undefined);
  const pending = step(powerGame(['gozer', 'p', 'q', 'r', 'x']), blueOnly);
  const red = setDanger(pending, 'red', blueOnly, () => 0, powers);
  assert.deepEqual(bossesOf(red).revealed, {});
  assert.deepEqual(discardOf(red), ['gozer', 'p', 'q', 'r']);
  // The group drawn by hand stays.
  const withHand = setDanger(manualDraw(pending), 'red', blueOnly, () => 0, powers);
  assert.equal(bossesOf(withHand).manual.length, 1);
  // A card that now calls reveals with the powers too.
  const yellowOnly: BossTrigger = (id, danger) => (id === 'a1' && danger === 'yellow' ? 'abomination' : undefined);
  const waiting = step(powerGame(['spam', 'x']), yellowOnly);
  assert.deepEqual(bossesOf(waiting).revealed, {});
  assert.deepEqual(bossesOf(setDanger(waiting, 'yellow', yellowOnly, () => 0, powers)).revealed.a1, { kind: 'abomination', boss: 'x', spam: ['spam'] });
});

test('no boss or card is ever lost or duplicated, whatever the players do', () => {
  let seed = 7;
  const rng = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const trigger: BossTrigger = (id, danger) =>
    id === 'a1' || (id === 'b1' && danger !== 'red') || (id === 'a2' && danger === 'orange') ? 'abomination' : undefined;
  const bosses = ['spam', 'spam2', 'bwl', 'robins', 'gozer', 'gozer2', 'vamp', 'm', 'n', 'o', 'p', 'q', 'r'];
  const base = powerGame(bosses, [], 2);
  let state: GameState = { ...base, piles: { ...base.piles, draw: ['a1', 'a2', 'a3', 'b1'] } };
  const zombies = allIds(state);
  const everyBoss = [...bosses].sort();
  const pick = (n: number) => Math.floor(rng() * n);
  const effect = () => 'spawn' as const;
  let choices = 0;
  for (let i = 0; i < 400; i++) {
    switch (pick(10)) {
      case 0:
      case 1:
        state = drawCards(state, effect, rng, trigger, powers);
        break;
      case 2:
        state = drawNextCard(state, effect, rng, trigger, powers);
        break;
      case 3:
      case 4:
        state = drawAbomination(state, rng, powers);
        break;
      case 5: {
        const pending = pendingChoice(state);
        if (pending) {
          choices++;
          state = chooseGained(state, pending.offered.slice(0, pending.keep));
        }
        break;
      }
      case 6:
        state = setDanger(state, DANGER_LEVELS[pick(4)], trigger, rng, powers);
        break;
      case 7:
        state = pick(2) ? undo(state) : shuffleDeck(state, rng);
        break;
      case 8: {
        const first = state.piles.bosses?.onBoard[0];
        if (first) state = removeFromBoard(state, { from: 'board', boss: first.boss }, rng, powers);
        break;
      }
      default:
        if (pick(4) === 0) state = reshuffleAll(state, rng);
    }
    assert.deepEqual(bossCardsOf(state), everyBoss, `step ${i}`);
    assert.deepEqual(allIds(state), zombies, `step ${i}`);
  }
  assert.ok(choices > 0, 'the run chose among candidates');
});

test('a save is version 8: version 7 is rejected, groups drawn by hand and pending choices are kept', () => {
  const state = manualDraw(step(powerGame(['gozer', 'p', 'q', 'r', 'x'], [], 1, 'fest')));
  const known = () => new Set(['a1', 'a2', 'a3']);
  const bossIds = () => new Set(['gozer', 'p', 'q', 'r', 'x']);
  const copy = () => JSON.parse(JSON.stringify(state));
  assert.equal(state.version, 8);
  assert.equal(newGame(sets, ['a']).version, 8);
  assert.deepEqual(newGame(sets, ['a'], ALL_PARTS, () => 0, 1, 'modern', (cards) => ({ cards, bosses: { rule: 'fest', abomination: ['x'], necromancer: [] } })).piles.bosses?.manual, []);
  assert.ok(isValidSave(copy(), known, bossIds));
  assert.equal(isValidSave({ ...copy(), version: 7 }, known, bossIds), false, 'the old game is rejected');
  const broken = (change: (bosses: any) => void) => {
    const save = copy();
    change(save.piles.bosses);
    return isValidSave(save, known, bossIds);
  };
  assert.equal(broken((b) => delete b.manual), false);
  assert.equal(broken((b) => (b.manual = 'x')), false);
  assert.equal(broken((b) => (b.manual[0].kind = 'dragon')), false);
  assert.equal(broken((b) => (b.manual[0].boss = 'ghost')), false);
  assert.equal(broken((b) => (b.revealed.a1.choice.keep = 0)), false);
  assert.equal(broken((b) => (b.revealed.a1.choice.keep = 3)), false);
  assert.equal(broken((b) => (b.revealed.a1.choice.keep = 1.5)), false);
  assert.equal(broken((b) => (b.revealed.a1.choice.offered = [7])), false);
  assert.equal(broken((b) => (b.revealed.a1.choice.offered = ['ghost', 'p', 'q'])), false);
  assert.equal(broken((b) => (b.revealed.a1.choice = 'p')), false);
  assert.equal(broken((b) => (b.revealed.a1.spam = 'spam')), false);
  assert.equal(broken((b) => (b.revealed.a1.along = [1])), false);
  assert.equal(broken((b) => (b.revealed.a1.gained = ['ghost'])), false);
  assert.equal(broken(() => undefined), true);
});

test('powers come from the boss lists, and only Modern draws its Abominations by hand', () => {
  const listed: Boss<string>[] = [{ zombie: 'a', setId: 's', power: { kind: 'cantrip' } }, { zombie: 'b', setId: 's' }];
  const lookup = powersOf(listed);
  assert.deepEqual(lookup('a'), { kind: 'cantrip' });
  assert.equal(lookup('b'), undefined);
  assert.equal(lookup('unknown'), undefined);
  assert.equal(UNIVERSES.modern.bosses?.manualDraw, true);
  assert.equal(UNIVERSES.fantasy.bosses?.manualDraw, true);
  assert.equal(UNIVERSES.fantasy.bosses?.bossPowers('abominalpha'), undefined);
  assert.equal(UNIVERSES.modern.bosses?.bossPowers('queenMaeve'), undefined);
});

test('a Fantasy game has no group fields and nothing drawn by hand', () => {
  const setIds = ['blackPlague', 'greenHorde'];
  let state = newGame(FANTASY_SETS, setIds, ALL_PARTS, () => 0.3, 2, 'fantasy', (cards) => tailorFantasyDeck(cards, DEFAULT_THREAT, new Set(setIds)));
  assert.equal(state.version, 8);
  for (let i = 0; i < 60; i++) {
    state = drawCards(state, cardEffect, () => 0.3, fantasyBossTrigger);
    assert.deepEqual(bossesOf(state).manual, []);
    for (const group of shownGroups(state)) assert.ok(Object.keys(group).every((key) => ['boss', 'kind', 'activates'].includes(key)));
  }
  assert.ok(isValidSave(JSON.parse(JSON.stringify(state)), cardIdsOf, bossIdsOf));
});

// Save validation of boss decks: no card may be duplicated, whatever the save says.
const SAVE_CARDS = new Set(['a1', 'a2', 'a3']);
const SAVE_BOSSES = new Set(['spam', 'bwl', 'robins', 'gozer', 'gozer2', 'x', 'y', 'p', 'q', 'r', 's', 't']);
const SAVE_COPIES = new Map([...SAVE_BOSSES].map((boss) => [boss, 1]));
const validSave = (save: unknown) => isValidSave(JSON.parse(JSON.stringify(save)), () => SAVE_CARDS, () => SAVE_BOSSES, () => SAVE_COPIES);
/** A game in the middle of the Abomination deck: a SPAM and a bringing-along boss, a manual card, a gained pair and a pending choice. */
const midGame = () => {
  let state = step(powerGame(['spam', 'bwl', 'x', 'robins', 'gozer', 'p', 'q', 'r', 'y', 'gozer2', 's', 't'], [], 1, 'fest'));
  state = manualDraw(manualDraw(state));
  state = chooseGained(state, ['p', 'q']);
  return manualDraw(manualDraw(state));
};

test('a normal mid-game save of boss decks is accepted', () => {
  const state = midGame();
  const groups = shownGroups(state);
  assert.ok(groups.some((group) => group.spam) && groups.some((group) => group.along) && groups.some((group) => group.gained) && groups.some((group) => group.choice));
  assert.ok(pendingChoice(state));
  assert.ok(validSave(state));
});

test('a group that is offered a choice and has gained cards is rejected', () => {
  const state = midGame();
  const bosses = bossesOf(state);
  const manual = bosses.manual.map((group) => (group.choice ? { ...group, gained: ['p'] } : group));
  assert.equal(validSave({ ...state, piles: { ...state.piles, bosses: { ...bosses, manual } } }), false);
});

test('a boss card present twice in a save is rejected', () => {
  const state = midGame();
  const bosses = bossesOf(state);
  const inDeck = { ...bosses, abomination: { ...bosses.abomination, draw: [...bosses.abomination.draw, 'x'] } };
  assert.equal(validSave({ ...state, piles: { ...state.piles, bosses: inDeck } }), false, 'on display and still in the deck');
  const twice = { ...bosses, manual: [...bosses.manual, ...bosses.manual] };
  assert.equal(validSave({ ...state, piles: { ...state.piles, bosses: twice } }), false, 'a group in the list twice');
  const copies = new Map(SAVE_COPIES).set('x', 2);
  assert.ok(isValidSave(JSON.parse(JSON.stringify({ ...state, piles: { ...state.piles, bosses: inDeck } })), () => SAVE_CARDS, () => SAVE_BOSSES, () => copies), 'a boss printed twice may appear twice');
});

// Western (Zombicide: Undead or Alive). Source: the owner's photos of the printed cards (2026-11-19), the core box
// count from the rulebook p.4; counts are printed Red first and stored Blue, Yellow, Orange, Red.
const western = UNIVERSES.western;
const westernCard = (id: string) => CARDS_BY_ID.get(id);
const westernCounts = (id: string) => {
  const card = westernCard(id);
  return card?.kind === 'westernSpawn' ? card.counts : undefined;
};
const WESTERN_BOSS_ID_LIST = WESTERN_ABOMINATIONS.map((boss) => boss.zombie);

test('Western is a fourth universe with its own save key, deck parts off and one core box', () => {
  assert.ok(UNIVERSE_IDS.includes('western'));
  assert.equal(gameKey('western'), 'zombideck.game.western');
  assert.equal(western.exclusiveCores, false);
  assert.equal(western.deckParts, false);
  assert.deepEqual(western.defaultExpansions, ['undeadOrAlive']);
  assert.deepEqual(western.sets.filter((set) => set.core).map((set) => set.id), ['undeadOrAlive']);
  assert.ok(western.sets.every((set) => set.optional));
});

test('the Western core box has the 37 printed cards and Long-Dead Walkers 8, numbered without gaps', () => {
  const [core, longDead] = [WESTERN_SETS.find((set) => set.id === 'undeadOrAlive'), WESTERN_SETS.find((set) => set.id === 'longDeadWalkers')];
  assert.deepEqual(core?.cards.map((card) => card.id), Array.from({ length: 37 }, (_, i) => `undeadOrAlive-${String(i + 1).padStart(3, '0')}`));
  assert.deepEqual(longDead?.cards.map((card) => card.id), Array.from({ length: 8 }, (_, i) => `longDeadWalkers-${String(i + 38).padStart(3, '0')}`));
  assert.equal(longDead?.optional, true);
  assert.ok(WESTERN_SETS.flatMap((set) => set.cards).every(isWesternCard));
});

test('Western counts are listed Blue, Yellow, Orange, Red (the printed card lists Red first)', () => {
  assert.deepEqual(westernCounts('undeadOrAlive-001'), [2, 4, 8, 10]);
  assert.deepEqual(westernCounts('undeadOrAlive-017'), [4, 6, 10, 12]);
  assert.deepEqual(westernCounts('undeadOrAlive-005'), [2, 4, 8, 10]);
  assert.deepEqual(westernCounts('undeadOrAlive-021'), [4, 4, 8, 10]);
  assert.deepEqual(westernCounts('undeadOrAlive-025'), [4, 4, 8, 10]);
  assert.deepEqual(westernCounts('longDeadWalkers-038'), [2, 4, 8, 10]);
  assert.deepEqual(westernCounts('longDeadWalkers-042'), [4, 6, 10, 12]);
  assert.deepEqual(westernCounts('longDeadWalkers-044'), [4, 6, 10, 14]);
  assert.deepEqual(westernCounts('longDeadWalkers-045'), westernCounts('longDeadWalkers-044'));
});

test('the Western core box holds the printed kinds of cards, #012 being a copy of #011', () => {
  const zombie = (id: string) => {
    const card = westernCard(id);
    return card?.kind === 'westernSpawn' || card?.kind === 'westernExtra' ? card.zombie : card?.kind;
  };
  assert.equal(zombie('undeadOrAlive-004'), 'westernWalker');
  assert.equal(zombie('undeadOrAlive-008'), 'westernBrute');
  assert.equal(zombie('undeadOrAlive-009'), 'westernRunner');
  assert.equal(zombie('longDeadWalkers-038'), 'longDeadWalker');
  for (const number of ['013', '016', '029', '033']) assert.equal(zombie(`undeadOrAlive-${number}`), 'westernAbomination');
  const extras = ['034', '035', '036', '037'];
  assert.deepEqual(extras.map((n) => westernCard(`undeadOrAlive-${n}`)?.kind), Array(4).fill('westernExtra'));
  assert.deepEqual(extras.map((n) => zombie(`undeadOrAlive-${n}`)), ['westernWalker', 'westernWalker', 'westernBrute', 'westernRunner']);
  assert.deepEqual({ ...westernCard('undeadOrAlive-012'), id: '' }, { ...westernCard('undeadOrAlive-011'), id: '' });
  const core = WESTERN_SETS[0].cards;
  assert.equal(core.filter((card) => card.kind === 'westernAbomination').length, 9);
  assert.equal(core.filter((card) => card.kind === 'westernExtra').length, 4);
  assert.equal(cardPart(WESTERN_SETS[0], core[33]), 'extra');
  assert.equal(cardPart(WESTERN_SETS[0], core[0]), 'easy');
});

test('every Western Abomination has a set that holds it, a name and its printed rule', () => {
  assert.equal(WESTERN_ABOMINATIONS.length, 29);
  assert.equal(new Set(WESTERN_BOSS_ID_LIST).size, 29);
  const text = en as Record<string, string>;
  for (const boss of WESTERN_ABOMINATIONS) {
    assert.ok(WESTERN_SETS.some((set) => set.id === boss.setId), boss.zombie);
    assert.ok(text[`zombie.${boss.zombie}.one`] && text[`zombie.${boss.zombie}.other`], boss.zombie);
    assert.ok(text[`card.${boss.zombie}Rule`], boss.zombie);
  }
  assert.deepEqual(withCoreBox(UNIVERSES.western, ['westernIronMaiden2', 'westernIronMaiden3', 'westernIronMaiden']), ['westernIronMaiden', 'undeadOrAlive']);
  const boxes = (setId: string) => WESTERN_ABOMINATIONS.filter((boss) => boss.setId === setId).length;
  assert.deepEqual(
    ['undeadOrAlive', 'runningWild', 'abominapeVsCrocosaur', 'deadstockAbominations', 'deadWestAbominations', 'gearsAndGuns', 'westernPromos', 'westernIronMaiden'].map(boxes),
    [1, 1, 2, 4, 12, 1, 1, 7],
  );
  assert.equal(text['card.steamMonsterRule'], 'When the Steam Monster enters a Zone, any Steam Nozzles in it are Broken.');
  assert.deepEqual(WESTERN_SETS.filter((set) => set.cards.length === 0).map((set) => set.id).sort(), [
    'abominapeVsCrocosaur', 'deadWestAbominations', 'deadstockAbominations', 'gearsAndGuns', 'runningWild', 'westernIronMaiden', 'westernPromos',
  ]);
});

test('no zombie or boss id is shared between universes', () => {
  const zombiesOf = (universe: 'modern' | 'fantasy' | 'invader' | 'western') =>
    new Set(UNIVERSES[universe].sets.flatMap((set) => set.cards.flatMap((card): string[] => {
      if ('zombie' in card) return [card.zombie];
      if (card.kind === 'levels') return card.levels.flatMap((level) => (level ? [level.zombie] : []));
      return [];
    })));
  const ids = {
    modern: new Set([...zombiesOf('modern'), ...MODERN_BOSS_IDS]),
    fantasy: new Set([...zombiesOf('fantasy'), ...FANTASY_BOSS_IDS]),
    invader: zombiesOf('invader'),
    western: new Set([...zombiesOf('western'), ...WESTERN_BOSS_IDS]),
  };
  assert.ok(ids.western.size > 25);
  for (const other of ['modern', 'fantasy', 'invader'] as const) {
    assert.deepEqual([...ids.western].filter((id) => ids[other].has(id)), [], other);
  }
});

test('a Western game is saved and reloaded; a Western save holding a Modern card or boss is rejected', () => {
  const setIds = ['undeadOrAlive', 'longDeadWalkers'];
  const game = newGame(western.sets, setIds, ALL_PARTS, () => 0, 2, 'western', tailorDeck('western', DEFAULT_THREAT, setIds));
  assert.equal(game.universe, 'western');
  assert.equal(game.piles.draw.length, 45);
  const saved = JSON.parse(JSON.stringify(drawCards(game, cardEffect, () => 0, fantasyBossTrigger)));
  assert.ok(isValidSave(saved, cardIdsOf, bossIdsOf, bossCopiesOf));
  const valid = (value: unknown) => isValidSave(value, cardIdsOf, bossIdsOf, bossCopiesOf);
  assert.equal(valid({ ...saved, piles: { ...saved.piles, draw: ['core2e-001'] } }), false);
  const bosses = saved.piles.bosses;
  assert.ok(bosses, 'the core box brings the Bowler Hat, so the game has an Abomination deck');
  const withBoss = (boss: string) => ({ ...saved, piles: { ...saved.piles, bosses: { ...bosses, abomination: { draw: [boss], discard: [] } } } });
  assert.equal(valid(withBoss('hobomination')), false);
  assert.equal(valid(withBoss('abominawild')), false);
  assert.equal(valid(withBoss('bowlerHat')), true);
  // And the other way round: a Modern save refuses a Western card.
  const modern = newGame(CARD_SETS, ['core2e'], ALL_PARTS, () => 0, 1, 'modern');
  assert.equal(valid({ ...modern, piles: { ...modern.piles, draw: ['undeadOrAlive-001'] } }), false);
});

test('Western Abominations: its text cards always call on the Abomination deck, one at a time, drawn by hand too', () => {
  for (const danger of DANGER_LEVELS) {
    assert.equal(fantasyBossTrigger('undeadOrAlive-013', danger), 'abomination');
    assert.equal(fantasyBossTrigger('undeadOrAlive-001', danger), undefined);
    assert.equal(fantasyBossTrigger('undeadOrAlive-034', danger), undefined);
  }
  assert.deepEqual(western.bosses?.rules, ['oneAtATime']);
  assert.equal(western.bosses?.manualDraw, true);
  assert.equal(western.bosses?.necromancers.length, 0);
  const deck = (setIds: string[]) => western.bosses?.tailor(selectCards(western.sets, setIds), DEFAULT_THREAT, new Set(setIds));
  // The text cards stay in the Zombie deck; each box switched on adds its Abominations to the Abomination deck.
  assert.equal(deck(['undeadOrAlive'])?.cards.length, 37);
  assert.deepEqual(deck(['undeadOrAlive'])?.bosses?.abomination, ['bowlerHat']);
  assert.deepEqual(deck(['undeadOrAlive', 'abominapeVsCrocosaur'])?.bosses?.abomination.sort(), ['abominape', 'bowlerHat', 'crocosaur']);
  const off = western.bosses?.tailor(selectCards(western.sets, ['undeadOrAlive']), { ...DEFAULT_THREAT, off: ['bowlerHat'] }, new Set(['undeadOrAlive']));
  assert.equal(off?.bosses, undefined);
  assert.equal(deck(western.sets.map((set) => set.id))?.bosses?.abomination.length, 29);
});

// One Abomination at a time (Dead Men Tales rulebook p.17, White Death #457-462): "If there is no Abomination on the
// board: draw an Abomination card, then spawn it. If there is already an Abomination: it gets an extra Activation."
const necros: BossTrigger = (id) => (id === 'a1' || id === 'a2' ? 'necromancer' : undefined);
const withNecromancers = (state: GameState, necromancer: string[]): GameState => {
  const bosses = bossesOf(state);
  return { ...state, piles: { ...state.piles, bosses: { ...bosses, necromancer: { draw: necromancer, discard: [] } } } };
};
const activation = (boss: string) => ({ kind: 'abomination', boss: NO_BOSS, activates: boss });

test('one at a time: a second card calling on the Abomination deck names the boss on display and draws nothing', () => {
  const start = powerGame(['x', 'y'], [], 5);
  const state = step(start, firstTwo);
  assert.deepEqual(bossesOf(state).revealed.a1, { kind: 'abomination', boss: 'x' });
  assert.deepEqual(bossesOf(state).revealed.a2, activation('x'));
  assert.deepEqual(bossesOf(state).abomination.draw, ['y']);
  assert.deepEqual(bossCardsOf(state), ['x', 'y']);
  assert.deepEqual(boardOf(step(state, () => undefined)), ['x']);
  assert.deepEqual(discardOf(step(state, () => undefined)), []);
  assert.ok(validSave(state));
  assert.deepEqual(undo(state).piles, start.piles);
});

test('the Abomination Fest still draws a boss for every card', () => {
  const state = step(powerGame(['x', 'y'], [], 5, 'fest'), firstTwo);
  assert.deepEqual(bossesOf(state).revealed.a1, { kind: 'abomination', boss: 'x' });
  assert.deepEqual(bossesOf(state).revealed.a2, { kind: 'abomination', boss: 'y', activated: ['x'] });
});

test('one at a time, a step dealt one zone at a time names the boss on display too', () => {
  const next = (state: GameState) => drawNextCard(state, undefined, () => 0, firstTwo, powers);
  const state = next(next(powerGame(['x', 'y'], [], 2)));
  assert.deepEqual(bossesOf(state).revealed.a2, activation('x'));
  assert.deepEqual(bossesOf(state).abomination.draw, ['y']);
  // A new step starts: x goes on the board with the old cards.
  assert.deepEqual(boardOf(next(state)), ['x']);
});

test('an Abomination drawn by hand during the step counts as on the board', () => {
  const next = (state: GameState) => drawNextCard(state, undefined, () => 0, firstTwo, powers);
  const during = manualDraw(next(powerGame(['x', 'y', 'z'], [], 2)));
  // a1 drew x: the hand draw gives it an Extra Activation instead of drawing; a2 names it too.
  assert.deepEqual(bossesOf(during).manual[0], activation('x'));
  assert.deepEqual(bossesOf(next(during)).revealed.a2, activation('x'));
  // No boss from the cards yet: the card names the one drawn by hand and draws nothing.
  const base = powerGame(['x', 'y'], [], 2);
  const named = next(manualDraw({ ...base, piles: { ...base.piles, drawn: ['a3'] } }));
  assert.deepEqual(bossesOf(named).revealed.a1, activation('x'));
  assert.deepEqual(bossesOf(named).abomination.draw, ['y']);
});

test('one at a time, Necromancers work the same way, apart from the Abomination', () => {
  const state = step(withNecromancers(powerGame(['x'], [], 5), ['n', 'm']), necros);
  assert.deepEqual(bossesOf(state).revealed.a1, { kind: 'necromancer', boss: 'n' });
  assert.deepEqual(bossesOf(state).revealed.a2, { kind: 'necromancer', boss: NO_BOSS, activates: 'n' });
  assert.deepEqual(bossesOf(state).necromancer.draw, ['m']);
  // An Abomination on display does not stop a Necromancer from being drawn.
  const mixed = step(withNecromancers(powerGame(['x'], [], 5), ['n']), (id) => (id === 'a1' ? 'abomination' : id === 'a2' ? 'necromancer' : undefined));
  assert.deepEqual(bossesOf(mixed).revealed.a2, { kind: 'necromancer', boss: 'n' });
});

test('a Gozer group counts as an Abomination on the board, and so does Batman Who Laughs with his Robins', () => {
  const gozer = step(powerGame(['gozer', 'p', 'q', 'r', 'y'], [], 5), firstTwo);
  assert.equal(bossesOf(gozer).revealed.a1?.boss, 'gozer');
  assert.deepEqual(bossesOf(gozer).revealed.a2, activation('gozer'));
  assert.deepEqual(bossesOf(gozer).abomination.draw, ['y']);
  const bwl = step(powerGame(['bwl', 'robins', 'y'], [], 5), firstTwo);
  assert.deepEqual(bossesOf(bwl).revealed.a1, { kind: 'abomination', boss: 'bwl', along: ['robins'] });
  assert.deepEqual(bossesOf(bwl).revealed.a2, activation('bwl'));
  assert.deepEqual(bossesOf(bwl).abomination.draw, ['y']);
});

test('Western is always one at a time: a second text card names the Abomination on display', () => {
  const setIds = ['undeadOrAlive'];
  let state = newGame(western.sets, setIds, ALL_PARTS, () => 0, 3, 'western', (cards) => western.bosses?.tailor(cards, DEFAULT_THREAT, new Set(setIds)) ?? { cards });
  assert.equal(state.bossRule, 'oneAtATime');
  const text = state.piles.draw.filter((id) => fantasyBossTrigger(id, 'blue') === 'abomination').slice(0, 2);
  assert.equal(text.length, 2, 'the box holds at least two text cards');
  state = { ...state, piles: { ...state.piles, draw: [...text, ...state.piles.draw.filter((id) => !text.includes(id))] } };
  state = drawCards(state, cardEffect, () => 0, fantasyBossTrigger);
  assert.equal(bossesOf(state).revealed[text[0]]?.boss, 'bowlerHat');
  assert.deepEqual(bossesOf(state).revealed[text[1]], activation('bowlerHat'));
});

// Danger Level changes: the cards stay where they are, so the zone order decides who draws.
const callsAt = (levels: Record<string, string[]>): BossTrigger => (id, danger) => (levels[id]?.includes(danger) ? 'abomination' : undefined);

test('a Danger Level that makes a card call names the boss on display instead of drawing', () => {
  const trigger = callsAt({ a1: ['blue', 'red'], a2: ['red'] });
  const blue = step(powerGame(['x', 'y'], [], 2), trigger);
  assert.equal(bossesOf(blue).revealed.a2, undefined);
  const red = setDanger(blue, 'red', trigger, () => 0, powers);
  assert.deepEqual(bossesOf(red).revealed.a1, { kind: 'abomination', boss: 'x' });
  assert.deepEqual(bossesOf(red).revealed.a2, activation('x'));
  assert.deepEqual(bossesOf(red).abomination.draw, ['y']);
});

test('a Danger Level that makes an earlier card call hands it the boss, in zone order', () => {
  const trigger = callsAt({ a1: ['red'], a2: ['blue', 'red'] });
  const blue = step(powerGame(['x', 'y'], [], 2), trigger);
  assert.deepEqual(bossesOf(blue).revealed.a2, { kind: 'abomination', boss: 'x' });
  const red = setDanger(blue, 'red', trigger, () => 0, powers);
  assert.deepEqual(bossesOf(red).revealed.a1, { kind: 'abomination', boss: 'x' });
  assert.deepEqual(bossesOf(red).revealed.a2, activation('x'));
  assert.deepEqual(bossCardsOf(red), ['x', 'y']);
});

test('when the card that revealed the boss stops calling, the next card draws a boss', () => {
  const trigger = callsAt({ a1: ['blue'], a2: ['blue', 'red'] });
  const blue = step(powerGame(['x', 'y'], [], 2), trigger);
  assert.deepEqual(bossesOf(blue).revealed.a2, activation('x'));
  const red = setDanger(blue, 'red', trigger, () => 0, powers);
  assert.equal(bossesOf(red).revealed.a1, undefined);
  assert.deepEqual(bossesOf(red).revealed.a2, { kind: 'abomination', boss: 'y' });
  assert.deepEqual(discardOf(red), ['x']);
});

test('a save with an Extra Activation naming a boss that is not on display is rejected', () => {
  const state = step(powerGame(['x', 'y'], [], 5), firstTwo);
  const bosses = bossesOf(state);
  const edit = (group: object) => validSave({ ...state, piles: { ...state.piles, bosses: { ...bosses, revealed: { ...bosses.revealed, a2: group } } } });
  assert.ok(edit(activation('x')));
  assert.equal(edit(activation('y')), false, 'y is in the deck');
  assert.equal(edit(activation('ghost')), false);
  assert.equal(edit({ kind: 'abomination', boss: 'y', activates: 'x' }), false, 'a drawn boss does not also activate');
  assert.equal(edit({ kind: 'necromancer', boss: NO_BOSS, activates: 'x' }), false, 'the other kind');
  assert.equal(validSave({ ...state, version: 5 }), false, 'a version 5 game is rejected');
});

test('every artwork zombie-art.tsx requires exists', () => {
  const file = new URL('../components/zombie-art.tsx', import.meta.url);
  const source = readFileSync(file, 'utf8');
  const paths = [...source.matchAll(/require\('(\.\.\/\.\.\/assets\/[^']+)'\)/g)].map((match) => match[1]);
  assert.ok(paths.length > 100, 'the art tables were not found');
  for (const path of paths) assert.ok(existsSync(new URL(path, file)), `missing file ${path}`);
});

test('the ratio of every Fantasy and Modern official cut-out is that of its PNG', () => {
  const file = new URL('../components/zombie-art.tsx', import.meta.url);
  const source = readFileSync(file, 'utf8');
  // The Western windows come after the two tables and carry the ratio of their window, not of a file.
  const tables = source.slice(0, source.indexOf('const WESTERN_WINDOWS'));
  const entries = [...tables.matchAll(/require\('(\.\.\/\.\.\/assets\/[^']+\.png)'\), ratio: ([\d.]+)/g)];
  assert.ok(entries.length > 0, 'no official cut-out found');
  assert.ok(entries.some(([, path]) => path.includes('/modern/')), 'no Modern official cut-out found');
  for (const [, path, ratio] of entries) {
    // PNG header: 8 bytes of signature, then the IHDR chunk with the width and the height as big-endian 32-bit integers.
    const header = readFileSync(new URL(path, file));
    assert.ok(Math.abs(header.readUInt32BE(16) / header.readUInt32BE(20) - Number(ratio)) < 0.002, `${path}: ratio ${ratio}`);
  }
});

// Bosses stay on the board across Spawn steps until the players remove them.
const everyCard: BossTrigger = () => 'abomination';
const onBoardOf = (state: GameState) => bossesOf(state).onBoard;
const OUT = (boss: string) => ({ from: 'board', boss }) as const;
const gone = (state: GameState, card: string, boss: string) => removeFromBoard(state, { from: 'step', card, boss }, () => 0, powers);
const dropped = (state: GameState, boss: string) => removeFromBoard(state, OUT(boss), () => 0, powers);

test('a boss still alive at the next Spawn step gets the Extra Activation and nothing is drawn', () => {
  const next = step(step(powerGame(['x', 'y']), firstTwo), firstTwo);
  assert.deepEqual(onBoardOf(next), [{ kind: 'abomination', boss: 'x' }]);
  assert.deepEqual(bossesOf(next).revealed.a2, activation('x'));
  assert.deepEqual(bossesOf(next).abomination.draw, ['y']);
  assert.deepEqual(discardOf(next), []);
});

test('a boss removed from the board can be drawn again after a reshuffle', () => {
  const board = step(step(powerGame(['x']), firstTwo), firstTwo);
  const removed = dropped(board, 'x');
  assert.deepEqual(onBoardOf(removed), []);
  assert.deepEqual(bossesOf(removed).abomination.discard, ['x']);
  const again = step(removed, everyCard);
  assert.equal(bossesOf(again).revealed.a3?.boss, 'x');
  assert.deepEqual(onBoardOf(again), []);
});

test('a boss removed during its own phase does not go on the board at the next draw', () => {
  const shown = step(powerGame(['x', 'y']), firstTwo);
  const removed = gone(shown, 'a1', 'x');
  assert.deepEqual(bossesOf(removed).abomination.discard, ['x']);
  assert.deepEqual(bossCardsOf(removed), ['x', 'y']);
  const next = step(removed, firstTwo);
  assert.deepEqual(onBoardOf(next), []);
  assert.deepEqual(bossesOf(next).revealed.a2, { kind: 'abomination', boss: 'y' }, 'nothing alive: the next call draws');
  assert.deepEqual(bossCardsOf(next), ['x', 'y']);
});

test('in the Abomination Fest the bosses on the board are never drawn again and all get the Extra Activation', () => {
  let state: GameState = powerGame(['x', 'y', 'z'], [], 1, 'fest');
  state = step(step(step(state, everyCard), everyCard), everyCard);
  assert.deepEqual(onBoardOf(state), [{ kind: 'abomination', boss: 'x' }, { kind: 'abomination', boss: 'y' }]);
  assert.deepEqual(bossesOf(state).revealed.a3, { kind: 'abomination', boss: 'z', activated: ['x', 'y'] });
  // The deck is empty: the next card only activates the three that are out.
  const empty = step(state, everyCard);
  assert.deepEqual(Object.values(bossesOf(empty).revealed), [{ kind: 'abomination', boss: NO_BOSS, activated: ['x', 'y', 'z'] }]);
});

test('undo brings a removed boss back', () => {
  const board = step(step(powerGame(['x', 'y']), firstTwo), firstTwo);
  const removed = dropped(board, 'x');
  assert.deepEqual(undo(removed).piles, board.piles);
  const phase = step(powerGame(['x', 'y']), firstTwo);
  assert.deepEqual(undo(gone(phase, 'a1', 'x')).piles, phase.piles);
});

test('reshuffling everything empties the board and the bosses go back in their decks', () => {
  const board = step(step(powerGame(['x', 'y']), firstTwo), firstTwo);
  const fresh = reshuffleAll(board, () => 0);
  assert.deepEqual(onBoardOf(fresh), []);
  assert.deepEqual([...bossesOf(fresh).abomination.draw].sort(), ['x', 'y']);
  assert.deepEqual(undo(fresh).piles, board.piles);
});

test('the Draw an Abomination button gives the Extra Activation to the one on the board, and reveals in the Fest', () => {
  const board = step(step(powerGame(['x', 'y']), firstTwo), firstTwo);
  const byHand = manualDraw(board);
  assert.deepEqual(bossesOf(byHand).manual, [{ kind: 'abomination', boss: NO_BOSS, activates: 'x' }]);
  assert.deepEqual(bossesOf(byHand).abomination.draw, ['y']);
  const fest = step(step(powerGame(['x', 'y', 'z'], [], 1, 'fest'), everyCard), everyCard);
  assert.deepEqual(bossesOf(manualDraw(fest)).manual, [{ kind: 'abomination', boss: 'z', activated: ['x', 'y'] }]);
  // A boss drawn by hand blocks the next one too, and is named.
  const first = manualDraw(powerGame(['x', 'y']));
  assert.deepEqual(bossesOf(manualDraw(first)).manual[1], { kind: 'abomination', boss: NO_BOSS, activates: 'x' });
});

test('a boss brought along is listed on its own and removed on its own', () => {
  const board = step(step(powerGame(['bwl', 'x', 'robins']), firstTwo), firstTwo);
  assert.deepEqual(onBoardOf(board), [{ kind: 'abomination', boss: 'bwl' }, { kind: 'abomination', boss: 'robins' }]);
  assert.deepEqual(bossesOf(board).revealed.a2, activation('bwl'));
  const noRobins = dropped(board, 'robins');
  assert.deepEqual(onBoardOf(noRobins), [{ kind: 'abomination', boss: 'bwl' }]);
  assert.deepEqual(bossesOf(noRobins).abomination.discard, ['robins']);
  // During the phase: the Robins removed, Batman stays and arrives on the board alone.
  const phase = gone(step(powerGame(['bwl', 'x', 'robins']), firstTwo), 'a1', 'robins');
  assert.deepEqual(bossCardsOf(phase), ['bwl', 'robins', 'x']);
  assert.deepEqual(onBoardOf(step(phase, firstTwo)), [{ kind: 'abomination', boss: 'bwl' }]);
});

test('a boss that lets others spawn does not block the next Abomination or give it an Extra Activation', () => {
  const next = step(step(powerGame(['zuul', 'x', 'y']), firstTwo), firstTwo);
  assert.deepEqual(onBoardOf(next), [{ kind: 'abomination', boss: 'zuul' }]);
  assert.deepEqual(bossesOf(next).revealed.a2, { kind: 'abomination', boss: 'x' });
  assert.equal(manualDraw(next).piles.bosses?.manual.length, 1);
});

test('a boss that draws another when it dies reveals the next Abomination from its deck', () => {
  const board = step(step(powerGame(['vamp', 'x']), firstTwo), firstTwo);
  const dead = dropped(board, 'vamp');
  assert.deepEqual(bossesOf(dead).manual, [{ kind: 'abomination', boss: 'x' }]);
  assert.deepEqual(bossesOf(dead).abomination.discard, ['vamp']);
  assert.deepEqual(onBoardOf(dead), []);
  assert.deepEqual(onBoardOf(step(dead, firstTwo)), [{ kind: 'abomination', boss: 'x' }]);
});

test('removing a boss that is nowhere changes nothing', () => {
  const state = step(powerGame(['x']), firstTwo);
  assert.equal(dropped(state, 'x'), state);
  assert.equal(gone(state, 'a2', 'x'), state);
});

test('a card naming a boss that is removed meanwhile points to another one, or to none', () => {
  const board = step(step(powerGame(['x', 'y']), firstTwo), firstTwo);
  const none = dropped(board, 'x');
  assert.deepEqual(bossesOf(none).revealed.a2, { kind: 'abomination', boss: NO_BOSS, none: true }, 'told apart from every boss being out');
  const byHand = dropped(manualDraw(board), 'x');
  assert.deepEqual(bossesOf(byHand).manual, []);
  assert.ok(validSave(none) && validSave(byHand));
});

test('a Danger Level change with a boss on the board names it, and giving the call back leaves the board alone', () => {
  const trigger = callsAt({ a1: ['blue', 'red'], a2: ['red'] });
  const board = step(step(powerGame(['x', 'y']), trigger), trigger);
  assert.deepEqual(onBoardOf(board), [{ kind: 'abomination', boss: 'x' }]);
  const red = setDanger(board, 'red', trigger, () => 0, powers);
  assert.deepEqual(bossesOf(red).revealed.a2, activation('x'));
  const blue = setDanger(red, 'blue', trigger, () => 0, powers);
  assert.equal(bossesOf(blue).revealed.a2, undefined);
  assert.deepEqual(onBoardOf(blue), [{ kind: 'abomination', boss: 'x' }]);
  assert.deepEqual(bossCardsOf(blue), ['x', 'y']);
});

test('the board is saved: a version 6 game is rejected, a boss on the board counts against its copies', () => {
  const board = step(step(powerGame(['x', 'y']), firstTwo), firstTwo);
  assert.equal(board.version, 8);
  assert.ok(validSave(board));
  assert.equal(validSave({ ...board, version: 6 }), false);
  const bosses = bossesOf(board);
  const withBoard = (onBoard: unknown) => validSave({ ...board, piles: { ...board.piles, bosses: { ...bosses, onBoard } } });
  assert.equal(withBoard([{ kind: 'abomination', boss: 'x' }, { kind: 'abomination', boss: 'x' }]), false, 'x printed once');
  assert.equal(withBoard([{ kind: 'abomination', boss: 'ghost' }]), false);
  assert.equal(withBoard([{ kind: 'dragon', boss: 'x' }]), false);
  assert.equal(withBoard(undefined), false);
  assert.equal(validSave({ ...board, piles: { ...board.piles, bosses: { ...bosses, abomination: { ...bosses.abomination, draw: ['x'] } } } }), false, 'on the board and in the deck');
  assert.equal(validSave({ ...board, history: [{ ...board.piles, bosses: { ...bosses, onBoard: undefined } }] }), false, 'history is checked too');
});

test('a boss that draws another when it dies keeps a SPAM that is all the deck holds', () => {
  const board = step(step(powerGame(['vamp', 'spam']), firstTwo), firstTwo);
  const dead = dropped(board, 'vamp');
  assert.deepEqual(bossCardsOf(dead), ['spam', 'vamp']);
  assert.deepEqual(bossesOf(dead).manual, [{ kind: 'abomination', boss: NO_DECK, spam: ['spam'] }]);
  assert.deepEqual([...bossesOf(reshuffleAll(dead, () => 0)).abomination.draw].sort(), ['spam', 'vamp']);
});

test('a group without boss left to name says so, in both rules', () => {
  const board = step(step(powerGame(['x']), firstTwo), firstTwo);
  assert.deepEqual(bossesOf(dropped(board, 'x')).revealed.a2, { kind: 'abomination', boss: NO_BOSS, none: true });
  // A boss drawn by hand afterwards is named again, and the mark goes.
  const again = manualDraw(dropped({ ...board, piles: { ...board.piles, bosses: { ...bossesOf(board), abomination: { draw: ['y'], discard: [] } } } }, 'x'));
  assert.deepEqual(bossesOf(again).revealed.a2, activation('y'));
  const fest = step(step(powerGame(['x'], [], 1, 'fest'), everyCard), everyCard);
  assert.deepEqual(bossesOf(fest).revealed.a2, { kind: 'abomination', boss: NO_BOSS, activated: ['x'] });
  assert.deepEqual(bossesOf(dropped(fest, 'x')).revealed.a2, { kind: 'abomination', boss: NO_BOSS, none: true });
  assert.ok(validSave(dropped(fest, 'x')));
  assert.equal(validSave({ ...board, piles: { ...board.piles, bosses: { ...bossesOf(board), revealed: { a2: { kind: 'abomination', boss: 'x', none: true } } } } }), false);
});

test('in the Fest a boss removed during the step leaves the Extra Activations shown', () => {
  const state = step(step(powerGame(['x', 'y', 'z'], [], 1, 'fest'), everyCard), everyCard);
  const removed = dropped(state, 'x');
  assert.deepEqual(bossesOf(removed).revealed.a2, { kind: 'abomination', boss: 'y' });
});

test('the Draw an Abomination button still gives the Extra Activation when the deck is empty', () => {
  const board = step(step(powerGame(['x']), firstTwo), firstTwo);
  assert.deepEqual(bossesOf(board).abomination, { draw: [], discard: [] });
  assert.deepEqual(bossesOf(manualDraw(board)).manual, [activation('x')]);
  const fest = step(step(powerGame(['x'], [], 1, 'fest'), everyCard), everyCard);
  assert.deepEqual(bossesOf(manualDraw(fest)).manual, [{ kind: 'abomination', boss: NO_BOSS, activated: ['x'] }]);
  assert.equal(manualDraw(powerGame([])).piles.bosses?.manual.length, 0, 'nothing on the board, nothing to draw');
});

test('removing a boss present twice on the board removes one copy', () => {
  const board = step(step(powerGame(['x', 'y']), firstTwo), firstTwo);
  const twice: GameState = { ...board, piles: { ...board.piles, bosses: { ...bossesOf(board), onBoard: [{ kind: 'abomination', boss: 'x' }, { kind: 'abomination', boss: 'x' }] } } };
  const once = dropped(twice, 'x');
  assert.deepEqual(boardOf(once), ['x']);
  assert.deepEqual(bossesOf(once).abomination.discard, ['x']);
});

// A chain of bosses (Divine Beasts): one card of the boss deck reveals the first beast, each beast removed brings the
// next, and the card itself is in no pile while the chain lasts. Made-up bosses: card -> b1 -> b2 -> b3.
const CHAIN_POWERS: Record<string, BossPower> = {
  card: { kind: 'chain', first: 'b1' },
  b1: { kind: 'chained', card: 'card', next: 'b2' },
  b2: { kind: 'chained', card: 'card', next: 'b3' },
  b3: { kind: 'chained', card: 'card' },
  sg: { kind: 'single' },
};
const chainPowers: BossPowers = (boss) => CHAIN_POWERS[boss];
const chainStep = (state: GameState, trigger: BossTrigger = firstOnly) => drawCards(state, undefined, () => 0, trigger, chainPowers);
const chainRemove = (state: GameState, target: Parameters<typeof removeFromBoard>[1]) => removeFromBoard(state, target, () => 0, chainPowers);
const inManual = (index: number, boss: string) => ({ from: 'manual', index, boss }) as const;

test('a chain card reveals its first beast and is in no pile', () => {
  const state = chainStep(powerGame(['card', 'x']));
  assert.deepEqual(bossesOf(state).revealed.a1, { kind: 'abomination', boss: 'b1' });
  assert.deepEqual(bossesOf(state).abomination, { draw: ['x'], discard: [] });
  assert.deepEqual(bossCardsOf(state), ['b1', 'x']);
});

test('removing a chained beast brings the next one without discarding, and the last one closes the chain', () => {
  const start = chainStep(powerGame(['card', 'x']));
  const one = chainRemove(start, { from: 'step', card: 'a1', boss: 'b1' });
  assert.deepEqual(bossesOf(one).manual, [{ kind: 'abomination', boss: 'b2' }]);
  assert.deepEqual(discardOf(one), []);
  assert.deepEqual(bossCardsOf(one), ['b2', 'x']);
  const two = chainRemove(one, inManual(0, 'b2'));
  assert.deepEqual(bossesOf(two).manual.at(-1), { kind: 'abomination', boss: 'b3' });
  assert.deepEqual(bossCardsOf(two), ['b3', 'x']);
  const three = chainRemove(two, inManual(1, 'b3'));
  assert.deepEqual(bossCardsOf(three), ['x'], 'the card exists nowhere any more');
  assert.deepEqual(discardOf(three), []);
  assert.deepEqual(undo(three).piles, two.piles);
  assert.deepEqual(undo(two).piles, one.piles);
  assert.deepEqual(undo(one).piles, start.piles);
});

test('removing a chained beast from the board brings the next one, named by the Extra Activation in one at a time', () => {
  const board = chainStep(chainStep(powerGame(['card', 'x']), firstTwo), firstTwo);
  assert.deepEqual(boardOf(board), ['b1']);
  assert.deepEqual(bossesOf(board).revealed.a2, activation('b1'));
  assert.deepEqual(bossesOf(board).abomination.draw, ['x'], 'nothing was drawn for the Extra Activation');
  const next = chainRemove(board, OUT('b1'));
  assert.deepEqual(bossesOf(next).manual, [{ kind: 'abomination', boss: 'b2' }]);
  assert.deepEqual(bossesOf(next).revealed.a2, activation('b2'));
  assert.deepEqual(discardOf(next), []);
  assert.deepEqual(undo(next).piles, board.piles);
});

test('a chained beast sent back to the deck sends its card, not itself', () => {
  const trigger = callsAt({ a1: ['blue'] });
  const blue = chainStep(powerGame(['card', 'x']), trigger);
  const red = setDanger(blue, 'red', trigger, () => 0, chainPowers);
  assert.deepEqual(bossesOf(red).abomination, { draw: ['x'], discard: ['card'] });
  assert.deepEqual(bossCardsOf(red), ['card', 'x']);
});

test('reshuffling everything mid-chain gives the card back and restarts the chain, not after the chain ended', () => {
  const start = chainStep(powerGame(['card', 'x']));
  const mid = chainRemove(start, { from: 'step', card: 'a1', boss: 'b1' });
  const fresh = reshuffleAll(mid, () => 0, chainPowers);
  assert.deepEqual([...bossesOf(fresh).abomination.draw].sort(), ['card', 'x']);
  assert.deepEqual(boardOf(fresh), []);
  // A beast on the board goes back as its card too, once.
  const onBoard = chainStep(chainStep(powerGame(['card', 'x']), firstTwo), firstTwo);
  assert.deepEqual([...bossesOf(reshuffleAll(onBoard, () => 0, chainPowers)).abomination.draw].sort(), ['card', 'x']);
  // The chain is over: nothing to give back.
  const last = chainRemove(chainRemove(chainRemove(start, { from: 'step', card: 'a1', boss: 'b1' }), inManual(0, 'b2')), inManual(1, 'b3'));
  assert.deepEqual([...bossesOf(reshuffleAll(last, () => 0, chainPowers)).abomination.draw], ['x']);
  assert.deepEqual(undo(fresh).piles, mid.piles);
});

test('in the Fest a single boss replaces its copy on the board, which is discarded', () => {
  const start = powerGame(['sg', 'sg', 'y'], [], 1, 'fest');
  const board = chainStep(chainStep(start, everyCard), everyCard);
  assert.deepEqual(boardOf(board), []);
  assert.deepEqual(bossesOf(board).revealed.a2, { kind: 'abomination', boss: 'sg' });
  assert.deepEqual(discardOf(board), ['sg']);
  assert.deepEqual(bossCardsOf(board), ['sg', 'sg', 'y']);
  assert.deepEqual(undo(board).piles, chainStep(start, everyCard).piles);
});

test('in the Fest a single boss replaces its copy revealed earlier in the same step', () => {
  const start = powerGame(['sg', 'sg', 'y'], [], 2, 'fest');
  const state = chainStep(start, everyCard);
  const live = shownGroups(state).flatMap((group) => liveBosses(group));
  assert.deepEqual(live, ['sg'], 'one copy only');
  assert.deepEqual(bossesOf(state).revealed.a1, { kind: 'abomination', boss: 'sg', gone: ['sg'] });
  assert.deepEqual(bossesOf(state).revealed.a2, { kind: 'abomination', boss: 'sg' });
  assert.deepEqual(discardOf(state), ['sg']);
  assert.deepEqual(undo(state).piles, start.piles);
});

// Divine Beasts (real Fantasy data): the card calls the four beasts one after the other.
const fantasyPowers: BossPowers = (boss) => UNIVERSES.fantasy.bosses?.bossPowers(boss);

test('the Fantasy boss powers chain the Divine Beasts in the rulebook order and Fuma stands alone', () => {
  assert.deepEqual(fantasyPowers('divineBeast'), { kind: 'chain', first: 'vermillionBird' });
  assert.deepEqual(
    BEASTS_IN_ORDER.map((beast) => fantasyPowers(beast)),
    [
      { kind: 'chained', card: 'divineBeast', next: 'whiteTiger' },
      { kind: 'chained', card: 'divineBeast', next: 'blackTortoise' },
      { kind: 'chained', card: 'divineBeast', next: 'azureDragon' },
      { kind: 'chained', card: 'divineBeast' },
    ],
  );
  assert.deepEqual(fantasyPowers('fumaKotaro'), { kind: 'single' });
});

/** A Fantasy game whose next card calls on an Abomination deck holding only the Divine Beasts card. */
const beastsGame = () => {
  const setIds = ['blackPlague', 'divineBeasts'];
  const start = newGame(FANTASY_SETS, setIds, ALL_PARTS, () => 0, 1, 'fantasy', (cards) => tailorFantasyDeck(cards, DEFAULT_THREAT, new Set(setIds)));
  const bosses = bossesOf(start);
  return { ...start, piles: { ...start.piles, bosses: { ...bosses, rule: 'oneAtATime' as const, abomination: { draw: ['divineBeast'], discard: [] } } } };
};

test('a Fantasy save with a Divine Beast on the board is valid', () => {
  const start = beastsGame();
  const played = drawCards(start, cardEffect, () => 0, () => 'abomination', fantasyPowers);
  assert.deepEqual(bossesOf(played).revealed[played.piles.drawn[0]], { kind: 'abomination', boss: 'vermillionBird' });
  assert.ok(isValidSave(JSON.parse(JSON.stringify(played)), cardIdsOf, bossIdsOf, bossCopiesOf));
  assert.ok(isValidSave(JSON.parse(JSON.stringify(start)), cardIdsOf, bossIdsOf, bossCopiesOf));
});

test('Divine Beasts: the card reveals the Vermillion Bird, each removal brings the next beast and the card is in no pile after the Azure Dragon', () => {
  const first = drawCards(beastsGame(), cardEffect, () => 0, () => 'abomination', fantasyPowers);
  const cardId = first.piles.drawn[0];
  assert.deepEqual(bossesOf(first).revealed[cardId], { kind: 'abomination', boss: 'vermillionBird' });
  assert.deepEqual(bossesOf(first).abomination, { draw: [], discard: [] });
  const remove = (state: GameState, target: Parameters<typeof removeFromBoard>[1]) => removeFromBoard(state, target, () => 0, fantasyPowers);
  const one = remove(first, { from: 'step', card: cardId, boss: 'vermillionBird' });
  assert.deepEqual(bossesOf(one).manual, [{ kind: 'abomination', boss: 'whiteTiger' }]);
  const two = remove(one, inManual(0, 'whiteTiger'));
  assert.deepEqual(bossesOf(two).manual.at(-1), { kind: 'abomination', boss: 'blackTortoise' });
  const three = remove(two, inManual(1, 'blackTortoise'));
  assert.deepEqual(bossesOf(three).manual.at(-1), { kind: 'abomination', boss: 'azureDragon' });
  const end = remove(three, inManual(2, 'azureDragon'));
  assert.deepEqual(boardOf(end), []);
  assert.deepEqual(bossesOf(end).abomination, { draw: [], discard: [] }, 'divineBeast is in no pile');
  assert.ok(!bossCardsOf(end).includes('divineBeast'));
  assert.ok(isValidSave(JSON.parse(JSON.stringify(end)), cardIdsOf, bossIdsOf, bossCopiesOf));
});

// Escorts (Lord of Skulls with Doom and Gloom): a boss that brings others from the reserve. They have no card of
// their own: each arrives as its own group in `manual` and is never put in a pile. Made-up bosses.
const ESCORT_POWERS: Record<string, BossPower> = {
  lord: { kind: 'brings', bosses: ['doom', 'gloom'], bossKind: 'abomination' },
  lord2: { kind: 'brings', bosses: ['doom'], bossKind: 'abomination' },
  mage: { kind: 'brings', bosses: ['doom'], bossKind: 'abomination' },
  doom: { kind: 'escort' },
  gloom: { kind: 'escort' },
  vamp: { kind: 'drawOnDeath' },
};
const escortPowers: BossPowers = (boss) => ESCORT_POWERS[boss];
const callsNecro = (...cards: string[]): BossTrigger => (id) => (cards.includes(id) ? 'necromancer' : undefined);
const callsAbom = (...cards: string[]): BossTrigger => (id) => (cards.includes(id) ? 'abomination' : undefined);
const mixed = (necro: string[], abomination: string[]): BossTrigger => (id) => (necro.includes(id) ? 'necromancer' : abomination.includes(id) ? 'abomination' : undefined);
const escortGame = (necromancer: string[], abomination: string[] = ['x'], zones = 1, rule: BossRule = 'oneAtATime') => {
  const start = powerGame(abomination, [], zones, rule);
  const bosses = bossesOf(start);
  return { ...start, piles: { ...start.piles, bosses: { ...bosses, necromancer: { draw: necromancer, discard: [] } } } };
};
const escortStep = (state: GameState, trigger: BossTrigger) => drawCards(state, undefined, () => 0, trigger, escortPowers);
const escortRemove = (state: GameState, target: Parameters<typeof removeFromBoard>[1]) => removeFromBoard(state, target, () => 0, escortPowers);
const abom = (boss: string) => ({ kind: 'abomination', boss });
const withBoard = (state: GameState, boss: string): GameState => ({
  ...state,
  piles: { ...state.piles, bosses: { ...bossesOf(state), onBoard: [{ kind: 'abomination', boss }] } },
});
const everywhere = (state: GameState) => bossCardsOf(state);
const A_IDS = () => new Set(['a1', 'a2', 'a3']);

test('a boss that brings escorts reveals each as its own group, with no pile touched', () => {
  const start = escortGame(['lord']);
  const state = escortStep(start, callsNecro('a1'));
  assert.deepEqual(bossesOf(state).revealed.a1, { kind: 'necromancer', boss: 'lord' });
  assert.deepEqual(bossesOf(state).manual, [abom('doom'), abom('gloom')]);
  assert.deepEqual(bossesOf(state).abomination, { draw: ['x'], discard: [] });
  assert.deepEqual(bossesOf(state).necromancer, { draw: [], discard: [] });
  assert.deepEqual(undo(state).piles, start.piles);
});

test('escorts are brought by hand too, and removing one by its manual index leaves the others', () => {
  const start = escortGame([], ['mage', 'x']);
  const state = drawAbomination(start, () => 0, escortPowers);
  assert.deepEqual(bossesOf(state).manual, [abom('mage'), abom('doom')]);
  assert.deepEqual(undo(state).piles, start.piles);
  const out = escortRemove(state, inManual(1, 'doom'));
  assert.deepEqual(bossesOf(out).manual[1], { kind: 'abomination', boss: 'doom', gone: ['doom'] });
  assert.deepEqual(bossesOf(out).abomination, { draw: ['x'], discard: [] }, 'an escort is not discarded');
  assert.deepEqual(liveBosses(bossesOf(out).manual[0]), ['mage']);
  assert.deepEqual(undo(out).piles, state.piles);
});

test('in one at a time a later Abomination card gives the escorts the Extra Activation and draws nothing', () => {
  const state = escortStep(escortGame(['lord'], ['x'], 2), mixed(['a1'], ['a2']));
  assert.deepEqual(bossesOf(state).revealed.a2, { kind: 'abomination', boss: NO_BOSS, activates: 'doom' });
  assert.deepEqual(bossesOf(state).abomination, { draw: ['x'], discard: [] });
});

test('a bringer only named for an Extra Activation brings nothing', () => {
  const state = escortStep(escortGame(['lord'], ['x'], 2), callsNecro('a1', 'a2'));
  assert.deepEqual(bossesOf(state).revealed.a2, { kind: 'necromancer', boss: NO_BOSS, activates: 'lord' });
  assert.deepEqual(bossesOf(state).manual, [abom('doom'), abom('gloom')]);
  // Same from a bringer already on the board: the next step names it and the escorts stay as they were.
  const next = escortStep(escortStep(escortGame(['lord'], ['x'], 1), callsNecro('a1')), callsNecro('a2'));
  assert.deepEqual(bossesOf(next).revealed.a2, { kind: 'necromancer', boss: NO_BOSS, activates: 'lord' });
  assert.deepEqual(bossesOf(next).manual, []);
  assert.deepEqual(boardOf(next), ['lord', 'doom', 'gloom']);
});

test('in the Fest the escorts arrive beside the bringer and are named by later cards, with no duplicate', () => {
  const state = escortStep(escortGame(['lord'], ['x'], 2, 'fest'), mixed(['a1'], ['a2']));
  assert.deepEqual(bossesOf(state).revealed.a2, { kind: 'abomination', boss: 'x', activated: ['doom', 'gloom'] });
  // A second bringer, doom being there already, brings nothing.
  const second = escortStep(escortGame(['lord', 'lord2'], ['x'], 2, 'fest'), callsNecro('a1', 'a2'));
  assert.deepEqual(bossesOf(second).revealed.a2, { kind: 'necromancer', boss: 'lord2', activated: ['lord'] });
  assert.deepEqual(bossesOf(second).manual, [abom('doom'), abom('gloom')]);
});

test('only the escort that is missing arrives when another is still on the board', () => {
  const state = escortStep(withBoard(escortGame(['lord']), 'doom'), callsNecro('a1'));
  assert.deepEqual(bossesOf(state).manual, [abom('gloom')]);
  assert.deepEqual(boardOf(state), ['doom']);
});

test('the bringer removed leaves its escorts in play; a removed escort comes back with the next reveal', () => {
  const state = escortStep(escortGame(['lord']), callsNecro('a1'));
  const lordOut = escortRemove(state, { from: 'step', card: 'a1', boss: 'lord' });
  assert.deepEqual(bossesOf(lordOut).manual.flatMap(liveBosses), ['doom', 'gloom']);
  assert.deepEqual(bossesOf(lordOut).necromancer.discard, ['lord']);
  assert.deepEqual(undo(lordOut).piles, state.piles);
  const doomOut = escortRemove(lordOut, inManual(0, 'doom'));
  assert.deepEqual(bossesOf(doomOut).abomination.discard, [], 'no escort in the discard');
  // New step: gloom goes to the board, the lord comes back from the reshuffled discard and brings doom only.
  const again = escortStep(doomOut, callsNecro('a2'));
  assert.deepEqual(boardOf(again), ['gloom']);
  assert.deepEqual(bossesOf(again).manual, [abom('doom')]);
  assert.deepEqual(undo(again).piles, doomOut.piles);
});

test('a new Spawn step moves the escorts to the board, where each is removed on its own without a discard', () => {
  const state = escortStep(escortStep(escortGame(['lord']), callsNecro('a1')), callsAbom());
  assert.deepEqual(boardOf(state), ['lord', 'doom', 'gloom']);
  assert.deepEqual(bossesOf(state).manual, []);
  const oneOut = escortRemove(state, OUT('doom'));
  const out = escortRemove(oneOut, OUT('gloom'));
  assert.deepEqual(boardOf(out), ['lord']);
  assert.deepEqual(bossesOf(out).abomination, { draw: ['x'], discard: [] });
  assert.deepEqual(undo(out).piles, oneOut.piles);
});

test('a bringer sent back to the deck takes the escorts it brought, not the ones already on the board', () => {
  const trigger: BossTrigger = (id, danger) => (id === 'a1' && danger === 'blue' ? 'necromancer' : undefined);
  const played = escortStep(escortGame(['lord']), trigger);
  const back = setDanger(played, 'yellow', trigger, () => 0, escortPowers);
  assert.deepEqual(bossesOf(back).manual, []);
  assert.deepEqual(bossesOf(back).necromancer.discard, ['lord']);
  assert.deepEqual(bossCardsOf(back), ['lord', 'x']);
  const partial = setDanger(escortStep(withBoard(escortGame(['lord']), 'doom'), trigger), 'yellow', trigger, () => 0, escortPowers);
  assert.deepEqual(bossesOf(partial).manual, []);
  assert.deepEqual(boardOf(partial), ['doom']);
});

test('a bringer sent back to the deck leaves no escort in the Extra Activations of the Fest or one at a time', () => {
  const trigger: BossTrigger = (id, danger) => (id === 'a1' && danger === 'blue' ? 'necromancer' : id === 'a2' ? 'abomination' : undefined);
  const fest = setDanger(escortStep(escortGame(['lord'], ['x'], 2, 'fest'), trigger), 'yellow', trigger, () => 0, escortPowers);
  assert.deepEqual(bossesOf(fest).revealed.a2, { kind: 'abomination', boss: 'x' });
  const one = setDanger(escortStep(escortGame(['lord'], ['x'], 2), trigger), 'yellow', trigger, () => 0, escortPowers);
  // With no escort left to name, the card draws its own Abomination.
  assert.deepEqual(bossesOf(one).revealed.a2, { kind: 'abomination', boss: 'x' });
  assert.ok(isValidSave(JSON.parse(JSON.stringify(one)), A_IDS));
});

test('reshuffling everything drops the escorts, on display or on the board, and keeps the others', () => {
  const state = escortStep(escortStep(escortGame(['lord']), callsNecro('a1')), callsNecro('a2'));
  assert.deepEqual(boardOf(state), ['lord', 'doom', 'gloom']);
  const fresh = reshuffleAll(state, () => 0, escortPowers);
  assert.deepEqual(everywhere(fresh), ['lord', 'x']);
  assert.deepEqual(bossesOf(fresh).manual, []);
  assert.deepEqual(undo(fresh).piles, state.piles);
  const mid = reshuffleAll(escortStep(escortGame(['lord']), callsNecro('a1')), () => 0, escortPowers);
  assert.deepEqual(everywhere(mid), ['lord', 'x']);
});

test('a save holding escorts on display and on the board is valid, and the version is unchanged', () => {
  const state = escortStep(escortStep(escortGame(['lord']), callsNecro('a1')), callsNecro('a2'));
  assert.ok(isValidSave(JSON.parse(JSON.stringify(state)), A_IDS));
  assert.ok(isValidSave(JSON.parse(JSON.stringify(escortStep(escortGame(['lord']), callsNecro('a1')))), A_IDS));
  assert.equal(state.version, 8);
});

test('newGroups names the escorts a bringer brought, after the bringer revealed by a card or by hand', () => {
  const start = escortGame(['lord']);
  const dealt = escortStep(start, callsNecro('a1'));
  assert.deepEqual(newGroups(bossesOf(start), bossesOf(dealt), 'manual'), [abom('doom'), abom('gloom')]);
  assert.deepEqual(newGroups(bossesOf(start), bossesOf(dealt), 'all').map((group) => group.boss), ['lord', 'doom', 'gloom']);
  const byHand = drawAbomination(escortGame([], ['mage', 'x']), () => 0, escortPowers);
  assert.deepEqual(newGroups(bossesOf(escortGame([], ['mage', 'x'])), bossesOf(byHand), 'manual').map((group) => group.boss), ['mage', 'doom']);
});

test('newGroups at a new Spawn step ignores what was released and finds the same escort again', () => {
  const first = escortStep(escortGame(['lord', 'lord']), callsNecro('a1'));
  const second = escortStep(first, callsNecro('a2'));
  // Doom and Gloom of the first step went to the board, so none arrives again.
  assert.deepEqual(newGroups({ ...bossesOf(first), manual: [] }, bossesOf(second), 'manual'), []);
  // Without Doom on the board (removed), the same Doom arrives again: new once the release is accounted for.
  const dealtAgain = escortStep(escortGame(['lord', 'lord']), callsNecro('a1'));
  const doomOut = escortRemove(escortRemove(escortRemove(dealtAgain, { from: 'step', card: 'a1', boss: 'lord' }), inManual(0, 'doom')), inManual(1, 'gloom'));
  const again = escortStep(doomOut, callsNecro('a2'));
  assert.deepEqual(newGroups({ ...bossesOf(doomOut), manual: [] }, bossesOf(again), 'manual').map((group) => group.boss), ['doom', 'gloom']);
});

test('newGroups says nothing when a level is picked again or a rebuilt Extra Activation is the same', () => {
  const state = escortStep(escortGame(['lord'], ['x'], 2), mixed(['a1'], ['a2']));
  const same = setDanger(state, state.danger, mixed(['a1'], ['a2']), () => 0, escortPowers);
  assert.deepEqual(newGroups(bossesOf(state), bossesOf(same), 'all'), []);
  const rebuilt = { ...bossesOf(state), revealed: Object.fromEntries(Object.entries(bossesOf(state).revealed).map(([card, group]) => [card, { ...group }])), manual: bossesOf(state).manual.map((group) => ({ ...group })) };
  assert.deepEqual(newGroups(bossesOf(state), rebuilt, 'all'), []);
});

test('newGroups finds a boss replaced (Fuma Kotaro) and a chained beast, even when a group left', () => {
  const before: BossPiles = { ...bossesOf(escortGame([])), manual: [abom('a'), abom('b')] as Revealed[] };
  const replaced: BossPiles = { ...before, manual: [abom('b'), abom('c')] as Revealed[] };
  assert.deepEqual(newGroups(before, replaced, 'manual'), [abom('c')]);
});

test('newGroups after a removal says nothing about the group itself, nor when the removal is undone', () => {
  const state = escortStep(escortGame(['lord']), callsNecro('a1'));
  const removed = escortRemove(state, inManual(0, 'doom'));
  // A removal makes the group shorter, not new: its own card is not read out again.
  assert.deepEqual(newGroups(bossesOf(state), bossesOf(removed), 'manual'), []);
  assert.deepEqual(newGroups(bossesOf(removed), bossesOf(undo(removed)), 'manual'), [], 'the same group, whole again');
});

// Real Fantasy data: the Lord of Skulls brings Doom and Gloom, which have no card of their own.
test('the Lord of Skulls brings Doom and Gloom as Abominations, which are escorts with one copy each', () => {
  assert.deepEqual(fantasyPowers('lordOfSkulls'), { kind: 'brings', bosses: ['doom', 'gloom'], bossKind: 'abomination' });
  assert.deepEqual(fantasyPowers('doom'), { kind: 'escort' });
  assert.deepEqual(fantasyPowers('gloom'), { kind: 'escort' });
  assert.equal(UNIVERSES.fantasy.bosses?.copies.get('doom'), 1);
  assert.equal(UNIVERSES.fantasy.bosses?.copies.get('gloom'), 1);
  assert.ok(FANTASY_BOSS_IDS.has('doom') && FANTASY_BOSS_IDS.has('gloom'));
});

test('a Fantasy save refuses Doom twice (by hand and on the board) and accepts it once', () => {
  const start = beastsGame();
  const withDoom = (manual: { kind: 'abomination'; boss: string }[], onBoard: { kind: 'abomination'; boss: string }[]): GameState => ({
    ...start,
    piles: { ...start.piles, bosses: { ...bossesOf(start), manual, onBoard } },
  });
  const doom = { kind: 'abomination' as const, boss: 'doom' };
  const once = withDoom([doom], []);
  assert.ok(isValidSave(JSON.parse(JSON.stringify(once)), cardIdsOf, bossIdsOf, bossCopiesOf));
  assert.ok(isValidSave(JSON.parse(JSON.stringify(withDoom([], [doom]))), cardIdsOf, bossIdsOf, bossCopiesOf));
  const twice = withDoom([doom], [doom]);
  assert.equal(isValidSave(JSON.parse(JSON.stringify(twice)), cardIdsOf, bossIdsOf, bossCopiesOf), false);
});

test('newGroups after the removal of a boss of Alpha Vampire reads out only the newcomer it draws', () => {
  const start = escortGame([], ['vamp', 'x']);
  const state = drawAbomination(start, () => 0, escortPowers);
  const dead = escortRemove(state, inManual(0, 'vamp'));
  assert.deepEqual(newGroups(bossesOf(state), bossesOf(dead), 'manual'), [abom('x')]);
});

test('newGroups after a chained beast is removed reads out only the next beast, a Fest removal nothing', () => {
  const beast = (boss: string, gone?: string[]): Revealed => ({ kind: 'abomination', boss, ...(gone && { gone }) });
  const piles = (manual: Revealed[]): BossPiles => ({ ...bossesOf(escortGame([])), manual });
  assert.deepEqual(newGroups(piles([beast('tiger')]), piles([beast('tiger', ['tiger']), beast('tortoise')]), 'manual'), [beast('tortoise')]);
  // Fest: the removed boss leaves the Extra Activation list, and the group left with none says so.
  const fest = (group: Revealed) => piles([group]);
  const activation: Revealed = { kind: 'abomination', boss: NO_BOSS, activated: ['doom'] };
  assert.deepEqual(newGroups(fest(activation), fest({ kind: 'abomination', boss: NO_BOSS, none: true }), 'manual'), []);
  assert.deepEqual(newGroups(fest({ ...activation, activated: ['doom', 'gloom'] }), fest({ ...activation, activated: ['gloom'] }), 'manual'), []);
});

test('newGroups still reads out an Extra Activation that now names another boss (a Danger Level change)', () => {
  const piles = (activates: string): BossPiles => ({ ...bossesOf(escortGame([])), manual: [{ kind: 'abomination', boss: NO_BOSS, activates }] });
  assert.deepEqual(newGroups(piles('doom'), piles('gloom'), 'manual'), [{ kind: 'abomination', boss: NO_BOSS, activates: 'gloom' }]);
  assert.deepEqual(newGroups(piles('doom'), piles('doom'), 'manual'), []);
});

test('the constants makeStyles reads are declared before its first call (the card style context, at load)', () => {
  const source = readFileSync(new URL('../components/card-face.tsx', import.meta.url), 'utf8');
  const firstCall = source.indexOf('makeStyles(1)');
  const body = source.slice(source.indexOf('function makeStyles('));
  assert.ok(firstCall > 0 && body.length < source.length);
  const late = [...source.matchAll(/^const ([A-Z][A-Z0-9_]*)\b/gm)]
    .filter((match) => match.index > firstCall && new RegExp(`\\b${match[1]}\\b`).test(body))
    .map((match) => match[1]);
  assert.deepEqual(late, []);
});

test('wrappedLines breaks between words only, one paragraph per line', () => {
  assert.equal(wrappedLines('All Walkers', 11), 1);
  assert.equal(wrappedLines('All Walkers', 10), 2);
  assert.equal(wrappedLines('one two three', 7), 2);
  assert.equal(wrappedLines('one\ntwo', 20), 2);
  assert.equal(wrappedLines('Walkers', 6), Infinity);
});

test('modernTextSize takes the largest size that fits, never under the minimum', () => {
  const box = { width: 100, height: 40, max: 20, min: 8, line: 1, charEm: 0.5 };
  assert.equal(modernTextSize('short', box), 20);
  // Ten characters on a line at 20: two lines, which is what the height holds.
  assert.equal(modernTextSize('eight chrs eight chrs', box), 20);
  // On one line it has to shrink to 100 / (0.5 * 21) = 9.5.
  assert.equal(modernTextSize('eight chrs eight chrs', { ...box, lines: 1 }), 9.5);
  // A word that fits at no size, or a text too long for the box: the minimum.
  assert.equal(modernTextSize('x'.repeat(60), box), 8);
  assert.equal(modernTextSize('word '.repeat(200), box), 8);
  for (const text of ['Visiteurs importants putréfiés', 'Все ветхие ходоки', 'Wszystkie Obdarte Szwendacze']) {
    const size = modernTextSize(text, { ...box, lines: 2 });
    assert.ok(size >= box.min && size <= box.max, `${text}: ${size}`);
    if (size > box.min) assert.ok(wrappedLines(text, Math.floor(box.width / (box.charEm * size))) <= 2, text);
  }
});

test('the pictures of a zombie alternate with the printed card numbers', () => {
  const cards = CARD_SETS.flatMap((set) => set.cards).filter((card) => card.kind !== 'extra' && 'zombie' in card && card.zombie === 'toxicWalker');
  assert.deepEqual(cards.map((card) => [card.id, variantFor(card, ['jacket', 'sunglasses'])]), [
    ['toxic-087', 'sunglasses'],
    ['toxic-088', 'jacket'],
    ['toxic-089', 'sunglasses'],
    ['toxic-090', 'jacket'],
    ['toxic-091', 'sunglasses'],
    ['toxic-092', 'jacket'],
  ]);
});

// Danny Trejo: a Trejo card turns into a Trejobomination in three steps (spawn, transform, activate).
const trejoSets: CardSet[] = [
  {
    id: 't',
    optional: false,
    isHard: () => false,
    cards: [
      { id: 't1', setId: 't', kind: 'trejo' },
      { id: 't2', setId: 't', kind: 'trejo' },
      { id: 't3', setId: 't', kind: 'trejoRush' },
      { id: 'f1', setId: 't', kind: 'spawn', zombie: 'walker', counts: [1, 1, 1, 1] },
      { id: 'f2', setId: 't', kind: 'spawn', zombie: 'walker', counts: [1, 1, 1, 1] },
    ],
  },
];
const isTrejo = (id: string) => /^t\d$/.test(id);
const trejoGame = (order: string[], zones = 1): GameState => {
  const state = newGame(trejoSets, ['t'], ALL_PARTS, () => 0, zones);
  return { ...state, piles: { ...state.piles, draw: order } };
};
const dealt = (state: GameState) => drawCards(state, undefined, () => 0.99, undefined, undefined, isTrejo);
const dealtOne = (state: GameState) => drawNextCard(state, undefined, () => 0.99, undefined, undefined, isTrejo);

test('Trejo cards spawn a Walker, turn it into a Trejobomination, then activate it, one step after the other', () => {
  let state = trejoGame(['t1', 't2', 't3', 'f1']);
  assert.deepEqual(state.piles.trejo, { stage: 'none', resolved: {} });
  assert.equal(state.piles.bosses, null);
  state = dealt(state);
  assert.deepEqual(state.piles.trejo, { stage: 'walker', resolved: { t1: 3 } });
  state = dealt(state);
  assert.deepEqual(state.piles.trejo, { stage: 'abomination', resolved: { t2: 2 } });
  state = dealt(state);
  assert.deepEqual(state.piles.trejo, { stage: 'abomination', resolved: { t3: 1 } });
  state = dealt(state);
  assert.deepEqual(state.piles.trejo, { stage: 'abomination', resolved: {} }, 'the Trejobomination stays until it is removed');
});

test('three Trejo cards of one step resolve in zone order, 3 then 2 then 1', () => {
  const state = dealt(trejoGame(['t1', 't2', 't3', 'f1'], 3));
  assert.deepEqual(state.piles.trejo, { stage: 'abomination', resolved: { t1: 3, t2: 2, t3: 1 } });
});

test('one zone at a time, each Trejo card resolves when it is dealt and the next step clears them', () => {
  let state = trejoGame(['t1', 'f1', 't2', 'f2'], 3);
  state = dealtOne(state);
  assert.deepEqual(state.piles.trejo, { stage: 'walker', resolved: { t1: 3 } });
  state = dealtOne(state);
  assert.deepEqual(state.piles.trejo, { stage: 'walker', resolved: { t1: 3 } });
  state = dealtOne(state);
  assert.deepEqual(state.piles.trejo, { stage: 'abomination', resolved: { t1: 3, t2: 2 } });
  state = dealtOne(state);
  assert.deepEqual(state.piles.trejo, { stage: 'abomination', resolved: {} });
});

test('undo restores the Trejo stage after a draw and after removing the Trejobomination', () => {
  const start = trejoGame(['t1', 't2', 'f1']);
  const first = dealt(start);
  const second = dealt(first);
  assert.deepEqual(undo(second).piles.trejo, first.piles.trejo);
  const removed = removeTrejo(second);
  assert.deepEqual(removed.piles.trejo, { stage: 'none', resolved: { t2: 2 } }, 'the card on display keeps its resolution');
  assert.deepEqual(undo(removed).piles.trejo, second.piles.trejo);
  assert.equal(removed.history.length, second.history.length + 1);
  assert.deepEqual(undo(undo(second)).piles.trejo, start.piles.trejo);
});

test('after the Trejobomination is removed, the next Trejo card spawns a Walker again', () => {
  const state = dealt(removeTrejo(dealt(dealt(trejoGame(['t1', 't2', 't3', 'f1'])))));
  assert.deepEqual(state.piles.trejo, { stage: 'walker', resolved: { t3: 3 } });
});

test('the Trejo stage survives an automatic reshuffle and a deck shuffle, not a full reshuffle', () => {
  let state = dealt(trejoGame(['t1', 'f1']));
  state = { ...state, piles: { ...state.piles, draw: [], discard: ['f2'] } };
  state = dealt(state);
  assert.equal(state.piles.reshuffled, true);
  assert.deepEqual(state.piles.trejo, { stage: 'walker', resolved: {} });
  assert.equal(shuffleDeck(state).piles.trejo.stage, 'walker');
  assert.equal(setDanger(state, 'red').piles.trejo.stage, 'walker');
  assert.deepEqual(reshuffleAll(state).piles.trejo, { stage: 'none', resolved: {} });
  const shown = reshuffleAll(dealt(trejoGame(['t1', 'f1'])));
  assert.deepEqual(shown.piles.trejo, { stage: 'none', resolved: {} });
});

test('Trejo cards are told apart by their kind', () => {
  assert.equal(isTrejoCard('trejo-081'), true);
  assert.equal(isTrejoCard('trejo-086'), true);
  assert.equal(isTrejoCard('core2e-001'), false);
  assert.equal(isTrejoCard('unknown'), false);
});

test('a save with a wrong Trejo field is rejected, in the game and in its history', () => {
  const known = () => new Set(['t1', 't2', 't3', 'f1', 'f2']);
  const base = dealt(dealt(trejoGame(['t1', 't2', 'f1'])));
  const copy = () => JSON.parse(JSON.stringify(base));
  assert.equal(base.version, 8);
  assert.ok(isValidSave(copy(), known));
  assert.equal(isValidSave({ ...copy(), version: 7 }, known), false, 'the old game is rejected');
  const broken = (change: (trejo: any) => void, where: 'piles' | 'history' = 'piles') => {
    const save = copy();
    change(where === 'piles' ? save.piles.trejo : save.history[0].trejo);
    return isValidSave(save, known);
  };
  for (const where of ['piles', 'history'] as const) {
    assert.equal(broken((t) => (t.stage = 'dragon'), where), false, where);
    assert.equal(broken((t) => delete t.stage, where), false, where);
    assert.equal(broken((t) => (t.resolved = null), where), false, where);
    assert.equal(broken((t) => (t.resolved.f2 = 1), where), false, `${where}: a card not on display`);
    assert.equal(broken((t) => (t.resolved = { t1: 4 }), where), false, where);
    assert.equal(broken((t) => (t.resolved = { t1: 0 }), where), false, where);
    assert.equal(broken((t) => (t.resolved = { t1: 1.5 }), where), false, where);
  }
  const noTrejo = copy();
  delete noTrejo.piles.trejo;
  assert.equal(isValidSave(noTrejo, known), false);
  const noHistoryTrejo = copy();
  delete noHistoryTrejo.history[0].trejo;
  assert.equal(isValidSave(noHistoryTrejo, known), false);
});
