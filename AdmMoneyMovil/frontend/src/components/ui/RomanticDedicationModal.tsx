import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../../theme';
import { AnimatedSignature } from './AnimatedSignature';

interface FloatingHeart {
  id: number;
  x: number;
  animY: Animated.Value;
  animScale: Animated.Value;
  animOpacity: Animated.Value;
  iconName: keyof typeof Ionicons.glyphMap;
  color: string;
  size: number;
}

interface RomanticDedicationModalProps {
  visible: boolean;
  onClose: () => void;
}

export const RomanticDedicationModal: React.FC<RomanticDedicationModalProps> = ({
  visible,
  onClose,
}) => {
  const colors = useThemeColors();
  const isDark = colors.isDark;
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Responsive adaptative calculations
  const isSmallScreen = screenHeight < 720 || screenWidth < 360;
  const cardWidth = Math.min(screenWidth - 32, 400);
  const cardMaxHeight = Math.min(screenHeight * 0.88, 700);
  const signatureWidth = Math.min(cardWidth - (isSmallScreen ? 50 : 70), 270);
  const signatureHeight = Math.round(signatureWidth * (120 / 270));

  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const [loveCount, setLoveCount] = useState(0);

  const heartPulse = useRef(new Animated.Value(1)).current;
  const cardScale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(cardScale, {
        toValue: 1,
        tension: 65,
        friction: 8,
        useNativeDriver: true,
      }).start();

      // Trigger initial shower of rising hearts from the bottom
      spawnHearts(6);
    } else {
      cardScale.setValue(0.85);
      setHearts([]);
    }
  }, [visible]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(heartPulse, {
          toValue: 1.25,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(heartPulse, {
          toValue: 1.0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(heartPulse, {
          toValue: 1.15,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(heartPulse, {
          toValue: 1.0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(600),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [heartPulse]);

  const spawnHearts = (count: number = 8) => {
    const iconChoices: { name: keyof typeof Ionicons.glyphMap; color: string }[] = [
      { name: 'heart', color: '#F43F5E' },
      { name: 'heart', color: '#FB7185' },
      { name: 'sparkles', color: '#FBBF24' },
      { name: 'heart', color: '#EC4899' },
      { name: 'star', color: '#A855F7' },
      { name: 'heart', color: '#E11D48' },
    ];
    const newHearts: FloatingHeart[] = [];

    for (let i = 0; i < count; i++) {
      const animY = new Animated.Value(0);
      const animScale = new Animated.Value(0.3);
      const animOpacity = new Animated.Value(0);
      const chosen = iconChoices[Math.floor(Math.random() * iconChoices.length)];

      const h: FloatingHeart = {
        id: Date.now() + Math.random(),
        x: Math.random() * (screenWidth - 70) + 15,
        animY,
        animScale,
        animOpacity,
        iconName: chosen.name,
        color: chosen.color,
        size: isSmallScreen ? (16 + Math.random() * 10) : (20 + Math.random() * 14),
      };

      newHearts.push(h);

      const travelDistance = -(screenHeight + 140);
      const duration = 2400 + Math.random() * 900;

      Animated.parallel([
        Animated.timing(animY, {
          toValue: travelDistance,
          duration,
          easing: Easing.bezier(0.2, 0.8, 0.3, 1),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(animScale, {
            toValue: 1.25,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(animScale, {
            toValue: 1.0,
            duration: duration - 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(animOpacity, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.delay(duration * 0.5),
          Animated.timing(animOpacity, {
            toValue: 0,
            duration: duration * 0.5,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }

    setHearts((prev) => [...prev.slice(-30), ...newHearts]);
  };

  const handleSendMoreLove = () => {
    setLoveCount((c) => c + 1);
    spawnHearts(10);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.dialogCard,
            {
              width: cardWidth,
              maxHeight: cardMaxHeight,
              transform: [{ scale: cardScale }],
            },
          ]}
        >
          <LinearGradient
            colors={
              isDark
                ? ['#2A1622', '#1C1318', '#140D12']
                : ['#FFF5F6', '#FFE4E8', '#FFFFFF']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientContainer}
          >
            {/* Close button always floating on top right */}
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={isDark ? '#FDA4AF' : '#881337'} />
            </TouchableOpacity>

            {/* Scrollable Container so everything is guaranteed 100% visible on any screen */}
            <ScrollView
              style={{ width: '100%' }}
              contentContainerStyle={[
                styles.scrollContent,
                {
                  paddingTop: isSmallScreen ? 12 : 18,
                  paddingBottom: isSmallScreen ? 16 : 22,
                  paddingHorizontal: isSmallScreen ? 16 : 22,
                },
              ]}
              showsVerticalScrollIndicator={false}
              bounces={true}
            >
              {/* Beating Heart Avatar */}
              <View style={[styles.avatarContainer, { height: isSmallScreen ? 70 : 86 }]}>
                <Animated.View
                  style={[
                    styles.heartPulseGlow,
                    {
                      width: isSmallScreen ? 66 : 78,
                      height: isSmallScreen ? 66 : 78,
                      borderRadius: isSmallScreen ? 33 : 39,
                      transform: [{ scale: heartPulse }],
                      backgroundColor: isDark ? 'rgba(244, 63, 94, 0.22)' : 'rgba(244, 63, 94, 0.15)',
                    },
                  ]}
                >
                  <Ionicons name="heart" size={isSmallScreen ? 34 : 40} color="#F43F5E" />
                </Animated.View>
              </View>

              {/* Dedication Header Badge */}
              <View style={styles.pillBadge}>
                <Ionicons name="sparkles" size={11} color="#C084FC" />
                <Text style={styles.pillText}>DEDICATORIA DE AMOR</Text>
                <Ionicons name="sparkles" size={11} color="#C084FC" />
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginVertical: 4 }}>
                <Text style={[styles.mainTitle, { color: isDark ? '#FFF1F2' : '#881337', fontSize: isSmallScreen ? 17 : 19, marginBottom: 0 }]}>
                  Para el Amor de Mi Vida
                </Text>
                <Ionicons name="heart" size={18} color="#F43F5E" />
              </View>

              {/* Heartfelt Letter Box */}
              <View
                style={[
                  styles.messageBox,
                  {
                    padding: isSmallScreen ? 12 : 16,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.85)',
                    borderColor: isDark ? 'rgba(244, 63, 94, 0.3)' : 'rgba(251, 113, 133, 0.35)',
                  },
                ]}
              >
                <Text style={[styles.quoteText, { color: isDark ? '#FFE4E6' : '#4C0519', fontSize: isSmallScreen ? 12.5 : 13.5, lineHeight: isSmallScreen ? 19 : 21 }]}>
                  “Aplicación hecha con amor y mucho cariño para el amor de mi vida, te apoyo en tus emprendimientos, te apoyo en todo lo que tú quieras hacer y siempre será así, Te amo demasiado”
                </Text>

                <View style={styles.noteDivider} />

                <Text style={[styles.subNote, { color: isDark ? '#FDA4AF' : '#9F1239', fontSize: isSmallScreen ? 11 : 11.5, lineHeight: isSmallScreen ? 16 : 17 }]}>
                  Cada línea de código y cada pantalla fueron diseñados pensando en ti y en tu éxito, sigamos construyendo grandes metas juntos My Natycitaa
                </Text>

                {/* Animated Handwritten Signature (Fully Responsive) */}
                <View style={styles.signatureBox}>
                  <Text style={[styles.signatureCaption, { color: isDark ? '#FDA4AF' : '#9F1239' }]}>
                    Con todo mi amor para ti:
                  </Text>
                  <AnimatedSignature
                    visible={visible}
                    color={isDark ? '#FDA4AF' : '#BE123C'}
                    width={signatureWidth}
                    height={signatureHeight}
                    isDark={isDark}
                  />
                </View>
              </View>

              {/* Interactive Love Tap Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSendMoreLove}
                style={[styles.loveBtn, { backgroundColor: isDark ? '#E11D48' : '#F43F5E' }]}
              >
                <Ionicons name="heart" size={17} color="#FFF" />
                <Text style={styles.loveBtnText}>
                  {loveCount > 0 ? `¡Enviando Amor! (+${loveCount})` : 'Enviar Más Amor'}
                </Text>
              </TouchableOpacity>

              {/* Sweet Footer Close */}
              <TouchableOpacity onPress={onClose} style={styles.footerCloseBtn}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Text style={[styles.footerCloseText, { color: isDark ? '#FDA4AF' : '#9F1239' }]}>
                    Cerrar con Amor
                  </Text>
                  <Ionicons name="heart-outline" size={13} color={isDark ? '#FDA4AF' : '#9F1239'} />
                </View>
              </TouchableOpacity>
            </ScrollView>
          </LinearGradient>
        </Animated.View>

        {/* Rising Love Symbols Layer (From Bottom to Top) */}
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          {hearts.map((h) => (
            <Animated.View
              key={h.id}
              style={{
                position: 'absolute',
                bottom: -20,
                left: h.x,
                transform: [
                  { translateY: h.animY },
                  { scale: h.animScale },
                ],
                opacity: h.animOpacity,
              }}
            >
              <Ionicons name={h.iconName} size={h.size} color={h.color} />
            </Animated.View>
          ))}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialogCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#F43F5E',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 20,
  },
  gradientContainer: {
    width: '100%',
    flexShrink: 1,
  },
  scrollContent: {
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(244, 63, 94, 0.14)',
    zIndex: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  heartPulseGlow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(244, 63, 94, 0.16)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 8,
  },
  sparkle: {
    fontSize: 10,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F43F5E',
    letterSpacing: 1,
  },
  mainTitle: {
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
  },
  messageBox: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  quoteText: {
    fontStyle: 'italic',
    textAlign: 'center',
    fontWeight: '600',
  },
  noteDivider: {
    height: 1,
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
    marginVertical: 10,
  },
  subNote: {
    textAlign: 'center',
    fontWeight: '500',
  },
  signatureBox: {
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(244, 63, 94, 0.15)',
  },
  signatureCaption: {
    fontSize: 11,
    fontStyle: 'italic',
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  loveBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#F43F5E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loveBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  footerCloseBtn: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  footerCloseText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
