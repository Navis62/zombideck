import type { DangerLevel } from '@/game/types';

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
};

/** Wild West era (Undead or Alive): saddle leather and dusty ochre; a plain first look, to be designed. */
export const WESTERN_COLORS = {
  header: { background: '#4a2c17', text: '#f6e8c8' },
  /** Card stock. */
  face: '#b9803f',
  /** Panel beside the picture, under the counts. */
  panel: '#4a2c17',
  /** Border: leather with ochre stripes. */
  hazardBase: '#4a2c17',
  hazardStripe: '#d49a4a',
};

export const DANGER_COLORS: Record<DangerLevel, { background: string; text: string }> = {
  blue: { background: '#2f6fb5', text: '#ffffff' },
  yellow: { background: '#e8c53a', text: '#1b1a15' },
  orange: { background: '#e5822b', text: '#1b1a15' },
  red: { background: '#c8372d', text: '#ffffff' },
};

/** Feedback under the finger for every button. */
export const PRESSED = { opacity: 0.7 };
