import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBackground } from '@/components/app-background';
import { type CardDisplay, useApp, type ZoneDisplay } from '@/game/store';
import type { DeckParts } from '@/game/types';
import { LANGUAGE_NAMES, type Language, type TranslationKey } from '@/i18n/translations';
import { COLORS, PRESSED } from '@/theme';

const CARD_DISPLAYS: { value: CardDisplay; label: TranslationKey }[] = [
  { value: 'all', label: 'options.displayAll' },
  { value: 'current', label: 'options.displayCurrent' },
];

const ZONE_DISPLAYS: { value: ZoneDisplay; label: TranslationKey }[] = [
  { value: 'row', label: 'options.zoneRow' },
  { value: 'sequence', label: 'options.zoneSequence' },
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
    language,
    setLanguage,
    cardDisplay,
    setCardDisplay,
    deckParts,
    setDeckParts,
    haptics,
    setHaptics,
    zoneDisplay,
    setZoneDisplay,
    t,
  } = useApp();

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <AppBackground />
      {/* One scroll for the whole page: two columns side by side, the app on the left, the game on the right. */}
      <ScrollView contentContainerStyle={styles.columns}>
        <View style={styles.column}>
          <Text style={styles.heading}>{t('options.language')}</Text>
          <Choices options={LANGUAGES} selected={language} onSelect={setLanguage} />
          <Text style={styles.heading}>{t('options.haptics')}</Text>
          <View style={styles.row}>
            <View style={styles.rowLabel}>
              <Text style={styles.rowText}>{t('options.hapticsDetail')}</Text>
            </View>
            <Switch value={haptics} onValueChange={setHaptics} accessibilityLabel={t('options.hapticsDetail')} />
          </View>
        </View>

        <View style={styles.column}>
          <Text style={styles.heading}>{t('options.cardDisplay')}</Text>
          <Choices
            options={CARD_DISPLAYS.map(({ value, label }) => ({ value, label: t(label) }))}
            selected={cardDisplay}
            onSelect={setCardDisplay}
          />
          <Text style={styles.heading}>{t('options.zoneDisplay')}</Text>
          <Choices
            options={ZONE_DISPLAYS.map(({ value, label }) => ({ value, label: t(label) }))}
            selected={zoneDisplay}
            onSelect={setZoneDisplay}
          />
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
        </View>
      </ScrollView>
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
  // No flex on the scroll content: it grows with the taller column, so the page scrolls as a whole.
  columns: { flexDirection: 'row', alignItems: 'flex-start', padding: 12, gap: 16 },
  column: { flex: 1, gap: 8 },
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
