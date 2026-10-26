import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { colors, useThemeColors, radii, spacing } from '../../theme';
import { Expense } from '../../lib/types';
import { Ionicons } from '@expo/vector-icons';
import { confirmAction } from '../../stores/confirmation.store';

interface ExpenseDetailModalProps {
  visible: boolean;
  expense: Expense | null;
  onClose: () => void;
  onUpdate: (id: number, data: Partial<Expense>) => Promise<any>;
  onDelete: (id: number) => Promise<void>;
}

const CATEGORIES = [
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

export const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({
  visible,
  expense,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const colors = useThemeColors();
  const isDark = colors.isDark;
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [notes, setNotes] = useState('');
  const [editItems, setEditItems] = useState<Array<{ name: string; price: number; quantity?: number }>>([]);
  const [isSaving, setIsSaving] = useState(false);

  const screenHeight = Dimensions.get('window').height;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return gestureState.dy > 6 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.3;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        } else {
          translateY.setValue(gestureState.dy * 0.15);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
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

  useEffect(() => {
    if (expense) {
      setTitle(expense.title);
      setAmount(String(expense.amount));
      setCategory(expense.category);
      setPaymentMethod(expense.payment_method || 'Efectivo');
      setNotes(expense.notes || '');
      const rawItems = expense.receipt_data?.items;
      if (Array.isArray(rawItems) && rawItems.length > 0) {
        setEditItems(
          rawItems.map((it: any) => ({
            name: it.name || '',
            price: Number(it.price || 0),
            quantity: it.quantity ? Number(it.quantity) : 1,
          }))
        );
      } else {
        setEditItems([]);
      }
      setIsEditing(false);
    }
  }, [expense]);

  if (!expense) return null;

  const handleUpdateItem = (index: number, field: string, value: any) => {
    setEditItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddItem = () => {
    setEditItems((prev) => [
      ...prev,
      { name: '', price: 0, quantity: 1 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setEditItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAutoCalculateTotal = () => {
    if (editItems.length === 0) return;
    const total = editItems.reduce(
      (acc, it) => acc + (Number(it.price) || 0) * (Number(it.quantity) || 1),
      0
    );
    setAmount(total.toFixed(2));
  };

  const handleSaveEdit = async () => {
    const val = parseFloat(amount);
    if (!title.trim() || isNaN(val) || val <= 0) {
      Alert.alert('Datos Inválidos', 'Ingresa un concepto válido y un monto mayor a cero.');
      return;
    }

    try {
      setIsSaving(true);
      const cleanedItems = editItems.filter(
        (it) => it.name.trim().length > 0 || (Number(it.price) || 0) > 0
      );

      const updatedReceiptData = {
        ...(expense.receipt_data || {}),
        items: cleanedItems,
      };

      await onUpdate(expense.id, {
        title: title.trim(),
        amount: val,
        category,
        payment_method: paymentMethod,
        notes: notes.trim(),
        receipt_data: updatedReceiptData,
      });
      setIsEditing(false);
      Alert.alert('¡Actualizado!', 'El gasto y sus artículos han sido modificados correctamente.');
      onClose();
    } catch (err) {
      Alert.alert('Error', 'No se pudo guardar la modificación.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = () => {
    confirmAction({
      title: '¿Eliminar Gasto?',
      message: `¿Deseas eliminar "${expense.title}" por $${expense.amount.toFixed(2)} MXN de tu historial?`,
      confirmText: 'Sí, Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      onConfirm: async () => {
        try {
          await onDelete(expense.id);
          onClose();
        } catch (err: any) {
          Alert.alert('Error', err?.message || 'No se pudo eliminar el gasto.');
        }
      },
    });
  };

  const getBadgeVariant = (cat: string) => {
    if (cat.includes('Galletas')) return 'amber';
    if (cat.includes('Empaques')) return 'purple';
    if (cat.includes('Luz') || cat.includes('Servicios')) return 'cyan';
    return 'emerald';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.dialog,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.borderSubtle,
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Swipe down handle and Header with panResponder */}
          <View {...panResponder.panHandlers}>
            <View style={styles.dragHandleContainer}>
              <View style={[styles.dragHandleBar, { backgroundColor: colors.borderSubtle }]} />
            </View>

            <View style={[styles.header, { borderBottomColor: isDark ? '#2A303C' : '#E5E7EB' }]}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[styles.headerEyebrow, { color: colors.emeraldLight }]}>
                  {isEditing ? 'Editar Registro' : 'Detalle del Gasto'}
                </Text>
                <Text style={[styles.headerTitle, { color: isDark ? '#F1F3F7' : '#0F172A' }]} numberOfLines={1}>
                  {expense.title}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 40 }}>
            {!isEditing ? (
              /* VIEW MODE */
              <View>
                {/* Amount Hero Box */}
                <View style={[styles.amountBox, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}>
                  <Text style={[styles.amountLabel, { color: colors.textDim }]}>Monto Registrado</Text>
                  <Text style={[styles.amountValue, { color: colors.rose }]}>-${expense.amount.toFixed(2)} MXN</Text>
                  <View style={styles.badgeRow}>
                    <Badge label={expense.category} variant={getBadgeVariant(expense.category)} />
                    <Badge label={expense.payment_method || 'Efectivo'} variant="gray" />
                  </View>
                </View>

                {/* Details List */}
                <View style={[styles.infoRow, { borderBottomColor: colors.borderSubtle }]}>
                  <Text style={[styles.infoKey, { color: colors.textDim }]}>Fecha de Registro</Text>
                  <Text style={[styles.infoVal, { color: colors.textMain }]}>{expense.date}</Text>
                </View>

                <View style={[styles.infoRow, { borderBottomColor: colors.borderSubtle }]}>
                  <Text style={[styles.infoKey, { color: colors.textDim }]}>Método de Pago</Text>
                  <Text style={[styles.infoVal, { color: colors.textMain }]}>{expense.payment_method || 'Efectivo'}</Text>
                </View>

                <View style={[styles.infoRow, { borderBottomColor: colors.borderSubtle }]}>
                  <Text style={[styles.infoKey, { color: colors.textDim }]}>Categoría Contable</Text>
                  <Text style={[styles.infoVal, { color: colors.textMain }]}>{expense.category}</Text>
                </View>

                {/* Scanned Receipt Breakdown */}
                {Array.isArray(expense.receipt_data?.items) && expense.receipt_data.items.length > 0 && (
                  <View style={[styles.receiptBox, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}>
                    <View style={styles.receiptHeader}>
                      <Ionicons name="receipt-outline" size={15} color={colors.brand} />
                      <Text style={[styles.receiptHeaderText, { color: colors.textMain }]}>
                        Artículos del Ticket ({expense.receipt_data.items.length})
                      </Text>
                    </View>
                    <View style={[styles.receiptDivider, { backgroundColor: colors.borderSubtle }]} />
                    {expense.receipt_data.items.map((item: any, idx: number) => (
                      <View key={idx} style={[styles.receiptItemRow, { borderBottomColor: colors.borderSubtle }]}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={[styles.receiptItemName, { color: colors.textMain }]} numberOfLines={1}>
                            {item.quantity && item.quantity > 1 ? `${item.quantity}x ` : ''}{item.name}
                          </Text>
                        </View>
                        <Text style={[styles.receiptItemPrice, { color: colors.textMain }]}>
                          ${Number(item.price || 0).toFixed(2)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {expense.notes ? (
                  <View style={[styles.notesBox, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}>
                    <Text style={[styles.notesKey, { color: colors.textDim }]}>Notas / Comprobante:</Text>
                    <Text style={[styles.notesVal, { color: colors.textMain }]}>{expense.notes}</Text>
                  </View>
                ) : null}

                {/* Action Buttons in View Mode */}
                <View style={styles.actionRow}>
                  <Button
                    title="Editar Gasto"
                    variant="secondary"
                    icon={<Ionicons name="pencil" size={16} color={colors.textMain} />}
                    onPress={() => setIsEditing(true)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Eliminar"
                    variant="danger"
                    icon={<Ionicons name="trash" size={16} color="#fff" />}
                    onPress={handleDeleteConfirm}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            ) : (
              /* EDIT MODE */
              <View>
                <Text style={[styles.formLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>Concepto del Gasto</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#242936' : '#F8F9FA',
                      borderColor: isDark ? '#2A303C' : '#E5E7EB',
                      color: isDark ? '#F1F3F7' : '#0F172A',
                    },
                  ]}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Ej. Harina, Mantequilla, CFE"
                  placeholderTextColor={colors.textDim}
                />

                <Text style={[styles.formLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>Monto ($ MXN)</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#242936' : '#F8F9FA',
                      borderColor: isDark ? '#2A303C' : '#E5E7EB',
                      color: isDark ? '#F1F3F7' : '#0F172A',
                    },
                  ]}
                  value={amount}
                  onChangeText={(t) => setAmount(t.replace(',', '.'))}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.textDim}
                />

                <Text style={[styles.formLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>Categoría</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', gap: 8, paddingRight: 10 }}>
                    {CATEGORIES.map((cat) => {
                      const isSelected = category === cat;
                      return (
                        <TouchableOpacity
                          key={cat}
                          onPress={() => setCategory(cat)}
                          style={[
                            styles.pill,
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
                              styles.pillText,
                              {
                                color: isSelected
                                  ? '#FFFFFF'
                                  : (isDark ? '#CBD5E1' : '#475569'),
                                fontWeight: isSelected ? '800' : '600',
                              },
                            ]}
                          >
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>

                <Text style={[styles.formLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>Método de Pago</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                  {PAYMENT_METHODS.map((method) => {
                    const isSelected = paymentMethod === method;
                    return (
                      <TouchableOpacity
                        key={method}
                        onPress={() => setPaymentMethod(method)}
                        style={[
                          styles.pill,
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
                            styles.pillText,
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

                {/* Editable Articles / Items List */}
                <View style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="receipt-outline" size={15} color={colors.brandLight} />
                      <Text style={[styles.formLabel, { color: isDark ? '#94A3B8' : '#64748B', marginBottom: 0 }]}>
                        Artículos del Ticket ({editItems.length})
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {editItems.length > 0 && (
                        <TouchableOpacity
                          onPress={handleAutoCalculateTotal}
                          style={[styles.smallActionBtn, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.18)' : '#D1FAE5', borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : '#A7F3D0' }]}
                        >
                          <Ionicons name="calculator-outline" size={12} color={colors.emeraldLight} />
                          <Text style={[styles.smallActionBtnText, { color: colors.emeraldLight }]}>Sumar al Total</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        onPress={handleAddItem}
                        style={[styles.smallActionBtn, { backgroundColor: isDark ? 'rgba(14, 165, 233, 0.18)' : '#E0F2FE', borderColor: isDark ? 'rgba(14, 165, 233, 0.35)' : '#BAE6FD' }]}
                      >
                        <Ionicons name="add" size={13} color={colors.brandLight} />
                        <Text style={[styles.smallActionBtnText, { color: colors.brandLight }]}>+ Artículo</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {editItems.length === 0 ? (
                    <TouchableOpacity
                      onPress={handleAddItem}
                      style={[styles.emptyItemsBox, { backgroundColor: isDark ? '#1E2430' : '#F1F5F9', borderColor: isDark ? '#2A303C' : '#E2E8F0' }]}
                    >
                      <Ionicons name="add-circle-outline" size={18} color={colors.brandLight} />
                      <Text style={[styles.emptyItemsText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                        Toca para agregar artículos desglosados del ticket
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={{ gap: 8 }}>
                      {editItems.map((item, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.editItemRow,
                            { backgroundColor: isDark ? '#242936' : '#F1F5F9', borderColor: isDark ? '#2A303C' : '#E2E8F0' }
                          ]}
                        >
                          <TextInput
                            style={[styles.itemInputName, { color: isDark ? '#F1F3F7' : '#0F172A' }]}
                            placeholder="Nombre artículo"
                            placeholderTextColor={colors.textDim}
                            value={item.name}
                            onChangeText={(txt) => handleUpdateItem(idx, 'name', txt)}
                          />

                          <View style={styles.itemRightGroup}>
                            <View style={styles.itemQtyWrapper}>
                              <Text style={[styles.itemSubLabel, { color: colors.textDim }]}>Cant:</Text>
                              <TextInput
                                style={[styles.itemInputQty, { color: isDark ? '#F1F3F7' : '#0F172A' }]}
                                placeholder="1"
                                placeholderTextColor={colors.textDim}
                                keyboardType="number-pad"
                                value={String(item.quantity || 1)}
                                onChangeText={(txt) => handleUpdateItem(idx, 'quantity', parseInt(txt.replace(/\D/g, '')) || 1)}
                              />
                            </View>

                            <View style={styles.itemPriceWrapper}>
                              <Text style={[styles.itemSubLabel, { color: colors.textDim }]}>$</Text>
                              <TextInput
                                style={[styles.itemInputPrice, { color: colors.emeraldLight }]}
                                placeholder="0.00"
                                placeholderTextColor={colors.textDim}
                                keyboardType="decimal-pad"
                                value={item.price > 0 || item.price === 0 ? String(item.price) : ''}
                                onChangeText={(txt) => handleUpdateItem(idx, 'price', parseFloat(txt.replace(',', '.')) || 0)}
                              />
                            </View>

                            <TouchableOpacity
                              onPress={() => handleRemoveItem(idx)}
                              style={styles.itemDeleteBtn}
                            >
                              <Ionicons name="trash-outline" size={16} color={colors.roseLight} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                <Text style={[styles.formLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>Notas u Observaciones</Text>
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
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  placeholder="Número de factura, proveedor, etc."
                  placeholderTextColor={colors.textDim}
                />

                <View style={styles.actionRow}>
                  <Button
                    title="Cancelar"
                    variant="secondary"
                    onPress={() => setIsEditing(false)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title={isSaving ? "Guardando..." : "Guardar Cambios"}
                    variant="primary"
                    disabled={isSaving}
                    onPress={handleSaveEdit}
                    icon={<Ionicons name="checkmark" size={16} color="#fff" />}
                    style={{ flex: 2 }}
                  />
                </View>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 24, 38, 0.45)',
    justifyContent: 'flex-end',
  },
  dialog: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: radii.outer,
    borderTopRightRadius: radii.outer,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    maxHeight: '90%',
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragHandleBar: {
    width: 40,
    height: 4.5,
    borderRadius: 3,
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.emeraldLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textMain,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    padding: 20,
  },
  amountBox: {
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    borderRadius: radii.md,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textDim,
    textTransform: 'uppercase',
  },
  amountValue: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.rose,
    marginVertical: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  infoKey: {
    fontSize: 13,
    color: colors.textDim,
    fontWeight: '600',
  },
  infoVal: {
    fontSize: 13,
    color: colors.textMain,
    fontWeight: '700',
  },
  notesBox: {
    marginTop: 14,
    backgroundColor: colors.bgTertiary,
    borderRadius: radii.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  notesKey: {
    fontSize: 11,
    color: colors.amberLight,
    fontWeight: '700',
    marginBottom: 4,
  },
  notesVal: {
    fontSize: 12,
    color: colors.textMain,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    marginBottom: 10,
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
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  pillActive: {
    backgroundColor: colors.emerald,
    borderColor: colors.emerald,
  },
  pillActiveGreen: {
    backgroundColor: colors.emerald,
    borderColor: colors.emerald,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  pillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  receiptBox: {
    padding: 12,
    borderRadius: radii.md,
    marginTop: 12,
    borderWidth: 1,
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  receiptHeaderText: {
    fontSize: 12,
    fontWeight: '800',
  },
  receiptDivider: {
    height: 1,
    marginVertical: 8,
  },
  receiptItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 0.5,
  },
  receiptItemName: {
    fontSize: 12,
    fontWeight: '600',
  },
  receiptItemPrice: {
    fontSize: 12,
    fontWeight: '700',
  },
  smallActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  smallActionBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  emptyItemsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  emptyItemsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  editItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8,
  },
  itemInputName: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 4,
  },
  itemRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemQtyWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: radii.sm,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  itemSubLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  itemInputQty: {
    fontSize: 12,
    width: 24,
    textAlign: 'center',
    paddingVertical: 2,
    paddingHorizontal: 0,
    fontWeight: '700',
  },
  itemPriceWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: radii.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  itemInputPrice: {
    fontSize: 13,
    minWidth: 46,
    fontWeight: '800',
    paddingVertical: 2,
    paddingHorizontal: 0,
  },
  itemDeleteBtn: {
    padding: 4,
  },
});
