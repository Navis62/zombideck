import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppProvider, useApp } from '@/game/store';
import { COLORS } from '@/theme';

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
      <Stack.Screen name="index" options={{ title: t('appName'), headerShown: false }} />
      <Stack.Screen name="game" options={{ title: t('game.title') }} />
      <Stack.Screen name="options" options={{ title: t('options.title') }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar hidden />
      <Navigator />
    </AppProvider>
  );
}
