import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Button } from '../ui/Button';
import { colors, useThemeColors, radii, spacing } from '../../theme';
import { Ingredient } from '../../lib/types';
import { Ionicons } from '@expo/vector-icons';

interface AddIngredientModalProps {
  visible: boolean;
  onClose: () => void;
  onAddIngredient: (data: Partial<Ingredient>) => Promise<any>;
  onUpdateIngredient?: (id: number, data: Partial<Ingredient>) => Promise<any>;
  editingIngredient?: Ingredient | null;
}

const UNITS = ['kg', 'g', 'pza', 'ml', 'L'];

export const AddIngredientModal: React.FC<AddIngredientModalProps> = ({
  visible,
  onClose,
  onAddIngredient,
  onUpdateIngredient,
  editingIngredient,
}) => {
  const colors = useThemeColors();
  const isDark = colors.isDark;
  const [name, setName] = useState('');
  const [unit, setUnit] = useState(UNITS[0]);
  const [packageCost, setPackageCost] = useState('');
  const [packageQty, setPackageQty] = useState('1');
  const [stockQty, setStockQty] = useState('1');
  const [supplier, setSupplier] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (visible) {
      if (editingIngredient) {
        setName(editingIngredient.name || '');
        setUnit(editingIngredient.unit || UNITS[0]);
        setPackageCost(String(editingIngredient.package_cost ?? ''));
        setPackageQty(String(editingIngredient.package_quantity ?? '1'));
        setStockQty(String(editingIngredient.stock_quantity ?? '1'));
        setSupplier(editingIngredient.supplier || '');
      } else {
        setName('');
        setUnit(UNITS[0]);
        setPackageCost('');
        setPackageQty('1');
        setStockQty('1');
        setSupplier('');
      }
    }
  }, [visible, editingIngredient]);

  const costNum = parseFloat(packageCost) || 0;
  const qtyNum = parseFloat(packageQty) || 1;
  const unitCost = qtyNum > 0 ? costNum / qtyNum : 0;

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Nombre Requerido', 'Por favor ingresa el nombre del insumo.');
      return;
    }
    if (costNum <= 0) {
      Alert.alert('Costo Inválido', 'El costo del paquete debe ser mayor a 0.');
      return;
    }

    try {
      setIsSaving(true);
      const payload: Partial<Ingredient> = {
        name: name.trim(),
        unit,
        package_cost: costNum,
        package_quantity: qtyNum,
        cost_per_unit: Number(unitCost.toFixed(4)),
        stock_quantity: parseFloat(stockQty) || 1,
        supplier: supplier.trim() || 'Proveedor Local',
      };

      if (editingIngredient && onUpdateIngredient) {
        await onUpdateIngredient(editingIngredient.id, payload);
        setIsSaving(false);
        onClose();
        Alert.alert('¡Insumo Actualizado!', `"${name}" actualizado con éxito.`);
      } else {
        await onAddIngredient(payload);
        setIsSaving(false);
        onClose();
        Alert.alert('¡Insumo Guardado!', `"${name}" registrado con costo unitario de $${unitCost.toFixed(2)} por ${unit}.`);
      }
    } catch (err) {
      setIsSaving(false);
      Alert.alert('Error', 'No se pudo guardar el insumo.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.dialog,
            {
              backgroundColor: isDark ? '#1C202A' : '#FFFFFF',
              borderColor: isDark ? '#2E384D' : '#E2E8F0',
            },
          ]}
        >
          <View style={[styles.header, { borderBottomColor: isDark ? '#2A303C' : '#E5E7EB' }]}>
            <View>
              <Text style={[styles.headerEyebrow, { color: colors.amberLight }]}>Materia Prima</Text>
              <Text style={[styles.headerTitle, { color: isDark ? '#F1F3F7' : '#181A1F' }]}>
                {editingIngredient ? 'Editar Insumo Registrado' : 'Registrar Nuevo Insumo'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flexShrink: 1 }}
            contentContainerStyle={{ padding: 18, paddingBottom: 40 }}
            showsVerticalScrollIndicator={true}
          >
            <Text style={[styles.formLabel, { color: isDark ? '#9BA3AF' : '#5E6472' }]}>
              Nombre del Insumo / Materia Prima
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#242936' : '#F8F9FA',
                  borderColor: isDark ? '#2A303C' : '#E5E7EB',
                  color: isDark ? '#F1F3F7' : '#181A1F',
                },
              ]}
              placeholder="Ej. Mantequilla Gloria, Harina Espelta, Nuez"
              placeholderTextColor={colors.textDim}
              value={name}
              onChangeText={setName}
            />

            <Text style={[styles.formLabel, { color: isDark ? '#9BA3AF' : '#5E6472' }]}>
              Unidad de Medida
            </Text>
            <View style={styles.unitRow}>
              {UNITS.map((u) => (
                <TouchableOpacity
                  key={u}
                  onPress={() => setUnit(u)}
                  style={[
                    styles.unitPill,
                    {
                      backgroundColor: isDark ? '#242936' : '#F1F3F7',
                      borderColor: colors.borderSubtle,
                    },
                    unit === u && {
                      backgroundColor: colors.brandBg,
                      borderColor: colors.brandBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.unitPillText,
                      { color: colors.textMuted },
                      unit === u && { color: colors.brandText, fontWeight: '800' },
                    ]}
                  >
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.formLabel, { color: isDark ? '#9BA3AF' : '#5E6472' }]}>
                  Costo Paquete ($ MXN)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#242936' : '#F8F9FA',
                      borderColor: isDark ? '#2A303C' : '#E5E7EB',
                      color: isDark ? '#F1F3F7' : '#181A1F',
                    },
                  ]}
                  keyboardType="numeric"
                  placeholder="Ej. 185.00"
                  placeholderTextColor={colors.textDim}
                  value={packageCost}
                  onChangeText={setPackageCost}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.formLabel, { color: isDark ? '#9BA3AF' : '#5E6472' }]}>
                  Cantidad del Paquete
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#242936' : '#F8F9FA',
                      borderColor: isDark ? '#2A303C' : '#E5E7EB',
                      color: isDark ? '#F1F3F7' : '#181A1F',
                    },
                  ]}
                  keyboardType="numeric"
                  placeholder="1.0"
                  placeholderTextColor={colors.textDim}
                  value={packageQty}
                  onChangeText={setPackageQty}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.formLabel, { color: isDark ? '#9BA3AF' : '#5E6472' }]}>
                  Stock Inicial en Taller
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#242936' : '#F8F9FA',
                      borderColor: isDark ? '#2A303C' : '#E5E7EB',
                      color: isDark ? '#F1F3F7' : '#181A1F',
                    },
                  ]}
                  keyboardType="numeric"
                  placeholder="1"
                  placeholderTextColor={colors.textDim}
                  value={stockQty}
                  onChangeText={setStockQty}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.formLabel, { color: isDark ? '#9BA3AF' : '#5E6472' }]}>
                  Proveedor / Tienda
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#242936' : '#F8F9FA',
                      borderColor: isDark ? '#2A303C' : '#E5E7EB',
                      color: isDark ? '#F1F3F7' : '#181A1F',
                    },
                  ]}
                  placeholder="Costco, Sam's, Abastos"
                  placeholderTextColor={colors.textDim}
                  value={supplier}
                  onChangeText={setSupplier}
                />
              </View>
            </View>

            {/* Calculated cost pill */}
            <View
              style={[
                styles.calcBox,
                {
                  backgroundColor: isDark ? '#141822' : '#DCFCE7',
                  borderColor: isDark ? '#2E384D' : '#BBF7D0',
                },
              ]}
            >
              <Text style={[styles.calcLabel, { color: isDark ? '#9BA3AF' : '#15803D' }]}>
                Costo Calculado por {unit}:
              </Text>
              <Text style={styles.calcVal}>${unitCost.toFixed(4)} MXN / {unit}</Text>
            </View>

            <View style={styles.actions}>
              <Button
                title="Cancelar"
                variant="secondary"
                onPress={onClose}
                style={{ flex: 1 }}
              />
              <Button
                title={
                  isSaving
                    ? "Guardando..."
                    : editingIngredient
                    ? "Guardar Cambios"
                    : "Guardar Insumo"
                }
                variant="primary"
                disabled={isSaving}
                icon={<Ionicons name="checkmark-circle" size={17} color="#fff" />}
                onPress={handleSubmit}
                style={{ flex: 2 }}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  dialog: {
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius: radii.outer,
    borderTopRightRadius: radii.outer,
    borderWidth: 1,
    borderColor: colors.borderHighlight,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerEyebrow: {
    fontSize: 10,
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
    padding: 18,
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
    fontSize: 13,
    marginBottom: 12,
  },
  unitRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  unitPill: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  unitPillActive: {
    backgroundColor: colors.emerald,
    borderColor: colors.emerald,
  },
  unitPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  unitPillTextActive: {
    color: '#ffffff',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  calcBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: radii.sm,
    padding: 12,
    marginVertical: 10,
  },
  calcLabel: {
    fontSize: 11,
    color: colors.emeraldLight,
    fontWeight: '700',
  },
  calcVal: {
    fontSize: 13,
    color: colors.emeraldLight,
    fontWeight: '900',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    marginBottom: 20,
  },
});
