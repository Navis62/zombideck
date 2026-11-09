import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBackground } from '@/components/app-background';
import { OPTIONAL_SETS } from '@/data/decks';
import { useApp } from '@/game/store';
import type { TranslationKey } from '@/i18n/translations';
import { COLORS, PRESSED } from '@/theme';

/** Expansions and promos switched on for the next game, two to a row so the whole list fits in landscape. */
export default function ExpansionsScreen() {
  const { expansions, setExpansions, t } = useApp();
  const allEnabled = OPTIONAL_SETS.every((set) => expansions.includes(set.id));

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <AppBackground />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.muted, styles.hint]}>{t('expansions.hint')}</Text>
          <Pressable
            style={({ pressed }) => [styles.toggleAll, pressed && PRESSED]}
            onPress={() => setExpansions(allEnabled ? [] : OPTIONAL_SETS.map((set) => set.id))}
            accessibilityRole="button"
          >
            <Text style={styles.toggleAllText}>
              {t(allEnabled ? 'expansions.deselectAll' : 'expansions.selectAll')}
            </Text>
          </Pressable>
        </View>
        {pairs(OPTIONAL_SETS).map((pair) => (
          <View key={pair[0].id} style={styles.line}>
            {pair.map((set) => {
              const label = t(`set.${set.id}` as TranslationKey);
              return (
                <View key={set.id} style={styles.cell}>
                  <View style={styles.row}>
                    <View style={styles.rowLabel}>
                      <Text style={styles.rowText}>{label}</Text>
                      {set.replaces && <Text style={styles.rowDetail}>{t('expansions.replaces')}</Text>}
                    </View>
                    <Switch
                      value={expansions.includes(set.id)}
                      // From the current list: two switches flipped before a render both count.
                      onValueChange={(on) =>
                        setExpansions((current) => [...current.filter((id) => id !== set.id), ...(on ? [set.id] : [])])
                      }
                      accessibilityLabel={label}
                    />
                  </View>
                </View>
              );
            })}
            {/* An odd last set keeps the width of a column instead of stretching across. */}
            {pair.length === 1 && <View style={styles.cell} />}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Two sets per line, in reading order. Explicit lines rather than a wrapping row: percentage widths in a wrapping
 * row fall back to one column on Android.
 */
function pairs<T>(items: readonly T[]): T[][] {
  return Array.from({ length: Math.ceil(items.length / 2) }, (_, i) => items.slice(i * 2, i * 2 + 2));
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 12, gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  hint: { flex: 1 },
  muted: { color: COLORS.muted, fontSize: 14 },
  line: { flexDirection: 'row', gap: 8 },
  // The two cells of a line share its width; they carry no padding, which Yoga would count as a minimum width and
  // which would widen an odd last set next to its empty cell.
  cell: { flex: 1 },
  row: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  rowLabel: { flex: 1, paddingVertical: 8 },
  rowText: { color: COLORS.text, fontSize: 16 },
  rowDetail: { color: COLORS.muted, fontSize: 12 },
  toggleAll: { alignItems: 'center', backgroundColor: COLORS.accent, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16 },
  toggleAllText: { color: '#ffffff', fontSize: 16, fontWeight: '800', textTransform: 'uppercase' },
});
