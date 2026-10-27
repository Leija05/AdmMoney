import React, { useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Dimensions,
  Animated,
  PanResponder,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, radii, spacing } from '../../theme';
import { DailySummary } from '../../lib/types';
import { useAppStore } from '../../stores/app.store';
import { MobileApiService } from '../../services/api';

interface DailySummaryModalProps {
  visible: boolean;
  onClose: () => void;
  summary: DailySummary;
}

export const DailySummaryModal: React.FC<DailySummaryModalProps> = ({
  visible,
  onClose,
  summary,
}) => {
  const colors = useThemeColors();
  const isDark = colors.isDark;
  const { businessName, currency } = useAppStore();

  const screenHeight = Dimensions.get('window').height;
  const translateY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        return gestureState.dy > 6 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.3;
      },
      onPanResponderMove: (_evt, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        } else {
          translateY.setValue(gestureState.dy * 0.15);
        }
      },
      onPanResponderRelease: (_evt, gestureState) => {
        if (gestureState.dy > 110 || (gestureState.dy > 30 && gestureState.vy > 0.35)) {
          Animated.timing(translateY, {
            toValue: screenHeight,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            onClose();
            translateY.setValue(0);
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            friction: 8,
            tension: 80,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleShareWhatsApp = () => {
    const bName = businessName || 'Lucky Cookies';
    const lines = [
      `RESUMEN DEL DÍA - ${bName.toUpperCase()}`,
      `Fecha: ${summary.date}`,
      '----------------------------------------',
      `Ventas Totales: $${summary.total_revenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${currency}`,
      `Ganancia Neta: $${summary.net_profit.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${currency} (${summary.profit_margin_pct.toFixed(1)}%)`,
      `Piezas Vendidas: ${summary.total_units_sold} piezas`,
      `Tickets Cobrados: ${summary.sales_count}`,
      `Ticket Promedio: $${summary.average_ticket.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${currency}`,
      '',
      'MÉTODOS DE PAGO:',
      `• Efectivo: $${summary.cash_total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${currency}`,
      `• Transferencia: $${summary.transfer_total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${currency}`,
    ];

    if (summary.expenses_cash > 0) {
      lines.push(
        `• Gastos en efectivo: -$${summary.expenses_cash.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${currency}`,
        `• Balance en efectivo: $${summary.cash_balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${currency}`
      );
    }

    if (summary.products && summary.products.length > 0) {
      lines.push('', 'PRODUCTOS VENDIDOS:');
      for (const p of summary.products) {
        lines.push(`• ${p.quantity}x ${p.name}: $${p.revenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
      }
    }

    lines.push('----------------------------------------', 'Generado desde Adm Money');

    const msg = lines.join('\n');
    const url = `whatsapp://send?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => {
      const webUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
      Linking.openURL(webUrl).catch(() => {
        Alert.alert('Error', 'No se pudo abrir WhatsApp.');
      });
    });
  };

  const handleOpenPdf = () => {
    const pdfUrl = MobileApiService.getDailySummaryPdfUrl(summary.date);
    Linking.openURL(pdfUrl).catch(() => {
      Alert.alert('Error', 'No se pudo abrir el ticket PDF del resumen.');
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            { backgroundColor: colors.bgSecondary, transform: [{ translateY }] },
          ]}
        >
          {/* Swipe indicator bar */}
          <View {...panResponder.panHandlers} style={styles.panHeaderArea}>
            <View style={[styles.dragHandle, { backgroundColor: colors.borderSubtle }]} />
          </View>

          {/* Modal Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <View style={[styles.headerIconCircle, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : '#E0F2FE' }]}>
                  <Ionicons name="stats-chart" size={17} color={colors.brandLight} />
                </View>
                <Text style={[styles.headerTitle, { color: colors.textMain }]}>Resumen del Día</Text>
              </View>
              <Text style={[styles.headerSubtitle, { color: colors.textDim }]}>
                {summary.date} • {summary.sales_count} {summary.sales_count === 1 ? 'venta registrada' : 'ventas registradas'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: colors.bgTertiary }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={18} color={colors.textMain} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* KPI Cards Grid */}
            <View style={styles.kpiGrid}>
              <View style={[styles.kpiCard, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}>
                <View style={styles.kpiIconRow}>
                  <Ionicons name="pricetag-outline" size={15} color={colors.emeraldLight} />
                  <Text style={[styles.kpiLabel, { color: colors.textDim }]}>Ventas Totales</Text>
                </View>
                <Text style={[styles.kpiValue, { color: colors.textMain }]}>
                  ${summary.total_revenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </Text>
              </View>

              <View style={[styles.kpiCard, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}>
                <View style={styles.kpiIconRow}>
                  <Ionicons name="trending-up-outline" size={15} color={colors.emeraldLight} />
                  <Text style={[styles.kpiLabel, { color: colors.textDim }]}>Ganancia Neta</Text>
                </View>
                <Text style={[styles.kpiValue, { color: colors.emeraldLight }]}>
                  ${summary.net_profit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </Text>
              </View>

              <View style={[styles.kpiCard, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}>
                <View style={styles.kpiIconRow}>
                  <Ionicons name="pie-chart-outline" size={15} color={colors.amberLight} />
                  <Text style={[styles.kpiLabel, { color: colors.textDim }]}>Margen</Text>
                </View>
                <Text style={[styles.kpiValue, { color: colors.textMain }]}>
                  {summary.profit_margin_pct.toFixed(1)}%
                </Text>
              </View>

              <View style={[styles.kpiCard, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}>
                <View style={styles.kpiIconRow}>
                  <Ionicons name="cube-outline" size={15} color={colors.brandLight} />
                  <Text style={[styles.kpiLabel, { color: colors.textDim }]}>Piezas Vendidas</Text>
                </View>
                <Text style={[styles.kpiValue, { color: colors.textMain }]}>
                  {summary.total_units_sold}
                </Text>
              </View>
            </View>

            {/* SECCIÓN: MÉTODOS DE PAGO (SOLO EFECTIVO O TRANSFERENCIA) */}
            <View style={styles.sectionBox}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="wallet-outline" size={16} color={colors.brandLight} />
                <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Métodos de Pago</Text>
              </View>

              <View style={styles.paymentMethodsRow}>
                {/* EFECTIVO */}
                <View
                  style={[
                    styles.paymentCard,
                    { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Ionicons name="cash-outline" size={16} color={colors.emeraldLight} />
                    <Text style={[styles.paymentCardTitle, { color: colors.textDim }]}>Efectivo</Text>
                  </View>
                  <Text style={[styles.paymentCardAmount, { color: colors.textMain }]}>
                    ${summary.cash_total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </Text>
                </View>

                {/* TRANSFERENCIA */}
                <View
                  style={[
                    styles.paymentCard,
                    { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Ionicons name="swap-horizontal-outline" size={16} color={colors.brandLight} />
                    <Text style={[styles.paymentCardTitle, { color: colors.textDim }]}>Transferencia</Text>
                  </View>
                  <Text style={[styles.paymentCardAmount, { color: colors.textMain }]}>
                    ${summary.transfer_total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>

              {/* Si hubo gastos en efectivo hoy */}
              {summary.expenses_cash > 0 && (
                <View
                  style={[
                    styles.cashBalanceBox,
                    { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle },
                  ]}
                >
                  <View style={styles.cashBalanceRow}>
                    <Text style={[styles.cashBalanceLabel, { color: colors.textDim }]}>
                      Gastos registrados en efectivo hoy:
                    </Text>
                    <Text style={[styles.cashBalanceVal, { color: colors.roseLight }]}>
                      -${summary.expenses_cash.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                  <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />
                  <View style={styles.cashBalanceRow}>
                    <Text style={[styles.cashBalanceLabelBold, { color: colors.textMain }]}>
                      Balance en efectivo:
                    </Text>
                    <Text style={[styles.cashBalanceValBold, { color: colors.emeraldLight }]}>
                      ${summary.cash_balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* SECCIÓN: PRODUCTOS VENDIDOS */}
            {summary.products && summary.products.length > 0 && (
              <View style={styles.sectionBox}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="layers-outline" size={16} color={colors.amberLight} />
                  <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Productos Vendidos</Text>
                </View>

                <View style={[styles.productsList, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}>
                  {summary.products.map((item, index) => (
                    <View
                      key={`${item.name}-${index}`}
                      style={[
                        styles.productItemRow,
                        index < summary.products.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
                      ]}
                    >
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={[styles.productName, { color: colors.textMain }]}>{item.name}</Text>
                        <Text style={[styles.productSub, { color: colors.textDim }]}>
                          {item.quantity} {item.quantity === 1 ? 'pieza' : 'piezas'}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.productRevenue, { color: colors.textMain }]}>
                          ${item.revenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </Text>
                        <Text style={[styles.productProfit, { color: colors.emeraldLight }]}>
                          +${item.profit.toLocaleString('es-MX', { minimumFractionDigits: 2 })} neta
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ACTION BUTTONS */}
            <View style={styles.actionsBox}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleShareWhatsApp}
                style={[styles.actionBtn, { backgroundColor: '#25D366' }]}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>Compartir por WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleOpenPdf}
                style={[
                  styles.actionBtnSecondary,
                  { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle },
                ]}
              >
                <Ionicons name="document-text-outline" size={17} color={colors.textMain} />
                <Text style={[styles.actionBtnSecondaryText, { color: colors.textMain }]}>
                  Ver Ticket PDF
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  panHeaderArea: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
  },
  headerIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  kpiIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionBox: {
    marginBottom: 18,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  paymentCard: {
    flex: 1,
    padding: 12,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  paymentCardTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  paymentCardAmount: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  cashBalanceBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  cashBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cashBalanceLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  cashBalanceVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  cashBalanceLabelBold: {
    fontSize: 12,
    fontWeight: '700',
  },
  cashBalanceValBold: {
    fontSize: 14,
    fontWeight: '800',
  },
  productsList: {
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  productItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  productName: {
    fontSize: 13,
    fontWeight: '700',
  },
  productSub: {
    fontSize: 11,
    marginTop: 2,
  },
  productRevenue: {
    fontSize: 13,
    fontWeight: '800',
  },
  productProfit: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  actionsBox: {
    gap: 10,
    paddingBottom: 24,
    paddingTop: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radii.lg,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  actionBtnSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
