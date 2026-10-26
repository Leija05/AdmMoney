import React, { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, radii, spacing } from '../../theme';
import { DoubleBezelCard } from '../ui/DoubleBezelCard';
import { Customer } from '../../lib/types';
import { useAppStore } from '../../stores/app.store';
import { confirmAction } from '../../stores/confirmation.store';
import { MobileApiService } from '../../services/api';

interface CustomersDirectoryModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CustomersDirectoryModal: React.FC<CustomersDirectoryModalProps> = ({
  visible,
  onClose,
}) => {
  const colors = useThemeColors();
  const isDark = colors.isDark;

  const { customers, deleteCustomer } = useAppStore();
  const [search, setSearch] = useState('');
  const [blacklistedPhones, setBlacklistedPhones] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      loadBlacklist();
    }
  }, [visible]);

  const loadBlacklist = async () => {
    try {
      const list = await MobileApiService.getBlacklist();
      const phones = list.map((b) => b.phone.replace(/\D/g, '')).filter(Boolean);
      setBlacklistedPhones(phones);
    } catch {
      // Ignorar
    }
  };

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q))
    );
  }, [customers, search]);

  const handleDelete = (customer: Customer) => {
    confirmAction({
      title: '¿Eliminar Cliente?',
      message: `¿Estás seguro de eliminar a "${customer.name}" del directorio? Ya no aparecerá en las sugerencias de pedidos.`,
      confirmText: 'Sí, Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      onConfirm: async () => {
        await deleteCustomer(customer.id);
      },
    });
  };

  const handleToggleBlacklist = (customer: Customer, isBlocked: boolean) => {
    if (!customer.phone) {
      Alert.alert('Sin Teléfono', 'Este cliente no tiene teléfono registrado para bloquearlo en la lista negra.');
      return;
    }
    const cleanPhone = customer.phone.replace(/\D/g, '');
    if (!cleanPhone) return;

    if (isBlocked) {
      confirmAction({
        title: '¿Desbloquear Cliente?',
        message: `¿Deseas desbloquear a "${customer.name}" (${customer.phone})? Podrá volver a registrar pedidos desde la página web y QR.`,
        confirmText: 'Sí, Desbloquear',
        cancelText: 'Cancelar',
        type: 'info',
        onConfirm: async () => {
          try {
            await MobileApiService.removeFromBlacklist(cleanPhone);
            setBlacklistedPhones((prev) => prev.filter((p) => p !== cleanPhone));
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'No se pudo desbloquear al cliente.');
          }
        },
      });
    } else {
      confirmAction({
        title: '¿Poner en Lista Negra?',
        message: `¿Deseas bloquear a "${customer.name}" (${customer.phone}) por pedidos falsos o bromas? Su teléfono será bloqueado automáticamente en la web QR.`,
        confirmText: 'Sí, Bloquear',
        cancelText: 'Cancelar',
        type: 'danger',
        onConfirm: async () => {
          try {
            await MobileApiService.addToBlacklist(cleanPhone, 'Marcado desde el directorio');
            setBlacklistedPhones((prev) => [...prev, cleanPhone]);
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'No se pudo bloquear al cliente.');
          }
        },
      });
    }
  };

  const handleWhatsApp = (phone?: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    Linking.openURL(`https://wa.me/${cleanPhone}`);
  };

  const renderItem = ({ item }: { item: Customer }) => {
    const initial = (item.name || 'C').charAt(0).toUpperCase();
    const cleanPhone = (item.phone || '').replace(/\D/g, '');
    const isBlocked = cleanPhone ? blacklistedPhones.includes(cleanPhone) : false;

    return (
      <View
        style={[
          styles.customerItem,
          {
            backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
            borderColor: isBlocked ? '#EF4444' : isDark ? '#334155' : '#E2E8F0',
          },
        ]}
      >
        <View
          style={[
            styles.avatar,
            { backgroundColor: isBlocked ? '#FEE2E2' : colors.brandGlow },
          ]}
        >
          <Text
            style={[
              styles.avatarText,
              { color: isBlocked ? '#DC2626' : colors.brand },
            ]}
          >
            {initial}
          </Text>
        </View>

        <View style={{ flex: 1, paddingRight: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Text style={[styles.customerName, { color: colors.textMain }]} numberOfLines={1}>
              {item.name}
            </Text>
            {isBlocked && (
              <View style={styles.blacklistPill}>
                <Ionicons name="ban" size={10} color="#DC2626" />
                <Text style={styles.blacklistPillText}>Lista Negra</Text>
              </View>
            )}
          </View>

          <Text style={[styles.customerPhone, { color: isBlocked ? '#EF4444' : colors.textMuted }]}>
            {item.phone || 'Sin teléfono registrado'}
          </Text>
          {item.notes ? (
            <Text style={[styles.customerNotes, { color: colors.textDim }]} numberOfLines={1}>
              {item.notes}
            </Text>
          ) : null}
        </View>

        <View style={styles.actionButtons}>
          {item.phone ? (
            <TouchableOpacity
              style={[
                styles.smallActionBtn,
                { backgroundColor: isBlocked ? '#FEE2E2' : isDark ? '#1C2638' : '#F1F5F9' },
              ]}
              onPress={() => handleToggleBlacklist(item, isBlocked)}
              activeOpacity={0.7}
              accessibilityLabel={isBlocked ? 'Desbloquear cliente' : 'Bloquear en lista negra'}
            >
              <Ionicons
                name={isBlocked ? 'shield-checkmark' : 'ban-outline'}
                size={16}
                color={isBlocked ? '#DC2626' : colors.textMuted}
              />
            </TouchableOpacity>
          ) : null}

          {item.phone ? (
            <TouchableOpacity
              style={[styles.smallActionBtn, { backgroundColor: '#D1FAE5' }]}
              onPress={() => handleWhatsApp(item.phone)}
              activeOpacity={0.7}
              accessibilityLabel="Enviar WhatsApp"
            >
              <Ionicons name="logo-whatsapp" size={16} color="#059669" />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={[styles.smallActionBtn, { backgroundColor: '#FEE2E2' }]}
            onPress={() => handleDelete(item)}
            activeOpacity={0.7}
            accessibilityLabel="Eliminar cliente"
          >
            <Ionicons name="trash-outline" size={16} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.backdrop} />

        <DoubleBezelCard
          style={[
            styles.modalCard,
            { backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)' },
          ]}
          innerStyle={{ flex: 1 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: colors.brandGlow }]}>
              <Ionicons name="people" size={24} color={colors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.textMain }]}>
                Directorio de Clientes
              </Text>
              <Text style={[styles.subTitle, { color: colors.textMuted }]}>
                {customers.length} {customers.length === 1 ? 'cliente guardado' : 'clientes guardados'}
                {blacklistedPhones.length > 0 && ` (${blacklistedPhones.length} en lista negra)`}
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: isDark ? '#0B132B' : '#F1F5F9',
                borderColor: isDark ? '#334155' : '#E2E8F0',
              },
            ]}
          >
            <Ionicons name="search" size={17} color={colors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, { color: colors.textMain }]}
              placeholder="Buscar por nombre o teléfono..."
              placeholderTextColor={colors.textDim}
              value={search}
              onChangeText={setSearch}
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* List - Scrollable */}
          <FlatList
            data={filteredCustomers}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            style={styles.flatList}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="person-outline" size={36} color={colors.textDim} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  {search ? 'No se encontraron clientes coincidentes' : 'No hay clientes registrados en la cartera.'}
                </Text>
              </View>
            }
          />

          {/* Footer note */}
          <View style={styles.footerNote}>
            <Ionicons name="shield-outline" size={14} color={colors.textDim} />
            <Text style={[styles.footerNoteText, { color: colors.textDim }]}>
              Puedes poner en lista negra con el icono de bloqueo a clientes que manden pedidos falsos para evitar que vuelvan a ordenar.
            </Text>
          </View>
        </DoubleBezelCard>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 460,
    height: '82%',
    maxHeight: '86%',
    flex: 1,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subTitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  flatList: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.sm,
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: 8,
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
  },
  customerName: {
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  blacklistPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  blacklistPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
  },
  customerPhone: {
    fontSize: 11.5,
  },
  customerNotes: {
    fontSize: 10.5,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  smallActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 8,
  },
  emptyText: {
    fontSize: 12.5,
    textAlign: 'center',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
  },
  footerNoteText: {
    fontSize: 10.5,
    flex: 1,
    lineHeight: 14,
  },
});
