import { StyleSheet, View } from 'react-native';

import { CARD_COLORS } from '@/theme';

/** Yellow and black warning stripes. */
export function Hazard({ stripes }: { stripes: number }) {
  return (
    <View style={styles.hazard}>
      {Array.from({ length: stripes }, (_, index) => <View key={index} style={styles.stripe} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  hazard: { height: 18, flexDirection: 'row', overflow: 'hidden', backgroundColor: CARD_COLORS.rush.background },
  stripe: { flex: 1, marginHorizontal: 6, backgroundColor: CARD_COLORS.back, transform: [{ skewX: '-30deg' }] },
});
