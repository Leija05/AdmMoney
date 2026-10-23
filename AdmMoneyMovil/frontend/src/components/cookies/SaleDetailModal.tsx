import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { colors, radii, spacing } from '../../theme';
import { CookieSale } from '../../lib/types';
import { Ionicons } from '@expo/vector-icons';

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
  if (!sale) return null;

  const marginPct = sale.total_revenue > 0 ? (sale.net_profit / sale.total_revenue) * 100 : 0;
  const roiPct = sale.total_cost > 0 ? (sale.net_profit / sale.total_cost) * 100 : 0;

  const handleDelete = () => {
    Alert.alert(
      '¿Eliminar Venta?',
      `¿Deseas cancelar y eliminar la venta de ${sale.quantity}x "${sale.cookie_name}" ($${sale.total_revenue.toFixed(2)} MXN)?`,
      [
        { text: 'Conservar Venta', style: 'cancel' },
        {
          text: 'Eliminar Venta',
          style: 'destructive',
          onPress: async () => {
            await onDeleteSale(sale.id);
            onClose();
            Alert.alert('Venta Eliminada', 'Se ha eliminado la venta y recalculado el balance.');
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerEyebrow}>Comprobante de Venta</Text>
              <Text style={styles.headerTitle}>Venta #{sale.id}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
            {/* Paper-like Receipt Card */}
            <View style={styles.receiptPaper}>
              <View style={styles.receiptHeader}>
                <Text style={styles.brandTitle}>ADM MONEY • REPOSTERÍA</Text>
                <Text style={styles.receiptSub}>Ticket Oficial de Venta</Text>
              </View>

              <View style={styles.dividerDashed} />

              {/* Product row */}
              <View style={styles.lineRow}>
                <Text style={styles.productName}>{sale.quantity}x {sale.cookie_name}</Text>
                <Text style={styles.productPrice}>${sale.total_revenue.toFixed(2)}</Text>
              </View>
              <Text style={styles.unitPriceText}>
                Precio Unitario: ${sale.unit_price.toFixed(2)} MXN
              </Text>

              <View style={styles.dividerDashed} />

              {/* Meta details */}
              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>Cliente:</Text>
                <Text style={styles.metaVal}>{sale.customer_name || 'Cliente Mostrador'}</Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>Fecha:</Text>
                <Text style={styles.metaVal}>{sale.sale_date}</Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>Método de Pago:</Text>
                <Text style={styles.metaVal}>{sale.payment_method || 'Efectivo'}</Text>
              </View>

              {sale.notes ? (
                <View style={styles.notesBlock}>
                  <Text style={styles.notesLabel}>Detalles de la operación:</Text>
                  <Text style={styles.notesContent}>{sale.notes}</Text>
                </View>
              ) : null}

              <View style={styles.thickLine} />

              {/* Financial Profit Summary */}
              <View style={styles.financialSummary}>
                <View style={styles.financialRow}>
                  <Text style={styles.finKey}>Total Cobrado:</Text>
                  <Text style={styles.finValRev}>${sale.total_revenue.toFixed(2)} MXN</Text>
                </View>

                <View style={styles.financialRow}>
                  <Text style={styles.finKey}>Costo de Producción Lote:</Text>
                  <Text style={styles.finValCost}>-${sale.total_cost.toFixed(2)} MXN</Text>
                </View>

                <View style={[styles.financialRow, { marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#e2e8f0' }]}>
                  <Text style={styles.finKeyBold}>Tu Ganancia Neta Libre:</Text>
                  <Text style={styles.finValProfit}>+${sale.net_profit.toFixed(2)} MXN</Text>
                </View>

                <View style={styles.badgeRow}>
                  <Badge label={`${marginPct.toFixed(1)}% Margen Neto`} variant="emerald" />
                  <Badge label={`~${roiPct.toFixed(0)}% ROI`} variant="amber" />
                </View>
              </View>
            </View>

            {/* Action Buttons */}
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
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  dialog: {
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius: radii.outer,
    borderTopRightRadius: radii.outer,
    borderWidth: 1,
    borderColor: colors.borderHighlight,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.amberLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    padding: 18,
  },
  receiptPaper: {
    backgroundColor: '#ffffff',
    borderRadius: radii.md,
    padding: 18,
    marginBottom: 16,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 6,
  },
  brandTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 1,
  },
  receiptSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  dividerDashed: {
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 0.5,
    borderColor: '#cbd5e1',
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
    color: '#0f172a',
    flex: 1,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  unitPriceText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  metaKey: {
    fontSize: 12,
    color: '#64748b',
  },
  metaVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  notesBlock: {
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: radii.sm,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  notesContent: {
    fontSize: 11,
    color: '#334155',
    marginTop: 2,
  },
  thickLine: {
    height: 2,
    backgroundColor: '#0f172a',
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
    color: '#475569',
  },
  finKeyBold: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0f172a',
  },
  finValRev: {
    fontSize: 13,
    fontWeight: '800',
    color: '#d97706',
  },
  finValCost: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e11d48',
  },
  finValProfit: {
    fontSize: 15,
    fontWeight: '900',
    color: '#059669',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
});
