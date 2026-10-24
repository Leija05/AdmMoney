import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Alert, Platform, ActivityIndicator } from 'react-native';
import { useThemeColors } from '../src/theme';
import { useAppStore } from '../src/stores/app.store';
import * as Font from 'expo-font';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { ConfirmationModal } from '../src/components/ui/ConfirmationModal';
import { ThemeTransitionOverlay } from '../src/components/ui/ThemeTransitionOverlay';
import { confirmAction } from '../src/stores/confirmation.store';

// Global polyfill: replaces native system dialogs with the custom ConfirmationModal
Alert.alert = (title: string, message?: string, buttons?: any[]) => {
  const lowerTitle = (title || '').toLowerCase();

  const isSuccess =
    lowerTitle.includes('¡') ||
    lowerTitle.includes('éxito') ||
    lowerTitle.includes('registrada') ||
    lowerTitle.includes('guardad') ||
    lowerTitle.includes('actualizad') ||
    lowerTitle.includes('listo') ||
    lowerTitle.includes('copiad') ||
    lowerTitle.includes('sincronizad');

  const isDestructive =
    lowerTitle.includes('eliminar') ||
    lowerTitle.includes('borrar') ||
    lowerTitle.includes('quitar') ||
    buttons?.some((b) => b?.style === 'destructive');

  const isWarning =
    lowerTitle.includes('atención') ||
    lowerTitle.includes('datos') ||
    lowerTitle.includes('cuidado') ||
    lowerTitle.includes('incomplet');

  const modalType = isDestructive
    ? 'danger'
    : isSuccess
    ? 'success'
    : isWarning
    ? 'warning'
    : 'info';

  if (!buttons || buttons.length <= 1) {
    // Single button informational or celebration dialog
    confirmAction({
      title: title || 'Aviso',
      message: message || '',
      confirmText: buttons?.[0]?.text || (isSuccess ? '¡Excelente!' : 'Entendido'),
      cancelText: '',
      type: modalType,
      onConfirm: () => {
        buttons?.[0]?.onPress?.();
      },
    });
    return;
  }

  const cancelBtn = buttons.find((b) => b?.style === 'cancel');
  const confirmBtn = buttons.find((b) => b?.style !== 'cancel') || buttons[buttons.length - 1];

  confirmAction({
    title: title || '¿Estás seguro?',
    message: message || 'Confirma si deseas continuar con esta acción.',
    confirmText: confirmBtn?.text || (isDestructive ? 'Sí, Eliminar' : 'Aceptar'),
    cancelText: cancelBtn?.text || 'Cancelar',
    type: modalType,
    onConfirm: async () => {
      await confirmBtn?.onPress?.();
    },
    onCancel: () => {
      cancelBtn?.onPress?.();
    },
  });
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
    ionicons: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
  });
  const loadAllData = useAppStore((state) => state.loadAllData);
  const colors = useThemeColors();

  useEffect(() => {
    async function loadFallbackFonts() {
      try {
        if (Platform.OS === 'android') {
          // On Android release builds, ensure typeface is bound to both 'ionicons' and 'Ionicons'
          // Note: asset:/// must have three slashes because FontLoaderModule strips (ASSET_SCHEME.length + 1)
          await Font.loadAsync({
            ionicons: 'asset:///fonts/ionicons.ttf',
            Ionicons: 'asset:///fonts/ionicons.ttf',
          }).catch(() => {});
        }
      } catch (err) {
        console.warn('Fallback font load error:', err);
      }
    }
    loadFallbackFonts();
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Prevent children from mounting before fonts are loaded so that icon sets don't mount in uninitialized empty state
  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgPrimary, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

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
      <ConfirmationModal />
      <ThemeTransitionOverlay />
    </View>
  );
}
