import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii, spacing } from '../../src/theme';
import { DoubleBezelCard } from '../../src/components/ui/DoubleBezelCard';
import { Badge } from '../../src/components/ui/Badge';
import { useAppStore } from '../../src/stores/app.store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function AnalyticsScreen() {
  const router = useRouter();
  const { summary, expenses, sales, loadAllData, isLoading } = useAppStore();

  const totalRev = summary?.total_cookie_revenue ?? sales.reduce((acc, s) => acc + s.total_revenue, 0);
  const totalProfit = summary?.net_cookie_profit ?? sales.reduce((acc, s) => acc + s.net_profit, 0);
  const totalUnits = summary?.total_cookies_sold ?? sales.reduce((acc, s) => acc + s.quantity, 0);
  const avgMargin = totalRev > 0 ? (totalProfit / totalRev) * 100 : 0;
  const totalExpenses = summary?.total_all_expenses ?? expenses.reduce((acc, e) => acc + e.amount, 0);
  const netBalance = totalRev - totalExpenses;

  const performance = summary?.cookie_performance && summary.cookie_performance.length > 0
    ? summary.cookie_performance
    : [
        { cookie_id: 1, cookie_name: 'Galleta Artesanal Oreo & Chispas', units_sold: 14, revenue: 490, profit: 354.6, margin_pct: 72.4 },
        { cookie_id: 2, cookie_name: 'Chispas Clásicas NY Style', units_sold: 9, revenue: 315, profit: 227.9, margin_pct: 72.4 },
        { cookie_id: 3, cookie_name: 'Red Velvet Cheesecake', units_sold: 6, revenue: 270, profit: 195.0, margin_pct: 72.2 },
      ];

  const maxUnits = Math.max(...performance.map((p) => p.units_sold), 1);

  // Group expenses by category
  const catTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
  });
  const totalExp = Object.values(catTotals).reduce((a, b) => a + b, 0) || 1;

  // Group sales by payment method
  const payTotals: Record<string, number> = {};
  sales.forEach((s) => {
    const method = s.payment_method || 'Efectivo';
    payTotals[method] = (payTotals[method] || 0) + s.total_revenue;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadAllData}
            tintColor={colors.brandLight}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.screenEyebrow}>Métricas Visuales & Reportes</Text>
          <Text style={styles.screenTitle}>Rendimiento Financiero</Text>
          <Text style={styles.screenSubtitle}>
            Balance neto, comparativas de rentabilidad por receta y distribución contable.
          </Text>
        </View>

        {/* 4 KPI Summary Grid */}
        <View style={styles.kpiGrid}>
          <DoubleBezelCard style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Ganancia Neta</Text>
            <Text style={[styles.kpiValue, { color: colors.emeraldLight }]}>
              +${totalProfit.toFixed(0)}
            </Text>
            <Text style={styles.kpiSub}>libre de costos</Text>
          </DoubleBezelCard>

          <DoubleBezelCard style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Venta Bruta</Text>
            <Text style={[styles.kpiValue, { color: colors.amberLight }]}>
              ${totalRev.toFixed(0)}
            </Text>
            <Text style={styles.kpiSub}>{sales.length} ventas</Text>
          </DoubleBezelCard>

          <DoubleBezelCard style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Margen Neto</Text>
            <Text style={[styles.kpiValue, { color: colors.cyan }]}>
              {avgMargin.toFixed(1)}%
            </Text>
            <Text style={styles.kpiSub}>sobre ingresos</Text>
          </DoubleBezelCard>

          <DoubleBezelCard style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Galletas</Text>
            <Text style={[styles.kpiValue, { color: colors.textMain }]}>
              {totalUnits}
            </Text>
            <Text style={styles.kpiSub}>piezas vendidas</Text>
          </DoubleBezelCard>
        </View>

        {/* Net Health Card */}
        <DoubleBezelCard style={styles.sectionCard}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Superávit vs Gastos Totales</Text>
            <Badge
              label={netBalance >= 0 ? "Superávit Positivo" : "Déficit Temporal"}
              variant={netBalance >= 0 ? "emerald" : "rose"}
            />
          </View>
          <Text style={styles.cardSub}>Balance general del negocio y operaciones</Text>

          <View style={styles.healthBarContainer}>
            <View style={styles.healthMetricRow}>
              <Text style={styles.healthKey}>Ingresos Galletas:</Text>
              <Text style={styles.healthValGreen}>+${totalRev.toFixed(2)} MXN</Text>
            </View>
            <View style={styles.healthMetricRow}>
              <Text style={styles.healthKey}>Todos los Gastos:</Text>
              <Text style={styles.healthValRed}>-${totalExpenses.toFixed(2)} MXN</Text>
            </View>
            <View style={[styles.healthMetricRow, styles.healthTotalRow]}>
              <Text style={styles.healthKeyBold}>Balance Neto:</Text>
              <Text style={[styles.healthValBold, { color: netBalance >= 0 ? colors.emeraldLight : colors.rose }]}>
                ${netBalance.toFixed(2)} MXN
              </Text>
            </View>
          </View>
        </DoubleBezelCard>

        {/* Ranking & Profitability Bars */}
        <DoubleBezelCard style={styles.sectionCard}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Ranking de Galletas Más Vendidas</Text>
            <Ionicons name="trophy" size={18} color={colors.amberLight} />
          </View>
          <Text style={styles.cardSub}>Unidades y ganancia neta generada por receta</Text>

          <View style={{ marginTop: 14, gap: 14 }}>
            {performance.map((item, idx) => {
              const barWidth = Math.max(12, (item.units_sold / maxUnits) * 100);
              return (
                <View key={idx}>
                  <View style={styles.cookieBarHeader}>
                    <Text style={styles.cookieBarName}>
                      #{idx + 1} {item.cookie_name}
                    </Text>
                    <Text style={styles.cookieBarProfit}>
                      +${item.profit.toFixed(0)} neta
                    </Text>
                  </View>

                  {/* Horizontal Bar */}
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${barWidth}%` }
                      ]}
                    />
                  </View>

                  <View style={styles.barMetaRow}>
                    <Text style={styles.barMetaText}>{item.units_sold} piezas vendidas</Text>
                    <Badge label={`${item.margin_pct.toFixed(1)}% margen`} variant="emerald" />
                  </View>
                </View>
              );
            })}
          </View>
        </DoubleBezelCard>

        {/* Payment Methods Breakdown */}
        {Object.keys(payTotals).length > 0 && (
          <DoubleBezelCard style={styles.sectionCard}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>Cobros por Método de Pago</Text>
              <Ionicons name="card" size={18} color={colors.emeraldLight} />
            </View>
            <Text style={styles.cardSub}>Total recaudado por canal de pago</Text>

            <View style={{ marginTop: 12, gap: 8 }}>
              {Object.entries(payTotals).map(([method, amt]) => {
                const pct = totalRev > 0 ? ((amt / totalRev) * 100).toFixed(0) : '0';
                return (
                  <View key={method} style={styles.catRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.catName}>{method}</Text>
                      <Text style={styles.catAmount}>${amt.toFixed(2)} MXN</Text>
                    </View>
                    <Badge label={`${pct}%`} variant="emerald" />
                  </View>
                );
              })}
            </View>
          </DoubleBezelCard>
        )}

        {/* Expense Category Breakdown */}
        <DoubleBezelCard style={styles.sectionCard}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Distribución de Gastos</Text>
            <Ionicons name="pie-chart" size={18} color={colors.cyan} />
          </View>
          <Text style={styles.cardSub}>Porcentaje destinado a cada rubro operativo</Text>

          <View style={{ marginTop: 14, gap: 10 }}>
            {Object.entries(catTotals).map(([cat, amt]) => {
              const pct = ((amt / totalExp) * 100).toFixed(1);
              return (
                <View key={cat} style={styles.catRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.catName}>{cat}</Text>
                    <Text style={styles.catAmount}>${amt.toFixed(2)} MXN</Text>
                  </View>
                  <Badge label={`${pct}%`} variant="gray" />
                </View>
              );
            })}
          </View>
        </DoubleBezelCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  container: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  screenEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.brandText,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textMain,
    marginTop: 2,
  },
  screenSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    minWidth: '46%',
    padding: 12,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textDim,
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '900',
    marginVertical: 2,
  },
  kpiSub: {
    fontSize: 10,
    color: colors.textMuted,
  },
  sectionCard: {
    marginBottom: 14,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textMain,
  },
  cardSub: {
    fontSize: 11,
    color: colors.textDim,
    marginTop: 2,
  },
  healthBarContainer: {
    marginTop: 12,
    gap: 6,
    backgroundColor: '#F9FAFB',
    borderRadius: radii.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  healthMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  healthKey: {
    fontSize: 12,
    color: colors.textDim,
  },
  healthKeyBold: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textMain,
  },
  healthValGreen: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.emeraldLight,
  },
  healthValRed: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.rose,
  },
  healthTotalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: 6,
    marginTop: 2,
  },
  healthValBold: {
    fontSize: 14,
    fontWeight: '900',
  },
  cookieBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cookieBarName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMain,
  },
  cookieBarProfit: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.emeraldLight,
  },
  barTrack: {
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
    marginVertical: 4,
  },
  barFill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.emerald,
  },
  barMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barMetaText: {
    fontSize: 11,
    color: colors.textDim,
  },
  catRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  catName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMain,
  },
  catAmount: {
    fontSize: 11,
    color: colors.textDim,
    marginTop: 2,
  },
});
