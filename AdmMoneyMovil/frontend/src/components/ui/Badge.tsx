import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii } from '../../theme';

interface BadgeProps {
  label: string;
  variant?: 'brand' | 'emerald' | 'amber' | 'purple' | 'cyan' | 'rose' | 'gray';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'brand',
  style
}) => {
  const getColors = () => {
    switch (variant) {
      case 'brand':
        return { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' };
      case 'emerald':
        return { bg: '#DCFCE7', text: '#15803D', border: '#BBF7D0' };
      case 'amber':
        return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' };
      case 'rose':
        return { bg: '#FFE4E6', text: '#BE123C', border: '#FECDD3' };
      case 'purple':
        return { bg: '#EDE9FE', text: '#6D28D9', border: '#DDD6FE' };
      case 'cyan':
        return { bg: '#CFFAFE', text: '#0E7490', border: '#A5F3FC' };
      case 'gray':
      default:
        return { bg: '#F3F4F6', text: '#4B5563', border: '#E5E7EB' };
    }
  };

  const c = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: c.bg, borderColor: c.border }, style]}>
      <Text style={[styles.text, { color: c.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});
