import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Hazard } from '@/components/card-back';
import { type ArtSubject, hasArt, Scene, ZombieFigure } from '@/components/zombie-art';
import { CARD_SETS } from '@/data/decks';
import { activeSetIds, newGame, selectCards } from '@/game/engine';
import { useApp } from '@/game/store';
import { CARD_COLORS, COLORS } from '@/theme';

const HERO_ZOMBIES: ArtSubject[] = ['runner', 'fatty', 'walker'];
const heroZombies = HERO_ZOMBIES.filter(hasArt);

export default function MenuScreen() {
  const { game, setGame, expansions, t } = useApp();
  const [confirming, setConfirming] = useState(false);

  const setIds = activeSetIds(CARD_SETS, expansions);
  const deckSize = selectCards(CARD_SETS, setIds).length;

  const start = () => {
    if (game && !confirming) {
      setConfirming(true);
      return;
    }
    setGame(() => newGame(CARD_SETS, setIds));
    setConfirming(false);
    router.push('/game');
  };

  return (
    <View style={styles.screen}>
      <Scene />
      <Hazard stripes={48} />
      <SafeAreaView style={styles.content} edges={['left', 'right']}>
        <View style={styles.hero}>
          <Text style={styles.title}>
            ZOMBIE <Text style={styles.titleAccent}>DECK</Text>
          </Text>
          <Text style={styles.tagline}>{t('menu.tagline')}</Text>
          {heroZombies.length > 0 && (
            <View style={styles.horde}>
              {heroZombies.map((subject) => (
                <View key={subject} style={styles.zombie}>
                  <ZombieFigure subject={subject} />
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.menu}>
          {game && (
            <Pressable style={styles.primary} onPress={() => router.push('/game')} accessibilityRole="button">
              <Text style={styles.primaryText}>{t('menu.resume')}</Text>
              <Text style={styles.primaryDetail}>
                {t('menu.resumeDetail', { n: game.piles.draw.length, level: t(`danger.${game.danger}`) })}
              </Text>
            </Pressable>
          )}
          <Pressable
            style={[game ? styles.secondary : styles.primary, confirming && styles.confirm]}
            onPress={start}
            accessibilityRole="button"
          >
            <Text style={game && !confirming ? styles.secondaryText : styles.primaryText}>
              {t(confirming ? 'menu.confirmStart' : 'menu.start')}
            </Text>
            {!confirming && (
              <Text style={game ? styles.secondaryDetail : styles.primaryDetail}>
                {t('menu.startDetail', { n: deckSize })}
              </Text>
            )}
          </Pressable>
          <Pressable
            style={styles.secondary}
            onPress={() => {
              setConfirming(false);
              router.push('/options');
            }}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryText}>{t('options.title')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
      <Hazard stripes={48} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, gap: 24 },
  hero: { flex: 1, alignSelf: 'stretch', justifyContent: 'center', paddingVertical: 16 },
  title: { color: CARD_COLORS.ink, fontSize: 46, lineHeight: 50, fontWeight: '900' },
  titleAccent: { color: '#a51f22' },
  tagline: { color: CARD_COLORS.ink, fontSize: 13, fontWeight: '700' },
  horde: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 10 },
  zombie: { flex: 1, maxWidth: 125, borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: CARD_COLORS.ink },
  menu: { width: 260, gap: 10 },
  primary: { backgroundColor: '#a51f22', borderColor: CARD_COLORS.ink, borderWidth: 2, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center' },
  primaryText: { color: '#ffffff', fontSize: 18, fontWeight: '900', textTransform: 'uppercase', textAlign: 'center' },
  primaryDetail: { color: '#ffffff', fontSize: 12, fontWeight: '600', marginTop: 2 },
  secondary: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  secondaryText: { color: COLORS.text, fontSize: 16, fontWeight: '800', textTransform: 'uppercase', textAlign: 'center' },
  secondaryDetail: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  confirm: { backgroundColor: CARD_COLORS.extra.background, borderColor: CARD_COLORS.extra.background },
});
