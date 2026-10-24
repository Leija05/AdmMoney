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
import { Button } from '../../src/components/ui/Button';
import { BackendHeartbeat } from '../../src/components/ui/BackendHeartbeat';
import { DoubleBezelCard } from '../../src/components/ui/DoubleBezelCard';
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
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Quick stats
  const pendingOrders = orders.filter(
    (o) => o.status === 'Pendiente' || o.status === 'En Preparación'
  );
  const readyOrders = orders.filter((o) => o.status === 'Listo');
  const totalToCollect = orders
    .filter((o) => o.payment_status !== 'Pagado' && o.status !== 'Cancelado')
    .reduce((sum, o) => sum + (o.total_amount - (o.deposit_amount || 0)), 0);

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
      if (editingOrder) {
        await updateOrder(editingOrder.id, orderPayload);
      } else {
        await addOrder(orderPayload);
      }
      setIsOrderModalOpen(false);
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
    return o.status === orderStatusFilter;
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      <SwipeTabWrapper currentRoute="/orders">
        {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: colors.amberLight, letterSpacing: 0.8 }}>
              LUCKY COOKIES
            </Text>
            <BackendHeartbeat />
          </View>
          <Text style={[styles.headerTitle, { color: colors.textMain }]}>Gestión de Pedidos</Text>
        </View>

        <Button
          title="+ Nuevo Pedido"
          variant="amber"
          icon={<Ionicons name="add" size={17} color="#fff" />}
          onPress={handleOpenAddOrder}
          style={{ paddingVertical: 8, paddingHorizontal: 14 }}
        />
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
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        onRefresh={loadAllData}
        refreshing={isLoading}
        ListHeaderComponent={
          <View style={{ marginBottom: 14 }}>
            {/* Quick Metrics Cards */}
            <View style={styles.metricsRow}>
              <View style={{ flex: 1 }}>
                <DoubleBezelCard style={styles.metricCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="time-outline" size={16} color={colors.amberLight} />
                    <Text style={[styles.metricLabel, { color: colors.textDim }]}>Por Hornear</Text>
                  </View>
                  <Text style={[styles.metricVal, { color: colors.textMain }]}>
                    {pendingOrders.length}
                  </Text>
                </DoubleBezelCard>
              </View>

              <View style={{ flex: 1 }}>
                <DoubleBezelCard style={styles.metricCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="checkmark-done-circle-outline" size={16} color={colors.emeraldLight} />
                    <Text style={[styles.metricLabel, { color: colors.textDim }]}>Listos p/ Entrega</Text>
                  </View>
                  <Text style={[styles.metricVal, { color: colors.emeraldLight }]}>
                    {readyOrders.length}
                  </Text>
                </DoubleBezelCard>
              </View>

              <View style={{ flex: 1.2 }}>
                <DoubleBezelCard style={styles.metricCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="cash-outline" size={16} color={colors.brandText} />
                    <Text style={[styles.metricLabel, { color: colors.textDim }]}>Por Cobrar</Text>
                  </View>
                  <Text style={[styles.metricVal, { color: colors.brandText }]}>
                    ${totalToCollect.toFixed(0)}
                  </Text>
                </DoubleBezelCard>
              </View>
            </View>

            {/* Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 12 }}
              contentContainerStyle={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}
            >
              {['Todos', 'Pendiente', 'En Preparación', 'Listo', 'Completado', 'Cancelado'].map(
                (statusChip) => {
                  const isActive = orderStatusFilter === statusChip;
                  return (
                    <TouchableOpacity
                      key={statusChip}
                      onPress={() => setOrderStatusFilter(statusChip)}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: isActive ? colors.brandBg : colors.bgCard,
                          borderColor: isActive ? colors.brandBorder : colors.borderSubtle,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          {
                            color: isActive ? colors.brandText : colors.textMuted,
                            fontWeight: isActive ? '800' : '600',
                          },
                        ]}
                      >
                        {statusChip === 'En Preparación' ? 'En Horno' : statusChip}
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
      </SwipeTabWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCard: {
    padding: 10,
    borderRadius: 14,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
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
