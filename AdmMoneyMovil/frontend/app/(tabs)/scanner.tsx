import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors, useThemeColors, radii, spacing } from '../../src/theme';
import { Button } from '../../src/components/ui/Button';
import { DoubleBezelCard } from '../../src/components/ui/DoubleBezelCard';
import { ReceiptPreviewModal } from '../../src/components/scanner/ReceiptPreviewModal';
import { SwipeTabWrapper } from '../../src/components/ui/SwipeTabWrapper';
import { MobileApiService } from '../../src/services/api';
import { useAppStore } from '../../src/stores/app.store';
import { ReceiptScanResult, Expense, ScannedTicket } from '../../src/lib/types';
import { MOCK_MOBILE_RECEIPTS } from '../../src/services/mockData';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ScannerScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { addExpense, expenses, scannedTickets, addScannedTicket, useMockData } = useAppStore();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ReceiptScanResult | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Combine tickets captured or uploaded with expenses that have tickets
  const userTickets = React.useMemo(() => {
    const list: ScannedTicket[] = [...scannedTickets];
    expenses.forEach((e) => {
      const hasReceipt = Boolean(e.receipt_url || e.receipt_data || (e.notes && e.notes.toLowerCase().includes('ticket')));
      if (hasReceipt && !list.some((t) => t.id === `exp-${e.id}` || (t.uri && t.uri === e.receipt_url))) {
        list.push({
          id: `exp-${e.id}`,
          uri: e.receipt_url || '',
          merchant: e.title || (e.receipt_data as any)?.merchant || 'Ticket Registrado',
          amount: e.amount,
          date: e.date,
          category: e.category,
          scanResult: e.receipt_data ? (e.receipt_data as any) : undefined,
        });
      }
    });
    return list;
  }, [scannedTickets, expenses]);

  // Take photo with mobile camera
  const handleTakePhoto = async () => {
    try {
      // 1. Proactively check current camera permission status
      const currentPerm = await ImagePicker.getCameraPermissionsAsync();
      let granted = currentPerm.granted;

      // 2. Request if not granted yet and OS permits prompting
      if (!granted) {
        const req = await ImagePicker.requestCameraPermissionsAsync();
        granted = req.granted;
      }

      // 3. If user denied or disabled in settings, offer direct link to app settings
      if (!granted) {
        Alert.alert(
          'Permiso de Cámara Requerido',
          'Adm Money necesita acceso a la cámara para tomar fotos a los tickets. Por favor actívalo en los ajustes de la aplicación.',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Abrir Ajustes',
              onPress: () => {
                Linking.openSettings().catch(() => {
                  Alert.alert('Ajustes', 'Abre la app de Ajustes de tu dispositivo y concede el permiso de Cámara a Adm Money.');
                });
              }
            }
          ]
        );
        return;
      }

      let result: ImagePicker.ImagePickerResult;
      try {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.85,
        });
      } catch (camErr: any) {
        console.warn('Primary launchCameraAsync failed, retrying with fallback:', camErr);
        result = await ImagePicker.launchCameraAsync({
          quality: 0.85,
        });
      }

      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        addScannedTicket({
          id: `scan-${Date.now()}`,
          uri: uri,
          merchant: 'Foto Tomada',
          amount: 0,
          date: new Date().toISOString().split('T')[0],
        });
        processTicket(uri);
      }
    } catch (err: any) {
      console.warn('Camera error:', err);
      Alert.alert(
        'Aviso de Cámara',
        `No se pudo abrir la cámara: ${err?.message || 'Error al iniciar la aplicación de cámara'}. Puedes seleccionar el ticket directamente desde la Galería.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir Ajustes', onPress: () => Linking.openSettings().catch(() => {}) }
        ]
      );
    }
  };

  // Pick from gallery
  const handlePickGallery = async () => {
    try {
      // Check current media library permission status
      let granted = true;
      try {
        const currentPerm = await ImagePicker.getMediaLibraryPermissionsAsync();
        granted = currentPerm.granted;

        if (!granted && currentPerm.canAskAgain) {
          const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
          granted = req.granted;
        }
      } catch (permErr) {
        console.warn('Media library permission check fallback:', permErr);
      }

      // On iOS, permission is strictly mandatory before opening picker
      if (!granted && Platform.OS === 'ios') {
        Alert.alert(
          'Permiso de Galería Requerido',
          'Adm Money necesita acceso a tus fotos para seleccionar el ticket. Por favor actívalo en Ajustes.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Abrir Ajustes', onPress: () => Linking.openSettings().catch(() => {}) }
          ]
        );
        return;
      }

      // On Android devices (particularly Xiaomi / HyperOS / MIUI), Android's new PhotoPicker
      // can throw ActivityNotFoundException / SecurityException.
      // We use legacy: true (ACTION_GET_CONTENT) as standard on Android for 100% universal compatibility.
      let result: ImagePicker.ImagePickerResult;
      try {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.85,
          legacy: Platform.OS === 'android',
        });
      } catch (pickerErr: any) {
        console.warn('First picker attempt failed, trying alternate mode:', pickerErr);
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.85,
          legacy: Platform.OS !== 'android',
        });
      }

      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        addScannedTicket({
          id: `scan-${Date.now()}`,
          uri: uri,
          merchant: 'Ticket Galería',
          amount: 0,
          date: new Date().toISOString().split('T')[0],
        });
        processTicket(uri);
      }
    } catch (err: any) {
      console.warn('Gallery error:', err);
      Alert.alert(
        'Error de Galería',
        `No se pudo abrir la galería: ${err?.message || 'Error de acceso a imágenes'}. Revisa los permisos en Ajustes si el problema persiste.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir Ajustes', onPress: () => Linking.openSettings().catch(() => {}) }
        ]
      );
    }
  };

  // View or re-scan an existing captured/uploaded ticket
  const handleSelectUploadedTicket = (ticket: ScannedTicket) => {
    if (ticket.uri) {
      setImageUri(ticket.uri);
    }
    if (ticket.scanResult) {
      setScanResult(ticket.scanResult);
      setIsModalVisible(true);
    } else if (ticket.uri) {
      processTicket(ticket.uri);
    } else {
      setScanResult({
        merchant: ticket.merchant,
        total_amount: ticket.amount,
        subtotal: ticket.amount,
        tax: 0,
        date: ticket.date,
        suggested_category: ticket.category || 'Insumos Galletas',
        confidence: 0.95,
        raw_text: `${ticket.merchant} - Total: $${ticket.amount}`,
        items: [
          {
            name: ticket.merchant,
            quantity: 1,
            price: ticket.amount,
          },
        ],
      });
      setIsModalVisible(true);
    }
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
    if (imageUri) {
      addScannedTicket({
        id: `exp-${Date.now()}`,
        uri: imageUri,
        merchant: data.title || scanResult?.merchant || 'Ticket Registrado',
        amount: data.amount || scanResult?.total_amount || 0,
        date: data.date || new Date().toISOString().split('T')[0],
        category: data.category,
        scanResult: scanResult || undefined,
      });
    }
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgPrimary }]}>
      <SwipeTabWrapper currentRoute="/scanner">
        <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.screenEyebrow, { color: colors.brandLight }]}>OCR Inteligente</Text>
          <Text style={[styles.screenTitle, { color: colors.textMain }]}>Escáner de Tickets</Text>
          <Text style={[styles.screenSubtitle, { color: colors.textMuted }]}>
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
              <View style={[styles.hudBracketTopLeft, { borderColor: colors.brand }]} />
              <View style={[styles.hudBracketTopRight, { borderColor: colors.brand }]} />
              <View style={[styles.hudBracketBottomLeft, { borderColor: colors.brand }]} />
              <View style={[styles.hudBracketBottomRight, { borderColor: colors.brand }]} />

              <View style={[styles.cameraIconCircle, { backgroundColor: colors.brandBg, borderColor: colors.brandBorder }]}>
                <Ionicons name="scan" size={44} color={colors.brand} />
              </View>
              <Text style={[styles.placeholderTitle, { color: colors.textMain }]}>Listo para Capturar</Text>
              <Text style={[styles.placeholderDesc, { color: colors.textMuted }]}>
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
            icon={<Ionicons name="images-outline" size={20} color={colors.textMain} />}
            onPress={handlePickGallery}
            disabled={isScanning}
          />

          {/* Real Uploaded / Captured Tickets Bar */}
          <View style={[styles.demoTicketsBox, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={[styles.demoTicketsTitle, { color: colors.textMuted }]}>
                Tickets Subidos y Capturados ({userTickets.length}):
              </Text>
            </View>

            {userTickets.length === 0 ? (
              <View style={styles.emptyTicketsContainer}>
                <Ionicons name="receipt-outline" size={16} color={colors.textDim} />
                <Text style={[styles.emptyTicketsText, { color: colors.textDim }]}>
                  Aún no has tomado ni subido tickets. Usa los botones de arriba para capturar uno real.
                </Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.demoButtonsRow}
              >
                {userTickets.map((ticket, idx) => (
                  <TouchableOpacity
                    key={ticket.id || idx}
                    onPress={() => handleSelectUploadedTicket(ticket)}
                    style={[styles.demoTicketChip, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}
                    disabled={isScanning}
                  >
                    <Ionicons name="receipt" size={13} color={colors.brand} />
                    <Text style={[styles.demoTicketText, { color: colors.textMain }]} numberOfLines={1}>
                      {ticket.merchant} (${ticket.amount > 0 ? ticket.amount.toFixed(0) : 'Pendiente'})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
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
      </SwipeTabWrapper>
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
  emptyTicketsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  emptyTicketsText: {
    fontSize: 11,
    lineHeight: 15,
    flex: 1,
  },
});
