import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBackground } from '@/components/app-background';
import {
  ABOMINATION_BOSSES,
  BIG_BOSSES,
  type Boss,
  BOSS_RULES,
  NECROMANCER_BOSSES,
} from '@/data/threat';
import { allExpansions, noExpansions, switchableSets, UNIVERSES, withCoreBox } from '@/data/universes';
import { activeSetIds } from '@/game/engine';
import type { BossRule } from '@/game/types';
import { useApp } from '@/game/store';
import type { TranslationKey } from '@/i18n/translations';
import { COLORS, PRESSED } from '@/theme';

/** Expansions and promos switched on for the next game, two to a row so the whole list fits in landscape. */
export default function ExpansionsScreen() {
  const { universe, expansions, setExpansions, t } = useApp();
  const current = UNIVERSES[universe];
  const { optionalSets } = current;
  const allEnabled = switchableSets(current).every((set) => expansions.includes(set.id));

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <AppBackground universe={universe} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.muted, styles.hint]}>{t('expansions.hint')}</Text>
          <Pressable
            style={({ pressed }) => [styles.toggleAll, pressed && PRESSED]}
            onPress={() => setExpansions(allEnabled ? noExpansions(current, expansions) : allExpansions(current, expansions))}
            accessibilityRole="button"
          >
            <Text style={styles.toggleAllText}>
              {t(allEnabled ? 'expansions.deselectAll' : 'expansions.selectAll')}
            </Text>
          </Pressable>
        </View>
        {pairs(optionalSets).map((pair) => (
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
                        setExpansions((list) =>
                              withCoreBox(current, [...list.filter((id) => id !== set.id), ...(on ? [set.id] : [])], set.id),
                            )
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
        {current.threat && <ThreatOptions />}
      </ScrollView>
    </SafeAreaView>
  );
}

const RULE_LABELS: Record<BossRule, { label: TranslationKey; detail: TranslationKey }> = {
  oneAtATime: { label: 'threat.oneAtATime', detail: 'threat.oneAtATimeDetail' },
  fest: { label: 'threat.fest', detail: 'threat.festDetail' },
};

/** A row of choices, the one in use outlined. */
function Choices<T extends string>(props: { options: readonly T[]; selected: T; label: (value: T) => string; onSelect: (value: T) => void }) {
  return (
    <View style={styles.choices}>
      {props.options.map((value) => (
        <Pressable
          key={value}
          style={({ pressed }) => [styles.choice, value === props.selected && styles.choiceActive, pressed && PRESSED]}
          onPress={() => props.onSelect(value)}
          accessibilityRole="button"
          accessibilityState={{ selected: value === props.selected }}
        >
          <Text style={styles.rowText}>{props.label(value)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/**
 * How the bosses of the expansions switched on join the game: picked one by one, in decks of their own (White Death
 * and Dead Men Tales). Only for an era whose rulebooks build the deck that way (see `threat.ts`).
 */
function ThreatOptions() {
  const { universe, expansions, threat, setThreat, t } = useApp();
  const setIds = activeSetIds(UNIVERSES[universe].sets, expansions);
  const available = (bosses: readonly Boss[]) => bosses.filter((boss) => setIds.includes(boss.setId));
  const abominations = [...available(ABOMINATION_BOSSES), ...available(BIG_BOSSES)];
  const necromancers = available(NECROMANCER_BOSSES);

  const toggle = (zombie: string, on: boolean) =>
    setThreat((current) => ({
      ...current,
      off: on ? current.off.filter((id) => id !== zombie) : [...current.off.filter((id) => id !== zombie), zombie],
    }));

  const switches = (bosses: readonly Boss[]) =>
    pairs(bosses).map((pair) => (
      <View key={pair[0].zombie} style={styles.line}>
        {pair.map((boss) => {
          const label = t(`zombie.${boss.zombie}.other`);
          return (
            <View key={boss.zombie} style={styles.cell}>
              <View style={styles.row}>
                <View style={styles.rowLabel}>
                  <Text style={styles.rowText}>{label}</Text>
                </View>
                <Switch
                  value={!threat.off.includes(boss.zombie)}
                  onValueChange={(on) => toggle(boss.zombie, on)}
                  accessibilityLabel={label}
                />
              </View>
            </View>
          );
        })}
        {pair.length === 1 && <View style={styles.cell} />}
      </View>
    ));

  return (
    <>
      <Text style={styles.heading}>{t('threat.rules')}</Text>
      <Text style={styles.muted}>{t('threat.deadMenTalesDetail')}</Text>
      <Choices
        options={BOSS_RULES}
        selected={threat.bossRule}
        label={(rule) => t(RULE_LABELS[rule].label)}
        onSelect={(bossRule) => setThreat((current) => ({ ...current, bossRule }))}
      />
      <Text style={styles.muted}>{t(RULE_LABELS[threat.bossRule].detail)}</Text>
      {abominations.length > 0 && <Text style={styles.heading}>{t('threat.abominations')}</Text>}
      {switches(abominations)}
      {necromancers.length > 0 && <Text style={styles.heading}>{t('threat.necromancers')}</Text>}
      {switches(necromancers)}
    </>
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
  heading: { color: COLORS.muted, fontSize: 14, fontWeight: '700', textTransform: 'uppercase', marginTop: 8 },
  choices: { flexDirection: 'row', gap: 8 },
  choice: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  choiceActive: { borderColor: COLORS.text },
  toggleAll: { alignItems: 'center', backgroundColor: COLORS.accent, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16 },
  toggleAllText: { color: '#ffffff', fontSize: 16, fontWeight: '800', textTransform: 'uppercase' },
});
