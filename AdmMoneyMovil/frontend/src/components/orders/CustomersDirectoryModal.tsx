import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, radii, spacing, gradients } from '../../theme';
import { DoubleBezelCard } from '../ui/DoubleBezelCard';
import { Customer } from '../../lib/types';
import { useAppStore } from '../../stores/app.store';
import { confirmAction } from '../../stores/confirmation.store';

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

  const handleWhatsApp = (phone?: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    Linking.openURL(`https://wa.me/${cleanPhone}`);
  };

  const renderItem = ({ item }: { item: Customer }) => {
    const initial = (item.name || 'C').charAt(0).toUpperCase();

    return (
      <View
        style={[
          styles.customerItem,
          {
            backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
            borderColor: isDark ? '#334155' : '#E2E8F0',
          },
        ]}
      >
        <View style={[styles.avatar, { backgroundColor: colors.brandGlow }]}>
          <Text style={[styles.avatarText, { color: colors.brand }]}>{initial}</Text>
        </View>

        <View style={{ flex: 1, paddingRight: 6 }}>
          <Text style={[styles.customerName, { color: colors.textMain }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.customerPhone, { color: colors.textMuted }]}>
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
              style={[styles.smallActionBtn, { backgroundColor: '#D1FAE5' }]}
              onPress={() => handleWhatsApp(item.phone)}
              activeOpacity={0.7}
            >
              <Ionicons name="logo-whatsapp" size={16} color="#059669" />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={[styles.smallActionBtn, { backgroundColor: '#FEE2E2' }]}
            onPress={() => handleDelete(item)}
            activeOpacity={0.7}
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

          {/* List */}
          <FlatList
            data={filteredCustomers}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
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
            <Ionicons name="information-circle-outline" size={14} color={colors.textDim} />
            <Text style={[styles.footerNoteText, { color: colors.textDim }]}>
              Al eliminar a un cliente, se quita del autocompletado pero sus pedidos pasados conservan el historial.
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
    maxWidth: 440,
    maxHeight: '85%',
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
