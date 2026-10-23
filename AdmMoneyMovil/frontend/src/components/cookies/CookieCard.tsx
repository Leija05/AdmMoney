import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { DoubleBezelCard } from '../ui/DoubleBezelCard';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { colors, useThemeColors, radii } from '../../theme';
import { CookieProduct } from '../../lib/types';
import { Ionicons } from '@expo/vector-icons';

interface CookieCardProps {
  cookie: CookieProduct;
  onSell: (cookie: CookieProduct) => void;
  onInspect?: (cookie: CookieProduct) => void;
}

export const CookieCard: React.FC<CookieCardProps> = ({ cookie, onSell, onInspect }) => {
  const colors = useThemeColors();

  return (
    <DoubleBezelCard style={styles.cardWrapper}>
      <TouchableOpacity
        activeOpacity={onInspect ? 0.75 : 1}
        onPress={() => onInspect && onInspect(cookie)}
        style={styles.headerRow}
      >
        <View style={styles.imageWrapper}>
          <Image source={{ uri: cookie.image_url }} style={styles.image} />
        </View>

        <View style={styles.headerInfo}>
          <View style={styles.titleRow}>
            <Text style={[styles.cookieName, { color: colors.textMain }]} numberOfLines={1}>
              {cookie.name}
            </Text>
            {onInspect && (
              <Ionicons name="information-circle-outline" size={18} color={colors.amberLight} />
            )}
          </View>
          <Text style={[styles.cookieDesc, { color: colors.textMuted }]} numberOfLines={2}>
            {cookie.description || 'Receta artesanal neoyorquina.'}
          </Text>
          <View style={styles.badgeRow}>
            <Badge label={`${cookie.profit_margin_pct.toFixed(1)}% Margen`} variant="emerald" />
            <Text style={[styles.batchText, { color: colors.textDim }]}>
              Tanda: {cookie.batch_yield || 16} pzas
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* THE REQUESTED UNIT ECONOMICS: LO QUE GASTO vs PRECIO vs LO QUE GANO */}
      <TouchableOpacity
        activeOpacity={onInspect ? 0.75 : 1}
        onPress={() => onInspect && onInspect(cookie)}
        style={[styles.econContainer, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
      >
        <View style={styles.econBox}>
          <Text style={[styles.econLabel, { color: colors.textDim }]}>Lo que gasto</Text>
          <Text style={[styles.econValue, { color: colors.roseLight }]}>
            ${cookie.recipe_cost.toFixed(2)}
          </Text>
          <Text style={[styles.econSub, { color: colors.textDim }]}>con empaque</Text>
        </View>

        <View style={[styles.econBox, styles.econBorderLeft]}>
          <Text style={[styles.econLabel, { color: colors.textDim }]}>Precio venta</Text>
          <Text style={[styles.econValue, { color: colors.amberLight }]}>
            ${cookie.sale_price.toFixed(2)}
          </Text>
          <Text style={[styles.econSub, { color: colors.textDim }]}>individual</Text>
        </View>

        <View style={[styles.econBox, styles.econBorderLeft]}>
          <Text style={[styles.econLabel, { color: colors.textDim }]}>Lo que gano</Text>
          <Text style={[styles.econValue, { color: colors.emeraldLight }]}>
            +${cookie.profit_per_unit.toFixed(2)}
          </Text>
          <Text style={[styles.econSub, { color: colors.emeraldLight, fontWeight: '700' }]}>
            neta libre
          </Text>
        </View>
      </TouchableOpacity>

      {/* Promo Banner */}
      <View style={[styles.promoBanner, { backgroundColor: colors.purpleBg, borderColor: colors.purpleBorder }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="pricetag" size={12} color={colors.purpleLight} />
          <Text style={[styles.promoTitle, { color: colors.purpleLight }]}>Promoción 3 x $90</Text>
        </View>
        <Text style={[styles.promoValue, { color: colors.purpleLight }]}>+$60.99 ganancia neta</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {onInspect && (
          <Button
            title="Ver Receta"
            variant="secondary"
            onPress={() => onInspect(cookie)}
            icon={<Ionicons name="book-outline" size={15} color={colors.textMain} />}
            style={{ flex: 1, paddingVertical: 10 }}
          />
        )}
        <Button
          title={`Vender ($${cookie.sale_price.toFixed(2)})`}
          variant="amber"
          onPress={() => onSell(cookie)}
          icon={<Ionicons name="cart" size={17} color="#ffffff" />}
          style={{ flex: 2, paddingVertical: 10 }}
        />
      </View>
    </DoubleBezelCard>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  imageWrapper: {
    width: 74,
    height: 74,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
    color: colors.textMain,
    letterSpacing: -0.3,
  },
  cookieDesc: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
  badgeRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  batchText: {
    fontSize: 11,
    color: colors.textDim,
    fontWeight: '600',
  },
  econContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.bgTertiary,
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginTop: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  econBox: {
    alignItems: 'center',
    flex: 1,
  },
  econBorderLeft: {
    borderLeftWidth: 1,
    borderLeftColor: colors.borderSubtle,
  },
  econLabel: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    color: colors.textDim,
    letterSpacing: 0.5,
  },
  econValue: {
    fontSize: 16,
    fontWeight: '800',
    marginVertical: 2,
    letterSpacing: -0.3,
  },
  econSub: {
    fontSize: 9,
    color: colors.textDim,
  },
  promoBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.purpleBg,
    borderWidth: 1,
    borderColor: colors.purpleLight,
    borderRadius: radii.sm,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  promoTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.purpleText,
  },
  promoValue: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.purpleText,
  },
});
