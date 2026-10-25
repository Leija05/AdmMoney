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

// Insumos base calibrados para UNA SOLA GALLETA
const DEFAULT_UNIT_INGREDIENTS: RecipeIngredientItem[] = [
  { name: 'Masa Base & Mantequilla', quantity: 25, unit: 'g', cost: 2.20 },
  { name: 'Chispas de Chocolate Belga', quantity: 15, unit: 'g', cost: 1.80 },
  { name: 'Azúcar & Esencia Vainilla', quantity: 10, unit: 'g', cost: 0.50 },
];

const PRESET_IMAGE_URL = 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500&auto=format&fit=crop&q=60';
const TANDA_PRESETS = [6, 12, 16, 20, 24, 30, 48];

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

  // Tab State
  const [activeTab, setActiveTab] = useState<'recipe' | 'scaler' | 'promos' | 'info'>('recipe');

  // Form Fields (Base = 1 SOLA GALLETA)
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ingredientCost, setIngredientCost] = useState('4.50'); // Insumo para 1 galleta
  const [packagingCost, setPackagingCost] = useState('2.00');   // Empaque para 1 galleta
  const [salePrice, setSalePrice] = useState('35.00');          // Precio de 1 galleta
  const [standardBatchYield, setStandardBatchYield] = useState('16'); // Tanda estándar informativa
  const [simTandaQty, setSimTandaQty] = useState('12');         // Tanda activa en el simulador
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<RecipeIngredientItem[]>([]);

  // Modal helpers
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false);
  const [isIngredientPickerOpen, setIsIngredientPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [selectedCatalogIds, setSelectedCatalogIds] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const screenHeight = Dimensions.get('window').height;
  const modalHeight = Math.round(screenHeight * 0.93);
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

  // Initial population
  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
      if (cookie) {
        setName(cookie.name || '');
        setDescription(cookie.description || '');
        const yieldVal = cookie.batch_yield || 16;
        setStandardBatchYield(String(yieldVal));
        setSimTandaQty(String(yieldVal > 0 ? yieldVal : 12));

        const packCost = typeof cookie.packaging_cost === 'number' ? cookie.packaging_cost : 2.00;
        const rawCost = typeof cookie.cost_per_cookie === 'number'
          ? cookie.cost_per_cookie
          : Math.max(0.5, (cookie.recipe_cost || 6.50) - packCost);

        setIngredientCost(rawCost.toFixed(2));
        setPackagingCost(packCost.toFixed(2));
        setSalePrice(cookie.sale_price ? cookie.sale_price.toFixed(2) : '35.00');

        setImageUri(cookie.image_url || null);
        setIngredients(cookie.ingredients && cookie.ingredients.length > 0 ? [...cookie.ingredients] : [...DEFAULT_UNIT_INGREDIENTS]);
        setActiveTab('recipe');
      } else {
        setName('');
        setDescription('');
        setStandardBatchYield('16');
        setSimTandaQty('12');
        setIngredientCost('4.50');
        setPackagingCost('2.00');
        setSalePrice('35.00');
        setImageUri(null);
        setIngredients([...DEFAULT_UNIT_INGREDIENTS]);
        setActiveTab('recipe');
      }
    }
  }, [visible, cookie]);

  // Derived unit economics (1 SOLA GALLETA)
  const ingCostNum = Math.max(0, parseFloat(ingredientCost) || 0);
  const packCostNum = Math.max(0, parseFloat(packagingCost) || 0);
  const unitCostTotal = ingCostNum + packCostNum;
  const priceNum = Math.max(0, parseFloat(salePrice) || 0);
  const profitPerCookie = priceNum - unitCostTotal;
  const marginPct = priceNum > 0 ? (profitPerCookie / priceNum) * 100 : 0;
  const roiPct = unitCostTotal > 0 ? (profitPerCookie / unitCostTotal) * 100 : 0;

  // Tanda escalador numbers
  const tandaNum = Math.max(1, parseInt(simTandaQty) || 1);
  const tandaBatchCost = unitCostTotal * tandaNum;
  const tandaBatchIngCost = ingCostNum * tandaNum;
  const tandaBatchPackCost = packCostNum * tandaNum;
  const tandaBatchRevenue = priceNum * tandaNum;
  const tandaBatchProfit = profitPerCookie * tandaNum;

  // Standard batch yield (for saving)
  const stdYieldNum = Math.max(1, parseInt(standardBatchYield) || 16);

  // Handlers for unit ingredients
  const handleSumIngredientsToUnitCost = () => {
    if (ingredients.length === 0) return;
    const totalUnitIngCost = ingredients.reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0);
    setIngredientCost(totalUnitIngCost.toFixed(2));
    Alert.alert(
      '¡Costo de 1 Galleta Actualizado!',
      `Costo de insumos para 1 sola galleta: $${totalUnitIngCost.toFixed(2)} MXN\nCosto total con empaque ($${packCostNum.toFixed(2)}): $${(totalUnitIngCost + packCostNum).toFixed(2)} MXN`
    );
  };

  const handleAddCustomIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      {
        name: '',
        quantity: 15,
        unit: 'g',
        cost: 1.50,
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

  const handleToggleCatalogItem = (id: number) => {
    setSelectedCatalogIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddIngredientFromCatalog = (ing: Ingredient) => {
    const isWeight = ing.unit === 'g' || ing.unit === 'ml';
    const defaultQty = isWeight ? 15 : 1;
    const itemCost = Number((defaultQty * (ing.cost_per_unit || 0)).toFixed(2));
    setIngredients((prev) => [
      ...prev,
      {
        name: ing.name,
        quantity: defaultQty,
        unit: ing.unit,
        cost: itemCost > 0 ? itemCost : 1.50,
        ingredient_id: ing.id,
      },
    ]);
    setSelectedCatalogIds((prev) => prev.filter((id) => id !== ing.id));
    setIsIngredientPickerOpen(false);
  };

  const handleAddSelectedFromCatalog = () => {
    if (selectedCatalogIds.length === 0) return;
    const selectedItems = registeredIngredients.filter((i) => selectedCatalogIds.includes(i.id));

    const newEntries: RecipeIngredientItem[] = selectedItems.map((ing) => {
      const isWeight = ing.unit === 'g' || ing.unit === 'ml';
      const defaultQty = isWeight ? 15 : 1;
      const rawCost = Number((defaultQty * (ing.cost_per_unit || 0)).toFixed(2));
      return {
        name: ing.name,
        quantity: defaultQty,
        unit: ing.unit,
        cost: rawCost > 0 ? rawCost : 1.50,
        ingredient_id: ing.id,
      };
    });

    setIngredients((prev) => [...prev, ...newEntries]);
    setSelectedCatalogIds([]);
    setIsIngredientPickerOpen(false);
  };

  const filteredCatalogIngredients = registeredIngredients.filter((i) =>
    i.name.toLowerCase().includes(pickerSearch.toLowerCase())
  );

  const isAllFilteredSelected =
    filteredCatalogIngredients.length > 0 &&
    filteredCatalogIngredients.every((i) => selectedCatalogIds.includes(i.id));

  const handleToggleSelectAll = () => {
    const filteredIds = filteredCatalogIngredients.map((i) => i.id);
    if (isAllFilteredSelected) {
      setSelectedCatalogIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedCatalogIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  // Active promotions
  const activePromos = promotions.filter((p) => {
    if (!p.is_active) return false;
    if (p.target_type === 'all_products') return true;
    if (p.target_type === 'specific_products' && cookie && (p.target_product_ids || []).includes(cookie.id)) return true;
    if (p.target_type === 'category' && p.target_category && cookie?.category === p.target_category) return true;
    return false;
  });

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

  // Save handler
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Nombre Obligatorio', 'Por favor ingresa el nombre de la galleta.');
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
        batch_yield: stdYieldNum,
        packaging_cost: packCostNum,
        cost_per_cookie: ingCostNum,
        recipe_cost: unitCostTotal,
        profit_per_unit: profitPerCookie,
        profit_margin_pct: marginPct,
        is_unit_recipe: true,
        image_url: imageUri || (cookie?.image_url || PRESET_IMAGE_URL),
        ingredients: ingredients.filter((i) => i.name.trim().length > 0),
      };

      if (cookie && (onUpdate || onUpdateCookie)) {
        const updater = onUpdate || onUpdateCookie!;
        await updater(cookie.id, payload);
        Alert.alert('¡Receta Guardada!', `Se actualizó la receta de ${name}.`);
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
              backgroundColor: isDark ? '#161A24' : '#FFFFFF',
              borderColor: isDark ? '#2B3448' : '#E2E8F0',
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
                  {isEditing ? `Editar Receta: ${name || 'Galleta'}` : 'Nueva Receta de Galleta'}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  Cantidades para 1 sola galleta + escalador simultáneo de tandas
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

          {/* Subtabs Scrollable Row with ample breathing room */}
          <View style={[styles.tabsWrapper, { borderBottomColor: colors.borderSubtle }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsScrollContent}
            >
              {[
                { id: 'recipe', label: '1 Galleta (Receta Base)', icon: 'cafe' },
                { id: 'scaler', label: `Escalador de Tandas (${tandaNum} pzas)`, icon: 'calculator' },
                { id: 'promos', label: `Promociones (${activePromos.length})`, icon: 'pricetag' },
                { id: 'info', label: 'Foto & Presentación', icon: 'image' },
              ].map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    onPress={() => setActiveTab(tab.id as any)}
                    style={[
                      styles.tabPill,
                      active && {
                        backgroundColor: colors.amberBg,
                        borderColor: colors.amberBorder,
                      },
                      !active && {
                        backgroundColor: colors.bgTertiary,
                        borderColor: colors.borderSubtle,
                      },
                    ]}
                  >
                    <Ionicons
                      name={tab.icon as any}
                      size={13}
                      color={active ? colors.amberLight : colors.textDim}
                    />
                    <Text
                      style={[
                        styles.tabPillText,
                        { color: active ? colors.amberLight : colors.textMuted },
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            {/* TAB 1: RECETA BASE (1 SOLA GALLETA) */}
            {activeTab === 'recipe' && (
              <View>
                {/* Visual Unit Economics Live Summary Box (1 SOLA GALLETA) */}
                <View style={[styles.summaryCard, { backgroundColor: isDark ? '#1C2230' : '#F8FAFC', borderColor: colors.borderSubtle }]}>
                  <View style={styles.summaryCardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="sparkles" size={14} color={colors.amberLight} />
                      <Text style={[styles.summaryCardTitle, { color: colors.textMain }]}>
                        Estructura de 1 Sola Galleta
                      </Text>
                    </View>
                    <Badge
                      label={`${marginPct.toFixed(1)}% Margen`}
                      variant={marginPct >= 60 ? 'emerald' : 'amber'}
                    />
                  </View>

                  <View style={styles.bentoMetricsGrid}>
                    <View style={styles.bentoCol}>
                      <Text style={[styles.bentoLabel, { color: colors.textDim }]}>Costo 1 Galleta</Text>
                      <Text style={[styles.bentoVal, { color: colors.roseLight }]}>
                        ${unitCostTotal.toFixed(2)}
                      </Text>
                      <Text style={[styles.bentoSub, { color: colors.textDim }]}>
                        ${ingCostNum.toFixed(1)} ins + ${packCostNum.toFixed(1)} emp
                      </Text>
                    </View>

                    <View style={[styles.bentoDivider, { backgroundColor: colors.borderSubtle }]} />

                    <View style={styles.bentoCol}>
                      <Text style={[styles.bentoLabel, { color: colors.textDim }]}>Precio Venta</Text>
                      <Text style={[styles.bentoVal, { color: colors.amberLight }]}>
                        ${priceNum.toFixed(2)}
                      </Text>
                      <Text style={[styles.bentoSub, { color: colors.textDim }]}>individual</Text>
                    </View>

                    <View style={[styles.bentoDivider, { backgroundColor: colors.borderSubtle }]} />

                    <View style={styles.bentoCol}>
                      <Text style={[styles.bentoLabel, { color: colors.textDim }]}>Ganas x Galleta</Text>
                      <Text style={[styles.bentoVal, { color: colors.emeraldLight }]}>
                        +${profitPerCookie.toFixed(2)}
                      </Text>
                      <Text style={[styles.bentoSub, { color: colors.emeraldLight, fontWeight: '700' }]}>
                        neta libre
                      </Text>
                    </View>
                  </View>
                </View>

                {/* NOMBRE DE LA GALLETA */}
                <Text style={[styles.inputLabel, { color: colors.textDim, marginTop: 14 }]}>
                  Nombre Comercial de la Galleta *
                </Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, color: colors.textMain }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Ej. Chispas Clásicas NY"
                  placeholderTextColor={colors.textDim}
                />

                {/* INGREDIENTES PARA 1 SOLA GALLETA */}
                <View style={styles.sectionHeaderRow}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={[styles.sectionHeading, { color: colors.textMain }]}>
                      Insumos para Hornear 1 Sola Galleta
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textDim, marginTop: 1 }}>
                      Ingresa los gramos o piezas exactas que lleva 1 sola galleta
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6, flexShrink: 0 }}>
                    <TouchableOpacity
                      onPress={handleAddCustomIngredient}
                      style={[styles.smallBtn, { borderColor: colors.borderSubtle, backgroundColor: colors.bgTertiary }]}
                    >
                      <Ionicons name="add" size={13} color={colors.textMain} />
                      <Text style={[styles.smallBtnText, { color: colors.textMain }]}>Manual</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setIsIngredientPickerOpen(true)}
                      style={[styles.smallBtn, { borderColor: colors.amberBorder, backgroundColor: colors.amberBg }]}
                    >
                      <Ionicons name="nutrition" size={13} color={colors.amberLight} />
                      <Text style={[styles.smallBtnText, { color: colors.amberLight }]}>Catálogo</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* CARDS DE CADA INGREDIENTE UNITARIO */}
                {ingredients.map((item, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.ingCard,
                      { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle },
                    ]}
                  >
                    {/* Fila Superior: Nombre del ingrediente en ancho completo para evitar que se corte */}
                    <View style={styles.ingCardTopRow}>
                      <TextInput
                        style={[styles.ingNameInput, { color: colors.textMain }]}
                        value={item.name}
                        onChangeText={(t) => handleUpdateIngredient(idx, 'name', t)}
                        placeholder="Nombre insumo (ej. Harina, Mantequilla)"
                        placeholderTextColor={colors.textDim}
                        autoCapitalize="words"
                      />
                      <TouchableOpacity
                        onPress={() => handleRemoveIngredient(idx)}
                        style={styles.ingTrashBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.roseLight} />
                      </TouchableOpacity>
                    </View>

                    {/* Fila Inferior: 3 columnas perfectamente alineadas */}
                    <View style={styles.ingCardBottomRow}>
                      <View style={{ flex: 1.1, marginRight: 8 }}>
                        <Text style={[styles.ingMiniLabel, { color: colors.textDim }]}>Cant x 1 Galleta</Text>
                        <TextInput
                          style={[styles.ingMiniInput, { color: colors.textMain, backgroundColor: isDark ? '#1C2230' : '#FFFFFF', borderColor: colors.borderSubtle }]}
                          value={String(item.quantity)}
                          onChangeText={(t) => handleUpdateIngredient(idx, 'quantity', parseFloat(t) || 0)}
                          keyboardType="numeric"
                          placeholder="15"
                          placeholderTextColor={colors.textDim}
                        />
                      </View>

                      <View style={{ width: 62, marginRight: 8 }}>
                        <Text style={[styles.ingMiniLabel, { color: colors.textDim }]}>Unidad</Text>
                        <TextInput
                          style={[styles.ingMiniInput, { color: colors.textDim, backgroundColor: isDark ? '#1C2230' : '#FFFFFF', borderColor: colors.borderSubtle, textAlign: 'center' }]}
                          value={item.unit}
                          onChangeText={(t) => handleUpdateIngredient(idx, 'unit', t)}
                          placeholder="g"
                          placeholderTextColor={colors.textDim}
                        />
                      </View>

                      <View style={{ flex: 1.1 }}>
                        <Text style={[styles.ingMiniLabel, { color: colors.textDim }]}>Costo x 1 Galleta</Text>
                        <TextInput
                          style={[styles.ingMiniInput, { color: colors.roseLight, backgroundColor: isDark ? '#1C2230' : '#FFFFFF', borderColor: colors.borderSubtle, fontWeight: '800' }]}
                          value={String(item.cost)}
                          onChangeText={(t) => handleUpdateIngredient(idx, 'cost', parseFloat(t) || 0)}
                          keyboardType="numeric"
                          placeholder="$0.00"
                          placeholderTextColor={colors.textDim}
                        />
                      </View>
                    </View>
                  </View>
                ))}

                {/* BOTÓN PARA RECALCULAR DESDE INSUMOS */}
                <TouchableOpacity
                  onPress={handleSumIngredientsToUnitCost}
                  style={[styles.recalcBtn, { backgroundColor: colors.brandGlow, borderColor: colors.brandBorder }]}
                >
                  <Ionicons name="calculator" size={15} color={colors.brandLight} />
                  <Text style={[styles.recalcBtnText, { color: colors.brandLight }]}>
                    Sumar insumos al costo de 1 galleta (${ingredients.reduce((a, b) => a + (Number(b.cost) || 0), 0).toFixed(2)} MXN)
                  </Text>
                </TouchableOpacity>

                {/* COSTOS INDIVIDUALES & PRECIO DE VENTA */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLabel, { color: colors.textDim }]}>Insumo x Galleta ($ MXN)</Text>
                    <TextInput
                      style={[styles.inputField, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, color: colors.textMain }]}
                      value={ingredientCost}
                      onChangeText={setIngredientCost}
                      keyboardType="numeric"
                      placeholder="4.50"
                      placeholderTextColor={colors.textDim}
                    />
                    <Text style={{ fontSize: 10, color: colors.textDim, marginTop: 2 }}>Masa cruda unitaria</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLabel, { color: colors.textDim }]}>Empaque x Galleta ($ MXN)</Text>
                    <TextInput
                      style={[styles.inputField, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, color: colors.textMain }]}
                      value={packagingCost}
                      onChangeText={setPackagingCost}
                      keyboardType="numeric"
                      placeholder="2.00"
                      placeholderTextColor={colors.textDim}
                    />
                    <Text style={{ fontSize: 10, color: colors.textDim, marginTop: 2 }}>Bolsa individual, sticker</Text>
                  </View>
                </View>

                {/* PRECIO DE VENTA INDIVIDUAL */}
                <View style={{ marginTop: 10 }}>
                  <Text style={[styles.inputLabel, { color: colors.textDim }]}>Precio Venta Individual ($ MXN) *</Text>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, color: colors.amberLight, fontWeight: '900', fontSize: 16 }]}
                    value={salePrice}
                    onChangeText={setSalePrice}
                    keyboardType="numeric"
                    placeholder="35.00"
                    placeholderTextColor={colors.textDim}
                  />
                  <Text style={{ fontSize: 10.5, color: colors.textDim, marginTop: 3 }}>
                    Ganas +${profitPerCookie.toFixed(2)} MXN limpios por cada pieza vendida ({marginPct.toFixed(1)}% margen, {roiPct.toFixed(1)}% rendimiento).
                  </Text>
                </View>

                {/* TANDA ESTÁNDAR SUGERIDA DEL CATÁLOGO */}
                <View style={{ marginTop: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.inputLabel, { color: colors.textDim, marginBottom: 0 }]}>
                      Tanda Estándar Sugerida para el Catálogo
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.amberLight }}>
                      {stdYieldNum} piezas
                    </Text>
                  </View>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, color: colors.textMain, marginTop: 5 }]}
                    value={standardBatchYield}
                    onChangeText={setStandardBatchYield}
                    keyboardType="numeric"
                    placeholder="16"
                    placeholderTextColor={colors.textDim}
                  />
                  <Text style={{ fontSize: 10.5, color: colors.textDim, marginTop: 2 }}>
                    Se usará como referencia predeterminada en tu catálogo. Puedes escalarla libremente en la pestaña 'Escalador de Tandas'.
                  </Text>
                </View>
              </View>
            )}

            {/* TAB 2: ESCALADOR DE TANDAS (INTERACTIVO Y SIMULTÁNEO) */}
            {activeTab === 'scaler' && (
              <View>
                <View style={styles.scalerIntroBox}>
                  <Text style={[styles.sectionHeading, { color: colors.textMain }]}>
                    Calculador Simultáneo de Tandas
                  </Text>
                  <Text style={{ fontSize: 11.5, color: colors.textDim, marginTop: 2, lineHeight: 16 }}>
                    Basado en la receta de 1 galleta, elige cualquier tanda a hornear y visualiza al instante los insumos a pesar en tu tazón y la ganancia del lote.
                  </Text>
                </View>

                {/* SELECTOR INTERACTIVO DE TANDA */}
                <View style={[styles.scalerControlCard, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={[styles.scalerControlLabel, { color: colors.textMain }]}>
                      Tanda a Hornear (Piezas):
                    </Text>
                    <TextInput
                      style={[styles.scalerNumInput, { color: colors.amberLight, borderColor: colors.amberBorder, backgroundColor: isDark ? '#1C2230' : '#FFFFFF' }]}
                      value={simTandaQty}
                      onChangeText={setSimTandaQty}
                      keyboardType="numeric"
                      placeholder="12"
                      placeholderTextColor={colors.textDim}
                    />
                  </View>

                  {/* PRESET CHIPS */}
                  <View style={styles.chipGrid}>
                    {TANDA_PRESETS.map((preset) => {
                      const selected = tandaNum === preset;
                      return (
                        <TouchableOpacity
                          key={preset}
                          onPress={() => setSimTandaQty(String(preset))}
                          style={[
                            styles.chipButton,
                            {
                              backgroundColor: selected ? colors.amberBg : (isDark ? '#1C2230' : '#FFFFFF'),
                              borderColor: selected ? colors.amberBorder : colors.borderSubtle,
                            },
                          ]}
                        >
                          <Text style={[styles.chipButtonText, { color: selected ? colors.amberLight : colors.textMuted }]}>
                            {preset} pzas
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* RESUMEN FINANCIERO DE LA TANDA ESCALADA */}
                <View style={[styles.scalerFinancialCard, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : '#ECFDF5', borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : '#A7F3D0' }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: isDark ? '#34D399' : '#047857' }}>
                      Meta de la Tanda ({tandaNum} Galletas)
                    </Text>
                    <Text style={{ fontSize: 15, fontWeight: '900', color: isDark ? '#34D399' : '#047857' }}>
                      +${tandaBatchProfit.toFixed(2)} MXN
                    </Text>
                  </View>

                  <View style={{ height: 1, backgroundColor: isDark ? 'rgba(52, 211, 153, 0.2)' : '#A7F3D0', marginVertical: 8 }} />

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View>
                      <Text style={{ fontSize: 10, color: colors.textDim, textTransform: 'uppercase' }}>Inversión en Masa</Text>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: colors.roseLight }}>${tandaBatchIngCost.toFixed(2)}</Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 10, color: colors.textDim, textTransform: 'uppercase' }}>Empaques ({tandaNum} pzas)</Text>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: colors.amberLight }}>${tandaBatchPackCost.toFixed(2)}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 10, color: colors.textDim, textTransform: 'uppercase' }}>Cobras al Venderla</Text>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textMain }}>${tandaBatchRevenue.toFixed(2)}</Text>
                    </View>
                  </View>
                </View>

                {/* CANTIDADES EXACTAS A PESAR PARA ESTA TANDA */}
                <View style={{ marginTop: 14 }}>
                  <Text style={[styles.sectionHeading, { color: colors.textMain }]}>
                    Cantidades Exactas a Pesar para {tandaNum} Galletas:
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textDim, marginBottom: 8 }}>
                    Pesos directos calculados multiplicando la receta unitaria x {tandaNum} piezas:
                  </Text>

                  {ingredients.map((ing, idx) => {
                    const totalGrams = (ing.quantity * tandaNum).toFixed(1);
                    const totalCostIng = (ing.cost * tandaNum).toFixed(2);
                    return (
                      <View
                        key={idx}
                        style={[
                          styles.scalerIngRow,
                          { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle },
                        ]}
                      >
                        <View style={{ flex: 1, paddingRight: 6 }}>
                          <Text style={[styles.scalerIngName, { color: colors.textMain }]}>
                            {ing.name || `Insumo #${idx + 1}`}
                          </Text>
                          <Text style={{ fontSize: 10.5, color: colors.textDim }}>
                            Base: {ing.quantity} {ing.unit} x 1 galleta
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={[styles.scalerIngQtyHighlight, { color: colors.amberLight }]}>
                            {totalGrams} {ing.unit}
                          </Text>
                          <Text style={{ fontSize: 10.5, color: colors.roseLight }}>
                            ${totalCostIng} MXN
                          </Text>
                        </View>
                      </View>
                    );
                  })}

                  {/* EMPAQUES TOTALES PARA ESTA TANDA */}
                  <View style={[styles.scalerIngRow, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, marginTop: 4 }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.scalerIngName, { color: colors.textMain }]}>
                        Empaques Individuales
                      </Text>
                      <Text style={{ fontSize: 10.5, color: colors.textDim }}>
                        Base: 1 empaque ($${packCostNum.toFixed(2)}) x galleta
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.scalerIngQtyHighlight, { color: colors.emeraldLight }]}>
                        {tandaNum} piezas
                      </Text>
                      <Text style={{ fontSize: 10.5, color: colors.roseLight }}>
                        ${tandaBatchPackCost.toFixed(2)} MXN
                      </Text>
                    </View>
                  </View>

                  {/* BOTÓN PARA ESTABLECER COMO TANDA ESTÁNDAR */}
                  <TouchableOpacity
                    onPress={() => {
                      setStandardBatchYield(String(tandaNum));
                      Alert.alert(
                        '¡Tanda Fijada!',
                        `Se guardará ${tandaNum} piezas como la tanda estándar sugerida para esta galleta en tu catálogo.`
                      );
                    }}
                    style={[styles.saveAsStdBtn, { backgroundColor: colors.amberBg, borderColor: colors.amberBorder }]}
                  >
                    <Ionicons name="bookmark" size={14} color={colors.amberLight} />
                    <Text style={[styles.saveAsStdBtnText, { color: colors.amberLight }]}>
                      Fijar {tandaNum} pzas como Tanda Estándar del Catálogo
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* TAB 3: PROMOTIONS SIMULATOR */}
            {activeTab === 'promos' && (
              <View>
                <View style={styles.scalerIntroBox}>
                  <Text style={[styles.sectionHeading, { color: colors.textMain }]}>
                    Simulador de Promociones & Ofertas
                  </Text>
                  <Text style={{ fontSize: 11.5, color: colors.textDim, marginTop: 2, lineHeight: 16 }}>
                    Revisa cuánto ganas vendiendo al precio regular de 1 galleta vs las promociones activas creadas en tu app.
                  </Text>
                </View>

                {/* VENTA ESTÁNDAR REGULAR */}
                <View style={[styles.promoCard, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}>
                  <View style={styles.promoCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.promoCardTitle, { color: colors.textMain }]}>
                        Venta Estándar Regular
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.textDim }}>
                        1 pieza a precio de lista
                      </Text>
                    </View>
                    <Badge label={`$${priceNum.toFixed(2)} c/u`} variant="amber" />
                  </View>
                  <View style={styles.promoDivider} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View>
                      <Text style={styles.promoSubLabel}>Costo c/empaque</Text>
                      <Text style={[styles.promoSubVal, { color: colors.roseLight }]}>-${unitCostTotal.toFixed(2)}</Text>
                    </View>
                    <View>
                      <Text style={styles.promoSubLabel}>Ganas x Galleta</Text>
                      <Text style={[styles.promoSubVal, { color: colors.emeraldLight }]}>+${profitPerCookie.toFixed(2)}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.promoSubLabel}>Tanda {stdYieldNum} pzas</Text>
                      <Text style={[styles.promoSubVal, { color: colors.emeraldLight }]}>+${(profitPerCookie * stdYieldNum).toFixed(2)}</Text>
                    </View>
                  </View>
                </View>

                {/* DYNAMIC PROMOTIONS FROM DATABASE */}
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

                    const combosInBatch = Math.floor(stdYieldNum / qty);
                    const remainder = stdYieldNum % qty;
                    const batchRevPromo = (combosInBatch * promoRevenue) + (remainder * priceNum);
                    const batchProfitPromo = batchRevPromo - (unitCostTotal * stdYieldNum);

                    return (
                      <View
                        key={promo.id || idx}
                        style={[
                          styles.promoCard,
                          {
                            backgroundColor: colors.bgTertiary,
                            borderColor: colors.purpleBorder,
                            marginTop: 10,
                          },
                        ]}
                      >
                        <View style={styles.promoCardHeader}>
                          <View style={{ flex: 1, paddingRight: 6 }}>
                            <Text style={[styles.promoCardTitle, { color: colors.textMain }]}>
                              {promo.name}
                            </Text>
                            <Text style={{ fontSize: 11, color: colors.purpleLight, marginTop: 1 }}>
                              {qty} pzas x ${promoRevenue.toFixed(2)} MXN • {promo.badge_text}
                            </Text>
                          </View>
                          <Badge label={`${promoMargin.toFixed(1)}% Margen`} variant="purple" />
                        </View>
                        <View style={styles.promoDivider} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <View>
                            <Text style={styles.promoSubLabel}>Costo Combo</Text>
                            <Text style={[styles.promoSubVal, { color: colors.roseLight }]}>-${promoCost.toFixed(2)}</Text>
                          </View>
                          <View>
                            <Text style={styles.promoSubLabel}>Ganas x Combo</Text>
                            <Text style={[styles.promoSubVal, { color: colors.emeraldLight }]}>+${promoProfit.toFixed(2)}</Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.promoSubLabel}>Tanda {stdYieldNum} pzas</Text>
                            <Text style={[styles.promoSubVal, { color: colors.purpleLight }]}>+${batchProfitPromo.toFixed(2)}</Text>
                          </View>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <View style={[styles.emptyBox, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, marginTop: 10 }]}>
                    <Ionicons name="pricetag-outline" size={28} color={colors.textDim} />
                    <Text style={[styles.emptyBoxTitle, { color: colors.textMain }]}>Sin Promociones Activas</Text>
                    <Text style={[styles.emptyBoxSub, { color: colors.textDim }]}>
                      Crea promociones como '3 x $90' o '15% OFF' en la subpestaña 'Promos' para ver aquí su ganancia por tanda.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* TAB 4: PHOTO & DETAILS */}
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
                      Toma una foto o selecciona de tu galería para la presentación ante clientes.
                    </Text>
                  </View>
                </View>

                <Text style={[styles.inputLabel, { color: colors.textDim, marginTop: 14 }]}>Descripción / Presentación</Text>
                <TextInput
                  style={[styles.inputField, styles.textArea, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, color: colors.textMain }]}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  placeholder="Ej. Masa suave elaborada con mantequilla artesanal y abundante chocolate belga al 50%."
                  placeholderTextColor={colors.textDim}
                />
              </View>
            )}
          </ScrollView>

          {/* Bottom Action Footer */}
          <View style={[styles.footer, { borderTopColor: colors.borderSubtle, backgroundColor: isDark ? '#161A24' : '#FFFFFF' }]}>
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

      {/* PHOTO SELECTION MODAL */}
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

      {/* INGREDIENT PICKER MODAL (MULTI-SELECTION & SINGLE QUICK-ADD) */}
      <Modal
        visible={isIngredientPickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setIsIngredientPickerOpen(false);
          setSelectedCatalogIds([]);
        }}
      >
        <View style={styles.backdrop}>
          <View style={[styles.pickerDialog, { backgroundColor: isDark ? '#1C202A' : '#FFFFFF', borderColor: colors.borderSubtle }]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[styles.title, { color: colors.textMain }]}>Insumos del Catálogo</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  Selecciona uno o varios insumos para tu receta
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setIsIngredientPickerOpen(false);
                  setSelectedCatalogIds([]);
                }}
                style={[styles.closeCircle, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
              >
                <Ionicons name="close" size={18} color={colors.textMain} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
              <View style={[styles.searchContainer, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}>
                <Ionicons name="search" size={16} color={colors.textDim} style={{ marginLeft: 10 }} />
                <TextInput
                  style={[styles.searchInput, { color: colors.textMain }]}
                  value={pickerSearch}
                  onChangeText={setPickerSearch}
                  placeholder="Buscar insumo (ej. Harina, Mantequilla)..."
                  placeholderTextColor={colors.textDim}
                />
                {pickerSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setPickerSearch('')} style={{ padding: 6 }}>
                    <Ionicons name="close-circle" size={16} color={colors.textDim} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Action bar: count & select all toggle */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <Text style={{ fontSize: 11.5, fontWeight: '700', color: colors.textDim }}>
                  {filteredCatalogIngredients.length} insumos registrados
                </Text>
                <TouchableOpacity
                  onPress={handleToggleSelectAll}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 2 }}
                >
                  <Ionicons
                    name={isAllFilteredSelected ? "checkbox" : "square-outline"}
                    size={16}
                    color={colors.amberLight}
                  />
                  <Text style={{ fontSize: 11.5, fontWeight: '700', color: colors.amberLight }}>
                    {isAllFilteredSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* List */}
            <FlatList
              data={filteredCatalogIngredients}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => {
                const isSelected = selectedCatalogIds.includes(item.id);
                const isAlreadyInRecipe = ingredients.some(
                  (i) => i.name.toLowerCase().trim() === item.name.toLowerCase().trim()
                );

                return (
                  <TouchableOpacity
                    style={[
                      styles.pickerItem,
                      {
                        borderBottomColor: colors.borderSubtle,
                        backgroundColor: isSelected ? (isDark ? 'rgba(245, 158, 11, 0.12)' : '#FEF3C7') : 'transparent',
                        paddingHorizontal: 16,
                      },
                    ]}
                    onPress={() => handleToggleCatalogItem(item.id)}
                    activeOpacity={0.7}
                  >
                    {/* Checkbox */}
                    <View
                      style={[
                        styles.checkboxWrap,
                        {
                          backgroundColor: isSelected ? colors.brand : (isDark ? '#252C3D' : '#F1F5F9'),
                          borderColor: isSelected ? colors.brand : colors.borderSubtle,
                        },
                      ]}
                    >
                      {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                    </View>

                    {/* Info */}
                    <View style={{ flex: 1, paddingHorizontal: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.pickerItemName, { color: colors.textMain }]}>{item.name}</Text>
                        {isAlreadyInRecipe && (
                          <Badge label="En receta" variant="gray" />
                        )}
                      </View>
                      <Text style={{ fontSize: 11, color: colors.textDim, marginTop: 1 }}>
                        ${item.cost_per_unit.toFixed(4)} MXN / {item.unit} • Stock: {item.stock_quantity} {item.unit}
                      </Text>
                    </View>

                    {/* Quick Single Add button */}
                    <TouchableOpacity
                      onPress={() => handleAddIngredientFromCatalog(item)}
                      style={[
                        styles.quickAddBtn,
                        { backgroundColor: isDark ? '#252D3E' : '#F1F5F9', borderColor: colors.borderSubtle },
                      ]}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="add" size={14} color={colors.amberLight} />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.amberLight }}>Solo Este</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={{ paddingBottom: 20 }}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                  <Ionicons name="basket-outline" size={32} color={colors.textDim} />
                  <Text style={{ fontSize: 13, color: colors.textDim, marginTop: 6 }}>
                    No se encontraron insumos con "{pickerSearch}"
                  </Text>
                </View>
              }
            />

            {/* Bottom Multi-Select Confirm Bar */}
            <View style={[styles.pickerFooter, { borderTopColor: colors.borderSubtle, backgroundColor: isDark ? '#161A24' : '#FFFFFF' }]}>
              <Button
                title="Cerrar"
                variant="secondary"
                onPress={() => {
                  setIsIngredientPickerOpen(false);
                  setSelectedCatalogIds([]);
                }}
                style={{ flex: 1 }}
              />
              <Button
                title={
                  selectedCatalogIds.length === 0
                    ? 'Selecciona Insumos'
                    : selectedCatalogIds.length === 1
                    ? 'Agregar 1 Insumo'
                    : `Agregar (${selectedCatalogIds.length}) Insumos`
                }
                variant="amber"
                onPress={handleAddSelectedFromCatalog}
                style={{ flex: 2 }}
                disabled={selectedCatalogIds.length === 0}
                icon={<Ionicons name="checkmark-done" size={18} color="#FFFFFF" />}
              />
            </View>
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
    paddingVertical: 8,
  },
  title: {
    fontSize: 16.5,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
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
  tabsWrapper: {
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  tabsScrollView: {
    paddingHorizontal: 14,
  },
  tabsScrollContent: {
    paddingHorizontal: 14,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tabPillText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  summaryCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: 12,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryCardTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  bentoMetricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bentoCol: {
    flex: 1,
    alignItems: 'center',
  },
  bentoLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  bentoVal: {
    fontSize: 16,
    fontWeight: '900',
    marginVertical: 1,
  },
  bentoSub: {
    fontSize: 8.5,
  },
  bentoDivider: {
    width: 1,
    height: 30,
  },
  inputLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  inputField: {
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13.5,
  },
  textArea: {
    height: 64,
    textAlignVertical: 'top',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  sectionHeading: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  smallBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  ingCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8,
  },
  ingCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ingNameInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    paddingVertical: 2,
    paddingHorizontal: 0,
    marginRight: 8,
  },
  ingTrashBtn: {
    padding: 3,
  },
  ingCardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ingMiniLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  ingMiniInput: {
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 12,
  },
  recalcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingVertical: 9,
    marginTop: 4,
  },
  recalcBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  scalerIntroBox: {
    marginBottom: 10,
  },
  scalerControlCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  scalerControlLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  scalerNumInput: {
    width: 65,
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  chipGrid: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  chipButton: {
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  chipButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scalerFinancialCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  scalerIngRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
  },
  scalerIngName: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  scalerIngQtyHighlight: {
    fontSize: 13,
    fontWeight: '800',
  },
  saveAsStdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingVertical: 10,
    marginTop: 12,
  },
  saveAsStdBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  promoCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: 12,
  },
  promoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promoCardTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  promoDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 8,
  },
  promoSubLabel: {
    fontSize: 9.5,
    color: '#94A3B8',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  promoSubVal: {
    fontSize: 13.5,
    fontWeight: '800',
    marginTop: 2,
  },
  emptyBox: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  emptyBoxTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    marginTop: 6,
  },
  emptyBoxSub: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 15,
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
    height: '82%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    paddingRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 42,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
  },
  pickerItemName: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  checkboxWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  pickerFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
});
