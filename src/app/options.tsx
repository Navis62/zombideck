import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CARD_SETS } from '@/data/decks';
import { useApp } from '@/game/store';
import { LANGUAGE_NAMES, type Language, type TranslationKey } from '@/i18n/translations';
import { COLORS } from '@/theme';

export default function OptionsScreen() {
  const { expansions, setExpansions, language, setLanguage, t } = useApp();
  const optionalSets = CARD_SETS.filter((set) => set.optional);
  const allEnabled = optionalSets.every((set) => expansions.includes(set.id));

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <View style={styles.columns}>
        <View style={styles.column}>
          <Text style={styles.heading}>{t('options.language')}</Text>
          <View style={styles.languages}>
            {(Object.keys(LANGUAGE_NAMES) as Language[]).map((code) => (
              <Pressable
                key={code}
                style={[styles.language, code === language && styles.languageActive]}
                onPress={() => setLanguage(code)}
                accessibilityRole="button"
                accessibilityState={{ selected: code === language }}
              >
                <Text style={styles.rowText}>{LANGUAGE_NAMES[code]}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <ScrollView style={styles.column} contentContainerStyle={styles.content}>
          <Text style={styles.heading}>{t('options.content')}</Text>
          {optionalSets.length === 0 && <Text style={styles.muted}>{t('options.noContent')}</Text>}
          {optionalSets.length > 0 && (
            <Pressable
              style={styles.toggleAll}
              onPress={() => setExpansions(allEnabled ? [] : optionalSets.map((set) => set.id))}
              accessibilityRole="button"
            >
              <Text style={styles.rowText}>{t(allEnabled ? 'options.deselectAll' : 'options.selectAll')}</Text>
            </Pressable>
          )}
          {optionalSets.map((set) => {
            const label = t(`set.${set.id}` as TranslationKey);
            return (
              <View key={set.id} style={styles.row}>
                <View style={styles.rowLabel}>
                  <Text style={styles.rowText}>{label}</Text>
                  {set.replaces && <Text style={styles.rowDetail}>{t('options.replaces')}</Text>}
                </View>
                <Switch
                  value={expansions.includes(set.id)}
                  onValueChange={(on) =>
                    setExpansions(on ? [...expansions, set.id] : expansions.filter((id) => id !== set.id))
                  }
                  accessibilityLabel={label}
                />
              </View>
            );
          })}
          {optionalSets.length > 0 && <Text style={styles.muted}>{t('options.contentHint')}</Text>}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  columns: { flex: 1, flexDirection: 'row', padding: 12, gap: 16 },
  column: { flex: 1, gap: 8 },
  content: { gap: 8 },
  heading: { color: COLORS.muted, fontSize: 14, fontWeight: '700', textTransform: 'uppercase' },
  muted: { color: COLORS.muted, fontSize: 14 },
  row: {
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
  toggleAll: {
    alignItems: 'center',
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  languages: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  language: {
    flexGrow: 1,
    flexBasis: '40%',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  languageActive: { borderColor: COLORS.text },
});
