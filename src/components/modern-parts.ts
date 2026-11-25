import type { ImageSourcePropType } from 'react-native';

// Briefs: docs/art/modern-card-parts-prompts.md.
export const MODERN_PARTS = {
  headerSpawn: require('../../assets/modern/cards/header-spawn.png'),
  headerRush: require('../../assets/modern/cards/header-rush.png'),
  headerExtra: require('../../assets/modern/cards/header-extra.png'),
  headerAbomination: require('../../assets/modern/cards/header-abomination.png'),
  footerRush: require('../../assets/modern/cards/footer-rush.png'),
  footerExtra: require('../../assets/modern/cards/footer-extra.png'),
  footerAbomination: require('../../assets/modern/cards/footer-abomination.png'),
  footerSpam: require('../../assets/modern/cards/footer-spam.png'),
  countPaper: require('../../assets/modern/cards/count-paper.png'),
  activationPaper: require('../../assets/modern/cards/activation-paper.png'),
} satisfies Record<string, ImageSourcePropType>;

// File sizes in px: the layout depends on these ratios.
export const MODERN_HEADER_SIZE = { width: 900, height: 300 };
export const MODERN_FOOTER_SIZE = {
  rush: { width: 900, height: 200 },
  extra: { width: 900, height: 200 },
  abomination: { width: 900, height: 340 },
};
/** Empty middle of each footer, as shares of the file: where the text goes. */
export const MODERN_FOOTER_TEXT = {
  rush: { left: 0.12, right: 0.12, top: 0.075, bottom: 0.3 },
  extra: { left: 0.12, right: 0.12, top: 0.075, bottom: 0.3 },
  abomination: { left: 0.12, right: 0.12, top: 0.044, bottom: 0.176 },
};

/** Paper label file size and the px where its plain white ends; only the plain part is stretched. */
export const MODERN_PAPER = {
  count: { width: 420, height: 150, solid: 249 },
  activation: { width: 760, height: 150, solid: 599 },
};
/** Plain white px kept on the torn piece to hide the seam with the stretched rectangle. */
export const MODERN_PAPER_SEAM = 40;
