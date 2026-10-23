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
import { colors, radii, spacing } from '../../theme';
import { Ingredient } from '../../lib/types';
import { Ionicons } from '@expo/vector-icons';

interface AddIngredientModalProps {
  visible: boolean;
  onClose: () => void;
  onAddIngredient: (data: Partial<Ingredient>) => Promise<any>;
}

const UNITS = ['kg', 'g', 'pza', 'ml', 'L'];

export const AddIngredientModal: React.FC<AddIngredientModalProps> = ({
  visible,
  onClose,
  onAddIngredient,
}) => {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState(UNITS[0]);
  const [packageCost, setPackageCost] = useState('');
  const [packageQty, setPackageQty] = useState('1');
  const [stockQty, setStockQty] = useState('1');
  const [supplier, setSupplier] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
      await onAddIngredient({
        name: name.trim(),
        unit,
        package_cost: costNum,
        package_quantity: qtyNum,
        cost_per_unit: Number(unitCost.toFixed(4)),
        stock_quantity: parseFloat(stockQty) || 1,
        supplier: supplier.trim() || 'Proveedor Local',
      });

      setName('');
      setPackageCost('');
      setPackageQty('1');
      setStockQty('1');
      setSupplier('');
      setIsSaving(false);
      onClose();
      Alert.alert('¡Insumo Guardado!', `"${name}" registrado con costo unitario de $${unitCost.toFixed(2)} por ${unit}.`);
    } catch (err) {
      setIsSaving(false);
      Alert.alert('Error', 'No se pudo guardar el insumo.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerEyebrow}>Materia Prima</Text>
              <Text style={styles.headerTitle}>Registrar Nuevo Insumo</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.formLabel}>Nombre del Insumo / Materia Prima</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Mantequilla Gloria, Harina Espelta, Nuez"
              placeholderTextColor={colors.textDim}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.formLabel}>Unidad de Medida</Text>
            <View style={styles.unitRow}>
              {UNITS.map((u) => (
                <TouchableOpacity
                  key={u}
                  onPress={() => setUnit(u)}
                  style={[styles.unitPill, unit === u && styles.unitPillActive]}
                >
                  <Text style={[styles.unitPillText, unit === u && styles.unitPillTextActive]}>
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.formLabel}>Costo Paquete ($ MXN)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="Ej. 185.00"
                  placeholderTextColor={colors.textDim}
                  value={packageCost}
                  onChangeText={setPackageCost}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.formLabel}>Cantidad del Paquete</Text>
                <TextInput
                  style={styles.input}
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
                <Text style={styles.formLabel}>Stock Inicial en Taller</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="1"
                  placeholderTextColor={colors.textDim}
                  value={stockQty}
                  onChangeText={setStockQty}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.formLabel}>Proveedor / Tienda</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Costco, Sam's, Abastos"
                  placeholderTextColor={colors.textDim}
                  value={supplier}
                  onChangeText={setSupplier}
                />
              </View>
            </View>

            {/* Calculated cost pill */}
            <View style={styles.calcBox}>
              <Text style={styles.calcLabel}>Costo Calculado por {unit}:</Text>
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
                title={isSaving ? "Guardando..." : "Guardar Insumo"}
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
