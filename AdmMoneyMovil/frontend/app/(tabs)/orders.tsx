import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, radii, spacing, gradients } from '../../src/theme';
import { OrderCard } from '../../src/components/orders/OrderCard';
import { OrderModal } from '../../src/components/orders/OrderModal';
import { OrderDeliveryReminderBanner } from '../../src/components/orders/OrderDeliveryReminderBanner';
import { BakingProductionModal } from '../../src/components/orders/BakingProductionModal';
import { CustomersDirectoryModal } from '../../src/components/orders/CustomersDirectoryModal';
import { Button } from '../../src/components/ui/Button';
import { BackendHeartbeat } from '../../src/components/ui/BackendHeartbeat';
import { DoubleBezelCard } from '../../src/components/ui/DoubleBezelCard';
import { AmbientBackdrop } from '../../src/components/ui/AmbientBackdrop';
import { useAppStore } from '../../src/stores/app.store';
import { Order } from '../../src/lib/types';
import { confirmAction } from '../../src/stores/confirmation.store';
import { SwipeTabWrapper } from '../../src/components/ui/SwipeTabWrapper';

export default function OrdersScreen() {
  const colors = useThemeColors();
  const isDark = colors.isDark;

  const {
    orders,
    cookies,
    ingredients,
    promotions,
    customers,
    addOrder,
    updateOrder,
    deleteOrder,
    addCustomer,
    loadAllData,
    isLoading,
  } = useAppStore();

  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('Todos');
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isProductionModalOpen, setIsProductionModalOpen] = useState(false);
  const [isCustomersModalOpen, setIsCustomersModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Quick stats
  const pendingOrders = orders.filter(
    (o) => o.status === 'Pendiente' || o.status === 'En Preparación'
  );
  const readyOrders = orders.filter((o) => o.status === 'Listo');
  const pendingPaymentOrders = orders.filter(
    (o) => o.payment_status !== 'Pagado' && o.status !== 'Cancelado'
  );
  const totalPendingPaymentsCount = pendingPaymentOrders.length;
  const totalToCollect = pendingPaymentOrders.reduce((sum, o) => {
    const rawSub = o.items.reduce((s, it) => s + it.subtotal, 0);
    const disc = Number(o.discount_amount || 0);
    const effTot = disc > 0 && Math.abs(o.total_amount - rawSub) < 0.01 ? Math.max(0, rawSub - disc) : o.total_amount;
    return sum + (o.payment_status === 'Anticipo' ? Math.max(0, effTot - (o.deposit_amount || 0)) : effTot);
  }, 0);

  const handleOpenAddOrder = () => {
    setEditingOrder(null);
    setIsOrderModalOpen(true);
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setIsOrderModalOpen(true);
  };

  const handleSaveOrder = async (orderPayload: Partial<Order>) => {
    try {
      setIsOrderModalOpen(false);
      const isEdit = !!editingOrder;
      const clientName = orderPayload.customer_name || 'Cliente';
      if (editingOrder) {
        await updateOrder(editingOrder.id, orderPayload);
      } else {
        await addOrder(orderPayload);
      }
      Alert.alert(
        '¡Pedido Guardado!',
        isEdit
          ? `El pedido de "${clientName}" se actualizó con éxito.`
          : `El pedido de "${clientName}" se guardó con éxito.`
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo guardar el pedido');
    }
  };

  const handleDeleteOrder = (id: number) => {
    const target = orders.find((o) => o.id === id);
    const client = target?.customer_name || `Pedido #${id}`;
    confirmAction({
      title: '¿Eliminar Pedido?',
      message: `¿Deseas eliminar definitivamente el pedido de "${client}"?`,
      confirmText: 'Sí, Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteOrder(id);
        } catch (err: any) {
          Alert.alert('Error', err?.message || 'No se pudo eliminar el pedido');
        }
      },
    });
  };

  const handleStatusChange = async (id: number, nextStatus: Order['status']) => {
    try {
      await updateOrder(id, { status: nextStatus });
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo actualizar el estado');
    }
  };

  const handlePaymentStatusChange = async (
    id: number,
    nextPaymentStatus: Order['payment_status']
  ) => {
    try {
      await updateOrder(id, { payment_status: nextPaymentStatus });
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo actualizar el pago');
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter === 'Todos') return true;
    if (orderStatusFilter === 'Pagos Pendientes') {
      return o.payment_status !== 'Pagado' && o.status !== 'Cancelado';
    }
    return o.status === orderStatusFilter;
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      <AmbientBackdrop variant="amber" />
      <SwipeTabWrapper currentRoute="/orders">
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle, backgroundColor: colors.bgPrimary }]}>
        <View style={styles.headerTopRow}>
          <View style={[styles.eyebrowBadge, { backgroundColor: colors.amberBg, borderColor: colors.amberBorder }]}>
            <Ionicons name="sparkles" size={10} color={colors.amberLight} />
            <Text style={[styles.eyebrowText, { color: colors.amberLight }]}>LUCKY COOKIES</Text>
          </View>
          <BackendHeartbeat compact />
        </View>

        <View style={styles.headerMainRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={[styles.headerTitle, { color: colors.textMain }]} numberOfLines={1}>
              Gestión de Pedidos
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textDim }]}>
              {orders.length === 1 ? '1 pedido registrado' : `${orders.length} pedidos registrados`}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => setIsCustomersModalOpen(true)}
              activeOpacity={0.85}
              style={[styles.planBtn, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
            >
              <Ionicons name="people" size={14} color={colors.brandLight} />
              <Text style={[styles.planBtnText, { color: colors.textMain }]}>Clientes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsProductionModalOpen(true)}
              activeOpacity={0.85}
              style={[styles.planBtn, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
            >
              <Ionicons name="flame" size={14} color={colors.amberLight} />
              <Text style={[styles.planBtnText, { color: colors.textMain }]}>Plan Horno</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleOpenAddOrder}
              activeOpacity={0.85}
              style={[styles.newOrderBtn, { backgroundColor: colors.amber }]}
            >
              <View style={styles.newOrderIconWrap}>
                <Ionicons name="add" size={15} color="#FFFFFF" />
              </View>
              <Text style={styles.newOrderBtnText}>Nuevo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <FlatList
        data={filteredOrders}
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
        contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
        onRefresh={loadAllData}
        refreshing={isLoading}
        ListHeaderComponent={
          <View style={{ marginBottom: 14 }}>
            {/* Urgent Delivery Reminder Banner */}
            <OrderDeliveryReminderBanner
              onPressOrder={(id) => {
                const target = orders.find((o) => o.id === id);
                if (target) handleEditOrder(target);
              }}
            />

            {/* Bento Quick Metrics */}
            {/* 1. Hero Card: Dinero Pendiente de Cobro */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => setOrderStatusFilter(orderStatusFilter === 'Pagos Pendientes' ? 'Todos' : 'Pagos Pendientes')}
              style={{ marginBottom: 10 }}
            >
              <DoubleBezelCard
                style={[
                  styles.heroMetricCard,
                  orderStatusFilter === 'Pagos Pendientes' && {
                    borderColor: colors.amberBorder,
                    backgroundColor: colors.amberBg,
                  },
                ]}
              >
                <View style={styles.heroMetricRow}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <View style={[styles.metricIconBox, { backgroundColor: colors.amberBg }]}>
                        <Ionicons name="hourglass-outline" size={15} color={colors.amberLight} />
                      </View>
                      <Text style={[styles.metricLabel, { color: colors.amberLight }]}>
                        Por Cobrar (Pendiente)
                      </Text>
                    </View>
                    <Text style={[styles.heroMetricVal, { color: colors.amberLight }]}>
                      ${totalToCollect.toFixed(2)} <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textDim }}>MXN</Text>
                    </Text>
                    <Text style={[styles.heroMetricSub, { color: colors.textDim }]}>
                      {totalPendingPaymentsCount} {totalPendingPaymentsCount === 1 ? 'pedido con saldo pendiente' : 'pedidos con saldo pendiente'}
                    </Text>
                  </View>

                  <View style={[styles.filterActionPill, {
                    backgroundColor: orderStatusFilter === 'Pagos Pendientes' ? colors.amberLight : (isDark ? '#1C2230' : '#EEF2F6'),
                    borderColor: orderStatusFilter === 'Pagos Pendientes' ? colors.amberLight : colors.borderSubtle,
                  }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      {orderStatusFilter === 'Pagos Pendientes' && (
                        <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                      )}
                      <Text style={[styles.filterActionText, {
                        color: orderStatusFilter === 'Pagos Pendientes' ? '#FFFFFF' : colors.textMuted,
                        fontWeight: orderStatusFilter === 'Pagos Pendientes' ? '800' : '600',
                      }]}>
                        {orderStatusFilter === 'Pagos Pendientes' ? 'Filtrado' : 'Filtrar'}
                      </Text>
                    </View>
                  </View>
                </View>
              </DoubleBezelCard>
            </TouchableOpacity>

            {/* 2. Sub-Row: Por Hornear & Listos p/ Entrega (2 spacious equal columns) */}
            <View style={styles.subMetricsRow}>
              <TouchableOpacity
                style={{ flex: 1 }}
                activeOpacity={0.85}
                onPress={() => setOrderStatusFilter(orderStatusFilter === 'Pendiente' ? 'Todos' : 'Pendiente')}
              >
                <DoubleBezelCard
                  style={[
                    styles.subMetricCard,
                    orderStatusFilter === 'Pendiente' && { borderColor: colors.brandBorder, backgroundColor: colors.brandBg },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <View style={[styles.metricIconBox, { backgroundColor: colors.brandBg }]}>
                      <Ionicons name="time-outline" size={14} color={colors.brand} />
                    </View>
                    <Text style={[styles.metricLabel, { color: colors.textDim }]}>Por Hornear</Text>
                  </View>
                  <Text style={[styles.subMetricVal, { color: colors.textMain }]}>
                    {pendingOrders.length}
                  </Text>
                  <Text style={[styles.subMetricSub, { color: colors.textDim }]}>
                    {pendingOrders.length === 1 ? 'pedido en cola' : 'pedidos en cola'}
                  </Text>
                </DoubleBezelCard>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ flex: 1 }}
                activeOpacity={0.85}
                onPress={() => setOrderStatusFilter(orderStatusFilter === 'Listo' ? 'Todos' : 'Listo')}
              >
                <DoubleBezelCard
                  style={[
                    styles.subMetricCard,
                    orderStatusFilter === 'Listo' && { borderColor: colors.emeraldBorder, backgroundColor: colors.emeraldBg },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <View style={[styles.metricIconBox, { backgroundColor: colors.emeraldBg }]}>
                      <Ionicons name="checkmark-done-circle-outline" size={14} color={colors.emeraldLight} />
                    </View>
                    <Text style={[styles.metricLabel, { color: colors.textDim }]} numberOfLines={1}>Listos Entrega</Text>
                  </View>
                  <Text style={[styles.subMetricVal, { color: colors.emeraldLight }]}>
                    {readyOrders.length}
                  </Text>
                  <Text style={[styles.subMetricSub, { color: colors.textDim }]}>
                    {readyOrders.length === 1 ? 'listo p/ entregar' : 'listos p/ entregar'}
                  </Text>
                </DoubleBezelCard>
              </TouchableOpacity>
            </View>

            {/* Filter Chips */}
            <ScrollView
              horizontal
              nestedScrollEnabled={true}
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 12 }}
              contentContainerStyle={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}
            >
              {['Todos', 'Pagos Pendientes', 'Pendiente', 'En Preparación', 'Listo', 'Completado', 'Cancelado'].map(
                (statusChip) => {
                  const isActive = orderStatusFilter === statusChip;
                  return (
                    <TouchableOpacity
                      key={statusChip}
                      onPress={() => setOrderStatusFilter(statusChip)}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: isActive ? (statusChip === 'Pagos Pendientes' ? colors.amberBg : colors.brandBg) : colors.bgCard,
                          borderColor: isActive ? (statusChip === 'Pagos Pendientes' ? colors.amberBorder : colors.brandBorder) : colors.borderSubtle,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          {
                            color: isActive ? (statusChip === 'Pagos Pendientes' ? colors.amberText : colors.brandText) : colors.textMuted,
                            fontWeight: isActive ? '800' : '600',
                          },
                        ]}
                      >
                        {statusChip === 'En Preparación'
                          ? 'En Horno'
                          : statusChip === 'Pagos Pendientes'
                          ? `Pagos Pendientes (${totalPendingPaymentsCount})`
                          : statusChip}
                      </Text>
                    </TouchableOpacity>
                  );
                }
              )}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="receipt-outline" size={48} color={colors.textDim} />
            <Text style={[styles.emptyTitle, { color: colors.textMain }]}>Sin Pedidos Registrados</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {orderStatusFilter === 'Todos'
                ? 'Toca "+ Nuevo Pedido" para agendar tu primera entrega personalizada con ticket y WhatsApp.'
                : `No se encontraron pedidos con estatus "${orderStatusFilter}".`}
            </Text>
          </View>
        }
      />
      </SwipeTabWrapper>

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

      {/* Baking Production Plan Modal */}
      <BakingProductionModal
        visible={isProductionModalOpen}
        onClose={() => setIsProductionModalOpen(false)}
        orders={orders}
        cookies={cookies}
        ingredients={ingredients}
      />

      {/* Customers Directory Modal */}
      <CustomersDirectoryModal
        visible={isCustomersModalOpen}
        onClose={() => setIsCustomersModalOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eyebrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  eyebrowText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  planBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  planBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  newOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radii.pill,
    elevation: 2,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  newOrderIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newOrderBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  heroMetricCard: {
    padding: 14,
    borderRadius: 16,
  },
  heroMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricIconBox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  heroMetricVal: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  heroMetricSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  filterActionPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  filterActionText: {
    fontSize: 11.5,
  },
  subMetricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  subMetricCard: {
    padding: 12,
    borderRadius: 14,
  },
  subMetricVal: {
    fontSize: 20,
    fontWeight: '900',
  },
  subMetricSub: {
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 3,
  },
  filterChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
  },
  emptyBox: {
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 280,
  },
});
