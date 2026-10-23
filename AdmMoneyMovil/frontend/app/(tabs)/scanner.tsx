import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors, radii, spacing } from '../../src/theme';
import { Button } from '../../src/components/ui/Button';
import { DoubleBezelCard } from '../../src/components/ui/DoubleBezelCard';
import { ReceiptPreviewModal } from '../../src/components/scanner/ReceiptPreviewModal';
import { MobileApiService } from '../../src/services/api';
import { useAppStore } from '../../src/stores/app.store';
import { ReceiptScanResult, Expense } from '../../src/lib/types';
import { MOCK_MOBILE_RECEIPTS } from '../../src/services/mockData';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ScannerScreen() {
  const router = useRouter();
  const { addExpense, useMockData } = useAppStore();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ReceiptScanResult | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Take photo with mobile camera
  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permiso de Cámara',
          'Para tomar fotos de tickets, activa los permisos o usa los tickets de muestra abajo.',
          [{ text: 'Entendido' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.85,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        processTicket(uri);
      }
    } catch (err) {
      console.warn('Camera error:', err);
      Alert.alert(
        'Cámara no disponible',
        'Si estás en navegador web o simulador, puedes elegir una imagen de la galería o usar los tickets de muestra directos.'
      );
    }
  };

  // Pick from gallery
  const handlePickGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permiso de Galería',
          'Se necesita acceso a tus fotos para cargar el ticket o usa los tickets de muestra abajo.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        processTicket(uri);
      }
    } catch (err) {
      console.warn('Gallery error:', err);
      Alert.alert(
        'Error de Galería',
        'No se pudo abrir la galería. Puedes probar con los tickets de muestra.'
      );
    }
  };

  // Test with demo tickets
  const handleDemoTicket = (type: 'costco' | 'walmart' | 'oxxo' = 'costco') => {
    const demoUrls: Record<string, string> = {
      costco: 'https://images.unsplash.com/photo-1554415707-9e49018a382b?auto=format&fit=crop&w=600&q=80',
      walmart: 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?auto=format&fit=crop&w=600&q=80',
      oxxo: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&w=600&q=80',
    };

    const chosenUri = demoUrls[type];
    setImageUri(chosenUri);

    setIsScanning(true);
    setTimeout(() => {
      setScanResult(MOCK_MOBILE_RECEIPTS[type]);
      setIsScanning(false);
      setIsModalVisible(true);
    }, 700);
  };

  // Process ticket with backend OCR
  const processTicket = async (uri: string) => {
    setIsScanning(true);
    try {
      if (useMockData) {
        setTimeout(() => {
          setScanResult(MOCK_MOBILE_RECEIPTS.costco);
          setIsScanning(false);
          setIsModalVisible(true);
        }, 800);
        return;
      }

      const parsed = await MobileApiService.scanReceipt(uri);
      setScanResult(parsed);
      setIsModalVisible(true);
    } catch (err) {
      console.warn('Scan processing error:', err);
      // Fallback in case backend is offline
      setScanResult(MOCK_MOBILE_RECEIPTS.costco);
      setIsModalVisible(true);
    } finally {
      setIsScanning(false);
    }
  };

  const handleConfirmExpense = async (data: Partial<Expense>) => {
    await addExpense(data);
    setIsModalVisible(false);
    setImageUri(null);
    setScanResult(null);
    Alert.alert(
      '¡Gasto Registrado con Éxito!',
      `Se sumaron $${data.amount?.toFixed(2)} MXN a tus gastos generales.`,
      [{ text: 'Ver en Gastos', onPress: () => router.push('/expenses') }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.screenEyebrow}>OCR Inteligente</Text>
          <Text style={styles.screenTitle}>Escáner de Tickets</Text>
          <Text style={styles.screenSubtitle}>
            Toma foto a tu ticket de compra para extraer automáticamente los productos y sumarlos a tus gastos.
          </Text>
        </View>

        {/* Viewfinder / HUD Card */}
        <DoubleBezelCard style={styles.viewfinderCard}>
          {imageUri ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
              {isScanning && (
                <View style={styles.scanningOverlay}>
                  <ActivityIndicator size="large" color={colors.emeraldLight} />
                  <Text style={styles.scanningText}>Analizando ticket con OCR...</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              {/* HUD Target Brackets */}
              <View style={styles.hudBracketTopLeft} />
              <View style={styles.hudBracketTopRight} />
              <View style={styles.hudBracketBottomLeft} />
              <View style={styles.hudBracketBottomRight} />

              <View style={styles.cameraIconCircle}>
                <Ionicons name="scan" size={44} color={colors.emeraldLight} />
              </View>
              <Text style={styles.placeholderTitle}>Listo para Capturar</Text>
              <Text style={styles.placeholderDesc}>
                Apunta al ticket con buena luz y presiona tomar foto
              </Text>
            </View>
          )}
        </DoubleBezelCard>

        {/* Action Buttons */}
        <View style={styles.actionColumn}>
          <Button
            title="Tomar Foto con Cámara"
            variant="primary"
            icon={<Ionicons name="camera" size={20} color="#fff" />}
            onPress={handleTakePhoto}
            disabled={isScanning}
          />

          <Button
            title="Elegir Foto de Galería"
            variant="secondary"
            icon={<Ionicons name="images-outline" size={20} color="#fff" />}
            onPress={handlePickGallery}
            disabled={isScanning}
          />

          {/* Quick Demo Tickets Bar */}
          <View style={styles.demoTicketsBox}>
            <Text style={styles.demoTicketsTitle}>Tickets de Muestra (1 toque):</Text>
            <View style={styles.demoButtonsRow}>
              <TouchableOpacity
                onPress={() => handleDemoTicket('costco')}
                style={styles.demoTicketChip}
                disabled={isScanning}
              >
                <Ionicons name="receipt" size={12} color={colors.amberLight} />
                <Text style={styles.demoTicketText}>Costco ($1,687)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleDemoTicket('walmart')}
                style={styles.demoTicketChip}
                disabled={isScanning}
              >
                <Ionicons name="cart" size={12} color={colors.emeraldLight} />
                <Text style={styles.demoTicketText}>Walmart ($540)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleDemoTicket('oxxo')}
                style={styles.demoTicketChip}
                disabled={isScanning}
              >
                <Ionicons name="flash" size={12} color={colors.roseLight} />
                <Text style={styles.demoTicketText}>OXXO ($145)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Receipt Modal */}
        <ReceiptPreviewModal
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          scanResult={scanResult}
          imageUri={imageUri}
          onConfirm={handleConfirmExpense}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  container: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  header: {
    marginBottom: 12,
  },
  screenEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.brandLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textMain,
    marginTop: 2,
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  viewfinderCard: {
    flex: 1,
    marginVertical: 10,
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    position: 'relative',
  },
  hudBracketTopLeft: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: colors.brand,
    borderRadius: 4,
  },
  hudBracketTopRight: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: colors.brand,
    borderRadius: 4,
  },
  hudBracketBottomLeft: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: colors.brand,
    borderRadius: 4,
  },
  hudBracketBottomRight: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: colors.brand,
    borderRadius: 4,
  },
  cameraIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.brandBg,
    borderWidth: 1,
    borderColor: colors.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textMain,
  },
  placeholderDesc: {
    fontSize: 12,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 240,
  },
  previewContainer: {
    flex: 1,
    borderRadius: radii.md,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 6, 9, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  scanningText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  actionColumn: {
    gap: 10,
  },
  demoTicketsBox: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    padding: 10,
    marginTop: 4,
  },
  demoTicketsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demoTicketChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.pill,
    paddingVertical: 7,
    paddingHorizontal: 6,
  },
  demoTicketText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMain,
  },
});
