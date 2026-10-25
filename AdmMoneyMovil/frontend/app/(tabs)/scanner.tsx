import React, { useState, useRef, useEffect } from 'react';
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
  Linking,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors, useThemeColors, radii, spacing } from '../../src/theme';
import { Button } from '../../src/components/ui/Button';
import { DoubleBezelCard } from '../../src/components/ui/DoubleBezelCard';
import { ReceiptPreviewModal } from '../../src/components/scanner/ReceiptPreviewModal';
import { TicketActionModal } from '../../src/components/scanner/TicketActionModal';
import { DigitalReceiptModal } from '../../src/components/expenses/DigitalReceiptModal';
import { SwipeTabWrapper } from '../../src/components/ui/SwipeTabWrapper';
import { AmbientBackdrop } from '../../src/components/ui/AmbientBackdrop';
import { MobileApiService } from '../../src/services/api';
import { useAppStore } from '../../src/stores/app.store';
import { ReceiptScanResult, Expense, ScannedTicket } from '../../src/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { resolveReceiptImageUrl } from '../../src/lib/imageUrl';

export default function ScannerScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const {
    addExpense,
    expenses,
    scannedTickets,
    addScannedTicket,
    deleteScannedTicket,
    updateScannedTicket,
    deleteExpense,
    highPrecisionOcr,
    hapticsEnabled,
    backendUrl,
  } = useAppStore();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStepText, setScanStepText] = useState('Analizando ticket con IA...');
  const [scanResult, setScanResult] = useState<ReceiptScanResult | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedActionTicket, setSelectedActionTicket] = useState<ScannedTicket | null>(null);
  const [digitalReceiptExpense, setDigitalReceiptExpense] = useState<Expense | null>(null);

  // Animated laser scan bar
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animLoop: Animated.CompositeAnimation | null = null;
    if (isScanning) {
      animLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 210,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      );
      animLoop.start();
    } else {
      scanLineAnim.setValue(0);
    }
    return () => {
      animLoop?.stop();
    };
  }, [isScanning]);

  // Combine tickets captured or uploaded with expenses that have tickets
  const userTickets = React.useMemo(() => {
    const list: ScannedTicket[] = [...scannedTickets];
    expenses.forEach((e) => {
      const localMatch = scannedTickets.find(
        (t) =>
          (t.id && t.id === `exp-${e.id}`) ||
          (t.uri &&
            (t.uri.startsWith('file://') || t.uri.startsWith('content://')) &&
            ((t.scanResult && (t.scanResult as any)?.merchant === e.title) ||
              (t.merchant === e.title && Math.abs(t.amount - e.amount) < 0.01)))
      );

      const resolvedUri = localMatch?.uri || e.receipt_url || '';
      const hasReceipt = Boolean(
        resolvedUri || e.receipt_data || (e.notes && e.notes.toLowerCase().includes('ticket'))
      );
      if (hasReceipt && !list.some((t) => t.id === `exp-${e.id}` || (t.uri && t.uri === resolvedUri))) {
        list.push({
          id: `exp-${e.id}`,
          uri: resolvedUri,
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
      const currentPerm = await ImagePicker.getCameraPermissionsAsync();
      let granted = currentPerm.granted;

      if (!granted) {
        const req = await ImagePicker.requestCameraPermissionsAsync();
        granted = req.granted;
      }

      if (!granted) {
        Alert.alert(
          'Permiso de Cámara Requerido',
          'Adm Money necesita acceso a la cámara para tomar fotos a los tickets. Por favor actívalo en los ajustes de la aplicación.',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Abrir Ajustes',
              onPress: () => {
                Linking.openSettings().catch(() => {});
              }
            }
          ]
        );
        return;
      }

      const imgQuality = highPrecisionOcr ? 0.98 : 0.75;
      let result: ImagePicker.ImagePickerResult;
      try {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: imgQuality,
        });
      } catch (camErr: any) {
        console.warn('Primary launchCameraAsync fallback:', camErr);
        result = await ImagePicker.launchCameraAsync({
          quality: imgQuality,
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
      let granted = true;
      try {
        const currentPerm = await ImagePicker.getMediaLibraryPermissionsAsync();
        granted = currentPerm.granted;

        if (!granted && currentPerm.canAskAgain) {
          const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
          granted = req.granted;
        }
      } catch (permErr) {
        console.warn('Media library permission fallback:', permErr);
      }

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

      const imgQuality = highPrecisionOcr ? 0.98 : 0.75;
      let result: ImagePicker.ImagePickerResult;
      try {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: imgQuality,
          legacy: Platform.OS === 'android',
        });
      } catch (pickerErr: any) {
        console.warn('First picker attempt fallback:', pickerErr);
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: imgQuality,
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

  // Direct manual entry fallback
  const handleManualEntry = () => {
    setScanResult({
      merchant: '',
      total_amount: 0,
      subtotal: 0,
      tax: 0,
      date: new Date().toISOString().split('T')[0],
      suggested_category: 'Insumos Galletas',
      confidence: 1.0,
      raw_text: 'Registro manual de ticket',
      items: [],
    });
    setIsModalVisible(true);
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

  // Process ticket with real AI Vision, OCR & guaranteed modal popup
  const processTicket = async (uri: string) => {
    setIsScanning(true);
    setScanStepText('Optimizando fotografía del ticket...');

    const timer1 = setTimeout(() => {
      setScanStepText('Analizando productos con Inteligencia Artificial...');
    }, 900);

    const timer2 = setTimeout(() => {
      setScanStepText('Verificando precios y calculando total...');
    }, 4500);

    try {
      const parsed = await MobileApiService.scanReceipt(uri);
      clearTimeout(timer1);
      clearTimeout(timer2);

      const safeResult: ReceiptScanResult = parsed || {
        merchant: 'Ticket de Compra',
        date: new Date().toISOString().split('T')[0],
        total_amount: 0,
        subtotal: 0,
        tax: 0,
        items: [],
        suggested_category: 'Insumos Galletas',
        confidence: 0.5,
        raw_text: 'Ticket capturado listo para confirmar',
      };

      setScanResult(safeResult);
      setIsModalVisible(true);
    } catch (err) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      console.warn('Scan processing error:', err);
      setScanResult({
        merchant: 'Ticket de Compra',
        date: new Date().toISOString().split('T')[0],
        total_amount: 0,
        subtotal: 0,
        tax: 0,
        items: [],
        suggested_category: 'Insumos Galletas',
        confidence: 0.5,
        raw_text: 'Ticket capturado',
      });
      setIsModalVisible(true);
    } finally {
      setIsScanning(false);
      setScanStepText('Analizando ticket con IA...');
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
  };

  // Convert ScannedTicket to Expense for DigitalReceiptModal
  const ticketToExpense = (ticket: ScannedTicket): Expense => {
    const idStr = String(ticket.id || '');
    if (idStr.startsWith('exp-')) {
      const numId = parseInt(idStr.replace('exp-', ''), 10);
      const found = expenses.find((e) => e.id === numId);
      if (found) {
        return {
          ...found,
          receipt_url: ticket.uri || found.receipt_url,
        };
      }
    }
    return {
      id: 0,
      title: ticket.merchant ? `Compra ${ticket.merchant.replace(/^Compra\s+/i, '')}` : 'Ticket Capturado',
      amount: ticket.amount || 0,
      category: ticket.category || 'Insumos Galletas',
      date: ticket.date || new Date().toISOString().split('T')[0],
      payment_method: ticket.scanResult?.payment_method || 'Efectivo',
      notes: 'Ticket escaneado y digitalizado',
      receipt_url: ticket.uri,
      receipt_data: ticket.scanResult
        ? (ticket.scanResult as any)
        : {
            merchant: ticket.merchant || 'Ticket de Compra',
            total_amount: ticket.amount || 0,
            date: ticket.date || new Date().toISOString().split('T')[0],
            payment_method: 'Efectivo',
            items:
              ticket.amount > 0
                ? [
                    {
                      name: ticket.merchant || 'Insumos Comprados',
                      quantity: 1,
                      price: ticket.amount,
                    },
                  ]
                : [],
          },
      created_at: new Date().toISOString(),
    };
  };

  const handleLongPressTicket = (ticket: ScannedTicket) => {
    setSelectedActionTicket(ticket);
  };

  const handleViewDigitalReceipt = (ticket: ScannedTicket) => {
    const exp = ticketToExpense(ticket);
    setDigitalReceiptExpense(exp);
  };

  const handleViewPhoto = (ticket: ScannedTicket) => {
    if (ticket.uri) {
      setImageUri(ticket.uri);
    }
  };

  const handleEditTicket = (ticket: ScannedTicket) => {
    if (ticket.uri) {
      setImageUri(ticket.uri);
    }
    if (ticket.scanResult) {
      setScanResult(ticket.scanResult);
    } else {
      setScanResult({
        merchant: ticket.merchant || 'Ticket de Compra',
        total_amount: ticket.amount || 0,
        subtotal: ticket.amount ? Number((ticket.amount / 1.16).toFixed(2)) : 0,
        tax: ticket.amount ? Number((ticket.amount - ticket.amount / 1.16).toFixed(2)) : 0,
        date: ticket.date || new Date().toISOString().split('T')[0],
        suggested_category: ticket.category || 'Insumos Galletas',
        confidence: 0.95,
        raw_text: `${ticket.merchant} - Total: $${ticket.amount}`,
        items:
          ticket.amount > 0
            ? [
                {
                  name: ticket.merchant || 'Insumos',
                  quantity: 1,
                  price: ticket.amount,
                },
              ]
            : [],
      });
    }
    setIsModalVisible(true);
  };

  const handleRescanTicket = (ticket: ScannedTicket) => {
    if (ticket.uri) {
      setImageUri(ticket.uri);
      processTicket(ticket.uri);
    }
  };

  const handleDeleteTicket = async (ticket: ScannedTicket) => {
    const idStr = String(ticket.id || '');
    if (idStr.startsWith('exp-')) {
      const numId = parseInt(idStr.replace('exp-', ''), 10);
      await deleteExpense(numId);
    }
    deleteScannedTicket(idStr);
    if (imageUri && imageUri === ticket.uri) {
      setImageUri(null);
      setScanResult(null);
    }
    Alert.alert('Ticket Eliminado', `El ticket "${ticket.merchant || 'seleccionado'}" fue eliminado.`);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      <AmbientBackdrop variant="brand" />
      <SwipeTabWrapper currentRoute="/scanner">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerBadgeRow}>
              <Text style={[styles.screenEyebrow, { color: colors.brandLight }]}>OCR INTELIGENTE</Text>
              <View
                style={[
                  styles.precisionBadge,
                  {
                    backgroundColor: highPrecisionOcr ? 'rgba(16, 185, 129, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                    borderColor: highPrecisionOcr ? '#10B981' : colors.borderSubtle,
                  },
                ]}
              >
                <Ionicons
                  name={highPrecisionOcr ? 'sparkles' : 'flash-outline'}
                  size={11}
                  color={highPrecisionOcr ? '#10B981' : colors.textDim}
                />
                <Text
                  style={[
                    styles.precisionBadgeText,
                    { color: highPrecisionOcr ? '#10B981' : colors.textDim },
                  ]}
                >
                  {highPrecisionOcr ? 'IA Alta Precisión' : 'Modo Rápido'}
                </Text>
              </View>
            </View>
            <Text style={[styles.screenTitle, { color: colors.textMain }]}>Escáner de Tickets</Text>
            <Text style={[styles.screenSubtitle, { color: colors.textMuted }]}>
              Toma foto a tu ticket de compra para extraer automáticamente los productos y sumarlos a tus gastos.
            </Text>
          </View>

          {/* Viewfinder / HUD Card */}
          <DoubleBezelCard
            style={styles.viewfinderCard}
            innerStyle={styles.viewfinderInner}
          >
            {imageUri ? (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                  if (!isScanning) {
                    if (!scanResult) {
                      setScanResult({
                        merchant: 'Ticket de Compra',
                        date: new Date().toISOString().split('T')[0],
                        total_amount: 0,
                        subtotal: 0,
                        tax: 0,
                        items: [],
                        suggested_category: 'Insumos Galletas',
                        confidence: 0.5,
                        raw_text: 'Ticket capturado',
                      });
                    }
                    setIsModalVisible(true);
                  }
                }}
                style={styles.previewContainer}
              >
                <Image
                  source={{ uri: resolveReceiptImageUrl(imageUri, backendUrl) || imageUri }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
                {isScanning ? (
                  <View style={styles.scanningOverlay}>
                    {/* Animated laser line */}
                    <Animated.View
                      style={[
                        styles.laserLine,
                        {
                          borderColor: colors.brand,
                          backgroundColor: colors.brand,
                          transform: [{ translateY: scanLineAnim }],
                        },
                      ]}
                    />
                    <View style={styles.scanningBadge}>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={styles.scanningText}>{scanStepText}</Text>
                    </View>
                  </View>
                ) : (
                  <>
                    <View style={[styles.openModalPill, { backgroundColor: colors.brand }]}>
                      <Ionicons name="sparkles" size={13} color="#fff" />
                      <Text style={styles.openModalPillText}>Toca para Ver / Confirmar</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.reScanBadge, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}
                      onPress={(e) => {
                        e.stopPropagation();
                        processTicket(imageUri);
                      }}
                    >
                      <Ionicons name="refresh" size={14} color={colors.brand} />
                      <Text style={[styles.reScanText, { color: colors.brand }]}>Re-escanear</Text>
                    </TouchableOpacity>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.placeholderContainer}>
                {/* HUD Target Corner Brackets */}
                <View style={[styles.hudBracket, styles.hudBracketTopLeft, { borderColor: colors.brand }]} />
                <View style={[styles.hudBracket, styles.hudBracketTopRight, { borderColor: colors.brand }]} />
                <View style={[styles.hudBracket, styles.hudBracketBottomLeft, { borderColor: colors.brand }]} />
                <View style={[styles.hudBracket, styles.hudBracketBottomRight, { borderColor: colors.brand }]} />

                <View style={[styles.cameraIconCircle, { backgroundColor: colors.brandBg, borderColor: colors.brandBorder }]}>
                  <Ionicons name="scan-outline" size={42} color={colors.brand} />
                </View>
                <Text style={[styles.placeholderTitle, { color: colors.textMain }]}>Listo para Capturar</Text>
                <Text style={[styles.placeholderDesc, { color: colors.textMuted }]}>
                  Enfoca el ticket con buena luz y presiona tomar foto
                </Text>
              </View>
            )}
          </DoubleBezelCard>

          {/* Action Buttons */}
          <View style={styles.actionColumn}>
            {imageUri && !isScanning && (
              <Button
                title="Ver y Confirmar Ticket Escaneado"
                variant="primary"
                icon={<Ionicons name="checkmark-circle-outline" size={20} color="#fff" />}
                onPress={() => {
                  if (!scanResult) {
                    setScanResult({
                      merchant: 'Ticket de Compra',
                      date: new Date().toISOString().split('T')[0],
                      total_amount: 0,
                      subtotal: 0,
                      tax: 0,
                      items: [],
                      suggested_category: 'Insumos Galletas',
                      confidence: 0.5,
                      raw_text: 'Ticket capturado',
                    });
                  }
                  setIsModalVisible(true);
                }}
              />
            )}

            <Button
              title="Tomar Foto con Cámara"
              variant={imageUri ? "secondary" : "primary"}
              icon={<Ionicons name="camera" size={20} color={imageUri ? colors.textMain : "#fff"} />}
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

            <TouchableOpacity
              onPress={handleManualEntry}
              style={[styles.manualButton, { borderColor: colors.borderSubtle, backgroundColor: colors.bgCard }]}
              activeOpacity={0.7}
              disabled={isScanning}
            >
              <Ionicons name="create-outline" size={16} color={colors.textMuted} />
              <Text style={[styles.manualButtonText, { color: colors.textMuted }]}>
                O Ingresar Ticket Manualmente
              </Text>
            </TouchableOpacity>

            {/* Real Uploaded / Captured Tickets Bar */}
            <View style={[styles.demoTicketsBox, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}>
              <View style={styles.ticketsBoxHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="receipt-outline" size={15} color={colors.textDim} />
                  <Text style={[styles.demoTicketsTitle, { color: colors.textDim }]}>
                    Tickets Capturados ({userTickets.length})
                  </Text>
                </View>
                <Text style={{ fontSize: 10, color: colors.textDim, fontStyle: 'italic' }}>
                  Mantén pulsado para opciones
                </Text>
              </View>

              {userTickets.length === 0 ? (
                <View style={styles.emptyTicketsContainer}>
                  <Text style={[styles.emptyTicketsText, { color: colors.textDim }]}>
                    Aún no has tomado ni subido tickets. Usa los botones de arriba para escanear uno real.
                  </Text>
                </View>
              ) : (
                <View style={styles.ticketsVerticalList}>
                  {userTickets.map((ticket, idx) => (
                    <TouchableOpacity
                      key={ticket.id || idx}
                      onPress={() => handleSelectUploadedTicket(ticket)}
                      onLongPress={() => handleLongPressTicket(ticket)}
                      delayLongPress={260}
                      style={[
                        styles.ticketListItem,
                        {
                          backgroundColor: colors.bgTertiary,
                          borderColor: colors.borderSubtle,
                        },
                      ]}
                      activeOpacity={0.7}
                      disabled={isScanning}
                    >
                      <View style={[styles.ticketListIconBox, { backgroundColor: colors.brandBg }]}>
                        <Ionicons name="receipt-outline" size={18} color={colors.brand} />
                      </View>

                      <View style={styles.ticketListInfo}>
                        <Text style={[styles.ticketListMerchant, { color: colors.textMain }]} numberOfLines={1}>
                          {ticket.merchant || 'Ticket Registrado'}
                        </Text>
                        <Text style={[styles.ticketListMeta, { color: colors.textDim }]}>
                          {ticket.date || 'Reciente'} • {ticket.category || 'Insumos'}
                        </Text>
                      </View>

                      <View style={styles.ticketListRight}>
                        <Text
                          style={[
                            styles.ticketListAmount,
                            { color: ticket.amount > 0 ? colors.rose : colors.textDim },
                          ]}
                        >
                          {ticket.amount > 0 ? `-$${ticket.amount.toFixed(2)}` : 'Sin total'}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <View style={styles.ticketListActionBadge}>
                            <Text style={[styles.ticketListActionText, { color: colors.brandLight }]}>
                              Ver
                            </Text>
                            <Ionicons name="chevron-forward" size={12} color={colors.brandLight} />
                          </View>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              handleLongPressTicket(ticket);
                            }}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            style={[styles.ticketDotsBtn, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}
                          >
                            <Ionicons name="ellipsis-vertical" size={12} color={colors.textDim} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </SwipeTabWrapper>

      {/* Receipt Modal Mounted Directly at Root (Never suppressed by animated swipe wrapper) */}
      <ReceiptPreviewModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        scanResult={scanResult}
        imageUri={imageUri}
        onConfirm={handleConfirmExpense}
      />

      {/* Quick Action Modal on Long-Press of Captured Ticket */}
      <TicketActionModal
        visible={!!selectedActionTicket}
        ticket={selectedActionTicket}
        onClose={() => setSelectedActionTicket(null)}
        onViewDigitalReceipt={handleViewDigitalReceipt}
        onViewPhoto={handleViewPhoto}
        onEdit={handleEditTicket}
        onRescan={handleRescanTicket}
        onDelete={handleDeleteTicket}
      />

      {/* Digital Thermal Receipt Modal */}
      <DigitalReceiptModal
        visible={!!digitalReceiptExpense}
        expense={digitalReceiptExpense}
        onClose={() => setDigitalReceiptExpense(null)}
        onEdit={(exp) => {
          setDigitalReceiptExpense(null);
          if (exp.receipt_url) setImageUri(exp.receipt_url);
          if (exp.receipt_data) {
            setScanResult(exp.receipt_data as any);
          } else {
            setScanResult({
              merchant: exp.title.replace(/^Compra\s+/i, ''),
              total_amount: exp.amount,
              subtotal: Number((exp.amount / 1.16).toFixed(2)),
              tax: Number((exp.amount - exp.amount / 1.16).toFixed(2)),
              date: exp.date,
              suggested_category: exp.category,
              confidence: 0.95,
              raw_text: exp.notes || '',
              items: [],
            });
          }
          setIsModalVisible(true);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 110,
  },
  header: {
    marginBottom: 10,
  },
  headerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  precisionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  precisionBadgeText: {
    fontSize: 10,
    fontWeight: '700',
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
    height: 250,
    marginVertical: 12,
  },
  viewfinderInner: {
    flex: 1,
    padding: 0,
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    position: 'relative',
  },
  hudBracket: {
    position: 'absolute',
    width: 24,
    height: 24,
  },
  hudBracketTopLeft: {
    top: 14,
    left: 14,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 6,
  },
  hudBracketTopRight: {
    top: 14,
    right: 14,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 6,
  },
  hudBracketBottomLeft: {
    bottom: 14,
    left: 14,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 6,
  },
  hudBracketBottomRight: {
    bottom: 14,
    right: 14,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 6,
  },
  cameraIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  placeholderTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  placeholderDesc: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 16,
  },
  previewContainer: {
    flex: 1,
    borderRadius: radii.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 6, 9, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  laserLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 20,
    height: 2,
    borderBottomWidth: 2,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 4,
  },
  scanningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  scanningText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  reScanBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    elevation: 3,
  },
  reScanText: {
    fontSize: 11,
    fontWeight: '700',
  },
  openModalPill: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    elevation: 4,
  },
  openModalPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  actionColumn: {
    gap: 10,
    marginTop: 4,
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  manualButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  demoTicketsBox: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 12,
    marginTop: 4,
  },
  ticketsBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  demoTicketsTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ticketsVerticalList: {
    gap: 8,
    marginTop: 4,
  },
  ticketListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: 10,
  },
  ticketListIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketListInfo: {
    flex: 1,
  },
  ticketListMerchant: {
    fontSize: 13,
    fontWeight: '700',
  },
  ticketListMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  ticketListRight: {
    alignItems: 'flex-end',
  },
  ticketListAmount: {
    fontSize: 13,
    fontWeight: '800',
  },
  ticketListActionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  ticketListActionText: {
    fontSize: 10,
    fontWeight: '700',
  },
  ticketDotsBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  emptyTicketsContainer: {
    paddingVertical: 4,
  },
  emptyTicketsText: {
    fontSize: 11,
    lineHeight: 16,
  },
});
