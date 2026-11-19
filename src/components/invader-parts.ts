import type { ImageSourcePropType } from 'react-native';

/**
 * Blank card parts drawn by hand (briefs in docs/art/invader-card-parts-prompts.md), to take the place of the metal and
 * the plates the app draws itself. A part with no entry here keeps the drawn fallback, so the card works with none of
 * them (and with only some).
 *
 * TO SWITCH ONE ON: put its file in assets/invader/cards/ and uncomment its line. They stay commented because a
 * `require` of a file that does not exist breaks the whole bundle.
 */
export const INVADER_PARTS: Partial<Record<'frame' | 'titlePlate' | 'numberBadge' | 'countTab' | 'textBox' | 'hazardBand' | 'background', ImageSourcePropType>> = {
  // frame: require('../../assets/invader/cards/frame.png'), // 900x1257: metal border, transparent in the middle
  // titlePlate: require('../../assets/invader/cards/title-plate.png'), // 760x190: red plate with its hazard strip
  // numberBadge: require('../../assets/invader/cards/number-badge.png'), // 170x110: orange tag
  // countTab: require('../../assets/invader/cards/count-tab.png'), // 520x150: white, tinted with the Danger Level colour
  // textBox: require('../../assets/invader/cards/text-box.png'), // 760x330: dark red rule box
  // hazardBand: require('../../assets/invader/cards/hazard-band.png'), // 860x110: bottom band
  // background: require('../../assets/invader/cards/background.jpg'), // 900x1257: navy grid behind the picture
};

/** Share of the count tab's width that its hexagon takes (the number is written there, the bar runs on to the edge of the card). */
export const COUNT_TAB_HEXAGON = 0.29;
