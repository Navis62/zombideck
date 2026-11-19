import { useState } from 'react';
import { Image, type ImageSourcePropType, StyleSheet, View } from 'react-native';

import type { FantasyNecromancer, FantasyZombie, InvaderAbomination, InvaderXeno, ModernCard, NamedModernAbomination, WesternAbomination, WesternCard, WesternZombie, ZombieType } from '@/game/types';

/**
 * The Western zombies that stand alone (menu and carousel; on the cards they come with the whole printed card, see
 * `westernCardArt`) and the named Abominations (their picture is the window of their card, see `westernWindow`).
 */
export type WesternSubject = Exclude<WesternZombie, 'longDeadWalker'> | WesternAbomination;
export type ArtSubject = ZombieType | InvaderXeno | InvaderAbomination | FantasyZombie | FantasyNecromancer | NamedModernAbomination | WesternSubject | 'trejo' | 'spam';

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

const FANTASY_ART: Record<FantasyZombie | FantasyNecromancer, ImageSourcePropType> = {
  wolfz: require('../../assets/fantasy/zombies/wolfz-cartoon.jpg'),
  wolfbomination: require('../../assets/fantasy/abominations/wolfbomination-cartoon.jpg'),
  npcWalker: require('../../assets/fantasy/zombies/npc-walker-cartoon.jpg'),
  deadeyeWalker: require('../../assets/fantasy/zombies/deadeye-walker-cartoon.jpg'),
  crowz: require('../../assets/fantasy/zombies/crowz-cartoon.jpg'),
  taintedWalker: require('../../assets/fantasy/zombies/tainted-walker-cartoon.jpg'),
  taintedAbomination: require('../../assets/fantasy/abominations/tainted-abomination-cartoon.jpg'),
  ablobination: require('../../assets/fantasy/abominations/ablobination-cartoon.jpg'),
  abominatroll: require('../../assets/fantasy/abominations/abominatroll-cartoon.jpg'),
  abominotaur: require('../../assets/fantasy/abominations/abominotaur-cartoon.jpg'),
  fattyBurster: require('../../assets/fantasy/zombies/fatty-burster-cartoon.jpg'),
  zombieGiant: require('../../assets/fantasy/abominations/zombie-giant-cartoon.jpg'),
  gorgomination: require('../../assets/fantasy/abominations/gorgomination-cartoon.jpg'),
  hordeBrother: require('../../assets/fantasy/abominations/horde-brother-cartoon.jpg'),
  siegeBreaker: require('../../assets/fantasy/abominations/siege-breaker-cartoon.jpg'),
  swampLurker: require('../../assets/fantasy/abominations/swamp-lurker-cartoon.jpg'),
  abominabunny: require('../../assets/fantasy/abominations/abominabunny-cartoon.jpg'),
  magentaCovefe: require('../../assets/fantasy/abominations/magenta-covefe-cartoon.jpg'),
  vaultWarden: require('../../assets/fantasy/abominations/vault-warden-cartoon.jpg'),
  werezombie: require('../../assets/fantasy/abominations/werezombie-cartoon.jpg'),
  chromatiz: require('../../assets/fantasy/abominations/chromatiz-cartoon.jpg'),
  feralDragon: require('../../assets/fantasy/abominations/feral-dragon-cartoon.jpg'),
  countTemeraire: require('../../assets/fantasy/necromancers/count-temeraire-cartoon.jpg'),
  queenSevera: require('../../assets/fantasy/necromancers/queen-severa-cartoon.jpg'),
  abominalpha: require('../../assets/fantasy/abominations/abominalpha-cartoon.jpg'),
  abominarat: require('../../assets/fantasy/abominations/abominarat-cartoon.jpg'),
  toMeKuPa: require('../../assets/fantasy/necromancers/to-me-ku-pa-cartoon.jpg'),
  blackheart: require('../../assets/fantasy/necromancers/blackheart-cartoon.jpg'),
  ostokar: require('../../assets/fantasy/necromancers/ostokar-cartoon.jpg'),
  evilTroy: require('../../assets/fantasy/necromancers/evil-troy-cartoon.jpg'),
  queenMedea: require('../../assets/fantasy/necromancers/queen-medea-cartoon.jpg'),
  grin: require('../../assets/fantasy/necromancers/grin-cartoon.jpg'),
  erikSummoner: require('../../assets/fantasy/necromancers/erik-summoner-cartoon.jpg'),
  innsmouth: require('../../assets/fantasy/necromancers/innsmouth-cartoon.jpg'),
  faolan: require('../../assets/fantasy/necromancers/faolan-cartoon.jpg'),
  lordOfSkulls: require('../../assets/fantasy/necromancers/lord-of-skulls-cartoon.jpg'),
  spectralWalker: require('../../assets/fantasy/zombies/spectral-walker-cartoon.jpg'),
  ratz: require('../../assets/fantasy/zombies/ratz-cartoon.jpg'),
  ratKing: require('../../assets/fantasy/necromancers/rat-king-cartoon.jpg'),
  swampTroll: require('../../assets/fantasy/abominations/swamp-troll-cartoon.jpg'),
  necromanticDragon: require('../../assets/fantasy/abominations/necromantic-dragon-cartoon.jpg'),
  wdWalker: require('../../assets/fantasy/zombies/wd-walker-cartoon.jpg'),
  wdRunner: require('../../assets/fantasy/zombies/wd-runner-cartoon.jpg'),
  wdBrute: require('../../assets/fantasy/zombies/wd-brute-cartoon.jpg'),
  khanAbomination: require('../../assets/fantasy/abominations/khan-abomination-cartoon.jpg'),
  defilerNecromancer: require('../../assets/fantasy/necromancers/defiler-necromancer-cartoon.jpg'),
  eeWalker: require('../../assets/fantasy/zombies/ee-walker-cartoon.jpg'),
  eeRunner: require('../../assets/fantasy/zombies/ee-runner-cartoon.jpg'),
  eeBrute: require('../../assets/fantasy/zombies/ee-brute-cartoon.jpg'),
  godEaterAbomination: require('../../assets/fantasy/abominations/god-eater-abomination-cartoon.jpg'),
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
  deadboltWalker: require('../../assets/fantasy/zombies/deadbolt-walker-cartoon.jpg'),
  terrorcottaWalker: require('../../assets/fantasy/zombies/terrorcotta-walker-cartoon.jpg'),
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
  // Stand-in: only named in a card footer, never drawn.
  wardenBrute: require('../../assets/fantasy/zombies/fantasy-fatty-cartoon.jpg'),
  fantasyWalker: require('../../assets/fantasy/zombies/fantasy-walker-cartoon.jpg'),
  fantasyRunner: require('../../assets/fantasy/zombies/fantasy-runner-cartoon.jpg'),
  fantasyFatty: require('../../assets/fantasy/zombies/fantasy-fatty-cartoon.jpg'),
  fantasyAbomination: require('../../assets/fantasy/abominations/fantasy-abomination-cartoon.jpg'),
  orcWalker: require('../../assets/fantasy/zombies/orc-walker-cartoon.jpg'),
  orcRunner: require('../../assets/fantasy/zombies/orc-runner-cartoon.jpg'),
  orcFatty: require('../../assets/fantasy/zombies/orc-fatty-cartoon.jpg'),
  orcAbomination: require('../../assets/fantasy/abominations/orc-abomination-cartoon.jpg'),
  necromancer: require('../../assets/fantasy/necromancers/necromancer-cartoon.jpg'),
  orcNecromancer: require('../../assets/fantasy/necromancers/orc-necromancer-cartoon.jpg'),
};

const INVADER_ART: Record<InvaderXeno | InvaderAbomination, ImageSourcePropType> = {
  worker: require('../../assets/invader/zombies/xeno-worker-cartoon.jpg'),
  tank: require('../../assets/invader/zombies/xeno-tank-cartoon.jpg'),
  hunter: require('../../assets/invader/zombies/xeno-hunter-cartoon.jpg'),
  spoilerAbomination: require('../../assets/invader/abominations/spoiler-abomination-cartoon.jpg'),
  drillerWorker: require('../../assets/invader/zombies/driller-worker-cartoon.jpg'),
  drillerTank: require('../../assets/invader/zombies/driller-tank-cartoon.jpg'),
  drillerHunter: require('../../assets/invader/zombies/driller-hunter-cartoon.jpg'),
  drillerAbomination: require('../../assets/invader/abominations/driller-abomination-cartoon.jpg'),
  drillerBlitzer: require('../../assets/invader/zombies/driller-blitzer-cartoon.jpg'),
  flinger: require('../../assets/invader/zombies/flinger-cartoon.jpg'),
  seekerWorker: require('../../assets/invader/zombies/seeker-worker-cartoon.jpg'),
  xenomoth: require('../../assets/invader/zombies/xenomoth-cartoon.jpg'),
  biter: require('../../assets/invader/zombies/biter-cartoon.jpg'),
  juggernaut: require('../../assets/invader/abominations/juggernaut-abomination-cartoon.jpg'),
  babyface: require('../../assets/invader/abominations/babyface-abomination-cartoon.jpg'),
  buddyBot: require('../../assets/invader/abominations/buddybot-abomination-cartoon.jpg'),
  irisSentryGun: require('../../assets/invader/abominations/iris-sentry-gun-abomination-cartoon.jpg'),
  motherInLaw: require('../../assets/invader/abominations/mother-in-law-abomination-cartoon.jpg'),
  shadow: require('../../assets/invader/abominations/shadow-abomination-cartoon.jpg'),
  stomper: require('../../assets/invader/abominations/stomper-abomination-cartoon.jpg'),
  widowmaker: require('../../assets/invader/abominations/widowmaker-abomination-cartoon.jpg'),
  broodMother: require('../../assets/invader/abominations/brood-mother-abomination-cartoon.jpg'),
  xeniumHorror: require('../../assets/invader/abominations/xenium-horror-abomination-cartoon.jpg'),
  thraex: require('../../assets/invader/abominations/thraex-abomination-cartoon.jpg'),
  gutslug: require('../../assets/invader/abominations/gutslug-abomination-cartoon.jpg'),
  stepmother: require('../../assets/invader/abominations/stepmother-abomination-cartoon.jpg'),
  shaila: require('../../assets/invader/abominations/shaila-abomination-cartoon.jpg'),
  dimbutcher: require('../../assets/invader/abominations/dimbutcher-abomination-cartoon.jpg'),
  synkrasis: require('../../assets/invader/abominations/synkrasis-cartoon.jpg'),
  cyborgEddieAbomination: require('../../assets/invader/abominations/cyborg-eddie-abomination-cartoon.jpg'),
  samuraiEddieAbomination: require('../../assets/invader/abominations/samurai-eddie-abomination-cartoon.jpg'),
  bassistEddieAbomination: require('../../assets/invader/abominations/bassist-eddie-abomination-cartoon.jpg'),
  bountyHunterEddieAbomination: require('../../assets/invader/abominations/bounty-hunter-eddie-abomination-cartoon.jpg'),
};

/*
 * The pictures of the Invader cards: the official Zombicide Xeno renders (zombicide.com, cut inside their frame, the
 * logo rubbed out) or, for the Xenos the site has no render of, the art of the printed card cut to the picture. They are
 * padded to the shape of the picture window of a card (a Xeno one is portrait, an Abomination one landscape). A subject
 * with no entry here (Biters, Dim Butcher, the four Eddies: no official picture to cut) keeps its drawn illustration.
 */
const INVADER_OFFICIAL: Partial<Record<InvaderXeno | InvaderAbomination, ImageSourcePropType>> = {
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
  stepmother: require('../../assets/invader/abominations/stepmother-abomination-official.jpg'), // cut from the printed card
  shaila: require('../../assets/invader/abominations/shaila-abomination-official.jpg'), // cut from the printed card
  synkrasis: require('../../assets/invader/abominations/synkrasis-official.jpg'), // cut from the printed card
};
/** The official picture of an Invader Xeno or Abomination for its card, if it has one. */
export const invaderOfficialArt = (subject: InvaderXeno | InvaderAbomination) => INVADER_OFFICIAL[subject];

const WESTERN_HEROES: Record<Exclude<WesternSubject, WesternAbomination>, ImageSourcePropType> = {
  westernWalker: require('../../assets/western/zombies/walker-hero.jpg'),
  westernRunner: require('../../assets/western/zombies/runner-hero.jpg'),
  westernBrute: require('../../assets/western/zombies/brute-hero.jpg'),
};

const ART: Record<Exclude<ArtSubject, WesternAbomination>, ImageSourcePropType> = { ...MODERN_ART, ...FANTASY_ART, ...INVADER_ART, ...WESTERN_HEROES };

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

/**
 * The picture window of each named Western Abomination, cut from its printed card (the rest of the card is the app's
 * plank and rule panel). `ratio` is the window's own width over height, kept between 1.25 and 1.75 (the printed
 * window grows or shrinks with the length of the rule).
 */
const WESTERN_WINDOWS: Record<WesternAbomination, { source: ImageSourcePropType; ratio: number }> = {
  bowlerHat: { source: require('../../assets/western/abominations/bowler-hat-window.jpg'), ratio: 1.25 },
  nightmareHorse: { source: require('../../assets/western/abominations/nightmare-horse-window.jpg'), ratio: 1.25 },
  abominape: { source: require('../../assets/western/abominations/abominape-window.jpg'), ratio: 1.463 },
  crocosaur: { source: require('../../assets/western/abominations/crocosaur-window.jpg'), ratio: 1.456 },
  abominabear: { source: require('../../assets/western/abominations/abominabear-window.jpg'), ratio: 1.25 },
  texasDeadhorn: { source: require('../../assets/western/abominations/texas-deadhorn-window.jpg'), ratio: 1.25 },
  bizon: { source: require('../../assets/western/abominations/bizon-window.jpg'), ratio: 1.25 },
  bloodBull: { source: require('../../assets/western/abominations/blood-bull-window.jpg'), ratio: 1.25 },
  littleTrickster: { source: require('../../assets/western/abominations/little-trickster-window.jpg'), ratio: 1.565 },
  goreGeyser: { source: require('../../assets/western/abominations/gore-geyser-window.jpg'), ratio: 1.75 },
  meltingPot: { source: require('../../assets/western/abominations/melting-pot-window.jpg'), ratio: 1.548 },
  plymouthHound: { source: require('../../assets/western/abominations/plymouth-hound-window.jpg'), ratio: 1.628 },
  pusbag: { source: require('../../assets/western/abominations/pusbag-window.jpg'), ratio: 1.524 },
  greatTrickster: { source: require('../../assets/western/abominations/great-trickster-window.jpg'), ratio: 1.75 },
  cactusQueen: { source: require('../../assets/western/abominations/cactus-queen-window.jpg'), ratio: 1.438 },
  alphaBane: { source: require('../../assets/western/abominations/alpha-bane-window.jpg'), ratio: 1.25 },
  deathgrasp: { source: require('../../assets/western/abominations/deathgrasp-window.jpg'), ratio: 1.524 },
  fatMace: { source: require('../../assets/western/abominations/fat-mace-window.jpg'), ratio: 1.25 },
  swampTongue: { source: require('../../assets/western/abominations/swamp-tongue-window.jpg'), ratio: 1.524 },
  rottenClaw: { source: require('../../assets/western/abominations/rotten-claw-window.jpg'), ratio: 1.602 },
  westernWendigo: { source: require('../../assets/western/abominations/wendigo-window.jpg'), ratio: 1.317 },
  // No scan of this card: the official art, cut to its window.
  steamMonster: { source: require('../../assets/western/abominations/steam-monster-window.jpg'), ratio: 1.448 },
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
  'cyborgEddieAbomination', 'samuraiEddieAbomination', 'bassistEddieAbomination', 'bountyHunterEddieAbomination',
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
  const source = isWesternBoss(subject) ? WESTERN_WINDOWS[subject].source : ART[subject];
  // The Western heroes are cut for their panel: cover, whatever its shape.
  if ((isWesternBoss(subject) || subject in WESTERN_HEROES) && anchor !== 'full') return <Image source={source} style={styles.fullFigure} resizeMode="cover" />;
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
