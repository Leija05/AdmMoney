import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii, spacing } from '../../src/theme';
import { ExpenseCard } from '../../src/components/expenses/ExpenseCard';
import { ExpenseDetailModal } from '../../src/components/expenses/ExpenseDetailModal';
import { Button } from '../../src/components/ui/Button';
import { useAppStore } from '../../src/stores/app.store';
import { Expense } from '../../src/lib/types';
import { Ionicons } from '@expo/vector-icons';

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
  'Tarjeta Débito',
  'Tarjeta Crédito',
  'Transferencia'
];

export default function ExpensesScreen() {
  const { expenses, addExpense, updateExpense, deleteExpense, loadAllData, isLoading } = useAppStore();
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[1]);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [notes, setNotes] = useState('');

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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.screenEyebrow}>Control Financiero</Text>
            <Text style={styles.totalAmount}>-${totalSum.toFixed(2)}</Text>
            <Text style={styles.subText}>{filtered.length} gastos encontrados</Text>
          </View>
          <Button
            title="+ Gasto"
            variant="primary"
            icon={<Ionicons name="add" size={18} color="#fff" />}
            onPress={() => setIsModalOpen(true)}
            style={{ paddingVertical: 9, paddingHorizontal: 16 }}
          />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={16} color={colors.textDim} style={{ marginLeft: 10 }} />
          <TextInput
            style={styles.searchInput}
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
          contentContainerStyle={{ paddingRight: 16, gap: 8 }}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={[
                styles.catPill,
                selectedCategory === cat && styles.catPillActive
              ]}
            >
              <Text
                style={[
                  styles.catPillText,
                  selectedCategory === cat && styles.catPillTextActive
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Expense List */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ExpenseCard
              expense={item}
              onPress={(exp) => setSelectedExpense(exp)}
              onDelete={deleteExpense}
            />
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
          onRefresh={loadAllData}
          refreshing={isLoading}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="receipt-outline" size={44} color={colors.textDim} />
              <Text style={styles.emptyTitle}>Sin Gastos Registrados</Text>
              <Text style={styles.emptyText}>
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
          <View style={styles.modalDialog}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>Nuevo Registro</Text>
                <Text style={styles.modalTitle}>Registrar Gasto Manual</Text>
              </View>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 20 }}>
              <Text style={styles.formLabel}>Concepto del Gasto</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Harina, Mantequilla, CFE, Gasolina"
                placeholderTextColor={colors.textDim}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.formLabel}>Monto ($ MXN)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={colors.textDim}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />

              <Text style={styles.formLabel}>Categoría</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {CATEGORIES.filter((c) => c !== 'Todas').map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setCategory(c)}
                      style={[
                        styles.catPill,
                        category === c && styles.catPillActive
                      ]}
                    >
                      <Text style={[styles.catPillText, category === c && styles.catPillTextActive]}>
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.formLabel}>Método de Pago</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {PAYMENT_METHODS.map((method) => (
                  <TouchableOpacity
                    key={method}
                    onPress={() => setPaymentMethod(method)}
                    style={[
                      styles.catPill,
                      paymentMethod === method && styles.catPillActive
                    ]}
                  >
                    <Text style={[styles.catPillText, paymentMethod === method && styles.catPillTextActive]}>
                      {method}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Notas u Observaciones (Opcional)</Text>
              <TextInput
                style={[styles.input, { height: 60 }]}
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
    flex: 1,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  screenEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textDim,
    textTransform: 'uppercase',
  },
  totalAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.rose,
    marginTop: 2,
  },
  categoryScroll: {
    maxHeight: 40,
    marginBottom: 16,
  },
  catPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    backgroundColor: '#FFFFFF',
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
    color: colors.textMuted,
  },
  catPillTextActive: {
    color: colors.brandText,
    fontWeight: '700',
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
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radii.outer,
    borderTopRightRadius: radii.outer,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    marginBottom: 12,
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    padding: 12,
    color: colors.textMain,
    fontSize: 14,
    marginBottom: 14,
  },
});
