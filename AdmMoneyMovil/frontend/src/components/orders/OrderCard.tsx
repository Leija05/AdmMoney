import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order } from '../../lib/types';
import { colors, useThemeColors, radii, spacing } from '../../theme';
import { DoubleBezelCard } from '../ui/DoubleBezelCard';
import { WhatsAppTicketModal } from '../ui/WhatsAppTicketModal';
import { MobileApiService } from '../../services/api';
import { confirmAction } from '../../stores/confirmation.store';

interface OrderCardProps {
  order: Order;
  onEdit: (order: Order) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, nextStatus: Order['status']) => void;
  onPaymentStatusChange?: (id: number, nextStatus: Order['payment_status']) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onEdit,
  onDelete,
  onStatusChange,
  onPaymentStatusChange,
}) => {
  const colors = useThemeColors();
  const [isPaymentPickerOpen, setIsPaymentPickerOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'Pendiente de Confirmación':
        return { bg: colors.amberBg, text: colors.amberText, border: colors.amberBorder, label: 'Web QR (Por Confirmar)' };
      case 'Completado':
        return { bg: colors.emeraldBg, text: colors.emeraldText, border: colors.emeraldBorder, label: 'Completado' };
      case 'Listo':
        return { bg: colors.brandBg, text: colors.brandText, border: colors.brandBorder, label: 'Listo p/ Entrega' };
      case 'En Preparación':
        return { bg: colors.amberBg, text: colors.amberText, border: colors.amberBorder, label: 'En Horno' };
      case 'Cancelado':
        return { bg: colors.roseBg, text: colors.roseText, border: colors.roseBorder, label: 'Cancelado' };
      case 'Pendiente':
      default:
        return { bg: colors.bgTertiary, text: colors.textMuted, border: colors.borderSubtle, label: 'Pendiente' };
    }
  };

  const getNextStatus = (current: Order['status']): Order['status'] => {
    switch (current) {
      case 'Pendiente de Confirmación':
        return 'Pendiente';
      case 'Pendiente':
        return 'En Preparación';
      case 'En Preparación':
        return 'Listo';
      case 'Listo':
        return 'Completado';
      case 'Completado':
        return 'Pendiente';
      default:
        return 'Pendiente';
    }
  };

  const statusStyle = getStatusBadge(order.status);
  const totalUnits = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const rawSubtotal = order.items.reduce((sum, item) => sum + item.subtotal, 0);
  const discount = Number(order.discount_amount || 0);
  const effectiveTotal = (discount > 0 && Math.abs(order.total_amount - rawSubtotal) < 0.01)
    ? Math.max(0, rawSubtotal - discount)
    : order.total_amount;

  const handleOpenWhatsApp = () => {
    setIsWhatsAppOpen(true);
  };

  const handleBlacklistOrder = (ord: Order) => {
    if (!ord.customer_phone) {
      Alert.alert('Sin Teléfono', 'Este pedido no tiene número de teléfono para bloquear.');
      return;
    }
    const clean = ord.customer_phone.replace(/\D/g, '');
    confirmAction({
      title: '¿Bloquear en Lista Negra?',
      message: `¿Deseas bloquear al número ${ord.customer_phone} (${ord.customer_name})? Se le prohibirá volver a realizar pedidos desde la web QR.`,
      confirmText: 'Sí, Bloquear',
      cancelText: 'Cancelar',
      type: 'danger',
      onConfirm: async () => {
        try {
          await MobileApiService.addToBlacklist(clean, 'Bloqueado desde tarjeta de pedido');
          Alert.alert('Bloqueado', `El número ${ord.customer_phone} fue añadido a la lista negra.`);
        } catch (err: any) {
          Alert.alert('Error', err?.message || 'No se pudo bloquear el número.');
        }
      },
    });
  };

  return (
    <DoubleBezelCard style={styles.card}>
      {/* Header: Customer Avatar & Status */}
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <View
            style={[
              styles.customerAvatar,
              {
                backgroundColor: colors.isDark ? 'rgba(245, 158, 11, 0.16)' : colors.amberBg,
                borderColor: colors.isDark ? 'rgba(245, 158, 11, 0.35)' : colors.amberBorder,
              },
            ]}
          >
            <Text style={[styles.avatarInitial, { color: colors.amberLight }]}>
              {order.customer_name ? order.customer_name.trim().charAt(0).toUpperCase() : 'C'}
            </Text>
          </View>

          <View style={{ flex: 1, paddingRight: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Text style={[styles.customerName, { color: colors.textMain }]} numberOfLines={1}>
                {order.customer_name}
              </Text>
              {order.folio ? (
                <View
                  style={[
                    styles.folioPill,
                    {
                      backgroundColor: colors.isDark ? '#1C2638' : '#FEF3C7',
                      borderColor: colors.isDark ? '#D97706' : '#FDE68A',
                    },
                  ]}
                >
                  <Text style={[styles.folioPillText, { color: colors.amberLight }]}>{order.folio}</Text>
                </View>
              ) : null}
            </View>
            {order.customer_phone ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Ionicons name="call-outline" size={11} color={colors.textMuted} />
                <Text style={[styles.customerPhone, { color: colors.textMuted }]}>{order.customer_phone}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Status Pill with Tap to Advance */}
        <TouchableOpacity
          onPress={() => onStatusChange(order.id, getNextStatus(order.status))}
          style={[
            styles.statusPill,
            { backgroundColor: statusStyle.bg, borderColor: statusStyle.border },
          ]}
          activeOpacity={0.7}
        >
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {statusStyle.label} ↻
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Confirmation Banner for Web Orders */}
      {order.status === 'Pendiente de Confirmación' && (
        <TouchableOpacity
          style={[styles.confirmWebBanner, { backgroundColor: colors.amber }]}
          onPress={() => onStatusChange(order.id, 'Pendiente')}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="flame" size={14} color="#FFFFFF" />
            <Text style={styles.confirmWebBannerText}>Confirmar Pedido Web y Hornear</Text>
          </View>
          <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Delivery date & Payment */}
      <View style={[styles.metaRow, { borderBottomColor: colors.borderSubtle }]}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={13} color={colors.textDim} />
          <Text style={[styles.metaText, { color: colors.textMuted }]}>Entrega: {order.delivery_date}</Text>
        </View>

        <TouchableOpacity
          onPress={() => setIsPaymentPickerOpen(true)}
          style={[
            styles.paymentBadge,
            {
              backgroundColor:
                order.payment_status === 'Pagado'
                  ? colors.emeraldBg
                  : order.payment_status === 'Anticipo'
                  ? colors.amberBg
                  : colors.amberBg,
              borderColor:
                order.payment_status === 'Pagado'
                  ? colors.emeraldBorder
                  : order.payment_status === 'Anticipo'
                  ? colors.amberBorder
                  : colors.amberBorder,
            },
          ]}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons
              name={
                order.payment_status === 'Pagado'
                  ? 'checkmark-circle'
                  : order.payment_status === 'Anticipo'
                  ? 'cash-outline'
                  : 'time-outline'
              }
              size={12}
              color={
                order.payment_status === 'Pagado'
                  ? colors.emeraldText
                  : order.payment_status === 'Anticipo'
                  ? colors.amberText
                  : colors.amberLight
              }
            />
            <Text
              style={[
                styles.paymentText,
                {
                  color:
                    order.payment_status === 'Pagado'
                      ? colors.emeraldText
                      : order.payment_status === 'Anticipo'
                      ? colors.amberText
                      : colors.amberLight,
                  fontWeight: '700',
                },
              ]}
            >
              {order.payment_status === 'Pagado'
                ? 'Pagado'
                : order.payment_status === 'Anticipo'
                ? `Anticipo ($${order.deposit_amount || 0})`
                : 'Pago Pendiente'}{' '}
              ▾
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Items List */}
      <View style={[styles.itemsBox, { backgroundColor: colors.bgTertiary }]}>
        {order.items.map((item, idx) => (
          <View key={idx} style={styles.itemRow}>
            <Text style={[styles.itemQuantity, { color: colors.brand }]}>{item.quantity}x</Text>
            <Text style={[styles.itemName, { color: colors.textMain }]} numberOfLines={1}>
              {item.product_name}
            </Text>
            <Text style={[styles.itemSubtotal, { color: colors.textMain }]}>${item.subtotal.toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {/* Promotion Tag if applied */}
      {order.promotion_name ? (
        <View style={[styles.promoTag, { backgroundColor: colors.amberBg }]}>
          <Ionicons name="pricetag" size={12} color={colors.amberLight} />
          <Text style={[styles.promoText, { color: colors.amberText }]} numberOfLines={1}>
            {order.promotion_name} (-${Number(order.discount_amount || 0).toFixed(2)})
          </Text>
        </View>
      ) : null}

      {/* Notes */}
      {order.notes ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
          <Ionicons name="chatbubble-ellipses-outline" size={12} color={colors.textMuted} />
          <Text style={[styles.notesText, { color: colors.textMuted, flex: 1 }]} numberOfLines={2}>
            "{order.notes}"
          </Text>
        </View>
      ) : null}

      {/* Bottom Financial & Action Bar */}
      <View style={[styles.footerRow, { borderTopColor: colors.borderSubtle }]}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={[styles.totalLabel, { color: colors.textDim }]}>
            {order.payment_status === 'Pagado' ? 'Total Cobrado' : 'Total a Cobrar'}
          </Text>
          <Text style={[styles.totalAmount, { color: colors.textMain }]}>${effectiveTotal.toFixed(2)} MXN</Text>
          {order.payment_status === 'Pendiente' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Ionicons name="hourglass-outline" size={12} color={colors.amberLight} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.amberLight }}>
                Pago Pendiente (No sumado a ganancia)
              </Text>
            </View>
          ) : order.payment_status === 'Anticipo' ? (
            <View style={{ marginTop: 2 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.amberLight }}>
                Anticipo: +${(order.deposit_amount || 0).toFixed(2)} • Falta: ${Math.max(0, effectiveTotal - (order.deposit_amount || 0)).toFixed(2)}
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Ionicons name="trending-up" size={12} color={colors.emeraldLight} />
              <Text style={[styles.profitSubtext, { color: colors.emeraldLight }]}>
                Ganancia libre: +${order.net_profit.toFixed(2)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionsGroup}>
          {/* WhatsApp Button */}
          {Boolean(order.customer_phone) && (
            <TouchableOpacity
              onPress={handleOpenWhatsApp}
              style={[styles.actionBtn, { backgroundColor: colors.whatsappBg, borderColor: colors.whatsapp }]}
              accessibilityLabel="Enviar ticket por WhatsApp"
            >
              <Ionicons name="logo-whatsapp" size={16} color={colors.whatsappText} />
            </TouchableOpacity>
          )}

          {/* Blacklist Button for Fake Orders */}
          {Boolean(order.customer_phone) && (
            <TouchableOpacity
              onPress={() => handleBlacklistOrder(order)}
              style={[styles.actionBtn, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
              accessibilityLabel="Bloquear en lista negra"
            >
              <Ionicons name="ban-outline" size={15} color={colors.textMuted} />
            </TouchableOpacity>
          )}

          {/* Edit Button */}
          <TouchableOpacity
            onPress={() => onEdit(order)}
            style={[styles.actionBtn, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
            accessibilityLabel="Editar pedido"
          >
            <Ionicons name="pencil" size={15} color={colors.textMain} />
          </TouchableOpacity>

          {/* Delete Button */}
          <TouchableOpacity
            onPress={() => onDelete(order.id)}
            style={[styles.actionBtn, { backgroundColor: colors.roseBg, borderColor: colors.roseBorder }]}
          >
            <Ionicons name="trash-outline" size={15} color={colors.roseText} />
          </TouchableOpacity>
        </View>
      </View>
      <WhatsAppTicketModal
        visible={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        order={order}
      />

      {/* Quick Payment Status Picker Modal */}
      <Modal
        visible={isPaymentPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPaymentPickerOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsPaymentPickerOpen(false)}
        >
          <View
            style={[styles.paymentModalCard, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.paymentModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.paymentModalEyebrow, { color: colors.brandLight }]}>Estatus de Cobro</Text>
                <Text style={[styles.paymentModalTitle, { color: colors.textMain }]}>Cambiar Estado de Pago</Text>
                <Text style={[styles.paymentModalSubtitle, { color: colors.textMuted }]}>
                  {order.customer_name} • Total: ${order.total_amount.toFixed(2)} MXN
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsPaymentPickerOpen(false)} style={styles.paymentModalCloseBtn}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.paymentOptionsList}>
              {/* Option 1: Pagado */}
              <TouchableOpacity
                onPress={() => {
                  setIsPaymentPickerOpen(false);
                  if (order.payment_status !== 'Pagado') {
                    onPaymentStatusChange?.(order.id, 'Pagado');
                  }
                }}
                style={[
                  styles.paymentOptionCard,
                  {
                    backgroundColor: order.payment_status === 'Pagado' ? colors.emeraldBg : colors.bgTertiary,
                    borderColor: order.payment_status === 'Pagado' ? colors.emeraldBorder : colors.borderSubtle,
                  },
                ]}
              >
                <View style={[styles.paymentOptionIconWrap, { backgroundColor: colors.emeraldBg, borderColor: colors.emeraldBorder }]}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.emeraldLight} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Text style={[styles.paymentOptionTitle, { color: colors.textMain }]}>Pagado</Text>
                    <View style={[styles.paymentMiniBadge, { backgroundColor: colors.emeraldBg }]}>
                      <Text style={[styles.paymentMiniBadgeText, { color: colors.emeraldText }]}>Suma a Ventas Cobradas</Text>
                    </View>
                  </View>
                  <Text style={[styles.paymentOptionDesc, { color: colors.textMuted }]}>
                    Pedido 100% cobrado. Se registrará en ingresos y ganancias de hoy.
                  </Text>
                </View>
                {order.payment_status === 'Pagado' && (
                  <Ionicons name="radio-button-on" size={18} color={colors.emeraldLight} />
                )}
              </TouchableOpacity>

              {/* Option 2: Anticipo */}
              <TouchableOpacity
                onPress={() => {
                  setIsPaymentPickerOpen(false);
                  if (order.payment_status !== 'Anticipo') {
                    onPaymentStatusChange?.(order.id, 'Anticipo');
                  }
                }}
                style={[
                  styles.paymentOptionCard,
                  {
                    backgroundColor: order.payment_status === 'Anticipo' ? colors.amberBg : colors.bgTertiary,
                    borderColor: order.payment_status === 'Anticipo' ? colors.amberBorder : colors.borderSubtle,
                  },
                ]}
              >
                <View style={[styles.paymentOptionIconWrap, { backgroundColor: colors.amberBg, borderColor: colors.amberBorder }]}>
                  <Ionicons name="cash-outline" size={20} color={colors.amberLight} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.paymentOptionTitle, { color: colors.textMain }]}>Anticipo</Text>
                  <Text style={[styles.paymentOptionDesc, { color: colors.textMuted }]}>
                    Cobro parcial recibido. Saldo restante pendiente de liquidar.
                  </Text>
                </View>
                {order.payment_status === 'Anticipo' && (
                  <Ionicons name="radio-button-on" size={18} color={colors.amberLight} />
                )}
              </TouchableOpacity>

              {/* Option 3: Pendiente */}
              <TouchableOpacity
                onPress={() => {
                  setIsPaymentPickerOpen(false);
                  if (order.payment_status !== 'Pendiente') {
                    onPaymentStatusChange?.(order.id, 'Pendiente');
                  }
                }}
                style={[
                  styles.paymentOptionCard,
                  {
                    backgroundColor: order.payment_status === 'Pendiente' ? colors.bgSecondary : colors.bgTertiary,
                    borderColor: order.payment_status === 'Pendiente' ? colors.brandBorder : colors.borderSubtle,
                  },
                ]}
              >
                <View style={[styles.paymentOptionIconWrap, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle }]}>
                  <Ionicons name="time-outline" size={20} color={colors.textDim} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.paymentOptionTitle, { color: colors.textMain }]}>Pendiente</Text>
                  <Text style={[styles.paymentOptionDesc, { color: colors.textMuted }]}>
                    Aún sin cobro. Se pagará al momento de la entrega.
                  </Text>
                </View>
                {order.payment_status === 'Pendiente' && (
                  <Ionicons name="radio-button-on" size={18} color={colors.textMain} />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setIsPaymentPickerOpen(false)}
              style={[styles.paymentModalCancelBtn, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
            >
              <Text style={[styles.paymentModalCancelText, { color: colors.textMuted }]}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </DoubleBezelCard>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  customerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '900',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textMain,
    flexShrink: 1,
  },
  customerPhone: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  paymentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  paymentText: {
    fontSize: 11,
    fontWeight: '700',
  },
  itemsBox: {
    backgroundColor: colors.bgTertiary,
    borderRadius: radii.md,
    padding: 8,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  itemQuantity: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.brand,
    width: 28,
  },
  itemName: {
    flex: 1,
    fontSize: 12,
    color: colors.textMain,
    fontWeight: '600',
  },
  itemSubtotal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMain,
  },
  promoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.amberBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  promoText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.amberText,
  },
  notesText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: colors.textMuted,
    marginBottom: 10,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  totalLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    color: colors.textDim,
    fontWeight: '700',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textMain,
  },
  profitSubtext: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.emerald,
    marginTop: 1,
  },
  actionsGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 9, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  paymentModalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  paymentModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  paymentModalEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  paymentModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  paymentModalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  paymentModalCloseBtn: {
    padding: 6,
  },
  paymentOptionsList: {
    gap: 10,
    marginBottom: spacing.md,
  },
  paymentOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: 12,
  },
  paymentOptionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentOptionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  paymentMiniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  paymentMiniBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  paymentOptionDesc: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  paymentModalCancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  paymentModalCancelText: {
    fontSize: 13,
    fontWeight: '700',
  },
  folioPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
  },
  folioPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  confirmWebBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    marginTop: 8,
    marginBottom: 4,
  },
  confirmWebBannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
