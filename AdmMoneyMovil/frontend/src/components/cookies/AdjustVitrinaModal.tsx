import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  PanResponder,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CookieProduct } from '../../lib/types';
import { useThemeColors, radii, spacing } from '../../theme';
import { Button } from '../ui/Button';

interface AdjustVitrinaModalProps {
  visible: boolean;
  cookie: CookieProduct | null;
  onClose: () => void;
  onSaveStock: (cookieId: number, newStock: number) => Promise<void>;
}

export const AdjustVitrinaModal: React.FC<AdjustVitrinaModalProps> = ({
  visible,
  cookie,
  onClose,
  onSaveStock,
}) => {
  const colors = useThemeColors();
  const isDark = colors.isDark;
  const [stockInput, setStockInput] = useState('0');
  const [isSaving, setIsSaving] = useState(false);

  const screenHeight = Dimensions.get('window').height;
  const translateY = useRef(new Animated.Value(0)).current;

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
        if (gestureState.dy > 90 || (gestureState.dy > 25 && gestureState.vy > 0.35)) {
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
    if (visible && cookie) {
      translateY.setValue(0);
      setStockInput(String(cookie.stock_vitrina ?? 0));
    }
  }, [visible, cookie]);

  const currentVal = Math.max(0, parseInt(stockInput.replace(/\D/g, '')) || 0);

  const handleAdjustDelta = (delta: number) => {
    const next = Math.max(0, currentVal + delta);
    setStockInput(String(next));
  };

  const handleSetExact = (val: number) => {
    setStockInput(String(Math.max(0, val)));
  };

  const handleSave = async () => {
    if (!cookie) return;
    try {
      setIsSaving(true);
      await onSaveStock(cookie.id, currentVal);
      onClose();
    } catch {
    } finally {
      setIsSaving(false);
    }
  };

  if (!cookie) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.dialog,
            {
              backgroundColor: isDark ? '#161A24' : '#FFFFFF',
              borderColor: isDark ? '#2B3448' : '#E2E8F0',
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Handle de arrastre */}
          <View {...panResponder.panHandlers}>
            <View style={styles.handleWrapper}>
              <View
                style={[
                  styles.handleBar,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.18)' },
                ]}
              />
            </View>

            <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={[styles.eyebrow, { color: colors.amberLight }]}>Stock de Mostrador</Text>
                <Text style={[styles.title, { color: colors.textMain }]} numberOfLines={1}>
                  Ajustar Piezas en Vitrina
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[styles.closeBtn, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
              >
                <Ionicons name="close" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Tarjeta del producto */}
          <View style={[styles.productCard, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}>
            {cookie.image_url ? (
              <Image source={{ uri: cookie.image_url }} style={styles.cookieThumb} />
            ) : (
              <View style={[styles.cookieThumb, { backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="cafe" size={20} color={colors.amberLight} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.cookieName, { color: colors.textMain }]} numberOfLines={1}>
                {cookie.name}
              </Text>
              <Text style={[styles.cookieSub, { color: colors.textDim }]}>
                ${cookie.sale_price.toFixed(2)} MXN • Tanda: {cookie.batch_yield || 10} pzas
              </Text>
              <View style={styles.currentBadge}>
                <Ionicons name="storefront" size={11} color={colors.amberLight} />
                <Text style={[styles.currentBadgeText, { color: colors.amberLight }]}>
                  Actualmente: {cookie.stock_vitrina ?? 0} piezas
                </Text>
              </View>
            </View>
          </View>

          {/* Selector de número grande & steppers */}
          <View style={[styles.inputSection, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}>
            <Text style={[styles.sectionSubtitle, { color: colors.textDim }]}>
              PIEZAS LISTAS EN MOSTRADOR:
            </Text>

            <View style={styles.stepperRow}>
              <TouchableOpacity
                onPress={() => handleAdjustDelta(-5)}
                style={[styles.deltaBtn, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}
              >
                <Text style={[styles.deltaText, { color: colors.textMuted }]}>-5</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleAdjustDelta(-1)}
                style={[styles.deltaBtn, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}
              >
                <Ionicons name="remove" size={18} color={colors.textMain} />
              </TouchableOpacity>

              {/* Input directo */}
              <View style={[styles.numInputBox, { backgroundColor: colors.bgCard, borderColor: colors.amberLight }]}>
                <TextInput
                  style={[styles.numInput, { color: colors.amberLight }]}
                  value={stockInput}
                  onChangeText={(t) => setStockInput(t.replace(/\D/g, ''))}
                  keyboardType="number-pad"
                  textAlign="center"
                  selectTextOnFocus
                />
                <Text style={[styles.numUnit, { color: colors.textDim }]}>piezas</Text>
              </View>

              <TouchableOpacity
                onPress={() => handleAdjustDelta(1)}
                style={[styles.deltaBtn, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}
              >
                <Ionicons name="add" size={18} color={colors.textMain} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleAdjustDelta(5)}
                style={[styles.deltaBtn, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}
              >
                <Text style={[styles.deltaText, { color: colors.textMuted }]}>+5</Text>
              </TouchableOpacity>
            </View>

            {/* Accesos rápidos de números */}
            <View style={styles.presetsRow}>
              {[0, 6, 10, 15, 20, 30].map((num) => (
                <TouchableOpacity
                  key={num}
                  onPress={() => handleSetExact(num)}
                  style={[
                    styles.presetPill,
                    currentVal === num
                      ? { backgroundColor: colors.amberBg, borderColor: colors.amberBorder }
                      : { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle },
                  ]}
                >
                  <Text
                    style={[
                      styles.presetText,
                      { color: currentVal === num ? colors.amberLight : colors.textMuted },
                    ]}
                  >
                    {num === 0 ? 'Vaciar' : `${num} pz`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text style={[styles.helperText, { color: colors.textDim }]}>
            Modifica directamente la cantidad disponible en vitrina para entrega inmediata cuando cuentes piezas sobrantes, repongas galletas o realices degustaciones.
          </Text>

          {/* Botones de acción */}
          <View style={styles.actionsRow}>
            <Button
              title="Cancelar"
              variant="secondary"
              onPress={onClose}
              style={{ flex: 1 }}
            />
            <Button
              title={isSaving ? 'Guardando...' : `Guardar ${currentVal} pzas`}
              variant="amber"
              icon={<Ionicons name="checkmark-circle" size={17} color="#fff" />}
              onPress={handleSave}
              disabled={isSaving}
              style={{ flex: 1.6 }}
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
    backgroundColor: 'rgba(12, 16, 26, 0.65)',
    justifyContent: 'flex-end',
  },
  dialog: {
    borderTopLeftRadius: radii.outer,
    borderTopRightRadius: radii.outer,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    gap: 12,
  },
  handleWrapper: {
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 4,
  },
  handleBar: {
    width: 42,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: 10,
  },
  cookieThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  cookieName: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  cookieSub: {
    fontSize: 11,
    marginTop: 1,
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  currentBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  inputSection: {
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  sectionSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  deltaBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deltaText: {
    fontSize: 12,
    fontWeight: '800',
  },
  numInputBox: {
    minWidth: 90,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numInput: {
    fontSize: 22,
    fontWeight: '900',
    padding: 0,
    margin: 0,
    textAlign: 'center',
  },
  numUnit: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: -2,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  presetPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  presetText: {
    fontSize: 11,
    fontWeight: '700',
  },
  helperText: {
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
});
