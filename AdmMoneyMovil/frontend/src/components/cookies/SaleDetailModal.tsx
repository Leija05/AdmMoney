import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useThemeColors, radii, spacing } from '../../theme';
import { CookieSale } from '../../lib/types';
import { Ionicons } from '@expo/vector-icons';
import { WhatsAppTicketModal } from '../ui/WhatsAppTicketModal';
import { confirmAction } from '../../stores/confirmation.store';

interface SaleDetailModalProps {
  visible: boolean;
  sale: CookieSale | null;
  onClose: () => void;
  onDeleteSale: (id: number) => Promise<void>;
}

export const SaleDetailModal: React.FC<SaleDetailModalProps> = ({
  visible,
  sale,
  onClose,
  onDeleteSale,
}) => {
  const colors = useThemeColors();
  const isDark = colors.isDark;
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  if (!sale) return null;

  const marginPct = sale.total_revenue > 0 ? (sale.net_profit / sale.total_revenue) * 100 : 0;
  const roiPct = sale.total_cost > 0 ? (sale.net_profit / sale.total_cost) * 100 : 0;

  const handleDelete = () => {
    confirmAction({
      title: '¿Eliminar Venta?',
      message: `¿Deseas cancelar y eliminar la venta de ${sale.quantity}x "${sale.cookie_name}" ($${sale.total_revenue.toFixed(2)} MXN)?`,
      confirmText: 'Sí, Eliminar Venta',
      cancelText: 'Conservar Venta',
      type: 'danger',
      onConfirm: async () => {
        try {
          await onDeleteSale(sale.id);
          onClose();
        } catch (err: any) {
          Alert.alert('Error', err?.message || 'No se pudo eliminar la venta.');
        }
      },
    });
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.backdrop}>
          <View
            style={[
              styles.dialog,
              {
                backgroundColor: isDark ? '#1C202A' : '#FFFFFF',
                borderColor: isDark ? '#2E384D' : '#E2E8F0',
              },
            ]}
          >
            {/* Modal Header */}
            <View style={[styles.header, { borderBottomColor: isDark ? '#2A303C' : '#E5E7EB' }]}>
              <View>
                <Text style={[styles.headerEyebrow, { color: colors.amberLight }]}>
                  Comprobante de Venta
                </Text>
                <Text style={[styles.headerTitle, { color: isDark ? '#F1F3F7' : '#181A1F' }]}>
                  Venta #{sale.id}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
              {/* Paper-like / Card Receipt with theme adaptation */}
              <View
                style={[
                  styles.receiptPaper,
                  {
                    backgroundColor: isDark ? '#141824' : '#FFFFFF',
                    borderColor: isDark ? '#283144' : '#E2E8F0',
                  },
                ]}
              >
                {/* Brand header with Logo & Company name */}
                <View style={styles.receiptHeader}>
                  <Image
                    source={require('../../../assets/lucky_cookies_logo.png')}
                    style={styles.brandLogo}
                  />
                  <Text style={[styles.brandTitle, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
                    lucky cookies Galletas y postres
                  </Text>
                  <Text style={[styles.receiptSub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    Ticket Oficial de Venta
                  </Text>
                </View>

                <View
                  style={[
                    styles.dividerDashed,
                    { borderColor: isDark ? '#2E3A52' : '#CBD5E1' },
                  ]}
                />

                {/* Product row */}
                <View style={styles.lineRow}>
                  <Text style={[styles.productName, { color: isDark ? '#F1F3F7' : '#0F172A' }]}>
                    {sale.quantity}x {sale.cookie_name}
                  </Text>
                  <Text style={[styles.productPrice, { color: isDark ? '#F1F3F7' : '#0F172A' }]}>
                    ${sale.total_revenue.toFixed(2)}
                  </Text>
                </View>
                <Text style={[styles.unitPriceText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  Precio Unitario: ${sale.unit_price.toFixed(2)} MXN
                </Text>

                <View
                  style={[
                    styles.dividerDashed,
                    { borderColor: isDark ? '#2E3A52' : '#CBD5E1' },
                  ]}
                />

                {/* Meta details */}
                <View style={styles.metaRow}>
                  <Text style={[styles.metaKey, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    Cliente:
                  </Text>
                  <Text style={[styles.metaVal, { color: isDark ? '#F1F3F7' : '#0F172A' }]}>
                    {sale.customer_name || 'Cliente Mostrador'}
                  </Text>
                </View>

                <View style={styles.metaRow}>
                  <Text style={[styles.metaKey, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    Fecha:
                  </Text>
                  <Text style={[styles.metaVal, { color: isDark ? '#F1F3F7' : '#0F172A' }]}>
                    {sale.sale_date}
                  </Text>
                </View>

                <View style={styles.metaRow}>
                  <Text style={[styles.metaKey, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    Método de Pago:
                  </Text>
                  <Text style={[styles.metaVal, { color: isDark ? '#F1F3F7' : '#0F172A' }]}>
                    {sale.payment_method || 'Efectivo'}
                  </Text>
                </View>

                {sale.notes ? (
                  <View
                    style={[
                      styles.notesBlock,
                      {
                        backgroundColor: isDark ? '#1C2333' : '#F8FAFC',
                        borderColor: isDark ? '#2E3A52' : '#E2E8F0',
                      },
                    ]}
                  >
                    <Text style={[styles.notesLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                      Detalles de la operación:
                    </Text>
                    <Text style={[styles.notesContent, { color: isDark ? '#E2E8F0' : '#334155' }]}>
                      {sale.notes}
                    </Text>
                  </View>
                ) : null}

                <View
                  style={[
                    styles.thickLine,
                    { backgroundColor: isDark ? '#2E3A52' : '#0F172A' },
                  ]}
                />

                {/* Financial Profit Summary */}
                <View style={styles.financialSummary}>
                  <View style={styles.financialRow}>
                    <Text style={[styles.finKey, { color: isDark ? '#94A3B8' : '#475569' }]}>
                      Total Cobrado:
                    </Text>
                    <Text style={styles.finValRev}>${sale.total_revenue.toFixed(2)} MXN</Text>
                  </View>

                  <View style={styles.financialRow}>
                    <Text style={[styles.finKey, { color: isDark ? '#94A3B8' : '#475569' }]}>
                      Costo de Producción Lote:
                    </Text>
                    <Text style={styles.finValCost}>-${sale.total_cost.toFixed(2)} MXN</Text>
                  </View>

                  <View
                    style={[
                      styles.financialRow,
                      {
                        marginTop: 4,
                        paddingTop: 4,
                        borderTopWidth: 1,
                        borderTopColor: isDark ? '#2E3A52' : '#E2E8F0',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.finKeyBold,
                        { color: isDark ? '#F1F3F7' : '#0F172A' },
                      ]}
                    >
                      Tu Ganancia Neta Libre:
                    </Text>
                    <Text style={styles.finValProfit}>+${sale.net_profit.toFixed(2)} MXN</Text>
                  </View>

                  <View style={styles.badgeRow}>
                    <Badge label={`${marginPct.toFixed(2)}% Margen Neto`} variant="emerald" />
                    <Badge label={`~${roiPct.toFixed(2)}% ROI`} variant="amber" />
                  </View>
                </View>
              </View>

              {/* Primary WhatsApp Action Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setIsWhatsAppOpen(true)}
                style={[styles.whatsappActionBtn, { backgroundColor: colors.whatsapp }]}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                <Text style={styles.whatsappActionText}>Enviar Ticket WhatsApp & PDF</Text>
              </TouchableOpacity>

              {/* Secondary Actions (Cerrar & Eliminar) */}
              <View style={styles.actions}>
                <Button
                  title="Cerrar"
                  variant="secondary"
                  onPress={onClose}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Eliminar Venta"
                  variant="danger"
                  icon={<Ionicons name="trash" size={16} color="#fff" />}
                  onPress={handleDelete}
                  style={{ flex: 1 }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* WhatsApp Ticket Modal with PDF options */}
      <WhatsAppTicketModal
        visible={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        sale={sale}
      />
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'flex-end',
  },
  dialog: {
    borderTopLeftRadius: radii.outer,
    borderTopRightRadius: radii.outer,
    borderWidth: 1,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    padding: 18,
  },
  receiptPaper: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  brandLogo: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginBottom: 6,
    resizeMode: 'contain',
  },
  brandTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  receiptSub: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  dividerDashed: {
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 0.6,
    marginVertical: 10,
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '900',
  },
  unitPriceText: {
    fontSize: 11,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  metaKey: {
    fontSize: 12,
  },
  metaVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  notesBlock: {
    padding: 8,
    borderRadius: radii.sm,
    marginTop: 6,
    borderWidth: 1,
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  notesContent: {
    fontSize: 11,
    marginTop: 2,
  },
  thickLine: {
    height: 2,
    marginVertical: 12,
  },
  financialSummary: {
    gap: 4,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  finKey: {
    fontSize: 12,
  },
  finKeyBold: {
    fontSize: 13,
    fontWeight: '900',
  },
  finValRev: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D97706',
  },
  finValCost: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E11D48',
  },
  finValProfit: {
    fontSize: 15,
    fontWeight: '900',
    color: '#10B981',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    justifyContent: 'center',
  },
  whatsappActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: radii.md,
    marginBottom: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  whatsappActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
});
