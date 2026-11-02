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
      <Stack.Screen name="index" options={{ title: t('appName') }} />
      <Stack.Screen name="game" options={{ title: t('game.title') }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="light" />
      <Navigator />
    </AppProvider>
  );
}
