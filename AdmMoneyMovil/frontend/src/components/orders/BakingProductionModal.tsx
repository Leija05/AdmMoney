import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  PanResponder,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order, CookieProduct, Ingredient } from '../../lib/types';
import { useThemeColors, radii, gradients } from '../../theme';
import { DoubleBezelCard } from '../ui/DoubleBezelCard';
import { LinearGradient } from 'expo-linear-gradient';

interface BakingProductionModalProps {
  visible: boolean;
  onClose: () => void;
  orders: Order[];
  cookies: CookieProduct[];
  ingredients: Ingredient[];
}

export const BakingProductionModal: React.FC<BakingProductionModalProps> = ({
  visible,
  onClose,
  orders,
  cookies,
  ingredients,
}) => {
  const colors = useThemeColors();
  const isDark = colors.isDark;
  const screenHeight = Dimensions.get('window').height;
  const modalHeight = Math.min(screenHeight * 0.92, 850);

  const [dateFilter, setDateFilter] = useState<'today_tomorrow' | 'all_active'>('today_tomorrow');
  const [checkedBatches, setCheckedBatches] = useState<Record<string, boolean>>({});

  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
    }
  }, [visible]);

  // Swipe-down-to-dismiss
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        return gestureState.dy > 8 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.2;
      },
      onPanResponderMove: (_evt, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        } else {
          translateY.setValue(gestureState.dy * 0.15);
        }
      },
      onPanResponderRelease: (_evt, gestureState) => {
        if (gestureState.dy > 100 || (gestureState.dy > 30 && gestureState.vy > 0.35)) {
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

  // Filter orders
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const targetOrders = useMemo(() => {
    return orders.filter((o) => {
      if (o.status === 'Cancelado' || o.status === 'Completado') return false;
      if (dateFilter === 'today_tomorrow') {
        return o.delivery_date === todayStr || o.delivery_date === tomorrowStr;
      }
      return true;
    });
  }, [orders, dateFilter, todayStr, tomorrowStr]);

  // Group cookie requirements
  const productionPlan = useMemo(() => {
    const map = new Map<
      number,
      {
        cookie: CookieProduct;
        orderedUnits: number;
        batchYield: number;
        batchesNeeded: number;
        surplusUnits: number;
        customers: string[];
      }
    >();

    targetOrders.forEach((o) => {
      o.items.forEach((item) => {
        const cookie = cookies.find((c) => c.id === item.product_id) || {
          id: item.product_id,
          name: item.product_name,
          sale_price: item.unit_price,
          recipe_cost: item.unit_cost || 10,
          batch_yield: 16,
          cost_per_cookie: 8,
          packaging_cost: 2,
        } as CookieProduct;

        const current = map.get(cookie.id) || {
          cookie,
          orderedUnits: 0,
          batchYield: cookie.batch_yield || 16,
          batchesNeeded: 0,
          surplusUnits: 0,
          customers: [],
        };

        current.orderedUnits += item.quantity;
        if (o.customer_name && !current.customers.includes(o.customer_name)) {
          current.customers.push(o.customer_name);
        }

        map.set(cookie.id, current);
      });
    });

    const items = Array.from(map.values()).map((p) => {
      const yieldSize = p.batchYield > 0 ? p.batchYield : 16;
      const batches = Math.ceil(p.orderedUnits / yieldSize);
      const surplus = batches * yieldSize - p.orderedUnits;
      return {
        ...p,
        batchesNeeded: Math.max(1, batches),
        surplusUnits: surplus,
      };
    });

    return items;
  }, [targetOrders, cookies]);

  const totalCookiesToDeliver = productionPlan.reduce((acc, p) => acc + p.orderedUnits, 0);
  const totalTandas = productionPlan.reduce((acc, p) => acc + p.batchesNeeded, 0);
  const totalSurplus = productionPlan.reduce((acc, p) => acc + p.surplusUnits, 0);

  // Calculate estimated ingredients for all tandas
  const estimatedIngredients = useMemo(() => {
    // Standard artisanal bakery ratios per tanda of ~16 cookies (approx 800g dough)
    return [
      { name: 'Mantequilla sin sal', amount: `${(totalTandas * 225).toFixed(0)} g`, note: 'A temperatura ambiente' },
      { name: 'Harina de trigo todo uso', amount: `${(totalTandas * 320).toFixed(0)} g`, note: 'Tamizada' },
      { name: 'Azúcar mascabado / morena', amount: `${(totalTandas * 180).toFixed(0)} g`, note: 'Compacta' },
      { name: 'Azúcar estándar / blanca', amount: `${(totalTandas * 90).toFixed(0)} g`, note: 'Fina' },
      { name: 'Huevos enteros', amount: `${totalTandas * 2} pzas`, note: 'Grado A' },
      { name: 'Chispas / Trozos de Chocolate', amount: `${(totalTandas * 240).toFixed(0)} g`, note: 'Semi-amargo / con leche' },
    ];
  }, [totalTandas]);

  const toggleBatchChecked = (cookieId: number, batchNum: number) => {
    const key = `${cookieId}_${batchNum}`;
    setCheckedBatches((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSharePlan = async () => {
    const dateTitle = dateFilter === 'today_tomorrow' ? 'Hoy y Mañana' : 'Todos los Pendientes';
    let text = `*PLAN DE HORNO & PRODUCCIÓN - LUCKY COOKIES*\n• Periodo: ${dateTitle}\n• Pedidos incluidos: ${targetOrders.length}\n• Galletas a entregar: ${totalCookiesToDeliver} pzas\n• Tandas a hornear: ${totalTandas} tandas\n• Sobrante para mostrador: +${totalSurplus} pzas\n\n`;

    text += `*--- DETALLE POR SABOR ---*\n`;
    productionPlan.forEach((p) => {
      text += `• *${p.cookie.name}*: Hornear ${p.batchesNeeded} tanda(s) (${p.orderedUnits} pedido + ${p.surplusUnits} mostrador)\n`;
      text += `  Clientes: ${p.customers.join(', ') || 'Varios'}\n`;
    });

    text += `\n*--- INSUMOS BASE A DESCONGELAR / PESAR ---*\n`;
    estimatedIngredients.forEach((ing) => {
      text += `• ${ing.name}: ${ing.amount}\n`;
    });

    try {
      await Share.share({ message: text });
    } catch {}
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.dialog,
            {
              height: modalHeight,
              backgroundColor: colors.bgCard,
              borderColor: colors.borderSubtle,
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Header Drag Handle */}
          <View {...panResponder.panHandlers} style={{ backgroundColor: colors.bgCard }}>
            <View style={styles.dragHandleContainer}>
              <View
                style={[
                  styles.dragHandleBar,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)' },
                ]}
              />
              <Text style={[styles.dragHandleHint, { color: colors.textDim }]}>
                Desliza hacia abajo para cerrar
              </Text>
            </View>

            {/* Modal Title Row */}
            <View style={styles.topRow}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="flame" size={20} color={colors.amberLight} />
                  <Text style={[styles.title, { color: colors.textMain }]}>Plan de Horno de Hoy</Text>
                </View>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  Calculadora de tandas exactas y masa para optimizar tu producción.
                </Text>
              </View>

              <TouchableOpacity
                onPress={onClose}
                style={[
                  styles.closeBtn,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
                ]}
              >
                <Ionicons name="close" size={20} color={colors.textMain} />
              </TouchableOpacity>
            </View>

            {/* Date Segment Filter */}
            <View style={[styles.filterBar, { backgroundColor: colors.bgTertiary }]}>
              <TouchableOpacity
                onPress={() => setDateFilter('today_tomorrow')}
                style={[
                  styles.filterTab,
                  dateFilter === 'today_tomorrow' && {
                    backgroundColor: colors.brand,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons
                    name="flash-outline"
                    size={13}
                    color={dateFilter === 'today_tomorrow' ? '#FFFFFF' : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.filterTabText,
                      { color: dateFilter === 'today_tomorrow' ? '#FFFFFF' : colors.textMuted },
                      dateFilter === 'today_tomorrow' && { fontWeight: '800' },
                    ]}
                  >
                    Hoy y Mañana ({targetOrders.length})
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setDateFilter('all_active')}
                style={[
                  styles.filterTab,
                  dateFilter === 'all_active' && {
                    backgroundColor: colors.brand,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons
                    name="list-outline"
                    size={13}
                    color={dateFilter === 'all_active' ? '#FFFFFF' : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.filterTabText,
                      { color: dateFilter === 'all_active' ? '#FFFFFF' : colors.textMuted },
                      dateFilter === 'all_active' && { fontWeight: '800' },
                    ]}
                  >
                    Todos Pendientes ({orders.filter((o) => o.status !== 'Completado' && o.status !== 'Cancelado').length})
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Scrollable Plan Content */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {productionPlan.length === 0 ? (
              <DoubleBezelCard style={styles.emptyCard}>
                <Ionicons name="checkmark-done-circle" size={42} color={colors.emeraldLight} />
                <Text style={[styles.emptyTitle, { color: colors.textMain }]}>
                  ¡Todo Listo en el Horno!
                </Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                  No tienes pedidos pendientes de entrega para esta fecha. ¡Buen momento para hornear tanda libre para venta de mostrador!
                </Text>
              </DoubleBezelCard>
            ) : (
              <>
                {/* 3 Metric High-End Summary Pills */}
                <View style={styles.metricSummaryRow}>
                  <View style={[styles.summaryPill, { backgroundColor: colors.brandBg, borderColor: colors.brandBorder }]}>
                    <Text style={[styles.summaryPillVal, { color: colors.brandText }]}>
                      {totalCookiesToDeliver}
                    </Text>
                    <Text style={[styles.summaryPillLabel, { color: colors.brandText }]}>
                      Pzas a Entregar
                    </Text>
                  </View>

                  <View style={[styles.summaryPill, { backgroundColor: colors.amberBg, borderColor: colors.amberBorder }]}>
                    <Text style={[styles.summaryPillVal, { color: colors.amberLight }]}>
                      {totalTandas}
                    </Text>
                    <Text style={[styles.summaryPillLabel, { color: colors.amberLight }]}>
                      Tandas de Horno
                    </Text>
                  </View>

                  <View style={[styles.summaryPill, { backgroundColor: colors.emeraldBg, borderColor: colors.emeraldBorder }]}>
                    <Text style={[styles.summaryPillVal, { color: colors.emeraldLight }]}>
                      +{totalSurplus}
                    </Text>
                    <Text style={[styles.summaryPillLabel, { color: colors.emeraldLight }]}>
                      Pzas Mostrador
                    </Text>
                  </View>
                </View>

                {/* Section: Sabor por Sabor con Tandas y Checkboxes */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, marginTop: 4 }}>
                  <Ionicons name="flame-outline" size={16} color={colors.amberLight} />
                  <Text style={[styles.sectionHeading, { color: colors.textMain, marginTop: 0 }]}>
                    Tandas de Horno por Sabor
                  </Text>
                </View>

                {productionPlan.map((planItem) => (
                  <DoubleBezelCard key={planItem.cookie.id} style={styles.flavorCard}>
                    <View style={styles.flavorHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.flavorName, { color: colors.textMain }]}>
                          {planItem.cookie.name}
                        </Text>
                        <Text style={[styles.flavorMeta, { color: colors.textMuted }]}>
                          Pedido por: {planItem.customers.join(', ') || 'Cliente'}
                        </Text>
                      </View>

                      <View style={[styles.tandaBadge, { backgroundColor: colors.amberBg, borderColor: colors.amberBorder }]}>
                        <Text style={[styles.tandaBadgeText, { color: colors.amberLight }]}>
                          {planItem.batchesNeeded} {planItem.batchesNeeded === 1 ? 'Tanda' : 'Tandas'}
                        </Text>
                      </View>
                    </View>

                    {/* Breakdown Math */}
                    <View style={[styles.breakdownBox, { backgroundColor: colors.bgTertiary }]}>
                      <View style={styles.breakdownCol}>
                        <Text style={[styles.breakdownVal, { color: colors.textMain }]}>
                          {planItem.orderedUnits} pzas
                        </Text>
                        <Text style={[styles.breakdownLbl, { color: colors.textDim }]}>Para pedidos</Text>
                      </View>
                      <View style={[styles.breakdownDivider, { backgroundColor: colors.borderSubtle }]} />
                      <View style={styles.breakdownCol}>
                        <Text style={[styles.breakdownVal, { color: colors.emeraldLight }]}>
                          +{planItem.surplusUnits} pzas
                        </Text>
                        <Text style={[styles.breakdownLbl, { color: colors.emeraldLight }]}>
                          Libres mostrador
                        </Text>
                      </View>
                      <View style={[styles.breakdownDivider, { backgroundColor: colors.borderSubtle }]} />
                      <View style={styles.breakdownCol}>
                        <Text style={[styles.breakdownVal, { color: colors.amberLight }]}>
                          {planItem.batchYield} pzas/tanda
                        </Text>
                        <Text style={[styles.breakdownLbl, { color: colors.textDim }]}>Rendimiento</Text>
                      </View>
                    </View>

                    {/* Interactive Batch Checkboxes */}
                    <View style={styles.batchCheckboxesRow}>
                      {Array.from({ length: planItem.batchesNeeded }).map((_, idx) => {
                        const batchNum = idx + 1;
                        const isDone = Boolean(checkedBatches[`${planItem.cookie.id}_${batchNum}`]);
                        return (
                          <TouchableOpacity
                            key={batchNum}
                            activeOpacity={0.75}
                            onPress={() => toggleBatchChecked(planItem.cookie.id, batchNum)}
                            style={[
                              styles.batchCheckBtn,
                              {
                                backgroundColor: isDone
                                  ? colors.emeraldBg
                                  : isDark
                                  ? '#141A28'
                                  : '#FFFFFF',
                                borderColor: isDone ? colors.emerald : colors.borderSubtle,
                              },
                            ]}
                          >
                            <Ionicons
                              name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
                              size={15}
                              color={isDone ? colors.emeraldLight : colors.textDim}
                            />
                            <Text
                              style={[
                                styles.batchCheckText,
                                {
                                  color: isDone ? colors.emeraldLight : colors.textMain,
                                  fontWeight: isDone ? '800' : '600',
                                },
                              ]}
                            >
                              Tanda #{batchNum} • {isDone ? 'Lista' : 'Pendiente'}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </DoubleBezelCard>
                ))}

                {/* Section: Insumos Necesarios */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, marginTop: 18 }}>
                  <Ionicons name="scale-outline" size={16} color={colors.brandLight} />
                  <Text style={[styles.sectionHeading, { color: colors.textMain, marginTop: 0 }]}>
                    Insumos Base a Pesar / Descongelar
                  </Text>
                </View>

                <DoubleBezelCard style={styles.ingredientsCard}>
                  {estimatedIngredients.map((ing, i) => (
                    <View
                      key={i}
                      style={[
                        styles.ingRow,
                        i < estimatedIngredients.length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: colors.borderSubtle,
                        },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.ingName, { color: colors.textMain }]}>{ing.name}</Text>
                        <Text style={[styles.ingNote, { color: colors.textDim }]}>{ing.note}</Text>
                      </View>
                      <View style={[styles.ingAmountBadge, { backgroundColor: colors.bgTertiary }]}>
                        <Text style={[styles.ingAmountText, { color: colors.brandText }]}>
                          {ing.amount}
                        </Text>
                      </View>
                    </View>
                  ))}
                </DoubleBezelCard>
              </>
            )}
          </ScrollView>

          {/* Bottom Action Footer */}
          {productionPlan.length > 0 && (
            <View style={[styles.footer, { borderTopColor: colors.borderSubtle }]}>
              <TouchableOpacity
                onPress={handleSharePlan}
                activeOpacity={0.85}
                style={[styles.shareBtn, { backgroundColor: colors.whatsapp }]}
              >
                <Ionicons name="logo-whatsapp" size={17} color="#FFFFFF" />
                <Text style={styles.shareBtnText}>Compartir Plan de Cocina</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  dialog: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  dragHandleBar: {
    width: 38,
    height: 4.5,
    borderRadius: 2.5,
  },
  dragHandleHint: {
    fontSize: 9.5,
    fontWeight: '600',
    marginTop: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 3,
    borderRadius: radii.pill,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  filterTabText: {
    fontSize: 11,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  metricSummaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  summaryPill: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  summaryPillVal: {
    fontSize: 19,
    fontWeight: '900',
  },
  summaryPillLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  flavorCard: {
    marginBottom: 10,
  },
  flavorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  flavorName: {
    fontSize: 15,
    fontWeight: '800',
  },
  flavorMeta: {
    fontSize: 11,
    marginTop: 1,
  },
  tandaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  tandaBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  breakdownBox: {
    flexDirection: 'row',
    borderRadius: radii.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  breakdownCol: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownVal: {
    fontSize: 13,
    fontWeight: '800',
  },
  breakdownLbl: {
    fontSize: 9.5,
    marginTop: 1,
  },
  breakdownDivider: {
    width: 1,
    height: '100%',
  },
  batchCheckboxesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  batchCheckBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  batchCheckText: {
    fontSize: 11,
  },
  ingredientsCard: {
    marginBottom: 16,
  },
  ingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  ingName: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  ingNote: {
    fontSize: 10.5,
  },
  ingAmountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  ingAmountText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
  },
  footer: {
    padding: 14,
    borderTopWidth: 1,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: radii.pill,
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
});
