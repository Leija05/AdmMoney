import React, { useState, useRef, useEffect } from 'react';
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
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { colors, useThemeColors, radii, spacing, gradients } from '../../theme';
import { CookieProduct, RecipeIngredientItem, Ingredient } from '../../lib/types';
import { useAppStore } from '../../stores/app.store';
import { Ionicons } from '@expo/vector-icons';

interface EditCookieModalProps {
  visible: boolean;
  cookie: CookieProduct | null;
  onClose: () => void;
  onUpdateCookie: (id: number, data: Partial<CookieProduct>) => Promise<any>;
}

export const EditCookieModal: React.FC<EditCookieModalProps> = ({
  visible,
  cookie,
  onClose,
  onUpdateCookie,
}) => {
  const colors = useThemeColors();
  const isDark = colors.isDark;

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
    if (visible && cookie) {
      translateY.setValue(0);
      setName(cookie.name || '');
      setDescription(cookie.description || '');
      const yieldVal = cookie.batch_yield || 16;
      setBatchYield(String(yieldVal));

      // Separate packaging cost if unit cost > 2.90, or use 2.90 standard packaging
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
    }
  }, [visible, cookie]);

  if (!cookie) return null;

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

  // When user edits target batch profit directly, recalculate suggested sale price
  const handleTargetBatchProfitChange = (text: string) => {
    setTargetBatchProfit(text);
    const profitVal = parseFloat(text);
    if (!isNaN(profitVal) && profitVal >= 0 && yieldNum > 0) {
      const neededProfitPerCookie = profitVal / yieldNum;
      const suggestedPrice = unitCostTotal + neededProfitPerCookie;
      setSalePrice(suggestedPrice.toFixed(2));
    }
  };

  // When user edits sale price directly, sync target batch profit
  const handleSalePriceChange = (text: string) => {
    setSalePrice(text);
    const p = parseFloat(text);
    if (!isNaN(p)) {
      const prof = (p - unitCostTotal) * yieldNum;
      setTargetBatchProfit(prof.toFixed(2));
    }
  };

  // Photo handlers
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
        Alert.alert('Permiso Requerido', 'Se necesita acceso a la galería.');
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
      Alert.alert('Error', 'No se pudo abrir la galería.');
    }
  };

  // Recipe ingredients handlers
  const handleAddIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      { name: '', quantity: 20, unit: 'g', cost: 1.50 }
    ]);
  };

  const handleAddFromInventory = (ing: Ingredient) => {
    const alreadyExists = ingredients.some(
      (item) => item.ingredient_id === ing.id || item.name.toLowerCase().trim() === ing.name.toLowerCase().trim()
    );
    if (alreadyExists) {
      Alert.alert('Insumo ya Agregado', `"${ing.name}" ya se encuentra en la receta.`);
      return;
    }
    const defaultQty = ing.unit.toLowerCase() === 'kg' ? 0.25 : ing.unit.toLowerCase() === 'g' ? 150 : 1;
    const unitRate = ing.cost_per_unit || (ing.package_quantity > 0 ? ing.package_cost / ing.package_quantity : 0);
    const calculatedCost = Number((defaultQty * unitRate).toFixed(2));

    const newItem: RecipeIngredientItem = {
      ingredient_id: ing.id,
      name: ing.name,
      quantity: defaultQty,
      unit: ing.unit,
      cost: calculatedCost > 0 ? calculatedCost : 2.50,
    };
    setIngredients((prev) => [...prev, newItem]);
  };

  const handleUpdateIngredient = (idx: number, field: string, val: any) => {
    setIngredients((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
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
      await onUpdateCookie(cookie.id, {
        name: name.trim(),
        description: description.trim(),
        sale_price: priceNum,
        recipe_cost: unitCostTotal,
        profit_per_unit: profitPerCookie,
        profit_margin_pct: marginPct,
        batch_yield: yieldNum,
        image_url: imageUri || cookie.image_url,
        ingredients: ingredients.filter((i) => i.name.trim().length > 0),
      });

      Alert.alert('¡Receta Guardada!', `Se actualizaron los costos y ganancia de ${name}.`);
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
                    Configurar Receta & Rendimiento
                  </Text>
                  <Badge label="Edición" variant="amber" />
                </View>
                <Text style={[styles.headerTitle, { color: colors.textMain }]} numberOfLines={1}>
                  {cookie.name}
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
            {/* TAB 1: ECONOMICS & BATCH PROFIT (THE SCREENSHOT 4 FEATURE) */}
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

                  {/* The exact badge from Screenshot 4 */}
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

                {/* The Requested: EDITAR GANANCIA NETA POR TANDA */}
                <View style={[styles.specialProfitCard, { backgroundColor: isDark ? '#132E22' : '#ECFDF5', borderColor: colors.emeraldBorder }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Ionicons name="cash" size={17} color={colors.emeraldLight} />
                    <Text style={[styles.specialProfitTitle, { color: colors.emeraldLight }]}>
                      Ganancia Neta Libre por Tanda Completa
                    </Text>
                  </View>
                  <Text style={[styles.specialProfitSub, { color: colors.textDim }]}>
                    Ajusta directamente la ganancia total que deseas por hornear esta tanda y calcularemos el precio de venta sugerido.
                  </Text>

                  <View style={styles.profitInputRow}>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: colors.emeraldLight }}>$</Text>
                    <TextInput
                      style={[styles.profitInput, { color: colors.emeraldLight, backgroundColor: isDark ? '#0B2218' : '#FFFFFF', borderColor: colors.emeraldBorder }]}
                      value={targetBatchProfit}
                      onChangeText={handleTargetBatchProfitChange}
                      keyboardType="numeric"
                      placeholder={calcBatchProfit.toFixed(2)}
                      placeholderTextColor={colors.emeraldLight}
                    />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.emeraldLight }}>MXN / tanda</Text>
                  </View>

                  <Text style={[styles.specialProfitHint, { color: colors.textDim }]}>
                    Equivale a ganar <Text style={{ fontWeight: '800', color: colors.emeraldLight }}>+${profitPerCookie.toFixed(2)} MXN</Text> por galleta individual.
                  </Text>
                </View>

                <Text style={[styles.formLabel, { color: colors.textDim, marginTop: 14 }]}>
                  Precio de Venta al Cliente ($ MXN individual)
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, color: colors.textMain, fontSize: 16, fontWeight: '800' }]}
                  value={salePrice}
                  onChangeText={handleSalePriceChange}
                  keyboardType="numeric"
                  placeholder="35.00"
                  placeholderTextColor={colors.textDim}
                />
              </View>
            )}

            {/* TAB 2: RECIPE INGREDIENTS BREAKDOWN */}
            {activeTab === 'ingredients' && (
              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <View>
                    <Text style={[styles.formLabel, { color: colors.textMain, marginBottom: 0 }]}>
                      Ingredientes de la Receta ({ingredients.length})
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textDim }}>
                      Para una tanda de {yieldNum} galletas
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => setIsIngredientPickerOpen(true)}
                      style={[styles.miniHeaderBtn, { backgroundColor: colors.amberBg, borderColor: colors.amberBorder }]}
                    >
                      <Ionicons name="nutrition" size={13} color={colors.amberLight} />
                      <Text style={[styles.miniHeaderBtnText, { color: colors.amberLight }]}>+ De Almacén</Text>
                    </TouchableOpacity>
                    {ingredients.length > 0 && (
                      <TouchableOpacity
                        onPress={handleSumIngredientsToRecipeCost}
                        style={[styles.miniHeaderBtn, { backgroundColor: colors.emeraldBg, borderColor: colors.emeraldBorder }]}
                      >
                        <Ionicons name="calculator-outline" size={13} color={colors.emeraldLight} />
                        <Text style={[styles.miniHeaderBtnText, { color: colors.emeraldLight }]}>Calcular</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={handleAddIngredient}
                      style={[styles.miniHeaderBtn, { backgroundColor: colors.brandGlow, borderColor: colors.brandLight }]}
                    >
                      <Ionicons name="add" size={14} color={colors.brandLight} />
                      <Text style={[styles.miniHeaderBtnText, { color: colors.brandLight }]}>+ Libre</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {ingredients.length === 0 ? (
                  <TouchableOpacity
                    onPress={handleAddIngredient}
                    style={[styles.emptyBox, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
                  >
                    <Ionicons name="nutrition-outline" size={24} color={colors.amberLight} />
                    <Text style={[styles.emptyBoxText, { color: colors.textMuted }]}>
                      No hay ingredientes registrados. Toca aquí para añadir harina, mantequilla, chocolate, etc.
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ gap: 8 }}>
                    {ingredients.map((ing, idx) => (
                      <View
                        key={idx}
                        style={[styles.ingItemRow, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
                      >
                        <View style={{ flex: 1 }}>
                          <TextInput
                            style={[styles.ingNameInput, { color: colors.textMain }]}
                            placeholder="Ej. Harina de Trigo"
                            placeholderTextColor={colors.textDim}
                            value={ing.name}
                            onChangeText={(t) => handleUpdateIngredient(idx, 'name', t)}
                          />
                          <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                            <TextInput
                              style={[styles.ingSubInput, { color: colors.textDim }]}
                              placeholder="Cant"
                              placeholderTextColor={colors.textDim}
                              keyboardType="numeric"
                              value={String(ing.quantity || '')}
                              onChangeText={(t) => handleUpdateIngredient(idx, 'quantity', parseFloat(t) || 0)}
                            />
                            <TextInput
                              style={[styles.ingSubInput, { color: colors.textDim, width: 44 }]}
                              placeholder="g/pza"
                              placeholderTextColor={colors.textDim}
                              value={ing.unit}
                              onChangeText={(t) => handleUpdateIngredient(idx, 'unit', t)}
                            />
                          </View>
                        </View>

                        <View style={{ alignItems: 'flex-end', gap: 6 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                            <Text style={{ fontSize: 11, color: colors.textDim }}>$</Text>
                            <TextInput
                              style={[styles.ingCostInput, { color: colors.emeraldLight }]}
                              placeholder="0.00"
                              placeholderTextColor={colors.textDim}
                              keyboardType="numeric"
                              value={String(ing.cost || '')}
                              onChangeText={(t) => handleUpdateIngredient(idx, 'cost', parseFloat(t) || 0)}
                            />
                          </View>
                          <TouchableOpacity onPress={() => handleRemoveIngredient(idx)}>
                            <Ionicons name="trash-outline" size={15} color={colors.roseLight} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* TAB 3: NAME, DESCRIPTION & PHOTO */}
            {activeTab === 'info' && (
              <View>
                {/* Image Preview & Picker */}
                <View style={styles.imageSection}>
                  <View style={[styles.imagePreviewWrapper, { borderColor: colors.borderSubtle }]}>
                    <Image
                      source={{ uri: imageUri || cookie.image_url }}
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
                title={isSaving ? "Guardando..." : "Guardar Cambios"}
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
                  Elige el origen de la imagen para {cookie.name}
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
                  <TouchableOpacity onPress={() => setIsIngredientPickerOpen(false)} style={styles.closeBtn}>
                    <Ionicons name="close" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Search Input */}
                <View style={[styles.searchBox, { backgroundColor: isDark ? '#242936' : '#F1F5F9', borderColor: colors.borderSubtle }]}>
                  <Ionicons name="search" size={16} color={colors.textDim} />
                  <TextInput
                    style={{ flex: 1, color: colors.textMain, fontSize: 13, padding: 0 }}
                    placeholder="Buscar harina, chispas, mantequilla..."
                    placeholderTextColor={colors.textDim}
                    value={pickerSearch}
                    onChangeText={setPickerSearch}
                  />
                  {pickerSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setPickerSearch('')}>
                      <Ionicons name="close-circle" size={16} color={colors.textDim} />
                    </TouchableOpacity>
                  )}
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, marginVertical: 8 }}>
                  {registeredIngredients.length === 0 ? (
                    <View style={{ alignItems: 'center', paddingVertical: 28, gap: 6 }}>
                      <Ionicons name="cube-outline" size={32} color={colors.textDim} />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMain }}>
                        No hay insumos registrados
                      </Text>
                    </View>
                  ) : (
                    <View style={{ gap: 8 }}>
                      {registeredIngredients
                        .filter((item) =>
                          pickerSearch.trim() === ''
                            ? true
                            : item.name.toLowerCase().includes(pickerSearch.toLowerCase().trim()) ||
                              (item.supplier && item.supplier.toLowerCase().includes(pickerSearch.toLowerCase().trim()))
                        )
                        .map((item) => {
                          const isAdded = ingredients.some(
                            (r) => r.ingredient_id === item.id || r.name.toLowerCase().trim() === item.name.toLowerCase().trim()
                          );
                          return (
                            <TouchableOpacity
                              key={item.id}
                              onPress={() => handleAddFromInventory(item)}
                              activeOpacity={0.75}
                              style={[
                                styles.inventoryPickerCard,
                                {
                                  backgroundColor: isAdded
                                    ? (isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5')
                                    : (isDark ? '#242936' : '#F8F9FA'),
                                  borderColor: isAdded ? colors.emeraldBorder : colors.borderSubtle,
                                },
                              ]}
                            >
                              <View style={{ flex: 1, paddingRight: 6 }}>
                                <Text style={{ fontSize: 13, fontWeight: '800', color: isDark ? '#F1F3F7' : '#181A1F' }}>
                                  {item.name}
                                </Text>
                                <Text style={{ fontSize: 11, color: colors.textDim, marginTop: 2 }}>
                                  {item.supplier || 'Almacén'} • Stock: {item.stock_quantity} {item.unit}
                                </Text>
                                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.emeraldLight, marginTop: 2 }}>
                                  ${item.cost_per_unit.toFixed(2)} / {item.unit}
                                </Text>
                              </View>
                              <View>
                                {isAdded ? (
                                  <View style={[styles.addedBadge, { backgroundColor: colors.emeraldBg, borderColor: colors.emeraldBorder }]}>
                                    <Ionicons name="checkmark" size={13} color={colors.emeraldLight} />
                                    <Text style={{ fontSize: 11, fontWeight: '800', color: colors.emeraldLight }}>En Receta</Text>
                                  </View>
                                ) : (
                                  <View style={[styles.addBadge, { backgroundColor: colors.amberBg, borderColor: colors.amberBorder }]}>
                                    <Ionicons name="add" size={13} color={colors.amberLight} />
                                    <Text style={{ fontSize: 11, fontWeight: '800', color: colors.amberLight }}>Añadir</Text>
                                  </View>
                                )}
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                    </View>
                  )}
                </ScrollView>

                <TouchableOpacity
                  onPress={() => setIsIngredientPickerOpen(false)}
                  style={[styles.pickerActionBtn, { backgroundColor: colors.amber, borderColor: colors.amber, marginTop: 8 }]}
                >
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF' }}>Listo ({ingredients.length} en receta)</Text>
                </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  dialog: {
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingTop: 8,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
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
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  body: {
    flex: 1,
  },
  liveSummaryBox: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: 12,
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
    borderRadius: radii.sm,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  pillBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  liveMetricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  liveMetricItem: {
    alignItems: 'center',
    flex: 1,
  },
  liveMetricLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  liveMetricVal: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  liveMetricDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  specialProfitCard: {
    borderWidth: 1.5,
    borderRadius: radii.md,
    padding: 14,
    marginVertical: 10,
  },
  specialProfitTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  specialProfitSub: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 8,
  },
  profitInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profitInput: {
    borderWidth: 1.5,
    borderRadius: radii.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 20,
    fontWeight: '900',
    width: 140,
  },
  specialProfitHint: {
    fontSize: 11,
    marginTop: 6,
  },
  miniHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  miniHeaderBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  emptyBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radii.md,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyBoxText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  ingItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 10,
  },
  ingNameInput: {
    fontSize: 13,
    fontWeight: '700',
  },
  ingSubInput: {
    fontSize: 11,
    paddingVertical: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: '#64748B',
  },
  ingCostInput: {
    fontSize: 14,
    fontWeight: '800',
    minWidth: 44,
    textAlign: 'right',
  },
  imageSection: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginVertical: 10,
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
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    marginBottom: 20,
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerDialog: {
    width: '100%',
    maxWidth: 340,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 18,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  pickerSub: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 14,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 12,
    marginBottom: 8,
  },
  pickerOptionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  pickerCancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  pickerCancelText: {
    fontSize: 13,
    fontWeight: '700',
  },
  pickerBackdropSheet: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  pickerSheetCard: {
    borderTopLeftRadius: radii.outer,
    borderTopRightRadius: radii.outer,
    borderWidth: 1,
    padding: 16,
    paddingBottom: 24,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 6,
  },
  inventoryPickerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 10,
  },
  addBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  addedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  pickerActionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    paddingVertical: 11,
  },
});
