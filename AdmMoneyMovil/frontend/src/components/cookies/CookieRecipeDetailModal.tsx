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
import { colors, radii, spacing } from '../../theme';
import { CookieProduct } from '../../lib/types';
import { Ionicons } from '@expo/vector-icons';

interface CookieRecipeDetailModalProps {
  visible: boolean;
  cookie: CookieProduct | null;
  onClose: () => void;
  onSell: (cookie: CookieProduct) => void;
}

export const CookieRecipeDetailModal: React.FC<CookieRecipeDetailModalProps> = ({
  visible,
  cookie,
  onClose,
  onSell,
}) => {
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

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.headerEyebrow}>Estructura de Costos & Receta</Text>
              <Text style={styles.headerTitle} numberOfLines={1}>
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
                <Text style={styles.descText}>
                  {cookie.description || 'Receta artesanal optimizada para alto margen de utilidad.'}
                </Text>
                <View style={styles.tagRow}>
                  <Badge label={`Tanda: ${batchYield} pzas`} variant="amber" />
                  <Badge label={`${marginPct.toFixed(1)}% Margen`} variant="emerald" />
                </View>
              </View>
            </View>

            {/* UNIT ECONOMICS COMPARISON CARD */}
            <View style={styles.economicsCard}>
              <Text style={styles.sectionTitle}>ESTRUCTURA EXACTA DE GANANCIA</Text>

              {/* Esquema 1: Venta Individual ($35) */}
              <View style={styles.schemeBox}>
                <View style={styles.schemeHeader}>
                  <Text style={styles.schemeName}>1. Venta Individual</Text>
                  <Text style={styles.schemePrice}>${salePrice.toFixed(2)} MXN</Text>
                </View>
                <View style={styles.schemeMetricRow}>
                  <Text style={styles.schemeKey}>Costo Unitario Lote (Insumos + Empaque):</Text>
                  <Text style={styles.schemeValRed}>-${unitCost.toFixed(2)} MXN</Text>
                </View>
                <View style={styles.schemeMetricRow}>
                  <Text style={styles.schemeKeyBold}>Ganancia Neta Libre por Pieza:</Text>
                  <Text style={styles.schemeValGreen}>+${netProfit.toFixed(2)} MXN</Text>
                </View>
                <View style={styles.schemeMetricRow}>
                  <Text style={styles.schemeKey}>Rendimiento sobre costo (ROI):</Text>
                  <Text style={styles.schemeValGold}>~{roiPct.toFixed(0)}% ROI</Text>
                </View>
              </View>

              {/* Esquema 2: Promoción 3 x $90 ($30/u) */}
              <View style={[styles.schemeBox, { marginTop: 10 }]}>
                <View style={styles.schemeHeader}>
                  <Text style={styles.schemeName}>2. Promoción 3 x $90 ($30.00 c/u)</Text>
                  <Text style={[styles.schemePrice, { color: colors.emeraldLight }]}>
                    ${promoPrice.toFixed(2)} MXN
                  </Text>
                </View>
                <View style={styles.schemeMetricRow}>
                  <Text style={styles.schemeKey}>Costo Lote 3 piezas ($9.67 x 3):</Text>
                  <Text style={styles.schemeValRed}>-${promoCost.toFixed(2)} MXN</Text>
                </View>
                <View style={styles.schemeMetricRow}>
                  <Text style={styles.schemeKeyBold}>Ganancia Neta Libre del Paquete:</Text>
                  <Text style={styles.schemeValGreen}>+${promoProfit.toFixed(2)} MXN</Text>
                </View>
                <View style={styles.schemeMetricRow}>
                  <Text style={styles.schemeKey}>Ganancia por galleta en promo:</Text>
                  <Text style={styles.schemeValGold}>
                    +${(promoProfit / 3).toFixed(2)} MXN (~{promoRoi.toFixed(0)}% ROI)
                  </Text>
                </View>
              </View>
            </View>

            {/* INGREDIENTS BREAKDOWN LIST */}
            {cookie.ingredients && cookie.ingredients.length > 0 && (
              <View style={styles.ingredientsCard}>
                <Text style={styles.sectionTitle}>
                  INSUMOS DE LA RECETA ({cookie.ingredients.length})
                </Text>
                <View style={styles.ingList}>
                  {cookie.ingredients.map((ing, idx) => (
                    <View key={idx} style={styles.ingRow}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={styles.ingName}>{ing.name}</Text>
                        <Text style={styles.ingSub}>
                          {ing.quantity} {ing.unit} por tanda
                        </Text>
                      </View>
                      <Text style={styles.ingCost}>
                        ${typeof ing.cost === 'number' ? ing.cost.toFixed(2) : ing.cost}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
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
});
