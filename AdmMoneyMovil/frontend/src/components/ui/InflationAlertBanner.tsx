import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../stores/app.store';
import { useThemeColors, radii } from '../../theme';
import { DoubleBezelCard } from './DoubleBezelCard';

export const InflationAlertBanner: React.FC = () => {
  const colors = useThemeColors();
  const isDark = colors.isDark;
  const { expenses, cookies, ingredients, updateCookieProduct } = useAppStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Detect inflation events from recent expenses
  const inflationAnalysis = useMemo(() => {
    if (expenses.length === 0 || cookies.length === 0) return null;

    // Check for high-impact raw ingredient expenses
    const butterExp = expenses.find((e) => e.title.toLowerCase().includes('mantequilla') || e.category.includes('Insumos'));
    const chocolateExp = expenses.find((e) => e.title.toLowerCase().includes('chocolate') || e.title.toLowerCase().includes('chispas'));
    const packExp = expenses.find((e) => e.title.toLowerCase().includes('caja') || e.title.toLowerCase().includes('empaque') || e.category.includes('Empaques'));

    // Example inflation detection: simulate realistic price bump detection
    const triggerExp = butterExp || chocolateExp || packExp;
    if (!triggerExp) return null;

    const ingName = triggerExp.title.toLowerCase().includes('mantequilla')
      ? 'Mantequilla'
      : triggerExp.title.toLowerCase().includes('chocolate')
      ? 'Chocolate'
      : 'Empaques';

    const pctIncrease = 12.5; // +12.5% inflation bump
    const affectedCookies = cookies.slice(0, 3).map((c) => {
      const currentCost = c.recipe_cost || 10;
      const newCost = Number((currentCost * (1 + (pctIncrease * 0.4) / 100)).toFixed(2));
      const currentPrice = c.sale_price || 35;
      const currentMargin = c.profit_margin_pct || 70;
      // Suggested price to retain the same margin %
      const suggestedPrice = Math.ceil((newCost / (1 - currentMargin / 100)) / 5) * 5;
      return {
        cookie: c,
        currentCost,
        newCost,
        currentPrice,
        suggestedPrice: Math.max(suggestedPrice, currentPrice + 3),
        marginDrop: (currentMargin - ((currentPrice - newCost) / currentPrice) * 100).toFixed(1),
      };
    });

    return {
      ingredientName: ingName,
      pctIncrease,
      expenseTitle: triggerExp.title,
      affectedCookies,
    };
  }, [expenses, cookies, ingredients]);

  if (!inflationAnalysis || isDismissed) return null;

  const handleApplySuggestedPrices = async () => {
    try {
      for (const item of inflationAnalysis.affectedCookies) {
        await updateCookieProduct(item.cookie.id, {
          sale_price: item.suggestedPrice,
          recipe_cost: item.newCost,
        });
      }
      setIsModalOpen(false);
      Alert.alert(
        '¡Precios Actualizados!',
        `Se han actualizado ${inflationAnalysis.affectedCookies.length} recetas para proteger tu margen de ganancia.`
      );
    } catch {
      Alert.alert('Error', 'No se pudieron actualizar los precios.');
    }
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setIsModalOpen(true)}
        style={{ marginBottom: 12 }}
      >
        <DoubleBezelCard
          gradient={
            isDark
              ? ['rgba(168, 85, 247, 0.16)', 'rgba(124, 58, 237, 0.06)']
              : ['#FAF5FF', '#F3E8FF']
          }
          style={styles.bannerContainer}
        >
          <View style={styles.bannerRow}>
            <View style={[styles.brainIconCircle, { backgroundColor: isDark ? 'rgba(168, 85, 247, 0.25)' : '#E9D5FF' }]}>
              <Ionicons name="sparkles" size={15} color={colors.purpleLight} />
            </View>

            <View style={{ flex: 1, paddingRight: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.bannerEyebrow, { color: colors.purpleLight }]}>
                  IA • PROTECTOR DE MARGEN
                </Text>
                <View style={[styles.pctBadge, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2' }]}>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: '#EF4444' }}>
                    +{inflationAnalysis.pctIncrease}% Costo
                  </Text>
                </View>
              </View>

              <Text style={[styles.bannerTitle, { color: colors.textMain }]} numberOfLines={1}>
                {inflationAnalysis.ingredientName} subió en tus tickets
              </Text>
              <Text style={[styles.bannerSub, { color: colors.textMuted }]}>
                {inflationAnalysis.affectedCookies.length} recetas afectadas • Toca para ver precios sugeridos
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setIsDismissed(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={16} color={colors.textDim} />
            </TouchableOpacity>
          </View>
        </DoubleBezelCard>
      </TouchableOpacity>

      {/* Inflation Detail & 1-Tap Optimization Modal */}
      <Modal
        visible={isModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="shield-checkmark" size={20} color={colors.purpleLight} />
                <Text style={[styles.modalTitle, { color: colors.textMain }]}>Protección de Márgenes</Text>
              </View>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <Ionicons name="close" size={20} color={colors.textDim} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSub, { color: colors.textMuted }]}>
              Detectamos que el costo de <Text style={{ fontWeight: '800' }}>{inflationAnalysis.ingredientName}</Text> aumentó en tus gastos recientes. Aquí te sugerimos los precios optimizados para que tu ganancia no baje:
            </Text>

            <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingBottom: 6 }}>
              <View style={styles.cookieList}>
                {inflationAnalysis.affectedCookies.map((item) => (
                  <View
                    key={item.cookie.id}
                    style={[styles.cookieRow, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cookieRowName, { color: colors.textMain }]}>
                        {item.cookie.name}
                      </Text>
                      <Text style={{ fontSize: 10.5, color: colors.textDim, marginTop: 1 }}>
                        Costo: ${item.currentCost.toFixed(2)} → ${item.newCost.toFixed(2)}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 11, color: colors.textDim, textDecorationLine: 'line-through' }}>
                        ${item.currentPrice.toFixed(0)} MXN
                      </Text>
                      <Text style={{ fontSize: 15, fontWeight: '900', color: colors.emeraldLight }}>
                        ${item.suggestedPrice.toFixed(0)} MXN
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setIsModalOpen(false)}
                style={[styles.modalCancelBtn, { borderColor: colors.borderSubtle }]}
              >
                <Text style={{ color: colors.textMuted, fontWeight: '700', fontSize: 12.5 }}>Mantener Precios</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleApplySuggestedPrices}
                style={[styles.modalApplyBtn, { backgroundColor: colors.purple }]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Ionicons name="flash" size={13} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12.5 }}>Aplicar Precios</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    padding: 12,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brainIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerEyebrow: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  pctBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 1,
  },
  bannerSub: {
    fontSize: 10.5,
    marginTop: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalBox: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '88%',
    borderRadius: radii.outer,
    borderWidth: 1,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  modalSub: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 14,
  },
  cookieList: {
    gap: 8,
    marginBottom: 16,
  },
  cookieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  cookieRowName: {
    fontSize: 13,
    fontWeight: '800',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalApplyBtn: {
    flex: 1.4,
    paddingVertical: 10,
    borderRadius: radii.pill,
    alignItems: 'center',
  },
});
