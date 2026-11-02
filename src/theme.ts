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
};

export const DANGER_COLORS:Record<DangerLevel, { background: string; text: string }> = {
  blue: { background: '#2f6fb5', text: '#ffffff' },
  yellow: { background: '#e8c53a', text: '#1b1a15' },
  orange: { background: '#e5822b', text: '#1b1a15' },
  red: { background: '#c8372d', text: '#ffffff' },
};
