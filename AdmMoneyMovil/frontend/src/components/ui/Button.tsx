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
  const isDark = colors.isDark;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      friction: 8,
      tension: 140,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 140,
    }).start();
  };

  const getGradientColors = (): readonly [string, string, ...string[]] | null => {
    switch (variant) {
      case 'primary':
        return gradients.skyGlow;
      case 'amber':
        return gradients.amberGlow;
      case 'emerald':
        return gradients.emeraldGlow;
      case 'danger':
        return gradients.roseGlow;
      case 'secondary':
      default:
        return null;
    }
  };

  const getShadowColor = () => {
    switch (variant) {
      case 'amber':
        return '#F59E0B';
      case 'emerald':
        return '#10B981';
      case 'danger':
        return '#F43F5E';
      case 'primary':
        return '#0EA5E9';
      default:
        return '#000000';
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
            style={[
              styles.gradientContainer,
              {
                shadowColor: getShadowColor(),
                borderTopColor: 'rgba(255, 255, 255, 0.35)',
              },
            ]}
          >
            {icon && (
              <View style={styles.iconOrb}>
                {icon}
              </View>
            )}
            <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
              {title}
            </Text>
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.secondaryContainer,
              {
                backgroundColor: isDark ? '#141A28' : colors.bgSecondary,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            {icon && (
              <View style={[styles.iconOrb, { backgroundColor: isDark ? '#1F293D' : colors.bgTertiary }]}>
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
    borderTopWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
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
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  text: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
