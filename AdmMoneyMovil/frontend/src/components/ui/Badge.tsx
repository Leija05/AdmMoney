import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useThemeColors, radii } from '../../theme';

interface BadgeProps {
  label: string;
  variant?: 'brand' | 'emerald' | 'amber' | 'purple' | 'cyan' | 'rose' | 'gray';
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'brand',
  style,
  icon,
}) => {
  const colors = useThemeColors();

  const getBadgeStyle = () => {
    switch (variant) {
      case 'emerald':
        return {
          bg: colors.emeraldBg,
          text: colors.emeraldText,
          border: colors.emeraldBorder,
        };
      case 'amber':
        return {
          bg: colors.amberBg,
          text: colors.amberText,
          border: colors.amberBorder,
        };
      case 'rose':
        return {
          bg: colors.roseBg,
          text: colors.roseText,
          border: colors.roseBorder,
        };
      case 'purple':
        return {
          bg: colors.purpleBg,
          text: colors.purpleText,
          border: colors.purpleBorder,
        };
      case 'cyan':
        return {
          bg: colors.cyanBg,
          text: colors.brandText,
          border: colors.brandBorder,
        };
      case 'gray':
        return {
          bg: colors.bgTertiary,
          text: colors.textMuted,
          border: colors.borderSubtle,
        };
      case 'brand':
      default:
        return {
          bg: colors.brandBg,
          text: colors.brandText,
          border: colors.brandBorder,
        };
    }
  };

  const badgeTheme = getBadgeStyle();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: badgeTheme.bg,
          borderColor: badgeTheme.border,
        },
        style,
      ]}
    >
      {icon && <View style={styles.iconBox}>{icon}</View>}
      <Text style={[styles.text, { color: badgeTheme.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3.5,
    paddingHorizontal: 9,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  iconBox: {
    marginRight: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.15,
  },
});
