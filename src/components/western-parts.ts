import type { ImageSourcePropType } from 'react-native';

// Briefs: docs/art/western-prompts.md. A part with no entry keeps its drawn fallback.
// A `require` of a missing file breaks the whole bundle, so add a line only with its file.
export const WESTERN_PARTS: Partial<Record<'headerPlank' | 'footerPlank' | 'countLabel', ImageSourcePropType>> = {
  headerPlank: require('../../assets/western/cards/header-plank.png'), // 1200x260: title plank of a named Abomination card
  footerPlank: require('../../assets/western/cards/footer-plank.png'), // 1200x420: text plank under its picture
  countLabel: require('../../assets/western/cards/count-label.png'), // 360x150: cream torn label, white strip on the right
};

/** Share of `countLabel`'s width that is its white right strip, tinted with the Danger Level colour. */
export const COUNT_LABEL_STRIP = 0.14;
