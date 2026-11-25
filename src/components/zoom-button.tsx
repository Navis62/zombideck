import { Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { COLORS, PRESSED } from '@/theme';

const SIZE = 30;
const HIT_SLOP = 10;
const INSET_FROM_CORNER = 6;

// Bottom-left, so the header (with the rule's "i") and the Danger Level panel stay clear.
export function ZoomButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && PRESSED]}
      onPress={onPress}
      hitSlop={HIT_SLOP}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Svg width={SIZE * 0.6} height={SIZE * 0.6} viewBox="0 0 24 24">
        <Path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke={COLORS.text} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    left: INSET_FROM_CORNER,
    bottom: INSET_FROM_CORNER,
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.text,
  },
});
