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
import { CookieProduct, RecipeIngredientItem, Ingredient } from '../../lib/types';
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
  { name: 'Empaque Individual Kraft', quantity: 1, unit: 'pza', cost: 1.97 },
];

const PRESET_IMAGE_URL = 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500&auto=format&fit=crop&q=60';

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

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [batchYield, setBatchYield] = useState('16');
  const [ingredientCost, setIngredientCost] = useState('6.77');
  const [packagingCost, setPackagingCost] = useState('2.90');
  const registeredIngredients = useAppStore((state) => state.ingredients);
  const [salePrice, setSalePrice] = useState('35.00');
  const [targetBatchProfit, setTargetBatchProfit] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<RecipeIngredientItem[]>([]);
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false);
  const [isIngredientPickerOpen, setIsIngredientPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'economics' | 'ingredients' | 'info'>('economics');

  const screenHeight = Dimensions.get('window').height;
  const modalHeight = Math.round(screenHeight * 0.92);
  const translateY = useRef(new Animated.Value(0)).current;

  // Swipe-down to close panResponder
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

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
      if (cookie) {
        setName(cookie.name || '');
        setDescription(cookie.description || '');
        const yieldVal = cookie.batch_yield || 16;
        setBatchYield(String(yieldVal));

        const totalCost = cookie.recipe_cost || 9.67;
        const packCost = 2.90;
        const rawCost = Math.max(0.5, totalCost - packCost);

        setIngredientCost(rawCost.toFixed(2));
        setPackagingCost(packCost.toFixed(2));
        setSalePrice(cookie.sale_price ? cookie.sale_price.toFixed(2) : '35.00');

        const profitPerCookie = Math.max(0, (cookie.sale_price || 35) - totalCost);
        const batchProf = profitPerCookie * yieldVal;
        setTargetBatchProfit(batchProf.toFixed(2));

        setImageUri(cookie.image_url || null);
        setIngredients(cookie.ingredients ? [...cookie.ingredients] : []);
        setActiveTab('economics');
      } else {
        setName('');
        setDescription('');
        setBatchYield('16');
        setIngredientCost('6.77');
        setPackagingCost('2.90');
        setSalePrice('35.00');
        setTargetBatchProfit('405.28');
        setImageUri(null);
        setIngredients([...DEFAULT_RECIPE_INGREDIENTS]);
        setActiveTab('economics');
      }
    }
  }, [visible, cookie]);

  // Numeric derivations
  const yieldNum = Math.max(1, parseInt(batchYield) || 16);
  const ingCostNum = parseFloat(ingredientCost) || 0;
  const packCostNum = parseFloat(packagingCost) || 0;
  const unitCostTotal = ingCostNum + packCostNum;
  const priceNum = parseFloat(salePrice) || 0;
  const profitPerCookie = priceNum - unitCostTotal;
  const calcBatchProfit = profitPerCookie * yieldNum;
  const marginPct = priceNum > 0 ? (profitPerCookie / priceNum) * 100 : 0;
  const totalBatchCost = unitCostTotal * yieldNum;

  const handleTargetBatchProfitChange = (text: string) => {
    setTargetBatchProfit(text);
    const profitVal = parseFloat(text);
    if (!isNaN(profitVal) && profitVal >= 0 && yieldNum > 0) {
      const neededProfitPerCookie = profitVal / yieldNum;
      const suggestedPrice = unitCostTotal + neededProfitPerCookie;
      setSalePrice(suggestedPrice.toFixed(2));
    }
  };

  const handleSalePriceChange = (text: string) => {
    setSalePrice(text);
    const p = parseFloat(text);
    if (!isNaN(p)) {
      const prof = (p - unitCostTotal) * yieldNum;
      setTargetBatchProfit(prof.toFixed(2));
    }
  };

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
    Alert.alert(
      '¡Costos Actualizados!',
      `Costo total lote: $${totalIngredientsCost.toFixed(2)} MXN\nCosto insumo por pieza (${yieldNum} pzas): $${perCookieIngCost.toFixed(2)} MXN`
    );
  };

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
        recipe_cost: unitCostTotal,
        profit_per_unit: profitPerCookie,
        profit_margin_pct: marginPct,
        batch_yield: yieldNum,
        image_url: imageUri || (cookie?.image_url || PRESET_IMAGE_URL),
        ingredients: ingredients.filter((i) => i.name.trim().length > 0),
      };

      if (cookie && (onUpdate || onUpdateCookie)) {
        const updater = onUpdate || onUpdateCookie!;
        await updater(cookie.id, payload);
        Alert.alert('¡Receta Guardada!', `Se actualizaron los costos y ganancia de ${name}.`);
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
              backgroundColor: colors.bgCard,
              borderColor: colors.borderSubtle,
              height: modalHeight,
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Header & PanResponder Drag Handle */}
          <View {...panResponder.panHandlers}>
            <View style={styles.dragHandleContainer}>
              <View style={[styles.dragHandleBar, { backgroundColor: colors.borderSubtle }]} />
            </View>

            <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.headerEyebrow, { color: colors.amberLight }]}>
                    {isEditing ? 'Configurar Receta & Rendimiento' : 'Alta de Nueva Receta'}
                  </Text>
                  <Badge label={isEditing ? 'Edición' : 'Nueva Receta'} variant={isEditing ? 'amber' : 'emerald'} />
                </View>
                <Text style={[styles.headerTitle, { color: colors.textMain }]} numberOfLines={1}>
                  {isEditing && cookie ? cookie.name : (name || 'Nueva Galleta')}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Subtabs switcher */}
          <View style={[styles.tabsRow, { borderBottomColor: colors.borderSubtle }]}>
            {[
              { id: 'economics', label: 'Tanda & Ganancia', icon: 'calculator' },
              { id: 'ingredients', label: `Insumos (${ingredients.length})`, icon: 'nutrition' },
              { id: 'info', label: 'Nombre & Foto', icon: 'image' },
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
            {/* TAB 1: ECONOMICS & BATCH PROFIT */}
            {activeTab === 'economics' && (
              <View>
                {/* Visual Unit Economics Live Summary Box */}
                <View style={[styles.liveSummaryBox, { backgroundColor: isDark ? '#161B26' : '#F1F5F9', borderColor: colors.borderSubtle }]}>
                  <View style={styles.liveSummaryHeader}>
                    <Text style={[styles.liveSummaryTitle, { color: colors.textMain }]}>
                      Estructura por Tanda ({yieldNum} pzas)
                    </Text>
                    <Badge
                      label={`${marginPct.toFixed(2)}% Margen`}
                      variant={marginPct >= 60 ? 'emerald' : 'amber'}
                    />
                  </View>

                  <View style={[styles.pillBadgeRow, { backgroundColor: isDark ? '#202636' : '#FFFFFF', borderColor: colors.borderSubtle }]}>
                    <Text style={[styles.pillBadgeText, { color: colors.textMain }]}>
                      🍪 Tanda: {yieldNum} pzas • Insumo: ${ingCostNum.toFixed(2)} • Empaque: ${packCostNum.toFixed(2)} • Total Lote: ${totalBatchCost.toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.liveMetricsGrid}>
                    <View style={styles.liveMetricItem}>
                      <Text style={[styles.liveMetricLabel, { color: colors.textDim }]}>Costo x Pza</Text>
                      <Text style={[styles.liveMetricVal, { color: colors.roseLight }]}>
                        ${unitCostTotal.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.liveMetricDivider} />
                    <View style={styles.liveMetricItem}>
                      <Text style={[styles.liveMetricLabel, { color: colors.textDim }]}>Precio Venta</Text>
                      <Text style={[styles.liveMetricVal, { color: colors.amberLight }]}>
                        ${priceNum.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.liveMetricDivider} />
                    <View style={styles.liveMetricItem}>
                      <Text style={[styles.liveMetricLabel, { color: colors.textDim }]}>Ganas x Pza</Text>
                      <Text style={[styles.liveMetricVal, { color: colors.emeraldLight }]}>
                        +${profitPerCookie.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* FORM INPUTS */}
                <Text style={[styles.formLabel, { color: colors.textDim, marginTop: 14 }]}>
                  Rendimiento de la Tanda (Galletas producidas)
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, color: colors.textMain }]}
                  value={batchYield}
                  onChangeText={setBatchYield}
                  keyboardType="numeric"
                  placeholder="16"
                  placeholderTextColor={colors.textDim}
                />

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.formLabel, { color: colors.textDim }]}>Insumo x Pza ($ MXN)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, color: colors.textMain }]}
                      value={ingredientCost}
                      onChangeText={setIngredientCost}
                      keyboardType="numeric"
                      placeholder="6.77"
                      placeholderTextColor={colors.textDim}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.formLabel, { color: colors.textDim }]}>Empaque x Pza ($ MXN)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, color: colors.textMain }]}
                      value={packagingCost}
                      onChangeText={setPackagingCost}
                      keyboardType="numeric"
                      placeholder="2.90"
                      placeholderTextColor={colors.textDim}
                    />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.formLabel, { color: colors.textDim }]}>Precio Venta ($ MXN)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, color: colors.textMain, fontWeight: '800' }]}
                      value={salePrice}
                      onChangeText={handleSalePriceChange}
                      keyboardType="numeric"
                      placeholder="35.00"
                      placeholderTextColor={colors.textDim}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.formLabel, { color: colors.textDim }]}>Meta Ganancia Lote ($ MXN)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, color: colors.emeraldLight, fontWeight: '800' }]}
                      value={targetBatchProfit}
                      onChangeText={handleTargetBatchProfitChange}
                      keyboardType="numeric"
                      placeholder="405.00"
                      placeholderTextColor={colors.textDim}
                    />
                  </View>
                </View>

                {/* Return On Investment (ROI) */}
                <View style={[styles.roiBox, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : '#ECFDF5', borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : '#A7F3D0' }]}>
                  <Ionicons name="trending-up" size={18} color="#10B981" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: isDark ? '#34D399' : '#047857' }}>
                      Ganancia por Lote Calculada: +${calcBatchProfit.toFixed(2)} MXN
                    </Text>
                    <Text style={{ fontSize: 10.5, color: isDark ? '#A7F3D0' : '#065F46', marginTop: 1 }}>
                      Por cada ${totalBatchCost.toFixed(2)} invertidos en masa y empaque, cobras ${(priceNum * yieldNum).toFixed(2)}.
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* TAB 2: INGREDIENTS BREAKDOWN */}
            {activeTab === 'ingredients' && (
              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <View>
                    <Text style={[styles.subSectionTitle, { color: colors.textMain }]}>Ingredientes del Lote</Text>
                    <Text style={{ fontSize: 11, color: colors.textDim }}>
                      {ingredients.length} insumos registrados para esta masa
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
                    Calcular y fijar costo de insumo x pieza
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* TAB 3: NAME, DESCRIPTION & PHOTO */}
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

                <Text style={[styles.formLabel, { color: colors.textDim, marginTop: 14 }]}>Nombre Comercial</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, color: colors.textMain }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Ej. Galleta Chispas Gigante"
                  placeholderTextColor={colors.textDim}
                />

                <Text style={[styles.formLabel, { color: colors.textDim }]}>Descripción / Presentación</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, color: colors.textMain, height: 70 }]}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  placeholder="Detalles sobre ingredientes, textura y sabor..."
                  placeholderTextColor={colors.textDim}
                />
              </View>
            )}

            {/* Bottom Actions */}
            <View style={styles.actionRow}>
              <Button
                title="Cancelar"
                variant="secondary"
                onPress={onClose}
                style={{ flex: 1 }}
              />
              <Button
                title={isSaving ? "Guardando..." : (isEditing ? "Guardar Cambios" : "Guardar Receta")}
                variant="primary"
                disabled={isSaving}
                onPress={handleSave}
                icon={<Ionicons name="checkmark-done" size={17} color="#fff" />}
                style={{ flex: 2 }}
              />
            </View>
          </ScrollView>

          {/* Photo source modal picker */}
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
              <View style={[styles.pickerDialog, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}>
                <Text style={[styles.pickerTitle, { color: colors.textMain }]}>Seleccionar Foto</Text>
                <Text style={[styles.pickerSub, { color: colors.textMuted }]}>
                  Elige el origen de la imagen para {name || 'la galleta'}
                </Text>

                <TouchableOpacity
                  style={[styles.pickerOption, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
                  onPress={handlePickFromCamera}
                >
                  <Ionicons name="camera" size={20} color={colors.amberLight} />
                  <Text style={[styles.pickerOptionText, { color: colors.textMain }]}>Tomar Foto con Cámara</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.pickerOption, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
                  onPress={handlePickFromGallery}
                >
                  <Ionicons name="images" size={20} color={colors.brandLight} />
                  <Text style={[styles.pickerOptionText, { color: colors.textMain }]}>Elegir de la Galería</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.pickerCancelBtn, { borderColor: colors.borderSubtle }]}
                  onPress={() => setIsPhotoPickerOpen(false)}
                >
                  <Text style={[styles.pickerCancelText, { color: colors.textDim }]}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Modal Selector de Insumos Registrados */}
          <Modal
            visible={isIngredientPickerOpen}
            transparent
            animationType="slide"
            onRequestClose={() => setIsIngredientPickerOpen(false)}
          >
            <TouchableOpacity
              style={styles.pickerBackdropSheet}
              activeOpacity={1}
              onPress={() => setIsIngredientPickerOpen(false)}
            >
              <TouchableOpacity
                activeOpacity={1}
                style={[
                  styles.pickerSheetCard,
                  {
                    backgroundColor: isDark ? '#1C202A' : '#FFFFFF',
                    borderColor: isDark ? '#2E384D' : '#E2E8F0',
                    height: Math.round(screenHeight * 0.78),
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

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <View>
                    <Text style={[styles.pickerTitle, { color: isDark ? '#F1F3F7' : '#181A1F' }]}>
                      Insumos Registrados ({registeredIngredients.length})
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textDim }}>
                      Selecciona los insumos para esta receta
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setIsIngredientPickerOpen(false)}>
                    <Ionicons name="close" size={20} color={colors.textDim} />
                  </TouchableOpacity>
                </View>

                {/* Search */}
                <View style={[styles.pickerSearchRow, { backgroundColor: isDark ? '#242936' : '#F1F5F9', borderColor: colors.borderSubtle }]}>
                  <Ionicons name="search" size={16} color={colors.textDim} />
                  <TextInput
                    style={[styles.pickerSearchInput, { color: isDark ? '#F1F3F7' : '#181A1F' }]}
                    placeholder="Buscar insumo (ej. Harina, Chispas, Huevo)..."
                    placeholderTextColor={colors.textDim}
                    value={pickerSearch}
                    onChangeText={setPickerSearch}
                  />
                </View>

                <FlatList
                  data={registeredIngredients.filter((ing) =>
                    ing.name.toLowerCase().includes(pickerSearch.toLowerCase())
                  )}
                  keyExtractor={(item) => String(item.id)}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => handleAddIngredientFromCatalog(item)}
                      style={[
                        styles.pickerIngItem,
                        {
                          backgroundColor: isDark ? '#242936' : '#F8F9FA',
                          borderColor: isDark ? '#2E384D' : '#E2E8F0',
                        },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.pickerIngName, { color: isDark ? '#F1F3F7' : '#181A1F' }]}>
                          {item.name}
                        </Text>
                        <Text style={{ fontSize: 11, color: colors.textDim, marginTop: 2 }}>
                          {item.package_quantity} {item.unit} • Proveedor: {item.supplier || 'Local'}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: colors.emeraldLight }}>
                          ${item.cost_per_unit.toFixed(2)} / {item.unit}
                        </Text>
                        <Text style={{ fontSize: 10, color: colors.textDim }}>Costo Unitario</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                  contentContainerStyle={{ paddingBottom: 30 }}
                  ListEmptyComponent={
                    <View style={{ alignItems: 'center', padding: 30 }}>
                      <Ionicons name="nutrition-outline" size={36} color={colors.textDim} />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMuted, marginTop: 8 }}>
                        No hay insumos registrados
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.textDim, textAlign: 'center', marginTop: 4 }}>
                        Registra insumos desde la pestaña de Insumos para asignarlos a tus recetas.
                      </Text>
                    </View>
                  }
                />
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        </Animated.View>
      </View>
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
    borderTopLeftRadius: radii.outer,
    borderTopRightRadius: radii.outer,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 20,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  dragHandleBar: {
    width: 42,
    height: 5,
    borderRadius: 2.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  body: {
    padding: 18,
  },
  liveSummaryBox: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 14,
    marginBottom: 8,
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
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  pillBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  liveMetricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 6,
  },
  liveMetricItem: {
    alignItems: 'center',
    flex: 1,
  },
  liveMetricLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  liveMetricVal: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  liveMetricDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: 12,
  },
  roiBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 12,
    marginTop: 4,
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  smallActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  smallActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  ingredientItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 8,
  },
  itemInput: {
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 4,
  },
  removeIngBtn: {
    padding: 6,
  },
  recalcCostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingVertical: 9,
    marginTop: 6,
  },
  recalcCostBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  imageSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
  },
  imagePreviewWrapper: {
    width: 80,
    height: 80,
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    marginBottom: 20,
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerDialog: {
    width: '100%',
    maxWidth: 340,
    borderRadius: radii.outer,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  pickerTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  pickerSub: {
    fontSize: 11.5,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    padding: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: 10,
  },
  pickerOptionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  pickerCancelBtn: {
    paddingVertical: 8,
    marginTop: 4,
  },
  pickerCancelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pickerBackdropSheet: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  pickerSheetCard: {
    borderTopLeftRadius: radii.outer,
    borderTopRightRadius: radii.outer,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  pickerSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginVertical: 10,
  },
  pickerSearchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 2,
  },
  pickerIngItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  pickerIngName: {
    fontSize: 13,
    fontWeight: '800',
  },
});
