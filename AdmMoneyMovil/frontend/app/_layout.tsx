import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useThemeColors } from '../src/theme';
import { useAppStore } from '../src/stores/app.store';

export default function RootLayout() {
  const loadAllData = useAppStore((state) => state.loadAllData);
  const colors = useThemeColors();

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <StatusBar style={colors.isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bgPrimary },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}
