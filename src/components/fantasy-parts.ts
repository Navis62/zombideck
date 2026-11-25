import type { ImageSourcePropType } from 'react-native';

import type { DangerLevel } from '@/game/types';

export type FantasyPart = 'parchment' | 'titlePlate' | 'numberBar' | 'levelRow' | 'textScroll' | 'artBackground';

// Briefs: docs/art/fantasy-card-parts-prompts.md. A part with no entry keeps its drawn fallback.
// A `require` of a missing file breaks the whole bundle, so add a line only with its file.
// The FANTASY_* layout constants in card-face.tsx assume each file's ratio.
export const FANTASY_PARTS: Partial<Record<FantasyPart, ImageSourcePropType>> = {
  parchment: require('../../assets/fantasy/cards/parchment.jpg'), // 720x1006 JPEG (same master): the card body, its red border already painted on it
  titlePlate: require('../../assets/fantasy/cards/title-plate.png'), // 820x200, sized by width (ratio 4.1)
  numberBar: require('../../assets/fantasy/cards/number-bar.png'), // 420x70: thick iron bar, a ring at each end, the plate in the middle holds the number
  levelRow: require('../../assets/fantasy/cards/level-row.png'), // 820x200: parchment strip with torn ends, no flame
  textScroll: require('../../assets/fantasy/cards/text-scroll.png'), // 820x300: scroll with a curled roll at each end
  artBackground: require('../../assets/fantasy/backgrounds/crimson-ruins-backdrop.jpg'), // 950x800 JPEG behind special card art
};

/** The flame at the left of a Danger Level row, one file per level; none means the drawn flame. */
export const FANTASY_FLAMES: Partial<Record<DangerLevel, ImageSourcePropType>> = {
  red: require('../../assets/fantasy/cards/flame-red.png'), // 260x200 each (ratio 1.3), fading to the right
  orange: require('../../assets/fantasy/cards/flame-orange.png'),
  yellow: require('../../assets/fantasy/cards/flame-yellow.png'),
  blue: require('../../assets/fantasy/cards/flame-blue.png'),
};
