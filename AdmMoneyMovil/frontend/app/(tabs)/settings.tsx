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
import { colors, radii, spacing } from '../../src/theme';
import { DoubleBezelCard } from '../../src/components/ui/DoubleBezelCard';
import { Button } from '../../src/components/ui/Button';
import { Badge } from '../../src/components/ui/Badge';
import { useAppStore } from '../../src/stores/app.store';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const {
    backendUrl,
    setBackendUrl,
    isOnline,
    checkConnection,
    loadAllData,
    useMockData,
    setUseMockData,
    resetMockData
  } = useAppStore();

  const [urlInput, setUrlInput] = useState(backendUrl);
  const [isTesting, setIsTesting] = useState(false);

  const handleToggleMock = (value: boolean) => {
    setUseMockData(value);
    Alert.alert(
      value ? '🧪 Modo Prueba Activado' : '🟢 Modo Datos Reales Activado',
      value
        ? 'La app ahora utiliza datos de prueba realistas sin requerir backend.'
        : 'La app ahora se conectará a tu servidor FastAPI y SQLite real.'
    );
  };

  const handleResetMock = () => {
    Alert.alert(
      'Restablecer Datos de Prueba',
      '¿Deseas reiniciar los gastos, galletas y ventas de muestra a su estado inicial?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restablecer',
          onPress: () => {
            resetMockData();
            Alert.alert('¡Hecho!', 'Datos de prueba restablecidos a los valores iniciales.');
          },
        },
      ]
    );
  };

  const handleSetPreset = (preset: string) => {
    setUrlInput(preset);
    setBackendUrl(preset);
  };

  const handleSaveAndTest = async () => {
    setIsTesting(true);
    setBackendUrl(urlInput.trim());
    const ok = await checkConnection();
    setIsTesting(false);
    if (ok) {
      await loadAllData();
      Alert.alert('¡Conexión Exitosa!', 'Conectado al servidor de Adm Money. Datos sincronizados.');
    } else {
      Alert.alert(
        'Sin Conexión',
        'No se pudo conectar al servidor en esa dirección. Puedes activar el "Modo de Prueba" arriba para explorar la app sin backend.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.screenEyebrow}>Configuración</Text>
          <Text style={styles.screenTitle}>Ajustes & Modo de Datos</Text>
          <Text style={styles.screenSubtitle}>
            Activa datos de prueba o sincroniza con tu backend FastAPI y base de datos SQLite.
          </Text>
        </View>

        {/* 1. MOCK DATA TOGGLE CARD */}
        <DoubleBezelCard style={styles.sectionCard}>
          <View style={styles.statusRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons
                  name={useMockData ? 'flask' : 'cloud-done'}
                  size={18}
                  color={useMockData ? colors.amberLight : colors.emeraldLight}
                />
                <Text style={styles.cardTitle}>Modo Datos de Prueba</Text>
              </View>
              <Text style={styles.cardSub}>
                {useMockData
                  ? 'Activo: Gastos, recetas de galletas y ventas de muestra en memoria.'
                  : 'Desactivado: Trabajando con base de datos SQLite y servidor real.'}
              </Text>
            </View>

            <Switch
              value={useMockData}
              onValueChange={handleToggleMock}
              trackColor={{ false: 'rgba(255,255,255,0.15)', true: colors.brandGlow }}
              thumbColor={useMockData ? colors.brandLight : '#94a3b8'}
            />
          </View>

          <View style={styles.codeHintBox}>
            <Ionicons name="code-slash" size={14} color={colors.textDim} />
            <Text style={styles.codeHintText}>
              En código: Edita <Text style={styles.codeHighlight}>USE_MOCK_DATA</Text> en{' '}
              <Text style={styles.codeHighlight}>src/config/appConfig.ts</Text>
            </Text>
          </View>

          {useMockData && (
            <TouchableOpacity onPress={handleResetMock} style={styles.resetBtn}>
              <Ionicons name="refresh-circle-outline" size={16} color={colors.amberLight} />
              <Text style={styles.resetBtnText}>Restablecer Datos de Muestra Originales</Text>
            </TouchableOpacity>
          )}
        </DoubleBezelCard>

        {/* 2. SERVER CONNECTION STATUS CARD */}
        <DoubleBezelCard style={styles.sectionCard}>
          <View style={styles.statusRow}>
            <View>
              <Text style={styles.cardTitle}>Estado de Red</Text>
              <Text style={styles.cardSub}>
                {useMockData
                  ? 'Modo Demo local activo (Offline)'
                  : isOnline
                  ? 'Sincronizado con API FastAPI y Página Web'
                  : 'Sin conexión con el servidor'}
              </Text>
            </View>
            <Badge
              label={useMockData ? 'Modo Demo' : isOnline ? 'En Línea' : 'Desconectado'}
              variant={useMockData ? 'amber' : isOnline ? 'emerald' : 'rose'}
            />
          </View>
        </DoubleBezelCard>

        {/* 3. SERVER ADDRESS & QUICK PRESETS */}
        <DoubleBezelCard style={styles.sectionCard}>
          <Text style={styles.cardTitle}>URL del Servidor Backend</Text>
          <Text style={styles.cardSub}>
            Elige un preset según dónde estés ejecutando la app:
          </Text>

          {/* Quick preset chips */}
          <View style={styles.presetsRow}>
            <TouchableOpacity
              style={styles.presetChip}
              onPress={() => handleSetPreset('http://localhost:8000')}
            >
              <Text style={styles.presetChipText}>Web: localhost</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetChip}
              onPress={() => handleSetPreset('http://10.0.2.2:8000')}
            >
              <Text style={styles.presetChipText}>Emulador: 10.0.2.2</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.presetChip, { borderColor: 'rgba(16, 185, 129, 0.4)' }]}
              onPress={() => handleSetPreset('http://172.16.216.105:8000')}
            >
              <Text style={[styles.presetChipText, { color: colors.emeraldLight }]}>
                Celular Wi-Fi: 172.16.216.105
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            value={urlInput}
            onChangeText={setUrlInput}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="http://192.168.1.100:8000"
            placeholderTextColor={colors.textDim}
          />

          <Button
            title={isTesting ? 'Probando conexión...' : 'Probar & Guardar Conexión'}
            variant="primary"
            disabled={isTesting}
            icon={<Ionicons name="wifi" size={16} color="#fff" />}
            onPress={handleSaveAndTest}
          />
        </DoubleBezelCard>

        {/* 4. APP INFO */}
        <DoubleBezelCard style={styles.sectionCard}>
          <Text style={styles.cardTitle}>Adm Money Suite Móvil</Text>
          <Text style={styles.cardSub}>Versión 1.0.0 • Expo SDK 52 • React Native 0.76</Text>
          <Text style={[styles.cardSub, { marginTop: 6 }]}>
            Sincronización bidireccional de gastos personales, escáner de tickets OCR y unit economics de galletas artesanales.
          </Text>
        </DoubleBezelCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  container: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  screenEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.brandLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textMain,
    marginTop: 2,
  },
  screenSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
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
    color: colors.textMain,
  },
  cardSub: {
    fontSize: 12,
    color: colors.textDim,
    marginTop: 3,
    lineHeight: 16,
  },
  codeHintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 12,
  },
  codeHintText: {
    fontSize: 11,
    color: colors.textMuted,
    flex: 1,
  },
  codeHighlight: {
    color: colors.amberLight,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.amberLight,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  presetChip: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    padding: 12,
    color: colors.textMain,
    fontSize: 14,
    marginVertical: 12,
  },
});
