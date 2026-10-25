import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ViewStyle, Animated, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors, radii } from '../../theme';

interface DoubleBezelCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  innerStyle?: ViewStyle | ViewStyle[];
  gradient?: readonly [string, string, ...string[]] | string[];
  onPress?: () => void;
  animateEntrance?: boolean;
  delay?: number;
}

export const DoubleBezelCard: React.FC<DoubleBezelCardProps> = ({
  children,
  style,
  innerStyle,
  gradient,
  onPress,
  animateEntrance = false,
  delay = 0,
}) => {
  const colors = useThemeColors();
  const isDark = colors.isDark;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const entranceOpacity = useRef(new Animated.Value(animateEntrance ? 0 : 1)).current;
  const entranceY = useRef(new Animated.Value(animateEntrance ? 14 : 0)).current;

  useEffect(() => {
    if (animateEntrance) {
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(entranceOpacity, {
            toValue: 1,
            duration: 320,
            useNativeDriver: true,
          }),
          Animated.spring(entranceY, {
            toValue: 0,
            friction: 8,
            tension: 75,
            useNativeDriver: true,
          }),
        ]).start();
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [animateEntrance, delay]);

  const handlePressIn = () => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 0.975,
      useNativeDriver: true,
      friction: 8,
      tension: 140,
    }).start();
  };

  const handlePressOut = () => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 140,
    }).start();
  };

  const hasFlex = (style as any)?.flex !== undefined;

  const content = gradient ? (
    <LinearGradient
      colors={gradient as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.innerCore,
        {
          borderRadius: radii.outer,
          backgroundColor: 'transparent',
          borderTopColor: 'rgba(255, 255, 255, 0.28)',
        },
        hasFlex && { flex: 1 },
        innerStyle,
      ]}
    >
      {children}
    </LinearGradient>
  ) : (
    <View
      style={[
        styles.innerCore,
        {
          backgroundColor: isDark ? '#111724' : '#FFFFFF',
          borderTopColor: colors.glassHighlight,
        },
        hasFlex && { flex: 1 },
        innerStyle,
      ]}
    >
      {children}
    </View>
  );

  const isGradient = Boolean(gradient);
  const containerStyle = [
    styles.outerShell,
    {
      backgroundColor: isGradient
        ? 'transparent'
        : isDark
        ? 'rgba(255, 255, 255, 0.035)'
        : '#FFFFFF',
      borderColor: isGradient
        ? (isDark ? colors.borderSubtle : 'transparent')
        : (isDark ? colors.borderSubtle : 'rgba(15, 23, 42, 0.08)'),
      padding: isGradient ? 0 : 2,
      shadowColor: isGradient && !isDark ? (gradient as any)[0] || '#0284C7' : '#0F172A',
      shadowOffset: { width: 0, height: isGradient ? 6 : 4 },
      shadowOpacity: isDark ? 0.40 : isGradient ? 0.28 : 0.06,
      shadowRadius: 18,
      elevation: isDark ? 4 : isGradient ? 6 : 2,
    },
    style,
  ];

  if (onPress) {
    return (
      <Animated.View
        style={[
          {
            opacity: entranceOpacity,
            transform: [{ translateY: entranceY }, { scale: scaleAnim }],
          },
        ]}
      >
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={containerStyle}
        >
          {content}
        </Pressable>
      </Animated.View>
    );
  }

  if (animateEntrance) {
    return (
      <Animated.View
        style={[
          {
            opacity: entranceOpacity,
            transform: [{ translateY: entranceY }],
          },
        ]}
      >
        <View style={containerStyle}>
          {content}
        </View>
      </Animated.View>
    );
  }

  return (
    <View style={containerStyle}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  outerShell: {
    borderWidth: 1,
    borderRadius: radii.outer,
    padding: 2.5,
    overflow: 'hidden',
  },
  innerCore: {
    borderRadius: radii.inner,
    padding: 14,
    overflow: 'hidden',
    borderTopWidth: 1,
  },
});
