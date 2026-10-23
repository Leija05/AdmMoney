import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform
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
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (expense) {
      setTitle(expense.title);
      setAmount(String(expense.amount));
      setCategory(expense.category);
      setPaymentMethod(expense.payment_method || 'Efectivo');
      setNotes(expense.notes || '');
      setIsEditing(false);
    }
  }, [expense]);

  if (!expense) return null;

  const handleSaveEdit = async () => {
    const val = parseFloat(amount);
    if (!title.trim() || isNaN(val) || val <= 0) {
      Alert.alert('Datos Inválidos', 'Ingresa un concepto válido y un monto mayor a cero.');
      return;
    }

    try {
      setIsSaving(true);
      await onUpdate(expense.id, {
        title: title.trim(),
        amount: val,
        category,
        payment_method: paymentMethod,
        notes: notes.trim(),
      });
      setIsEditing(false);
      Alert.alert('¡Actualizado!', 'El gasto ha sido modificado correctamente.');
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
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.dialog, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={[styles.headerEyebrow, { color: colors.emeraldLight }]}>
                {isEditing ? 'Editar Registro' : 'Detalle del Gasto'}
              </Text>
              <Text style={[styles.headerTitle, { color: colors.textMain }]} numberOfLines={1}>
                {expense.title}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
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
                <Text style={[styles.formLabel, { color: colors.textMuted }]}>Concepto del Gasto</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, color: colors.textMain }]}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Ej. Harina, Mantequilla, CFE"
                  placeholderTextColor={colors.textDim}
                />

                <Text style={[styles.formLabel, { color: colors.textMuted }]}>Monto ($ MXN)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, color: colors.textMain }]}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={colors.textDim}
                />

                <Text style={styles.formLabel}>Categoría</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => setCategory(cat)}
                        style={[styles.pill, category === cat && styles.pillActive]}
                      >
                        <Text style={[styles.pillText, category === cat && styles.pillTextActive]}>
                          {cat}
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
                      style={[styles.pill, paymentMethod === method && styles.pillActiveGreen]}
                    >
                      <Text style={[styles.pillText, paymentMethod === method && styles.pillTextActive]}>
                        {method}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.formLabel}>Notas u Observaciones</Text>
                <TextInput
                  style={[styles.input, { height: 60 }]}
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
        </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
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
});
