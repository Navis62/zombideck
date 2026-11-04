import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** A short tap under the finger when a card is drawn. */
export function drawFeedback() {
  const done =
    Platform.OS === 'android'
      ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm)
      : Platform.OS === 'ios'
        ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        : null;
  done?.catch(() => {
    // Some devices have no vibration motor: drawing works the same without it.
  });
}
