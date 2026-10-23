import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
  Switch,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors, radii, spacing } from '../../src/theme';
import { DoubleBezelCard } from '../../src/components/ui/DoubleBezelCard';
import { Button } from '../../src/components/ui/Button';
import { BackendHeartbeat } from '../../src/components/ui/BackendHeartbeat';
import { RomanticDedicationCard } from '../../src/components/ui/RomanticDedicationCard';
import { SwipeTabWrapper } from '../../src/components/ui/SwipeTabWrapper';
import { useAppStore } from '../../src/stores/app.store';
import { APP_CONFIG } from '../../src/config/appConfig';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const {
    backendUrl,
    setBackendUrl,
    isOnline,
    checkConnection,
    loadAllData,
    theme,
    toggleTheme,
    expenses,
    cookies,
    sales,
    orders,
  } = useAppStore();

  const colors = useThemeColors();
  const [urlInput, setUrlInput] = useState(backendUrl);
  const [isTesting, setIsTesting] = useState(false);

  // System preferences state
  const [currency, setCurrency] = useState('MXN ($)');
  const [swipeEnabled, setSwipeEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [smoothAnimations, setSmoothAnimations] = useState(true);
  const [autoSync, setAutoSync] = useState(true);

  const handleSetPreset = (preset: string) => {
    setUrlInput(preset);
    setBackendUrl(preset);
  };

  const handleSaveAndTest = async () => {
    setIsTesting(true);
    const cleanedUrl = urlInput.trim().replace(/\/+$/, '');
    setBackendUrl(cleanedUrl);
    const ok = await checkConnection();
    setIsTesting(false);
    if (ok) {
      await loadAllData();
      Alert.alert(
        '¡Conexión Exitosa! 🟢',
        `Conectado exitosamente con ${cleanedUrl}.\n\nBase de datos MongoDB Atlas sincronizada en tiempo real.`
      );
    } else {
      Alert.alert(
        'Sin Conexión 🔴',
        `No se pudo conectar al backend en "${cleanedUrl}".\n\nVerifica que el servicio en Render o tu servidor local esté levantado y accesible.`
      );
    }
  };

  const handleExportData = () => {
    const summary = {
      gastos_totales: expenses.length,
      recetas_galletas: cookies.length,
      ventas_cobradas: sales.length,
      pedidos_agendados: orders.length,
      servidor: backendUrl,
      fecha_export: new Date().toISOString(),
    };
    Alert.alert(
      '📦 Resumen de Datos Listo',
      JSON.stringify(summary, null, 2),
      [{ text: 'Entendido', style: 'default' }]
    );
  };

  const handleClearCache = async () => {
    Alert.alert(
      '¿Recargar Datos del Servidor?',
      'Se actualizarán todas las recetas, gastos, ventas y pedidos directamente de MongoDB Atlas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Recargar',
          style: 'default',
          onPress: async () => {
            await loadAllData();
            Alert.alert('¡Sincronizado!', 'Datos actualizados con éxito.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgPrimary }]}>
      <SwipeTabWrapper currentRoute="/settings" enabled={swipeEnabled}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <Text style={[styles.screenEyebrow, { color: colors.brandText }]}>Sistema & Ajustes</Text>
            <Text style={[styles.screenTitle, { color: colors.textMain }]}>Configuración General</Text>
            <Text style={[styles.screenSubtitle, { color: colors.textMuted }]}>
              Personaliza la experiencia, controles del sistema, conectividad y dedicatoria.
            </Text>
          </View>

          {/* 💌 DEDICATORIA ESPECIAL HECHA CON AMOR (CON CORAZÓN ROJO PALPITANDO) */}
          <RomanticDedicationCard />

          {/* 1. MODO OSCURO ("MEDIO APAGADO") & APARIENCIA */}
          <DoubleBezelCard style={styles.sectionCard}>
            <View style={styles.statusRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons
                    name={theme === 'dark' ? 'moon' : 'sunny'}
                    size={18}
                    color={theme === 'dark' ? colors.brandLight : colors.amberLight}
                  />
                  <Text style={[styles.cardTitle, { color: colors.textMain }]}>Modo Oscuro Suave</Text>
                </View>
                <Text style={[styles.cardSub, { color: colors.textDim }]}>
                  {theme === 'dark'
                    ? 'Paleta suave y medio apagada, diseñada para descansar la vista con acentos pasteles.'
                    : 'Paleta clara limpia y suave sobre fondo porcelana.'}
                </Text>
              </View>

              <Switch
                value={theme === 'dark'}
                onValueChange={toggleTheme}
                trackColor={{ false: '#E2E8F0', true: colors.brandGlow }}
                thumbColor={theme === 'dark' ? colors.brandLight : '#CBD5E1'}
              />
            </View>

            {/* Currency selector chips (Only MXN and USD allowed) */}
            <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderSubtle }}>
              <Text style={[styles.subLabel, { color: colors.textDim }]}>Moneda del Sistema (Solo MXN y USD)</Text>
              <View style={styles.presetsRow}>
                {[
                  { code: 'MXN ($)', label: '🇲🇽 MXN ($) Pesos' },
                  { code: 'USD ($)', label: '🇺🇸 USD ($) Dólares' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.code}
                    onPress={() => setCurrency(item.code)}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: currency === item.code ? colors.brandBg : colors.bgTertiary,
                        borderColor: currency === item.code ? colors.brandBorder : colors.borderSubtle,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        { color: currency === item.code ? colors.brandText : colors.textMain },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </DoubleBezelCard>

          {/* 2. GESTOS, ANIMACIONES & NAVEGACIÓN */}
          <DoubleBezelCard style={styles.sectionCard}>
            <Text style={[styles.cardTitle, { color: colors.textMain, marginBottom: 12 }]}>
              Gestos & Experiencia de Uso
            </Text>

            {/* Swipe Navigation Toggle */}
            <View style={styles.settingItemRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="swap-horizontal" size={17} color={colors.brandLight} />
                  <Text style={[styles.settingItemTitle, { color: colors.textMain }]}>
                    Deslizar para Cambiar Ventana
                  </Text>
                </View>
                <Text style={[styles.cardSub, { color: colors.textDim }]}>
                  Desliza a la izquierda o derecha para moverte fluidamente entre pestañas.
                </Text>
              </View>
              <Switch
                value={swipeEnabled}
                onValueChange={setSwipeEnabled}
                trackColor={{ false: '#E2E8F0', true: colors.brandGlow }}
                thumbColor={swipeEnabled ? colors.brandLight : '#CBD5E1'}
              />
            </View>

            {/* Smooth Animations */}
            <View style={[styles.settingItemRow, { borderTopWidth: 1, borderTopColor: colors.borderSubtle, paddingTop: 12 }]}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="sparkles" size={17} color={colors.amberLight} />
                  <Text style={[styles.settingItemTitle, { color: colors.textMain }]}>
                    Animaciones Suaves y Rápidas
                  </Text>
                </View>
                <Text style={[styles.cardSub, { color: colors.textDim }]}>
                  Transiciones y scrolls optimizados para responder al instante sin demoras.
                </Text>
              </View>
              <Switch
                value={smoothAnimations}
                onValueChange={setSmoothAnimations}
                trackColor={{ false: '#E2E8F0', true: colors.amberBg }}
                thumbColor={smoothAnimations ? colors.amberLight : '#CBD5E1'}
              />
            </View>

            {/* Haptic Feedback */}
            <View style={[styles.settingItemRow, { borderTopWidth: 1, borderTopColor: colors.borderSubtle, paddingTop: 12 }]}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="finger-print" size={17} color={colors.emeraldLight} />
                  <Text style={[styles.settingItemTitle, { color: colors.textMain }]}>
                    Acciones por Pulsación Larga
                  </Text>
                </View>
                <Text style={[styles.cardSub, { color: colors.textDim }]}>
                  Mantén presionado cualquier gasto para abrir el menú de duplicar, editar o eliminar.
                </Text>
              </View>
              <Switch
                value={hapticsEnabled}
                onValueChange={setHapticsEnabled}
                trackColor={{ false: '#E2E8F0', true: colors.emeraldBg }}
                thumbColor={hapticsEnabled ? colors.emeraldLight : '#CBD5E1'}
              />
            </View>
          </DoubleBezelCard>

          {/* 3. SERVER CONNECTION STATUS CARD WITH BEATING HEART */}
          <DoubleBezelCard style={styles.sectionCard}>
            <View style={styles.statusRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={[styles.cardTitle, { color: colors.textMain }]}>Estado del Servidor</Text>
                <Text style={[styles.cardSub, { color: colors.textDim }]}>
                  {isOnline
                    ? 'Conexión activa con base de datos MongoDB Atlas en vivo.'
                    : 'Desconectado del backend. Toca el botón para verificar.'}
                </Text>
              </View>
              <BackendHeartbeat />
            </View>

            <View style={[styles.codeHintBox, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={15} color={colors.brandLight} />
              <Text style={[styles.codeHintText, { color: colors.textMuted }]}>
                Mensaje actual: "{isOnline ? APP_CONFIG.BACKEND_STATUS_MESSAGE_ONLINE : APP_CONFIG.BACKEND_STATUS_MESSAGE_OFFLINE}"
                {'\n'}
                <Text style={{ fontSize: 10, color: colors.textDim }}>
                  Para personalizar este mensaje, edita <Text style={styles.codeHighlight}>src/config/appConfig.ts</Text>
                </Text>
              </Text>
            </View>
          </DoubleBezelCard>

          {/* 4. SERVER ADDRESS & QUICK PRESETS */}
          <DoubleBezelCard style={styles.sectionCard}>
            <Text style={[styles.cardTitle, { color: colors.textMain }]}>URL del Servidor Backend</Text>
            <Text style={[styles.cardSub, { color: colors.textDim }]}>
              Selecciona un preset o escribe la dirección de tu backend:
            </Text>

            {/* Quick preset chips */}
            <View style={styles.presetsRow}>
              <TouchableOpacity
                style={[
                  styles.presetChip,
                  {
                    backgroundColor: urlInput.includes('onrender.com') ? colors.brandBg : colors.bgTertiary,
                    borderColor: urlInput.includes('onrender.com') ? colors.brandBorder : colors.borderSubtle,
                  },
                ]}
                onPress={() => handleSetPreset('https://admmoney-backend.onrender.com')}
              >
                <Ionicons name="cloud" size={12} color={urlInput.includes('onrender.com') ? colors.brandText : colors.textMuted} />
                <Text
                  style={[
                    styles.presetChipText,
                    { color: urlInput.includes('onrender.com') ? colors.brandText : colors.textMain },
                  ]}
                >
                  Render Cloud
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.presetChip,
                  {
                    backgroundColor: urlInput.includes('localhost') ? colors.brandBg : colors.bgTertiary,
                    borderColor: urlInput.includes('localhost') ? colors.brandBorder : colors.borderSubtle,
                  },
                ]}
                onPress={() => handleSetPreset('http://localhost:8000')}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    { color: urlInput.includes('localhost') ? colors.brandText : colors.textMain },
                  ]}
                >
                  Web: localhost
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.presetChip,
                  {
                    backgroundColor: urlInput.includes('10.0.2.2') ? colors.brandBg : colors.bgTertiary,
                    borderColor: urlInput.includes('10.0.2.2') ? colors.brandBorder : colors.borderSubtle,
                  },
                ]}
                onPress={() => handleSetPreset('http://10.0.2.2:8000')}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    { color: urlInput.includes('10.0.2.2') ? colors.brandText : colors.textMain },
                  ]}
                >
                  Android Emulador
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.presetChip,
                  {
                    backgroundColor: urlInput.includes('172.16.216.105') ? colors.brandBg : colors.bgTertiary,
                    borderColor: urlInput.includes('172.16.216.105') ? colors.brandBorder : colors.borderSubtle,
                  },
                ]}
                onPress={() => handleSetPreset('http://172.16.216.105:8000')}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    { color: urlInput.includes('172.16.216.105') ? colors.brandText : colors.textMain },
                  ]}
                >
                  Wi-Fi LAN
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, color: colors.textMain }]}
              value={urlInput}
              onChangeText={setUrlInput}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="https://tu-backend.onrender.com"
              placeholderTextColor={colors.textDim}
            />

            <Button
              title={isTesting ? 'Probando conexión...' : 'Probar & Sincronizar'}
              variant="primary"
              disabled={isTesting}
              icon={<Ionicons name="wifi" size={16} color="#fff" />}
              onPress={handleSaveAndTest}
            />
          </DoubleBezelCard>

          {/* 5. GESTIÓN DE DATOS & MANTENIMIENTO */}
          <DoubleBezelCard style={styles.sectionCard}>
            <Text style={[styles.cardTitle, { color: colors.textMain }]}>Herramientas & Respaldo</Text>
            <Text style={[styles.cardSub, { color: colors.textDim, marginBottom: 12 }]}>
              Acciones de mantenimiento y exportación de datos.
            </Text>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Resumen JSON"
                  variant="secondary"
                  icon={<Ionicons name="download-outline" size={15} />}
                  onPress={handleExportData}
                  style={{ paddingVertical: 8 }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="Recargar BD"
                  variant="secondary"
                  icon={<Ionicons name="refresh-outline" size={15} />}
                  onPress={handleClearCache}
                  style={{ paddingVertical: 8 }}
                />
              </View>
            </View>
          </DoubleBezelCard>

          {/* 6. APP INFO */}
          <DoubleBezelCard style={styles.sectionCard}>
            <Text style={[styles.cardTitle, { color: colors.textMain }]}>Adm Money Suite Móvil</Text>
            <Text style={[styles.cardSub, { color: colors.textDim }]}>Versión 2.2.0 • Expo SDK 52 • React Native 0.76</Text>
            <Text style={[styles.cardSub, { color: colors.textMuted, marginTop: 6 }]}>
              Base de datos en la nube MongoDB Atlas conectada en tiempo real. Sin datos fijos ni modo demo.
            </Text>
          </DoubleBezelCard>
        </ScrollView>
      </SwipeTabWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  screenEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  screenSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  sectionCard: {
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  cardSub: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  settingItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  settingItemTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  codeHintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 14,
    borderWidth: 1,
  },
  codeHintText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
  },
  codeHighlight: {
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 12,
    fontSize: 14,
    marginVertical: 12,
  },
});
