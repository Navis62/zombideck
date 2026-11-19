import { useContext, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, Pressable, StyleSheet } from 'react-native';

import { CardAnnounced, HIDDEN_FROM_READER } from '@/components/card-face';
import { PRESSED } from '@/theme';

/** Each half of the turn: the card goes edge-on, then comes back showing its other side (about 0.3 s in all). */
const FLIP_HALF_MS = 150;
/** Same perspective as the card dealt from the deck, so both turns look alike. */
const PERSPECTIVE = 800;

/**
 * A card that turns over to show its other side. The turn is two halves: the shown side goes edge-on, the sides swap,
 * the other one comes back. With "reduce motion" on, the sides swap at once.
 */
export function FlipCard({ flipped, front, back, onPress }: { flipped: boolean; front: React.ReactNode; back: React.ReactNode; onPress: () => void }) {
  const [shown, setShown] = useState(flipped);
  // The side on display, readable from the effect without restarting it when the sides swap mid-turn.
  const shownRef = useRef(flipped);
  const [turn] = useState(() => new Animated.Value(0));
  const announced = useContext(CardAnnounced);

  useEffect(() => {
    if (flipped === shownRef.current) {
      turn.setValue(0);
      return;
    }
    let cancelled = false;
    const swap = () => {
      shownRef.current = flipped;
      setShown(flipped);
    };
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) {
        swap();
        return;
      }
      const native = Platform.OS !== 'web';
      Animated.timing(turn, { toValue: 1, duration: FLIP_HALF_MS, useNativeDriver: native }).start(({ finished }) => {
        if (!finished || cancelled) return;
        swap();
        turn.setValue(-1);
        Animated.timing(turn, { toValue: 0, duration: FLIP_HALF_MS, useNativeDriver: native }).start();
      });
    });
    return () => {
      cancelled = true;
      turn.stopAnimation();
    };
  }, [flipped, turn]);

  const rotateY = turn.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-90deg', '0deg', '90deg'] });
  return (
    <Animated.View style={[styles.card, { transform: [{ perspective: PERSPECTIVE }, { rotateY }] }]}>
      {/* The front is the touchable; the back handles its own taps inside its ScrollView (see RuleSide). */}
      {shown ? (
        back
      ) : (
        <Pressable style={({ pressed }) => [styles.card, pressed && PRESSED]} onPress={onPress} {...(announced ? HIDDEN_FROM_READER : { accessible: false })}>
          {front}
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1 },
});
