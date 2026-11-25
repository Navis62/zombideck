import { useState } from 'react';
import { Image, type ImageSourcePropType, StyleSheet, View } from 'react-native';

import { FANTASY_PARTS } from '@/components/fantasy-parts';
import { variantFor } from '@/data/card-number';
import { FANTASY_COLORS } from '@/theme';
import type { FantasyNecromancer, FantasyZombie, InvaderAbomination, InvaderXeno, ModernCard, NamedModernAbomination, WesternAbomination, WesternCard, WesternZombie, ZombieType } from '@/game/types';

// Zombies shown alone (menu, carousel; on cards see `westernCardArt`) and named Abominations (see `westernWindow`).
export type WesternSubject = Exclude<WesternZombie, 'longDeadWalker'> | WesternAbomination;
const MODERN_RUNNER_ART = ['runnerCoat', 'runnerKneePads'] as const;
const MODERN_WALKER_ART = ['walkerArgyle', 'walkerSign', 'walkerDenim'] as const;
const MODERN_FATTY_ART = ['fattySecurity', 'fattyDangerSign'] as const;
const TOXIC_WALKER_ART = ['toxicWalkerJacket', 'toxicWalkerSunglasses'] as const;
// Several official pictures per type: the card number picks one (see `artSubject`).
const MODERN_VARIANTS: Partial<Record<ZombieType, readonly (keyof typeof MODERN_OFFICIAL)[]>> = {
  skinnerWalker: ['skinnerWalker', 'skinnerWalkerParka'],
  berserkerWalker: ['berserkerWalker', 'berserkerWalkerJacket'],
  toxicWalker: TOXIC_WALKER_ART,
  walker: MODERN_WALKER_ART, runner: MODERN_RUNNER_ART, fatty: MODERN_FATTY_ART,
};
const NPC_WALKER_ART = ['npcWalker', 'npcWalkerBishop', 'npcWalkerHeadless'] as const;
type NpcWalkerArt = typeof NPC_WALKER_ART[number];

export type ArtSubject = (typeof TOXIC_WALKER_ART)[number] | (typeof MODERN_FATTY_ART)[number] | (typeof MODERN_RUNNER_ART)[number] | (typeof MODERN_WALKER_ART)[number] | NpcWalkerArt | ZombieType | InvaderXeno | InvaderAbomination | FantasyZombie | FantasyNecromancer | NamedModernAbomination | WesternSubject | 'trejo' | 'spam' | 'spamAbomination' | 'berserkerWalkerJacket' | 'skinnerWalkerParka';

type OfficialArt = {
  source: ImageSourcePropType;
  /** Width over height of the file (a test checks it). */
  ratio: number;
  /** Transparent PNG: can be tinted into a silhouette. */
  cutout?: true;
  /** Fit the figure whole in a `center` panel instead of covering it. */
  whole?: true;
  /** Replaces CUTOUT_ZOOM / CUTOUT_WIDE_ZOOM; 1 keeps the sides of a group. */
  zoom?: number;
  /** Share of the width (0 left, 1 right) brought to the middle of a tall panel the cut-out is wider than (default 0.5). */
  focus?: number;
  /** Cut flat at the waist or knees: stands on the bottom edge of a Modern card. */
  bust?: true;
  /** Widest this figure gets on a Modern card, as a share of the card's width, instead of CARD_FIGURE.width: a wide group runs under the count labels on the right to stand taller. */
  cardWidth?: number;
  /** Left edge of this figure on a Modern card, as a share of the card's width (negative: cut on the left), to bring a wide group's right end into the card. */
  cardLeft?: number;
  /** A picture that covers the whole picture area of a Modern card, cut at the edges (the wall of the SPAM Abomination card), instead of standing in it. */
  fill?: true;
};

const MODERN_BACKDROP = require('../../assets/modern/backgrounds/generic-horde.jpg');

// A subject missing here uses MODERN_ART (cartoon JPEG).
const MODERN_OFFICIAL = {
  nudeOrganist: { source: require('../../assets/modern/abominations/nude-organist-official.png'), ratio: 1.061, cutout: true, whole: true },
  stayPuft: { source: require('../../assets/modern/abominations/stay-puft-official.png'), ratio: 0.914, cutout: true, whole: true },
  gozer: { source: require('../../assets/modern/abominations/gozer-official.png'), ratio: 0.540, cutout: true, whole: true },
  eddieOriginal: { source: require('../../assets/modern/abominations/original-eddie-official.png'), ratio: 0.716, cutout: true, whole: true },
  zuul: { source: require('../../assets/modern/abominations/zuul-official.png'), ratio: 1.117, cutout: true, whole: true },
  vinzClortho: { source: require('../../assets/modern/abominations/vinz-clortho-official.png'), ratio: 1.221, cutout: true, whole: true },
  batmanWhoLaughs: { source: require('../../assets/modern/abominations/batman-who-laughs-official.png'), ratio: 0.748, cutout: true, whole: true },
  loboBatman: { source: require('../../assets/modern/abominations/lobo-batman-official.png'), ratio: 0.845, cutout: true, whole: true },
  batmanEarth11: { source: require('../../assets/modern/abominations/batman-earth-11-official.png'), ratio: 0.726, cutout: true, whole: true },
  batmanEarth52: { source: require('../../assets/modern/abominations/batman-earth-52-official.png'), ratio: 0.631, cutout: true, whole: true },
  batmanEarth12: { source: require('../../assets/modern/abominations/batman-earth-12-official.png'), ratio: 0.644, cutout: true, whole: true },
  batmanEarth44: { source: require('../../assets/modern/abominations/batman-earth-44-official.png'), ratio: 0.621, cutout: true, whole: true },
  batmanEarth1: { source: require('../../assets/modern/abominations/batman-earth-1-official.png'), ratio: 0.881, cutout: true, whole: true },
  batmanEarth32: { source: require('../../assets/modern/abominations/batman-earth-32-official.png'), ratio: 0.49, cutout: true, whole: true },
  theRobins: { source: require('../../assets/modern/abominations/the-robins-official.png'), ratio: 0.908, cutout: true, whole: true },
  hellsGrannies: { source: require('../../assets/modern/abominations/hells-grannies-official.png'), ratio: 0.666, cutout: true, whole: true },
  fishSlappingDancer: { source: require('../../assets/modern/abominations/fish-slapping-dancer-official.png'), ratio: 0.5, cutout: true, whole: true },
  gumbys: { source: require('../../assets/modern/abominations/gumbys-official.png'), ratio: 1.275, cutout: true, whole: true },
  homelander: { source: require('../../assets/modern/abominations/homelander-official.png'), ratio: 0.666, cutout: true, whole: true },
  theDeep: { source: require('../../assets/modern/abominations/the-deep-official.png'), ratio: 0.666, cutout: true, whole: true },
  undeadParrot: { source: require('../../assets/modern/abominations/undead-parrot-official.png'), ratio: 2.832, cutout: true, whole: true },
  theFoot: { source: require('../../assets/modern/abominations/the-foot-official.png'), ratio: 1.374, cutout: true, whole: true },
  toxicWalkerJacket: { source: require('../../assets/modern/zombies/toxic-walker-1-official.png'), ratio: 0.666, cutout: true },
  toxicWalkerSunglasses: { source: require('../../assets/modern/zombies/toxic-walker-2-official.png'), ratio: 0.666, cutout: true },
  fattySecurity: { source: require('../../assets/modern/zombies/fatty-2e-1-official.png'), ratio: 0.856, cutout: true },
  fattyDangerSign: { source: require('../../assets/modern/zombies/fatty-2e-2-official.png'), ratio: 0.750, cutout: true },
  runnerCoat: { source: require('../../assets/modern/zombies/runner-2e-1-official.png'), ratio: 0.666, cutout: true },
  runnerKneePads: { source: require('../../assets/modern/zombies/runner-2e-2-official.png'), ratio: 0.690, cutout: true },
  walkerArgyle: { source: require('../../assets/modern/zombies/walker-2e-1-official.png'), ratio: 0.666, cutout: true },
  walkerSign: { source: require('../../assets/modern/zombies/walker-2e-2-official.png'), ratio: 0.666, cutout: true },
  spam: { source: require('../../assets/modern/zombies/spam-official.png'), ratio: 0.666, cutout: true },
  spamAbomination: { source: require('../../assets/modern/abominations/spam-wall.png'), ratio: 1.333, cutout: true, fill: true },
  trejo: { source: require('../../assets/modern/zombies/trejo-official.png'), ratio: 0.576, cutout: true, whole: true },
  walkerDenim: { source: require('../../assets/modern/zombies/walker-2e-3-official.png'), ratio: 0.666, cutout: true },
  berserkerFatty: { source: require('../../assets/modern/zombies/berserker-fatty-official.png'), ratio: 0.836, cutout: true },
  dog: { source: require('../../assets/modern/zombies/dog-official.png'), ratio: 1.433, cutout: true, whole: true },
  crow: { source: require('../../assets/fantasy/zombies/crowz-official.png'), ratio: 1.486, cutout: true, whole: true },
  vip: { source: require('../../assets/modern/zombies/vip-official.png'), ratio: 0.668, cutout: true },
  eddieKiller: { source: require('../../assets/modern/abominations/killer-eddie-official.png'), ratio: 0.775, cutout: true, bust: true },
  eddieAsylum: { source: require('../../assets/modern/abominations/asylum-eddie-official.png'), ratio: 0.823, cutout: true, focus: 0.62 },
  eddieCyborg: { source: require('../../assets/modern/abominations/cyborg-eddie-official.png'), ratio: 0.988, cutout: true, bust: true },
  eddieMummy: { source: require('../../assets/fantasy/abominations/mummy-eddie-official.png'), ratio: 0.805, cutout: true },
  eddieUndead: { source: require('../../assets/western/abominations/undead-eddie.png'), ratio: 1.4, cutout: true, focus: 0.56 },
  eddieBassist: { source: require('../../assets/invader/abominations/bassist-eddie-abomination-official.png'), ratio: 1.2, cutout: true, focus: 0.46 },
  eddieReaper: { source: require('../../assets/fantasy/necromancers/reaper-eddie-official.png'), ratio: 0.743, cutout: true, focus: 0.6 },
  eddiePharaoh: { source: require('../../assets/fantasy/abominations/pharaoh-eddie-official.png'), ratio: 1.603, cutout: true, whole: true, bust: true },
  eddieWicker: { source: require('../../assets/fantasy/abominations/wicker-man-eddie-official.png'), ratio: 0.616, cutout: true, bust: true },
  eddieFear: { source: require('../../assets/fantasy/abominations/fear-eddie-official.png'), ratio: 1.249, cutout: true, whole: true, bust: true },
  eddieTrooper: { source: require('../../assets/western/abominations/trooper-eddie.png'), ratio: 1.5, cutout: true, whole: true },
  walker: { source: require('../../assets/modern/zombies/walker-2e-2-official.png'), ratio: 0.666, cutout: true },
  fatty: { source: require('../../assets/modern/zombies/fatty-2e-1-official.png'), ratio: 0.856, cutout: true },
  runner: { source: require('../../assets/modern/zombies/runner-2e-2-official.png'), ratio: 0.690, cutout: true },
  abomination: { source: require('../../assets/modern/abominations/abomination-official.png'), ratio: 0.775, cutout: true, whole: true },
  toxicWalker: { source: require('../../assets/modern/zombies/toxic-walker-1-official.png'), ratio: 0.666, cutout: true },
  toxicFatty: { source: require('../../assets/modern/zombies/toxic-fatty-official.png'), ratio: 0.797, cutout: true },
  toxicRunner: { source: require('../../assets/modern/zombies/toxic-runner-official.png'), ratio: 0.589, cutout: true },
  berserkerWalker: { source: require('../../assets/modern/zombies/berserker-walker-official.png'), ratio: 0.486, cutout: true },
  berserkerWalkerJacket: { source: require('../../assets/modern/zombies/berserker-walker-2-official.png'), ratio: 0.441, cutout: true },
  berserkerRunner: { source: require('../../assets/modern/zombies/berserker-runner-official.png'), ratio: 0.750, cutout: true },
  skinnerWalker: { source: require('../../assets/modern/zombies/skinner-walker-official.png'), ratio: 0.579, cutout: true },
  skinnerWalkerParka: { source: require('../../assets/modern/zombies/skinner-walker-2-official.png'), ratio: 0.445, cutout: true },
  skinnerFatty: { source: require('../../assets/modern/zombies/skinner-fatty-official.png'), ratio: 0.866, cutout: true },
  skinnerRunner: { source: require('../../assets/modern/zombies/skinner-runner-official.png'), ratio: 0.445, cutout: true },
  lostZombivor: { source: require('../../assets/modern/zombies/lost-zombivor-official.png'), ratio: 0.568, cutout: true },
  crowley: { source: require('../../assets/modern/abominations/crowley-official.png'), ratio: 0.344, cutout: true, whole: true },
  queenMaeve: { source: require('../../assets/modern/abominations/queen-maeve-official.png'), ratio: 0.800, cutout: true, whole: true },
  aTrain: { source: require('../../assets/modern/abominations/a-train-official.png'), ratio: 0.584, cutout: true, whole: true },
  blackNoir: { source: require('../../assets/modern/abominations/black-noir-official.png'), ratio: 0.769, cutout: true, whole: true },
  soldierBoy: { source: require('../../assets/modern/abominations/soldier-boy-official.png'), ratio: 0.507, cutout: true, whole: true },
  starlight: { source: require('../../assets/modern/abominations/starlight-official.png'), ratio: 0.598, cutout: true, whole: true },
  archangelMichael: { source: require('../../assets/modern/abominations/archangel-michael-official.png'), ratio: 0.631, cutout: true, whole: true },
  wendigo: { source: require('../../assets/modern/abominations/wendigo-official.png'), ratio: 0.649, cutout: true, whole: true },
  leviathan: { source: require('../../assets/modern/abominations/leviathan-official.png'), ratio: 0.812, cutout: true, whole: true },
  alphaVampire: { source: require('../../assets/modern/abominations/alpha-vampire-official.png'), ratio: 0.431, cutout: true, whole: true },
  sillyWalker: { source: require('../../assets/modern/zombies/silly-walker-official.png'), ratio: 0.793, cutout: true, whole: true },
  inquisitor: { source: require('../../assets/modern/zombies/inquisitor-official.png'), ratio: 1.159, cutout: true, whole: true, bust: true, cardWidth: 1.2, cardLeft: -0.12 },
  seeker: { source: require('../../assets/modern/zombies/seeker-official.png'), ratio: 0.666, cutout: true },
  hobomination: { source: require('../../assets/modern/abominations/hobomination-official.png'), ratio: 0.765, cutout: true },
  abominawild: { source: require('../../assets/modern/abominations/abominawild-official.png'), ratio: 0.699, cutout: true },
  abominacop: { source: require('../../assets/modern/abominations/abominacop-official.png'), ratio: 0.931, cutout: true, focus: 0.57 },
  patientZero: { source: require('../../assets/modern/abominations/patient-zero-official.png'), ratio: 0.834, cutout: true },
  abombAbomination: { source: require('../../assets/modern/abominations/abomb-abomination-official.png'), ratio: 0.951, cutout: true },
  berserkerAbomination: { source: require('../../assets/modern/abominations/berserker-abomination-official.png'), ratio: 0.760, cutout: true, whole: true },
  toxicAbomination: { source: require('../../assets/modern/abominations/toxic-abomination-official.png'), ratio: 0.834, cutout: true, whole: true },
  blackDog: { source: require('../../assets/modern/abominations/black-dog-official.png'), ratio: 1.56, cutout: true, whole: true },
  greenwichCrew: { source: require('../../assets/modern/abominations/greenwich-crew-official.png'), ratio: 1.080, cutout: true },
  batabomination: { source: require('../../assets/modern/abominations/batabomination-official.png'), ratio: 1.131, cutout: true, whole: true },
  bigfoot: { source: require('../../assets/modern/abominations/bigfoot-official.png'), ratio: 0.969, cutout: true },
  cthulhu: { source: require('../../assets/modern/abominations/cthulhu-official.png'), ratio: 0.804, cutout: true },
  bearmanboar: { source: require('../../assets/modern/abominations/bearmanboar-official.png'), ratio: 1.056, cutout: true, focus: 0.4 },
  lankyman: { source: require('../../assets/modern/abominations/lankyman-official.png'), ratio: 0.665, cutout: true },
  actualCannibal: { source: require('../../assets/modern/abominations/actual-cannibal-official.png'), ratio: 1.316, cutout: true, whole: true },
  sewerCrocodile: { source: require('../../assets/modern/abominations/sewer-crocodile-official.png'), ratio: 1.159, cutout: true, focus: 0.78 },
  killerClown: { source: require('../../assets/modern/abominations/killer-clown-official.png'), ratio: 1.070, cutout: true },
  chupacabra: { source: require('../../assets/modern/abominations/chupacabra-official.png'), ratio: 1.517, cutout: true, whole: true },
  abductor: { source: require('../../assets/modern/abominations/abductor-official.png'), ratio: 1.028, cutout: true, focus: 0.4 },
} satisfies Partial<Record<ArtSubject, OfficialArt>>;

const MODERN_ART = {
  // Invisible: the generic horde with nobody in front of it, on purpose (the printed card has no figure either).
  translucent: require('../../assets/modern/backgrounds/generic-horde.jpg'),
} satisfies Record<Exclude<ZombieType | 'trejo' | 'spam' | 'spamAbomination' | NamedModernAbomination, keyof typeof MODERN_OFFICIAL>, ImageSourcePropType>;

const SAMURAI_EDDIE_ART = require('../../assets/invader/abominations/samurai-eddie-abomination-official.png');

const FANTASY_ART = {} satisfies Record<Exclude<FantasyZombie | FantasyNecromancer, keyof typeof FANTASY_OFFICIAL>, ImageSourcePropType>;


// Add a line only once its file exists: a `require` of a missing file breaks the bundle.
const FANTASY_OFFICIAL = {
  fumaKotaro: { source: require('../../assets/fantasy/necromancers/fuma-kotaro-official.png'), ratio: 1.374, cutout: true },
  dongZhuo: { source: require('../../assets/fantasy/abominations/dong-zhuo-official.png'), ratio: 0.834, cutout: true },
  gloom: { source: require('../../assets/fantasy/abominations/gloom-official.png'), ratio: 0.931, cutout: true },
  doom: { source: require('../../assets/fantasy/abominations/doom-official.png'), ratio: 0.916, cutout: true },
  shredder: { source: require('../../assets/fantasy/necromancers/shredder-official.png'), ratio: 0.804, cutout: true },
  zhangJiao: { source: require('../../assets/fantasy/necromancers/zhang-jiao-official.png'), ratio: 0.666, cutout: true },
  asura: { source: require('../../assets/fantasy/abominations/asura-official.png'), ratio: 0.656, cutout: true },
  chimimoryo: { source: require('../../assets/fantasy/abominations/chimimoryo-official.png'), ratio: 1.096, cutout: true },
  shakokiDogu: { source: require('../../assets/fantasy/abominations/shakoki-dogu-official.png'), ratio: 0.784, cutout: true },
  sojobo: { source: require('../../assets/fantasy/abominations/sojobo-official.png'), ratio: 1.5, cutout: true },
  takemikazuchi: { source: require('../../assets/fantasy/abominations/takemikazuchi-official.png'), ratio: 1.068, cutout: true },
  redHare: { source: require('../../assets/fantasy/abominations/red-hare-official.png'), ratio: 1.133, cutout: true },
  amaterasu: { source: require('../../assets/fantasy/abominations/amaterasu-wings.png'), ratio: 1.33, cutout: true },
  qilin: { source: require('../../assets/fantasy/abominations/qilin-official.png'), ratio: 0.818, cutout: true },
  mummyEddie: { source: require('../../assets/fantasy/abominations/mummy-eddie-official.png'), ratio: 0.805, cutout: true },
  samuraiEddie: { source: SAMURAI_EDDIE_ART, ratio: 1.2, cutout: true },
  eeWalker: { source: require('../../assets/fantasy/zombies/ee-walker-official.png'), ratio: 0.511, cutout: true },
  eeRunner: { source: require('../../assets/fantasy/zombies/ee-runner-official.png'), ratio: 0.678, cutout: true },
  eeBrute: { source: require('../../assets/fantasy/zombies/ee-brute-official.png'), ratio: 0.75, cutout: true },
  necromanticDragon: { source: require('../../assets/fantasy/abominations/necromantic-dragon-official.png'), ratio: 0.702, cutout: true },
  feralDragon: { source: require('../../assets/fantasy/abominations/feral-dragon-official.png'), ratio: 0.807, cutout: true },
  crowz: { source: require('../../assets/fantasy/zombies/crowz-official.png'), ratio: 1.486, cutout: true },
  // The Divine Beasts card prints the Vermillion Bird, the first beast to spawn.
  divineBeast: { source: require('../../assets/fantasy/abominations/vermillion-bird-official.png'), ratio: 0.744, cutout: true },
  vermillionBird: { source: require('../../assets/fantasy/abominations/vermillion-bird-official.png'), ratio: 0.744, cutout: true },
  whiteTiger: { source: require('../../assets/fantasy/abominations/white-tiger-official.png'), ratio: 1.312, cutout: true },
  blackTortoise: { source: require('../../assets/fantasy/abominations/black-tortoise-official.png'), ratio: 1.259, cutout: true },
  azureDragon: { source: require('../../assets/fantasy/abominations/azure-dragon-official.png'), ratio: 0.952, cutout: true },
  pharaohEddie: { source: require('../../assets/fantasy/abominations/pharaoh-eddie-official.png'), ratio: 1.603, cutout: true },
  fearEddie: { source: require('../../assets/fantasy/abominations/fear-eddie-official.png'), ratio: 1.249, cutout: true },
  reaperEddie: { source: require('../../assets/fantasy/necromancers/reaper-eddie-official.png'), ratio: 0.743, cutout: true },
  shamanEddie: { source: require('../../assets/fantasy/necromancers/shaman-eddie-official.png'), ratio: 1.393, cutout: true },
  wickerManEddie: { source: require('../../assets/fantasy/abominations/wicker-man-eddie-official.png'), ratio: 0.616, cutout: true },
  marike: { source: require('../../assets/fantasy/abominations/marike-official.png'), ratio: 0.503, cutout: true },
  mummRa: { source: require('../../assets/fantasy/necromancers/mumm-ra-official.png'), ratio: 0.92, cutout: true },
  hugBear: { source: require('../../assets/fantasy/abominations/hug-bear-official.png'), ratio: 1.18, cutout: true },
  rocksteady: { source: require('../../assets/fantasy/abominations/rocksteady-official.png'), ratio: 0.696, cutout: true },
  bebop: { source: require('../../assets/fantasy/abominations/bebop-official.png'), ratio: 0.811, cutout: true },
  footNinja: { source: require('../../assets/fantasy/zombies/foot-ninja-official.png'), ratio: 0.644, cutout: true },
  erinn: { source: require('../../assets/fantasy/necromancers/erinn-official.png'), ratio: 0.673, cutout: true },
  lordJanas: { source: require('../../assets/fantasy/abominations/lord-janas-official.png'), ratio: 0.576, cutout: true },
  cerberus: { source: require('../../assets/fantasy/abominations/cerberus-official.png'), ratio: 1.093, cutout: true },
  banshee: { source: require('../../assets/fantasy/abominations/banshee-official.png'), ratio: 0.591, cutout: true },
  queenCaenedra: { source: require('../../assets/fantasy/abominations/queen-caenedra-official.png'), ratio: 0.761, cutout: true },
  horseman: { source: require('../../assets/fantasy/abominations/horseman-official.png'), ratio: 0.629, cutout: true },
  baalberith: { source: require('../../assets/fantasy/abominations/baalberith-official.png'), ratio: 0.888, cutout: true },
  reaper: { source: require('../../assets/fantasy/abominations/reaper-official.png'), ratio: 0.87, cutout: true },
  climber: { source: require('../../assets/fantasy/zombies/climber-official.png'), ratio: 0.622, cutout: true },
  evilTroy: { source: require('../../assets/fantasy/necromancers/evil-troy-official.png'), ratio: 0.855, cutout: true },
  blackheart: { source: require('../../assets/fantasy/necromancers/blackheart-official.png'), ratio: 0.699, cutout: true },
  yukiOnna: { source: require('../../assets/fantasy/necromancers/yuki-onna-official.png'), ratio: 0.625, cutout: true },
  tengu: { source: require('../../assets/fantasy/necromancers/tengu-official.png'), ratio: 0.921, cutout: true },
  kaguya: { source: require('../../assets/fantasy/necromancers/kaguya-official.png'), ratio: 0.759, cutout: true },
  hannya: { source: require('../../assets/fantasy/necromancers/hannya-official.png'), ratio: 0.767, cutout: true },
  bomoh: { source: require('../../assets/fantasy/necromancers/bomoh-official.png'), ratio: 1.042, cutout: true },
  yeti: { source: require('../../assets/fantasy/abominations/yeti-official.png'), ratio: 0.606, cutout: true },
  toyol: { source: require('../../assets/fantasy/abominations/toyol-official.png'), ratio: 0.815, cutout: true },
  susanoWo: { source: require('../../assets/fantasy/abominations/susano-wo-official.png'), ratio: 0.676, cutout: true },
  nian: { source: require('../../assets/fantasy/abominations/nian-official.png'), ratio: 1.237, cutout: true },
  kumiho: { source: require('../../assets/fantasy/abominations/kumiho-official.png'), ratio: 1.188, cutout: true },
  kijin: { source: require('../../assets/fantasy/abominations/kijin-official.png'), ratio: 1.211, cutout: true },
  hachiman: { source: require('../../assets/fantasy/abominations/hachiman-official.png'), ratio: 0.698, cutout: true },
  bishamon: { source: require('../../assets/fantasy/abominations/bishamon-official.png'), ratio: 0.694, cutout: true },
  deathNotes: { source: require('../../assets/fantasy/necromancers/death-notes-official.png'), ratio: 0.864, cutout: true },
  fantasyBerserkerWalker: { source: require('../../assets/fantasy/zombies/fantasy-berserker-walker-official.png'), ratio: 0.539, cutout: true },
  grandVizier: { source: require('../../assets/fantasy/necromancers/grand-vizier-official.png'), ratio: 0.855, cutout: true },
  theSparrow: { source: require('../../assets/fantasy/necromancers/the-sparrow-official.png'), ratio: 0.51, cutout: true },
  npcWalker: { source: require('../../assets/fantasy/zombies/npc-walker-snow-white-official.png'), ratio: 0.735, cutout: true },
  npcWalkerBishop: { source: require('../../assets/fantasy/zombies/npc-walker-bishop-official.png'), ratio: 0.628, cutout: true },
  npcWalkerHeadless: { source: require('../../assets/fantasy/zombies/npc-walker-headless-official.png'), ratio: 0.831, cutout: true },
  ablobination: { source: require('../../assets/fantasy/abominations/ablobination-official.png'), ratio: 0.935, cutout: true },
  abominabunny: { source: require('../../assets/fantasy/abominations/abominabunny-official.png'), ratio: 1.154, cutout: true },
  abominalpha: { source: require('../../assets/fantasy/abominations/abominalpha-official.png'), ratio: 0.766, cutout: true },
  abominarat: { source: require('../../assets/fantasy/abominations/abominarat-official.png'), ratio: 0.94, cutout: true },
  abominatroll: { source: require('../../assets/fantasy/abominations/abominatroll-official.png'), ratio: 0.763, cutout: true },
  abominotaur: { source: require('../../assets/fantasy/abominations/abominotaur-official.png'), ratio: 0.571, cutout: true },
  chromatiz: { source: require('../../assets/fantasy/abominations/chromatiz-official.png'), ratio: 0.686, cutout: true },
  fantasyAbomination: { source: require('../../assets/fantasy/abominations/fantasy-abomination-official.png'), ratio: 0.613, cutout: true },
  godEaterAbomination: { source: require('../../assets/fantasy/abominations/god-eater-abomination-official.png'), ratio: 0.831, cutout: true },
  gorgomination: { source: require('../../assets/fantasy/abominations/gorgomination-official.png'), ratio: 1.042, cutout: true },
  hordeBrother: { source: require('../../assets/fantasy/abominations/horde-brother-official.png'), ratio: 0.642, cutout: true },
  khanAbomination: { source: require('../../assets/fantasy/abominations/khan-abomination-official.png'), ratio: 1.035, cutout: true },
  magentaCovfefe: { source: require('../../assets/fantasy/abominations/magenta-covfefe-official.png'), ratio: 0.69, cutout: true },
  orcAbomination: { source: require('../../assets/fantasy/abominations/orc-abomination-official.png'), ratio: 0.807, cutout: true },
  siegeBreaker: { source: require('../../assets/fantasy/abominations/siege-breaker-official.png'), ratio: 1.14, cutout: true },
  swampLurker: { source: require('../../assets/fantasy/abominations/swamp-lurker-official.png'), ratio: 0.914, cutout: true },
  swampTroll: { source: require('../../assets/fantasy/abominations/swamp-troll-official.png'), ratio: 0.977, cutout: true },
  taintedAbomination: { source: require('../../assets/fantasy/abominations/tainted-abomination-official.png'), ratio: 0.926, cutout: true },
  vaultWarden: { source: require('../../assets/fantasy/abominations/vault-warden-official.png'), ratio: 0.637, cutout: true },
  werezombie: { source: require('../../assets/fantasy/abominations/werezombie-official.png'), ratio: 1.114, cutout: true },
  wolfbomination: { source: require('../../assets/fantasy/abominations/wolfbomination-official.png'), ratio: 1.058, cutout: true },
  zombieGiant: { source: require('../../assets/fantasy/abominations/zombie-giant-official.png'), ratio: 0.77, cutout: true },
  countTemeraire: { source: require('../../assets/fantasy/necromancers/count-temeraire-official.png'), ratio: 0.785, cutout: true },
  defilerNecromancer: { source: require('../../assets/fantasy/necromancers/defiler-necromancer-official.png'), ratio: 0.617, cutout: true },
  erikSummoner: { source: require('../../assets/fantasy/necromancers/erik-summoner-official.png'), ratio: 0.793, cutout: true },
  faolan: { source: require('../../assets/fantasy/necromancers/faolan-official.png'), ratio: 0.699, cutout: true },
  grin: { source: require('../../assets/fantasy/necromancers/grin-official.png'), ratio: 0.799, cutout: true },
  innsmouth: { source: require('../../assets/fantasy/necromancers/innsmouth-official.png'), ratio: 0.523, cutout: true },
  lordOfSkulls: { source: require('../../assets/fantasy/necromancers/lord-of-skulls-official.png'), ratio: 0.585, cutout: true },
  necromancer: { source: require('../../assets/fantasy/necromancers/necromancer-official.png'), ratio: 0.731, cutout: true },
  orcNecromancer: { source: require('../../assets/fantasy/necromancers/orc-necromancer-official.png'), ratio: 0.734, cutout: true },
  ostokar: { source: require('../../assets/fantasy/necromancers/ostokar-official.png'), ratio: 0.775, cutout: true },
  queenMedea: { source: require('../../assets/fantasy/necromancers/queen-medea-official.png'), ratio: 0.388, cutout: true },
  queenSevera: { source: require('../../assets/fantasy/necromancers/queen-severa-official.png'), ratio: 0.765, cutout: true },
  ratKing: { source: require('../../assets/fantasy/necromancers/rat-king-official.png'), ratio: 0.686, cutout: true },
  toMeKuPa: { source: require('../../assets/fantasy/necromancers/to-me-ku-pa-official.png'), ratio: 0.779, cutout: true },
  deadboltWalker: { source: require('../../assets/fantasy/zombies/deadbolt-walker-official.png'), ratio: 0.5, cutout: true },
  deadeyeWalker: { source: require('../../assets/fantasy/zombies/deadeye-walker-official.png'), ratio: 0.888, cutout: true },
  fantasyFatty: { source: require('../../assets/fantasy/zombies/fantasy-fatty-official.png'), ratio: 0.672, cutout: true },
  fantasyRunner: { source: require('../../assets/fantasy/zombies/fantasy-runner-official.png'), ratio: 0.59, cutout: true },
  fantasyWalker: { source: require('../../assets/fantasy/zombies/fantasy-walker-official.png'), ratio: 0.474, cutout: true },
  fattyBurster: { source: require('../../assets/fantasy/zombies/fatty-burster-official.png'), ratio: 0.985, cutout: true },
  orcFatty: { source: require('../../assets/fantasy/zombies/orc-fatty-official.png'), ratio: 0.884, cutout: true },
  orcRunner: { source: require('../../assets/fantasy/zombies/orc-runner-official.png'), ratio: 0.725, cutout: true },
  orcWalker: { source: require('../../assets/fantasy/zombies/orc-walker-official.png'), ratio: 0.639, cutout: true },
  ratz: { source: require('../../assets/fantasy/zombies/ratz-official.png'), ratio: 0.972, cutout: true },
  spectralWalker: { source: require('../../assets/fantasy/zombies/spectral-walker-official.png'), ratio: 0.689, cutout: true },
  taintedWalker: { source: require('../../assets/fantasy/zombies/tainted-walker-official.png'), ratio: 0.805, cutout: true },
  terrorcottaWalker: { source: require('../../assets/fantasy/zombies/terrorcotta-walker-official.png'), ratio: 0.475, cutout: true },
  wdBrute: { source: require('../../assets/fantasy/zombies/wd-brute-official.png'), ratio: 0.659, cutout: true },
  wdRunner: { source: require('../../assets/fantasy/zombies/wd-runner-official.png'), ratio: 0.724, cutout: true },
  wdWalker: { source: require('../../assets/fantasy/zombies/wd-walker-official.png'), ratio: 0.452, cutout: true },
  wolfz: { source: require('../../assets/fantasy/zombies/wolfz-official.png'), ratio: 1.335, cutout: true },
  // Stand-in: only named in a card footer, never drawn.
  wardenBrute: { source: require('../../assets/fantasy/zombies/fantasy-fatty-official.png'), ratio: 0.672, cutout: true },
} satisfies Partial<Record<FantasyZombie | FantasyNecromancer | NpcWalkerArt, OfficialArt>>;

export function npcWalkerArt(cardId: string): NpcWalkerArt {
  const number = Number(cardId.match(/\d+$/)?.[0] ?? 0);
  return NPC_WALKER_ART[number % NPC_WALKER_ART.length];
}

const OFFICIAL: Partial<Record<ArtSubject, OfficialArt>> = { ...FANTASY_OFFICIAL, ...MODERN_OFFICIAL };
const officialOf = (subject: ArtSubject): OfficialArt | undefined => OFFICIAL[subject];

const SILHOUETTE_OPACITY = 0.5;

// Extracted from the larger card illustrations in the CMON pack previews.
const INVADER_EDDIE_ART = {
  cyborgEddieAbomination: require('../../assets/invader/abominations/cyborg-eddie-abomination-official.png'),
  samuraiEddieAbomination: SAMURAI_EDDIE_ART,
  bassistEddieAbomination: require('../../assets/invader/abominations/bassist-eddie-abomination-official.png'),
  bountyHunterEddieAbomination: require('../../assets/invader/abominations/bounty-hunter-eddie-abomination-official.png'),
} satisfies Partial<Record<InvaderAbomination, ImageSourcePropType>>;

// zombicide.com Xeno renders (cut inside their frame, logo rubbed out), or the printed card's art where the site has none.
const INVADER_XENO_ART = {
  biter: require('../../assets/invader/zombies/biter-official.png'), // restored from the French printed card
  worker: require('../../assets/invader/zombies/xeno-worker-official.jpg'),
  tank: require('../../assets/invader/zombies/xeno-tank-official.jpg'),
  hunter: require('../../assets/invader/zombies/xeno-hunter-official.jpg'),
  drillerWorker: require('../../assets/invader/zombies/driller-worker-official.jpg'),
  drillerTank: require('../../assets/invader/zombies/driller-tank-official.jpg'),
  drillerHunter: require('../../assets/invader/zombies/driller-hunter-official.jpg'),
  drillerBlitzer: require('../../assets/invader/zombies/driller-blitzer-official.jpg'),
  flinger: require('../../assets/invader/zombies/flinger-official.jpg'),
  seekerWorker: require('../../assets/invader/zombies/seeker-worker-official.jpg'), // cut from the printed card
  xenomoth: require('../../assets/invader/zombies/xenomoth-official.jpg'), // cut from the printed card
} satisfies Partial<Record<InvaderXeno, ImageSourcePropType>>;

const STEPMOTHER_ART = require('../../assets/invader/abominations/stepmother-abomination-official.png');

const INVADER_ABOMINATION_ART = {
  ...INVADER_EDDIE_ART,
  spoilerAbomination: require('../../assets/invader/abominations/spoiler-abomination-official.jpg'),
  drillerAbomination: require('../../assets/invader/abominations/driller-abomination-official.jpg'),
  juggernaut: require('../../assets/invader/abominations/juggernaut-abomination-official.jpg'),
  babyface: require('../../assets/invader/abominations/babyface-abomination-official.jpg'),
  buddyBot: require('../../assets/invader/abominations/buddybot-abomination-official.jpg'),
  irisSentryGun: require('../../assets/invader/abominations/iris-sentry-gun-abomination-official.jpg'),
  motherInLaw: require('../../assets/invader/abominations/mother-in-law-abomination-official.jpg'),
  shadow: require('../../assets/invader/abominations/shadow-abomination-official.jpg'),
  stomper: require('../../assets/invader/abominations/stomper-abomination-official.jpg'),
  widowmaker: require('../../assets/invader/abominations/widowmaker-abomination-official.jpg'),
  broodMother: require('../../assets/invader/abominations/brood-mother-abomination-official.jpg'),
  xeniumHorror: require('../../assets/invader/abominations/xenium-horror-abomination-official.jpg'),
  thraex: require('../../assets/invader/abominations/thraex-abomination-official.jpg'), // cut from the printed card
  gutslug: require('../../assets/invader/abominations/gutslug-abomination-official.jpg'), // cut from the printed card
  stepmother: STEPMOTHER_ART,
  shaila: require('../../assets/invader/abominations/shaila-abomination-official.jpg'), // cut from the printed card
  synkrasis: require('../../assets/invader/abominations/synkrasis-official.jpg'), // cut from the printed card
  dimbutcher: require('../../assets/invader/abominations/dimbutcher-abomination-official.jpg'), // cut from the printed card
} satisfies Partial<Record<InvaderAbomination, ImageSourcePropType>>;

const INVADER_OFFICIAL: Partial<Record<ArtSubject, ImageSourcePropType>> = { ...INVADER_XENO_ART, ...INVADER_ABOMINATION_ART };

// Abomination windows and Eddie canvases are about 6:5.
const INVADER_ABOMINATION_RATIO = 6 / 5;

// Pictures cut from a printed card (840 x 700) are sharp in their top 63 % and blurred dark red below, meant to sit behind
// the rule box: `scale` them and move them `down` until the sharp edge falls behind the box.
const INVADER_BLURRED_FILL: Partial<Record<ArtSubject, { scale: number; down: `${number}%` }>> = {
  shaila: { scale: 1.15, down: '5%' },
  dimbutcher: { scale: 1.15, down: '5%' },
};

const INVADER_ART: Record<InvaderXeno | InvaderAbomination, ImageSourcePropType> = {
  ...INVADER_XENO_ART,
  ...INVADER_ABOMINATION_ART,
};

const WESTERN_HEROES: Record<Exclude<WesternSubject, WesternAbomination>, ImageSourcePropType> = {
  westernWalker: require('../../assets/western/zombies/walker-hero.jpg'),
  westernRunner: require('../../assets/western/zombies/runner-hero.jpg'),
  westernBrute: require('../../assets/western/zombies/brute-hero.jpg'),
};

const ART: Partial<Record<Exclude<ArtSubject, WesternAbomination>, ImageSourcePropType>> = { ...MODERN_ART, ...FANTASY_ART, ...INVADER_ART, ...WESTERN_HEROES };

// Scans of the printed cards (Tabletop Simulator mod) cut to 63:88, with title, number, footer and rule rubbed out. Cards with the same art share a file.
const WESTERN_CARD_ART = {
  walkerMan: require('../../assets/western/zombies/walker-man-card.jpg'),
  walkerWoman: require('../../assets/western/zombies/walker-woman-card.jpg'),
  bruteRed: require('../../assets/western/zombies/brute-red-card.jpg'),
  bruteWhite: require('../../assets/western/zombies/brute-white-card.jpg'),
  runner: require('../../assets/western/zombies/runner-card.jpg'),
  longDead: require('../../assets/western/zombies/long-dead-card.jpg'),
  extraWalker: require('../../assets/western/zombies/extra-walker-card.jpg'),
  extraBrute: require('../../assets/western/zombies/extra-brute-card.jpg'),
  extraRunner: require('../../assets/western/zombies/extra-runner-card.jpg'),
  abomination: require('../../assets/western/zombies/abomination-text-card.jpg'),
} satisfies Record<string, ImageSourcePropType>;

// The printed deck alternates two pictures in pairs of cards (#001-#002 man, #003-#004 woman, ...); the cycle restarts every 16th card.
export const westernCardArt = (card: WesternCard): ImageSourcePropType => {
  const first = Math.floor((Number(card.id.slice(-3)) - 1) / 2) % 2 === 0;
  switch (card.kind) {
    case 'westernAbomination':
      return WESTERN_CARD_ART.abomination;
    case 'westernExtra':
      return { westernWalker: WESTERN_CARD_ART.extraWalker, westernBrute: WESTERN_CARD_ART.extraBrute, westernRunner: WESTERN_CARD_ART.extraRunner }[card.zombie];
    case 'westernSpawn':
      switch (card.zombie) {
        case 'westernWalker':
          return first ? WESTERN_CARD_ART.walkerMan : WESTERN_CARD_ART.walkerWoman;
        case 'westernBrute':
          return first ? WESTERN_CARD_ART.bruteRed : WESTERN_CARD_ART.bruteWhite;
        case 'westernRunner':
          return WESTERN_CARD_ART.runner;
        case 'longDeadWalker':
          return WESTERN_CARD_ART.longDead;
      }
  }
};

export const westernWhiteBruteArt = WESTERN_CARD_ART.bruteWhite;
export const WESTERN_BACKDROP = require('../../assets/western/backgrounds/dusty-town-backdrop.jpg');

// `ratio` is the window's width over height, between 1.25 and 1.75 (the printed window follows the rule's length); `center` is the vertical point brought to the middle.
const WESTERN_WINDOWS: Record<WesternAbomination, { source: ImageSourcePropType; ratio: number; center: number; cutout?: true; cutoutAspectRatio?: number; cutoutZoom?: number }> = {
  bowlerHat: { source: require('../../assets/western/abominations/bowler-hat-card.jpg'), ratio: 1.25, center: 0.38 },
  nightmareHorse: { source: require('../../assets/western/abominations/nightmare-horse-card.jpg'), ratio: 1.25, center: 0.4 },
  abominape: { source: require('../../assets/western/abominations/abominape-card.jpg'), ratio: 1.463, center: 0.45 },
  crocosaur: { source: require('../../assets/western/abominations/crocosaur-card.jpg'), ratio: 1.456, center: 0.5 },
  abominabear: { source: require('../../assets/western/abominations/abominabear-card.jpg'), ratio: 1.25, center: 0.45 },
  texasDeadhorn: { source: require('../../assets/western/abominations/texas-deadhorn-card.jpg'), ratio: 1.25, center: 0.45 },
  bizon: { source: require('../../assets/western/abominations/bizon-card.jpg'), ratio: 1.25, center: 0.46 },
  bloodBull: { source: require('../../assets/western/abominations/blood-bull-card.jpg'), ratio: 1.25, center: 0.32 },
  littleTrickster: { source: require('../../assets/western/abominations/little-trickster-card.jpg'), ratio: 1.565, center: 0.42 },
  goreGeyser: { source: require('../../assets/western/abominations/gore-geyser-card.jpg'), ratio: 1.75, center: 0.4 },
  meltingPot: { source: require('../../assets/western/abominations/melting-pot-card.jpg'), ratio: 1.548, center: 0.43 },
  plymouthHound: { source: require('../../assets/western/abominations/plymouth-hound-card.jpg'), ratio: 1.628, center: 0.42 },
  pusbag: { source: require('../../assets/western/abominations/pusbag-card.jpg'), ratio: 1.524, center: 0.37 },
  greatTrickster: { source: require('../../assets/western/abominations/great-trickster-card.jpg'), ratio: 1.75, center: 0.38 },
  cactusQueen: { source: require('../../assets/western/abominations/cactus-queen-card.jpg'), ratio: 1.438, center: 0.45 },
  alphaBane: { source: require('../../assets/western/abominations/alpha-bane-card.jpg'), ratio: 1.25, center: 0.5 },
  deathgrasp: { source: require('../../assets/western/abominations/deathgrasp-card.jpg'), ratio: 1.524, center: 0.37 },
  fatMace: { source: require('../../assets/western/abominations/fat-mace-card.jpg'), ratio: 1.25, center: 0.38 },
  swampTongue: { source: require('../../assets/western/abominations/swamp-tongue-card.jpg'), ratio: 1.524, center: 0.44 },
  rottenClaw: { source: require('../../assets/western/abominations/rotten-claw-card.jpg'), ratio: 1.602, center: 0.43 },
  westernWendigo: { source: require('../../assets/western/abominations/wendigo-card.jpg'), ratio: 1.317, center: 0.4 },
  steamMonster: { source: require('../../assets/western/abominations/steam-monster-card.jpg'), ratio: 1.448, center: 0.4 },
  westernUndeadEddie: { source: require('../../assets/western/abominations/undead-eddie.png'), ratio: 1.4, center: 0.5, cutout: true },
  westernTrooperEddie: { source: require('../../assets/western/abominations/trooper-eddie.png'), ratio: 1.4, center: 0.5, cutout: true, cutoutZoom: 1.3 },
  westernShamanEddie: { source: require('../../assets/western/abominations/shaman-eddie.png'), ratio: 1.4, center: 0.5, cutout: true },
  westernAsylumEddie: { source: require('../../assets/western/abominations/asylum-eddie.png'), ratio: 1.25, center: 0.5, cutout: true },
  westernBountyHunterEddie: { source: INVADER_EDDIE_ART.bountyHunterEddieAbomination, ratio: 1.4, center: 0.5, cutout: true },
  westernFearEddie: { source: require('../../assets/western/abominations/fear-eddie.png'), ratio: 1.25, center: 0.5, cutout: true, cutoutAspectRatio: 840 / 672 },
  westernWickerEddie: { source: require('../../assets/western/abominations/wicker-eddie.png'), ratio: 1.4, center: 0.5, cutout: true },
};
export const westernTextCardArt = WESTERN_CARD_ART.abomination;
export const westernWindow = (boss: WesternAbomination) => WESTERN_WINDOWS[boss];
const isWesternBoss = (subject: ArtSubject): subject is WesternAbomination => subject in WESTERN_WINDOWS;

export function artSubject(card: ModernCard): ArtSubject {
  if (card.kind === 'trejo' || card.kind === 'trejoRush') return 'trejo';
  if (card.kind === 'spam') return 'spam';
  const variants = MODERN_VARIANTS[card.zombie];
  return variants ? variantFor(card, variants) : card.zombie;
}

// Modern drawings are 576 x 1280, stretched a hair taller on a card.
const ART_RATIO = 2.25;
// Fantasy illustrations are 640 x 1280.
const FIGURE_RATIO = 2;
// Only `center` cut-outs are enlarged, from the top so no head is cut. `upper` ones are trimmed to their margins already:
// 1.18 would cut 8.5 % off each side.
const CUTOUT_ZOOM = 1.18;
/** Width over height above which a cut-out is landscape. */
const WIDE_RATIO = 1;
const CUTOUT_WIDE_ZOOM = 1.08;
const DRAWN_ZOOM = 1.12;
const INVADER_XENO_ZOOM = 1.12;
/** Used when `INVADER_BLURRED_FILL` sets no scale. */
const INVADER_ABOMINATION_ZOOM = 1.1;
/** Share of the window width a drawn illustration overflows on each side, to hide its torn border. */
const FILL_BLEED = 0.06;
const CARD_RATIO = 88 / 63;
// Modern `anchor="card"` figure, as shares of the card's width (x) and height (y): left of the count labels, never cropped.
const CARD_FIGURE = {
  /** Top of the head; the banner's slanted edge is at 23 % on the left and 19.5 % on the right. */
  top: 0.225,
  /** Feet may run this far under the card's bottom edge, as printed. */
  feetBleed: 0.03,
  /** Widest a figure gets, the count labels overlap its right side. */
  width: 0.92,
  /** Same, with the current Danger Level shown alone. */
  widthLarger: 1,
  /** Height factor with the current Danger Level shown alone, head kept in place. */
  largerZoom: 1.12,
  /** Where the middle of a figure narrower than its room stands. */
  centerX: 0.29, // clear of the count labels
};
// A Modern drawing is wider than the card so its printed border falls outside; `border` (share of its height) is tucked under the banner.
const CARD_DRAWING = { oversize: 1.14, border: 0.035, top: 0.19 };
/** `reserve`: share of the height covered at the bottom by a footer or text panel. */
export type CardFrame = { reserve?: number; larger?: boolean };
/** Share of the illustration above the head (border and halo) left out. */
const UPPER_OFFSET = 0.1;
/** Illustrations whose head is close to the top edge: the default offset would cut it. */
const HIGH_HEADS: readonly ArtSubject[] = [
  'abominalpha', 'abominarat', 'toMeKuPa', 'blackheart', 'ostokar', 'evilTroy', 'queenMedea', 'grin', 'erikSummoner',
  'innsmouth', 'faolan', 'lordOfSkulls', 'spectralWalker', 'ratz', 'ratKing', 'swampTroll', 'necromanticDragon',
  'wdWalker', 'wdRunner', 'wdBrute', 'khanAbomination', 'defilerNecromancer', 'eeWalker', 'eeRunner', 'eeBrute',
  'godEaterAbomination', 'amaterasu', 'asura', 'bishamon', 'chimimoryo', 'hachiman', 'kijin', 'kumiho', 'nian', 'qilin',
  'redHare', 'shakokiDogu', 'sojobo', 'susanoWo', 'takemikazuchi', 'yeti', 'bomoh', 'deathNotes', 'hannya',
  'kaguya', 'tengu', 'yukiOnna', 'fantasyBerserkerWalker', 'deadboltWalker', 'terrorcottaWalker', 'climber',
  'divineBeast', 'vermillionBird', 'whiteTiger', 'blackTortoise', 'azureDragon', 'reaper', 'baalberith', 'horseman', 'queenCaenedra', 'hugBear', 'banshee', 'cerberus', 'lordJanas', 'marike',
  'erinn', 'grandVizier', 'theSparrow', 'dongZhuo', 'zhangJiao', 'fumaKotaro',
  'pharaohEddie', 'samuraiEddie', 'mummyEddie', 'wickerManEddie', 'fearEddie', 'reaperEddie', 'shamanEddie',
  'bebop', 'rocksteady', 'mummRa', 'footNinja',
];
/** Per-subject override of UPPER_OFFSET, where the head sits higher or lower than usual. */
const UPPER_OFFSETS: Partial<Record<ArtSubject, number>> = {
  ...Object.fromEntries(HIGH_HEADS.map((subject) => [subject, 0.03])),
  zombieGiant: 0.03,
  mummyEddie: 0,
  toyol: 0.12,
  abominabunny: 0.04,
  chromatiz: 0.04,
  ablobination: 0.15,
  swampLurker: 0.18,
  magentaCovfefe: 0.18,
};

function cardCutoutLayout(art: OfficialArt, box: { width: number; height: number }, frame: CardFrame) {
  const reserve = frame.reserve ?? 0;
  const top = CARD_FIGURE.top * box.height;
  const bottom = box.height * (1 - reserve + (reserve > 0 ? 0 : CARD_FIGURE.feetBleed));
  const room = bottom - top;
  if (art.fill) {
    // Covers the room under the banner: the full width, or taller still if the room is higher; the banner and the text panel cut it.
    const height = Math.max(room, box.width / art.ratio);
    const width = height * art.ratio;
    return { width, height, left: (box.width - width) / 2, top: top + (room - height) / 2 };
  }
  const maxWidth = box.width * Math.max(art.cardWidth ?? 0, frame.larger ? CARD_FIGURE.widthLarger : CARD_FIGURE.width);
  const height = Math.min(room * (frame.larger ? CARD_FIGURE.largerZoom : 1), maxWidth / art.ratio);
  const width = height * art.ratio;
  return {
    width,
    height,
    left: art.cardLeft !== undefined ? box.width * art.cardLeft : Math.max(0, Math.min(box.width - width, box.width * CARD_FIGURE.centerX - width / 2)),
    // A figure that fills its width before its height (a wide group, a beast) is centred in the room it has; one cut flat stands on its bottom.
    top: height < room ? top + (room - height) / (art.bust ? 1 : 2) : top,
  };
}

// Framed from the top so the head stays in view: `center` covers a tall panel (`whole` fits it), `upper` takes the full width of a wide one.
function Cutout({ art, anchor, silhouette, zoomed, frame }: { art: OfficialArt; anchor: string; silhouette?: boolean; zoomed: boolean; frame?: CardFrame }) {
  const [box, setBox] = useState({ width: 0, height: 0 });
  const tint = silhouette ? { tintColor: FANTASY_COLORS.silhouette, opacity: SILHOUETTE_OPACITY } : undefined;
  if (anchor === 'full') return <Image source={art.source} style={[styles.fullFigure, tint]} resizeMode="contain" />;
  let layout;
  if (box.width > 0 && box.height > 0 && anchor === 'card') {
    layout = cardCutoutLayout(art, box, frame ?? {});
  } else if (box.width > 0 && box.height > 0) {
    const byWidth = box.width / art.ratio;
    const zoom = zoomed && anchor === 'center' && !art.whole ? (art.zoom ?? (art.ratio > WIDE_RATIO ? CUTOUT_WIDE_ZOOM : CUTOUT_ZOOM)) : 1;
    const fit = anchor === 'center' && art.whole ? 'whole' : anchor;
    const height = (fit === 'center' ? Math.max(byWidth, box.height) : fit === 'whole' ? Math.min(byWidth, box.height) : byWidth) * zoom;
    const width = height * art.ratio;
    // Slides a too-wide cut-out so `focus` sits in the middle without a gap on either side.
    const left = fit === 'center' && width > box.width ? Math.min(0, Math.max(box.width - width, box.width / 2 - (art.focus ?? 0.5) * width)) : (box.width - width) / 2;
    layout = { width, height, left, top: fit !== 'center' && height < box.height ? (box.height - height) / 2 : 0 };
  }
  return (
    <View style={[StyleSheet.absoluteFill, art.fill && { overflow: 'hidden' }]} onLayout={(event) => setBox(event.nativeEvent.layout)}>
      {layout && <Image source={art.source} style={[{ position: 'absolute' }, layout, tint]} resizeMode="stretch" />}
    </View>
  );
}

export function ZombieFigure({
  subject,
  anchor = 'center',
  silhouette,
  backdrop,
  plain,
  frame,
}: {
  subject: ArtSubject;
  anchor?: 'center' | 'upper' | 'full' | 'fill' | 'whole' | 'card';
  /** Faded stamp for a Danger Level row: a cut-out is tinted, a drawing keeps its colours. */
  silhouette?: boolean;
  /** Lay a Fantasy cut-out on the Fantasy backdrop (carousel, menu). */
  backdrop?: boolean;
  /** No enlargement (carousel, menu). */
  plain?: boolean;
  frame?: CardFrame;
}) {
  const [width, setWidth] = useState(0);
  const official = officialOf(subject);
  const drawnZoom = plain ? 1 : DRAWN_ZOOM;
  // A drawing has a border to crop, so it cannot be `whole`.
  if (anchor === 'whole' && !official?.cutout) anchor = 'center';
  const source = official?.source ?? (isWesternBoss(subject) ? WESTERN_WINDOWS[subject].source : ART[subject]);
  if (official?.cutout) {
    const cutout = <Cutout art={official} anchor={anchor} silhouette={silhouette} zoomed={!plain} frame={frame} />;
    // Modern cut-outs always lie on the generic horde, except as silhouettes.
    const behind = silhouette ? undefined : subject in MODERN_OFFICIAL ? MODERN_BACKDROP : backdrop ? FANTASY_PARTS.artBackground : undefined;
    if (!behind) return cutout;
    return (
      <>
        <Image source={behind} style={styles.fullFigure} resizeMode="cover" />
        {cutout}
      </>
    );
  }
  if (subject === 'translucent') return <Image source={source} style={styles.fullFigure} resizeMode="cover" />;
  if (anchor === 'card') {
    const scaled = width * CARD_DRAWING.oversize;
    const top = CARD_DRAWING.top * width * CARD_RATIO - CARD_DRAWING.border * scaled * ART_RATIO;
    return (
      <View style={StyleSheet.absoluteFill} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        {width > 0 && (
          <Image source={source} style={{ position: 'absolute', top, left: (width - scaled) / 2, width: scaled, height: scaled * ART_RATIO }} />
        )}
      </View>
    );
  }
  if ((isWesternBoss(subject) || subject in WESTERN_HEROES) && anchor !== 'full') return <Image source={source} style={styles.fullFigure} resizeMode="cover" />;
  // Invader pictures are framed renders, not cut-outs.
  if (subject in INVADER_OFFICIAL && anchor !== 'full' && anchor !== 'fill') return <Image source={source} style={styles.fullFigure} resizeMode="cover" />;
  if (anchor === 'fill') {
    const official = INVADER_OFFICIAL[subject];
    if (official) {
      // A landscape Abomination hangs from the top over the red backdrop; a portrait Xeno covers the window.
      if (subject in INVADER_ABOMINATION_ART) {
        const fit = INVADER_BLURRED_FILL[subject];
        const wide = fit?.scale ?? INVADER_ABOMINATION_ZOOM;
        return (
          <Image
            source={official}
            style={[styles.topFigure, { aspectRatio: INVADER_ABOMINATION_RATIO, width: `${wide * 100}%`, left: `${((1 - wide) / 2) * 100}%`, top: fit?.down ?? 0 }]}
            resizeMode="cover"
          />
        );
      }
      return <Image source={official} style={[styles.fullFigure, { transform: [{ scale: INVADER_XENO_ZOOM }], transformOrigin: 'center top' }]} resizeMode="cover" />;
    }
    return (
      <View style={StyleSheet.absoluteFill} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        {width > 0 && (
          <Image
            source={source}
            style={{ position: 'absolute', top: -width * FIGURE_RATIO * (UPPER_OFFSETS[subject] ?? UPPER_OFFSET), left: -width * FILL_BLEED, width: width * (1 + 2 * FILL_BLEED), height: width * (1 + 2 * FILL_BLEED) * FIGURE_RATIO }}
          />
        )}
      </View>
    );
  }

  if (anchor === 'full') return <Image source={source} style={styles.fullFigure} resizeMode="contain" />;
  if (anchor === 'center') return <Image source={source} style={[styles.figure, !plain && { transform: [{ scale: drawnZoom }], transformOrigin: 'center top' }]} resizeMode="cover" />;
  return (
    <View style={StyleSheet.absoluteFill} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {width > 0 && (
        <Image
          source={source}
          style={{ position: 'absolute', top: -width * drawnZoom * FIGURE_RATIO * (UPPER_OFFSETS[subject] ?? UPPER_OFFSET), left: (-width * (drawnZoom - 1)) / 2, width: width * drawnZoom, height: width * drawnZoom * FIGURE_RATIO }}
        />
      )}
    </View>
  );
}

// `figure` overflows its panel so the printed cream border is trimmed.
const styles = StyleSheet.create({
  fullFigure: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  topFigure: { position: 'absolute', top: 0, left: 0, width: '100%', height: 'auto' },
  figure: { position: 'absolute', top: '-2%', left: '-4%', width: '108%', height: '104%' },
});
