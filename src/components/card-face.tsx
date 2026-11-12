import { createContext, useContext, useMemo } from 'react';
import { Image, type ImageSourcePropType, type ImageStyle, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Polygon } from 'react-native-svg';

import { type ArtSubject, artSubject, ZombieFigure } from '@/components/zombie-art';
import { ABOMINATIONS, BOSS_RULE_IDS, type BossRuleId, NAMED_NECROMANCERS, NAMED_ZOMBIES } from '@/data/fantasy';
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
  type FantasyZombie,
  type NamedNecromancer,
  isFantasyCard,
  NO_BOSS,
  NO_DECK,
  type ModernCard,
  type ZombieCard,
  type ZombieType,
} from '@/game/types';
import type { Translate } from '@/i18n/translations';
import { CARD_COLORS, DANGER_COLORS } from '@/theme';

// Printed top-down on the cards, red first.
const PRINTED_LEVELS = [...DANGER_LEVELS].reverse();

/** Card width the sizes below were drawn for (a phone in landscape); the card scales from it. */
const DESIGN_WIDTH = 230;
/**
 * Smallest height of the picture on a rule card (boss calls, Necromancers, Double Spawn...), in design pixels. The rule
 * text below it scrolls instead of taking the whole card, so the head of the boss stays in view on a short phone.
 */
const RULE_ART_MIN_HEIGHT = 80;

type CardStyles = ReturnType<typeof makeStyles>;
const CardStyle = createContext<{ styles: CardStyles; scale: number }>({ styles: makeStyles(1), scale: 1 });

/**
 * The boss a card revealed from its deck (Dead Men Tales rules), its kind and how it arrives; `boss` is empty when
 * every boss of the deck was already on display.
 */
export type Reveal = { kind: BossKind; boss: string; rule: BossRule };

/** `width` is the width the card is drawn at: text, symbols and Danger Levels grow with it. */
export function CardFace({ card, danger, width, reveal }: { card: ZombieCard; danger: DangerLevel; width: number; reveal?: Reveal }) {
  const scale = Math.max(0.5, width / DESIGN_WIDTH);
  const style = useMemo(() => ({ styles: makeStyles(scale), scale }), [scale]);
  return (
    <CardStyle.Provider value={style}>
      <Card card={card} danger={danger} reveal={reveal} />
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

/** Title, footer and what a screen reader says about the body of a card, at the given Danger Level. */
function cardText(card: ZombieCard, danger: DangerLevel, t: Translate, reveal?: Reveal): CardText {
  if (isFantasyCard(card)) return withReveal(fantasyText(card, danger, t), reveal, t, card.kind !== 'necromancer');
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
      return {
        title: card.kind === 'rush' ? t('card.rushTitle', { zombies: t(`zombie.${card.zombie}.rush`) }) : zombies,
        footer: isRush ? t('card.rushRule') : card.zombie === 'seeker' ? t('card.seekerRule') : undefined,
        spoken: `${level}: ${card.counts[DANGER_LEVELS.indexOf(danger)]} ${zombies}`,
      };
    }
  }
}

/** The whole card as a screen reader says it, to announce a card as it is drawn. */
export function cardLabel(card: ZombieCard, danger: DangerLevel, t: Translate, reveal?: Reveal): string {
  const { title, spoken, footer } = cardText(asRevealed(card, reveal), danger, t, reveal);
  return sentences([title, spoken, footer]);
}

const trejoChoices = (isRush: boolean) => ['card.trejo1', 'card.trejo2', isRush ? 'card.trejo3Rush' : 'card.trejo3'] as const;

const extraLine = (zombie: ExtraZombie, at: DangerLevel, t: Translate) =>
  at === 'blue' ? t('card.extraNobody') : t(`zombie.${zombie}.all`);

function Card({ card: printed, danger, reveal }: { card: ZombieCard; danger: DangerLevel; reveal?: Reveal }) {
  const { t, cardDisplay } = useApp();
  const { styles } = useContext(CardStyle);
  const card = asRevealed(printed, reveal);
  const text = cardText(card, danger, t, reveal);

  if (isFantasyCard(card)) return <FantasyFace card={card} danger={danger} text={text} reveal={reveal} />;

  if (card.kind === 'trejo' || card.kind === 'trejoRush') {
    const isRush = card.kind === 'trejoRush';
    const choices = trejoChoices(isRush);
    return (
      <Frame card={card} text={text} headerColor={isRush ? CARD_COLORS.rush : CARD_COLORS.spawn}>
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
      <Frame card={card} text={text} headerColor={CARD_COLORS.spawn}>
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
      <Frame card={card} text={text} headerColor={CARD_COLORS.extra}>
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

  const isRush = card.kind === 'rush';
  const { counts } = card;
  return (
    <Frame card={card} text={text} headerColor={isRush ? CARD_COLORS.rush : CARD_COLORS.spawn}>
      <View style={styles.spawnBody}>
        <Art card={card} />
        <View style={styles.levels}>
          <LevelSymbol kind={symbol} />
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
  toxic: { source: require('../../assets/icons/toxic-biohazard-symbol.png'), style: { width: 48, height: 48 } },
  berserker: {
    source: require('../../assets/icons/berserker-bowie-symbol.png'),
    style: { width: 48, height: 48, marginTop: -1 },
  },
  skinner: {
    source: require('../../assets/icons/skinner-razor-symbol.png'),
    style: { width: 44, height: 44, transform: [{ rotate: '-90deg' }, { scaleX: -1 }] },
  },
  dog: { source: require('../../assets/icons/dog-paw-symbol.png'), style: { width: 50, height: 50 } },
  crow: { source: require('../../assets/icons/crow-real-symbol.png'), style: { width: 62, height: 62, marginTop: -2 } },
  seeker: { source: require('../../assets/icons/seeker-eye-symbol.png'), style: { width: 50, height: 50 } },
  lostZombivor: {
    source: require('../../assets/icons/lost-zombivor-chain-symbol.png'),
    style: { width: 62, height: 62, tintColor: '#6a2c91', transform: [{ rotate: '-45deg' }] },
  },
  // Printed on the Fort Hendrix cards as an M4A1 in a red circle, barrel up-left.
  shooter: {
    source: require('../../assets/icons/shooter-m4a1-symbol.png'),
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
const sentences = (parts: (string | undefined)[]) =>
  parts
    .filter((part): part is string => !!part)
    .map((part) => (/[.!?:]$/.test(part) ? part : `${part}.`))
    .join(' ');

function Frame(props: {
  card: ZombieCard;
  text: CardText;
  headerColor: { background: string; text: string };
  /** The card stock: orange for the modern cards, parchment for the fantasy ones. */
  faceColor?: string;
  children: React.ReactNode;
}) {
  const { styles } = useContext(CardStyle);
  const { title, spoken, footer } = props.text;
  return (
    <View
      style={[styles.face, props.faceColor !== undefined && { backgroundColor: props.faceColor }]}
      accessible
      accessibilityLabel={sentences([title, spoken, footer])}
    >
      <View style={[styles.header, { backgroundColor: props.headerColor.background }]}>
        <Text style={[styles.title, { color: props.headerColor.text }]} numberOfLines={3}>
          {title}
        </Text>
        <Text style={[styles.number, { color: props.headerColor.text }]}>#{props.card.id.slice(-3)}</Text>
      </View>
      <View style={styles.body}>{props.children}</View>
      {footer && (
        <View style={[styles.footer, { backgroundColor: props.headerColor.background }]}>
          <ScrollView>
            <Text style={[styles.footerText, { color: props.headerColor.text }]}>{footer}</Text>
          </ScrollView>
        </View>
      )}
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
  return (
    <View style={[styles.level, props.active && styles.levelActive, props.large && styles.levelLarge]}>
      <View style={styles.levelValue}>
        <Text
          style={[
            props.wide ? styles.levelTextWide : styles.levelText,
            props.active && (props.wide ? styles.levelTextWideActive : styles.levelTextActive),
            props.large && (props.wide ? styles.levelTextWideLarge : styles.levelTextLarge),
          ]}
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

/** The Horde symbol applies to every zombie a level spawns, but not to an Abomination. */
const feedsHorde = (card: FantasyCard, level: FantasyLevel) =>
  card.kind === 'levels' && !!card.horde && !!level && !ABOMINATIONS.has(level.zombie);

/** The rule printed on a card without Danger Levels, one paragraph per line. */
function fantasyRule(card: FantasyCard, t: Translate): string[] {
  switch (card.kind) {
    case 'necromancer':
      if (isNamedNecromancer(card.zombie)) return [t('card.namedNecromancerRule'), t(`card.${card.zombie}Rule`)];
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
  if (!level) return { value: t('card.nothingInSight'), spoken: t('card.nothingInSight') };
  // Named Abominations are printed as a picture across the levels, without a count.
  if (NAMED_ZOMBIES.has(level.zombie)) {
    const name = t(`zombie.${level.zombie}.one`);
    return { value: name, spoken: name };
  }
  const horde = feedsHorde(card, level) ? `, ${t('card.hordeBonus')}` : '';
  return {
    label: t(`zombie.${level.zombie}.one`),
    value: `×${level.count}`,
    spoken: `${level.count} ${t(`zombie.${level.zombie}.${level.count === 1 ? 'one' : 'other'}`)}${horde}`,
  };
}

/** Zombies with a name in every language, as `zombie.<type>.one`. */
type FantasyZombieName = FantasyZombie | FantasyNecromancer;

const isNamedNecromancer = (zombie: FantasyNecromancer): zombie is NamedNecromancer => NAMED_NECROMANCERS.has(zombie);

/** The picture of a card without Danger Levels: its Necromancer, the boss a White Death card revealed, or a horde. */
function ruleArt(card: FantasyCard, reveal?: Reveal): ArtSubject {
  switch (card.kind) {
    case 'necromancer':
      return card.zombie;
    case 'bossCall':
      if (reveal && isBoss(reveal)) return reveal.boss as ArtSubject;
      if (card.boss === 'necromancer') return card.setId === 'eternalEmpire' ? 'necromancer' : 'defilerNecromancer';
      return card.setId === 'eternalEmpire' ? 'godEaterAbomination' : 'khanAbomination';
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
        footer: card.adds ? t('card.addsOne', { name: t(`zombie.${card.adds}.one`) }) : undefined,
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

/** The boss revealed from its deck, named under the card with the way it arrives. */
function withReveal(text: CardText, reveal: Reveal | undefined, t: Translate, withRule = true): CardText {
  if (!reveal) return text;
  const isNecromancer = reveal.kind === 'necromancer';
  if (reveal.boss === NO_DECK) return { ...text, footer: t(isNecromancer ? 'boss.necromancerNoDeck' : 'boss.abominationNoDeck') };
  if (reveal.boss === NO_BOSS) return { ...text, footer: t(isNecromancer ? 'boss.necromancerNone' : 'boss.abominationNone') };
  const name = t(`zombie.${reveal.boss as FantasyZombieName}.one`);
  const rule = isNecromancer ? 'boss.necromancer' : reveal.rule === 'fest' ? 'boss.abominationFest' : 'boss.abomination';
  // A Necromancer card already reads as the Necromancer it revealed, its rule included.
  const own = withRule && hasRule(reveal.boss) ? ` ${t(`card.${reveal.boss}Rule`)}` : '';
  return { ...text, footer: `${t(rule, { name })}${own}` };
}

/** Fantasy era card: parchment stock, the printed title, then the Danger Levels red first, or the rule of the card. */
function FantasyFace({ card, danger, text, reveal }: { card: FantasyCard; danger: DangerLevel; text: CardText; reveal?: Reveal }) {
  const { t, cardDisplay } = useApp();
  const { styles } = useContext(CardStyle);
  const current = cardDisplay === 'current';
  const shown = current ? [danger] : PRINTED_LEVELS;
  // A named Abomination is printed as one picture across its levels: shown above them, so it stays in view at Blue too.
  const named =
    card.kind === 'levels' && card.title === 'named' ? (card.boss ?? card.levels.find((level) => level !== null)?.zombie) : undefined;
  return (
    <Frame card={card} text={text} headerColor={FANTASY_HEADER} faceColor={CARD_COLORS.parchment}>
      {card.kind === 'levels' || card.kind === 'activation' ? (
        <View style={styles.fantasyLevels}>
          {named && (
            <View style={styles.fantasyNamedArt}>
              {/* Wider than tall: the head and chest of the creature, below the halo. */}
              <ZombieFigure subject={named} anchor="upper" />
            </View>
          )}
          {shown.map((at) => {
            const line = fantasyLine(card, at, t);
            const level = card.kind === 'levels' ? card.levels[DANGER_LEVELS.indexOf(at)] : null;
            // The Abomination revealed from its deck takes the place of the one printed.
            // It was drawn for the current Danger Level only: the other levels keep the Abomination printed.
            const boss =
              reveal && isBoss(reveal) && at === danger && level && ABOMINATIONS.has(level.zombie)
                ? (reveal.boss as ArtSubject)
                : undefined;
            return (
              <FantasyRow
                key={at}
                level={at}
                active={at === danger}
                large={current}
                subject={card.kind === 'activation' ? card.zombie : named ? undefined : (boss ?? level?.zombie)}
                label={boss ? t(`zombie.${boss as FantasyZombieName}.one`) : line.label}
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
          <ScrollView style={styles.fantasyRuleScroll} contentContainerStyle={styles.fantasyRuleCaption}>
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
        {counted && (
          <Text style={[styles.fantasyLabel, props.large && styles.fantasyLabelLarge]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.75}>
            {props.label}
          </Text>
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
    // A long boss rule (200-300 characters) scrolls inside the footer instead of squeezing the body and the levels.
    footer: { paddingHorizontal: 8 * s, paddingVertical: 5 * s, maxHeight: '40%' },
    footerText: { fontSize: 11 * s, fontWeight: '700', textAlign: 'center' },
  });
}
