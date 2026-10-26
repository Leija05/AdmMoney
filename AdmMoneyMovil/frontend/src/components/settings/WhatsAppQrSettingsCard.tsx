import React, { useState, useEffect } from 'react';
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
import { buildWhatsAppLink, formatDisplayPhone } from '../../lib/whatsappUtils';

export const WhatsAppQrSettingsCard: React.FC = () => {
  const colors = useThemeColors();
  const isDark = colors.isDark;
  const {
    whatsappPhone1,
    whatsappPhone2,
    whatsappLabel1,
    whatsappLabel2,
    defaultQrPhone,
    setDefaultQrPhone,
    saveWhatsAppSettings,
    businessName,
  } = useAppStore();

  const [phone1, setPhone1] = useState(whatsappPhone1 || '');
  const [phone2, setPhone2] = useState(whatsappPhone2 || '');
  const [label1, setLabel1] = useState(whatsappLabel1 || 'Pedidos Línea 1');
  const [label2, setLabel2] = useState(whatsappLabel2 || 'Pedidos Línea 2');
  const [hasSavedFeedback, setHasSavedFeedback] = useState(false);
  const [qrDestinationMode, setQrDestinationMode] = useState<'web' | 'whatsapp'>('web');

  const [customMessage, setCustomMessage] = useState(
    `¡Hola! Me gustaría hacer un pedido en ${businessName || 'Lucky Cookies'}.`
  );

  // Sincronizar automáticamente cuando el store se rehidrate desde el almacenamiento persistente
  useEffect(() => {
    if (whatsappPhone1 !== undefined) setPhone1(whatsappPhone1);
    if (whatsappPhone2 !== undefined) setPhone2(whatsappPhone2);
    if (whatsappLabel1) setLabel1(whatsappLabel1);
    if (whatsappLabel2) setLabel2(whatsappLabel2);
  }, [whatsappPhone1, whatsappPhone2, whatsappLabel1, whatsappLabel2]);

  const activePhone = defaultQrPhone === 'phone1' ? phone1 : phone2;
  const activeLabel = defaultQrPhone === 'phone1' ? label1 : label2;
  const cleanPhone = activePhone.replace(/\D/g, '');

  // Base URL para el portal web de pedidos en línea
  const apiHost = process.env.EXPO_PUBLIC_API_URL || 'https://admmoney-backend.onrender.com';
  const cleanBaseUrl = apiHost.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  const webOrderUrl = `${cleanBaseUrl}/pedir?phone=${cleanPhone}&line=${defaultQrPhone}`;
  const directWhatsAppUrl = buildWhatsAppLink(activePhone, customMessage);

  // URL activa que codifica el código QR según el modo seleccionado
  const activeQrCodeUrl = qrDestinationMode === 'web' ? webOrderUrl : directWhatsAppUrl;

  const handleSave = async () => {
    saveWhatsAppSettings({
      phone1,
      phone2,
      label1,
      label2,
      defaultQrPhone,
    });

    // Sincronizar también con la base de datos en la nube para el portal web
    try {
      fetch(`${cleanBaseUrl}/api/public/settings/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone1,
          phone2,
          label1,
          label2,
          defaultQrPhone,
        }),
      }).catch(() => {});
    } catch {}

    setHasSavedFeedback(true);
    setTimeout(() => setHasSavedFeedback(false), 2200);
    Alert.alert(
      '¡Números Guardados!',
      'Ambos números de WhatsApp para pedidos han sido guardados con éxito y están activos para generar códigos QR y etiquetas de empaque.'
    );
  };

  const handleSelectActiveLine = (line: 'phone1' | 'phone2') => {
    setDefaultQrPhone(line);
    saveWhatsAppSettings({
      phone1,
      phone2,
      label1,
      label2,
      defaultQrPhone: line,
    });
  };

  const handleOpenWebPage = async () => {
    try {
      await Linking.openURL(webOrderUrl);
    } catch {
      Alert.alert(
        'No se pudo abrir el navegador',
        `No fue posible abrir el enlace:\n${webOrderUrl}`
      );
    }
  };

  const handleTestWhatsApp = async () => {
    if (!activePhone.trim()) {
      Alert.alert(
        'Teléfono no configurado',
        'Ingresa y guarda el número de teléfono en la línea seleccionada para poder abrir el chat de WhatsApp.'
      );
      return;
    }
    try {
      const canOpen = await Linking.canOpenURL(directWhatsAppUrl);
      if (canOpen) {
        await Linking.openURL(directWhatsAppUrl);
      } else {
        Alert.alert(
          'No se pudo abrir WhatsApp',
          'Verifica que tengas la aplicación de WhatsApp instalada en tu dispositivo o el navegador web.'
        );
      }
    } catch {
      Alert.alert('Error', 'No se pudo abrir el enlace de WhatsApp.');
    }
  };

  const handleShareQr = async () => {
    try {
      if (qrDestinationMode === 'web') {
        await Share.share({
          title: `Menú en Línea y Pedidos en ${businessName || 'Lucky Cookies'}`,
          message: `¡Haz tu pedido de galletas en ${businessName || 'Lucky Cookies'}!\n\nConsulta nuestro menú digital y arma tu pedido aquí:\n${webOrderUrl}`,
        });
      } else {
        await Share.share({
          title: `Hacer Pedido en ${businessName || 'Lucky Cookies'} por WhatsApp`,
          message: `¡Haz tu pedido de galletas por WhatsApp en ${businessName || 'Lucky Cookies'}!\n\n• Canal: ${activeLabel}\n• Teléfono: ${formatDisplayPhone(
            activePhone
          )}\n\nEnvíanos un mensaje haciendo clic aquí:\n${directWhatsAppUrl}`,
        });
      }
    } catch {}
  };

  return (
    <DoubleBezelCard style={styles.card}>
      {/* Encabezado Principal */}
      <View style={styles.headerRow}>
        <View style={styles.headerIconBadge}>
          <Ionicons name="logo-whatsapp" size={22} color="#10B981" />
        </View>
        <View style={{ flex: 1, paddingLeft: 10 }}>
          <Text style={[styles.cardTitle, { color: colors.textMain }]}>
            Números de WhatsApp & QR de Pedidos
          </Text>
          <Text style={[styles.cardSub, { color: colors.textDim }]}>
            Configura tus 2 números para recibir pedidos y selecciona cuál activará el código QR y la página web.
          </Text>
        </View>
      </View>

      {/* --- SECCIÓN 1: CONFIGURACIÓN DE LAS 2 LÍNEAS DE PEDIDOS --- */}
      <View style={styles.linesSection}>
        <Text style={[styles.sectionSubtitle, { color: colors.textDim }]}>
          CONFIGURA LOS 2 NÚMEROS PARA RECIBIR PEDIDOS:
        </Text>

        {/* LÍNEA DE PEDIDOS 1 */}
        <View
          style={[
            styles.phoneCard,
            {
              backgroundColor: colors.bgTertiary,
              borderColor: defaultQrPhone === 'phone1' ? colors.brand : colors.borderSubtle,
            },
          ]}
        >
          <View style={styles.phoneCardTop}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleSelectActiveLine('phone1')}
              style={styles.radioClickArea}
            >
              <Ionicons
                name={defaultQrPhone === 'phone1' ? 'radio-button-on' : 'radio-button-off'}
                size={18}
                color={defaultQrPhone === 'phone1' ? colors.brandLight : colors.textDim}
              />
              <Text
                style={[
                  styles.phoneCardHeading,
                  { color: defaultQrPhone === 'phone1' ? colors.brandLight : colors.textMain },
                ]}
              >
                Línea de Pedidos 1
              </Text>
            </TouchableOpacity>

            {defaultQrPhone === 'phone1' ? (
              <View style={[styles.activeBadge, { backgroundColor: colors.brand }]}>
                <Ionicons name="qr-code" size={11} color="#FFFFFF" />
                <Text style={styles.activeBadgeText}>Activo en QR</Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => handleSelectActiveLine('phone1')}
                style={[styles.selectLineBtn, { borderColor: colors.borderSubtle }]}
              >
                <Text style={[styles.selectLineBtnText, { color: colors.textDim }]}>Usar en QR</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Formulario Línea 1 */}
          <View style={styles.cardFormRow}>
            <View style={styles.labelInputCol}>
              <Text style={[styles.tinyLabel, { color: colors.textDim }]}>Nombre / Etiqueta</Text>
              <TextInput
                style={[
                  styles.labelInput,
                  { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle, color: colors.textMain },
                ]}
                placeholder="Ej. Pedidos Principal"
                placeholderTextColor={colors.textDim}
                value={label1}
                onChangeText={setLabel1}
              />
            </View>

            <View style={styles.phoneInputCol}>
              <Text style={[styles.tinyLabel, { color: colors.textDim }]}>Teléfono (10 dígitos)</Text>
              <View
                style={[
                  styles.phoneInputWrapper,
                  { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle },
                ]}
              >
                <View style={styles.prefixPill}>
                  <Text style={[styles.prefixText, { color: colors.textDim }]}>+52</Text>
                </View>
                <TextInput
                  style={[styles.phoneTextInput, { color: colors.textMain }]}
                  placeholder="312 123 4567"
                  placeholderTextColor={colors.textDim}
                  keyboardType="phone-pad"
                  value={phone1}
                  onChangeText={setPhone1}
                />
              </View>
            </View>
          </View>
        </View>

        {/* LÍNEA DE PEDIDOS 2 */}
        <View
          style={[
            styles.phoneCard,
            {
              backgroundColor: colors.bgTertiary,
              borderColor: defaultQrPhone === 'phone2' ? colors.brand : colors.borderSubtle,
              marginTop: 10,
            },
          ]}
        >
          <View style={styles.phoneCardTop}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleSelectActiveLine('phone2')}
              style={styles.radioClickArea}
            >
              <Ionicons
                name={defaultQrPhone === 'phone2' ? 'radio-button-on' : 'radio-button-off'}
                size={18}
                color={defaultQrPhone === 'phone2' ? colors.brandLight : colors.textDim}
              />
              <Text
                style={[
                  styles.phoneCardHeading,
                  { color: defaultQrPhone === 'phone2' ? colors.brandLight : colors.textMain },
                ]}
              >
                Línea de Pedidos 2
              </Text>
            </TouchableOpacity>

            {defaultQrPhone === 'phone2' ? (
              <View style={[styles.activeBadge, { backgroundColor: colors.brand }]}>
                <Ionicons name="qr-code" size={11} color="#FFFFFF" />
                <Text style={styles.activeBadgeText}>Activo en QR</Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => handleSelectActiveLine('phone2')}
                style={[styles.selectLineBtn, { borderColor: colors.borderSubtle }]}
              >
                <Text style={[styles.selectLineBtnText, { color: colors.textDim }]}>Usar en QR</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Formulario Línea 2 */}
          <View style={styles.cardFormRow}>
            <View style={styles.labelInputCol}>
              <Text style={[styles.tinyLabel, { color: colors.textDim }]}>Nombre / Etiqueta</Text>
              <TextInput
                style={[
                  styles.labelInput,
                  { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle, color: colors.textMain },
                ]}
                placeholder="Ej. Pedidos Sucursal"
                placeholderTextColor={colors.textDim}
                value={label2}
                onChangeText={setLabel2}
              />
            </View>

            <View style={styles.phoneInputCol}>
              <Text style={[styles.tinyLabel, { color: colors.textDim }]}>Teléfono (10 dígitos)</Text>
              <View
                style={[
                  styles.phoneInputWrapper,
                  { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle },
                ]}
              >
                <View style={styles.prefixPill}>
                  <Text style={[styles.prefixText, { color: colors.textDim }]}>+52</Text>
                </View>
                <TextInput
                  style={[styles.phoneTextInput, { color: colors.textMain }]}
                  placeholder="312 987 6543"
                  placeholderTextColor={colors.textDim}
                  keyboardType="phone-pad"
                  value={phone2}
                  onChangeText={setPhone2}
                />
              </View>
            </View>
          </View>
        </View>

        {/* BOTÓN DESTACADO PARA GUARDAR NÚMEROS */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSave}
          style={[
            styles.saveAllBtn,
            { backgroundColor: hasSavedFeedback ? '#10B981' : colors.brand },
          ]}
        >
          <Ionicons
            name={hasSavedFeedback ? 'checkmark-circle' : 'save-outline'}
            size={17}
            color="#FFFFFF"
          />
          <Text style={styles.saveAllBtnText}>
            {hasSavedFeedback ? '¡Números Guardados Correctamente!' : 'Guardar Números de Pedidos'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* --- SECCIÓN 2: TARJETA DEL CÓDIGO QR GENERADO --- */}
      <View style={[styles.qrDisplayCard, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}>
        {/* Cabecera del QR */}
        <View style={styles.qrBadgeHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="qr-code" size={17} color={colors.emeraldLight} />
            <Text style={[styles.qrBadgeTitle, { color: colors.textMain }]}>
              Código QR de Pedidos
            </Text>
          </View>
          <View style={[styles.phonePillBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#D1FAE5' }]}>
            <Text style={[styles.qrPhoneText, { color: colors.emeraldLight }]}>
              {activePhone ? formatDisplayPhone(activePhone) : 'Sin registrar'}
            </Text>
          </View>
        </View>

        {/* SELECTOR DE MODO DE DESTINO DEL QR */}
        <View style={styles.modeTabsRow}>
          <TouchableOpacity
            onPress={() => setQrDestinationMode('web')}
            style={[
              styles.modeTabBtn,
              qrDestinationMode === 'web'
                ? { backgroundColor: colors.brand, borderColor: colors.brand }
                : { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle },
            ]}
          >
            <Ionicons
              name="globe-outline"
              size={14}
              color={qrDestinationMode === 'web' ? '#FFFFFF' : colors.textDim}
            />
            <Text
              style={[
                styles.modeTabText,
                { color: qrDestinationMode === 'web' ? '#FFFFFF' : colors.textMain },
              ]}
            >
              Página Web Menú
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setQrDestinationMode('whatsapp')}
            style={[
              styles.modeTabBtn,
              qrDestinationMode === 'whatsapp'
                ? { backgroundColor: '#10B981', borderColor: '#10B981' }
                : { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle },
            ]}
          >
            <Ionicons
              name="logo-whatsapp"
              size={14}
              color={qrDestinationMode === 'whatsapp' ? '#FFFFFF' : colors.textDim}
            />
            <Text
              style={[
                styles.modeTabText,
                { color: qrDestinationMode === 'whatsapp' ? '#FFFFFF' : colors.textMain },
              ]}
            >
              WhatsApp Directo
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lienzo del Código QR */}
        <View style={styles.qrCanvasWrapper}>
          <View style={[styles.qrFrame, { borderColor: colors.borderSubtle, backgroundColor: '#FFFFFF' }]}>
            <VectorQrCode
              value={activeQrCodeUrl}
              size={175}
              color="#064E3B"
              backgroundColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Indicador de URL Destino */}
        <View style={[styles.urlBadgeBox, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}>
          <Ionicons
            name={qrDestinationMode === 'web' ? 'globe-outline' : 'chatbubbles-outline'}
            size={13}
            color={qrDestinationMode === 'web' ? colors.brandLight : '#10B981'}
          />
          <Text
            style={[styles.urlBadgeText, { color: colors.textMuted }]}
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {activeQrCodeUrl}
          </Text>
        </View>

        <Text style={[styles.qrInstructions, { color: colors.textDim }]}>
          {qrDestinationMode === 'web'
            ? 'Tus clientes escanean este código y entran directamente a tu página web de Lucky Cookies (/pedir). Allí eligen galletas, ven fotos, llenan su formulario y al enviar se abre WhatsApp con su folio.'
            : 'Tus clientes escanean este código y se les abre el chat directo de WhatsApp con la línea configurada.'}
        </Text>

        {/* Campo de Mensaje de Bienvenida (Solo visible si está en WhatsApp directo) */}
        {qrDestinationMode === 'whatsapp' && (
          <View style={{ marginTop: 12 }}>
            <Text style={[styles.tinyLabel, { color: colors.textDim, marginBottom: 5 }]}>
              Mensaje inicial al abrir WhatsApp:
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
              multiline
              numberOfLines={2}
            />
          </View>
        )}

        {/* Botones de Acción */}
        <View style={styles.qrActionsCol}>
          {/* Botón Principal: Abrir Página Web en Navegador */}
          {qrDestinationMode === 'web' ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleOpenWebPage}
              style={[styles.primaryActionBtn, { backgroundColor: colors.brand }]}
            >
              <Ionicons name="open-outline" size={17} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Abrir Página Web en Navegador</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleTestWhatsApp}
              style={[styles.primaryActionBtn, { backgroundColor: '#10B981' }]}
            >
              <Ionicons name="logo-whatsapp" size={17} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Probar en WhatsApp</Text>
            </TouchableOpacity>
          )}

          <View style={styles.secondaryActionsRow}>
            {qrDestinationMode === 'web' && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleTestWhatsApp}
                style={[styles.secondaryActionBtn, { backgroundColor: '#10B981' }]}
              >
                <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>Probar Chat</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleShareQr}
              style={[
                styles.secondaryActionBtn,
                { backgroundColor: qrDestinationMode === 'web' ? colors.bgCard : colors.brand, borderWidth: qrDestinationMode === 'web' ? 1 : 0, borderColor: colors.borderSubtle },
              ]}
            >
              <Ionicons
                name="share-social-outline"
                size={16}
                color={qrDestinationMode === 'web' ? colors.textMain : '#FFFFFF'}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  { color: qrDestinationMode === 'web' ? colors.textMain : '#FFFFFF' },
                ]}
              >
                Compartir Enlace
              </Text>
            </TouchableOpacity>
          </View>
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
    alignItems: 'center',
    marginBottom: 14,
  },
  headerIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  cardSub: {
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 2,
  },
  linesSection: {
    marginTop: 2,
    marginBottom: 14,
  },
  sectionSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  phoneCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  phoneCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  radioClickArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  phoneCardHeading: {
    fontSize: 13,
    fontWeight: '800',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  selectLineBtn: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  selectLineBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardFormRow: {
    gap: 8,
  },
  labelInputCol: {
    marginBottom: 2,
  },
  tinyLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  labelInput: {
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 12.5,
    fontWeight: '600',
  },
  phoneInputCol: {
    marginTop: 2,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    height: 38,
    overflow: 'hidden',
  },
  prefixPill: {
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
  },
  prefixText: {
    fontSize: 12,
    fontWeight: '700',
  },
  phoneTextInput: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 13,
    fontWeight: '700',
  },
  saveAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 42,
    borderRadius: 10,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  saveAllBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  qrDisplayCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  qrBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  qrBadgeTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  phonePillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  qrPhoneText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  modeTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  modeTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  modeTabText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  qrCanvasWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  qrFrame: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  urlBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
  },
  urlBadgeText: {
    flex: 1,
    fontSize: 10.5,
    fontWeight: '600',
  },
  qrInstructions: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 10,
    paddingHorizontal: 6,
  },
  messageInput: {
    minHeight: 52,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
    textAlignVertical: 'top',
  },
  qrActionsCol: {
    gap: 8,
    marginTop: 14,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 9,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
