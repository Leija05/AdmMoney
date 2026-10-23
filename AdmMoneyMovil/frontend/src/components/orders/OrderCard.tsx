import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order } from '../../lib/types';
import { colors, useThemeColors, radii, spacing } from '../../theme';
import { DoubleBezelCard } from '../ui/DoubleBezelCard';

interface OrderCardProps {
  order: Order;
  onEdit: (order: Order) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, nextStatus: Order['status']) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const colors = useThemeColors();
  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
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

  const handleOpenWhatsApp = () => {
    if (order.whatsapp_url) {
      Linking.openURL(order.whatsapp_url);
    } else if (order.customer_phone) {
      const cleanPhone = order.customer_phone.replace(/\D/g, '');
      const msg = encodeURIComponent(
        `¡Hola ${order.customer_name}! Te saludamos de la repostería con respecto a tu pedido de ${totalUnits} galletas (Total: $${order.total_amount.toFixed(2)} MXN) programado para ${order.delivery_date}.`
      );
      Linking.openURL(`https://wa.me/${cleanPhone}?text=${msg}`);
    }
  };

  return (
    <DoubleBezelCard style={styles.card}>
      {/* Header: Customer & Status */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="person" size={15} color={colors.textMain} />
            <Text style={[styles.customerName, { color: colors.textMain }]} numberOfLines={1}>
              {order.customer_name}
            </Text>
          </View>
          {order.customer_phone ? (
            <Text style={[styles.customerPhone, { color: colors.textMuted }]}>📞 {order.customer_phone}</Text>
          ) : null}
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

      {/* Delivery date & Payment */}
      <View style={[styles.metaRow, { borderBottomColor: colors.borderSubtle }]}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={13} color={colors.textDim} />
          <Text style={[styles.metaText, { color: colors.textMuted }]}>Entrega: {order.delivery_date}</Text>
        </View>

        <View
          style={[
            styles.paymentBadge,
            {
              backgroundColor:
                order.payment_status === 'Pagado'
                  ? colors.emeraldBg
                  : order.payment_status === 'Anticipo'
                  ? colors.amberBg
                  : colors.bgTertiary,
              borderColor:
                order.payment_status === 'Pagado'
                  ? colors.emeraldBorder
                  : order.payment_status === 'Anticipo'
                  ? colors.amberBorder
                  : colors.borderSubtle,
            },
          ]}
        >
          <Text
            style={[
              styles.paymentText,
              {
                color:
                  order.payment_status === 'Pagado'
                    ? colors.emeraldText
                    : order.payment_status === 'Anticipo'
                    ? colors.amberText
                    : colors.textMuted,
              },
            ]}
          >
            {order.payment_status}
            {order.deposit_amount > 0 && order.payment_status === 'Anticipo'
              ? ` ($${order.deposit_amount})`
              : ''}
          </Text>
        </View>
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
        <Text style={[styles.notesText, { color: colors.textMuted }]} numberOfLines={2}>
          💬 "{order.notes}"
        </Text>
      ) : null}

      {/* Bottom Financial & Action Bar */}
      <View style={[styles.footerRow, { borderTopColor: colors.borderSubtle }]}>
        <View>
          <Text style={[styles.totalLabel, { color: colors.textDim }]}>Total a Cobrar</Text>
          <Text style={[styles.totalAmount, { color: colors.textMain }]}>${order.total_amount.toFixed(2)} MXN</Text>
          <Text style={[styles.profitSubtext, { color: colors.emeraldLight }]}>
            Ganancia libre: +${order.net_profit.toFixed(2)}
          </Text>
        </View>

        <View style={styles.actionsGroup}>
          {/* WhatsApp Button */}
          {Boolean(order.customer_phone) && (
            <TouchableOpacity
              onPress={handleOpenWhatsApp}
              style={[styles.actionBtn, { backgroundColor: colors.whatsappBg, borderColor: colors.whatsapp }]}
            >
              <Ionicons name="logo-whatsapp" size={16} color={colors.whatsappText} />
            </TouchableOpacity>
          )}

          {/* Edit Button */}
          <TouchableOpacity
            onPress={() => onEdit(order)}
            style={[styles.actionBtn, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
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
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textMain,
    flexShrink: 1,
  },
  customerPhone: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
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
});
