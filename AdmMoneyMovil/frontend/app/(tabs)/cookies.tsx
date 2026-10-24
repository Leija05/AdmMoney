import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, useThemeColors, radii, spacing, gradients } from '../../src/theme';
import { CookieCard } from '../../src/components/cookies/CookieCard';
import { CookieRecipeDetailModal } from '../../src/components/cookies/CookieRecipeDetailModal';
import { SaleDetailModal } from '../../src/components/cookies/SaleDetailModal';
import { AddCookieModal } from '../../src/components/cookies/AddCookieModal';
import { EditCookieModal } from '../../src/components/cookies/EditCookieModal';
import { AddIngredientModal } from '../../src/components/cookies/AddIngredientModal';
import { AddPromotionModal } from '../../src/components/cookies/AddPromotionModal';
import { OrderCard } from '../../src/components/orders/OrderCard';
import { OrderModal } from '../../src/components/orders/OrderModal';
import { DoubleBezelCard } from '../../src/components/ui/DoubleBezelCard';
import { Badge } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';
import { BackendHeartbeat } from '../../src/components/ui/BackendHeartbeat';
import { SwipeTabWrapper } from '../../src/components/ui/SwipeTabWrapper';
import { useAppStore } from '../../src/stores/app.store';
import { CookieProduct, CookieSale, Ingredient, Promotion, Order } from '../../src/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { confirmAction } from '../../src/stores/confirmation.store';

const PAYMENT_METHODS = ['Efectivo', 'Transferencia'];

export default function CookiesScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const {
    cookies,
    sales,
    ingredients,
    promotions,
    orders,
    customers,
    addCustomer,
    togglePromotion,
    deletePromotion,
    addPromotion,
    updatePromotion,
    addCookieSale,
    deleteCookieSale,
    addCookieProduct,
    updateCookieProduct,
    deleteCookieProduct,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    addOrder,
    updateOrder,
    deleteOrder,
    loadAllData,
    isLoading,
    useMockData,
    isOnline,
    theme,
    toggleTheme,
    stockAlertsEnabled,
    currency,
    privacyMode,
  } = useAppStore();

  const [subTab, setSubTab] = useState<'catalog' | 'ingredients' | 'sales' | 'promotions' | 'orders'>('catalog');

  // Modals state
  const [inspectedCookie, setInspectedCookie] = useState<CookieProduct | null>(null);
  const [actionSheetCookie, setActionSheetCookie] = useState<CookieProduct | null>(null);
  const [editingCookieProduct, setEditingCookieProduct] = useState<CookieProduct | null>(null);
  const [selectedSale, setSelectedSale] = useState<CookieSale | null>(null);
  const [isAddCookieOpen, setIsAddCookieOpen] = useState(false);
  const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [isAddPromoOpen, setIsAddPromoOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('Todos');

  // Quick sale modal state
  const [selectedCookie, setSelectedCookie] = useState<CookieProduct | null>(null);
  const [saleQty, setSaleQty] = useState<number>(1);
  const [selectedPromoId, setSelectedPromoId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState('Cliente Mostrador');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);

  // Aggregates
  const totalRevenue = sales.reduce((acc, s) => acc + s.total_revenue, 0);
  const totalProfit = sales.reduce((acc, s) => acc + s.net_profit, 0);
  const totalUnits = sales.reduce((acc, s) => acc + s.quantity, 0);
  const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  const handleOpenSale = (cookie: CookieProduct) => {
    setSelectedCookie(cookie);
    setSaleQty(1);
    setSelectedPromoId(null);
    setCustomerName('Cliente Mostrador');
    setPaymentMethod(PAYMENT_METHODS[0]);
    setIsSaleModalOpen(true);
  };

  // Pricing calculations for current sale modal with dynamic promotions
  const unitCost = selectedCookie ? selectedCookie.recipe_cost : 9.67;
  const standardPrice = selectedCookie ? selectedCookie.sale_price : 35.0;

  const activeCookiePromos = promotions.filter((p) => {
    if (!p.is_active) return false;
    if (p.target_type === 'all_products' || p.target_type === 'order_total') return true;
    if (p.target_type === 'specific_products') {
      return (p.target_product_ids || []).includes(selectedCookie?.id || 0);
    }
    return true;
  });

  const selectedPromo = activeCookiePromos.find((p) => p.id === selectedPromoId) || null;
  const rawSubtotal = standardPrice * saleQty;
  let promoDiscount = 0;
  let isPromoActive = false;

  if (selectedPromo) {
    if (saleQty >= selectedPromo.min_quantity && rawSubtotal >= selectedPromo.min_order_amount) {
      isPromoActive = true;
      if (selectedPromo.promo_type === 'combo_fixed_price') {
        const combos = Math.floor(saleQty / selectedPromo.min_quantity);
        const normalComboVal = standardPrice * selectedPromo.min_quantity;
        const savingsPerCombo = Math.max(0, normalComboVal - selectedPromo.discount_value);
        promoDiscount = combos * savingsPerCombo;
      } else if (selectedPromo.promo_type === 'percentage') {
        promoDiscount = rawSubtotal * (selectedPromo.discount_value / 100);
      } else if (selectedPromo.promo_type === 'fixed_amount') {
        promoDiscount = Math.min(rawSubtotal, selectedPromo.discount_value);
      } else if (selectedPromo.promo_type === 'two_for_one') {
        const freeUnits = Math.floor(saleQty / 2);
        promoDiscount = freeUnits * standardPrice;
      }
    }
  }

  promoDiscount = Math.round(promoDiscount * 100) / 100;
  const currentTotalRevenue = Math.max(0, rawSubtotal - promoDiscount);
  const effectiveUnitPrice = saleQty > 0 ? currentTotalRevenue / saleQty : standardPrice;
  const currentTotalCost = unitCost * saleQty;
  const currentNetProfit = currentTotalRevenue - currentTotalCost;
  const currentRoi = currentTotalCost > 0 ? (currentNetProfit / currentTotalCost) * 100 : 0;

  const handleSelectPromo = (promo: Promotion | null) => {
    if (!promo) {
      setSelectedPromoId(null);
      return;
    }
    setSelectedPromoId(promo.id);
    if (saleQty < promo.min_quantity) {
      setSaleQty(promo.min_quantity);
    }
  };

  const handleConfirmSale = async () => {
    if (!selectedCookie || saleQty <= 0) return;

    await addCookieSale({
      cookie_id: selectedCookie.id,
      quantity: saleQty,
      unit_price: Number(effectiveUnitPrice.toFixed(2)),
      customer_name: customerName.trim(),
      payment_method: paymentMethod,
      notes: selectedPromo && isPromoActive
        ? `${selectedPromo.name} (${selectedPromo.badge_text}) • Descuento: -$${promoDiscount.toFixed(2)}`
        : `Venta Individual (${saleQty} pza a $${effectiveUnitPrice.toFixed(2)} c/u)`,
      promotion_id: selectedPromo?.id,
      promotion_name: selectedPromo?.name,
      discount_amount: promoDiscount,
    });

    setIsSaleModalOpen(false);
    Alert.alert(
      '¡Venta Registrada!',
      `Cobraste $${currentTotalRevenue.toFixed(2)} MXN y ganaste +$${currentNetProfit.toFixed(2)} MXN netos (${currentRoi.toFixed(0)}% rendimiento).`
    );
  };

  const handleDeleteIngredient = (ing: Ingredient) => {
    confirmAction({
      title: '¿Eliminar Insumo?',
      message: `¿Deseas eliminar "${ing.name}" de la lista de materias primas?`,
      confirmText: 'Sí, Eliminar',
      type: 'danger',
      onConfirm: async () => {
        await deleteIngredient(ing.id);
      },
    });
  };

  const handleEditPromotion = (promo: Promotion) => {
    setEditingPromotion(promo);
    setIsAddPromoOpen(true);
  };

  const handleDeletePromotion = (promo: Promotion) => {
    confirmAction({
      title: '¿Eliminar Promoción?',
      message: `¿Deseas eliminar la promoción "${promo.name}"? Ya no estará disponible para aplicar en ventas ni pedidos.`,
      confirmText: 'Sí, Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deletePromotion(promo.id);
        } catch (err: any) {
          Alert.alert('Error', err?.message || 'No se pudo eliminar la promoción.');
        }
      },
    });
  };

  const handleOpenAddOrder = () => {
    setEditingOrder(null);
    setIsOrderModalOpen(true);
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setIsOrderModalOpen(true);
  };

  const handleSaveOrder = async (orderData: Partial<Order>) => {
    if (editingOrder) {
      const prevStatus = editingOrder.payment_status;
      await updateOrder(editingOrder.id, orderData);

      // Si el pedido pasó o está en Pagado, registrar en ventas cobradas
      if (orderData.payment_status === 'Pagado') {
        const alreadyRegistered = sales.some(
          (s) => (s as any).order_id === editingOrder.id || (s.notes && s.notes.includes(`Pedido #${editingOrder.id}`))
        );
        if (!alreadyRegistered && orderData.items && orderData.items.length > 0) {
          for (const item of orderData.items) {
            await addCookieSale({
              cookie_id: item.product_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              customer_name: orderData.customer_name,
              payment_method: orderData.payment_method || 'Efectivo',
              notes: `Pedido #${editingOrder.id} • ${orderData.customer_name}${orderData.promotion_name ? ` (${orderData.promotion_name})` : ''}`,
              promotion_id: orderData.promotion_id,
              promotion_name: orderData.promotion_name,
              discount_amount: orderData.discount_amount,
              sale_date: orderData.delivery_date || new Date().toISOString().split('T')[0],
              order_id: editingOrder.id,
            } as any);
          }
        }
      } else if (prevStatus === 'Pagado') {
        const salesToDelete = sales.filter(
          (s) => (s as any).order_id === editingOrder.id || (s.notes && s.notes.includes(`Pedido #${editingOrder.id}`))
        );
        for (const s of salesToDelete) {
          await deleteCookieSale(s.id);
        }
      }

      await loadAllData();
      Alert.alert('Pedido Actualizado', `El pedido de ${orderData.customer_name} ha sido modificado.`);
    } else {
      const created = await addOrder(orderData);
      if (orderData.payment_status === 'Pagado' && created) {
        if (orderData.items && orderData.items.length > 0) {
          for (const item of orderData.items) {
            await addCookieSale({
              cookie_id: item.product_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              customer_name: orderData.customer_name,
              payment_method: orderData.payment_method || 'Efectivo',
              notes: `Pedido #${created.id} • ${orderData.customer_name}${orderData.promotion_name ? ` (${orderData.promotion_name})` : ''}`,
              promotion_id: orderData.promotion_id,
              promotion_name: orderData.promotion_name,
              discount_amount: orderData.discount_amount,
              sale_date: orderData.delivery_date || new Date().toISOString().split('T')[0],
              order_id: created.id,
            } as any);
          }
        }
      }
      await loadAllData();
      Alert.alert(
        '¡Pedido Agendado!',
        orderData.payment_status === 'Pagado'
          ? `Se agendó el pedido de ${orderData.customer_name} y se registró en Ventas Cobradas e Ingresos.`
          : `Se agendó el pedido para ${orderData.customer_name}.`
      );
    }
  };

  const handlePaymentStatusChange = async (id: number, nextPaymentStatus: Order['payment_status']) => {
    const order = orders.find((o) => o.id === id);
    if (!order) return;

    if (order.payment_status === nextPaymentStatus) return;
    const prevPaymentStatus = order.payment_status;

    await updateOrder(id, { payment_status: nextPaymentStatus });

    // Cuando pasa a PAGADO:
    if (nextPaymentStatus === 'Pagado') {
      const alreadyRegistered = sales.some(
        (s) => (s as any).order_id === id || (s.notes && s.notes.includes(`Pedido #${id}`))
      );

      if (!alreadyRegistered && order.items && order.items.length > 0) {
        for (const item of order.items) {
          await addCookieSale({
            cookie_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            customer_name: order.customer_name,
            payment_method: order.payment_method || 'Efectivo',
            notes: `Pedido #${order.id} • ${order.customer_name}${order.promotion_name ? ` (${order.promotion_name})` : ''}`,
            promotion_id: order.promotion_id,
            promotion_name: order.promotion_name,
            discount_amount: order.discount_amount,
            sale_date: order.delivery_date || new Date().toISOString().split('T')[0],
            order_id: order.id,
          } as any);
        }
      }

      await loadAllData();
      Alert.alert(
        '¡Pedido Pagado!',
        `El pedido de ${order.customer_name} pasó a Pagado y sus galletas se registraron en Ventas Cobradas e Ingresos.`
      );
    } else if (prevPaymentStatus === 'Pagado') {
      // Cuando cambia de Pagado a Pendiente o Anticipo:
      const salesToDelete = sales.filter(
        (s) => (s as any).order_id === id || (s.notes && s.notes.includes(`Pedido #${id}`))
      );
      for (const s of salesToDelete) {
        await deleteCookieSale(s.id);
      }
      await loadAllData();
      Alert.alert(
        'Estatus Actualizado',
        `El cobro del pedido se cambió a ${nextPaymentStatus}. Se ajustó el historial de ventas.`
      );
    }
  };

  const handleDeleteOrder = (id: number) => {
    const ord = orders.find((o) => o.id === id);
    confirmAction({
      title: '¿Eliminar Pedido?',
      message: `¿Deseas eliminar el pedido de "${ord?.customer_name || 'Cliente'}"?`,
      confirmText: 'Sí, Eliminar',
      type: 'danger',
      onConfirm: async () => {
        // Eliminar ventas asociadas si estuviera pagado
        const salesToDelete = sales.filter(
          (s) => (s as any).order_id === id || (s.notes && s.notes.includes(`Pedido #${id}`))
        );
        for (const s of salesToDelete) {
          await deleteCookieSale(s.id);
        }
        await deleteOrder(id);
      },
    });
  };

  const handleStatusChange = async (id: number, nextStatus: Order['status']) => {
    await updateOrder(id, { status: nextStatus });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgPrimary }]}>
      <SwipeTabWrapper currentRoute="/cookies">
        <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1, minWidth: 130, marginRight: 6 }}>
            <Text style={[styles.screenEyebrow, { color: colors.amberLight }]}>Repostería Artesanal</Text>
            <Text style={[styles.screenTitle, { color: colors.textMain }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              Lucky Cookies
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexShrink: 0 }}>
            <TouchableOpacity
              onPress={toggleTheme}
              style={{
                width: 32,
                height: 32,
                borderRadius: radii.pill,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                backgroundColor: colors.bgCard,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name={theme === 'dark' ? 'sunny' : 'moon'}
                size={16}
                color={theme === 'dark' ? colors.amberLight : colors.textMuted}
              />
            </TouchableOpacity>

            <BackendHeartbeat compact onPress={() => router.push('/settings')} />
            <Badge label={`${avgMargin.toFixed(0)}%`} variant="emerald" />
          </View>
        </View>

        {/* Hero Revenue & Profit Bento Box */}
        <DoubleBezelCard
          style={styles.statsCard}
          gradient={theme === 'dark' ? ['#1C202B', '#14171F'] : ['#FFFFFF', '#F8FAFC']}
        >
          <View style={styles.statsRow}>
            <View>
              <Text style={[styles.statsLabel, { color: colors.textDim }]}>Ganancia Neta Libre</Text>
              <Text style={[styles.profitValue, { color: colors.emeraldLight }]}>
                {privacyMode ? '••••••' : `+$${totalProfit.toFixed(2)}`}
              </Text>
              <Text style={[styles.statsSub, { color: colors.textDim }]}>{totalUnits} galletas vendidas</Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.statsLabel, { color: colors.textDim }]}>Total Ingresos</Text>
              <Text style={[styles.revenueValue, { color: colors.amberLight }]}>
                {privacyMode ? '••••••' : `$${totalRevenue.toFixed(2)}`}
              </Text>
              <Text style={[styles.statsSub, { color: colors.textDim }]}>{sales.length} ventas registradas</Text>
            </View>
          </View>

          {/* Unit Economics Highlights Bar (Screenshot 4) - Tap to edit batch parameters & profit */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              if (cookies.length > 0) {
                setEditingCookieProduct(cookies[0]);
              }
            }}
            style={[styles.economicsMiniBar, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
          >
            <View style={{ flex: 1, paddingRight: 6 }}>
              <Text style={[styles.economicsMiniText, { color: colors.textMuted }]}>
                {privacyMode
                  ? '🍪 Tanda: 16 pzas • Insumo: •••••• • Empaque: •••••• • Total: ••••••'
                  : '🍪 Tanda: 16 pzas • Insumo: $6.77 • Empaque: $2.90 • Total Lote: $9.67'}
              </Text>
            </View>
            <View style={[styles.editTandaBadge, { backgroundColor: colors.amberBg, borderColor: colors.amberBorder }]}>
              <Ionicons name="pencil" size={11} color={colors.amberLight} />
              <Text style={[styles.editTandaText, { color: colors.amberLight }]}>Editar Tanda</Text>
            </View>
          </TouchableOpacity>
        </DoubleBezelCard>

        {/* 5 Sub-tabs scrollable pills with vibrant gradients */}
        <View style={styles.tabToggleWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabToggleRow}
          >
            {[
              { key: 'catalog', label: `Recetas (${cookies.length})`, icon: 'cafe', grad: gradients.amber },
              { key: 'ingredients', label: `Insumos (${ingredients.length})`, icon: 'nutrition', grad: gradients.purple },
              { key: 'sales', label: `Ventas (${sales.length})`, icon: 'cart', grad: gradients.emerald },
              { key: 'promotions', label: `Promos (${promotions.length})`, icon: 'pricetag', grad: gradients.rose },
              { key: 'orders', label: `Pedidos (${orders.length})`, icon: 'bag-check', grad: gradients.brand },
            ].map((tab) => {
              const isActive = subTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setSubTab(tab.key as any)}
                  activeOpacity={0.8}
                  style={styles.toggleBtnContainer}
                >
                  {isActive ? (
                    <LinearGradient
                      colors={tab.grad as any}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.toggleBtnActiveGradient}
                    >
                      <Ionicons name={tab.icon as any} size={14} color="#FFFFFF" />
                      <Text style={styles.toggleBtnTextActive}>{tab.label}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.toggleBtnInactive, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}>
                      <Ionicons name={tab.icon as any} size={14} color={colors.textDim} />
                      <Text style={[styles.toggleBtnText, { color: colors.textMuted }]}>{tab.label}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* SUBTAB 1: CATALOG & RECIPES */}
        {subTab === 'catalog' && (
          <View style={{ flex: 1 }}>
            <View style={styles.subtabActionBar}>
              <Text style={[styles.subtabTitle, { color: colors.textMain }]}>Catálogo & Precios de Venta</Text>
              <Button
                title="+ Receta"
                variant="amber"
                icon={<Ionicons name="add" size={16} color="#fff" />}
                onPress={() => setIsAddCookieOpen(true)}
                style={{ paddingVertical: 6, paddingHorizontal: 12 }}
              />
            </View>

            <FlatList
              data={cookies}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <CookieCard
                  cookie={item}
                  privacyMode={privacyMode}
                  onSell={handleOpenSale}
                  onInspect={(c) => setInspectedCookie(c)}
                  onLongPress={(c) => setActionSheetCookie(c)}
                />
              )}
              contentContainerStyle={{ paddingBottom: 110 }}
              onRefresh={loadAllData}
              refreshing={isLoading}
            />
          </View>
        )}

        {/* SUBTAB 2: INGREDIENTS & RAW MATERIALS */}
        {subTab === 'ingredients' && (
          <View style={{ flex: 1 }}>
            <View style={styles.subtabActionBar}>
              <Text style={[styles.subtabTitle, { color: colors.textMain }]}>Insumos & Materia Prima</Text>
              <Button
                title="+ Insumo"
                variant="primary"
                icon={<Ionicons name="add" size={16} color="#fff" />}
                onPress={() => {
                  setEditingIngredient(null);
                  setIsAddIngredientOpen(true);
                }}
                style={{ paddingVertical: 6, paddingHorizontal: 12 }}
              />
            </View>

            <FlatList
              data={ingredients}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <DoubleBezelCard style={{ marginBottom: 10 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: colors.textMain }}>
                        {item.name}
                      </Text>
                      {stockAlertsEnabled && item.stock_quantity <= 2 ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                          <View style={{ backgroundColor: colors.roseBg, borderColor: colors.roseBorder, borderWidth: 1, borderRadius: radii.sm, paddingHorizontal: 6, paddingVertical: 2 }}>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: colors.roseText }}>
                              ⚠️ Stock Crítico: {item.stock_quantity} {item.unit} restantes
                            </Text>
                          </View>
                        </View>
                      ) : (
                        <Text style={{ fontSize: 11, color: colors.textDim, marginTop: 2 }}>
                          {item.supplier} • Stock: {item.stock_quantity} {item.unit}
                        </Text>
                      )}
                      <Text style={{ fontSize: 11, color: colors.amberLight, marginTop: 2 }}>
                        Paquete: ${item.package_cost.toFixed(2)} / {item.package_quantity} {item.unit}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                      <Text style={{ fontSize: 14, fontWeight: '900', color: colors.emeraldLight }}>
                        ${item.cost_per_unit.toFixed(3)} / {item.unit}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <TouchableOpacity
                          onPress={() => {
                            setEditingIngredient(item);
                            setIsAddIngredientOpen(true);
                          }}
                          style={{
                            padding: 6,
                            borderRadius: radii.sm,
                            backgroundColor: colors.bgTertiary,
                            borderWidth: 1,
                            borderColor: colors.borderSubtle,
                          }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="pencil" size={14} color={colors.textMain} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteIngredient(item)}
                          style={{
                            padding: 6,
                            borderRadius: radii.sm,
                            backgroundColor: colors.bgTertiary,
                            borderWidth: 1,
                            borderColor: colors.borderSubtle,
                          }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="trash-outline" size={14} color={colors.rose} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </DoubleBezelCard>
              )}
              contentContainerStyle={{ paddingBottom: 110 }}
              onRefresh={loadAllData}
              refreshing={isLoading}
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <Ionicons name="nutrition-outline" size={40} color={colors.textDim} />
                  <Text style={styles.emptyTitle}>Sin Insumos Registrados</Text>
                  <Text style={styles.emptyText}>Agrega tu primer insumo para calcular costos.</Text>
                </View>
              }
            />
          </View>
        )}

        {/* SUBTAB 3: SALES HISTORY */}
        {subTab === 'sales' && (
          <View style={{ flex: 1 }}>
            <View style={styles.subtabActionBar}>
              <Text style={[styles.subtabTitle, { color: colors.textMain }]}>Historial de Ventas Cobradas</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textDim }}>
                {sales.length} registros
              </Text>
            </View>

            <FlatList
              data={sales}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => setSelectedSale(item)}
                >
                  <DoubleBezelCard style={{ marginBottom: 10 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: colors.textMain }}>
                          {item.quantity}x {item.cookie_name}
                        </Text>
                        <Text style={{ fontSize: 11, color: colors.textDim, marginTop: 2 }}>
                          {item.sale_date} • {item.customer_name} • {item.payment_method}
                        </Text>
                        {item.notes ? (
                          <Text
                            style={{ fontSize: 11, color: colors.amberLight, marginTop: 2 }}
                            numberOfLines={1}
                          >
                            {item.notes}
                          </Text>
                        ) : null}
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text
                          style={{ fontSize: 16, fontWeight: '900', color: colors.amberLight }}
                        >
                          ${item.total_revenue.toFixed(2)}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '800',
                            color: colors.emeraldLight,
                            marginTop: 2,
                          }}
                        >
                          +${item.net_profit.toFixed(2)} neta
                        </Text>
                      </View>
                    </View>
                  </DoubleBezelCard>
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingBottom: 110 }}
              onRefresh={loadAllData}
              refreshing={isLoading}
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <Ionicons name="cart-outline" size={40} color={colors.textDim} />
                  <Text style={styles.emptyTitle}>Sin Ventas Aún</Text>
                  <Text style={styles.emptyText}>Registra tu primera venta para ver ganancias.</Text>
                </View>
              }
            />
          </View>
        )}

        {/* SUBTAB 4: PROMOTIONS */}
        {subTab === 'promotions' && (
          <View style={{ flex: 1 }}>
            <View style={styles.subtabActionBar}>
              <View>
                <Text style={[styles.subtabTitle, { color: colors.textMain }]}>Promociones & Ofertas Activas</Text>
                <Text style={{ fontSize: 11, color: colors.textDim, marginTop: 2 }}>Mantén pulsada una promoción para editarla</Text>
              </View>
              <Button
                title="+ Oferta"
                variant="amber"
                icon={<Ionicons name="add" size={16} color="#fff" />}
                onPress={() => {
                  setEditingPromotion(null);
                  setIsAddPromoOpen(true);
                }}
                style={{ paddingVertical: 6, paddingHorizontal: 12 }}
              />
            </View>

            <FlatList
              data={promotions}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => {
                const color = item.color_tag || '#F59E0B';
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.82}
                    delayLongPress={350}
                    onLongPress={() => handleEditPromotion(item)}
                    style={{ marginBottom: 12 }}
                  >
                    <DoubleBezelCard style={{ opacity: item.is_active ? 1 : 0.65 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                          <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${color}20`, alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name="pricetag" size={16} color={color} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 15, fontWeight: '800', color: colors.textMain }}>{item.name}</Text>
                            <Text style={{ fontSize: 11, color: colors.textDim }}>
                              {item.target_type === 'all_products' ? 'Todo el Menú' : item.target_type === 'specific_products' ? 'Productos seleccionados' : 'Total de orden'}
                            </Text>
                          </View>
                        </View>
                        <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, backgroundColor: item.is_active ? color : colors.textMuted }}>
                          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{item.badge_text}</Text>
                        </View>
                      </View>

                      <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 10 }}>
                        {item.description || 'Sin descripción.'}
                      </Text>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.borderSubtle, paddingTop: 8 }}>
                        <TouchableOpacity
                          onPress={() => togglePromotion(item.id)}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                        >
                          <Ionicons
                            name={item.is_active ? 'checkmark-circle' : 'pause-circle'}
                            size={18}
                            color={item.is_active ? colors.emeraldLight : colors.textMuted}
                          />
                          <Text style={{ fontSize: 12, fontWeight: '700', color: item.is_active ? colors.emeraldLight : colors.textMuted }}>
                            {item.is_active ? 'Activa' : 'Pausada'}
                          </Text>
                        </TouchableOpacity>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <TouchableOpacity
                            onPress={() => handleEditPromotion(item)}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            style={{
                              padding: 6,
                              borderRadius: 8,
                              backgroundColor: colors.isDark ? 'rgba(59, 130, 246, 0.12)' : '#EFF6FF',
                            }}
                          >
                            <Ionicons name="pencil" size={16} color="#3B82F6" />
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => handleDeletePromotion(item)}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            style={{
                              padding: 6,
                              borderRadius: 8,
                              backgroundColor: colors.isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
                            }}
                          >
                            <Ionicons name="trash-outline" size={17} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </DoubleBezelCard>
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={{ paddingBottom: 110 }}
              onRefresh={loadAllData}
              refreshing={isLoading}
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <Ionicons name="pricetag-outline" size={40} color={colors.textDim} />
                  <Text style={styles.emptyTitle}>Sin Promociones</Text>
                  <Text style={styles.emptyText}>Toca "+ Oferta" para crear combos 3x$90 o 15% OFF.</Text>
                </View>
              }
            />
          </View>
        )}

        {/* SUBTAB 5: ORDERS & DELIVERIES */}
        {subTab === 'orders' && (
          <View style={{ flex: 1 }}>
            <View style={styles.subtabActionBar}>
              <View>
                <Text style={[styles.subtabTitle, { color: colors.textMain }]}>Pedidos de Clientes</Text>
                <Text style={{ fontSize: 11, color: colors.textDim }}>
                  {orders.filter((o) => o.status === 'Pendiente' || o.status === 'En Preparación').length} por hornear / entregar
                </Text>
              </View>
              <Button
                title="+ Pedido"
                variant="amber"
                icon={<Ionicons name="add" size={16} color="#fff" />}
                onPress={handleOpenAddOrder}
                style={{ paddingVertical: 6, paddingHorizontal: 12 }}
              />
            </View>

            {/* Status Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flexGrow: 0, marginBottom: 14 }}
              contentContainerStyle={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingVertical: 4,
                paddingHorizontal: 2,
              }}
            >
              {['Todos', 'Pendiente', 'En Preparación', 'Listo', 'Completado'].map((statusChip) => (
                <TouchableOpacity
                  key={statusChip}
                  onPress={() => setOrderStatusFilter(statusChip)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: orderStatusFilter === statusChip ? colors.brandBg : colors.bgCard,
                      borderColor: orderStatusFilter === statusChip ? colors.brandBorder : colors.borderSubtle,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      {
                        color: orderStatusFilter === statusChip ? colors.brandText : colors.textMuted,
                        fontWeight: orderStatusFilter === statusChip ? '800' : '600',
                      },
                    ]}
                  >
                    {statusChip === 'En Preparación' ? 'En Horno' : statusChip}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <FlatList
              data={orders.filter((o) => orderStatusFilter === 'Todos' || o.status === orderStatusFilter)}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <OrderCard
                  order={item}
                  onEdit={handleEditOrder}
                  onDelete={handleDeleteOrder}
                  onStatusChange={handleStatusChange}
                  onPaymentStatusChange={handlePaymentStatusChange}
                />
              )}
              contentContainerStyle={{ paddingBottom: 110 }}
              onRefresh={loadAllData}
              refreshing={isLoading}
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <Ionicons name="bag-check-outline" size={40} color={colors.textDim} />
                  <Text style={styles.emptyTitle}>Sin Pedidos</Text>
                  <Text style={styles.emptyText}>
                    {orderStatusFilter === 'Todos'
                      ? 'Toca "+ Pedido" para agendar tu primer pedido personalizado.'
                      : `No hay pedidos con estatus "${orderStatusFilter}".`}
                  </Text>
                </View>
              }
            />
          </View>
        )}
      </View>
      </SwipeTabWrapper>

      {/* Cookie Recipe Ingredients Detail Modal */}
      <CookieRecipeDetailModal
        visible={!!inspectedCookie}
        cookie={inspectedCookie}
        onClose={() => setInspectedCookie(null)}
        onSell={handleOpenSale}
        onDeleteCookie={deleteCookieProduct}
      />

      {/* Edit Cookie Recipe & Batch Profit Modal */}
      <EditCookieModal
        visible={!!editingCookieProduct}
        cookie={editingCookieProduct}
        onClose={() => setEditingCookieProduct(null)}
        onUpdateCookie={updateCookieProduct}
      />

      {/* Cookie Quick Actions Sheet (Long-Press Menu) */}
      <Modal
        visible={!!actionSheetCookie}
        animationType="slide"
        transparent
        onRequestClose={() => setActionSheetCookie(null)}
      >
        <TouchableOpacity
          style={styles.actionSheetBackdrop}
          activeOpacity={1}
          onPress={() => setActionSheetCookie(null)}
        >
          {actionSheetCookie && (
            <TouchableOpacity
              activeOpacity={1}
              style={[
                styles.actionSheetDialog,
                {
                  backgroundColor: colors.bgCard,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              {/* Drag Handle Bar */}
              <View style={styles.sheetHandleWrapper}>
                <View style={[styles.sheetHandleBar, { backgroundColor: colors.borderSubtle }]} />
              </View>

              {/* Header with cookie info */}
              <View style={styles.actionSheetHeader}>
                <Image source={{ uri: actionSheetCookie.image_url }} style={styles.actionSheetImg} />
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={[styles.actionSheetTitle, { color: colors.textMain }]} numberOfLines={1}>
                    {actionSheetCookie.name}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <Badge label={`$${actionSheetCookie.sale_price.toFixed(2)} MXN`} variant="amber" />
                    <Badge label={`Tanda: ${actionSheetCookie.batch_yield || 16} pzas`} variant="gray" />
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setActionSheetCookie(null)}
                  style={[styles.actionSheetCloseCircle, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
                >
                  <Ionicons name="close" size={18} color={colors.textMain} />
                </TouchableOpacity>
              </View>

              <View style={[styles.actionSheetDivider, { backgroundColor: colors.borderSubtle }]} />

              {/* Option 1: Ver Receta & Costos */}
              <TouchableOpacity
                style={[styles.actionSheetItem, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
                onPress={() => {
                  const target = actionSheetCookie;
                  setActionSheetCookie(null);
                  setInspectedCookie(target);
                }}
              >
                <View style={[styles.actionSheetIconBox, { backgroundColor: colors.amberBg }]}>
                  <Ionicons name="book" size={19} color={colors.amberLight} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actionSheetItemTitle, { color: colors.textMain }]}>Ver Receta & Costos</Text>
                  <Text style={[styles.actionSheetItemSub, { color: colors.textDim }]}>
                    Desglose de insumos, ganancia y promociones
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={17} color={colors.textDim} />
              </TouchableOpacity>

              {/* Option 2: Editar Receta & Tanda */}
              <TouchableOpacity
                style={[styles.actionSheetItem, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
                onPress={() => {
                  const target = actionSheetCookie;
                  setActionSheetCookie(null);
                  setEditingCookieProduct(target);
                }}
              >
                <View style={[styles.actionSheetIconBox, { backgroundColor: colors.emeraldBg }]}>
                  <Ionicons name="pencil" size={19} color={colors.emeraldLight} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actionSheetItemTitle, { color: colors.textMain }]}>Editar Receta & Tanda</Text>
                  <Text style={[styles.actionSheetItemSub, { color: colors.textDim }]}>
                    Modificar piezas por tanda, insumos y ganancia libre
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={17} color={colors.textDim} />
              </TouchableOpacity>

              {/* Option 3: Registrar Venta Rápida */}
              <TouchableOpacity
                style={[styles.actionSheetItem, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
                onPress={() => {
                  const target = actionSheetCookie;
                  setActionSheetCookie(null);
                  handleOpenSale(target);
                }}
              >
                <View style={[styles.actionSheetIconBox, { backgroundColor: colors.brandGlow }]}>
                  <Ionicons name="flash" size={19} color={colors.brandLight} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actionSheetItemTitle, { color: colors.textMain }]}>Registrar Venta Rápida</Text>
                  <Text style={[styles.actionSheetItemSub, { color: colors.textDim }]}>
                    Cobro directo de mostrador con promos automáticas
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={17} color={colors.textDim} />
              </TouchableOpacity>

              {/* Option 4: Cambiar Foto */}
              <TouchableOpacity
                style={[styles.actionSheetItem, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
                onPress={() => {
                  const target = actionSheetCookie;
                  setActionSheetCookie(null);
                  setEditingCookieProduct(target);
                }}
              >
                <View style={[styles.actionSheetIconBox, { backgroundColor: colors.purpleBg }]}>
                  <Ionicons name="camera" size={19} color={colors.purpleLight} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actionSheetItemTitle, { color: colors.textMain }]}>Cambiar Foto</Text>
                  <Text style={[styles.actionSheetItemSub, { color: colors.textDim }]}>
                    Tomar foto con la cámara o seleccionar de galería
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={17} color={colors.textDim} />
              </TouchableOpacity>

              {/* Option 5: Eliminar Galleta */}
              <TouchableOpacity
                style={[
                  styles.actionSheetItem,
                  {
                    backgroundColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
                    borderColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.35)' : '#FECDD3',
                  },
                ]}
                onPress={() => {
                  const target = actionSheetCookie;
                  setActionSheetCookie(null);
                  confirmAction({
                    title: '¿Eliminar Galleta?',
                    message: `¿Estás seguro de eliminar permanentemente "${target.name}" del catálogo?`,
                    confirmText: 'Sí, Eliminar',
                    type: 'danger',
                    onConfirm: async () => {
                      await deleteCookieProduct(target.id);
                    },
                  });
                }}
              >
                <View style={[styles.actionSheetIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.22)' }]}>
                  <Ionicons name="trash" size={19} color="#EF4444" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#EF4444' }}>Eliminar Galleta</Text>
                  <Text style={{ fontSize: 11, lineHeight: 16, color: theme === 'dark' ? '#FCA5A5' : '#991B1B', marginTop: 2 }}>
                    Quitar permanentemente del catálogo y recetas
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={17} color="#EF4444" />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </Modal>

      {/* Sale Detail Receipt Modal */}
      <SaleDetailModal
        visible={!!selectedSale}
        sale={selectedSale}
        onClose={() => setSelectedSale(null)}
        onDeleteSale={deleteCookieSale}
      />

      {/* Add Cookie Recipe Modal */}
      <AddCookieModal
        visible={isAddCookieOpen}
        onClose={() => setIsAddCookieOpen(false)}
        onAddCookie={addCookieProduct}
      />

      {/* Add / Edit Ingredient Modal */}
      <AddIngredientModal
        visible={isAddIngredientOpen}
        onClose={() => {
          setIsAddIngredientOpen(false);
          setEditingIngredient(null);
        }}
        onAddIngredient={addIngredient}
        onUpdateIngredient={updateIngredient}
        editingIngredient={editingIngredient}
      />

      {/* Add / Edit Promotion Modal */}
      <AddPromotionModal
        visible={isAddPromoOpen}
        onClose={() => {
          setIsAddPromoOpen(false);
          setEditingPromotion(null);
        }}
        cookies={cookies}
        onAddPromotion={addPromotion}
        promotionToEdit={editingPromotion}
        onUpdatePromotion={updatePromotion}
      />

      {/* Add / Edit Order Modal */}
      <OrderModal
        visible={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        cookies={cookies}
        promotions={promotions}
        customers={customers}
        editingOrder={editingOrder}
        onSave={handleSaveOrder}
        onSaveCustomer={addCustomer}
      />

      {/* Quick Sale Stepper Modal */}
      <Modal visible={isSaleModalOpen} animationType="slide" transparent onRequestClose={() => setIsSaleModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalDialog, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.borderSubtle }]}>
              <View>
                <Text style={[styles.modalEyebrow, { color: colors.amberLight }]}>Caja Registradora</Text>
                <Text style={[styles.modalTitle, { color: colors.textMain }]}>Registrar Venta de Galleta</Text>
              </View>
              <TouchableOpacity onPress={() => setIsSaleModalOpen(false)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {selectedCookie && (
              <ScrollView style={{ padding: 20 }} showsVerticalScrollIndicator={false}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textMain, textAlign: 'center' }}>
                  {selectedCookie.name}
                </Text>
                <Text
                  style={{ fontSize: 12, color: colors.textDim, textAlign: 'center', marginTop: 2 }}
                >
                  Costo Lote c/empaque: ${selectedCookie.recipe_cost.toFixed(2)} • Ganas +$
                  {selectedCookie.profit_per_unit.toFixed(2)} c/u
                </Text>

                {/* Selector Dinámico de Promociones en Venta Rápida */}
                <Text style={[styles.formLabel, { color: colors.textMuted }]}>Promoción / Oferta</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      style={[
                        styles.schemeBtn,
                        { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle },
                        selectedPromoId === null && styles.schemeBtnActive,
                      ]}
                      onPress={() => handleSelectPromo(null)}
                    >
                      <Text style={[styles.schemeBtnTitle, { color: colors.textMain }, selectedPromoId === null && { color: colors.amberLight }]}>
                        Precio Normal
                      </Text>
                      <Text style={[styles.schemeBtnSub, { color: colors.textDim }]}>${standardPrice.toFixed(2)} c/u</Text>
                    </TouchableOpacity>

                    {activeCookiePromos.map((p) => {
                      const isSelected = selectedPromoId === p.id;
                      const color = p.color_tag || '#F59E0B';
                      return (
                        <TouchableOpacity
                          key={p.id}
                          style={[
                            styles.schemeBtn,
                            { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle },
                            isSelected && { borderColor: color, backgroundColor: `${color}20` },
                          ]}
                          onPress={() => handleSelectPromo(p)}
                        >
                          <Text style={[styles.schemeBtnTitle, { color: colors.textMain }, isSelected && { color: color }]}>
                            {p.name}
                          </Text>
                          <Text style={[styles.schemeBtnSub, { color: colors.textDim }]}>{p.badge_text}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>

                {/* Quantity Stepper */}
                <View style={styles.stepperContainer}>
                  <TouchableOpacity
                    style={[styles.stepperBtn, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
                    onPress={() => setSaleQty(Math.max(1, saleQty - 1))}
                  >
                    <Ionicons name="remove" size={20} color={colors.textMain} />
                  </TouchableOpacity>
                  <Text style={[styles.stepperNum, { color: colors.textMain }]}>{saleQty}</Text>
                  <TouchableOpacity
                    style={[styles.stepperBtn, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
                    onPress={() => setSaleQty(saleQty + 1)}
                  >
                    <Ionicons name="add" size={20} color={colors.textMain} />
                  </TouchableOpacity>
                </View>

                {/* Live Revenue and Net Profit Preview */}
                <View style={[styles.saleMetricsBox, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={[styles.saleMetricLabel, { color: colors.textDim }]}>Total a Cobrar</Text>
                    <Text style={[styles.saleMetricValueYellow, { color: colors.amberLight }]}>
                      ${currentTotalRevenue.toFixed(2)} MXN
                    </Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={[styles.saleMetricLabel, { color: colors.textDim }]}>Tu Ganancia Libre</Text>
                    <Text style={[styles.saleMetricValueGreen, { color: colors.emeraldLight }]}>
                      +${currentNetProfit.toFixed(2)} MXN
                    </Text>
                    <Text style={{ fontSize: 10, color: colors.emeraldLight, fontWeight: '700' }}>
                      ~{currentRoi.toFixed(0)}% rendimiento
                    </Text>
                  </View>
                </View>

                <Text style={[styles.formLabel, { color: colors.textMuted }]}>Método de Pago</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                  {PAYMENT_METHODS.map((m) => (
                    <TouchableOpacity
                      key={m}
                      onPress={() => setPaymentMethod(m)}
                      style={[
                        styles.payMethodPill,
                        { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle },
                        paymentMethod === m && styles.payMethodPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.payMethodText,
                          { color: colors.textMuted },
                          paymentMethod === m && styles.payMethodTextActive,
                        ]}
                      >
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.formLabel, { color: colors.textMuted }]}>Cliente / Destino</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, color: colors.textMain }]}
                  value={customerName}
                  onChangeText={setCustomerName}
                  placeholder="Cliente mostrador, Pedido cafetería"
                  placeholderTextColor={colors.textDim}
                />

                <Button
                  title={`Cobrar $${currentTotalRevenue.toFixed(2)} MXN`}
                  variant="amber"
                  icon={<Ionicons name="checkmark-circle" size={18} color="#fff" />}
                  onPress={handleConfirmSale}
                  style={{ marginTop: 8, marginBottom: 20 }}
                />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  modePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  screenEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.amberLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textMain,
    marginTop: 2,
  },
  statsCard: {
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textDim,
    textTransform: 'uppercase',
  },
  profitValue: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.emeraldLight,
    marginVertical: 2,
  },
  revenueValue: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.amberLight,
    marginVertical: 2,
  },
  statsSub: {
    fontSize: 11,
    color: colors.textMuted,
  },
  economicsMiniBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  economicsMiniText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tabToggleWrapper: {
    marginBottom: 12,
  },
  tabToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
    gap: 8,
  },
  toggleBtnContainer: {
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  toggleBtnActiveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
  },
  toggleBtnInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textDim,
  },
  toggleBtnTextActive: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    minHeight: 36,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: colors.brandBg,
    borderColor: colors.brandBorder,
  },
  filterChipText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: colors.textMuted,
    textAlign: 'center',
  },
  filterChipTextActive: {
    color: colors.brandText,
    fontWeight: '800',
  },
  subtabActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  subtabTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textMain,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textMain,
    marginTop: 10,
  },
  emptyText: {
    fontSize: 12,
    color: colors.textDim,
    marginTop: 4,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 24, 38, 0.45)',
    justifyContent: 'flex-end',
  },
  modalDialog: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: radii.outer,
    borderTopRightRadius: radii.outer,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  modalEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.amberLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textMain,
    marginTop: 2,
  },
  schemeButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    marginBottom: 8,
  },
  schemeBtn: {
    flex: 1,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    padding: 10,
    alignItems: 'center',
  },
  schemeBtnActive: {
    borderColor: colors.amber,
    backgroundColor: colors.amberBg,
  },
  schemeBtnActiveGreen: {
    borderColor: colors.emerald,
    backgroundColor: colors.emeraldBg,
  },
  schemeBtnTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMain,
  },
  schemeBtnSub: {
    fontSize: 10,
    color: colors.textDim,
    marginTop: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginVertical: 12,
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  stepperNum: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textMain,
  },
  saleMetricsBox: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.bgTertiary,
    borderRadius: radii.md,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  saleMetricLabel: {
    fontSize: 10,
    color: colors.textDim,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  saleMetricValueYellow: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.amberLight,
    marginTop: 2,
  },
  saleMetricValueGreen: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.emeraldLight,
    marginTop: 2,
  },
  payMethodPill: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  payMethodPillActive: {
    backgroundColor: colors.emerald,
    borderColor: colors.emerald,
  },
  payMethodText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  payMethodTextActive: {
    color: '#ffffff',
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    padding: 12,
    color: colors.textMain,
    fontSize: 13,
    marginBottom: 10,
  },
  editTandaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  editTandaText: {
    fontSize: 10,
    fontWeight: '800',
  },
  actionSheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  actionSheetDialog: {
    width: '100%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 28,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  sheetHandleWrapper: {
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 6,
  },
  sheetHandleBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
  },
  actionSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  actionSheetImg: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  actionSheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  actionSheetCloseCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSheetDivider: {
    height: 1,
    marginVertical: 4,
  },
  actionSheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  actionSheetIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSheetItemTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  actionSheetItemSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
});
