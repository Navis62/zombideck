import Constants from 'expo-constants';
import { Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBackground } from '@/components/app-background';
import { Button } from '@/components/button';
import { useApp } from '@/game/store';
import { COLORS } from '@/theme';

const REPOSITORY = 'https://github.com/Navis62/zombideck';
const LINKS = {
  privacy: `${REPOSITORY}/blob/master/PRIVACY.md`,
  report: `${REPOSITORY}/issues`,
  support: 'https://buymeacoffee.com/navis62',
};

const open = (url: string) => Linking.openURL(url).catch((error) => console.warn('Could not open', url, error));

export default function AboutScreen() {
  const { t } = useApp();
  const version = Constants.expoConfig?.version;

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <AppBackground />
      <View style={styles.columns}>
        <ScrollView style={styles.column} contentContainerStyle={styles.content}>
          <Text style={styles.title}>
            ZOMBIE <Text style={styles.titleAccent}>DECK</Text>
          </Text>
          {version && <Text style={styles.muted}>{t('about.version', { v: version })}</Text>}
          <Text style={styles.text}>{t('about.disclaimer')}</Text>
        </ScrollView>
        <ScrollView style={styles.column} contentContainerStyle={styles.content}>
          <Button label={t('about.privacy')} detail={t('about.privacyDetail')} onPress={() => open(LINKS.privacy)} />
          <Button label={t('about.report')} detail={t('about.reportDetail')} onPress={() => open(LINKS.report)} />
          {/* The App Store only allows tips through in-app purchase: the link stays off iOS. */}
          {Platform.OS !== 'ios' && (
            <Button label={t('about.support')} detail={t('about.supportDetail')} onPress={() => open(LINKS.support)} />
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  columns: { flex: 1, flexDirection: 'row', padding: 12, gap: 16 },
  column: { flex: 1 },
  content: { gap: 10, flexGrow: 1, justifyContent: 'center' },
  title: { color: '#fff0ce', fontSize: 34, fontWeight: '900' },
  titleAccent: { color: '#ffbf69' },
  text: { color: COLORS.text, fontSize: 15, lineHeight: 21 },
  muted: { color: COLORS.muted, fontSize: 13 },
});
