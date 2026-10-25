import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  PanResponder,
  Dimensions,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { colors, useThemeColors, radii, spacing } from '../../theme';
import { CookieProduct } from '../../lib/types';
import { useAppStore } from '../../stores/app.store';
import { Ionicons } from '@expo/vector-icons';
import { confirmAction } from '../../stores/confirmation.store';

interface CookieRecipeDetailModalProps {
  visible: boolean;
  cookie: CookieProduct | null;
  onClose: () => void;
  onSell: (cookie: CookieProduct) => void;
  onDeleteCookie?: (id: number) => Promise<void>;
  onEditCookie?: (cookie: CookieProduct) => void;
}

const TANDA_PRESETS = [1, 6, 12, 16, 20, 24, 30, 48];

type SectionView = 'all' | 'ingredients' | 'economics';

export const CookieRecipeDetailModal: React.FC<CookieRecipeDetailModalProps> = ({
  visible,
  cookie,
  onClose,
  onSell,
  onDeleteCookie,
  onEditCookie,
}) => {
  const colors = useThemeColors();
  const isDark = colors.isDark;
  const promotions = useAppStore((state) => state.promotions);
  const updateCookieProduct = useAppStore((state) => state.updateCookieProduct);
  const [activeSection, setActiveSection] = useState<SectionView>('all');
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(cookie?.image_url || null);
  const [scaledTanda, setScaledTanda] = useState<number>(12);

  const screenHeight = Dimensions.get('window').height;
  const modalHeight = Math.round(screenHeight * 0.93);
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && cookie) {
      translateY.setValue(0);
      setActiveSection('all');
      setCurrentImage(cookie.image_url || null);
      setScaledTanda(cookie.batch_yield || 12);
    }
  }, [visible, cookie]);

  const handlePickFromCamera = async () => {
    if (!cookie) return;
    setIsPhotoPickerOpen(false);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso Requerido',
          'Se necesita permiso para acceder a la cámara y tomar la foto de la galleta.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const uri = result.assets[0].uri;
        setCurrentImage(uri);
        await updateCookieProduct(cookie.id, { image_url: uri });
        Alert.alert('¡Foto Actualizada!', `Se ha asignado la nueva foto a ${cookie.name}.`);
      }
    } catch {
      Alert.alert('Error', 'No se pudo actualizar la foto.');
    }
  };

  const handlePickFromGallery = async () => {
    if (!cookie) return;
    setIsPhotoPickerOpen(false);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso Requerido',
          'Se necesita permiso para acceder a tus fotos y seleccionar la imagen.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const uri = result.assets[0].uri;
        setCurrentImage(uri);
        await updateCookieProduct(cookie.id, { image_url: uri });
        Alert.alert('¡Foto Actualizada!', `Se ha asignado la nueva foto a ${cookie.name}.`);
      }
    } catch {
      Alert.alert('Error', 'No se pudo actualizar la foto.');
    }
  };

  // PanResponder for drag-down-to-dismiss gesture on modal header & handle
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

  if (!cookie) return null;

  const batchYield = cookie.batch_yield || 16;
  const isUnitRecipe = cookie.is_unit_recipe ?? true;

  // Insumos normalizados para 1 SOLA GALLETA
  const unitIngredients = (cookie.ingredients || []).map((ing) => {
    const rawQty = typeof ing.quantity === 'number' ? ing.quantity : parseFloat(String(ing.quantity || 0));
    const rawCost = typeof ing.cost === 'number' ? ing.cost : parseFloat(String(ing.cost || 0));
    const unitQty = isUnitRecipe ? rawQty : (batchYield > 0 ? rawQty / batchYield : rawQty);
    const unitCost = isUnitRecipe ? rawCost : (batchYield > 0 ? rawCost / batchYield : rawCost);
    return {
      ...ing,
      unitQty: Math.max(0, unitQty),
      unitCost: Math.max(0, unitCost),
    };
  });

  const totalUnitIngredientsCost = unitIngredients.reduce((acc, i) => acc + i.unitCost, 0);

  const packCost = typeof cookie.packaging_cost === 'number' ? cookie.packaging_cost : 2.0;
  const ingCost = typeof cookie.cost_per_cookie === 'number'
    ? cookie.cost_per_cookie
    : (totalUnitIngredientsCost > 0 ? totalUnitIngredientsCost : Math.max(0, (cookie.recipe_cost || 6.50) - packCost));

  const unitCost = ingCost + packCost;
  const salePrice = cookie.sale_price || 0;
  const netProfit = cookie.profit_per_unit ?? (salePrice - unitCost);
  const marginPct = cookie.profit_margin_pct ?? (salePrice > 0 ? (netProfit / salePrice) * 100 : 0);
  const roiPct = unitCost > 0 ? (netProfit / unitCost) * 100 : 0;
  const batchCost = unitCost * batchYield;
  const batchRevenue = salePrice * batchYield;
  const batchProfit = netProfit * batchYield;

  // Números escalados para la tanda activa interactiva
  const activeTanda = Math.max(1, scaledTanda || 12);
  const scaledIngCost = ingCost * activeTanda;
  const scaledPackCost = packCost * activeTanda;
  const scaledTotalCost = unitCost * activeTanda;
  const scaledRevenue = salePrice * activeTanda;
  const scaledProfit = netProfit * activeTanda;

  // Filtrar promociones activas que apliquen a este producto (todo el menú o galleta específica)
  const applicablePromotions = promotions.filter((p) => {
    if (!p.is_active) return false;
    if (p.target_type === 'all_products') return true;
    if (
      p.target_type === 'specific_products' &&
      Array.isArray(p.target_product_ids) &&
      p.target_product_ids.includes(cookie.id)
    ) {
      return true;
    }
    if (p.target_type === 'category' && p.target_category && cookie.category === p.target_category) {
      return true;
    }
    return false;
  });

  // Generamos esquemas calculados dinámicamente
  const dynamicPromoSchemes = applicablePromotions.map((p) => {
    let qty = p.min_quantity || 1;
    let promoRevenue = 0;

    if (p.promo_type === 'combo_fixed_price') {
      qty = p.min_quantity || 3;
      promoRevenue = p.discount_value;
    } else if (p.promo_type === 'percentage') {
      qty = p.min_quantity || 12;
      const reg = salePrice * qty;
      promoRevenue = reg * (1 - p.discount_value / 100);
    } else if (p.promo_type === 'two_for_one') {
      qty = 2;
      promoRevenue = salePrice * 1;
    } else if (p.promo_type === 'fixed_amount') {
      qty = p.min_quantity || 3;
      promoRevenue = Math.max(0, salePrice * qty - p.discount_value);
    } else {
      qty = p.min_quantity || 1;
      promoRevenue = salePrice * qty;
    }

    const promoCost = unitCost * qty;
    const promoProfit = promoRevenue - promoCost;
    const profitPerPiece = qty > 0 ? promoProfit / qty : 0;
    const roi = promoCost > 0 ? (promoProfit / promoCost) * 100 : 0;
    const pricePerPiece = qty > 0 ? promoRevenue / qty : 0;

    // Extrapolación a lote completo
    const combosInBatch = Math.floor(batchYield / qty);
    const remainder = batchYield % qty;
    const batchRevPromo = (combosInBatch * promoRevenue) + (remainder * salePrice);
    const batchProfitPromo = batchRevPromo - batchCost;

    return {
      id: p.id,
      name: p.name,
      badge: p.badge_text || `${qty} pzas`,
      scopeLabel:
        p.target_type === 'all_products'
          ? 'Todo el Menú'
          : p.target_type === 'category'
          ? 'Categoría'
          : 'Galleta Específica',
      qty,
      promoRevenue,
      pricePerPiece,
      promoCost,
      promoProfit,
      profitPerPiece,
      roi,
      batchProfitPromo,
      combosInBatch,
      remainder,
    };
  });

  const totalIngredientsCost = unitIngredients.reduce((acc, i) => acc + i.unitCost, 0) * (isUnitRecipe ? batchYield : 1);

  const handleDeleteRecipe = () => {
    if (!onDeleteCookie) return;
    confirmAction({
      title: '¿Eliminar Receta?',
      message: `¿Deseas eliminar la receta "${cookie.name}" del catálogo?`,
      confirmText: 'Sí, Eliminar',
      type: 'danger',
      onConfirm: async () => {
        await onDeleteCookie(cookie.id);
        onClose();
      },
    });
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
              borderColor: isDark ? '#2E384D' : '#E2E8F0',
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Top Drag Handle and Header with PanResponder for Swipe Down to Dismiss */}
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
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[styles.headerEyebrow, { color: colors.amberLight }]}>
                  Estructura & Receta (1 Galleta)
                </Text>
                <Text
                  style={[styles.headerTitle, { color: isDark ? '#F1F3F7' : '#181A1F' }]}
                  numberOfLines={1}
                >
                  {cookie.name}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {onEditCookie && (
                  <TouchableOpacity
                    onPress={() => onEditCookie(cookie)}
                    style={[styles.editHeaderBtn, { backgroundColor: isDark ? '#222C3E' : '#E2E8F0' }]}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="pencil" size={13} color={colors.amberLight} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.amberLight }}>Editar</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Section View Selector */}
            <View
              style={[
                styles.sectionTabRow,
                {
                  backgroundColor: isDark ? '#151821' : '#F1F5F9',
                  borderColor: isDark ? '#262D3D' : '#E2E8F0',
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => setActiveSection('all')}
                style={[
                  styles.sectionTabBtn,
                  activeSection === 'all' && {
                    backgroundColor: colors.brand,
                    shadowColor: colors.brand,
                  },
                ]}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.sectionTabBtnText,
                    { color: activeSection === 'all' ? '#FFFFFF' : colors.textDim },
                    activeSection === 'all' && { fontWeight: '800' },
                  ]}
                >
                  Todo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveSection('ingredients')}
                style={[
                  styles.sectionTabBtn,
                  activeSection === 'ingredients' && {
                    backgroundColor: colors.brand,
                    shadowColor: colors.brand,
                  },
                ]}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.sectionTabBtnText,
                    { color: activeSection === 'ingredients' ? '#FFFFFF' : colors.textDim },
                    activeSection === 'ingredients' && { fontWeight: '800' },
                  ]}
                >
                  Insumos ({cookie.ingredients?.length || 0})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveSection('economics')}
                style={[
                  styles.sectionTabBtn,
                  activeSection === 'economics' && {
                    backgroundColor: colors.brand,
                    shadowColor: colors.brand,
                  },
                ]}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.sectionTabBtnText,
                    { color: activeSection === 'economics' ? '#FFFFFF' : colors.textDim },
                    activeSection === 'economics' && { fontWeight: '800' },
                  ]}
                >
                  Ganancia ({dynamicPromoSchemes.length + 1})
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            bounces={true}
          >
            {/* Hero Image & Overview (shown in all and economics modes) */}
            {(activeSection === 'all' || activeSection === 'economics') && (
              <View style={styles.heroRow}>
                <TouchableOpacity
                  onPress={() => setIsPhotoPickerOpen(true)}
                  activeOpacity={0.8}
                  style={{ position: 'relative' }}
                >
                  {currentImage ? (
                    <Image source={{ uri: currentImage }} style={styles.cookieImage} />
                  ) : (
                    <View style={[styles.cookieImage, { backgroundColor: isDark ? '#242936' : '#F1F5F9', alignItems: 'center', justifyContent: 'center' }]}>
                      <Ionicons name="camera" size={24} color={colors.textDim} />
                    </View>
                  )}
                  <View style={[styles.cameraBadge, { backgroundColor: colors.brand }]}>
                    <Ionicons name="camera" size={11} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.descText, { color: isDark ? '#94A3B8' : '#475569' }]}>
                    {cookie.description || 'Receta artesanal optimizada para alto margen de utilidad.'}
                  </Text>
                  <View style={styles.tagRow}>
                    <Badge label={`Tanda: ${batchYield} pzas`} variant="amber" />
                    <Badge label={`${marginPct.toFixed(2)}% Margen`} variant="emerald" />
                  </View>
                  <TouchableOpacity
                    onPress={() => setIsPhotoPickerOpen(true)}
                    style={{ marginTop: 5, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                  >
                    <Ionicons name="camera-reverse" size={12} color={colors.brandLight} />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.brandLight }}>
                      Cambiar foto (Cámara / Galería)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* UNIT ECONOMICS COMPARISON CARD (shown in all and economics modes) */}
            {(activeSection === 'all' || activeSection === 'economics') && (
              <View
                style={[
                  styles.economicsCard,
                  {
                    backgroundColor: isDark ? '#141824' : '#F8FAFC',
                    borderColor: isDark ? '#283144' : '#E2E8F0',
                  },
                ]}
              >
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: isDark ? '#F1F3F7' : '#0F172A', marginBottom: 0 }]}>
                    ESTRUCTURA EXACTA DE GANANCIA
                  </Text>
                  <Text style={[styles.sectionCountTag, { color: colors.brandLight }]}>
                    {dynamicPromoSchemes.length + 1} opciones
                  </Text>
                </View>

                {/* Esquema 1: Venta Individual ($35) */}
                <View
                  style={[
                    styles.schemeBox,
                    {
                      backgroundColor: isDark ? '#1C2230' : '#FFFFFF',
                      borderColor: isDark ? '#2E3A52' : '#E2E8F0',
                    },
                  ]}
                >
                  <View style={styles.schemeHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.schemeName, { color: isDark ? '#F1F3F7' : '#0F172A' }]}>
                        1. Venta Individual
                      </Text>
                      <Text style={[styles.schemeSubTitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                        Precio estándar por pieza suelta
                      </Text>
                    </View>
                    <Text style={[styles.schemePrice, { color: isDark ? '#F1F3F7' : '#0F172A' }]}>
                      ${salePrice.toFixed(2)} MXN
                    </Text>
                  </View>
                  <View style={styles.schemeMetricRow}>
                    <Text style={[styles.schemeKey, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                      Costo Unitario (Insumo + Empaque):
                    </Text>
                    <Text style={styles.schemeValRed}>-${unitCost.toFixed(2)} MXN (${ingCost.toFixed(2)} + ${packCost.toFixed(2)})</Text>
                  </View>
                  <View style={styles.schemeMetricRow}>
                    <Text style={[styles.schemeKeyBold, { color: isDark ? '#F1F3F7' : '#0F172A' }]}>
                      Ganancia Neta Libre por Pieza:
                    </Text>
                    <Text style={styles.schemeValGreen}>+${netProfit.toFixed(2)} MXN ({marginPct.toFixed(1)}%)</Text>
                  </View>
                  <View style={styles.schemeMetricRow}>
                    <Text style={[styles.schemeKeyBold, { color: colors.amberLight }]}>
                      Meta Ganancia Lote ({batchYield} pzas):
                    </Text>
                    <Text style={[styles.schemeValGreen, { color: colors.emeraldLight, fontWeight: '900' }]}>
                      +${batchProfit.toFixed(2)} MXN
                    </Text>
                  </View>
                  <View style={styles.schemeMetricRow}>
                    <Text style={[styles.schemeKey, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                      Rendimiento sobre costo (ROI):
                    </Text>
                    <Text style={styles.schemeValGold}>~{roiPct.toFixed(1)}% ROI</Text>
                  </View>
                </View>

                {/* Esquemas Dinámicos de Promociones Aplicables */}
                {dynamicPromoSchemes.length > 0 ? (
                  dynamicPromoSchemes.map((scheme, idx) => (
                    <View
                      key={scheme.id || idx}
                      style={[
                        styles.schemeBox,
                        {
                          marginTop: 10,
                          backgroundColor: isDark ? '#1C2230' : '#FFFFFF',
                          borderColor: isDark ? '#2E3A52' : '#E2E8F0',
                        },
                      ]}
                    >
                      <View style={styles.schemeHeader}>
                        <View style={{ flex: 1, paddingRight: 6 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <Text style={[styles.schemeName, { color: isDark ? '#F1F3F7' : '#0F172A' }]}>
                              {idx + 2}. {scheme.name}
                            </Text>
                            <View
                              style={[
                                styles.scopeTag,
                                {
                                  backgroundColor: isDark ? 'rgba(56,189,248,0.15)' : '#E0F2FE',
                                  borderColor: isDark ? 'rgba(56,189,248,0.3)' : '#BAE6FD',
                                },
                              ]}
                            >
                              <Text style={[styles.scopeTagText, { color: colors.brandLight }]}>
                                {scheme.scopeLabel}
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.schemeSubTitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                            ${scheme.pricePerPiece.toFixed(2)} c/u ({scheme.qty} pzas en promo)
                          </Text>
                        </View>
                        <Text style={[styles.schemePrice, { color: colors.emeraldLight }]}>
                          ${scheme.promoRevenue.toFixed(2)} MXN
                        </Text>
                      </View>

                      <View style={styles.schemeMetricRow}>
                        <Text style={[styles.schemeKey, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                          Costo Combo {scheme.qty} piezas (${unitCost.toFixed(2)} x {scheme.qty}):
                        </Text>
                        <Text style={styles.schemeValRed}>-${scheme.promoCost.toFixed(2)} MXN</Text>
                      </View>

                      <View style={styles.schemeMetricRow}>
                        <Text style={[styles.schemeKeyBold, { color: isDark ? '#F1F3F7' : '#0F172A' }]}>
                          Ganancia Neta Libre del Paquete:
                        </Text>
                        <Text style={styles.schemeValGreen}>+${scheme.promoProfit.toFixed(2)} MXN</Text>
                      </View>

                      <View style={styles.schemeMetricRow}>
                        <Text style={[styles.schemeKeyBold, { color: colors.purpleLight }]}>
                          Meta Lote con Promo ({batchYield} pzas):
                        </Text>
                        <Text style={[styles.schemeValGreen, { color: colors.purpleLight, fontWeight: '800' }]}>
                          +${scheme.batchProfitPromo.toFixed(2)} MXN
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={[styles.schemeBox, { marginTop: 10, backgroundColor: isDark ? '#1C2230' : '#FFFFFF', borderColor: isDark ? '#2E3A52' : '#E2E8F0', padding: 12 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="pricetag-outline" size={15} color={colors.textDim} />
                      <Text style={{ fontSize: 12.5, fontWeight: '700', color: colors.textDim }}>
                        Sin Promociones Activas
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4, lineHeight: 15 }}>
                      Esta galleta se vende con margen individual estándar (+${netProfit.toFixed(2)} MXN/pza). Puedes crear promociones en la pestaña 'Promos'.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* INGREDIENTS BREAKDOWN LIST CON ESCALADOR DE TANDAS */}
            {(activeSection === 'all' || activeSection === 'ingredients') && unitIngredients.length > 0 && (
              <View
                style={[
                  styles.ingredientsCard,
                  {
                    backgroundColor: isDark ? '#141824' : '#F8FAFC',
                    borderColor: isDark ? '#283144' : '#E2E8F0',
                  },
                ]}
              >
                <View style={styles.ingHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#F1F3F7' : '#0F172A', marginBottom: 2 }]}>
                      INSUMOS DE LA RECETA ({unitIngredients.length})
                    </Text>
                    <Text style={[styles.ingSubTitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                      {activeTanda === 1 ? 'Pesos base para 1 sola galleta' : `Cantidades pesadas para tanda de ${activeTanda} galletas`}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.ingTotalText, { color: colors.amberLight }]}>
                      Total Insumos: ${scaledIngCost.toFixed(2)}
                    </Text>
                    <Text style={[styles.ingUnitText, { color: colors.textDim }]}>
                      ${ingCost.toFixed(2)} x galleta
                    </Text>
                  </View>
                </View>

                {/* ESCALADOR DE TANDA INTERACTIVO EN TIEMPO REAL */}
                <View style={[styles.tandaSelectorCard, { backgroundColor: isDark ? '#1A2130' : '#FFFFFF', borderColor: isDark ? '#2A364E' : '#E2E8F0' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="calculator-outline" size={15} color={colors.amberLight} />
                      <Text style={{ fontSize: 12, fontWeight: '800', color: isDark ? '#F1F3F7' : '#0F172A' }}>
                        Escalar tanda simultáneamente:
                      </Text>
                    </View>
                    <Badge
                      label={`${activeTanda} ${activeTanda === 1 ? 'galleta' : 'piezas'}`}
                      variant={activeTanda === 1 ? 'gray' : 'amber'}
                    />
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 2 }}>
                    {TANDA_PRESETS.map((pza) => {
                      const isSelected = activeTanda === pza;
                      return (
                        <TouchableOpacity
                          key={pza}
                          onPress={() => setScaledTanda(pza)}
                          style={[
                            styles.tandaChip,
                            {
                              backgroundColor: isSelected ? colors.brand : (isDark ? '#242C3D' : '#F1F5F9'),
                              borderColor: isSelected ? colors.brand : (isDark ? '#35415B' : '#CBD5E1'),
                            },
                          ]}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.tandaChipText,
                              {
                                color: isSelected ? '#FFFFFF' : (isDark ? '#94A3B8' : '#475569'),
                                fontWeight: isSelected ? '800' : '600',
                              },
                            ]}
                          >
                            {pza === 1 ? '1 Galleta' : `${pza} pzas`}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* LISTA DE INGREDIENTES ESCALADOS */}
                <View style={styles.ingList}>
                  {unitIngredients.map((ing, idx) => {
                    const scaledQty = Number((ing.unitQty * activeTanda).toFixed(2));
                    const scaledCost = Number((ing.unitCost * activeTanda).toFixed(2));
                    const costSharePct = scaledIngCost > 0 ? (scaledCost / scaledIngCost) * 100 : 0;

                    return (
                      <View
                        key={idx}
                        style={[
                          styles.ingRow,
                          idx === unitIngredients.length - 1 && { borderBottomWidth: 0 },
                        ]}
                      >
                        <View
                          style={[
                            styles.ingBadge,
                            { backgroundColor: isDark ? '#242B3B' : '#E2E8F0' },
                          ]}
                        >
                          <Text style={[styles.ingBadgeText, { color: isDark ? '#94A3B8' : '#475569' }]}>
                            {idx + 1}
                          </Text>
                        </View>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={[styles.ingName, { color: isDark ? '#F1F3F7' : '#0F172A' }]}>
                            {ing.name}
                          </Text>
                          <Text style={[styles.ingSub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                            {scaledQty} {ing.unit} {activeTanda > 1 ? `(${ing.unitQty} ${ing.unit} x pza)` : 'para 1 galleta'} • {costSharePct.toFixed(1)}% costo
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={[styles.ingCost, { color: isDark ? '#F1F3F7' : '#0F172A' }]}>
                            ${scaledCost.toFixed(2)}
                          </Text>
                          {activeTanda > 1 && (
                            <Text style={{ fontSize: 10, color: colors.textDim }}>
                              ~${ing.unitCost.toFixed(2)}/pza
                            </Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* RESUMEN FINANCIERO DE LA TANDA ESCALADA */}
                <View style={[styles.ingFooterBox, { backgroundColor: isDark ? '#1C2230' : '#FFFFFF', borderColor: isDark ? '#2E3A52' : '#E2E8F0' }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 11, color: isDark ? '#94A3B8' : '#64748B' }}>
                      Insumos ({activeTanda} {activeTanda === 1 ? 'galleta' : 'galletas'}):
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#F1F3F7' : '#0F172A' }}>
                      ${scaledIngCost.toFixed(2)} MXN
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 11, color: isDark ? '#94A3B8' : '#64748B' }}>
                      Empaque ({activeTanda} piezas a ${packCost.toFixed(2)} c/u):
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#F1F3F7' : '#0F172A' }}>
                      ${scaledPackCost.toFixed(2)} MXN
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 11, color: isDark ? '#94A3B8' : '#64748B' }}>
                      Inversión Total de Tanda:
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.roseLight }}>
                      ${scaledTotalCost.toFixed(2)} MXN
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 11, color: isDark ? '#94A3B8' : '#64748B' }}>
                      Venta Total Proyectada:
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.amberLight }}>
                      ${scaledRevenue.toFixed(2)} MXN
                    </Text>
                  </View>
                  <View style={{ height: 1, backgroundColor: isDark ? '#283144' : '#E2E8F0', marginVertical: 4 }} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: colors.emeraldLight }}>
                      Ganancia Neta Libre de Tanda:
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: '900', color: colors.emeraldLight }}>
                      +${scaledProfit.toFixed(2)} MXN ({marginPct.toFixed(1)}%)
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Delete Recipe Button if onDeleteCookie is provided */}
            {onDeleteCookie && (
              <TouchableOpacity
                onPress={handleDeleteRecipe}
                style={[
                  styles.deleteBtn,
                  {
                    backgroundColor: isDark ? 'rgba(244, 63, 94, 0.12)' : '#FFE4E6',
                    borderColor: isDark ? 'rgba(244, 63, 94, 0.3)' : '#FECDD3',
                  },
                ]}
              >
                <Ionicons name="trash-outline" size={16} color={colors.roseLight} />
                <Text style={[styles.deleteBtnText, { color: colors.roseLight }]}>
                  Eliminar Receta del Catálogo
                </Text>
              </TouchableOpacity>
            )}

            {/* Action Bar */}
            <View style={styles.actionRow}>
              <Button
                title="Cerrar"
                variant="secondary"
                onPress={onClose}
                style={{ flex: 1 }}
              />
              <Button
                title="Registrar Venta"
                variant="amber"
                icon={<Ionicons name="cart" size={17} color="#fff" />}
                onPress={() => {
                  onClose();
                  onSell(cookie);
                }}
                style={{ flex: 2 }}
              />
            </View>
          </ScrollView>
        </Animated.View>
      </View>

      {/* Modal Selector: Cámara o Galería */}
      <Modal
        visible={isPhotoPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPhotoPickerOpen(false)}
      >
        <TouchableOpacity
          style={styles.pickerBackdrop}
          activeOpacity={1}
          onPress={() => setIsPhotoPickerOpen(false)}
        >
          <View
            style={[
              styles.pickerSheet,
              {
                backgroundColor: isDark ? '#1C202A' : '#FFFFFF',
                borderColor: isDark ? '#2E384D' : '#E2E8F0',
              },
            ]}
          >
            <View style={styles.dragHandleContainer}>
              <View
                style={[
                  styles.dragHandleBar,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.18)' },
                ]}
              />
            </View>

            <Text style={[styles.pickerTitle, { color: isDark ? '#F1F3F7' : '#181A1F' }]}>
              Foto de la Receta
            </Text>
            <Text style={[styles.pickerSubtitle, { color: colors.textDim }]}>
              ¿Desde dónde deseas actualizar la foto de {cookie.name}?
            </Text>

            <TouchableOpacity
              style={[
                styles.pickerOptionBtn,
                {
                  backgroundColor: isDark ? '#242936' : '#F8F9FA',
                  borderColor: isDark ? '#2E384D' : '#E5E7EB',
                },
              ]}
              onPress={handlePickFromCamera}
              activeOpacity={0.8}
            >
              <View style={[styles.pickerIconWrap, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5' }]}>
                <Ionicons name="camera" size={24} color={colors.emeraldLight} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.pickerOptionTitle, { color: isDark ? '#F1F3F7' : '#181A1F' }]}>
                  Tomar Foto con la Cámara
                </Text>
                <Text style={[styles.pickerOptionSub, { color: colors.textDim }]}>
                  Abre la cámara para capturar la galleta al instante
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.pickerOptionBtn,
                {
                  backgroundColor: isDark ? '#242936' : '#F8F9FA',
                  borderColor: isDark ? '#2E384D' : '#E5E7EB',
                  marginTop: 10,
                },
              ]}
              onPress={handlePickFromGallery}
              activeOpacity={0.8}
            >
              <View style={[styles.pickerIconWrap, { backgroundColor: isDark ? 'rgba(14, 165, 233, 0.15)' : '#E0F2FE' }]}>
                <Ionicons name="images" size={24} color={colors.brandLight} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.pickerOptionTitle, { color: isDark ? '#F1F3F7' : '#181A1F' }]}>
                  Seleccionar de la Galería
                </Text>
                <Text style={[styles.pickerOptionSub, { color: colors.textDim }]}>
                  Elige una foto guardada en tu teléfono
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.pickerCancelBtn,
                {
                  backgroundColor: isDark ? '#242936' : '#F1F5F9',
                  borderColor: isDark ? '#2E384D' : '#E2E8F0',
                },
              ]}
              onPress={() => setIsPhotoPickerOpen(false)}
            >
              <Text style={[styles.pickerCancelText, { color: colors.textMuted }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  dialog: {
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius: radii.outer,
    borderTopRightRadius: radii.outer,
    borderWidth: 1,
    borderColor: colors.borderHighlight,
    overflow: 'hidden',
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  dragHandleBar: {
    width: 42,
    height: 4.5,
    borderRadius: 3,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.amberLight,
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
  editHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.sm,
  },
  sectionTabRow: {
    flexDirection: 'row',
    padding: 3,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  sectionTabBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
  },
  sectionTabBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  body: {
    padding: 16,
    paddingBottom: 110,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  cookieImage: {
    width: 68,
    height: 68,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  descText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  economicsCard: {
    backgroundColor: colors.bgTertiary,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 14,
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textDim,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionCountTag: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  schemeBox: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  schemeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    paddingBottom: 6,
    marginBottom: 8,
  },
  schemeName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textMain,
  },
  schemeSubTitle: {
    fontSize: 10,
    marginTop: 2,
  },
  scopeTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
  },
  scopeTagText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  schemePrice: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.amberLight,
  },
  schemeMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  schemeKey: {
    fontSize: 11,
    color: colors.textDim,
  },
  schemeKeyBold: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMain,
  },
  schemeValRed: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.rose,
  },
  schemeValGreen: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.emeraldLight,
  },
  schemeValGold: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.amberLight,
  },
  ingredientsCard: {
    backgroundColor: colors.bgTertiary,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 14,
    marginBottom: 16,
  },
  ingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ingSubTitle: {
    fontSize: 10,
    marginTop: 2,
  },
  ingTotalText: {
    fontSize: 12,
    fontWeight: '800',
  },
  ingUnitText: {
    fontSize: 10,
    marginTop: 1,
  },
  tandaSelectorCard: {
    marginVertical: 10,
    padding: 10,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  tandaChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  tandaChipText: {
    fontSize: 11,
  },
  ingList: {
    gap: 8,
  },
  ingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  ingBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  ingBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  ingName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMain,
  },
  ingSub: {
    fontSize: 10,
    color: colors.textDim,
    marginTop: 1,
  },
  ingCost: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.amberLight,
  },
  ingFooterBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  ingFooterText: {
    fontSize: 11,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    marginBottom: 20,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 10,
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    borderTopLeftRadius: radii.outer,
    borderTopRightRadius: radii.outer,
    borderWidth: 1,
    padding: 18,
    paddingBottom: 28,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 6,
  },
  pickerSubtitle: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 16,
  },
  pickerOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: 12,
  },
  pickerIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerOptionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  pickerOptionSub: {
    fontSize: 11,
    marginTop: 2,
  },
  pickerCancelBtn: {
    paddingVertical: 12,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: 14,
  },
  pickerCancelText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
