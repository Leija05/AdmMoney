import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Linking,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../stores/app.store';
import { useThemeColors, radii, spacing } from '../../theme';
import { DoubleBezelCard } from '../ui/DoubleBezelCard';
import { VectorQrCode } from '../ui/VectorQrCode';
import { buildWhatsAppLink, cleanPhoneForWhatsApp, formatDisplayPhone } from '../../lib/whatsappUtils';

export const WhatsAppQrSettingsCard: React.FC = () => {
  const colors = useThemeColors();
  const {
    whatsappPhone1,
    whatsappPhone2,
    whatsappLabel1,
    whatsappLabel2,
    defaultQrPhone,
    setWhatsappPhone1,
    setWhatsappPhone2,
    setWhatsappLabel1,
    setWhatsappLabel2,
    setDefaultQrPhone,
    businessName,
  } = useAppStore();

  const [isEditingPhones, setIsEditingPhones] = useState(false);
  const [phone1Draft, setPhone1Draft] = useState(whatsappPhone1);
  const [phone2Draft, setPhone2Draft] = useState(whatsappPhone2);
  const [label1Draft, setLabel1Draft] = useState(whatsappLabel1 || 'Ventas / Pedidos');
  const [label2Draft, setLabel2Draft] = useState(whatsappLabel2 || 'Atención / Soporte');
  
  const [customMessage, setCustomMessage] = useState(
    `¡Hola! Quisiera información y hacer un pedido de ${businessName}.`
  );

  const activePhone = defaultQrPhone === 'phone1' ? whatsappPhone1 : whatsappPhone2;
  const activeLabel = defaultQrPhone === 'phone1' ? (whatsappLabel1 || 'Teléfono 1') : (whatsappLabel2 || 'Teléfono 2');
  const qrUrl = buildWhatsAppLink(activePhone, customMessage);

  const handleSavePhones = () => {
    setWhatsappPhone1(phone1Draft.trim());
    setWhatsappPhone2(phone2Draft.trim());
    setWhatsappLabel1(label1Draft.trim() || 'Ventas / Pedidos');
    setWhatsappLabel2(label2Draft.trim() || 'Atención / Soporte');
    setIsEditingPhones(false);
    Alert.alert(
      'Números Guardados',
      'Los teléfonos de WhatsApp han sido actualizados con éxito para la generación de códigos QR y etiquetas de empaque.'
    );
  };

  const handleTestWhatsApp = async () => {
    if (!activePhone.trim()) {
      Alert.alert(
        'Teléfono no configurado',
        'Por favor ingresa un número de teléfono para poder abrir el chat de WhatsApp.'
      );
      return;
    }
    const url = buildWhatsAppLink(activePhone, customMessage);
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert(
        'No se pudo abrir WhatsApp',
        'Verifica que tengas la app de WhatsApp instalada en tu dispositivo o el navegador web.'
      );
    }
  };

  const handleShareQr = async () => {
    if (!activePhone.trim()) {
      Alert.alert(
        'Teléfono Requerido',
        'Ingresa al menos un número para poder compartir tu código o enlace directo de WhatsApp.'
      );
      return;
    }
    try {
      await Share.share({
        title: `WhatsApp Directo - ${businessName}`,
        message: `¡Contáctanos directo por WhatsApp en ${businessName}!\n\nCanal: ${activeLabel}\nNúmero: ${formatDisplayPhone(
          activePhone
        )}\n\nEnvíanos un mensaje haciendo clic en el enlace:\n${qrUrl}`,
      });
    } catch {}
  };

  return (
    <DoubleBezelCard style={styles.card}>
      {/* Title Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="logo-whatsapp" size={20} color="#10B981" />
            <Text style={[styles.cardTitle, { color: colors.textMain }]}>
              WhatsApp & Códigos QR Directos
            </Text>
          </View>
          <Text style={[styles.cardSub, { color: colors.textDim }]}>
            Configura hasta 2 líneas de WhatsApp y genera códigos QR para contacto directo o etiquetas de empaque.
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            if (!isEditingPhones) {
              setPhone1Draft(whatsappPhone1);
              setPhone2Draft(whatsappPhone2);
              setLabel1Draft(whatsappLabel1 || 'Ventas / Pedidos');
              setLabel2Draft(whatsappLabel2 || 'Atención / Soporte');
            }
            setIsEditingPhones(!isEditingPhones);
          }}
          style={[styles.editBadgeBtn, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
        >
          <Ionicons name={isEditingPhones ? 'close-outline' : 'pencil-outline'} size={14} color={colors.textMain} />
          <Text style={[styles.editBadgeText, { color: colors.textMain }]}>
            {isEditingPhones ? 'Cancelar' : 'Editar Líneas'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Editing Mode */}
      {isEditingPhones ? (
        <View style={[styles.editFormBox, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}>
          <Text style={[styles.editFormNotice, { color: colors.brandText }]}>
            Ingresa los 10 dígitos de tu teléfono móvil (ej. 55 1234 5678). El código internacional de país (+52 para México) se gestionará automáticamente.
          </Text>

          {/* Línea 1 */}
          <View style={styles.inputGroup}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Ionicons name="call" size={14} color={colors.emeraldLight} />
              <Text style={[styles.fieldLabel, { color: colors.textMain }]}>Línea 1 (Principal)</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                style={[
                  styles.labelInput,
                  { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle, color: colors.textMain },
                ]}
                placeholder="Etiqueta ej. Ventas"
                placeholderTextColor={colors.textDim}
                value={label1Draft}
                onChangeText={setLabel1Draft}
              />
              <TextInput
                style={[
                  styles.phoneInput,
                  { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle, color: colors.textMain },
                ]}
                placeholder="10 dígitos del teléfono"
                placeholderTextColor={colors.textDim}
                keyboardType="phone-pad"
                value={phone1Draft}
                onChangeText={setPhone1Draft}
              />
            </View>
          </View>

          {/* Línea 2 */}
          <View style={[styles.inputGroup, { marginTop: 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Ionicons name="chatbubbles" size={14} color={colors.brandLight} />
              <Text style={[styles.fieldLabel, { color: colors.textMain }]}>Línea 2 (Secundaria / Soporte)</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                style={[
                  styles.labelInput,
                  { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle, color: colors.textMain },
                ]}
                placeholder="Etiqueta ej. Soporte"
                placeholderTextColor={colors.textDim}
                value={label2Draft}
                onChangeText={setLabel2Draft}
              />
              <TextInput
                style={[
                  styles.phoneInput,
                  { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle, color: colors.textMain },
                ]}
                placeholder="10 dígitos del teléfono"
                placeholderTextColor={colors.textDim}
                keyboardType="phone-pad"
                value={phone2Draft}
                onChangeText={setPhone2Draft}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSavePhones}
            style={[styles.saveBtn, { backgroundColor: colors.brand }]}
          >
            <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>Guardar Líneas Telefónicas</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Selector de número activo para el QR */}
      <View style={styles.selectorContainer}>
        <Text style={[styles.subLabel, { color: colors.textDim }]}>
          SELECCIONA LA LÍNEA A DONDE REDIRIGIRÁ EL CÓDIGO QR:
        </Text>

        <View style={styles.phoneTabsRow}>
          {/* Opción Línea 1 */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setDefaultQrPhone('phone1')}
            style={[
              styles.phoneTabBtn,
              {
                backgroundColor: defaultQrPhone === 'phone1' ? colors.brandBg : colors.bgTertiary,
                borderColor: defaultQrPhone === 'phone1' ? colors.brandBorder : colors.borderSubtle,
              },
            ]}
          >
            <View style={styles.tabTop}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Ionicons
                  name={defaultQrPhone === 'phone1' ? 'radio-button-on' : 'radio-button-off'}
                  size={14}
                  color={defaultQrPhone === 'phone1' ? colors.brandText : colors.textDim}
                />
                <Text
                  style={[
                    styles.tabTitle,
                    { color: defaultQrPhone === 'phone1' ? colors.brandText : colors.textMain },
                  ]}
                  numberOfLines={1}
                >
                  {whatsappLabel1 || 'Línea 1'}
                </Text>
              </View>
              {defaultQrPhone === 'phone1' && (
                <View style={[styles.activePill, { backgroundColor: colors.brand }]}>
                  <Text style={styles.activePillText}>Activo en QR</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabPhone, { color: colors.textMuted }]}>
              {whatsappPhone1 ? formatDisplayPhone(whatsappPhone1) : 'Sin registrar'}
            </Text>
          </TouchableOpacity>

          {/* Opción Línea 2 */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setDefaultQrPhone('phone2')}
            style={[
              styles.phoneTabBtn,
              {
                backgroundColor: defaultQrPhone === 'phone2' ? colors.brandBg : colors.bgTertiary,
                borderColor: defaultQrPhone === 'phone2' ? colors.brandBorder : colors.borderSubtle,
              },
            ]}
          >
            <View style={styles.tabTop}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Ionicons
                  name={defaultQrPhone === 'phone2' ? 'radio-button-on' : 'radio-button-off'}
                  size={14}
                  color={defaultQrPhone === 'phone2' ? colors.brandText : colors.textDim}
                />
                <Text
                  style={[
                    styles.tabTitle,
                    { color: defaultQrPhone === 'phone2' ? colors.brandText : colors.textMain },
                  ]}
                  numberOfLines={1}
                >
                  {whatsappLabel2 || 'Línea 2'}
                </Text>
              </View>
              {defaultQrPhone === 'phone2' && (
                <View style={[styles.activePill, { backgroundColor: colors.brand }]}>
                  <Text style={styles.activePillText}>Activo en QR</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabPhone, { color: colors.textMuted }]}>
              {whatsappPhone2 ? formatDisplayPhone(whatsappPhone2) : 'Sin registrar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* QR Code Presentation Box */}
      <View style={[styles.qrDisplayCard, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}>
        <View style={styles.qrBadgeHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="qr-code" size={16} color={colors.emeraldLight} />
            <Text style={[styles.qrBadgeTitle, { color: colors.textMain }]}>
              QR Directo • {activeLabel}
            </Text>
          </View>
          <Text style={[styles.qrPhoneText, { color: colors.emeraldLight }]}>
            {activePhone ? formatDisplayPhone(activePhone) : 'Configura un teléfono'}
          </Text>
        </View>

        {/* QR Canvas */}
        <View style={styles.qrCanvasWrapper}>
          <View style={[styles.qrFrame, { borderColor: colors.borderSubtle, backgroundColor: '#FFFFFF' }]}>
            <VectorQrCode
              value={qrUrl}
              size={160}
              color="#064E3B"
              backgroundColor="#FFFFFF"
            />
          </View>
        </View>

        <Text style={[styles.qrInstructions, { color: colors.textDim }]}>
          Cualquier cliente puede escanear este código con su cámara y se abrirá WhatsApp automáticamente listo para enviarte un mensaje.
        </Text>

        {/* Mensaje al escanear */}
        <View style={{ marginTop: 10 }}>
          <Text style={[styles.fieldLabel, { color: colors.textDim, marginBottom: 4 }]}>
            Mensaje predeterminado al abrir WhatsApp:
          </Text>
          <TextInput
            style={[
              styles.messageInput,
              { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle, color: colors.textMain },
            ]}
            value={customMessage}
            onChangeText={setCustomMessage}
            placeholder="Mensaje de bienvenida..."
            placeholderTextColor={colors.textDim}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.qrActionsRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleTestWhatsApp}
            style={[styles.testWaBtn, { backgroundColor: '#10B981' }]}
          >
            <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
            <Text style={styles.testWaBtnText}>Probar en WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleShareQr}
            style={[styles.shareQrBtn, { backgroundColor: colors.brand, borderColor: colors.brandBorder }]}
          >
            <Ionicons name="share-social-outline" size={16} color="#FFFFFF" />
            <Text style={styles.shareQrBtnText}>Compartir Enlace</Text>
          </TouchableOpacity>
        </View>
      </View>
    </DoubleBezelCard>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: radii.outer,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  cardSub: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  editBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  editBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  editFormBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  editFormNotice: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 10,
  },
  inputGroup: {
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  labelInput: {
    flex: 1.1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 12,
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1.5,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 13,
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 8,
    marginTop: 10,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  selectorContainer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.12)',
  },
  subLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  phoneTabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  phoneTabBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  tabTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  tabPhone: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  activePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activePillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  qrDisplayCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  qrBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  qrBadgeTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  qrPhoneText: {
    fontSize: 12,
    fontWeight: '700',
  },
  qrCanvasWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  qrFrame: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  qrInstructions: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 12,
    paddingHorizontal: 8,
  },
  messageInput: {
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 12,
  },
  qrActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  testWaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 8,
  },
  testWaBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  shareQrBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
  },
  shareQrBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
