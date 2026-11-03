import { useState } from 'react';
import { Image, type ImageSourcePropType, StyleSheet, View } from 'react-native';

import type { ZombieCard, ZombieType } from '@/game/types';

export type ArtSubject = ZombieType | 'trejo' | 'spam';

// One illustration per subject, upscaled to 1280 px tall and compressed to JPEG.
// Tall portrait illustrations, shown in the panel beside the Danger Levels.
const ART: Partial<Record<ArtSubject, ImageSourcePropType>> = {
  walker: require('../../assets/zombies/walker-cartoon.jpg'),
  fatty: require('../../assets/zombies/fatty-cartoon.jpg'),
  runner: require('../../assets/zombies/runner-cartoon.jpg'),
  abomination: require('../../assets/zombies/abomination-cartoon.jpg'),
  toxicWalker: require('../../assets/zombies/toxic-walker-cartoon.jpg'),
  toxicFatty: require('../../assets/zombies/toxic-fatty-cartoon.jpg'),
  toxicRunner: require('../../assets/zombies/toxic-runner-cartoon.jpg'),
  berserkerWalker: require('../../assets/zombies/berserker-walker-cartoon.jpg'),
  berserkerFatty: require('../../assets/zombies/berserker-fatty-cartoon.jpg'),
  berserkerRunner: require('../../assets/zombies/berserker-runner-cartoon.jpg'),
  skinnerWalker: require('../../assets/zombies/skinner-walker-cartoon.jpg'),
  skinnerFatty: require('../../assets/zombies/skinner-fatty-cartoon.jpg'),
  skinnerRunner: require('../../assets/zombies/skinner-runner-cartoon.jpg'),
  dog: require('../../assets/zombies/dog-cartoon.jpg'),
  crow: require('../../assets/zombies/crow-cartoon.jpg'),
  seeker: require('../../assets/zombies/seeker-cartoon.jpg'),
  vip: require('../../assets/zombies/vip-cartoon.jpg'),
  lostZombivor: require('../../assets/zombies/lost-zombivor-cartoon.jpg'),
  sillyWalker: require('../../assets/zombies/silly-walker-cartoon.jpg'),
  inquisitor: require('../../assets/zombies/inquisitor-cartoon.jpg'),
  trejo: require('../../assets/zombies/trejo-cartoon.jpg'),
  spam: require('../../assets/zombies/spam-cartoon.jpg'),
};

export const hasArt = (subject: ArtSubject) => subject in ART;

export const artSubject = (card: ZombieCard): ArtSubject =>
  card.kind === 'trejo' || card.kind === 'trejoRush' ? 'trejo' : card.kind === 'spam' ? 'spam' : card.zombie;

// Height over width of the Trejo and SPAM illustrations, the only ones shown top-anchored.
const ART_RATIO = 2.25;

/** Fills its panel; `top` keeps the head in view when the panel is wider than the illustration. */
export function ZombieFigure({ subject, anchor = 'center' }: { subject: ArtSubject; anchor?: 'center' | 'top' }) {
  const [width, setWidth] = useState(0);
  const source = ART[subject];
  if (!source) return null;
  if (anchor === 'center') return <Image source={source} style={styles.figure} resizeMode="cover" />;
  // Scaled to the panel width and pinned to the top, cropping the legs instead of the head.
  const scaled = width * 1.08;
  return (
    <View style={StyleSheet.absoluteFill} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {width > 0 && (
        <Image
          source={source}
          style={{ position: 'absolute', top: -width * 0.03, left: -width * 0.04, width: scaled, height: scaled * ART_RATIO }}
        />
      )}
    </View>
  );
}

// Slightly larger than its panel so the overflow trims the printed cream border.
const styles = StyleSheet.create({
  figure: { position: 'absolute', top: '-2%', left: '-4%', width: '108%', height: '104%' },
});
