import type { ImageSourcePropType } from 'react-native';

/**
 * Blank parts of the printed Modern (2nd Edition) card: the four title banners, the four footer bands and the two
 * white paper labels that carry the counts, layered by `ModernFace`. Briefs in docs/art/modern-card-parts-prompts.md.
 */
export const MODERN_PARTS = {
  headerSpawn: require('../../assets/modern/cards/header-spawn.png'),
  headerRush: require('../../assets/modern/cards/header-rush.png'),
  headerExtra: require('../../assets/modern/cards/header-extra.png'),
  headerAbomination: require('../../assets/modern/cards/header-abomination.png'),
  footerRush: require('../../assets/modern/cards/footer-rush.png'),
  footerExtra: require('../../assets/modern/cards/footer-extra.png'),
  footerAbomination: require('../../assets/modern/cards/footer-abomination.png'),
  /** The Abomination band with its dashes in white: the bottom of the SPAM text panel. */
  footerSpam: require('../../assets/modern/cards/footer-spam.png'),
  countPaper: require('../../assets/modern/cards/count-paper.png'),
  activationPaper: require('../../assets/modern/cards/activation-paper.png'),
} satisfies Record<string, ImageSourcePropType>;

/** Pixels of the files: the layout depends on these ratios (a part redrawn at another ratio needs them changed). */
export const MODERN_HEADER_SIZE = { width: 900, height: 300 };
export const MODERN_FOOTER_SIZE = {
  rush: { width: 900, height: 200 },
  extra: { width: 900, height: 200 },
  abomination: { width: 900, height: 340 },
};
/**
 * The empty middle of each footer, as shares of the file: the text goes there (the dashes are on the sides and along
 * the bottom edge).
 */
export const MODERN_FOOTER_TEXT = {
  rush: { left: 0.12, right: 0.12, top: 0.075, bottom: 0.3 },
  extra: { left: 0.12, right: 0.12, top: 0.075, bottom: 0.3 },
  abomination: { left: 0.12, right: 0.12, top: 0.044, bottom: 0.176 },
};

/**
 * The white paper labels: size of the file and the pixel where the plain white ends (the torn edge and its specks
 * follow, the rest is transparent). Only the plain part is stretched; the torn end keeps its ratio.
 */
export const MODERN_PAPER = {
  count: { width: 420, height: 150, solid: 249 },
  activation: { width: 760, height: 150, solid: 599 },
};
/** Pixels of plain white kept on the torn piece, to hide the seam where it meets the stretched white rectangle. */
export const MODERN_PAPER_SEAM = 40;
