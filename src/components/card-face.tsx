import { createContext, useContext, useMemo, useState } from 'react';
import { Image, type ImageSourcePropType, type ImageStyle, type LayoutChangeEvent, Platform, Pressable, ScrollView, type StyleProp, StyleSheet, Text, type TextStyle, View, type ViewStyle } from 'react-native';
import Svg, { Path, Polygon } from 'react-native-svg';

import { COUNT_TAB_HEXAGON, INVADER_PARTS } from '@/components/invader-parts';
import { SCROLL_TRACKING } from '@/components/scroll-guard';
import { COUNT_LABEL_STRIP, WESTERN_PARTS } from '@/components/western-parts';
import { type ArtSubject, artSubject, westernCardArt, westernTextCardArt, westernWindow, ZombieFigure } from '@/components/zombie-art';
import { ABOMINATIONS, BOSS_RULE_IDS, type BossRuleId, NAMED_NECROMANCERS, NAMED_ZOMBIES, PLAIN_RULE_NECROMANCERS } from '@/data/fantasy';
import { type BossName, isBossName, isModernAbomination, isWesternAbomination } from '@/data/threat';
import { DANGER_LEVELS } from '@/game/engine';
import { useApp } from '@/game/store';
import {
  type BossKind,
  type BossRule,
  type DangerLevel,
  type ExtraZombie,
  type FantasyCard,
  type FantasyLevel,
  type FantasyNecromancer,
  type InvaderAbomination,
  type InvaderCard,
  type InvaderXeno,
  type NamedModernAbomination,
  type NamedNecromancer,
  type UniverseId,
  type WesternAbomination,
  type WesternActivated,
  type WesternCard,
  isFantasyCard,
  isInvaderCard,
  isWesternCard,
  NO_BOSS,
  NO_DECK,
  type ModernCard,
  type ZombieCard,
  type ZombieType,
} from '@/game/types';
import type { Translate, TranslationKey } from '@/i18n/translations';
import { CARD_COLORS, DANGER_COLORS, INVADER_COLORS, PRESSED, WESTERN_COLORS, invaderFonts, westernFonts } from '@/theme';

// Printed top-down on the cards, red first.
const PRINTED_LEVELS = [...DANGER_LEVELS].reverse();

/*
 * The Western cards are the printed cards, scanned (see `westernCardArt`); the app writes over them, at the place and
 * size of the printed text. Every position below was measured on the scans, as a share of the card's width (x) or
 * height (y): the cards are all 311 x 478 px on the sheet, and the counts sit at the same place on every one.
 */
/** Count labels: top of the first (red) one, height, and distance from one label to the next (y). */
const WESTERN_LABEL_TOP = 0.274;
const WESTERN_LABEL_HEIGHT = 0.115;
const WESTERN_LABEL_PITCH = 0.14;
/** Left edge of the labels (x): the counts of a spawn card, then the longer "All Walkers" of an Extra Activation card. */
const WESTERN_LABEL_LEFT = { spawn: 0.666, extra: 0.447 } as const;
/** How far the hand-drawn count label (`WESTERN_PARTS.countLabel`) overlaps the printed one, left of it and above and below (shares of the card). */
const WESTERN_LABEL_BLEED = { x: 0.008, y: 0.006 };
/** The only label of the current Danger Level, as many times the printed one's height. */
const WESTERN_CURRENT_LABEL = 1.25;
/** Where the cream paper of a label ends and its coloured strip starts (x); the strip runs off the card's edge. */
const WESTERN_PAPER_END = 0.875;
/**
 * What is written on the plank (or panel) of each kind of card: the title box (y of its top and height, x of its left
 * edge and width) with its underlines (y of their top and height), the number, and the rule text under the card.
 */
type WesternLayout = {
  /** The plank behind the title, measured on the scans (y of its bottom edge, as a share of the card's height). */
  plank: { part: 'header' | 'footer'; top: number; bottom: number };
  title: { top: number; height: number; left: number; width: number };
  /** The title is centred (the heading of the text card) rather than flush left. */
  centered?: boolean;
  /** A two-line title in the red ink of the Extra Activation cards. */
  extra?: boolean;
};
/**
 * The header plank of the spawn cards ends at 18.5 % of the card (its wavy lower edge), the Extra Activation one, which
 * holds two lines, at 21.5 %; the title sits between the plank's red stroke (14 % of its height) and the double rule
 * it carries (75 %). On the text card the panel of wood starts at 50 % and runs to the bottom.
 */
const WESTERN_LAYOUTS: Record<'spawn' | 'extra' | 'text', WesternLayout> = {
  spawn: { plank: { part: 'header', top: 0, bottom: 0.185 }, title: { top: 0.042, height: 0.096, left: 0.05, width: 0.9 } },
  extra: { plank: { part: 'header', top: 0, bottom: 0.215 }, title: { top: 0.045, height: 0.115, left: 0.05, width: 0.9 }, extra: true },
  text: { plank: { part: 'footer', top: 0.5, bottom: 1 }, title: { top: 0.545, height: 0.07, left: 0.07, width: 0.86 }, centered: true },
};
/**
 * Width of a capital letter in each Western face, in em (the word fit shrinks a title until its longest word fits):
 * the widest title words measured in the browser ("DEADHORN" 0.77 in Rye, 0.69 in Zilla Slab, "ДОПОЛНИТЕЛЬНЫЙ" 0.74
 * in PT Serif), plus about 5 % for the native text renderers.
 */
const WESTERN_CAPS_EM: Record<string, number> = { Rye: 0.81, 'ZillaSlab-Bold': 0.73, 'PTSerif-Bold': 0.78 };
/** Size of a one-line printed title (`westernPrintedTitle`), in design px. */
const WESTERN_TITLE_SIZE = 22;
/** Whether a printed title fits on one line of its box (`width`, share of the card) at its full size. */
const westernOneLine = (title: string, font: string, width: number) =>
  title.length * WESTERN_CAPS_EM[font] * WESTERN_TITLE_SIZE <= width * DESIGN_WIDTH;
/** Width of a letter of the count labels' sentences ("All Walkers"), in em, as tuned for them (`WesternLabel`). */
const WESTERN_LABEL_EM: Record<string, number> = { Rye: 0.95 * 0.7, 'ZillaSlab-Bold': 0.78 * 0.7, 'PTSerif-Bold': 0.82 * 0.7 };
/**
 * Number of every card, in the top right corner above the title (x of its left edge and width, y of its top and height):
 * the title has the whole width of the plank under it, whichever of its lines is the longest.
 */
const WESTERN_NUMBER = { left: 0.7, width: 0.25, top: 0.006, height: 0.036 };
/**
 * The "i" that says there is a rule on the back, at the right: just under a header plank (the title has the whole
 * width of the plank), or near the top of a card whose plank is at the bottom.
 */
const WESTERN_BADGE = { right: 0.035, top: 0.12, belowPlank: 0.012 };
/** Rule text of the text card, and the "One Extra Activation" line of an Extra Activation card (y of top and height). */
const WESTERN_RULE_TEXT = { top: 0.665, height: 0.32, left: 0.07, width: 0.86 };
const WESTERN_EXTRA_FOOTER = { top: 0.89, height: 0.075 };
/** The wooden footer of an Extra Activation card, under the labels (y of its top and height). */
const WESTERN_EXTRA_PLANK = { top: 0.865, height: 0.135 };
/** A sentence longer than this goes on two lines, in a smaller size ("Tous les Rôdeurs"). */
const WESTERN_LABEL_ONE_LINE_CHARS = 10;
/*
 * Whether a rule fits on the wooden panel of a Western card is decided outside the layout (`cardHasBack` tells the table
 * whether the card has a back), so it is estimated: the lines that fit in the panel at the smallest readable size
 * (`westernPanelText`: 10 design px on a 12.5 px line) times the characters of a line, with a margin for long words.
 */
const WESTERN_PANEL_LINE = 12.5;
const WESTERN_PANEL_CHARS_PER_LINE = 34;
/** Vertical padding of the panel text, and the height of a header holding a two-line name and "Abomination". */
const WESTERN_PANEL_PADDING = 12;
const WESTERN_HEADER_TALLEST = 84;
const panelChars = (height: number) => Math.max(0, Math.floor((height - WESTERN_PANEL_PADDING) / WESTERN_PANEL_LINE)) * WESTERN_PANEL_CHARS_PER_LINE;
/** Characters a rule may have to stay on the front: under the window of a named Abomination, or on the text card. */
const westernPanelChars = (boss?: WesternAbomination) => {
  const cardHeight = (DESIGN_WIDTH * 88) / 63;
  return panelChars(boss ? cardHeight - WESTERN_HEADER_TALLEST - DESIGN_WIDTH / westernWindow(boss).ratio : cardHeight * WESTERN_RULE_TEXT.height);
};
/**
 * Whether the rule of a Western card stays on its front. A named Abomination's panel shows its printed rule alone (its
 * name is the title); the text card's panel shows its whole text.
 */
const westernFits = (footer: string, t: Translate, boss?: WesternAbomination) =>
  (boss ? t(`card.${boss}Rule`) : footer).length <= westernPanelChars(boss);
/** The named Western Abomination a card or a hand-drawn reveal shows, if any. */
const westernBossOf = (card: ZombieCard, reveal?: Reveal): WesternAbomination | undefined => {
  const named = revealedAbomination(card, reveal);
  return named && isWesternAbomination(named) ? named : undefined;
};

/** A cream halo round the ink of a Western plank, so the letters stand out from the wood grain. */
const westernGlow = (s: number) => ({ textShadowColor: WESTERN_COLORS.inkGlow, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 3 * s });

/** An image filling its parent: `absoluteFill` alone would leave it at its own pixel size on the web. */
const FILL = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' } as const;

/** Card width the sizes below were drawn for (a phone in landscape); the card scales from it. */
const DESIGN_WIDTH = 230;
/**
 * Smallest height of the picture on a rule card (boss calls, Necromancers, Double Spawn...), in design pixels. The rule
 * text below it scrolls instead of taking the whole card, so the head of the boss stays in view on a short phone.
 */
const RULE_ART_MIN_HEIGHT = 80;

/**
 * True inside a card whose own button already reads it all out (see CardButton in game.tsx): the faces then hide their
 * inner nodes from TalkBack and VoiceOver, so the card is one focus stop, with no duplicate to swipe through.
 */
export const CardAnnounced = createContext(false);
/** The props that take a view and everything in it out of the screen reader; touches are unaffected. */
export const HIDDEN_FROM_READER = { accessible: false, accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' } as const;

/*
 * Card fronts follow the printed ones (Invader rulebook, pages 28 and 29). Positions are shares of the card's width
 * and height, measured on the printed card: the four count tabs (Red, Orange, Yellow, Blue from the top) lie over the
 * picture on the right and run out past the card edge; Extra Activation tabs start further left to hold a sentence.
 */
/** Top of each count tab, Red first, in % of the card height. */
const INVADER_TAB_TOPS = [28, 44, 59, 74];
/** Top of the lone tab of the "current level" display, in % of the card height: the middle of where the four were. */
const INVADER_SINGLE_TAB_TOP = 46;
/**
 * Left edge and width of a count tab, in % of the card width (the tab is cut by the card edge). Its height follows from
 * `INVADER_TAB_RATIO`, so the hexagon is never stretched: tabs are placed by their top only.
 */
const INVADER_TAB_LEFT = 68;
const INVADER_TAB_WIDTH = 46;
/** The same for an Extra Activation tab ("All Workers", "No one"): wider and starting further left, hence taller. */
const INVADER_WIDE_TAB_LEFT = 55;
const INVADER_WIDE_TAB_WIDTH = 59;
/** The same for the lone tab of the "current level" display, larger than the four. */
const INVADER_SINGLE_TAB_LEFT = 62;
const INVADER_SINGLE_TAB_WIDTH = 56;
/** Width over height of count-tab.png (520 x 150). */
const INVADER_TAB_RATIO = 520 / 150;
/** Width over height of number-badge.png (170 x 110), and the badge width in % of the card width. */
const INVADER_BADGE_RATIO = 170 / 110;
/**
 * The rule is set as large as fits its box: web ignores adjustsFontSizeToFit, so the size comes from the text length.
 * Text space of the box in design units squared (about 199 x 92, minus 10 % spare), width of a letter in em (Barlow
 * Condensed Italic, then Play for Cyrillic), line height over font size, and the largest and smallest sizes.
 */
const INVADER_RULE_AREA = 16000;
const INVADER_RULE_CHAR_EM = { latin: 0.52, cyrillic: 0.62 };
const INVADER_RULE_LINE = 1.1;
const INVADER_RULE_SIZE = { max: 14, min: 7 };
/** Lines of a rule on native, where the text shrinks to fit (more than the box holds at the smallest size). */
const INVADER_RULE_LINES = 12;
/** Inset of the rule text inside the box, in % of the box: clear of the rim of text-box.png, which is opaque to its edges. */
const INVADER_RULE_INSET = '4%';
/** The count tint over the white tab keeps its bevel visible; an inactive tab is a little dimmer than the current one. */
const INVADER_TAB_TINT_OPACITY = 0.76;
const INVADER_TAB_DIM_OPACITY = 0.85;
/** Veils over the card: the red backdrop over the navy grid, and over the picture (the official renders sit on navy). */
const INVADER_BACKDROP_OPACITY = 0.88;
const INVADER_ART_VEIL_OPACITY = 0.4;
/** Shadow behind a count so it reads on the pale tab, and how far its font may shrink on native. */
const INVADER_COUNT_SHADOW_RADIUS = 2;
const INVADER_COUNT_MIN_SCALE = 0.45;
const INVADER_TITLE_MIN_SCALE = 0.5;
/** Gap between the hexagon of a wide tab and the sentence, and the width of the sentence (the part of the bar still inside the card). */
const INVADER_ACTIVATION_WIDTH = '44%';
/** Width of a capital of Barlow Condensed in em, for an Extra Activation sentence that must not break a word. */
const INVADER_ACTIVATION_CHAR_EM = 0.6;
/** Width of an uppercase letter of Play (Cyrillic titles), in em: wider than Barlow Condensed, so a long word shrinks sooner. */
const INVADER_CYRILLIC_CHAR_EM = 0.85;
/** Characters that fit on the two lines of the title plate at full size (web ignores adjustsFontSizeToFit): Latin, Cyrillic. */
const INVADER_TITLE_CAPACITY = { latin: 34, cyrillic: 22 };
/**
 * Uppercase Barlow Condensed has no descenders, so its capitals sit below the middle of their line box: the block is
 * lifted by this share of the font size (measured on the web preview, about 2 px on a 31 px title) to centre them.
 */
const INVADER_TITLE_LIFT = 0.08;
/** Smallest share of the title size a long title is shrunk to. */
const INVADER_MIN_TITLE_SCALE = 0.6;

type CardStyles = ReturnType<typeof makeStyles>;
const CardStyle = createContext<{ styles: CardStyles; scale: number }>({ styles: makeStyles(1), scale: 1 });

/**
 * The boss a card revealed from its deck (Dead Men Tales rules), its kind and how it arrives; `boss` is empty when
 * every boss of the deck was already on display.
 */
export type Reveal = {
  kind: BossKind;
  boss: string;
  rule: BossRule;
  /** Modern Abomination powers: SPAMs set aside, bosses brought along, bosses gained, a choice still to make (Gozer). */
  spam?: readonly string[];
  along?: readonly string[];
  gained?: readonly string[];
  choosing?: boolean;
  /** The boss already in play that a card calling the same deck activates again instead of drawing (`boss` is then empty). */
  activates?: string;
};

/**
 * Longest text, in characters of the translated string, a card keeps under its picture. Longer, it goes to the back.
 * The footer is drawn at 11 design px, bold, in a 230 px card: about 33 characters a line, so 60 is two lines (the
 * footer is capped at 40% of the card). Counting characters of the current language, not a key, keeps the rule
 * independent of the card size (text and card scale together) and of the language ("Spawn, then activate" stays on
 * the front, the German or Russian long form of the same rule may not).
 */
const SHORT_TEXT_MAX_CHARS = 60;

/** A text short enough to stay on the front of the card. */
const isShort = (text: string) => text.length <= SHORT_TEXT_MAX_CHARS;

/**
 * Average width of a bold capital-heavy character, as a share of the font size (Cyrillic and uppercase run wide). Used
 * to size the longest word of a wide Danger Level so that it never breaks in the middle.
 */
const CHAR_WIDTH_EM = 0.68;

/** Smallest share of its size a text is shrunk to so that its longest word fits (the same floor as `minimumFontScale`). */
const MIN_WORD_FIT = 0.4;

/**
 * A sentence wraps between words but a word must not break: caps the font size so that the longest word of `text`
 * fits the width measured by `onLayout`, less `inset` (padding that the measured box does not account for). Attach
 * `onLayout` to a box whose width does not depend on the text (a stretched box, never one that shrinks to its
 * content), and spread `style` last on the Text. `text` undefined turns the cap off.
 */
function useWordFit(text: string | undefined, textStyle: StyleProp<TextStyle>, inset: number, charEm: number = CHAR_WIDTH_EM) {
  const [width, setWidth] = useState(0);
  const longest = text ? Math.max(...text.split(/\s+/).map((word) => word.length)) : 0;
  const base = StyleSheet.flatten(textStyle) as { fontSize: number; lineHeight?: number };
  const fit = width > 0 && longest > 0 ? Math.max(MIN_WORD_FIT, Math.min(1, (width - inset) / (longest * charEm * base.fontSize))) : 1;
  return {
    onLayout: (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width),
    style: fit < 1 ? { fontSize: base.fontSize * fit, lineHeight: base.lineHeight ? base.lineHeight * fit : undefined } : undefined,
  };
}

/** Width taken by the "+1" Horde badge next to a name: its minimum width and its two margins. */
const HORDE_BADGE_RESERVE = 30;

/** Horizontal padding of the name pill (`fantasyBigLabel`), in card design units. */
const BIG_LABEL_PADDING = 6;

/**
 * Zombie or boss name above a count: one word never breaks, several wrap between words, and the text shrinks before
 * it is cut. Without `row` it is stretched across its parent (and measures itself); with `row` it is a pill centred
 * in a row that also holds `badge`, and the row is measured.
 */
function NameLabel(props: { style: StyleProp<TextStyle>; minimumFontScale: number; padding?: number; row?: boolean; badge?: React.ReactNode; text: string; charEm?: number }) {
  const { styles, scale } = useContext(CardStyle);
  const fit = useWordFit(props.text, props.style, ((props.padding ?? 0) * 2 + (props.badge ? HORDE_BADGE_RESERVE : 0)) * scale, props.charEm);
  const label = (
    <Text
      style={[props.style, fit.style]}
      onLayout={props.row ? undefined : fit.onLayout}
      numberOfLines={2}
      adjustsFontSizeToFit
      minimumFontScale={props.minimumFontScale}
    >
      {props.text}
    </Text>
  );
  if (!props.row) return label;
  return (
    <View style={styles.fantasyBigLabelRow} onLayout={fit.onLayout}>
      {label}
      {props.badge}
    </View>
  );
}

/** A card shows its spawn on the front; a long rule and the boss it revealed are on the back, a short one stays under the picture. */
export type CardSide = 'front' | 'back';

/**
 * `width` is the width the card is drawn at: text, symbols and Danger Levels grow with it. The front keeps to the spawn
 * (picture, name, count); whatever the card says in words goes to the back.
 */
export function CardFace({
  card,
  danger,
  width,
  reveal,
  side = 'front',
  onFlip,
}: {
  card: ZombieCard;
  danger: DangerLevel;
  width: number;
  reveal?: Reveal;
  side?: CardSide;
  /** Taps on the back (its text and header) turn the card over again. */
  onFlip?: () => void;
}) {
  const scale = Math.max(0.5, width / DESIGN_WIDTH);
  const style = useMemo(() => ({ styles: makeStyles(scale), scale }), [scale]);
  return (
    <CardStyle.Provider value={style}>
      <Card card={card} danger={danger} reveal={reveal} side={side} onFlip={onFlip} />
    </CardStyle.Provider>
  );
}

type CardText = { title: string; footer?: string; spoken: string };

/** The reveal names a boss (neither an exhausted deck nor a deck the game never had). */
const isBoss = (reveal: Reveal) => reveal.boss !== NO_BOSS && reveal.boss !== NO_DECK;

/** A Necromancer card shows the Necromancer it revealed: its name, picture and rules (an Orc one keeps no Horde banner). */
const asRevealed = (card: ZombieCard, reveal?: Reveal): ZombieCard =>
  card.kind === 'necromancer' && reveal?.kind === 'necromancer' && isBoss(reveal)
    ? { ...card, zombie: reveal.boss as FantasyNecromancer }
    : card;

/** A Modern or Western card whose Abomination comes from the Abomination deck (see `bossTrigger`). */
const callsAbominationDeck = (card: ZombieCard): card is Extract<ModernCard, { kind: 'spawn' }> | Extract<WesternCard, { kind: 'westernAbomination' }> =>
  (card.kind === 'spawn' && card.zombie === 'abomination') || card.kind === 'westernAbomination';

/** The named Abomination a Modern or Western card revealed, to draw in place of the generic one. */
const revealedAbomination = (card: ZombieCard, reveal?: Reveal): NamedModernAbomination | WesternAbomination | undefined =>
  callsAbominationDeck(card) && reveal?.kind === 'abomination' && isBoss(reveal) && isModernAbomination(reveal.boss) ? reveal.boss : undefined;

/** The name of the boss a reveal holds, if it names one the decks know. */
const revealedName = (reveal?: Reveal): BossName | undefined => (reveal && isBoss(reveal) && isBossName(reveal.boss) ? reveal.boss : undefined);

/** What a reveal without a boss says: the deck is missing, a boss in play activates again, or every boss is already out. */
function noBossText(reveal: Reveal, t: Translate): string {
  const isNecromancer = reveal.kind === 'necromancer';
  if (reveal.boss === NO_DECK) return t(isNecromancer ? 'boss.necromancerNoDeck' : 'boss.abominationNoDeck');
  if (reveal.activates !== undefined) return t(isNecromancer ? 'boss.necromancerActivates' : 'boss.abominationActivates', { name: isBossName(reveal.activates) ? t(`zombie.${reveal.activates}.one`) : reveal.activates });
  return t(isNecromancer ? 'boss.necromancerNone' : 'boss.abominationNone');
}

/** A modern Abomination with its rule, as written under a card: "Gozer: When Gozer spawns...". */
const ruleLine = (id: string, t: Translate) => (isModernAbomination(id) ? `${t(`zombie.${id}.one`)}: ${t(`card.${id}Rule`)}` : undefined);

/**
 * What the modern Abomination powers add to a revealed boss: the SPAMs come first (they were drawn before it), then
 * the bosses brought along, then what Gozer gained or the invitation to choose.
 */
function groupLines(reveal: Reveal, t: Translate): { before: string[]; after: string[] } {
  const named = (ids: readonly string[] | undefined) => (ids ?? []).flatMap((id) => ruleLine(id, t) ?? []);
  const bossName = isModernAbomination(reveal.boss) ? t(`zombie.${reveal.boss}.one`) : '';
  const along = named(reveal.along);
  const gained = named(reveal.gained);
  return {
    before: named(reveal.spam),
    after: [
      ...(along.length > 0 ? [t('boss.along'), ...along] : []),
      ...(gained.length > 0 ? [t('boss.gained', { name: bossName }), ...gained] : []),
      ...(reveal.choosing ? [t('boss.tapToChoose')] : []),
    ],
  };
}

/** The footer of a card with the powers of its boss around it; unchanged without any (Fantasy). */
function withPowers(text: CardText, reveal: Reveal | undefined, t: Translate): CardText {
  if (!reveal) return text;
  const { before, after } = groupLines(reveal, t);
  if (before.length === 0 && after.length === 0) return text;
  return { ...text, footer: [...before, text.footer, ...after].filter(Boolean).join('\n') };
}

/** Title, footer and what a screen reader says about the body of a card, at the given Danger Level. */
function cardText(card: ZombieCard, danger: DangerLevel, t: Translate, reveal?: Reveal): CardText {
  if (isFantasyCard(card)) return withReveal(fantasyText(card, danger, t), reveal, t, card.kind !== 'necromancer');
  if (isInvaderCard(card)) return invaderText(card, danger, t);
  if (isWesternCard(card)) return westernText(card, danger, t, reveal);
  const level = t(`danger.${danger}`);
  switch (card.kind) {
    case 'trejo':
    case 'trejoRush': {
      const isRush = card.kind === 'trejoRush';
      return {
        title: isRush ? t('card.rushTitle', { zombies: 'Trejo' }) : 'Trejo',
        spoken: [t('card.trejoChoice'), ...trejoChoices(isRush).map((key, index) => `${index + 1}. ${t(key)}`)].join(' '),
      };
    }
    case 'spam':
      return { title: 'Spam', spoken: `${t('card.spam1')} ${t('card.spam2')}` };
    case 'extra':
      return { title: t('card.extra'), footer: t('card.extraRule'), spoken: `${level}: ${extraLine(card.zombie, danger, t)}` };
    default: {
      const zombies = t(`zombie.${card.zombie}.other`);
      const isRush = card.kind === 'rush';
      const text: CardText = {
        title: card.kind === 'rush' ? t('card.rushTitle', { zombies: t(`zombie.${card.zombie}.rush`) }) : zombies,
        footer: isRush ? t('card.rushRule') : card.zombie === 'seeker' ? t('card.seekerRule') : undefined,
        // The Fort Hendrix Zombie Shooter symbol is printed as a picture only: say it with the counts.
        spoken: sentences([`${level}: ${card.counts[DANGER_LEVELS.indexOf(danger)]}`, card.shooter && t('card.shooterSymbol')]),
      };
      // A modern card spawning the generic Abomination calls on the Abomination deck (2nd edition rulebook p.17).
      return callsAbominationDeck(card) ? withReveal(text, reveal, t, true, isModernAbomination) : text;
    }
  }
}

/**
 * What an Abomination drawn by hand shows: its name, then its rule and what its powers add. A modern Abomination
 * always prints a rule, a fantasy one only if its boss card does.
 */
function bossFaceText(reveal: Reveal, t: Translate): CardText {
  const named = revealedName(reveal);
  const rule = named && (isModernAbomination(named) || hasRule(named)) ? t(`card.${named}Rule`) : '';
  const none = noBossText(reveal, t);
  const { before, after } = groupLines(reveal, t);
  return {
    title: named ? t(`zombie.${named}.one`) : t('game.manualBoss'),
    spoken: '',
    footer: [...before, named ? rule : none, ...after].filter(Boolean).join('\n'),
  };
}

/** The face of a Western Abomination drawn by hand: its own card when it is named, the plain text card when not. */
function WesternBoss({ reveal, text, footerOnFront }: { reveal: Reveal; text: CardText; footerOnFront: boolean }) {
  const { t } = useApp();
  const named = revealedName(reveal);
  if (named && isWesternAbomination(named)) {
    return <WesternWindowCard text={text} rule={t(`card.${named}Rule`)} title={text.title} subtitle={t('card.westernAbomination')} boss={named} footerOnFront={footerOnFront} />;
  }
  return <WesternPrinted art={westernTextCardArt} layout="text" text={{ ...text, title: t('card.westernAbomination') }} footerOnFront={footerOnFront} />;
}

/** An Abomination drawn by hand, as a screen reader says it. */
export function bossLabel(reveal: Reveal, t: Translate): string {
  const { title, footer } = bossFaceText(reveal, t);
  return sentences([title, footer]);
}

/** The face of an Abomination drawn by hand: its picture, its rule and the powers it carries. */
export function BossFace({ reveal, width, universe, side = 'front', onFlip }: { reveal: Reveal; width: number; universe: UniverseId; side?: CardSide; onFlip?: () => void }) {
  const { t } = useApp();
  const scale = Math.max(0.5, width / DESIGN_WIDTH);
  const style = useMemo(() => ({ styles: makeStyles(scale), scale }), [scale]);
  const { styles } = style;
  return (
    <CardStyle.Provider value={style}>
      {side === 'back' ? (
        <RuleSide text={bossFaceText(reveal, t)} header={BOSS_LOOK[universe].header} universe={universe} onFlip={onFlip} />
      ) : universe === 'western' ? (
        <WesternBoss reveal={reveal} text={bossFaceText(reveal, t)} footerOnFront={!bossHasBack(reveal, t)} />
      ) : (
        <Frame text={bossFaceText(reveal, t)} headerColor={BOSS_LOOK[universe].header} faceColor={BOSS_LOOK[universe].face} footerOnFront={!bossHasBack(reveal, t)}>
          <View style={styles.artShort}>
            <ZombieFigure subject={revealedName(reveal) ?? 'abomination'} anchor="upper" />
          </View>
        </Frame>
      )}
    </CardStyle.Provider>
  );
}

export function cardHasBack(card: ZombieCard, danger: DangerLevel, t: Translate, reveal?: Reveal): boolean {
  const shown = asRevealed(card, reveal);
  const { footer } = cardText(shown, danger, t, reveal);
  const printed = isFantasyCard(shown) && revealedName(reveal) && (shown.kind === 'bossCall' || shown.kind === 'necromancer');
  // An Invader Abomination, Mold or Pit Spawn prints its rule in the red box on the front, as the printed card does.
  if (isInvaderCard(shown) && shown.kind !== 'xeno' && shown.kind !== 'xenoExtra') return false;
  // A Western rule stays on the front as long as it fits its panel; an Extra Activation line is short anyway.
  if (isWesternCard(shown) && shown.kind !== 'westernExtra') return !!footer && !westernFits(footer, t, westernBossOf(shown, reveal));
  return !!footer && (!isShort(footer) || !!printed);
}

/** An Abomination drawn by hand has its rule (or what is missing from its deck) on the back, unless that is short. */
export const bossHasBack = (reveal: Reveal, t: Translate): boolean => {
  const { footer } = bossFaceText(reveal, t);
  const named = revealedName(reveal);
  if (named && isWesternAbomination(named)) return !!footer && !westernFits(footer, t, named);
  return !!footer && !isShort(footer);
};

/** The whole card as a screen reader says it, to announce a card as it is drawn. */
export function cardLabel(card: ZombieCard, danger: DangerLevel, t: Translate, reveal?: Reveal): string {
  const { title, spoken, footer } = cardText(asRevealed(card, reveal), danger, t, reveal);
  return sentences([title, spoken, footer]);
}

const trejoChoices = (isRush: boolean) => ['card.trejo1', 'card.trejo2', isRush ? 'card.trejo3Rush' : 'card.trejo3'] as const;

/** The rule a Xeno prints under its levels (the Seeker Workers: every Seeker Xeno card activates those on the board). */
const XENO_RULES: Partial<Record<InvaderXeno, TranslationKey>> = { seekerWorker: 'card.seekerWorkerRule' };

/** Title, footer and spoken body of a sci-fi card: Xeno counts, an Abomination's order, a Mold or Pit Spawn, an Extra Activation. */
function invaderText(card: InvaderCard, danger: DangerLevel, t: Translate): CardText {
  const level = t(`danger.${danger}`);
  switch (card.kind) {
    case 'xeno': {
      const zombies = t(`zombie.${card.zombie}.other`);
      const rule = XENO_RULES[card.zombie];
      return { title: zombies, footer: rule && t(rule), spoken: `${level}: ${card.counts[DANGER_LEVELS.indexOf(danger)]}` };
    }
    case 'xenoAbomination':
      return { title: t(`zombie.${card.zombie}.other`), footer: abominationRule(card, t), spoken: '' };
    case 'zoneSpawn': {
      const params = { count: card.count, zombies: t(`zombie.${card.zombie}.${card.count === 1 ? 'one' : 'other'}`) };
      const mold = card.zone === 'mold';
      return { title: t(mold ? 'card.moldSpawnTitle' : 'card.pitSpawnTitle', params), footer: t(mold ? 'card.moldSpawnRule' : 'card.pitSpawnRule', params), spoken: '' };
    }
    case 'xenoExtra':
      return { title: t('card.extra'), footer: t('card.extraRule'), spoken: `${level}: ${extraLine(card.zombie, danger, t)}` };
  }
}

/** Abominations whose title has no word Abomination in it. */
const BARE_TITLES: readonly InvaderAbomination[] = ['synkrasis'];

/**
 * The order an Abomination card gives: the Spoiler and Driller ones have their own sentence, a card with a third step
 * (`spawnZone`, the Stepmother) has its own, every other named Abomination reads "Spawn a <name> (if any)".
 * A title without the word Abomination (Synkrasis) gets a sentence without article, which no gender can break.
 */
function abominationRule(card: Extract<InvaderCard, { kind: 'xenoAbomination' }>, t: Translate): string {
  const name = t(`zombie.${card.zombie}.other`);
  if (card.spawnZone) return t('card.zoneStepAbominationRule', { name });
  if (card.zombie === 'spoilerAbomination') return t('card.spoilerAbominationRule');
  if (card.zombie === 'drillerAbomination') return t('card.drillerAbominationRule');
  return t(BARE_TITLES.includes(card.zombie) ? 'card.bareAbominationRule' : 'card.namedAbominationRule', { name });
}

/** Title, footer and spoken body of a Wild West card: counts, the Abomination text card, an Extra Activation. */
function westernText(card: WesternCard, danger: DangerLevel, t: Translate, reveal?: Reveal): CardText {
  const level = t(`danger.${danger}`);
  switch (card.kind) {
    case 'westernSpawn':
      return { title: t(`zombie.${card.zombie}.other`), spoken: `${level}: ${card.counts[DANGER_LEVELS.indexOf(danger)]}` };
    case 'westernAbomination':
      // The printed text, or the Abomination the deck revealed with its own rule (an Abomination card has no levels).
      return withReveal({ title: t('card.westernAbomination'), footer: t('card.westernAbominationRule'), spoken: '' }, reveal, t, true, isModernAbomination);
    case 'westernExtra':
      return { title: t('card.extra'), footer: t('card.extraRule'), spoken: `${level}: ${extraLine(card.zombie, danger, t)}` };
  }
}

const extraLine = (zombie: ExtraZombie | InvaderXeno | WesternActivated, at: DangerLevel, t: Translate) =>
  at === 'blue' ? t('card.extraNobody') : t(`zombie.${zombie}.all`);

function Card({ card: printed, danger, reveal, side, onFlip }: { card: ZombieCard; danger: DangerLevel; reveal?: Reveal; side: CardSide; onFlip?: () => void }) {
  const { t, cardDisplay } = useApp();
  const { styles } = useContext(CardStyle);
  const card = asRevealed(printed, reveal);
  const text = cardText(card, danger, t, reveal);
  const footerOnFront = !cardHasBack(printed, danger, t, reveal);

  if (side === 'back') {
    return <RuleSide card={card} text={text} header={headerFor(card)} universe={universeOf(card)} onFlip={onFlip} {...backHeading(printed, card, danger, text, reveal, t)} />;
  }

  if (isFantasyCard(card)) return <FantasyFace card={card} danger={danger} text={text} reveal={reveal} footerOnFront={footerOnFront} />;
  if (isInvaderCard(card)) return <InvaderFace card={card} danger={danger} text={text} footerOnFront={footerOnFront} />;
  if (isWesternCard(card)) return <WesternFace card={card} danger={danger} text={text} reveal={reveal} footerOnFront={footerOnFront} />;

  if (card.kind === 'trejo' || card.kind === 'trejoRush') {
    const isRush = card.kind === 'trejoRush';
    const choices = trejoChoices(isRush);
    return (
      <Frame card={card} text={text} headerColor={headerFor(card)} footerOnFront={footerOnFront}>
        <Art card={card} short />
        <View style={[styles.textBody, { backgroundColor: isRush ? CARD_COLORS.rush.background : CARD_COLORS.spawn.background }]}>
          <Text style={[styles.bodyHeading, { color: isRush ? CARD_COLORS.ink : '#ffffff' }]}>{t('card.trejoChoice')}</Text>
          {choices.map((key, index) => (
            <Text key={key} style={[styles.bodyText, { color: isRush ? CARD_COLORS.ink : '#ffffff' }]}>
              {index + 1}. {t(key)}
            </Text>
          ))}
        </View>
      </Frame>
    );
  }

  if (card.kind === 'spam') {
    return (
      <Frame card={card} text={text} headerColor={headerFor(card)} footerOnFront={footerOnFront}>
        <Art card={card} short />
        <View style={[styles.textBody, { backgroundColor: CARD_COLORS.spawn.background }]}>
          <Text style={[styles.bodyText, { color: '#ffffff' }]}>{t('card.spam1')}</Text>
          <Text style={[styles.bodyText, { color: '#ffffff' }]}>{t('card.spam2')}</Text>
        </View>
      </Frame>
    );
  }

  const symbol = specialSymbol(card);

  if (card.kind === 'extra') {
    return (
      <Frame card={card} text={text} headerColor={headerFor(card)} footerOnFront={footerOnFront}>
        <View style={styles.spawnBody}>
          <Art card={card} />
          <View style={styles.levels}>
            <LevelSymbol kind={symbol} />
            {(cardDisplay === 'current' ? [danger] : PRINTED_LEVELS).map((shown) => (
              <Level key={shown} level={shown} active={shown === danger} wide large={cardDisplay === 'current'}>
                {extraLine(card.zombie, shown, t)}
              </Level>
            ))}
          </View>
        </View>
      </Frame>
    );
  }

  const { counts } = card;
  const abomination = revealedAbomination(card, reveal);
  return (
    <Frame card={card} text={text} headerColor={headerFor(card)} footerOnFront={footerOnFront}>
      <View style={styles.spawnBody}>
        {abomination ? (
          <View style={styles.art}>
            <ZombieFigure subject={abomination} anchor="center" />
          </View>
        ) : (
          <Art card={card} />
        )}
        <View style={styles.levels}>
          <LevelSymbol kind={symbol} />
          {abomination && (
            <NameLabel style={styles.fantasyBigLabel} minimumFontScale={0.6} padding={BIG_LABEL_PADDING} text={t(`zombie.${abomination}.one`)} />
          )}
          {cardDisplay === 'current' ? (
            <Level level={danger} active large>
              ×{counts[DANGER_LEVELS.indexOf(danger)]}
            </Level>
          ) : (
            PRINTED_LEVELS.map((shown) => (
              <Level key={shown} level={shown} active={shown === danger}>
                ×{counts[DANGER_LEVELS.indexOf(shown)]}
              </Level>
            ))
          )}
        </View>
      </View>
    </Frame>
  );
}

/** A Danger Level tab: the neutral tab picture tinted with the level colour, with its count or sentence on it. */
function InvaderTab(props: { style: StyleProp<ViewStyle>; tint: string; textStyle: StyleProp<TextStyle>; wide: boolean; children: string }) {
  const { styles } = useContext(CardStyle);
  // An Extra Activation sentence never breaks inside a word: it shrinks first.
  const fit = useWordFit(props.wide ? props.children : undefined, props.textStyle, 0, INVADER_ACTIVATION_CHAR_EM);
  return (
    <View style={props.style}>
      {/* Keep the bevel and texture visible through the level tint. */}
      <Image source={INVADER_PARTS.countTab} style={styles.invaderLayer} resizeMode="stretch" />
      <Image source={INVADER_PARTS.countTab} style={[styles.invaderLayer, { tintColor: props.tint, opacity: INVADER_TAB_TINT_OPACITY }]} resizeMode="stretch" />
      <View onLayout={props.wide ? fit.onLayout : undefined} style={props.wide ? styles.invaderActivationBox : undefined}>
        <Text
          style={[props.textStyle, fit.style]}
          // Web has no shrink-to-fit: a line limit there would only cut "×10" down to "×…".
          numberOfLines={Platform.OS === 'web' ? undefined : props.wide ? 2 : 1}
          adjustsFontSizeToFit
          minimumFontScale={INVADER_COUNT_MIN_SCALE}
        >
          {props.children}
        </Text>
      </View>
    </View>
  );
}

function InvaderFace({ card, danger, text, footerOnFront }: { card: InvaderCard; danger: DangerLevel; text: CardText; footerOnFront: boolean }) {
  const { t, language, cardDisplay } = useApp();
  const { styles, scale } = useContext(CardStyle);
  const announced = useContext(CardAnnounced);
  const fonts = invaderFonts(language);
  const current = cardDisplay === 'current';
  const extra = card.kind === 'xenoExtra';
  const hasLevels = card.kind === 'xeno' || extra;
  const rule = !extra && (!hasLevels || footerOnFront) ? text.footer : undefined;
  const number = card.id.slice(-3);
  const cyrillic = language === 'ru' || language === 'uk';
  const ruleSize = rule
    ? Math.max(INVADER_RULE_SIZE.min, Math.min(INVADER_RULE_SIZE.max, Math.sqrt(INVADER_RULE_AREA / (rule.length * (cyrillic ? INVADER_RULE_CHAR_EM.cyrillic : INVADER_RULE_CHAR_EM.latin) * INVADER_RULE_LINE))))
    : 0;
  const titleScale = Math.max(INVADER_MIN_TITLE_SCALE, Math.min(1, (cyrillic ? INVADER_TITLE_CAPACITY.cyrillic : INVADER_TITLE_CAPACITY.latin) / text.title.length));

  const tabPlace = (level: DangerLevel, wide: boolean) => ({
    top: `${current ? INVADER_SINGLE_TAB_TOP : INVADER_TAB_TOPS[PRINTED_LEVELS.indexOf(level)]}%` as const,
    left: `${current ? INVADER_SINGLE_TAB_LEFT : wide ? INVADER_WIDE_TAB_LEFT : INVADER_TAB_LEFT}%` as const,
    width: `${current ? INVADER_SINGLE_TAB_WIDTH : wide ? INVADER_WIDE_TAB_WIDTH : INVADER_TAB_WIDTH}%` as const,
  });

  return (
    <View style={[styles.face, styles.invaderFace]} {...readerProps(text, announced)}>
      <Image source={INVADER_PARTS.background} style={styles.invaderLayer} resizeMode="stretch" />
      <View style={styles.invaderBackdrop} />
      <View style={styles.invaderArt}>
        <ZombieFigure subject={card.zombie} anchor="fill" />
        <View style={styles.invaderArtTint} />
      </View>
      <Image source={INVADER_PARTS.frame} style={styles.invaderLayer} resizeMode="stretch" />
      <Image source={INVADER_PARTS.hazardBand} style={styles.invaderHazard} resizeMode="stretch" />
      <View style={styles.invaderTitlePlate}>
        <Image source={INVADER_PARTS.titlePlate} style={styles.invaderLayer} resizeMode="stretch" />
        <View style={styles.invaderTitleArea}>
          <NameLabel text={text.title} style={[styles.invaderTitle, { fontFamily: fonts.title, fontSize: styles.invaderTitle.fontSize * titleScale, lineHeight: styles.invaderTitle.lineHeight * titleScale, transform: [{ translateY: -styles.invaderTitle.fontSize * titleScale * INVADER_TITLE_LIFT }] }]} minimumFontScale={INVADER_TITLE_MIN_SCALE} charEm={cyrillic ? INVADER_CYRILLIC_CHAR_EM : undefined} />
        </View>
      </View>
      <View style={styles.invaderNumberBadge}>
        <Image source={INVADER_PARTS.numberBadge} style={styles.invaderLayer} resizeMode="stretch" />
        <Text style={[styles.invaderNumber, { fontFamily: fonts.count }]}>{number}</Text>
      </View>
      {hasLevels &&
        (current ? [danger] : PRINTED_LEVELS).map((level) => {
          const active = level === danger;
          const count = card.kind === 'xeno' ? card.counts[DANGER_LEVELS.indexOf(level)] : 0;
          return (
            <InvaderTab
              key={level}
              style={[styles.invaderTab, tabPlace(level, extra), active && styles.invaderTabActive, ]}
              tint={DANGER_COLORS[level].background}
              textStyle={[styles.invaderCount, current && styles.invaderCountSingle, count >= 10 && (current ? styles.invaderCountSingleWide : styles.invaderCountWide), extra && styles.invaderActivation, { fontFamily: fonts.count }]}
              wide={extra}
            >
              {extra ? extraLine(card.zombie, level, t) : `\u00d7${count}`}
            </InvaderTab>
          );
        })}
      {rule && (
        <View style={styles.invaderRule}>
          <Image source={INVADER_PARTS.textBox} style={styles.invaderLayer} resizeMode="stretch" />
          {/* The padding is on this inner box, not on the one holding the image, so the panel always fills its frame. */}
          <View style={styles.invaderRuleInner}>
            <Text
              style={[styles.invaderRuleText, { fontFamily: fonts.text, fontSize: ruleSize * scale, lineHeight: ruleSize * INVADER_RULE_LINE * scale }]}
              // Web has no shrink-to-fit: a line limit there would only cut the rule short.
              numberOfLines={Platform.OS === 'web' ? undefined : INVADER_RULE_LINES}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {rule}
            </Text>
          </View>
        </View>
      )}
      {text.footer && !footerOnFront && (
        <View style={styles.invaderInfo}>
          <View style={styles.infoBadge}><Text style={styles.infoBadgeText}>i</Text></View>
        </View>
      )}
    </View>
  );
}

/**
 * Wild West card: the art of the card behind everything (the official picture in the printed card's frame, with no
 * printed text), then what the app draws in the player's language where the printed card had it: the wooden title
 * plank and title, the number, the counts on cream torn-paper labels with the colour of their Danger Level at the
 * end (the four of them, or only the current one, larger), a short rule. An Abomination revealed by the deck has its
 * own card, see `WesternWindowCard`.
 */
function WesternFace({ card, danger, text, reveal, footerOnFront }: { card: WesternCard; danger: DangerLevel; text: CardText; reveal?: Reveal; footerOnFront: boolean }) {
  const { t, cardDisplay } = useApp();
  const current = cardDisplay === 'current';
  const revealed = revealedAbomination(card, reveal);
  const boss = revealed && isWesternAbomination(revealed) ? revealed : undefined;
  if (boss) {
    return <WesternWindowCard text={text} rule={t(`card.${boss}Rule`)} title={t(`zombie.${boss}.one`)} subtitle={text.title} boss={boss} footerOnFront={footerOnFront} />;
  }
  const layout = card.kind === 'westernSpawn' ? 'spawn' : card.kind === 'westernExtra' ? 'extra' : 'text';
  const left = layout === 'extra' ? WESTERN_LABEL_LEFT.extra : WESTERN_LABEL_LEFT.spawn;
  const levels = current ? [danger] : PRINTED_LEVELS;
  return (
    <WesternPrinted card={card} art={westernCardArt(card)} layout={layout} text={text} footerOnFront={footerOnFront}>
      {layout !== 'text' &&
        levels.map((shown, index) => (
          <WesternLabel
            key={shown}
            // Only the current Danger Level: one larger label in the middle of where the four were.
            row={current ? 1.5 : index}
            left={left}
            level={shown}
            big={current}
            count={card.kind === 'westernSpawn' ? card.counts[DANGER_LEVELS.indexOf(shown)] : undefined}
            sentence={card.kind === 'westernExtra' ? extraLine(card.zombie, shown, t) : undefined}
          />
        ))}
    </WesternPrinted>
  );
}

/**
 * A Western card with the app's own text over its art. `text.title` is the title (the heading of the text card),
 * `text.footer` the rule, written under the picture when it fits and on the back when it does not.
 */
function WesternPrinted(props: {
  /** Absent on the face of an Abomination drawn by hand, which has no card number. */
  card?: WesternCard;
  art: ImageSourcePropType;
  layout: keyof typeof WESTERN_LAYOUTS;
  text: CardText;
  footerOnFront: boolean;
  children?: React.ReactNode;
}) {
  const { styles } = useContext(CardStyle);
  const announced = useContext(CardAnnounced);
  const fonts = westernFonts(useApp().language);
  const { footer, title } = props.text;
  const layout = WESTERN_LAYOUTS[props.layout];
  const at = (box: { top: number; height: number; left?: number; width?: number }): ViewStyle => ({
    position: 'absolute',
    top: `${box.top * 100}%`,
    height: `${box.height * 100}%`,
    left: `${(box.left ?? 0) * 100}%`,
    width: `${(box.width ?? 1) * 100}%`,
  });
  const number = props.card && /\d{3}$/.test(props.card.id) ? `#${props.card.id.slice(-3)}` : '';
  // Dark brown ink on every plank, as printed: red is only for the brush stroke of the plank picture.
  const ink = WESTERN_COLORS.header.text;
  return (
    <View style={[styles.face, { backgroundColor: WESTERN_COLORS.face }]} {...readerProps(props.text, announced)}>
      <Image source={props.art} style={FILL} resizeMode="cover" />
      <Plank part={layout.plank.part} style={at({ top: layout.plank.top, height: layout.plank.bottom - layout.plank.top })} />
      {props.layout === 'extra' && <Plank part="footer" style={at(WESTERN_EXTRA_PLANK)} />}
      <View style={[at(layout.title), styles.westernTitleSlot, layout.centered && styles.westernCenteredBox]}>
        <NameLabel
          style={[
            layout.extra ? styles.westernExtraTitle : styles.westernPrintedTitle,
            // A title of several words too long for one line ("Long-Dead Walkers") goes on two in the same room.
            props.layout === 'spawn' && /\s/.test(title) && !westernOneLine(title, fonts.title, layout.title.width) && styles.westernPrintedTitleTwoLines,
            { color: ink, fontFamily: fonts.title },
            layout.centered && styles.westernCenteredText,
          ]}
          minimumFontScale={0.4}
          charEm={WESTERN_CAPS_EM[fonts.title]}
          text={title}
        />
      </View>
      {number !== '' && <Text style={[at(WESTERN_NUMBER), styles.westernNumber, { fontFamily: fonts.count }]}>{number}</Text>}
      {!!footer && !props.footerOnFront && (
        <View style={[styles.infoBadge, { position: 'absolute', right: `${WESTERN_BADGE.right * 100}%`, top: `${(layout.plank.part === 'header' ? layout.plank.bottom + WESTERN_BADGE.belowPlank : WESTERN_BADGE.top) * 100}%` }]}>
          <Text style={styles.infoBadgeText}>i</Text>
        </View>
      )}
      {props.children}
      {!!footer && props.footerOnFront && (
        <View style={[at(props.layout === 'extra' ? WESTERN_EXTRA_FOOTER : WESTERN_RULE_TEXT), props.layout === 'extra' && { left: 0, width: '100%' }, styles.westernFooterBox]}>
          <Text style={[props.layout === 'extra' ? styles.westernExtraFooterText : styles.westernPanelText, { fontFamily: fonts.text }]}>{footer}</Text>
        </View>
      )}
    </View>
  );
}

/**
 * A count label of the printed cards, redrawn over the art: cream torn paper with a slab "x10" (the "x" smaller) and the
 * colour of its Danger Level on a torn strip at the end. `row` is its place in the stack of four (1.5: the middle).
 * Everything is laid out in absolute boxes of fixed size: no flex, no font shrinking, so the count cannot collapse on
 * any platform.
 */
function WesternLabel(props: {
  row: number;
  left: number;
  level: DangerLevel;
  /** The only label of the card (the current Danger Level alone): set larger. */
  big?: boolean;
  /** A count ("x10") or, on an Extra Activation card, a sentence ("All Walkers"). */
  count?: number;
  sentence?: string;
}) {
  const { styles, scale } = useContext(CardStyle);
  const fonts = westernFonts(useApp().language);
  const picture = WESTERN_PARTS.countLabel;
  // The hand-drawn label has transparent torn edges: it is a little larger than the printed one so none of it peeks out.
  const bleed = picture !== undefined ? WESTERN_LABEL_BLEED : { x: 0, y: 0 };
  const left = props.left - bleed.x;
  const strip = (1 - WESTERN_PAPER_END) / (1 - left);
  const paper = (WESTERN_PAPER_END - left) / (1 - left);
  const enlarge = props.big ? WESTERN_CURRENT_LABEL : 1;
  const height = (WESTERN_LABEL_HEIGHT + 2 * bleed.y) * enlarge;
  const top = WESTERN_LABEL_TOP + props.row * WESTERN_LABEL_PITCH - bleed.y - (height - WESTERN_LABEL_HEIGHT) / 2;
  const colour = DANGER_COLORS[props.level].background;
  const twoLinesStyle = (props.sentence?.length ?? 0) > WESTERN_LABEL_ONE_LINE_CHARS;
  const textStyle = [props.sentence ? styles.westernLabelSentence : styles.westernLabelCount, props.big && (props.sentence ? styles.westernLabelSentenceBig : styles.westernLabelCountBig), twoLinesStyle && styles.westernLabelTwoLines, { fontFamily: fonts.count }];
  const twoLines = (props.sentence?.length ?? 0) > WESTERN_LABEL_ONE_LINE_CHARS;
  const fit = useWordFit(props.sentence, textStyle, 8 * scale, WESTERN_LABEL_EM[fonts.count]);
  return (
    <View
      pointerEvents="none"
      style={[styles.westernLabel, { top: `${top * 100}%`, height: `${height * 100}%`, left: `${left * 100}%` }]}
    >
      {picture !== undefined ? (
        // The hand-drawn label: its cream part is as wide as the printed paper, its white strip is tinted with the Danger
        // Level colour (white times a colour is the colour) and a plain block of that colour runs on to the card's edge.
        <>
          <View style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: `${(1 - paper / (1 - COUNT_LABEL_STRIP)) * 100}%`, backgroundColor: colour }} />
          <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${(paper / (1 - COUNT_LABEL_STRIP)) * 100}%` }}>
            <Image source={picture} style={FILL} resizeMode="stretch" />
            <View style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: `${COUNT_LABEL_STRIP * 100}%`, backgroundColor: colour, mixBlendMode: 'multiply' }} />
          </View>
        </>
      ) : (
        <>
          <View style={[styles.westernLabelPaperFill, { width: `${(paper + strip) * 100}%` }]} />
          {/* Torn colour strip: its ragged left edge lets the paper show through. */}
          <Svg style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: `${strip * 100}%`, height: '100%' }} viewBox="0 0 20 34" preserveAspectRatio="none">
            <Polygon points="7,0 20,0 20,34 4,34 8,27 3,20 9,13 4,6" fill={colour} />
          </Svg>
        </>
      )}
      <View style={[styles.westernLabelText, { width: `${paper * 100}%` }]} onLayout={fit.onLayout}>
        <Text style={[...textStyle, fit.style]} numberOfLines={twoLines ? 2 : 1}>
          {props.sentence ?? (
            <>
              <Text style={[styles.westernLabelX, { fontFamily: fonts.count }]}>x</Text>
              {props.count}
            </>
          )}
        </Text>
      </View>
    </View>
  );
}

/** Plank of light wood: a few grain lines (fixed, so a card never changes between two renders) over the plank colour. */
const GRAIN: readonly (readonly [top: number, left: number, width: number])[] = [
  [0.16, 0.02, 0.62],
  [0.34, 0.3, 0.68],
  [0.52, 0, 0.45],
  [0.7, 0.4, 0.58],
  [0.86, 0.1, 0.7],
];

/**
 * A hand-drawn plank of any size without distorting its grain or its nails: the picture is scaled to the width of the
 * box, its top and bottom rims (`cap` rows of the source) keep their proportions and only the wood between them is
 * stretched to the height left.
 */
function SlicedPlank({ source, size, cap }: { source: ImageSourcePropType; size: { width: number; height: number }; cap: number }) {
  const [box, setBox] = useState({ width: 0, height: 0 });
  const k = box.width / size.width;
  const rim = Math.min(cap * k, box.height / 2);
  const middle = Math.max(0, box.height - 2 * rim);
  const stretch = middle / Math.max(1, (size.height - 2 * cap) * k);
  const image = (top: number, height: number) => ({ position: 'absolute', left: 0, width: box.width, top, height } as const);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} onLayout={(event) => setBox(event.nativeEvent.layout)}>
      {box.width > 0 && (
        <>
          <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: rim, overflow: 'hidden' }}>
            <Image source={source} style={image(0, size.height * k)} resizeMode="stretch" />
          </View>
          <View style={{ position: 'absolute', left: 0, right: 0, top: rim, height: middle, overflow: 'hidden' }}>
            <Image source={source} style={image(-cap * k * stretch, size.height * k * stretch)} resizeMode="stretch" />
          </View>
          <View style={{ position: 'absolute', left: 0, right: 0, top: rim + middle, height: rim, overflow: 'hidden' }}>
            <Image source={source} style={image(-(size.height * k - rim), size.height * k)} resizeMode="stretch" />
          </View>
        </>
      )}
    </View>
  );
}

/** Size of the hand-drawn planks and how much of their rim stays unstretched (rows of the source). */
const PLANK_PICTURES = { header: { width: 1200, height: 260, cap: 70 }, footer: { width: 1200, height: 420, cap: 110 } } as const;

/** `part` names the hand-drawn picture that replaces the drawn wood when it exists (see `WESTERN_PARTS`). */
function Plank({ style, part, children }: { style?: StyleProp<ViewStyle>; part?: 'header' | 'footer'; children?: React.ReactNode }) {
  const { styles } = useContext(CardStyle);
  const picture = part === 'header' ? WESTERN_PARTS.headerPlank : part === 'footer' ? WESTERN_PARTS.footerPlank : undefined;
  return (
    <View style={[styles.plank, picture !== undefined && styles.plankPicture, style]}>
      {picture !== undefined && part !== undefined ? (
        <SlicedPlank source={picture} size={PLANK_PICTURES[part]} cap={PLANK_PICTURES[part].cap} />
      ) : (
        GRAIN.map(([top, left, width]) => (
          <View key={top} pointerEvents="none" style={[styles.grain, { top: `${top * 100}%`, left: `${left * 100}%`, width: `${width * 100}%` }]} />
        ))
      )}
      {children}
    </View>
  );
}

/** Height over width of a full Abomination illustration (a 63:88 card). */
const WESTERN_PICTURE_RATIO = 88 / 63;

/**
 * Where a full illustration sits in a window of `ratio`, in shares of the window's height (an absolute `top` and
 * `height` in percent are relative to the parent's height): it fills the width, and the point `center` (share of the
 * illustration's height) comes to the middle of the window without the window leaving the picture.
 */
const framing = (ratio: number, center: number): ImageStyle => {
  // In window widths: the picture's height, the window's height and how far the picture moves up.
  const picture = WESTERN_PICTURE_RATIO;
  const window = 1 / ratio;
  const shift = Math.min(picture - window, Math.max(0, center * picture - window / 2));
  return { position: 'absolute', left: 0, width: '100%', top: `${(-100 * shift) / window}%`, height: `${(100 * picture) / window}%` };
};

/**
 * The illustration of a named Abomination framed on `center` in its picture area: a window of `ratio`, or (no `ratio`)
 * whatever room the card leaves under its header, measured once laid out.
 */
function FramedPicture({ source, ratio, center, style, cropped }: { source: ImageSourcePropType; ratio?: number; center: number; style: StyleProp<ViewStyle>; cropped?: true }) {
  const [measured, setMeasured] = useState<number>();
  const shape = ratio ?? measured;
  const picture = useMemo(() => (shape === undefined ? undefined : framing(shape, center)), [shape, center]);
  const measure = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (height > 0) setMeasured(width / height);
  };
  return (
    <View style={[style, ratio !== undefined && { aspectRatio: ratio }]} onLayout={ratio === undefined && !cropped ? measure : undefined}>
      {cropped
        ? <Image source={source} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} resizeMode="contain" />
        : picture !== undefined && <Image source={source} style={picture} resizeMode="cover" />}
    </View>
  );
}

/**
 * A named Western Abomination with a title plank, an illustration window and a wooden rule panel. A full illustration
 * fills the width of the window and slides vertically so the creature's head and body stay in view.
 */
function WesternWindowCard(props: {
  text: CardText;
  /** The printed rule of the Abomination, written on the panel when it fits. */
  rule: string;
  title: string;
  subtitle: string;
  boss: WesternAbomination;
  footerOnFront: boolean;
}) {
  const { styles } = useContext(CardStyle);
  const announced = useContext(CardAnnounced);
  const fonts = westernFonts(useApp().language);
  const { footer } = props.text;
  const { source, ratio, center, cropped } = westernWindow(props.boss);
  return (
    <View style={[styles.face, { backgroundColor: WESTERN_COLORS.face }]} {...readerProps(props.text, announced)}>
      <CardHeader title={props.title} subtitle={props.subtitle} color={WESTERN_COLORS.header} badge={!!footer && !props.footerOnFront} western />
      {props.footerOnFront ? (
        <>
          <FramedPicture source={source} ratio={ratio} center={center} cropped={cropped} style={styles.westernWindow} />
          <Plank style={styles.westernPanel} part="footer">
            <Text style={[styles.westernPanelText, { fontFamily: fonts.text }]}>{props.rule}</Text>
          </Plank>
        </>
      ) : (
        // The rule is on the back (the "i" in the header says so): no empty panel, the picture runs to the bottom.
        <FramedPicture source={source} center={center} cropped={cropped} style={styles.westernPictureOnly} />
      )}
    </View>
  );
}

function Art({ card, short }: { card: ModernCard; short?: boolean }) {
  const { styles } = useContext(CardStyle);
  return (
    <View style={short ? styles.artShort : styles.art}>
      <ZombieFigure subject={artSubject(card)} anchor={short ? 'top' : 'center'} />
    </View>
  );
}

// Symbols printed above the Danger Levels: an image for most, a small drawing for the rest.
type ImageSymbol = 'toxic' | 'berserker' | 'skinner' | 'dog' | 'crow' | 'seeker' | 'lostZombivor' | 'shooter';
type DrawnSymbol = 'vip';
type SymbolKind = ImageSymbol | DrawnSymbol;

const SYMBOL_IMAGES: Record<ImageSymbol, { source: ImageSourcePropType; style: ImageStyle }> = {
  toxic: { source: require('../../assets/modern/icons/toxic-biohazard-symbol.png'), style: { width: 48, height: 48 } },
  berserker: {
    source: require('../../assets/modern/icons/berserker-bowie-symbol.png'),
    style: { width: 48, height: 48, marginTop: -1 },
  },
  skinner: {
    source: require('../../assets/modern/icons/skinner-razor-symbol.png'),
    style: { width: 44, height: 44, transform: [{ rotate: '-90deg' }, { scaleX: -1 }] },
  },
  dog: { source: require('../../assets/modern/icons/dog-paw-symbol.png'), style: { width: 50, height: 50 } },
  crow: { source: require('../../assets/modern/icons/crow-real-symbol.png'), style: { width: 62, height: 62, marginTop: -2 } },
  seeker: { source: require('../../assets/modern/icons/seeker-eye-symbol.png'), style: { width: 50, height: 50 } },
  lostZombivor: {
    source: require('../../assets/modern/icons/lost-zombivor-chain-symbol.png'),
    style: { width: 62, height: 62, tintColor: '#6a2c91', transform: [{ rotate: '-45deg' }] },
  },
  // Printed on the Fort Hendrix cards as an M4A1 in a red circle, barrel up-left.
  shooter: {
    source: require('../../assets/modern/icons/shooter-m4a1-symbol.png'),
    style: { width: 46, height: 46, transform: [{ rotate: '20deg' }] },
  },
};

const ZOMBIE_SYMBOLS: Partial<Record<ZombieType, SymbolKind>> = {
  toxicWalker: 'toxic',
  toxicFatty: 'toxic',
  toxicRunner: 'toxic',
  berserkerWalker: 'berserker',
  berserkerFatty: 'berserker',
  berserkerRunner: 'berserker',
  skinnerWalker: 'skinner',
  skinnerFatty: 'skinner',
  skinnerRunner: 'skinner',
  dog: 'dog',
  crow: 'crow',
  seeker: 'seeker',
  vip: 'vip',
  lostZombivor: 'lostZombivor',
};

function specialSymbol(card: ModernCard): SymbolKind | null {
  if (card.kind !== 'spawn' && card.kind !== 'rush' && card.kind !== 'extra') return null;
  return ZOMBIE_SYMBOLS[card.zombie] ?? (card.kind !== 'extra' && card.shooter ? 'shooter' : null);
}

const isImageSymbol = (kind: SymbolKind): kind is ImageSymbol => kind in SYMBOL_IMAGES;

const scaled = (style: ImageStyle, scale: number): ImageStyle => ({
  ...style,
  width: (style.width as number) * scale,
  height: (style.height as number) * scale,
  ...(style.marginTop !== undefined && { marginTop: (style.marginTop as number) * scale }),
});

function LevelSymbol({ kind }: { kind: SymbolKind | null }) {
  const { styles, scale } = useContext(CardStyle);
  if (!kind) return null;
  return (
    <View style={styles.levelSymbolWrap}>
      <View style={[styles.levelSymbolBadge, kind === 'shooter' && styles.shooterSymbolBadge]}>
        {isImageSymbol(kind) ? (
          <Image source={SYMBOL_IMAGES[kind].source} style={scaled(SYMBOL_IMAGES[kind].style, scale)} resizeMode="contain" />
        ) : (
          <Svg width={44 * scale} height={44 * scale} viewBox="0 0 24 24">
            <SymbolDrawing kind={kind} />
          </Svg>
        )}
      </View>
    </View>
  );
}

function SymbolDrawing({ kind }: { kind: DrawnSymbol }) {
  switch (kind) {
    case 'vip':
      return (
        <Path
          d="M12 0.2 15.1 8.2 23.8 8.8 17.2 14.3 19.5 23.6 12 19.1 4.5 23.6 6.8 14.3.2 8.8 8.9 8.2z"
          fill="#5b2b78"
          transform="rotate(-20 12 12)"
        />
      );
  }
}

// Joins the parts into sentences without doubling the punctuation of titles such as "Walker Rush!".
const sentences = (parts: (string | false | undefined)[]) =>
  parts
    .filter((part): part is string => !!part)
    .map((part) => (/[.!?:]$/.test(part) ? part : `${part}.`))
    .join(' ');

/** What a card's face tells a screen reader: the whole card in one stop, or nothing when the card's own button reads it. */
const readerProps = (text: CardText, announced: boolean) =>
  // The rule on the back is read with the front: a screen reader never needs to turn the card.
  announced ? HIDDEN_FROM_READER : { accessible: true, accessibilityLabel: sentences([text.title, text.spoken, text.footer]) };

function Frame(props: {
  /** Absent on the face of an Abomination drawn by hand, which has no card number. */
  card?: ZombieCard;
  text: CardText;
  headerColor: { background: string; text: string };
  /** The card stock: orange for the modern cards, parchment for the fantasy ones. */
  faceColor?: string;
  /** The footer is short: it stays under the picture, with no "i" and no back. */
  footerOnFront?: boolean;
  children: React.ReactNode;
}) {
  const { styles } = useContext(CardStyle);
  const { title, footer } = props.text;
  const announced = useContext(CardAnnounced);
  return (
    <View style={[styles.face, props.faceColor !== undefined && { backgroundColor: props.faceColor }]} {...readerProps(props.text, announced)}>
      <CardHeader card={props.card} title={title} color={props.headerColor} badge={!!footer && !props.footerOnFront} />
      <View style={styles.body}>{props.children}</View>
      {footer && props.footerOnFront && (
        <View style={[styles.footer, { backgroundColor: props.headerColor.background }]}>
          <Text style={[styles.footerText, { color: props.headerColor.text }]}>{footer}</Text>
        </View>
      )}
    </View>
  );
}

type Colors = { background: string; text: string };

/** Title and number of a card; the "i" says there is a rule on the back, shown only on the front. */
function CardHeader(props: { card?: ZombieCard; title: string; color: Colors; badge?: boolean; western?: boolean; subtitle?: string }) {
  const { styles } = useContext(CardStyle);
  const fonts = westernFonts(useApp().language);
  const number = props.card && /\d{3}$/.test(props.card.id) ? `#${props.card.id.slice(-3)}` : '';
  if (props.western) {
    const fontScale = props.title.length >= 18 ? 0.76 : 1;
    return (
      <Plank style={styles.westernHeader} part="header">
        {!WESTERN_PARTS.headerPlank && <View style={styles.westernBrush} />}
        <View style={styles.westernTitleBox}>
          <NameLabel style={[styles.westernTitle, { fontFamily: fonts.title, fontSize: styles.westernTitle.fontSize * fontScale, lineHeight: styles.westernTitle.lineHeight * fontScale }]} minimumFontScale={0.4} charEm={WESTERN_CAPS_EM[fonts.title]} text={props.title} />
          {!WESTERN_PARTS.headerPlank && <View style={styles.westernTitleRule} />}
          {props.subtitle !== undefined && <Text style={[styles.westernSubtitle, { fontFamily: fonts.count }]}>{props.subtitle}</Text>}
        </View>
        <Text style={[styles.number, { color: props.color.text, fontFamily: fonts.count }]}>{number}</Text>
        {props.badge && (
          <View style={styles.infoBadge}>
            <Text style={styles.infoBadgeText}>i</Text>
          </View>
        )}
      </Plank>
    );
  }
  return (
    <View style={[styles.header, { backgroundColor: props.color.background }]}>
      <Text style={[styles.title, { color: props.color.text }]} numberOfLines={3}>
        {props.title}
      </Text>
      <Text style={[styles.number, { color: props.color.text }]}>{number}</Text>
      {props.badge && (
        <View style={styles.infoBadge}>
          <Text style={styles.infoBadgeText}>i</Text>
        </View>
      )}
    </View>
  );
}

/** The header colour of each kind of card: Rush and Extra Activation have their own. */
function headerFor(card: ZombieCard): Colors {
  if (isFantasyCard(card)) return FANTASY_HEADER;
  if (isInvaderCard(card)) return card.kind === 'xenoExtra' ? CARD_COLORS.extra : INVADER_COLORS.header;
  if (isWesternCard(card)) return WESTERN_COLORS.header;
  if (card.kind === 'extra') return CARD_COLORS.extra;
  return card.kind === 'rush' || card.kind === 'trejoRush' ? CARD_COLORS.rush : CARD_COLORS.spawn;
}

const universeOf = (card: ZombieCard): UniverseId => (isFantasyCard(card) ? 'fantasy' : isInvaderCard(card) ? 'invader' : isWesternCard(card) ? 'western' : 'modern');

/** The panel the back's text sits on, per universe: its frame, the box under the text and the ink on it. */
const SIDE_PANEL: Record<UniverseId, { frame: string; box: string; ink: string }> = {
  modern: { frame: CARD_COLORS.back, box: CARD_COLORS.spawn.background, ink: CARD_COLORS.spawn.text },
  fantasy: { frame: CARD_COLORS.fantasyFrame, box: CARD_COLORS.parchmentRow, ink: CARD_COLORS.parchmentInk },
  invader: { frame: INVADER_COLORS.panel, box: INVADER_COLORS.panel, ink: INVADER_COLORS.header.text },
  western: { frame: WESTERN_COLORS.panel, box: WESTERN_COLORS.panel, ink: WESTERN_COLORS.header.text },
};

/**
 * The boss or zombie a card shows and, when a printed Abomination or Necromancer was swapped for a named boss, why:
 * "Tainted Abomination → Siege Breaker".
 */
function backHeading(printed: ZombieCard, card: ZombieCard, danger: DangerLevel, text: CardText, reveal: Reveal | undefined, t: Translate) {
  const boss = revealedName(reveal);
  const swapped = (from: string) => (boss ? t('card.revealedAs', { printed: from, boss: t(`zombie.${boss}.one`) }) : undefined);
  if (isFantasyCard(card)) {
    if (card.kind === 'levels' || card.kind === 'activation') {
      const { line, level, label } = revealedLevel(card, danger, danger, reveal, t);
      const generic = level && ABOMINATIONS.has(level.zombie) ? swapped(t(`zombie.${level.zombie}.one`)) : undefined;
      return { name: level ? (label ?? line.value) : undefined, revealedAs: generic };
    }
    // A call card that revealed a boss shows the boss on its front: the text it prints goes to the back.
    const printedText = boss ? ruleParagraphs(card, t) : undefined;
    if (card.kind === 'bossCall') return { revealedAs: swapped(text.title), printedText };
    if (card.kind === 'necromancer') {
      const swappedOut = isFantasyCard(printed) && printed.kind === 'necromancer' && printed.zombie !== card.zombie;
      return { revealedAs: swappedOut ? swapped(t(printed.zombie === 'orcNecromancer' ? 'card.orcNecromancer' : 'card.necromancer')) : undefined, printedText };
    }
    return {};
  }
  const abomination = revealedAbomination(card, reveal);
  return abomination ? { name: t(`zombie.${abomination}.one`), revealedAs: swapped(text.title) } : {};
}

/** The back of a card: its header again, then its name and its rule, large enough to read and scrolling when long. */
function RuleSide(props: {
  card?: ZombieCard;
  text: CardText;
  header: Colors;
  universe: UniverseId;
  name?: string;
  revealedAs?: string;
  /** What the card itself prints, when its front shows a revealed boss instead: before the boss's own rule. */
  printedText?: string[];
  /** Turns the card back to its front. */
  onFlip?: () => void;
}) {
  const { styles } = useContext(CardStyle);
  const { title, footer } = props.text;
  const panel = SIDE_PANEL[props.universe];
  const face = BOSS_LOOK[props.universe].face;
  // The back is only for sighted taps: the card's button reads the rule, so the header and the text are no stop.
  const announced = useContext(CardAnnounced);
  // Not accessible itself: an accessible View groups its children on Android and can swallow the scroll gesture. The
  // card's own button (in game.tsx) carries the label that reads the front and the rule.
  // The ScrollView is the parent and the tap target sits inside it (the canonical pattern): a Pressable around a
  // ScrollView would take the touch first and the text would never scroll on Android, in a modal especially.
  return (
    <View style={[styles.face, face !== undefined && { backgroundColor: face }]} {...(announced ? HIDDEN_FROM_READER : {})}>
      <Pressable style={({ pressed }) => pressed && PRESSED} onPress={props.onFlip} accessible={false}>
        <CardHeader card={props.card} title={title} color={props.header} western={props.universe === 'western'} />
      </Pressable>
      <View style={[styles.sideFrame, { backgroundColor: panel.frame }]}>
        <ScrollView style={[styles.sideBox, { backgroundColor: panel.box }]} {...SCROLL_TRACKING}>
          <Pressable style={({ pressed }) => [styles.sideContent, pressed && PRESSED]} onPress={props.onFlip} accessible={false}>
          {props.name !== undefined && <Text style={[styles.sideName, { color: panel.ink }]}>{props.name}</Text>}
          {props.revealedAs !== undefined && <Text style={[styles.sideRevealed, { color: panel.ink }]}>{props.revealedAs}</Text>}
          {[...(props.printedText ?? []), ...(footer ?? '').split('\n')].map((line, index) => (
            <Text key={`${index}-${line}`} style={[styles.sideText, { color: panel.ink }]}>
              {line}
            </Text>
          ))}
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}

function Level(props: {
  level: DangerLevel;
  active: boolean;
  wide?: boolean;
  /** Alone on the card, when only the current Danger Level is shown. */
  large?: boolean;
  children: React.ReactNode;
}) {
  const { styles, scale } = useContext(CardStyle);
  const textStyle = [
    props.wide ? styles.levelTextWide : styles.levelText,
    props.active && (props.wide ? styles.levelTextWideActive : styles.levelTextActive),
    props.large && (props.wide ? styles.levelTextWideLarge : styles.levelTextLarge),
  ];
  // Only a wide (sentence) panel is capped; the padding of the value box is not part of the room for the text.
  const fit = useWordFit(props.wide && typeof props.children === 'string' ? props.children : undefined, textStyle, 6 * scale);
  return (
    <View style={[styles.level, props.active && styles.levelActive, props.large && styles.levelLarge]}>
      <View style={styles.levelValue} onLayout={fit.onLayout}>
        <Text
          style={[...textStyle, fit.style]}
          // "×10" stays on one line, "All Walkers" on up to three: the text shrinks instead of wrapping (Android
          // fonts run wider than the web ones).
          // Web has no shrink-to-fit: a line limit there would only cut "×5" down to "×…".
          numberOfLines={Platform.OS === 'web' ? undefined : props.wide ? 3 : 1}
          adjustsFontSizeToFit
          minimumFontScale={0.4}
        >
          {props.children}
        </Text>
      </View>
      {/* Torn paint stripe, as if sprayed on the card. */}
      <Svg width={(props.large ? 34 : 20) * scale} height="100%" viewBox="0 0 20 34" preserveAspectRatio="none">
        <Polygon
          points="7,0 20,0 20,34 4,34 8,27 3,20 9,13 4,6"
          fill={DANGER_COLORS[props.level].background}
        />
      </Svg>
    </View>
  );
}

const FANTASY_HEADER = { background: CARD_COLORS.parchment, text: CARD_COLORS.parchmentInk };

/** Header and stock of a hand-drawn Abomination, per universe: a new UniverseId must pick its own. */
const BOSS_LOOK: Record<UniverseId, { header: { background: string; text: string }; face: string | undefined }> = {
  modern: { header: CARD_COLORS.spawn, face: undefined },
  fantasy: { header: FANTASY_HEADER, face: CARD_COLORS.parchment },
  invader: { header: INVADER_COLORS.header, face: INVADER_COLORS.face },
  western: { header: WESTERN_COLORS.header, face: WESTERN_COLORS.face },
};

/** The Horde symbol applies to every zombie a level spawns, but not to an Abomination. */
const feedsHorde = (card: FantasyCard, level: FantasyLevel) =>
  card.kind === 'levels' && !!card.horde && !!level && !ABOMINATIONS.has(level.zombie);

/** The rule printed on a card without Danger Levels, one paragraph per line. */
function fantasyRule(card: FantasyCard, t: Translate): string[] {
  switch (card.kind) {
    case 'necromancer':
      if (isNamedNecromancer(card.zombie)) {
        const own = t(`card.${card.zombie}Rule`);
        return PLAIN_RULE_NECROMANCERS.has(card.zombie) ? [own] : [t('card.namedNecromancerRule'), own];
      }
      return [t(card.zombie === 'orcNecromancer' ? 'card.orcNecromancerRule' : 'card.necromancerRule')];
    case 'doubleSpawn':
      return [t('card.doubleSpawnRule')];
    case 'enterHorde':
      return [t('card.enterHordeRule')];
    case 'bossCall':
      return [
        ...(card.chi ? [t('card.chiLoss')] : []),
        t(card.boss === 'abomination' ? 'card.abominationCallRule' : 'card.necromancerCallRule'),
      ];
    case 'zombieSiege':
      return [t('card.zombieSiegeOrder'), t('card.zombieSiegeSpawn'), t('card.zombieSiegeMove')];
    default:
      return [];
  }
}

/** What one Danger Level of a fantasy spawn or Extra Activation card says. */
function fantasyLine(card: FantasyCard, at: DangerLevel, t: Translate): { label?: string; value: string; spoken: string } {
  if (card.kind === 'activation') {
    const text = at === 'blue' ? t('card.extraNobody') : t(`zombie.${card.zombie}.all`);
    return { value: text, spoken: text };
  }
  if (card.kind !== 'levels') return { value: '', spoken: '' };
  const level = card.levels[DANGER_LEVELS.indexOf(at)];
  if (!level) {
    const nothing = t(card.plural ? 'card.nothing' : 'card.nothingInSight');
    return { value: nothing, spoken: nothing };
  }
  // Named Abominations are printed as a picture across the levels, without a count.
  if (NAMED_ZOMBIES.has(level.zombie)) {
    const name = t(`zombie.${level.zombie}.${card.plural ? 'other' : 'one'}`);
    return { value: name, spoken: name };
  }
  const horde = feedsHorde(card, level) ? `, ${t('card.hordeBonus')}` : '';
  return {
    label: t(`zombie.${level.zombie}.one`),
    value: `×${level.count}`,
    spoken: `${level.count} ${t(`zombie.${level.zombie}.${level.count === 1 ? 'one' : 'other'}`)}${horde}`,
  };
}

const isNamedNecromancer = (zombie: FantasyNecromancer): zombie is NamedNecromancer => NAMED_NECROMANCERS.has(zombie);

/** The boss a call card shows while none is revealed: the one of its core box. */
function bossCallArt(card: Extract<FantasyCard, { kind: 'bossCall' }>): ArtSubject {
  if (card.boss === 'necromancer') return card.setId === 'eternalEmpire' ? 'necromancer' : 'defilerNecromancer';
  return card.setId === 'eternalEmpire' ? 'godEaterAbomination' : 'khanAbomination';
}

/** The picture of a card without Danger Levels: its Necromancer, the boss a White Death card revealed, or a horde. */
function ruleArt(card: FantasyCard, reveal?: Reveal): ArtSubject {
  switch (card.kind) {
    case 'necromancer':
      return card.zombie;
    case 'bossCall':
      return revealedName(reveal) ?? bossCallArt(card);
    case 'enterHorde':
      return 'orcWalker';
    case 'zombieSiege':
      return card.setId === 'eternalEmpire' ? 'eeWalker' : 'wdWalker';
    default:
      return 'fantasyWalker';
  }
}

/** The Horde banner under the rule: the zombies the Orc Necromancer adds to the Horde. */
const hordeRule = (card: FantasyCard, t: Translate) =>
  card.kind === 'necromancer' && card.zombie === 'orcNecromancer' ? t('card.necromancerHorde') : undefined;
const spokenRule = (card: FantasyCard, t: Translate) => [...fantasyRule(card, t), hordeRule(card, t) ?? ''].join(' ').trim();
/** The text a card without Danger Levels prints, paragraph by paragraph, Horde banner included. */
const ruleParagraphs = (card: FantasyCard, t: Translate): string[] => [...fantasyRule(card, t), hordeRule(card, t) ?? ''].filter(Boolean);

/** The title printed on a card with Danger Levels: its own, a named zombie's, or the one of its core box. */
function levelsTitle(card: Extract<FantasyCard, { kind: 'levels' }>, t: Translate): string {
  if (card.title === 'named') {
    const named = card.boss ?? card.levels.find((level) => level !== null)?.zombie;
    return t('card.named', { name: named ? t(`zombie.${named}.one`) : '' });
  }
  if (card.title === 'zombies') {
    const first = card.levels.find((level) => level !== null);
    return first ? t(`zombie.${first.zombie}.other`) : '';
  }
  if (card.title) return t(`card.${card.title}`);
  return t(card.horde ? 'card.assembleHorde' : 'card.fantasyInvasion');
}

function fantasyText(card: FantasyCard, danger: DangerLevel, t: Translate): CardText {
  switch (card.kind) {
    case 'levels':
      return {
        title: levelsTitle(card, t),
        footer: card.adds ? t('card.addsOne', { name: t(`zombie.${card.adds}.one`) }) : card.note ? t(`card.${card.note}`) : undefined,
        spoken: `${t(`danger.${danger}`)}: ${fantasyLine(card, danger, t).spoken}`,
      };
    case 'activation':
      return { title: t('card.extra'), spoken: `${t(`danger.${danger}`)}: ${fantasyLine(card, danger, t).spoken}` };
    case 'necromancer':
      return {
        title: isNamedNecromancer(card.zombie)
          ? t('card.named', { name: t(`zombie.${card.zombie}.one`) })
          : t(card.zombie === 'orcNecromancer' ? 'card.orcNecromancer' : 'card.necromancer'),
        spoken: spokenRule(card, t),
      };
    case 'doubleSpawn':
      return { title: t('card.doubleSpawn'), spoken: spokenRule(card, t) };
    case 'enterHorde':
      return { title: t('card.enterHorde'), spoken: spokenRule(card, t) };
    case 'bossCall':
      return { title: t(card.boss === 'abomination' ? 'card.abominationCall' : 'card.necromancer'), spoken: spokenRule(card, t) };
    case 'zombieSiege':
      return { title: t('card.zombieSiege'), spoken: spokenRule(card, t) };
  }
}

/** Bosses with a rule of their own, printed on their boss card (Frozen Fortress, White Death, Eternal Empire). */
const BOSS_RULED: ReadonlySet<string> = new Set(BOSS_RULE_IDS);
const hasRule = (boss: string): boss is BossRuleId => BOSS_RULED.has(boss);
type RuledBoss = BossRuleId | NamedModernAbomination | WesternAbomination;

/** The boss revealed from its deck, named under the card with the way it arrives. */
function withReveal(text: CardText, reveal: Reveal | undefined, t: Translate, withRule = true, ruled: (boss: BossName) => boss is RuledBoss = hasRule): CardText {
  return withPowers(revealedText(text, reveal, t, withRule, ruled), reveal, t);
}

function revealedText(
  text: CardText,
  reveal: Reveal | undefined,
  t: Translate,
  withRule = true,
  // Whether the boss prints a rule of its own: the fantasy ones are listed, every modern Abomination has one.
  ruled: (boss: BossName) => boss is RuledBoss = hasRule,
): CardText {
  if (!reveal) return text;
  const isNecromancer = reveal.kind === 'necromancer';
  if (reveal.boss === NO_DECK || reveal.boss === NO_BOSS) return { ...text, footer: noBossText(reveal, t) };
  const boss = revealedName(reveal);
  if (!boss) return text;
  const name = t(`zombie.${boss}.one`);
  const rule = isNecromancer ? 'boss.necromancer' : reveal.rule === 'fest' ? 'boss.abominationFest' : 'boss.abomination';
  // A Necromancer card already reads as the Necromancer it revealed, its rule included.
  const own = withRule && ruled(boss) ? ` ${t(`card.${boss}Rule`)}` : '';
  return { ...text, footer: `${t(rule, { name })}${own}` };
}

/**
 * One Danger Level of a fantasy card as drawn: the zombie printed there, or the Abomination revealed from its deck in
 * its place (drawn for the current Danger Level only, so the other levels keep the Abomination printed).
 */
function revealedLevel(card: FantasyCard, at: DangerLevel, danger: DangerLevel, reveal: Reveal | undefined, t: Translate) {
  const line = fantasyLine(card, at, t);
  const level = card.kind === 'levels' ? card.levels[DANGER_LEVELS.indexOf(at)] : null;
  const boss = at === danger && level && ABOMINATIONS.has(level.zombie) ? revealedName(reveal) : undefined;
  return {
    line,
    level,
    subject: card.kind === 'activation' ? (card.zombie as ArtSubject) : (boss ?? level?.zombie),
    label: boss ? t(`zombie.${boss}.one`) : line.label,
  };
}

/**
 * What the modern layout shows for the current level of a fantasy card: the zombie to draw large, its type above the
 * count (none for an Extra Activation, which prints a sentence). Empty for "Nothing in sight!" and the rule cards.
 */
function bigLevel(card: FantasyCard, danger: DangerLevel, reveal: Reveal | undefined, t: Translate) {
  if (card.kind !== 'levels' && card.kind !== 'activation') return undefined;
  const { line, level, subject, label } = revealedLevel(card, danger, danger, reveal, t);
  if (card.kind === 'activation') return { subject: subject as ArtSubject, label: undefined, value: line.value, horde: false };
  if (!level || !subject) return undefined;
  return { subject, label, value: line.value, horde: feedsHorde(card, level) };
}

/** Fantasy era card: parchment stock, the printed title, then the Danger Levels red first, or the rule of the card. */
function FantasyFace({ card, danger, text, reveal, footerOnFront }: { card: FantasyCard; danger: DangerLevel; text: CardText; reveal?: Reveal; footerOnFront: boolean }) {
  const { t, cardDisplay } = useApp();
  const { styles } = useContext(CardStyle);
  const current = cardDisplay === 'current';
  const shown = current ? [danger] : PRINTED_LEVELS;
  // A named Abomination is printed as one picture across its levels: shown above them, so it stays in view at Blue too.
  const named =
    card.kind === 'levels' && (card.title === 'named' || card.plural)
      ? (card.boss ?? card.levels.find((level) => level !== null)?.zombie)
      : undefined;
  const big = current && !named ? bigLevel(card, danger, reveal, t) : undefined;
  // A call card (Abomination!, Necromancer!) that revealed a boss reads like a spawn card: the boss, its name, one of it.
  const boss = card.kind === 'bossCall' || card.kind === 'necromancer' ? revealedName(reveal) : undefined;
  return (
    <Frame card={card} text={text} headerColor={FANTASY_HEADER} faceColor={CARD_COLORS.parchment} footerOnFront={footerOnFront}>
      {boss ? (
        <View style={styles.spawnBody}>
          <View style={styles.art}>
            <ZombieFigure subject={ruleArt(card, reveal)} anchor="center" />
          </View>
          <View style={[styles.levels, { backgroundColor: CARD_COLORS.fantasyFrame }]}>
            <NameLabel row style={styles.fantasyBigLabel} minimumFontScale={0.6} padding={BIG_LABEL_PADDING} text={t(`zombie.${boss}.one`)} />
            <Level level={danger} active large>
              ×1
            </Level>
          </View>
        </View>
      ) : big ? (
        // Only the current level: the modern layout, the zombie large beside its count.
        <View style={styles.spawnBody}>
          <View style={styles.art}>
            <ZombieFigure subject={big.subject} anchor="center" />
          </View>
          <View style={[styles.levels, { backgroundColor: CARD_COLORS.fantasyFrame }]}>
            {big.label !== undefined && (
              <NameLabel
                row
                style={styles.fantasyBigLabel}
                minimumFontScale={0.6}
                padding={BIG_LABEL_PADDING}
                badge={
                  big.horde && (
                    <View style={styles.hordeBadge}>
                      <Text style={styles.hordeText}>+1</Text>
                    </View>
                  )
                }
                text={big.label}
              />
            )}
            <Level level={danger} active wide={big.label === undefined} large>
              {big.value}
            </Level>
          </View>
        </View>
      ) : card.kind === 'levels' || card.kind === 'activation' ? (
        <View style={styles.fantasyLevels}>
          {named && (
            <View style={styles.fantasyNamedArt}>
              {/* Wider than tall: the head and chest of the creature, below the halo. */}
              <ZombieFigure subject={named} anchor="upper" />
            </View>
          )}
          {shown.map((at) => {
            const { line, level, subject, label } = revealedLevel(card, at, danger, reveal, t);
            return (
              <FantasyRow
                key={at}
                level={at}
                active={at === danger}
                large={current}
                subject={named && card.kind !== 'activation' ? undefined : subject}
                label={label}
                value={line.value}
                horde={feedsHorde(card, level)}
              />
            );
          })}
        </View>
      ) : (
        <View style={styles.fantasyRuleBody}>
          <View style={styles.fantasyRuleArt}>
            <ZombieFigure
              subject={ruleArt(card, reveal)}
              anchor="upper"
            />
          </View>
          <ScrollView style={styles.fantasyRuleScroll} contentContainerStyle={styles.fantasyRuleCaption} {...SCROLL_TRACKING}>
            {fantasyRule(card, t).map((rule) => (
              <Text key={rule} style={styles.fantasyRule}>
                {rule}
              </Text>
            ))}
            {hordeRule(card, t) && <Text style={styles.fantasyHordeRule}>{hordeRule(card, t)}</Text>}
          </ScrollView>
        </View>
      )}
    </Frame>
  );
}

function FantasyRow(props: {
  subject?: ArtSubject;
  level: DangerLevel;
  active: boolean;
  /** Alone on the card, when only the current Danger Level is shown. */
  large: boolean;
  /** The zombie type, above its count; none for "Nothing in sight!" and the Extra Activations. */
  label?: string;
  value: string;
  horde: boolean;
}) {
  const { styles, scale } = useContext(CardStyle);
  const counted = props.label !== undefined;
  return (
    <View style={[styles.fantasyRow, props.active && styles.fantasyRowActive, props.large && styles.fantasyRowLarge]}>
      {/* Flames of the Danger Level, as the printed cards have on the left of each line. */}
      <Svg width={(props.large ? 30 : 18) * scale} height="100%" viewBox="0 0 18 34" preserveAspectRatio="none">
        <Polygon points="0,0 12,0 7,6 13,12 6,18 12,24 5,30 10,34 0,34" fill={DANGER_COLORS[props.level].background} />
      </Svg>
      {props.subject && (
        <View style={{ width: (props.large ? 60 : 38) * scale, alignSelf: 'stretch', overflow: 'hidden' }}>
          <ZombieFigure subject={props.subject} anchor="full" />
        </View>
      )}
      {props.horde && (
        <View style={styles.hordeBadge}>
          <Text style={styles.hordeText}>+1</Text>
        </View>
      )}
      <View style={styles.fantasyCell}>
        {props.label !== undefined && (
          <NameLabel style={[styles.fantasyLabel, props.large && styles.fantasyLabelLarge]} minimumFontScale={0.75} text={props.label} />
        )}
        <Text
          style={[
            counted ? styles.fantasyCount : styles.fantasyNote,
            counted && props.active && styles.fantasyCountActive,
            counted && props.large && styles.fantasyCountLarge,
            !counted && props.large && styles.fantasyNoteLarge,
          ]}
          numberOfLines={Platform.OS === 'web' ? undefined : counted ? 1 : 3}
          adjustsFontSizeToFit
          minimumFontScale={0.4}
        >
          {props.value}
        </Text>
      </View>
    </View>
  );
}

// Sizes for a card DESIGN_WIDTH wide, multiplied by `s`.
function makeStyles(s: number) {
  return StyleSheet.create({
    fantasyLevels: { flex: 1, justifyContent: 'center', gap: 4 * s, padding: 6 * s, backgroundColor: CARD_COLORS.fantasyFrame },
    fantasyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 34 * s,
      backgroundColor: CARD_COLORS.parchmentRow,
      borderRadius: 3 * s,
      overflow: 'hidden',
    },
    fantasyRowActive: { minHeight: 48 * s, borderWidth: 3 * s, borderColor: CARD_COLORS.parchmentInk },
    fantasyRowLarge: { minHeight: 120 * s },
    fantasyCell: { flex: 1, minWidth: 0, alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: 6 * s, paddingVertical: 2 * s },
    fantasyLabel: { alignSelf: 'stretch', textAlign: 'right', color: CARD_COLORS.parchmentInk, fontSize: 9 * s, fontWeight: '700', fontStyle: 'italic' },
    fantasyLabelLarge: { fontSize: 14 * s },
    fantasyCount: { color: CARD_COLORS.parchmentInk, fontSize: 16 * s, fontWeight: '900' },
    fantasyCountActive: { fontSize: 24 * s },
    fantasyCountLarge: { fontSize: 52 * s },
    // Type of the zombie above its large count, on a parchment strip so it reads on the red frame.
    fantasyBigLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 * s, minWidth: 0 },
    // The count of a Mold / Pit Spawn card, which has no Danger Levels: alone in the dark panel.
    invaderFace: { backgroundColor: INVADER_COLORS.backdrop },
    invaderLayer: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
    // The navy grid darkened and reddened: the printed picture sits on a dark red backdrop.
    invaderBackdrop: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: INVADER_COLORS.backdrop, opacity: INVADER_BACKDROP_OPACITY },
    // The picture fills the whole card under the title, inside the frame; tabs and rule box lie over it.
    invaderArt: { position: 'absolute', top: '15%', bottom: '2%', left: '3%', right: '3%', overflow: 'hidden' },
    // The official renders sit on a navy backdrop; a red veil makes them read like the printed card's red picture.
    invaderArtTint: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: INVADER_COLORS.backdrop, opacity: INVADER_ART_VEIL_OPACITY },
    invaderHazard: { position: 'absolute', bottom: '1%', left: '5%', width: '90%', height: '8%' },
    invaderTitlePlate: { position: 'absolute', top: '1%', left: '3%', width: '94%', height: '16.5%' },
    // The red inside the plate's metal rim, measured on title-plate.png (760x190): x 53-700 (the notch for the badge
    // cuts the right side), y 24-171 (the hazard strip is under it), so its middle sits at 51 %.
    invaderTitleArea: { position: 'absolute', left: '7%', right: '8%', top: '15%', bottom: '11.5%', justifyContent: 'center' },
    invaderTitle: { color: INVADER_COLORS.plateInk, fontSize: 21 * s, lineHeight: 21 * s, textAlign: 'center', textTransform: 'uppercase', includeFontPadding: false },
    invaderNumberBadge: { position: 'absolute', left: '72%', top: '18%', width: '13%', aspectRatio: INVADER_BADGE_RATIO, justifyContent: 'center' },
    invaderNumber: { color: INVADER_COLORS.badgeInk, fontSize: 12 * s, textAlign: 'center' },
    invaderTab: { position: 'absolute', aspectRatio: INVADER_TAB_RATIO, justifyContent: 'center', opacity: INVADER_TAB_DIM_OPACITY },
    invaderTabActive: { opacity: 1 },
    invaderCount: { width: COUNT_TAB_HEXAGON, color: INVADER_COLORS.tabInk, fontSize: 25 * s, textAlign: 'center', textShadowColor: INVADER_COLORS.tabShadow, textShadowRadius: INVADER_COUNT_SHADOW_RADIUS },
    invaderCountSingle: { fontSize: 30 * s },
    // Two digits (x10) in the hexagon: smaller, or Play (Cyrillic) cuts it short.
    invaderCountWide: { fontSize: 19 * s },
    invaderCountSingleWide: { fontSize: 23 * s },
    // The sentence of an Extra Activation tab sits in the part of the bar that stays inside the card.
    invaderActivation: { width: '100%', fontSize: 12 * s, lineHeight: 12 * s },
    // Starts after the hexagon (COUNT_TAB_HEXAGON of the tab) and stays inside the card.
    invaderActivationBox: { marginLeft: COUNT_TAB_HEXAGON, width: INVADER_ACTIVATION_WIDTH },
    // Dark red rule box over the bottom of the picture, nearly the full width of the card.
    invaderRule: { position: 'absolute', top: '60%', bottom: '9%', left: '3%', right: '3%' },
    invaderRuleInner: { position: 'absolute', top: INVADER_RULE_INSET, bottom: INVADER_RULE_INSET, left: INVADER_RULE_INSET, right: INVADER_RULE_INSET, justifyContent: 'center' },
    // Sized by `InvaderFace` from the length of the rule; this scale only applies the card width to it.
    invaderRuleText: { color: INVADER_COLORS.ruleInk, fontStyle: 'italic', textAlign: 'left' },
    invaderInfo: { position: 'absolute', left: '6%', top: '18.5%' },
    fantasyBigLabel: {
      flexShrink: 1,
      color: CARD_COLORS.parchmentInk,
      backgroundColor: CARD_COLORS.parchmentRow,
      borderRadius: 3 * s,
      paddingHorizontal: 6 * s,
      paddingVertical: 2 * s,
      fontSize: 13 * s,
      fontWeight: '800',
      fontStyle: 'italic',
      textAlign: 'center',
    },
    fantasyNote: { alignSelf: 'center', color: CARD_COLORS.parchmentInk, fontSize: 11 * s, fontWeight: '700', fontStyle: 'italic', textAlign: 'left' },
    fantasyNoteLarge: { fontSize: 18 * s },
    hordeBadge: {
      marginLeft: 4 * s,
      minWidth: 22 * s,
      height: 22 * s,
      borderRadius: 11 * s,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: CARD_COLORS.horde,
      borderWidth: 1.5 * s,
      borderColor: '#ffffff',
    },
    hordeText: { color: '#ffffff', fontSize: 10 * s, fontWeight: '900' },
    fantasyRuleBody: { flex: 1, padding: 6 * s, backgroundColor: CARD_COLORS.fantasyFrame, overflow: 'hidden' },
    fantasyNamedArt: { flex: 1, minHeight: 0, overflow: 'hidden', backgroundColor: CARD_COLORS.parchment },
    fantasyRuleArt: { flex: 1, minHeight: RULE_ART_MIN_HEIGHT * s, overflow: 'hidden', backgroundColor: CARD_COLORS.parchment },
    // Takes the height it needs but gives way to the picture, and scrolls when it is longer than what is left.
    fantasyRuleScroll: { flexGrow: 0, flexShrink: 1 },
    fantasyRuleCaption: { gap: 4 * s, backgroundColor: CARD_COLORS.parchmentRow },
    fantasyRule: {
      color: CARD_COLORS.parchmentInk,
      backgroundColor: CARD_COLORS.parchmentRow,
      borderRadius: 4 * s,
      padding: 8 * s,
      fontSize: 12 * s,
      lineHeight: 15 * s,
      fontWeight: '700',
      textAlign: 'center',
    },
    fantasyHordeRule: {
      color: '#ffffff',
      backgroundColor: CARD_COLORS.horde,
      borderRadius: 4 * s,
      padding: 6 * s,
      fontSize: 11 * s,
      fontWeight: '800',
      textAlign: 'center',
    },
    // Western planks: wood colour, grain lines, a darker edge.
    plank: { backgroundColor: WESTERN_COLORS.header.background, overflow: 'hidden', borderBottomWidth: 2 * s, borderBottomColor: WESTERN_COLORS.plankDark },
    grain: { position: 'absolute', height: 1 * s, backgroundColor: WESTERN_COLORS.grain, opacity: 0.55 },
    westernHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 * s, paddingHorizontal: 10 * s, paddingTop: 9 * s, paddingBottom: 6 * s, minHeight: 62 * s },
    // The red brush stroke along the top edge of a printed header.
    westernBrush: { position: 'absolute', top: 0, left: 0, width: '58%', height: 5 * s, backgroundColor: WESTERN_COLORS.brush, borderBottomRightRadius: 8 * s },
    westernTitleBox: { flex: 1, minWidth: 0 },
    westernTitle: { color: WESTERN_COLORS.header.text, fontSize: 23 * s, lineHeight: 23 * s, fontWeight: 'normal', textTransform: 'uppercase', ...westernGlow(s) },
    westernTitleRule: { height: 2 * s, marginTop: 2 * s, backgroundColor: WESTERN_COLORS.header.text, opacity: 0.8 },
    westernSubtitle: { color: WESTERN_COLORS.header.text, fontSize: 10 * s, lineHeight: 12 * s, fontWeight: 'normal', textTransform: 'uppercase', ...westernGlow(s) },
    westernBody: { flex: 1 },
    // The picture of an Abomination card: the printed window is landscape (the official art is cut to this ratio).
    westernWindow: { width: '100%', overflow: 'hidden', borderBottomWidth: 2 * s, borderBottomColor: WESTERN_COLORS.plankDark },
    westernPictureOnly: { flex: 1, width: '100%', overflow: 'hidden' },
    westernPanel: { flex: 1, justifyContent: 'center', paddingHorizontal: 10 * s, paddingVertical: 6 * s, borderBottomWidth: 0 },
    // What the app writes over a printed card (see WESTERN_LAYOUTS): the title sits on the bottom edge of its box.
    westernTitleSlot: { position: 'absolute', justifyContent: 'flex-end' },
    westernCenteredBox: { alignItems: 'center' },
    westernCenteredText: { textAlign: 'center' },
    westernPrintedTitle: { fontSize: WESTERN_TITLE_SIZE * s, lineHeight: (WESTERN_TITLE_SIZE + 1) * s, fontWeight: 'normal', textTransform: 'uppercase', ...westernGlow(s) },
    // Two lines of this fill the title box (0.096 of the card): for a title of several words that does not fit on one
    // line at the size above (`westernOneLine`).
    westernPrintedTitleTwoLines: { fontSize: 15 * s, lineHeight: 15 * s },
    westernExtraTitle: { fontSize: 18 * s, lineHeight: 17 * s, fontWeight: 'normal', textTransform: 'uppercase', ...westernGlow(s) },
    westernNumber: { color: WESTERN_COLORS.header.text, opacity: 0.9, fontSize: 11 * s, fontWeight: 'normal', textAlign: 'right', lineHeight: 11.5 * s, ...westernGlow(s) },
    westernFooterBox: { alignItems: 'center', justifyContent: 'center' },
    // Count label: cream paper, a dark edge on its left and underside as on the printed one, the strip at its end.
    westernLabel: { position: 'absolute', right: 0, overflow: 'hidden' },
    // With the hand-drawn label under it, the drawn edge and paper are not needed.
    plankPicture: { backgroundColor: 'transparent', borderBottomWidth: 0 },
    westernLabelPaperFill: { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: WESTERN_COLORS.paper, borderLeftWidth: 2 * s, borderBottomWidth: 3 * s, borderColor: WESTERN_COLORS.labelEdge },
    westernLabelText: { position: 'absolute', top: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
    westernLabelCount: { color: WESTERN_COLORS.paperInk, fontSize: 28 * s, lineHeight: 34 * s, includeFontPadding: false, fontWeight: 'normal' },
    westernLabelCountBig: { fontSize: 33 * s, lineHeight: 40 * s },
    westernLabelX: { fontSize: 20 * s, fontWeight: 'normal' },
    westernLabelSentence: { color: WESTERN_COLORS.paperInk, fontSize: 17 * s, lineHeight: 22 * s, includeFontPadding: false, fontWeight: 'normal', textAlign: 'center' },
    westernLabelTwoLines: { fontSize: 13 * s, lineHeight: 15 * s },
    westernLabelSentenceBig: { fontSize: 19 * s, lineHeight: 24 * s },
    westernFooterText: { color: WESTERN_COLORS.header.text, fontSize: 11 * s, fontWeight: 'normal', textAlign: 'center' },
    westernExtraFooterText: { color: WESTERN_COLORS.header.text, fontSize: 12 * s, textAlign: 'center', fontWeight: 'normal' },
    westernPanelText: { color: WESTERN_COLORS.header.text, fontSize: 10 * s, lineHeight: 12.5 * s, textAlign: 'center', fontWeight: 'normal' },
    face: { flex: 1, borderRadius: 12 * s, overflow: 'hidden', backgroundColor: CARD_COLORS.body },
    header: { flexDirection: 'row', gap: 6 * s, paddingHorizontal: 10 * s, paddingVertical: 6 * s, minHeight: 44 * s },
    title: { flex: 1, fontSize: 15 * s, lineHeight: 17 * s, fontWeight: '900', textTransform: 'uppercase' },
    levelSymbolWrap: { alignItems: 'center', justifyContent: 'center', height: 60 * s, marginTop: -52 * s, marginBottom: 2 * s },
    levelSymbolBadge: {
      width: 56 * s,
      height: 56 * s,
      borderRadius: 28 * s,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f2efe6',
      borderColor: '#1b1a15',
      borderWidth: 2 * s,
      shadowColor: '#000000',
      shadowOpacity: 0.25,
      shadowRadius: 2.5 * s,
      shadowOffset: { width: 0, height: 1 * s },
    },
    shooterSymbolBadge: { backgroundColor: '#ffffff', borderColor: '#d8352a', borderWidth: 4 * s },
    number: { fontSize: 10 * s, fontWeight: '700', opacity: 0.8 },
    body: { flex: 1 },
    art: { height: '100%', aspectRatio: 0.5, overflow: 'hidden' },
    artShort: { flex: 1, minHeight: 72 * s, overflow: 'hidden' },
    textBody: { gap: 4 * s, paddingHorizontal: 10 * s, paddingVertical: 8 * s },
    bodyHeading: { fontSize: 10 * s, fontWeight: '900', textTransform: 'uppercase' },
    bodyText: { fontSize: 11 * s, lineHeight: 13 * s, fontWeight: '600' },
    spawnBody: { flex: 1, flexDirection: 'row' },
    levels: { flex: 1, justifyContent: 'center', gap: 4 * s, backgroundColor: CARD_COLORS.back },
    level: { flexDirection: 'row', height: 32 * s, backgroundColor: '#ffffff', borderTopLeftRadius: 3 * s, borderBottomLeftRadius: 3 * s, borderWidth: 1 * s, borderRightWidth: 0, borderColor: CARD_COLORS.ink },
    levelActive: { height: 46 * s, marginLeft: -12 * s, borderWidth: 3 * s, borderRightWidth: 0 },
    levelValue: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 * s },
    levelLarge: { height: 110 * s },
    levelText: { color: CARD_COLORS.ink, fontSize: 15 * s, fontWeight: '700' },
    levelTextActive: { fontSize: 26 * s, fontWeight: '900' },
    levelTextLarge: { fontSize: 56 * s },
    levelTextWideLarge: { fontSize: 15 * s, lineHeight: 18 * s },
    levelTextWide: { color: CARD_COLORS.ink, fontSize: 10 * s, lineHeight: 12 * s, fontWeight: '600', textAlign: 'center' },
    levelTextWideActive: { fontSize: 11 * s, fontWeight: '900' },
    // The "i" in the header: this card has a rule on its back. White ring on ink, so it reads on every header colour.
    // A short rule under the picture (the longer ones are on the back).
    footer: { paddingHorizontal: 8 * s, paddingVertical: 5 * s },
    footerText: { fontSize: 11 * s, fontWeight: '700', textAlign: 'center' },
    infoBadge: {
      width: 20 * s,
      height: 20 * s,
      borderRadius: 10 * s,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: CARD_COLORS.ink,
      borderWidth: 1.5 * s,
      borderColor: '#ffffff',
    },
    infoBadgeText: { color: '#ffffff', fontSize: 12 * s, lineHeight: 14 * s, fontWeight: '900', fontStyle: 'italic' },
    // The back: the text takes the whole card under the header and scrolls when it is longer.
    sideFrame: { flex: 1, padding: 6 * s },
    sideBox: { flex: 1, borderRadius: 4 * s },
    sideContent: { gap: 8 * s, padding: 10 * s },
    sideName: { fontSize: 17 * s, lineHeight: 21 * s, fontWeight: '900', textAlign: 'center' },
    sideRevealed: { fontSize: 13 * s, lineHeight: 17 * s, fontWeight: '800', fontStyle: 'italic', textAlign: 'left' },
    sideText: { fontSize: 14 * s, lineHeight: 19 * s, fontWeight: '600' },
  });
}
