import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Platform, StyleSheet, View } from 'react-native';
import type { UniverseId } from '@/game/types';

const RUINED_CITY = require('../../assets/modern/backgrounds/ruined-city.jpg');
const RUINED_CASTLE = require('../../assets/fantasy/backgrounds/ruined-castle.jpg');
const MINING_OUTPOST = require('../../assets/invader/backgrounds/mining-outpost.jpg');

/** One scenery per universe: a new UniverseId must pick its own. */
const SCENERY: Record<UniverseId, number> = { modern: RUINED_CITY, fantasy: RUINED_CASTLE, invader: MINING_OUTPOST };

/** Gentle crossfade between two sceneries: long enough to read as a dissolve, short enough not to lag behind the swipe. */
const FADE_MS = 500;
/** Past this share of the fade the incoming image is the one the eye sees. */
const HALF = 0.5;

// Bundled scenery stays available offline; a scrim preserves foreground contrast.
export const AppBackground = memo(function AppBackground({ universe, vivid = false }: { universe: UniverseId; vivid?: boolean }) {
  // `top` fades in over `under`. Layers are derived while rendering, so the new image never shows at a stale opacity.
  const [layers, setLayers] = useState({ under: universe, top: universe });
  const opacity = useRef(new Animated.Value(1)).current;
  const progress = useRef(1);
  const reduceMotion = useRef(false);

  if (universe !== layers.top) {
    // Changed mid-fade: keep the image that was the most visible underneath, so the picture never snaps to the half-faded one.
    setLayers({ under: progress.current >= HALF ? layers.top : layers.under, top: universe });
  }

  useEffect(() => {
    const id = opacity.addListener(({ value }) => {
      progress.current = value;
    });
    AccessibilityInfo.isReduceMotionEnabled().then((on) => {
      reduceMotion.current = on;
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (on) => {
      reduceMotion.current = on;
    });
    return () => {
      opacity.removeListener(id);
      subscription.remove();
      opacity.stopAnimation();
    };
  }, [opacity]);

  useLayoutEffect(() => {
    opacity.stopAnimation();
    if (layers.under === layers.top || reduceMotion.current) {
      opacity.setValue(1);
      return;
    }
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: FADE_MS,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [layers, opacity]);

  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, styles.base]}
    >
      <Image source={SCENERY[layers.under]} resizeMode="cover" style={styles.image} fadeDuration={0} />
      <Animated.Image source={SCENERY[layers.top]} resizeMode="cover" style={[styles.image, { opacity }]} fadeDuration={0} />
      <View style={[StyleSheet.absoluteFill, vivid ? styles.menuShade : styles.playShade]} />
    </View>
  );
});

const styles = StyleSheet.create({
  base: { backgroundColor: '#171b19', overflow: 'hidden' },
  image: { position: 'absolute', width: '100%', height: '100%', top: 0, left: 0 },
  menuShade: { backgroundColor: 'rgba(9, 14, 12, 0.24)' },
  playShade: { backgroundColor: 'rgba(9, 14, 12, 0.76)' },
});
