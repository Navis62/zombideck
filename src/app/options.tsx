import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBackground } from '@/components/app-background';
import { CARD_SETS } from '@/data/decks';
import { type CardDisplay, useApp } from '@/game/store';
import type { DeckParts } from '@/game/types';
import { LANGUAGE_NAMES, type Language, type TranslationKey } from '@/i18n/translations';
import { COLORS, PRESSED } from '@/theme';

const CARD_DISPLAYS: { value: CardDisplay; label: TranslationKey }[] = [
  { value: 'all', label: 'options.displayAll' },
  { value: 'current', label: 'options.displayCurrent' },
];

const DECK_PARTS: { part: keyof DeckParts; label: TranslationKey; detail: TranslationKey }[] = [
  { part: 'easy', label: 'options.easy', detail: 'options.easyDetail' },
  { part: 'hard', label: 'options.hard', detail: 'options.hardDetail' },
  { part: 'extra', label: 'options.extra', detail: 'options.extraDetail' },
];

/** The deck needs easier or harder cards: switching off the last of them switches on the other. */
function switchPart(parts: DeckParts, part: keyof DeckParts, on: boolean): DeckParts {
  const next = { ...parts, [part]: on };
  if (part === 'easy' && !on && !next.hard) next.hard = true;
  if (part === 'hard' && !on && !next.easy) next.easy = true;
  return next;
}

const LANGUAGES = (Object.keys(LANGUAGE_NAMES) as Language[]).map((code) => ({
  value: code,
  label: LANGUAGE_NAMES[code],
}));

export default function OptionsScreen() {
  const {
    expansions,
    setExpansions,
    language,
    setLanguage,
    cardDisplay,
    setCardDisplay,
    deckParts,
    setDeckParts,
    haptics,
    setHaptics,
    t,
  } = useApp();
  const optionalSets = CARD_SETS.filter((set) => set.optional);
  const allEnabled = optionalSets.every((set) => expansions.includes(set.id));

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <AppBackground />
      <View style={styles.columns}>
        <ScrollView style={styles.column} contentContainerStyle={styles.content}>
          <Text style={styles.heading}>{t('options.language')}</Text>
          <Choices options={LANGUAGES} selected={language} onSelect={setLanguage} />
          <Text style={styles.heading}>{t('options.cardDisplay')}</Text>
          <Choices
            options={CARD_DISPLAYS.map(({ value, label }) => ({ value, label: t(label) }))}
            selected={cardDisplay}
            onSelect={setCardDisplay}
          />
          <Text style={styles.heading}>{t('options.haptics')}</Text>
          <View style={styles.row}>
            <View style={styles.rowLabel}>
              <Text style={styles.rowText}>{t('options.hapticsDetail')}</Text>
            </View>
            <Switch value={haptics} onValueChange={setHaptics} accessibilityLabel={t('options.hapticsDetail')} />
          </View>
        </ScrollView>

        <ScrollView style={styles.column} contentContainerStyle={styles.content}>
          <Text style={styles.heading}>{t('options.deck')}</Text>
          {DECK_PARTS.map(({ part, label, detail }) => (
            <View key={part} style={styles.row}>
              <View style={styles.rowLabel}>
                <Text style={styles.rowText}>{t(label)}</Text>
                <Text style={styles.rowDetail}>{t(detail)}</Text>
              </View>
              <Switch
                value={deckParts[part]}
                onValueChange={(on) => setDeckParts(switchPart(deckParts, part, on))}
                accessibilityLabel={t(label)}
              />
            </View>
          ))}
          <Text style={styles.muted}>{t('options.deckHint')}</Text>

          <Text style={styles.heading}>{t('options.content')}</Text>
          {optionalSets.length === 0 && <Text style={styles.muted}>{t('options.noContent')}</Text>}
          {optionalSets.length > 0 && (
            <Pressable
              style={({ pressed }) => [styles.toggleAll, pressed && PRESSED]}
              onPress={() => setExpansions(allEnabled ? [] : optionalSets.map((set) => set.id))}
              accessibilityRole="button"
            >
              <Text style={styles.toggleAllText}>{t(allEnabled ? 'options.deselectAll' : 'options.selectAll')}</Text>
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

function Choices<T extends string>(props: {
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
}) {
  return (
    <View style={styles.choices}>
      {props.options.map(({ value, label }) => (
        <Pressable
          key={value}
          style={({ pressed }) => [styles.choice, value === props.selected && styles.choiceActive, pressed && PRESSED]}
          onPress={() => props.onSelect(value)}
          accessibilityRole="button"
          accessibilityState={{ selected: value === props.selected }}
        >
          <Text style={styles.rowText}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  columns: { flex: 1, flexDirection: 'row', padding: 12, gap: 16 },
  column: { flex: 1 },
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
  toggleAll: { alignItems: 'center', backgroundColor: COLORS.accent, borderRadius: 8, padding: 12 },
  toggleAllText: { color: '#ffffff', fontSize: 16, fontWeight: '800', textTransform: 'uppercase' },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: {
    flexGrow: 1,
    flexBasis: '40%',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  choiceActive: { borderColor: COLORS.text },
});
