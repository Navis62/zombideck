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
  parchment: '#efe3c6',
  parchmentRow: '#f8f0dc',
  parchmentInk: '#3b2a1a',
  fantasyFrame: '#8f1d1d',
  horde: '#2f7d3a',
};

export const MODERN_COLORS = {
  spawn: { background: '#0b0b0b', text: '#ffffff' },
  rush: { background: '#fed000', text: '#0b0b0b' },
  extra: { background: '#db121a', text: '#0b0b0b' },
  abomination: { background: '#0b0b0b', text: '#fed000' },
  paper: '#ffffff',
  paperInk: '#0b0b0b',
  labelShadow: '#0b0b0b',
  levels: { red: '#dc0f20', orange: '#e87c00', yellow: '#fed100', blue: '#4594b2' } satisfies Record<DangerLevel, string>,
};

/** Drawn fallbacks for the parts missing from `fantasy-parts.ts`. */
export const FANTASY_COLORS = {
  plate: '#f3e9cf',
  plateEdge: '#8a6f4a',
  row: '#f1e6cb',
  rowEdge: '#a38a63',
  iron: '#4b4a50',
  ironLight: '#a9a8ad',
  ironPlate: '#e9e1cc',
  silhouette: '#6f604d',
  smokeDark: '#3a0c0a',
  frameEdge: '#5e1010',
  edge: '#f1e8d2',
  dim: 'rgba(59, 42, 26, 0.09)',
  flameInk: '#3b2a1a',
};

export const FANTASY_FONT_FILES = {
  'Almendra-Bold': require('../assets/fantasy/fonts/Almendra-Bold.ttf'),
  'Almendra-BoldItalic': require('../assets/fantasy/fonts/Almendra-BoldItalic.ttf'),
} as const;

export type FantasyFonts = { title: string; name: string; count: string; italic: 'normal' | 'italic' };

// Almendra's old-style figures read "x1" as "XI", so counts always use PT Serif.
export const fantasyFonts = (language: Language): FantasyFonts => {
  if (CYRILLIC.includes(language)) return { title: 'PTSerif-Bold', name: 'PTSerif-Bold', count: 'PTSerif-Bold', italic: 'italic' };
  if (LATIN_EXTENDED.includes(language)) return { title: 'ZillaSlab-Bold', name: 'ZillaSlab-Bold', count: 'PTSerif-Bold', italic: 'italic' };
  return { title: 'Almendra-Bold', name: 'Almendra-BoldItalic', count: 'PTSerif-Bold', italic: 'normal' };
};

export const INVADER_COLORS = {
  header: { background: '#0d2230', text: '#e8f6fa' },
  face: '#2a7f95',
  panel: '#0d2230',
  hazardBase: '#0d2230',
  hazardStripe: '#2fb5c4',
  hazardAlert: '#e5261f',
  backdrop: '#4a0d12',
  tabShadow: '#111820',
  ruleInk: '#ffe3e0',
  plateInk: '#ffffff',
  badgeInk: '#ffffff',
  tabInk: '#ffffff',
};

export const WESTERN_COLORS = {
  header: { background: '#e0b072', text: '#1f1208' },
  inkGlow: 'rgba(255, 238, 205, 0.75)',
  face: '#b9803f',
  panel: '#d9a866',
  plankDark: '#8a5a2b',
  grain: '#a9763a',
  brush: '#b3261a',
  paper: '#f4ead3',
  paperInk: '#3a2410',
  labelEdge: '#6b4a24',
  hazardBase: '#3b2412',
  hazardStripe: '#c8924d',
  hazardAlert: '#b3261a',
};

// Fonts are SIL OFL, loaded at runtime. Rye lacks Polish/Czech accents and Cyrillic; Zilla Slab has all Latin; PT Serif has Cyrillic.
export const WESTERN_FONT_FILES = {
  Rye: require('../assets/western/fonts/Rye-Regular.ttf'),
  'ZillaSlab-Bold': require('../assets/western/fonts/ZillaSlab-Bold.ttf'),
  'ZillaSlab-SemiBold': require('../assets/western/fonts/ZillaSlab-SemiBold.ttf'),
  'PTSerif-Bold': require('../assets/western/fonts/PTSerif-Bold.ttf'),
} as const;

export type WesternFonts = { title: string; count: string; text: string };

const CYRILLIC: readonly Language[] = ['ru', 'uk'];
// Rye and Almendra lack the Polish and Czech letters.
const LATIN_EXTENDED: readonly Language[] = ['pl', 'cs'];

export const westernFonts = (language: Language): WesternFonts => {
  if (CYRILLIC.includes(language)) return { title: 'PTSerif-Bold', count: 'PTSerif-Bold', text: 'PTSerif-Bold' };
  return { title: LATIN_EXTENDED.includes(language) ? 'ZillaSlab-Bold' : 'Rye', count: 'ZillaSlab-Bold', text: 'ZillaSlab-SemiBold' };
};

// Barlow Condensed has no Cyrillic: Russian and Ukrainian use Play.
export const INVADER_FONT_FILES = {
  'BarlowCondensed-Bold': require('../assets/invader/fonts/BarlowCondensed-Bold.ttf'),
  'BarlowCondensed-Medium': require('../assets/invader/fonts/BarlowCondensed-Medium.ttf'),
  'Play-Bold': require('../assets/invader/fonts/Play-Bold.ttf'),
} as const;

export type InvaderFonts = { title: string; count: string; text: string };

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

export const PRESSED = { opacity: 0.7 };
