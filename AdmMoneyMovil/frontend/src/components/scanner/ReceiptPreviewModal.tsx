import React, { useState, useEffect, useRef } from 'react';
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
  Platform,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { colors, useThemeColors, radii } from '../../theme';
import { ReceiptScanResult, Expense, ReceiptItem, Ingredient } from '../../lib/types';
import { useAppStore } from '../../stores/app.store';
import { Ionicons } from '@expo/vector-icons';
import { resolveReceiptImageUrl } from '../../lib/imageUrl';

interface ReceiptPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  scanResult: ReceiptScanResult | null;
  imageUri?: string | null;
  onConfirm: (expense: Partial<Expense>) => Promise<void>;
}

export interface MatchedExistingItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  matchedIngredient: Ingredient;
  selectedToUpdateStock: boolean;
}

export interface NewDetectedItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  type: 'edible' | 'packaging';
  selectedToRegister: boolean;
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

const normalizeStr = (str: string) =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const STOP_WORDS = new Set([
  'de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'con', 'sin', 'para', 'en', 'y', 'o',
  'kg', 'kilo', 'kilos', 'gr', 'g', 'gramo', 'gramos', 'ml', 'lt', 'l', 'litro', 'litros',
  'pz', 'pza', 'pzas', 'pieza', 'piezas', 'paq', 'paquete', 'caja', 'cajas', 'bolsa', 'bolsas',
  'especial', 'super', 'extra', 'selecta', 'original', 'premium', 'marca'
]);

function findInventoryMatch(itemName: string, inventory: Ingredient[]): Ingredient | null {
  const normItem = normalizeStr(itemName);
  if (!normItem) return null;

  // 1. Direct or inclusive match
  for (const ing of inventory) {
    const normIng = normalizeStr(ing.name);
    if (normIng === normItem) return ing;
    if (normItem.includes(normIng) || normIng.includes(normItem)) {
      return ing;
    }
  }

  // 2. Keyword tokens matching
  const itemWords = normItem.split(' ').filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
  if (itemWords.length === 0) return null;

  let bestMatch: Ingredient | null = null;
  let maxMatchedKeywords = 0;

  for (const ing of inventory) {
    const ingWords = normalizeStr(ing.name).split(' ').filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
    const matchedCount = itemWords.filter((iw) => ingWords.some((w) => w.includes(iw) || iw.includes(w))).length;
    if (matchedCount > maxMatchedKeywords && (matchedCount >= 2 || (matchedCount === 1 && ingWords.length === 1))) {
      maxMatchedKeywords = matchedCount;
      bestMatch = ing;
    }
  }

  return bestMatch;
}

export const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({
  visible,
  onClose,
  scanResult,
  imageUri,
  onConfirm
}) => {
  const colors = useThemeColors();
  const isDark = colors.isDark;
  const registeredIngredients = useAppStore((state) => state.ingredients);
  const updateIngredient = useAppStore((state) => state.updateIngredient);
  const addIngredient = useAppStore((state) => state.addIngredient);
  const backendUrl = useAppStore((state) => state.backendUrl);

  const [isSaving, setIsSaving] = useState(false);
  const [expenseTarget, setExpenseTarget] = useState<'baking' | 'operational'>('baking');
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [matchedExisting, setMatchedExisting] = useState<MatchedExistingItem[]>([]);
  const [newDetected, setNewDetected] = useState<NewDetectedItem[]>([]);
  const [showRawText, setShowRawText] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdQty, setNewProdQty] = useState('1');

  const classifyReceiptItems = (receiptItems: ReceiptItem[], inventory: Ingredient[]) => {
    const existingList: MatchedExistingItem[] = [];
    const newList: NewDetectedItem[] = [];

    receiptItems.forEach((it, idx) => {
      const match = findInventoryMatch(it.name, inventory);
      if (match) {
        existingList.push({
          id: `match-${idx}-${match.id}`,
          name: it.name,
          quantity: it.quantity || 1,
          price: it.price || 0,
          matchedIngredient: match,
          selectedToUpdateStock: true,
        });
      } else {
        const lower = it.name.toLowerCase();
        let guessedUnit = 'kg';
        if (/(ml|mili)/.test(lower)) guessedUnit = 'ml';
        else if (/(lt|litro|litros)/.test(lower)) guessedUnit = 'l';
        else if (/(gr|gramos|g\b)/.test(lower)) guessedUnit = 'g';
        else if (/(pz|pza|pzas|pieza|piezas|caja|cajas|paq|bolsa)/.test(lower)) guessedUnit = 'pza';
        else if ((it.quantity || 1) > 5) guessedUnit = 'pza';

        let guessedType: 'edible' | 'packaging' = 'edible';
        if (/(bolsa|caja|kraft|empaque|etiqueta|liston|cinta|domo)/.test(lower)) {
          guessedType = 'packaging';
        }

        newList.push({
          id: `new-${idx}-${Date.now()}`,
          name: it.name,
          quantity: it.quantity || 1,
          unit: guessedUnit,
          price: it.price || 0,
          type: guessedType,
          selectedToRegister: true,
        });
      }
    });

    setMatchedExisting(existingList);
    setNewDetected(newList);
  };

  useEffect(() => {
    if (scanResult) {
      setMerchant(scanResult.merchant || 'Comercio');
      const parsedItems = scanResult.items ? [...scanResult.items] : [];
      setItems(parsedItems);
      classifyReceiptItems(parsedItems, registeredIngredients);

      const itemsSum = parsedItems.reduce((acc, it) => acc + (Number(it.price) || 0), 0);
      let initialAmount = scanResult.total_amount ? String(scanResult.total_amount) : '0.00';
      if (itemsSum > 0 && scanResult.total_amount && (scanResult.total_amount > itemsSum * 1.7 && scanResult.total_amount > 400)) {
        initialAmount = itemsSum.toFixed(2);
      } else if (itemsSum > 0 && (!scanResult.total_amount || scanResult.total_amount <= 0)) {
        initialAmount = itemsSum.toFixed(2);
      }
      setAmount(initialAmount);

      const isOperationalCat =
        scanResult.suggested_category &&
        !scanResult.suggested_category.includes('Galletas') &&
        !scanResult.suggested_category.includes('Empaques');

      if (isOperationalCat) {
        setExpenseTarget('operational');
        setCategory(scanResult.suggested_category || 'Servicios y Luz');
      } else {
        setExpenseTarget('baking');
        setCategory(CATEGORIES[0]);
      }

      setNotes(`Ticket escaneado (${parsedItems.length} artículos)`);
      setShowRawText(false);
      setShowAddProduct(false);
    } else {
      setMerchant('Ticket de Compra');
      setAmount('0.00');
      setExpenseTarget('baking');
      setCategory(CATEGORIES[0]);
      setPaymentMethod('Efectivo');
      setItems([]);
      setMatchedExisting([]);
      setNewDetected([]);
      setNotes('Ticket capturado');
    }
  }, [scanResult, registeredIngredients]);

  const screenHeight = Dimensions.get('window').height;
  const translateY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        return gestureState.dy > 8 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.4;
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

  if (!visible) return null;

  const handleToggleMatchedItem = (id: string) => {
    setMatchedExisting((prev) =>
      prev.map((m) => (m.id === id ? { ...m, selectedToUpdateStock: !m.selectedToUpdateStock } : m))
    );
  };

  const handleToggleAllMatched = (select: boolean) => {
    setMatchedExisting((prev) => prev.map((m) => ({ ...m, selectedToUpdateStock: select })));
  };

  const handleUpdateMatchedItem = (id: string, field: 'name' | 'quantity' | 'price', value: any) => {
    setMatchedExisting((prev) => {
      const next = prev.map((m) => (m.id === id ? { ...m, [field]: value } : m));
      const sumMatched = next.reduce((acc, m) => acc + (Number(m.price) || 0), 0);
      const sumNew = newDetected.reduce((acc, n) => acc + (Number(n.price) || 0), 0);
      setAmount((sumMatched + sumNew).toFixed(2));
      return next;
    });
  };

  const handleToggleNewItem = (id: string) => {
    setNewDetected((prev) =>
      prev.map((n) => (n.id === id ? { ...n, selectedToRegister: !n.selectedToRegister } : n))
    );
  };

  const handleToggleAllNew = (select: boolean) => {
    setNewDetected((prev) => prev.map((n) => ({ ...n, selectedToRegister: select })));
  };

  const handleUpdateNewItem = (id: string, field: keyof NewDetectedItem, value: any) => {
    setNewDetected((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, [field]: value } : n));
      if (field === 'price') {
        const sumMatched = matchedExisting.reduce((acc, m) => acc + (Number(m.price) || 0), 0);
        const sumNew = next.reduce((acc, n) => acc + (Number(n.price) || 0), 0);
        setAmount((sumMatched + sumNew).toFixed(2));
      }
      return next;
    });
  };

  const handleRemoveMatchedItem = (id: string) => {
    setMatchedExisting((prev) => {
      const next = prev.filter((m) => m.id !== id);
      const sumMatched = next.reduce((acc, m) => acc + (Number(m.price) || 0), 0);
      const sumNew = newDetected.reduce((acc, n) => acc + (Number(n.price) || 0), 0);
      setAmount((sumMatched + sumNew).toFixed(2));
      return next;
    });
  };

  const handleRemoveNewItem = (id: string) => {
    setNewDetected((prev) => {
      const next = prev.filter((n) => n.id !== id);
      const sumMatched = matchedExisting.reduce((acc, m) => acc + (Number(m.price) || 0), 0);
      const sumNew = next.reduce((acc, n) => acc + (Number(n.price) || 0), 0);
      setAmount((sumMatched + sumNew).toFixed(2));
      return next;
    });
  };

  const handleAddProduct = () => {
    const pVal = parseFloat(newProdPrice);
    const qVal = parseFloat(newProdQty) || 1;
    if (!newProdName.trim() || isNaN(pVal) || pVal <= 0) {
      Alert.alert('Datos requeridos', 'Ingresa el nombre y un precio válido para el producto.');
      return;
    }
    const newItem: ReceiptItem = { name: newProdName.trim(), quantity: qVal, price: pVal };
    const nextItems = [...items, newItem];
    setItems(nextItems);
    classifyReceiptItems(nextItems, registeredIngredients);

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
      let updatedStockCount = 0;
      let newRegisteredCount = 0;

      // Solo actualizar inventario de almacén si el usuario seleccionó "Insumos de Galletas"
      if (expenseTarget === 'baking') {
        // 1. Update stock for registered ingredients
        for (const match of matchedExisting) {
          if (match.selectedToUpdateStock) {
            const addQty = Number(match.quantity) || 1;
            const newStock = Number((match.matchedIngredient.stock_quantity + addQty).toFixed(2));
            await updateIngredient(match.matchedIngredient.id, {
              stock_quantity: newStock,
            });
            updatedStockCount++;
          }
        }

        // 2. Add newly selected ingredients into inventory
        for (const newItem of newDetected) {
          if (newItem.selectedToRegister && newItem.name.trim()) {
            const qty = Number(newItem.quantity) || 1;
            const cost = Number(newItem.price) || 0;
            await addIngredient({
              name: newItem.name.trim(),
              stock_quantity: qty,
              package_quantity: qty,
              package_cost: cost,
              cost_per_unit: Number((cost / qty).toFixed(2)),
              unit: newItem.unit,
              supplier: merchant.trim() || 'Proveedor',
              type: newItem.type,
            });
            newRegisteredCount++;
          }
        }
      }

      const finalItems: ReceiptItem[] = [
        ...matchedExisting.map((m) => ({
          name: m.name.trim(),
          quantity: Number(m.quantity) || 1,
          price: Number(m.price) || 0,
        })),
        ...newDetected.map((n) => ({
          name: n.name.trim(),
          quantity: Number(n.quantity) || 1,
          price: Number(n.price) || 0,
        })),
      ];

      // Prefer local file on device if available, otherwise server image_url
      const photoToSave =
        imageUri && (imageUri.startsWith('file://') || imageUri.startsWith('content://'))
          ? imageUri
          : scanResult?.image_url || imageUri || '';

      const finalCategory =
        expenseTarget === 'baking'
          ? (category === 'Otros Gastos' || category === 'Servicios y Luz' ? 'Insumos Galletas' : category)
          : (category === 'Insumos Galletas' ? 'Otros Gastos' : category);

      // 3. Save Expense record
      await onConfirm({
        title: `Compra ${merchant.trim() || 'Comercio'}`,
        amount: val,
        category: finalCategory,
        expense_type: expenseTarget === 'baking' ? 'direct' : 'operational',
        date: scanResult?.date || new Date().toISOString().split('T')[0],
        payment_method: paymentMethod,
        notes: notes.trim(),
        receipt_url: photoToSave,
        receipt_data: {
          merchant: merchant.trim(),
          total_amount: val,
          date: scanResult?.date || new Date().toISOString().split('T')[0],
          payment_method: paymentMethod,
          items: finalItems,
          expense_target: expenseTarget,
          matched_stock_updated: updatedStockCount,
          new_ingredients_added: newRegisteredCount,
          raw_text: scanResult?.raw_text || '',
          image_url: photoToSave,
          local_uri: imageUri || '',
        } as any,
      });

      let summaryMsg = `Ticket de $${val.toFixed(2)} MXN registrado correctamente.`;
      if (expenseTarget === 'baking') {
        if (updatedStockCount > 0 || newRegisteredCount > 0) {
          summaryMsg += `\n\nInventario Almacén:\n• ${updatedStockCount} insumo(s) existente(s) sumados a su stock.\n• ${newRegisteredCount} nuevo(s) insumo(s) registrados con éxito.`;
        }
      } else {
        summaryMsg += '\n\nComprobante y productos digitalizados con éxito. Almacén de repostería sin cambios (Gasto Operativo General).';
      }
      Alert.alert('¡Ticket Procesado!', summaryMsg);
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
        <Animated.View
          style={[
            styles.dialog,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.borderSubtle,
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Top Drag Handle & Header with swipe-down handler */}
          <View {...panResponder.panHandlers}>
            <View style={styles.dragHandleContainer}>
              <View
                style={[
                  styles.dragHandleBar,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.18)' },
                ]}
              />
            </View>

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
          </View>

          {/* Scrollable Content Body */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            bounces={true}
            overScrollMode="always"
          >
            {/* Real Captured Ticket Photo Preview */}
            {imageUri && (
              <View style={[styles.imageContainer, { borderColor: colors.borderSubtle, backgroundColor: '#000' }]}>
                <Image
                  source={{ uri: resolveReceiptImageUrl(imageUri, backendUrl) || imageUri }}
                  style={styles.receiptThumb}
                  resizeMode="contain"
                />
                <View style={styles.photoLabelBadge}>
                  <Ionicons name="camera" size={11} color="#fff" />
                  <Text style={styles.photoLabelText}>Foto Capturada Real</Text>
                </View>
              </View>
            )}

            {/* SELECTOR EXPLÍCITO: ¿PARA GALLETAS O GASTO GENERAL? */}
            <View style={[styles.targetSelectorCard, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}>
              <Text style={[styles.targetSelectorTitle, { color: colors.textMain }]}>
                ¿Para qué es este ticket?
              </Text>
              <Text style={[styles.targetSelectorSub, { color: colors.textMuted }]}>
                Elige si compraste insumos de galletas o solo registras un gasto operativo/general.
              </Text>

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setExpenseTarget('baking');
                    setCategory('Insumos Galletas');
                  }}
                  style={[
                    styles.targetOptionBtn,
                    {
                      backgroundColor:
                        expenseTarget === 'baking'
                          ? (isDark ? 'rgba(245, 158, 11, 0.16)' : '#FEF3C7')
                          : (isDark ? '#141A28' : '#FFFFFF'),
                      borderColor: expenseTarget === 'baking' ? colors.amberBorder : colors.borderSubtle,
                    },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons
                      name="nutrition"
                      size={15}
                      color={expenseTarget === 'baking' ? colors.amberLight : colors.textDim}
                    />
                    <Text
                      style={[
                        styles.targetOptionHeading,
                        { color: expenseTarget === 'baking' ? colors.amberLight : colors.textMain },
                      ]}
                    >
                      Insumos Galletas
                    </Text>
                  </View>
                  <Text style={[styles.targetOptionDesc, { color: colors.textMuted }]}>
                    Actualiza almacén y recetas de repostería
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setExpenseTarget('operational');
                    setCategory('Servicios y Luz');
                  }}
                  style={[
                    styles.targetOptionBtn,
                    {
                      backgroundColor:
                        expenseTarget === 'operational'
                          ? (isDark ? 'rgba(124, 58, 237, 0.16)' : '#F3E8FF')
                          : (isDark ? '#141A28' : '#FFFFFF'),
                      borderColor:
                        expenseTarget === 'operational'
                          ? (isDark ? 'rgba(124, 58, 237, 0.4)' : '#D8B4FE')
                          : colors.borderSubtle,
                    },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons
                      name="receipt-outline"
                      size={15}
                      color={expenseTarget === 'operational' ? colors.purpleText : colors.textDim}
                    />
                    <Text
                      style={[
                        styles.targetOptionHeading,
                        { color: expenseTarget === 'operational' ? colors.purpleText : colors.textMain },
                      ]}
                    >
                      Gasto General
                    </Text>
                  </View>
                  <Text style={[styles.targetOptionDesc, { color: colors.textMuted }]}>
                    Digitaliza ticket sin alterar insumos de repostería
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

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

            {/* VISTA SEGÚN DESTINO: INSUMOS VS GASTO GENERAL */}
            {expenseTarget === 'operational' ? (
              <View
                style={[
                  styles.operationalContainer,
                  {
                    backgroundColor: isDark ? 'rgba(124, 58, 237, 0.08)' : '#F5F3FF',
                    borderColor: isDark ? 'rgba(124, 58, 237, 0.3)' : '#DDD6FE',
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                  <Ionicons name="receipt" size={17} color={colors.purpleText} />
                  <Text style={[styles.sectionTitle, { color: colors.purpleText }]}>
                    PRODUCTOS DIGITALIZADOS ({matchedExisting.length + newDetected.length})
                  </Text>
                </View>

                <Text style={{ fontSize: 11.5, color: colors.textMain, lineHeight: 16, marginBottom: 12 }}>
                  Los siguientes artículos se registrarán en tu comprobante digital y en las estadísticas de gastos generales, <Text style={{ fontWeight: '800' }}>sin alterar los insumos ni recetas de galletas</Text>:
                </Text>

                <View style={{ gap: 7 }}>
                  {[...matchedExisting, ...newDetected].map((item, idx) => (
                    <View
                      key={item.id || idx}
                      style={[
                        styles.opItemRow,
                        {
                          backgroundColor: isDark ? '#141824' : '#FFFFFF',
                          borderColor: colors.borderSubtle,
                        },
                      ]}
                    >
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMain }}>
                          {item.name}
                        </Text>
                        <Text style={{ fontSize: 10.5, color: colors.textDim }}>
                          Cantidad: {item.quantity || 1}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 13.5, fontWeight: '800', color: colors.emeraldLight }}>
                        ${(Number(item.price) || 0).toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <>
                {/* MINI STATUS SUMMARY BAR */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                  <View style={[styles.statusSummaryPill, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.14)' : '#ECFDF5', borderColor: colors.emeraldBorder }]}>
                    <Ionicons name="cube" size={13} color={colors.emeraldLight} />
                    <Text style={{ fontSize: 11, fontWeight: '800', color: colors.emeraldLight }}>
                      {matchedExisting.length} Insumos Registrados
                    </Text>
                  </View>
                  <View style={[styles.statusSummaryPill, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.14)' : '#FEF3C7', borderColor: colors.amberBorder }]}>
                    <Ionicons name="sparkles" size={13} color={colors.amberLight} />
                    <Text style={{ fontSize: 11, fontWeight: '800', color: colors.amberLight }}>
                      {newDetected.length} Insumos Nuevos
                    </Text>
                  </View>
                </View>

                {/* SECCIÓN 1: INSUMOS YA REGISTRADOS EN ALMACÉN (SE SUMARÁN AL STOCK) */}
                <View style={[styles.sectionContainer, { backgroundColor: isDark ? '#14201E' : '#F0FDF4', borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : '#BBF7D0' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 8 }}>
                  <Ionicons name="cube" size={16} color={colors.emeraldLight} />
                  <Text style={[styles.sectionTitle, { color: colors.emeraldLight }]} numberOfLines={1}>
                    INSUMOS REGISTRADOS ({matchedExisting.length})
                  </Text>
                </View>
                {matchedExisting.length > 0 && (
                  <View style={{ flexDirection: 'row', gap: 6, flexShrink: 0 }}>
                    <TouchableOpacity
                      onPress={() => handleToggleAllMatched(true)}
                      style={[
                        styles.miniHeaderBtn,
                        {
                          backgroundColor: isDark ? 'rgba(16, 185, 129, 0.22)' : '#DCFCE7',
                          borderColor: colors.emeraldBorder,
                          paddingVertical: 5,
                          paddingHorizontal: 8,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 3,
                        },
                      ]}
                    >
                      <Ionicons name="checkmark-done" size={13} color={colors.emeraldLight} />
                      <Text style={{ fontSize: 10, fontWeight: '800', color: colors.emeraldLight }}>Todos</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleToggleAllMatched(false)}
                      style={[
                        styles.miniHeaderBtn,
                        {
                          backgroundColor: isDark ? '#1B2624' : '#F1F5F9',
                          borderColor: isDark ? '#2C3E3A' : '#E2E8F0',
                          paddingVertical: 5,
                          paddingHorizontal: 8,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 3,
                        },
                      ]}
                    >
                      <Ionicons name="close-circle-outline" size={13} color={colors.textDim} />
                      <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#D1D5DB' : colors.textDim }}>Ninguno</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <Text style={{ fontSize: 11, color: isDark ? '#A7F3D0' : '#166534', marginTop: 4, marginBottom: 8, lineHeight: 15 }}>
                El sistema reconoció estos insumos en tu almacén. Se sumará automáticamente la cantidad comprada a tu inventario:
              </Text>

              {matchedExisting.length === 0 ? (
                <View style={[styles.emptyBoxSm, { borderColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#DCFCE7' }]}>
                  <Text style={{ fontSize: 11, color: isDark ? '#6EE7B7' : '#15803D', fontStyle: 'italic' }}>
                    No se detectaron insumos previamente registrados en este ticket.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  {matchedExisting.map((match) => {
                    const newStock = Number((match.matchedIngredient.stock_quantity + match.quantity).toFixed(2));
                    return (
                      <View
                        key={match.id}
                        style={[
                          styles.matchedItemCard,
                          {
                            backgroundColor: isDark ? '#1A2E2B' : '#FFFFFF',
                            borderColor: match.selectedToUpdateStock ? colors.emeraldBorder : colors.borderSubtle,
                          },
                        ]}
                      >
                        <TouchableOpacity
                          onPress={() => handleToggleMatchedItem(match.id)}
                          style={{ padding: 4 }}
                        >
                          <Ionicons
                            name={match.selectedToUpdateStock ? "checkbox" : "square-outline"}
                            size={20}
                            color={match.selectedToUpdateStock ? colors.emeraldLight : colors.textDim}
                          />
                        </TouchableOpacity>

                        <View style={{ flex: 1, paddingHorizontal: 6 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <TextInput
                              style={[
                                styles.newItemNameInput,
                                {
                                  flex: 1,
                                  color: isDark ? '#F1F3F7' : '#181A1F',
                                  backgroundColor: isDark ? '#162724' : '#F8FAFC',
                                  borderColor: colors.borderSubtle,
                                  marginRight: 8,
                                },
                              ]}
                              value={match.name}
                              onChangeText={(v) => handleUpdateMatchedItem(match.id, 'name', v)}
                              placeholder="Nombre"
                              placeholderTextColor={colors.textDim}
                            />
                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#162724' : '#F8FAFC', borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: radii.sm, paddingHorizontal: 6, paddingVertical: 2 }}>
                              <Text style={{ fontSize: 11, color: colors.emeraldLight, fontWeight: '800' }}>$</Text>
                              <TextInput
                                style={{ color: colors.emeraldLight, fontSize: 13, fontWeight: '800', minWidth: 44, textAlign: 'right', padding: 2 }}
                                value={String(match.price || '')}
                                keyboardType="numeric"
                                onChangeText={(v) => handleUpdateMatchedItem(match.id, 'price', parseFloat(v) || 0)}
                              />
                            </View>
                          </View>

                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#162724' : '#F8FAFC', borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: radii.sm, paddingHorizontal: 6, paddingVertical: 2 }}>
                              <Text style={{ fontSize: 10, color: colors.textDim, marginRight: 2, fontWeight: '700' }}>CANT:</Text>
                              <TextInput
                                style={{ color: colors.textMain, fontSize: 12, fontWeight: '800', minWidth: 26, textAlign: 'center', padding: 0 }}
                                value={String(match.quantity || '')}
                                keyboardType="numeric"
                                onChangeText={(v) => handleUpdateMatchedItem(match.id, 'quantity', parseFloat(v) || 0)}
                              />
                            </View>
                            <View style={[styles.detectedMatchPill, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#DCFCE7', flex: 1 }]}>
                              <Ionicons name="checkmark-circle" size={11} color={colors.emeraldLight} />
                              <Text style={{ fontSize: 10, fontWeight: '800', color: colors.emeraldLight }} numberOfLines={1}>
                                Insumo: {match.matchedIngredient.name}
                              </Text>
                            </View>
                          </View>

                          <View style={[styles.stockTransformRow, { backgroundColor: isDark ? '#11221F' : '#F0FDF4', borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : '#DCFCE7', marginTop: 6 }]}>
                            <Text style={{ fontSize: 11, color: isDark ? '#D1FAE5' : '#065F46' }}>
                              Stock: <Text style={{ fontWeight: '700' }}>{match.matchedIngredient.stock_quantity} {match.matchedIngredient.unit}</Text> → Nuevo: <Text style={{ fontWeight: '900', color: colors.emeraldLight }}>{newStock} {match.matchedIngredient.unit}</Text> (+{match.quantity})
                            </Text>
                          </View>
                        </View>

                        <TouchableOpacity
                          onPress={() => handleRemoveMatchedItem(match.id)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          style={{ padding: 4 }}
                        >
                          <Ionicons name="trash-outline" size={16} color={colors.roseLight} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* SECCIÓN 2: INSUMOS NUEVOS DETECTADOS EN EL TICKET */}
            <View style={[styles.sectionContainer, { backgroundColor: isDark ? '#231B15' : '#FFFBEB', borderColor: isDark ? 'rgba(245, 158, 11, 0.4)' : '#FDE68A', marginTop: 12 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 8 }}>
                  <Ionicons name="sparkles" size={16} color={colors.amberLight} />
                  <Text style={[styles.sectionTitle, { color: colors.amberLight }]} numberOfLines={1}>
                    INSUMOS NUEVOS ({newDetected.length})
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 6, flexShrink: 0 }}>
                  <TouchableOpacity
                    onPress={() => handleToggleAllNew(true)}
                    style={[
                      styles.miniHeaderBtn,
                      {
                        backgroundColor: isDark ? 'rgba(245, 158, 11, 0.22)' : '#FEF3C7',
                        borderColor: colors.amberBorder,
                        paddingVertical: 5,
                        paddingHorizontal: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 3,
                      },
                    ]}
                  >
                    <Ionicons name="checkmark-done" size={13} color={colors.amberLight} />
                    <Text style={{ fontSize: 10, fontWeight: '800', color: colors.amberLight }}>Marcar Todos</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleToggleAllNew(false)}
                    style={[
                      styles.miniHeaderBtn,
                      {
                        backgroundColor: isDark ? '#2D231C' : '#F1F5F9',
                        borderColor: isDark ? '#3D2F24' : '#E2E8F0',
                        paddingVertical: 5,
                        paddingHorizontal: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 3,
                      },
                    ]}
                  >
                    <Ionicons name="close-circle-outline" size={13} color={colors.textDim} />
                    <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#D1D5DB' : colors.textDim }}>Desmarcar</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.alertNoticeBox, { backgroundColor: isDark ? '#2B1F17' : '#FEF3C7', borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A' }]}>
                <Ionicons name="alert-circle" size={18} color={colors.amberLight} />
                <Text style={{ fontSize: 11, color: isDark ? '#FDE68A' : '#92400E', flex: 1, lineHeight: 15 }}>
                  <Text style={{ fontWeight: '800' }}>¿Deseas agregar estos insumos nuevos?</Text> Selecciona de la lista los que quieres registrar en tu almacén con su precio y cantidad:
                </Text>
              </View>

              {newDetected.length === 0 ? (
                <View style={[styles.emptyBoxSm, { borderColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7' }]}>
                  <Text style={{ fontSize: 11, color: isDark ? '#FCD34D' : '#B45309', fontStyle: 'italic' }}>
                    ¡Excelente! Todos los productos de este ticket ya están registrados en tu almacén.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 10, marginTop: 8 }}>
                  {newDetected.map((item) => {
                    const unitRate = item.quantity > 0 ? (item.price / item.quantity).toFixed(2) : '0.00';
                    return (
                      <View
                        key={item.id}
                        style={[
                          styles.newItemCard,
                          {
                            backgroundColor: isDark ? '#221915' : '#FFFFFF',
                            borderColor: item.selectedToRegister ? colors.amberBorder : colors.borderSubtle,
                          },
                        ]}
                      >
                        {/* Row 1: Checkbox + Editable Name + Delete */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <TouchableOpacity
                            onPress={() => handleToggleNewItem(item.id)}
                            style={{ padding: 2 }}
                          >
                            <Ionicons
                              name={item.selectedToRegister ? "checkbox" : "square-outline"}
                              size={20}
                              color={item.selectedToRegister ? colors.amberLight : colors.textDim}
                            />
                          </TouchableOpacity>

                          <View style={{ flex: 1 }}>
                            <TextInput
                              style={[styles.newItemNameInput, { color: isDark ? '#F1F3F7' : '#181A1F', backgroundColor: isDark ? '#1C1512' : '#F8FAFC', borderColor: colors.borderSubtle }]}
                              value={item.name}
                              onChangeText={(v) => handleUpdateNewItem(item.id, 'name', v)}
                              placeholder="Nombre del nuevo insumo"
                              placeholderTextColor={colors.textDim}
                            />
                          </View>

                          <TouchableOpacity
                            onPress={() => handleRemoveNewItem(item.id)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons name="trash-outline" size={16} color={colors.roseLight} />
                          </TouchableOpacity>
                        </View>

                        {/* Row 2: Quantity, Unit Selector, and Price */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#1C1512' : '#F8FAFC', borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: radii.sm, paddingHorizontal: 8, paddingVertical: 4 }}>
                            <Text style={{ fontSize: 10, color: colors.textDim, marginRight: 4, fontWeight: '700' }}>CANT:</Text>
                            <TextInput
                              style={{ color: colors.textMain, fontSize: 13, fontWeight: '800', minWidth: 32, textAlign: 'center', padding: 0 }}
                              value={String(item.quantity || '')}
                              keyboardType="numeric"
                              onChangeText={(v) => handleUpdateNewItem(item.id, 'quantity', parseFloat(v) || 0)}
                            />
                          </View>

                          {/* Unit Selector Chips */}
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 4 }}>
                            {['kg', 'g', 'pza', 'l', 'ml'].map((u) => {
                              const isUActive = item.unit.toLowerCase() === u;
                              return (
                                <TouchableOpacity
                                  key={u}
                                  onPress={() => handleUpdateNewItem(item.id, 'unit', u)}
                                  style={[
                                    styles.unitChip,
                                    {
                                      backgroundColor: isUActive ? colors.amberBg : (isDark ? '#1C1512' : '#F1F5F9'),
                                      borderColor: isUActive ? colors.amberBorder : colors.borderSubtle,
                                    },
                                  ]}
                                >
                                  <Text style={{ fontSize: 10, fontWeight: isUActive ? '800' : '600', color: isUActive ? colors.amberLight : colors.textDim }}>
                                    {u}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>

                          {/* Price input */}
                          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#1C1512' : '#F8FAFC', borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: radii.sm, paddingHorizontal: 8, paddingVertical: 4 }}>
                            <Text style={{ fontSize: 11, color: colors.textDim, fontWeight: '700' }}>$</Text>
                            <TextInput
                              style={{ color: colors.emeraldLight, fontSize: 13, fontWeight: '900', minWidth: 46, textAlign: 'right', padding: 0 }}
                              value={String(item.price || '')}
                              keyboardType="numeric"
                              onChangeText={(v) => handleUpdateNewItem(item.id, 'price', parseFloat(v) || 0)}
                            />
                          </View>
                        </View>

                        {/* Row 3: Type Selector & Cost per unit hint */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                          <View style={{ flexDirection: 'row', gap: 4 }}>
                            {(['edible', 'packaging'] as const).map((t) => {
                              const isTActive = item.type === t;
                              return (
                                <TouchableOpacity
                                  key={t}
                                  onPress={() => handleUpdateNewItem(item.id, 'type', t)}
                                  style={[
                                    styles.typeChip,
                                    {
                                      backgroundColor: isTActive
                                        ? (t === 'packaging' ? colors.purpleBg : colors.amberBg)
                                        : (isDark ? '#1C1512' : '#F1F5F9'),
                                      borderColor: isTActive
                                        ? (t === 'packaging' ? colors.purpleBorder : colors.amberBorder)
                                        : colors.borderSubtle,
                                    },
                                  ]}
                                >
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                                    <Ionicons
                                      name={t === 'edible' ? 'nutrition-outline' : 'cube-outline'}
                                      size={11}
                                      color={
                                        isTActive
                                          ? (t === 'packaging' ? colors.purpleLight : colors.amberLight)
                                          : colors.textDim
                                      }
                                    />
                                    <Text
                                      style={{
                                        fontSize: 10,
                                        fontWeight: isTActive ? '800' : '600',
                                        color: isTActive
                                          ? (t === 'packaging' ? colors.purpleLight : colors.amberLight)
                                          : colors.textDim,
                                      }}
                                    >
                                      {t === 'edible' ? 'Comestible' : 'Empaque'}
                                    </Text>
                                  </View>
                                </TouchableOpacity>
                              );
                            })}
                          </View>

                          <Text style={{ fontSize: 10, color: colors.textDim }}>
                            Costo: <Text style={{ fontWeight: '800', color: colors.emeraldLight }}>${unitRate} / {item.unit}</Text>
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
            </>
            )}

            {/* MANUAL PRODUCT ADD BUTTON & FORM */}
            <View style={{ marginTop: 12 }}>
              <TouchableOpacity
                onPress={() => setShowAddProduct(!showAddProduct)}
                style={[styles.manualAddTrigger, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
              >
                <Ionicons name={showAddProduct ? "close-circle" : "add-circle"} size={16} color={colors.brandLight} />
                <Text style={{ fontSize: 12, fontWeight: '800', color: colors.brandLight, flex: 1, marginLeft: 6 }}>
                  {showAddProduct ? 'Cerrar formulario manual' : '+ Agregar Producto Manual al Ticket'}
                </Text>
              </TouchableOpacity>

              {showAddProduct && (
                <View style={[styles.addProductBox, { borderColor: colors.borderSubtle, backgroundColor: colors.bgCard }]}>
                  <Text style={[styles.subLabel, { color: colors.textDim }]}>Agregar Producto Manual:</Text>
                  <TextInput
                    style={[styles.inputSm, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle, color: colors.textMain }]}
                    placeholder="Nombre del producto (ej. Harina Selecta)"
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
            </View>

            {/* TOTAL TICKET BAR */}
            <View style={[styles.totalCardBar, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}>
              <View>
                <Text style={[styles.totalLabel, { color: colors.textMain }]}>TOTAL DEL TICKET:</Text>
                <Text style={{ fontSize: 10, color: colors.textDim }}>
                  {items.length} artículos desglosados en ticket
                </Text>
              </View>
              <Text style={[styles.totalAmount, { color: colors.emeraldLight }]}>
                ${displayTotal.toFixed(2)} MXN
              </Text>
            </View>

            {/* Expandable Raw Text from OCR */}
            {Boolean(scanResult?.raw_text) && (
              <View style={{ marginTop: 10 }}>
                <TouchableOpacity
                  onPress={() => setShowRawText(!showRawText)}
                  style={[styles.rawTextBtn, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}>
                  <Ionicons name="document-text-outline" size={14} color={colors.brand} />
                  <Text style={[styles.rawTextBtnLabel, { color: colors.brand }]}>
                    {showRawText ? 'Ocultar Texto Leído por IA' : 'Ver Texto Completo Leído por IA'}
                  </Text>
                  <Ionicons name={showRawText ? 'chevron-up' : 'chevron-down'} size={14} color={colors.brand} />
                </TouchableOpacity>

                {showRawText && (
                  <View style={[styles.rawTextBox, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textDim, textTransform: 'uppercase' }}>
                        Texto OCR detectado ({scanResult?.raw_text?.length || 0} caracteres)
                      </Text>
                      <Text style={{ fontSize: 9, color: colors.textDim }}>
                        Desliza para ver todo ↓
                      </Text>
                    </View>
                    <ScrollView
                      style={styles.rawTextScroll}
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={true}
                      persistentScrollbar={true}
                    >
                      <Text
                        selectable={true}
                        style={[styles.rawTextContent, { color: colors.textMuted }]}
                      >
                        {scanResult?.raw_text}
                      </Text>
                    </ScrollView>
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
              title={
                isSaving
                  ? "Guardando..."
                  : expenseTarget === 'baking'
                  ? `Confirmar Insumos ($${displayTotal.toFixed(2)})`
                  : `Guardar Gasto General ($${displayTotal.toFixed(2)})`
              }
              variant="primary"
              disabled={isSaving}
              onPress={handleConfirm}
              icon={<Ionicons name="checkmark-circle" size={18} color="#fff" />}
              style={{ flex: 2 }}
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
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'flex-end',
  },
  dialog: {
    borderTopLeftRadius: radii.outer,
    borderTopRightRadius: radii.outer,
    height: Dimensions.get('window').height * 0.88,
    maxHeight: Dimensions.get('window').height * 0.92,
    borderWidth: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
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
    paddingBottom: 50,
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
  },
  rawTextScroll: {
    maxHeight: 180,
  },
  rawTextContent: {
    fontSize: 11,
    lineHeight: 17,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  fixedFooter: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    paddingBottom: Platform.OS === 'ios' ? 32 : 22,
    borderTopWidth: 1,
    elevation: 10,
  },
  statusSummaryPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  sectionContainer: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  miniBadge: {
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  emptyBoxSm: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radii.sm,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchedItemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: 10,
  },
  ticketItemName: {
    fontSize: 12.5,
    fontWeight: '800',
    flex: 1,
    paddingRight: 6,
  },
  ticketItemPrice: {
    fontSize: 12.5,
    fontWeight: '900',
  },
  detectedMatchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: radii.pill,
  },
  stockTransformRow: {
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  alertNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: 8,
    marginTop: 6,
    marginBottom: 4,
  },
  miniHeaderBtn: {
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingVertical: 2,
    paddingHorizontal: 7,
  },
  newItemCard: {
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: 10,
  },
  newItemNameInput: {
    fontSize: 12.5,
    fontWeight: '800',
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  unitChip: {
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingVertical: 4,
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeChip: {
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingVertical: 3,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualAddTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  targetSelectorCard: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 12,
    marginBottom: 14,
  },
  targetSelectorTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  targetSelectorSub: {
    fontSize: 11,
    marginTop: 2,
  },
  targetOptionBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: radii.sm,
    padding: 10,
  },
  targetOptionHeading: {
    fontSize: 12,
    fontWeight: '800',
  },
  targetOptionDesc: {
    fontSize: 9.5,
    lineHeight: 13,
    marginTop: 4,
  },
  operationalContainer: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 12,
    marginBottom: 14,
  },
  opItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  totalCardBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 12,
    marginTop: 12,
  },
});
