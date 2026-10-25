import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Share,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Expense } from '../../lib/types';
import { useThemeColors, radii, spacing } from '../../theme';
import { Button } from '../ui/Button';
import { useAppStore } from '../../stores/app.store';
import { resolveReceiptImageUrl } from '../../lib/imageUrl';

interface DigitalReceiptModalProps {
  visible: boolean;
  expense: Expense | null;
  onClose: () => void;
  onEdit?: (expense: Expense) => void;
}

export const DigitalReceiptModal: React.FC<DigitalReceiptModalProps> = ({
  visible,
  expense,
  onClose,
  onEdit,
}) => {
  const colors = useThemeColors();
  const isDark = colors.isDark;
  const { backendUrl } = useAppStore();
  const [viewMode, setViewMode] = useState<'digital' | 'photo'>('digital');
  const [isImgLoading, setIsImgLoading] = useState(false);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  const screenHeight = Dimensions.get('window').height;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
      setViewMode('digital');
      setImageLoadFailed(false);
      setIsImgLoading(false);
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        return gestureState.dy > 6 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.3;
      },
      onPanResponderMove: (_evt, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        } else {
          translateY.setValue(gestureState.dy * 0.15);
        }
      },
      onPanResponderRelease: (_evt, gestureState) => {
        if (gestureState.dy > 100 || (gestureState.dy > 30 && gestureState.vy > 0.35)) {
          Animated.timing(translateY, {
            toValue: screenHeight,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            onClose();
            translateY.setValue(0);
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            friction: 8,
            tension: 80,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (!expense) return null;

  const receiptData = expense.receipt_data || {};
  const merchantName = (
    receiptData.merchant ||
    expense.title.replace(/^Compra\s+/i, '') ||
    'Comercio'
  ).toUpperCase();

  const rawItems = receiptData.items || [];
  const items: Array<{ name: string; quantity: number; price: number }> =
    Array.isArray(rawItems) && rawItems.length > 0
      ? rawItems.map((it: any) => ({
          name: String(it.name || 'Artículo'),
          quantity: Number(it.quantity || 1),
          price: Number(it.price || 0),
        }))
      : [
          {
            name: expense.title,
            quantity: 1,
            price: expense.amount,
          },
        ];

  const subtotal = expense.amount > 0 ? (expense.amount / 1.16).toFixed(2) : '0.00';
  const tax = expense.amount > 0 ? (expense.amount - expense.amount / 1.16).toFixed(2) : '0.00';
  const total = expense.amount.toFixed(2);
  const paymentMethod = expense.payment_method || receiptData.payment_method || 'Efectivo';
  const rawPhotoUrl =
    (expense.receipt_data as any)?.local_uri ||
    expense.receipt_url ||
    receiptData.image_url ||
    (receiptData as any)?.uri;
  const physicalPhotoUrl = resolveReceiptImageUrl(rawPhotoUrl, backendUrl);

  const handleShareReceipt = async () => {
    try {
      const itemsText = items
        .map((it) => `• ${it.quantity}x ${it.name} - $${it.price.toFixed(2)} MXN`)
        .join('\n');

      const message =
        `COMPROBANTE DIGITALIZADO - ADM MONEY\n` +
        `TIENDA: ${merchantName}\n` +
        `FECHA: ${expense.date}\n` +
        `MÉTODO DE PAGO: ${paymentMethod}\n` +
        `--------------------------------\n` +
        `ARTÍCULOS:\n${itemsText}\n` +
        `--------------------------------\n` +
        `SUBTOTAL: $${subtotal} MXN\n` +
        `IVA (16%): $${tax} MXN\n` +
        `TOTAL: $${total} MXN\n` +
        `--------------------------------\n` +
        `Generado por Adm Money AI`;

      await Share.share({ message });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.dialog,
            {
              backgroundColor: isDark ? '#121620' : '#F1F5F9',
              borderColor: isDark ? '#2E384D' : '#CBD5E1',
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Header & Swipe Handle with PanResponder */}
          <View {...panResponder.panHandlers}>
            <View style={styles.dragHandleContainer}>
              <View
                style={[
                  styles.dragHandleBar,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.18)' },
                ]}
              />
            </View>

            <View style={[styles.header, { borderBottomColor: isDark ? '#242B3A' : '#E2E8F0' }]}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="receipt" size={17} color={colors.brandLight} />
                  <Text style={[styles.headerEyebrow, { color: colors.brandLight }]}>
                    TICKET DIGITALIZADO
                  </Text>
                </View>
                <Text style={[styles.headerTitle, { color: isDark ? '#F8FAFC' : '#0F172A' }]} numberOfLines={1}>
                  {merchantName}
                </Text>
              </View>

              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Toggle View: Digital Thermal Voucher vs Original Physical Photo */}
          {!!physicalPhotoUrl && (
            <View style={[styles.tabBar, { backgroundColor: isDark ? '#1C2230' : '#E2E8F0' }]}>
              <TouchableOpacity
                onPress={() => setViewMode('digital')}
                style={[
                  styles.tabBtn,
                  viewMode === 'digital' && [
                    styles.tabBtnActive,
                    { backgroundColor: isDark ? '#2B3548' : '#FFFFFF' },
                  ],
                ]}
              >
                <Ionicons
                  name="document-text-outline"
                  size={15}
                  color={viewMode === 'digital' ? colors.brandLight : colors.textDim}
                />
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: viewMode === 'digital' ? colors.brandLight : colors.textDim,
                      fontWeight: viewMode === 'digital' ? '800' : '600',
                    },
                  ]}
                >
                  Ticket Digital
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setViewMode('photo')}
                style={[
                  styles.tabBtn,
                  viewMode === 'photo' && [
                    styles.tabBtnActive,
                    { backgroundColor: isDark ? '#2B3548' : '#FFFFFF' },
                  ],
                ]}
              >
                <Ionicons
                  name="camera-outline"
                  size={15}
                  color={viewMode === 'photo' ? colors.brandLight : colors.textDim}
                />
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: viewMode === 'photo' ? colors.brandLight : colors.textDim,
                      fontWeight: viewMode === 'photo' ? '800' : '600',
                    },
                  ]}
                >
                  Foto Original
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
            {viewMode === 'photo' ? (
              physicalPhotoUrl && !imageLoadFailed ? (
                /* ORIGINAL PHOTO VIEW */
                <View style={styles.photoContainer}>
                  {isImgLoading && (
                    <View style={styles.photoLoadingBox}>
                      <ActivityIndicator size="large" color={colors.brandLight} />
                      <Text style={{ fontSize: 12, color: colors.textDim, marginTop: 8, fontWeight: '700' }}>
                        Cargando fotografía original...
                      </Text>
                    </View>
                  )}
                  <Image
                    source={{ uri: physicalPhotoUrl }}
                    style={[styles.receiptImage, isImgLoading && { height: 0, opacity: 0 }]}
                    resizeMode="contain"
                    onLoadStart={() => setIsImgLoading(true)}
                    onLoadEnd={() => setIsImgLoading(false)}
                    onError={() => {
                      setImageLoadFailed(true);
                      setIsImgLoading(false);
                    }}
                  />
                  {!isImgLoading && (
                    <Text style={[styles.photoCaption, { color: colors.textDim }]}>
                      Foto del ticket físico capturado con la cámara
                    </Text>
                  )}
                </View>
              ) : (
                /* FALLBACK WHEN PHOTO CANNOT BE ACCESSED */
                <View
                  style={[
                    styles.photoEmptyCard,
                    {
                      backgroundColor: isDark ? '#181E29' : '#FFFFFF',
                      borderColor: isDark ? '#2E394E' : '#E2E8F0',
                    },
                  ]}
                >
                  <View style={[styles.photoEmptyIconCircle, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.12)' : '#E0F2FE' }]}>
                    <Ionicons name="camera-outline" size={38} color={colors.brandLight} />
                  </View>
                  <Text style={[styles.photoEmptyTitle, { color: colors.textMain }]}>
                    Fotografía Física No Disponible
                  </Text>
                  <Text style={[styles.photoEmptyDesc, { color: colors.textDim }]}>
                    {imageLoadFailed
                      ? 'La imagen en el servidor ya no está disponible, pero todos los datos de tu ticket están 100% digitalizados en la pestaña "Ticket Digital".'
                      : 'Este comprobante fue registrado sin adjuntar imagen física. Puedes consultar todos los productos en la pestaña "Ticket Digital".'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setViewMode('digital')}
                    style={[styles.backToDigitalBtn, { backgroundColor: colors.brandBg, borderColor: colors.brandBorder }]}
                  >
                    <Ionicons name="receipt-outline" size={16} color={colors.brand} />
                    <Text style={[styles.backToDigitalText, { color: colors.brand }]}>
                      Ver Ticket Digitalizado
                    </Text>
                  </TouchableOpacity>
                </View>
              )
            ) : (
              /* AUTHENTIC DIGITAL THERMAL RECEIPT VIEW */
              <View
                style={[
                  styles.paperReceipt,
                  {
                    backgroundColor: isDark ? '#181E29' : '#FFFFFF',
                    borderColor: isDark ? '#2E394E' : '#E2E8F0',
                  },
                ]}
              >
                {/* Store Branding Header */}
                <View style={styles.receiptHeaderBox}>
                  <View style={styles.storeLogoCircle}>
                    <Ionicons name="storefront-outline" size={24} color="#0284C7" />
                  </View>
                  <Text style={[styles.receiptStoreName, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
                    {merchantName}
                  </Text>
                  <Text style={[styles.receiptSubtext, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    COMPROBANTE DE COMPRA DIGITAL
                  </Text>
                  <Text style={[styles.receiptMetaText, { color: colors.textDim }]}>
                    FOLIO #{expense.id.toString().padStart(6, '0')} • {expense.date}
                  </Text>

                  <View
                    style={[
                      styles.paymentBadge,
                      {
                        backgroundColor:
                          paymentMethod.toLowerCase().includes('tarjeta')
                            ? (isDark ? 'rgba(56, 189, 248, 0.16)' : '#E0F2FE')
                            : (isDark ? 'rgba(16, 185, 129, 0.16)' : '#DCFCE7'),
                        borderColor:
                          paymentMethod.toLowerCase().includes('tarjeta')
                            ? colors.brandLight
                            : colors.emeraldLight,
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        paymentMethod.toLowerCase().includes('tarjeta')
                          ? 'card-outline'
                          : 'cash-outline'
                      }
                      size={13}
                      color={
                        paymentMethod.toLowerCase().includes('tarjeta')
                          ? colors.brandLight
                          : colors.emeraldLight
                      }
                    />
                    <Text
                      style={[
                        styles.paymentBadgeText,
                        {
                          color:
                            paymentMethod.toLowerCase().includes('tarjeta')
                              ? colors.brandLight
                              : colors.emeraldLight,
                        },
                      ]}
                    >
                      PAGADO EN {paymentMethod.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Perforated dashed divider */}
                <View style={styles.perforatedLine}>
                  {Array.from({ length: 28 }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.dashDot,
                        { backgroundColor: isDark ? '#334155' : '#CBD5E1' },
                      ]}
                    />
                  ))}
                </View>

                {/* Items Table Header */}
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.colHeader, { flex: 0.8, color: colors.textDim }]}>CANT</Text>
                  <Text style={[styles.colHeader, { flex: 2.2, color: colors.textDim }]}>DESCRIPCIÓN</Text>
                  <Text style={[styles.colHeader, { flex: 1.2, textAlign: 'right', color: colors.textDim }]}>TOTAL</Text>
                </View>

                {/* Items List */}
                <View style={{ gap: 8, marginVertical: 6 }}>
                  {items.map((item, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <Text style={[styles.itemQty, { color: isDark ? '#38BDF8' : '#0284C7' }]}>
                        {item.quantity}x
                      </Text>
                      <Text style={[styles.itemName, { color: isDark ? '#E2E8F0' : '#1E293B' }]} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={[styles.itemPrice, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
                        ${item.price.toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Perforated dashed divider */}
                <View style={styles.perforatedLine}>
                  {Array.from({ length: 28 }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.dashDot,
                        { backgroundColor: isDark ? '#334155' : '#CBD5E1' },
                      ]}
                    />
                  ))}
                </View>

                {/* Totals Breakdown */}
                <View style={styles.totalsBox}>
                  <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { color: colors.textDim }]}>Subtotal</Text>
                    <Text style={[styles.totalVal, { color: isDark ? '#CBD5E1' : '#475569' }]}>
                      ${subtotal} MXN
                    </Text>
                  </View>

                  <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { color: colors.textDim }]}>IVA (16%)</Text>
                    <Text style={[styles.totalVal, { color: isDark ? '#CBD5E1' : '#475569' }]}>
                      ${tax} MXN
                    </Text>
                  </View>

                  <View style={[styles.totalDivider, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]} />

                  <View style={styles.grandTotalRow}>
                    <Text style={[styles.grandTotalLabel, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
                      TOTAL PAGADO
                    </Text>
                    <Text style={[styles.grandTotalVal, { color: colors.emeraldLight }]}>
                      ${total} MXN
                    </Text>
                  </View>
                </View>

                {/* Notes if available */}
                {!!expense.notes && (
                  <View style={[styles.notesCard, { backgroundColor: isDark ? '#131822' : '#F8FAFC', borderColor: isDark ? '#263143' : '#E2E8F0' }]}>
                    <Text style={[styles.notesTitle, { color: colors.amberLight }]}>Observaciones:</Text>
                    <Text style={[styles.notesContent, { color: isDark ? '#CBD5E1' : '#475569' }]}>
                      {expense.notes}
                    </Text>
                  </View>
                )}

                {/* Realistic Thermal Barcode Visual */}
                <View style={styles.barcodeBox}>
                  <View style={styles.barcodeBars}>
                    {[4, 2, 5, 2, 3, 6, 2, 4, 3, 2, 5, 4, 2, 6, 3, 5, 2, 4, 3, 6, 2, 4].map((w, idx) => (
                      <View
                        key={idx}
                        style={{
                          width: w,
                          height: 38,
                          backgroundColor: isDark ? '#94A3B8' : '#1E293B',
                          marginRight: 2,
                        }}
                      />
                    ))}
                  </View>
                  <Text style={[styles.barcodeCode, { color: colors.textDim }]}>
                    * 8 9 2 0 4 1 8 5 0 2 1 *
                  </Text>
                  <Text style={[styles.ticketFooterThanks, { color: colors.textDim }]}>
                    ¡Gracias por su compra! • Digitalizado por Adm Money AI
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Action Footer */}
          <View style={[styles.footer, { borderTopColor: isDark ? '#242B3A' : '#E2E8F0' }]}>
            <TouchableOpacity
              onPress={handleShareReceipt}
              style={[
                styles.shareBtn,
                {
                  backgroundColor: isDark ? '#1E2638' : '#E2E8F0',
                  borderColor: isDark ? '#2E394E' : '#CBD5E1',
                },
              ]}
            >
              <Ionicons name="share-social-outline" size={18} color={isDark ? '#38BDF8' : '#0284C7'} />
              <Text style={[styles.shareBtnText, { color: isDark ? '#38BDF8' : '#0284C7' }]}>
                Compartir
              </Text>
            </TouchableOpacity>

            {onEdit && (
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onEdit(expense);
                }}
                style={[
                  styles.editBtn,
                  {
                    backgroundColor: colors.brandLight,
                  },
                ]}
              >
                <Ionicons name="pencil" size={17} color="#FFFFFF" />
                <Text style={styles.editBtnText}>Editar Ticket</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 14, 23, 0.75)',
    justifyContent: 'flex-end',
  },
  dialog: {
    borderTopLeftRadius: radii.outer,
    borderTopRightRadius: radii.outer,
    borderWidth: 1,
    maxHeight: '92%',
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dragHandleBar: {
    width: 38,
    height: 4.5,
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  tabBar: {
    flexDirection: 'row',
    padding: 4,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: radii.md,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: radii.sm,
  },
  tabBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  photoContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    minHeight: 280,
    justifyContent: 'center',
  },
  photoLoadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  receiptImage: {
    width: '100%',
    height: 440,
    borderRadius: radii.md,
  },
  photoCaption: {
    fontSize: 11,
    marginTop: 8,
    fontStyle: 'italic',
  },
  photoEmptyCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  photoEmptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  photoEmptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  photoEmptyDesc: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  backToDigitalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  backToDigitalText: {
    fontSize: 12,
    fontWeight: '800',
  },
  paperReceipt: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  receiptHeaderBox: {
    alignItems: 'center',
    paddingBottom: 12,
  },
  storeLogoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  receiptStoreName: {
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  receiptSubtext: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  receiptMetaText: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 8,
  },
  paymentBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  perforatedLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
    overflow: 'hidden',
  },
  dashDot: {
    width: 6,
    height: 1.5,
    borderRadius: 1,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#64748B30',
    marginBottom: 6,
  },
  colHeader: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 2,
  },
  itemQty: {
    flex: 0.8,
    fontSize: 12,
    fontWeight: '800',
  },
  itemName: {
    flex: 2.2,
    fontSize: 12,
    fontWeight: '600',
    paddingRight: 6,
  },
  itemPrice: {
    flex: 1.2,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  totalsBox: {
    marginTop: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  totalVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  totalDivider: {
    height: 1,
    marginVertical: 6,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: '900',
  },
  grandTotalVal: {
    fontSize: 18,
    fontWeight: '900',
  },
  notesCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  notesTitle: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 2,
  },
  notesContent: {
    fontSize: 11,
    lineHeight: 15,
  },
  barcodeBox: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#64748B30',
  },
  barcodeBars: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  barcodeCode: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
    marginTop: 4,
  },
  ticketFooterThanks: {
    fontSize: 10,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  shareBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  editBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: radii.md,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
