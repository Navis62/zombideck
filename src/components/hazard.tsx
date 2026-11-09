import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { CARD_COLORS } from '@/theme';
import type { UniverseId } from '@/game/types';

/** Decorative border matching the selected era. */
export const Hazard = memo(function Hazard({ universe, stripes }: { universe: UniverseId; stripes: number }) {
  if (universe === 'fantasy') {
    return (
      <View style={styles.medieval} pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={styles.ornament}><View style={styles.diamond} /><View style={styles.smallDiamond} /></View>
        <View style={styles.goldThread} />
        <View style={styles.ornament}><View style={styles.smallDiamond} /><View style={styles.diamond} /></View>
      </View>
    );
  }
  return (
    <View style={styles.hazard}>
      {Array.from({ length: stripes }, (_, index) => <View key={index} style={styles.stripe} />)}
    </View>
  );
});

const styles = StyleSheet.create({
  medieval: {
    height: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 22,
    backgroundColor: '#571c20',
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#a77e3b',
    overflow: 'hidden',
  },
  goldThread: { flex: 1, height: 1, backgroundColor: '#a77e3b', opacity: 0.65 },
  ornament: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  diamond: { width: 7, height: 7, borderWidth: 1, borderColor: '#d1ae68', transform: [{ rotate: '45deg' }] },
  smallDiamond: { width: 3, height: 3, backgroundColor: '#a77e3b', transform: [{ rotate: '45deg' }] },
  hazard: { height: 18, flexDirection: 'row', overflow: 'hidden', backgroundColor: CARD_COLORS.rush.background },
  stripe: { flex: 1, marginHorizontal: 6, backgroundColor: CARD_COLORS.back, transform: [{ skewX: '-30deg' }] },
});
