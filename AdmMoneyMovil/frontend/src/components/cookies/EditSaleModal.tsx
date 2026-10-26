import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  PanResponder,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useThemeColors, radii, spacing } from '../../theme';
import { CookieSale } from '../../lib/types';

export interface EditSaleModalProps {
  visible: boolean;
  sale: CookieSale | null;
  onClose: () => void;
  onSave: (id: number, data: Partial<CookieSale>) => Promise<any>;
}

const PAYMENT_METHODS = ['Efectivo', 'Transferencia', 'Tarjeta', 'Otro'];

export const EditSaleModal: React.FC<EditSaleModalProps> = ({
  visible,
  sale,
  onClose,
  onSave,
}) => {
  const colors = useThemeColors();
  const isDark = colors.isDark;

  const [customerName, setCustomerName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('35.00');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const screenHeight = Dimensions.get('window').height;
  const modalHeight = Math.round(screenHeight * 0.88);
  const translateY = useRef(new Animated.Value(0)).current;

  // Swipe-down to dismiss gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        return gestureState.dy > 6 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.3;
      },
      onPanResponderMove: (_evt, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        } else {
          translateY.setValue(gestureState.dy * 0.15);
        }
      },
      onPanResponderRelease: (_evt, gestureState) => {
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
    if (visible && sale) {
      translateY.setValue(0);
      setCustomerName(sale.customer_name || 'Cliente Mostrador');
      setQuantity(String(sale.quantity || 1));
      setUnitPrice(sale.unit_price ? sale.unit_price.toFixed(2) : '35.00');
      setPaymentMethod(sale.payment_method || 'Efectivo');
      setNotes(sale.notes || '');
    }
  }, [visible, sale]);

  if (!sale) return null;

  // Cálculos en vivo
  const qtyNum = Math.max(1, parseInt(quantity) || 1);
  const priceNum = Math.max(0, parseFloat(unitPrice) || 0);
  const unitCost = sale.unit_cost || (sale.quantity > 0 ? sale.total_cost / sale.quantity : 8.50);
  const discount = sale.discount_amount || 0;
  const newRevenue = Math.max(0, (qtyNum * priceNum) - discount);
  const newCost = qtyNum * unitCost;
  const newProfit = newRevenue - newCost;

  const handleSave = async () => {
    if (qtyNum <= 0) {
      Alert.alert('Error', 'La cantidad debe ser mayor a 0');
      return;
    }
    if (priceNum <= 0) {
      Alert.alert('Error', 'El precio unitario debe ser mayor a 0');
      return;
    }

    try {
      setIsSaving(true);
      await onSave(sale.id, {
        customer_name: customerName.trim() || 'Cliente Mostrador',
        quantity: qtyNum,
        unit_price: priceNum,
        payment_method: paymentMethod,
        notes: notes.trim(),
      });
      Alert.alert('¡Venta Actualizada!', `Se han guardado los cambios para la venta de ${sale.cookie_name}.`);
      onClose();
    } catch (err: any) {
      Alert.alert('Error al guardar', err?.message || 'No se pudo actualizar la venta.');
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
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.dialog,
            {
              height: modalHeight,
              maxHeight: modalHeight,
              backgroundColor: isDark ? '#1C202A' : '#FFFFFF',
              borderColor: colors.borderSubtle,
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Top Drag Handle Bar with Swipe-down Gesture */}
          <View {...panResponder.panHandlers}>
            <View style={styles.handleWrapper}>
              <View style={[styles.handleBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.18)' }]} />
            </View>

            <View style={styles.header}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[styles.headerEyebrow, { color: colors.amberLight }]}>
                  Modificar Registro de Venta
                </Text>
                <Text style={[styles.headerTitle, { color: colors.textMain }]} numberOfLines={1}>
                  {sale.cookie_name}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.closeCircle, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={18} color={colors.textMain} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            {/* Live Financial Preview Card */}
            <View style={[styles.previewCard, { backgroundColor: isDark ? '#141824' : '#F8FAFC', borderColor: colors.borderSubtle }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.amberLight, textTransform: 'uppercase' }}>
                  Cálculo en Tiempo Real
                </Text>
                <Badge label={`${qtyNum} galletas`} variant="amber" />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ fontSize: 11, color: colors.textDim }}>Total a Cobrar:</Text>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: colors.amberLight }}>
                    ${newRevenue.toFixed(2)} MXN
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 11, color: colors.textDim }}>Ganancia Neta Libre:</Text>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: colors.emeraldLight }}>
                    +${newProfit.toFixed(2)} MXN
                  </Text>
                </View>
              </View>
            </View>

            {/* Field 1: Cliente */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textDim }]}>Nombre del Cliente</Text>
              <TextInput
                style={[styles.inputField, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, color: colors.textMain }]}
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="Ej. Juan Pérez / Mostrador"
                placeholderTextColor={colors.textDim}
              />
            </View>

            {/* Field 2 & 3: Cantidad y Precio Unitario */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.textDim }]}>Cantidad (Galletas)</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, color: colors.textMain, fontWeight: '800' }]}
                  value={quantity}
                  onChangeText={(t) => setQuantity(t.replace(/\D/g, ''))}
                  keyboardType="number-pad"
                  placeholder="1"
                  placeholderTextColor={colors.textDim}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1.2 }]}>
                <Text style={[styles.inputLabel, { color: colors.textDim }]}>Precio x Galleta ($ MXN)</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, color: colors.amberLight, fontWeight: '800' }]}
                  value={unitPrice}
                  onChangeText={(t) => setUnitPrice(t.replace(',', '.'))}
                  keyboardType="decimal-pad"
                  placeholder="35.00"
                  placeholderTextColor={colors.textDim}
                />
              </View>
            </View>

            {/* Field 4: Método de Pago */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textDim }]}>Método de Pago</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {PAYMENT_METHODS.map((method) => {
                  const isSelected = paymentMethod === method;
                  return (
                    <TouchableOpacity
                      key={method}
                      onPress={() => setPaymentMethod(method)}
                      style={[
                        styles.chipBtn,
                        {
                          backgroundColor: isSelected ? colors.brand : colors.bgTertiary,
                          borderColor: isSelected ? colors.brand : colors.borderSubtle,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.chipBtnText,
                          {
                            color: isSelected ? '#FFFFFF' : colors.textMain,
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
            </View>

            {/* Field 5: Notas del Pedido */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textDim }]}>Notas / Referencia</Text>
              <TextInput
                style={[
                  styles.inputField,
                  {
                    backgroundColor: colors.bgTertiary,
                    borderColor: colors.borderSubtle,
                    color: colors.textMain,
                    height: 70,
                    textAlignVertical: 'top',
                    paddingTop: 8,
                  },
                ]}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                placeholder="Ej. Pagó con billete de $500, entregado con bolsita kraft."
                placeholderTextColor={colors.textDim}
              />
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View style={[styles.footer, { borderTopColor: colors.borderSubtle, backgroundColor: isDark ? '#161A24' : '#FFFFFF' }]}>
            <Button
              title="Cancelar"
              variant="secondary"
              onPress={onClose}
              style={{ flex: 1 }}
              disabled={isSaving}
            />
            <Button
              title={isSaving ? 'Guardando...' : 'Guardar Cambios'}
              variant="amber"
              onPress={handleSave}
              style={{ flex: 2 }}
              disabled={isSaving}
              icon={<Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  dialog: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  handleWrapper: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  closeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  body: {
    padding: 16,
    paddingBottom: 30,
  },
  previewCard: {
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputField: {
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13.5,
  },
  chipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  chipBtnText: {
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
});
export default EditSaleModal;
