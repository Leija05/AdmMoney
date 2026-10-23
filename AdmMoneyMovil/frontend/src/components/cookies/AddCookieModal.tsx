import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Button } from '../ui/Button';
import { colors, radii, spacing } from '../../theme';
import { CookieProduct } from '../../lib/types';
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
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [salePrice, setSalePrice] = useState('35.00');
  const [recipeCost, setRecipeCost] = useState('9.67');
  const [batchYield, setBatchYield] = useState('16');
  const [imageUrl, setImageUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const priceNum = parseFloat(salePrice) || 0;
  const costNum = parseFloat(recipeCost) || 0;
  const profitNum = Math.max(0, priceNum - costNum);
  const marginPct = priceNum > 0 ? (profitNum / priceNum) * 100 : 0;
  const roiPct = costNum > 0 ? (profitNum / costNum) * 100 : 0;

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Nombre Requerido', 'Por favor ingresa el nombre de la receta de galleta.');
      return;
    }
    if (priceNum <= 0) {
      Alert.alert('Precio Inválido', 'El precio de venta debe ser mayor a 0.');
      return;
    }

    try {
      setIsSaving(true);
      await onAddCookie({
        name: name.trim(),
        description: description.trim() || 'Receta artesanal recién horneada.',
        sale_price: priceNum,
        recipe_cost: costNum,
        batch_yield: parseInt(batchYield, 10) || 16,
        image_url:
          imageUrl.trim() ||
          'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80',
        profit_per_unit: profitNum,
        profit_margin_pct: marginPct,
        ingredients: [
          { name: 'Masa Base & Mantequilla', quantity: 200, unit: 'g', cost: Number((costNum * 0.5).toFixed(2)) },
          { name: 'Insumos Clave & Chispas', quantity: 150, unit: 'g', cost: Number((costNum * 0.3).toFixed(2)) },
          { name: 'Empaque Individual Kraft', quantity: 1, unit: 'pza', cost: 2.90 },
        ],
      });

      setName('');
      setDescription('');
      setSalePrice('35.00');
      setRecipeCost('9.67');
      setImageUrl('');
      setIsSaving(false);
      onClose();
      Alert.alert('¡Receta Creada!', `La receta "${name}" ha sido agregada con un margen del ${marginPct.toFixed(1)}%.`);
    } catch (err) {
      setIsSaving(false);
      Alert.alert('Error', 'No se pudo guardar la receta.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerEyebrow}>Nueva Creación</Text>
              <Text style={styles.headerTitle}>Crear Receta de Galleta</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.formLabel}>Nombre de la Galleta</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Galleta Oreo Bomb, Nutella Trufa, Pistache"
              placeholderTextColor={colors.textDim}
              value={name}
              onChangeText={setName}
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.formLabel}>Precio Venta ($ MXN)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="35.00"
                  placeholderTextColor={colors.textDim}
                  value={salePrice}
                  onChangeText={setSalePrice}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.formLabel}>Costo Lote c/Empaque ($ MXN)</Text>
                <TextInput
                  style={styles.input}
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
                <Text style={styles.formLabel}>Rendimiento por Tanda</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="16"
                  placeholderTextColor={colors.textDim}
                  value={batchYield}
                  onChangeText={setBatchYield}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.formLabel}>URL Imagen (Opcional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://..."
                  placeholderTextColor={colors.textDim}
                  value={imageUrl}
                  onChangeText={setImageUrl}
                />
              </View>
            </View>

            <Text style={styles.formLabel}>Descripción & Notas de Sabor</Text>
            <TextInput
              style={[styles.input, { height: 65 }]}
              multiline
              placeholder="Ingredientes clave, peso aproximado (ej. 90g), toque de sal marina..."
              placeholderTextColor={colors.textDim}
              value={description}
              onChangeText={setDescription}
            />

            {/* Live Profit Preview */}
            <View style={styles.previewBox}>
              <View style={styles.previewCol}>
                <Text style={styles.previewKey}>Ganancia Neta / pza</Text>
                <Text style={styles.previewValGreen}>+${profitNum.toFixed(2)} MXN</Text>
              </View>
              <View style={styles.previewCol}>
                <Text style={styles.previewKey}>Margen de Utilidad</Text>
                <Text style={styles.previewValGold}>{marginPct.toFixed(1)}%</Text>
              </View>
              <View style={styles.previewCol}>
                <Text style={styles.previewKey}>Rendimiento (ROI)</Text>
                <Text style={styles.previewValGold}>~{roiPct.toFixed(0)}%</Text>
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
        </View>
      </View>
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
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
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
});
