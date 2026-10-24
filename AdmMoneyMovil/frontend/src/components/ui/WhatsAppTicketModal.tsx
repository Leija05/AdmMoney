import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Image,
  Linking,
  Alert,
  Platform,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, radii, spacing } from '../../theme';
import { CookieSale, Order } from '../../lib/types';
import { getApiHost } from '../../services/api';
import { useAppStore } from '../../stores/app.store';

interface WhatsAppTicketModalProps {
  visible: boolean;
  onClose: () => void;
  sale?: CookieSale | null;
  order?: Order | null;
}

export const WhatsAppTicketModal: React.FC<WhatsAppTicketModalProps> = ({
  visible,
  onClose,
  sale,
  order,
}) => {
  const colors = useThemeColors();
  const isDark = colors.isDark;
  const businessName = useAppStore((state) => state.businessName) || 'Lucky Cookies';
  const ticketFooterText = useAppStore((state) => state.ticketFooterText) || '¡Muchas gracias por tu preferencia y que disfrutes mucho tus galletas!';

  const extract10Digits = (raw: string) => {
    let digits = raw.replace(/\D/g, '');
    if (digits.startsWith('52') && digits.length >= 12) {
      digits = digits.slice(2);
    }
    return digits.slice(0, 10);
  };

  const [phoneDigits, setPhoneDigits] = useState('');
  const [includePdf, setIncludePdf] = useState(true);
  const [customNote, setCustomNote] = useState('');

  const screenHeight = Dimensions.get('window').height;
  const translateY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return gestureState.dy > 6 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.3;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        } else {
          translateY.setValue(gestureState.dy * 0.15);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 110 || (gestureState.dy > 30 && gestureState.vy > 0.35)) {
          Animated.timing(translateY, {
            toValue: screenHeight,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            onClose();
            translateY.setValue(0);
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            friction: 8,
            tension: 80,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const customerName = order?.customer_name || sale?.customer_name || 'Cliente';
  const initialPhone = order?.customer_phone || '';

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
      setPhoneDigits(extract10Digits(initialPhone));
      setCustomNote('');
      setIncludePdf(true);
    }
  }, [visible, initialPhone]);

  if (!visible || (!sale && !order)) return null;

  const apiHost = getApiHost();
  const pdfBaseUrl = apiHost.replace(/\/+$/, '');

  let ticketId = 0;
  let ticketType = '';
  let itemsSummary = '';
  let totalFormatted = '$0.00 MXN';
  let paymentText = '';
  let dateText = '';
  let pdfUrl = '';

  if (order) {
    ticketId = order.id;
    ticketType = 'Pedido';
    const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
    itemsSummary = `${totalQty} galletas (${order.items.map((i) => `${i.quantity}x ${i.product_name}`).join(', ')})`;
    totalFormatted = `$${order.total_amount.toFixed(2)} MXN`;
    paymentText = `${order.payment_method} (${order.payment_status})`;
    dateText = `Entrega: ${order.delivery_date}`;
    const encodedNote = customNote ? `?note=${encodeURIComponent(customNote)}` : '';
    pdfUrl = `${pdfBaseUrl}/orders/${order.id}/pdf${encodedNote}`;
  } else if (sale) {
    ticketId = sale.id;
    ticketType = 'Venta';
    itemsSummary = `${sale.quantity}x ${sale.cookie_name}`;
    totalFormatted = `$${sale.total_revenue.toFixed(2)} MXN`;
    paymentText = sale.payment_method || 'Efectivo';
    dateText = `Fecha: ${sale.sale_date}`;
    const encodedNote = customNote ? `?note=${encodeURIComponent(customNote)}` : '';
    pdfUrl = `${pdfBaseUrl}/cookies/sales/${sale.id}/pdf${encodedNote}`;
  }

  // Build the live preview text matching the exact requested structure
  const buildMessage = () => {
    let msg = `🍪 *${businessName}* 🍪\n\n`;
    msg += `¡Hola *${customerName}*! Muchas gracias por tu compra. Te compartimos el comprobante de tu ${ticketType.toLowerCase()}:\n\n`;
    msg += `📋 *Comprobante Oficial • Ticket #${ticketId}*\n`;
    msg += `📅 *${dateText}*\n`;
    msg += `🍪 *Detalle del Pedido:* ${itemsSummary}\n`;
    msg += `💰 *Total a Cobrar:* ${totalFormatted}\n`;
    msg += `💳 *Método de Pago:* ${paymentText}\n`;

    if (customNote.trim()) {
      msg += `\n📝 *Nota:* ${customNote.trim()}\n`;
    }

    if (includePdf) {
      msg += `\n📄 *Descarga tu comprobante oficial en PDF con logo:*\n${pdfUrl}\n`;
    }

    msg += `\n✨ ${ticketFooterText} ❤️🍪`;
    return msg;
  };

  const handleOpenPdf = async () => {
    try {
      if (Platform.OS === 'web') {
        window.open(pdfUrl, '_blank');
      } else {
        await Linking.openURL(pdfUrl);
      }
    } catch {
      Alert.alert('Error', 'No se pudo abrir el enlace del PDF.');
    }
  };

  const handleConfirmSend = async () => {
    const cleanPhone = phoneDigits.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length === 0) {
      if (Platform.OS === 'web') {
        alert('⚠️ Por favor ingresa el número de WhatsApp del cliente para poder enviarle el ticket.');
      } else {
        Alert.alert(
          'Número Requerido',
          '⚠️ Por favor ingresa el número de WhatsApp del cliente para poder enviarle el ticket.'
        );
      }
      return;
    }

    if (cleanPhone.length < 10) {
      if (Platform.OS === 'web') {
        alert('⚠️ Por favor ingresa los 10 dígitos completos del número telefónico (ej. 5512345678).');
      } else {
        Alert.alert(
          'Número Incompleto',
          '⚠️ Por favor ingresa los 10 dígitos del número telefónico (ej. 5512345678).'
        );
      }
      return;
    }

    const fullPhone = `52${cleanPhone}`;
    const message = buildMessage();
    const encoded = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${fullPhone}?text=${encoded}`;

    try {
      if (Platform.OS === 'web') {
        const win = window.open(whatsappUrl, '_blank');
        if (!win || win.closed || typeof win.closed === 'undefined') {
          window.location.href = whatsappUrl;
        }
      } else {
        await Linking.openURL(whatsappUrl);
      }
      onClose();
    } catch {
      Alert.alert('Error', 'No se pudo abrir WhatsApp. Verifica que la aplicación esté instalada.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.dialog,
            {
              backgroundColor: isDark ? '#1C202A' : '#FFFFFF',
              borderColor: isDark ? '#2E384D' : '#E2E8F0',
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Top Drag Handle & Header with swipe-down handler */}
          <View {...panResponder.panHandlers}>
            <View style={styles.dragHandleContainer}>
              <View
                style={[
                  styles.dragHandleBar,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.18)' },
                ]}
              />
            </View>

            <View style={[styles.header, { borderBottomColor: isDark ? '#2A303C' : '#E5E7EB' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Image
                  source={require('../../../assets/lucky_cookies_logo.png')}
                  style={styles.logoImage}
                />
                <View>
                  <Text style={[styles.headerEyebrow, { color: colors.whatsappText }]}>
                    WhatsApp Ticket & PDF
                  </Text>
                  <Text style={[styles.headerTitle, { color: isDark ? '#F1F3F7' : '#181A1F' }]}>
                    Enviar a {customerName}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            {/* Phone Number Input with Fixed 55 Prefix */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: isDark ? '#9BA3AF' : '#5E6472' }]}>
                NÚMERO DE TELÉFONO O WHATSAPP (10 DÍGITOS) *
              </Text>
              <View
                style={[
                  styles.inputRow,
                  {
                    backgroundColor: isDark ? '#242936' : '#F8F9FA',
                    borderColor: isDark ? '#2A303C' : '#E5E7EB',
                  },
                ]}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingRight: 10,
                    borderRightWidth: 1,
                    borderRightColor: isDark ? '#374151' : '#D1D5DB',
                  }}
                >
                    <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                    <Text style={{ fontSize: 14, fontWeight: '800', color: isDark ? '#E5E7EB' : '#1F2937' }}>
                      +52
                    </Text>
                  </View>
                  <TextInput
                    style={[styles.inputField, { color: isDark ? '#F1F3F7' : '#181A1F', marginLeft: 10 }]}
                    placeholder="55 1234 5678 (10 dígitos)"
                    placeholderTextColor={colors.textDim}
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phoneDigits}
                    onChangeText={(val) => {
                      const cleaned = val.replace(/\D/g, '');
                      if (cleaned.startsWith('52') && cleaned.length > 10) {
                        setPhoneDigits(cleaned.slice(2).slice(0, 10));
                      } else {
                        setPhoneDigits(cleaned.slice(0, 10));
                      }
                    }}
                  />
                </View>
                <Text style={{ fontSize: 11, color: colors.textDim, marginTop: 4 }}>
                  Ingresa los 10 dígitos del número telefónico o celular.
                </Text>
              </View>

            {/* Toggle PDF Ticket */}
            <View
              style={[
                styles.toggleCard,
                {
                  backgroundColor: includePdf
                    ? isDark
                      ? 'rgba(16, 185, 129, 0.12)'
                      : '#ECFDF5'
                    : isDark
                    ? '#242936'
                    : '#F8F9FA',
                  borderColor: includePdf
                    ? isDark
                      ? 'rgba(16, 185, 129, 0.3)'
                      : '#A7F3D0'
                    : isDark
                    ? '#2A303C'
                    : '#E5E7EB',
                },
              ]}
            >
              <View style={{ flex: 1, paddingRight: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons
                    name="document-text"
                    size={18}
                    color={includePdf ? colors.whatsappText : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.toggleTitle,
                      { color: includePdf ? colors.whatsappText : colors.textMain },
                    ]}
                  >
                    Generar e Incluir Ticket en PDF
                  </Text>
                </View>
                <Text style={[styles.toggleDesc, { color: colors.textMuted }]}>
                  Crea automáticamente el PDF con el logo oficial de lucky cookies, desglose y total.
                </Text>
              </View>
              <Switch
                value={includePdf}
                onValueChange={setIncludePdf}
                trackColor={{ false: '#767577', true: '#10B981' }}
                thumbColor={includePdf ? '#FFFFFF' : '#f4f3f4'}
              />
            </View>

            {/* Optional Custom Note */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: isDark ? '#9BA3AF' : '#5E6472' }]}>
                INFORMACIÓN OPCIONAL PARA EL MENSAJE
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: isDark ? '#242936' : '#F8F9FA',
                    borderColor: isDark ? '#2A303C' : '#E5E7EB',
                    color: isDark ? '#F1F3F7' : '#181A1F',
                  },
                ]}
                placeholder="Ej. ¡Gracias por tu compra! Tu pedido estará listo para recoger a las 4:00 PM."
                placeholderTextColor={colors.textDim}
                multiline
                numberOfLines={3}
                value={customNote}
                onChangeText={setCustomNote}
              />
            </View>

            {/* Live Message Preview */}
            <View style={styles.fieldGroup}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 6,
                }}
              >
                <Text style={[styles.label, { color: isDark ? '#9BA3AF' : '#5E6472', marginBottom: 0 }]}>
                  VISTA PREVIA DEL MENSAJE WHATSAPP
                </Text>
                {includePdf && (
                  <TouchableOpacity
                    onPress={handleOpenPdf}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE',
                    }}
                  >
                    <Ionicons name="document-text-outline" size={13} color="#3B82F6" />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#3B82F6' }}>
                      Probar / Ver PDF
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <View
                style={[
                  styles.previewBox,
                  {
                    backgroundColor: isDark ? '#141822' : '#F0FDF4',
                    borderColor: isDark ? '#1F2937' : '#DCFCE7',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.previewText,
                    { color: isDark ? '#E2E8F0' : '#166534' },
                  ]}
                >
                  {buildMessage()}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                onPress={onClose}
                style={[
                  styles.cancelBtn,
                  {
                    backgroundColor: isDark ? '#242936' : '#F1F5F9',
                    borderColor: isDark ? '#3B4353' : '#CBD5E1',
                  },
                ]}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textMain }]}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmSend}
                style={[styles.sendBtn, { backgroundColor: colors.whatsapp }]}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#FFF" />
                <Text style={styles.sendBtnText}>Confirmar y Enviar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialog: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  logoImage: {
    width: 38,
    height: 38,
    borderRadius: 8,
    resizeMode: 'contain',
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    padding: 18,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  inputField: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 12,
    marginBottom: 14,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  toggleDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 10,
    fontSize: 13,
    minHeight: 64,
    textAlignVertical: 'top',
  },
  previewBox: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 12,
  },
  previewText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11.5,
    lineHeight: 17,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    marginBottom: 20,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radii.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  dragHandleBar: {
    width: 42,
    height: 4.5,
    borderRadius: 3,
  },
  sendBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: radii.md,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  sendBtnText: {
    color: '#FFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
});
