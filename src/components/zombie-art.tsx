import { Image, type ImageSourcePropType, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import type { ZombieCard, ZombieType } from '@/game/types';

export type ArtSubject = ZombieType | 'trejo' | 'spam';

// One illustration per subject, compressed to JPEG; the source PNGs stay in assets/zombies/originals.
// Full illustrations in a tall 1:2 format, shown in the panel beside the Danger Levels.
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

export function Scene() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 100 140" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#f6d27a" />
          <Stop offset="0.7" stopColor="#e39b2d" />
          <Stop offset="1" stopColor="#8a5a22" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100" height="140" fill="url(#sky)" />
    </Svg>
  );
}

export function ZombieFigure({ subject }: { subject: ArtSubject }) {
  const source = ART[subject];
  if (!source) return null;
  return <Image source={source} style={styles.figure} resizeMode="cover" />;
}

// Slightly larger than its panel so the overflow trims the printed cream border.
const styles = StyleSheet.create({
  figure: { position: 'absolute', top: '-2%', left: '-4%', width: '108%', height: '104%' },
});
