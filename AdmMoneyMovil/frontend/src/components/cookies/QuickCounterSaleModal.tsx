import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  PanResponder,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CookieProduct, Promotion } from '../../lib/types';
import { useThemeColors, radii, spacing } from '../../theme';
import { Button } from '../ui/Button';

export interface CounterSaleItem {
  cookie: CookieProduct;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  subtotal: number;
}

export interface CounterSaleSubmission {
  items: CounterSaleItem[];
  totalQuantity: number;
  subtotal: number;
  discountAmount: number;
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  marginPct?: number;
  paymentMethod: string;
  customerName: string;
  promotionId?: number;
  promotionName?: string;
}

interface QuickCounterSaleModalProps {
  visible: boolean;
  cookies: CookieProduct[];
  promotions: Promotion[];
  initialCookie?: CookieProduct | null;
  onClose: () => void;
  onConfirmSale: (data: CounterSaleSubmission) => Promise<void>;
}

export const QuickCounterSaleModal: React.FC<QuickCounterSaleModalProps> = ({
  visible,
  cookies,
  promotions,
  initialCookie,
  onClose,
  onConfirmSale,
}) => {
  const colors = useThemeColors();
  const isDark = colors.isDark;

  // Carrito de galletas: { [cookieId]: quantity }
  const [cart, setCart] = useState<{ [cookieId: number]: number }>({});
  const [selectedPromoId, setSelectedPromoId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Transferencia'>('Efectivo');
  const [customerName, setCustomerName] = useState('Cliente Mostrador');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const screenHeight = Dimensions.get('window').height;
  const modalHeight = Math.round(screenHeight * 0.94);
  const translateY = useRef(new Animated.Value(0)).current;

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

  // Inicializar estado cuando se abre el modal
  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
      setSelectedPromoId(null);
      setPaymentMethod('Efectivo');
      setCustomerName('Cliente Mostrador');

      if (initialCookie) {
        setCart({ [initialCookie.id]: 1 });
      } else {
        setCart({});
      }
    }
  }, [visible, initialCookie]);

  const handleUpdateQty = (cookieId: number, delta: number) => {
    setCart((prev) => {
      const current = prev[cookieId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[cookieId];
        return copy;
      }
      return { ...prev, [cookieId]: next };
    });
  };

  const handleSetExactQty = (cookieId: number, qty: number) => {
    setCart((prev) => {
      const next = Math.max(0, qty);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[cookieId];
        return copy;
      }
      return { ...prev, [cookieId]: next };
    });
  };

  // Cálculo de totales y desglose
  const {
    itemsList,
    totalPieces,
    rawSubtotal,
    totalCost,
    promoDiscount,
    finalRevenue,
    netProfit,
    marginPct,
    selectedPromo,
  } = useMemo(() => {
    const list: CounterSaleItem[] = [];
    let pieces = 0;
    let subtotal = 0;
    let cost = 0;

    for (const c of cookies) {
      const qty = cart[c.id] || 0;
      if (qty > 0) {
        const itemSubtotal = qty * c.sale_price;
        const itemCost = qty * (c.recipe_cost || 0);
        pieces += qty;
        subtotal += itemSubtotal;
        cost += itemCost;
        list.push({
          cookie: c,
          quantity: qty,
          unitPrice: c.sale_price,
          unitCost: c.recipe_cost || 0,
          subtotal: itemSubtotal,
        });
      }
    }

    // Calcular descuento de promoción
    let discount = 0;
    let activePromo: Promotion | null = null;

    if (selectedPromoId) {
      const found = promotions.find((p) => p.id === selectedPromoId && p.is_active);
      if (found) {
        activePromo = found;
        if (pieces >= found.min_quantity) {
          if (found.promo_type === 'combo_fixed_price' || (found.promo_type as any) === 'fixed_bundle_price') {
            const bundles = Math.floor(pieces / found.min_quantity);
            const remainder = pieces % found.min_quantity;
            const avgUnitPrice = pieces > 0 ? subtotal / pieces : 35;
            const bundleExpected = bundles * found.discount_value;
            const remainderExpected = remainder * avgUnitPrice;
            const projectedTotal = bundleExpected + remainderExpected;
            discount = Math.max(0, subtotal - projectedTotal);
          } else if (found.promo_type === 'percentage' || (found.promo_type as any) === 'percentage_discount') {
            discount = subtotal * (found.discount_value / 100);
          } else if (found.promo_type === 'fixed_amount' || (found.promo_type as any) === 'fixed_amount_discount') {
            discount = Math.min(subtotal, found.discount_value);
          } else if (found.promo_type === 'two_for_one') {
            const freeUnits = Math.floor(pieces / 2);
            const avgPrice = pieces > 0 ? subtotal / pieces : 35;
            discount = freeUnits * avgPrice;
          }
        }
      }
    }

    discount = Math.round(discount * 100) / 100;
    const finalRev = Math.max(0, subtotal - discount);
    const profit = finalRev - cost;
    const margin = finalRev > 0 ? (profit / finalRev) * 100 : 0;

    return {
      itemsList: list,
      totalPieces: pieces,
      rawSubtotal: subtotal,
      totalCost: cost,
      promoDiscount: discount,
      finalRevenue: finalRev,
      netProfit: profit,
      marginPct: margin,
      selectedPromo: activePromo,
    };
  }, [cart, cookies, selectedPromoId, promotions]);

  const handleConfirm = async () => {
    if (itemsList.length === 0) return;

    try {
      setIsSubmitting(true);
      await onConfirmSale({
        items: itemsList,
        totalQuantity: totalPieces,
        subtotal: rawSubtotal,
        discountAmount: promoDiscount,
        totalRevenue: finalRevenue,
        totalCost: totalCost,
        netProfit: netProfit,
        marginPct: marginPct,
        paymentMethod: paymentMethod,
        customerName: customerName.trim() || 'Cliente Mostrador',
        promotionId: selectedPromo?.id,
        promotionName: selectedPromo?.name,
      });
      onClose();
    } catch {
    } finally {
      setIsSubmitting(false);
    }
  };

  const activePromos = promotions.filter((p) => p.is_active);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.dialog,
            {
              height: modalHeight,
              maxHeight: modalHeight,
              backgroundColor: isDark ? '#161A24' : '#FFFFFF',
              borderColor: isDark ? '#2B3448' : '#E2E8F0',
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Header con PanResponder */}
          <View {...panResponder.panHandlers}>
            <View style={styles.handleWrapper}>
              <View
                style={[
                  styles.handleBar,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.18)' },
                ]}
              />
            </View>

            <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={[styles.badgePill, { backgroundColor: colors.amberBg }]}>
                    <Ionicons name="flash" size={11} color={colors.amberLight} />
                    <Text style={[styles.badgeText, { color: colors.amberLight }]}>Caja Registradora</Text>
                  </View>
                  <Text style={[styles.itemCountText, { color: colors.textDim }]}>
                    {totalPieces} {totalPieces === 1 ? 'galleta' : 'galletas'}
                  </Text>
                </View>
                <Text style={[styles.title, { color: colors.textMain }]}>Venta Rápida de Mostrador</Text>
              </View>

              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[styles.closeBtn, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
              >
                <Ionicons name="close" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* SECCIÓN 1: SELECCIONAR GALLETAS */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeading, { color: colors.textMain }]}>
                1. Selecciona las Galletas que Llevará
              </Text>
              <Text style={{ fontSize: 11, color: colors.textDim }}>
                {totalPieces > 0 ? `${totalPieces} pzas seleccionadas` : 'Toca + en cada galleta'}
              </Text>
            </View>

            <View style={styles.cookiesGrid}>
              {cookies.map((cookie) => {
                const qty = cart[cookie.id] || 0;
                const isSelected = qty > 0;
                const vitrinaStock = cookie.stock_vitrina ?? 0;
                const isOutOfStock = vitrinaStock <= 0;

                return (
                  <View
                    key={cookie.id}
                    style={[
                      styles.cookieItemCard,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? 'rgba(245, 158, 11, 0.12)'
                            : '#FEF3C7'
                          : colors.bgTertiary,
                        borderColor: isSelected ? colors.amber : colors.borderSubtle,
                      },
                    ]}
                  >
                    {/* Thumbnail */}
                    <View style={styles.cookieItemLeft}>
                      {cookie.image_url ? (
                        <Image source={{ uri: cookie.image_url }} style={styles.cookieThumb} />
                      ) : (
                        <View style={[styles.cookieThumb, { backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center' }]}>
                          <Ionicons name="cafe" size={18} color={colors.amberLight} />
                        </View>
                      )}

                      <View style={{ flex: 1, paddingLeft: 10 }}>
                        <Text style={[styles.cookieItemName, { color: colors.textMain }]} numberOfLines={1}>
                          {cookie.name}
                        </Text>
                        <Text style={[styles.cookieItemPrice, { color: colors.amberLight }]}>
                          ${cookie.sale_price.toFixed(2)} MXN
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <Ionicons
                            name="storefront-outline"
                            size={11}
                            color={isOutOfStock ? colors.roseLight : colors.textDim}
                          />
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: '700',
                              color: isOutOfStock ? colors.roseLight : colors.textDim,
                            }}
                          >
                            {vitrinaStock} en vitrina
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Stepper */}
                    <View style={styles.stepperWrap}>
                      <TouchableOpacity
                        onPress={() => handleUpdateQty(cookie.id, -1)}
                        disabled={qty <= 0}
                        style={[
                          styles.stepperBtn,
                          {
                            backgroundColor: colors.bgCard,
                            borderColor: colors.borderSubtle,
                            opacity: qty <= 0 ? 0.4 : 1,
                          },
                        ]}
                      >
                        <Ionicons name="remove" size={15} color={colors.textMain} />
                      </TouchableOpacity>

                      <Text
                        style={[
                          styles.stepperNumber,
                          { color: isSelected ? colors.amberLight : colors.textDim },
                        ]}
                      >
                        {qty}
                      </Text>

                      <TouchableOpacity
                        onPress={() => handleUpdateQty(cookie.id, 1)}
                        style={[styles.stepperBtn, { backgroundColor: colors.amberBg, borderColor: colors.amberBorder }]}
                      >
                        <Ionicons name="add" size={15} color={colors.amberLight} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* SECCIÓN 2: PROMOCIONES QUE APLICAN */}
            <View style={[styles.sectionHeaderRow, { marginTop: 16 }]}>
              <Text style={[styles.sectionHeading, { color: colors.textMain }]}>
                2. Oferta / Promoción Aplicable
              </Text>
              {promoDiscount > 0 && (
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.emeraldLight }}>
                  -${promoDiscount.toFixed(2)} MXN descuento
                </Text>
              )}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setSelectedPromoId(null)}
                  style={[
                    styles.promoChip,
                    {
                      backgroundColor: colors.bgTertiary,
                      borderColor: selectedPromoId === null ? colors.amber : colors.borderSubtle,
                    },
                    selectedPromoId === null && { backgroundColor: colors.amberBg },
                  ]}
                >
                  <Text
                    style={[
                      styles.promoChipTitle,
                      { color: selectedPromoId === null ? colors.amberLight : colors.textMain },
                    ]}
                  >
                    Precio Normal
                  </Text>
                  <Text style={[styles.promoChipSub, { color: colors.textDim }]}>Sin promoción</Text>
                </TouchableOpacity>

                {activePromos.map((promo) => {
                  const isSelected = selectedPromoId === promo.id;
                  const colorTag = promo.color_tag || '#F59E0B';
                  const qualifies = totalPieces >= promo.min_quantity;

                  return (
                    <TouchableOpacity
                      key={promo.id}
                      onPress={() => setSelectedPromoId(promo.id)}
                      style={[
                        styles.promoChip,
                        {
                          backgroundColor: isSelected ? `${colorTag}20` : colors.bgTertiary,
                          borderColor: isSelected ? colorTag : colors.borderSubtle,
                        },
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="pricetag" size={12} color={colorTag} />
                        <Text style={[styles.promoChipTitle, { color: colors.textMain }, isSelected && { color: colorTag }]}>
                          {promo.name}
                        </Text>
                      </View>
                      <Text style={[styles.promoChipSub, { color: colors.textDim }]}>
                        {promo.badge_text || `${promo.min_quantity} pzas`}
                      </Text>
                      {!qualifies && (
                        <Text style={{ fontSize: 9, color: colors.roseLight, fontWeight: '700', marginTop: 1 }}>
                          Mínimo {promo.min_quantity} pzas
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* SECCIÓN 3: MÉTODO DE PAGO */}
            <Text style={[styles.sectionHeading, { color: colors.textMain, marginTop: 4, marginBottom: 8 }]}>
              3. Método de Pago
            </Text>
            <View style={styles.paymentMethodsRow}>
              <TouchableOpacity
                onPress={() => setPaymentMethod('Efectivo')}
                style={[
                  styles.payOptionBtn,
                  {
                    backgroundColor: paymentMethod === 'Efectivo' ? '#059669' : colors.bgTertiary,
                    borderColor: paymentMethod === 'Efectivo' ? '#059669' : colors.borderSubtle,
                  },
                ]}
              >
                <Ionicons
                  name="cash-outline"
                  size={18}
                  color={paymentMethod === 'Efectivo' ? '#FFFFFF' : colors.textMain}
                />
                <Text
                  style={[
                    styles.payOptionText,
                    { color: paymentMethod === 'Efectivo' ? '#FFFFFF' : colors.textMain },
                  ]}
                >
                  Efectivo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setPaymentMethod('Transferencia')}
                style={[
                  styles.payOptionBtn,
                  {
                    backgroundColor: paymentMethod === 'Transferencia' ? colors.brand : colors.bgTertiary,
                    borderColor: paymentMethod === 'Transferencia' ? colors.brand : colors.borderSubtle,
                  },
                ]}
              >
                <Ionicons
                  name="card-outline"
                  size={18}
                  color={paymentMethod === 'Transferencia' ? '#FFFFFF' : colors.textMain}
                />
                <Text
                  style={[
                    styles.payOptionText,
                    { color: paymentMethod === 'Transferencia' ? '#FFFFFF' : colors.textMain },
                  ]}
                >
                  Transferencia
                </Text>
              </TouchableOpacity>
            </View>

            {/* SECCIÓN 4: CLIENTE / NOTA */}
            <Text style={[styles.sectionHeading, { color: colors.textMain, marginTop: 14, marginBottom: 6 }]}>
              4. Cliente / Destino (Opcional)
            </Text>
            <TextInput
              style={[
                styles.clientInput,
                {
                  backgroundColor: colors.bgTertiary,
                  borderColor: colors.borderSubtle,
                  color: colors.textMain,
                },
              ]}
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Cliente Mostrador, Juan Pérez..."
              placeholderTextColor={colors.textDim}
            />

            {/* RESUMEN FINANCIERO EN VIVO */}
            <View style={[styles.summaryCard, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textDim }]}>Subtotal ({totalPieces} pzas)</Text>
                <Text style={[styles.summaryVal, { color: colors.textMain }]}>${rawSubtotal.toFixed(2)} MXN</Text>
              </View>

              {promoDiscount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.emeraldLight }]}>
                    Descuento {selectedPromo?.name || 'Promoción'}
                  </Text>
                  <Text style={[styles.summaryVal, { color: colors.emeraldLight }]}>
                    -${promoDiscount.toFixed(2)} MXN
                  </Text>
                </View>
              )}

              <View style={[styles.summaryDivider, { backgroundColor: colors.borderSubtle }]} />

              <View style={styles.summaryMainRow}>
                <View>
                  <Text style={[styles.mainTotalLabel, { color: colors.textDim }]}>TOTAL A COBRAR</Text>
                  <Text style={[styles.mainTotalVal, { color: colors.amberLight }]}>
                    ${finalRevenue.toFixed(2)} MXN
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.mainTotalLabel, { color: colors.textDim }]}>TU GANANCIA LIBRE</Text>
                  <Text style={[styles.mainProfitVal, { color: colors.emeraldLight }]}>
                    +${netProfit.toFixed(2)} MXN
                  </Text>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: colors.emeraldLight }}>
                    ~{marginPct.toFixed(1)}% margen
                  </Text>
                </View>
              </View>
            </View>

            {/* BOTÓN PRINCIPAL DE COBRO */}
            <Button
              title={
                isSubmitting
                  ? 'Registrando Venta...'
                  : totalPieces === 0
                  ? 'Selecciona al menos 1 galleta'
                  : `Cobrar $${finalRevenue.toFixed(2)} MXN (${paymentMethod})`
              }
              variant="amber"
              icon={<Ionicons name="checkmark-circle" size={18} color="#fff" />}
              onPress={handleConfirm}
              disabled={isSubmitting || totalPieces === 0}
              style={{ marginTop: 14, marginBottom: 30 }}
            />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(12, 16, 26, 0.65)',
    justifyContent: 'flex-end',
  },
  dialog: {
    borderTopLeftRadius: radii.outer,
    borderTopRightRadius: radii.outer,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  handleWrapper: {
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 4,
  },
  handleBar: {
    width: 42,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  itemCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 40,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  cookiesGrid: {
    gap: 8,
  },
  cookieItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: radii.md,
    borderWidth: 1.5,
  },
  cookieItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cookieThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  cookieItemName: {
    fontSize: 13,
    fontWeight: '800',
  },
  cookieItemPrice: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 1,
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 8,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperNumber: {
    fontSize: 15,
    fontWeight: '900',
    minWidth: 18,
    textAlign: 'center',
  },
  promoChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    minWidth: 120,
  },
  promoChipTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  promoChipSub: {
    fontSize: 10,
    marginTop: 2,
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  payOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1.5,
  },
  payOptionText: {
    fontSize: 13,
    fontWeight: '800',
  },
  clientInput: {
    height: 40,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '600',
  },
  summaryCard: {
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    marginTop: 14,
    gap: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  summaryVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  summaryDivider: {
    height: 1,
    marginVertical: 4,
  },
  summaryMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  mainTotalLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  mainTotalVal: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 1,
  },
  mainProfitVal: {
    fontSize: 19,
    fontWeight: '900',
    marginTop: 1,
  },
});
