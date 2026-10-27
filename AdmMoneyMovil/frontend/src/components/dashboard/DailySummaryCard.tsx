import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../stores/app.store';
import { useThemeColors, radii } from '../../theme';
import { DoubleBezelCard } from '../ui/DoubleBezelCard';
import { DailySummaryModal } from './DailySummaryModal';

export const DailySummaryCard: React.FC = () => {
  const colors = useThemeColors();
  const isDark = colors.isDark;
  const { computeDailySummary, currency, privacyMode } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Calcular el resumen de la fecha de hoy
  const summary = computeDailySummary();

  // CONDICIÓN ESTRICTA: SOLO MOSTRAR SI HAY VENTAS
  if (!summary.has_sales || summary.sales_count === 0) {
    return null;
  }

  return (
    <>
      <DoubleBezelCard
        gradient={
          isDark
            ? ['rgba(16, 185, 129, 0.12)', 'rgba(5, 150, 105, 0.04)']
            : ['#F0FDF4', '#DCFCE7']
        }
        style={styles.card}
      >
        {/* Header Row */}
        <View style={styles.topRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 }}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.22)' : '#BBF7D0' },
              ]}
            >
              <Ionicons name="stats-chart" size={15} color={colors.emeraldLight} />
            </View>
            <View>
              <Text style={[styles.title, { color: colors.textMain }]}>Resumen del Día</Text>
              <Text style={[styles.sub, { color: colors.textDim }]}>
                {summary.sales_count} {summary.sales_count === 1 ? 'venta hoy' : 'ventas hoy'} • {summary.total_units_sold} piezas
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.liveBadge,
              { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.18)' : '#D1FAE5' },
            ]}
          >
            <View style={[styles.liveDot, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.liveText, { color: colors.emeraldLight }]}>Activo</Text>
          </View>
        </View>

        {/* Figures Row */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCol}>
            <Text style={[styles.metricLabel, { color: colors.textDim }]}>Ventas Totales</Text>
            <Text style={[styles.metricMainVal, { color: colors.textMain }]}>
              {privacyMode
                ? '••••'
                : `$${summary.total_revenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
              <Text style={[styles.currencyLabel, { color: colors.textDim }]}> {currency}</Text>
            </Text>
          </View>

          <View style={[styles.dividerVertical, { backgroundColor: colors.borderSubtle }]} />

          <View style={styles.metricCol}>
            <Text style={[styles.metricLabel, { color: colors.textDim }]}>Ganancia Neta</Text>
            <Text style={[styles.metricMainVal, { color: colors.emeraldLight }]}>
              {privacyMode
                ? '••••'
                : `+$${summary.net_profit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
              <Text style={[styles.marginTag, { color: colors.emeraldLight }]}>
                {' '}({summary.profit_margin_pct.toFixed(0)}%)
              </Text>
            </Text>
          </View>
        </View>

        {/* Payment Methods Breakdown Pills */}
        <View
          style={[
            styles.paymentPillBox,
            { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.7)', borderColor: colors.borderSubtle },
          ]}
        >
          <View style={styles.paymentMethodItem}>
            <Ionicons name="cash-outline" size={14} color={colors.emeraldLight} />
            <Text style={[styles.paymentMethodLabel, { color: colors.textDim }]}>Efectivo:</Text>
            <Text style={[styles.paymentMethodVal, { color: colors.textMain }]}>
              {privacyMode
                ? '••••'
                : `$${summary.cash_total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
            </Text>
          </View>

          <View style={[styles.smallDivider, { backgroundColor: colors.borderSubtle }]} />

          <View style={styles.paymentMethodItem}>
            <Ionicons name="swap-horizontal-outline" size={14} color={colors.brandLight} />
            <Text style={[styles.paymentMethodLabel, { color: colors.textDim }]}>Transferencia:</Text>
            <Text style={[styles.paymentMethodVal, { color: colors.textMain }]}>
              {privacyMode
                ? '••••'
                : `$${summary.transfer_total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
            </Text>
          </View>
        </View>

        {/* View Details Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setIsModalOpen(true)}
          style={[
            styles.detailButton,
            { backgroundColor: isDark ? colors.bgTertiary : '#FFFFFF', borderColor: colors.borderSubtle },
          ]}
        >
          <Ionicons name="list-outline" size={15} color={colors.textMain} />
          <Text style={[styles.detailButtonText, { color: colors.textMain }]}>
            Ver Resumen del Día
          </Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textDim} />
        </TouchableOpacity>
      </DoubleBezelCard>

      {/* Modal Detallado */}
      {isModalOpen && (
        <DailySummaryModal
          visible={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          summary={summary}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 14,
    marginBottom: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sub: {
    fontSize: 11,
    marginTop: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricCol: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  metricMainVal: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  currencyLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  marginTag: {
    fontSize: 12,
    fontWeight: '700',
  },
  dividerVertical: {
    width: 1,
    height: 32,
    marginHorizontal: 12,
  },
  paymentPillBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: 10,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  paymentMethodLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  paymentMethodVal: {
    fontSize: 12,
    fontWeight: '800',
  },
  smallDivider: {
    width: 1,
    height: 14,
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  detailButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
