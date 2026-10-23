import React, { useRef } from 'react';
import {
  Text,
  StyleSheet,
  View,
  ViewStyle,
  TextStyle,
  Animated,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors, gradients, radii } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'amber' | 'emerald' | 'danger';
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  icon,
  style,
  textStyle,
  disabled,
}) => {
  const colors = useThemeColors();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const getGradientColors = (): readonly [string, string, ...string[]] | null => {
    switch (variant) {
      case 'primary':
        return gradients.brand;
      case 'amber':
        return gradients.amber;
      case 'emerald':
        return gradients.emerald;
      case 'danger':
        return gradients.rose;
      case 'secondary':
      default:
        return null;
    }
  };

  const getTextColor = () => {
    if (variant === 'secondary') {
      return colors.textMain;
    }
    return '#FFFFFF';
  };

  const gradientColors = getGradientColors();

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }], opacity: disabled ? 0.6 : 1 }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={styles.pressable}
      >
        {gradientColors ? (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientContainer}
          >
            {icon && <View style={styles.iconOrb}>{icon}</View>}
            <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
              {title}
            </Text>
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.secondaryContainer,
              {
                backgroundColor: colors.bgSecondary,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            {icon && (
              <View style={[styles.iconOrb, { backgroundColor: colors.bgTertiary }]}>
                {icon}
              </View>
            )}
            <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
              {title}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  pressable: {
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  gradientContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: radii.pill,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  secondaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  iconOrb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
