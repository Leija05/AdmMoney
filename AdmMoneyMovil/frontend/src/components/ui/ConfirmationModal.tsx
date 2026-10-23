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

  const isDanger = options.type !== 'warning' && options.type !== 'info';
  const confirmLabel = options.confirmText || (isDanger ? 'Sí, Eliminar' : 'Confirmar');
  const cancelLabel = options.cancelText || 'Cancelar';

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
                  backgroundColor: isDark ? '#181C26' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
            >
              {/* Header Icon Badge */}
              <View
                style={[
                  styles.iconBadge,
                  {
                    backgroundColor: isDanger ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                    borderColor: isDanger ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)',
                  },
                ]}
              >
                <Ionicons
                  name={isDanger ? 'trash-outline' : 'alert-circle-outline'}
                  size={28}
                  color={isDanger ? '#EF4444' : '#F59E0B'}
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
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={closeConfirm}
                  disabled={isLoading}
                  style={[
                    styles.cancelButton,
                    {
                      backgroundColor: isDark ? '#232836' : '#F1F5F9',
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.textMuted }]}>
                    {cancelLabel}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={executeConfirm}
                  disabled={isLoading}
                  style={[
                    styles.confirmButton,
                    {
                      backgroundColor: isDanger ? '#DC2626' : colors.brand,
                    },
                  ]}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons
                        name={isDanger ? 'trash' : 'checkmark'}
                        size={16}
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
    backgroundColor: 'rgba(9, 13, 20, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 390,
    borderRadius: radii.outer || 24,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
  },
  iconBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  warningPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 18,
    width: '100%',
    justifyContent: 'center',
  },
  warningPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radii.md || 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  confirmButton: {
    flex: 1.25,
    paddingVertical: 12,
    borderRadius: radii.md || 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  confirmButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
