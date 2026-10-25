import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  Dimensions,
  Animated,
  PanResponder,
  FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { colors, useThemeColors, radii, spacing } from '../../theme';
import { CookieProduct, RecipeIngredientItem, Ingredient, Promotion } from '../../lib/types';
import { useAppStore } from '../../stores/app.store';
import { Ionicons } from '@expo/vector-icons';

export interface CookieModalProps {
  visible: boolean;
  cookie?: CookieProduct | null;
  onClose: () => void;
  onSave?: (data: Partial<CookieProduct>) => Promise<any>;
  onUpdate?: (id: number, data: Partial<CookieProduct>) => Promise<any>;
  // Legacy compatibility props
  onAddCookie?: (data: Partial<CookieProduct>) => Promise<any>;
  onUpdateCookie?: (id: number, data: Partial<CookieProduct>) => Promise<any>;
}

const DEFAULT_RECIPE_INGREDIENTS: RecipeIngredientItem[] = [
  { name: 'Masa Base & Mantequilla', quantity: 200, unit: 'g', cost: 4.80 },
  { name: 'Chispas de Chocolate', quantity: 150, unit: 'g', cost: 2.90 },
  { name: 'Empaque Individual Kraft', quantity: 1, unit: 'pza', cost: 2.00 },
];

const PRESET_IMAGE_URL = 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500&auto=format&fit=crop&q=60';
const YIELD_PRESETS = [12, 16, 20, 24, 30];

export const CookieModal: React.FC<CookieModalProps> = ({
  visible,
  cookie,
  onClose,
  onSave,
  onUpdate,
  onAddCookie,
  onUpdateCookie,
}) => {
  const colors = useThemeColors();
  const isDark = colors.isDark;
  const isEditing = !!cookie;

  const promotions = useAppStore((state) => state.promotions);
  const registeredIngredients = useAppStore((state) => state.ingredients);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [batchYield, setBatchYield] = useState('16');
  const [ingredientCost, setIngredientCost] = useState('6.50');
  const [packagingCost, setPackagingCost] = useState('2.00');
  const [salePrice, setSalePrice] = useState('35.00');
  const [targetBatchProfit, setTargetBatchProfit] = useState('424.00');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<RecipeIngredientItem[]>([]);
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false);
  const [isIngredientPickerOpen, setIsIngredientPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'economics' | 'promos' | 'ingredients' | 'info'>('economics');

  const screenHeight = Dimensions.get('window').height;
  const modalHeight = Math.round(screenHeight * 0.93);
  const translateY = useRef(new Animated.Value(0)).current;

  // Swipe-down to close panResponder
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

  // Initial populate when opening
  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
      if (cookie) {
        setName(cookie.name || '');
        setDescription(cookie.description || '');
        const yieldVal = cookie.batch_yield || 16;
        setBatchYield(String(yieldVal));

        const totalCost = cookie.recipe_cost || 8.50;
        const packCost = typeof cookie.packaging_cost === 'number' ? cookie.packaging_cost : 2.00;
        const rawCost = typeof cookie.cost_per_cookie === 'number'
          ? cookie.cost_per_cookie
          : Math.max(0.5, totalCost - packCost);

        setIngredientCost(rawCost.toFixed(2));
        setPackagingCost(packCost.toFixed(2));
        const price = cookie.sale_price ? cookie.sale_price : 35.00;
        setSalePrice(price.toFixed(2));

        const profitPerCookie = Math.max(0, price - totalCost);
        const batchProf = profitPerCookie * yieldVal;
        setTargetBatchProfit(batchProf.toFixed(2));

        setImageUri(cookie.image_url || null);
        setIngredients(cookie.ingredients ? [...cookie.ingredients] : []);
        setActiveTab('economics');
      } else {
        setName('');
        setDescription('');
        setBatchYield('16');
        setIngredientCost('6.50');
        setPackagingCost('2.00');
        setSalePrice('35.00');
        setTargetBatchProfit('424.00');
        setImageUri(null);
        setIngredients([...DEFAULT_RECIPE_INGREDIENTS]);
        setActiveTab('economics');
      }
    }
  }, [visible, cookie]);

  // Numeric derivations
  const yieldNum = Math.max(1, parseInt(batchYield) || 1);
  const ingCostNum = Math.max(0, parseFloat(ingredientCost) || 0);
  const packCostNum = Math.max(0, parseFloat(packagingCost) || 0);
  const unitCostTotal = ingCostNum + packCostNum;
  const priceNum = Math.max(0, parseFloat(salePrice) || 0);
  const profitPerCookie = priceNum - unitCostTotal;
  const marginPct = priceNum > 0 ? (profitPerCookie / priceNum) * 100 : 0;
  const totalBatchCost = unitCostTotal * yieldNum;
  const totalBatchRevenue = priceNum * yieldNum;
  const calcBatchProfit = profitPerCookie * yieldNum;

  // Live Bidirectional Handlers
  const handleBatchYieldChange = (text: string) => {
    setBatchYield(text);
    const y = Math.max(1, parseInt(text) || 1);
    const prof = (priceNum - unitCostTotal) * y;
    setTargetBatchProfit(prof.toFixed(2));
  };

  const handleSetPresetYield = (preset: number) => {
    setBatchYield(String(preset));
    const prof = (priceNum - unitCostTotal) * preset;
    setTargetBatchProfit(prof.toFixed(2));
  };

  const handleIngredientCostChange = (text: string) => {
    setIngredientCost(text);
    const ing = parseFloat(text) || 0;
    const c = ing + packCostNum;
    const prof = (priceNum - c) * yieldNum;
    setTargetBatchProfit(prof.toFixed(2));
  };

  const handlePackagingCostChange = (text: string) => {
    setPackagingCost(text);
    const pack = parseFloat(text) || 0;
    const c = ingCostNum + pack;
    const prof = (priceNum - c) * yieldNum;
    setTargetBatchProfit(prof.toFixed(2));
  };

  const handleSalePriceChange = (text: string) => {
    setSalePrice(text);
    const p = parseFloat(text) || 0;
    const prof = (p - unitCostTotal) * yieldNum;
    setTargetBatchProfit(prof.toFixed(2));
  };

  const handleTargetBatchProfitChange = (text: string) => {
    setTargetBatchProfit(text);
    const profitVal = parseFloat(text);
    if (!isNaN(profitVal) && profitVal >= 0 && yieldNum > 0) {
      const neededProfitPerCookie = profitVal / yieldNum;
      const suggestedPrice = unitCostTotal + neededProfitPerCookie;
      setSalePrice(suggestedPrice.toFixed(2));
    }
  };

  // Image pickers
  const handlePickFromCamera = async () => {
    setIsPhotoPickerOpen(false);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso Requerido', 'Se necesita acceso a la cámara para tomar la foto.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setImageUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'No se pudo abrir la cámara.');
    }
  };

  const handlePickFromGallery = async () => {
    setIsPhotoPickerOpen(false);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso Requerido', 'Se necesita acceso a la galería para elegir la foto.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setImageUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'No se pudo acceder a la galería.');
    }
  };

  // Ingredients helpers
  const handleAddIngredientFromCatalog = (ing: Ingredient) => {
    const defaultQty = ing.unit === 'g' || ing.unit === 'ml' ? 100 : 1;
    const itemCost = Number((defaultQty * (ing.cost_per_unit || 0)).toFixed(2));
    setIngredients((prev) => [
      ...prev,
      {
        name: ing.name,
        quantity: defaultQty,
        unit: ing.unit,
        cost: itemCost > 0 ? itemCost : 2.50,
      },
    ]);
    setIsIngredientPickerOpen(false);
  };

  const handleAddCustomIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      {
        name: 'Insumo Personalizado',
        quantity: 1,
        unit: 'pza',
        cost: 2.50,
      },
    ]);
  };

  const handleUpdateIngredient = (idx: number, field: keyof RecipeIngredientItem, val: any) => {
    setIngredients((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      return updated;
    });
  };

  const handleRemoveIngredient = (idx: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSumIngredientsToRecipeCost = () => {
    if (ingredients.length === 0) return;
    const totalIngredientsCost = ingredients.reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0);
    const perCookieIngCost = totalIngredientsCost / yieldNum;
    setIngredientCost(perCookieIngCost.toFixed(2));
    const c = perCookieIngCost + packCostNum;
    const prof = (priceNum - c) * yieldNum;
    setTargetBatchProfit(prof.toFixed(2));
    Alert.alert(
      '¡Costos Actualizados!',
      `Costo total lote: $${totalIngredientsCost.toFixed(2)} MXN\nCosto insumo por pieza (${yieldNum} pzas): $${perCookieIngCost.toFixed(2)} MXN`
    );
  };

  // Active promotions simulation for this cookie
  const activePromos = promotions.filter((p) => {
    if (!p.is_active) return false;
    if (p.target_type === 'all_products') return true;
    if (p.target_type === 'specific_products' && cookie && (p.target_product_ids || []).includes(cookie.id)) return true;
    if (p.target_type === 'category' && p.target_category && cookie?.category === p.target_category) return true;
    return false;
  });

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Nombre Obligatorio', 'La galleta debe tener un nombre.');
      return;
    }
    if (priceNum <= 0) {
      Alert.alert('Precio Inválido', 'El precio de venta debe ser mayor a 0.');
      return;
    }

    try {
      setIsSaving(true);
      const payload: Partial<CookieProduct> = {
        name: name.trim(),
        description: description.trim(),
        sale_price: priceNum,
        batch_yield: yieldNum,
        packaging_cost: packCostNum,
        cost_per_cookie: ingCostNum,
        recipe_cost: unitCostTotal,
        profit_per_unit: profitPerCookie,
        profit_margin_pct: marginPct,
        image_url: imageUri || (cookie?.image_url || PRESET_IMAGE_URL),
        ingredients: ingredients.filter((i) => i.name.trim().length > 0),
      };

      if (cookie && (onUpdate || onUpdateCookie)) {
        const updater = onUpdate || onUpdateCookie!;
        await updater(cookie.id, payload);
        Alert.alert('¡Receta Guardada!', `Se actualizaron los costos, tanda y ganancia de ${name}.`);
      } else if (onSave || onAddCookie) {
        const saver = onSave || onAddCookie!;
        await saver(payload);
        Alert.alert('¡Galleta Creada!', `"${name}" ha sido agregada exitosamente.`);
      }

      onClose();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo guardar la receta.');
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
              borderColor: isDark ? '#2E384D' : '#E2E8F0',
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Drag Handle Bar for Swipe-Down to Dismiss */}
          <View {...panResponder.panHandlers}>
            <View style={styles.dragHandleContainer}>
              <View
                style={[
                  styles.dragHandleBar,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.18)' },
                ]}
              />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[styles.title, { color: colors.textMain }]} numberOfLines={1}>
                  {isEditing ? `Editar ${name || 'Galleta'}` : 'Nueva Receta de Galleta'}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  {isEditing ? 'Tanda, insumo, empaque, precio y ganancia libre' : 'Configura tanda, costos y precio de venta'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.closeCircle, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
              >
                <Ionicons name="close" size={20} color={colors.textMain} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Subtabs switcher */}
          <View style={[styles.tabsRow, { borderBottomColor: colors.borderSubtle }]}>
            {[
              { id: 'economics', label: 'Tanda & Costos', icon: 'calculator' },
              { id: 'promos', label: `Promos (${activePromos.length})`, icon: 'pricetag' },
              { id: 'ingredients', label: `Insumos (${ingredients.length})`, icon: 'nutrition' },
              { id: 'info', label: 'Detalles & Foto', icon: 'image' },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id as any)}
                  style={[
                    styles.tabBtn,
                    active && { borderBottomColor: colors.amberLight, borderBottomWidth: 2 },
                  ]}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={14}
                    color={active ? colors.amberLight : colors.textDim}
                  />
                  <Text
                    style={[
                      styles.tabBtnText,
                      { color: active ? colors.textMain : colors.textDim },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            {/* TAB 1: ECONOMICS & BATCH CONFIGURATION */}
            {activeTab === 'economics' && (
              <View>
                {/* Visual Unit Economics Live Summary Box */}
                <View style={[styles.liveSummaryBox, { backgroundColor: isDark ? '#161B26' : '#F1F5F9', borderColor: colors.borderSubtle }]}>
                  <View style={styles.liveSummaryHeader}>
                    <Text style={[styles.liveSummaryTitle, { color: colors.textMain }]}>
                      Estructura por Tanda ({yieldNum} pzas)
                    </Text>
                    <Badge
                      label={`${marginPct.toFixed(1)}% Margen`}
                      variant={marginPct >= 60 ? 'emerald' : 'amber'}
                    />
                  </View>

                  <View style={[styles.pillBadgeRow, { backgroundColor: isDark ? '#202636' : '#FFFFFF', borderColor: colors.borderSubtle }]}>
                    <Text style={[styles.pillBadgeText, { color: colors.textMain }]}>
                      🍪 Tanda: {yieldNum} pzas • Insumo: ${ingCostNum.toFixed(2)} • Empaque: ${packCostNum.toFixed(2)} • Total: ${unitCostTotal.toFixed(2)} c/u
                    </Text>
                  </View>

                  <View style={styles.liveMetricsGrid}>
                    <View style={styles.liveMetricItem}>
                      <Text style={[styles.liveMetricLabel, { color: colors.textDim }]}>Costo Unitario</Text>
                      <Text style={[styles.liveMetricVal, { color: colors.roseLight }]}>
                        ${unitCostTotal.toFixed(2)}
                      </Text>
                      <Text style={[styles.liveMetricSub, { color: colors.textDim }]}>con empaque</Text>
                    </View>
                    <View style={styles.liveMetricDivider} />
                    <View style={styles.liveMetricItem}>
                      <Text style={[styles.liveMetricLabel, { color: colors.textDim }]}>Precio Venta</Text>
                      <Text style={[styles.liveMetricVal, { color: colors.amberLight }]}>
                        ${priceNum.toFixed(2)}
                      </Text>
                      <Text style={[styles.liveMetricSub, { color: colors.textDim }]}>individual</Text>
                    </View>
                    <View style={styles.liveMetricDivider} />
                    <View style={styles.liveMetricItem}>
                      <Text style={[styles.liveMetricLabel, { color: colors.textDim }]}>Ganas x Pza</Text>
                      <Text style={[styles.liveMetricVal, { color: colors.emeraldLight }]}>
                        +${profitPerCookie.toFixed(2)}
                      </Text>
                      <Text style={[styles.liveMetricSub, { color: colors.emeraldLight, fontWeight: '700' }]}>neta libre</Text>
                    </View>
                  </View>
                </View>

                {/* FORM INPUTS */}
                <Text style={[styles.formLabel, { color: colors.textDim, marginTop: 14 }]}>
                  Nombre de la Galleta *
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, color: colors.textMain }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Ej. Chispas Clásicas NY"
                  placeholderTextColor={colors.textDim}
                />

                {/* BATCH YIELD WITH CHIP PRESETS */}
                <View style={{ marginTop: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.formLabel, { color: colors.textDim, marginBottom: 0 }]}>
                      Tamaño de Tanda (Galletas producidas) *
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.amberLight }}>
                      {yieldNum} piezas
                    </Text>
                  </View>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, color: colors.textMain, marginTop: 6 }]}
                    value={batchYield}
                    onChangeText={handleBatchYieldChange}
                    keyboardType="numeric"
                    placeholder="16"
                    placeholderTextColor={colors.textDim}
                  />

                  {/* Quick Chips */}
                  <View style={styles.chipRow}>
                    <Text style={{ fontSize: 11, color: colors.textDim, alignSelf: 'center', marginRight: 4 }}>
                      Atajos:
                    </Text>
                    {YIELD_PRESETS.map((preset) => {
                      const selected = yieldNum === preset;
                      return (
                        <TouchableOpacity
                          key={preset}
                          onPress={() => handleSetPresetYield(preset)}
                          style={[
                            styles.chipBtn,
                            {
                              backgroundColor: selected ? colors.amberBg : colors.bgTertiary,
                              borderColor: selected ? colors.amberBorder : colors.borderSubtle,
                            },
                          ]}
                        >
                          <Text style={[styles.chipText, { color: selected ? colors.amberLight : colors.textMuted }]}>
                            {preset} pzas
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* SEPARATE INGREDIENTS & PACKAGING COSTS */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.formLabel, { color: colors.textDim }]}>Insumo / Masa x Pza ($ MXN)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, color: colors.textMain }]}
                      value={ingredientCost}
                      onChangeText={handleIngredientCostChange}
                      keyboardType="numeric"
                      placeholder="6.50"
                      placeholderTextColor={colors.textDim}
                    />
                    <Text style={{ fontSize: 10, color: colors.textDim, marginTop: 2 }}>Mantequilla, harina, chocolate</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.formLabel, { color: colors.textDim }]}>Empaque x Pza ($ MXN)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, color: colors.textMain }]}
                      value={packagingCost}
                      onChangeText={handlePackagingCostChange}
                      keyboardType="numeric"
                      placeholder="2.00"
                      placeholderTextColor={colors.textDim}
                    />
                    <Text style={{ fontSize: 10, color: colors.textDim, marginTop: 2 }}>Bolsita kraft, sticker, etc.</Text>
                  </View>
                </View>

                {/* SALE PRICE & BATCH PROFIT GOAL */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.formLabel, { color: colors.textDim }]}>Precio Venta ($ MXN) *</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, color: colors.textMain, fontWeight: '800' }]}
                      value={salePrice}
                      onChangeText={handleSalePriceChange}
                      keyboardType="numeric"
                      placeholder="35.00"
                      placeholderTextColor={colors.textDim}
                    />
                    <Text style={{ fontSize: 10, color: colors.textDim, marginTop: 2 }}>Cobro individual</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.formLabel, { color: colors.textDim }]}>Meta Ganancia Lote ($ MXN)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, color: colors.emeraldLight, fontWeight: '800' }]}
                      value={targetBatchProfit}
                      onChangeText={handleTargetBatchProfitChange}
                      keyboardType="numeric"
                      placeholder="424.00"
                      placeholderTextColor={colors.textDim}
                    />
                    <Text style={{ fontSize: 10, color: colors.textDim, marginTop: 2 }}>Tanda de {yieldNum} piezas</Text>
                  </View>
                </View>

                {/* RETURN ON INVESTMENT / LOT SUMMARY BANNER */}
                <View style={[styles.roiBox, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : '#ECFDF5', borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : '#A7F3D0', marginTop: 14 }]}>
                  <Ionicons name="trending-up" size={20} color="#10B981" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12.5, fontWeight: '800', color: isDark ? '#34D399' : '#047857' }}>
                      Meta Ganancia Neta por Lote: +${calcBatchProfit.toFixed(2)} MXN
                    </Text>
                    <Text style={{ fontSize: 11, color: isDark ? '#A7F3D0' : '#065F46', marginTop: 2 }}>
                      Inviertes ${totalBatchCost.toFixed(2)} en masa y empaque ({yieldNum} pzas) y cobras ${totalBatchRevenue.toFixed(2)}. Rendimiento: {unitCostTotal > 0 ? ((profitPerCookie / unitCostTotal) * 100).toFixed(1) : 0}% ROI.
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* TAB 2: PROMOTIONS & BATCH PROFIT SIMULATOR */}
            {activeTab === 'promos' && (
              <View>
                <View style={styles.promoSimHeader}>
                  <Text style={[styles.subSectionTitle, { color: colors.textMain }]}>
                    Simulador de Ganancia con Promociones
                  </Text>
                  <Text style={{ fontSize: 11.5, color: colors.textDim, marginTop: 2, lineHeight: 16 }}>
                    Compara cuánto ganas vendiendo piezas individuales vs combos y promociones creadas en la app para una tanda de {yieldNum} piezas.
                  </Text>
                </View>

                {/* Card 1: Venta Estándar (Regular) */}
                <View style={[styles.promoSimCard, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}>
                  <View style={styles.promoSimCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.promoSimCardTitle, { color: colors.textMain }]}>
                        1. Venta Estándar Regular
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.textDim }}>
                        Sin promociones • 1 pieza a precio de lista
                      </Text>
                    </View>
                    <Badge label={`$${priceNum.toFixed(2)} c/u`} variant="amber" />
                  </View>

                  <View style={styles.promoSimDivider} />

                  <View style={styles.promoSimMetricsRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.promoSimLabel, { color: colors.textDim }]}>Costo c/empaque</Text>
                      <Text style={[styles.promoSimVal, { color: colors.roseLight }]}>-${unitCostTotal.toFixed(2)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.promoSimLabel, { color: colors.textDim }]}>Ganancia x Pza</Text>
                      <Text style={[styles.promoSimVal, { color: colors.emeraldLight }]}>+${profitPerCookie.toFixed(2)}</Text>
                    </View>
                    <View style={{ flex: 1.2 }}>
                      <Text style={[styles.promoSimLabel, { color: colors.textDim }]}>Meta Lote ({yieldNum} pzas)</Text>
                      <Text style={[styles.promoSimVal, { color: colors.emeraldLight }]}>+${calcBatchProfit.toFixed(2)}</Text>
                    </View>
                  </View>
                </View>

                {/* Dynamic cards for each active promotion */}
                {activePromos.length > 0 ? (
                  activePromos.map((promo, idx) => {
                    let qty = promo.min_quantity || 1;
                    let promoRevenue = 0;
                    if (promo.promo_type === 'combo_fixed_price') {
                      qty = promo.min_quantity || 3;
                      promoRevenue = promo.discount_value;
                    } else if (promo.promo_type === 'percentage') {
                      qty = promo.min_quantity || 12;
                      promoRevenue = (priceNum * qty) * (1 - promo.discount_value / 100);
                    } else if (promo.promo_type === 'two_for_one') {
                      qty = 2;
                      promoRevenue = priceNum * 1;
                    } else if (promo.promo_type === 'fixed_amount') {
                      qty = promo.min_quantity || 1;
                      promoRevenue = Math.max(0, (priceNum * qty) - promo.discount_value);
                    } else {
                      qty = promo.min_quantity || 1;
                      promoRevenue = priceNum * qty;
                    }

                    const promoCost = unitCostTotal * qty;
                    const promoProfit = promoRevenue - promoCost;
                    const promoMargin = promoRevenue > 0 ? (promoProfit / promoRevenue) * 100 : 0;

                    // Extrapolación a la tanda completa
                    const combosInBatch = Math.floor(yieldNum / qty);
                    const remainder = yieldNum % qty;
                    const batchRevenuePromo = (combosInBatch * promoRevenue) + (remainder * priceNum);
                    const batchProfitPromo = batchRevenuePromo - totalBatchCost;

                    return (
                      <View
                        key={promo.id || idx}
                        style={[
                          styles.promoSimCard,
                          {
                            backgroundColor: colors.bgTertiary,
                            borderColor: colors.purpleBorder,
                            marginTop: 10,
                          },
                        ]}
                      >
                        <View style={styles.promoSimCardHeader}>
                          <View style={{ flex: 1, paddingRight: 6 }}>
                            <Text style={[styles.promoSimCardTitle, { color: colors.textMain }]}>
                              {idx + 2}. {promo.name}
                            </Text>
                            <Text style={{ fontSize: 11, color: colors.purpleLight, marginTop: 1 }}>
                              {qty} pzas x ${promoRevenue.toFixed(2)} MXN • {promo.badge_text}
                            </Text>
                          </View>
                          <Badge label={`${promoMargin.toFixed(1)}% Margen`} variant="purple" />
                        </View>

                        <View style={styles.promoSimDivider} />

                        <View style={styles.promoSimMetricsRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.promoSimLabel, { color: colors.textDim }]}>Costo Combo</Text>
                            <Text style={[styles.promoSimVal, { color: colors.roseLight }]}>-${promoCost.toFixed(2)}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.promoSimLabel, { color: colors.textDim }]}>Ganas x Combo</Text>
                            <Text style={[styles.promoSimVal, { color: colors.emeraldLight }]}>+${promoProfit.toFixed(2)}</Text>
                          </View>
                          <View style={{ flex: 1.2 }}>
                            <Text style={[styles.promoSimLabel, { color: colors.textDim }]}>Meta Lote Promo</Text>
                            <Text style={[styles.promoSimVal, { color: colors.purpleLight }]}>+${batchProfitPromo.toFixed(2)}</Text>
                          </View>
                        </View>

                        <View style={[styles.batchDiffNote, { backgroundColor: isDark ? '#1F2433' : '#F1F5F9' }]}>
                          <Ionicons name="information-circle-outline" size={13} color={colors.textDim} />
                          <Text style={{ fontSize: 10, color: colors.textDim, flex: 1 }}>
                            Si vendes la tanda en esta promo ({combosInBatch} combos{remainder > 0 ? ` + ${remainder} pzas sueltas` : ''}), ganas +${batchProfitPromo.toFixed(2)} MXN netos.
                          </Text>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <View style={[styles.emptyPromoBox, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}>
                    <Ionicons name="pricetag-outline" size={32} color={colors.textDim} />
                    <Text style={[styles.emptyPromoTitle, { color: colors.textMain }]}>Sin Promociones Específicas</Text>
                    <Text style={[styles.emptyPromoSub, { color: colors.textDim }]}>
                      Puedes crear promociones como '3 x $90' o 'Docena 15% OFF' en la subpestaña 'Promos' para ver aquí su rendimiento por tanda.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* TAB 3: INGREDIENTS BREAKDOWN */}
            {activeTab === 'ingredients' && (
              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <View>
                    <Text style={[styles.subSectionTitle, { color: colors.textMain }]}>Ingredientes del Lote</Text>
                    <Text style={{ fontSize: 11, color: colors.textDim }}>
                      {ingredients.length} insumos registrados para esta masa ({yieldNum} galletas)
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      onPress={handleAddCustomIngredient}
                      style={[styles.smallActionBtn, { borderColor: colors.borderSubtle, backgroundColor: colors.bgTertiary }]}
                    >
                      <Ionicons name="add" size={14} color={colors.textMain} />
                      <Text style={[styles.smallActionBtnText, { color: colors.textMain }]}>Manual</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setIsIngredientPickerOpen(true)}
                      style={[styles.smallActionBtn, { borderColor: colors.amberBorder, backgroundColor: colors.amberBg }]}
                    >
                      <Ionicons name="nutrition" size={14} color={colors.amberLight} />
                      <Text style={[styles.smallActionBtnText, { color: colors.amberLight }]}>Catálogo</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {ingredients.map((item, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.ingredientItemRow,
                      { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle },
                    ]}
                  >
                    <View style={{ flex: 2 }}>
                      <TextInput
                        style={[styles.itemInput, { color: colors.textMain }]}
                        value={item.name}
                        onChangeText={(t) => handleUpdateIngredient(idx, 'name', t)}
                        placeholder="Nombre ingrediente"
                        placeholderTextColor={colors.textDim}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <TextInput
                        style={[styles.itemInput, { color: colors.textMain, textAlign: 'center' }]}
                        value={String(item.quantity)}
                        onChangeText={(t) => handleUpdateIngredient(idx, 'quantity', parseFloat(t) || 0)}
                        keyboardType="numeric"
                        placeholder="Cant."
                        placeholderTextColor={colors.textDim}
                      />
                    </View>
                    <View style={{ width: 45 }}>
                      <TextInput
                        style={[styles.itemInput, { color: colors.textDim, textAlign: 'center' }]}
                        value={item.unit}
                        onChangeText={(t) => handleUpdateIngredient(idx, 'unit', t)}
                        placeholder="Unid."
                        placeholderTextColor={colors.textDim}
                      />
                    </View>
                    <View style={{ flex: 1.2 }}>
                      <TextInput
                        style={[styles.itemInput, { color: colors.roseLight, textAlign: 'right', fontWeight: '800' }]}
                        value={String(item.cost)}
                        onChangeText={(t) => handleUpdateIngredient(idx, 'cost', parseFloat(t) || 0)}
                        keyboardType="numeric"
                        placeholder="$0.00"
                        placeholderTextColor={colors.textDim}
                      />
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveIngredient(idx)}
                      style={styles.removeIngBtn}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.roseLight} />
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity
                  onPress={handleSumIngredientsToRecipeCost}
                  style={[styles.recalcCostBtn, { backgroundColor: colors.brandBg, borderColor: colors.brandBorder }]}
                >
                  <Ionicons name="calculator-outline" size={15} color={colors.brandText} />
                  <Text style={[styles.recalcCostBtnText, { color: colors.brandText }]}>
                    Calcular y fijar costo de insumo x pieza ({yieldNum} pzas)
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* TAB 4: NAME, DESCRIPTION & PHOTO */}
            {activeTab === 'info' && (
              <View>
                <View style={styles.imageSection}>
                  <View style={[styles.imagePreviewWrapper, { borderColor: colors.borderSubtle }]}>
                    <Image
                      source={{ uri: imageUri || (cookie?.image_url || PRESET_IMAGE_URL) }}
                      style={styles.imagePreview}
                    />
                  </View>
                  <View style={{ flex: 1, gap: 8 }}>
                    <Button
                      title="Cambiar Foto"
                      variant="secondary"
                      icon={<Ionicons name="camera" size={16} color={colors.textMain} />}
                      onPress={() => setIsPhotoPickerOpen(true)}
                    />
                    <Text style={{ fontSize: 11, color: colors.textDim, lineHeight: 15 }}>
                      Toma una foto de tu producto horneado o selecciona de tu galería para la presentación ante clientes.
                    </Text>
                  </View>
                </View>

                <Text style={[styles.formLabel, { color: colors.textDim, marginTop: 14 }]}>Descripción / Presentación</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, color: colors.textMain }]}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  placeholder="Ej. Masa suave con mantequilla premium y 40% de chispas belgas semiamargas."
                  placeholderTextColor={colors.textDim}
                />
              </View>
            )}
          </ScrollView>

          {/* Bottom Action Footer */}
          <View style={[styles.footer, { borderTopColor: colors.borderSubtle, backgroundColor: isDark ? '#1C202A' : '#FFFFFF' }]}>
            <Button
              title="Cancelar"
              variant="secondary"
              onPress={onClose}
              style={{ flex: 1 }}
              disabled={isSaving}
            />
            <Button
              title={isSaving ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Galleta')}
              variant="amber"
              onPress={handleSave}
              style={{ flex: 2 }}
              disabled={isSaving}
              icon={<Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />}
            />
          </View>
        </Animated.View>
      </View>

      {/* PHOTO SOURCE SELECTION BOTTOM SHEET */}
      <Modal
        visible={isPhotoPickerOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsPhotoPickerOpen(false)}
      >
        <TouchableOpacity
          style={styles.pickerBackdrop}
          activeOpacity={1}
          onPress={() => setIsPhotoPickerOpen(false)}
        >
          <View style={[styles.photoPickerSheet, { backgroundColor: isDark ? '#1C202A' : '#FFFFFF', borderColor: colors.borderSubtle }]}>
            <Text style={[styles.photoPickerTitle, { color: colors.textMain }]}>Foto de la Galleta</Text>
            <TouchableOpacity
              onPress={handlePickFromCamera}
              style={[styles.photoOptionBtn, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
            >
              <Ionicons name="camera" size={20} color={colors.amberLight} />
              <Text style={[styles.photoOptionText, { color: colors.textMain }]}>Tomar Foto con la Cámara</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handlePickFromGallery}
              style={[styles.photoOptionBtn, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
            >
              <Ionicons name="images" size={20} color={colors.brandLight} />
              <Text style={[styles.photoOptionText, { color: colors.textMain }]}>Elegir de la Galería</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsPhotoPickerOpen(false)}
              style={[styles.cancelBtn, { borderColor: colors.borderSubtle }]}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textDim }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* CATALOG INGREDIENT PICKER MODAL */}
      <Modal
        visible={isIngredientPickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsIngredientPickerOpen(false)}
      >
        <View style={styles.backdrop}>
          <View style={[styles.pickerDialog, { backgroundColor: isDark ? '#1C202A' : '#FFFFFF', borderColor: colors.borderSubtle }]}>
            <View style={styles.header}>
              <View>
                <Text style={[styles.title, { color: colors.textMain }]}>Agregar Insumo de Catálogo</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  Selecciona una materia prima registrada
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsIngredientPickerOpen(false)}
                style={[styles.closeCircle, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
              >
                <Ionicons name="close" size={18} color={colors.textMain} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, color: colors.textMain, marginHorizontal: 16, marginBottom: 12 }]}
              value={pickerSearch}
              onChangeText={setPickerSearch}
              placeholder="Buscar insumo (ej. Harina, Mantequilla)..."
              placeholderTextColor={colors.textDim}
            />

            <FlatList
              data={registeredIngredients.filter((i) =>
                i.name.toLowerCase().includes(pickerSearch.toLowerCase())
              )}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.pickerItem, { borderBottomColor: colors.borderSubtle }]}
                  onPress={() => handleAddIngredientFromCatalog(item)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pickerItemName, { color: colors.textMain }]}>{item.name}</Text>
                    <Text style={{ fontSize: 11, color: colors.textDim }}>
                      ${item.cost_per_unit.toFixed(4)} MXN por {item.unit}
                    </Text>
                  </View>
                  <Ionicons name="add-circle" size={24} color={colors.amberLight} />
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
            />
          </View>
        </View>
      </Modal>
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
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  dragHandleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11.5,
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
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginRight: 8,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  liveSummaryBox: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: 12,
  },
  liveSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveSummaryTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  pillBadgeRow: {
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  pillBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  liveMetricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  liveMetricLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  liveMetricVal: {
    fontSize: 16,
    fontWeight: '900',
    marginVertical: 1,
  },
  liveMetricSub: {
    fontSize: 9,
  },
  liveMetricDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  input: {
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
  },
  textArea: {
    height: 72,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  chipBtn: {
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  roiBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: 10,
  },
  promoSimHeader: {
    marginBottom: 12,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  promoSimCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: 12,
  },
  promoSimCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promoSimCardTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  promoSimDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 8,
  },
  promoSimMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoSimLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  promoSimVal: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  batchDiffNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 8,
  },
  emptyPromoBox: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginTop: 10,
  },
  emptyPromoTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 8,
  },
  emptyPromoSub: {
    fontSize: 11.5,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  smallActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  smallActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  ingredientItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 6,
  },
  itemInput: {
    fontSize: 12,
    paddingVertical: 4,
  },
  removeIngBtn: {
    padding: 4,
  },
  recalcCostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingVertical: 9,
    marginTop: 10,
  },
  recalcCostBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  imageSection: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  imagePreviewWrapper: {
    width: 80,
    height: 80,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  photoPickerSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 20,
    gap: 10,
  },
  photoPickerTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  photoOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  photoOptionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  cancelBtn: {
    borderRadius: radii.md,
    borderWidth: 1,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  pickerDialog: {
    height: '75%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  pickerItemName: {
    fontSize: 13.5,
    fontWeight: '700',
  },
});
