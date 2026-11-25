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
import { BossFace, bossHasBack, CardAnnounced, bossLabel, CardFace, cardHasBack, cardLabel, isGone, type Reveal, SpamFace, spamLabel } from '@/components/card-face';
import { abominationName, ChoiceSheet } from '@/components/choice-sheet';
import { DiscardSheet } from '@/components/discard-sheet';
import { FlipCard, PERSPECTIVE } from '@/components/flip-card';
import { scrolledRecently } from '@/components/scroll-guard';
import { ZoomButton } from '@/components/zoom-button';
import { bossTrigger, CARDS_BY_ID, cardEffect, isTrejoCard, UNIVERSES } from '@/data/universes';
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
import { type SlotRef, entryPosition, slotPosition, type TableSlot, tableSlots } from '@/game/table';
import { NO_BOSS } from '@/game/types';
import type { BossKind, BossRule, DangerLevel, GameState, Revealed, TrejoChoice, ZombieCard } from '@/game/types';
import type { Translate } from '@/i18n/translations';
import { COLORS, DANGER_COLORS, PRESSED } from '@/theme';

const CARD_RATIO = 63 / 88;
const TABLE_GAP = 16;
const DEAL_FLIP_MS = 260;
const SHAKE_MS = 450;
/** Height of the "Zone 2" line above each card (more than one Spawn Zone). */
const ZONE_LABEL = 22;
/** Height of the zone line when zones are dealt one at a time. */
const SEQUENCE_HEADER = 48;
/** Below this width, cards go on several rows or the row scrolls. */
const MIN_CARD_WIDTH = 150;
/** Smallest card on several rows (counts stay readable); below it, one row that scrolls. */
const MIN_GRID_WIDTH = 95;
const ZOOM_HEIGHT = 0.9;
/** Distance of the enlarged card's close button from the screen edges, plus the safe area. */
const CLOSE_MARGIN = 12;
const CLOSE_SIZE = 44;
/** Time to confirm a destructive tap before the button resets. */
const CONFIRM_MS = 3000;
/** Lets the deal flip and the card's announcement finish before Gozer's choice opens. */
const CHOICE_DELAY_MS = 700;
/** Opacity of a card whose boss was removed. */
const GONE_OPACITY = 0.4;
/** Room for the name on two lines and the action line. */
const BOARD_BUTTON_MIN_HEIGHT = 56;
const BOARD_FRAME_WIDTH = 2;
const BOARD_HEADING_SIZE = 15;
const BOARD_HEADING_SPACING = 1;
const BOARD_NAME_SIZE = 17;
const KIND_BAR_WIDTH = 6;

export default function GameScreen() {
  const { game, setGame, haptics, zoneDisplay, t, trejoChoice, removeTrejo, trejoOnBoard } = useApp();
  const drawnKey = game?.piles.drawn.join('|') ?? '';
  useKeepAwake();

  const [table, setTable] = useState({ width: 0, height: 0 });
  const [flip] = useState(() => new Animated.Value(1));
  // Also restarts once the table is measured: cards may remount in a grid, and on web remounted cards would stay edge-on.
  const measured = table.width > 0;
  useEffect(() => {
    flip.setValue(0);
    Animated.timing(flip, { toValue: 1, duration: DEAL_FLIP_MS, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [drawnKey, measured, flip]);

  const [shuffles, setShuffles] = useState(0);
  const [shake] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (shuffles === 0) return;
    shake.setValue(0);
    Animated.timing(shake, { toValue: 1, duration: SHAKE_MS, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [shuffles, shake]);

  const [confirmingShuffle, setConfirmingShuffle] = useState(false);
  useEffect(() => {
    if (!confirmingShuffle) return;
    const timer = setTimeout(() => setConfirmingShuffle(false), CONFIRM_MS);
    return () => clearTimeout(timer);
  }, [confirmingShuffle]);

  // Key of the board button waiting for its second tap.
  const [confirmingRemove, setConfirmingRemove] = useState('');
  useEffect(() => {
    if (!confirmingRemove) return;
    const timer = setTimeout(() => setConfirmingRemove(''), CONFIRM_MS);
    return () => clearTimeout(timer);
  }, [confirmingRemove]);

  const [showDiscard, setShowDiscard] = useState(false);
  // Sequence mode: the place looked at, the last card dealt unless another was tapped since.
  const [viewed, setViewed] = useState<{ step: string; ref: SlotRef } | null>(null);
  // Enlarged place on the table (SPAM cards included), until the next draw.
  const [zoomed, setZoomed] = useState<{ step: string; slot: number } | null>(null);
  // Positions turned to their back, until the next draw.
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
  const pending = game ? pendingChoice(game) : undefined;
  // Keyed by the choice itself, so unrelated draws or undos leave a closed sheet closed.
  const pendingKey = pending && game ? `${pendingPlace(game)}|${pending.boss}|${pending.offered.join('|')}` : '';
  const pendingBoss = pending?.boss ?? '';
  const pendingKeep = pending?.keep ?? 0;
  const [dismissed, setDismissed] = useState('');
  const [opened, setOpened] = useState('');
  // Reset once the choice is resolved, so a later one offering the same cards opens again.
  if (!pendingKey && (dismissed || opened)) {
    setDismissed('');
    setOpened('');
  }
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
    const reveal = revealOf(revealed, bossRule, currentDanger, trejoOnBoard);
    // One announcement: the cards, then the escorts a bringer brought (set by `draw`, never by an undo).
    // The groups of `manual` that the deal added, from the state actually applied: a new Spawn step moves the previous
    // ones to the board first, so they are not counted as before.
    const dealt = dealtRef.current;
    dealtRef.current = null;
    const before = dealt?.fresh && previousBossesRef.current ? { ...previousBossesRef.current, manual: [] } : previousBossesRef.current;
    const escorts = dealt && bossRule ? newGroups(before, bossPiles, 'manual').map((group) => groupLabel(group, bossRule, t)) : [];
    const spamCount = (cardId: string) => revealed?.[cardId]?.spam?.length ?? 0;
    AccessibilityInfo.announceForAccessibility([announcement(drawnCards, currentDanger, zoneCount, sequence, t, reveal, trejoChoice, spamCount), ...escorts].join(' '));
  }, [drawnCards, currentDanger, zoneCount, sequence, t, revealed, bossRule, bossPiles, trejoChoice, trejoOnBoard]);
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
  const bossPowers = bossDecks?.bossPowers ?? noPowers;
  const manualRule = game.bossRule;
  const manualGroups = manualRule
    ? (game.piles.bosses?.manual ?? []).map((group) => ({ group, reveal: groupReveal(group, manualRule) }))
    : [];
  const extra = manualGroups.length;
  // Every place of the table in draw order: each SPAM set aside is a card before the one that called the Abomination.
  const slots = slotsOf(game);
  const deal = (state: GameState) =>
    sequence
      ? drawNextCard(state, cardEffect, Math.random, bossTrigger, bossPowers, isTrejoCard)
      : drawCards(state, cardEffect, Math.random, bossTrigger, bossPowers, isTrejoCard);
  const reopenChoice = () => setDismissed('');
  const abominationDeck = game.piles.bosses?.abomination;
  const board = bossesInPlay(game);
  const removeBoss = (entry: BoardEntry) => {
    if (confirmingRemove !== entry.key) {
      setConfirmingRemove(entry.key);
      return;
    }
    setConfirmingRemove('');
    if (entry.kind === 'trejo') {
      if (haptics) drawFeedback();
      removeTrejo();
      say([t('boss.removed', { name: t(`trejo.${entry.stage}`) })]);
      return;
    }
    const next = removeFromBoard(game, entry.target, Math.random, bossPowers);
    if (next === game) return;
    if (haptics) drawFeedback();
    update(() => next);
    // A removed beast of a chain brings the next one by hand (and a bringer's escorts come with it): the removal and
    // what arrived go in ONE announcement, since consecutive ones cut each other off.
    say([t('boss.removed', { name: abominationName(entry.boss, t) }), ...arrivedAfter(game, next, 'manual')]);
  };
  // Focus stays on the button after these, and none changes `drawn`: each says what it just did, in one announcement.
  const labelOf = (group: Revealed) => (manualRule ? groupLabel(group, manualRule, t) : '');
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
    // The key counts the escorts a bringer adds after the boss; the view opens on its first SPAM, if any.
    const hasSpam = (next.piles.bosses?.manual[extra]?.spam?.length ?? 0) > 0;
    setViewed({ step: `${drawnKey}#${next.piles.bosses?.manual.length ?? extra + 1}`, ref: hasSpam ? { kind: 'spam', of: { kind: 'manual', index: extra }, n: 0 } : { kind: 'manual', index: extra } });
    update(() => next);
    say(arrivedAfter(game, next, 'manual'));
  };
  const changeDanger = (level: DangerLevel) => {
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
    say(arrivedAfter(game, next, 'all'));
  };
  const reveal = revealOf(game.piles.bosses?.revealed, game.bossRule, danger, trejoOnBoard);
  const isFlipped = (index: number) => flips.step === drawnKey && flips.open.includes(index);
  const toggleFlip = (index: number) => {
    // A tap that stopped a scrolling rule (or came right after) is not a request to turn the card.
    if (scrolledRecently()) return;
    setFlips((current) => {
      const open = current.step === drawnKey ? current.open : [];
      return { step: drawnKey, open: open.includes(index) ? open.filter((i) => i !== index) : [...open, index] };
    });
  };
  const fade = (face: React.ReactNode, faceReveal?: Reveal) => (isGone(faceReveal) ? <View style={styles.gone}>{face}</View> : face);
  // `onTap`: what a tap on the face does (turn it, or reopen Gozer's choice); the faces take it themselves.
  const cardFace = (card: ZombieCard, index: number, faceWidth: number, onTap: () => void, zoomButton?: boolean) => {
    const shownReveal = reveal(card.id);
    const front = <CardFace card={card} danger={danger} width={faceWidth} reveal={shownReveal} zoomButton={zoomButton} trejoOutcome={trejoChoice(card.id)} />;
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
    const next = deal(game);
    if (next === game) return;
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

  const shown = sequence ? 1 : Math.max(1, slots.length);
  const label = zones > 1 || slots.length > 1 ? (sequence ? SEQUENCE_HEADER : ZONE_LABEL) : 0;
  // Remembered by its owner, so a SPAM appearing or moving does not move the view to another card.
  const viewKey = `${drawnKey}#${extra}`;
  // The enlarged card is remembered by position, so it closes when the places change.
  const zoomKey = `${viewKey}#${slots.length}`;
  // Unless a chip was tapped (or an Abomination just drawn by hand), the last card dealt (from its first SPAM): a new zone card shows at once.
  const defaultView = entryPosition(slots, drawn.length > 0 ? { kind: 'card', index: drawn.length - 1 } : { kind: 'manual', index: extra - 1 });
  const keptView = viewed?.step === viewKey ? slotPosition(slots, viewed.ref) : -1;
  const viewedIndex = Math.min(keptView >= 0 ? keptView : defaultView, slots.length - 1);
  const { width, deckWidth, columns, rows } = tableLayout(table, shown, label);
  // A single card sits in a column as wide as the deck: when the zone line above it makes it a little smaller, it
  // stays centred there instead of shifting the deck.
  const column = shown === 1 ? Math.max(width, deckWidth) : width;
  const rowWidth = Math.max(0, Math.min(table.width - deckWidth - TABLE_GAP, columns * column + (columns - 1) * TABLE_GAP));
  const slot = { width, aspectRatio: CARD_RATIO };
  const zoomedSlot = zoomed?.step === zoomKey ? slots[zoomed.slot] : undefined;
  const zoomedCard = zoomedSlot?.kind === 'card' ? CARDS_BY_ID.get(drawn[zoomedSlot.index]) : undefined;
  const zoomedGroup = zoomedSlot?.kind === 'manual' ? manualGroups[zoomedSlot.index] : undefined;
  const zoomedSpam = zoomedSlot?.kind === 'spam' ? zoomedSlot : undefined;
  // Where a card or an Abomination drawn by hand keeps its side (`isFlipped`): the cards of the step, then the Abominations.
  const flipIndex = zoomedSlot?.kind === 'manual' ? drawn.length + zoomedSlot.index : zoomedSlot?.kind === 'card' ? zoomedSlot.index : -1;
  const zoom = (owner: { kind: 'card' | 'manual'; index: number }) => setZoomed({ step: zoomKey, slot: slotPosition(slots, owner) });
  const zoomFlippable = zoomedGroup
    ? bossHasBack(zoomedGroup.reveal, t)
    : !!zoomedCard && cardHasBack(zoomedCard, danger, t, reveal(zoomedCard.id));
  const dealt = drawn.map((id, index) => {
    const card = CARDS_BY_ID.get(id);
    const waiting = !!game.piles.bosses?.revealed[id]?.choice;
    const zoomable = shown > 1;
    const flippable = !!card && cardHasBack(card, danger, t, reveal(id));
    const flipped = flippable && isFlipped(index);
    // A button hides its content from TalkBack, so it carries the whole card.
    const asButton = zoomable || waiting || flippable;
    return (
      <View key={`${id}-${index}`} style={{ width: column, alignItems: 'center' }}>
        {label > 0 && (
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
            // Gozer's choice first, then turn over to the rule, else enlarge.
            onPress={waiting ? reopenChoice : flippable ? () => toggleFlip(index) : () => zoom({ kind: 'card', index })}
            button={asButton}
            label={
              asButton && card
                ? `${label > 0 ? `${t('game.zone', { n: cardZones[index] })}: ` : ''}${cardLabel(card, danger, t, reveal(id), trejoChoice(id))}`
                : undefined
            }
            hint={waiting ? t('boss.tapToChoose') : flippable ? flipHint(flipped) : zoomable ? t('game.zoom') : undefined}
            expanded={flippable && !waiting ? flipped : undefined}
          >
            {card && (
              <Animated.View
                style={[styles.drawn, { transform: [{ perspective: PERSPECTIVE }, { rotateY }] }]}
                accessibilityElementsHidden={asButton}
                importantForAccessibility={asButton ? 'no-hide-descendants' : 'auto'}
              >
                {cardFace(card, index, width, waiting ? reopenChoice : () => toggleFlip(index), zoomable)}
              </Animated.View>
            )}
          </CardButton>
          {zoomable && card && <ZoomButton label={t('game.zoom')} onPress={() => zoom({ kind: 'card', index })} />}
        </View>
      </View>
    );
  });

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
          {shown > 1 && <ZoomButton label={t('game.zoom')} onPress={() => zoom({ kind: 'manual', index: i })} />}
        </View>
      </View>
    );
  });

  // A SPAM set aside, as its own printed card before the one that called the Abomination; it has no back, only to enlarge.
  const spamCard = (place: Extract<TableSlot, { kind: 'spam' }>, position: number) => {
    const owner = place.of;
    const zoneText = owner.kind === 'card' ? t('game.zone', { n: cardZones[owner.index] }) : t('game.manualBoss');
    const zoomable = shown > 1;
    return (
      <View key={`spam-${position}`} style={{ width: column, alignItems: 'center' }}>
        {label > 0 && (
          <Text style={[styles.zone, styles.zoneLine]} numberOfLines={1} importantForAccessibility={zoomable ? 'no' : 'auto'}>
            {zoneText}
          </Text>
        )}
        <View style={slot}>
          <CardButton
            style={styles.drawn}
            disabled={!zoomable}
            onPress={() => setZoomed({ step: zoomKey, slot: position })}
            button={zoomable}
            label={zoomable ? `${label > 0 ? `${zoneText}: ` : ''}${spamLabel(t)}` : undefined}
            hint={zoomable ? t('game.zoom') : undefined}
          >
            <View style={styles.drawn} accessibilityElementsHidden={zoomable} importantForAccessibility={zoomable ? 'no-hide-descendants' : 'auto'}>
              <SpamFace width={width} zoomButton={zoomable} />
            </View>
          </CardButton>
          {zoomable && <ZoomButton label={t('game.zoom')} onPress={() => setZoomed({ step: zoomKey, slot: position })} />}
        </View>
      </View>
    );
  };
  // The cards, SPAMs and Abominations drawn by hand in the order of the table.
  const onTable = slots.map((place, position) => (place.kind === 'card' ? dealt[place.index] : place.kind === 'manual' ? manualCards[place.index] : spamCard(place, position)));

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
              slots={slots}
              drawn={drawn}
              cardZones={cardZones}
              zones={zones}
              pending={pendingZones(game, cardEffect)}
              extraLabel={t('game.manualBoss')}
              viewedIndex={viewedIndex}
              onView={(index) => setViewed({ step: viewKey, ref: slots[index] })}
              header={label}
              width={width}
              column={column}
              renderSlot={(place) => {
                if (place.kind === 'spam') return <SpamFace width={width} />;
                if (place.kind === 'manual') {
                  const { group, reveal: groupFace } = manualGroups[place.index];
                  const index = drawn.length + place.index;
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
                }
                const { index } = place;
                const id = drawn[index];
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
                    label={cardLabel(card, danger, t, reveal(id), trejoChoice(id))}
                    hint={waiting ? t('boss.tapToChoose') : flipHint(flipped)}
                    expanded={waiting ? undefined : flipped}
                  >
                    {face}
                  </CardButton>
                ) : (
                  face
                );
              }}
              chipLabel={t('game.manualChip')}
              spamLabel={t('card.spamTitle')}
              spamChip={t('card.spamTitle').split(' (')[0]}
              flip={rotateY}
              emptyText={t('game.noCard')}
              t={t}
            />
          ) : slots.length === 0 ? (
            <View style={{ width: column, paddingTop: label, alignItems: 'center' }}>
              <View style={[slot, styles.empty]}>
                <Text style={styles.emptyText}>{t('game.noCard')}</Text>
              </View>
            </View>
          ) : rows > 1 ? (
            <View style={[styles.grid, { width: rowWidth }]}>
              {onTable}
            </View>
          ) : (
            <ScrollView
              key={drawnKey}
              horizontal
              style={{ width: rowWidth, flexGrow: 0 }}
              contentContainerStyle={styles.row}
              showsHorizontalScrollIndicator={false}
            >
              {onTable}
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
                const name = entry.kind === 'trejo' ? t(`trejo.${entry.stage}`) : abominationName(entry.boss, t);
                return (
                  <Pressable
                    key={entry.key}
                    style={({ pressed }) => [styles.boardButton, confirming && styles.boardConfirm, pressed && PRESSED]}
                    onPress={() => removeBoss(entry)}
                    accessibilityRole="button"
                    accessibilityLabel={t(entry.kind === 'necromancer' ? 'boss.removeNecromancerLabel' : entry.kind === 'trejo' && entry.stage === 'walker' ? 'boss.removeLabel' : 'boss.removeAbominationLabel', { name })}
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
      {(zoomedCard || zoomedGroup || zoomedSpam) && zoomed && (
        <Modal
          transparent
          animationType="fade"
          // iOS opens modals in portrait unless told otherwise.
          supportedOrientations={['landscape', 'landscape-left', 'landscape-right']}
          onRequestClose={() => setZoomed(null)}
          // Android: the overlay also covers the system bars and the camera cutout.
          statusBarTranslucent
          navigationBarTranslucent
        >
          <View style={styles.zoom}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setZoomed(null)}
              accessibilityRole="button"
              accessibilityLabel={t('game.close')}
            />
            {label > 0 && (
              <Text style={styles.zone}>
                {zoomedGroup ? t('game.manualBoss') : zoomedSpam ? (zoomedSpam.of.kind === 'card' ? t('game.zone', { n: cardZones[zoomedSpam.of.index] }) : t('game.manualBoss')) : zoomedSlot?.kind === 'card' ? t('game.zone', { n: cardZones[zoomedSlot.index] }) : ''}
              </Text>
            )}
            <CardButton
              // An explicit height, not aspectRatio: the card's back is a ScrollView, which only scrolls when its
              // height is bounded; with a height derived from the ratio Android lets it grow and clip instead.
              style={{ width: zoomWidth(window), height: zoomWidth(window) / CARD_RATIO }}
              faces={zoomFlippable}
              onPress={zoomFlippable ? () => toggleFlip(flipIndex) : () => setZoomed(null)}
              button
              label={zoomedSpam ? spamLabel(t) : zoomedGroup ? bossLabel(zoomedGroup.reveal, t) : zoomedCard ? cardLabel(zoomedCard, danger, t, reveal(zoomedCard.id), trejoChoice(zoomedCard.id)) : undefined}
              hint={zoomFlippable ? flipHint(isFlipped(flipIndex)) : undefined}
              expanded={zoomFlippable ? isFlipped(flipIndex) : undefined}
            >
              {zoomedSpam ? (
                <SpamFace width={zoomWidth(window)} />
              ) : zoomedGroup ? (
                bossFace(zoomedGroup.reveal, flipIndex, zoomWidth(window), () => toggleFlip(flipIndex))
              ) : (
                zoomedCard && cardFace(zoomedCard, flipIndex, zoomWidth(window), () => toggleFlip(flipIndex))
              )}
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

const slotsOf = (state: GameState): TableSlot[] =>
  tableSlots(
    state.piles.drawn.map((id) => state.piles.bosses?.revealed[id]?.spam),
    // Abominations drawn by hand only exist with a boss rule.
    (state.bossRule ? state.piles.bosses?.manual ?? [] : []).map((group) => group.spam),
  );

const groupLabel = (group: Revealed, rule: BossRule, t: Translate): string => [...(group.spam ?? []).map(() => spamLabel(t)), bossLabel(groupReveal(group, rule), t)].join(' ');

const zoomWidth = (window: { width: number; height: number }) =>
  Math.min((window.height * ZOOM_HEIGHT - ZONE_LABEL) * CARD_RATIO, window.width * ZOOM_HEIGHT);

// Sizes the deck and `shown` cards to fit the table: one row, or two or three when clearly larger.
// Beside a single card the deck takes the whole height, so the zone line never resizes it.
function tableLayout(table: { width: number; height: number }, shown: number, label: number) {
  const tallest = (rows: number) => Math.max(0, ((table.height - (rows - 1) * TABLE_GAP) / rows - label) * CARD_RATIO);
  if (shown === 1) {
    const half = Math.max(0, (table.width - TABLE_GAP) / 2);
    return { width: Math.min(tallest(1), half), deckWidth: Math.min(table.height * CARD_RATIO, half), columns: 1, rows: 1 };
  }
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

const revealOf =
  (revealed: Record<string, Revealed> | undefined, rule: BossRule | null | undefined, danger: DangerLevel | undefined, trejoOnBoard: (cardId: string) => boolean) =>
  (cardId: string): Reveal | undefined => {
    const shown = revealed?.[cardId];
    if (shown && rule) return groupReveal(shown, rule);
    // No named Abominations (`bosses` is null): the engine reveals nothing, but a card calling for an Abomination at this
    // Danger Level still gives the Trejobomination on the board its Extra Activation instead of spawning one.
    if (!rule && danger && bossTrigger(cardId, danger) === 'abomination' && trejoOnBoard(cardId)) {
      return { kind: 'abomination', boss: NO_BOSS, rule: 'oneAtATime', trejo: true };
    }
    return undefined;
  };

type BoardEntry = { key: string; kind: BossKind; boss: string; target: BossTarget } | { key: string; kind: 'trejo'; stage: 'walker' | 'abomination' };

function bossesInPlay(game: GameState): BoardEntry[] {
  const { stage } = game.piles.trejo;
  // The Trejo of the board is not a boss of `Piles.bosses`: it comes after them and exists without any boss deck.
  const trejo: BoardEntry[] = stage === 'none' ? [] : [{ key: `trejo:${stage}`, kind: 'trejo', stage }];
  const bosses = game.piles.bosses;
  if (!bosses) return trejo;
  const board = bosses.onBoard.map(({ kind, boss }, at): BoardEntry => ({ key: `board:${at}:${boss}`, kind, boss, target: { from: 'board', boss } }));
  const step = game.piles.drawn.flatMap((card) => {
    const group = bosses.revealed[card];
    return group ? liveBosses(group).map((boss): BoardEntry => ({ key: `step:${card}:${boss}`, kind: group.kind, boss, target: { from: 'step', card, boss } })) : [];
  });
  const manual = bosses.manual.flatMap((group, index) =>
    liveBosses(group).map((boss): BoardEntry => ({ key: `manual:${index}:${boss}`, kind: group.kind, boss, target: { from: 'manual', index, boss } })),
  );
  return [...board, ...step, ...manual, ...trejo];
}

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
  trejo: group.trejo,
  gone: group.gone,
});

function pendingPlace(game: GameState): string {
  const bosses = game.piles.bosses;
  const card = game.piles.drawn.find((id) => bosses?.revealed[id]?.choice);
  return card ? `card:${card}` : `manual:${bosses?.manual.findIndex((group) => group.choice) ?? -1}`;
}

// As a button it carries the whole card for the screen reader: TalkBack hides what a button holds.
function CardButton(props: {
  style: object;
  onPress: () => void;
  button: boolean;
  disabled?: boolean;
  label?: string;
  hint?: string;
  expanded?: boolean;
  // Faces take the taps (see FlipCard, RuleSide): a touchable around the scrolling rule would hold the gesture.
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
  trejoOutcome: (cardId: string) => TrejoChoice | undefined,
  spamCount: (cardId: string) => number,
): string {
  const cardZones = zonesOf(drawn, cardEffect, zones);
  const withZones = zones > 1 || drawn.length > 1;
  const indexes = sequence ? [drawn.length - 1] : drawn.map((_, index) => index);
  return indexes
    .map((index) => {
      const card = CARDS_BY_ID.get(drawn[index]);
      if (!card) return '';
      // The SPAMs set aside were drawn before the card: read first, each as its own card.
      const labels = [...Array.from({ length: spamCount(card.id) }, () => spamLabel(t)), cardLabel(card, danger, t, reveal(card.id), trejoOutcome(card.id))];
      return labels.map((label) => (withZones ? `${t('game.zone', { n: cardZones[index] })}: ${label}` : label)).join(' ');
    })
    .filter(Boolean)
    .join(' ');
}

function OneAtATime(props: {
  slots: readonly TableSlot[];
  drawn: readonly string[];
  cardZones: readonly number[];
  zones: number;
  /** The zone of each card still to come in this step: twice for a zone owed two cards by a Double Spawn. */
  pending: readonly number[];
  extraLabel: string;
  chipLabel: string;
  spamLabel: string;
  /** Cut short: a long name ("SPAM (mielonka)") would squash the title. */
  spamChip: string;
  renderSlot: (slot: TableSlot, position: number) => React.ReactNode;
  viewedIndex: number;
  onView: (index: number) => void;
  header: number;
  width: number;
  column: number;
  flip: Animated.AnimatedInterpolation<string>;
  emptyText: string;
  t: Translate;
}) {
  const { slots, drawn, cardZones, zones, pending, viewedIndex, t } = props;
  const viewed = slots[viewedIndex];
  // The card just dealt flips, also when an Abomination drawn by hand sits after it.
  const isLast = viewed?.kind === 'card' && viewed.index === drawn.length - 1;
  const slot = { width: props.width, aspectRatio: CARD_RATIO };
  // What each place is called: its zone, "Abomination" for one drawn by hand, "SPAM".
  const nameOf = (place: TableSlot) => (place.kind === 'card' ? t('game.zone', { n: cardZones[place.index] }) : place.kind === 'manual' ? props.extraLabel : props.spamLabel);
  const chipOf = (place: TableSlot) => (place.kind === 'card' ? String(cardZones[place.index]) : place.kind === 'manual' ? props.chipLabel : props.spamChip);
  return (
    <View style={{ width: props.column, alignItems: 'center' }}>
      {props.header > 0 && (
        <View style={[styles.sequenceHeader, { height: props.header, width: props.width }]}>
          <View style={styles.sequenceRow}>
            <Text style={[styles.zone, styles.sequenceTitle]} numberOfLines={1}>
              {viewed?.kind === 'card' || !viewed ? t('game.zoneOf', { n: viewed ? cardZones[viewed.index] : 1, total: zones }) : viewed.kind === 'manual' ? nameOf(viewed) : props.spamChip}
            </Text>
            {slots.map((place, position) => (
              <Pressable
                key={`${place.kind}-${position}`}
                style={({ pressed }) => [styles.chip, position === viewedIndex && styles.chipViewed, pressed && PRESSED]}
                onPress={() => props.onView(position)}
                accessibilityRole="button"
                accessibilityLabel={nameOf(place)}
                accessibilityState={{ selected: position === viewedIndex }}
              >
                <Text style={[styles.chipText, position === viewedIndex && styles.chipTextViewed]}>{chipOf(place)}</Text>
              </Pressable>
            ))}
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
      {viewed ? (
        <View style={slot}>
          <Animated.View style={[styles.drawn, isLast && { transform: [{ perspective: PERSPECTIVE }, { rotateY: props.flip }] }]}>
            {props.renderSlot(viewed, viewedIndex)}
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
