import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ZombieFigure } from '@/components/zombie-art';
import { isBossName, isModernAbomination } from '@/data/threat';
import { useApp } from '@/game/store';
import type { Translate } from '@/i18n/translations';
import { COLORS, PRESSED } from '@/theme';

/** Share of the screen height the three candidates take; the title and the buttons get the rest. */
const TILE_HEIGHT = 0.62;
/** Widest a candidate gets on a tablet: three of them side by side stay readable. */
const TILE_MAX_WIDTH = 260;
const TILE_GAP = 12;
/** Share of a candidate's height its picture takes; its name and rule (which scrolls) get the rest. */
const ART_SHARE = 0.45;
/** Width of the column showing the Abomination that absorbs the others, its rule under its picture. */
const BOSS_WIDTH = 160;

/** The name of an Abomination, or the generic one for a card that is not a named boss of either era. */
export const abominationName = (id: string, t: Translate) => (isBossName(id) ? t(`zombie.${id}.one`) : t('game.manualBoss'));

/**
 * Gozer draws candidates and the players keep some of them: tap `keep` of the `offered` Abominations, then confirm.
 * Closing the sheet leaves the choice pending (tap Gozer's card to come back).
 */
export function ChoiceSheet(props: {
  /** The Abomination that absorbs the chosen ones (Gozer). */
  boss: string;
  offered: readonly string[];
  keep: number;
  onConfirm: (picked: string[]) => void;
  onClose: () => void;
}) {
  const { t } = useApp();
  const window = useWindowDimensions();
  // Positions, not ids: the deck holds copies of some cards, which must be told apart.
  const [picked, setPicked] = useState<number[]>([]);
  const toggle = (index: number) =>
    setPicked((now) => (now.includes(index) ? now.filter((i) => i !== index) : now.length < props.keep ? [...now, index] : now));
  const ready = picked.length === props.keep;
  const height = Math.round(window.height * TILE_HEIGHT);
  // The boss column and the tiles share the row, a gap between each.
  const width = Math.min(TILE_MAX_WIDTH, Math.floor((window.width - 32 - BOSS_WIDTH - TILE_GAP * props.offered.length) / props.offered.length));
  const bossId = isModernAbomination(props.boss) ? props.boss : undefined;
  const bossName = abominationName(props.boss, t);

  return (
    <Modal
      transparent
      animationType="fade"
      // iOS shows modals in portrait unless told otherwise; the app is landscape only.
      supportedOrientations={['landscape', 'landscape-left', 'landscape-right']}
      onRequestClose={props.onClose}
      // Android: the dimmed overlay reaches under the system bars and the camera cutout too.
      statusBarTranslucent
      navigationBarTranslucent
    >
      <SafeAreaView style={styles.overlay} edges={['left', 'right', 'top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header" numberOfLines={2}>
            {t('boss.absorbs', { name: bossName, count: props.keep })}
          </Text>
          <Button compact label={t('game.close')} onPress={props.onClose} />
          <Button
            compact
            label={t('boss.confirm')}
            disabled={!ready}
            onPress={() => props.onConfirm(picked.map((index) => props.offered[index]))}
          />
        </View>
        <View style={styles.tiles}>
          <View style={[styles.tile, styles.boss, { height }]}>
            <View style={[styles.art, { height: Math.round(height * ART_SHARE) }]}>
              {bossId && <ZombieFigure subject={bossId} anchor="upper" plain />}
            </View>
            <Text style={styles.name} numberOfLines={2}>
              {bossName}
            </Text>
            <ScrollView style={styles.rule}>
              <Text style={styles.ruleText}>{bossId ? t(`card.${bossId}Rule`) : ''}</Text>
            </ScrollView>
          </View>
          {props.offered.map((id, index) => {
            const selected = picked.includes(index);
            const named = isModernAbomination(id);
            const name = abominationName(id, t);
            const rule = named ? t(`card.${id}Rule`) : '';
            return (
              <Pressable
                key={`${id}-${index}`}
                style={({ pressed }) => [styles.tile, { width, height }, selected && styles.tileSelected, pressed && PRESSED]}
                onPress={() => toggle(index)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${name}. ${rule}`}
              >
                <View style={[styles.art, { height: Math.round(height * ART_SHARE) }]}>
                  {named && <ZombieFigure subject={id} anchor="upper" plain />}
                </View>
                <Text style={styles.name} numberOfLines={2}>
                  {name}
                </Text>
                <ScrollView style={styles.rule}>
                  <Text style={styles.ruleText}>{rule}</Text>
                </ScrollView>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(9, 14, 12, 0.94)', justifyContent: 'center', gap: 12, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { flex: 1, color: COLORS.text, fontSize: 16, fontWeight: '800', textTransform: 'uppercase' },
  tiles: { flexDirection: 'row', justifyContent: 'center', gap: TILE_GAP },
  tile: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 3,
    borderRadius: 10,
    padding: 8,
    gap: 6,
    overflow: 'hidden',
  },
  boss: { width: BOSS_WIDTH },
  tileSelected: { borderColor: COLORS.warning },
  art: { overflow: 'hidden', borderRadius: 6 },
  name: { color: COLORS.text, fontSize: 15, fontWeight: '900', textAlign: 'center' },
  rule: { flex: 1 },
  ruleText: { color: COLORS.muted, fontSize: 12, lineHeight: 15, fontWeight: '600', textAlign: 'center' },
});
