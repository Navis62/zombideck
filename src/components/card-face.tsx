import { createContext, useContext, useMemo } from 'react';
import { Image, type ImageSourcePropType, type ImageStyle, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Polygon } from 'react-native-svg';

import { artSubject, ZombieFigure } from '@/components/zombie-art';
import { DANGER_LEVELS } from '@/game/engine';
import { useApp } from '@/game/store';
import type { DangerLevel, ZombieCard, ZombieType } from '@/game/types';
import { CARD_COLORS, DANGER_COLORS } from '@/theme';

// Printed top-down on the cards, red first.
const PRINTED_LEVELS = [...DANGER_LEVELS].reverse();

/** Card width the sizes below were drawn for (a phone in landscape); the card scales from it. */
const DESIGN_WIDTH = 230;

type CardStyles = ReturnType<typeof makeStyles>;
const CardStyle = createContext<{ styles: CardStyles; scale: number }>({ styles: makeStyles(1), scale: 1 });

/** `width` is the width the card is drawn at: text, symbols and Danger Levels grow with it. */
export function CardFace({ card, danger, width }: { card: ZombieCard; danger: DangerLevel; width: number }) {
  const scale = Math.max(0.5, width / DESIGN_WIDTH);
  const style = useMemo(() => ({ styles: makeStyles(scale), scale }), [scale]);
  return (
    <CardStyle.Provider value={style}>
      <Card card={card} danger={danger} />
    </CardStyle.Provider>
  );
}

function Card({ card, danger }: { card: ZombieCard; danger: DangerLevel }) {
  const { t, cardDisplay } = useApp();
  const { styles } = useContext(CardStyle);

  const level = t(`danger.${danger}`);

  if (card.kind === 'trejo' || card.kind === 'trejoRush') {
    const isRush = card.kind === 'trejoRush';
    const choices = ['card.trejo1', 'card.trejo2', isRush ? 'card.trejo3Rush' : 'card.trejo3'] as const;
    return (
      <Frame
        card={card}
        title={isRush ? t('card.rushTitle', { zombies: 'Trejo' }) : 'Trejo'}
        headerColor={isRush ? CARD_COLORS.rush : CARD_COLORS.spawn}
        spoken={[t('card.trejoChoice'), ...choices.map((key, index) => `${index + 1}. ${t(key)}`)].join(' ')}
      >
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
      <Frame card={card} title="Spam" headerColor={CARD_COLORS.spawn} spoken={`${t('card.spam1')} ${t('card.spam2')}`}>
        <Art card={card} short />
        <View style={[styles.textBody, { backgroundColor: CARD_COLORS.spawn.background }]}>
          <Text style={[styles.bodyText, { color: '#ffffff' }]}>{t('card.spam1')}</Text>
          <Text style={[styles.bodyText, { color: '#ffffff' }]}>{t('card.spam2')}</Text>
        </View>
      </Frame>
    );
  }

  const zombies = t(`zombie.${card.zombie}.other`);
  const symbol = specialSymbol(card);

  if (card.kind === 'extra') {
    const extraLine = (at: DangerLevel) => (at === 'blue' ? t('card.extraNobody') : t(`zombie.${card.zombie}.all`));
    return (
      <Frame
        card={card}
        title={t('card.extra')}
        headerColor={CARD_COLORS.extra}
        footer={t('card.extraRule')}
        spoken={`${level}: ${extraLine(danger)}`}
      >
        <View style={styles.spawnBody}>
          <Art card={card} />
          <View style={styles.levels}>
            <LevelSymbol kind={symbol} />
            {(cardDisplay === 'current' ? [danger] : PRINTED_LEVELS).map((shown) => (
              <Level key={shown} level={shown} active={shown === danger} wide large={cardDisplay === 'current'}>
                {extraLine(shown)}
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
    <Frame
      card={card}
      title={card.kind === 'rush' ? t('card.rushTitle', { zombies: t(`zombie.${card.zombie}.rush`) }) : zombies}
      headerColor={isRush ? CARD_COLORS.rush : CARD_COLORS.spawn}
      footer={isRush ? t('card.rushRule') : card.zombie === 'seeker' ? t('card.seekerRule') : undefined}
      spoken={`${level}: ${counts[DANGER_LEVELS.indexOf(danger)]} ${zombies}`}
    >
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

function Art({ card, short }: { card: ZombieCard; short?: boolean }) {
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

function specialSymbol(card: ZombieCard): SymbolKind | null {
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
  title: string;
  headerColor: { background: string; text: string };
  footer?: string;
  /** What a screen reader says about the card body, read between the title and the footer. */
  spoken: string;
  children: React.ReactNode;
}) {
  const { styles } = useContext(CardStyle);
  return (
    <View
      style={styles.face}
      accessible
      accessibilityLabel={sentences([props.title, props.spoken, props.footer])}
    >
      <View style={[styles.header, { backgroundColor: props.headerColor.background }]}>
        <Text style={[styles.title, { color: props.headerColor.text }]} numberOfLines={3}>
          {props.title}
        </Text>
        <Text style={[styles.number, { color: props.headerColor.text }]}>#{props.card.id.slice(-3)}</Text>
      </View>
      <View style={styles.body}>{props.children}</View>
      {props.footer && (
        <View style={[styles.footer, { backgroundColor: props.headerColor.background }]}>
          <Text style={[styles.footerText, { color: props.headerColor.text }]}>{props.footer}</Text>
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

// Sizes for a card DESIGN_WIDTH wide, multiplied by `s`.
function makeStyles(s: number) {
  return StyleSheet.create({
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
    footer: { paddingHorizontal: 8 * s, paddingVertical: 5 * s },
    footerText: { fontSize: 11 * s, fontWeight: '700', textAlign: 'center' },
  });
}
