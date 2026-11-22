import { useKeepAwake } from 'expo-keep-awake';
import { Redirect, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBackground } from '@/components/app-background';
import { Button } from '@/components/button';
import { CardBack } from '@/components/card-back';
import { BossFace, bossHasBack, CardAnnounced, bossLabel, CardFace, cardHasBack, cardLabel, isGone, type Reveal } from '@/components/card-face';
import { abominationName, ChoiceSheet } from '@/components/choice-sheet';
import { DiscardSheet } from '@/components/discard-sheet';
import { FlipCard } from '@/components/flip-card';
import { scrolledRecently } from '@/components/scroll-guard';
import { ZoomButton } from '@/components/zoom-button';
import { bossTrigger, CARDS_BY_ID, cardEffect, UNIVERSES } from '@/data/universes';
import {
  chooseGained,
  DANGER_LEVELS,
  drawAbomination,
  drawCards,
  drawNextCard,
  liveBosses,
  MAX_ZONES,
  newGroups,
  noPowers,
  pendingChoice,
  pendingZones,
  removeFromBoard,
  reshuffleAll,
  setDanger,
  setZones,
  shuffleDeck,
  startsNewStep,
  undo,
  zonesOf,
} from '@/game/engine';
import type { BossTarget } from '@/game/engine';
import { drawFeedback } from '@/game/feedback';
import { countDraw } from '@/game/review';
import { useApp } from '@/game/store';
import type { BossKind, BossRule, DangerLevel, GameState, Revealed, ZombieCard } from '@/game/types';
import type { Translate } from '@/i18n/translations';
import { COLORS, DANGER_COLORS, PRESSED } from '@/theme';

const CARD_RATIO = 63 / 88;
const TABLE_GAP = 16;
/** Height of the "Zone 2" line above each card, once there is more than one Spawn Zone. */
const ZONE_LABEL = 22;
/** Height of the zone line above the card when the zones are dealt one at a time. */
const SEQUENCE_HEADER = 48;
/** Below this width the cards stop shrinking on one row: they go on several rows, or the row scrolls. */
const MIN_CARD_WIDTH = 150;
/** Smallest cards on several rows (the zombie counts stay readable); below it, one row that scrolls. */
const MIN_GRID_WIDTH = 95;
/** Share of the screen height a card takes once tapped to be read up close. */
const ZOOM_HEIGHT = 0.9;
/** Distance of the close button of the enlarged card from the edges of the screen (plus the safe area). */
const CLOSE_MARGIN = 12;
/** Side of the close button of the enlarged card: a large target, the phone lies on a table. */
const CLOSE_SIZE = 44;
/** Time to tap "Reshuffle all" a second time before it goes back to normal. */
const CONFIRM_MS = 3000;
/** Wait before Gozer's choice opens: the card flips (260 ms) and is read out first, so the players see Gozer arrive. */
const CHOICE_DELAY_MS = 700;
/** Share of its colours a card keeps once the players removed its boss from the board. */
const GONE_OPACITY = 0.4;
/** Smallest a board button gets: room for the name on two lines and the action line, a large target for a phone on a table. */
const BOARD_BUTTON_MIN_HEIGHT = 56;
/** Border of the framed "On the board" panel: thick enough to catch the eye from across a table. */
const BOARD_FRAME_WIDTH = 2;
/** Size of the "On the board" heading: larger than the other headings so the panel reads from across the table. */
const BOARD_HEADING_SIZE = 15;
/** Letter spacing of that heading, which is in capitals. */
const BOARD_HEADING_SPACING = 1;
/** Size of a boss name on the board: big enough to read at table distance. */
const BOARD_NAME_SIZE = 17;
/** Width of the coloured bar that tells a Necromancer from an Abomination on a board button. */
const KIND_BAR_WIDTH = 6;

export default function GameScreen() {
  const { game, setGame, haptics, zoneDisplay, t } = useApp();
  const drawnKey = game?.piles.drawn.join('|') ?? '';
  // The phone lies on the table for the whole game: keep the screen on.
  useKeepAwake();

  const [table, setTable] = useState({ width: 0, height: 0 });
  const [flip] = useState(() => new Animated.Value(1));
  // Restarted once the table is measured too: the cards may move to a grid then, and on web the remounted cards
  // would miss an animation already under way and stay edge-on.
  const measured = table.width > 0;
  useEffect(() => {
    flip.setValue(0);
    Animated.timing(flip, { toValue: 1, duration: 260, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [drawnKey, measured, flip]);

  // Shakes the deck for a moment each time it is shuffled.
  const [shuffles, setShuffles] = useState(0);
  const [shake] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (shuffles === 0) return;
    shake.setValue(0);
    Animated.timing(shake, { toValue: 1, duration: 450, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [shuffles, shake]);

  // Reshuffling everything breaks the game's rhythm: it takes a second tap, undo can still bring the cards back.
  const [confirmingShuffle, setConfirmingShuffle] = useState(false);
  useEffect(() => {
    if (!confirmingShuffle) return;
    const timer = setTimeout(() => setConfirmingShuffle(false), CONFIRM_MS);
    return () => clearTimeout(timer);
  }, [confirmingShuffle]);

  // A boss leaves the board on a second tap, like "Reshuffle all": the key of the button waiting for it.
  const [confirmingRemove, setConfirmingRemove] = useState('');
  useEffect(() => {
    if (!confirmingRemove) return;
    const timer = setTimeout(() => setConfirmingRemove(''), CONFIRM_MS);
    return () => clearTimeout(timer);
  }, [confirmingRemove]);

  const [showDiscard, setShowDiscard] = useState(false);
  // One zone at a time: the card looked at, the last one dealt unless a zone above it was tapped since.
  const [viewed, setViewed] = useState<{ step: string; index: number } | null>(null);
  // Several cards side by side are small: one tapped is shown full screen, until the next draw.
  const [zoomed, setZoomed] = useState<{ step: string; index: number } | null>(null);
  // The cards turned over to their back (by position), until the next draw: each card has its own side.
  const [flips, setFlips] = useState<{ step: string; open: readonly number[] }>({ step: '', open: [] });
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Focus stays on the deck after a draw: without an announcement, a screen reader would not say the new cards. The
  // cards on display when the screen opens are not announced; an undo announces the cards it brings back.
  const sequence = zoneDisplay === 'sequence';
  const drawnCards = game?.piles.drawn;
  const announced = useRef(drawnCards);
  // Set by `draw` (never by an undo): whether the deal opened a new Spawn step, so the escorts it brought get read out.
  const dealtRef = useRef<{ fresh: boolean } | null>(null);
  // The boss piles of the previous render, to tell what a deal brought.
  const bossPiles = game?.piles.bosses;
  const previousBossesRef = useRef(bossPiles);
  const currentDanger = game?.danger;
  const zoneCount = game?.zones;
  const revealed = game?.piles.bosses?.revealed;
  const bossRule = game?.bossRule;
  // Gozer's choice opens by itself; closing it leaves the choice pending, tapping Gozer's card opens it again.
  const pending = game ? pendingChoice(game) : undefined;
  // The key is the choice itself (where it lives and the cards it offers): drawing or undoing something else leaves
  // a closed sheet closed, while a new or restored choice opens it.
  const pendingKey = pending && game ? `${pendingPlace(game)}|${pending.boss}|${pending.offered.join('|')}` : '';
  const pendingBoss = pending?.boss ?? '';
  const pendingKeep = pending?.keep ?? 0;
  const [dismissed, setDismissed] = useState('');
  // The choice whose sheet may show: set once the delay is over.
  const [opened, setOpened] = useState('');
  // Once the choice is made (or undone away) a later one offering the same cards must open again.
  if (!pendingKey && (dismissed || opened)) {
    setDismissed('');
    setOpened('');
  }
  // Says why the sheet opens, once the drawn card has been read out.
  useEffect(() => {
    if (!pendingKey || opened === pendingKey) return;
    const timer = setTimeout(() => {
      setOpened(pendingKey);
      if (Platform.OS !== 'web') {
        AccessibilityInfo.announceForAccessibility(t('boss.drawnChoose', { name: abominationName(pendingBoss, t), count: pendingKeep }));
      }
    }, CHOICE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [pendingKey, opened, pendingBoss, pendingKeep, t]);
  useEffect(() => {
    if (drawnCards === announced.current) return;
    announced.current = drawnCards;
    if (Platform.OS === 'web') dealtRef.current = null;
    if (!drawnCards?.length || !currentDanger || !zoneCount || Platform.OS === 'web') return;
    const reveal = revealOf(revealed, bossRule);
    // One announcement: the cards, then the escorts a bringer brought (set by `draw`, never by an undo).
    // The groups of `manual` that the deal added, from the state actually applied: a new Spawn step moves the previous
    // ones to the board first, so they are not counted as before.
    const dealt = dealtRef.current;
    dealtRef.current = null;
    const before = dealt?.fresh && previousBossesRef.current ? { ...previousBossesRef.current, manual: [] } : previousBossesRef.current;
    const escorts = dealt && bossRule ? newGroups(before, bossPiles, 'manual').map((group) => bossLabel(groupReveal(group, bossRule), t)) : [];
    AccessibilityInfo.announceForAccessibility([announcement(drawnCards, currentDanger, zoneCount, sequence, t, reveal), ...escorts].join(' '));
  }, [drawnCards, currentDanger, zoneCount, sequence, t, revealed, bossRule, bossPiles]);
  useEffect(() => {
    previousBossesRef.current = bossPiles;
  });

  if (!game) return <Redirect href="/menu" />;

  const update = (change: (state: GameState) => GameState) =>
    setGame((state) => (state ? change(state) : state));

  const { danger, zones } = game;
  const { drawn } = game.piles;
  const cardZones = zonesOf(drawn, cardEffect, zones);
  const rotateY = flip.interpolate({ inputRange: [0, 1], outputRange: ['90deg', '0deg'] });
  const shakeSteps = [0, 0.2, 0.4, 0.6, 0.8, 1];
  const deckShake = {
    transform: [
      { translateX: shake.interpolate({ inputRange: shakeSteps, outputRange: [0, -10, 10, -6, 6, 0] }) },
      { rotate: shake.interpolate({ inputRange: shakeSteps, outputRange: ['0deg', '-4deg', '4deg', '-2deg', '2deg', '0deg'] }) },
    ],
  };
  const shuffleWith = (change: (state: GameState) => GameState) => {
    update(change);
    setShuffles((count) => count + 1);
  };
  const bossDecks = UNIVERSES[game.universe].bosses;
  // Without the powers of the era's bosses, SPAM, Gozer and Batman Who Laughs would do nothing.
  const bossPowers = bossDecks?.bossPowers ?? noPowers;
  // Abominations drawn by hand, each with its reveal; they only exist with a boss rule (boss decks and rule go together).
  const manualRule = game.bossRule;
  const manualGroups = manualRule
    ? (game.piles.bosses?.manual ?? []).map((group) => ({ group, reveal: groupReveal(group, manualRule) }))
    : [];
  const extra = manualGroups.length;
  const deal = (state: GameState) =>
    sequence
      ? drawNextCard(state, cardEffect, Math.random, bossTrigger, bossPowers)
      : drawCards(state, cardEffect, Math.random, bossTrigger, bossPowers);
  const reopenChoice = () => setDismissed('');
  const abominationDeck = game.piles.bosses?.abomination;
  const board = bossesInPlay(game);
  const removeBoss = (entry: BoardEntry) => {
    if (confirmingRemove !== entry.key) {
      setConfirmingRemove(entry.key);
      return;
    }
    setConfirmingRemove('');
    const next = removeFromBoard(game, entry.target, Math.random, bossPowers);
    if (next === game) return;
    if (haptics) drawFeedback();
    update(() => next);
    // A removed beast of a chain brings the next one by hand (and a bringer's escorts come with it): the removal and
    // what arrived go in ONE announcement, since consecutive ones cut each other off.
    say([t('boss.removed', { name: abominationName(entry.boss, t) }), ...arrivedAfter(game, next, 'manual')]);
  };
  // Focus stays on the button after these, and none changes `drawn`: each says what it just did, in one announcement.
  const labelOf = (group: Revealed) => (manualRule ? bossLabel(groupReveal(group, manualRule), t) : '');
  const say = (texts: readonly string[]) => {
    const text = texts.filter(Boolean).join(' ');
    if (text && Platform.OS !== 'web') AccessibilityInfo.announceForAccessibility(text);
  };
  // What an action brought: the groups of `next` that `game` did not have, as the text to read out (see `newGroups`).
  const arrivedAfter = (from: GameState, to: GameState, scope: 'manual' | 'all') =>
    newGroups(from.piles.bosses, to.piles.bosses, scope).map(labelOf);
  const drawByHand = () => {
    const next = drawAbomination(game, Math.random, bossPowers);
    if (next === game) return;
    if (haptics) drawFeedback();
    // The new Abomination comes into view, whichever card of the step was looked at.
    // The boss drawn is the first group added; a bringer's escorts come after it, so the step key counts all of them.
    setViewed({ step: `${drawnKey}#${next.piles.bosses?.manual.length ?? extra + 1}`, index: drawn.length + extra });
    update(() => next);
    // The Abomination drawn, then the escorts it brought (each its own group appended after it).
    say(arrivedAfter(game, next, 'manual'));
  };
  const changeDanger = (level: DangerLevel) => {
    // The level already chosen changes nothing: nothing to read out.
    if (level === game.danger) return;
    const next = setDanger(game, level, bossTrigger, Math.random, bossPowers);
    update(() => next);
    // A card that now calls on a boss deck reveals its boss, a bringer its escorts: `drawn` does not change, so say it.
    say(arrivedAfter(game, next, 'all'));
  };
  const confirmChoice = (picked: string[]) => {
    const next = chooseGained(game, picked);
    if (next === game) return;
    update(() => next);
    // The group just resolved is the one that is new.
    say(arrivedAfter(game, next, 'all'));
  };
  const reveal = revealOf(game.piles.bosses?.revealed, game.bossRule);
  const isFlipped = (index: number) => flips.step === drawnKey && flips.open.includes(index);
  const toggleFlip = (index: number) => {
    // A tap that stopped a scrolling rule (or came right after) is not a request to turn the card.
    if (scrolledRecently()) return;
    setFlips((current) => {
      const open = current.step === drawnKey ? current.open : [];
      return { step: drawnKey, open: open.includes(index) ? open.filter((i) => i !== index) : [...open, index] };
    });
  };
  // A card whose boss the players removed stays on the table, greyed out.
  const fade = (face: React.ReactNode, faceReveal?: Reveal) => (isGone(faceReveal) ? <View style={styles.gone}>{face}</View> : face);
  // A card with words on its back turns over; one without stays a plain face.
  // `onTap` is what a tap on the face does (turn it, or reopen Gozer's choice): the faces take it themselves.
  const cardFace = (card: ZombieCard, index: number, faceWidth: number, onTap: () => void, zoomButton?: boolean) => {
    const shownReveal = reveal(card.id);
    const front = <CardFace card={card} danger={danger} width={faceWidth} reveal={shownReveal} zoomButton={zoomButton} />;
    if (!cardHasBack(card, danger, t, shownReveal)) return fade(front, shownReveal);
    return fade(
      <FlipCard
        flipped={isFlipped(index)}
        onPress={onTap}
        front={front}
        back={<CardFace card={card} danger={danger} width={faceWidth} reveal={shownReveal} side="back" onFlip={onTap} zoomButton={zoomButton} />}
      />,
      shownReveal,
    );
  };
  // An Abomination drawn by hand, at the same place in the flips as the cards of the step.
  const bossFace = (faceReveal: Reveal, index: number, faceWidth: number, onTap: () => void, zoomButton?: boolean) => {
    const front = <BossFace reveal={faceReveal} width={faceWidth} universe={game.universe} />;
    if (!bossHasBack(faceReveal, t)) return fade(front, faceReveal);
    return fade(
      <FlipCard
        flipped={isFlipped(index)}
        onPress={onTap}
        front={front}
        back={<BossFace reveal={faceReveal} width={faceWidth} universe={game.universe} side="back" onFlip={onTap} zoomButton={zoomButton} />}
      />,
      faceReveal,
    );
  };
  const flipHint = (flipped: boolean) => t(flipped ? 'card.flipBackHint' : 'card.flipHint');
  const draw = () => {
    // No card left to deal (the rest are on display for this step): no vibration, no draw counted.
    const next = deal(game);
    if (next === game) return;
    // The rating prompt counts Spawn steps, however the zones are dealt.
    if (!sequence || startsNewStep(game, cardEffect)) countDraw();
    // The announcement (cards, then the escorts a bringer brought) is made once the state is applied, by the effect on `drawn`.
    dealtRef.current = { fresh: !sequence || startsNewStep(game, cardEffect) };
    update(deal);
    if (haptics) drawFeedback();
  };
  const reshuffle = () => {
    if (!confirmingShuffle) {
      setConfirmingShuffle(true);
      return;
    }
    setConfirmingShuffle(false);
    shuffleWith((state) => reshuffleAll(state, Math.random, bossPowers));
  };
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/menu'));

  const shown = sequence ? 1 : Math.max(1, drawn.length + extra);
  const label = zones > 1 || drawn.length > 1 || extra > 0 ? (sequence ? SEQUENCE_HEADER : ZONE_LABEL) : 0;
  // The step being looked at: drawing an Abomination by hand brings it into view.
  const viewKey = `${drawnKey}#${extra}`;
  // Unless a chip was tapped (or an Abomination just drawn by hand), the last card dealt: a new zone card shows at once.
  const defaultView = drawn.length > 0 ? drawn.length - 1 : extra - 1;
  const viewedIndex = Math.min(viewed?.step === viewKey ? viewed.index : defaultView, drawn.length + extra - 1);
  const { width, deckWidth, columns, rows } = tableLayout(table, shown, label);
  // A single card sits in a column as wide as the deck: when the zone line above it makes it a little smaller, it
  // stays centred there instead of shifting the deck.
  const column = shown === 1 ? Math.max(width, deckWidth) : width;
  const rowWidth = Math.max(0, Math.min(table.width - deckWidth - TABLE_GAP, columns * column + (columns - 1) * TABLE_GAP));
  const slot = { width, aspectRatio: CARD_RATIO };
  const zoomedCard = zoomed?.step === drawnKey ? CARDS_BY_ID.get(drawn[zoomed.index]) : undefined;
  const zoomedGroup = zoomed?.step === drawnKey && zoomed.index >= drawn.length ? manualGroups[zoomed.index - drawn.length] : undefined;
  const zoomFlippable = zoomedGroup
    ? bossHasBack(zoomedGroup.reveal, t)
    : !!zoomedCard && cardHasBack(zoomedCard, danger, t, reveal(zoomedCard.id));
  const dealt = drawn.map((id, index) => {
    const card = CARDS_BY_ID.get(id);
    const waiting = !!game.piles.bosses?.revealed[id]?.choice;
    const zoomable = shown > 1;
    const flippable = !!card && cardHasBack(card, danger, t, reveal(id));
    const flipped = flippable && isFlipped(index);
    // A button hides what it holds from TalkBack: it carries the whole card.
    const asButton = zoomable || waiting || flippable;
    return (
      <View key={`${id}-${index}`} style={{ width: column, alignItems: 'center' }}>
        {label > 0 && (
          // The zone is read with the card of its button below.
          <Text style={[styles.zone, styles.zoneLine]} numberOfLines={1} importantForAccessibility={asButton ? 'no' : 'auto'}>
            {t('game.zone', { n: cardZones[index] })}
          </Text>
        )}
        <View style={slot}>
          <CardButton
            style={styles.drawn}
            disabled={!card || !asButton}
            // A card that turns over takes its taps in its faces: nothing touchable wraps the scrolling rule.
            faces={flippable}
            // Gozer's choice first; then the card turns over to its rule; a card with none enlarges, as it always did.
            onPress={waiting ? reopenChoice : flippable ? () => toggleFlip(index) : () => setZoomed({ step: drawnKey, index })}
            button={asButton}
            // One announcement per card: a button hides what it holds from TalkBack, so it carries the whole card.
            label={
              asButton && card
                ? `${label > 0 ? `${t('game.zone', { n: cardZones[index] })}: ` : ''}${cardLabel(card, danger, t, reveal(id))}`
                : undefined
            }
            hint={waiting ? t('boss.tapToChoose') : flippable ? flipHint(flipped) : zoomable ? t('game.zoom') : undefined}
            expanded={flippable && !waiting ? flipped : undefined}
          >
            {card && (
              <Animated.View
                style={[styles.drawn, { transform: [{ perspective: 800 }, { rotateY }] }]}
                accessibilityElementsHidden={asButton}
                importantForAccessibility={asButton ? 'no-hide-descendants' : 'auto'}
              >
                {cardFace(card, index, width, waiting ? reopenChoice : () => toggleFlip(index), zoomable)}
              </Animated.View>
            )}
          </CardButton>
          {zoomable && card && <ZoomButton label={t('game.zoom')} onPress={() => setZoomed({ step: drawnKey, index })} />}
        </View>
      </View>
    );
  });

  // Abominations drawn by hand sit after the cards of the step, under a line of their own.
  const manualCards = manualGroups.map(({ group, reveal: groupFace }, i) => {
    const index = drawn.length + i;
    const waiting = !!group.choice;
    const flipped = isFlipped(index);
    return (
      <View key={`manual-${i}`} style={{ width: column, alignItems: 'center' }}>
        <Text style={[styles.zone, styles.zoneLine]} numberOfLines={1} importantForAccessibility="no">
          {t('game.manualBoss')}
        </Text>
        <View style={slot}>
          <CardButton
            style={styles.drawn}
            faces={bossHasBack(groupFace, t)}
            onPress={waiting ? reopenChoice : () => toggleFlip(index)}
            button
            label={`${t('game.manualBoss')}: ${bossLabel(groupFace, t)}`}
            hint={waiting ? t('boss.tapToChoose') : flipHint(flipped)}
            expanded={waiting ? undefined : flipped}
          >
            <View style={styles.drawn} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              {bossFace(groupFace, index, width, waiting ? reopenChoice : () => toggleFlip(index), shown > 1)}
            </View>
          </CardButton>
          {shown > 1 && <ZoomButton label={t('game.zoom')} onPress={() => setZoomed({ step: drawnKey, index })} />}
        </View>
      </View>
    );
  });

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <AppBackground universe={game.universe} />
      <View style={styles.columns}>
        <View
          style={styles.table}
          onLayout={({ nativeEvent: { layout } }) => setTable({ width: layout.width, height: layout.height })}
        >
          <Animated.View style={[{ width: deckWidth, aspectRatio: CARD_RATIO }, deckShake]}>
            <CardBack count={game.piles.draw.length} label={t('game.draw')} width={deckWidth} universe={game.universe} onPress={draw} />
          </Animated.View>
          {sequence ? (
            <OneAtATime
              drawn={drawn}
              cardZones={cardZones}
              zones={zones}
              pending={pendingZones(game, cardEffect)}
              extra={extra}
              extraLabel={t('game.manualBoss')}
              viewedIndex={viewedIndex}
              onView={(index) => setViewed({ step: viewKey, index })}
              header={label}
              width={width}
              column={column}
              renderCard={(id, index) => {
                const card = CARDS_BY_ID.get(id);
                if (!card) return null;
                const flipTap = () => toggleFlip(index);
                const face = cardFace(card, index, width, flipTap);
                const waiting = !!game.piles.bosses?.revealed[id]?.choice;
                const flippable = cardHasBack(card, danger, t, reveal(id));
                const flipped = flippable && isFlipped(index);
                return waiting || flippable ? (
                  <CardButton
                    style={styles.drawn}
                    faces={flippable}
                    onPress={waiting ? reopenChoice : () => toggleFlip(index)}
                    button
                    label={cardLabel(card, danger, t, reveal(id))}
                    hint={waiting ? t('boss.tapToChoose') : flipHint(flipped)}
                    expanded={waiting ? undefined : flipped}
                  >
                    {face}
                  </CardButton>
                ) : (
                  face
                );
              }}
              renderExtra={(i) => {
                const { group, reveal: groupFace } = manualGroups[i];
                const index = drawn.length + i;
                const flipped = isFlipped(index);
                return (
                  <CardButton
                    style={styles.drawn}
                    faces={bossHasBack(groupFace, t)}
                    onPress={group.choice ? reopenChoice : () => toggleFlip(index)}
                    button
                    label={bossLabel(groupFace, t)}
                    hint={group.choice ? t('boss.tapToChoose') : flipHint(flipped)}
                    expanded={group.choice ? undefined : flipped}
                  >
                    {bossFace(groupFace, index, width, group.choice ? reopenChoice : () => toggleFlip(index))}
                  </CardButton>
                );
              }}
              chipLabel={t('game.manualChip')}
              flip={rotateY}
              emptyText={t('game.noCard')}
              t={t}
            />
          ) : drawn.length === 0 && extra === 0 ? (
            <View style={{ width: column, paddingTop: label, alignItems: 'center' }}>
              <View style={[slot, styles.empty]}>
                <Text style={styles.emptyText}>{t('game.noCard')}</Text>
              </View>
            </View>
          ) : rows > 1 ? (
            <View style={[styles.grid, { width: rowWidth }]}>
              {dealt}
              {manualCards}
            </View>
          ) : (
            <ScrollView
              key={drawnKey}
              horizontal
              style={{ width: rowWidth, flexGrow: 0 }}
              contentContainerStyle={styles.row}
              showsHorizontalScrollIndicator={false}
            >
              {dealt}
              {manualCards}
            </ScrollView>
          )}
        </View>

        <ScrollView style={styles.controls} contentContainerStyle={styles.controlsContent}>
          <Button compact label={`‹ ${t('game.back')}`} onPress={leave} />
          <Text style={styles.heading}>{t('danger.title')}</Text>
          <View style={styles.levels}>
            {DANGER_LEVELS.map((level) => (
              <Pressable
                key={level}
                style={({ pressed }) => [
                  styles.level,
                  { backgroundColor: DANGER_COLORS[level].background },
                  level === danger && styles.levelActive,
                  pressed && PRESSED,
                ]}
                onPress={() => changeDanger(level)}
                accessibilityRole="button"
                accessibilityState={{ selected: level === danger }}
              >
                <Text style={[styles.levelText, { color: DANGER_COLORS[level].text }]}>
                  {t(`danger.${level}`)}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.zones}>
            <Text style={[styles.heading, styles.zonesHeading]}>{t('game.zones')}</Text>
            <Button
              compact
              label="−"
              accessibilityLabel={t('game.zonesLess')}
              disabled={zones <= 1}
              onPress={() => update((state) => setZones(state, state.zones - 1))}
            />
            <Text style={styles.zonesValue} accessibilityLabel={`${t('game.zones')}: ${zones}`}>
              {zones}
            </Text>
            <Button
              compact
              label="+"
              accessibilityLabel={t('game.zonesMore')}
              disabled={zones >= MAX_ZONES}
              onPress={() => update((state) => setZones(state, state.zones + 1))}
            />
          </View>

          <View style={styles.spacer}>
            {game.piles.reshuffled && <Text style={styles.notice}>{t('game.reshuffled')}</Text>}
          </View>

          {board.length > 0 && (
            <View style={styles.board} accessibilityRole="summary">
              <Text style={styles.boardHeading}>{t('boss.onBoard')}</Text>
              {board.map((entry) => {
                const confirming = confirmingRemove === entry.key;
                const name = abominationName(entry.boss, t);
                return (
                  <Pressable
                    key={entry.key}
                    style={({ pressed }) => [styles.boardButton, confirming && styles.boardConfirm, pressed && PRESSED]}
                    onPress={() => removeBoss(entry)}
                    accessibilityRole="button"
                    accessibilityLabel={t(entry.kind === 'necromancer' ? 'boss.removeNecromancerLabel' : 'boss.removeAbominationLabel', { name })}
                    accessibilityHint={confirming ? t('boss.removeConfirm') : undefined}
                  >
                    <View style={[styles.kindBar, { backgroundColor: entry.kind === 'necromancer' ? COLORS.accent : COLORS.warning }]} />
                    <View style={styles.boardText}>
                      <Text style={styles.boardName} numberOfLines={2}>
                        {name}
                      </Text>
                      <Text style={[styles.boardAction, confirming && styles.boardActionConfirm]} numberOfLines={2}>
                        {t(confirming ? 'boss.removeConfirm' : 'boss.remove')}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
          <Button compact label={t('game.undo')} disabled={game.history.length === 0} onPress={() => update(undo)} />
          <Button
            compact
            label={t('game.shuffleDeck')}
            disabled={game.piles.draw.length < 2}
            onPress={() => shuffleWith((state) => shuffleDeck(state))}
          />
          <Button
            compact
            label={t(confirmingShuffle ? 'game.confirmShuffle' : 'game.shuffle')}
            warning={confirmingShuffle}
            onPress={reshuffle}
          />
          <Button
            compact
            label={t('game.discard', { n: game.piles.discard.length })}
            onPress={() => setShowDiscard(true)}
          />
          {bossDecks?.manualDraw && abominationDeck && (
            <Button
              compact
              label={t('game.drawAbomination')}
              // With an Abomination in play the button still gives it an Extra Activation, even with the deck empty.
              disabled={abominationDeck.draw.length + abominationDeck.discard.length === 0 && !board.some((entry) => entry.kind === 'abomination')}
              onPress={drawByHand}
            />
          )}
        </ScrollView>
      </View>
      {(zoomedCard || zoomedGroup) && zoomed && (
        <Modal
          transparent
          animationType="fade"
          // iOS shows modals in portrait unless told otherwise; the app is landscape only.
          supportedOrientations={['landscape', 'landscape-left', 'landscape-right']}
          onRequestClose={() => setZoomed(null)}
          // Android: the dimmed overlay reaches under the system bars and the camera cutout too.
          statusBarTranslucent
          navigationBarTranslucent
        >
          <View style={styles.zoom}>
            {/* Behind the card: a tap beside it closes, a tap on it turns it over. */}
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setZoomed(null)}
              accessibilityRole="button"
              accessibilityLabel={t('game.close')}
            />
            {label > 0 && (
              <Text style={styles.zone}>{zoomedGroup ? t('game.manualBoss') : t('game.zone', { n: cardZones[zoomed.index] })}</Text>
            )}
            <CardButton
              // An explicit height, not aspectRatio: the card's back is a ScrollView, which only scrolls when its
              // height is bounded; with a height derived from the ratio Android lets it grow and clip instead.
              style={{ width: zoomWidth(window), height: zoomWidth(window) / CARD_RATIO }}
              faces={zoomFlippable}
              onPress={zoomFlippable ? () => toggleFlip(zoomed.index) : () => setZoomed(null)}
              button
              label={zoomedGroup ? bossLabel(zoomedGroup.reveal, t) : zoomedCard ? cardLabel(zoomedCard, danger, t, reveal(zoomedCard.id)) : undefined}
              hint={zoomFlippable ? flipHint(isFlipped(zoomed.index)) : undefined}
              expanded={zoomFlippable ? isFlipped(zoomed.index) : undefined}
            >
              {zoomedGroup
                ? bossFace(zoomedGroup.reveal, zoomed.index, zoomWidth(window), () => toggleFlip(zoomed.index))
                : zoomedCard && cardFace(zoomedCard, zoomed.index, zoomWidth(window), () => toggleFlip(zoomed.index))}
            </CardButton>
            <Pressable
              style={({ pressed }) => [
                styles.close,
                { top: insets.top + CLOSE_MARGIN, right: insets.right + CLOSE_MARGIN },
                pressed && PRESSED,
              ]}
              onPress={() => setZoomed(null)}
              accessibilityRole="button"
              accessibilityLabel={t('game.close')}
            >
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>
        </Modal>
      )}
      {pending && opened === pendingKey && dismissed !== pendingKey && (
        <ChoiceSheet
          key={pendingKey}
          boss={pending.boss}
          offered={pending.offered}
          keep={pending.keep}
          onConfirm={confirmChoice}
          onClose={() => setDismissed(pendingKey)}
        />
      )}
      {showDiscard && (
        <DiscardSheet discard={game.piles.discard} danger={danger} onClose={() => setShowDiscard(false)} />
      )}
    </SafeAreaView>
  );
}

/** A tapped card as large as the screen allows, below its zone line. */
const zoomWidth = (window: { width: number; height: number }) =>
  Math.min((window.height * ZOOM_HEIGHT - ZONE_LABEL) * CARD_RATIO, window.width * ZOOM_HEIGHT);

/**
 * Sizes the cards so the deck and `shown` cards fit the table, as large as possible: on one row, or on two or three
 * when the height allows clearly larger, still readable cards (tablets). On one row past a few Spawn Zones, the cards
 * keep a readable size and the row scrolls. Beside a single card the deck takes the whole height, so the zone line
 * above the card never resizes it.
 */
function tableLayout(table: { width: number; height: number }, shown: number, label: number) {
  const tallest = (rows: number) => Math.max(0, ((table.height - (rows - 1) * TABLE_GAP) / rows - label) * CARD_RATIO);
  if (shown === 1) {
    const half = Math.max(0, (table.width - TABLE_GAP) / 2);
    return { width: Math.min(tallest(1), half), deckWidth: Math.min(table.height * CARD_RATIO, half), columns: 1, rows: 1 };
  }
  // The deck takes one more column, beside the cards, at their size.
  const fit = (rows: number) => {
    const columns = Math.ceil(shown / rows);
    const width = Math.min(tallest(rows), (table.width - TABLE_GAP * columns) / (columns + 1));
    return { width, deckWidth: width, columns, rows };
  };
  let best = fit(1);
  // One row too narrow (a phone, many zones): every card in view on several rows beats scrolling, down to a floor.
  const crowded = best.width < MIN_CARD_WIDTH;
  for (let rows = 2; rows <= Math.min(3, shown); rows++) {
    const option = fit(rows);
    // With room on one row, several rows only for clearly larger cards: an odd 2 + 1 for a few pixels is not worth it.
    const better = crowded
      ? option.width >= MIN_GRID_WIDTH && (best.rows === 1 || option.width > best.width)
      : option.width >= best.width * 1.15;
    if (better) best = option;
  }
  if (best.rows === 1) {
    best.width = Math.max(best.width, Math.min(MIN_CARD_WIDTH, tallest(1)));
    best.deckWidth = best.width;
  } else {
    // The cards are sized by the height: the deck takes the width they leave, up to the whole height.
    const cards = best.columns * best.width + (best.columns - 1) * TABLE_GAP;
    best.deckWidth = Math.max(best.width, Math.min(table.height * CARD_RATIO, table.width - TABLE_GAP - cards));
  }
  return best;
}

/**
 * What a screen reader says once cards are dealt: every card of the step, or only the last one when the zones are
 * dealt one at a time; each with its Spawn Zone once there is more than one.
 */
/** The boss each card on display revealed from its deck, with the Dead Men Tales rules. */
const revealOf =
  (revealed: Record<string, Revealed> | undefined, rule: BossRule | null | undefined) =>
  (cardId: string): Reveal | undefined => {
    const shown = revealed?.[cardId];
    return shown && rule ? groupReveal(shown, rule) : undefined;
  };

type BoardEntry = { key: string; kind: BossKind; boss: string; target: BossTarget };

/**
 * Every boss the players can remove: the ones left on the board by earlier Spawn steps, then those of the current step
 * (on its cards and drawn by hand), which are on the board too from where they sit.
 */
function bossesInPlay(game: GameState): BoardEntry[] {
  const bosses = game.piles.bosses;
  if (!bosses) return [];
  const board = bosses.onBoard.map(({ kind, boss }, at): BoardEntry => ({ key: `board:${at}:${boss}`, kind, boss, target: { from: 'board', boss } }));
  const step = game.piles.drawn.flatMap((card) => {
    const group = bosses.revealed[card];
    return group ? liveBosses(group).map((boss): BoardEntry => ({ key: `step:${card}:${boss}`, kind: group.kind, boss, target: { from: 'step', card, boss } })) : [];
  });
  const manual = bosses.manual.flatMap((group, index) =>
    liveBosses(group).map((boss): BoardEntry => ({ key: `manual:${index}:${boss}`, kind: group.kind, boss, target: { from: 'manual', index, boss } })),
  );
  return [...board, ...step, ...manual];
}

/** A revealed group with its powers: the SPAMs, the bosses brought along or gained, a choice still to make. */
const groupReveal = (group: Revealed, rule: BossRule): Reveal => ({
  kind: group.kind,
  boss: group.boss,
  rule,
  spam: group.spam,
  along: group.along,
  gained: group.gained,
  choosing: !!group.choice,
  activates: group.activates,
  none: group.none,
  activated: group.activated,
  gone: group.gone,
});

/** Where the choice Gozer waits on lives: a card of the step, else the Abomination drawn by hand at that position. */
function pendingPlace(game: GameState): string {
  const bosses = game.piles.bosses;
  const card = game.piles.drawn.find((id) => bosses?.revealed[id]?.choice);
  return card ? `card:${card}` : `manual:${bosses?.manual.findIndex((group) => group.choice) ?? -1}`;
}

/**
 * A card face that can be tapped (turn over, enlarge, or Gozer's choice again). As a button it carries the whole card for the screen
 * reader: a button hides what it holds from TalkBack.
 */
function CardButton(props: {
  style: object;
  onPress: () => void;
  button: boolean;
  disabled?: boolean;
  label?: string;
  hint?: string;
  /** For a card that turns over: whether it shows its back. */
  expanded?: boolean;
  /**
   * The card turns over and its faces take the taps themselves (see FlipCard and RuleSide): the button is then a plain
   * accessible View, since a touchable around the scrolling rule would hold the gesture and the text would not scroll.
   */
  faces?: boolean;
  children?: React.ReactNode;
}) {
  if (props.faces) {
    return (
      <View
        style={props.style}
        accessible
        accessibilityRole={props.button ? 'button' : undefined}
        accessibilityLabel={props.label}
        accessibilityHint={props.hint}
        accessibilityState={props.expanded === undefined ? undefined : { expanded: props.expanded }}
        // A plain View has no onPress: TalkBack's double tap runs this action (iOS: VoiceOver's activate).
        accessibilityActions={props.button ? [{ name: 'activate' }] : undefined}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'activate') props.onPress();
        }}
      >
        <CardAnnounced.Provider value={!!props.button}>{props.children}</CardAnnounced.Provider>
      </View>
    );
  }
  return (
    <Pressable
      style={({ pressed }) => [props.style, pressed && PRESSED]}
      disabled={props.disabled}
      onPress={props.onPress}
      accessibilityRole={props.button ? 'button' : undefined}
      accessibilityLabel={props.label}
      accessibilityHint={props.hint}
      accessibilityState={props.expanded === undefined ? undefined : { expanded: props.expanded }}
    >
      <CardAnnounced.Provider value={!!props.button}>{props.children}</CardAnnounced.Provider>
    </Pressable>
  );
}

function announcement(
  drawn: readonly string[],
  danger: DangerLevel,
  zones: number,
  sequence: boolean,
  t: Translate,
  reveal: (cardId: string) => Reveal | undefined,
): string {
  const cardZones = zonesOf(drawn, cardEffect, zones);
  const withZones = zones > 1 || drawn.length > 1;
  const indexes = sequence ? [drawn.length - 1] : drawn.map((_, index) => index);
  return indexes
    .map((index) => {
      const card = CARDS_BY_ID.get(drawn[index]);
      if (!card) return '';
      const label = cardLabel(card, danger, t, reveal(card.id));
      return withZones ? `${t('game.zone', { n: cardZones[index] })}: ${label}` : label;
    })
    .filter(Boolean)
    .join(' ');
}

/** One zone per tap: the card of one zone in full size, the zones of the step as numbered chips above it. */
function OneAtATime(props: {
  drawn: readonly string[];
  cardZones: readonly number[];
  zones: number;
  /** The zone of each card still to come in this step: twice for a zone owed two cards by a Double Spawn. */
  pending: readonly number[];
  /** Abominations drawn by hand, shown after the cards of the step (own chip each). */
  extra: number;
  extraLabel: string;
  /** What the chip of an Abomination drawn by hand says. */
  chipLabel: string;
  renderExtra: (index: number) => React.ReactNode;
  /** Over the cards then the Abominations drawn by hand. */
  viewedIndex: number;
  onView: (index: number) => void;
  header: number;
  width: number;
  /** Width of the column the card is centred in. */
  column: number;
  renderCard: (id: string, index: number) => React.ReactNode;
  flip: Animated.AnimatedInterpolation<string>;
  emptyText: string;
  t: Translate;
}) {
  const { drawn, cardZones, zones, pending, viewedIndex, t } = props;
  const viewedId = drawn[viewedIndex];
  const viewedExtra = viewedIndex >= drawn.length && viewedIndex < drawn.length + props.extra;
  // The card just dealt flips, also when an Abomination drawn by hand sits after it.
  const isLast = viewedIndex === drawn.length - 1;
  const slot = { width: props.width, aspectRatio: CARD_RATIO };
  return (
    <View style={{ width: props.column, alignItems: 'center' }}>
      {props.header > 0 && (
        <View style={[styles.sequenceHeader, { height: props.header, width: props.width }]}>
          <View style={styles.sequenceRow}>
            <Text style={[styles.zone, styles.sequenceTitle]} numberOfLines={1}>
              {viewedExtra ? props.extraLabel : t('game.zoneOf', { n: viewedId ? cardZones[viewedIndex] : 1, total: zones })}
            </Text>
            {drawn.map((id, index) => (
              <Pressable
                key={`${id}-${index}`}
                style={({ pressed }) => [styles.chip, index === viewedIndex && styles.chipViewed, pressed && PRESSED]}
                onPress={() => props.onView(index)}
                accessibilityRole="button"
                accessibilityLabel={t('game.zone', { n: cardZones[index] })}
                accessibilityState={{ selected: index === viewedIndex }}
              >
                <Text style={[styles.chipText, index === viewedIndex && styles.chipTextViewed]}>{cardZones[index]}</Text>
              </Pressable>
            ))}
            {Array.from({ length: props.extra }, (_, i) => {
              const index = drawn.length + i;
              return (
                <Pressable
                  key={`extra-${i}`}
                  style={({ pressed }) => [styles.chip, index === viewedIndex && styles.chipViewed, pressed && PRESSED]}
                  onPress={() => props.onView(index)}
                  accessibilityRole="button"
                  accessibilityLabel={props.extraLabel}
                  accessibilityState={{ selected: index === viewedIndex }}
                >
                  <Text style={[styles.chipText, index === viewedIndex && styles.chipTextViewed]}>{props.chipLabel}</Text>
                </Pressable>
              );
            })}
            {pending.map((zone, index) => (
              <View
                key={`pending-${index}`}
                style={[styles.chip, styles.chipPending]}
                accessible
                accessibilityLabel={t('game.zonePending', { n: zone })}
              >
                <Text style={styles.chipText}>{zone}</Text>
              </View>
            ))}
          </View>
          {/* Says what the faded chips mean: cards of this step still in the deck. */}
          {drawn.length > 0 && (
            <Text style={styles.sequenceHint} numberOfLines={1}>
              {pending.length === 0
                ? t('game.spawnDone')
                : pending.length === 1
                  ? t('game.toDrawOne')
                  : t('game.toDrawOther', { n: pending.length })}
            </Text>
          )}
        </View>
      )}
      {viewedExtra ? (
        <View style={slot}>
          <View style={styles.drawn}>{props.renderExtra(viewedIndex - drawn.length)}</View>
        </View>
      ) : viewedId ? (
        <View style={slot}>
          <Animated.View style={[styles.drawn, isLast && { transform: [{ perspective: 800 }, { rotateY: props.flip }] }]}>
            {props.renderCard(viewedId, viewedIndex)}
          </Animated.View>
        </View>
      ) : (
        <View style={[slot, styles.empty]}>
          <Text style={styles.emptyText}>{props.emptyText}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  columns: { flex: 1, flexDirection: 'row', padding: 12, gap: 16 },
  table: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: TABLE_GAP },
  row: { gap: TABLE_GAP },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: TABLE_GAP },
  zone: { height: ZONE_LABEL, color: COLORS.text, fontSize: 13, fontWeight: '800', textAlign: 'center', textTransform: 'uppercase' },
  zoneLine: { alignSelf: 'stretch' },
  drawn: { flex: 1 },
  gone: { flex: 1, opacity: GONE_OPACITY },
  close: {
    position: 'absolute',
    width: CLOSE_SIZE,
    height: CLOSE_SIZE,
    borderRadius: CLOSE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  closeText: { color: COLORS.text, fontSize: 26, lineHeight: 30, fontWeight: '700' },
  zoom: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(9, 14, 12, 0.92)' },
  empty: {
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  emptyText: { color: COLORS.muted, fontSize: 14, textAlign: 'center' },
  controls: { width: 200, flexGrow: 0 },
  controlsContent: { flexGrow: 1, gap: 6 },
  heading: { color: COLORS.muted, fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },
  levels: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  level: { width: 97, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', opacity: 0.75 },
  levelActive: { opacity: 1, borderWidth: 3, borderColor: '#ffffff' },
  levelText: { fontSize: 14, fontWeight: '800' },
  zones: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  zonesHeading: { flex: 1 },
  zonesValue: { color: COLORS.text, fontSize: 18, fontWeight: '900', minWidth: 20, textAlign: 'center' },
  sequenceHeader: { justifyContent: 'flex-end', paddingBottom: 6 },
  sequenceRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sequenceHint: { color: COLORS.muted, fontSize: 12, fontWeight: '600', marginTop: 2 },
  sequenceTitle: { flex: 1, height: undefined, textAlign: 'left' },
  chip: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipViewed: { backgroundColor: COLORS.text, borderColor: COLORS.text },
  chipPending: { opacity: 0.4, borderStyle: 'dashed' },
  chipText: { color: COLORS.text, fontSize: 12, fontWeight: '800' },
  chipTextViewed: { color: COLORS.background },
  board: {
    gap: 6,
    padding: 8,
    borderRadius: 10,
    borderWidth: BOARD_FRAME_WIDTH,
    borderColor: COLORS.warning,
    backgroundColor: COLORS.background,
  },
  boardHeading: { color: COLORS.warning, fontSize: BOARD_HEADING_SIZE, fontWeight: '900', textTransform: 'uppercase', letterSpacing: BOARD_HEADING_SPACING },
  boardButton: {
    minHeight: BOARD_BUTTON_MIN_HEIGHT,
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
  },
  boardConfirm: { borderColor: COLORS.warning, borderWidth: 2 },
  kindBar: { width: KIND_BAR_WIDTH },
  boardText: { flex: 1, paddingHorizontal: 8, paddingVertical: 4, justifyContent: 'center' },
  boardName: { color: COLORS.text, fontSize: BOARD_NAME_SIZE, fontWeight: '800' },
  boardAction: { color: COLORS.muted, fontSize: 12 },
  boardActionConfirm: { color: COLORS.warning, fontWeight: '800' },
  spacer: { flexGrow: 1, minHeight: 12, justifyContent: 'center', gap: 4 },
  notice: { color: COLORS.warning, fontSize: 13, textAlign: 'center' },
});
