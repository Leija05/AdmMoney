import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
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
  const screenWidth = Dimensions.get('window').width;

  const orbColor =
    variant === 'amber'
      ? (isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.06)')
      : variant === 'emerald'
      ? (isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.05)')
      : (isDark ? 'rgba(14, 165, 233, 0.14)' : 'rgba(2, 132, 199, 0.05)');

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Top right ambient bloom */}
      <View
        style={[
          styles.orbContainer,
          {
            top: -60,
            right: -60,
            width: screenWidth * 0.75,
            height: screenWidth * 0.75,
          },
        ]}
      >
        <LinearGradient
          colors={[orbColor, 'transparent']}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={styles.radialGradientOrb}
        />
      </View>

      {/* Subtle bottom-left warm undertone */}
      <View
        style={[
          styles.orbContainer,
          {
            bottom: 40,
            left: -80,
            width: screenWidth * 0.6,
            height: screenWidth * 0.6,
          },
        ]}
      >
        <LinearGradient
          colors={[isDark ? 'rgba(245, 158, 11, 0.05)' : 'rgba(245, 158, 11, 0.03)', 'transparent']}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={styles.radialGradientOrb}
        />
      </View>
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
