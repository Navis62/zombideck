import { useState } from 'react';
import { Image, type ImageSourcePropType, StyleSheet, View } from 'react-native';

import { FANTASY_COLORS } from '@/theme';
import type { FantasyNecromancer, FantasyZombie, InvaderAbomination, InvaderXeno, ModernCard, NamedModernAbomination, WesternAbomination, WesternCard, WesternZombie, ZombieType } from '@/game/types';

/**
 * The Western zombies that stand alone (menu and carousel; on the cards they come with the whole printed card, see
 * `westernCardArt`) and the named Abominations (their picture is the window of their card, see `westernWindow`).
 */
export type WesternSubject = Exclude<WesternZombie, 'longDeadWalker'> | WesternAbomination;
const NPC_WALKER_ART = ['npcWalker', 'npcWalkerBishop', 'npcWalkerHeadless'] as const;
type NpcWalkerArt = typeof NPC_WALKER_ART[number];

export type ArtSubject = NpcWalkerArt | ZombieType | InvaderXeno | InvaderAbomination | FantasyZombie | FantasyNecromancer | NamedModernAbomination | WesternSubject | 'trejo' | 'spam';

// One illustration per subject, upscaled to 1280 px tall and compressed to JPEG.
// Tall portrait illustrations, shown in the panel beside the Danger Levels.
const MODERN_ART: Record<ZombieType | 'trejo' | 'spam' | NamedModernAbomination, ImageSourcePropType> = {
  walker: require('../../assets/modern/zombies/walker-cartoon.jpg'),
  fatty: require('../../assets/modern/zombies/fatty-cartoon.jpg'),
  runner: require('../../assets/modern/zombies/runner-cartoon.jpg'),
  abomination: require('../../assets/modern/abominations/abomination-cartoon.jpg'),
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
  trejo: require('../../assets/modern/abominations/trejo-cartoon.jpg'),
  spam: require('../../assets/modern/zombies/spam-cartoon.jpg'),
  hobomination: require('../../assets/modern/abominations/hobomination-cartoon.jpg'),
  abominawild: require('../../assets/modern/abominations/abominawild-cartoon.jpg'),
  abominacop: require('../../assets/modern/abominations/abominacop-cartoon.jpg'),
  patientZero: require('../../assets/modern/abominations/patient-zero-cartoon.jpg'),
  abombAbomination: require('../../assets/modern/abominations/abomb-abomination-cartoon.jpg'),
  berserkerAbomination: require('../../assets/modern/abominations/berserker-abomination-cartoon.jpg'),
  toxicAbomination: require('../../assets/modern/abominations/toxic-abomination-cartoon.jpg'),
  homelander: require('../../assets/modern/abominations/homelander-cartoon.jpg'),
  aTrain: require('../../assets/modern/abominations/a-train-cartoon.jpg'),
  blackNoir: require('../../assets/modern/abominations/black-noir-cartoon.jpg'),
  queenMaeve: require('../../assets/modern/abominations/queen-maeve-cartoon.jpg'),
  soldierBoy: require('../../assets/modern/abominations/soldier-boy-cartoon.jpg'),
  theDeep: require('../../assets/modern/abominations/the-deep-cartoon.jpg'),
  starlight: require('../../assets/modern/abominations/starlight-cartoon.jpg'),
  translucent: require('../../assets/modern/abominations/translucent-cartoon.jpg'),
  alphaVampire: require('../../assets/modern/abominations/alpha-vampire-cartoon.jpg'),
  wendigo: require('../../assets/modern/abominations/wendigo-cartoon.jpg'),
  leviathan: require('../../assets/modern/abominations/leviathan-cartoon.jpg'),
  blackDog: require('../../assets/modern/abominations/black-dog-cartoon.jpg'),
  crowley: require('../../assets/modern/abominations/crowley-cartoon.jpg'),
  archangelMichael: require('../../assets/modern/abominations/archangel-michael-cartoon.jpg'),
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
  greenwichCrew: require('../../assets/modern/abominations/greenwich-crew-cartoon.jpg'),
  eddieAsylum: require('../../assets/modern/abominations/asylum-eddie-cartoon.jpg'),
  eddieOriginal: require('../../assets/modern/abominations/original-eddie-cartoon.jpg'),
  eddieCyborg: require('../../assets/modern/abominations/cyborg-eddie-cartoon.jpg'),
  eddieMummy: require('../../assets/modern/abominations/mummy-eddie-cartoon.jpg'),
  eddieUndead: require('../../assets/modern/abominations/undead-eddie-cartoon.jpg'),
  eddieTrooper: require('../../assets/modern/abominations/trooper-eddie-cartoon.jpg'),
  eddieBassist: require('../../assets/modern/abominations/bassist-eddie-cartoon.jpg'),
  eddieReaper: require('../../assets/modern/abominations/reaper-eddie-cartoon.jpg'),
  eddieFear: require('../../assets/modern/abominations/fear-eddie-cartoon.jpg'),
  eddieWicker: require('../../assets/modern/abominations/wicker-eddie-cartoon.jpg'),
  eddiePharaoh: require('../../assets/modern/abominations/pharaoh-eddie-cartoon.jpg'),
  eddieKiller: require('../../assets/modern/abominations/killer-eddie-cartoon.jpg'),
  batabomination: require('../../assets/modern/abominations/batabomination-cartoon.jpg'),
  bigfoot: require('../../assets/modern/abominations/bigfoot-cartoon.jpg'),
  cthulhu: require('../../assets/modern/abominations/cthulhu-cartoon.jpg'),
  bearmanboar: require('../../assets/modern/abominations/bearmanboar-cartoon.jpg'),
  lankyman: require('../../assets/modern/abominations/lankyman-cartoon.jpg'),
  actualCannibal: require('../../assets/modern/abominations/actual-cannibal-cartoon.jpg'),
  sewerCrocodile: require('../../assets/modern/abominations/sewer-crocodile-cartoon.jpg'),
  killerClown: require('../../assets/modern/abominations/killer-clown-cartoon.jpg'),
  chupacabra: require('../../assets/modern/abominations/chupacabra-cartoon.jpg'),
  abductor: require('../../assets/modern/abominations/abductor-cartoon.jpg'),
  batmanEarth12: require('../../assets/modern/abominations/batman-earth-12-cartoon.jpg'),
  batmanEarth44: require('../../assets/modern/abominations/batman-earth-44-cartoon.jpg'),
  batmanWhoLaughs: require('../../assets/modern/abominations/batman-who-laughs-cartoon.jpg'),
  theRobins: require('../../assets/modern/abominations/the-robins-cartoon.jpg'),
  loboBatman: require('../../assets/modern/abominations/lobo-batman-cartoon.jpg'),
  batmanEarth1: require('../../assets/modern/abominations/batman-earth-1-cartoon.jpg'),
  batmanEarth11: require('../../assets/modern/abominations/batman-earth-11-cartoon.jpg'),
  batmanEarth32: require('../../assets/modern/abominations/batman-earth-32-cartoon.jpg'),
  batmanEarth52: require('../../assets/modern/abominations/batman-earth-52-cartoon.jpg'),
};

const FANTASY_ART = {
  crowz: require('../../assets/fantasy/zombies/crowz-cartoon.jpg'),
  feralDragon: require('../../assets/fantasy/abominations/feral-dragon-cartoon.jpg'),
  blackheart: require('../../assets/fantasy/necromancers/blackheart-cartoon.jpg'),
  evilTroy: require('../../assets/fantasy/necromancers/evil-troy-cartoon.jpg'),
  necromanticDragon: require('../../assets/fantasy/abominations/necromantic-dragon-cartoon.jpg'),
  eeWalker: require('../../assets/fantasy/zombies/ee-walker-cartoon.jpg'),
  eeRunner: require('../../assets/fantasy/zombies/ee-runner-cartoon.jpg'),
  eeBrute: require('../../assets/fantasy/zombies/ee-brute-cartoon.jpg'),
  amaterasu: require('../../assets/fantasy/abominations/amaterasu-cartoon.jpg'),
  asura: require('../../assets/fantasy/abominations/asura-cartoon.jpg'),
  bishamon: require('../../assets/fantasy/abominations/bishamon-cartoon.jpg'),
  chimimoryo: require('../../assets/fantasy/abominations/chimimoryo-cartoon.jpg'),
  hachiman: require('../../assets/fantasy/abominations/hachiman-cartoon.jpg'),
  kijin: require('../../assets/fantasy/abominations/kijin-cartoon.jpg'),
  kumiho: require('../../assets/fantasy/abominations/kumiho-cartoon.jpg'),
  nian: require('../../assets/fantasy/abominations/nian-cartoon.jpg'),
  qilin: require('../../assets/fantasy/abominations/qilin-cartoon.jpg'),
  redHare: require('../../assets/fantasy/abominations/red-hare-cartoon.jpg'),
  shakokiDogu: require('../../assets/fantasy/abominations/shakoki-dogu-cartoon.jpg'),
  sojobo: require('../../assets/fantasy/abominations/sojobo-cartoon.jpg'),
  susanoWo: require('../../assets/fantasy/abominations/susano-wo-cartoon.jpg'),
  takemikazuchi: require('../../assets/fantasy/abominations/takemikazuchi-cartoon.jpg'),
  toyol: require('../../assets/fantasy/abominations/toyol-cartoon.jpg'),
  yeti: require('../../assets/fantasy/abominations/yeti-cartoon.jpg'),
  bomoh: require('../../assets/fantasy/necromancers/bomoh-cartoon.jpg'),
  deathNotes: require('../../assets/fantasy/necromancers/death-notes-cartoon.jpg'),
  hannya: require('../../assets/fantasy/necromancers/hannya-cartoon.jpg'),
  kaguya: require('../../assets/fantasy/necromancers/kaguya-cartoon.jpg'),
  tengu: require('../../assets/fantasy/necromancers/tengu-cartoon.jpg'),
  yukiOnna: require('../../assets/fantasy/necromancers/yuki-onna-cartoon.jpg'),
  fantasyBerserkerWalker: require('../../assets/fantasy/zombies/fantasy-berserker-walker-cartoon.jpg'),
  climber: require('../../assets/fantasy/zombies/climber-cartoon.jpg'),
  divineBeast: require('../../assets/fantasy/zombies/divine-beast-cartoon.jpg'),
  reaper: require('../../assets/fantasy/abominations/reaper-cartoon.jpg'),
  baalberith: require('../../assets/fantasy/abominations/baalberith-cartoon.jpg'),
  horseman: require('../../assets/fantasy/abominations/horseman-cartoon.jpg'),
  queenCaenedra: require('../../assets/fantasy/abominations/queen-caenedra-cartoon.jpg'),
  hugBear: require('../../assets/fantasy/abominations/hug-bear-cartoon.jpg'),
  banshee: require('../../assets/fantasy/abominations/banshee-cartoon.jpg'),
  cerberus: require('../../assets/fantasy/abominations/cerberus-cartoon.jpg'),
  lordJanas: require('../../assets/fantasy/abominations/lord-janas-cartoon.jpg'),
  marike: require('../../assets/fantasy/abominations/marike-cartoon.jpg'),
  erinn: require('../../assets/fantasy/necromancers/erinn-cartoon.jpg'),
  grandVizier: require('../../assets/fantasy/necromancers/grand-vizier-cartoon.jpg'),
  theSparrow: require('../../assets/fantasy/necromancers/the-sparrow-cartoon.jpg'),
  dongZhuo: require('../../assets/fantasy/abominations/dong-zhuo-cartoon.jpg'),
  zhangJiao: require('../../assets/fantasy/necromancers/zhang-jiao-cartoon.jpg'),
  fumaKotaro: require('../../assets/fantasy/necromancers/fuma-kotaro-cartoon.jpg'),
  footNinja: require('../../assets/fantasy/zombies/foot-ninja-cartoon.jpg'),
  bebop: require('../../assets/fantasy/abominations/bebop-cartoon.jpg'),
  rocksteady: require('../../assets/fantasy/abominations/rocksteady-cartoon.jpg'),
  pharaohEddie: require('../../assets/fantasy/abominations/pharaoh-eddie-cartoon.jpg'),
  samuraiEddie: require('../../assets/fantasy/abominations/samurai-eddie-cartoon.jpg'),
  mummyEddie: require('../../assets/fantasy/abominations/mummy-eddie-cartoon.jpg'),
  wickerManEddie: require('../../assets/fantasy/abominations/wicker-man-eddie-cartoon.jpg'),
  fearEddie: require('../../assets/fantasy/abominations/fear-eddie-cartoon.jpg'),
  mummRa: require('../../assets/fantasy/necromancers/mumm-ra-cartoon.jpg'),
  reaperEddie: require('../../assets/fantasy/necromancers/reaper-eddie-cartoon.jpg'),
  shamanEddie: require('../../assets/fantasy/necromancers/shaman-eddie-cartoon.jpg'),
} satisfies Record<Exclude<FantasyZombie | FantasyNecromancer, keyof typeof FANTASY_OFFICIAL>, ImageSourcePropType>;

type OfficialArt = {
  source: ImageSourcePropType;
  /** Width over height of the file (a test checks it): the cut-out is framed by it. */
  ratio: number;
  /** A transparent PNG cut-out: it can be tinted into a faded silhouette and sits on any backdrop. */
  cutout?: true;
};

/**
 * Official art of the Fantasy zombies and bosses (assets/fantasy/<zombies|abominations|necromancers>/<base>-official.png
 * or .jpg). Subjects without usable official art use FANTASY_ART. Add a line only once its
 * file exists (a `require` of a missing file breaks the bundle); `ratio` is the file's width over height, `cutout: true`
 * marks a transparent PNG.
 */
const FANTASY_OFFICIAL = {
  npcWalker: { source: require('../../assets/fantasy/zombies/npc-walker-snow-white-official.png'), ratio: 0.735, cutout: true },
  npcWalkerBishop: { source: require('../../assets/fantasy/zombies/npc-walker-bishop-official.png'), ratio: 0.628, cutout: true },
  npcWalkerHeadless: { source: require('../../assets/fantasy/zombies/npc-walker-headless-official.png'), ratio: 0.831, cutout: true },
  ablobination: { source: require('../../assets/fantasy/abominations/ablobination-official.png'), ratio: 0.935, cutout: true },
  abominabunny: { source: require('../../assets/fantasy/abominations/abominabunny-official.png'), ratio: 1.154, cutout: true },
  abominalpha: { source: require('../../assets/fantasy/abominations/abominalpha-official.png'), ratio: 0.807, cutout: true },
  abominarat: { source: require('../../assets/fantasy/abominations/abominarat-official.png'), ratio: 0.94, cutout: true },
  abominatroll: { source: require('../../assets/fantasy/abominations/abominatroll-official.png'), ratio: 0.763, cutout: true },
  abominotaur: { source: require('../../assets/fantasy/abominations/abominotaur-official.png'), ratio: 0.571, cutout: true },
  chromatiz: { source: require('../../assets/fantasy/abominations/chromatiz-official.png'), ratio: 0.686, cutout: true },
  fantasyAbomination: { source: require('../../assets/fantasy/abominations/fantasy-abomination-official.png'), ratio: 0.613, cutout: true },
  godEaterAbomination: { source: require('../../assets/fantasy/abominations/god-eater-abomination-official.png'), ratio: 0.939, cutout: true },
  gorgomination: { source: require('../../assets/fantasy/abominations/gorgomination-official.png'), ratio: 1.042, cutout: true },
  hordeBrother: { source: require('../../assets/fantasy/abominations/horde-brother-official.png'), ratio: 0.642, cutout: true },
  khanAbomination: { source: require('../../assets/fantasy/abominations/khan-abomination-official.png'), ratio: 1.035, cutout: true },
  magentaCovefe: { source: require('../../assets/fantasy/abominations/magenta-covefe-official.png'), ratio: 0.69, cutout: true },
  orcAbomination: { source: require('../../assets/fantasy/abominations/orc-abomination-official.png'), ratio: 0.807, cutout: true },
  siegeBreaker: { source: require('../../assets/fantasy/abominations/siege-breaker-official.png'), ratio: 1.14, cutout: true },
  swampLurker: { source: require('../../assets/fantasy/abominations/swamp-lurker-official.png'), ratio: 0.914, cutout: true },
  swampTroll: { source: require('../../assets/fantasy/abominations/swamp-troll-official.png'), ratio: 0.977, cutout: true },
  taintedAbomination: { source: require('../../assets/fantasy/abominations/tainted-abomination-official.png'), ratio: 0.926, cutout: true },
  vaultWarden: { source: require('../../assets/fantasy/abominations/vault-warden-official.png'), ratio: 0.637, cutout: true },
  werezombie: { source: require('../../assets/fantasy/abominations/werezombie-official.png'), ratio: 1.114, cutout: true },
  wolfbomination: { source: require('../../assets/fantasy/abominations/wolfbomination-official.png'), ratio: 1.058, cutout: true },
  zombieGiant: { source: require('../../assets/fantasy/abominations/zombie-giant-official.png'), ratio: 1.103, cutout: true },
  countTemeraire: { source: require('../../assets/fantasy/necromancers/count-temeraire-official.png'), ratio: 0.85, cutout: true },
  defilerNecromancer: { source: require('../../assets/fantasy/necromancers/defiler-necromancer-official.png'), ratio: 0.871, cutout: true },
  erikSummoner: { source: require('../../assets/fantasy/necromancers/erik-summoner-official.png'), ratio: 1.171, cutout: true },
  faolan: { source: require('../../assets/fantasy/necromancers/faolan-official.png'), ratio: 0.736, cutout: true },
  grin: { source: require('../../assets/fantasy/necromancers/grin-official.png'), ratio: 0.799, cutout: true },
  innsmouth: { source: require('../../assets/fantasy/necromancers/innsmouth-official.png'), ratio: 0.757, cutout: true },
  lordOfSkulls: { source: require('../../assets/fantasy/necromancers/lord-of-skulls-official.png'), ratio: 0.585, cutout: true },
  necromancer: { source: require('../../assets/fantasy/necromancers/necromancer-official.png'), ratio: 0.731, cutout: true },
  orcNecromancer: { source: require('../../assets/fantasy/necromancers/orc-necromancer-official.png'), ratio: 0.734, cutout: true },
  ostokar: { source: require('../../assets/fantasy/necromancers/ostokar-official.png'), ratio: 0.775, cutout: true },
  queenMedea: { source: require('../../assets/fantasy/necromancers/queen-medea-official.png'), ratio: 0.517, cutout: true },
  queenSevera: { source: require('../../assets/fantasy/necromancers/queen-severa-official.png'), ratio: 0.957, cutout: true },
  ratKing: { source: require('../../assets/fantasy/necromancers/rat-king-official.png'), ratio: 0.686, cutout: true },
  toMeKuPa: { source: require('../../assets/fantasy/necromancers/to-me-ku-pa-official.png'), ratio: 0.883, cutout: true },
  deadboltWalker: { source: require('../../assets/fantasy/zombies/deadbolt-walker-official.png'), ratio: 0.5, cutout: true },
  deadeyeWalker: { source: require('../../assets/fantasy/zombies/deadeye-walker-official.png'), ratio: 0.888, cutout: true },
  fantasyFatty: { source: require('../../assets/fantasy/zombies/fantasy-fatty-official.png'), ratio: 0.672, cutout: true },
  fantasyRunner: { source: require('../../assets/fantasy/zombies/fantasy-runner-official.png'), ratio: 0.59, cutout: true },
  fantasyWalker: { source: require('../../assets/fantasy/zombies/fantasy-walker-official.png'), ratio: 0.474, cutout: true },
  fattyBurster: { source: require('../../assets/fantasy/zombies/fatty-burster-official.png'), ratio: 0.985, cutout: true },
  orcFatty: { source: require('../../assets/fantasy/zombies/orc-fatty-official.png'), ratio: 0.947, cutout: true },
  orcRunner: { source: require('../../assets/fantasy/zombies/orc-runner-official.png'), ratio: 0.725, cutout: true },
  orcWalker: { source: require('../../assets/fantasy/zombies/orc-walker-official.png'), ratio: 0.639, cutout: true },
  ratz: { source: require('../../assets/fantasy/zombies/ratz-official.png'), ratio: 0.972, cutout: true },
  spectralWalker: { source: require('../../assets/fantasy/zombies/spectral-walker-official.png'), ratio: 0.689, cutout: true },
  taintedWalker: { source: require('../../assets/fantasy/zombies/tainted-walker-official.png'), ratio: 0.805, cutout: true },
  terrorcottaWalker: { source: require('../../assets/fantasy/zombies/terrorcotta-walker-official.png'), ratio: 0.475, cutout: true },
  wdBrute: { source: require('../../assets/fantasy/zombies/wd-brute-official.png'), ratio: 0.686, cutout: true },
  wdRunner: { source: require('../../assets/fantasy/zombies/wd-runner-official.png'), ratio: 0.724, cutout: true },
  wdWalker: { source: require('../../assets/fantasy/zombies/wd-walker-official.png'), ratio: 0.521, cutout: true },
  wolfz: { source: require('../../assets/fantasy/zombies/wolfz-official.png'), ratio: 1.335, cutout: true },
  // Stand-in: only named in a card footer, never drawn.
  wardenBrute: { source: require('../../assets/fantasy/zombies/fantasy-fatty-official.png'), ratio: 0.672, cutout: true },
} satisfies Partial<Record<FantasyZombie | FantasyNecromancer | NpcWalkerArt, OfficialArt>>;

export function npcWalkerArt(cardId: string): NpcWalkerArt {
  const number = Number(cardId.match(/\d+$/)?.[0] ?? 0);
  return NPC_WALKER_ART[number % NPC_WALKER_ART.length];
}

const officialOf = (subject: ArtSubject): OfficialArt | undefined => (FANTASY_OFFICIAL as Partial<Record<ArtSubject, OfficialArt>>)[subject];

/** Share of its colour a cut-out silhouette keeps on a Danger Level row: a faded stamp, as printed. */
const SILHOUETTE_OPACITY = 0.5;

// Official Eddie silhouettes extracted from the larger card illustrations in the CMON pack previews.
const INVADER_EDDIE_ART = {
  cyborgEddieAbomination: require('../../assets/invader/abominations/cyborg-eddie-abomination-official.png'),
  samuraiEddieAbomination: require('../../assets/invader/abominations/samurai-eddie-abomination-official.png'),
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

export const artSubject = (card: ModernCard): ArtSubject =>
  card.kind === 'trejo' || card.kind === 'trejoRush' ? 'trejo' : card.kind === 'spam' ? 'spam' : card.zombie;

// Height over width of the Trejo and SPAM illustrations, the only ones shown top-anchored.
const ART_RATIO = 2.25;
/** Height over width of the fantasy illustrations (640 × 1280). */
const FIGURE_RATIO = 2;
/** Share of the window width a drawn illustration overflows on each side in an Invader card, to hide its torn border. */
const FILL_BLEED = 0.06;
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

/**
 * A transparent cut-out in its panel. A stamp on a Danger Level row (`full`) is shown whole. Otherwise the figure is
 * framed from the top so that its head stays in view: in a tall panel (`center`: carousel, menu, the one big row) it
 * covers the panel (`whole` fits the figure in it instead); in a wide or low one (`upper`, `top`: a boss picture, a window above the rows) it takes the full
 * width, head and chest, and a figure too short for the panel is centred in it.
 */
function Cutout({ art, anchor, silhouette }: { art: OfficialArt; anchor: string; silhouette?: boolean }) {
  const [box, setBox] = useState({ width: 0, height: 0 });
  const tint = silhouette ? { tintColor: FANTASY_COLORS.silhouette, opacity: SILHOUETTE_OPACITY } : undefined;
  if (anchor === 'full') return <Image source={art.source} style={[styles.fullFigure, tint]} resizeMode="contain" />;
  let layout;
  if (box.width > 0 && box.height > 0) {
    const byWidth = box.width / art.ratio;
    const height = anchor === 'center' ? Math.max(byWidth, box.height) : anchor === 'whole' ? Math.min(byWidth, box.height) : byWidth;
    const width = height * art.ratio;
    layout = { width, height, left: (box.width - width) / 2, top: anchor !== 'center' && height < box.height ? (box.height - height) / 2 : 0 };
  }
  return (
    <View style={StyleSheet.absoluteFill} onLayout={(event) => setBox(event.nativeEvent.layout)}>
      {layout && <Image source={art.source} style={[{ position: 'absolute' }, layout, tint]} resizeMode="stretch" />}
    </View>
  );
}

/** Fills its panel; `top` keeps the head in view when the panel is wider than the illustration. */
export function ZombieFigure({
  subject,
  anchor = 'center',
  silhouette,
}: {
  subject: ArtSubject;
  anchor?: 'center' | 'top' | 'upper' | 'full' | 'fill' | 'whole';
  /** A faded stamp of the zombie (a Danger Level row): a cut-out is tinted, a drawing keeps its colours. */
  silhouette?: boolean;
}) {
  const [width, setWidth] = useState(0);
  const official = officialOf(subject);
  // `whole`: a cut-out in full, head to feet, in its panel; a drawing has its border to crop and covers the panel as ever.
  if (anchor === 'whole' && !official?.cutout) anchor = 'center';
  const source = official?.source ?? (isWesternBoss(subject) ? WESTERN_WINDOWS[subject].source : ART[subject]);
  // A cut-out has no border to crop and sits on whatever is behind it.
  if (official?.cutout) return <Cutout art={official} anchor={anchor} silhouette={silhouette} />;
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
        const wide = fit?.scale ?? 1;
        return (
          <Image
            source={official}
            style={[styles.topFigure, { aspectRatio: INVADER_ABOMINATION_RATIO, width: `${wide * 100}%`, left: `${((1 - wide) / 2) * 100}%`, top: fit?.down ?? 0 }]}
            resizeMode="cover"
          />
        );
      }
      return <Image source={official} style={styles.fullFigure} resizeMode="cover" />;
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
  topFigure: { position: 'absolute', top: 0, left: 0, width: '100%', height: 'auto' },
  figure: { position: 'absolute', top: '-2%', left: '-4%', width: '108%', height: '104%' },
});
