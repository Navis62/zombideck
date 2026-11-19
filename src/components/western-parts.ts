import type { ImageSourcePropType } from 'react-native';

/**
 * Blank card parts drawn by hand (briefs in docs/art/western-prompts.md), to take the place of the wood and the paper
 * the app draws itself. A part with no entry here keeps the drawn fallback, so the card works with none of them.
 *
 * TO SWITCH ONE ON: put its file in assets/western/cards/ and uncomment its line. They stay commented because a
 * `require` of a file that does not exist breaks the whole bundle.
 */
export const WESTERN_PARTS: Partial<Record<'headerPlank' | 'footerPlank' | 'countLabel', ImageSourcePropType>> = {
  headerPlank: require('../../assets/western/cards/header-plank.png'), // 1200x260: title plank of a named Abomination card
  footerPlank: require('../../assets/western/cards/footer-plank.png'), // 1200x420: text plank under its picture
  countLabel: require('../../assets/western/cards/count-label.png'), // 360x150: cream torn label, white strip on the right
};

/** Share of the count label's width that is its white right strip: tinted with the Danger Level colour (`countLabel` only). */
export const COUNT_LABEL_STRIP = 0.14;
