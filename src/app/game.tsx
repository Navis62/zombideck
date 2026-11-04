import { useKeepAwake } from 'expo-keep-awake';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBackground } from '@/components/app-background';
import { Button } from '@/components/button';
import { CardBack } from '@/components/card-back';
import { CardFace } from '@/components/card-face';
import { DiscardSheet } from '@/components/discard-sheet';
import { CARDS_BY_ID } from '@/data/decks';
import { DANGER_LEVELS, drawCard, reshuffleAll, setDanger, shuffleDeck, undo } from '@/game/engine';
import { drawFeedback } from '@/game/feedback';
import { countDraw } from '@/game/review';
import { useApp } from '@/game/store';
import type { GameState } from '@/game/types';
import { COLORS, DANGER_COLORS, PRESSED } from '@/theme';

const CARD_RATIO = 63 / 88;
const TABLE_GAP = 16;
/** Time to tap "Reshuffle all" a second time before it goes back to normal. */
const CONFIRM_MS = 3000;

export default function GameScreen() {
  const { game, setGame, haptics, t } = useApp();
  const currentId = game?.piles.current ?? null;
  // The phone lies on the table for the whole game: keep the screen on.
  useKeepAwake();

  const [table, setTable] = useState({ width: 0, height: 0 });
  const [flip] = useState(() => new Animated.Value(1));
  useEffect(() => {
    flip.setValue(0);
    Animated.timing(flip, { toValue: 1, duration: 260, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [currentId, flip]);

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

  if (!game) return <Redirect href="/" />;

  const update = (change: (state: GameState) => GameState) =>
    setGame((state) => (state ? change(state) : state));

  const { danger } = game;
  const card = currentId ? CARDS_BY_ID.get(currentId) : undefined;
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
  const draw = () => {
    update((state) => drawCard(state));
    countDraw();
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
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  // Both cards must fit side by side, whichever of the width or height runs out first.
  const slot = {
    width: Math.max(0, Math.min((table.width - TABLE_GAP) / 2, table.height * CARD_RATIO)),
    aspectRatio: CARD_RATIO,
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <AppBackground />
      <View style={styles.columns}>
        <View
          style={styles.table}
          onLayout={({ nativeEvent: { layout } }) => setTable({ width: layout.width, height: layout.height })}
        >
          <Animated.View style={[slot, deckShake]}>
            <CardBack count={game.piles.draw.length} label={t('game.draw')} width={slot.width} onPress={draw} />
          </Animated.View>
          <View style={slot}>
            {card ? (
              <Animated.View style={[styles.drawn, { transform: [{ perspective: 800 }, { rotateY }] }]}>
                <CardFace card={card} danger={danger} width={slot.width} />
              </Animated.View>
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>{t('game.noCard')}</Text>
              </View>
            )}
          </View>
        </View>

        <ScrollView style={styles.controls} contentContainerStyle={styles.controlsContent}>
          <Button label={`‹ ${t('game.back')}`} onPress={leave} />
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
                onPress={() => update((state) => setDanger(state, level))}
                accessibilityRole="button"
                accessibilityState={{ selected: level === danger }}
              >
                <Text style={[styles.levelText, { color: DANGER_COLORS[level].text }]}>
                  {t(`danger.${level}`)}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.spacer}>
            {game.piles.reshuffled && <Text style={styles.notice}>{t('game.reshuffled')}</Text>}
          </View>

          <Button label={t('game.undo')} disabled={game.history.length === 0} onPress={() => update(undo)} />
          <Button
            label={t('game.shuffleDeck')}
            disabled={game.piles.draw.length < 2}
            onPress={() => shuffleWith((state) => shuffleDeck(state))}
          />
          <Button
            label={t(confirmingShuffle ? 'game.confirmShuffle' : 'game.shuffle')}
            warning={confirmingShuffle}
            onPress={reshuffle}
          />
          <Button
            label={t('game.discard', { n: game.piles.discard.length })}
            onPress={() => setShowDiscard(true)}
          />
        </ScrollView>
      </View>
      {showDiscard && (
        <DiscardSheet discard={game.piles.discard} danger={danger} onClose={() => setShowDiscard(false)} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  columns: { flex: 1, flexDirection: 'row', padding: 12, gap: 16 },
  table: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: TABLE_GAP },
  drawn: { flex: 1 },
  empty: {
    flex: 1,
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
  controlsContent: { flexGrow: 1, gap: 8 },
  heading: { color: COLORS.muted, fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },
  levels: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  level: { width: 97, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center', opacity: 0.75 },
  levelActive: { opacity: 1, borderWidth: 3, borderColor: '#ffffff' },
  levelText: { fontSize: 14, fontWeight: '800' },
  spacer: { flexGrow: 1, minHeight: 24, justifyContent: 'center', gap: 4 },
  notice: { color: COLORS.warning, fontSize: 13, textAlign: 'center' },
});
