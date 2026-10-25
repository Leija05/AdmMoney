import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../stores/app.store';
import { useThemeColors } from '../../theme';
import { getUpcomingOrders, UpcomingDeliveryInfo } from '../../services/notificationService';

interface OrderDeliveryReminderBannerProps {
  onPressOrder?: (orderId: number) => void;
}

export const OrderDeliveryReminderBanner: React.FC<OrderDeliveryReminderBannerProps> = ({
  onPressOrder,
}) => {
  const router = useRouter();
  const colors = useThemeColors();
  const isDark = colors.isDark;
  const { width: screenWidth } = useWindowDimensions();
  const isSmallScreen = screenWidth < 360;

  const { orders, orderRemindersEnabled } = useAppStore();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  if (!orderRemindersEnabled || isDismissed) {
    return null;
  }

  const upcomingList: UpcomingDeliveryInfo[] = getUpcomingOrders(orders);
  if (upcomingList.length === 0) {
    return null;
  }

  const urgentCount = upcomingList.length;
  const topOrderInfo = upcomingList[0];
  const hasOverdue = upcomingList.some((u) => u.urgency === 'overdue');
  const hasToday = upcomingList.some((u) => u.urgency === 'today');

  const bannerTheme = hasOverdue
    ? {
        border: isDark ? 'rgba(239, 68, 68, 0.45)' : 'rgba(239, 68, 68, 0.35)',
        bg: isDark ? ['#2D1518', '#1F1113'] : ['#FEF2F2', '#FFF5F5'],
        badgeBg: 'rgba(239, 68, 68, 0.18)',
        badgeText: '#EF4444',
        iconName: 'alert-circle' as const,
        title: `¡${urgentCount} Pedido${urgentCount > 1 ? 's' : ''} pendiente${urgentCount > 1 ? 's' : ''} por entregar!`,
      }
    : hasToday
    ? {
        border: isDark ? 'rgba(245, 158, 11, 0.45)' : 'rgba(245, 158, 11, 0.35)',
        bg: isDark ? ['#2A1F13', '#1C150D'] : ['#FFFBEB', '#FEF3C7'],
        badgeBg: 'rgba(245, 158, 11, 0.18)',
        badgeText: '#D97706',
        iconName: 'time' as const,
        title: `¡Tienes ${urgentCount} entrega${urgentCount > 1 ? 's' : ''} agendada${urgentCount > 1 ? 's' : ''} para HOY!`,
      }
    : {
        border: isDark ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.3)',
        bg: isDark ? ['#132035', '#0E1726'] : ['#EFF6FF', '#DBEAFE'],
        badgeBg: 'rgba(59, 130, 246, 0.15)',
        badgeText: '#2563EB',
        iconName: 'calendar' as const,
        title: `${urgentCount} Pedido${urgentCount > 1 ? 's' : ''} programado${urgentCount > 1 ? 's' : ''} para mañana`,
      };

  const handleOpenWhatsApp = (order: typeof topOrderInfo.order) => {
    if (order.whatsapp_url) {
      Linking.openURL(order.whatsapp_url).catch(() => {});
    } else if (order.customer_phone) {
      const cleanPhone = order.customer_phone.replace(/\D/g, '');
      const msg = encodeURIComponent(`Hola ${order.customer_name}, te escribo respecto a tu pedido de galletas que está programado para entrega.`);
      Linking.openURL(`https://wa.me/${cleanPhone}?text=${msg}`).catch(() => {});
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: bannerTheme.border,
        },
      ]}
    >
      <LinearGradient
        colors={bannerTheme.bg as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { padding: isSmallScreen ? 12 : 14 }]}
      >
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={[styles.badgePill, { backgroundColor: bannerTheme.badgeBg }]}>
              <Ionicons name={bannerTheme.iconName} size={14} color={bannerTheme.badgeText} />
              <Text style={[styles.badgeText, { color: bannerTheme.badgeText }]}>
                RECORDATORIO DE ENTREGA
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => setIsExpanded(!isExpanded)}
              style={styles.iconBtn}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsDismissed(true)}
              style={styles.iconBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.title, { color: colors.textMain, fontSize: isSmallScreen ? 14 : 15 }]}>
          {bannerTheme.title}
        </Text>

        {/* Collapsible Content */}
        {isExpanded && (
          <View style={styles.contentBox}>
            {upcomingList.slice(0, 3).map((item, idx) => {
              const o = item.order;
              return (
                <View
                  key={o.id}
                  style={[
                    styles.orderRow,
                    idx > 0 && { borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', paddingTop: 8 },
                  ]}
                >
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={[styles.customerName, { color: colors.textMain }]} numberOfLines={1}>
                        {o.customer_name}
                      </Text>
                      <View
                        style={[
                          styles.urgencyTag,
                          {
                            backgroundColor:
                              item.urgency === 'overdue'
                                ? 'rgba(239, 68, 68, 0.2)'
                                : item.urgency === 'today'
                                ? 'rgba(245, 158, 11, 0.2)'
                                : 'rgba(59, 130, 246, 0.2)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.urgencyTagText,
                            {
                              color:
                                item.urgency === 'overdue'
                                  ? '#EF4444'
                                  : item.urgency === 'today'
                                  ? '#D97706'
                                  : '#2563EB',
                            },
                          ]}
                        >
                          {item.label}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.orderDetail, { color: colors.textMuted }]}>
                      Total: ${o.total_amount.toFixed(2)} • Estado: {o.status}
                    </Text>
                  </View>

                  <View style={styles.actionsGroup}>
                    {Boolean(o.customer_phone) && (
                      <TouchableOpacity
                        onPress={() => handleOpenWhatsApp(o)}
                        style={[styles.miniActionBtn, { backgroundColor: '#25D366' }]}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="logo-whatsapp" size={13} color="#FFF" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => {
                        if (onPressOrder) {
                          onPressOrder(o.id);
                        } else {
                          router.push('/(tabs)/orders' as any);
                        }
                      }}
                      style={[styles.viewOrderBtn, { backgroundColor: colors.brandLight }]}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.viewOrderBtnText}>Ver</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {upcomingList.length > 3 && (
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/orders' as any)}
                style={styles.moreLink}
              >
                <Text style={[styles.moreLinkText, { color: colors.brandLight }]}>
                  Ver todos los {upcomingList.length} pedidos por entregar →
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1.2,
    overflow: 'hidden',
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  gradient: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    padding: 4,
  },
  title: {
    fontWeight: '800',
    marginBottom: 8,
  },
  contentBox: {
    marginTop: 4,
    gap: 8,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  urgencyTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  urgencyTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  orderDetail: {
    fontSize: 11.5,
    marginTop: 2,
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewOrderBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewOrderBtnText: {
    color: '#FFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  moreLink: {
    marginTop: 4,
    alignItems: 'center',
    paddingVertical: 4,
  },
  moreLinkText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
