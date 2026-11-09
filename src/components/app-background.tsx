import { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import type { UniverseId } from '@/game/types';

const RUINED_CITY = require('../../assets/backgrounds/ruined-city.jpg');
const RUINED_CASTLE = require('../../assets/backgrounds/ruined-castle.jpg');

// Bundled scenery stays available offline; a scrim preserves foreground contrast.
export const AppBackground = memo(function AppBackground({ universe, vivid = false }: { universe: UniverseId; vivid?: boolean }) {
  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, styles.base]}
    >
      <Image source={universe === 'fantasy' ? RUINED_CASTLE : RUINED_CITY} resizeMode="cover" style={styles.image} fadeDuration={0} />
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
