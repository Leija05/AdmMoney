import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfirmationStore } from '../../stores/confirmation.store';
import { useThemeColors, radii } from '../../theme';

export const ConfirmationModal: React.FC = () => {
  const { isOpen, options, isLoading, closeConfirm, executeConfirm } = useConfirmationStore();
  const colors = useThemeColors();
  const isDark = colors.isDark;

  if (!isOpen || !options) return null;

  const isDanger = options.type === 'danger';
  const isSuccess = options.type === 'success';
  const isWarning = options.type === 'warning';

  const hasCancel = Boolean(options.cancelText && options.cancelText.trim().length > 0);
  const confirmLabel =
    options.confirmText ||
    (isDanger ? 'Sí, Eliminar' : isSuccess ? '¡Entendido!' : 'Confirmar');
  const cancelLabel = options.cancelText || 'Cancelar';

  const getBadgeMeta = () => {
    if (isSuccess) {
      return {
        bg: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.12)',
        border: isDark ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.3)',
        color: '#10B981',
        icon: 'checkmark-circle' as const,
      };
    }
    if (isWarning) {
      return {
        bg: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.12)',
        border: isDark ? 'rgba(245, 158, 11, 0.35)' : 'rgba(245, 158, 11, 0.3)',
        color: '#F59E0B',
        icon: 'alert-circle' as const,
      };
    }
    if (isDanger) {
      return {
        bg: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.12)',
        border: isDark ? 'rgba(239, 68, 68, 0.35)' : 'rgba(239, 68, 68, 0.3)',
        color: '#EF4444',
        icon: 'trash-outline' as const,
      };
    }
    return {
      bg: isDark ? 'rgba(14, 165, 233, 0.15)' : 'rgba(2, 132, 199, 0.12)',
      border: isDark ? 'rgba(14, 165, 233, 0.35)' : 'rgba(2, 132, 199, 0.3)',
      color: colors.brand,
      icon: 'information-circle' as const,
    };
  };

  const meta = getBadgeMeta();

  const getConfirmBg = () => {
    if (isSuccess) return '#059669';
    if (isDanger) return '#DC2626';
    if (isWarning) return '#D97706';
    return colors.brand;
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={closeConfirm}
    >
      <TouchableWithoutFeedback onPress={closeConfirm}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.dialogCard,
                {
                  backgroundColor: isDark ? '#141822' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
            >
              {/* Header Icon Badge */}
              <View
                style={[
                  styles.iconBadge,
                  {
                    backgroundColor: meta.bg,
                    borderColor: meta.border,
                  },
                ]}
              >
                <Ionicons
                  name={meta.icon}
                  size={30}
                  color={meta.color}
                />
              </View>

              {/* Title & Description */}
              <Text style={[styles.title, { color: colors.textMain }]}>
                {options.title}
              </Text>
              <Text style={[styles.message, { color: colors.textMuted }]}>
                {options.message}
              </Text>

              {/* Warning note for destructive actions */}
              {isDanger && (
                <View
                  style={[
                    styles.warningPill,
                    {
                      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : '#FEF2F2',
                      borderColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FCA5A5',
                    },
                  ]}
                >
                  <Ionicons name="information-circle-outline" size={14} color="#EF4444" />
                  <Text style={[styles.warningPillText, { color: isDark ? '#FCA5A5' : '#B91C1C' }]}>
                    Esta acción es permanente y no se puede deshacer.
                  </Text>
                </View>
              )}

              {/* Actions Footer */}
              <View style={styles.actionsRow}>
                {hasCancel && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={closeConfirm}
                    disabled={isLoading}
                    style={[
                      styles.cancelButton,
                      {
                        backgroundColor: isDark ? '#1F2432' : '#F1F5F9',
                        borderColor: colors.borderSubtle,
                      },
                    ]}
                  >
                    <Text style={[styles.cancelButtonText, { color: colors.textMuted }]}>
                      {cancelLabel}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={executeConfirm}
                  disabled={isLoading}
                  style={[
                    styles.confirmButton,
                    {
                      backgroundColor: getConfirmBg(),
                      flex: hasCancel ? 1 : undefined,
                      width: hasCancel ? undefined : '100%',
                    },
                  ]}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons
                        name={isDanger ? 'trash' : 'checkmark-circle'}
                        size={17}
                        color="#FFFFFF"
                      />
                      <Text style={styles.confirmButtonText}>
                        {confirmLabel}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 20, 0.76)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.4,
    shadowRadius: 28,
    elevation: 12,
  },
  iconBadge: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18.5,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  message: {
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  warningPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radii.sm || 10,
    borderWidth: 1,
    marginBottom: 18,
    width: '100%',
  },
  warningPillText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
