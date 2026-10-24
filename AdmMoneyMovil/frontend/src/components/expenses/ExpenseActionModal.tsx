import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Expense } from '../../lib/types';
import { useThemeColors, radii } from '../../theme';
import { DoubleBezelCard } from '../ui/DoubleBezelCard';
import { confirmAction } from '../../stores/confirmation.store';

interface ExpenseActionModalProps {
  visible: boolean;
  expense: Expense | null;
  onClose: () => void;
  onEdit: (expense: Expense) => void;
  onDuplicate: (expense: Expense) => void;
  onViewDetails: (expense: Expense) => void;
  onDelete: (id: number) => void;
}

export const ExpenseActionModal: React.FC<ExpenseActionModalProps> = ({
  visible,
  expense,
  onClose,
  onEdit,
  onDuplicate,
  onViewDetails,
  onDelete,
}) => {
  const colors = useThemeColors();
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        return gestureState.dy > 5 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.2;
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

  if (!expense) return null;

  const handleDelete = () => {
    onClose();
    confirmAction({
      title: '¿Eliminar Gasto?',
      message: `¿Deseas eliminar "${expense.title}" por $${expense.amount.toFixed(2)} MXN?`,
      confirmText: 'Sí, Eliminar',
      type: 'danger',
      onConfirm: () => onDelete(expense.id),
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.sheetContainer,
                {
                  backgroundColor: colors.bgCard,
                  borderColor: colors.borderSubtle,
                  transform: [{ translateY }],
                },
              ]}
            >
              {/* Little drag handle with PanResponder */}
              <View style={styles.handleWrapper} {...panResponder.panHandlers}>
                <View style={styles.handleBar} />
              </View>

              {/* Expense mini summary with PanResponder */}
              <View style={styles.header} {...panResponder.panHandlers}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.eyebrow, { color: colors.rose }]}>Acciones Rápidas</Text>
                  <Text style={[styles.title, { color: colors.textMain }]} numberOfLines={1}>
                    {expense.title}
                  </Text>
                  <Text style={[styles.meta, { color: colors.textDim }]}>
                    ${expense.amount.toFixed(2)} MXN • {expense.category} • {expense.date}
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color={colors.textDim} />
                </TouchableOpacity>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionsList}>
                {/* 1. Edit */}
                <TouchableOpacity
                  style={[styles.actionRow, { borderBottomColor: colors.borderSubtle }]}
                  onPress={() => {
                    onClose();
                    onEdit(expense);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconBox, { backgroundColor: colors.brandBg }]}>
                    <Ionicons name="create-outline" size={20} color={colors.brandText} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.actionTitle, { color: colors.textMain }]}>Editar Registro</Text>
                    <Text style={[styles.actionSub, { color: colors.textDim }]}>Modificar monto, concepto o método de pago</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
                </TouchableOpacity>

                {/* 2. Duplicate */}
                <TouchableOpacity
                  style={[styles.actionRow, { borderBottomColor: colors.borderSubtle }]}
                  onPress={() => {
                    onClose();
                    onDuplicate(expense);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconBox, { backgroundColor: colors.amberBg }]}>
                    <Ionicons name="copy-outline" size={20} color={colors.amberText} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.actionTitle, { color: colors.textMain }]}>Duplicar Gasto</Text>
                    <Text style={[styles.actionSub, { color: colors.textDim }]}>Crear una copia exacta con fecha de hoy</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
                </TouchableOpacity>

                {/* 3. View Full Detail */}
                <TouchableOpacity
                  style={[styles.actionRow, { borderBottomColor: colors.borderSubtle }]}
                  onPress={() => {
                    onClose();
                    onViewDetails(expense);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconBox, { backgroundColor: colors.emeraldBg }]}>
                    <Ionicons name="eye-outline" size={20} color={colors.emeraldText} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.actionTitle, { color: colors.textMain }]}>Ver Detalle Completo</Text>
                    <Text style={[styles.actionSub, { color: colors.textDim }]}>Consultar notas e historial completo</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
                </TouchableOpacity>

                {/* 4. Delete Destructive */}
                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={handleDelete}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconBox, { backgroundColor: colors.roseBg }]}>
                    <Ionicons name="trash-outline" size={20} color={colors.roseText} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.actionTitle, { color: colors.rose }]}>Eliminar Gasto</Text>
                    <Text style={[styles.actionSub, { color: colors.textDim }]}>Borrar definitivamente de la base de datos</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.rose} />
                </TouchableOpacity>
              </View>
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
    backgroundColor: 'rgba(10, 14, 23, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: radii.outer,
    borderTopRightRadius: radii.outer,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  handleWrapper: {
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 8,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(156, 163, 175, 0.4)',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(156, 163, 175, 0.15)',
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  meta: {
    fontSize: 12,
    marginTop: 3,
  },
  closeBtn: {
    padding: 6,
  },
  actionsList: {
    gap: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  actionSub: {
    fontSize: 11,
    marginTop: 2,
  },
});
