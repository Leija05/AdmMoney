import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors, radii, spacing } from '../../src/theme';
import { DoubleBezelCard } from '../../src/components/ui/DoubleBezelCard';
import { Button } from '../../src/components/ui/Button';
import { BackendHeartbeat } from '../../src/components/ui/BackendHeartbeat';
import { RomanticDedicationCard } from '../../src/components/ui/RomanticDedicationCard';
import { SwipeTabWrapper } from '../../src/components/ui/SwipeTabWrapper';
import { useAppStore } from '../../src/stores/app.store';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const {
    isOnline,
    checkConnection,
    loadAllData,
    theme,
    toggleTheme,
    currency,
    setCurrency,
    swipeEnabled,
    setSwipeEnabled,
    hapticsEnabled,
    setHapticsEnabled,
    highPrecisionOcr,
    setHighPrecisionOcr,
    autoCategorizeAi,
    setAutoCategorizeAi,
    dailyClosingReminder,
    setDailyClosingReminder,
    stockAlertsEnabled,
    setStockAlertsEnabled,
    businessName,
    setBusinessName,
    ticketFooterText,
    setTicketFooterText,
    privacyMode,
    setPrivacyMode,
  } = useAppStore();

  const colors = useThemeColors();
  const [isTesting, setIsTesting] = useState(false);
  const [lastPing, setLastPing] = useState<number | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Al iniciar app');
  const [smoothAnimations, setSmoothAnimations] = useState(true);

  // Editable business info local state
  const [tempBusinessName, setTempBusinessName] = useState(businessName);
  const [tempTicketFooter, setTempTicketFooter] = useState(ticketFooterText);
  const [isEditingBrand, setIsEditingBrand] = useState(false);

  const handleTestAndSync = async () => {
    setIsTesting(true);
    const start = Date.now();
    try {
      const ok = await checkConnection();
      const latency = Date.now() - start;
      setLastPing(latency);

      if (ok) {
        await loadAllData();
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastSyncTime(timeStr);
        setIsTesting(false);
        Alert.alert(
          '¡Sincronización Exitosa! 🟢',
          `Conexión verificada con la nube en ${latency} ms.\n\nTodas tus ventas, recetas, gastos e inventario están al día.`
        );
      } else {
        setIsTesting(false);
        Alert.alert(
          'Sin Conexión a la Nube 🔴',
          'No se pudo establecer conexión con el servidor. Verifica tu conexión a internet e inténtalo de nuevo.'
        );
      }
    } catch {
      setIsTesting(false);
      Alert.alert(
        'Error de Conexión',
        'Ocurrió una anomalía de red al contactar la nube. Intenta nuevamente.'
      );
    }
  };

  const handleSaveBrand = () => {
    if (!tempBusinessName.trim()) {
      Alert.alert('Nombre Requerido', 'El nombre comercial no puede estar vacío.');
      return;
    }
    setBusinessName(tempBusinessName.trim());
    setTicketFooterText(tempTicketFooter.trim());
    setIsEditingBrand(false);
    Alert.alert('¡Marca Actualizada!', 'Los datos de tu negocio y tickets han sido guardados.');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgPrimary }]}>
      <SwipeTabWrapper currentRoute="/settings" enabled={swipeEnabled}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.screenEyebrow, { color: colors.brandText }]}>Sistema & Ajustes</Text>
            <Text style={[styles.screenTitle, { color: colors.textMain }]}>Configuración de la App</Text>
            <Text style={[styles.screenSubtitle, { color: colors.textMuted }]}>
              Control de sincronización, experiencia visual, inteligencia artificial y tu negocio.
            </Text>
          </View>

          {/* 💌 DEDICATORIA ESPECIAL HECHA CON AMOR */}
          <RomanticDedicationCard />

          {/* 1. SINCRONIZACIÓN Y CONEXIÓN A LA NUBE (LIMPIO, SIN URLS EXPUESTAS) */}
          <DoubleBezelCard style={styles.sectionCard}>
            <View style={styles.statusRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="cloud-done" size={18} color={isOnline ? colors.emeraldLight : colors.roseLight} />
                  <Text style={[styles.cardTitle, { color: colors.textMain }]}>Sincronización en la Nube</Text>
                </View>
                <Text style={[styles.cardSub, { color: colors.textDim }]}>
                  Sincroniza en tiempo real tus ventas, recetas, pedidos y balance con la base de datos centralizada.
                </Text>
              </View>
              <BackendHeartbeat />
            </View>

            {/* Metrics Bar */}
            <View style={[styles.syncMetricsBox, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}>
              <View style={styles.metricItem}>
                <Text style={[styles.metricLabel, { color: colors.textDim }]}>Estado</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <View style={[styles.statusDot, { backgroundColor: isOnline ? '#10B981' : '#EF4444' }]} />
                  <Text style={[styles.metricVal, { color: isOnline ? colors.emeraldLight : colors.roseLight }]}>
                    {isOnline ? 'En Línea' : 'Desconectado'}
                  </Text>
                </View>
              </View>

              <View style={[styles.metricDivider, { backgroundColor: colors.borderSubtle }]} />

              <View style={styles.metricItem}>
                <Text style={[styles.metricLabel, { color: colors.textDim }]}>Latencia</Text>
                <Text style={[styles.metricVal, { color: colors.textMain, marginTop: 2 }]}>
                  {lastPing ? `${lastPing} ms` : isOnline ? 'Óptima' : '--'}
                </Text>
              </View>

              <View style={[styles.metricDivider, { backgroundColor: colors.borderSubtle }]} />

              <View style={styles.metricItem}>
                <Text style={[styles.metricLabel, { color: colors.textDim }]}>Última Sinc.</Text>
                <Text style={[styles.metricVal, { color: colors.textMain, marginTop: 2 }]}>
                  {lastSyncTime}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={isTesting}
              onPress={handleTestAndSync}
              style={[
                styles.syncActionButton,
                { backgroundColor: colors.brand },
                isTesting && { opacity: 0.75 },
              ]}
            >
              {isTesting ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.syncActionButtonText}>Probando y Sincronizando...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={17} color="#FFFFFF" />
                  <Text style={styles.syncActionButtonText}>Probar y Sincronizar Conexión</Text>
                </>
              )}
            </TouchableOpacity>
          </DoubleBezelCard>

          {/* 2. APARIENCIA & MONEDA DEL SISTEMA */}
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

            {/* Selector de Moneda */}
            <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderSubtle }}>
              <Text style={[styles.subLabel, { color: colors.textDim }]}>Moneda del Sistema</Text>
              <View style={styles.presetsRow}>
                {[
                  { code: 'MXN', label: '🇲🇽 MXN ($) Pesos Mexicanos' },
                  { code: 'USD', label: '🇺🇸 USD ($) Dólares' },
                ].map((item) => {
                  const isActive = currency === item.code;
                  return (
                    <TouchableOpacity
                      key={item.code}
                      onPress={() => setCurrency(item.code)}
                      style={[
                        styles.presetChip,
                        {
                          backgroundColor: isActive ? colors.brandBg : colors.bgTertiary,
                          borderColor: isActive ? colors.brandBorder : colors.borderSubtle,
                        },
                      ]}
                    >
                      <Ionicons
                        name={isActive ? 'radio-button-on' : 'radio-button-off'}
                        size={13}
                        color={isActive ? colors.brandText : colors.textDim}
                      />
                      <Text
                        style={[
                          styles.presetChipText,
                          { color: isActive ? colors.brandText : colors.textMain },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </DoubleBezelCard>

          {/* 3. GESTOS, ANIMACIONES & NAVEGACIÓN */}
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
                  Desliza a la izquierda o derecha en cualquier pantalla para moverte entre pestañas.
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
                    Animaciones Fluidas & Transiciones
                  </Text>
                </View>
                <Text style={[styles.cardSub, { color: colors.textDim }]}>
                  Micro-animaciones en tarjetas, botones y cambio de tema sin lag.
                </Text>
              </View>
              <Switch
                value={smoothAnimations}
                onValueChange={setSmoothAnimations}
                trackColor={{ false: '#E2E8F0', true: colors.amberBg }}
                thumbColor={smoothAnimations ? colors.amberLight : '#CBD5E1'}
              />
            </View>

            {/* Haptic / Long Press */}
            <View style={[styles.settingItemRow, { borderTopWidth: 1, borderTopColor: colors.borderSubtle, paddingTop: 12 }]}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="finger-print" size={17} color={colors.emeraldLight} />
                  <Text style={[styles.settingItemTitle, { color: colors.textMain }]}>
                    Acciones por Pulsación Larga
                  </Text>
                </View>
                <Text style={[styles.cardSub, { color: colors.textDim }]}>
                  Mantén presionado cualquier elemento para acceder a menú rápido de acciones.
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

          {/* 4. INTELIGENCIA ARTIFICIAL & ESCÁNER OCR */}
          <DoubleBezelCard style={styles.sectionCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Ionicons name="hardware-chip" size={18} color={colors.brandLight} />
              <Text style={[styles.cardTitle, { color: colors.textMain }]}>
                Inteligencia Artificial & Escáner
              </Text>
            </View>

            {/* OCR Precision */}
            <View style={styles.settingItemRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="scan" size={16} color={colors.brandLight} />
                  <Text style={[styles.settingItemTitle, { color: colors.textMain }]}>
                    OCR de Alta Precisión con IA
                  </Text>
                </View>
                <Text style={[styles.cardSub, { color: colors.textDim }]}>
                  Aumenta el contraste y nitidez en fotos de tickets para extraer conceptos y montos exactos.
                </Text>
              </View>
              <Switch
                value={highPrecisionOcr}
                onValueChange={setHighPrecisionOcr}
                trackColor={{ false: '#E2E8F0', true: colors.brandGlow }}
                thumbColor={highPrecisionOcr ? colors.brandLight : '#CBD5E1'}
              />
            </View>

            {/* Smart Categorization */}
            <View style={[styles.settingItemRow, { borderTopWidth: 1, borderTopColor: colors.borderSubtle, paddingTop: 12 }]}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="pricetags" size={16} color={colors.amberLight} />
                  <Text style={[styles.settingItemTitle, { color: colors.textMain }]}>
                    Auto-Categorización Inteligente
                  </Text>
                </View>
                <Text style={[styles.cardSub, { color: colors.textDim }]}>
                  Clasifica automáticamente entre Insumos, Empaque o Servicios según el texto leído.
                </Text>
              </View>
              <Switch
                value={autoCategorizeAi}
                onValueChange={setAutoCategorizeAi}
                trackColor={{ false: '#E2E8F0', true: colors.amberBg }}
                thumbColor={autoCategorizeAi ? colors.amberLight : '#CBD5E1'}
              />
            </View>
          </DoubleBezelCard>

          {/* 5. ALERTAS Y OPERACIÓN DEL NEGOCIO */}
          <DoubleBezelCard style={styles.sectionCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Ionicons name="notifications" size={18} color={colors.amberLight} />
              <Text style={[styles.cardTitle, { color: colors.textMain }]}>
                Alertas & Operación Diaria
              </Text>
            </View>

            {/* Modo Privacidad ante Clientes */}
            <View style={styles.settingItemRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="eye-off" size={16} color={colors.brandLight} />
                  <Text style={[styles.settingItemTitle, { color: colors.textMain }]}>
                    Modo Privacidad ante Clientes
                  </Text>
                </View>
                <Text style={[styles.cardSub, { color: colors.textDim }]}>
                  Oculta las cifras de ganancia neta y balance de ingresos con asteriscos (••••) al mostrar el catálogo o recetas a terceros.
                </Text>
              </View>
              <Switch
                value={privacyMode}
                onValueChange={setPrivacyMode}
                trackColor={{ false: '#E2E8F0', true: colors.brandGlow }}
                thumbColor={privacyMode ? colors.brandLight : '#CBD5E1'}
              />
            </View>

            {/* Low stock alerts */}
            <View style={[styles.settingItemRow, { borderTopWidth: 1, borderTopColor: colors.borderSubtle, paddingTop: 12 }]}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="alert-circle" size={16} color={colors.roseLight} />
                  <Text style={[styles.settingItemTitle, { color: colors.textMain }]}>
                    Alerta de Stock Crítico
                  </Text>
                </View>
                <Text style={[styles.cardSub, { color: colors.textDim }]}>
                  Indica con insignia roja cuando queden pocas porciones de harina, mantequilla o empaques.
                </Text>
              </View>
              <Switch
                value={stockAlertsEnabled}
                onValueChange={setStockAlertsEnabled}
                trackColor={{ false: '#E2E8F0', true: colors.roseBg }}
                thumbColor={stockAlertsEnabled ? colors.roseLight : '#CBD5E1'}
              />
            </View>
          </DoubleBezelCard>

          {/* 6. IDENTIDAD DE MARCA & TICKETS */}
          <DoubleBezelCard style={styles.sectionCard}>
            <View style={styles.statusRow}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="storefront" size={18} color={colors.brandLight} />
                  <Text style={[styles.cardTitle, { color: colors.textMain }]}>Identidad de Tu Negocio</Text>
                </View>
                <Text style={[styles.cardSub, { color: colors.textDim }]}>
                  Información visible en el encabezado de la app y tickets enviados a clientes.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsEditingBrand(!isEditingBrand)}
                style={[styles.editBadgeBtn, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
              >
                <Ionicons name={isEditingBrand ? 'close' : 'pencil'} size={14} color={colors.textMain} />
                <Text style={[styles.editBadgeText, { color: colors.textMain }]}>
                  {isEditingBrand ? 'Cancelar' : 'Editar'}
                </Text>
              </TouchableOpacity>
            </View>

            {isEditingBrand ? (
              <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderSubtle }}>
                <Text style={[styles.formLabel, { color: colors.textDim }]}>Nombre Comercial / Marca</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, color: colors.textMain }]}
                  value={tempBusinessName}
                  onChangeText={setTempBusinessName}
                  placeholder="Ej: Lucky Cookies"
                  placeholderTextColor={colors.textDim}
                />

                <Text style={[styles.formLabel, { color: colors.textDim, marginTop: 8 }]}>Mensaje al Pie del Ticket</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, color: colors.textMain }]}
                  value={tempTicketFooter}
                  onChangeText={setTempTicketFooter}
                  placeholder="Ej: ¡Gracias por tu compra!"
                  placeholderTextColor={colors.textDim}
                />

                <Button
                  title="Guardar Datos de Marca"
                  variant="primary"
                  icon={<Ionicons name="checkmark-done" size={16} color="#FFFFFF" />}
                  onPress={handleSaveBrand}
                  style={{ marginTop: 6 }}
                />
              </View>
            ) : (
              <View style={[styles.brandPreviewBox, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}>
                <View>
                  <Text style={[styles.brandPreviewLabel, { color: colors.textDim }]}>Nombre comercial activo</Text>
                  <Text style={[styles.brandPreviewTitle, { color: colors.textMain }]}>{businessName}</Text>
                  <Text style={[styles.brandPreviewFooter, { color: colors.textMuted }]}>"{ticketFooterText}"</Text>
                </View>
              </View>
            )}
          </DoubleBezelCard>

          {/* 7. APP INFO & FIRMA DIGITAL */}
          <DoubleBezelCard style={styles.sectionCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="information-circle" size={18} color={colors.brandLight} />
              <Text style={[styles.cardTitle, { color: colors.textMain }]}>Adm Money Suite Móvil</Text>
            </View>
            <Text style={[styles.cardSub, { color: colors.textDim }]}>
              Versión 2.3.0 • Sistema Financiero & Control de Repostería
            </Text>
            <Text style={[styles.cardSub, { color: colors.textMuted, marginTop: 6 }]}>
              Base de datos en la nube conectada y sincronizada en tiempo real. Todas las funciones operan al 100%.
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
    paddingBottom: 110,
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
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  syncMetricsBox: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginTop: 14,
    marginBottom: 12,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '800',
  },
  metricDivider: {
    width: 1,
    height: 28,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  syncActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: radii.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  syncActionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  editBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  editBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 10,
    fontSize: 13,
    marginBottom: 10,
  },
  brandPreviewBox: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: 12,
    marginTop: 12,
  },
  brandPreviewLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  brandPreviewTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  brandPreviewFooter: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 3,
  },
});
