import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order, OrderItem, CookieProduct, Promotion, Customer } from '../../lib/types';
import { useThemeColors, radii, spacing } from '../../theme';
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

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const inTwoDaysStr = new Date(Date.now() + 172800000).toISOString().split('T')[0];

  // Wizard Step State (1: Cliente, 2: Galletas & Promos, 3: Pago & Resumen)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form Fields
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

  // Animations
  const screenHeight = Dimensions.get('window').height;
  const modalHeight = Math.min(screenHeight * 0.94, 900);
  const translateY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressBarAnim = useRef(new Animated.Value(0.33)).current;

  // Scroll ref to reset scroll to top on step transition
  const scrollViewRef = useRef<ScrollView>(null);

  // Initialize or reset form
  useEffect(() => {
    if (!visible) return;

    translateY.setValue(0);
    setCurrentStep(1);
    progressBarAnim.setValue(0.33);
    fadeAnim.setValue(1);
    slideAnim.setValue(0);

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

  // Swipe-Down-To-Dismiss PanResponder (Ultra smooth & responsive)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        // Activates immediately on downward swipe
        return gestureState.dy > 6 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.1;
      },
      onPanResponderMove: (_evt, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        } else {
          // Slight elastic resistance when pulled up
          translateY.setValue(gestureState.dy * 0.12);
        }
      },
      onPanResponderRelease: (_evt, gestureState) => {
        // If dragged more than 55px or flicked down rapidly
        if (gestureState.dy > 55 || (gestureState.dy > 15 && gestureState.vy > 0.22)) {
          Animated.timing(translateY, {
            toValue: screenHeight,
            duration: 170,
            useNativeDriver: true,
          }).start(() => {
            onClose();
            translateY.setValue(0);
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            friction: 8,
            tension: 90,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Step transition handler with micro-animations
  const goToStep = (nextStep: 1 | 2 | 3) => {
    if (nextStep === currentStep) return;

    // Validate step requirements before advancing
    if (nextStep > 1 && !customerName.trim()) {
      Alert.alert('Nombre requerido', 'Por favor ingresa el nombre del cliente para continuar.');
      return;
    }
    if (nextStep === 3 && items.length === 0) {
      Alert.alert('Galletas requeridas', 'Agrega al menos una galleta a la orden para continuar.');
      return;
    }

    const direction = nextStep > currentStep ? 1 : -1;
    slideAnim.setValue(direction * 22);
    fadeAnim.setValue(0.25);

    const targetProgress = nextStep === 1 ? 0.33 : nextStep === 2 ? 0.66 : 1.0;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(progressBarAnim, {
        toValue: targetProgress,
        duration: 220,
        useNativeDriver: false,
      }),
    ]).start();

    setCurrentStep(nextStep);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  // Customer handlers
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

  // Cookie item handlers
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
  const depositNum = parseFloat(depositAmount) || 0;
  const pendingBalance = Math.max(0, finalTotal - (paymentStatus === 'Pagado' ? finalTotal : paymentStatus === 'Anticipo' ? depositNum : 0));

  // Save order handler
  const handleSaveOrder = async () => {
    if (!customerName.trim()) {
      Alert.alert('Faltan Datos', 'Por favor ingresa el nombre de la persona que pide.');
      goToStep(1);
      return;
    }
    if (items.length === 0) {
      Alert.alert('Faltan Datos', 'Agrega al menos una galleta al pedido.');
      goToStep(2);
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

  const progressInterpolate = progressBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.dialog,
            {
              height: modalHeight,
              maxHeight: modalHeight,
              backgroundColor: colors.bgCard,
              borderColor: colors.borderSubtle,
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Header & Stepper with PanResponder for Swipe-down to close */}
          <View {...panResponder.panHandlers} style={{ backgroundColor: colors.bgCard }}>
            {/* Generous touch handle bar */}
            <View style={styles.dragHandleContainer}>
              <View
                style={[
                  styles.dragHandleBar,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.22)' },
                ]}
              />
              <Text style={[styles.dragHandleHint, { color: colors.textDim }]}>
                Desliza hacia abajo para cerrar
              </Text>
            </View>

            {/* Top Bar with Title and Close Button */}
            <View style={[styles.topBar, { backgroundColor: colors.bgCard }]}>
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                style={[
                  styles.closeBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  },
                ]}
              >
                <Ionicons name="close" size={20} color={colors.textMain} />
              </TouchableOpacity>

              <View style={{ alignItems: 'center', flex: 1, paddingHorizontal: 6 }}>
                <View style={styles.luckyBadgeRow}>
                  <Ionicons name="nutrition" size={11} color={colors.amberLight} />
                  <Text style={[styles.luckyBadgeText, { color: colors.amberLight }]}>
                    LUCKY COOKIES
                  </Text>
                </View>
                <Text style={[styles.topBarTitle, { color: colors.textMain }]} numberOfLines={1}>
                  {editingOrder ? 'Editar Pedido' : 'Nuevo Pedido'}
                </Text>
              </View>

              {/* Quick direct save button */}
              <TouchableOpacity
                onPress={handleSaveOrder}
                disabled={isSubmitting}
                activeOpacity={0.8}
                style={[
                  styles.quickSaveBtn,
                  {
                    backgroundColor: colors.amber,
                  },
                  isSubmitting && { opacity: 0.6 },
                ]}
              >
                <Ionicons name="checkmark-sharp" size={14} color="#FFFFFF" />
                <Text style={styles.quickSaveBtnText}>Guardar</Text>
              </TouchableOpacity>
            </View>

            {/* Interactive Visual Stepper */}
            <View style={[styles.stepperContainer, { borderBottomColor: colors.borderSubtle }]}>
              {/* Progress track background */}
              <View style={[styles.progressTrack, { backgroundColor: isDark ? '#1E2538' : '#E2E8F0' }]}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      width: progressInterpolate,
                      backgroundColor: colors.amber,
                    },
                  ]}
                />
              </View>

              {/* 3 Step Interactive Buttons */}
              <View style={styles.stepperStepsRow}>
                {/* Step 1: Cliente */}
                <TouchableOpacity
                  onPress={() => goToStep(1)}
                  activeOpacity={0.8}
                  style={styles.stepItem}
                >
                  <View
                    style={[
                      styles.stepCircle,
                      currentStep === 1
                        ? { backgroundColor: colors.amber, borderColor: colors.amberLight }
                        : currentStep > 1
                        ? { backgroundColor: colors.emerald, borderColor: colors.emeraldLight }
                        : { backgroundColor: isDark ? '#1C2230' : '#E2E8F0', borderColor: isDark ? '#2D3748' : '#CBD5E1' },
                    ]}
                  >
                    {currentStep > 1 ? (
                      <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                    ) : (
                      <Text style={[styles.stepCircleNum, { color: currentStep === 1 ? '#FFFFFF' : colors.textMuted }]}>
                        1
                      </Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      {
                        color: currentStep === 1 ? colors.amberLight : currentStep > 1 ? colors.textMain : colors.textDim,
                        fontWeight: currentStep === 1 ? '800' : '600',
                      },
                    ]}
                  >
                    Cliente
                  </Text>
                </TouchableOpacity>

                {/* Step 2: Galletas & Promociones */}
                <TouchableOpacity
                  onPress={() => goToStep(2)}
                  activeOpacity={0.8}
                  style={styles.stepItem}
                >
                  <View
                    style={[
                      styles.stepCircle,
                      currentStep === 2
                        ? { backgroundColor: colors.amber, borderColor: colors.amberLight }
                        : currentStep > 2
                        ? { backgroundColor: colors.emerald, borderColor: colors.emeraldLight }
                        : { backgroundColor: isDark ? '#1C2230' : '#E2E8F0', borderColor: isDark ? '#2D3748' : '#CBD5E1' },
                    ]}
                  >
                    {currentStep > 2 ? (
                      <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                    ) : (
                      <Text style={[styles.stepCircleNum, { color: currentStep === 2 ? '#FFFFFF' : colors.textMuted }]}>
                        2
                      </Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      {
                        color: currentStep === 2 ? colors.amberLight : currentStep > 2 ? colors.textMain : colors.textDim,
                        fontWeight: currentStep === 2 ? '800' : '600',
                      },
                    ]}
                  >
                    Galletas
                  </Text>
                </TouchableOpacity>

                {/* Step 3: Pago y Resumen */}
                <TouchableOpacity
                  onPress={() => goToStep(3)}
                  activeOpacity={0.8}
                  style={styles.stepItem}
                >
                  <View
                    style={[
                      styles.stepCircle,
                      currentStep === 3
                        ? { backgroundColor: colors.amber, borderColor: colors.amberLight }
                        : { backgroundColor: isDark ? '#1C2230' : '#E2E8F0', borderColor: isDark ? '#2D3748' : '#CBD5E1' },
                    ]}
                  >
                    <Text style={[styles.stepCircleNum, { color: currentStep === 3 ? '#FFFFFF' : colors.textMuted }]}>
                      3
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      {
                        color: currentStep === 3 ? colors.amberLight : colors.textDim,
                        fontWeight: currentStep === 3 ? '800' : '600',
                      },
                    ]}
                  >
                    Pago & Resumen
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Wizard Step Body */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
          >
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }],
              }}
            >
              {/* ======================================================== */}
              {/* PASO 1: DATOS DEL CLIENTE Y FECHA DE ENTREGA             */}
              {/* ======================================================== */}
              {currentStep === 1 && (
                <View>
                  <DoubleBezelCard style={{ ...styles.card, backgroundColor: colors.bgCard }}>
                    <View style={styles.stepBadgeHeader}>
                      <View style={[styles.stepNumberBadge, { backgroundColor: colors.amberBg, borderColor: colors.amberBorder }]}>
                        <Text style={[styles.stepNumberBadgeText, { color: colors.amberLight }]}>PASO 1 DE 3</Text>
                      </View>
                      <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>
                        ¿Quién solicita el pedido y cuándo se entrega?
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="person-circle-outline" size={18} color={colors.amberLight} />
                        <Text style={[styles.sectionTitle, { color: colors.textMain, marginBottom: 0 }]}>
                          Datos del Cliente
                        </Text>
                      </View>
                      {customers.length > 0 && (
                        <TouchableOpacity
                          onPress={handleStartNewCustomer}
                          style={[
                            styles.newCustomerToggleBtn,
                            {
                              backgroundColor: isNewCustomerMode ? colors.brandBg : (isDark ? '#1C2230' : colors.bgTertiary),
                              borderColor: isNewCustomerMode ? colors.brandBorder : (isDark ? '#2B3548' : colors.borderSubtle),
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

                    {/* Registered customers quick horizontal selector */}
                    {customers.length > 0 && (
                      <View style={{ marginBottom: 14 }}>
                        <Text style={[styles.fieldSubLabel, { color: colors.textMuted }]}>
                          Clientes Registrados (Toca para autocompletar):
                        </Text>
                        <ScrollView
                          horizontal
                          nestedScrollEnabled={true}
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
                                    backgroundColor: isSelected
                                      ? (isDark ? 'rgba(245, 158, 11, 0.18)' : colors.amberBg)
                                      : (isDark ? '#1C2230' : colors.bgSurface),
                                    borderColor: isSelected
                                      ? (isDark ? '#F59E0B' : colors.amberBorder)
                                      : (isDark ? '#2B3548' : colors.borderSubtle),
                                  },
                                ]}
                              >
                                <Ionicons
                                  name="person"
                                  size={13}
                                  color={isSelected ? colors.amberLight : colors.textDim}
                                />
                                <View>
                                  <Text
                                    style={[
                                      styles.customerChipName,
                                      {
                                        color: isSelected ? colors.amberLight : colors.textMain,
                                        fontWeight: isSelected ? '800' : '600',
                                      },
                                    ]}
                                  >
                                    {c.name}
                                  </Text>
                                  {Boolean(c.phone) && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 }}>
                                      <Ionicons
                                        name="call-outline"
                                        size={9}
                                        color={isSelected ? colors.amberLight : colors.textDim}
                                      />
                                      <Text
                                        style={[
                                          styles.customerChipPhone,
                                          { color: isSelected ? colors.amberLight : colors.textDim },
                                        ]}
                                      >
                                        {c.phone}
                                      </Text>
                                    </View>
                                  )}
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>
                    )}

                    {/* Full Name Input */}
                    <View style={styles.fieldGroup}>
                      <Text style={[styles.label, { color: colors.textMuted }]}>Nombre completo del cliente *</Text>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            backgroundColor: isDark ? '#141824' : colors.bgSurface,
                            borderColor: !customerName.trim() ? (isDark ? '#3E2A20' : '#FED7AA') : (isDark ? '#263147' : colors.borderSubtle),
                            color: colors.textMain,
                          },
                        ]}
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

                    {/* Phone Input */}
                    <View style={styles.fieldGroup}>
                      <Text style={[styles.label, { color: colors.textMuted }]}>Teléfono o WhatsApp (10 dígitos)</Text>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            backgroundColor: isDark ? '#141824' : colors.bgSurface,
                            borderColor: isDark ? '#263147' : colors.borderSubtle,
                            color: colors.textMain,
                          },
                        ]}
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
                            borderColor: saveCustomerCheckbox ? colors.emerald : (isDark ? '#2B3548' : colors.borderSubtle),
                            backgroundColor: saveCustomerCheckbox ? colors.emerald : 'transparent',
                          },
                        ]}
                      >
                        {saveCustomerCheckbox && <Ionicons name="checkmark" size={13} color="#fff" />}
                      </View>
                      <Text style={[styles.checkboxLabel, { color: colors.textMain }]}>
                        Guardar este cliente en la agenda de pedidos frecuentes
                      </Text>
                    </TouchableOpacity>

                    {/* Delivery Date with quick shortcuts */}
                    <View style={[styles.fieldGroup, { marginTop: 8 }]}>
                      <Text style={[styles.label, { color: colors.textMuted }]}>Fecha programada de entrega</Text>
                      <View style={styles.quickDateRow}>
                        <TouchableOpacity
                          onPress={() => setDeliveryDate(todayStr)}
                          style={[
                            styles.quickDateBtn,
                            {
                              backgroundColor: deliveryDate === todayStr ? (isDark ? 'rgba(245, 158, 11, 0.2)' : colors.amberBg) : (isDark ? '#141824' : '#F1F5F9'),
                              borderColor: deliveryDate === todayStr ? colors.amber : (isDark ? '#263147' : colors.borderSubtle),
                            },
                          ]}
                        >
                          <Text style={[styles.quickDateText, { color: deliveryDate === todayStr ? colors.amberLight : colors.textMuted, fontWeight: deliveryDate === todayStr ? '800' : '600' }]}>
                            Hoy
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => setDeliveryDate(tomorrowStr)}
                          style={[
                            styles.quickDateBtn,
                            {
                              backgroundColor: deliveryDate === tomorrowStr ? (isDark ? 'rgba(245, 158, 11, 0.2)' : colors.amberBg) : (isDark ? '#141824' : '#F1F5F9'),
                              borderColor: deliveryDate === tomorrowStr ? colors.amber : (isDark ? '#263147' : colors.borderSubtle),
                            },
                          ]}
                        >
                          <Text style={[styles.quickDateText, { color: deliveryDate === tomorrowStr ? colors.amberLight : colors.textMuted, fontWeight: deliveryDate === tomorrowStr ? '800' : '600' }]}>
                            Mañana
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => setDeliveryDate(inTwoDaysStr)}
                          style={[
                            styles.quickDateBtn,
                            {
                              backgroundColor: deliveryDate === inTwoDaysStr ? (isDark ? 'rgba(245, 158, 11, 0.2)' : colors.amberBg) : (isDark ? '#141824' : '#F1F5F9'),
                              borderColor: deliveryDate === inTwoDaysStr ? colors.amber : (isDark ? '#263147' : colors.borderSubtle),
                            },
                          ]}
                        >
                          <Text style={[styles.quickDateText, { color: deliveryDate === inTwoDaysStr ? colors.amberLight : colors.textMuted, fontWeight: deliveryDate === inTwoDaysStr ? '800' : '600' }]}>
                            En 2 días
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <TextInput
                        style={[
                          styles.input,
                          {
                            backgroundColor: isDark ? '#141824' : colors.bgSurface,
                            borderColor: isDark ? '#263147' : colors.borderSubtle,
                            color: colors.textMain,
                            marginTop: 8,
                          },
                        ]}
                        placeholder="AAAA-MM-DD"
                        placeholderTextColor={colors.textDim}
                        value={deliveryDate}
                        onChangeText={setDeliveryDate}
                      />
                    </View>
                  </DoubleBezelCard>

                  {/* Step 1 Navigation Button */}
                  <TouchableOpacity
                    onPress={() => goToStep(2)}
                    activeOpacity={0.85}
                    style={[
                      styles.wizardNextBtn,
                      {
                        backgroundColor: customerName.trim() ? colors.amber : (isDark ? '#252F42' : '#CBD5E1'),
                      },
                    ]}
                  >
                    <Text style={styles.wizardNextBtnText}>Siguiente: Elegir Galletas</Text>
                    <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}

              {/* ======================================================== */}
              {/* PASO 2: SELECCIÓN DE PRODUCTOS Y PROMOCIONES             */}
              {/* ======================================================== */}
              {currentStep === 2 && (
                <View>
                  {/* Cookies selection card */}
                  <DoubleBezelCard style={{ ...styles.card, backgroundColor: colors.bgCard }}>
                    <View style={styles.stepBadgeHeader}>
                      <View style={[styles.stepNumberBadge, { backgroundColor: colors.amberBg, borderColor: colors.amberBorder }]}>
                        <Text style={[styles.stepNumberBadgeText, { color: colors.amberLight }]}>PASO 2 DE 3</Text>
                      </View>
                      <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>
                        Selecciona los sabores, cantidades y promociones aplicables.
                      </Text>
                    </View>

                    <View style={styles.sectionHeaderRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="nutrition-outline" size={16} color={colors.amberLight} />
                        <Text style={[styles.sectionTitle, { color: colors.textMain, marginBottom: 0 }]}>
                          Galletas del Pedido
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={handleAddItem}
                        activeOpacity={0.8}
                        style={[
                          styles.addMiniBtn,
                          {
                            backgroundColor: colors.amberBg,
                            borderColor: colors.amberBorder,
                            borderWidth: 1,
                          },
                        ]}
                      >
                        <Ionicons name="add-circle" size={15} color={colors.amberLight} />
                        <Text style={[styles.addMiniText, { color: colors.amberLight, fontWeight: '800' }]}>
                          + Agregar sabor
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {items.map((item, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.itemRow,
                          {
                            backgroundColor: isDark ? '#1C2230' : '#F8FAFC',
                            borderColor: isDark ? '#2A354A' : '#E2E8F0',
                          },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <ScrollView
                            horizontal
                            nestedScrollEnabled={true}
                            showsHorizontalScrollIndicator={false}
                            style={{ marginBottom: 8 }}
                          >
                            <View style={{ flexDirection: 'row', gap: 6 }}>
                              {cookies.map((c) => (
                                <TouchableOpacity
                                  key={c.id}
                                  onPress={() => handleSelectCookieForItem(idx, c.id)}
                                  style={[
                                    styles.cookiePill,
                                    {
                                      backgroundColor: item.product_id === c.id
                                        ? (isDark ? 'rgba(14, 165, 233, 0.2)' : colors.brandBg)
                                        : (isDark ? '#141824' : '#FFFFFF'),
                                      borderColor: item.product_id === c.id
                                        ? (isDark ? '#38BDF8' : colors.brandBorder)
                                        : (isDark ? '#263147' : '#E2E8F0'),
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.cookiePillText,
                                      {
                                        color: item.product_id === c.id
                                          ? (isDark ? '#38BDF8' : colors.brandText)
                                          : (isDark ? '#94A3B8' : '#64748B'),
                                        fontWeight: item.product_id === c.id ? '800' : '600',
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
                                  backgroundColor: isDark ? '#141824' : '#FFFFFF',
                                  borderColor: isDark ? '#2A354A' : '#CBD5E1',
                                },
                              ]}
                            >
                              <TouchableOpacity
                                onPress={() => handleUpdateItem(idx, -1)}
                                style={styles.qtyBtn}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              >
                                <Ionicons name="remove" size={15} color={colors.textMain} />
                              </TouchableOpacity>
                              <Text style={[styles.qtyText, { color: colors.textMain }]}>
                                {item.quantity} pzas
                              </Text>
                              <TouchableOpacity
                                onPress={() => handleUpdateItem(idx, 1)}
                                style={styles.qtyBtn}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              >
                                <Ionicons name="add" size={15} color={colors.textMain} />
                              </TouchableOpacity>
                            </View>

                            <Text style={[styles.itemPrice, { color: colors.textMain }]}>
                              ${item.unit_price} c/u = ${item.subtotal.toFixed(2)}
                            </Text>

                            <TouchableOpacity
                              onPress={() => handleRemoveItem(idx)}
                              style={[
                                styles.trashBtn,
                                {
                                  backgroundColor: isDark ? 'rgba(244, 63, 94, 0.12)' : '#FFE4E6',
                                  borderColor: isDark ? 'rgba(244, 63, 94, 0.25)' : '#FECDD3',
                                },
                              ]}
                              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            >
                              <Ionicons name="trash-outline" size={15} color={colors.roseLight} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ))}
                  </DoubleBezelCard>

                  {/* Dynamic Promotions selector card */}
                  <DoubleBezelCard style={{ ...styles.card, backgroundColor: colors.bgCard }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Ionicons name="pricetags-outline" size={18} color={colors.amberLight} />
                      <Text style={[styles.sectionTitle, { color: colors.textMain, marginBottom: 0 }]}>
                        Promoción o Combo Especial
                      </Text>
                    </View>
                    <Text style={[styles.sublabel, { color: colors.textDim }]}>
                      Selecciona una oferta para aplicar automáticamente el descuento al total.
                    </Text>

                    <ScrollView
                      horizontal
                      nestedScrollEnabled={true}
                      showsHorizontalScrollIndicator={false}
                      style={{ flexGrow: 0, marginTop: 8 }}
                      contentContainerStyle={{ flexDirection: 'row', gap: 8, paddingVertical: 4, paddingHorizontal: 2 }}
                    >
                      <TouchableOpacity
                        onPress={() => setSelectedPromoId(null)}
                        style={[
                          styles.promoPill,
                          {
                            backgroundColor: selectedPromoId === null
                              ? (isDark ? 'rgba(245, 158, 11, 0.18)' : '#FEF3C7')
                              : (isDark ? '#141824' : '#FFFFFF'),
                            borderColor: selectedPromoId === null
                              ? (isDark ? '#F59E0B' : '#FDE68A')
                              : (isDark ? '#263147' : '#E2E8F0'),
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.promoPillText,
                            {
                              color: selectedPromoId === null
                                ? (isDark ? '#FDE047' : '#92400E')
                                : (isDark ? '#94A3B8' : '#64748B'),
                              fontWeight: selectedPromoId === null ? '800' : '600',
                            },
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
                                {
                                  backgroundColor: isSelected
                                    ? (isDark ? 'rgba(245, 158, 11, 0.18)' : '#FEF3C7')
                                    : (isDark ? '#141824' : '#FFFFFF'),
                                  borderColor: isSelected
                                    ? (isDark ? '#F59E0B' : '#FDE68A')
                                    : (isDark ? '#263147' : '#E2E8F0'),
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.promoPillText,
                                  {
                                    color: isSelected
                                      ? (isDark ? '#FDE047' : '#92400E')
                                      : (isDark ? '#94A3B8' : '#64748B'),
                                    fontWeight: isSelected ? '800' : '600',
                                  },
                                ]}
                              >
                                {label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                    </ScrollView>

                    {discountAmount > 0 ? (
                      <View
                        style={[
                          styles.discountAlert,
                          {
                            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#D1FAE5',
                            borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : '#A7F3D0',
                          },
                        ]}
                      >
                        <Ionicons name="checkmark-circle" size={17} color={colors.emeraldLight} />
                        <Text style={[styles.discountAlertText, { color: colors.emeraldLight }]}>
                          ¡Ahorro de -${discountAmount.toFixed(2)} MXN aplicado con éxito!
                        </Text>
                      </View>
                    ) : selectedPromo && promoRequirementMessage ? (
                      <View style={[styles.discountAlert, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FEF3C7', borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A' }]}>
                        <Ionicons name="alert-circle" size={17} color={colors.amberLight || '#D97706'} />
                        <Text style={[styles.discountAlertText, { color: isDark ? '#FCD34D' : '#B45309' }]}>
                          {promoRequirementMessage}
                        </Text>
                      </View>
                    ) : null}
                  </DoubleBezelCard>

                  {/* Quick Subtotal Bar */}
                  <View style={[styles.stepTwoSummaryBar, { backgroundColor: isDark ? '#141824' : '#F1F5F9', borderColor: colors.borderSubtle }]}>
                    <View>
                      <Text style={[styles.stepTwoSummaryUnits, { color: colors.textMuted }]}>
                        {totalUnits} galletas seleccionadas
                      </Text>
                      <Text style={[styles.stepTwoSummaryTotal, { color: colors.textMain }]}>
                        Subtotal: <Text style={{ color: colors.amberLight, fontWeight: '900' }}>${finalTotal.toFixed(2)} MXN</Text>
                      </Text>
                    </View>
                    {discountAmount > 0 && (
                      <View style={[styles.discountMiniBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.18)' : '#D1FAE5' }]}>
                        <Text style={[styles.discountMiniBadgeText, { color: colors.emeraldLight }]}>
                          -${discountAmount.toFixed(2)} ahorro
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Step 2 Navigation Buttons */}
                  <View style={styles.wizardNavRow}>
                    <TouchableOpacity
                      onPress={() => goToStep(1)}
                      activeOpacity={0.8}
                      style={[styles.wizardBackBtn, { borderColor: isDark ? '#2D3748' : '#CBD5E1' }]}
                    >
                      <Ionicons name="arrow-back" size={16} color={colors.textMain} />
                      <Text style={[styles.wizardBackBtnText, { color: colors.textMain }]}>Atrás</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => goToStep(3)}
                      activeOpacity={0.85}
                      style={[styles.wizardNextBtnFlex, { backgroundColor: colors.amber }]}
                    >
                      <Text style={styles.wizardNextBtnText}>Siguiente: Pago & Resumen</Text>
                      <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* ======================================================== */}
              {/* PASO 3: PAGO, ANTICIPO Y RESUMEN INTEGRAL                */}
              {/* ======================================================== */}
              {currentStep === 3 && (
                <View>
                  {/* Payment & notes card */}
                  <DoubleBezelCard style={{ ...styles.card, backgroundColor: colors.bgCard }}>
                    <View style={styles.stepBadgeHeader}>
                      <View style={[styles.stepNumberBadge, { backgroundColor: colors.amberBg, borderColor: colors.amberBorder }]}>
                        <Text style={[styles.stepNumberBadgeText, { color: colors.amberLight }]}>PASO 3 DE 3</Text>
                      </View>
                      <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>
                        Registra cómo se pagará el pedido y verifica todos los datos.
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <Ionicons name="card-outline" size={18} color={colors.amberLight} />
                      <Text style={[styles.sectionTitle, { color: colors.textMain, marginBottom: 0 }]}>
                        Forma de Pago & Estado
                      </Text>
                    </View>

                    {/* Payment Method Selector: Efectivo & Transferencia */}
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
                                backgroundColor: isDark ? '#141824' : '#F8F9FA',
                                borderColor: isDark ? '#263147' : colors.borderSubtle,
                              },
                              paymentMethod === method && {
                                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.18)' : '#D1FAE5',
                                borderColor: isDark ? '#10B981' : '#059669',
                              },
                            ]}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <Ionicons
                                name={method === 'Efectivo' ? 'cash-outline' : 'business-outline'}
                                size={13}
                                color={paymentMethod === method ? colors.emeraldLight : colors.textMuted}
                              />
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
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Payment status selector */}
                    <View style={styles.fieldGroup}>
                      <Text style={[styles.label, { color: colors.textMuted }]}>Estado del Cobro</Text>
                      <View style={styles.paymentStatusRow}>
                        {(['Pendiente', 'Anticipo', 'Pagado'] as const).map((st) => (
                          <TouchableOpacity
                            key={st}
                            onPress={() => setPaymentStatus(st)}
                            style={[
                              styles.statusSelectBtn,
                              {
                                backgroundColor: isDark ? '#141824' : '#F8F9FA',
                                borderColor: isDark ? '#263147' : colors.borderSubtle,
                              },
                              paymentStatus === st && {
                                backgroundColor:
                                  st === 'Pagado'
                                    ? (isDark ? 'rgba(16, 185, 129, 0.18)' : '#D1FAE5')
                                    : st === 'Anticipo'
                                    ? (isDark ? 'rgba(56, 189, 248, 0.18)' : colors.brandBg)
                                    : (isDark ? 'rgba(245, 158, 11, 0.18)' : colors.amberBg),
                                borderColor:
                                  st === 'Pagado'
                                    ? colors.emerald
                                    : st === 'Anticipo'
                                    ? colors.brand
                                    : colors.amber,
                              },
                            ]}
                          >
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Ionicons
                                  name={
                                    st === 'Pagado'
                                      ? 'checkmark-circle'
                                      : st === 'Anticipo'
                                      ? 'cash-outline'
                                      : 'time-outline'
                                  }
                                  size={13}
                                  color={
                                    paymentStatus === st
                                      ? (st === 'Pagado'
                                          ? colors.emeraldLight
                                          : st === 'Anticipo'
                                          ? colors.brandText
                                          : colors.amberLight)
                                      : colors.textMuted
                                  }
                                />
                                <Text
                                  style={[
                                    styles.statusSelectText,
                                    { color: colors.textMuted },
                                    paymentStatus === st && {
                                      color:
                                        st === 'Pagado'
                                          ? colors.emeraldLight
                                          : st === 'Anticipo'
                                          ? colors.brandText
                                          : colors.amberLight,
                                      fontWeight: '800',
                                    },
                                  ]}
                                >
                                  {st}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                    {/* Deposit amount input */}
                    {paymentStatus === 'Anticipo' && (
                      <View style={styles.fieldGroup}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={[styles.label, { color: colors.textMuted }]}>Monto del anticipo abonado ($ MXN)</Text>
                          <Text style={{ fontSize: 11, color: colors.amberLight, fontWeight: '700' }}>
                            Resta: ${pendingBalance.toFixed(2)} MXN
                          </Text>
                        </View>
                        <TextInput
                          style={[
                            styles.input,
                            {
                              backgroundColor: isDark ? '#141824' : colors.bgSurface,
                              borderColor: isDark ? '#263147' : colors.borderSubtle,
                              color: colors.textMain,
                            },
                          ]}
                          keyboardType="decimal-pad"
                          value={depositAmount}
                          onChangeText={(t) => setDepositAmount(t.replace(',', '.'))}
                          placeholder="0.00"
                          placeholderTextColor={colors.textDim}
                        />
                      </View>
                    )}

                    {/* Notes */}
                    <View style={styles.fieldGroup}>
                      <Text style={[styles.label, { color: colors.textMuted }]}>Notas o especificaciones</Text>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            height: 60,
                            textAlignVertical: 'top',
                            backgroundColor: isDark ? '#141824' : colors.bgSurface,
                            borderColor: isDark ? '#263147' : colors.borderSubtle,
                            color: colors.textMain,
                          },
                        ]}
                        placeholder="Ej. Con listón verde, entregar después de las 4 PM..."
                        placeholderTextColor={colors.textDim}
                        multiline
                        value={notes}
                        onChangeText={setNotes}
                      />
                    </View>
                  </DoubleBezelCard>

                  {/* ======================================================== */}
                  {/* RESUMEN INTEGRAL CON BOTONES DE EDITAR CADA SECCIÓN       */}
                  {/* ======================================================== */}
                  <DoubleBezelCard
                    style={{
                      ...styles.card,
                      backgroundColor: isDark ? '#141824' : '#FFFFFF',
                      borderColor: isDark ? '#263147' : '#E2E8F0',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="receipt-outline" size={18} color={colors.amberLight} />
                        <Text style={[styles.summaryTitle, { color: colors.textMain, marginBottom: 0 }]}>
                          Resumen Completo del Pedido
                        </Text>
                      </View>
                      <View style={[styles.summaryVerifiedBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.16)' : '#D1FAE5' }]}>
                        <Ionicons name="checkmark-done" size={13} color={colors.emeraldLight} />
                        <Text style={[styles.summaryVerifiedText, { color: colors.emeraldLight }]}>Listo</Text>
                      </View>
                    </View>

                    {/* Resumen Bloque 1: Cliente & Entrega con botón de editar */}
                    <View style={[styles.reviewSectionBlock, { borderColor: isDark ? '#20293D' : '#E2E8F0' }]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                            <Ionicons name="person" size={13} color={colors.amberLight} />
                            <Text style={[styles.reviewBlockTitle, { color: colors.textMain }]}>
                              {customerName || 'Sin nombre'}
                            </Text>
                          </View>
                          {Boolean(customerPhone) && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                              <Ionicons name="call-outline" size={11} color={colors.textMuted} />
                              <Text style={[styles.reviewBlockDetail, { color: colors.textMuted }]}>
                                {customerPhone}
                              </Text>
                            </View>
                          )}
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <Ionicons name="calendar-outline" size={11} color={colors.textMuted} />
                            <Text style={[styles.reviewBlockDetail, { color: colors.textMuted }]}>
                              Entrega: {deliveryDate}
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={() => goToStep(1)}
                          style={[styles.editStepMiniBtn, { borderColor: isDark ? '#2D3748' : '#CBD5E1' }]}
                        >
                          <Ionicons name="pencil-outline" size={12} color={colors.amberLight} />
                          <Text style={[styles.editStepMiniBtnText, { color: colors.amberLight }]}>Modificar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Resumen Bloque 2: Galletas & Promociones con botón de editar */}
                    <View style={[styles.reviewSectionBlock, { borderColor: isDark ? '#20293D' : '#E2E8F0', marginTop: 10 }]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                            <Ionicons name="nutrition" size={13} color={colors.amberLight} />
                            <Text style={[styles.reviewBlockTitle, { color: colors.textMain }]}>
                              {totalUnits} galletas seleccionadas
                            </Text>
                          </View>
                          {items.map((it, i) => (
                            <Text key={i} style={[styles.reviewItemRowText, { color: colors.textMuted }]}>
                              • <Text style={{ color: colors.textMain, fontWeight: '700' }}>{it.quantity}x</Text> {it.product_name} (${it.subtotal.toFixed(2)})
                            </Text>
                          ))}
                          {selectedPromo ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                              <Ionicons name="pricetag" size={11} color={colors.emeraldLight} />
                              <Text style={{ fontSize: 11.5, color: colors.emeraldLight, fontWeight: '700' }}>
                                Promo: {selectedPromo.name} (-${discountAmount.toFixed(2)})
                              </Text>
                            </View>
                          ) : (
                            <Text style={{ fontSize: 11, color: colors.textDim, marginTop: 2 }}>
                              Sin promoción aplicada
                            </Text>
                          )}
                        </View>
                        <TouchableOpacity
                          onPress={() => goToStep(2)}
                          style={[styles.editStepMiniBtn, { borderColor: isDark ? '#2D3748' : '#CBD5E1' }]}
                        >
                          <Ionicons name="pencil-outline" size={12} color={colors.amberLight} />
                          <Text style={[styles.editStepMiniBtnText, { color: colors.amberLight }]}>Modificar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Resumen Financiero Total */}
                    <View style={[styles.financialSummaryBlock, { borderTopColor: isDark ? '#263147' : '#E2E8F0' }]}>
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Subtotal original:</Text>
                        <Text style={[styles.summaryVal, { color: colors.textMain }]}>${rawTotal.toFixed(2)} MXN</Text>
                      </View>

                      {discountAmount > 0 && (
                        <View style={styles.summaryRow}>
                          <Text style={[styles.summaryLabel, { color: colors.emeraldLight, fontWeight: '700' }]}>
                            Descuento Promo:
                          </Text>
                          <Text style={[styles.summaryVal, { color: colors.emeraldLight, fontWeight: '800' }]}>
                            -${discountAmount.toFixed(2)} MXN
                          </Text>
                        </View>
                      )}

                      <View style={[styles.summaryRow, { paddingTop: 8, marginTop: 4, borderTopWidth: 1, borderTopColor: isDark ? '#263147' : '#E2E8F0' }]}>
                        <Text style={[styles.summaryTotalLabel, { color: colors.textMain }]}>TOTAL A COBRAR:</Text>
                        <Text style={[styles.summaryTotalVal, { color: colors.amberLight }]}>${finalTotal.toFixed(2)} MXN</Text>
                      </View>

                      {paymentStatus === 'Anticipo' && (
                        <View style={[styles.summaryRow, { marginTop: 4 }]}>
                          <Text style={[styles.summaryLabel, { color: colors.brandText }]}>Anticipo abonado:</Text>
                          <Text style={[styles.summaryVal, { color: colors.brandText }]}>${depositNum.toFixed(2)} MXN</Text>
                        </View>
                      )}

                      {pendingBalance > 0 && (
                        <View style={[styles.pendingBalanceBadge, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.14)' : colors.amberBg, borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : colors.amberBorder }]}>
                          <Ionicons name="hourglass-outline" size={14} color={colors.amberLight} />
                          <Text style={[styles.pendingBalanceText, { color: colors.amberLight }]}>
                            Saldo pendiente por liquidar: ${pendingBalance.toFixed(2)} MXN
                          </Text>
                        </View>
                      )}

                      <View style={[styles.summaryRow, { marginTop: 10, alignItems: 'center' }]}>
                        <Text style={[styles.summaryProfitLabel, { color: colors.emeraldLight }]}>Ganancia Neta Estimada:</Text>
                        <View style={{ backgroundColor: isDark ? 'rgba(16, 185, 129, 0.16)' : '#D1FAE5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.pill, borderWidth: 1, borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0' }}>
                          <Text style={[styles.summaryProfitVal, { color: colors.emeraldLight }]}>+${netProfit.toFixed(2)} MXN</Text>
                        </View>
                      </View>
                    </View>
                  </DoubleBezelCard>

                  {/* Step 3 Navigation & Final Save Buttons */}
                  <View style={styles.wizardNavRow}>
                    <TouchableOpacity
                      onPress={() => goToStep(2)}
                      activeOpacity={0.8}
                      style={[styles.wizardBackBtn, { borderColor: isDark ? '#2D3748' : '#CBD5E1' }]}
                    >
                      <Ionicons name="arrow-back" size={16} color={colors.textMain} />
                      <Text style={[styles.wizardBackBtnText, { color: colors.textMain }]}>Galletas</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleSaveOrder}
                      disabled={isSubmitting}
                      activeOpacity={0.85}
                      style={[
                        styles.wizardNextBtnFlex,
                        {
                          backgroundColor: colors.emerald,
                        },
                        isSubmitting && { opacity: 0.6 },
                      ]}
                    >
                      <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                      <Text style={styles.wizardNextBtnText}>
                        {isSubmitting ? 'Guardando...' : editingOrder ? 'Actualizar Pedido' : 'Confirmar y Guardar Pedido'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </Animated.View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  dialog: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  dragHandleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 2,
  },
  dragHandleBar: {
    width: 48,
    height: 5,
    borderRadius: 3,
  },
  dragHandleHint: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: 6,
    paddingBottom: 10,
  },
  luckyBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 1,
  },
  luckyBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  quickSaveBtn: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    elevation: 2,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  quickSaveBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepperContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: 12,
    paddingTop: 4,
    borderBottomWidth: 1,
  },
  progressTrack: {
    width: '100%',
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  stepperStepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  stepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleNum: {
    fontSize: 11,
    fontWeight: '800',
  },
  stepLabel: {
    fontSize: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 60,
    flexGrow: 1,
  },
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  stepBadgeHeader: {
    marginBottom: 12,
  },
  stepNumberBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    borderWidth: 1,
    marginBottom: 4,
  },
  stepNumberBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  stepSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sublabel: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
  },
  addMiniText: {
    fontSize: 11.5,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontSize: 14,
  },
  itemRow: {
    borderRadius: radii.md,
    padding: 11,
    marginBottom: 10,
    borderWidth: 1,
  },
  cookiePill: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  cookiePillText: {
    fontSize: 11.5,
  },
  itemControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  qtyBtn: {
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  qtyText: {
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 6,
  },
  itemPrice: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  trashBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoPill: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  promoPillText: {
    fontSize: 12,
  },
  discountAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    padding: 10,
    borderRadius: radii.md,
    marginTop: 10,
    borderWidth: 1,
  },
  discountAlertText: {
    fontSize: 12,
    fontWeight: '700',
  },
  paymentStatusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusSelectBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
  },
  statusSelectText: {
    fontSize: 12,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3.5,
  },
  summaryLabel: {
    fontSize: 12.5,
  },
  summaryVal: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  summaryTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  summaryTotalVal: {
    fontSize: 18,
    fontWeight: '900',
  },
  summaryProfitLabel: {
    fontSize: 12.5,
  },
  summaryProfitVal: {
    fontSize: 12,
    fontWeight: '800',
  },
  newCustomerToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: radii.pill,
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
    paddingHorizontal: 11,
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
  quickDateRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  quickDateBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  quickDateText: {
    fontSize: 11.5,
  },
  wizardNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radii.lg,
    elevation: 3,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginTop: 6,
  },
  wizardNextBtnFlex: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radii.lg,
    elevation: 3,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  wizardNextBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  wizardNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  wizardBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  wizardBackBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  stepTwoSummaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: 12,
  },
  stepTwoSummaryUnits: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  stepTwoSummaryTotal: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  discountMiniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  discountMiniBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  summaryVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  summaryVerifiedText: {
    fontSize: 11,
    fontWeight: '800',
  },
  reviewSectionBlock: {
    padding: 10,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  reviewBlockTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  reviewBlockDetail: {
    fontSize: 11.5,
    marginTop: 2,
  },
  reviewItemRowText: {
    fontSize: 12,
    marginTop: 2,
  },
  editStepMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  editStepMiniBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  financialSummaryBlock: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  pendingBalanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: radii.md,
    borderWidth: 1,
    marginTop: 8,
  },
  pendingBalanceText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
});
