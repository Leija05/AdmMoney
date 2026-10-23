import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order, OrderItem, CookieProduct, Promotion } from '../../lib/types';
import { colors, radii, spacing } from '../../theme';
import { DoubleBezelCard } from '../ui/DoubleBezelCard';

interface OrderModalProps {
  visible: boolean;
  onClose: () => void;
  cookies: CookieProduct[];
  promotions: Promotion[];
  editingOrder?: Order | null;
  onSave: (data: Partial<Order>) => Promise<void>;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  visible,
  onClose,
  cookies,
  promotions,
  editingOrder,
  onSave,
}) => {
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(tomorrowStr);
  const [paymentMethod, setPaymentMethod] = useState('Transferencia');
  const [paymentStatus, setPaymentStatus] = useState<'Pagado' | 'Pendiente' | 'Anticipo'>('Pendiente');
  const [depositAmount, setDepositAmount] = useState('0');
  const [notes, setNotes] = useState('');
  const [selectedPromoId, setSelectedPromoId] = useState<number | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;

    if (editingOrder) {
      setCustomerName(editingOrder.customer_name || '');
      setCustomerPhone(editingOrder.customer_phone || '');
      setDeliveryDate(editingOrder.delivery_date || tomorrowStr);
      setPaymentMethod(editingOrder.payment_method || 'Transferencia');
      setPaymentStatus(editingOrder.payment_status || 'Pendiente');
      setDepositAmount(String(editingOrder.deposit_amount || 0));
      setNotes(editingOrder.notes || '');
      setSelectedPromoId(editingOrder.promotion_id || null);
      if (editingOrder.items && editingOrder.items.length > 0) {
        setItems(editingOrder.items);
      }
    } else {
      setCustomerName('');
      setCustomerPhone('');
      setDeliveryDate(tomorrowStr);
      setPaymentMethod('Transferencia');
      setPaymentStatus('Pendiente');
      setDepositAmount('0');
      setNotes('');
      setSelectedPromoId(null);
      if (cookies.length > 0) {
        setItems([
          {
            product_id: cookies[0].id,
            product_name: cookies[0].name,
            quantity: 6,
            unit_price: cookies[0].sale_price,
            unit_cost: cookies[0].recipe_cost,
            subtotal: cookies[0].sale_price * 6,
          },
        ]);
      } else {
        setItems([]);
      }
    }
  }, [editingOrder, visible, cookies, tomorrowStr]);

  const handleAddItem = () => {
    const firstCookie = cookies[0];
    if (!firstCookie) return;
    setItems((prev) => [
      ...prev,
      {
        product_id: firstCookie.id,
        product_name: firstCookie.name,
        quantity: 3,
        unit_price: firstCookie.sale_price,
        unit_cost: firstCookie.recipe_cost,
        subtotal: firstCookie.sale_price * 3,
      },
    ]);
  };

  const handleUpdateItem = (index: number, qtyDelta: number) => {
    setItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[index] };
      const nextQty = Math.max(1, item.quantity + qtyDelta);
      item.quantity = nextQty;
      item.subtotal = nextQty * item.unit_price;
      copy[index] = item;
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      Alert.alert('Atención', 'El pedido debe tener al menos una galleta.');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectCookieForItem = (index: number, cookieId: number) => {
    const cookie = cookies.find((c) => c.id === cookieId);
    if (!cookie) return;
    setItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[index] };
      item.product_id = cookie.id;
      item.product_name = cookie.name;
      item.unit_price = cookie.sale_price;
      item.unit_cost = cookie.recipe_cost;
      item.subtotal = item.quantity * cookie.sale_price;
      copy[index] = item;
      return copy;
    });
  };

  // Calculations
  const rawTotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalCost = items.reduce((sum, item) => sum + (item.unit_cost * item.quantity), 0);
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);

  const selectedPromo = promotions.find((p) => p.id === selectedPromoId && p.is_active);

  let discountAmount = 0;
  if (selectedPromo) {
    let eligibleItems = items;
    if (selectedPromo.target_type === 'specific_products' && selectedPromo.target_product_ids?.length) {
      eligibleItems = items.filter((i) => selectedPromo.target_product_ids!.includes(i.product_id));
    }
    const eligibleUnits = eligibleItems.reduce((sum, i) => sum + i.quantity, 0);
    const eligibleSubtotal = eligibleItems.reduce((sum, i) => sum + i.subtotal, 0);

    if (rawTotal >= selectedPromo.min_order_amount && eligibleUnits >= selectedPromo.min_quantity) {
      if (selectedPromo.promo_type === 'combo_fixed_price') {
        const combos = Math.floor(eligibleUnits / selectedPromo.min_quantity);
        const avgPrice = eligibleUnits > 0 ? eligibleSubtotal / eligibleUnits : 35;
        const regularComboVal = avgPrice * selectedPromo.min_quantity;
        const savingPerCombo = Math.max(0, regularComboVal - selectedPromo.discount_value);
        discountAmount = combos * savingPerCombo;
      } else if (selectedPromo.promo_type === 'percentage') {
        discountAmount = eligibleSubtotal * (selectedPromo.discount_value / 100);
      } else if (selectedPromo.promo_type === 'fixed_amount') {
        discountAmount = Math.min(rawTotal, selectedPromo.discount_value);
      } else if (selectedPromo.promo_type === 'two_for_one') {
        const freeUnits = Math.floor(eligibleUnits / 2);
        const minPrice = eligibleItems.length > 0 ? Math.min(...eligibleItems.map((i) => i.unit_price)) : 35;
        discountAmount = freeUnits * minPrice;
      }
    }
  }

  discountAmount = Math.round(discountAmount * 100) / 100;
  const finalTotal = Math.max(0, rawTotal - discountAmount);
  const netProfit = finalTotal - totalCost;

  const handleSaveOrder = async () => {
    if (!customerName.trim()) {
      Alert.alert('Faltan Datos', 'Por favor ingresa el nombre de la persona que pide.');
      return;
    }
    if (items.length === 0) {
      Alert.alert('Faltan Datos', 'Agrega al menos una galleta al pedido.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        delivery_date: deliveryDate,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        deposit_amount: parseFloat(depositAmount) || 0,
        items,
        total_amount: finalTotal,
        promotion_id: selectedPromo?.id,
        promotion_name: selectedPromo?.name,
        discount_amount: discountAmount,
        notes: notes.trim(),
      });
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo guardar el pedido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Top Navigation Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.textMain} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>
            {editingOrder ? 'Editar Pedido' : 'Nuevo Pedido Personalizado'}
          </Text>
          <TouchableOpacity
            onPress={handleSaveOrder}
            disabled={isSubmitting}
            style={[styles.saveBtn, isSubmitting && { opacity: 0.6 }]}
          >
            <Text style={styles.saveBtnText}>Guardar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Customer info card */}
          <DoubleBezelCard style={styles.card}>
            <Text style={styles.sectionTitle}>👤 Datos del Cliente</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nombre completo *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Valeria Gómez"
                placeholderTextColor={colors.textDim}
                value={customerName}
                onChangeText={setCustomerName}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Teléfono o WhatsApp</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. 5512345678"
                placeholderTextColor={colors.textDim}
                keyboardType="phone-pad"
                value={customerPhone}
                onChangeText={setCustomerPhone}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Fecha programada de entrega (AAAA-MM-DD)</Text>
              <TextInput
                style={styles.input}
                placeholder="2026-10-24"
                placeholderTextColor={colors.textDim}
                value={deliveryDate}
                onChangeText={setDeliveryDate}
              />
            </View>
          </DoubleBezelCard>

          {/* Items card */}
          <DoubleBezelCard style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>🍪 Galletas del Pedido</Text>
              <TouchableOpacity onPress={handleAddItem} style={styles.addMiniBtn}>
                <Ionicons name="add" size={16} color={colors.brand} />
                <Text style={styles.addMiniText}>Agregar otra</Text>
              </TouchableOpacity>
            </View>

            {items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6 }}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {cookies.map((c) => (
                        <TouchableOpacity
                          key={c.id}
                          onPress={() => handleSelectCookieForItem(idx, c.id)}
                          style={[
                            styles.cookiePill,
                            item.product_id === c.id && styles.cookiePillActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.cookiePillText,
                              item.product_id === c.id && styles.cookiePillTextActive,
                            ]}
                          >
                            {c.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>

                  <View style={styles.itemControlsRow}>
                    <View style={styles.qtyControls}>
                      <TouchableOpacity
                        onPress={() => handleUpdateItem(idx, -1)}
                        style={styles.qtyBtn}
                      >
                        <Ionicons name="remove" size={16} color={colors.textMain} />
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{item.quantity} pzas</Text>
                      <TouchableOpacity
                        onPress={() => handleUpdateItem(idx, 1)}
                        style={styles.qtyBtn}
                      >
                        <Ionicons name="add" size={16} color={colors.textMain} />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.itemPrice}>
                      ${item.unit_price} c/u = ${item.subtotal.toFixed(2)}
                    </Text>

                    <TouchableOpacity
                      onPress={() => handleRemoveItem(idx)}
                      style={styles.trashBtn}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.roseText} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </DoubleBezelCard>

          {/* Dynamic Promotions selector card */}
          <DoubleBezelCard style={styles.card}>
            <Text style={styles.sectionTitle}>🎉 Promoción o Combo Aplicable</Text>
            <Text style={styles.sublabel}>
              Aplica promociones configuradas directamente sobre el pedido.
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setSelectedPromoId(null)}
                  style={[
                    styles.promoPill,
                    selectedPromoId === null && styles.promoPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.promoPillText,
                      selectedPromoId === null && styles.promoPillTextActive,
                    ]}
                  >
                    Sin Promoción
                  </Text>
                </TouchableOpacity>

                {promotions
                  .filter((p) => p.is_active)
                  .map((promo) => (
                    <TouchableOpacity
                      key={promo.id}
                      onPress={() => setSelectedPromoId(promo.id)}
                      style={[
                        styles.promoPill,
                        selectedPromoId === promo.id && styles.promoPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.promoPillText,
                          selectedPromoId === promo.id && styles.promoPillTextActive,
                        ]}
                      >
                        {promo.name} ({promo.badge_text})
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>
            </ScrollView>

            {discountAmount > 0 ? (
              <View style={styles.discountAlert}>
                <Ionicons name="checkmark-circle" size={16} color="#15803D" />
                <Text style={styles.discountAlertText}>
                  ¡Ahorro de -${discountAmount.toFixed(2)} MXN aplicado al pedido!
                </Text>
              </View>
            ) : null}
          </DoubleBezelCard>

          {/* Payment & notes card */}
          <DoubleBezelCard style={styles.card}>
            <Text style={styles.sectionTitle}>💳 Pago & Notas</Text>

            {/* Payment status selector */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Estado del pago</Text>
              <View style={styles.paymentStatusRow}>
                {(['Pendiente', 'Anticipo', 'Pagado'] as const).map((st) => (
                  <TouchableOpacity
                    key={st}
                    onPress={() => setPaymentStatus(st)}
                    style={[
                      styles.statusSelectBtn,
                      paymentStatus === st && styles.statusSelectBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusSelectText,
                        paymentStatus === st && styles.statusSelectTextActive,
                      ]}
                    >
                      {st}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {paymentStatus === 'Anticipo' ? (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Monto del anticipo abonado ($ MXN)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={depositAmount}
                  onChangeText={setDepositAmount}
                  placeholder="0.00"
                />
              </View>
            ) : null}

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Notas o especificaciones</Text>
              <TextInput
                style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
                placeholder="Ej. Decorar con listón verde, entrega después de las 4 PM..."
                placeholderTextColor={colors.textDim}
                multiline
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </DoubleBezelCard>

          {/* Financial summary breakdown */}
          <DoubleBezelCard style={{ ...styles.card, backgroundColor: colors.bgSurface }}>
            <Text style={styles.summaryTitle}>Resumen Financiero del Pedido</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total de Galletas:</Text>
              <Text style={styles.summaryVal}>{totalUnits} piezas</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal sin descuento:</Text>
              <Text style={styles.summaryVal}>${rawTotal.toFixed(2)}</Text>
            </View>

            {discountAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.amber }]}>Descuento:</Text>
                <Text style={[styles.summaryVal, { color: colors.amber }]}>
                  -${discountAmount.toFixed(2)}
                </Text>
              </View>
            )}

            <View style={[styles.summaryRow, { paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.borderSubtle }]}>
              <Text style={styles.summaryTotalLabel}>Total a Cobrar:</Text>
              <Text style={styles.summaryTotalVal}>${finalTotal.toFixed(2)} MXN</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryProfitLabel}>Ganancia Neta Libre:</Text>
              <Text style={styles.summaryProfitVal}>+${netProfit.toFixed(2)} MXN</Text>
            </View>
          </DoubleBezelCard>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: 54,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  closeBtn: {
    padding: 6,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textMain,
  },
  saveBtn: {
    backgroundColor: colors.brand,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radii.pill,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textMain,
    marginBottom: 8,
  },
  sublabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.sm,
    backgroundColor: colors.brandBg,
  },
  addMiniText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brandText,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textMain,
  },
  itemRow: {
    backgroundColor: colors.bgSurface,
    borderRadius: radii.md,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  cookiePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: '#FFFFFF',
  },
  cookiePillActive: {
    backgroundColor: colors.brandBg,
    borderColor: colors.brandBorder,
  },
  cookiePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  cookiePillTextActive: {
    color: colors.brandText,
    fontWeight: '800',
  },
  itemControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  qtyBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  qtyText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMain,
    paddingHorizontal: 6,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMain,
  },
  trashBtn: {
    padding: 4,
  },
  promoPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: '#FFFFFF',
  },
  promoPillActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  promoPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  promoPillTextActive: {
    color: '#92400E',
    fontWeight: '800',
  },
  discountAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.emeraldBg,
    padding: 10,
    borderRadius: radii.md,
    marginTop: 10,
  },
  discountAlertText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.emeraldText,
  },
  paymentStatusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusSelectBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgSurface,
  },
  statusSelectBtnActive: {
    backgroundColor: colors.brandBg,
    borderColor: colors.brandBorder,
  },
  statusSelectText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  statusSelectTextActive: {
    color: colors.brandText,
    fontWeight: '800',
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textMain,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  summaryVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMain,
  },
  summaryTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textMain,
  },
  summaryTotalVal: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.textMain,
  },
  summaryProfitLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.emerald,
  },
  summaryProfitVal: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.emerald,
  },
});
