import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ViewStyle,
  TextStyle
} from 'react-native';
import { colors, radii } from '../../theme';

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
  disabled
}) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary':
        return '#181A1F';
      case 'amber':
        return '#FEF3C7';
      case 'emerald':
        return '#DCFCE7';
      case 'danger':
        return '#FFE4E6';
      case 'secondary':
      default:
        return '#FFFFFF';
    }
  };

  const getBorderColor = () => {
    switch (variant) {
      case 'primary':
        return '#181A1F';
      case 'amber':
        return '#FDE68A';
      case 'emerald':
        return '#BBF7D0';
      case 'danger':
        return '#FECDD3';
      case 'secondary':
      default:
        return '#E5E7EB';
    }
  };

  const getTextColor = () => {
    if (variant === 'primary') return '#FFFFFF';
    if (variant === 'amber') return '#92400E';
    if (variant === 'emerald') return '#15803D';
    if (variant === 'danger') return '#BE123C';
    return '#181A1F';
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    borderWidth: 1,
  },
  iconContainer: {
    marginRight: 6,
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
});
