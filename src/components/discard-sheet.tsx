import { FlatList, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { CardFace } from '@/components/card-face';
import { CARDS_BY_ID } from '@/data/universes';
import { useApp } from '@/game/store';
import type { DangerLevel } from '@/game/types';
import { COLORS } from '@/theme';

const CARD_RATIO = 63 / 88;
const GAP = 12;

/** The discard pile laid out in a row, last card discarded first, to check what came out recently. */
export function DiscardSheet(props: { discard: readonly string[]; danger: DangerLevel; onClose: () => void }) {
  const { t } = useApp();
  const window = useWindowDimensions();
  const width = Math.round(window.height * 0.6 * CARD_RATIO);
  const cards = [...props.discard].reverse();

  return (
    <Modal
      transparent
      animationType="fade"
      // iOS shows modals in portrait unless told otherwise; the app is landscape only.
      supportedOrientations={['landscape', 'landscape-left', 'landscape-right']}
      onRequestClose={props.onClose}
    >
      <SafeAreaView style={styles.overlay} edges={['left', 'right', 'top', 'bottom']}>
        {/* Tapping beside the cards closes the sheet too. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={props.onClose} accessible={false} />
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            {t('game.discardTitle')}
          </Text>
          <Button label={t('game.close')} onPress={props.onClose} />
        </View>
        {cards.length === 0 ? (
          <Text style={styles.empty}>{t('game.discardEmpty')}</Text>
        ) : (
          <FlatList
            horizontal
            data={cards}
            keyExtractor={(id, index) => `${id}-${index}`}
            contentContainerStyle={styles.row}
            initialNumToRender={5}
            windowSize={5}
            getItemLayout={(_, index) => ({ length: width + GAP, offset: (width + GAP) * index, index })}
            renderItem={({ item }) => {
              const card = CARDS_BY_ID.get(item);
              return card ? (
                <View style={{ width, aspectRatio: CARD_RATIO, marginRight: GAP }}>
                  <CardFace card={card} danger={props.danger} width={width} />
                </View>
              ) : null;
            }}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(9, 14, 12, 0.92)', justifyContent: 'center', gap: 12, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 4 },
  title: { flex: 1, color: COLORS.text, fontSize: 16, fontWeight: '800', textTransform: 'uppercase' },
  row: { paddingHorizontal: 4, alignItems: 'center' },
  empty: { color: COLORS.muted, fontSize: 15, textAlign: 'center', paddingVertical: 48 },
});
