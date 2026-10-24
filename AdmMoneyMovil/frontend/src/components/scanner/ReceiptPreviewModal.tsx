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
  Alert,
  Platform
} from 'react-native';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { colors, useThemeColors, radii } from '../../theme';
import { ReceiptScanResult, Expense, ReceiptItem } from '../../lib/types';
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
  'Efectivo',
  'Transferencia',
  'Tarjeta Débito/Crédito'
];

export const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({
  visible,
  onClose,
  scanResult,
  imageUri,
  onConfirm
}) => {
  const colors = useThemeColors();
  const [isSaving, setIsSaving] = useState(false);
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [showRawText, setShowRawText] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdQty, setNewProdQty] = useState('1');

  useEffect(() => {
    if (scanResult) {
      setMerchant(scanResult.merchant || 'Comercio');
      setAmount(scanResult.total_amount ? String(scanResult.total_amount) : '0.00');
      setCategory(scanResult.suggested_category || CATEGORIES[0]);
      setPaymentMethod('Efectivo');
      setItems(scanResult.items ? [...scanResult.items] : []);
      setNotes(`Ticket escaneado (${scanResult.items?.length || 0} artículos)`);
      setShowRawText(false);
      setShowAddProduct(false);
    } else {
      setMerchant('Ticket de Compra');
      setAmount('0.00');
      setCategory(CATEGORIES[0]);
      setPaymentMethod('Efectivo');
      setItems([]);
      setNotes('Ticket capturado');
    }
  }, [scanResult]);

  const handleRemoveItem = (index: number) => {
    const next = [...items];
    next.splice(index, 1);
    setItems(next);
  };

  const handleAddProduct = () => {
    const pVal = parseFloat(newProdPrice);
    const qVal = parseFloat(newProdQty) || 1;
    if (!newProdName.trim() || isNaN(pVal) || pVal <= 0) {
      Alert.alert('Datos requeridos', 'Ingresa el nombre y un precio válido para el producto.');
      return;
    }
    const nextItems = [...items, { name: newProdName.trim(), quantity: qVal, price: pVal }];
    setItems(nextItems);

    // Auto-update total amount
    const sum = nextItems.reduce((acc, it) => acc + it.price, 0);
    setAmount(sum.toFixed(2));

    setNewProdName('');
    setNewProdPrice('');
    setNewProdQty('1');
    setShowAddProduct(false);
  };

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
        receipt_url: imageUri || '',
        receipt_data: {
          merchant: merchant.trim(),
          total_amount: val,
          date: scanResult.date || new Date().toISOString().split('T')[0],
          items,
          raw_text: scanResult.raw_text,
        } as any,
      });
      onClose();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo guardar el gasto del ticket.');
    } finally {
      setIsSaving(false);
    }
  };

  const displayTotal = parseFloat(amount || '0') || 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.dialog, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}>
          {/* Header (Always fixed at top) */}
          <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="sparkles" size={13} color={colors.emeraldLight} />
                <Text style={[styles.headerEyebrow, { color: colors.emeraldLight }]}>OCR & VISIÓN INTELIGENTE</Text>
              </View>
              <Text style={[styles.headerTitle, { color: colors.textMain }]}>Verificar Ticket Escaneado</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.bgTertiary }]}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Scrollable Content Body */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Real Captured Ticket Photo Preview */}
            {imageUri && (
              <View style={[styles.imageContainer, { borderColor: colors.borderSubtle, backgroundColor: '#000' }]}>
                <Image source={{ uri: imageUri }} style={styles.receiptThumb} resizeMode="contain" />
                <View style={styles.photoLabelBadge}>
                  <Ionicons name="camera" size={11} color="#fff" />
                  <Text style={styles.photoLabelText}>Foto Capturada Real</Text>
                </View>
              </View>
            )}

            {/* Editable Merchant & Amount */}
            <View style={styles.editSection}>
              <Text style={[styles.formLabel, { color: colors.textMuted }]}>Nombre del Comercio / Tienda</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, color: colors.textMain }]}
                value={merchant}
                onChangeText={setMerchant}
                placeholder="Nombre de la tienda o proveedor"
                placeholderTextColor={colors.textDim}
              />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                <Text style={[styles.formLabel, { color: colors.textMuted }]}>Total Detectado ($ MXN)</Text>
                <Text style={{ fontSize: 10, color: colors.textDim }}>Puedes corregir el monto si difiere</Text>
              </View>
              <TextInput
                style={[styles.input, styles.amountInput, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, color: colors.emeraldLight }]}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={colors.textDim}
              />

              <Text style={[styles.formLabel, { color: colors.textMuted, marginTop: 10 }]}>Categoría del Gasto</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {CATEGORIES.map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setCategory(c)}
                      style={[
                        styles.pill,
                        { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle },
                        category === c && { backgroundColor: colors.brandBg, borderColor: colors.brandBorder },
                      ]}
                    >
                      <Text style={[styles.pillText, { color: colors.textMuted }, category === c && { color: colors.brandText, fontWeight: '800' }]}>
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={[styles.formLabel, { color: colors.textMuted }]}>Método de Pago</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {PAYMENT_METHODS.map((m) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setPaymentMethod(m)}
                    style={[
                      styles.pill,
                      { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle },
                      paymentMethod === m && { backgroundColor: colors.emeraldBg, borderColor: colors.emeraldBorder },
                    ]}
                  >
                    <Text style={[styles.pillText, { color: colors.textMuted }, paymentMethod === m && { color: colors.emeraldText, fontWeight: '800' }]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Receipt Items Breakdown */}
            <View style={[styles.paperCard, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[styles.paperTitle, { color: colors.textDim }]}>
                  ARTÍCULOS EXTRAÍDOS ({items.length})
                </Text>
                <TouchableOpacity
                  onPress={() => setShowAddProduct(!showAddProduct)}
                  style={[styles.addProdBadge, { backgroundColor: colors.brandBg, borderColor: colors.brandBorder }]}
                >
                  <Ionicons name={showAddProduct ? 'close' : 'add'} size={13} color={colors.brandText} />
                  <Text style={[styles.addProdText, { color: colors.brandText }]}>
                    {showAddProduct ? 'Cerrar' : '+ Agregar'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Form to manually add item to receipt */}
              {showAddProduct && (
                <View style={[styles.addProductBox, { borderColor: colors.borderSubtle, backgroundColor: colors.bgCard }]}>
                  <Text style={[styles.subLabel, { color: colors.textDim }]}>Agregar Producto Manual:</Text>
                  <TextInput
                    style={[styles.inputSm, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, color: colors.textMain }]}
                    placeholder="Nombre del producto (ej. Harina)"
                    placeholderTextColor={colors.textDim}
                    value={newProdName}
                    onChangeText={setNewProdName}
                  />
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                    <TextInput
                      style={[styles.inputSm, { flex: 1, backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, color: colors.textMain }]}
                      placeholder="Cantidad (1)"
                      placeholderTextColor={colors.textDim}
                      keyboardType="numeric"
                      value={newProdQty}
                      onChangeText={setNewProdQty}
                    />
                    <TextInput
                      style={[styles.inputSm, { flex: 2, backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, color: colors.textMain }]}
                      placeholder="Precio ($)"
                      placeholderTextColor={colors.textDim}
                      keyboardType="numeric"
                      value={newProdPrice}
                      onChangeText={setNewProdPrice}
                    />
                    <TouchableOpacity onPress={handleAddProduct} style={styles.addBtnSmall}>
                      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>Añadir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={[styles.divider, { borderColor: colors.borderSubtle }]} />

              {items.length === 0 ? (
                <Text style={{ fontSize: 12, color: colors.textDim, paddingVertical: 6, fontStyle: 'italic' }}>
                  No se desglosaron artículos individuales. El total se registrará directamente.
                </Text>
              ) : (
                items.map((item, idx) => (
                  <View key={idx} style={[styles.itemRow, { borderBottomColor: colors.borderSubtle }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemName, { color: colors.textMain }]} numberOfLines={2}>
                        {item.quantity}x {item.name}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Text style={[styles.itemPrice, { color: colors.textMain }]}>${item.price.toFixed(2)}</Text>
                      <TouchableOpacity onPress={() => handleRemoveItem(idx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="trash-outline" size={15} color={colors.rose} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}

              <View style={[styles.thickDivider, { backgroundColor: colors.borderSubtle }]} />
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.textMain }]}>TOTAL TICKET:</Text>
                <Text style={[styles.totalAmount, { color: colors.emeraldLight }]}>
                  ${displayTotal.toFixed(2)} MXN
                </Text>
              </View>
            </View>

            {/* Expandable Raw Text from OCR */}
            {scanResult.raw_text && (
              <View style={{ marginTop: 10 }}>
                <TouchableOpacity
                  onPress={() => setShowRawText(!showRawText)}
                  style={[styles.rawTextBtn, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="document-text-outline" size={14} color={colors.brand} />
                  <Text style={[styles.rawTextBtnLabel, { color: colors.brand }]}>
                    {showRawText ? 'Ocultar Texto Leído por IA' : 'Ver Texto Completo Leído por IA'}
                  </Text>
                  <Ionicons name={showRawText ? 'chevron-up' : 'chevron-down'} size={14} color={colors.brand} />
                </TouchableOpacity>

                {showRawText && (
                  <View style={[styles.rawTextBox, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}>
                    <Text style={[styles.rawTextContent, { color: colors.textMuted }]}>
                      {scanResult.raw_text}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <Text style={[styles.formLabel, { color: colors.textMuted, marginTop: 12 }]}>Notas u Observación</Text>
            <TextInput
              style={[styles.input, { height: 50, backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, color: colors.textMain }]}
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder="Notas del ticket o comprobante"
              placeholderTextColor={colors.textDim}
            />
          </ScrollView>

          {/* FIXED STICKY FOOTER (ALWAYS 100% VISIBLE & NOT CUT OFF) */}
          <View style={[styles.fixedFooter, { borderTopColor: colors.borderSubtle, backgroundColor: colors.bgCard }]}>
            <Button
              title="Cancelar"
              variant="secondary"
              onPress={onClose}
              style={{ flex: 1 }}
            />
            <Button
              title={isSaving ? "Guardando..." : `Confirmar $${displayTotal.toFixed(2)}`}
              variant="primary"
              disabled={isSaving}
              onPress={handleConfirm}
              icon={<Ionicons name="checkmark-circle" size={18} color="#fff" />}
              style={{ flex: 2 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'flex-end',
  },
  dialog: {
    borderTopLeftRadius: radii.outer,
    borderTopRightRadius: radii.outer,
    height: '88%',
    borderWidth: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  imageContainer: {
    height: 160,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 14,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptThumb: {
    width: '100%',
    height: '100%',
  },
  photoLabelBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  photoLabelText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  editSection: {
    marginBottom: 10,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  input: {
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    borderWidth: 1,
  },
  inputSm: {
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    borderWidth: 1,
  },
  amountInput: {
    fontSize: 22,
    fontWeight: '900',
  },
  pill: {
    borderRadius: radii.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paperCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: 12,
    marginTop: 6,
  },
  paperTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  addProdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  addProdText: {
    fontSize: 10,
    fontWeight: '800',
  },
  addProductBox: {
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  addBtnSmall: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    borderBottomWidth: 1,
    marginVertical: 8,
  },
  thickDivider: {
    height: 1.5,
    marginVertical: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '700',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  totalAmount: {
    fontSize: 17,
    fontWeight: '900',
  },
  rawTextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  rawTextBtnLabel: {
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
    marginLeft: 6,
  },
  rawTextBox: {
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: 10,
    marginTop: 6,
    maxHeight: 140,
  },
  rawTextContent: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  fixedFooter: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    paddingBottom: Platform.OS === 'ios' ? 26 : 16,
    borderTopWidth: 1,
    elevation: 8,
  },
});
