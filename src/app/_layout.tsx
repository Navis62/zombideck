import { useFonts } from 'expo-font';
import { type ErrorBoundaryProps, SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { AppProvider, useApp } from '@/game/store';
import { deviceLanguage } from '@/i18n/device-language';
import { translator } from '@/i18n/translations';
import { COLORS, FANTASY_FONT_FILES, INVADER_FONT_FILES, WESTERN_FONT_FILES } from '@/theme';

// The splash screen stays up until the Western, Invader and Fantasy fonts are in, so no card ever flashes in a fallback face.
SplashScreen.preventAutoHideAsync();

function Navigator() {
  const { t } = useApp();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.background },
        headerTintColor: COLORS.text,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      {/* The universe carousel opens the app; each universe has its own menu. */}
      <Stack.Screen name="index" options={{ title: t('appName'), headerShown: false }} />
      <Stack.Screen name="menu" options={{ title: t('appName'), headerShown: false }} />
      {/* No header during the game: the height goes to the cards, the Menu button sits with the controls. */}
      <Stack.Screen name="game" options={{ title: t('game.title'), headerShown: false }} />
      <Stack.Screen name="expansions" options={{ title: t('expansions.title') }} />
      <Stack.Screen name="options" options={{ title: t('options.title') }} />
      <Stack.Screen name="about" options={{ title: t('about.title') }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ ...WESTERN_FONT_FILES, ...INVADER_FONT_FILES, ...FANTASY_FONT_FILES });
  // A font that fails to load is not worth a blank app: the cards fall back to the system serif.
  const ready = fontsLoaded || fontError !== null;
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);
  if (!ready) return null;
  return (
    <AppProvider>
      <StatusBar hidden />
      <Navigator />
    </AppProvider>
  );
}

/** Shown instead of a blank screen if rendering crashes; the saved game is untouched. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  // Outside AppProvider: the chosen language is not loaded, the device language stands in.
  const t = translator(deviceLanguage());
  return (
    <View style={styles.error}>
      <StatusBar hidden />
      <Text style={styles.errorTitle}>{t('error.title')}</Text>
      <Text style={styles.errorText}>{t('error.detail')}</Text>
      <Text style={styles.errorDetail}>{error.message}</Text>
      <Button label={t('error.retry')} onPress={retry} />
    </View>
  );
}

const styles = StyleSheet.create({
  error: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  errorTitle: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
  errorText: { color: COLORS.text, fontSize: 15, textAlign: 'center' },
  errorDetail: { color: COLORS.muted, fontSize: 12, textAlign: 'center' },
});
