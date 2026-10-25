import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CookieProduct } from '../../lib/types';
import { useThemeColors, radii } from '../../theme';
import { useAppStore } from '../../stores/app.store';
import { VectorQrCode } from '../ui/VectorQrCode';
import { buildWhatsAppLink, formatDisplayPhone } from '../../lib/whatsappUtils';

interface StickerGeneratorModalProps {
  visible: boolean;
  onClose: () => void;
  cookie: CookieProduct | null;
}

export const StickerGeneratorModal: React.FC<StickerGeneratorModalProps> = ({
  visible,
  onClose,
  cookie,
}) => {
  const colors = useThemeColors();
  const isDark = colors.isDark;
  const {
    businessName,
    whatsappPhone1,
    whatsappPhone2,
    whatsappLabel1,
    whatsappLabel2,
    defaultQrPhone,
  } = useAppStore();

  const [stickerTheme, setStickerTheme] = useState<'kraft' | 'white' | 'gold'>('kraft');
  const [selectedPhoneKey, setSelectedPhoneKey] = useState<'phone1' | 'phone2'>(defaultQrPhone || 'phone1');

  if (!cookie) return null;

  const todayStr = new Date().toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const activePhone = selectedPhoneKey === 'phone1' ? whatsappPhone1 : whatsappPhone2;
  const activeLabel = selectedPhoneKey === 'phone1' ? (whatsappLabel1 || 'Línea 1') : (whatsappLabel2 || 'Línea 2');

  const waMessage = `¡Hola! Acabo de probar la galleta de ${cookie.name} y me encantó. Quiero hacer un nuevo pedido de ${businessName}.`;
  const qrUrl = buildWhatsAppLink(activePhone, waMessage);

  const handleShareSticker = async () => {
    try {
      await Share.share({
        message: `*ETIQUETA DE EMPAQUE - ${businessName.toUpperCase()}*\n• Sabor: ${cookie.name}\n• Fecha de horneado: ${todayStr}\n• Consumo preferente: 7 días en envase sellado.\n• Pedidos por WhatsApp (${activeLabel}): ${formatDisplayPhone(activePhone)}\n• Enlace directo: ${qrUrl}`,
      });
    } catch {}
  };

  const getThemeStyles = () => {
    switch (stickerTheme) {
      case 'white':
        return {
          bg: '#FFFFFF',
          border: '#CBD5E1',
          textMain: '#0B132B',
          textSub: '#64748B',
          accent: '#0284C7',
          qrColor: '#0B132B',
        };
      case 'gold':
        return {
          bg: '#1C1917',
          border: '#F59E0B',
          textMain: '#FBBF24',
          textSub: '#D6D3D1',
          accent: '#F59E0B',
          qrColor: '#FBBF24',
        };
      case 'kraft':
      default:
        return {
          bg: '#F5EDE0',
          border: '#D7C4B7',
          textMain: '#451A03',
          textSub: '#78350F',
          accent: '#92400E',
          qrColor: '#451A03',
        };
    }
  };

  const t = getThemeStyles();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.dialog, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="pricetag" size={17} color={colors.brandLight} />
                <Text style={[styles.title, { color: colors.textMain }]}>Etiqueta para Empaque</Text>
              </View>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Sticker con código QR escaneable directo a WhatsApp
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
            >
              <Ionicons name="close" size={18} color={colors.textMain} />
            </TouchableOpacity>
          </View>

          {/* Selector de Teléfono para el QR de la etiqueta */}
          <View style={[styles.phoneSelectorBar, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 }}>
              <Ionicons name="logo-whatsapp" size={14} color="#10B981" />
              <Text style={[styles.phoneSelectorTitle, { color: colors.textDim }]}>
                DESTINO DEL QR PARA PEDIDOS:
              </Text>
            </View>
            <View style={styles.phoneTabsRow}>
              <TouchableOpacity
                onPress={() => setSelectedPhoneKey('phone1')}
                style={[
                  styles.phoneTabBtn,
                  selectedPhoneKey === 'phone1' && { backgroundColor: colors.brand, borderColor: colors.brand },
                  selectedPhoneKey !== 'phone1' && { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle },
                ]}
              >
                <Ionicons
                  name={selectedPhoneKey === 'phone1' ? 'checkmark-circle' : 'ellipse-outline'}
                  size={13}
                  color={selectedPhoneKey === 'phone1' ? '#FFFFFF' : colors.textDim}
                />
                <Text
                  style={[
                    styles.phoneTabText,
                    { color: selectedPhoneKey === 'phone1' ? '#FFFFFF' : colors.textMain },
                  ]}
                  numberOfLines={1}
                >
                  {whatsappLabel1 || 'Pedidos Línea 1'} ({whatsappPhone1 ? formatDisplayPhone(whatsappPhone1) : 'Sin núm.'})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedPhoneKey('phone2')}
                style={[
                  styles.phoneTabBtn,
                  selectedPhoneKey === 'phone2' && { backgroundColor: colors.brand, borderColor: colors.brand },
                  selectedPhoneKey !== 'phone2' && { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle },
                ]}
              >
                <Ionicons
                  name={selectedPhoneKey === 'phone2' ? 'checkmark-circle' : 'ellipse-outline'}
                  size={13}
                  color={selectedPhoneKey === 'phone2' ? '#FFFFFF' : colors.textDim}
                />
                <Text
                  style={[
                    styles.phoneTabText,
                    { color: selectedPhoneKey === 'phone2' ? '#FFFFFF' : colors.textMain },
                  ]}
                  numberOfLines={1}
                >
                  {whatsappLabel2 || 'Pedidos Línea 2'} ({whatsappPhone2 ? formatDisplayPhone(whatsappPhone2) : 'Sin núm.'})
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Theme Selector */}
          <View style={[styles.themeRow, { backgroundColor: colors.bgTertiary }]}>
            {(['kraft', 'white', 'gold'] as const).map((th) => (
              <TouchableOpacity
                key={th}
                onPress={() => setStickerTheme(th)}
                style={[
                  styles.themeTab,
                  stickerTheme === th && { backgroundColor: colors.brand },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons
                    name={th === 'kraft' ? 'leaf-outline' : th === 'white' ? 'sparkles-outline' : 'diamond-outline'}
                    size={12}
                    color={stickerTheme === th ? '#FFFFFF' : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.themeTabText,
                      { color: stickerTheme === th ? '#FFFFFF' : colors.textMuted },
                      stickerTheme === th && { fontWeight: '800' },
                    ]}
                  >
                    {th === 'kraft' ? 'Kraft Rústico' : th === 'white' ? 'Blanco Seda' : 'Oro Negro'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sticker Preview Card */}
          <ScrollView contentContainerStyle={styles.scroll}>
            <View style={[styles.stickerCard, { backgroundColor: t.bg, borderColor: t.border }]}>
              {/* Brand Header */}
              <View style={styles.stickerHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="nutrition" size={16} color={t.textMain} />
                  <Text style={[styles.brandLogo, { color: t.textMain }]}>{businessName.toUpperCase()}</Text>
                </View>
                <Text style={[styles.tagline, { color: t.textSub }]}>REPOSTERÍA ARTESANAL DE ALTA GAMA</Text>
              </View>

              <View style={[styles.stickerDivider, { backgroundColor: t.border }]} />

              {/* Flavor Title */}
              <Text style={[styles.flavorTitle, { color: t.textMain }]}>{cookie.name}</Text>
              <Text style={[styles.flavorDesc, { color: t.textSub }]}>
                {cookie.description || 'Elaborada artesanalmente con mantequilla pura e ingredientes premium seleccionados.'}
              </Text>

              {/* QR and Details Container */}
              <View style={styles.qrSection}>
                <View style={[styles.qrBox, { borderColor: t.border, backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                  <VectorQrCode
                    value={qrUrl}
                    size={80}
                    color={t.qrColor}
                    backgroundColor="transparent"
                  />
                </View>

                <View style={{ flex: 1, paddingLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="scan" size={11} color={t.accent} />
                    <Text style={[styles.qrLabel, { color: t.accent }]}>ESCANEAME PARA ORDENAR</Text>
                  </View>
                  <Text style={[styles.qrSub, { color: t.textSub }]}>
                    Abre tu cámara y vuelve a pedir directo al WhatsApp de {activeLabel}
                  </Text>
                  <View style={{ marginTop: 6 }}>
                    <Text style={[styles.dateText, { color: t.textMain }]}>
                      Horneada: {todayStr}
                    </Text>
                    <Text style={[styles.batchNote, { color: t.textSub }]}>
                      Tanda fresca • Consérvese en lugar fresco y seco
                    </Text>
                  </View>
                </View>
              </View>

              {/* Warm Tip */}
              <View style={[styles.tipBanner, { backgroundColor: 'rgba(0, 0, 0, 0.05)', borderColor: t.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Ionicons name="bulb-outline" size={13} color={t.textMain} />
                  <Text style={[styles.tipText, { color: t.textMain, flex: 1 }]}>
                    <Text style={{ fontWeight: '800' }}>Tip Repostero:</Text> Caliéntala 10 segundos en microondas para saborearla como recién horneada.
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={[styles.footer, { borderTopColor: colors.borderSubtle }]}>
            <TouchableOpacity
              onPress={handleShareSticker}
              style={[styles.shareBtn, { backgroundColor: colors.brand }]}
            >
              <Ionicons name="share-social-outline" size={16} color="#FFFFFF" />
              <Text style={styles.shareBtnText}>Compartir / Exportar Sticker</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '92%',
    borderRadius: radii.outer,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneSelectorBar: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  phoneSelectorTitle: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  phoneTabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  phoneTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  phoneTabText: {
    fontSize: 10.5,
    fontWeight: '700',
    flex: 1,
  },
  themeRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 3,
    borderRadius: radii.pill,
  },
  themeTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  themeTabText: {
    fontSize: 10.5,
  },
  scroll: {
    padding: 16,
    paddingTop: 8,
    alignItems: 'center',
  },
  stickerCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  stickerHeader: {
    alignItems: 'center',
  },
  brandLogo: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  tagline: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  stickerDivider: {
    height: 1,
    width: '100%',
    marginVertical: 10,
  },
  flavorTitle: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  flavorDesc: {
    fontSize: 10.5,
    textAlign: 'center',
    marginTop: 3,
    marginBottom: 10,
    lineHeight: 14,
  },
  qrSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  qrBox: {
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrLabel: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  qrSub: {
    fontSize: 9.5,
    marginTop: 1,
    lineHeight: 13,
  },
  dateText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  batchNote: {
    fontSize: 9,
    marginTop: 1,
  },
  tipBanner: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
  },
  tipText: {
    fontSize: 9.5,
    lineHeight: 13,
  },
  footer: {
    padding: 14,
    borderTopWidth: 1,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: radii.pill,
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
