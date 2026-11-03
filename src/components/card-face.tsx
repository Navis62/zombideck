import { Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path, Polygon } from 'react-native-svg';

import { artSubject, Scene, ZombieFigure } from '@/components/zombie-art';
import { DANGER_LEVELS } from '@/game/engine';
import { useApp } from '@/game/store';
import type { DangerLevel, ZombieCard } from '@/game/types';
import { CARD_LANGUAGE_NAMES } from '@/i18n/translations';
import { CARD_COLORS, DANGER_COLORS } from '@/theme';

// Printed top-down on the cards, red first.
const PRINTED_LEVELS = [...DANGER_LEVELS].reverse();
const SKINNER_RAZOR_SYMBOL = require('../../assets/icons/skinner-razor-symbol.png');
const CROW_REAL_SYMBOL = require('../../assets/icons/crow-real-symbol.png');
const LOST_ZOMBIVOR_CHAIN_SYMBOL = require('../../assets/icons/lost-zombivor-chain-symbol.png');
const BERSERKER_BOWIE_SYMBOL = require('../../assets/icons/berserker-bowie-symbol.png');
const TOXIC_BIOHAZARD_SYMBOL = require('../../assets/icons/toxic-biohazard-symbol.png');
const SEEKER_EYE_SYMBOL = require('../../assets/icons/seeker-eye-symbol.png');
const DOG_PAW_SYMBOL = require('../../assets/icons/dog-paw-symbol.png');
const SHOOTER_M4A1_SYMBOL = require('../../assets/icons/shooter-m4a1-symbol.png');

export function CardFace({ card, danger }: { card: ZombieCard; danger: DangerLevel }) {
  const { t } = useApp();

  if (card.kind === 'trejo' || card.kind === 'trejoRush') {
    const isRush = card.kind === 'trejoRush';
    return (
      <Frame
        card={card}
        title={isRush ? t('card.rushTitle', { zombies: 'Trejo' }) : 'Trejo'}
        headerColor={isRush ? CARD_COLORS.rush : CARD_COLORS.spawn}
      >
        <Art card={card} short />
        <View style={[styles.textBody, { backgroundColor: isRush ? CARD_COLORS.rush.background : CARD_COLORS.spawn.background }]}>
          <Text style={[styles.bodyHeading, { color: isRush ? CARD_COLORS.ink : '#ffffff' }]}>{t('card.trejoChoice')}</Text>
          {(['card.trejo1', 'card.trejo2', isRush ? 'card.trejo3Rush' : 'card.trejo3'] as const).map((key, index) => (
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
      <Frame card={card} title="Spam" headerColor={CARD_COLORS.spawn}>
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
    return (
      <Frame card={card} title={t('card.extra')} headerColor={CARD_COLORS.extra} footer={t('card.extraRule')}>
        <View style={styles.spawnBody}>
          <Art card={card} />
          <View style={styles.levels}>
            <LevelSymbol symbol={symbol} />
            {PRINTED_LEVELS.map((level) => (
              <Level key={level} level={level} active={level === danger} wide>
                {level === 'blue' ? t('card.extraNobody') : t('card.extraAll', { zombies })}
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
      title={isRush ? t('card.rushTitle', { zombies }) : zombies}
      headerColor={isRush ? CARD_COLORS.rush : CARD_COLORS.spawn}
      footer={isRush ? t('card.rushRule') : card.zombie === 'seeker' ? t('card.seekerRule') : undefined}
    >
      <View style={styles.spawnBody}>
        <Art card={card} />
        <View style={styles.levels}>
          <LevelSymbol symbol={symbol} />
          {PRINTED_LEVELS.map((level) => (
            <Level key={level} level={level} active={level === danger}>
              ×{counts[DANGER_LEVELS.indexOf(level)]}
            </Level>
          ))}
        </View>
      </View>
    </Frame>
  );
}

function Art({ card, short }: { card: ZombieCard; short?: boolean }) {
  return (
    <View style={short ? styles.artShort : styles.art}>
      <Scene />
      <ZombieFigure subject={artSubject(card)} />
    </View>
  );
}

type SymbolKind =
  | 'toxic'
  | 'berserker'
  | 'skinner'
  | 'dog'
  | 'crow'
  | 'seeker'
  | 'vip'
  | 'lostZombivor'
  | 'sillyWalker'
  | 'inquisitor'
  | 'shooter';

type SymbolDef = { kind: SymbolKind };

function LevelSymbol({ symbol }: { symbol: SymbolDef | null }) {
  if (!symbol) return null;
  return (
    <View style={styles.levelSymbolWrap}>
      <View style={[styles.levelSymbolBadge, symbol.kind === 'shooter' && styles.shooterSymbolBadge]}>
        {symbol.kind === 'toxic' ? (
          <Image source={TOXIC_BIOHAZARD_SYMBOL} style={styles.toxicSymbolImage} resizeMode="contain" />
        ) : symbol.kind === 'skinner' ? (
          <Image source={SKINNER_RAZOR_SYMBOL} style={styles.skinnerSymbolImage} resizeMode="contain" />
        ) : symbol.kind === 'berserker' ? (
          <Image source={BERSERKER_BOWIE_SYMBOL} style={styles.berserkerSymbolImage} resizeMode="contain" />
        ) : symbol.kind === 'seeker' ? (
          <Image source={SEEKER_EYE_SYMBOL} style={styles.seekerSymbolImage} resizeMode="contain" />
        ) : symbol.kind === 'dog' ? (
          <Image source={DOG_PAW_SYMBOL} style={styles.dogSymbolImage} resizeMode="contain" />
        ) : symbol.kind === 'crow' ? (
          <Image source={CROW_REAL_SYMBOL} style={styles.crowSymbolImage} resizeMode="contain" />
        ) : symbol.kind === 'lostZombivor' ? (
          <Image source={LOST_ZOMBIVOR_CHAIN_SYMBOL} style={styles.lostZombivorSymbolImage} resizeMode="contain" />
        ) : symbol.kind === 'shooter' ? (
          <Image source={SHOOTER_M4A1_SYMBOL} style={styles.shooterSymbolImage} resizeMode="contain" />
        ) : (
          <Svg width={44} height={44} viewBox="0 0 24 24">
            <SpecialIcon kind={symbol.kind} />
          </Svg>
        )}
      </View>
    </View>
  );
}

function SpecialIcon({ kind }: { kind: 'vip' | 'sillyWalker' | 'inquisitor' }) {
  switch (kind) {
    case 'vip':
      return (
        <Path
          d="M12 0.2 15.1 8.2 23.8 8.8 17.2 14.3 19.5 23.6 12 19.1 4.5 23.6 6.8 14.3.2 8.8 8.9 8.2z"
          fill="#5b2b78"
          transform="rotate(-20 12 12)"
        />
      );
    case 'sillyWalker':
      return <Path d="M5.5 13.2c0-4 3.2-7.2 7.1-7.2 3.3 0 5.9 2.7 5.9 5.9 0 2.7-2.2 4.9-4.9 4.9-2.1 0-3.8-1.7-3.8-3.8 0-1.6 1.3-2.9 2.9-2.9 1.2 0 2.2 1 2.2 2.2" fill="none" stroke="#1b1a15" strokeWidth="2.4" strokeLinecap="round" />;
    case 'inquisitor':
      return (
        <>
          <Line x1="12" y1="4.5" x2="12" y2="19.5" stroke="#1b1a15" strokeWidth="2.6" />
          <Line x1="7.5" y1="9.5" x2="16.5" y2="9.5" stroke="#1b1a15" strokeWidth="2.6" />
          <Line x1="5" y1="18.5" x2="19" y2="5.5" stroke="#d6a423" strokeWidth="2.8" />
        </>
      );
  }
}

function specialSymbol(card: ZombieCard): SymbolDef | null {
  if (card.kind !== 'spawn' && card.kind !== 'rush' && card.kind !== 'extra') return null;

  switch (card.zombie) {
    case 'toxicWalker':
    case 'toxicFatty':
    case 'toxicRunner':
      return { kind: 'toxic' };
    case 'berserkerWalker':
    case 'berserkerFatty':
    case 'berserkerRunner':
      return { kind: 'berserker' };
    case 'skinnerWalker':
    case 'skinnerFatty':
    case 'skinnerRunner':
      return { kind: 'skinner' };
    case 'dog':
      return { kind: 'dog' };
    case 'crow':
      return { kind: 'crow' };
    case 'seeker':
      return { kind: 'seeker' };
    case 'vip':
      return { kind: 'vip' };
    case 'lostZombivor':
      return { kind: 'lostZombivor' };
    case 'sillyWalker':
      return { kind: 'sillyWalker' };
    case 'inquisitor':
      return { kind: 'inquisitor' };
    default:
      return card.kind !== 'extra' && card.shooter ? { kind: 'shooter' } : null;
  }
}

function Frame(props: {
  card: ZombieCard;
  title: string;
  headerColor: { background: string; text: string };
  footer?: string;
  children: React.ReactNode;
}) {
  const { language } = useApp();
  return (
    <View style={styles.face}>
      <View style={[styles.header, { backgroundColor: props.headerColor.background }]}>
        <Text style={[styles.title, { color: props.headerColor.text }]} numberOfLines={3}>
          {props.title}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.number, { color: props.headerColor.text }]}>#{props.card.id.slice(-3)}</Text>
          <Text style={[styles.edition, language === 'en' ? styles.editionVo : styles.editionVf]}>
            {CARD_LANGUAGE_NAMES[language]}
          </Text>
        </View>
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

function Level(props: { level: DangerLevel; active: boolean; wide?: boolean; children: React.ReactNode }) {
  return (
    <View style={[styles.level, props.active && styles.levelActive]}>
      <View style={styles.levelValue}>
        <Text
          style={[
            props.wide ? styles.levelTextWide : styles.levelText,
            props.active && (props.wide ? styles.levelTextWideActive : styles.levelTextActive),
          ]}
        >
          {props.children}
        </Text>
      </View>
      {/* Torn paint stripe, as if sprayed on the card. */}
      <Svg width={20} height="100%" viewBox="0 0 20 34" preserveAspectRatio="none">
        <Polygon
          points="7,0 20,0 20,34 4,34 8,27 3,20 9,13 4,6"
          fill={DANGER_COLORS[props.level].background}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  face: { flex: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: CARD_COLORS.body },
  header: { flexDirection: 'row', gap: 6, paddingHorizontal: 10, paddingVertical: 6, minHeight: 44 },
  title: { flex: 1, fontSize: 15, lineHeight: 17, fontWeight: '900', textTransform: 'uppercase' },
  meta: { alignItems: 'flex-end', gap: 2 },
  levelSymbolWrap: { alignItems: 'center', justifyContent: 'center', height: 60, marginTop: -52, marginBottom: 2 },
  levelSymbolBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f2efe6',
    borderColor: '#1b1a15',
    borderWidth: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 2.5,
    shadowOffset: { width: 0, height: 1 },
  },
  skinnerSymbolImage: { width: 44, height: 44, transform: [{ rotate: '-90deg' }, { scaleX: -1 }] },
  berserkerSymbolImage: { width: 48, height: 48, marginTop: -1 },
  toxicSymbolImage: { width: 48, height: 48 },
  seekerSymbolImage: { width: 50, height: 50 },
  dogSymbolImage: { width: 50, height: 50 },
  crowSymbolImage: { width: 62, height: 62, marginTop: -2 },
  // Printed on the Fort Hendrix cards as an M4A1 in a red circle, barrel up-left.
  shooterSymbolBadge: { backgroundColor: '#ffffff', borderColor: '#d8352a', borderWidth: 4 },
  shooterSymbolImage: { width: 46, height: 46, transform: [{ rotate: '20deg' }] },
  lostZombivorSymbolImage: { width: 62, height: 62, tintColor: '#6a2c91', transform: [{ rotate: '-45deg' }] },
  number: { fontSize: 10, fontWeight: '700', opacity: 0.8 },
  edition: { fontSize: 9, fontWeight: '900', color: '#ffffff', paddingHorizontal: 4, borderRadius: 3, overflow: 'hidden' },
  editionVf: { backgroundColor: '#2f6fb5' },
  editionVo: { backgroundColor: '#5d7a2c' },
  body: { flex: 1 },
  art: { height: '100%', aspectRatio: 0.5, overflow: 'hidden' },
  artShort: { height: 72, overflow: 'hidden' },
  textBody: { flex: 1, justifyContent: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6 },
  bodyHeading: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  bodyText: { fontSize: 11, lineHeight: 13, fontWeight: '600' },
  spawnBody: { flex: 1, flexDirection: 'row' },
  levels: { flex: 1, justifyContent: 'center', gap: 4, backgroundColor: CARD_COLORS.back },
  level: { flexDirection: 'row', height: 32, backgroundColor: '#ffffff', borderTopLeftRadius: 3, borderBottomLeftRadius: 3, borderWidth: 1, borderRightWidth: 0, borderColor: CARD_COLORS.ink },
  levelActive: { height: 46, marginLeft: -12, borderWidth: 3, borderRightWidth: 0 },
  levelValue: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  levelText: { color: CARD_COLORS.ink, fontSize: 15, fontWeight: '700' },
  levelTextActive: { fontSize: 26, fontWeight: '900' },
  levelTextWide: { color: CARD_COLORS.ink, fontSize: 10, lineHeight: 12, fontWeight: '600', textAlign: 'center' },
  levelTextWideActive: { fontSize: 11, fontWeight: '900' },
  footer: { paddingHorizontal: 8, paddingVertical: 5 },
  footerText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
});
