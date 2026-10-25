import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  PanResponder,
  Dimensions,
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
  promotionToEdit?: Promotion | null;
  onUpdatePromotion?: (id: number, data: Partial<Promotion>) => Promise<Promotion>;
}

export const AddPromotionModal: React.FC<AddPromotionModalProps> = ({
  visible,
  onClose,
  cookies,
  onAddPromotion,
  promotionToEdit,
  onUpdatePromotion,
}) => {
  const colors = useThemeColors();
  const isDark = colors.isDark;

  const screenHeight = Dimensions.get('window').height;
  const translateY = useRef(new Animated.Value(0)).current;

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
    if (visible) {
      translateY.setValue(0);
    }
  }, [visible]);
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

  useEffect(() => {
    if (promotionToEdit) {
      setName(promotionToEdit.name || '');
      setDescription(promotionToEdit.description || '');
      setPromoType(promotionToEdit.promo_type || 'combo_fixed_price');
      setDiscountValue(String(promotionToEdit.discount_value ?? 90));
      setTargetType(promotionToEdit.target_type || 'all_products');
      setSelectedProductIds(promotionToEdit.target_product_ids || []);
      setMinQuantity(String(promotionToEdit.min_quantity ?? 3));
      setMinOrderAmount(String(promotionToEdit.min_order_amount ?? 0));
      setBadgeText(promotionToEdit.badge_text || 'PROMO');
      setColorTag(promotionToEdit.color_tag || '#F59E0B');
    } else {
      setName('');
      setDescription('');
      setPromoType('combo_fixed_price');
      setDiscountValue('90');
      setTargetType('all_products');
      setSelectedProductIds([]);
      setMinQuantity('3');
      setMinOrderAmount('0');
      setBadgeText('3 x $90');
      setColorTag('#F59E0B');
    }
  }, [promotionToEdit, visible]);

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
      const payload: Partial<Promotion> = {
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
        is_active: promotionToEdit ? promotionToEdit.is_active : true,
      };

      if (promotionToEdit && onUpdatePromotion) {
        await onUpdatePromotion(promotionToEdit.id, payload);
      } else {
        await onAddPromotion(payload);
      }
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No fue posible guardar la promoción.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.dialog,
            {
              backgroundColor: isDark ? '#1C202A' : '#FFFFFF',
              borderColor: isDark ? '#2E384D' : '#E2E8F0',
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Top Drag Handle & Header with panResponder */}
          <View {...panResponder.panHandlers}>
            <View style={styles.dragHandleContainer}>
              <View
                style={[
                  styles.dragHandleBar,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.18)' },
                ]}
              />
            </View>

            <View style={[styles.header, { borderBottomColor: isDark ? '#2A303C' : '#E5E7EB' }]}>
              <View>
                <Text style={[styles.eyebrow, { color: colors.amberLight }]}>Marketing & Ventas</Text>
                <Text style={[styles.title, { color: isDark ? '#F1F3F7' : '#181A1F' }]}>
                  {promotionToEdit ? 'Editar Promoción / Oferta' : 'Nueva Promoción / Oferta'}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
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
                {[
                  { key: 'combo_fixed_price' as PromoType, label: 'Combo $', icon: 'gift-outline' as const },
                  { key: 'percentage' as PromoType, label: 'Desc. %', icon: 'pricetag-outline' as const },
                  { key: 'fixed_amount' as PromoType, label: 'Fijo $', icon: 'cash-outline' as const },
                  { key: 'two_for_one' as PromoType, label: '2x1', icon: 'flame-outline' as const },
                ].map((item) => {
                  const isActive = promoType === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.typeBtn,
                        {
                          backgroundColor: isActive
                            ? (isDark ? 'rgba(14, 165, 233, 0.18)' : '#E0F2FE')
                            : (isDark ? '#242936' : '#F1F3F7'),
                          borderColor: isActive
                            ? colors.brand
                            : (isDark ? '#2A303C' : '#E5E7EB'),
                        },
                      ]}
                      onPress={() => handleTypeSelect(item.key)}
                    >
                      <Ionicons
                        name={item.icon}
                        size={18}
                        color={isActive ? colors.brand : (isDark ? '#64748B' : '#94A3B8')}
                      />
                      <Text
                        style={[
                          styles.typeBtnText,
                          {
                            color: isActive
                              ? (isDark ? '#38BDF8' : '#0284C7')
                              : (isDark ? '#94A3B8' : '#64748B'),
                            fontWeight: isActive ? '800' : '600',
                          },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Valores numéricos */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: isDark ? '#9BA3AF' : '#5E6472' }]}>
                  {promoType === 'combo_fixed_price' ? 'Precio Combo ($)' : promoType === 'percentage' ? '% Descuento' : 'Monto ($)'}
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
                  value={discountValue}
                  onChangeText={setDiscountValue}
                  editable={promoType !== 'two_for_one'}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: isDark ? '#9BA3AF' : '#5E6472' }]}>Piezas Mínimas</Text>
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
                  value={minQuantity}
                  onChangeText={setMinQuantity}
                />
              </View>
            </View>

            {/* Alcance: Todo el Menú vs Específicas vs Total */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: isDark ? '#9BA3AF' : '#5E6472' }]}>¿A qué productos aplica?</Text>
              <View style={styles.typeRow}>
                {[
                  { key: 'all_products' as PromoScope, label: 'Todo el Menú' },
                  { key: 'specific_products' as PromoScope, label: 'Galletas Específicas' },
                  { key: 'order_total' as PromoScope, label: 'Total del Pedido' },
                ].map((item) => {
                  const isActive = targetType === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.typeBtn,
                        {
                          backgroundColor: isActive
                            ? (isDark ? 'rgba(14, 165, 233, 0.18)' : '#E0F2FE')
                            : (isDark ? '#242936' : '#F1F3F7'),
                          borderColor: isActive
                            ? colors.brand
                            : (isDark ? '#2A303C' : '#E5E7EB'),
                        },
                      ]}
                      onPress={() => setTargetType(item.key)}
                    >
                      <Text
                        style={[
                          styles.typeBtnText,
                          {
                            color: isActive
                              ? (isDark ? '#38BDF8' : '#0284C7')
                              : (isDark ? '#94A3B8' : '#64748B'),
                            fontWeight: isActive ? '800' : '600',
                          },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {targetType === 'specific_products' && (
                <View
                  style={[
                    styles.productListContainer,
                    {
                      backgroundColor: isDark ? '#1E2430' : '#F1F5F9',
                      borderColor: isDark ? '#2A303C' : '#E2E8F0',
                    },
                  ]}
                >
                  {cookies.map((c) => {
                    const isChecked = selectedProductIds.includes(c.id);
                    return (
                      <TouchableOpacity
                        key={c.id}
                        style={[
                          styles.productCheckRow,
                          isChecked && {
                            backgroundColor: isDark ? '#272E3D' : '#FFFFFF',
                          },
                        ]}
                        onPress={() => handleToggleProduct(c.id)}
                      >
                        <Ionicons
                          name={isChecked ? 'checkbox' : 'square-outline'}
                          size={18}
                          color={isChecked ? colors.brand : (isDark ? '#64748B' : '#94A3B8')}
                        />
                        <Text style={{ fontSize: 13, color: isDark ? '#F1F3F7' : '#0F172A', flex: 1, marginLeft: 6 }}>
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
              <Text style={[styles.label, { color: isDark ? '#9BA3AF' : '#5E6472' }]}>Color del Distintivo</Text>
              <View style={{ flexDirection: 'row', gap: 14, marginTop: 6, alignItems: 'center' }}>
                {['#F59E0B', '#EC4899', '#10B981', '#8B5CF6', '#3B82F6'].map((hex) => {
                  const isSelected = colorTag === hex;
                  return (
                    <TouchableOpacity
                      key={hex}
                      onPress={() => setColorTag(hex)}
                      activeOpacity={0.8}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        backgroundColor: hex,
                        borderWidth: isSelected ? 3 : 0,
                        borderColor: isDark ? '#FFFFFF' : '#0F172A',
                        shadowColor: hex,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: isSelected ? 0.45 : 0,
                        shadowRadius: 4,
                        elevation: isSelected ? 4 : 0,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  );
                })}
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
              title={isSubmitting ? 'Guardando...' : (promotionToEdit ? 'Guardar Cambios' : 'Crear Promoción')}
              variant="primary"
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={{ flex: 1 }}
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
  dragHandleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dragHandleBar: {
    width: 38,
    height: 4.5,
    borderRadius: 3,
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
