import { Redirect } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { CARD_SETS, CARDS_BY_ID } from '@/data/decks';
import {
  addSurvivor,
  changeXp,
  DANGER_LEVELS,
  dangerForXp,
  drawCard,
  partyDanger,
  removeSurvivor,
  renameSurvivor,
  reshuffleAll,
  undo,
} from '@/game/engine';
import { useApp } from '@/game/store';
import type { DangerLevel, GameState, Survivor, ZombieCard } from '@/game/types';
import { COLORS, DANGER_COLORS } from '@/theme';

export default function GameScreen() {
  const { game, setGame, t } = useApp();
  if (!game) return <Redirect href="/" />;

  const update = (change: (state: GameState) => GameState) =>
    setGame((state) => (state ? change(state) : state));

  const danger = partyDanger(game.survivors);
  const card = game.piles.current ? CARDS_BY_ID.get(game.piles.current) : undefined;
  const isDemo = CARD_SETS.some((set) => game.setIds.includes(set.id) && !set.verified);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {isDemo && <Text style={styles.warning}>{t('demoWarning')}</Text>}

      <View style={[styles.danger, { backgroundColor: DANGER_COLORS[danger].background }]}>
        <Text style={[styles.dangerText, { color: DANGER_COLORS[danger].text }]}>
          {t('danger.current', { level: t(`danger.${danger}`) })}
        </Text>
      </View>

      <View style={styles.card}>
        {card ? (
          <CardView card={card} danger={danger} />
        ) : (
          <Text style={styles.muted}>{t('game.noCard')}</Text>
        )}
      </View>
      {game.piles.reshuffled && <Text style={styles.notice}>{t('game.reshuffled')}</Text>}

      <Pressable style={styles.draw} onPress={() => update((state) => drawCard(state))}>
        <Text style={styles.drawText}>{t('game.draw')}</Text>
      </Pressable>

      <View style={styles.piles}>
        <Text style={styles.muted}>{t('game.deck', { n: game.piles.draw.length })}</Text>
        <Text style={styles.muted}>{t('game.discard', { n: game.piles.discard.length })}</Text>
      </View>
      <View style={styles.actions}>
        <SmallButton label={t('game.undo')} disabled={!game.previous} onPress={() => update(undo)} />
        <SmallButton label={t('game.shuffle')} onPress={() => update((state) => reshuffleAll(state))} />
      </View>

      <Text style={styles.heading}>{t('game.survivors')}</Text>
      {game.survivors.map((survivor, index) => (
        <SurvivorRow
          key={survivor.id}
          survivor={survivor}
          position={index + 1}
          onXp={(delta) => update((state) => changeXp(state, survivor.id, delta))}
          onRename={(name) => update((state) => renameSurvivor(state, survivor.id, name))}
          onRemove={() => update((state) => removeSurvivor(state, survivor.id))}
        />
      ))}
      <SmallButton label={t('game.addSurvivor')} onPress={() => update(addSurvivor)} />
    </ScrollView>
  );
}

function CardView({ card, danger }: { card: ZombieCard; danger: DangerLevel }) {
  const { t } = useApp();

  if (card.kind === 'extra') {
    const zombies = t(`zombie.${card.zombie}.other`);
    return (
      <>
        <Text style={[styles.kind, styles.kindExtra]}>{t('card.extra')}</Text>
        <Text style={styles.result}>{zombies}</Text>
        <Text style={styles.rule}>
          {danger === 'blue' ? t('card.extraBlue') : t('card.extraRule', { zombies })}
        </Text>
      </>
    );
  }

  const label = (count: number) =>
    count === 0
      ? t('card.none')
      : `${count} ${t(`zombie.${card.zombie}.${count === 1 ? 'one' : 'other'}`)}`;

  return (
    <>
      <Text style={[styles.kind, card.kind === 'rush' && styles.kindRush]}>
        {t(card.kind === 'rush' ? 'card.rush' : 'card.spawn')}
      </Text>
      <Text style={styles.result}>{label(card.counts[DANGER_LEVELS.indexOf(danger)])}</Text>
      {card.kind === 'rush' && <Text style={styles.rule}>{t('card.rushRule')}</Text>}
      <View style={styles.lines}>
        {DANGER_LEVELS.map((level, index) => (
          <View
            key={level}
            style={[
              styles.line,
              { backgroundColor: DANGER_COLORS[level].background },
              level !== danger && styles.lineInactive,
            ]}
          >
            <Text style={[styles.lineText, { color: DANGER_COLORS[level].text }]}>
              {card.counts[index]}
            </Text>
          </View>
        ))}
      </View>
    </>
  );
}

function SurvivorRow(props: {
  survivor: Survivor;
  position: number;
  onXp: (delta: number) => void;
  onRename: (name: string) => void;
  onRemove: () => void;
}) {
  const { t } = useApp();
  const { survivor } = props;
  const level = dangerForXp(survivor.xp);
  const placeholder = t('game.survivorName', { n: props.position });

  return (
    <View style={styles.survivor}>
      <View style={styles.survivorHeader}>
        <TextInput
          style={styles.name}
          value={survivor.name}
          onChangeText={props.onRename}
          placeholder={placeholder}
          placeholderTextColor={COLORS.muted}
          accessibilityLabel={placeholder}
        />
        <Pressable onPress={props.onRemove} hitSlop={8} accessibilityRole="button">
          <Text style={styles.muted}>{t('game.removeSurvivor')}</Text>
        </Pressable>
      </View>
      <View style={styles.xpRow}>
        <XpButton label="-1" onPress={() => props.onXp(-1)} />
        <View style={[styles.xp, { backgroundColor: DANGER_COLORS[level].background }]}>
          <Text style={[styles.xpText, { color: DANGER_COLORS[level].text }]}>{survivor.xp} XP</Text>
        </View>
        <XpButton label="+1" onPress={() => props.onXp(1)} />
        <XpButton label="+5" onPress={() => props.onXp(5)} />
      </View>
    </View>
  );
}

function XpButton(props: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.xpButton} onPress={props.onPress} accessibilityRole="button">
      <Text style={styles.xpButtonText}>{props.label}</Text>
    </Pressable>
  );
}

function SmallButton(props: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      style={[styles.small, props.disabled && styles.disabled]}
      disabled={props.disabled}
      onPress={props.onPress}
      accessibilityRole="button"
    >
      <Text style={styles.smallText}>{props.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  warning: { color: COLORS.warning, fontSize: 13 },
  notice: { color: COLORS.warning, fontSize: 14, textAlign: 'center' },
  muted: { color: COLORS.muted, fontSize: 14 },
  heading: { color: COLORS.muted, fontSize: 14, fontWeight: '700', marginTop: 12, textTransform: 'uppercase' },
  danger: { borderRadius: 8, padding: 12, alignItems: 'center' },
  dangerText: { fontSize: 17, fontWeight: '700' },
  card: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  kind: { color: COLORS.muted, fontSize: 15, fontWeight: '700', textTransform: 'uppercase' },
  kindRush: { color: COLORS.warning },
  kindExtra: { color: '#ef6a5f' },
  result: { color: COLORS.text, fontSize: 34, fontWeight: '800', textAlign: 'center' },
  rule: { color: COLORS.text, fontSize: 15, textAlign: 'center' },
  lines: { flexDirection: 'row', gap: 8, marginTop: 8 },
  line: { width: 48, height: 36, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  lineInactive: { opacity: 0.3 },
  lineText: { fontSize: 16, fontWeight: '700' },
  draw: { backgroundColor: COLORS.accent, borderRadius: 10, padding: 20, alignItems: 'center' },
  drawText: { color: '#ffffff', fontSize: 20, fontWeight: '800' },
  piles: { flexDirection: 'row', justifyContent: 'space-between' },
  actions: { flexDirection: 'row', gap: 8 },
  small: {
    flexGrow: 1,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  smallText: { color: COLORS.text, fontSize: 15 },
  disabled: { opacity: 0.4 },
  survivor: { backgroundColor: COLORS.surface, borderRadius: 8, padding: 12, gap: 8 },
  survivorHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { flex: 1, color: COLORS.text, fontSize: 16, paddingVertical: 4 },
  xpRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  xp: { flex: 1, height: 44, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  xpText: { fontSize: 16, fontWeight: '700' },
  xpButton: {
    width: 48,
    height: 44,
    borderRadius: 6,
    borderColor: COLORS.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xpButtonText: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
});
