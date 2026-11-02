import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CardBack } from '@/components/card-back';
import { CardFace } from '@/components/card-face';
import { CARD_SETS, CARDS_BY_ID } from '@/data/decks';
import { DANGER_LEVELS, drawCard, reshuffleAll, setDanger, undo } from '@/game/engine';
import { useApp } from '@/game/store';
import type { GameState } from '@/game/types';
import { COLORS, DANGER_COLORS } from '@/theme';

const CARD_RATIO = 63 / 88;

export default function GameScreen() {
  const { game, setGame, t } = useApp();
  const currentId = game?.piles.current ?? null;

  const [flip] = useState(() => new Animated.Value(1));
  useEffect(() => {
    flip.setValue(0);
    Animated.timing(flip, { toValue: 1, duration: 260, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [currentId, flip]);

  if (!game) return <Redirect href="/" />;

  const update = (change: (state: GameState) => GameState) =>
    setGame((state) => (state ? change(state) : state));

  const { danger } = game;
  const card = currentId ? CARDS_BY_ID.get(currentId) : undefined;
  const isDemo = CARD_SETS.some((set) => game.setIds.includes(set.id) && !set.verified);
  const rotateY = flip.interpolate({ inputRange: [0, 1], outputRange: ['90deg', '0deg'] });

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <View style={styles.columns}>
        <View style={styles.table}>
          <View style={styles.slot}>
            <CardBack
              count={game.piles.draw.length}
              label={t('game.draw')}
              onPress={() => update((state) => drawCard(state))}
            />
          </View>
          <View style={styles.slot}>
            {card ? (
              <Animated.View style={[styles.drawn, { transform: [{ perspective: 800 }, { rotateY }] }]}>
                <CardFace card={card} danger={danger} />
              </Animated.View>
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>{t('game.noCard')}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.controls}>
          <Text style={styles.heading}>{t('danger.title')}</Text>
          <View style={styles.levels}>
            {DANGER_LEVELS.map((level) => (
              <Pressable
                key={level}
                style={[
                  styles.level,
                  { backgroundColor: DANGER_COLORS[level].background },
                  level === danger && styles.levelActive,
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
            {isDemo && <Text style={styles.notice}>{t('demoWarning')}</Text>}
            {game.piles.reshuffled && <Text style={styles.notice}>{t('game.reshuffled')}</Text>}
          </View>

          <SmallButton label={t('game.undo')} disabled={game.history.length === 0} onPress={() => update(undo)} />
          <SmallButton label={t('game.shuffle')} onPress={() => update((state) => reshuffleAll(state))} />
          <Text style={styles.muted}>{t('game.discard', { n: game.piles.discard.length })}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function SmallButton(props: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      style={[styles.small, props.disabled && styles.disabled]}
      disabled={props.disabled}
      onPress={props.onPress}
      accessibilityRole="button"
    >
      <Text style={styles.smallText}>{props.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  columns: { flex: 1, flexDirection: 'row', padding: 12, gap: 16 },
  table: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 16 },
  slot: { height: '100%', aspectRatio: CARD_RATIO },
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
  controls: { width: 200, gap: 8 },
  heading: { color: COLORS.muted, fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },
  levels: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  level: { width: 97, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center', opacity: 0.75 },
  levelActive: { opacity: 1, borderWidth: 3, borderColor: '#ffffff' },
  levelText: { fontSize: 14, fontWeight: '800' },
  spacer: { flex: 1, justifyContent: 'center', gap: 4 },
  notice: { color: COLORS.warning, fontSize: 13, textAlign: 'center' },
  muted: { color: COLORS.muted, fontSize: 13, textAlign: 'center' },
  small: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  smallText: { color: COLORS.text, fontSize: 15 },
  disabled: { opacity: 0.4 },
});
