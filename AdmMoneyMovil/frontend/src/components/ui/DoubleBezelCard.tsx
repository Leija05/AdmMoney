import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii } from '../../theme';

interface DoubleBezelCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  innerStyle?: ViewStyle;
}

export const DoubleBezelCard: React.FC<DoubleBezelCardProps> = ({
  children,
  style,
  innerStyle
}) => {
  return (
    <View style={[styles.outerShell, style]}>
      <View style={[styles.innerCore, innerStyle]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerShell: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.borderSubtle,
    borderWidth: 1,
    borderRadius: radii.outer,
    shadowColor: '#181A1F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  innerCore: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.inner,
    padding: 16,
  },
});
