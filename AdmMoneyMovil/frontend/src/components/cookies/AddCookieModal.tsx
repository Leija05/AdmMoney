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
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../ui/Button';
import { colors, useThemeColors, radii, spacing } from '../../theme';
import { CookieProduct, RecipeIngredientItem, Ingredient } from '../../lib/types';
import { useAppStore } from '../../stores/app.store';
import { Ionicons } from '@expo/vector-icons';

interface AddCookieModalProps {
  visible: boolean;
  onClose: () => void;
  onAddCookie: (data: Partial<CookieProduct>) => Promise<any>;
}

export const AddCookieModal: React.FC<AddCookieModalProps> = ({
  visible,
  onClose,
  onAddCookie,
}) => {
  const colors = useThemeColors();
  const isDark = colors.isDark;
  const registeredIngredients = useAppStore((state) => state.ingredients);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [salePrice, setSalePrice] = useState('35.00');
  const [recipeCost, setRecipeCost] = useState('9.67');
  const [batchYield, setBatchYield] = useState('16');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [showManualUrl, setShowManualUrl] = useState(false);
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false);
  const [isIngredientPickerOpen, setIsIngredientPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredientItem[]>([
    { name: 'Masa Base & Mantequilla', quantity: 200, unit: 'g', cost: 4.80 },
    { name: 'Chispas de Chocolate', quantity: 150, unit: 'g', cost: 2.90 },
    { name: 'Empaque Individual Kraft', quantity: 1, unit: 'pza', cost: 1.97 },
  ]);
  const [isSaving, setIsSaving] = useState(false);

  const screenHeight = Dimensions.get('window').height;
  const modalHeight = Math.round(screenHeight * 0.90);
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
    }
  }, [visible]);

  // Recalculates unit recipe cost from ingredient list + packaging
  const recalculateFromIngredients = (list: RecipeIngredientItem[], currentYield: string) => {
    const totalIngredientsCost = list.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
    const yieldCount = parseInt(currentYield, 10) || 16;
    const costPerPiece = yieldCount > 0 ? totalIngredientsCost / yieldCount : 0;
    const finalUnitCost = Number((costPerPiece + 2.90).toFixed(2));
    if (list.length > 0) {
      setRecipeCost(finalUnitCost > 0 ? String(finalUnitCost) : '9.67');
    }
  };

  const handleAddFromInventory = (ing: Ingredient) => {
    const alreadyExists = recipeIngredients.some(
      (item) => item.ingredient_id === ing.id || item.name.toLowerCase().trim() === ing.name.toLowerCase().trim()
    );
    if (alreadyExists) {
      Alert.alert('Insumo ya en Receta', `"${ing.name}" ya está seleccionado.`);
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

    const nextList = [...recipeIngredients, newItem];
    setRecipeIngredients(nextList);
    recalculateFromIngredients(nextList, batchYield);
  };

  const handleAddCustomIngredient = () => {
    const newItem: RecipeIngredientItem = {
      name: `Insumo Especial ${recipeIngredients.length + 1}`,
      quantity: 100,
      unit: 'g',
      cost: 3.50,
    };
    const nextList = [...recipeIngredients, newItem];
    setRecipeIngredients(nextList);
    recalculateFromIngredients(nextList, batchYield);
  };

  const handleUpdateRecipeIngredient = (
    index: number,
    field: 'name' | 'quantity' | 'unit' | 'cost',
    value: string | number
  ) => {
    const nextList = [...recipeIngredients];
    const item = { ...nextList[index] };

    if (field === 'quantity') {
      const qNum = typeof value === 'string' ? parseFloat(value) || 0 : value;
      item.quantity = qNum;
      if (item.ingredient_id) {
        const match = registeredIngredients.find((i) => i.id === item.ingredient_id);
        if (match) {
          const unitRate = match.cost_per_unit || (match.package_quantity > 0 ? match.package_cost / match.package_quantity : 0);
          item.cost = Number((qNum * unitRate).toFixed(2));
        }
      }
    } else if (field === 'cost') {
      const cNum = typeof value === 'string' ? parseFloat(value) || 0 : value;
      item.cost = cNum;
    } else if (field === 'name') {
      item.name = String(value);
    } else if (field === 'unit') {
      item.unit = String(value);
    }

    nextList[index] = item;
    setRecipeIngredients(nextList);
    recalculateFromIngredients(nextList, batchYield);
  };

  const handleRemoveRecipeIngredient = (index: number) => {
    const nextList = [...recipeIngredients];
    nextList.splice(index, 1);
    setRecipeIngredients(nextList);
    recalculateFromIngredients(nextList, batchYield);
  };

  // Swipe-down-to-dismiss gesture on header & drag handle
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

  const priceNum = parseFloat(salePrice) || 0;
  const costNum = parseFloat(recipeCost) || 0;
  const profitNum = Math.max(0, priceNum - costNum);
  const marginPct = priceNum > 0 ? (profitNum / priceNum) * 100 : 0;
  const roiPct = costNum > 0 ? (profitNum / costNum) * 100 : 0;

  const handlePickFromCamera = async () => {
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
        Alert.alert(
          'Permiso Requerido',
          'Se necesita permiso para acceder a tus fotos y seleccionar la imagen de la galleta.'
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
        setImageUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'No se pudo abrir la galería.');
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Nombre Requerido', 'Por favor ingresa el nombre de la receta de galleta.');
      return;
    }
    if (priceNum <= 0) {
      Alert.alert('Precio Inválido', 'El precio de venta debe ser mayor a 0.');
      return;
    }

    const finalImageUrl =
      imageUri ||
      imageUrl.trim() ||
      'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80';

    try {
      setIsSaving(true);
      await onAddCookie({
        name: name.trim(),
        description: description.trim() || 'Receta artesanal recién horneada.',
        sale_price: priceNum,
        recipe_cost: costNum,
        batch_yield: parseInt(batchYield, 10) || 16,
        image_url: finalImageUrl,
        profit_per_unit: profitNum,
        profit_margin_pct: marginPct,
        ingredients: recipeIngredients.length > 0 ? recipeIngredients : [
          { name: 'Masa Base & Mantequilla', quantity: 200, unit: 'g', cost: Number((costNum * 0.5).toFixed(2)) },
          { name: 'Insumos Clave & Chispas', quantity: 150, unit: 'g', cost: Number((costNum * 0.3).toFixed(2)) },
          { name: 'Empaque Individual Kraft', quantity: 1, unit: 'pza', cost: 2.90 },
        ],
      });

      setName('');
      setDescription('');
      setSalePrice('35.00');
      setRecipeCost('9.67');
      setImageUri(null);
      setImageUrl('');
      setRecipeIngredients([
        { name: 'Masa Base & Mantequilla', quantity: 200, unit: 'g', cost: 4.80 },
        { name: 'Chispas de Chocolate', quantity: 150, unit: 'g', cost: 2.90 },
        { name: 'Empaque Individual Kraft', quantity: 1, unit: 'pza', cost: 1.97 },
      ]);
      setIsSaving(false);
      onClose();
      Alert.alert('¡Receta Creada!', `La receta "${name}" ha sido agregada con un margen del ${marginPct.toFixed(2)}%.`);
    } catch {
      setIsSaving(false);
      Alert.alert('Error', 'No se pudo guardar la receta.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
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
                <Text style={[styles.headerEyebrow, { color: colors.amberLight }]}>Nueva Creación</Text>
                <Text style={[styles.headerTitle, { color: isDark ? '#F1F3F7' : '#181A1F' }]}>
                  Crear Receta de Galleta
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
            {/* Foto de la Galleta (Cámara / Galería) */}
            <Text style={[styles.formLabel, { color: isDark ? '#9BA3AF' : '#5E6472' }]}>
              Foto de la Receta
            </Text>

            {imageUri ? (
              <View
                style={[
                  styles.imagePreviewCard,
                  {
                    backgroundColor: isDark ? '#242936' : '#F8F9FA',
                    borderColor: isDark ? '#2A303C' : '#E5E7EB',
                  },
                ]}
              >
                <Image source={{ uri: imageUri }} style={styles.imageThumb} />
                <View style={{ flex: 1, paddingHorizontal: 12 }}>
                  <Text style={[styles.imagePreviewTitle, { color: isDark ? '#F1F3F7' : '#181A1F' }]}>
                    Foto Seleccionada
                  </Text>
                  <Text style={[styles.imagePreviewSub, { color: colors.textDim }]}>
                    Lista para mostrar en el catálogo y recetas
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    <TouchableOpacity
                      onPress={() => setIsPhotoPickerOpen(true)}
                      style={[styles.smallBtn, { backgroundColor: colors.brandBg, borderColor: colors.brandBorder }]}
                    >
                      <Ionicons name="camera-reverse" size={13} color={colors.brandText} />
                      <Text style={[styles.smallBtnText, { color: colors.brandText }]}>Cambiar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setImageUri(null)}
                      style={[styles.smallBtn, { backgroundColor: isDark ? 'rgba(244,63,94,0.15)' : '#FFE4E6', borderColor: colors.roseBorder }]}
                    >
                      <Ionicons name="trash-outline" size={13} color={colors.roseLight} />
                      <Text style={[styles.smallBtnText, { color: colors.roseLight }]}>Quitar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setIsPhotoPickerOpen(true)}
                activeOpacity={0.8}
                style={[
                  styles.uploadPhotoBtn,
                  {
                    backgroundColor: isDark ? '#1C2230' : '#F8FAFC',
                    borderColor: isDark ? '#2E3A52' : '#CBD5E1',
                  },
                ]}
              >
                <View
                  style={[
                    styles.uploadIconCircle,
                    { backgroundColor: isDark ? 'rgba(14, 165, 233, 0.16)' : 'rgba(2, 132, 199, 0.12)' },
                  ]}
                >
                  <Ionicons name="camera" size={24} color={colors.brandLight} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.uploadBtnTitle, { color: isDark ? '#F1F3F7' : '#0F172A' }]}>
                    Subir Foto de la Galleta
                  </Text>
                  <Text style={[styles.uploadBtnSub, { color: colors.textDim }]}>
                    Tomar foto con la cámara o elegir desde la galería
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}

            {/* Manual URL toggle if desired */}
            <TouchableOpacity
              onPress={() => setShowManualUrl(!showManualUrl)}
              style={{ marginVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Ionicons name={showManualUrl ? 'chevron-down' : 'chevron-forward'} size={13} color={colors.textDim} />
              <Text style={{ fontSize: 11, color: colors.textDim, fontWeight: '600' }}>
                {showManualUrl ? 'Ocultar opción de URL web' : '¿Prefieres ingresar una URL de internet?'}
              </Text>
            </TouchableOpacity>

            {showManualUrl && (
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#242936' : '#F8F9FA',
                    borderColor: isDark ? '#2A303C' : '#E5E7EB',
                    color: isDark ? '#F1F3F7' : '#181A1F',
                    marginBottom: 10,
                  },
                ]}
                placeholder="https://ejemplo.com/foto-galleta.jpg"
                placeholderTextColor={colors.textDim}
                value={imageUrl}
                onChangeText={setImageUrl}
              />
            )}

            <Text style={[styles.formLabel, { color: isDark ? '#9BA3AF' : '#5E6472', marginTop: 10 }]}>
              Nombre de la Galleta
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
              placeholder="Ej. Galleta Oreo Bomb, Nutella Trufa, Pistache"
              placeholderTextColor={colors.textDim}
              value={name}
              onChangeText={setName}
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.formLabel, { color: isDark ? '#9BA3AF' : '#5E6472' }]}>
                  Precio Venta ($ MXN)
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
                  placeholder="35.00"
                  placeholderTextColor={colors.textDim}
                  value={salePrice}
                  onChangeText={setSalePrice}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.formLabel, { color: isDark ? '#9BA3AF' : '#5E6472' }]}>
                  Costo Lote c/Empaque ($ MXN)
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
                  placeholder="9.67"
                  placeholderTextColor={colors.textDim}
                  value={recipeCost}
                  onChangeText={setRecipeCost}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.formLabel, { color: isDark ? '#9BA3AF' : '#5E6472' }]}>
                  Rendimiento por Tanda
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
                  placeholder="16"
                  placeholderTextColor={colors.textDim}
                  value={batchYield}
                  onChangeText={(val) => {
                    setBatchYield(val);
                    recalculateFromIngredients(recipeIngredients, val);
                  }}
                />
              </View>
            </View>

            {/* SELECCIÓN DE INSUMOS & RECETA */}
            <View style={[styles.ingredientsCard, { backgroundColor: isDark ? '#181C26' : '#F8FAFC', borderColor: isDark ? '#2E384D' : '#E2E8F0' }]}>
              <View style={styles.ingredientsHeaderRow}>
                <View style={{ flex: 1, paddingRight: 6 }}>
                  <Text style={[styles.formLabel, { color: isDark ? '#9BA3AF' : '#5E6472', marginBottom: 2 }]}>
                    Ingredientes de la Receta ({recipeIngredients.length})
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textDim }}>
                    Cantidades calculadas para una tanda de {batchYield || 16} galletas
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity
                    onPress={() => setIsIngredientPickerOpen(true)}
                    style={[styles.miniHeaderBtn, { backgroundColor: colors.amberBg, borderColor: colors.amberBorder }]}
                  >
                    <Ionicons name="nutrition" size={13} color={colors.amberLight} />
                    <Text style={[styles.miniHeaderBtnText, { color: colors.amberLight }]}>+ Almacén</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleAddCustomIngredient}
                    style={[styles.miniHeaderBtn, { backgroundColor: isDark ? '#242936' : '#F1F5F9', borderColor: colors.borderSubtle }]}
                  >
                    <Ionicons name="add" size={14} color={colors.textMain} />
                    <Text style={[styles.miniHeaderBtnText, { color: colors.textMain }]}>+ Libre</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {recipeIngredients.length === 0 ? (
                <TouchableOpacity
                  onPress={() => setIsIngredientPickerOpen(true)}
                  style={[styles.emptyIngredientsBox, { backgroundColor: isDark ? '#1C202A' : '#FFFFFF', borderColor: colors.borderSubtle }]}
                >
                  <Ionicons name="basket-outline" size={26} color={colors.amberLight} />
                  <Text style={[styles.emptyIngredientsTitle, { color: colors.textMain }]}>
                    Seleccionar Insumos del Almacén
                  </Text>
                  <Text style={[styles.emptyIngredientsSub, { color: colors.textDim }]}>
                    Toca aquí para seleccionar harina, chispas, mantequilla... y calcular costos de la tanda.
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={{ gap: 8, marginTop: 8 }}>
                  {recipeIngredients.map((item, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.ingredientRowCard,
                        {
                          backgroundColor: isDark ? '#222734' : '#FFFFFF',
                          borderColor: isDark ? '#2E384D' : '#E2E8F0',
                        },
                      ]}
                    >
                      <View style={{ flex: 1, paddingRight: 6 }}>
                        <TextInput
                          style={[styles.ingNameInput, { color: isDark ? '#F1F3F7' : '#181A1F' }]}
                          value={item.name}
                          onChangeText={(v) => handleUpdateRecipeIngredient(idx, 'name', v)}
                          placeholder="Nombre del insumo"
                          placeholderTextColor={colors.textDim}
                        />
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#181C26' : '#F1F5F9', borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: radii.sm, paddingHorizontal: 6, paddingVertical: 2 }}>
                            <TextInput
                              style={{ color: colors.textMain, fontSize: 12, fontWeight: '700', minWidth: 38, textAlign: 'center', padding: 0 }}
                              value={String(item.quantity || '')}
                              keyboardType="numeric"
                              onChangeText={(v) => handleUpdateRecipeIngredient(idx, 'quantity', v)}
                              placeholder="0"
                              placeholderTextColor={colors.textDim}
                            />
                            <Text style={{ fontSize: 11, color: colors.textDim, marginLeft: 3 }}>{item.unit}</Text>
                          </View>
                          {item.ingredient_id ? (
                            <View style={{ backgroundColor: colors.emeraldBg, borderRadius: radii.sm, paddingHorizontal: 6, paddingVertical: 2 }}>
                              <Text style={{ fontSize: 9.5, fontWeight: '700', color: colors.emeraldLight }}>
                                Almacén
                              </Text>
                            </View>
                          ) : (
                            <View style={{ backgroundColor: isDark ? '#2E384D' : '#E2E8F0', borderRadius: radii.sm, paddingHorizontal: 6, paddingVertical: 2 }}>
                              <Text style={{ fontSize: 9.5, fontWeight: '700', color: colors.textDim }}>
                                Libre
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <View style={{ alignItems: 'flex-end', justifyContent: 'space-between', paddingVertical: 2 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textDim }}>$</Text>
                          <TextInput
                            style={{
                              fontSize: 14,
                              fontWeight: '900',
                              color: colors.emeraldLight,
                              textAlign: 'right',
                              minWidth: 48,
                              padding: 0,
                            }}
                            value={String(item.cost || '')}
                            keyboardType="numeric"
                            onChangeText={(v) => handleUpdateRecipeIngredient(idx, 'cost', v)}
                            placeholder="0.00"
                            placeholderTextColor={colors.textDim}
                          />
                        </View>
                        <TouchableOpacity
                          onPress={() => handleRemoveRecipeIngredient(idx)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          style={{ marginTop: 6 }}
                        >
                          <Ionicons name="trash-outline" size={15} color={colors.roseLight} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}

                  {/* Summary Bar for batch ingredients */}
                  <View style={[styles.ingSummaryBar, { backgroundColor: isDark ? '#141822' : '#F1F5F9', borderColor: colors.borderSubtle }]}>
                    <View style={{ flex: 1, paddingRight: 6 }}>
                      <Text style={{ fontSize: 10, color: colors.textDim, textTransform: 'uppercase', fontWeight: '700' }}>
                        Insumos Tanda: ${recipeIngredients.reduce((s, it) => s + (Number(it.cost) || 0), 0).toFixed(2)} MXN
                      </Text>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: colors.amberLight, marginTop: 1 }}>
                        ${((recipeIngredients.reduce((s, it) => s + (Number(it.cost) || 0), 0) / (parseInt(batchYield, 10) || 16))).toFixed(2)} insumo + $2.90 empaque = ${recipeCost} c/u
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => recalculateFromIngredients(recipeIngredients, batchYield)}
                      style={[styles.syncCostBtn, { backgroundColor: colors.amberBg, borderColor: colors.amberBorder }]}
                    >
                      <Ionicons name="refresh" size={12} color={colors.amberLight} />
                      <Text style={{ fontSize: 10, fontWeight: '800', color: colors.amberLight }}>Sincronizar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            <Text style={[styles.formLabel, { color: isDark ? '#9BA3AF' : '#5E6472', marginTop: 12 }]}>
              Descripción & Notas de Sabor
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  height: 65,
                  backgroundColor: isDark ? '#242936' : '#F8F9FA',
                  borderColor: isDark ? '#2A303C' : '#E5E7EB',
                  color: isDark ? '#F1F3F7' : '#181A1F',
                },
              ]}
              multiline
              placeholder="Ingredientes clave, peso aproximado (ej. 90g), toque de sal marina..."
              placeholderTextColor={colors.textDim}
              value={description}
              onChangeText={setDescription}
            />

            {/* Live Profit Preview */}
            <View
              style={[
                styles.previewBox,
                {
                  backgroundColor: isDark ? '#141822' : '#FEF3C7',
                  borderColor: isDark ? '#2E384D' : '#FDE68A',
                },
              ]}
            >
              <View style={styles.previewCol}>
                <Text style={[styles.previewKey, { color: isDark ? '#9BA3AF' : '#92400E' }]}>
                  Ganancia Neta / pza
                </Text>
                <Text style={styles.previewValGreen}>+${profitNum.toFixed(2)} MXN</Text>
              </View>
              <View style={styles.previewCol}>
                <Text style={[styles.previewKey, { color: isDark ? '#9BA3AF' : '#92400E' }]}>
                  Margen de Utilidad
                </Text>
                <Text style={styles.previewValGold}>{marginPct.toFixed(2)}%</Text>
              </View>
              <View style={styles.previewCol}>
                <Text style={[styles.previewKey, { color: isDark ? '#9BA3AF' : '#92400E' }]}>
                  Rendimiento (ROI)
                </Text>
                <Text style={styles.previewValGold}>~{roiPct.toFixed(2)}%</Text>
              </View>
            </View>

            <View style={styles.actions}>
              <Button
                title="Cancelar"
                variant="secondary"
                onPress={onClose}
                style={{ flex: 1 }}
              />
              <Button
                title={isSaving ? "Guardando..." : "Crear Receta"}
                variant="amber"
                disabled={isSaving}
                icon={<Ionicons name="checkmark-circle" size={17} color="#fff" />}
                onPress={handleSubmit}
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
              ¿Desde dónde deseas agregar la imagen de la galleta?
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
                  Captura la galleta recién horneada al instante
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

      {/* Modal Selector de Insumos Registrados */}
      <Modal
        visible={isIngredientPickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsIngredientPickerOpen(false)}
      >
        <TouchableOpacity
          style={styles.pickerBackdrop}
          activeOpacity={1}
          onPress={() => setIsIngredientPickerOpen(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.pickerSheet,
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
                  Seleccionar de Insumos ({registeredIngredients.length})
                </Text>
                <Text style={[styles.pickerSubtitle, { color: colors.textDim }]}>
                  Toca los insumos con los que se preparará esta receta
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsIngredientPickerOpen(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={[styles.pickerSearchBox, { backgroundColor: isDark ? '#242936' : '#F1F5F9', borderColor: colors.borderSubtle }]}>
              <Ionicons name="search" size={16} color={colors.textDim} />
              <TextInput
                style={[styles.pickerSearchInput, { color: colors.textMain }]}
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
                <View style={{ alignItems: 'center', paddingVertical: 32, gap: 8 }}>
                  <Ionicons name="cube-outline" size={36} color={colors.textDim} />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textMain }}>
                    No tienes insumos en tu almacén
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textDim, textAlign: 'center', maxWidth: 260 }}>
                    Puedes registrar insumos en la pestaña Insumos o añadir ingredientes libres aquí mismo.
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setIsIngredientPickerOpen(false);
                      handleAddCustomIngredient();
                    }}
                    style={[styles.smallBtn, { backgroundColor: colors.amberBg, borderColor: colors.amberBorder, marginTop: 8 }]}
                  >
                    <Ionicons name="add" size={14} color={colors.amberLight} />
                    <Text style={[styles.smallBtnText, { color: colors.amberLight }]}>Crear Insumo Libre</Text>
                  </TouchableOpacity>
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
                      const isAdded = recipeIngredients.some(
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
                          <View style={[styles.pickerIconWrap, { backgroundColor: isAdded ? colors.emeraldBg : colors.amberBg }]}>
                            <Ionicons
                              name={item.type === 'packaging' ? 'cube' : 'nutrition'}
                              size={20}
                              color={isAdded ? colors.emeraldLight : colors.amberLight}
                            />
                          </View>
                          <View style={{ flex: 1, paddingHorizontal: 10 }}>
                            <Text style={[styles.inventoryCardName, { color: isDark ? '#F1F3F7' : '#181A1F' }]}>
                              {item.name}
                            </Text>
                            <Text style={{ fontSize: 11, color: colors.textDim, marginTop: 2 }}>
                              {item.supplier || 'Almacén'} • Stock: {item.stock_quantity} {item.unit}
                            </Text>
                            <Text style={{ fontSize: 11, fontWeight: '800', color: colors.emeraldLight, marginTop: 2 }}>
                              ${item.cost_per_unit.toFixed(2)} / {item.unit}
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
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

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <TouchableOpacity
                onPress={() => {
                  setIsIngredientPickerOpen(false);
                  handleAddCustomIngredient();
                }}
                style={[styles.pickerActionBtn, { flex: 1, backgroundColor: isDark ? '#242936' : '#F1F5F9', borderColor: colors.borderSubtle }]}
              >
                <Ionicons name="add" size={16} color={colors.textMain} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMain }}>+ Insumo Libre</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsIngredientPickerOpen(false)}
                style={[styles.pickerActionBtn, { flex: 2, backgroundColor: colors.amber, borderColor: colors.amber }]}
              >
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF' }}>Listo ({recipeIngredients.length} elegidos)</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 12,
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
  body: {
    padding: 18,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: colors.textDim,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    padding: 12,
    color: colors.textMain,
    fontSize: 13,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  uploadPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: radii.md,
    padding: 14,
    marginBottom: 6,
  },
  uploadIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBtnTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  uploadBtnSub: {
    fontSize: 11,
    marginTop: 2,
  },
  imagePreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 10,
    marginBottom: 6,
  },
  imageThumb: {
    width: 64,
    height: 64,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  imagePreviewTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  imagePreviewSub: {
    fontSize: 11,
    marginTop: 2,
  },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  smallBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  ingredientsCard: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 12,
    marginBottom: 12,
  },
  ingredientsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  miniHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingVertical: 4,
    paddingHorizontal: 9,
  },
  miniHeaderBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  emptyIngredientsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radii.sm,
    gap: 4,
    marginTop: 6,
  },
  emptyIngredientsTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  emptyIngredientsSub: {
    fontSize: 11,
    textAlign: 'center',
    maxWidth: 270,
  },
  ingredientRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: 9,
  },
  ingNameInput: {
    fontSize: 13,
    fontWeight: '800',
    padding: 0,
  },
  ingSummaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 4,
  },
  syncCostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  pickerSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 6,
  },
  pickerSearchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  inventoryPickerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 10,
  },
  inventoryCardName: {
    fontSize: 13,
    fontWeight: '800',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: 11,
  },
  previewBox: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.bgTertiary,
    borderRadius: radii.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginVertical: 10,
  },
  previewCol: {
    alignItems: 'center',
  },
  previewKey: {
    fontSize: 10,
    color: colors.textDim,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  previewValGreen: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.emeraldLight,
    marginTop: 2,
  },
  previewValGold: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.amberLight,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    marginBottom: 20,
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
