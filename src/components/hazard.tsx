import { memo, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { CARD_COLORS, INVADER_COLORS, WESTERN_COLORS } from '@/theme';
import type { UniverseId } from '@/game/types';

/** Decorative border matching the selected era. */
export const Hazard = memo(function Hazard({ universe, stripes }: { universe: UniverseId; stripes: number }) {
  return BORDERS[universe](stripes);
});

/** One border per universe: a new UniverseId must pick its own. */
const BORDERS: Record<UniverseId, (stripes: number) => ReactElement> = {
  fantasy: () => (
    <View style={styles.medieval} pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.ornament}><View style={styles.diamond} /><View style={styles.smallDiamond} /></View>
      <View style={styles.goldThread} />
      <View style={styles.ornament}><View style={styles.smallDiamond} /><View style={styles.diamond} /></View>
    </View>
  ),
  invader: (stripes) => (
    <View style={styles.scifi} pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {/* Teal stripes with a red warning stripe every fourth one. */}
      {Array.from({ length: stripes }, (_, index) => (
        <View key={index} style={[styles.stripe, { backgroundColor: index % ALERT_EVERY === ALERT_EVERY - 1 ? INVADER_COLORS.hazardAlert : INVADER_COLORS.hazardStripe }]} />
      ))}
    </View>
  ),
  western: (stripes) => (
    <View style={styles.western} pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: stripes }, (_, index) => (
        <View key={index} style={[styles.stripe, { backgroundColor: index % ALERT_EVERY === ALERT_EVERY - 1 ? WESTERN_COLORS.hazardAlert : WESTERN_COLORS.hazardStripe }]} />
      ))}
    </View>
  ),
  modern: (stripes) => (
    <View style={styles.hazard}>
      {Array.from({ length: stripes }, (_, index) => <View key={index} style={styles.stripe} />)}
    </View>
  ),
};

/** One stripe in this many is red on the sci-fi border. */
const ALERT_EVERY = 4;

const styles = StyleSheet.create({
  western: { height: 18, flexDirection: 'row', overflow: 'hidden', backgroundColor: WESTERN_COLORS.hazardBase },
  scifi: { height: 18, flexDirection: 'row', overflow: 'hidden', backgroundColor: INVADER_COLORS.hazardBase },
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
