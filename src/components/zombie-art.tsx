import { useState } from 'react';
import { Image, type ImageSourcePropType, StyleSheet, View } from 'react-native';

import type { FantasyNecromancer, FantasyZombie, ModernCard, ZombieType } from '@/game/types';

export type ArtSubject = ZombieType | FantasyZombie | FantasyNecromancer | 'trejo' | 'spam';

// One illustration per subject, upscaled to 1280 px tall and compressed to JPEG.
// Tall portrait illustrations, shown in the panel beside the Danger Levels.
const ART: Record<ArtSubject, ImageSourcePropType> = {
  wolfz: require('../../assets/zombies/wolfz-cartoon.jpg'),
  wolfbomination: require('../../assets/zombies/wolfbomination-cartoon.jpg'),
  npcWalker: require('../../assets/zombies/npc-walker-cartoon.jpg'),
  deadeyeWalker: require('../../assets/zombies/deadeye-walker-cartoon.jpg'),
  crowz: require('../../assets/zombies/crowz-cartoon.jpg'),
  taintedWalker: require('../../assets/zombies/tainted-walker-cartoon.jpg'),
  taintedAbomination: require('../../assets/zombies/tainted-abomination-cartoon.jpg'),
  ablobination: require('../../assets/zombies/ablobination-cartoon.jpg'),
  abominatroll: require('../../assets/zombies/abominatroll-cartoon.jpg'),
  abominotaur: require('../../assets/zombies/abominotaur-cartoon.jpg'),
  fattyBurster: require('../../assets/zombies/fatty-burster-cartoon.jpg'),
  zombieGiant: require('../../assets/zombies/zombie-giant-cartoon.jpg'),
  gorgomination: require('../../assets/zombies/gorgomination-cartoon.jpg'),
  hordeBrother: require('../../assets/zombies/horde-brother-cartoon.jpg'),
  siegeBreaker: require('../../assets/zombies/siege-breaker-cartoon.jpg'),
  swampLurker: require('../../assets/zombies/swamp-lurker-cartoon.jpg'),
  abominabunny: require('../../assets/zombies/abominabunny-cartoon.jpg'),
  magentaCovefe: require('../../assets/zombies/magenta-covefe-cartoon.jpg'),
  vaultWarden: require('../../assets/zombies/vault-warden-cartoon.jpg'),
  werezombie: require('../../assets/zombies/werezombie-cartoon.jpg'),
  chromatiz: require('../../assets/zombies/chromatiz-cartoon.jpg'),
  feralDragon: require('../../assets/zombies/feral-dragon-cartoon.jpg'),
  countTemeraire: require('../../assets/zombies/count-temeraire-cartoon.jpg'),
  queenSevera: require('../../assets/zombies/queen-severa-cartoon.jpg'),
  fantasyWalker: require('../../assets/zombies/fantasy-walker-cartoon.jpg'),
  fantasyRunner: require('../../assets/zombies/fantasy-runner-cartoon.jpg'),
  fantasyFatty: require('../../assets/zombies/fantasy-fatty-cartoon.jpg'),
  fantasyAbomination: require('../../assets/zombies/fantasy-abomination-cartoon.jpg'),
  orcWalker: require('../../assets/zombies/orc-walker-cartoon.jpg'),
  orcRunner: require('../../assets/zombies/orc-runner-cartoon.jpg'),
  orcFatty: require('../../assets/zombies/orc-fatty-cartoon.jpg'),
  orcAbomination: require('../../assets/zombies/orc-abomination-cartoon.jpg'),
  necromancer: require('../../assets/zombies/necromancer-cartoon.jpg'),
  orcNecromancer: require('../../assets/zombies/orc-necromancer-cartoon.jpg'),
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

export const artSubject = (card: ModernCard): ArtSubject =>
  card.kind === 'trejo' || card.kind === 'trejoRush' ? 'trejo' : card.kind === 'spam' ? 'spam' : card.zombie;

// Height over width of the Trejo and SPAM illustrations, the only ones shown top-anchored.
const ART_RATIO = 2.25;
/** Height over width of the fantasy illustrations (640 × 1280). */
const FIGURE_RATIO = 2;
/** Share of the illustration above the head (border and halo) left out when showing its upper part. */
const UPPER_OFFSET = 0.1;
/** Creatures whose head sits higher (tall ears, horn, a giant filling the frame) or lower (a maw in the belly). */
const UPPER_OFFSETS: Partial<Record<ArtSubject, number>> = {
  zombieGiant: 0.03,
  abominabunny: 0.04,
  chromatiz: 0.04,
  ablobination: 0.15,
  swampLurker: 0.18,
  magentaCovefe: 0.18,
};

/** Fills its panel; `top` keeps the head in view when the panel is wider than the illustration. */
export function ZombieFigure({
  subject,
  anchor = 'center',
}: {
  subject: ArtSubject;
  anchor?: 'center' | 'top' | 'upper' | 'full';
}) {
  const [width, setWidth] = useState(0);
  const source = ART[subject];
  if (anchor === 'full') return <Image source={source} style={styles.fullFigure} resizeMode="contain" />;
  if (anchor === 'center') return <Image source={source} style={styles.figure} resizeMode="cover" />;
  if (anchor === 'upper') {
    // Head and chest of a full-length figure in a wide panel: the width fills the panel, the halo above the head and
    // the legs are cropped.
    return (
      <View style={StyleSheet.absoluteFill} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        {width > 0 && (
          <Image
            source={source}
            style={{ position: 'absolute', top: -width * FIGURE_RATIO * (UPPER_OFFSETS[subject] ?? UPPER_OFFSET), left: 0, width, height: width * FIGURE_RATIO }}
          />
        )}
      </View>
    );
  }
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
  fullFigure: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  figure: { position: 'absolute', top: '-2%', left: '-4%', width: '108%', height: '104%' },
});
