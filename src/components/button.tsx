import { Pressable, StyleSheet, Text } from 'react-native';

import { CARD_COLORS, COLORS, PRESSED } from '@/theme';

/** Plain button of the game and side screens; `warning` turns it red while it waits for a confirmation. */
export function Button(props: {
  label: string;
  detail?: string;
  onPress: () => void;
  disabled?: boolean;
  warning?: boolean;
  accessibilityHint?: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        props.warning && styles.warning,
        props.disabled && styles.disabled,
        pressed && PRESSED,
      ]}
      disabled={props.disabled}
      onPress={props.onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!props.disabled }}
      accessibilityHint={props.accessibilityHint}
    >
      <Text style={[styles.label, props.warning && styles.warningLabel]}>{props.label}</Text>
      {props.detail && <Text style={styles.detail}>{props.detail}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  warning: { backgroundColor: CARD_COLORS.extra.background, borderColor: CARD_COLORS.extra.background },
  disabled: { opacity: 0.4 },
  label: { color: COLORS.text, fontSize: 15, textAlign: 'center' },
  warningLabel: { color: '#ffffff', fontWeight: '800' },
  detail: { color: COLORS.muted, fontSize: 12, textAlign: 'center', marginTop: 2 },
});
