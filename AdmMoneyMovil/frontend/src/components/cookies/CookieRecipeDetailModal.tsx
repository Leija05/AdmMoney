import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image
} from 'react-native';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { colors, useThemeColors, radii, spacing } from '../../theme';
import { CookieProduct } from '../../lib/types';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from 'react-native';
import { confirmAction } from '../../stores/confirmation.store';

interface CookieRecipeDetailModalProps {
  visible: boolean;
  cookie: CookieProduct | null;
  onClose: () => void;
  onSell: (cookie: CookieProduct) => void;
  onDeleteCookie?: (id: number) => Promise<void>;
}

export const CookieRecipeDetailModal: React.FC<CookieRecipeDetailModalProps> = ({
  visible,
  cookie,
  onClose,
  onSell,
  onDeleteCookie,
}) => {
  const colors = useThemeColors();
  const isDark = colors.isDark;

  if (!cookie) return null;

  const batchYield = cookie.batch_yield || 16;
  const unitCost = cookie.recipe_cost || 9.67;
  const salePrice = cookie.sale_price || 35.0;
  const netProfit = cookie.profit_per_unit || (salePrice - unitCost);
  const marginPct = cookie.profit_margin_pct || (salePrice > 0 ? (netProfit / salePrice) * 100 : 0);
  const roiPct = unitCost > 0 ? (netProfit / unitCost) * 100 : 0;

  // 3 x $90 Promo metrics
  const promoPrice = 90.0;
  const promoCost = unitCost * 3;
  const promoProfit = promoPrice - promoCost;
  const promoRoi = promoCost > 0 ? (promoProfit / promoCost) * 100 : 0;

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
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: isDark ? '#2A303C' : '#E5E7EB' }]}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={[styles.headerEyebrow, { color: colors.amberLight }]}>
                Estructura de Costos & Receta
              </Text>
              <Text
                style={[styles.headerTitle, { color: isDark ? '#F1F3F7' : '#181A1F' }]}
                numberOfLines={1}
              >
                {cookie.name}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Hero Image & Overview */}
            <View style={styles.heroRow}>
              {cookie.image_url ? (
                <Image source={{ uri: cookie.image_url }} style={styles.cookieImage} />
              ) : null}
              <View style={{ flex: 1 }}>
                <Text style={[styles.descText, { color: isDark ? '#94A3B8' : '#475569' }]}>
                  {cookie.description || 'Receta artesanal optimizada para alto margen de utilidad.'}
                </Text>
                <View style={styles.tagRow}>
                  <Badge label={`Tanda: ${batchYield} pzas`} variant="amber" />
                  <Badge label={`${marginPct.toFixed(1)}% Margen`} variant="emerald" />
                </View>
              </View>
            </View>

            {/* UNIT ECONOMICS COMPARISON CARD */}
            <View
              style={[
                styles.economicsCard,
                {
                  backgroundColor: isDark ? '#141824' : '#F8FAFC',
                  borderColor: isDark ? '#283144' : '#E2E8F0',
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: isDark ? '#F1F3F7' : '#0F172A' }]}>
                ESTRUCTURA EXACTA DE GANANCIA
              </Text>

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
                  <Text style={[styles.schemeName, { color: isDark ? '#F1F3F7' : '#0F172A' }]}>
                    1. Venta Individual
                  </Text>
                  <Text style={[styles.schemePrice, { color: isDark ? '#F1F3F7' : '#0F172A' }]}>
                    ${salePrice.toFixed(2)} MXN
                  </Text>
                </View>
                <View style={styles.schemeMetricRow}>
                  <Text style={[styles.schemeKey, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    Costo Unitario Lote (Insumos + Empaque):
                  </Text>
                  <Text style={styles.schemeValRed}>-${unitCost.toFixed(2)} MXN</Text>
                </View>
                <View style={styles.schemeMetricRow}>
                  <Text style={[styles.schemeKeyBold, { color: isDark ? '#F1F3F7' : '#0F172A' }]}>
                    Ganancia Neta Libre por Pieza:
                  </Text>
                  <Text style={styles.schemeValGreen}>+${netProfit.toFixed(2)} MXN</Text>
                </View>
                <View style={styles.schemeMetricRow}>
                  <Text style={[styles.schemeKey, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    Rendimiento sobre costo (ROI):
                  </Text>
                  <Text style={styles.schemeValGold}>~{roiPct.toFixed(0)}% ROI</Text>
                </View>
              </View>

              {/* Esquema 2: Promoción 3 x $90 ($30/u) */}
              <View
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
                  <Text style={[styles.schemeName, { color: isDark ? '#F1F3F7' : '#0F172A' }]}>
                    2. Promoción 3 x $90 ($30.00 c/u)
                  </Text>
                  <Text style={[styles.schemePrice, { color: colors.emeraldLight }]}>
                    ${promoPrice.toFixed(2)} MXN
                  </Text>
                </View>
                <View style={styles.schemeMetricRow}>
                  <Text style={[styles.schemeKey, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    Costo Lote 3 piezas ($9.67 x 3):
                  </Text>
                  <Text style={styles.schemeValRed}>-${promoCost.toFixed(2)} MXN</Text>
                </View>
                <View style={styles.schemeMetricRow}>
                  <Text style={[styles.schemeKeyBold, { color: isDark ? '#F1F3F7' : '#0F172A' }]}>
                    Ganancia Neta Libre del Paquete:
                  </Text>
                  <Text style={styles.schemeValGreen}>+${promoProfit.toFixed(2)} MXN</Text>
                </View>
                <View style={styles.schemeMetricRow}>
                  <Text style={[styles.schemeKey, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    Ganancia por galleta en promo:
                  </Text>
                  <Text style={styles.schemeValGold}>
                    +${(promoProfit / 3).toFixed(2)} MXN (~{promoRoi.toFixed(0)}% ROI)
                  </Text>
                </View>
              </View>
            </View>

            {/* INGREDIENTS BREAKDOWN LIST */}
            {cookie.ingredients && cookie.ingredients.length > 0 && (
              <View
                style={[
                  styles.ingredientsCard,
                  {
                    backgroundColor: isDark ? '#141824' : '#F8FAFC',
                    borderColor: isDark ? '#283144' : '#E2E8F0',
                  },
                ]}
              >
                <Text style={[styles.sectionTitle, { color: isDark ? '#F1F3F7' : '#0F172A' }]}>
                  INSUMOS DE LA RECETA ({cookie.ingredients.length})
                </Text>
                <View style={styles.ingList}>
                  {cookie.ingredients.map((ing, idx) => (
                    <View key={idx} style={styles.ingRow}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={[styles.ingName, { color: isDark ? '#F1F3F7' : '#0F172A' }]}>
                          {ing.name}
                        </Text>
                        <Text style={[styles.ingSub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                          {ing.quantity} {ing.unit} por tanda
                        </Text>
                      </View>
                      <Text style={[styles.ingCost, { color: isDark ? '#F1F3F7' : '#0F172A' }]}>
                        ${typeof ing.cost === 'number' ? ing.cost.toFixed(2) : ing.cost}
                      </Text>
                    </View>
                  ))}
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
    maxHeight: '92%',
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
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cookieImage: {
    width: 70,
    height: 70,
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
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textDim,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
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
    alignItems: 'center',
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
    marginBottom: 20,
  },
  ingList: {
    gap: 8,
  },
  ingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
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
});
