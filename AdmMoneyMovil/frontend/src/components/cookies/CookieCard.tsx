import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { DoubleBezelCard } from '../ui/DoubleBezelCard';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useThemeColors, radii } from '../../theme';
import { CookieProduct } from '../../lib/types';
import { useAppStore } from '../../stores/app.store';
import { Ionicons } from '@expo/vector-icons';

interface CookieCardProps {
  cookie: CookieProduct;
  onSell: (cookie: CookieProduct) => void;
  onInspect?: (cookie: CookieProduct) => void;
  onLongPress?: (cookie: CookieProduct) => void;
  privacyMode?: boolean;
}

export const CookieCard: React.FC<CookieCardProps> = ({
  cookie,
  onSell,
  onInspect,
  onLongPress,
  privacyMode = false,
}) => {
  const colors = useThemeColors();
  const isDark = colors.isDark;
  const promotions = useAppStore((state) => state.promotions);

  const batchYield = cookie.batch_yield || 16;
  const unitCost = cookie.recipe_cost || 0;
  const packCost = typeof cookie.packaging_cost === 'number' ? cookie.packaging_cost : 2.0;
  const ingCost = typeof cookie.cost_per_cookie === 'number'
    ? cookie.cost_per_cookie
    : Math.max(0, unitCost - packCost);
  const salePrice = cookie.sale_price || 0;
  const profitPerUnit = cookie.profit_per_unit ?? (salePrice - unitCost);
  const marginPct = cookie.profit_margin_pct ?? (salePrice > 0 ? (profitPerUnit / salePrice) * 100 : 0);

  // Rendimiento y meta por lote
  const batchCost = unitCost * batchYield;
  const batchRevenue = salePrice * batchYield;
  const batchProfit = profitPerUnit * batchYield;

  // Promociones activas reales para esta galleta
  const activePromos = promotions.filter((p) => {
    if (!p.is_active) return false;
    if (p.target_type === 'all_products') return true;
    if (p.target_type === 'specific_products' && (p.target_product_ids || []).includes(cookie.id)) return true;
    if (p.target_type === 'category' && p.target_category && cookie.category === p.target_category) return true;
    return false;
  });

  const firstPromo = activePromos[0] || null;
  let promoDetails: { name: string; revenue: number; profit: number; badge: string } | null = null;

  if (firstPromo) {
    let qty = firstPromo.min_quantity || 1;
    let promoRevenue = 0;
    if (firstPromo.promo_type === 'combo_fixed_price') {
      qty = firstPromo.min_quantity || 3;
      promoRevenue = firstPromo.discount_value;
    } else if (firstPromo.promo_type === 'percentage') {
      qty = firstPromo.min_quantity || 12;
      promoRevenue = (salePrice * qty) * (1 - firstPromo.discount_value / 100);
    } else if (firstPromo.promo_type === 'two_for_one') {
      qty = 2;
      promoRevenue = salePrice * 1;
    } else if (firstPromo.promo_type === 'fixed_amount') {
      qty = firstPromo.min_quantity || 1;
      promoRevenue = Math.max(0, (salePrice * qty) - firstPromo.discount_value);
    } else {
      qty = firstPromo.min_quantity || 1;
      promoRevenue = salePrice * qty;
    }
    const promoCost = unitCost * qty;
    const promoProfit = promoRevenue - promoCost;

    promoDetails = {
      name: firstPromo.name,
      badge: firstPromo.badge_text || `${qty} pzas`,
      revenue: promoRevenue,
      profit: promoProfit,
    };
  }

  const handleCardPress = () => {
    if (onInspect) {
      onInspect(cookie);
    }
  };

  const handleCardLongPress = () => {
    if (onLongPress) {
      onLongPress(cookie);
    }
  };

  return (
    <DoubleBezelCard style={styles.cardWrapper}>
      <TouchableOpacity
        activeOpacity={0.78}
        onPress={handleCardPress}
        onLongPress={handleCardLongPress}
        delayLongPress={300}
        style={styles.headerRow}
      >
        {/* Cookie Image with Floating Glass Price Badge */}
        <View style={[styles.imageWrapper, { backgroundColor: isDark ? '#141A28' : '#F1F5F9', borderColor: colors.borderSubtle }]}>
          <Image source={{ uri: cookie.image_url }} style={styles.image} />
          <View style={[styles.floatingPricePill, { backgroundColor: isDark ? 'rgba(10, 13, 21, 0.85)' : 'rgba(255, 255, 255, 0.92)' }]}>
            <Text style={[styles.floatingPriceText, { color: colors.amberLight }]}>
              ${salePrice.toFixed(0)}
            </Text>
          </View>
        </View>

        <View style={styles.headerInfo}>
          <View style={styles.titleRow}>
            <Text style={[styles.cookieName, { color: colors.textMain }]} numberOfLines={1}>
              {cookie.name}
            </Text>
            <TouchableOpacity
              onPress={handleCardLongPress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="ellipsis-horizontal-circle" size={20} color={colors.amberLight} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.cookieDesc, { color: colors.textMuted }]} numberOfLines={2}>
            {cookie.description || 'Receta artesanal optimizada para alto rendimiento.'}
          </Text>
          <View style={styles.badgeRow}>
            <View style={[styles.marginBadge, { backgroundColor: marginPct >= 60 ? (isDark ? 'rgba(16, 185, 129, 0.16)' : '#D1FAE5') : (isDark ? 'rgba(245, 158, 11, 0.16)' : '#FEF3C7') }]}>
              <Ionicons name="sparkles" size={10} color={marginPct >= 60 ? colors.emeraldLight : colors.amberLight} />
              <Text style={[styles.marginBadgeText, { color: marginPct >= 60 ? colors.emeraldLight : colors.amberLight }]}>
                {privacyMode ? '•••% Margen' : `${marginPct.toFixed(1)}% Margen`}
              </Text>
            </View>
            <Text style={[styles.batchText, { color: colors.textDim }]}>
              Tanda: {batchYield} pzas
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* UNIT ECONOMICS: 3-Pill Bento */}
      <TouchableOpacity
        activeOpacity={0.78}
        onPress={handleCardPress}
        onLongPress={handleCardLongPress}
        delayLongPress={300}
        style={[styles.econContainer, { backgroundColor: isDark ? '#141A28' : '#F8FAFC', borderColor: colors.borderSubtle }]}
      >
        <View style={styles.econBox}>
          <Text style={[styles.econLabel, { color: colors.textDim }]}>Costo Pieza</Text>
          <Text style={[styles.econValue, { color: colors.roseLight }]}>
            {privacyMode ? '••••••' : `$${unitCost.toFixed(2)}`}
          </Text>
          <Text style={[styles.econSub, { color: colors.textDim }]} numberOfLines={1}>
            ${ingCost.toFixed(1)} + emp
          </Text>
        </View>

        <View style={[styles.econBox, styles.econBorderLeft, { borderLeftColor: colors.borderSubtle }]}>
          <Text style={[styles.econLabel, { color: colors.textDim }]}>Precio Venta</Text>
          <Text style={[styles.econValue, { color: colors.amberLight }]}>
            ${salePrice.toFixed(2)}
          </Text>
          <Text style={[styles.econSub, { color: colors.textDim }]}>individual</Text>
        </View>

        <View style={[styles.econBox, styles.econBorderLeft, { borderLeftColor: colors.borderSubtle, backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : '#ECFDF5', borderRadius: radii.sm }]}>
          <Text style={[styles.econLabel, { color: colors.emeraldLight }]}>Ganancia Neta</Text>
          <Text style={[styles.econValue, { color: colors.emeraldLight }]}>
            {privacyMode ? '••••••' : `+$${profitPerUnit.toFixed(2)}`}
          </Text>
          <Text style={[styles.econSub, { color: colors.emeraldLight, fontWeight: '800' }]}>
            libre / pza
          </Text>
        </View>
      </TouchableOpacity>

      {/* META GANANCIA LOTE */}
      <View style={[styles.batchGoalBanner, { backgroundColor: isDark ? '#111724' : '#F1F5F9', borderColor: colors.borderSubtle }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, paddingRight: 6 }}>
          <Ionicons name="flag" size={13} color={colors.amberLight} />
          <View>
            <Text style={[styles.batchGoalLabel, { color: colors.textDim }]}>
              Meta Lote ({batchYield} pzas horneadas)
            </Text>
            <Text style={{ fontSize: 9.5, color: colors.textMuted }}>
              Gasto ${batchCost.toFixed(1)} • Cobras ${batchRevenue.toFixed(1)}
            </Text>
          </View>
        </View>
        <Text style={[styles.batchGoalValue, { color: colors.emeraldLight }]}>
          {privacyMode ? '••••••' : `+$${batchProfit.toFixed(2)}`}
        </Text>
      </View>

      {/* PROMO BANNER DINÁMICO */}
      {promoDetails ? (
        <View style={[styles.promoBanner, { backgroundColor: isDark ? 'rgba(168, 85, 247, 0.15)' : '#F3E8FF', borderColor: isDark ? 'rgba(168, 85, 247, 0.35)' : '#E9D5FF' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1, paddingRight: 6 }}>
            <Ionicons name="pricetag" size={12} color={colors.purpleLight} />
            <Text style={[styles.promoTitle, { color: colors.purpleLight }]} numberOfLines={1}>
              {promoDetails.name} ({promoDetails.badge})
            </Text>
          </View>
          <Text style={[styles.promoValue, { color: colors.purpleLight }]}>
            {privacyMode ? '••••••' : `+$${promoDetails.profit.toFixed(2)} neta`}
          </Text>
        </View>
      ) : (
        <View style={[styles.noPromoBanner, { backgroundColor: isDark ? '#111724' : '#F8FAFC', borderColor: colors.borderSubtle }]}>
          <Ionicons name="pricetag-outline" size={11} color={colors.textDim} />
          <Text style={[styles.noPromoText, { color: colors.textDim }]}>
            Sin promociones activas • Venta individual regular
          </Text>
        </View>
      )}

      {/* BOTONES DE ACCIÓN */}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
        {onInspect && (
          <Button
            title="Receta"
            variant="secondary"
            onPress={() => onInspect(cookie)}
            icon={<Ionicons name="book-outline" size={15} color={colors.textMain} />}
            style={{ flex: 1 }}
          />
        )}
        <Button
          title={`Vender ($${cookie.sale_price.toFixed(2)})`}
          variant="amber"
          onPress={() => onSell(cookie)}
          icon={<Ionicons name="cart" size={16} color="#ffffff" />}
          style={{ flex: 2 }}
        />
      </View>
    </DoubleBezelCard>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    padding: 12,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  imageWrapper: {
    width: 78,
    height: 78,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  floatingPricePill: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radii.pill,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  floatingPriceText: {
    fontSize: 10,
    fontWeight: '900',
  },
  headerInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  cookieName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  cookieDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  badgeRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  marginBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: radii.pill,
  },
  marginBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  batchText: {
    fontSize: 11,
    fontWeight: '600',
  },
  econContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: radii.md,
    paddingVertical: 9,
    paddingHorizontal: 8,
    marginTop: 10,
    marginBottom: 6,
    borderWidth: 1,
  },
  econBox: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 2,
  },
  econBorderLeft: {
    borderLeftWidth: 1,
  },
  econLabel: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  econValue: {
    fontSize: 15,
    fontWeight: '900',
    marginVertical: 2,
    letterSpacing: -0.3,
  },
  econSub: {
    fontSize: 9,
  },
  batchGoalBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  batchGoalLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  batchGoalValue: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  promoBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  promoTitle: {
    fontSize: 11,
    fontWeight: '800',
  },
  promoValue: {
    fontSize: 11,
    fontWeight: '800',
  },
  noPromoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  noPromoText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
