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

interface FloatingHeart {
  id: number;
  x: number;
  animY: Animated.Value;
  animScale: Animated.Value;
  animOpacity: Animated.Value;
  icon: 'heart' | 'heart-sharp' | 'sparkles' | 'rose';
  color: string;
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

      // Trigger initial shower of hearts
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

  const spawnHearts = (count: number = 3) => {
    const newHearts: FloatingHeart[] = [];
    const colorsList = ['#F43F5E', '#EC4899', '#FB7185', '#FDA4AF', '#E11D48', '#FF6B8B'];

    for (let i = 0; i < count; i++) {
      const animY = new Animated.Value(0);
      const animScale = new Animated.Value(0.4);
      const animOpacity = new Animated.Value(1);

      const h: FloatingHeart = {
        id: Date.now() + Math.random(),
        x: Math.random() * 260 - 130,
        animY,
        animScale,
        animOpacity,
        icon: Math.random() > 0.3 ? 'heart' : 'sparkles',
        color: colorsList[Math.floor(Math.random() * colorsList.length)],
      };

      newHearts.push(h);

      Animated.parallel([
        Animated.timing(animY, {
          toValue: -(160 + Math.random() * 120),
          duration: 1600 + Math.random() * 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(animScale, {
          toValue: 1 + Math.random() * 0.8,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animOpacity, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]).start();
    }

    setHearts((prev) => [...prev.slice(-20), ...newHearts]);
  };

  const handleSendMoreLove = () => {
    setLoveCount((c) => c + 1);
    spawnHearts(7);
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

              {/* Floating Hearts Animation Layer */}
              <View style={styles.floatingLayer} pointerEvents="none">
                {hearts.map((h) => (
                  <Animated.View
                    key={h.id}
                    style={[
                      styles.floatingHeartItem,
                      {
                        transform: [
                          { translateX: h.x },
                          { translateY: h.animY },
                          { scale: h.animScale },
                        ],
                        opacity: h.animOpacity,
                      },
                    ]}
                  >
                    <Ionicons name={h.icon} size={22} color={h.color} />
                  </Animated.View>
                ))}
              </View>
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
                “Aplicación hecha con amor y mucho cariño para el amor de mi vida, te apoyo en tus emprendimientos, te apoyo en todo lo que tú quieras hacer y siempre será así. ¡Te amo demasiado!”
              </Text>

              <View style={styles.noteDivider} />

              <Text style={[styles.subNote, { color: isDark ? '#FDA4AF' : '#9F1239' }]}>
                Cada línea de código, cada cálculo y cada pantalla fueron diseñados pensando en ti y en tu éxito. ¡Sigamos construyendo grandes metas juntos! ♾️
              </Text>
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
