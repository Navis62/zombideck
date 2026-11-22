import { useState } from 'react';
import { Image, type ImageSourcePropType, StyleSheet, View } from 'react-native';

import { FANTASY_PARTS } from '@/components/fantasy-parts';
import { variantFor } from '@/data/card-number';
import { FANTASY_COLORS } from '@/theme';
import type { FantasyNecromancer, FantasyZombie, InvaderAbomination, InvaderXeno, ModernCard, NamedModernAbomination, WesternAbomination, WesternCard, WesternZombie, ZombieType } from '@/game/types';

/**
 * The Western zombies that stand alone (menu and carousel; on the cards they come with the whole printed card, see
 * `westernCardArt`) and the named Abominations (their picture is the window of their card, see `westernWindow`).
 */
export type WesternSubject = Exclude<WesternZombie, 'longDeadWalker'> | WesternAbomination;
const MODERN_RUNNER_ART = ['runnerCoat', 'runnerKneePads'] as const;
const MODERN_WALKER_ART = ['walkerArgyle', 'walkerSign', 'walkerDenim'] as const;
const MODERN_FATTY_ART = ['fattySecurity', 'fattyDangerSign'] as const;
const TOXIC_WALKER_ART = ['toxicWalkerJacket', 'toxicWalkerSunglasses'] as const;
/** Zombies with several official pictures: the card number picks one (see `artSubject`). */
const MODERN_VARIANTS: Partial<Record<ZombieType, readonly (keyof typeof MODERN_OFFICIAL)[]>> = {
  skinnerWalker: ['skinnerWalker', 'skinnerWalkerParka'],
  berserkerWalker: ['berserkerWalker', 'berserkerWalkerJacket'],
  toxicWalker: TOXIC_WALKER_ART,
  walker: MODERN_WALKER_ART, runner: MODERN_RUNNER_ART, fatty: MODERN_FATTY_ART,
};
const NPC_WALKER_ART = ['npcWalker', 'npcWalkerBishop', 'npcWalkerHeadless'] as const;
type NpcWalkerArt = typeof NPC_WALKER_ART[number];

export type ArtSubject = (typeof TOXIC_WALKER_ART)[number] | (typeof MODERN_FATTY_ART)[number] | (typeof MODERN_RUNNER_ART)[number] | (typeof MODERN_WALKER_ART)[number] | NpcWalkerArt | ZombieType | InvaderXeno | InvaderAbomination | FantasyZombie | FantasyNecromancer | NamedModernAbomination | WesternSubject | 'trejo' | 'spam' | 'berserkerWalkerJacket' | 'skinnerWalkerParka';

type OfficialArt = {
  source: ImageSourcePropType;
  /** Width over height of the file (a test checks it): the cut-out is framed by it. */
  ratio: number;
  /** A transparent PNG cut-out: it can be tinted into a faded silhouette and sits on any backdrop. */
  cutout?: true;
  /** `center` anchor: fit the figure whole in the panel instead of covering it (a landscape picture whose head is at one end). */
  whole?: true;
  /** Enlargement of a `center` cut-out on a card, instead of CUTOUT_ZOOM / CUTOUT_WIDE_ZOOM. */
  zoom?: number;
  /** Share of the width (0 left, 1 right) brought to the middle of a tall panel when the cut-out is wider than it (default 0.5): the head or main figure, kept inside the panel. */
  focus?: number;
  /** The picture ends flat (cut at the waist or the knees): on a Modern card it stands on the bottom edge instead of floating. */
  bust?: true;
};

/** Generic horde behind every Modern official cut-out (the drawings keep the background they were printed with). */
const MODERN_BACKDROP = require('../../assets/modern/backgrounds/generic-horde.jpg');

/**
 * Official cut-outs of the Modern zombies and Abominations (assets/modern/<zombies|abominations>/<name>-official.png, plus
 * the Eddies shared with Fantasy and Western). `ratio` is the file's width over height (a test checks it). A subject missing
 * here uses MODERN_ART (cartoon JPEG). `whole`: landscape figure whose head is at one end, never cropped; `zoom`: card
 * enlargement replacing the default (1 keeps the sides of a group); `focus`: the head or main figure brought to the middle
 * of a tall panel where the centre of the picture would cut it.
 */
const MODERN_OFFICIAL = {
  toxicWalkerJacket: { source: require('../../assets/modern/zombies/toxic-walker-1-official.png'), ratio: 0.666, cutout: true },
  toxicWalkerSunglasses: { source: require('../../assets/modern/zombies/toxic-walker-2-official.png'), ratio: 0.666, cutout: true },
  fattySecurity: { source: require('../../assets/modern/zombies/fatty-2e-1-official.png'), ratio: 0.856, cutout: true },
  fattyDangerSign: { source: require('../../assets/modern/zombies/fatty-2e-2-official.png'), ratio: 0.750, cutout: true },
  runnerCoat: { source: require('../../assets/modern/zombies/runner-2e-1-official.png'), ratio: 0.666, cutout: true },
  runnerKneePads: { source: require('../../assets/modern/zombies/runner-2e-2-official.png'), ratio: 0.690, cutout: true },
  walkerArgyle: { source: require('../../assets/modern/zombies/walker-2e-1-official.png'), ratio: 0.666, cutout: true },
  walkerSign: { source: require('../../assets/modern/zombies/walker-2e-2-official.png'), ratio: 0.666, cutout: true },
  spam: { source: require('../../assets/modern/zombies/spam-official.png'), ratio: 0.666, cutout: true },
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
  soldierBoy: { source: require('../../assets/modern/abominations/soldier-boy-official.png'), ratio: 0.508, cutout: true, whole: true },
  starlight: { source: require('../../assets/modern/abominations/starlight-official.png'), ratio: 0.598, cutout: true, whole: true },
  archangelMichael: { source: require('../../assets/modern/abominations/archangel-michael-official.png'), ratio: 0.631, cutout: true, whole: true },
  wendigo: { source: require('../../assets/modern/abominations/wendigo-official.png'), ratio: 0.649, cutout: true, whole: true },
  leviathan: { source: require('../../assets/modern/abominations/leviathan-official.png'), ratio: 0.813, cutout: true, whole: true },
  alphaVampire: { source: require('../../assets/modern/abominations/alpha-vampire-official.png'), ratio: 0.431, cutout: true, whole: true },
  sillyWalker: { source: require('../../assets/modern/zombies/silly-walker-official.png'), ratio: 0.793, cutout: true, whole: true },
  inquisitor: { source: require('../../assets/modern/zombies/inquisitor-official.png'), ratio: 1.159, cutout: true, whole: true, bust: true },
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
  homelander: require('../../assets/modern/abominations/homelander-cartoon.jpg'),
  theDeep: require('../../assets/modern/abominations/the-deep-cartoon.jpg'),
  // Invisible: the generic horde with nobody in front of it, on purpose (the printed card has no figure either).
  translucent: require('../../assets/modern/backgrounds/generic-horde.jpg'),
  zuul: require('../../assets/modern/abominations/zuul-cartoon.jpg'),
  vinzClortho: require('../../assets/modern/abominations/vinz-clortho-cartoon.jpg'),
  stayPuft: require('../../assets/modern/abominations/stay-puft-cartoon.jpg'),
  gozer: require('../../assets/modern/abominations/gozer-cartoon.jpg'),
  nudeOrganist: require('../../assets/modern/abominations/nude-organist-cartoon.jpg'),
  undeadParrot: require('../../assets/modern/abominations/undead-parrot-cartoon.jpg'),
  gumbys: require('../../assets/modern/abominations/gumbys-cartoon.jpg'),
  theFoot: require('../../assets/modern/abominations/the-foot-cartoon.jpg'),
  fishSlappingDancer: require('../../assets/modern/abominations/fish-slapping-dancer-cartoon.jpg'),
  hellsGrannies: require('../../assets/modern/abominations/hells-grannies-cartoon.jpg'),
  eddieOriginal: require('../../assets/modern/abominations/original-eddie-cartoon.jpg'),
  batmanEarth12: require('../../assets/modern/abominations/batman-earth-12-cartoon.jpg'),
  batmanEarth44: require('../../assets/modern/abominations/batman-earth-44-cartoon.jpg'),
  batmanWhoLaughs: require('../../assets/modern/abominations/batman-who-laughs-cartoon.jpg'),
  theRobins: require('../../assets/modern/abominations/the-robins-cartoon.jpg'),
  loboBatman: require('../../assets/modern/abominations/lobo-batman-cartoon.jpg'),
  batmanEarth1: require('../../assets/modern/abominations/batman-earth-1-cartoon.jpg'),
  batmanEarth11: require('../../assets/modern/abominations/batman-earth-11-cartoon.jpg'),
  batmanEarth32: require('../../assets/modern/abominations/batman-earth-32-cartoon.jpg'),
  batmanEarth52: require('../../assets/modern/abominations/batman-earth-52-cartoon.jpg'),
} satisfies Record<Exclude<ZombieType | 'trejo' | 'spam' | NamedModernAbomination, keyof typeof MODERN_OFFICIAL>, ImageSourcePropType>;

const SAMURAI_EDDIE_ART = require('../../assets/invader/abominations/samurai-eddie-abomination-official.png');

// Every Fantasy subject has official art now; a new one without it would go here.
const FANTASY_ART = {} satisfies Record<Exclude<FantasyZombie | FantasyNecromancer, keyof typeof FANTASY_OFFICIAL>, ImageSourcePropType>;


/**
 * Official art of the Fantasy zombies and bosses (assets/fantasy/<zombies|abominations|necromancers>/<base>-official.png
 * or .jpg). Subjects without usable official art use FANTASY_ART. Add a line only once its
 * file exists (a `require` of a missing file breaks the bundle); `ratio` is the file's width over height, `cutout: true`
 * marks a transparent PNG.
 */
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
  // The Divine Beasts cards print the Vermillion Bird, the first beast to spawn.
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

/** Share of its colour a cut-out silhouette keeps on a Danger Level row: a faded stamp, as printed. */
const SILHOUETTE_OPACITY = 0.5;

// Official Eddie silhouettes extracted from the larger card illustrations in the CMON pack previews.
const INVADER_EDDIE_ART = {
  cyborgEddieAbomination: require('../../assets/invader/abominations/cyborg-eddie-abomination-official.png'),
  samuraiEddieAbomination: SAMURAI_EDDIE_ART,
  bassistEddieAbomination: require('../../assets/invader/abominations/bassist-eddie-abomination-official.png'),
  bountyHunterEddieAbomination: require('../../assets/invader/abominations/bounty-hunter-eddie-abomination-official.png'),
} satisfies Partial<Record<InvaderAbomination, ImageSourcePropType>>;

/*
 * The pictures of the Invader cards: the official Zombicide Xeno renders (zombicide.com, cut inside their frame, the
 * logo rubbed out) or, for the Xenos the site has no render of, the art of the printed card cut to the picture. They are
 * padded to the shape of the picture window of a card (a Xeno one is portrait, an Abomination one landscape).
 */
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

// The Abomination windows and the transparent Eddie canvases are approximately 6:5.
const INVADER_ABOMINATION_RATIO = 6 / 5;

/**
 * The Abomination pictures cut from a printed card (840 x 700) are sharp in their top 63 % and filled with a blurred
 * dark red below, meant to sit behind the rule box. In the window the sharp part would end above the box, so they are
 * enlarged (`scale`, centred) and moved down (`down`, share of the window height) until the edge falls behind the box;
 * the head stays under the title plate.
 */
const INVADER_BLURRED_FILL: Partial<Record<ArtSubject, { scale: number; down: `${number}%` }>> = {
  shaila: { scale: 1.15, down: '5%' },
  dimbutcher: { scale: 1.15, down: '5%' },
};

// The same artwork is used in the carousel and menu.
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

/*
 * The Western cards are the printed cards themselves, scanned from the owner's Tabletop Simulator mod and cut to the
 * 63:88 card ratio, with the printed title, number, footer and rule text rubbed out (the app writes its own, in the
 * player's language, at the same place) and the count labels left under the app's own. Cards with the same art share
 * a file, so ten files serve the 45 cards.
 */
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

/**
 * The printed card of a Western card. The deck alternates two pictures in pairs of cards: the old man then the woman
 * for the Walkers (#001-#002 man, #003-#004 woman, #017-#018 man...), the red then the bandaged Brute (#005-#006 red,
 * #007-#008 white, #021-#022 red...); every 16th card starts the cycle again.
 */
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

/**
 * The picture of each named Western Abomination, shown in a window between the app's title plank and rule panel.
 * `ratio` is the window's own width over height, kept between 1.25 and 1.75 (the printed window grows or shrinks with
 * the length of the rule). A full illustration is framed by `center`, the vertical point brought to the middle
 * of the window. A cutout is fitted over the shared Western backdrop.
 */
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
/** The card the text-only Abomination draws on (also the face of an Abomination drawn by hand with no name). */
export const westernTextCardArt = WESTERN_CARD_ART.abomination;
export const westernWindow = (boss: WesternAbomination) => WESTERN_WINDOWS[boss];
const isWesternBoss = (subject: ArtSubject): subject is WesternAbomination => subject in WESTERN_WINDOWS;

export function artSubject(card: ModernCard): ArtSubject {
  if (card.kind === 'trejo' || card.kind === 'trejoRush') return 'trejo';
  if (card.kind === 'spam') return 'spam';
  const variants = MODERN_VARIANTS[card.zombie];
  return variants ? variantFor(card, variants) : card.zombie;
}

/** Height over width of the Modern drawings (576 x 1280, a hair taller: they are stretched to it on a card). */
const ART_RATIO = 2.25;
/** Height over width of the fantasy illustrations (640 × 1280). */
const FIGURE_RATIO = 2;
/**
 * The players found the pictures too small: a cut-out that covers its panel (`center`, on the cards) is drawn 18 % larger,
 * from the top so no head is cut. The `upper` anchor is not enlarged: its cut-outs were just trimmed of their transparent
 * margins (0-2 % left), so 1.18 would cut 8.5 % of the figure on each side (arms, weapons, wings) and show only ~40 % of a
 * tall one's height, while the trimmed file already fills the width, larger than before.
 */
const CUTOUT_ZOOM = 1.18;
/** Width over height above which a cut-out is landscape (wings, tails, mounts). */
const WIDE_RATIO = 1;
/** Landscape cut-outs grow less: more would trim their sides. */
const CUTOUT_WIDE_ZOOM = 1.08;
/** Drawn illustrations (Modern, Fantasy without a cut-out) are 12 % larger, centred on their column, head kept at the top. */
const DRAWN_ZOOM = 1.12;
/** Official Invader Xeno pictures cover their window; enlarged 12 % from the top edge, under the title plate. */
const INVADER_XENO_ZOOM = 1.12;
/** Invader Abominations hang from the top at the full card width; 10 % wider, centred, when no blurred-fill rule sets its own scale. */
const INVADER_ABOMINATION_ZOOM = 1.1;
/** Share of the window width a drawn illustration overflows on each side in an Invader card, to hide its torn border. */
const FILL_BLEED = 0.06;
/**
 * A Modern card is the picture edge to edge, under the title banner (`anchor="card"`: the panel is the whole card, 63:88).
 * The figure stands in the space left of the count labels, its head just under the banner's slanted lower edge (22 to
 * 19 % of the card's height from left to right), its feet near the bottom of the card; it is never cropped, so a wide
 * group shows whole. Shares of the card's width (x) and height (y).
 */
const CARD_RATIO = 88 / 63;
const CARD_FIGURE = {
  /** Top of the head: the banner's edge is at 23 % on the left and 19.5 % on the right, the figure stands left of centre. */
  top: 0.225,
  /** Feet may run this far under the card's bottom edge (or behind a Rush / Extra Activation footer), as printed. */
  feetBleed: 0.03,
  /** Widest a figure gets: the count labels overlap its right side. */
  width: 0.92,
  /** The same when the current Danger Level is shown alone: one label leaves more room. */
  widthLarger: 1,
  /** Height factor of a figure when the current Danger Level is shown alone ("the picture larger"), head kept in place. */
  largerZoom: 1.12,
  /** Where the middle of a figure narrower than its room stands. */
  centerX: 0.38,
};
/**
 * A Modern drawing (no official cut-out) is this much wider than the card so that its printed border falls outside; the
 * border at its top (this share of its height, rounded corners included) is tucked under the banner, whose lower edge is
 * highest on the right (`top`, share of the card's height).
 */
const CARD_DRAWING = { oversize: 1.14, border: 0.035, top: 0.19 };
/** What a `card` figure leaves to the card: share of its height covered at the bottom by a footer or text panel, and a larger picture. */
export type CardFrame = { reserve?: number; larger?: boolean };
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
  'divineBeast', 'vermillionBird', 'whiteTiger', 'blackTortoise', 'azureDragon', 'reaper', 'baalberith', 'horseman', 'queenCaenedra', 'hugBear', 'banshee', 'cerberus', 'lordJanas', 'marike',
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
  magentaCovfefe: 0.18,
};

/** Where a cut-out stands on a Modern card (`CARD_FIGURE`): full height under the banner, or fitted to the width left. */
function cardCutoutLayout(art: OfficialArt, box: { width: number; height: number }, frame: CardFrame) {
  const reserve = frame.reserve ?? 0;
  const top = CARD_FIGURE.top * box.height;
  const bottom = box.height * (1 - reserve + (reserve > 0 ? 0 : CARD_FIGURE.feetBleed));
  const room = bottom - top;
  const maxWidth = box.width * (frame.larger ? CARD_FIGURE.widthLarger : CARD_FIGURE.width);
  const height = Math.min(room * (frame.larger ? CARD_FIGURE.largerZoom : 1), maxWidth / art.ratio);
  const width = height * art.ratio;
  return {
    width,
    height,
    left: Math.max(0, Math.min(box.width - width, box.width * CARD_FIGURE.centerX - width / 2)),
    // A figure that fills its width before its height (a wide group, a beast) is centred in the room it has; one cut flat stands on its bottom.
    top: height < room ? top + (room - height) / (art.bust ? 1 : 2) : top,
  };
}

/**
 * A transparent cut-out in its panel. A stamp on a Danger Level row (`full`) is shown whole. Otherwise the figure is
 * framed from the top so that its head stays in view: in a tall panel (`center`: carousel, menu, the one big row) it
 * covers the panel (`whole` fits the figure in it instead); in a wide or low one (`upper`: a boss picture, a window above the rows) it takes the full
 * width, head and chest, and a figure too short for the panel is centred in it.
 */
function Cutout({ art, anchor, silhouette, zoomed, frame }: { art: OfficialArt; anchor: string; silhouette?: boolean; zoomed: boolean; frame?: CardFrame }) {
  const [box, setBox] = useState({ width: 0, height: 0 });
  const tint = silhouette ? { tintColor: FANTASY_COLORS.silhouette, opacity: SILHOUETTE_OPACITY } : undefined;
  if (anchor === 'full') return <Image source={art.source} style={[styles.fullFigure, tint]} resizeMode="contain" />;
  let layout;
  if (box.width > 0 && box.height > 0 && anchor === 'card') {
    layout = cardCutoutLayout(art, box, frame ?? {});
  } else if (box.width > 0 && box.height > 0) {
    const byWidth = box.width / art.ratio;
    // Only a `center` cut-out on a card is enlarged, from the top: the head stays and only the sides and feet are trimmed.
    const zoom = zoomed && anchor === 'center' && !art.whole ? (art.zoom ?? (art.ratio > WIDE_RATIO ? CUTOUT_WIDE_ZOOM : CUTOUT_ZOOM)) : 1;
    const fit = anchor === 'center' && art.whole ? 'whole' : anchor;
    const height = (fit === 'center' ? Math.max(byWidth, box.height) : fit === 'whole' ? Math.min(byWidth, box.height) : byWidth) * zoom;
    const width = height * art.ratio;
    // A cut-out wider than its panel is slid so that `focus` sits in the middle, without leaving a gap on either side.
    const left = fit === 'center' && width > box.width ? Math.min(0, Math.max(box.width - width, box.width / 2 - (art.focus ?? 0.5) * width)) : (box.width - width) / 2;
    layout = { width, height, left, top: fit !== 'center' && height < box.height ? (box.height - height) / 2 : 0 };
  }
  return (
    <View style={StyleSheet.absoluteFill} onLayout={(event) => setBox(event.nativeEvent.layout)}>
      {layout && <Image source={art.source} style={[{ position: 'absolute' }, layout, tint]} resizeMode="stretch" />}
    </View>
  );
}

/** A subject's picture in its panel, framed by `anchor` (see `Cutout` for the cut-outs). */
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
  /** A faded stamp of the zombie (a Danger Level row): a cut-out is tinted, a drawing keeps its colours. */
  silhouette?: boolean;
  /** Lay a Fantasy cut-out on the backdrop of the Fantasy cards (carousel, menu), where nothing else is behind it (Modern ones bring theirs). */
  backdrop?: boolean;
  /** No enlargement: the carousel and the menu show the pictures at their own size, only the cards are enlarged. */
  plain?: boolean;
  /** With `anchor="card"`: what the card covers at the bottom, and whether the picture is larger (see `CardFrame`). */
  frame?: CardFrame;
}) {
  const [width, setWidth] = useState(0);
  const official = officialOf(subject);
  const drawnZoom = plain ? 1 : DRAWN_ZOOM;
  // `whole`: a cut-out in full, head to feet, in its panel; a drawing has its border to crop and covers the panel as ever.
  if (anchor === 'whole' && !official?.cutout) anchor = 'center';
  const source = official?.source ?? (isWesternBoss(subject) ? WESTERN_WINDOWS[subject].source : ART[subject]);
  // A cut-out has no border to crop and sits on whatever is behind it.
  if (official?.cutout) {
    const cutout = <Cutout art={official} anchor={anchor} silhouette={silhouette} zoomed={!plain} frame={frame} />;
    // A Modern cut-out always lies on the generic horde (never behind a silhouette); a Fantasy one only where `backdrop` asks.
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
  // A Modern drawing covers the card with its own background, its head just under the banner.
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
  // The Western heroes are cut for their panel: cover, whatever its shape.
  if ((isWesternBoss(subject) || subject in WESTERN_HEROES) && anchor !== 'full') return <Image source={source} style={styles.fullFigure} resizeMode="cover" />;
  // The official Invader pictures are framed renders, not cut-outs: they cover their panel too (carousel, menu).
  if (subject in INVADER_OFFICIAL && anchor !== 'full' && anchor !== 'fill') return <Image source={source} style={styles.fullFigure} resizeMode="cover" />;
  if (anchor === 'fill') {
    // The face of an Invader card: its official picture covers the window, which spans the whole card under the title.
    const official = INVADER_OFFICIAL[subject];
    if (official) {
      // A landscape picture (an Abomination) hangs from the top at the full width of the card, the rest of the window
      // being the red backdrop behind the rule box; a portrait one (a Xeno) covers the window.
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
    // No official picture: the drawn illustration, wider than the window so its cream torn border is cut off.
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
  // `upper`: head and chest of a full-length figure in a wide panel: the width fills the panel, the halo above the head and
  // the legs are cropped.
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

// Slightly larger than its panel so the overflow trims the printed cream border.
const styles = StyleSheet.create({
  fullFigure: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  topFigure: { position: 'absolute', top: 0, left: 0, width: '100%', height: 'auto' },
  figure: { position: 'absolute', top: '-2%', left: '-4%', width: '108%', height: '104%' },
});
