import React, { useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../ui/Badge';
import { useThemeColors, radii, spacing } from '../../theme';
import { CookieSale } from '../../lib/types';

export interface SaleQuickActionsSheetProps {
  visible: boolean;
  sale: CookieSale | null;
  onClose: () => void;
  onSendWhatsApp: (sale: CookieSale) => void;
  onViewDetails: (sale: CookieSale) => void;
  onEditSale: (sale: CookieSale) => void;
  onDeleteSale: (sale: CookieSale) => void;
}

export const SaleQuickActionsSheet: React.FC<SaleQuickActionsSheetProps> = ({
  visible,
  sale,
  onClose,
  onSendWhatsApp,
  onViewDetails,
  onEditSale,
  onDeleteSale,
}) => {
  const colors = useThemeColors();
  const isDark = colors.isDark;

  const screenHeight = Dimensions.get('window').height;
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

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
    }
  }, [visible]);

  if (!sale) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
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
          {/* Swipe-down Drag Handle */}
          <View style={styles.handleWrapper} {...panResponder.panHandlers}>
            <View style={[styles.handleBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.18)' }]} />
          </View>

          {/* Header */}
          <View style={styles.header} {...panResponder.panHandlers}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={[styles.title, { color: colors.textMain }]} numberOfLines={1}>
                {sale.quantity}x {sale.cookie_name}
              </Text>
              <Text style={[styles.subTitle, { color: colors.textDim }]}>
                {sale.sale_date} • {sale.customer_name || 'Cliente Mostrador'}
              </Text>
              <View style={styles.badgeRow}>
                <Badge label={`$${sale.total_revenue.toFixed(2)} MXN`} variant="amber" />
                <Badge label={`+$${sale.net_profit.toFixed(2)} neta`} variant="emerald" />
                <Badge label={sale.payment_method || 'Efectivo'} variant="brand" />
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeCircle, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={18} color={colors.textMain} />
            </TouchableOpacity>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

          {/* ACTIONS LIST */}
          <View style={styles.optionsList}>
            {/* Opción 1: Enviar Ticket por WhatsApp */}
            <TouchableOpacity
              style={[styles.actionItem, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
              onPress={() => {
                onClose();
                onSendWhatsApp(sale);
              }}
              activeOpacity={0.75}
            >
              <View style={[styles.iconBox, { backgroundColor: 'rgba(37, 211, 102, 0.15)' }]}>
                <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, { color: colors.textMain }]}>
                  Enviar Ticket por WhatsApp
                </Text>
                <Text style={[styles.itemSub, { color: colors.textDim }]}>
                  Generar ticket digital con desglose para enviar al cliente
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={17} color={colors.textDim} />
            </TouchableOpacity>

            {/* Opción 2: Ver Detalle Financiero */}
            <TouchableOpacity
              style={[styles.actionItem, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
              onPress={() => {
                onClose();
                onViewDetails(sale);
              }}
              activeOpacity={0.75}
            >
              <View style={[styles.iconBox, { backgroundColor: colors.amberBg }]}>
                <Ionicons name="receipt-outline" size={20} color={colors.amberLight} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, { color: colors.textMain }]}>
                  Ver Detalle Financiero Completo
                </Text>
                <Text style={[styles.itemSub, { color: colors.textDim }]}>
                  Costos de insumos, margen neto, empaque y ROI
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={17} color={colors.textDim} />
            </TouchableOpacity>

            {/* Opción 3: Editar Venta */}
            <TouchableOpacity
              style={[styles.actionItem, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
              onPress={() => {
                onClose();
                onEditSale(sale);
              }}
              activeOpacity={0.75}
            >
              <View style={[styles.iconBox, { backgroundColor: colors.brandGlow }]}>
                <Ionicons name="create-outline" size={20} color={colors.brandLight} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, { color: colors.textMain }]}>
                  Editar Datos de la Venta
                </Text>
                <Text style={[styles.itemSub, { color: colors.textDim }]}>
                  Modificar cliente, cantidad, precio, pago o notas
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={17} color={colors.textDim} />
            </TouchableOpacity>

            {/* Opción 4: Eliminar Venta */}
            <TouchableOpacity
              style={[
                styles.actionItem,
                {
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : '#FEF2F2',
                  borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : '#FECDD3',
                },
              ]}
              onPress={() => {
                onClose();
                onDeleteSale(sale);
              }}
              activeOpacity={0.75}
            >
              <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2' }]}>
                <Ionicons name="trash-outline" size={19} color={colors.roseLight} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, { color: colors.roseLight }]}>
                  Eliminar Venta
                </Text>
                <Text style={[styles.itemSub, { color: isDark ? '#FDA4AF' : '#991B1B' }]}>
                  Cancelar y remover este registro del historial
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={17} color={colors.roseLight} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableOpacity>
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
    paddingBottom: 34,
    overflow: 'hidden',
  },
  handleWrapper: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subTitle: {
    fontSize: 12,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  closeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    marginHorizontal: 20,
    marginBottom: 14,
  },
  optionsList: {
    paddingHorizontal: 18,
    gap: 10,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  itemSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
});
export default SaleQuickActionsSheet;
