import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, useThemeColors, radii, spacing, gradients } from '../../src/theme';
import { DoubleBezelCard } from '../../src/components/ui/DoubleBezelCard';
import { Badge } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';
import { ExpenseDetailModal } from '../../src/components/expenses/ExpenseDetailModal';
import { BackendHeartbeat } from '../../src/components/ui/BackendHeartbeat';
import { SwipeTabWrapper } from '../../src/components/ui/SwipeTabWrapper';
import { FadeSlideIn } from '../../src/components/ui/FadeSlideIn';
import { useAppStore } from '../../src/stores/app.store';
import { Expense, CookieProduct } from '../../src/lib/types';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const {
    expenses,
    sales,
    cookies,
    summary,
    isOnline,
    useMockData,
    loadAllData,
    isLoading,
    addExpense,
    updateExpense,
    deleteExpense,
    addCookieSale,
    theme,
    toggleTheme,
  } = useAppStore();

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isQuickExpenseOpen, setIsQuickExpenseOpen] = useState(false);
  const [quickExpTitle, setQuickExpTitle] = useState('');
  const [quickExpAmount, setQuickExpAmount] = useState('');

  const [isQuickSaleOpen, setIsQuickSaleOpen] = useState(false);
  const [quickSaleQty, setQuickSaleQty] = useState(1);
  const [quickSalePromo, setQuickSalePromo] = useState(false);

  const totalExpenses = summary?.total_all_expenses ?? expenses.reduce((acc, e) => acc + e.amount, 0);
  const cookieRevenue = summary?.total_cookie_revenue ?? sales.reduce((acc, s) => acc + s.total_revenue, 0);
  const cookieProfit = summary?.net_cookie_profit ?? sales.reduce((acc, s) => acc + s.net_profit, 0);
  const netBalance = cookieRevenue - totalExpenses;
  const marginPct = summary?.cookie_profit_margin_pct ?? (cookieRevenue > 0 ? (cookieProfit / cookieRevenue) * 100 : 0);

  const starCookie = cookies[0] || {
    id: 1,
    name: 'Galleta Artesanal Oreo & Chispas',
    sale_price: 35.0,
    recipe_cost: 9.67,
    profit_per_unit: 25.33,
  };

  const handleCreateQuickExpense = async () => {
    const val = parseFloat(quickExpAmount);
    if (!quickExpTitle.trim() || isNaN(val) || val <= 0) {
      Alert.alert('Datos Incompletos', 'Ingresa concepto y monto válido.');
      return;
    }
    await addExpense({
      title: quickExpTitle.trim(),
      amount: val,
      category: 'Insumos Galletas',
      date: new Date().toISOString().split('T')[0],
      payment_method: 'Efectivo',
    });
    setQuickExpTitle('');
    setQuickExpAmount('');
    setIsQuickExpenseOpen(false);
    Alert.alert('¡Gasto Guardado!', `Se sumaron $${val.toFixed(2)} MXN a tus gastos.`);
  };

  const handleConfirmStarSale = async () => {
    const unitPrice = quickSalePromo ? 30.0 : starCookie.sale_price;
    const totalRev = unitPrice * quickSaleQty;
    const netProf = totalRev - (starCookie.recipe_cost * quickSaleQty);

    await addCookieSale({
      cookie_id: starCookie.id,
      quantity: quickSaleQty,
      unit_price: unitPrice,
      customer_name: 'Cliente Mostrador',
      payment_method: 'Efectivo',
      notes: quickSalePromo
        ? `Promo 3x$90 (${quickSaleQty} pzas a $30 c/u)`
        : `Venta Individual (${quickSaleQty} pza a $${unitPrice.toFixed(2)})`,
    });

    setIsQuickSaleOpen(false);
    Alert.alert(
      '¡Venta Registrada!',
      `Cobraste $${totalRev.toFixed(2)} MXN y obtuviste +$${netProf.toFixed(2)} MXN de ganancia libre.`
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgPrimary }]}>
      <SwipeTabWrapper currentRoute="/">
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
        {/* Header bar */}
        <View style={styles.header}>
          <View>
            <View style={styles.brandRow}>
              <View style={styles.brandDot} />
              <Text style={styles.brandText}>Adm Money Mobile</Text>
            </View>
            <Text style={[styles.greeting, { color: colors.textMain }]}>Resumen Financiero</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <TouchableOpacity
              onPress={toggleTheme}
              style={{
                width: 32,
                height: 32,
                borderRadius: radii.pill,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                backgroundColor: colors.bgCard,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name={theme === 'dark' ? 'sunny' : 'moon'}
                size={16}
                color={theme === 'dark' ? colors.amberLight : colors.textMuted}
              />
            </TouchableOpacity>

            <BackendHeartbeat onPress={() => router.push('/settings')} />
          </View>
        </View>

        {/* Global Net Balance Luxury Gradient Card */}
        <FadeSlideIn delay={40}>
          <DoubleBezelCard
            gradient={
              theme === 'dark'
                ? ['#192338', '#111724']
                : ['#0284C7', '#0369A1']
            }
            style={styles.balanceCard}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Animated.View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: netBalance >= 0 ? '#4ADE80' : '#FB7185',
                    transform: [{ scale: pulseAnim }],
                  }}
                />
                <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                  Liquidez Neta en Caja
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: radii.pill,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.25)',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800' }}>
                  {netBalance >= 0 ? '✓ Superávit' : '⚠ Déficit'}
                </Text>
              </View>
            </View>

            <Text style={{ fontSize: 32, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 }}>
              ${netBalance.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <Text style={{ fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.65)' }}> MXN</Text>
            </Text>

            {/* Micro Dual Ledger Indicators with Frosted Glass */}
            <View
              style={{
                flexDirection: 'row',
                marginTop: 14,
                backgroundColor: 'rgba(0, 0, 0, 0.22)',
                borderRadius: radii.md,
                padding: 12,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.12)',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>
                  Ingresos Galletas
                </Text>
                <Text style={{ fontSize: 15, fontWeight: '900', color: '#6EE7B7', marginTop: 2 }}>
                  +${cookieRevenue.toFixed(2)}
                </Text>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#A7F3D0', marginTop: 1 }}>
                  +${cookieProfit.toFixed(2)} libres ({marginPct.toFixed(0)}%)
                </Text>
              </View>

              <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 10 }} />

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>
                  Egresos Totales
                </Text>
                <Text style={{ fontSize: 15, fontWeight: '900', color: '#FDA4AF', marginTop: 2 }}>
                  -${totalExpenses.toFixed(2)}
                </Text>
                <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 1 }}>
                  {expenses.length} movimientos
                </Text>
              </View>
            </View>
          </DoubleBezelCard>
        </FadeSlideIn>

        {/* Quick Bento Stats (2 Clickable Columns) */}
        <FadeSlideIn delay={90}>
          <View style={styles.bentoRow}>
            {/* Cookie Business Profit */}
            <TouchableOpacity
              style={styles.bentoHalf}
              activeOpacity={0.8}
              onPress={() => router.push('/cookies')}
            >
              <DoubleBezelCard>
                <View style={styles.statHeader}>
                  <Text style={[styles.statMiniTitle, { color: colors.textMuted }]}>Ganancia Galletas</Text>
                  <Ionicons name="cafe" size={16} color={colors.amberLight} />
                </View>
                <Text style={[styles.statValue, { color: colors.emeraldLight }]}>
                  +${cookieProfit.toFixed(2)}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <Text style={[styles.statSub, { color: colors.textDim }]}>{marginPct.toFixed(1)}% margen neto</Text>
                  <Ionicons name="chevron-forward" size={13} color={colors.textDim} />
                </View>
              </DoubleBezelCard>
            </TouchableOpacity>

            {/* General Expenses */}
            <TouchableOpacity
              style={styles.bentoHalf}
              activeOpacity={0.8}
              onPress={() => router.push('/expenses')}
            >
              <DoubleBezelCard>
                <View style={styles.statHeader}>
                  <Text style={[styles.statMiniTitle, { color: colors.textMuted }]}>Gastos Totales</Text>
                  <Ionicons name="receipt" size={16} color={colors.rose} />
                </View>
                <Text style={[styles.statValue, { color: colors.rose }]}>
                  -${totalExpenses.toFixed(2)}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <Text style={[styles.statSub, { color: colors.textDim }]}>{expenses.length} movimientos</Text>
                  <Ionicons name="chevron-forward" size={13} color={colors.textDim} />
                </View>
              </DoubleBezelCard>
            </TouchableOpacity>
          </View>
        </FadeSlideIn>

        {/* Action Shortcuts with Tactical Gradients */}
        <FadeSlideIn delay={140}>
          <View style={styles.shortcutsRow}>
            <Button
              title="Escanear"
              variant="primary"
              icon={<Ionicons name="camera" size={15} color="#fff" />}
              onPress={() => router.push('/scanner')}
              style={{ flex: 1 }}
            />
            <Button
              title="+ Gasto"
              variant="danger"
              icon={<Ionicons name="receipt" size={15} color="#fff" />}
              onPress={() => setIsQuickExpenseOpen(true)}
              style={{ flex: 1 }}
            />
            <Button
              title="+ Venta"
              variant="amber"
              icon={<Ionicons name="cart" size={15} color="#fff" />}
              onPress={() => router.push('/cookies')}
              style={{ flex: 1 }}
            />
          </View>
        </FadeSlideIn>

        {/* Star Cookie Highlight */}
        <FadeSlideIn delay={190}>
          <DoubleBezelCard style={styles.starCookieCard}>
            <View style={styles.starCookieRow}>
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                  backgroundColor: colors.amberBg,
                  borderWidth: 1.5,
                  borderColor: colors.amberBorder,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="sparkles" size={20} color={colors.amberLight} />
              </View>

              <View style={{ flex: 1, marginHorizontal: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: colors.amberLight, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    ⭐ Joya de la Casa
                  </Text>
                  <Badge label="Top 1" variant="amber" />
                </View>
                <Text style={{ fontSize: 14, fontWeight: '800', color: colors.textMain }} numberOfLines={1}>
                  {starCookie.name}
                </Text>
                <Text style={{ fontSize: 11, color: colors.textDim, marginTop: 2 }}>
                  Costo: ${starCookie.recipe_cost.toFixed(2)} • Ganas <Text style={{ color: colors.emerald, fontWeight: '800' }}>+${starCookie.profit_per_unit.toFixed(2)}</Text> c/u
                </Text>
              </View>

              <Button
                title="Vender"
                variant="amber"
                icon={<Ionicons name="flash" size={13} color="#fff" />}
                onPress={() => {
                  setQuickSaleQty(1);
                  setQuickSalePromo(false);
                  setIsQuickSaleOpen(true);
                }}
                style={{ paddingVertical: 6, paddingHorizontal: 12 }}
              />
            </View>
          </DoubleBezelCard>
        </FadeSlideIn>

        {/* Recent Transactions List */}
        <FadeSlideIn delay={240}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Egresos Recientes</Text>
            <TouchableOpacity onPress={() => router.push('/expenses')}>
              <Text style={[styles.sectionLink, { color: colors.brandLight }]}>Ver todos ({expenses.length})</Text>
            </TouchableOpacity>
          </View>

          {expenses.length === 0 ? (
            <View style={[styles.emptyRecentBox, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}>
              <Text style={[styles.emptyRecentText, { color: colors.textMuted }]}>No hay egresos registrados.</Text>
              <Button
                title="+ Registrar Primer Gasto"
                variant="primary"
                onPress={() => setIsQuickExpenseOpen(true)}
                style={{ marginTop: 8 }}
              />
            </View>
          ) : (
            expenses.slice(0, 4).map((exp) => (
              <TouchableOpacity
                key={exp.id}
                activeOpacity={0.75}
                onPress={() => setSelectedExpense(exp)}
              >
                <DoubleBezelCard style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={{ color: colors.textMain, fontWeight: '700', fontSize: 14 }}>{exp.title}</Text>
                      <Text style={{ color: colors.textDim, fontSize: 11, marginTop: 2 }}>
                        {exp.date} • {exp.category} • {exp.payment_method}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                      <Text style={{ color: colors.rose, fontWeight: '800', fontSize: 15 }}>
                        -${exp.amount.toFixed(2)}
                      </Text>
                      <Ionicons name="chevron-forward" size={14} color={colors.textDim} />
                    </View>
                  </View>
                </DoubleBezelCard>
              </TouchableOpacity>
            ))
          )}
        </FadeSlideIn>
      </ScrollView>

      {/* Expense Detail Modal */}
      <ExpenseDetailModal
        visible={!!selectedExpense}
        expense={selectedExpense}
        onClose={() => setSelectedExpense(null)}
        onUpdate={updateExpense}
        onDelete={deleteExpense}
      />

      {/* Quick Add Expense Modal */}
      <Modal visible={isQuickExpenseOpen} animationType="slide" transparent onRequestClose={() => setIsQuickExpenseOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalDialog, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.borderSubtle }]}>
              <Text style={[styles.modalTitle, { color: colors.textMain }]}>Registrar Gasto Rápido</Text>
              <TouchableOpacity onPress={() => setIsQuickExpenseOpen(false)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 20 }}>
              <Text style={[styles.formLabel, { color: colors.textMuted }]}>Concepto</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, color: colors.textMain }]}
                placeholder="Ej. Harina, Gasolina, CFE"
                placeholderTextColor={colors.textDim}
                value={quickExpTitle}
                onChangeText={setQuickExpTitle}
              />
              <Text style={[styles.formLabel, { color: colors.textMuted }]}>Monto ($ MXN)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, color: colors.textMain }]}
                placeholder="0.00"
                placeholderTextColor={colors.textDim}
                keyboardType="numeric"
                value={quickExpAmount}
                onChangeText={setQuickExpAmount}
              />
              <Button
                title="Guardar Gasto"
                variant="primary"
                onPress={handleCreateQuickExpense}
                style={{ marginTop: 10 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Quick Sell Star Cookie Modal */}
      <Modal visible={isQuickSaleOpen} animationType="slide" transparent onRequestClose={() => setIsQuickSaleOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalDialog, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.borderSubtle }]}>
              <Text style={[styles.modalTitle, { color: colors.textMain }]}>Venta Rápida: {starCookie.name}</Text>
              <TouchableOpacity onPress={() => setIsQuickSaleOpen(false)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 20 }}>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                <TouchableOpacity
                  style={[
                    styles.schemeBtn,
                    { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle },
                    !quickSalePromo && styles.schemeBtnActive,
                  ]}
                  onPress={() => {
                    setQuickSalePromo(false);
                    setQuickSaleQty(1);
                  }}
                >
                  <Text style={[styles.schemeBtnTitle, { color: colors.textMain }, !quickSalePromo && { color: colors.amberLight }]}>
                    Individual ($35)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.schemeBtn,
                    { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle },
                    quickSalePromo && styles.schemeBtnActiveGreen,
                  ]}
                  onPress={() => {
                    setQuickSalePromo(true);
                    setQuickSaleQty(3);
                  }}
                >
                  <Text style={[styles.schemeBtnTitle, { color: colors.textMain }, quickSalePromo && { color: colors.emeraldLight }]}>
                    Promo 3 x $90
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.stepperContainer}>
                <TouchableOpacity
                  style={[styles.stepperBtn, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
                  onPress={() => setQuickSaleQty(Math.max(1, quickSaleQty - 1))}
                >
                  <Ionicons name="remove" size={20} color={colors.textMain} />
                </TouchableOpacity>
                <Text style={[styles.stepperNum, { color: colors.textMain }]}>{quickSaleQty}</Text>
                <TouchableOpacity
                  style={[styles.stepperBtn, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
                  onPress={() => setQuickSaleQty(quickSaleQty + 1)}
                >
                  <Ionicons name="add" size={20} color={colors.textMain} />
                </TouchableOpacity>
              </View>

              <View style={[styles.quickSaleTotalBox, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}>
                <Text style={[styles.quickSaleTotalLabel, { color: colors.textMuted }]}>Total a Cobrar:</Text>
                <Text style={styles.quickSaleTotalVal}>
                  ${(quickSalePromo ? 30.0 * quickSaleQty : starCookie.sale_price * quickSaleQty).toFixed(2)} MXN
                </Text>
              </View>

              <Button
                title="Cobrar Ahora"
                variant="amber"
                icon={<Ionicons name="checkmark-circle" size={17} color="#fff" />}
                onPress={handleConfirmStarSale}
                style={{ marginTop: 12 }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand,
  },
  brandText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.brandText,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textMain,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  balanceCard: {
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textDim,
    textTransform: 'uppercase',
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '900',
    marginVertical: 6,
  },
  balanceBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  balanceSubtext: {
    fontSize: 12,
    color: colors.textDim,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  bentoHalf: {
    flex: 1,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statMiniTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textDim,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  statSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  shortcutsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  starCookieCard: {
    marginBottom: 20,
  },
  starCookieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  starIconBox: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.amberBg,
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starCookieTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.amberText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  starCookieName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textMain,
    marginTop: 2,
  },
  starCookieProfit: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textMain,
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.brandText,
  },
  starSaleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.amberBg,
    borderColor: '#FDE68A',
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
  },
  starSaleBtnText: {
    color: colors.amberText,
    fontSize: 11,
    fontWeight: '800',
  },
  emptyRecentBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 20,
    alignItems: 'center',
  },
  emptyRecentText: {
    fontSize: 13,
    color: colors.textDim,
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
    borderColor: colors.borderHighlight,
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
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textMain,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: colors.textDim,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    padding: 12,
    color: colors.textMain,
    fontSize: 13,
    marginBottom: 12,
  },
  schemeBtn: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    padding: 10,
    alignItems: 'center',
  },
  schemeBtnActive: {
    borderColor: '#FDE68A',
    backgroundColor: colors.amberBg,
  },
  schemeBtnActiveGreen: {
    borderColor: '#BBF7D0',
    backgroundColor: colors.emeraldBg,
  },
  schemeBtnTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMain,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginVertical: 14,
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F3F7',
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
  quickSaleTotalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: radii.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginVertical: 8,
  },
  quickSaleTotalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textDim,
  },
  quickSaleTotalVal: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.amberText,
  },
});
