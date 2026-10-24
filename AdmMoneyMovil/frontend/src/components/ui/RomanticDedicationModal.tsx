import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors, radii } from '../../theme';
import { AnimatedSignature } from './AnimatedSignature';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface FloatingHeart {
  id: number;
  x: number;
  animY: Animated.Value;
  animScale: Animated.Value;
  animOpacity: Animated.Value;
  symbol: string;
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
    const symbols = ['💖', '💕', '❤️', '✨', '🌹', '🥰', '💌', '🌸'];
    const newHearts: FloatingHeart[] = [];

    for (let i = 0; i < count; i++) {
      const animY = new Animated.Value(0);
      const animScale = new Animated.Value(0.3);
      const animOpacity = new Animated.Value(0);

      const h: FloatingHeart = {
        id: Date.now() + Math.random(),
        x: Math.random() * (screenWidth - 70) + 15,
        animY,
        animScale,
        animOpacity,
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
        size: 22 + Math.random() * 18,
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
        <Animated.View style={[styles.dialogCard, { transform: [{ scale: cardScale }] }]}>
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
            {/* Close button */}
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={isDark ? '#FDA4AF' : '#881337'} />
            </TouchableOpacity>

            {/* Beating Heart Avatar */}
            <View style={styles.avatarContainer}>
              <Animated.View
                style={[
                  styles.heartPulseGlow,
                  {
                    transform: [{ scale: heartPulse }],
                    backgroundColor: isDark ? 'rgba(244, 63, 94, 0.22)' : 'rgba(244, 63, 94, 0.15)',
                  },
                ]}
              >
                <Ionicons name="heart" size={44} color="#F43F5E" />
              </Animated.View>
            </View>

            {/* Dedication Header */}
            <View style={styles.pillBadge}>
              <Text style={styles.sparkle}>✨</Text>
              <Text style={styles.pillText}>DEDICATORIA DE AMOR</Text>
              <Text style={styles.sparkle}>✨</Text>
            </View>

            <Text style={[styles.mainTitle, { color: isDark ? '#FFF1F2' : '#881337' }]}>
              Para el Amor de Mi Vida 💖
            </Text>

            {/* Heartfelt Letter Box */}
            <View
              style={[
                styles.messageBox,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.85)',
                  borderColor: isDark ? 'rgba(244, 63, 94, 0.3)' : 'rgba(251, 113, 133, 0.35)',
                },
              ]}
            >
              <Text style={[styles.quoteText, { color: isDark ? '#FFE4E6' : '#4C0519' }]}>
                “Aplicación hecha con amor y mucho cariño para el amor de mi vida, te apoyo en tus emprendimientos, te apoyo en todo lo que tú quieras hacer y siempre será así, Te amo demasiado”
              </Text>

              <View style={styles.noteDivider} />

              <Text style={[styles.subNote, { color: isDark ? '#FDA4AF' : '#9F1239' }]}>
                Cada línea de código y cada pantalla fueron diseñados pensando en ti y en tu éxito, sigamos construyendo grandes metas juntos My Natycitaa
              </Text>

              {/* Animated Handwritten Signature */}
              <View style={styles.signatureBox}>
                <Text style={[styles.signatureCaption, { color: isDark ? '#FDA4AF' : '#9F1239' }]}>
                  Con todo mi amor para ti:
                </Text>
                <AnimatedSignature
                  visible={visible}
                  color={isDark ? '#FDA4AF' : '#BE123C'}
                  width={270}
                  height={125}
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
              <Ionicons name="sparkles" size={17} color="#FFF" />
              <Text style={styles.loveBtnText}>
                {loveCount > 0 ? `¡Enviando Amor! (+${loveCount} 💕)` : 'Enviar Más Amor 💕'}
              </Text>
            </TouchableOpacity>

            {/* Sweet Footer Close */}
            <TouchableOpacity onPress={onClose} style={styles.footerCloseBtn}>
              <Text style={[styles.footerCloseText, { color: isDark ? '#FDA4AF' : '#9F1239' }]}>
                Cerrar con Amor 💌
              </Text>
            </TouchableOpacity>
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
              <Text style={{ fontSize: h.size }}>{h.symbol}</Text>
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
    padding: 20,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#F43F5E',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 20,
  },
  gradientContainer: {
    padding: 24,
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    zIndex: 10,
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 14,
    height: 90,
  },
  heartPulseGlow: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingLayer: {
    position: 'absolute',
    bottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 100,
  },
  floatingHeartItem: {
    position: 'absolute',
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
    fontSize: 19,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 14,
  },
  messageBox: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 18,
  },
  quoteText: {
    fontSize: 13.5,
    lineHeight: 21,
    fontStyle: 'italic',
    textAlign: 'center',
    fontWeight: '600',
  },
  noteDivider: {
    height: 1,
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
    marginVertical: 12,
  },
  subNote: {
    fontSize: 11.5,
    lineHeight: 17,
    textAlign: 'center',
    fontWeight: '500',
  },
  signatureBox: {
    alignItems: 'center',
    marginTop: 12,
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
    paddingVertical: 13,
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
    marginTop: 14,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  footerCloseText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
