import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { DoubleBezelCard } from '../ui/DoubleBezelCard';
import { Badge } from '../ui/Badge';
import { colors, useThemeColors } from '../../theme';
import { Expense } from '../../lib/types';
import { Ionicons } from '@expo/vector-icons';

import { confirmAction } from '../../stores/confirmation.store';

interface ExpenseCardProps {
  expense: Expense;
  onPress?: (expense: Expense) => void;
  onLongPress?: (expense: Expense) => void;
  onDelete?: (id: number) => void;
}

export const ExpenseCard: React.FC<ExpenseCardProps> = ({ expense, onPress, onLongPress, onDelete }) => {
  const colors = useThemeColors();

  const getBadgeVariant = (cat: string) => {
    if (cat.includes('Galletas')) return 'amber';
    if (cat.includes('Empaques')) return 'purple';
    if (cat.includes('Luz') || cat.includes('Servicios')) return 'cyan';
    return 'emerald';
  };

  const handleDelete = () => {
    if (!onDelete) return;
    confirmAction({
      title: '¿Eliminar Gasto?',
      message: `¿Deseas eliminar "${expense.title}" por $${expense.amount.toFixed(2)} MXN?`,
      confirmText: 'Sí, Eliminar',
      type: 'danger',
      onConfirm: () => onDelete(expense.id),
    });
  };

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.75 : 1}
      onPress={() => onPress && onPress(expense)}
      onLongPress={() => onLongPress && onLongPress(expense)}
      delayLongPress={320}
    >
      <DoubleBezelCard style={styles.cardWrapper}>
        <View style={styles.row}>
          <View style={styles.leftCol}>
            <Text style={[styles.title, { color: colors.textMain }]} numberOfLines={1}>
              {expense.title}
            </Text>
            <View style={styles.metaRow}>
              <Badge label={expense.category} variant={getBadgeVariant(expense.category)} />
              <Text style={[styles.dateText, { color: colors.textDim }]}>{expense.date}</Text>
              <Text style={[styles.payText, { color: colors.textDim }]}>• {expense.payment_method}</Text>
            </View>
            {expense.notes ? (
              <Text style={[styles.notesText, { color: colors.textMuted }]} numberOfLines={1}>
                {expense.notes}
              </Text>
            ) : null}
          </View>

          <View style={styles.rightCol}>
            <Text style={styles.amountText}>-${expense.amount.toFixed(2)}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              {onPress && (
                <View style={styles.inspectIcon}>
                  <Ionicons name="chevron-forward" size={14} color={colors.textDim} />
                </View>
              )}
              {onDelete && (
                <TouchableOpacity
                  onPress={handleDelete}
                  style={styles.deleteBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.rose} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </DoubleBezelCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftCol: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textMain,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  dateText: {
    fontSize: 12,
    color: colors.textDim,
  },
  payText: {
    fontSize: 12,
    color: colors.textDim,
  },
  notesText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.rose,
  },
  deleteBtn: {
    padding: 4,
  },
  inspectIcon: {
    padding: 2,
  },
});
