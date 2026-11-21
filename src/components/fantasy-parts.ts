import type { ImageSourcePropType } from 'react-native';

import type { DangerLevel } from '@/game/types';

export type FantasyPart = 'parchment' | 'titlePlate' | 'numberBar' | 'levelRow' | 'textScroll' | 'artBackground';

/**
 * Blank parts of the printed Black Plague Zombie card (briefs in docs/art/fantasy-card-parts-prompts.md), layered by
 * `FantasyFace` over the parchment, plates and flames it draws itself. (`frame.png` is not used: the printed card has no frame all round.) A part with no entry keeps its
 * drawn fallback, so the card works with none of them.
 *
 * A new part: put its file in assets/fantasy/cards/ and add its line (a `require` of a file that does not exist breaks
 * the whole bundle). The layout (the FANTASY_* constants in card-face.tsx) uses each at the ratio of its file: the plate,
 * the bar and the flames are sized by width, so a file of another ratio only needs those constants changed.
 */
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
