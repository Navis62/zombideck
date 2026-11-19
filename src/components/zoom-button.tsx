import { Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { COLORS, PRESSED } from '@/theme';

/** Side of the round button: small enough to leave the card visible, with a margin around it for the finger (hitSlop). */
const SIZE = 30;
/** Extra touch area on every side, so the button is as easy to hit as a full-size one. */
const HIT_SLOP = 10;
/** Distance from the bottom-left corner of the card. */
const INSET = 6;

/**
 * Enlarges a card that sits among others. In the bottom-left corner, over the picture's edge, so the header (with the
 * "i" of the rule) and the Danger Level panel stay clear. Tapping the card itself turns it over.
 */
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
        {/* Four corners pointing out: the usual "enlarge" symbol. */}
        <Path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke={COLORS.text} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    left: INSET,
    bottom: INSET,
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
