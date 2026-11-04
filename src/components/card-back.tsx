import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { CARD_COLORS } from '@/theme';

/** Card width the badge was drawn for; it grows with the card on tablets. */
const DESIGN_WIDTH = 230;

export function CardBack(props: { count: number; label: string; width: number; onPress: () => void }) {
  const s = Math.max(0.5, props.width / DESIGN_WIDTH);
  return (
    <Pressable
      style={({ pressed }) => [styles.pile, pressed && styles.pressed]}
      onPress={props.onPress}
      accessibilityRole="button"
      accessibilityLabel={props.label}
    >
      {/* Two offset edges make it read as a stack of cards. */}
      <View style={[styles.edge, styles.edgeFar]} />
      <View style={[styles.edge, styles.edgeNear]} />
      <View style={styles.back}>
        <Image source={require('../../assets/cards/back.jpg')} style={styles.image} resizeMode="cover" />
        <View
          style={[
            styles.badge,
            { top: 8 * s, right: 8 * s, minWidth: 36 * s, paddingHorizontal: 8 * s, paddingVertical: 2 * s, borderRadius: 6 * s },
          ]}
        >
          <Text style={[styles.count, { fontSize: 16 * s }]}>{props.count}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pile: { flex: 1, marginRight: 6, marginBottom: 6 },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  edge: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 12, backgroundColor: '#3a372c', borderWidth: 1, borderColor: '#000000' },
  edgeFar: { transform: [{ translateX: 6 }, { translateY: 6 }] },
  edgeNear: { transform: [{ translateX: 3 }, { translateY: 3 }] },
  back: { flex: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: CARD_COLORS.back },
  image: { width: '100%', height: '100%' },
  badge: { position: 'absolute', alignItems: 'center', backgroundColor: CARD_COLORS.back, borderWidth: 2, borderColor: CARD_COLORS.rush.background },
  count: { color: '#ffffff', fontWeight: '900' },
});
