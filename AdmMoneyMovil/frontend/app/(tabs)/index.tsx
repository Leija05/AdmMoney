import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radii, spacing } from '../../src/theme';
import { DoubleBezelCard } from '../../src/components/ui/DoubleBezelCard';
import { Badge } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';
import { ExpenseDetailModal } from '../../src/components/expenses/ExpenseDetailModal';
import { useAppStore } from '../../src/stores/app.store';
import { Expense, CookieProduct } from '../../src/lib/types';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const router = useRouter();
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
  } = useAppStore();

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
        {/* Header bar */}
        <View style={styles.header}>
          <View>
            <View style={styles.brandRow}>
              <View style={styles.brandDot} />
              <Text style={styles.brandText}>Adm Money Mobile</Text>
            </View>
            <Text style={styles.greeting}>Resumen Financiero</Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/settings')}
            style={[
              styles.statusPill,
              {
                borderColor: useMockData
                  ? 'rgba(245, 158, 11, 0.4)'
                  : isOnline
                  ? 'rgba(16, 185, 129, 0.4)'
                  : 'rgba(244, 63, 94, 0.4)',
                backgroundColor: useMockData
                  ? 'rgba(245, 158, 11, 0.12)'
                  : isOnline
                  ? 'rgba(16, 185, 129, 0.12)'
                  : 'rgba(244, 63, 94, 0.12)',
              },
            ]}
          >
            <Ionicons
              name={useMockData ? 'flask' : isOnline ? 'cloud-done' : 'cloud-offline'}
              size={13}
              color={useMockData ? colors.amberLight : isOnline ? colors.emeraldLight : colors.rose}
            />
            <Text
              style={[
                styles.statusText,
                {
                  color: useMockData
                    ? colors.amberLight
                    : isOnline
                    ? colors.emeraldLight
                    : colors.rose,
                },
              ]}
            >
              {useMockData ? 'Modo Demo' : isOnline ? 'En Línea' : 'Local'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Global Net Balance Card */}
        <DoubleBezelCard style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Balance Neto General</Text>
          <Text
            style={[
              styles.balanceValue,
              { color: netBalance >= 0 ? colors.emeraldLight : colors.rose },
            ]}
          >
            ${netBalance.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <View style={styles.balanceBadgeRow}>
            <Badge
              label={netBalance >= 0 ? "Superávit Positivo" : "Flujo Negativo"}
              variant={netBalance >= 0 ? "emerald" : "rose"}
            />
            <Text style={styles.balanceSubtext}>Galletas vs Gastos Generales</Text>
          </View>
        </DoubleBezelCard>

        {/* Quick Bento Stats (2 Clickable Columns) */}
        <View style={styles.bentoRow}>
          {/* Cookie Business Profit */}
          <TouchableOpacity
            style={styles.bentoHalf}
            activeOpacity={0.8}
            onPress={() => router.push('/cookies')}
          >
            <DoubleBezelCard>
              <View style={styles.statHeader}>
                <Text style={styles.statMiniTitle}>Ganancia Galletas</Text>
                <Ionicons name="cafe" size={16} color={colors.amberLight} />
              </View>
              <Text style={[styles.statValue, { color: colors.emeraldLight }]}>
                +${cookieProfit.toFixed(2)}
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <Text style={styles.statSub}>{marginPct.toFixed(1)}% margen neto</Text>
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
                <Text style={styles.statMiniTitle}>Gastos Totales</Text>
                <Ionicons name="receipt" size={16} color={colors.rose} />
              </View>
              <Text style={[styles.statValue, { color: colors.rose }]}>
                -${totalExpenses.toFixed(2)}
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <Text style={styles.statSub}>{expenses.length} movimientos</Text>
                <Ionicons name="chevron-forward" size={13} color={colors.textDim} />
              </View>
            </DoubleBezelCard>
          </TouchableOpacity>
        </View>

        {/* Action Shortcuts */}
        <View style={styles.shortcutsRow}>
          <Button
            title="Escanear Ticket"
            variant="primary"
            icon={<Ionicons name="camera" size={16} color="#06080F" />}
            onPress={() => router.push('/scanner')}
            style={{ flex: 1 }}
          />
          <Button
            title="+ Gasto"
            variant="secondary"
            icon={<Ionicons name="add" size={16} color="#F8FAFC" />}
            onPress={() => setIsQuickExpenseOpen(true)}
            style={{ flex: 1 }}
          />
          <Button
            title="Venta Galleta"
            variant="amber"
            icon={<Ionicons name="cart" size={16} color="#06080F" />}
            onPress={() => router.push('/cookies')}
            style={{ flex: 1 }}
          />
        </View>

        {/* Star Cookie Highlight */}
        <DoubleBezelCard style={styles.starCookieCard}>
          <View style={styles.starCookieRow}>
            <View style={styles.starIconBox}>
              <Ionicons name="star" size={20} color={colors.amberLight} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.starCookieTitle}>Galleta Estrella del Negocio</Text>
              <Text style={styles.starCookieName}>
                {starCookie.name}
              </Text>
              <Text style={styles.starCookieProfit}>
                Costo: ${starCookie.recipe_cost.toFixed(2)} • Ganas +${starCookie.profit_per_unit.toFixed(2)} c/u (72.4%)
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setQuickSaleQty(1);
                setQuickSalePromo(false);
                setIsQuickSaleOpen(true);
              }}
              style={styles.starSaleBtn}
            >
              <Ionicons name="flash" size={14} color="#fff" />
              <Text style={styles.starSaleBtnText}>Vender</Text>
            </TouchableOpacity>
          </View>
        </DoubleBezelCard>

        {/* Recent Transactions List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Egresos Recientes</Text>
          <TouchableOpacity onPress={() => router.push('/expenses')}>
            <Text style={styles.sectionLink}>Ver todos ({expenses.length})</Text>
          </TouchableOpacity>
        </View>

        {expenses.length === 0 ? (
          <View style={styles.emptyRecentBox}>
            <Text style={styles.emptyRecentText}>No hay egresos registrados.</Text>
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
          <View style={styles.modalDialog}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Registrar Gasto Rápido</Text>
              <TouchableOpacity onPress={() => setIsQuickExpenseOpen(false)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 20 }}>
              <Text style={styles.formLabel}>Concepto</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Harina, Gasolina, CFE"
                placeholderTextColor={colors.textDim}
                value={quickExpTitle}
                onChangeText={setQuickExpTitle}
              />
              <Text style={styles.formLabel}>Monto ($ MXN)</Text>
              <TextInput
                style={styles.input}
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
          <View style={styles.modalDialog}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Venta Rápida: {starCookie.name}</Text>
              <TouchableOpacity onPress={() => setIsQuickSaleOpen(false)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 20 }}>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                <TouchableOpacity
                  style={[styles.schemeBtn, !quickSalePromo && styles.schemeBtnActive]}
                  onPress={() => {
                    setQuickSalePromo(false);
                    setQuickSaleQty(1);
                  }}
                >
                  <Text style={[styles.schemeBtnTitle, !quickSalePromo && { color: colors.amberLight }]}>
                    Individual ($35)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.schemeBtn, quickSalePromo && styles.schemeBtnActiveGreen]}
                  onPress={() => {
                    setQuickSalePromo(true);
                    setQuickSaleQty(3);
                  }}
                >
                  <Text style={[styles.schemeBtnTitle, quickSalePromo && { color: colors.emeraldLight }]}>
                    Promo 3 x $90
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.stepperContainer}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setQuickSaleQty(Math.max(1, quickSaleQty - 1))}
                >
                  <Ionicons name="remove" size={20} color={colors.textMain} />
                </TouchableOpacity>
                <Text style={styles.stepperNum}>{quickSaleQty}</Text>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setQuickSaleQty(quickSaleQty + 1)}
                >
                  <Ionicons name="add" size={20} color={colors.textMain} />
                </TouchableOpacity>
              </View>

              <View style={styles.quickSaleTotalBox}>
                <Text style={styles.quickSaleTotalLabel}>Total a Cobrar:</Text>
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
