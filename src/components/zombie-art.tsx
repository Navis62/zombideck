import { useState } from 'react';
import { Image, type ImageSourcePropType, StyleSheet, View } from 'react-native';

import type { FantasyNecromancer, FantasyZombie, ModernCard, NamedModernAbomination, ZombieType } from '@/game/types';

export type ArtSubject = ZombieType | FantasyZombie | FantasyNecromancer | NamedModernAbomination | 'trejo' | 'spam';

// One illustration per subject, upscaled to 1280 px tall and compressed to JPEG.
// Tall portrait illustrations, shown in the panel beside the Danger Levels.
const MODERN_ART: Record<ZombieType | 'trejo' | 'spam' | NamedModernAbomination, ImageSourcePropType> = {
  walker: require('../../assets/modern/zombies/walker-cartoon.jpg'),
  fatty: require('../../assets/modern/zombies/fatty-cartoon.jpg'),
  runner: require('../../assets/modern/zombies/runner-cartoon.jpg'),
  abomination: require('../../assets/modern/zombies/abomination-cartoon.jpg'),
  toxicWalker: require('../../assets/modern/zombies/toxic-walker-cartoon.jpg'),
  toxicFatty: require('../../assets/modern/zombies/toxic-fatty-cartoon.jpg'),
  toxicRunner: require('../../assets/modern/zombies/toxic-runner-cartoon.jpg'),
  berserkerWalker: require('../../assets/modern/zombies/berserker-walker-cartoon.jpg'),
  berserkerFatty: require('../../assets/modern/zombies/berserker-fatty-cartoon.jpg'),
  berserkerRunner: require('../../assets/modern/zombies/berserker-runner-cartoon.jpg'),
  skinnerWalker: require('../../assets/modern/zombies/skinner-walker-cartoon.jpg'),
  skinnerFatty: require('../../assets/modern/zombies/skinner-fatty-cartoon.jpg'),
  skinnerRunner: require('../../assets/modern/zombies/skinner-runner-cartoon.jpg'),
  dog: require('../../assets/modern/zombies/dog-cartoon.jpg'),
  crow: require('../../assets/modern/zombies/crow-cartoon.jpg'),
  seeker: require('../../assets/modern/zombies/seeker-cartoon.jpg'),
  vip: require('../../assets/modern/zombies/vip-cartoon.jpg'),
  lostZombivor: require('../../assets/modern/zombies/lost-zombivor-cartoon.jpg'),
  sillyWalker: require('../../assets/modern/zombies/silly-walker-cartoon.jpg'),
  inquisitor: require('../../assets/modern/zombies/inquisitor-cartoon.jpg'),
  trejo: require('../../assets/modern/zombies/trejo-cartoon.jpg'),
  spam: require('../../assets/modern/zombies/spam-cartoon.jpg'),
};

const FANTASY_ART: Record<FantasyZombie | FantasyNecromancer, ImageSourcePropType> = {
  wolfz: require('../../assets/fantasy/zombies/wolfz-cartoon.jpg'),
  wolfbomination: require('../../assets/fantasy/zombies/wolfbomination-cartoon.jpg'),
  npcWalker: require('../../assets/fantasy/zombies/npc-walker-cartoon.jpg'),
  deadeyeWalker: require('../../assets/fantasy/zombies/deadeye-walker-cartoon.jpg'),
  crowz: require('../../assets/fantasy/zombies/crowz-cartoon.jpg'),
  taintedWalker: require('../../assets/fantasy/zombies/tainted-walker-cartoon.jpg'),
  taintedAbomination: require('../../assets/fantasy/zombies/tainted-abomination-cartoon.jpg'),
  ablobination: require('../../assets/fantasy/zombies/ablobination-cartoon.jpg'),
  abominatroll: require('../../assets/fantasy/zombies/abominatroll-cartoon.jpg'),
  abominotaur: require('../../assets/fantasy/zombies/abominotaur-cartoon.jpg'),
  fattyBurster: require('../../assets/fantasy/zombies/fatty-burster-cartoon.jpg'),
  zombieGiant: require('../../assets/fantasy/zombies/zombie-giant-cartoon.jpg'),
  gorgomination: require('../../assets/fantasy/zombies/gorgomination-cartoon.jpg'),
  hordeBrother: require('../../assets/fantasy/zombies/horde-brother-cartoon.jpg'),
  siegeBreaker: require('../../assets/fantasy/zombies/siege-breaker-cartoon.jpg'),
  swampLurker: require('../../assets/fantasy/zombies/swamp-lurker-cartoon.jpg'),
  abominabunny: require('../../assets/fantasy/zombies/abominabunny-cartoon.jpg'),
  magentaCovefe: require('../../assets/fantasy/zombies/magenta-covefe-cartoon.jpg'),
  vaultWarden: require('../../assets/fantasy/zombies/vault-warden-cartoon.jpg'),
  werezombie: require('../../assets/fantasy/zombies/werezombie-cartoon.jpg'),
  chromatiz: require('../../assets/fantasy/zombies/chromatiz-cartoon.jpg'),
  feralDragon: require('../../assets/fantasy/zombies/feral-dragon-cartoon.jpg'),
  countTemeraire: require('../../assets/fantasy/zombies/count-temeraire-cartoon.jpg'),
  queenSevera: require('../../assets/fantasy/zombies/queen-severa-cartoon.jpg'),
  abominalpha: require('../../assets/fantasy/zombies/abominalpha-cartoon.jpg'),
  abominarat: require('../../assets/fantasy/zombies/abominarat-cartoon.jpg'),
  toMeKuPa: require('../../assets/fantasy/zombies/to-me-ku-pa-cartoon.jpg'),
  blackheart: require('../../assets/fantasy/zombies/blackheart-cartoon.jpg'),
  ostokar: require('../../assets/fantasy/zombies/ostokar-cartoon.jpg'),
  evilTroy: require('../../assets/fantasy/zombies/evil-troy-cartoon.jpg'),
  queenMedea: require('../../assets/fantasy/zombies/queen-medea-cartoon.jpg'),
  grin: require('../../assets/fantasy/zombies/grin-cartoon.jpg'),
  erikSummoner: require('../../assets/fantasy/zombies/erik-summoner-cartoon.jpg'),
  innsmouth: require('../../assets/fantasy/zombies/innsmouth-cartoon.jpg'),
  faolan: require('../../assets/fantasy/zombies/faolan-cartoon.jpg'),
  lordOfSkulls: require('../../assets/fantasy/zombies/lord-of-skulls-cartoon.jpg'),
  spectralWalker: require('../../assets/fantasy/zombies/spectral-walker-cartoon.jpg'),
  ratz: require('../../assets/fantasy/zombies/ratz-cartoon.jpg'),
  ratKing: require('../../assets/fantasy/zombies/rat-king-cartoon.jpg'),
  swampTroll: require('../../assets/fantasy/zombies/swamp-troll-cartoon.jpg'),
  necromanticDragon: require('../../assets/fantasy/zombies/necromantic-dragon-cartoon.jpg'),
  wdWalker: require('../../assets/fantasy/zombies/wd-walker-cartoon.jpg'),
  wdRunner: require('../../assets/fantasy/zombies/wd-runner-cartoon.jpg'),
  wdBrute: require('../../assets/fantasy/zombies/wd-brute-cartoon.jpg'),
  khanAbomination: require('../../assets/fantasy/zombies/khan-abomination-cartoon.jpg'),
  defilerNecromancer: require('../../assets/fantasy/zombies/defiler-necromancer-cartoon.jpg'),
  eeWalker: require('../../assets/fantasy/zombies/ee-walker-cartoon.jpg'),
  eeRunner: require('../../assets/fantasy/zombies/ee-runner-cartoon.jpg'),
  eeBrute: require('../../assets/fantasy/zombies/ee-brute-cartoon.jpg'),
  godEaterAbomination: require('../../assets/fantasy/zombies/god-eater-abomination-cartoon.jpg'),
  amaterasu: require('../../assets/fantasy/zombies/amaterasu-cartoon.jpg'),
  asura: require('../../assets/fantasy/zombies/asura-cartoon.jpg'),
  bishamon: require('../../assets/fantasy/zombies/bishamon-cartoon.jpg'),
  chimimoryo: require('../../assets/fantasy/zombies/chimimoryo-cartoon.jpg'),
  hachiman: require('../../assets/fantasy/zombies/hachiman-cartoon.jpg'),
  kijin: require('../../assets/fantasy/zombies/kijin-cartoon.jpg'),
  kumiho: require('../../assets/fantasy/zombies/kumiho-cartoon.jpg'),
  nian: require('../../assets/fantasy/zombies/nian-cartoon.jpg'),
  qilin: require('../../assets/fantasy/zombies/qilin-cartoon.jpg'),
  redHare: require('../../assets/fantasy/zombies/red-hare-cartoon.jpg'),
  shakokiDogu: require('../../assets/fantasy/zombies/shakoki-dogu-cartoon.jpg'),
  sojobo: require('../../assets/fantasy/zombies/sojobo-cartoon.jpg'),
  susanoWo: require('../../assets/fantasy/zombies/susano-wo-cartoon.jpg'),
  takemikazuchi: require('../../assets/fantasy/zombies/takemikazuchi-cartoon.jpg'),
  toyol: require('../../assets/fantasy/zombies/toyol-cartoon.jpg'),
  yeti: require('../../assets/fantasy/zombies/yeti-cartoon.jpg'),
  bomoh: require('../../assets/fantasy/zombies/bomoh-cartoon.jpg'),
  deathNotes: require('../../assets/fantasy/zombies/death-notes-cartoon.jpg'),
  hannya: require('../../assets/fantasy/zombies/hannya-cartoon.jpg'),
  kaguya: require('../../assets/fantasy/zombies/kaguya-cartoon.jpg'),
  tengu: require('../../assets/fantasy/zombies/tengu-cartoon.jpg'),
  yukiOnna: require('../../assets/fantasy/zombies/yuki-onna-cartoon.jpg'),
  fantasyBerserkerWalker: require('../../assets/fantasy/zombies/fantasy-berserker-walker-cartoon.jpg'),
  deadboltWalker: require('../../assets/fantasy/zombies/deadbolt-walker-cartoon.jpg'),
  terrorcottaWalker: require('../../assets/fantasy/zombies/terrorcotta-walker-cartoon.jpg'),
  climber: require('../../assets/fantasy/zombies/climber-cartoon.jpg'),
  divineBeast: require('../../assets/fantasy/zombies/divine-beast-cartoon.jpg'),
  reaper: require('../../assets/fantasy/zombies/reaper-cartoon.jpg'),
  baalberith: require('../../assets/fantasy/zombies/baalberith-cartoon.jpg'),
  horseman: require('../../assets/fantasy/zombies/horseman-cartoon.jpg'),
  queenCaenedra: require('../../assets/fantasy/zombies/queen-caenedra-cartoon.jpg'),
  hugBear: require('../../assets/fantasy/zombies/hug-bear-cartoon.jpg'),
  banshee: require('../../assets/fantasy/zombies/banshee-cartoon.jpg'),
  cerberus: require('../../assets/fantasy/zombies/cerberus-cartoon.jpg'),
  lordJanas: require('../../assets/fantasy/zombies/lord-janas-cartoon.jpg'),
  marike: require('../../assets/fantasy/zombies/marike-cartoon.jpg'),
  erinn: require('../../assets/fantasy/zombies/erinn-cartoon.jpg'),
  grandVizier: require('../../assets/fantasy/zombies/grand-vizier-cartoon.jpg'),
  theSparrow: require('../../assets/fantasy/zombies/the-sparrow-cartoon.jpg'),
  dongZhuo: require('../../assets/fantasy/zombies/dong-zhuo-cartoon.jpg'),
  zhangJiao: require('../../assets/fantasy/zombies/zhang-jiao-cartoon.jpg'),
  fumaKotaro: require('../../assets/fantasy/zombies/fuma-kotaro-cartoon.jpg'),
  footNinja: require('../../assets/fantasy/zombies/foot-ninja-cartoon.jpg'),
  bebop: require('../../assets/fantasy/zombies/bebop-cartoon.jpg'),
  rocksteady: require('../../assets/fantasy/zombies/rocksteady-cartoon.jpg'),
  pharaohEddie: require('../../assets/fantasy/zombies/pharaoh-eddie-cartoon.jpg'),
  samuraiEddie: require('../../assets/fantasy/zombies/samurai-eddie-cartoon.jpg'),
  mummyEddie: require('../../assets/fantasy/zombies/mummy-eddie-cartoon.jpg'),
  wickerManEddie: require('../../assets/fantasy/zombies/wicker-man-eddie-cartoon.jpg'),
  fearEddie: require('../../assets/fantasy/zombies/fear-eddie-cartoon.jpg'),
  mummRa: require('../../assets/fantasy/zombies/mumm-ra-cartoon.jpg'),
  reaperEddie: require('../../assets/fantasy/zombies/reaper-eddie-cartoon.jpg'),
  shamanEddie: require('../../assets/fantasy/zombies/shaman-eddie-cartoon.jpg'),
  // Stand-in: only named in a card footer, never drawn.
  wardenBrute: require('../../assets/fantasy/zombies/fantasy-fatty-cartoon.jpg'),
  fantasyWalker: require('../../assets/fantasy/zombies/fantasy-walker-cartoon.jpg'),
  fantasyRunner: require('../../assets/fantasy/zombies/fantasy-runner-cartoon.jpg'),
  fantasyFatty: require('../../assets/fantasy/zombies/fantasy-fatty-cartoon.jpg'),
  fantasyAbomination: require('../../assets/fantasy/zombies/fantasy-abomination-cartoon.jpg'),
  orcWalker: require('../../assets/fantasy/zombies/orc-walker-cartoon.jpg'),
  orcRunner: require('../../assets/fantasy/zombies/orc-runner-cartoon.jpg'),
  orcFatty: require('../../assets/fantasy/zombies/orc-fatty-cartoon.jpg'),
  orcAbomination: require('../../assets/fantasy/zombies/orc-abomination-cartoon.jpg'),
  necromancer: require('../../assets/fantasy/zombies/necromancer-cartoon.jpg'),
  orcNecromancer: require('../../assets/fantasy/zombies/orc-necromancer-cartoon.jpg'),
};

const ART: Record<ArtSubject, ImageSourcePropType> = { ...MODERN_ART, ...FANTASY_ART };

export const artSubject = (card: ModernCard): ArtSubject =>
  card.kind === 'trejo' || card.kind === 'trejoRush' ? 'trejo' : card.kind === 'spam' ? 'spam' : card.zombie;

// Height over width of the Trejo and SPAM illustrations, the only ones shown top-anchored.
const ART_RATIO = 2.25;
/** Height over width of the fantasy illustrations (640 × 1280). */
const FIGURE_RATIO = 2;
/** Share of the illustration above the head (border and halo) left out when showing its upper part. */
const UPPER_OFFSET = 0.1;
/** Illustrations drawn with the head close to the top edge: cut 10 % away and most of them lose their head. */
const HIGH_HEADS: readonly ArtSubject[] = [
  'abominalpha', 'abominarat', 'toMeKuPa', 'blackheart', 'ostokar', 'evilTroy', 'queenMedea', 'grin', 'erikSummoner',
  'innsmouth', 'faolan', 'lordOfSkulls', 'spectralWalker', 'ratz', 'ratKing', 'swampTroll', 'necromanticDragon',
  'wdWalker', 'wdRunner', 'wdBrute', 'khanAbomination', 'defilerNecromancer', 'eeWalker', 'eeRunner', 'eeBrute',
  'godEaterAbomination', 'amaterasu', 'asura', 'bishamon', 'chimimoryo', 'hachiman', 'kijin', 'kumiho', 'nian', 'qilin',
  'redHare', 'shakokiDogu', 'sojobo', 'susanoWo', 'takemikazuchi', 'yeti', 'bomoh', 'deathNotes', 'hannya',
  'kaguya', 'tengu', 'yukiOnna', 'fantasyBerserkerWalker', 'deadboltWalker', 'terrorcottaWalker', 'climber',
  'divineBeast', 'reaper', 'baalberith', 'horseman', 'queenCaenedra', 'hugBear', 'banshee', 'cerberus', 'lordJanas', 'marike',
  'erinn', 'grandVizier', 'theSparrow', 'dongZhuo', 'zhangJiao', 'fumaKotaro',
  'pharaohEddie', 'samuraiEddie', 'mummyEddie', 'wickerManEddie', 'fearEddie', 'reaperEddie', 'shamanEddie',
  'bebop', 'rocksteady', 'mummRa', 'footNinja',
];
/** Creatures whose head sits higher (tall ears, horn, a giant filling the frame) or lower (a maw in the belly). */
const UPPER_OFFSETS: Partial<Record<ArtSubject, number>> = {
  ...Object.fromEntries(HIGH_HEADS.map((subject) => [subject, 0.03])),
  zombieGiant: 0.03,
  mummyEddie: 0,
  toyol: 0.12,
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
