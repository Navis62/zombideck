import type { ImageSourcePropType } from 'react-native';

// Briefs: docs/art/invader-card-parts-prompts.md.
export const INVADER_PARTS = {
  frame: require('../../assets/invader/cards/frame.png'),
  titlePlate: require('../../assets/invader/cards/title-plate.png'),
  numberBadge: require('../../assets/invader/cards/number-badge.png'),
  countTab: require('../../assets/invader/cards/count-tab.png'),
  textBox: require('../../assets/invader/cards/text-box.png'),
  hazardBand: require('../../assets/invader/cards/hazard-band.png'),
  background: require('../../assets/invader/cards/background.jpg'),
} satisfies Record<string, ImageSourcePropType>;

export const COUNT_TAB_HEXAGON = '29%';
