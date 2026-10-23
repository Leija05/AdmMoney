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
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii, spacing } from '../../src/theme';
import { CookieCard } from '../../src/components/cookies/CookieCard';
import { CookieRecipeDetailModal } from '../../src/components/cookies/CookieRecipeDetailModal';
import { SaleDetailModal } from '../../src/components/cookies/SaleDetailModal';
import { AddCookieModal } from '../../src/components/cookies/AddCookieModal';
import { AddIngredientModal } from '../../src/components/cookies/AddIngredientModal';
import { AddPromotionModal } from '../../src/components/cookies/AddPromotionModal';
import { OrderCard } from '../../src/components/orders/OrderCard';
import { OrderModal } from '../../src/components/orders/OrderModal';
import { DoubleBezelCard } from '../../src/components/ui/DoubleBezelCard';
import { Badge } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';
import { useAppStore } from '../../src/stores/app.store';
import { CookieProduct, CookieSale, Ingredient, Promotion, Order } from '../../src/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const PAYMENT_METHODS = ['Efectivo', 'Transferencia', 'Tarjeta Débito'];

export default function CookiesScreen() {
  const router = useRouter();
  const {
    cookies,
    sales,
    ingredients,
    promotions,
    orders,
    togglePromotion,
    deletePromotion,
    addPromotion,
    addCookieSale,
    deleteCookieSale,
    addCookieProduct,
    addIngredient,
    deleteIngredient,
    addOrder,
    updateOrder,
    deleteOrder,
    loadAllData,
    isLoading,
    useMockData,
    isOnline,
  } = useAppStore();

  const [subTab, setSubTab] = useState<'catalog' | 'ingredients' | 'sales' | 'promotions' | 'orders'>('catalog');

  // Modals state
  const [inspectedCookie, setInspectedCookie] = useState<CookieProduct | null>(null);
  const [selectedSale, setSelectedSale] = useState<CookieSale | null>(null);
  const [isAddCookieOpen, setIsAddCookieOpen] = useState(false);
  const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false);
  const [isAddPromoOpen, setIsAddPromoOpen] = useState(false);
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
    Alert.alert(
      '¿Eliminar Insumo?',
      `¿Deseas eliminar "${ing.name}" de la lista de materias primas?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteIngredient(ing.id);
            Alert.alert('Insumo Eliminado', `"${ing.name}" ha sido eliminado.`);
          },
        },
      ]
    );
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
      await updateOrder(editingOrder.id, orderData);
      Alert.alert('Pedido Actualizado', `El pedido de ${orderData.customer_name} ha sido modificado.`);
    } else {
      await addOrder(orderData);
      Alert.alert('¡Pedido Agendado!', `Se agendó el pedido para ${orderData.customer_name}.`);
    }
  };

  const handleDeleteOrder = (id: number) => {
    Alert.alert(
      '¿Eliminar Pedido?',
      '¿Estás seguro de que deseas eliminar este pedido?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteOrder(id);
            Alert.alert('Pedido Eliminado', 'El pedido se ha eliminado.');
          },
        },
      ]
    );
  };

  const handleStatusChange = async (id: number, nextStatus: Order['status']) => {
    await updateOrder(id, { status: nextStatus });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.screenEyebrow}>Repostería Artesanal</Text>
            <Text style={styles.screenTitle}>Negocio de Galletas</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => router.push('/settings')}
              style={[
                styles.modePill,
                {
                  borderColor: useMockData
                    ? 'rgba(245,158,11,0.4)'
                    : isOnline
                    ? 'rgba(16,185,129,0.4)'
                    : 'rgba(244,63,94,0.4)',
                  backgroundColor: useMockData
                    ? 'rgba(245,158,11,0.12)'
                    : isOnline
                    ? 'rgba(16,185,129,0.12)'
                    : 'rgba(244,63,94,0.12)',
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '800',
                  color: useMockData
                    ? colors.amberLight
                    : isOnline
                    ? colors.emeraldLight
                    : colors.rose,
                }}
              >
                {useMockData ? 'DEMO' : 'EN VIVO'}
              </Text>
            </TouchableOpacity>
            <Badge label={`${avgMargin.toFixed(1)}% Margen`} variant="emerald" />
          </View>
        </View>

        {/* Hero Revenue & Profit Bento Box */}
        <DoubleBezelCard style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View>
              <Text style={styles.statsLabel}>Ganancia Neta Libre</Text>
              <Text style={styles.profitValue}>+${totalProfit.toFixed(2)}</Text>
              <Text style={styles.statsSub}>{totalUnits} galletas vendidas</Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.statsLabel}>Total Ingresos</Text>
              <Text style={styles.revenueValue}>${totalRevenue.toFixed(2)}</Text>
              <Text style={styles.statsSub}>{sales.length} ventas registradas</Text>
            </View>
          </View>

          {/* Unit Economics Highlights Bar */}
          <View style={styles.economicsMiniBar}>
            <Text style={styles.economicsMiniText}>
              🍪 Tanda: 16 pzas • Insumo: $6.77 • Empaque: $2.90 • Total Lote: $9.67
            </Text>
          </View>
        </DoubleBezelCard>

        {/* 5 Sub-tabs scrollable pills */}
        <View style={styles.tabToggleWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabToggleRow}
          >
            <TouchableOpacity
              style={[styles.toggleBtn, subTab === 'catalog' && styles.toggleBtnActive]}
              onPress={() => setSubTab('catalog')}
            >
              <Ionicons
                name="cafe"
                size={14}
                color={subTab === 'catalog' ? colors.textMain : colors.textMuted}
              />
              <Text
                style={[styles.toggleBtnText, subTab === 'catalog' && styles.toggleBtnTextActive]}
              >
                Recetas ({cookies.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleBtn, subTab === 'ingredients' && styles.toggleBtnActive]}
              onPress={() => setSubTab('ingredients')}
            >
              <Ionicons
                name="nutrition"
                size={14}
                color={subTab === 'ingredients' ? colors.textMain : colors.textMuted}
              />
              <Text
                style={[
                  styles.toggleBtnText,
                  subTab === 'ingredients' && styles.toggleBtnTextActive,
                ]}
              >
                Insumos ({ingredients.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleBtn, subTab === 'sales' && styles.toggleBtnActive]}
              onPress={() => setSubTab('sales')}
            >
              <Ionicons
                name="cart"
                size={14}
                color={subTab === 'sales' ? colors.textMain : colors.textMuted}
              />
              <Text
                style={[styles.toggleBtnText, subTab === 'sales' && styles.toggleBtnTextActive]}
              >
                Ventas ({sales.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleBtn, subTab === 'promotions' && styles.toggleBtnActive]}
              onPress={() => setSubTab('promotions')}
            >
              <Ionicons
                name="pricetag"
                size={14}
                color={subTab === 'promotions' ? colors.textMain : colors.textMuted}
              />
              <Text
                style={[styles.toggleBtnText, subTab === 'promotions' && styles.toggleBtnTextActive]}
              >
                Promos ({promotions.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleBtn, subTab === 'orders' && styles.toggleBtnActive]}
              onPress={() => setSubTab('orders')}
            >
              <Ionicons
                name="bag-check"
                size={14}
                color={subTab === 'orders' ? colors.textMain : colors.textMuted}
              />
              <Text
                style={[styles.toggleBtnText, subTab === 'orders' && styles.toggleBtnTextActive]}
              >
                Pedidos ({orders.length})
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* SUBTAB 1: CATALOG & RECIPES */}
        {subTab === 'catalog' && (
          <View style={{ flex: 1 }}>
            <View style={styles.subtabActionBar}>
              <Text style={styles.subtabTitle}>Catálogo & Precios de Venta</Text>
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
                  onSell={handleOpenSale}
                  onInspect={(c) => setInspectedCookie(c)}
                />
              )}
              contentContainerStyle={{ paddingBottom: 40 }}
              onRefresh={loadAllData}
              refreshing={isLoading}
            />
          </View>
        )}

        {/* SUBTAB 2: INGREDIENTS & RAW MATERIALS */}
        {subTab === 'ingredients' && (
          <View style={{ flex: 1 }}>
            <View style={styles.subtabActionBar}>
              <Text style={styles.subtabTitle}>Insumos & Materia Prima</Text>
              <Button
                title="+ Insumo"
                variant="primary"
                icon={<Ionicons name="add" size={16} color="#fff" />}
                onPress={() => setIsAddIngredientOpen(true)}
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
                      <Text style={{ fontSize: 11, color: colors.textDim, marginTop: 2 }}>
                        {item.supplier} • Stock: {item.stock_quantity} {item.unit}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.amberLight, marginTop: 2 }}>
                        Paquete: ${item.package_cost.toFixed(2)} / {item.package_quantity} {item.unit}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Text style={{ fontSize: 14, fontWeight: '900', color: colors.emeraldLight }}>
                        ${item.cost_per_unit.toFixed(3)} / {item.unit}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleDeleteIngredient(item)}
                        style={{ padding: 4 }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="trash-outline" size={15} color={colors.rose} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </DoubleBezelCard>
              )}
              contentContainerStyle={{ paddingBottom: 40 }}
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
              <Text style={styles.subtabTitle}>Historial de Ventas Cobradas</Text>
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
              contentContainerStyle={{ paddingBottom: 40 }}
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
              <Text style={styles.subtabTitle}>Promociones & Ofertas Activas</Text>
              <Button
                title="+ Oferta"
                variant="amber"
                icon={<Ionicons name="add" size={16} color="#fff" />}
                onPress={() => setIsAddPromoOpen(true)}
                style={{ paddingVertical: 6, paddingHorizontal: 12 }}
              />
            </View>

            <FlatList
              data={promotions}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => {
                const color = item.color_tag || '#F59E0B';
                return (
                  <DoubleBezelCard style={{ marginBottom: 12, opacity: item.is_active ? 1 : 0.65 }}>
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

                      <TouchableOpacity
                        onPress={() => deletePromotion(item.id)}
                        style={{ padding: 4 }}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.roseLight} />
                      </TouchableOpacity>
                    </View>
                  </DoubleBezelCard>
                );
              }}
              contentContainerStyle={{ paddingBottom: 40 }}
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
                <Text style={styles.subtabTitle}>Pedidos de Clientes</Text>
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {['Todos', 'Pendiente', 'En Preparación', 'Listo', 'Completado'].map((statusChip) => (
                  <TouchableOpacity
                    key={statusChip}
                    onPress={() => setOrderStatusFilter(statusChip)}
                    style={[
                      styles.filterChip,
                      orderStatusFilter === statusChip && styles.filterChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        orderStatusFilter === statusChip && styles.filterChipTextActive,
                      ]}
                    >
                      {statusChip === 'En Preparación' ? 'En Horno' : statusChip}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
                />
              )}
              contentContainerStyle={{ paddingBottom: 40 }}
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

      {/* Cookie Recipe Ingredients Detail Modal */}
      <CookieRecipeDetailModal
        visible={!!inspectedCookie}
        cookie={inspectedCookie}
        onClose={() => setInspectedCookie(null)}
        onSell={handleOpenSale}
      />

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

      {/* Add Ingredient Modal */}
      <AddIngredientModal
        visible={isAddIngredientOpen}
        onClose={() => setIsAddIngredientOpen(false)}
        onAddIngredient={addIngredient}
      />

      {/* Add Promotion Modal */}
      <AddPromotionModal
        visible={isAddPromoOpen}
        onClose={() => setIsAddPromoOpen(false)}
        cookies={cookies}
        onAddPromotion={addPromotion}
      />

      {/* Add / Edit Order Modal */}
      <OrderModal
        visible={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        cookies={cookies}
        promotions={promotions}
        editingOrder={editingOrder}
        onSave={handleSaveOrder}
      />

      {/* Quick Sale Stepper Modal */}
      <Modal visible={isSaleModalOpen} animationType="slide" transparent onRequestClose={() => setIsSaleModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalDialog}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>Caja Registradora</Text>
                <Text style={styles.modalTitle}>Registrar Venta de Galleta</Text>
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
                <Text style={styles.formLabel}>Promoción / Oferta</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      style={[styles.schemeBtn, selectedPromoId === null && styles.schemeBtnActive]}
                      onPress={() => handleSelectPromo(null)}
                    >
                      <Text style={[styles.schemeBtnTitle, selectedPromoId === null && { color: colors.amberLight }]}>
                        Precio Normal
                      </Text>
                      <Text style={styles.schemeBtnSub}>${standardPrice.toFixed(2)} c/u</Text>
                    </TouchableOpacity>

                    {activeCookiePromos.map((p) => {
                      const isSelected = selectedPromoId === p.id;
                      const color = p.color_tag || '#F59E0B';
                      return (
                        <TouchableOpacity
                          key={p.id}
                          style={[styles.schemeBtn, isSelected && { borderColor: color, backgroundColor: `${color}15` }]}
                          onPress={() => handleSelectPromo(p)}
                        >
                          <Text style={[styles.schemeBtnTitle, isSelected && { color: color }]}>
                            {p.name}
                          </Text>
                          <Text style={styles.schemeBtnSub}>{p.badge_text}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>

                {/* Quantity Stepper */}
                <View style={styles.stepperContainer}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setSaleQty(Math.max(1, saleQty - 1))}
                  >
                    <Ionicons name="remove" size={20} color={colors.textMain} />
                  </TouchableOpacity>
                  <Text style={styles.stepperNum}>{saleQty}</Text>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setSaleQty(saleQty + 1)}
                  >
                    <Ionicons name="add" size={20} color={colors.textMain} />
                  </TouchableOpacity>
                </View>

                {/* Live Revenue and Net Profit Preview */}
                <View style={styles.saleMetricsBox}>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={styles.saleMetricLabel}>Total a Cobrar</Text>
                    <Text style={styles.saleMetricValueYellow}>
                      ${currentTotalRevenue.toFixed(2)} MXN
                    </Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={styles.saleMetricLabel}>Tu Ganancia Libre</Text>
                    <Text style={styles.saleMetricValueGreen}>
                      +${currentNetProfit.toFixed(2)} MXN
                    </Text>
                    <Text style={{ fontSize: 10, color: colors.emeraldLight, fontWeight: '700' }}>
                      ~{currentRoi.toFixed(0)}% rendimiento
                    </Text>
                  </View>
                </View>

                <Text style={styles.formLabel}>Método de Pago</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                  {PAYMENT_METHODS.map((m) => (
                    <TouchableOpacity
                      key={m}
                      onPress={() => setPaymentMethod(m)}
                      style={[styles.payMethodPill, paymentMethod === m && styles.payMethodPillActive]}
                    >
                      <Text
                        style={[
                          styles.payMethodText,
                          paymentMethod === m && styles.payMethodTextActive,
                        ]}
                      >
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.formLabel}>Cliente / Destino</Text>
                <TextInput
                  style={styles.input}
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
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  economicsMiniText: {
    fontSize: 11,
    color: colors.textDim,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabToggleWrapper: {
    marginBottom: 12,
  },
  tabToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: radii.pill,
    padding: 3,
    gap: 4,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
  },
  toggleBtnActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    elevation: 2,
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  toggleBtnTextActive: {
    color: colors.textMain,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: '#FFFFFF',
  },
  filterChipActive: {
    backgroundColor: colors.brandBg,
    borderColor: colors.brandBorder,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
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
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#F9FAFB',
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
    backgroundColor: '#F3F4F6',
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
    backgroundColor: '#F9FAFB',
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
    backgroundColor: '#F3F4F6',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    padding: 12,
    color: colors.textMain,
    fontSize: 13,
    marginBottom: 10,
  },
});
