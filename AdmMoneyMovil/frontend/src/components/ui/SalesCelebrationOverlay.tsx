import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useCelebrationStore } from '../../stores/celebration.store';
import { useThemeColors, radii } from '../../theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_COLORS = ['#F59E0B', '#FBBF24', '#10B981', '#38BDF8', '#EC4899', '#A855F7'];
const FLOATING_ICONS: (keyof typeof Ionicons.glyphMap)[] = ['sparkles', 'nutrition', 'cash', 'trophy', 'star', 'diamond'];

interface Particle {
  id: number;
  startX: number;
  color: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  xAnim: Animated.Value;
  yAnim: Animated.Value;
  rotAnim: Animated.Value;
  scaleAnim: Animated.Value;
  opacityAnim: Animated.Value;
}

export const SalesCelebrationOverlay: React.FC = () => {
  const { isOpen, payload, closeCelebration } = useCelebrationStore();
  const colors = useThemeColors();
  const isDark = colors.isDark;

  // Banner animations
  const bannerScale = useRef(new Animated.Value(0.4)).current;
  const bannerOpacity = useRef(new Animated.Value(0)).current;
  const bannerTranslateY = useRef(new Animated.Value(-60)).current;

  // Confetti particles
  const particles = useRef<Particle[]>(
    Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      startX: Math.random() * (SCREEN_WIDTH - 40) + 20,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      iconName: i % 4 === 0 ? FLOATING_ICONS[i % FLOATING_ICONS.length] : undefined,
      xAnim: new Animated.Value(0),
      yAnim: new Animated.Value(0),
      rotAnim: new Animated.Value(0),
      scaleAnim: new Animated.Value(0),
      opacityAnim: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    if (isOpen) {
      // 1. Reset values
      bannerScale.setValue(0.7);
      bannerOpacity.setValue(0);
      bannerTranslateY.setValue(-40);

      // 2. Banner pop-in animation
      Animated.parallel([
        Animated.spring(bannerScale, {
          toValue: 1,
          friction: 6,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(bannerOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(bannerTranslateY, {
          toValue: 0,
          friction: 7,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();

      // 3. Trigger confetti explosion
      particles.forEach((p) => {
        p.xAnim.setValue(0);
        p.yAnim.setValue(0);
        p.rotAnim.setValue(0);
        p.scaleAnim.setValue(0.3);
        p.opacityAnim.setValue(1);

        const targetX = (Math.random() - 0.5) * 160;
        const targetY = SCREEN_HEIGHT * 0.45 + Math.random() * 150;
        const targetRot = (Math.random() - 0.5) * 720;
        const targetScale = Math.random() * 0.6 + 0.6;
        const duration = 1400 + Math.random() * 500;

        Animated.parallel([
          Animated.timing(p.xAnim, {
            toValue: targetX,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(p.yAnim, {
            toValue: targetY,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(p.rotAnim, {
            toValue: targetRot,
            duration,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(p.scaleAnim, {
              toValue: targetScale,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(p.opacityAnim, {
              toValue: 0,
              duration: duration - 200,
              delay: 300,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      });

      // 4. Auto dismiss after 2 seconds
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(bannerOpacity, {
            toValue: 0,
            duration: 260,
            useNativeDriver: true,
          }),
          Animated.timing(bannerTranslateY, {
            toValue: -30,
            duration: 260,
            useNativeDriver: true,
          }),
        ]).start(() => {
          closeCelebration();
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <View style={styles.overlayContainer} pointerEvents="none">
      {/* Floating particles */}
      {particles.map((p) => {
        const spin = p.rotAnim.interpolate({
          inputRange: [-720, 720],
          outputRange: ['-720deg', '720deg'],
        });

        return (
          <Animated.View
            key={p.id}
            style={[
              styles.particle,
              {
                left: p.startX,
                top: 70,
                opacity: p.opacityAnim,
                transform: [
                  { translateX: p.xAnim },
                  { translateY: p.yAnim },
                  { rotate: spin },
                  { scale: p.scaleAnim },
                ],
              },
            ]}
          >
            {p.iconName ? (
              <Ionicons name={p.iconName} size={18} color={p.color} />
            ) : (
              <View
                style={[
                  styles.confettiPill,
                  { backgroundColor: p.color, transform: [{ rotate: `${(p.id * 35) % 90}deg` }] },
                ]}
              />
            )}
          </Animated.View>
        );
      })}

      {/* Floating Apple-Style Pill Banner */}
      <Animated.View
        style={[
          styles.bannerWrapper,
          {
            opacity: bannerOpacity,
            transform: [{ scale: bannerScale }, { translateY: bannerTranslateY }],
          },
        ]}
      >
        <LinearGradient
          colors={
            isDark
              ? ['#1E293B', '#0F172A']
              : ['#FFFFFF', '#FEF3C7']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.bannerGradient,
            {
              borderColor: isDark ? '#F59E0B' : '#FDE68A',
              shadowColor: '#F59E0B',
            },
          ]}
        >
          <View style={styles.bannerIconBadge}>
            <Ionicons name="sparkles" size={18} color="#F59E0B" />
          </View>

          <View style={{ flex: 1, paddingRight: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.bannerTitle, { color: isDark ? '#FFFFFF' : '#0B132B' }]}>
                {payload?.title || '¡Venta Registrada!'}
              </Text>
              {typeof payload?.amount === 'number' && (
                <View style={styles.amountPill}>
                  <Text style={styles.amountPillText}>
                    +${payload.amount.toFixed(2)}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.bannerSub, { color: isDark ? '#94A3B8' : '#64748B' }]} numberOfLines={1}>
              {payload?.subtitle || 'Ingreso sumado a tu Bóveda'}
            </Text>
          </View>

          <Ionicons name="checkmark-circle" size={18} color="#10B981" />
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    alignItems: 'center',
  },
  bannerWrapper: {
    marginTop: Platform.OS === 'ios' ? 52 : 36,
    paddingHorizontal: 16,
    width: '100%',
    maxWidth: 420,
  },
  bannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radii.outer,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
    gap: 12,
  },
  bannerIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(245, 158, 11, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  bannerSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  amountPill: {
    backgroundColor: '#10B981',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: radii.pill,
  },
  amountPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  particle: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confettiPill: {
    width: 10,
    height: 6,
    borderRadius: 3,
  },
});
