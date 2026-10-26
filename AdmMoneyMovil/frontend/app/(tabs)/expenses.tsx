import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, useThemeColors, radii, spacing, gradients } from '../../src/theme';
import { ExpenseCard } from '../../src/components/expenses/ExpenseCard';
import { ExpenseDetailModal } from '../../src/components/expenses/ExpenseDetailModal';
import { DoubleBezelCard } from '../../src/components/ui/DoubleBezelCard';
import { Button } from '../../src/components/ui/Button';
import { BackendHeartbeat } from '../../src/components/ui/BackendHeartbeat';
import { SwipeTabWrapper } from '../../src/components/ui/SwipeTabWrapper';
import { AmbientBackdrop } from '../../src/components/ui/AmbientBackdrop';
import { ExpenseActionModal } from '../../src/components/expenses/ExpenseActionModal';
import { DigitalReceiptModal } from '../../src/components/expenses/DigitalReceiptModal';
import { useAppStore } from '../../src/stores/app.store';
import { Expense } from '../../src/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const CATEGORIES = [
  'Todas',
  'Insumos Galletas',
  'Empaques y Envíos',
  'Servicios y Luz',
  'Transporte',
  'Marketing y Redes',
  'Hogar y Personales',
  'Otros Gastos'
];

const PAYMENT_METHODS = [
  'Efectivo',
  'Transferencia'
];

export default function ExpensesScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const {
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    loadAllData,
    isLoading,
    theme,
    toggleTheme,
    currency,
    hapticsEnabled,
  } = useAppStore();
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [longPressedExpense, setLongPressedExpense] = useState<Expense | null>(null);
  const [digitalReceiptExpense, setDigitalReceiptExpense] = useState<Expense | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[1]);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [notes, setNotes] = useState('');

  const isDark = colors.isDark;
  const screenHeight = Dimensions.get('window').height;
  const modalTranslateY = useRef(new Animated.Value(0)).current;

  const modalPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        return gestureState.dy > 6 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.3;
      },
      onPanResponderMove: (_evt, gestureState) => {
        if (gestureState.dy > 0) {
          modalTranslateY.setValue(gestureState.dy);
        } else {
          modalTranslateY.setValue(gestureState.dy * 0.15);
        }
      },
      onPanResponderRelease: (_evt, gestureState) => {
        if (gestureState.dy > 110 || (gestureState.dy > 30 && gestureState.vy > 0.35)) {
          Animated.timing(modalTranslateY, {
            toValue: screenHeight,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            setIsModalOpen(false);
            modalTranslateY.setValue(0);
          });
        } else {
          Animated.spring(modalTranslateY, {
            toValue: 0,
            friction: 8,
            tension: 80,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (isModalOpen) {
      modalTranslateY.setValue(0);
    }
  }, [isModalOpen]);

  const filtered = expenses.filter((e) => {
    const matchesCat = selectedCategory === 'Todas' || e.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const totalSum = filtered.reduce((acc, curr) => acc + curr.amount, 0);

  const insumosSum = filtered
    .filter((e) => e.category === 'Insumos Galletas' || e.expense_type === 'direct')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const operativosSum = filtered
    .filter((e) => e.category !== 'Insumos Galletas' && e.expense_type !== 'direct')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const handleDuplicateExpense = async (exp: Expense) => {
    try {
      await addExpense({
        title: `${exp.title} (Copia)`,
        amount: exp.amount,
        category: exp.category,
        date: new Date().toISOString().split('T')[0],
        payment_method: exp.payment_method,
        notes: exp.notes ? `Copia: ${exp.notes}` : 'Gasto duplicado',
      });
      Alert.alert('¡Gasto Duplicado!', `Se creó una copia de "${exp.title}" por $${exp.amount.toFixed(2)}.`);
    } catch {
      Alert.alert('Error', 'No se pudo duplicar el gasto.');
    }
  };

  const handleCreate = async () => {
    const val = parseFloat(amount);
    if (!title.trim() || isNaN(val) || val <= 0) {
      Alert.alert('Datos Incompletos', 'Por favor ingresa un concepto y un monto mayor a 0.');
      return;
    }

    await addExpense({
      title: title.trim(),
      amount: val,
      category,
      date: new Date().toISOString().split('T')[0],
      payment_method: paymentMethod,
      notes: notes.trim(),
    });

    setTitle('');
    setAmount('');
    setNotes('');
    setPaymentMethod(PAYMENT_METHODS[0]);
    setIsModalOpen(false);
    Alert.alert('¡Gasto Guardado!', `Se agregaron $${val.toFixed(2)} MXN a tus gastos.`);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgPrimary }]}>
      <AmbientBackdrop variant="emerald" />
      <SwipeTabWrapper currentRoute="/expenses">
        <View style={styles.container}>
          {/* Header Hero Card */}
          <DoubleBezelCard
            style={styles.headerCard}
            gradient={theme === 'dark' ? ['#1C202B', '#14171F'] : ['#FFFFFF', '#F8FAFC']}
          >
            {/* Top Row: Eyebrow + Controls */}
            <View style={styles.headerTopRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.brand }} />
                <Text style={[styles.screenEyebrow, { color: colors.textMuted }]}>Control Financiero</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                <TouchableOpacity
                  onPress={toggleTheme}
                  style={[
                    styles.themeToggleBtn,
                    {
                      backgroundColor: colors.bgTertiary,
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                >
                  <Ionicons
                    name={theme === 'dark' ? 'sunny' : 'moon'}
                    size={15}
                    color={theme === 'dark' ? colors.amberLight : colors.textMuted}
                  />
                </TouchableOpacity>
                <BackendHeartbeat onPress={() => router.push('/settings')} compact />
              </View>
            </View>

            {/* Main Financial Amount & + Gasto Button Row */}
            <View style={styles.headerMainRow}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textDim, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Gasto Total Registrado
                </Text>
                <Text style={[styles.totalAmount, { color: colors.rose }]} numberOfLines={1}>
                  -${totalSum.toFixed(2)}
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textDim }}> {currency}</Text>
                </Text>
                <Text style={[styles.subText, { color: colors.textMuted }]}>
                  {filtered.length} {filtered.length === 1 ? 'gasto registrado' : 'gastos registrados'}
                </Text>
              </View>

              <Button
                title="+ Gasto"
                variant="danger"
                icon={<Ionicons name="add" size={18} color="#fff" />}
                onPress={() => setIsModalOpen(true)}
                style={{ paddingVertical: 8, paddingHorizontal: 16 }}
              />
            </View>

            {/* 3 Ejes Financieros: Insumos vs Gastos Generales */}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.borderSubtle }}>
              <View style={{ flex: 1, padding: 8, borderRadius: 10, backgroundColor: isDark ? 'rgba(217, 119, 6, 0.12)' : colors.amberBg }}>
                <Text style={{ fontSize: 9.5, fontWeight: '700', color: colors.amberLight, textTransform: 'uppercase' }}>
                  Insumos Cocina
                </Text>
                <Text style={{ fontSize: 13.5, fontWeight: '800', color: colors.amberText, marginTop: 2 }}>
                  -${insumosSum.toFixed(2)}
                </Text>
              </View>

              <View style={{ flex: 1, padding: 8, borderRadius: 10, backgroundColor: isDark ? 'rgba(124, 58, 237, 0.12)' : colors.purpleBg }}>
                <Text style={{ fontSize: 9.5, fontWeight: '700', color: colors.purpleText, textTransform: 'uppercase' }}>
                  Gastos Generales
                </Text>
                <Text style={{ fontSize: 13.5, fontWeight: '800', color: colors.purpleText, marginTop: 2 }}>
                  -${operativosSum.toFixed(2)}
                </Text>
              </View>
            </View>
          </DoubleBezelCard>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}>
          <Ionicons name="search" size={16} color={colors.textDim} style={{ marginLeft: 12 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.textMain }]}
            placeholder="Buscar por concepto o proveedor..."
            placeholderTextColor={colors.textDim}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 8 }}>
              <Ionicons name="close-circle" size={16} color={colors.textDim} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Pills Horizontal Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={{ paddingHorizontal: 2, paddingVertical: 4, gap: 8, alignItems: 'center' }}
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.8}
                style={styles.catPillContainer}
              >
                {isActive ? (
                  <LinearGradient
                    colors={
                      cat === 'Todas'
                        ? ['#0284C7', '#0369A1']
                        : cat.includes('Galletas')
                        ? (gradients.amber as any)
                        : cat.includes('Empaques')
                        ? (gradients.purple as any)
                        : (gradients.rose as any)
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.catPillActiveGradient}
                  >
                    <Text style={styles.catPillTextActive}>{cat}</Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.catPillInactive, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}>
                    <Text style={[styles.catPillText, { color: colors.textMuted }]}>{cat}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Expense List */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ExpenseCard
              expense={item}
              onPress={(exp) => setSelectedExpense(exp)}
              onLongPress={hapticsEnabled ? (exp) => setLongPressedExpense(exp) : undefined}
              onDelete={deleteExpense}
            />
          )}
          contentContainerStyle={{ paddingBottom: 110 }}
          onRefresh={loadAllData}
          refreshing={isLoading}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="receipt-outline" size={44} color={colors.textDim} />
              <Text style={[styles.emptyTitle, { color: colors.textMain }]}>Sin Gastos Registrados</Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                {searchQuery || selectedCategory !== 'Todas'
                  ? 'No hay egresos que coincidan con tus filtros.'
                  : 'Aún no tienes gastos guardados en el sistema.'}
              </Text>
              {(searchQuery || selectedCategory !== 'Todas') && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedCategory('Todas');
                  }}
                  style={styles.clearFilterBtn}
                >
                  <Text style={styles.clearFilterText}>Restablecer Filtros</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      </View>
      </SwipeTabWrapper>

      {/* Expense Detail & Edit Modal */}
      <ExpenseDetailModal
        visible={!!selectedExpense}
        expense={selectedExpense}
        onClose={() => setSelectedExpense(null)}
        onUpdate={updateExpense}
        onDelete={deleteExpense}
      />

      {/* Add Expense Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent onRequestClose={() => setIsModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Animated.View
            style={[
              styles.modalDialog,
              {
                backgroundColor: isDark ? '#1C202A' : '#FFFFFF',
                borderColor: isDark ? '#2E384D' : '#E2E8F0',
                transform: [{ translateY: modalTranslateY }],
              },
            ]}
          >
            {/* Top Drag Handle & Header with panResponder */}
            <View {...modalPanResponder.panHandlers}>
              <View style={styles.dragHandleContainer}>
                <View
                  style={[
                    styles.dragHandleBar,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.18)' },
                  ]}
                />
              </View>
              <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#2A303C' : '#E5E7EB' }]}>
                <View>
                  <Text style={[styles.modalEyebrow, { color: colors.brandLight }]}>NUEVO REGISTRO</Text>
                  <Text style={[styles.modalTitle, { color: isDark ? '#F1F3F7' : '#0F172A' }]}>
                    Registrar Gasto Manual
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                  <Ionicons name="close" size={22} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={{ padding: 20 }}>
              <Text style={[styles.formLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                Concepto del Gasto
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#242936' : '#F8F9FA',
                    borderColor: isDark ? '#2A303C' : '#E5E7EB',
                    color: isDark ? '#F1F3F7' : '#0F172A',
                  },
                ]}
                placeholder="Ej. Harina, Mantequilla, CFE, Gasolina"
                placeholderTextColor={colors.textDim}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={[styles.formLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                Monto ($ MXN)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#242936' : '#F8F9FA',
                    borderColor: isDark ? '#2A303C' : '#E5E7EB',
                    color: isDark ? '#F1F3F7' : '#0F172A',
                  },
                ]}
                placeholder="0.00"
                placeholderTextColor={colors.textDim}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />

              <Text style={[styles.formLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                Categoría
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', gap: 8, paddingRight: 10 }}>
                  {CATEGORIES.filter((c) => c !== 'Todas').map((c) => {
                    const isSelected = category === c;
                    return (
                      <TouchableOpacity
                        key={c}
                        onPress={() => setCategory(c)}
                        style={[
                          styles.catPill,
                          {
                            backgroundColor: isSelected
                              ? colors.brand
                              : (isDark ? '#242936' : '#F1F5F9'),
                            borderColor: isSelected
                              ? colors.brand
                              : (isDark ? '#2A303C' : '#E2E8F0'),
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.catPillText,
                            {
                              color: isSelected
                                ? '#FFFFFF'
                                : (isDark ? '#CBD5E1' : '#475569'),
                              fontWeight: isSelected ? '800' : '600',
                            },
                          ]}
                        >
                          {c}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              <Text style={[styles.formLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                Método de Pago
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {PAYMENT_METHODS.map((method) => {
                  const isSelected = paymentMethod === method;
                  return (
                    <TouchableOpacity
                      key={method}
                      onPress={() => setPaymentMethod(method)}
                      style={[
                        styles.catPill,
                        {
                          backgroundColor: isSelected
                            ? (isDark ? '#059669' : '#10B981')
                            : (isDark ? '#242936' : '#F1F5F9'),
                          borderColor: isSelected
                            ? (isDark ? '#059669' : '#10B981')
                            : (isDark ? '#2A303C' : '#E2E8F0'),
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.catPillText,
                          {
                            color: isSelected
                              ? '#FFFFFF'
                              : (isDark ? '#CBD5E1' : '#475569'),
                              fontWeight: isSelected ? '800' : '600',
                          },
                        ]}
                      >
                        {method}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.formLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                Notas u Observaciones (Opcional)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    height: 64,
                    backgroundColor: isDark ? '#242936' : '#F8F9FA',
                    borderColor: isDark ? '#2A303C' : '#E5E7EB',
                    color: isDark ? '#F1F3F7' : '#0F172A',
                    textAlignVertical: 'top',
                  },
                ]}
                placeholder="Proveedor, factura o número de ticket"
                placeholderTextColor={colors.textDim}
                multiline
                value={notes}
                onChangeText={setNotes}
              />

              <Button
                title="Guardar y Sumar a Gastos"
                variant="primary"
                icon={<Ionicons name="checkmark-circle" size={18} color="#fff" />}
                onPress={handleCreate}
                style={{ marginTop: 10, marginBottom: 20 }}
              />
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* Quick Action Sheet on Long Press */}
      <ExpenseActionModal
        visible={!!longPressedExpense}
        expense={longPressedExpense}
        onClose={() => setLongPressedExpense(null)}
        onViewDigitalReceipt={(exp) => {
          setDigitalReceiptExpense(exp);
        }}
        onEdit={(exp) => {
          setSelectedExpense(exp);
        }}
        onDuplicate={handleDuplicateExpense}
        onViewDetails={(exp) => {
          setSelectedExpense(exp);
        }}
        onDelete={deleteExpense}
      />

      {/* Digital Thermal Receipt Modal */}
      <DigitalReceiptModal
        visible={!!digitalReceiptExpense}
        expense={digitalReceiptExpense}
        onClose={() => setDigitalReceiptExpense(null)}
        onEdit={(exp) => {
          setDigitalReceiptExpense(null);
          setSelectedExpense(exp);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  container: {
    flex: 1,
    padding: spacing.md,
  },
  headerCard: {
    marginBottom: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeToggleBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenEyebrow: {
    fontSize: 12,
    fontWeight: '700',
  },
  totalAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.rose,
    marginTop: 2,
  },
  categoryScroll: {
    flexGrow: 0,
    height: 38,
    marginBottom: 8,
  },
  catPillContainer: {
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  catPillActiveGradient: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
  },
  catPillInactive: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  catPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  catPillActive: {
    backgroundColor: colors.brandBg,
    borderColor: colors.brandBorder,
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDim,
  },
  catPillTextActive: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textDim,
    marginTop: 10,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 24, 38, 0.45)',
    justifyContent: 'flex-end',
  },
  modalDialog: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: radii.outer,
    borderTopRightRadius: radii.outer,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  dragHandleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 2,
  },
  dragHandleBar: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textMain,
  },
  subText: {
    fontSize: 11,
    color: colors.textDim,
    marginTop: 2,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.textMain,
    fontSize: 13,
    paddingVertical: 9,
    paddingHorizontal: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textMain,
    marginTop: 12,
  },
  clearFilterBtn: {
    marginTop: 12,
    backgroundColor: colors.brandBg,
    borderWidth: 1,
    borderColor: colors.brandBorder,
    borderRadius: radii.pill,
    paddingVertical: 7,
    paddingHorizontal: 16,
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.brandText,
  },
  modalEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.brandText,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: colors.textDim,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    padding: 12,
    color: colors.textMain,
    fontSize: 14,
    marginBottom: 14,
  },
});
