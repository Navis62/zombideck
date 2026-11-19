import { createContext, useContext, useMemo, useState } from 'react';
import { Image, type ImageSourcePropType, type ImageStyle, type LayoutChangeEvent, Platform, Pressable, ScrollView, type StyleProp, StyleSheet, Text, type TextStyle, View } from 'react-native';
import Svg, { Path, Polygon } from 'react-native-svg';

import { SCROLL_TRACKING } from '@/components/scroll-guard';
import { type ArtSubject, artSubject, ZombieFigure } from '@/components/zombie-art';
import { ABOMINATIONS, BOSS_RULE_IDS, type BossRuleId, NAMED_NECROMANCERS, NAMED_ZOMBIES, PLAIN_RULE_NECROMANCERS } from '@/data/fantasy';
import { type BossName, isBossName, isModernAbomination } from '@/data/threat';
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
  isFantasyCard,
  isInvaderCard,
  NO_BOSS,
  NO_DECK,
  type ModernCard,
  type ZombieCard,
  type ZombieType,
} from '@/game/types';
import type { Translate, TranslationKey } from '@/i18n/translations';
import { CARD_COLORS, DANGER_COLORS, INVADER_COLORS, PRESSED } from '@/theme';

// Printed top-down on the cards, red first.
const PRINTED_LEVELS = [...DANGER_LEVELS].reverse();

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
function useWordFit(text: string | undefined, textStyle: StyleProp<TextStyle>, inset: number) {
  const [width, setWidth] = useState(0);
  const longest = text ? Math.max(...text.split(/\s+/).map((word) => word.length)) : 0;
  const base = StyleSheet.flatten(textStyle) as { fontSize: number; lineHeight?: number };
  const fit = width > 0 && longest > 0 ? Math.max(MIN_WORD_FIT, Math.min(1, (width - inset) / (longest * CHAR_WIDTH_EM * base.fontSize))) : 1;
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
function NameLabel(props: { style: StyleProp<TextStyle>; minimumFontScale: number; padding?: number; row?: boolean; badge?: React.ReactNode; text: string }) {
  const { styles, scale } = useContext(CardStyle);
  const fit = useWordFit(props.text, props.style, ((props.padding ?? 0) * 2 + (props.badge ? HORDE_BADGE_RESERVE : 0)) * scale);
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

/** A modern card whose Abomination comes from the Abomination deck (see `bossTrigger`). */
const callsAbominationDeck = (card: ZombieCard): card is Extract<ModernCard, { kind: 'spawn' }> =>
  card.kind === 'spawn' && card.zombie === 'abomination';

/** The Abomination a modern card revealed, to draw in place of the generic one. */
const revealedAbomination = (card: ZombieCard, reveal?: Reveal): NamedModernAbomination | undefined =>
  callsAbominationDeck(card) && reveal?.kind === 'abomination' && isBoss(reveal) && isModernAbomination(reveal.boss) ? reveal.boss : undefined;

/** The name of the boss a reveal holds, if it names one the decks know. */
const revealedName = (reveal?: Reveal): BossName | undefined => (reveal && isBoss(reveal) && isBossName(reveal.boss) ? reveal.boss : undefined);

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
  const none = t(reveal.boss === NO_DECK ? 'boss.abominationNoDeck' : 'boss.abominationNone');
  const { before, after } = groupLines(reveal, t);
  return {
    title: named ? t(`zombie.${named}.one`) : t('game.manualBoss'),
    spoken: '',
    footer: [...before, named ? rule : none, ...after].filter(Boolean).join('\n'),
  };
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

/**
 * Whether the card has a long text for its back: a rule, the boss it revealed, what its powers added. A short one
 * stays on the front (see `SHORT_TEXT_MAX_CHARS`), and so does the card. A revealed boss's own printed rule, which the
 * front no longer has room for, always goes to the back.
 */
export function cardHasBack(card: ZombieCard, danger: DangerLevel, t: Translate, reveal?: Reveal): boolean {
  const shown = asRevealed(card, reveal);
  const { footer } = cardText(shown, danger, t, reveal);
  const printed = isFantasyCard(shown) && revealedName(reveal) && (shown.kind === 'bossCall' || shown.kind === 'necromancer');
  return !!footer && (!isShort(footer) || !!printed);
}

/** An Abomination drawn by hand has its rule (or what is missing from its deck) on the back, unless that is short. */
export const bossHasBack = (reveal: Reveal, t: Translate): boolean => {
  const { footer } = bossFaceText(reveal, t);
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

const extraLine = (zombie: ExtraZombie | InvaderXeno, at: DangerLevel, t: Translate) =>
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

/** Sci-fi card: Modern layout (picture, Danger Levels) in cold colours; the cards without levels print their rule below. */
function InvaderFace({ card, danger, text, footerOnFront }: { card: InvaderCard; danger: DangerLevel; text: CardText; footerOnFront: boolean }) {
  const { t, cardDisplay } = useApp();
  const { styles } = useContext(CardStyle);
  const current = cardDisplay === 'current';
  const header = headerFor(card);
  const panel = { backgroundColor: INVADER_COLORS.panel };
  if (card.kind === 'xenoAbomination') {
    return (
      <Frame card={card} text={text} headerColor={header} faceColor={INVADER_COLORS.face} footerOnFront={footerOnFront}>
        <View style={styles.artShort}>
          <ZombieFigure subject={card.zombie} anchor="upper" />
        </View>
      </Frame>
    );
  }
  return (
    <Frame card={card} text={text} headerColor={header} faceColor={INVADER_COLORS.face} footerOnFront={footerOnFront}>
      <View style={styles.spawnBody}>
        <View style={styles.art}>
          <ZombieFigure subject={card.zombie} anchor="center" />
        </View>
        <View style={[styles.levels, panel]}>
          {card.kind === 'zoneSpawn' && <Text style={styles.zoneCount}>×{card.count}</Text>}
          {card.kind === 'xeno' &&
            (current ? (
              <Level level={danger} active large>
                ×{card.counts[DANGER_LEVELS.indexOf(danger)]}
              </Level>
            ) : (
              PRINTED_LEVELS.map((shown) => (
                <Level key={shown} level={shown} active={shown === danger}>
                  ×{card.counts[DANGER_LEVELS.indexOf(shown)]}
                </Level>
              ))
            ))}
          {card.kind === 'xenoExtra' &&
            (current ? [danger] : PRINTED_LEVELS).map((shown) => (
              <Level key={shown} level={shown} active={shown === danger} wide large={current}>
                {extraLine(card.zombie, shown, t)}
              </Level>
            ))}
        </View>
      </View>
    </Frame>
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
  const { title, spoken, footer } = props.text;
  const announced = useContext(CardAnnounced);
  return (
    <View
      style={[styles.face, props.faceColor !== undefined && { backgroundColor: props.faceColor }]}
      // The rule on the back is read with the front: a screen reader never needs to turn the card.
      {...(announced ? HIDDEN_FROM_READER : { accessible: true, accessibilityLabel: sentences([title, spoken, footer]) })}
    >
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
function CardHeader(props: { card?: ZombieCard; title: string; color: Colors; badge?: boolean }) {
  const { styles } = useContext(CardStyle);
  return (
    <View style={[styles.header, { backgroundColor: props.color.background }]}>
      <Text style={[styles.title, { color: props.color.text }]} numberOfLines={3}>
        {props.title}
      </Text>
      <Text style={[styles.number, { color: props.color.text }]}>{props.card && /\d{3}$/.test(props.card.id) ? `#${props.card.id.slice(-3)}` : ''}</Text>
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
  if (card.kind === 'extra') return CARD_COLORS.extra;
  return card.kind === 'rush' || card.kind === 'trejoRush' ? CARD_COLORS.rush : CARD_COLORS.spawn;
}

const universeOf = (card: ZombieCard): UniverseId => (isFantasyCard(card) ? 'fantasy' : isInvaderCard(card) ? 'invader' : 'modern');

/** The panel the back's text sits on, per universe: its frame, the box under the text and the ink on it. */
const SIDE_PANEL: Record<UniverseId, { frame: string; box: string; ink: string }> = {
  modern: { frame: CARD_COLORS.back, box: CARD_COLORS.spawn.background, ink: CARD_COLORS.spawn.text },
  fantasy: { frame: CARD_COLORS.fantasyFrame, box: CARD_COLORS.parchmentRow, ink: CARD_COLORS.parchmentInk },
  invader: { frame: INVADER_COLORS.panel, box: INVADER_COLORS.panel, ink: INVADER_COLORS.header.text },
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
        <CardHeader card={props.card} title={title} color={props.header} />
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
type RuledBoss = BossRuleId | NamedModernAbomination;

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
  if (reveal.boss === NO_DECK) return { ...text, footer: t(isNecromancer ? 'boss.necromancerNoDeck' : 'boss.abominationNoDeck') };
  if (reveal.boss === NO_BOSS) return { ...text, footer: t(isNecromancer ? 'boss.necromancerNone' : 'boss.abominationNone') };
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
    zoneCount: { color: INVADER_COLORS.header.text, fontSize: 56 * s, fontWeight: '900', textAlign: 'center' },
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
    fantasyNote: { alignSelf: 'center', color: CARD_COLORS.parchmentInk, fontSize: 11 * s, fontWeight: '700', fontStyle: 'italic', textAlign: 'center' },
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
    sideRevealed: { fontSize: 13 * s, lineHeight: 17 * s, fontWeight: '800', fontStyle: 'italic', textAlign: 'center' },
    sideText: { fontSize: 14 * s, lineHeight: 19 * s, fontWeight: '600' },
  });
}
