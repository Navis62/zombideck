import { router } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  type ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBackground } from '@/components/app-background';
import { Hazard } from '@/components/hazard';
import { ZombieFigure } from '@/components/zombie-art';
import { UNIVERSES, UPCOMING_UNIVERSES, type UpcomingUniverse } from '@/data/universes';
import { UNIVERSE_IDS } from '@/game/engine';
import { useApp } from '@/game/store';
import type { UniverseId } from '@/game/types';
import type { TranslationKey } from '@/i18n/translations';
import { CARD_COLORS, COLORS, PRESSED } from '@/theme';

/** Room between two universe cards. */
const GAP = 16;
/** A universe card never grows wider than this, so a tablet still shows its neighbours. */
const MAX_CARD_WIDTH = 420;
/** Share of the screen width one card takes: the next one peeks in, which tells the row scrolls. */
const CARD_SHARE = 0.46;

type Slide =
  | {
      kind: 'playable';
      id: UniverseId;
      name: TranslationKey;
      detail: TranslationKey;
      /** Scenery of the era. */
      art: ImageSourcePropType;
    }
  | { kind: 'upcoming'; id: UpcomingUniverse; name: TranslationKey };

const PLAYABLE: Record<UniverseId, Omit<Extract<Slide, { kind: 'playable' }>, 'kind' | 'id'>> = {
  modern: {
    name: 'universe.modern',
    detail: 'universe.modernGame',
    art: require('../../assets/backgrounds/ruined-city.jpg'),
  },
  fantasy: {
    name: 'universe.fantasy', detail: 'universe.fantasyGame',
    art: require('../../assets/backgrounds/ruined-castle.jpg'),
  },
};

const UPCOMING: Record<UpcomingUniverse, TranslationKey> = {};

const SLIDES: readonly Slide[] = [
  ...UNIVERSE_IDS.map((id): Slide => ({ kind: 'playable', id, ...PLAYABLE[id] })),
  ...UPCOMING_UNIVERSES.map((id): Slide => ({ kind: 'upcoming', id, name: UPCOMING[id] })),
];

/** Opens the app: the players pick the era of the game on the table, then reach its menu. */
export default function UniverseScreen() {
  const { universe, setUniverse, games, t } = useApp();
  const window = useWindowDimensions();
  const cardWidth = Math.min(MAX_CARD_WIDTH, Math.round(window.width * CARD_SHARE));
  const interval = cardWidth + GAP;
  // Centres a card: the space beside the first and last card equals the space around a centred one.
  const inset = Math.max(0, (window.width - cardWidth) / 2);
  const startIndex = Math.max(0, SLIDES.findIndex((slide) => slide.id === universe));
  const [index, setIndex] = useState(startIndex);

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) =>
    setIndex(Math.min(SLIDES.length - 1, Math.max(0, Math.round(event.nativeEvent.contentOffset.x / interval))));

  const open = (id: UniverseId) => {
    setUniverse(id);
    router.push('/menu');
  };

  return (
    <View style={styles.screen}>
      <AppBackground universe={universe} />
      <Hazard universe={universe} stripes={48} />
      <SafeAreaView style={styles.content} edges={['left', 'right']}>
        <View style={styles.header}>
          <Text style={styles.title}>
            ZOMBIE <Text style={styles.titleAccent}>DECK</Text>
          </Text>
          <Text style={styles.subtitle} accessibilityRole="header">
            {t('universe.title')}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={interval}
          decelerationRate="fast"
          contentOffset={{ x: startIndex * interval, y: 0 }}
          onMomentumScrollEnd={onScrollEnd}
          contentContainerStyle={[styles.row, { paddingHorizontal: inset }]}
          style={styles.carousel}
        >
          {SLIDES.map((slide) =>
            slide.kind === 'playable' ? (
              <Pressable
                key={slide.id}
                style={({ pressed }) => [styles.card, { width: cardWidth }, pressed && PRESSED]}
                onPress={() => open(slide.id)}
                accessibilityRole="button"
                accessibilityLabel={[t(slide.name), t(slide.detail), games[slide.id] !== null ? t('universe.inProgress') : '']
                  .filter(Boolean)
                  .join(', ')}
              >
                <Image source={slide.art} style={StyleSheet.absoluteFill} resizeMode="cover" />
                <View style={styles.shade} />
                <View style={styles.heroes}>
                  {UNIVERSES[slide.id].heroes.map((subject) => (
                    <View key={subject} style={styles.hero}>
                      <ZombieFigure subject={subject} />
                    </View>
                  ))}
                </View>
                <View style={[styles.caption, styles.captionRow]}>
                  <View style={styles.captionText}>
                    {/* One line: a long name ("Médiéval-fantastique") shrinks instead of breaking inside the word. */}
                    <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                      {t(slide.name)}
                    </Text>
                    <Text style={styles.detail}>{t(slide.detail)}</Text>
                  </View>
                  {/* In the caption, clear of the illustrations. */}
                  {games[slide.id] !== null && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{t('universe.inProgress')}</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            ) : (
              <View
                key={slide.id}
                style={[styles.card, styles.upcoming, { width: cardWidth }]}
                accessible
                accessibilityLabel={`${t(slide.name)}, ${t('universe.soon')}`}
                accessibilityState={{ disabled: true }}
              >
                <View style={styles.soon}>
                  <Text style={styles.soonText}>{t('universe.soon')}</Text>
                </View>
                <View style={styles.caption}>
                  <Text style={[styles.name, styles.upcomingName]}>{t(slide.name)}</Text>
                </View>
              </View>
            ),
          )}
        </ScrollView>

        {SLIDES.length > 1 && (
          <View style={styles.dots} accessible={false} importantForAccessibility="no-hide-descendants">
            {SLIDES.map((slide, i) => (
              <View key={slide.id} style={[styles.dot, i === index && styles.dotActive]} />
            ))}
          </View>
        )}
      </SafeAreaView>
      <Hazard universe={universe} stripes={48} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1, paddingVertical: 8, gap: 8 },
  header: { alignItems: 'center' },
  title: { color: '#fff0ce', fontSize: 28, lineHeight: 32, fontWeight: '900', textShadowColor: '#171b19', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 },
  titleAccent: { color: '#ffbf69' },
  subtitle: { color: '#fff0ce', fontSize: 14, fontWeight: '700', textTransform: 'uppercase' },
  carousel: { flex: 1 },
  row: { gap: GAP, alignItems: 'stretch' },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: CARD_COLORS.ink,
    backgroundColor: COLORS.surface,
    justifyContent: 'flex-end',
  },
  shade: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(9, 14, 12, 0.35)' },
  heroes: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 12 },
  // Same shape as the zombie illustrations (width over height 0.5), as tall as the card allows.
  hero: { height: '100%', aspectRatio: 0.5, borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: CARD_COLORS.ink },
  caption: { padding: 14, backgroundColor: 'rgba(9, 14, 12, 0.72)' },
  name: { color: '#ffffff', fontSize: 22, fontWeight: '900', textTransform: 'uppercase' },
  detail: { color: '#fff0ce', fontSize: 13, fontWeight: '600', marginTop: 2 },
  captionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  captionText: { flex: 1 },
  badge: {
    backgroundColor: CARD_COLORS.rush.background,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { color: CARD_COLORS.ink, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  upcoming: { borderStyle: 'dashed', borderColor: COLORS.border, opacity: 0.75 },
  upcomingName: { color: COLORS.muted },
  soon: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  soonText: { color: COLORS.muted, fontSize: 16, fontWeight: '800', textTransform: 'uppercase' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border },
  dotActive: { backgroundColor: COLORS.text },
});
