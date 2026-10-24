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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Order, OrderItem, CookieProduct, Promotion, Customer } from '../../lib/types';
import { colors, useThemeColors, radii, spacing } from '../../theme';
import { DoubleBezelCard } from '../ui/DoubleBezelCard';

interface OrderModalProps {
  visible: boolean;
  onClose: () => void;
  cookies: CookieProduct[];
  promotions: Promotion[];
  customers?: Customer[];
  editingOrder?: Order | null;
  onSave: (data: Partial<Order>) => Promise<void>;
  onSaveCustomer?: (data: Partial<Customer>) => Promise<any>;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  visible,
  onClose,
  cookies,
  promotions,
  customers = [],
  editingOrder,
  onSave,
  onSaveCustomer,
}) => {
  const colors = useThemeColors();
  const isDark = colors.isDark;
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [isNewCustomerMode, setIsNewCustomerMode] = useState(false);
  const [saveCustomerCheckbox, setSaveCustomerCheckbox] = useState(true);
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
      const matched = customers.find(
        (c) => c.name.trim().toLowerCase() === (editingOrder.customer_name || '').trim().toLowerCase()
      );
      setSelectedCustomerId(matched ? matched.id : null);
      setIsNewCustomerMode(!matched);
      setSaveCustomerCheckbox(false);
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
      setSelectedCustomerId(null);
      setIsNewCustomerMode(false);
      setSaveCustomerCheckbox(true);
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
  }, [editingOrder, visible, cookies, tomorrowStr, customers]);

  const handleSelectCustomer = (cust: Customer) => {
    setSelectedCustomerId(cust.id);
    setIsNewCustomerMode(false);
    setCustomerName(cust.name);
    setCustomerPhone(cust.phone || '');
    setSaveCustomerCheckbox(false);
  };

  const handleStartNewCustomer = () => {
    setSelectedCustomerId(null);
    setIsNewCustomerMode(true);
    setCustomerName('');
    setCustomerPhone('');
    setSaveCustomerCheckbox(true);
  };

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
  let promoRequirementMessage = '';

  if (selectedPromo) {
    const minUnits = Number((selectedPromo as any).min_quantity ?? (selectedPromo as any).min_units ?? (selectedPromo.promo_type === 'combo_fixed_price' ? 3 : 1));
    const promoVal = Number((selectedPromo as any).discount_value ?? (selectedPromo as any).promo_price ?? (selectedPromo as any).discount_amount ?? (selectedPromo as any).discount_pct ?? (selectedPromo.promo_type === 'combo_fixed_price' ? 90 : 0));
    const minOrderAmt = Number(selectedPromo.min_order_amount || 0);

    let eligibleItems = items;
    const targetType = (selectedPromo as any).target_type || (selectedPromo as any).scope || 'all_products';
    const targetProductIds = (selectedPromo as any).target_product_ids || (selectedPromo as any).applicable_product_ids;
    if (targetType === 'specific_products' && targetProductIds?.length) {
      eligibleItems = items.filter((i) => targetProductIds.includes(i.product_id));
    }
    const eligibleUnits = eligibleItems.reduce((sum, i) => sum + i.quantity, 0);
    const eligibleSubtotal = eligibleItems.reduce((sum, i) => sum + i.subtotal, 0);

    const type = selectedPromo.promo_type;
    const meetsUnits = eligibleUnits >= minUnits;
    const meetsOrderAmt = rawTotal >= minOrderAmt;

    if (!meetsUnits) {
      promoRequirementMessage = `Faltan ${minUnits - eligibleUnits} galleta(s) para activar esta promoción.`;
    } else if (!meetsOrderAmt) {
      promoRequirementMessage = `Requiere un pedido mínimo de $${minOrderAmt.toFixed(2)} MXN (actual: $${rawTotal.toFixed(2)}).`;
    } else {
      if (type === 'combo_fixed_price' || type === ('fixed_combo' as any)) {
        const comboQty = minUnits > 0 ? minUnits : 3;
        const comboPrice = promoVal > 0 ? promoVal : 90;
        const combos = Math.floor(eligibleUnits / comboQty);
        if (combos > 0) {
          const avgPrice = eligibleUnits > 0 ? eligibleSubtotal / eligibleUnits : 35;
          const regularComboVal = avgPrice * comboQty;
          const savingPerCombo = Math.max(0, regularComboVal - comboPrice);
          discountAmount = combos * savingPerCombo;
        }
      } else if (type === 'percentage' || type === ('percentage_discount' as any)) {
        const pct = promoVal > 0 ? promoVal / 100 : 0.15;
        discountAmount = eligibleSubtotal * pct;
      } else if (type === 'fixed_amount' || type === ('fixed_discount' as any)) {
        const fixedAmt = promoVal > 0 ? promoVal : 30;
        discountAmount = Math.min(rawTotal, fixedAmt);
      } else if (type === 'two_for_one' || type === ('buy_x_get_y' as any)) {
        const freeUnits = Math.floor(eligibleUnits / (minUnits || 2));
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
      if (saveCustomerCheckbox && customerName.trim()) {
        onSaveCustomer?.({
          name: customerName.trim(),
          phone: customerPhone.trim(),
        });
      }

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
    <Modal visible={visible} animationType="slide" transparent={false} statusBarTranslucent onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]} edges={['top', 'bottom']}>
        {/* Top Navigation Bar */}
        <View style={[styles.topBar, { backgroundColor: colors.bgCard, borderBottomColor: colors.borderSubtle }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.textMain} />
          </TouchableOpacity>
          <Text style={[styles.topBarTitle, { color: colors.textMain }]}>
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

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.content, { paddingBottom: 60 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          {/* Customer info card */}
          <DoubleBezelCard style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={[styles.sectionTitle, { color: colors.textMain }]}>👤 Datos del Cliente</Text>
              {customers.length > 0 && (
                <TouchableOpacity
                  onPress={handleStartNewCustomer}
                  style={[
                    styles.newCustomerToggleBtn,
                    {
                      backgroundColor: isNewCustomerMode ? colors.brandBg : colors.bgTertiary,
                      borderColor: isNewCustomerMode ? colors.brandBorder : colors.borderSubtle,
                    },
                  ]}
                >
                  <Ionicons
                    name="person-add"
                    size={12}
                    color={isNewCustomerMode ? colors.brandText : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.newCustomerToggleText,
                      { color: isNewCustomerMode ? colors.brandText : colors.textMuted },
                    ]}
                  >
                    + Nuevo
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Registered customers quick selector */}
            {customers.length > 0 && (
              <View style={{ marginBottom: 12 }}>
                <Text style={[styles.fieldSubLabel, { color: colors.textMuted }]}>
                  Clientes Registrados (Toca para autocompletar):
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
                >
                  {customers.map((c) => {
                    const isSelected =
                      selectedCustomerId === c.id ||
                      (!isNewCustomerMode && customerName.trim().toLowerCase() === c.name.trim().toLowerCase());
                    return (
                      <TouchableOpacity
                        key={c.id}
                        onPress={() => handleSelectCustomer(c)}
                        style={[
                          styles.customerChip,
                          {
                            backgroundColor: isSelected ? colors.brandBg : colors.bgSurface,
                            borderColor: isSelected ? colors.brandBorder : colors.borderSubtle,
                          },
                        ]}
                      >
                        <Ionicons
                          name="person"
                          size={13}
                          color={isSelected ? colors.brandText : colors.textDim}
                        />
                        <View>
                          <Text
                            style={[
                              styles.customerChipName,
                              {
                                color: isSelected ? colors.brandText : colors.textMain,
                                fontWeight: isSelected ? '800' : '600',
                              },
                            ]}
                          >
                            {c.name}
                          </Text>
                          {Boolean(c.phone) && (
                            <Text
                              style={[
                                styles.customerChipPhone,
                                { color: isSelected ? colors.brandLight : colors.textDim },
                              ]}
                            >
                              📞 {c.phone}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Nombre completo *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle, color: colors.textMain }]}
                placeholder="Ej. Valeria Gómez"
                placeholderTextColor={colors.textDim}
                value={customerName}
                onChangeText={(text) => {
                  setCustomerName(text);
                  setIsNewCustomerMode(true);
                  setSelectedCustomerId(null);
                }}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Teléfono o WhatsApp (10 dígitos)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle, color: colors.textMain }]}
                placeholder="Ej. 5512345678"
                placeholderTextColor={colors.textDim}
                keyboardType="phone-pad"
                value={customerPhone}
                onChangeText={(text) => {
                  setCustomerPhone(text);
                  setIsNewCustomerMode(true);
                }}
              />
            </View>

            {/* Checkbox: Guardar cliente en registro */}
            <TouchableOpacity
              onPress={() => setSaveCustomerCheckbox(!saveCustomerCheckbox)}
              style={styles.checkboxRow}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.checkboxBox,
                  {
                    borderColor: saveCustomerCheckbox ? colors.brand : colors.borderSubtle,
                    backgroundColor: saveCustomerCheckbox ? colors.brand : 'transparent',
                  },
                ]}
              >
                {saveCustomerCheckbox && <Ionicons name="checkmark" size={13} color="#fff" />}
              </View>
              <Text style={[styles.checkboxLabel, { color: colors.textMain }]}>
                Guardar este usuario en el registro para no volver a escribir sus datos
              </Text>
            </TouchableOpacity>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Fecha programada de entrega (AAAA-MM-DD)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle, color: colors.textMain }]}
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
              <View
                key={idx}
                style={[
                  styles.itemRow,
                  {
                    backgroundColor: isDark ? '#1C202A' : '#F8F9FA',
                    borderColor: isDark ? '#2E384D' : '#E2E8F0',
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6 }}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {cookies.map((c) => (
                        <TouchableOpacity
                          key={c.id}
                          onPress={() => handleSelectCookieForItem(idx, c.id)}
                          style={[
                            styles.cookiePill,
                            {
                              backgroundColor: isDark ? '#242936' : '#FFFFFF',
                              borderColor: colors.borderSubtle,
                            },
                            item.product_id === c.id && {
                              backgroundColor: colors.brandBg,
                              borderColor: colors.brandBorder,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.cookiePillText,
                              { color: colors.textMuted },
                              item.product_id === c.id && {
                                color: colors.brandText,
                                fontWeight: '800',
                              },
                            ]}
                          >
                            {c.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>

                  <View style={styles.itemControlsRow}>
                    <View
                      style={[
                        styles.qtyControls,
                        {
                          backgroundColor: isDark ? '#242936' : '#FFFFFF',
                          borderColor: colors.borderSubtle,
                        },
                      ]}
                    >
                      <TouchableOpacity
                        onPress={() => handleUpdateItem(idx, -1)}
                        style={styles.qtyBtn}
                      >
                        <Ionicons name="remove" size={16} color={colors.textMain} />
                      </TouchableOpacity>
                      <Text style={[styles.qtyText, { color: colors.textMain }]}>
                        {item.quantity} pzas
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleUpdateItem(idx, 1)}
                        style={styles.qtyBtn}
                      >
                        <Ionicons name="add" size={16} color={colors.textMain} />
                      </TouchableOpacity>
                    </View>

                    <Text style={[styles.itemPrice, { color: colors.textMain }]}>
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

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flexGrow: 0, marginTop: 8 }}
              contentContainerStyle={{ flexDirection: 'row', gap: 8, paddingVertical: 4, paddingHorizontal: 2 }}
            >
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
                .map((promo) => {
                  const badge = promo.badge_text?.trim();
                  const hasBadgeAlready = badge && promo.name.includes(badge);
                  const label = badge && !hasBadgeAlready ? `${promo.name} (${badge})` : promo.name;
                  const isSelected = selectedPromoId === promo.id;

                  return (
                    <TouchableOpacity
                      key={promo.id}
                      onPress={() => setSelectedPromoId(isSelected ? null : promo.id)}
                      style={[
                        styles.promoPill,
                        isSelected && styles.promoPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.promoPillText,
                          isSelected && styles.promoPillTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>

            {discountAmount > 0 ? (
              <View style={styles.discountAlert}>
                <Ionicons name="checkmark-circle" size={16} color="#15803D" />
                <Text style={styles.discountAlertText}>
                  ¡Ahorro de -${discountAmount.toFixed(2)} MXN aplicado al pedido!
                </Text>
              </View>
            ) : selectedPromo && promoRequirementMessage ? (
              <View style={[styles.discountAlert, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FEF3C7', borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A' }]}>
                <Ionicons name="alert-circle" size={16} color={colors.amberLight || '#D97706'} />
                <Text style={[styles.discountAlertText, { color: isDark ? '#FCD34D' : '#B45309' }]}>
                  {promoRequirementMessage}
                </Text>
              </View>
            ) : null}
          </DoubleBezelCard>

          {/* Payment & notes card */}
          <DoubleBezelCard style={styles.card}>
            <Text style={styles.sectionTitle}>💳 Pago & Notas</Text>

            {/* Payment Method Selector: Efectivo & Transferencia only */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Método de Pago</Text>
              <View style={styles.paymentStatusRow}>
                {(['Efectivo', 'Transferencia'] as const).map((method) => (
                  <TouchableOpacity
                    key={method}
                    onPress={() => setPaymentMethod(method)}
                    style={[
                      styles.statusSelectBtn,
                      {
                        backgroundColor: isDark ? '#242936' : '#F8F9FA',
                        borderColor: colors.borderSubtle,
                      },
                      paymentMethod === method && {
                        backgroundColor: colors.emeraldBg,
                        borderColor: colors.emerald,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusSelectText,
                        { color: colors.textMuted },
                        paymentMethod === method && {
                          color: colors.emeraldLight,
                          fontWeight: '800',
                        },
                      ]}
                    >
                      {method}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Payment status selector */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Estado del pago</Text>
              <View style={styles.paymentStatusRow}>
                {(['Pendiente', 'Anticipo', 'Pagado'] as const).map((st) => (
                  <TouchableOpacity
                    key={st}
                    onPress={() => setPaymentStatus(st)}
                    style={[
                      styles.statusSelectBtn,
                      {
                        backgroundColor: isDark ? '#242936' : '#F8F9FA',
                        borderColor: colors.borderSubtle,
                      },
                      paymentStatus === st && {
                        backgroundColor: colors.brandBg,
                        borderColor: colors.brandBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusSelectText,
                        { color: colors.textMuted },
                        paymentStatus === st && {
                          color: colors.brandText,
                          fontWeight: '800',
                        },
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
                <Text style={[styles.label, { color: colors.textMuted }]}>Monto del anticipo abonado ($ MXN)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle, color: colors.textMain }]}
                  keyboardType="numeric"
                  value={depositAmount}
                  onChangeText={setDepositAmount}
                  placeholder="0.00"
                  placeholderTextColor={colors.textDim}
                />
              </View>
            ) : null}

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Notas o especificaciones</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    height: 60,
                    textAlignVertical: 'top',
                    backgroundColor: colors.bgSurface,
                    borderColor: colors.borderSubtle,
                    color: colors.textMain,
                  },
                ]}
                placeholder="Ej. Decorar con listón verde, entrega después de las 4 PM..."
                placeholderTextColor={colors.textDim}
                multiline
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </DoubleBezelCard>

          {/* Financial summary breakdown */}
          <DoubleBezelCard style={{ ...styles.card, backgroundColor: colors.bgCard }}>
            <Text style={[styles.summaryTitle, { color: colors.textMain }]}>Resumen Financiero del Pedido</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total de Galletas:</Text>
              <Text style={[styles.summaryVal, { color: colors.textMain }]}>{totalUnits} piezas</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal sin descuento:</Text>
              <Text style={[styles.summaryVal, { color: colors.textMain }]}>${rawTotal.toFixed(2)} MXN</Text>
            </View>

            {discountAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.emeraldLight, fontWeight: '700' }]}>
                  Descuento ({selectedPromo?.name || 'Promoción'}):
                </Text>
                <Text style={[styles.summaryVal, { color: colors.emeraldLight, fontWeight: '800' }]}>
                  -${discountAmount.toFixed(2)} MXN
                </Text>
              </View>
            )}

            <View style={[styles.summaryRow, { paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.borderSubtle }]}>
              <Text style={[styles.summaryTotalLabel, { color: colors.textMain }]}>Total a Cobrar:</Text>
              <Text style={[styles.summaryTotalVal, { color: colors.textMain }]}>${finalTotal.toFixed(2)} MXN</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryProfitLabel}>Ganancia Neta Libre:</Text>
              <Text style={styles.summaryProfitVal}>+${netProfit.toFixed(2)} MXN</Text>
            </View>
          </DoubleBezelCard>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
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
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: colors.bgCard,
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
    backgroundColor: colors.bgCard,
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
    backgroundColor: colors.bgCard,
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
    backgroundColor: colors.bgCard,
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
  newCustomerToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  newCustomerToggleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  fieldSubLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  customerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  customerChipName: {
    fontSize: 12,
  },
  customerChipPhone: {
    fontSize: 10,
    marginTop: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 8,
    paddingVertical: 4,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
});
