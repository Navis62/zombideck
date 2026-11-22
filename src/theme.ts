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

/** The printed Modern (2nd Edition) card: banner colours with the ink of their title, the paper labels and the level colours behind them. */
export const MODERN_COLORS = {
  spawn: { background: '#0b0b0b', text: '#ffffff' },
  rush: { background: '#fed000', text: '#0b0b0b' },
  extra: { background: '#db121a', text: '#0b0b0b' },
  abomination: { background: '#0b0b0b', text: '#fed000' },
  /** The white of the count labels (the picture is pure white, so a colour laid behind it shows through its torn end). */
  paper: '#ffffff',
  paperInk: '#0b0b0b',
  /** The thin dark line under each label. */
  labelShadow: '#0b0b0b',
  levels: { red: '#dc0f20', orange: '#e87c00', yellow: '#fed100', blue: '#4594b2' } satisfies Record<DangerLevel, string>,
};

/** The drawn stand-ins of the printed Fantasy card, used where a part picture (`fantasy-parts.ts`) is absent. */
export const FANTASY_COLORS = {
  /** Title plate: lighter parchment with its thin brown outline. */
  plate: '#f3e9cf',
  plateEdge: '#8a6f4a',
  /** Strip behind a Danger Level row, and its outline. */
  row: '#f1e6cb',
  rowEdge: '#a38a63',
  /** Iron number bar, its riveted rings and the plate holding the number. */
  iron: '#4b4a50',
  ironLight: '#a9a8ad',
  ironPlate: '#e9e1cc',
  /** The faded stamp of a zombie on its row. */
  silhouette: '#6f604d',
  /** Behind the picture of a special card while the red smoke part is absent. */
  smokeDark: '#3a0c0a',
  /** Worn edge of the card under the red border. */
  frameEdge: '#5e1010',
  /** Thin light edge of the card, like the cut edge of a printed one. */
  edge: '#f1e8d2',
  /** Veil over the Danger Levels the players are not at, so the current one stands out without any box. */
  dim: 'rgba(59, 42, 26, 0.09)',
  /** Painted flames: the dark ink stroke round the colour. */
  flameInk: '#3b2a1a',
};

/**
 * Typefaces of the Fantasy cards (`assets/fantasy/fonts/`, SIL Open Font License), loaded with the others by the root
 * layout. Almendra is a rounded calligraphic face close to the printed titles; it covers the French, German, Spanish, Italian
 * and Portuguese letters but no Polish or Czech ones and no Cyrillic: Polish and Czech use Zilla Slab, Russian and Ukrainian PT Serif.
 */
export const FANTASY_FONT_FILES = {
  'Almendra-Bold': require('../assets/fantasy/fonts/Almendra-Bold.ttf'),
  'Almendra-BoldItalic': require('../assets/fantasy/fonts/Almendra-BoldItalic.ttf'),
} as const;

/**
 * The voices of a Fantasy card: title, zombie name and rule (`italic` is the style the names need), count and number. The
 * count and the number use PT Serif whatever the language: Almendra's old-style figures read "x1" as "XI".
 */
export type FantasyFonts = { title: string; name: string; count: string; italic: 'normal' | 'italic' };

/** The font of each part of a Fantasy card in the player's language. */
export const fantasyFonts = (language: Language): FantasyFonts => {
  if (CYRILLIC.includes(language)) return { title: 'PTSerif-Bold', name: 'PTSerif-Bold', count: 'PTSerif-Bold', italic: 'italic' };
  // Almendra has no Polish or Czech letters (ą ę ś ż č ě š ž ...): those two use Zilla Slab, as the Western cards do.
  if (NO_RYE.includes(language)) return { title: 'ZillaSlab-Bold', name: 'ZillaSlab-Bold', count: 'PTSerif-Bold', italic: 'italic' };
  return { title: 'Almendra-Bold', name: 'Almendra-BoldItalic', count: 'PTSerif-Bold', italic: 'normal' };
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
  /** The printed Invader card: dark red behind the picture, tinting the navy grid of the background part. */
  backdrop: '#4a0d12',
  /** Shadow of the count on its tab, and light red ink of a rule in its box. */
  tabShadow: '#111820',
  ruleInk: '#ffe3e0',
  /** Ink of the title and of the number badge. */
  plateInk: '#ffffff',
  badgeInk: '#ffffff',
  /** Ink on a Danger Level tab. */
  tabInk: '#ffffff',
};

/**
 * Wild West era (Undead or Alive), after the printed cards: a plank of light wood for the title and the rule, cream
 * torn paper for the counts, red brush strokes along the top, the picture filling the whole card.
 */
export const WESTERN_COLORS = {
  /** Title plank: its ink is the dark brown of the printed titles. */
  header: { background: '#e0b072', text: '#1f1208' },
  /** Cream halo round that ink, so it stands out from the grain of the plank picture. */
  inkGlow: 'rgba(255, 238, 205, 0.75)',
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
