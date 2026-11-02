import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { CARD_SETS } from '@/data/decks';
import { newGame, selectCards } from '@/game/engine';
import { useApp } from '@/game/store';
import type { ZombieType } from '@/game/types';
import { LANGUAGE_NAMES, type Language, type TranslationKey } from '@/i18n/translations';
import { COLORS } from '@/theme';

const ZOMBIE_TYPES: readonly ZombieType[] = ['walker', 'runner', 'fatty', 'abomination'];

export default function SetupScreen() {
  const { game, setGame, language, setLanguage, t } = useApp();
  const [setIds, setSetIds] = useState(() => CARD_SETS.map((set) => set.id));
  const [excluded, setExcluded] = useState<ZombieType[]>([]);
  const [confirming, setConfirming] = useState(false);

  const cardCount = selectCards(CARD_SETS, setIds, excluded).length;
  const hasDemoCards = CARD_SETS.some((set) => setIds.includes(set.id) && !set.verified);

  const start = () => {
    if (game && !confirming) {
      setConfirming(true);
      return;
    }
    setGame(() => newGame(CARD_SETS, setIds, excluded));
    setConfirming(false);
    router.push('/game');
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {game && (
        <Pressable style={styles.primary} onPress={() => router.push('/game')}>
          <Text style={styles.primaryText}>{t('setup.resume')}</Text>
        </Pressable>
      )}

      <Text style={styles.heading}>{t('setup.sets')}</Text>
      {CARD_SETS.map((set) => (
        <ToggleRow
          key={set.id}
          label={t(`set.${set.id}` as TranslationKey)}
          value={setIds.includes(set.id)}
          onChange={(on) => {
            setConfirming(false);
            setSetIds((ids) => (on ? [...ids, set.id] : ids.filter((id) => id !== set.id)));
          }}
        />
      ))}

      <Text style={styles.heading}>{t('setup.zombies')}</Text>
      {ZOMBIE_TYPES.map((zombie) => (
        <ToggleRow
          key={zombie}
          label={t(`zombie.${zombie}.other`)}
          value={!excluded.includes(zombie)}
          onChange={(on) => {
            setConfirming(false);
            setExcluded((types) => (on ? types.filter((type) => type !== zombie) : [...types, zombie]));
          }}
        />
      ))}

      {hasDemoCards && <Text style={styles.warning}>{t('demoWarning')}</Text>}
      <Text style={styles.count}>
        {cardCount > 0 ? t('setup.cardCount', { n: cardCount }) : t('setup.noCards')}
      </Text>
      <Pressable
        style={[game ? styles.secondary : styles.primary, cardCount === 0 && styles.disabled]}
        disabled={cardCount === 0}
        onPress={start}
      >
        <Text style={styles.primaryText}>{t(confirming ? 'setup.confirmStart' : 'setup.start')}</Text>
      </Pressable>

      <Text style={styles.heading}>{t('setup.language')}</Text>
      <View style={styles.languages}>
        {(Object.keys(LANGUAGE_NAMES) as Language[]).map((code) => (
          <Pressable
            key={code}
            style={[styles.language, code === language && styles.languageActive]}
            onPress={() => setLanguage(code)}
          >
            <Text style={styles.rowText}>{LANGUAGE_NAMES[code]}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function ToggleRow(props: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowText}>{props.label}</Text>
      <Switch value={props.value} onValueChange={props.onChange} accessibilityLabel={props.label} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 8 },
  heading: { color: COLORS.muted, fontSize: 14, fontWeight: '700', marginTop: 16, textTransform: 'uppercase' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  rowText: { color: COLORS.text, fontSize: 16 },
  warning: { color: COLORS.warning, fontSize: 14, marginTop: 16 },
  count: { color: COLORS.muted, fontSize: 14, marginTop: 8, textAlign: 'center' },
  primary: { backgroundColor: COLORS.accent, borderRadius: 8, padding: 16, alignItems: 'center' },
  secondary: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  primaryText: { color: '#ffffff', fontSize: 17, fontWeight: '700', textAlign: 'center' },
  disabled: { opacity: 0.4 },
  languages: { flexDirection: 'row', gap: 8 },
  language: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  languageActive: { borderColor: COLORS.text },
});
