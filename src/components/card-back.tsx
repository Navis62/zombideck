import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { CARD_COLORS } from '@/theme';

export function CardBack(props: { count: number; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.pile} onPress={props.onPress} accessibilityRole="button" accessibilityLabel={props.label}>
      {/* Two offset edges make it read as a stack of cards. */}
      <View style={[styles.edge, styles.edgeFar]} />
      <View style={[styles.edge, styles.edgeNear]} />
      <View style={styles.back}>
        <Image source={require('../../assets/cards/back.jpg')} style={styles.image} resizeMode="cover" />
        <View style={styles.badge}>
          <Text style={styles.count}>{props.count}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pile: { flex: 1, marginRight: 6, marginBottom: 6 },
  edge: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 12, backgroundColor: '#3a372c', borderWidth: 1, borderColor: '#000000' },
  edgeFar: { transform: [{ translateX: 6 }, { translateY: 6 }] },
  edgeNear: { transform: [{ translateX: 3 }, { translateY: 3 }] },
  back: { flex: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: CARD_COLORS.back },
  image: { width: '100%', height: '100%' },
  badge: { position: 'absolute', top: 8, right: 8, minWidth: 36, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignItems: 'center', backgroundColor: CARD_COLORS.back, borderWidth: 2, borderColor: CARD_COLORS.rush.background },
  count: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
});
