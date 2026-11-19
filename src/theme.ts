import type { DangerLevel } from '@/game/types';
import type { Language } from '@/i18n/translations';

export const COLORS = {
  background: '#14130f',
  surface: '#23211b',
  border: '#3a372e',
  text: '#f2efe6',
  muted: '#a7a292',
  accent: '#c8372d',
  warning: '#e8b23a',
};

export const CARD_COLORS = {
  body: '#e9a93c',
  ink: '#1b1a15',
  back: '#1b1a15',
  spawn: { background: '#1b1a15', text: '#ffffff' },
  rush: { background: '#f4b71f', text: '#1b1a15' },
  extra: { background: '#e5261f', text: '#1b1a15' },
  /** Fantasy era: worn parchment, dark brown ink, a red frame, and the green Horde badge. */
  parchment: '#efe3c6',
  parchmentRow: '#f8f0dc',
  parchmentInk: '#3b2a1a',
  fantasyFrame: '#8f1d1d',
  horde: '#2f7d3a',
};

/** Sci-fi era (Invader, Dark Side): cold steel blue and teal, with the red of the warning lights. */
export const INVADER_COLORS = {
  header: { background: '#0d2230', text: '#e8f6fa' },
  /** Card stock. */
  face: '#2a7f95',
  /** Panel beside the picture, under the counts. */
  panel: '#0d2230',
  /** Border: dark steel with teal and red hazard stripes. */
  hazardBase: '#0d2230',
  hazardStripe: '#2fb5c4',
  hazardAlert: '#e5261f',
  /** The printed Invader card (brushed metal frame, dark red title plate and rule box, navy grid behind the Xeno). */
  metal: '#8a9097',
  metalLight: '#c3c8ce',
  metalDark: '#4a5057',
  /** Navy panel behind the picture. */
  background: '#0e1a2b',
  /** Title plate and rule box: dark crimson with a lighter edge. */
  plate: '#6a1118',
  plateEdge: '#b53a3f',
  plateInk: '#ffffff',
  /** Number badge under the title. */
  badge: '#e8892a',
  badgeRim: '#a8570f',
  badgeInk: '#ffffff',
  /** Hazard stripes of the plate and the bottom band. */
  stripeYellow: '#e6b52a',
  stripeBlack: '#1b1b1b',
  /** Ink on a Danger Level tab. */
  tabInk: '#ffffff',
};

/** Hexagon of each Danger Level tab on a printed Invader card: the tab colour, darkened. */
export const INVADER_TAB_DARK: Record<DangerLevel, string> = {
  blue: '#0e3a56',
  yellow: '#6e5509',
  orange: '#6e330c',
  red: '#611010',
};

/**
 * Wild West era (Undead or Alive), after the printed cards: a plank of light wood for the title and the rule, cream
 * torn paper for the counts, red brush strokes along the top, the picture filling the whole card.
 */
export const WESTERN_COLORS = {
  /** Title plank: its ink is the dark brown of the printed titles. */
  header: { background: '#e0b072', text: '#3a2410' },
  /** Card stock behind the picture. */
  face: '#b9803f',
  /** Plank of the rule box on the back, and of the footer on the front. */
  panel: '#d9a866',
  /** Darker plank: the frame round the rule box, the grain and the edge of a plank. */
  plankDark: '#8a5a2b',
  /** Grain lines on a plank. */
  grain: '#a9763a',
  /** Red brush stroke along the top of a header. */
  brush: '#b3261a',
  /** Cream torn-paper label of a count, and its ink. */
  paper: '#f4ead3',
  paperInk: '#3a2410',
  /** Dark edge on the left and underside of a count label. */
  labelEdge: '#6b4a24',
  /** Border of the app screens: dark wood, tan planks and a red stroke every fourth. */
  hazardBase: '#3b2412',
  hazardStripe: '#c8924d',
  hazardAlert: '#b3261a',
};

/**
 * Typefaces of the Western cards (`assets/western/fonts/`, SIL Open Font License, licences beside them), loaded at
 * runtime by the root layout: no native change, so an update can carry them. Rye is the printed titles' woodtype but has
 * no Polish or Czech accents and no Cyrillic; Zilla Slab has every Latin letter, PT Serif Cyrillic too.
 */
export const WESTERN_FONT_FILES = {
  Rye: require('../assets/western/fonts/Rye-Regular.ttf'),
  'ZillaSlab-Bold': require('../assets/western/fonts/ZillaSlab-Bold.ttf'),
  'ZillaSlab-SemiBold': require('../assets/western/fonts/ZillaSlab-SemiBold.ttf'),
  'PTSerif-Bold': require('../assets/western/fonts/PTSerif-Bold.ttf'),
} as const;

/** The three voices of a Western card: its title, its counts and labels, its rule text. */
export type WesternFonts = { title: string; count: string; text: string };

const CYRILLIC: readonly Language[] = ['ru', 'uk'];
/** Languages whose accents Rye does not have (the Polish and Czech ones). */
const NO_RYE: readonly Language[] = ['pl', 'cs'];

/** The font of each part of a Western card in the player's language, the first one that has all its letters. */
export const westernFonts = (language: Language): WesternFonts => {
  if (CYRILLIC.includes(language)) return { title: 'PTSerif-Bold', count: 'PTSerif-Bold', text: 'PTSerif-Bold' };
  return { title: NO_RYE.includes(language) ? 'ZillaSlab-Bold' : 'Rye', count: 'ZillaSlab-Bold', text: 'ZillaSlab-SemiBold' };
};

/**
 * Typefaces of the Invader cards (`assets/invader/fonts/`, SIL Open Font License, licences beside them), loaded with the
 * Western ones by the root layout. Barlow Condensed is close to the printed titles and has every Latin letter the ten
 * languages use; it has no Cyrillic, so Russian and Ukrainian use Play (a squarer sci-fi face with Cyrillic).
 */
export const INVADER_FONT_FILES = {
  'BarlowCondensed-Bold': require('../assets/invader/fonts/BarlowCondensed-Bold.ttf'),
  'BarlowCondensed-Medium': require('../assets/invader/fonts/BarlowCondensed-Medium.ttf'),
  'Play-Bold': require('../assets/invader/fonts/Play-Bold.ttf'),
} as const;

/** The three voices of an Invader card: its title, its counts and number, its rule text. */
export type InvaderFonts = { title: string; count: string; text: string };

/** The font of each part of an Invader card in the player's language. */
export const invaderFonts = (language: Language): InvaderFonts =>
  CYRILLIC.includes(language)
    ? { title: 'Play-Bold', count: 'Play-Bold', text: 'Play-Bold' }
    : { title: 'BarlowCondensed-Bold', count: 'BarlowCondensed-Bold', text: 'BarlowCondensed-Medium' };

export const DANGER_COLORS: Record<DangerLevel, { background: string; text: string }> = {
  blue: { background: '#2f6fb5', text: '#ffffff' },
  yellow: { background: '#e8c53a', text: '#1b1a15' },
  orange: { background: '#e5822b', text: '#1b1a15' },
  red: { background: '#c8372d', text: '#ffffff' },
};

/** Feedback under the finger for every button. */
export const PRESSED = { opacity: 0.7 };
