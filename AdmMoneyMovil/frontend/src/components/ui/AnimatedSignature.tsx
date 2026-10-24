import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing, TouchableOpacity, Text } from 'react-native';
import Svg, { Path, G, Circle } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Calibrated cursive stroke paths for handwritten "Le" + flourish underline
const L_PATH = "M 55 60 C 65 35, 82 15, 96 18 C 108 21, 108 42, 98 62 C 86 86, 70 88, 74 94 C 78 100, 95 94, 125 84";
const L_LENGTH = 195;

const E_PATH = "M 125 84 C 136 78, 148 54, 154 55 C 160 56, 154 72, 142 76 C 130 80, 145 86, 172 82 C 190 79, 206 72, 222 70";
const E_LENGTH = 145;

const FLOURISH_PATH = "M 52 104 C 95 106, 155 108, 195 101 C 215 97, 230 92, 238 90";
const FLOURISH_LENGTH = 190;

interface AnimatedSignatureProps {
  visible: boolean;
  color?: string;
  width?: number;
  height?: number;
}

export const AnimatedSignature: React.FC<AnimatedSignatureProps> = ({
  visible,
  color = '#FDA4AF',
  width = 280,
  height = 125,
}) => {
  // Stroke Dashoffset animators (draws each stroke sequentially from pathLength to 0)
  const lAnim = useRef(new Animated.Value(L_LENGTH)).current;
  const eAnim = useRef(new Animated.Value(E_LENGTH)).current;
  const flourishAnim = useRef(new Animated.Value(FLOURISH_LENGTH)).current;

  // Accents and pen tip
  const sparkleScale = useRef(new Animated.Value(0)).current;
  const penOpacity = useRef(new Animated.Value(0)).current;
  const penX = useRef(new Animated.Value(55)).current;
  const penY = useRef(new Animated.Value(60)).current;

  const [activeStep, setActiveStep] = useState<string>('Listo');

  const runDrawingSequence = () => {
    // Reset all paths to hidden
    lAnim.setValue(L_LENGTH);
    eAnim.setValue(E_LENGTH);
    flourishAnim.setValue(FLOURISH_LENGTH);
    sparkleScale.setValue(0);
    penOpacity.setValue(1);
    penX.setValue(55);
    penY.setValue(60);

    setActiveStep('Trazando "L"...');

    // 1. Draw "L" stroke (0 - 900ms) while moving pen
    Animated.parallel([
      Animated.timing(lAnim, {
        toValue: 0,
        duration: 900,
        easing: Easing.bezier(0.35, 0.1, 0.25, 1),
        useNativeDriver: true,
      }),
      Animated.timing(penX, {
        toValue: 125,
        duration: 900,
        easing: Easing.bezier(0.35, 0.1, 0.25, 1),
        useNativeDriver: false,
      }),
      Animated.timing(penY, {
        toValue: 84,
        duration: 900,
        easing: Easing.bezier(0.35, 0.1, 0.25, 1),
        useNativeDriver: false,
      }),
    ]).start(() => {
      setActiveStep('Trazando "e"...');

      // 2. Draw "e" stroke (900ms - 1700ms)
      Animated.parallel([
        Animated.timing(eAnim, {
          toValue: 0,
          duration: 800,
          easing: Easing.bezier(0.35, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
        Animated.timing(penX, {
          toValue: 222,
          duration: 800,
          easing: Easing.bezier(0.35, 0.1, 0.25, 1),
          useNativeDriver: false,
        }),
        Animated.timing(penY, {
          toValue: 70,
          duration: 800,
          easing: Easing.bezier(0.35, 0.1, 0.25, 1),
          useNativeDriver: false,
        }),
      ]).start(() => {
        setActiveStep('Flourish final...');

        // Pen moves down to flourish start
        penX.setValue(52);
        penY.setValue(104);

        // 3. Draw Flourish Underline (1700ms - 2400ms)
        Animated.parallel([
          Animated.timing(flourishAnim, {
            toValue: 0,
            duration: 700,
            easing: Easing.bezier(0.2, 0.8, 0.3, 1),
            useNativeDriver: true,
          }),
          Animated.timing(penX, {
            toValue: 238,
            duration: 700,
            easing: Easing.bezier(0.2, 0.8, 0.3, 1),
            useNativeDriver: false,
          }),
          Animated.timing(penY, {
            toValue: 90,
            duration: 700,
            easing: Easing.bezier(0.2, 0.8, 0.3, 1),
            useNativeDriver: false,
          }),
        ]).start(() => {
          // 4. Sparkle pop & fade pen
          setActiveStep('Completado ✨');
          Animated.parallel([
            Animated.spring(sparkleScale, {
              toValue: 1,
              friction: 4,
              tension: 80,
              useNativeDriver: true,
            }),
            Animated.timing(penOpacity, {
              toValue: 0,
              duration: 350,
              useNativeDriver: true,
            }),
          ]).start();
        });
      });
    });
  };

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        runDrawingSequence();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      lAnim.setValue(L_LENGTH);
      eAnim.setValue(E_LENGTH);
      flourishAnim.setValue(FLOURISH_LENGTH);
      sparkleScale.setValue(0);
      penOpacity.setValue(0);
    }
  }, [visible]);

  // Scaled coordinates for the floating pen tip
  const scaleRatioX = width / 280;
  const scaleRatioY = height / 125;

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg
        viewBox="30 10 230 110"
        width={width}
        height={height}
        style={styles.svgCanvas}
      >
        <G fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Stroke 1: "L" */}
          <AnimatedPath
            d={L_PATH}
            stroke={color}
            strokeWidth={4.5}
            strokeDasharray={[L_LENGTH, L_LENGTH]}
            strokeDashoffset={lAnim}
          />

          {/* Stroke 2: "e" */}
          <AnimatedPath
            d={E_PATH}
            stroke={color}
            strokeWidth={4}
            strokeDasharray={[E_LENGTH, E_LENGTH]}
            strokeDashoffset={eAnim}
          />

          {/* Stroke 3: Underline Flourish */}
          <AnimatedPath
            d={FLOURISH_PATH}
            stroke={color}
            strokeWidth={3}
            strokeDasharray={[FLOURISH_LENGTH, FLOURISH_LENGTH]}
            strokeDashoffset={flourishAnim}
          />

          {/* Little ink accent dot */}
          <Circle cx="178" cy="85" r="2.2" fill={color} />
        </G>
      </Svg>

      {/* Decorative Golden Sparkles pop after drawing */}
      <Animated.View
        style={[
          styles.sparkleBadge,
          {
            left: 216 * scaleRatioX - 10,
            top: 42 * scaleRatioY - 10,
            transform: [{ scale: sparkleScale }],
          },
        ]}
        pointerEvents="none"
      >
        <Text style={styles.sparklePopIcon}>✨</Text>
      </Animated.View>

      {/* Floating Glowing Pen Tip following the active stroke */}
      <Animated.View
        style={[
          styles.penGlow,
          {
            left: Animated.multiply(penX, scaleRatioX),
            top: Animated.multiply(penY, scaleRatioY),
            opacity: penOpacity,
          },
        ]}
        pointerEvents="none"
      >
        <View style={[styles.penCore, { backgroundColor: color }]} />
        <Text style={styles.sparkleIcon}>✨</Text>
      </Animated.View>

      {/* Status & Replay Button */}
      <View style={styles.bottomControls}>
        <TouchableOpacity
          onPress={runDrawingSequence}
          style={styles.replayButton}
          activeOpacity={0.7}
        >
          <Text style={[styles.replayText, { color }]}>✍️ Repetir trazo en vivo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  svgCanvas: {
    overflow: 'visible',
  },
  penGlow: {
    position: 'absolute',
    width: 22,
    height: 22,
    marginLeft: -11,
    marginTop: -11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  penCore: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.9,
    shadowColor: '#F43F5E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 4,
  },
  sparkleIcon: {
    fontSize: 14,
    marginTop: -12,
    marginLeft: 12,
  },
  bottomControls: {
    position: 'absolute',
    bottom: -6,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  replayButton: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.25)',
  },
  replayText: {
    fontSize: 10,
    fontWeight: '700',
  },
  sparkleBadge: {
    position: 'absolute',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
  },
  sparklePopIcon: {
    fontSize: 18,
  },
});
