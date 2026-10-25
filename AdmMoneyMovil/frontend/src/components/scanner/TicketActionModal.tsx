import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  PanResponder,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScannedTicket } from '../../lib/types';
import { useThemeColors, radii } from '../../theme';
import { DoubleBezelCard } from '../ui/DoubleBezelCard';
import { confirmAction } from '../../stores/confirmation.store';

interface TicketActionModalProps {
  visible: boolean;
  ticket: ScannedTicket | null;
  onClose: () => void;
  onViewDigitalReceipt: (ticket: ScannedTicket) => void;
  onViewPhoto: (ticket: ScannedTicket) => void;
  onEdit: (ticket: ScannedTicket) => void;
  onRescan: (ticket: ScannedTicket) => void;
  onDelete: (ticket: ScannedTicket) => void;
}

export const TicketActionModal: React.FC<TicketActionModalProps> = ({
  visible,
  ticket,
  onClose,
  onViewDigitalReceipt,
  onViewPhoto,
  onEdit,
  onRescan,
  onDelete,
}) => {
  const colors = useThemeColors();
  const isDark = colors.isDark;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
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
        if (gestureState.dy > 80 || (gestureState.dy > 25 && gestureState.vy > 0.35)) {
          Animated.timing(translateY, {
            toValue: 600,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            onClose();
            translateY.setValue(0);
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            bounciness: 4,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (!ticket) return null;

  const handleDelete = () => {
    onClose();
    confirmAction({
      title: '¿Eliminar Ticket?',
      message: `¿Deseas eliminar "${ticket.merchant || 'este ticket'}" de tu lista de tickets capturados?`,
      confirmText: 'Sí, Eliminar',
      type: 'danger',
      onConfirm: () => onDelete(ticket),
    });
  };

  const hasPhoto = Boolean(ticket.uri);
  const displayAmount =
    ticket.amount > 0 ? `$${ticket.amount.toFixed(2)} MXN` : 'Sin total registrado';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.sheetContainer,
                { transform: [{ translateY }] },
              ]}
            >
              <DoubleBezelCard
                style={styles.cardOuter}
                innerStyle={[
                  styles.cardInner,
                  { backgroundColor: isDark ? '#141824' : '#FFFFFF' },
                ]}
              >
                {/* Drag handle */}
                <View {...panResponder.panHandlers} style={styles.dragHandleArea}>
                  <View
                    style={[
                      styles.dragHandle,
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' },
                    ]}
                  />
                </View>

                {/* Ticket Header Overview */}
                <View style={[styles.headerRow, { borderBottomColor: colors.borderSubtle }]}>
                  <View style={[styles.headerIconBox, { backgroundColor: colors.brandBg }]}>
                    <Ionicons name="receipt" size={20} color={colors.brand} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.ticketTitle, { color: colors.textMain }]} numberOfLines={1}>
                      {ticket.merchant || 'Ticket Capturado'}
                    </Text>
                    <Text style={[styles.ticketSubtitle, { color: colors.textDim }]}>
                      {ticket.date || 'Reciente'} • {displayAmount}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={onClose}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={[styles.closeBtn, { backgroundColor: colors.bgTertiary }]}
                  >
                    <Ionicons name="close" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Action Options List */}
                <View style={styles.actionsList}>
                  {/* Option 1: Ver Ticket Digitalizado */}
                  <TouchableOpacity
                    style={[
                      styles.actionItem,
                      {
                        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : '#F0FDF4',
                        borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : '#BBF7D0',
                      },
                    ]}
                    onPress={() => {
                      onClose();
                      onViewDigitalReceipt(ticket);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.actionIconBox, { backgroundColor: colors.emeraldBg }]}>
                      <Ionicons name="receipt" size={20} color={colors.emeraldLight} />
                    </View>
                    <View style={styles.actionTextBox}>
                      <Text style={[styles.actionLabel, { color: colors.emeraldLight }]}>
                        Ver Ticket Digitalizado
                      </Text>
                      <Text style={[styles.actionDesc, { color: colors.textMuted }]}>
                        Ver ticket térmico con desglose de productos y total
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.emeraldLight} />
                  </TouchableOpacity>

                  {/* Option 2: Ver Foto Original */}
                  {hasPhoto && (
                    <TouchableOpacity
                      style={[styles.actionItem, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
                      onPress={() => {
                        onClose();
                        onViewPhoto(ticket);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.actionIconBox, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
                        <Ionicons name="camera-outline" size={20} color={colors.brandLight} />
                      </View>
                      <View style={styles.actionTextBox}>
                        <Text style={[styles.actionLabel, { color: colors.textMain }]}>
                          Ver Fotografía Original
                        </Text>
                        <Text style={[styles.actionDesc, { color: colors.textMuted }]}>
                          Revisar la captura real de la cámara o galería
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
                    </TouchableOpacity>
                  )}

                  {/* Option 3: Editar Ticket */}
                  <TouchableOpacity
                    style={[styles.actionItem, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
                    onPress={() => {
                      onClose();
                      onEdit(ticket);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.actionIconBox, { backgroundColor: colors.amberBg }]}>
                      <Ionicons name="create-outline" size={20} color={colors.amberLight} />
                    </View>
                    <View style={styles.actionTextBox}>
                      <Text style={[styles.actionLabel, { color: colors.textMain }]}>
                        Editar Ticket y Productos
                      </Text>
                      <Text style={[styles.actionDesc, { color: colors.textMuted }]}>
                        Modificar comercio, precios, cantidades o categoría
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
                  </TouchableOpacity>

                  {/* Option 4: Re-escanear con IA */}
                  {hasPhoto && (
                    <TouchableOpacity
                      style={[styles.actionItem, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
                      onPress={() => {
                        onClose();
                        onRescan(ticket);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.actionIconBox, { backgroundColor: colors.purpleBg }]}>
                        <Ionicons name="sparkles" size={20} color={colors.purpleLight} />
                      </View>
                      <View style={styles.actionTextBox}>
                        <Text style={[styles.actionLabel, { color: colors.textMain }]}>
                          Re-escanear con IA
                        </Text>
                        <Text style={[styles.actionDesc, { color: colors.textMuted }]}>
                          Volver a pasar el algoritmo OCR y visión inteligente
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
                    </TouchableOpacity>
                  )}

                  {/* Option 5: Eliminar Ticket */}
                  <TouchableOpacity
                    style={[
                      styles.actionItem,
                      {
                        backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : '#FEF2F2',
                        borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : '#FECACA',
                      },
                    ]}
                    onPress={handleDelete}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.actionIconBox, { backgroundColor: colors.roseBg }]}>
                      <Ionicons name="trash-outline" size={20} color={colors.roseLight} />
                    </View>
                    <View style={styles.actionTextBox}>
                      <Text style={[styles.actionLabel, { color: colors.roseLight }]}>
                        Eliminar Ticket
                      </Text>
                      <Text style={[styles.actionDesc, { color: colors.roseLight, opacity: 0.8 }]}>
                        Quitar este ticket de los capturados
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.roseLight} />
                  </TouchableOpacity>
                </View>
              </DoubleBezelCard>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  cardOuter: {
    borderRadius: radii.outer,
  },
  cardInner: {
    borderRadius: radii.inner,
    padding: 18,
    paddingTop: 8,
  },
  dragHandleArea: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  headerIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  ticketSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsList: {
    gap: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextBox: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  actionDesc: {
    fontSize: 11,
    marginTop: 2,
  },
});
