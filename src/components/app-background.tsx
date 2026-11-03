import { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

const RUINED_CITY = require('../../assets/backgrounds/ruined-city.jpg');

// Bundled scenery stays available offline; a scrim preserves foreground contrast.
export const AppBackground = memo(function AppBackground({ vivid = false }: { vivid?: boolean }) {
  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, styles.base]}
    >
      <Image source={RUINED_CITY} resizeMode="cover" style={styles.image} fadeDuration={0} />
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
