import React, { useRef } from 'react';
import { View, StyleSheet, ViewStyle, Animated, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors, radii } from '../../theme';

interface DoubleBezelCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  innerStyle?: ViewStyle;
  gradient?: readonly [string, string, ...string[]] | string[];
  onPress?: () => void;
}

export const DoubleBezelCard: React.FC<DoubleBezelCardProps> = ({
  children,
  style,
  innerStyle,
  gradient,
  onPress,
}) => {
  const colors = useThemeColors();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      friction: 8,
      tension: 120,
    }).start();
  };

  const handlePressOut = () => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 120,
    }).start();
  };

  const hasFlex = (style as any)?.flex !== undefined;

  const content = gradient ? (
    <LinearGradient
      colors={gradient as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.innerCore, { backgroundColor: 'transparent' }, hasFlex && { flex: 1 }, innerStyle]}
    >
      {children}
    </LinearGradient>
  ) : (
    <View style={[styles.innerCore, { backgroundColor: colors.bgCard }, hasFlex && { flex: 1 }, innerStyle]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[
            styles.outerShell,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          {content}
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <View
      style={[
        styles.outerShell,
        {
          backgroundColor: colors.bgCard,
          borderColor: colors.borderSubtle,
        },
        style,
      ]}
    >
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  outerShell: {
    borderWidth: 1,
    borderRadius: radii.outer,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
  },
  innerCore: {
    borderRadius: radii.inner,
    padding: 16,
  },
});
