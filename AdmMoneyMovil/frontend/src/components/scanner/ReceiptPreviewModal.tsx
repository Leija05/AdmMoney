import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert
} from 'react-native';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { colors, radii } from '../../theme';
import { ReceiptScanResult, Expense } from '../../lib/types';
import { Ionicons } from '@expo/vector-icons';

interface ReceiptPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  scanResult: ReceiptScanResult | null;
  imageUri?: string | null;
  onConfirm: (expense: Partial<Expense>) => Promise<void>;
}

const CATEGORIES = [
  'Insumos Galletas',
  'Empaques y Envíos',
  'Servicios y Luz',
  'Transporte',
  'Hogar y Personales',
  'Otros Gastos'
];

const PAYMENT_METHODS = [
  'Tarjeta Débito',
  'Efectivo',
  'Transferencia',
  'Tarjeta Crédito'
];

export const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({
  visible,
  onClose,
  scanResult,
  imageUri,
  onConfirm
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (scanResult) {
      setMerchant(scanResult.merchant || 'Comercio');
      setAmount(scanResult.total_amount ? String(scanResult.total_amount) : '0.00');
      setCategory(scanResult.suggested_category || CATEGORIES[0]);
      setPaymentMethod('Tarjeta Débito');
      setNotes(`Ticket escaneado (${scanResult.items?.length || 0} productos)`);
    }
  }, [scanResult]);

  if (!scanResult) return null;

  const handleConfirm = async () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Monto Inválido', 'El total del ticket debe ser mayor a cero.');
      return;
    }

    try {
      setIsSaving(true);
      await onConfirm({
        title: `Compra ${merchant.trim() || 'Comercio'}`,
        amount: val,
        category,
        date: scanResult.date || new Date().toISOString().split('T')[0],
        payment_method: paymentMethod,
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo guardar el gasto del ticket.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerEyebrow}>OCR Inteligente</Text>
              <Text style={styles.headerTitle}>Verificar Ticket Escaneado</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {imageUri && (
              <View style={styles.imageContainer}>
                <Image source={{ uri: imageUri }} style={styles.receiptThumb} />
              </View>
            )}

            {/* Editable Merchant & Amount */}
            <View style={styles.editSection}>
              <Text style={styles.formLabel}>Nombre del Comercio</Text>
              <TextInput
                style={styles.input}
                value={merchant}
                onChangeText={setMerchant}
                placeholder="Costco, Walmart, OXXO"
                placeholderTextColor={colors.textDim}
              />

              <Text style={styles.formLabel}>Total Extraído ($ MXN)</Text>
              <TextInput
                style={[styles.input, styles.amountInput]}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={colors.textDim}
              />

              <Text style={styles.formLabel}>Categoría del Gasto</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {CATEGORIES.map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setCategory(c)}
                      style={[styles.pill, category === c && styles.pillActive]}
                    >
                      <Text style={[styles.pillText, category === c && styles.pillTextActive]}>
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.formLabel}>Método de Pago</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {PAYMENT_METHODS.map((m) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setPaymentMethod(m)}
                    style={[styles.pill, paymentMethod === m && styles.pillActiveGreen]}
                  >
                    <Text style={[styles.pillText, paymentMethod === m && styles.pillTextActive]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Receipt Items Breakdown Paper Card */}
            {scanResult.items && scanResult.items.length > 0 && (
              <View style={styles.paperCard}>
                <Text style={styles.paperTitle}>DESGLOSE DE ARTÍCULOS DETECTADOS</Text>
                <View style={styles.divider} />

                {scanResult.items.map((item, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.quantity}x {item.name}
                    </Text>
                    <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                  </View>
                ))}

                <View style={styles.thickDivider} />
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>TOTAL TICKET:</Text>
                  <Text style={styles.totalAmount}>${parseFloat(amount || '0').toFixed(2)} MXN</Text>
                </View>
              </View>
            )}

            <Text style={styles.formLabel}>Notas u Observación</Text>
            <TextInput
              style={[styles.input, { height: 55 }]}
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder="Notas del ticket o comprobante"
              placeholderTextColor={colors.textDim}
            />

            <View style={styles.footer}>
              <Button
                title="Cancelar"
                variant="secondary"
                onPress={onClose}
                style={{ flex: 1 }}
              />
              <Button
                title={isSaving ? "Guardando..." : `Confirmar $${parseFloat(amount || '0').toFixed(2)}`}
                variant="primary"
                disabled={isSaving}
                onPress={handleConfirm}
                icon={<Ionicons name="checkmark-circle" size={18} color="#fff" />}
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
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radii.outer,
    borderTopRightRadius: radii.outer,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
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
  content: {
    padding: 18,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 14,
  },
  receiptThumb: {
    width: '100%',
    height: 120,
    borderRadius: radii.md,
    resizeMode: 'cover',
  },
  editSection: {
    marginBottom: 10,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: colors.textDim,
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    padding: 11,
    color: colors.textMain,
    fontSize: 13,
    marginBottom: 12,
  },
  amountInput: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.rose,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    backgroundColor: '#F3F4F6',
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
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  pillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  paperCard: {
    backgroundColor: '#ffffff',
    borderRadius: radii.md,
    padding: 14,
    marginBottom: 16,
  },
  paperTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    textAlign: 'center',
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 0.5,
    borderColor: '#cbd5e1',
    marginVertical: 8,
  },
  thickDivider: {
    height: 2,
    backgroundColor: '#334155',
    marginVertical: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  itemName: {
    fontSize: 12,
    color: '#1e293b',
    flex: 1,
    marginRight: 8,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 3,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  totalAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    marginBottom: 20,
  },
});
