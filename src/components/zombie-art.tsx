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
  abominalpha: require('../../assets/zombies/abominalpha-cartoon.jpg'),
  abominarat: require('../../assets/zombies/abominarat-cartoon.jpg'),
  toMeKuPa: require('../../assets/zombies/to-me-ku-pa-cartoon.jpg'),
  blackheart: require('../../assets/zombies/blackheart-cartoon.jpg'),
  ostokar: require('../../assets/zombies/ostokar-cartoon.jpg'),
  evilTroy: require('../../assets/zombies/evil-troy-cartoon.jpg'),
  queenMedea: require('../../assets/zombies/queen-medea-cartoon.jpg'),
  grin: require('../../assets/zombies/grin-cartoon.jpg'),
  erikSummoner: require('../../assets/zombies/erik-summoner-cartoon.jpg'),
  innsmouth: require('../../assets/zombies/innsmouth-cartoon.jpg'),
  faolan: require('../../assets/zombies/faolan-cartoon.jpg'),
  lordOfSkulls: require('../../assets/zombies/lord-of-skulls-cartoon.jpg'),
  spectralWalker: require('../../assets/zombies/spectral-walker-cartoon.jpg'),
  ratz: require('../../assets/zombies/ratz-cartoon.jpg'),
  ratKing: require('../../assets/zombies/rat-king-cartoon.jpg'),
  swampTroll: require('../../assets/zombies/swamp-troll-cartoon.jpg'),
  necromanticDragon: require('../../assets/zombies/necromantic-dragon-cartoon.jpg'),
  wdWalker: require('../../assets/zombies/wd-walker-cartoon.jpg'),
  wdRunner: require('../../assets/zombies/wd-runner-cartoon.jpg'),
  wdBrute: require('../../assets/zombies/wd-brute-cartoon.jpg'),
  khanAbomination: require('../../assets/zombies/khan-abomination-cartoon.jpg'),
  defilerNecromancer: require('../../assets/zombies/defiler-necromancer-cartoon.jpg'),
  eeWalker: require('../../assets/zombies/ee-walker-cartoon.jpg'),
  eeRunner: require('../../assets/zombies/ee-runner-cartoon.jpg'),
  eeBrute: require('../../assets/zombies/ee-brute-cartoon.jpg'),
  godEaterAbomination: require('../../assets/zombies/god-eater-abomination-cartoon.jpg'),
  amaterasu: require('../../assets/zombies/amaterasu-cartoon.jpg'),
  asura: require('../../assets/zombies/asura-cartoon.jpg'),
  bishamon: require('../../assets/zombies/bishamon-cartoon.jpg'),
  chimimoryo: require('../../assets/zombies/chimimoryo-cartoon.jpg'),
  hachiman: require('../../assets/zombies/hachiman-cartoon.jpg'),
  kijin: require('../../assets/zombies/kijin-cartoon.jpg'),
  kumiho: require('../../assets/zombies/kumiho-cartoon.jpg'),
  nian: require('../../assets/zombies/nian-cartoon.jpg'),
  qilin: require('../../assets/zombies/qilin-cartoon.jpg'),
  redHare: require('../../assets/zombies/red-hare-cartoon.jpg'),
  shakokiDogu: require('../../assets/zombies/shakoki-dogu-cartoon.jpg'),
  sojobo: require('../../assets/zombies/sojobo-cartoon.jpg'),
  susanoWo: require('../../assets/zombies/susano-wo-cartoon.jpg'),
  takemikazuchi: require('../../assets/zombies/takemikazuchi-cartoon.jpg'),
  toyol: require('../../assets/zombies/toyol-cartoon.jpg'),
  yeti: require('../../assets/zombies/yeti-cartoon.jpg'),
  bomoh: require('../../assets/zombies/bomoh-cartoon.jpg'),
  deathNotes: require('../../assets/zombies/death-notes-cartoon.jpg'),
  hannya: require('../../assets/zombies/hannya-cartoon.jpg'),
  kaguya: require('../../assets/zombies/kaguya-cartoon.jpg'),
  tengu: require('../../assets/zombies/tengu-cartoon.jpg'),
  yukiOnna: require('../../assets/zombies/yuki-onna-cartoon.jpg'),
  fantasyBerserkerWalker: require('../../assets/zombies/fantasy-berserker-walker-cartoon.jpg'),
  deadboltWalker: require('../../assets/zombies/deadbolt-walker-cartoon.jpg'),
  terrorcottaWalker: require('../../assets/zombies/terrorcotta-walker-cartoon.jpg'),
  climber: require('../../assets/zombies/climber-cartoon.jpg'),
  divineBeast: require('../../assets/zombies/divine-beast-cartoon.jpg'),
  reaper: require('../../assets/zombies/reaper-cartoon.jpg'),
  baalberith: require('../../assets/zombies/baalberith-cartoon.jpg'),
  horseman: require('../../assets/zombies/horseman-cartoon.jpg'),
  queenCaenedra: require('../../assets/zombies/queen-caenedra-cartoon.jpg'),
  hugBear: require('../../assets/zombies/hug-bear-cartoon.jpg'),
  banshee: require('../../assets/zombies/banshee-cartoon.jpg'),
  cerberus: require('../../assets/zombies/cerberus-cartoon.jpg'),
  lordJanas: require('../../assets/zombies/lord-janas-cartoon.jpg'),
  marike: require('../../assets/zombies/marike-cartoon.jpg'),
  erinn: require('../../assets/zombies/erinn-cartoon.jpg'),
  grandVizier: require('../../assets/zombies/grand-vizier-cartoon.jpg'),
  theSparrow: require('../../assets/zombies/the-sparrow-cartoon.jpg'),
  dongZhuo: require('../../assets/zombies/dong-zhuo-cartoon.jpg'),
  zhangJiao: require('../../assets/zombies/zhang-jiao-cartoon.jpg'),
  fumaKotaro: require('../../assets/zombies/fuma-kotaro-cartoon.jpg'),
  footNinja: require('../../assets/zombies/foot-ninja-cartoon.jpg'),
  bebop: require('../../assets/zombies/bebop-cartoon.jpg'),
  rocksteady: require('../../assets/zombies/rocksteady-cartoon.jpg'),
  pharaohEddie: require('../../assets/zombies/pharaoh-eddie-cartoon.jpg'),
  samuraiEddie: require('../../assets/zombies/samurai-eddie-cartoon.jpg'),
  mummyEddie: require('../../assets/zombies/mummy-eddie-cartoon.jpg'),
  wickerManEddie: require('../../assets/zombies/wicker-man-eddie-cartoon.jpg'),
  fearEddie: require('../../assets/zombies/fear-eddie-cartoon.jpg'),
  mummRa: require('../../assets/zombies/mumm-ra-cartoon.jpg'),
  reaperEddie: require('../../assets/zombies/reaper-eddie-cartoon.jpg'),
  shamanEddie: require('../../assets/zombies/shaman-eddie-cartoon.jpg'),
  // Stand-in: only named in a card footer, never drawn.
  wardenBrute: require('../../assets/zombies/fantasy-fatty-cartoon.jpg'),
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
