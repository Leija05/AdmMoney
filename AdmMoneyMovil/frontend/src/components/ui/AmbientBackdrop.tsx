import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../../theme';

interface AmbientBackdropProps {
  glowColor?: string;
  variant?: 'brand' | 'amber' | 'emerald';
}

export const AmbientBackdrop: React.FC<AmbientBackdropProps> = ({
  variant = 'brand',
}) => {
  const colors = useThemeColors();
  const isDark = colors.isDark;
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  // Valores animados con useNativeDriver (0% lag, fuera del hilo de JavaScript)
  const moveX1 = useRef(new Animated.Value(0)).current;
  const moveY1 = useRef(new Animated.Value(0)).current;
  const scale1 = useRef(new Animated.Value(1)).current;

  const moveX2 = useRef(new Animated.Value(0)).current;
  const moveY2 = useRef(new Animated.Value(0)).current;
  const scale2 = useRef(new Animated.Value(1)).current;
  const opacity2 = useRef(new Animated.Value(0.75)).current;

  const moveX3 = useRef(new Animated.Value(0)).current;
  const moveY3 = useRef(new Animated.Value(0)).current;
  const scale3 = useRef(new Animated.Value(1)).current;

  // 4 partículas ambientales de deriva lenta (sutiles y etéreas)
  const particle1 = useRef(new Animated.Value(0)).current;
  const particle2 = useRef(new Animated.Value(0)).current;
  const particle3 = useRef(new Animated.Value(0)).current;
  const particle4 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Orbe 1: Respiración y flotación suave (ciclo de ~8.2s)
    const anim1 = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(moveX1, {
            toValue: 35,
            duration: 4200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(moveX1, {
            toValue: -25,
            duration: 4000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(moveY1, {
            toValue: 28,
            duration: 3800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(moveY1, {
            toValue: -20,
            duration: 4400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(scale1, {
            toValue: 1.18,
            duration: 4100,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(scale1, {
            toValue: 0.92,
            duration: 4100,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    // Orbe 2: Pulso y contra-movimiento asimétrico (ciclo de ~10.5s)
    const anim2 = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(moveX2, {
            toValue: -40,
            duration: 5200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(moveX2, {
            toValue: 30,
            duration: 5300,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(moveY2, {
            toValue: -32,
            duration: 4800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(moveY2, {
            toValue: 25,
            duration: 5700,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(scale2, {
            toValue: 1.24,
            duration: 5000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(scale2, {
            toValue: 0.94,
            duration: 5500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacity2, {
            toValue: 0.95,
            duration: 4600,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(opacity2, {
            toValue: 0.55,
            duration: 5900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    // Orbe 3: Deriva central profunda (ciclo de ~13s)
    const anim3 = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(moveX3, {
            toValue: 25,
            duration: 6500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(moveX3, {
            toValue: -20,
            duration: 6500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(moveY3, {
            toValue: -25,
            duration: 6000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(moveY3, {
            toValue: 22,
            duration: 7000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(scale3, {
            toValue: 1.15,
            duration: 6200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(scale3, {
            toValue: 0.90,
            duration: 6800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    // Partículas ultra-ligeras con desfase temporal
    const createParticleLoop = (anim: Animated.Value, duration: number, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );

    const pAnim1 = createParticleLoop(particle1, 9500, 0);
    const pAnim2 = createParticleLoop(particle2, 11500, 2200);
    const pAnim3 = createParticleLoop(particle3, 10500, 4800);
    const pAnim4 = createParticleLoop(particle4, 12500, 1200);

    anim1.start();
    anim2.start();
    anim3.start();
    pAnim1.start();
    pAnim2.start();
    pAnim3.start();
    pAnim4.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
      pAnim1.stop();
      pAnim2.stop();
      pAnim3.stop();
      pAnim4.stop();
    };
  }, []);

  // Paleta de iluminación calibrada por variante
  const palette =
    variant === 'amber'
      ? {
          orb1Main: isDark ? 'rgba(245, 158, 11, 0.22)' : 'rgba(245, 158, 11, 0.12)',
          orb1Edge: isDark ? 'rgba(217, 119, 6, 0.08)' : 'rgba(217, 119, 6, 0.03)',
          orb2Main: isDark ? 'rgba(251, 191, 36, 0.17)' : 'rgba(251, 191, 36, 0.09)',
          orb2Edge: 'transparent',
          orb3Main: isDark ? 'rgba(217, 119, 6, 0.12)' : 'rgba(217, 119, 6, 0.05)',
          particle: isDark ? 'rgba(252, 211, 77, 0.55)' : 'rgba(217, 119, 6, 0.35)',
        }
      : variant === 'emerald'
      ? {
          orb1Main: isDark ? 'rgba(16, 185, 129, 0.22)' : 'rgba(16, 185, 129, 0.12)',
          orb1Edge: isDark ? 'rgba(5, 150, 105, 0.08)' : 'rgba(5, 150, 105, 0.03)',
          orb2Main: isDark ? 'rgba(52, 211, 153, 0.17)' : 'rgba(52, 211, 153, 0.09)',
          orb2Edge: 'transparent',
          orb3Main: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.05)',
          particle: isDark ? 'rgba(110, 231, 183, 0.55)' : 'rgba(5, 150, 105, 0.35)',
        }
      : {
          orb1Main: isDark ? 'rgba(14, 165, 233, 0.24)' : 'rgba(14, 165, 233, 0.13)',
          orb1Edge: isDark ? 'rgba(2, 132, 199, 0.09)' : 'rgba(2, 132, 199, 0.03)',
          orb2Main: isDark ? 'rgba(56, 189, 248, 0.17)' : 'rgba(56, 189, 248, 0.09)',
          orb2Edge: 'transparent',
          orb3Main: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.05)',
          particle: isDark ? 'rgba(125, 211, 252, 0.55)' : 'rgba(2, 132, 199, 0.35)',
        };

  // Interpolación de partículas
  const makeParticleStyle = (anim: Animated.Value, startX: number, startY: number, size: number) => ({
    position: 'absolute' as const,
    left: startX,
    top: startY,
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: palette.particle,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -180],
        }),
      },
      {
        scale: anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.5, 1.2, 0.4],
        }),
      },
    ] as any,
    opacity: anim.interpolate({
      inputRange: [0, 0.15, 0.75, 1],
      outputRange: [0, 0.85, 0.85, 0],
    }),
  });

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Orbe 1: Aurora superior derecha con halo expansivo */}
      <Animated.View
        style={[
          styles.orbContainer,
          {
            top: -70,
            right: -60,
            width: screenWidth * 0.85,
            height: screenWidth * 0.85,
            transform: [
              { translateX: moveX1 },
              { translateY: moveY1 },
              { scale: scale1 },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={[palette.orb1Main, palette.orb1Edge, 'transparent']}
          start={{ x: 0.5, y: 0.4 }}
          end={{ x: 1, y: 1 }}
          style={styles.radialGradientOrb}
        />
      </Animated.View>

      {/* Orbe 2: Resplandor inferior izquierdo pulsante */}
      <Animated.View
        style={[
          styles.orbContainer,
          {
            bottom: 30,
            left: -90,
            width: screenWidth * 0.75,
            height: screenWidth * 0.75,
            opacity: opacity2,
            transform: [
              { translateX: moveX2 },
              { translateY: moveY2 },
              { scale: scale2 },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={[palette.orb2Main, palette.orb2Edge]}
          start={{ x: 0.4, y: 0.6 }}
          end={{ x: 1, y: 0 }}
          style={styles.radialGradientOrb}
        />
      </Animated.View>

      {/* Orbe 3: Deriva de profundidad central suave */}
      <Animated.View
        style={[
          styles.orbContainer,
          {
            top: screenHeight * 0.35,
            right: -screenWidth * 0.25,
            width: screenWidth * 0.7,
            height: screenWidth * 0.7,
            transform: [
              { translateX: moveX3 },
              { translateY: moveY3 },
              { scale: scale3 },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={[palette.orb3Main, 'transparent']}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={styles.radialGradientOrb}
        />
      </Animated.View>

      {/* 4 Puntos de luz ambiental flotantes (Efecto etéreo sin coste de render) */}
      <Animated.View style={makeParticleStyle(particle1, screenWidth * 0.2, screenHeight * 0.45, 6)} />
      <Animated.View style={makeParticleStyle(particle2, screenWidth * 0.75, screenHeight * 0.65, 5)} />
      <Animated.View style={makeParticleStyle(particle3, screenWidth * 0.45, screenHeight * 0.25, 4)} />
      <Animated.View style={makeParticleStyle(particle4, screenWidth * 0.85, screenHeight * 0.35, 5)} />
    </View>
  );
};

const styles = StyleSheet.create({
  orbContainer: {
    position: 'absolute',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  radialGradientOrb: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
  },
});
