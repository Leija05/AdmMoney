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
import { LinearGradient } from 'expo-linear-gradient';
import { colors, useThemeColors, radii, spacing, gradients } from '../../src/theme';
import { DoubleBezelCard } from '../../src/components/ui/DoubleBezelCard';
import { Badge } from '../../src/components/ui/Badge';
import { SwipeTabWrapper } from '../../src/components/ui/SwipeTabWrapper';
import { useAppStore } from '../../src/stores/app.store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function AnalyticsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { summary, expenses, sales, loadAllData, isLoading, theme, toggleTheme } = useAppStore();

  // Métricas reales calculadas directamente de las ventas cobradas registradas
  const totalRev = sales.length > 0
    ? sales.reduce((acc, s) => acc + (s.total_revenue || 0), 0)
    : (summary?.total_cookie_revenue ?? 0);

  const totalProfit = sales.length > 0
    ? sales.reduce((acc, s) => acc + (s.net_profit || 0), 0)
    : (summary?.net_cookie_profit ?? 0);

  const totalUnits = sales.length > 0
    ? sales.reduce((acc, s) => acc + (s.quantity || 0), 0)
    : (summary?.total_cookies_sold ?? 0);

  const avgMargin = totalRev > 0 ? (totalProfit / totalRev) * 100 : 0;
  const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const netBalance = totalRev - totalExpenses;

  // Rendimiento real por receta agrupado directamente de las ventas
  const perfMap = new Map<string, { cookie_id: number; cookie_name: string; units_sold: number; revenue: number; profit: number }>();
  sales.forEach((s) => {
    const name = s.cookie_name || 'Galleta';
    const curr = perfMap.get(name) || {
      cookie_id: s.cookie_id,
      cookie_name: name,
      units_sold: 0,
      revenue: 0,
      profit: 0,
    };
    curr.units_sold += (s.quantity || 0);
    curr.revenue += (s.total_revenue || 0);
    curr.profit += (s.net_profit || 0);
    perfMap.set(name, curr);
  });

  const realPerformance = Array.from(perfMap.values()).map((p) => ({
    ...p,
    margin_pct: p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0,
  })).sort((a, b) => b.revenue - a.revenue);

  const performance = realPerformance.length > 0
    ? realPerformance
    : (summary?.cookie_performance && summary.cookie_performance.length > 0
        ? summary.cookie_performance
        : []);

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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgPrimary }]}>
      <SwipeTabWrapper currentRoute="/analytics">
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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.screenEyebrow, { color: colors.cyan }]}>Métricas Visuales & Reportes</Text>
              <Text style={[styles.screenTitle, { color: colors.textMain }]}>Rendimiento Financiero</Text>
            </View>
            <TouchableOpacity
              onPress={toggleTheme}
              style={[styles.themeToggleBtn, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}
            >
              <Ionicons
                name={theme === 'dark' ? 'sunny' : 'moon'}
                size={16}
                color={theme === 'dark' ? colors.amberLight : colors.textMuted}
              />
            </TouchableOpacity>
          </View>
          <Text style={[styles.screenSubtitle, { color: colors.textMuted }]}>
            Balance neto, comparativas de rentabilidad por receta y distribución contable.
          </Text>
        </View>

        {/* 4 KPI Summary Grid with soft luminous gradient cards */}
        <View style={styles.kpiGrid}>
          <DoubleBezelCard
            style={styles.kpiCard}
            gradient={
              theme === 'dark'
                ? ['rgba(16,185,129,0.12)', 'rgba(28,32,43,0.95)']
                : ['#F0FDF4', '#FFFFFF']
            }
          >
            <Text style={[styles.kpiLabel, { color: colors.textDim }]}>Ganancia Neta</Text>
            <Text style={[styles.kpiValue, { color: colors.emeraldLight }]}>
              +${totalProfit.toFixed(0)}
            </Text>
            <Text style={[styles.kpiSub, { color: colors.textDim }]}>libre de costos</Text>
          </DoubleBezelCard>

          <DoubleBezelCard
            style={styles.kpiCard}
            gradient={
              theme === 'dark'
                ? ['rgba(245,158,11,0.12)', 'rgba(28,32,43,0.95)']
                : ['#FFFBEB', '#FFFFFF']
            }
          >
            <Text style={[styles.kpiLabel, { color: colors.textDim }]}>Venta Bruta</Text>
            <Text style={[styles.kpiValue, { color: colors.amberLight }]}>
              ${totalRev.toFixed(0)}
            </Text>
            <Text style={[styles.kpiSub, { color: colors.textDim }]}>{sales.length} ventas</Text>
          </DoubleBezelCard>

          <DoubleBezelCard
            style={styles.kpiCard}
            gradient={
              theme === 'dark'
                ? ['rgba(6,182,212,0.12)', 'rgba(28,32,43,0.95)']
                : ['#ECFEFF', '#FFFFFF']
            }
          >
            <Text style={[styles.kpiLabel, { color: colors.textDim }]}>Margen Neto</Text>
            <Text style={[styles.kpiValue, { color: colors.cyan }]}>
              {avgMargin.toFixed(1)}%
            </Text>
            <Text style={[styles.kpiSub, { color: colors.textDim }]}>sobre ingresos</Text>
          </DoubleBezelCard>

          <DoubleBezelCard
            style={styles.kpiCard}
            gradient={
              theme === 'dark'
                ? ['rgba(59,130,246,0.12)', 'rgba(28,32,43,0.95)']
                : ['#EFF6FF', '#FFFFFF']
            }
          >
            <Text style={[styles.kpiLabel, { color: colors.textDim }]}>Galletas</Text>
            <Text style={[styles.kpiValue, { color: colors.textMain }]}>
              {totalUnits}
            </Text>
            <Text style={[styles.kpiSub, { color: colors.textDim }]}>piezas vendidas</Text>
          </DoubleBezelCard>
        </View>

        {/* Net Health Card */}
        <DoubleBezelCard
          style={styles.sectionCard}
          gradient={theme === 'dark' ? ['#1C202B', '#14171F'] : ['#FFFFFF', '#F8FAFC']}
        >
          <View style={styles.cardTitleRow}>
            <Text style={[styles.cardTitle, { color: colors.textMain }]}>Superávit vs Gastos Totales</Text>
            <Badge
              label={netBalance >= 0 ? "Superávit Positivo" : "Déficit Temporal"}
              variant={netBalance >= 0 ? "emerald" : "rose"}
            />
          </View>
          <Text style={[styles.cardSub, { color: colors.textMuted }]}>Balance general del negocio y operaciones</Text>

          <View style={[styles.healthBarContainer, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}>
            <View style={styles.healthMetricRow}>
              <Text style={[styles.healthKey, { color: colors.textDim }]}>Ingresos Galletas:</Text>
              <Text style={styles.healthValGreen}>+${totalRev.toFixed(2)} MXN</Text>
            </View>
            <View style={styles.healthMetricRow}>
              <Text style={[styles.healthKey, { color: colors.textDim }]}>Todos los Gastos:</Text>
              <Text style={styles.healthValRed}>-${totalExpenses.toFixed(2)} MXN</Text>
            </View>
            <View style={[styles.healthMetricRow, styles.healthTotalRow, { borderTopColor: colors.borderSubtle }]}>
              <Text style={[styles.healthKeyBold, { color: colors.textMain }]}>Balance Neto:</Text>
              <Text style={[styles.healthValBold, { color: netBalance >= 0 ? colors.emeraldLight : colors.rose }]}>
                ${netBalance.toFixed(2)} MXN
              </Text>
            </View>
          </View>
        </DoubleBezelCard>

        {/* Ranking & Profitability Bars */}
        <DoubleBezelCard
          style={styles.sectionCard}
          gradient={theme === 'dark' ? ['#1C202B', '#14171F'] : ['#FFFFFF', '#F8FAFC']}
        >
          <View style={styles.cardTitleRow}>
            <Text style={[styles.cardTitle, { color: colors.textMain }]}>Ranking de Galletas Más Vendidas</Text>
            <Ionicons name="trophy" size={18} color={colors.amberLight} />
          </View>
          <Text style={[styles.cardSub, { color: colors.textMuted }]}>Unidades y ganancia neta generada por receta</Text>

          <View style={{ marginTop: 14, gap: 14 }}>
            {performance.map((item, idx) => {
              const barWidth = Math.max(12, (item.units_sold / maxUnits) * 100);
              return (
                <View key={idx}>
                  <View style={styles.cookieBarHeader}>
                    <Text style={[styles.cookieBarName, { color: colors.textMain }]}>
                      #{idx + 1} {item.cookie_name}
                    </Text>
                    <Text style={[styles.cookieBarProfit, { color: colors.emeraldLight }]}>
                      +${item.profit.toFixed(0)} neta
                    </Text>
                  </View>

                  {/* Horizontal Bar with Multi-stop Gradient */}
                  <View style={[styles.barTrack, { backgroundColor: colors.borderSubtle }]}>
                    <LinearGradient
                      colors={
                        idx === 0
                          ? ['#F59E0B', '#10B981']
                          : idx === 1
                          ? ['#10B981', '#06B6D4']
                          : ['#8B5CF6', '#3B82F6']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[
                        styles.barFill,
                        { width: `${barWidth}%` }
                      ]}
                    />
                  </View>

                  <View style={styles.barMetaRow}>
                    <Text style={[styles.barMetaText, { color: colors.textDim }]}>{item.units_sold} piezas vendidas</Text>
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
              <Text style={[styles.cardTitle, { color: colors.textMain }]}>Cobros por Método de Pago</Text>
              <Ionicons name="card" size={18} color={colors.emeraldLight} />
            </View>
            <Text style={[styles.cardSub, { color: colors.textMuted }]}>Total recaudado por canal de pago</Text>

            <View style={{ marginTop: 12, gap: 8 }}>
              {Object.entries(payTotals).map(([method, amt]) => {
                const pct = totalRev > 0 ? ((amt / totalRev) * 100).toFixed(0) : '0';
                return (
                  <View key={method} style={[styles.catRow, { borderBottomColor: colors.borderSubtle }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.catName, { color: colors.textMain }]}>{method}</Text>
                      <Text style={[styles.catAmount, { color: colors.textDim }]}>${amt.toFixed(2)} MXN</Text>
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
            <Text style={[styles.cardTitle, { color: colors.textMain }]}>Distribución de Gastos</Text>
            <Ionicons name="pie-chart" size={18} color={colors.cyan} />
          </View>
          <Text style={[styles.cardSub, { color: colors.textMuted }]}>Porcentaje destinado a cada rubro operativo</Text>

          <View style={{ marginTop: 14, gap: 10 }}>
            {Object.entries(catTotals).map(([cat, amt]) => {
              const pct = ((amt / totalExp) * 100).toFixed(1);
              return (
                <View key={cat} style={[styles.catRow, { borderBottomColor: colors.borderSubtle }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.catName, { color: colors.textMain }]}>{cat}</Text>
                    <Text style={[styles.catAmount, { color: colors.textDim }]}>${amt.toFixed(2)} MXN</Text>
                  </View>
                  <Badge label={`${pct}%`} variant="gray" />
                </View>
              );
            })}
          </View>
        </DoubleBezelCard>
      </ScrollView>
      </SwipeTabWrapper>
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
  themeToggleBtn: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: colors.bgTertiary,
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
    backgroundColor: colors.borderSubtle,
    overflow: 'hidden',
    marginVertical: 4,
  },
  barFill: {
    height: '100%',
    borderRadius: radii.pill,
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
