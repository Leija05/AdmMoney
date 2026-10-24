import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DoubleBezelCard } from '../ui/DoubleBezelCard';
import { useThemeColors, radii } from '../../theme';
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

  const getCategoryTheme = (cat: string) => {
    if (cat.includes('Galletas')) {
      return { icon: 'nutrition-outline' as const, bg: colors.amberBg, color: colors.amberText, border: colors.amberBorder };
    }
    if (cat.includes('Empaques')) {
      return { icon: 'cube-outline' as const, bg: colors.purpleBg, color: colors.purpleText, border: colors.purpleBorder };
    }
    if (cat.includes('Luz') || cat.includes('Servicios')) {
      return { icon: 'flash-outline' as const, bg: colors.cyanBg, color: colors.brandText, border: colors.brandBorder };
    }
    if (cat.includes('Transporte')) {
      return { icon: 'car-outline' as const, bg: colors.brandBg, color: colors.brandText, border: colors.brandBorder };
    }
    return { icon: 'cart-outline' as const, bg: colors.roseBg, color: colors.roseText, border: colors.roseBorder };
  };

  const catTheme = getCategoryTheme(expense.category);
  const itemCount = expense.receipt_data?.items?.length || 0;

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
        <View style={styles.cardBody}>
          {/* Main Top Row: Icon + Title + Big Amount */}
          <View style={styles.mainRow}>
            {/* Round Category Icon */}
            <View style={[styles.iconCircle, { backgroundColor: catTheme.bg, borderColor: catTheme.border }]}>
              <Ionicons name={catTheme.icon} size={18} color={catTheme.color} />
            </View>

            {/* Concept & Category */}
            <View style={styles.titleCol}>
              <Text style={[styles.title, { color: colors.textMain }]} numberOfLines={1}>
                {expense.title}
              </Text>
              <View style={styles.categoryBadgeRow}>
                <View style={[styles.categoryBadge, { backgroundColor: catTheme.bg, borderColor: catTheme.border }]}>
                  <Text style={[styles.categoryBadgeText, { color: catTheme.color }]}>
                    {expense.category}
                  </Text>
                </View>
              </View>
            </View>

            {/* Amount */}
            <View style={styles.amountCol}>
              <Text style={[styles.amountText, { color: colors.rose }]}>
                -${expense.amount.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Bottom Info Bar: Metadata on left, Actions on right */}
          <View style={[styles.bottomBar, { borderTopColor: colors.borderSubtle }]}>
            <View style={styles.metaRow}>
              <Text style={[styles.metaText, { color: colors.textDim }]}>{expense.date}</Text>
              <Text style={[styles.metaDot, { color: colors.textDim }]}>•</Text>
              <Text style={[styles.metaText, { color: colors.textDim }]}>{expense.payment_method}</Text>

              {itemCount > 0 ? (
                <View style={[styles.ticketBadge, { backgroundColor: colors.brandBg, borderColor: colors.brandBorder }]}>
                  <Ionicons name="receipt-outline" size={10} color={colors.brand} />
                  <Text style={[styles.ticketBadgeText, { color: colors.brandText }]}>
                    Ticket ({itemCount})
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Actions: Delete & Chevron */}
            <View style={styles.actionsGroup}>
              {onDelete && (
                <TouchableOpacity
                  onPress={handleDelete}
                  style={[styles.deleteBtn, { backgroundColor: colors.bgTertiary }]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={13} color={colors.rose} />
                </TouchableOpacity>
              )}
              {onPress && (
                <View style={[styles.chevronBadge, { backgroundColor: colors.bgTertiary }]}>
                  <Ionicons name="chevron-forward" size={13} color={colors.textDim} />
                </View>
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
    marginBottom: 10,
  },
  cardBody: {
    paddingVertical: 2,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: 0.1,
    marginBottom: 3,
  },
  categoryBadgeRow: {
    flexDirection: 'row',
  },
  categoryBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  amountCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amountText: {
    fontSize: 16.5,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 0.8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  metaDot: {
    fontSize: 11,
  },
  ticketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  ticketBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
  },
  deleteBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
