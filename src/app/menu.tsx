import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBackground } from '@/components/app-background';
import { Hazard } from '@/components/hazard';
import { ZombieFigure } from '@/components/zombie-art';
import { switchableSets, tailorDeck, UNIVERSES } from '@/data/universes';
import { activeSetIds, ALL_PARTS, newGame, selectCards } from '@/game/engine';
import { askForReviewIfDue } from '@/game/review';
import { useApp } from '@/game/store';
import { CARD_COLORS, COLORS, PRESSED } from '@/theme';

const HORDE_GAP = 8;
/** Width over height of the zombie illustrations. */
const ART_RATIO = 0.5;
/** Lets the screen settle before the store's rating prompt can show up. */
const REVIEW_DELAY_MS = 1000;

export default function MenuScreen() {
  const { game, setGame, universe, expansions, threat, deckParts, t } = useApp();
  const { sets, deckParts: hasDeckParts, tagline, heroes } = UNIVERSES[universe];
  // A game from another universe is not resumed here, but starting a new one still replaces it.
  const resumable = game?.universe === universe ? game : null;
  const parts = hasDeckParts ? deckParts : ALL_PARTS;
  const [confirming, setConfirming] = useState(false);
  // The illustrations keep their shape: as wide as the row allows, as tall as the space left under the title.
  const [horde, setHorde] = useState({ width: 0, height: 0 });
  const zombieWidth = Math.max(0, Math.min((horde.width - HORDE_GAP * 2) / 3, horde.height * ART_RATIO));

  // Back on the menu, between two games: the only moment the rating prompt may appear.
  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => void askForReviewIfDue(), REVIEW_DELAY_MS);
      return () => clearTimeout(timer);
    }, []),
  );

  const setIds = activeSetIds(sets, expansions);
  const tailor = tailorDeck(universe, threat);
  const deckSize = tailor(selectCards(sets, setIds, parts), Math.random).cards.length;
  // A core box that replaces another is not an expansion: the counter leaves it out.
  const expansionSets = switchableSets(UNIVERSES[universe]);
  const enabledExpansions = expansionSets.filter((set) => setIds.includes(set.id)).length;

  const start = () => {
    if (game && !confirming) {
      setConfirming(true);
      return;
    }
    // Same board as last time until the players change it: keep its Spawn Zones.
    setGame(() => newGame(sets, setIds, parts, Math.random, game?.zones, universe, tailor));
    setConfirming(false);
    router.push('/game');
  };

  return (
    <View style={styles.screen}>
      <AppBackground universe={universe} vivid />
      <Hazard universe={universe} stripes={48} />
      <SafeAreaView style={styles.content} edges={['left', 'right']}>
        <View style={styles.hero}>
          <Text style={styles.title}>
            ZOMBIE <Text style={styles.titleAccent}>DECK</Text>
          </Text>
          <Text style={styles.tagline}>{t(tagline)}</Text>
          <View
            style={styles.horde}
            onLayout={({ nativeEvent: { layout } }) => setHorde({ width: layout.width, height: layout.height })}
          >
            {heroes.map((subject) => (
              <View key={subject} style={[styles.zombie, { width: zombieWidth, aspectRatio: ART_RATIO }]}>
                <ZombieFigure subject={subject} />
              </View>
            ))}
          </View>
        </View>

        {/* Scrolls when the buttons do not fit: a short screen, a large system font size. */}
        <ScrollView style={styles.menu} contentContainerStyle={styles.menuContent}>
          {resumable && (
            <Pressable
              style={({ pressed }) => [styles.primary, pressed && PRESSED]}
              onPress={() => {
                setConfirming(false);
                router.push('/game');
              }}
              accessibilityRole="button"
            >
              <Text style={styles.primaryText}>{t('menu.resume')}</Text>
              <Text style={styles.primaryDetail}>
                {t('menu.resumeDetail', { n: resumable.piles.draw.length, level: t(`danger.${resumable.danger}`) })}
              </Text>
            </Pressable>
          )}
          <Pressable
            style={({ pressed }) => [resumable ? styles.secondary : styles.primary, confirming && styles.confirm, pressed && PRESSED]}
            onPress={start}
            accessibilityRole="button"
          >
            <Text style={resumable && !confirming ? styles.secondaryText : styles.primaryText}>
              {t(confirming ? 'menu.confirmStart' : 'menu.start')}
            </Text>
            {!confirming && (
              <Text style={resumable ? styles.secondaryDetail : styles.primaryDetail}>
                {t('menu.startDetail', { n: deckSize })}
              </Text>
            )}
          </Pressable>
          {/* Set up before starting: the expansions apply to the next game. */}
          {!confirming && (
            <Pressable
              style={({ pressed }) => [styles.secondary, pressed && PRESSED]}
              onPress={() => router.push('/expansions')}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryText}>{t('expansions.title')}</Text>
              <Text style={styles.secondaryDetail}>
                {t('menu.expansionsDetail', { n: enabledExpansions, total: expansionSets.length })}
              </Text>
            </Pressable>
          )}
          <Pressable
            style={({ pressed }) => [styles.secondary, pressed && PRESSED]}
            onPress={() => (confirming ? setConfirming(false) : router.push('/options'))}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryText}>{t(confirming ? 'menu.cancel' : 'options.title')}</Text>
          </Pressable>
          {/* Side by side: the menu column stays as short as before the carousel. */}
          <View style={styles.links}>
            <Pressable
              style={({ pressed }) => [styles.link, pressed && PRESSED]}
              // Opened from the carousel, so going back is going there.
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              accessibilityRole="button"
            >
              <Text style={styles.linkText}>‹ {t('menu.changeUniverse')}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.link, pressed && PRESSED]}
              onPress={() => router.push('/about')}
              accessibilityRole="button"
            >
              <Text style={styles.linkText}>{t('about.title')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
      <Hazard universe={universe} stripes={48} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, gap: 24 },
  hero: { flex: 1, alignSelf: 'stretch', justifyContent: 'center', paddingVertical: 16 },
  title: { color: '#fff0ce', fontSize: 46, lineHeight: 50, fontWeight: '900', textShadowColor: '#171b19', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 },
  titleAccent: { color: '#ffbf69' },
  tagline: { color: '#fff0ce', fontSize: 13, fontWeight: '700' },
  horde: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: HORDE_GAP, marginTop: 10 },
  zombie: { borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: CARD_COLORS.ink },
  // A ScrollView grows by default: without flexGrow 0 it would take the width of the illustrations.
  menu: { width: 260, flexGrow: 0, alignSelf: 'stretch' },
  menuContent: { flexGrow: 1, justifyContent: 'center', gap: 10, paddingVertical: 12 },
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
  links: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  link: { paddingVertical: 6, paddingHorizontal: 10 },
  linkText: { color: '#fff0ce', fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
  confirm: { backgroundColor: CARD_COLORS.extra.background, borderColor: CARD_COLORS.extra.background },
});
