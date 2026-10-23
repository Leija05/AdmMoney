import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import { colors, useThemeColors, radii, spacing } from '../../theme';
import { Button } from '../ui/Button';
import { CookieProduct, Promotion, PromoType, PromoScope } from '../../lib/types';
import { Ionicons } from '@expo/vector-icons';

interface AddPromotionModalProps {
  visible: boolean;
  onClose: () => void;
  cookies: CookieProduct[];
  onAddPromotion: (data: Partial<Promotion>) => Promise<Promotion>;
}

export const AddPromotionModal: React.FC<AddPromotionModalProps> = ({
  visible,
  onClose,
  cookies,
  onAddPromotion,
}) => {
  const colors = useThemeColors();
  const isDark = colors.isDark;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [promoType, setPromoType] = useState<PromoType>('combo_fixed_price');
  const [discountValue, setDiscountValue] = useState('90');
  const [targetType, setTargetType] = useState<PromoScope>('all_products');
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [minQuantity, setMinQuantity] = useState('3');
  const [minOrderAmount, setMinOrderAmount] = useState('0');
  const [badgeText, setBadgeText] = useState('3 x $90');
  const [colorTag, setColorTag] = useState('#F59E0B');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTypeSelect = (type: PromoType) => {
    setPromoType(type);
    if (type === 'combo_fixed_price') {
      setDiscountValue('90');
      setMinQuantity('3');
      setBadgeText('3 x $90');
    } else if (type === 'percentage') {
      setDiscountValue('15');
      setMinQuantity('1');
      setBadgeText('15% OFF');
    } else if (type === 'fixed_amount') {
      setDiscountValue('30');
      setMinQuantity('1');
      setMinOrderAmount('250');
      setBadgeText('-$30 MXN');
    } else if (type === 'two_for_one') {
      setDiscountValue('1');
      setMinQuantity('2');
      setBadgeText('2x1');
    }
  };

  const handleToggleProduct = (id: number) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Nombre requerido', 'Escribe el nombre de la promoción.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddPromotion({
        name: name.trim(),
        description: description.trim(),
        promo_type: promoType,
        discount_value: parseFloat(discountValue) || 0,
        target_type: targetType,
        target_product_ids: targetType === 'specific_products' ? selectedProductIds : [],
        min_quantity: parseInt(minQuantity, 10) || 1,
        min_order_amount: parseFloat(minOrderAmount) || 0,
        badge_text: badgeText.trim() || 'PROMO',
        color_tag: colorTag,
        is_active: true
      });
      onClose();
      // Reset
      setName('');
      setDescription('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No fue posible guardar la promoción.');
    } finally {
      setIsSubmitting(false);
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
              <Text style={[styles.eyebrow, { color: colors.amberLight }]}>Marketing & Ventas</Text>
              <Text style={[styles.title, { color: isDark ? '#F1F3F7' : '#181A1F' }]}>
                Nueva Promoción / Oferta
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Visual Preview */}
            <View style={[styles.previewCard, { backgroundColor: `${colorTag}15`, borderColor: `${colorTag}40` }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.previewTitle, { color: isDark ? '#F1F3F7' : '#0F172A' }]}>{name || 'Título de la Oferta'}</Text>
                <Text style={[styles.previewDesc, { color: isDark ? '#94A3B8' : '#475569' }]}>{description || 'Descripción de la promoción.'}</Text>
              </View>
              <View style={[styles.previewBadge, { backgroundColor: colorTag }]}>
                <Text style={styles.previewBadgeText}>{badgeText || 'PROMO'}</Text>
              </View>
            </View>

            {/* Nombre */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: isDark ? '#9BA3AF' : '#5E6472' }]}>Nombre de la Promoción *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#242936' : '#F8F9FA', borderColor: isDark ? '#2A303C' : '#E5E7EB', color: isDark ? '#F1F3F7' : '#181A1F' }]}
                value={name}
                onChangeText={setName}
                placeholder="Ej. Trío Dulce, Docena Consentida..."
                placeholderTextColor={colors.textDim}
              />
            </View>

            {/* Texto de Etiqueta (Badge) */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: isDark ? '#9BA3AF' : '#5E6472' }]}>Texto de Etiqueta (Badge) *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#242936' : '#F8F9FA', borderColor: isDark ? '#2A303C' : '#E5E7EB', color: isDark ? '#F1F3F7' : '#181A1F' }]}
                value={badgeText}
                onChangeText={setBadgeText}
                placeholder="Ej. 3 x $90, 15% OFF, 2x1..."
                placeholderTextColor={colors.textDim}
              />
            </View>

            {/* Descripción */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: isDark ? '#9BA3AF' : '#5E6472' }]}>Descripción para el Cliente</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#242936' : '#F8F9FA', borderColor: isDark ? '#2A303C' : '#E5E7EB', color: isDark ? '#F1F3F7' : '#181A1F' }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Ej. Lleva 3 galletas por solo $90 MXN"
                placeholderTextColor={colors.textDim}
              />
            </View>

            {/* Tipo de Oferta */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: isDark ? '#9BA3AF' : '#5E6472' }]}>Tipo de Oferta</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[styles.typeBtn, { backgroundColor: isDark ? '#242936' : '#F1F3F7', borderColor: colors.borderSubtle }, promoType === 'combo_fixed_price' && styles.typeBtnActive]}
                  onPress={() => handleTypeSelect('combo_fixed_price')}
                >
                  <Ionicons name="gift-outline" size={18} color={promoType === 'combo_fixed_price' ? colors.brand : colors.textMuted} />
                  <Text style={[styles.typeBtnText, promoType === 'combo_fixed_price' && styles.typeBtnTextActive]}>Combo $</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.typeBtn, { backgroundColor: isDark ? '#242936' : '#F1F3F7', borderColor: colors.borderSubtle }, promoType === 'percentage' && styles.typeBtnActive]}
                  onPress={() => handleTypeSelect('percentage')}
                >
                  <Ionicons name="pricetag-outline" size={18} color={promoType === 'percentage' ? colors.brand : colors.textMuted} />
                  <Text style={[styles.typeBtnText, promoType === 'percentage' && styles.typeBtnTextActive]}>Desc. %</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.typeBtn, { backgroundColor: isDark ? '#242936' : '#F1F3F7', borderColor: colors.borderSubtle }, promoType === 'fixed_amount' && styles.typeBtnActive]}
                  onPress={() => handleTypeSelect('fixed_amount')}
                >
                  <Ionicons name="cash-outline" size={18} color={promoType === 'fixed_amount' ? colors.brand : colors.textMuted} />
                  <Text style={[styles.typeBtnText, promoType === 'fixed_amount' && styles.typeBtnTextActive]}>Fijo $</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.typeBtn, { backgroundColor: isDark ? '#242936' : '#F1F3F7', borderColor: colors.borderSubtle }, promoType === 'two_for_one' && styles.typeBtnActive]}
                  onPress={() => handleTypeSelect('two_for_one')}
                >
                  <Ionicons name="flame-outline" size={18} color={promoType === 'two_for_one' ? colors.brand : colors.textMuted} />
                  <Text style={[styles.typeBtnText, promoType === 'two_for_one' && styles.typeBtnTextActive]}>2x1</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Valores numéricos */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: isDark ? '#9BA3AF' : '#5E6472' }]}>
                  {promoType === 'combo_fixed_price' ? 'Precio Combo ($)' : promoType === 'percentage' ? '% Descuento' : 'Monto ($)'}
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: isDark ? '#242936' : '#F8F9FA', borderColor: isDark ? '#2A303C' : '#E5E7EB', color: isDark ? '#F1F3F7' : '#181A1F' }]}
                  keyboardType="numeric"
                  value={discountValue}
                  onChangeText={setDiscountValue}
                  editable={promoType !== 'two_for_one'}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Piezas Mínimas</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={minQuantity}
                  onChangeText={setMinQuantity}
                />
              </View>
            </View>

            {/* Alcance: Todo el Menú vs Específicas */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>¿A qué productos aplica?</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[styles.typeBtn, targetType === 'all_products' && styles.typeBtnActive]}
                  onPress={() => setTargetType('all_products')}
                >
                  <Text style={[styles.typeBtnText, targetType === 'all_products' && styles.typeBtnTextActive]}>
                    Todo el Menú
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.typeBtn, targetType === 'specific_products' && styles.typeBtnActive]}
                  onPress={() => setTargetType('specific_products')}
                >
                  <Text style={[styles.typeBtnText, targetType === 'specific_products' && styles.typeBtnTextActive]}>
                    Galletas Específicas
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.typeBtn, targetType === 'order_total' && styles.typeBtnActive]}
                  onPress={() => setTargetType('order_total')}
                >
                  <Text style={[styles.typeBtnText, targetType === 'order_total' && styles.typeBtnTextActive]}>
                    Total del Pedido
                  </Text>
                </TouchableOpacity>
              </View>

              {targetType === 'specific_products' && (
                <View style={styles.productListContainer}>
                  {cookies.map((c) => {
                    const isChecked = selectedProductIds.includes(c.id);
                    return (
                      <TouchableOpacity
                        key={c.id}
                        style={[styles.productCheckRow, isChecked && styles.productCheckRowActive]}
                        onPress={() => handleToggleProduct(c.id)}
                      >
                        <Ionicons
                          name={isChecked ? 'checkbox' : 'square-outline'}
                          size={18}
                          color={isChecked ? colors.brand : colors.textMuted}
                        />
                        <Text style={{ fontSize: 13, color: colors.textMain, flex: 1, marginLeft: 6 }}>
                          {c.name}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.textDim }}>${c.sale_price}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Color Tag */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Color del Distintivo</Text>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                {['#F59E0B', '#EC4899', '#10B981', '#8B5CF6', '#3B82F6'].map((hex) => (
                  <TouchableOpacity
                    key={hex}
                    onPress={() => setColorTag(hex)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: hex,
                      borderWidth: colorTag === hex ? 3 : 0,
                      borderColor: '#181A1F'
                    }}
                  />
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              title="Cancelar"
              variant="secondary"
              onPress={onClose}
              style={{ flex: 1, marginRight: 8 }}
            />
            <Button
              title={isSubmitting ? 'Guardando...' : 'Crear Promoción'}
              variant="primary"
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={{ flex: 1 }}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  dialog: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textMain,
    marginTop: 2,
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  previewCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textMain,
  },
  previewDesc: {
    fontSize: 12,
    color: colors.textDim,
    marginTop: 2,
  },
  previewBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  previewBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMain,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textMain,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBtn: {
    flex: 1,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  typeBtnActive: {
    borderColor: colors.brand,
    backgroundColor: colors.brandBg,
  },
  typeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  typeBtnTextActive: {
    color: colors.brandText,
    fontWeight: '800',
  },
  productListContainer: {
    marginTop: 8,
    backgroundColor: colors.bgTertiary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 8,
    maxHeight: 140,
  },
  productCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  productCheckRowActive: {
    backgroundColor: colors.bgCard,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
});
