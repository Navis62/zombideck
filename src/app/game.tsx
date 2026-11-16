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
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBackground } from '@/components/app-background';
import { Button } from '@/components/button';
import { CardBack } from '@/components/card-back';
import { BossFace, bossLabel, CardFace, cardLabel, type Reveal } from '@/components/card-face';
import { abominationName, ChoiceSheet } from '@/components/choice-sheet';
import { DiscardSheet } from '@/components/discard-sheet';
import { bossTrigger, CARDS_BY_ID, cardEffect, UNIVERSES } from '@/data/universes';
import {
  chooseGained,
  DANGER_LEVELS,
  drawAbomination,
  drawCards,
  drawNextCard,
  MAX_ZONES,
  noPowers,
  pendingChoice,
  pendingZones,
  reshuffleAll,
  setDanger,
  setZones,
  shuffleDeck,
  startsNewStep,
  undo,
  zonesOf,
} from '@/game/engine';
import { drawFeedback } from '@/game/feedback';
import { countDraw } from '@/game/review';
import { useApp } from '@/game/store';
import type { BossRule, DangerLevel, GameState, Revealed } from '@/game/types';
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
/** Time to tap "Reshuffle all" a second time before it goes back to normal. */
const CONFIRM_MS = 3000;
/** Wait before Gozer's choice opens: the card flips (260 ms) and is read out first, so the players see Gozer arrive. */
const CHOICE_DELAY_MS = 700;

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

  const [showDiscard, setShowDiscard] = useState(false);
  // One zone at a time: the card looked at, the last one dealt unless a zone above it was tapped since.
  const [viewed, setViewed] = useState<{ step: string; index: number } | null>(null);
  // Several cards side by side are small: one tapped is shown full screen, until the next draw.
  const [zoomed, setZoomed] = useState<{ step: string; index: number } | null>(null);
  const window = useWindowDimensions();

  // Focus stays on the deck after a draw: without an announcement, a screen reader would not say the new cards. The
  // cards on display when the screen opens are not announced; an undo announces the cards it brings back.
  const sequence = zoneDisplay === 'sequence';
  const drawnCards = game?.piles.drawn;
  const announced = useRef(drawnCards);
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
    if (!drawnCards?.length || !currentDanger || !zoneCount || Platform.OS === 'web') return;
    const reveal = revealOf(revealed, bossRule);
    AccessibilityInfo.announceForAccessibility(announcement(drawnCards, currentDanger, zoneCount, sequence, t, reveal));
  }, [drawnCards, currentDanger, zoneCount, sequence, t, revealed, bossRule]);

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
  // Focus stays on the button after these two, and neither changes `drawn`: each says what it just did.
  const announceGroup = (group: Revealed | undefined) => {
    if (group && manualRule && Platform.OS !== 'web') {
      AccessibilityInfo.announceForAccessibility(bossLabel(groupReveal(group, manualRule), t));
    }
  };
  const groupsOf = (state: GameState) => [...Object.values(state.piles.bosses?.revealed ?? {}), ...(state.piles.bosses?.manual ?? [])];
  const drawByHand = () => {
    const next = drawAbomination(game, Math.random, bossPowers);
    if (next === game) return;
    if (haptics) drawFeedback();
    // The new Abomination comes into view, whichever card of the step was looked at.
    setViewed({ step: `${drawnKey}#${extra + 1}`, index: drawn.length + extra });
    update(() => next);
    announceGroup(next.piles.bosses?.manual.at(-1));
  };
  const confirmChoice = (picked: string[]) => {
    const next = chooseGained(game, picked);
    if (next === game) return;
    update(() => next);
    // The group just resolved is the one that is new: the others keep their identity.
    const before = groupsOf(game);
    announceGroup(groupsOf(next).find((group) => !before.includes(group)));
  };
  const reveal = revealOf(game.piles.bosses?.revealed, game.bossRule);
  const draw = () => {
    // No card left to deal (the rest are on display for this step): no vibration, no draw counted.
    if (deal(game) === game) return;
    // The rating prompt counts Spawn steps, however the zones are dealt.
    if (!sequence || startsNewStep(game, cardEffect)) countDraw();
    update(deal);
    if (haptics) drawFeedback();
  };
  const reshuffle = () => {
    if (!confirmingShuffle) {
      setConfirmingShuffle(true);
      return;
    }
    setConfirmingShuffle(false);
    shuffleWith((state) => reshuffleAll(state));
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
  const zoomedGroup = zoomed?.step === drawnKey && zoomed.index >= drawn.length ? manualGroups[zoomed.index - drawn.length] : undefined;  const dealt = drawn.map((id, index) => {
    const card = CARDS_BY_ID.get(id);
    const waiting = !!game.piles.bosses?.revealed[id]?.choice;
    const zoomable = shown > 1;
    // A button hides what it holds from TalkBack: it carries the whole card.
    const asButton = zoomable || waiting;
    return (
      <View key={`${id}-${index}`} style={{ width: column, alignItems: 'center' }}>
        {label > 0 && (
          // The zone is read with the card of its button below.
          <Text style={[styles.zone, styles.zoneLine]} numberOfLines={1} importantForAccessibility={asButton ? 'no' : 'auto'}>
            {t('game.zone', { n: cardZones[index] })}
          </Text>
        )}
        <CardButton
          style={slot}
          disabled={!card || !asButton}
          onPress={waiting ? reopenChoice : () => setZoomed({ step: drawnKey, index })}
          button={asButton}
          // One announcement per card: a button hides what it holds from TalkBack, so it carries the whole card.
          label={
            asButton && card
              ? `${label > 0 ? `${t('game.zone', { n: cardZones[index] })}: ` : ''}${cardLabel(card, danger, t, reveal(id))}`
              : undefined
          }
          hint={waiting ? t('boss.tapToChoose') : zoomable ? t('game.zoom') : undefined}
        >
          {card && (
            <Animated.View
              style={[styles.drawn, { transform: [{ perspective: 800 }, { rotateY }] }]}
              accessibilityElementsHidden={asButton}
              importantForAccessibility={asButton ? 'no-hide-descendants' : 'auto'}
            >
              <CardFace card={card} danger={danger} width={width} reveal={reveal(id)} />
            </Animated.View>
          )}
        </CardButton>
      </View>
    );
  });

  // Abominations drawn by hand sit after the cards of the step, under a line of their own.
  const manualCards = manualGroups.map(({ group, reveal: groupFace }, i) => {
    const index = drawn.length + i;
    const waiting = !!group.choice;
    return (
      <View key={`manual-${i}`} style={{ width: column, alignItems: 'center' }}>
        <Text style={[styles.zone, styles.zoneLine]} numberOfLines={1} importantForAccessibility="no">
          {t('game.manualBoss')}
        </Text>
        <CardButton
          style={slot}
          onPress={waiting ? reopenChoice : () => setZoomed({ step: drawnKey, index })}
          button
          label={`${t('game.manualBoss')}: ${bossLabel(groupFace, t)}`}
          hint={waiting ? t('boss.tapToChoose') : t('game.zoom')}
        >
          <View style={styles.drawn} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <BossFace reveal={groupFace} width={width} universe={game.universe} />
          </View>
        </CardButton>
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
              renderCard={(id) => {
                const card = CARDS_BY_ID.get(id);
                if (!card) return null;
                const face = <CardFace card={card} danger={danger} width={width} reveal={reveal(id)} />;
                return game.piles.bosses?.revealed[id]?.choice ? (
                  <CardButton
                    style={styles.drawn}
                    onPress={reopenChoice}
                    button
                    label={cardLabel(card, danger, t, reveal(id))}
                    hint={t('boss.tapToChoose')}
                  >
                    {face}
                  </CardButton>
                ) : (
                  face
                );
              }}
              renderExtra={(i) => {
                const { group, reveal: groupFace } = manualGroups[i];
                const face = <BossFace reveal={groupFace} width={width} universe={game.universe} />;
                return group.choice ? (
                  <CardButton style={styles.drawn} onPress={reopenChoice} button label={bossLabel(groupFace, t)} hint={t('boss.tapToChoose')}>
                    {face}
                  </CardButton>
                ) : (
                  face
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
                onPress={() => update((state) => setDanger(state, level, bossTrigger, Math.random, bossPowers))}
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
              disabled={abominationDeck.draw.length + abominationDeck.discard.length === 0}
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
            {label > 0 && (
              <Text style={styles.zone}>{zoomedGroup ? t('game.manualBoss') : t('game.zone', { n: cardZones[zoomed.index] })}</Text>
            )}
            {/* Touches go through the card to the close button over the whole screen; the card stays readable. */}
            <View style={{ width: zoomWidth(window), aspectRatio: CARD_RATIO }} pointerEvents="none">
              {zoomedGroup ? (
                <BossFace reveal={zoomedGroup.reveal} width={zoomWidth(window)} universe={game.universe} />
              ) : (
                zoomedCard && <CardFace card={zoomedCard} danger={danger} width={zoomWidth(window)} reveal={reveal(zoomedCard.id)} />
              )}
            </View>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setZoomed(null)}
              accessibilityRole="button"
              accessibilityLabel={t('game.close')}
            />
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

/** A revealed group with its powers: the SPAMs, the bosses brought along or gained, a choice still to make. */
const groupReveal = (group: Revealed, rule: BossRule): Reveal => ({
  kind: group.kind,
  boss: group.boss,
  rule,
  spam: group.spam,
  along: group.along,
  gained: group.gained,
  choosing: !!group.choice,
});

/** Where the choice Gozer waits on lives: a card of the step, else the Abomination drawn by hand at that position. */
function pendingPlace(game: GameState): string {
  const bosses = game.piles.bosses;
  const card = game.piles.drawn.find((id) => bosses?.revealed[id]?.choice);
  return card ? `card:${card}` : `manual:${bosses?.manual.findIndex((group) => group.choice) ?? -1}`;
}

/**
 * A card face that can be tapped (zoom, or Gozer's choice again). As a button it carries the whole card for the screen
 * reader: a button hides what it holds from TalkBack.
 */
function CardButton(props: {
  style: object;
  onPress: () => void;
  button: boolean;
  disabled?: boolean;
  label?: string;
  hint?: string;
  children?: React.ReactNode;
}) {
  return (
    <Pressable
      style={({ pressed }) => [props.style, pressed && PRESSED]}
      disabled={props.disabled}
      onPress={props.onPress}
      accessibilityRole={props.button ? 'button' : undefined}
      accessibilityLabel={props.label}
      accessibilityHint={props.hint}
    >
      {props.children}
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
  renderCard: (id: string) => React.ReactNode;
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
            {props.renderCard(viewedId)}
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
  spacer: { flexGrow: 1, minHeight: 12, justifyContent: 'center', gap: 4 },
  notice: { color: COLORS.warning, fontSize: 13, textAlign: 'center' },
});
