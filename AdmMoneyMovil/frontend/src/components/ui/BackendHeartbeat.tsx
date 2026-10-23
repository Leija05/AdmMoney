import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../stores/app.store';
import { APP_CONFIG } from '../../config/appConfig';
import { useThemeColors, radii } from '../../theme';

interface BackendHeartbeatProps {
  customMessage?: string;
  onPress?: () => void;
  compact?: boolean;
}

export const BackendHeartbeat: React.FC<BackendHeartbeatProps> = ({
  customMessage,
  onPress,
  compact = false,
}) => {
  const colors = useThemeColors();
  const { isOnline, checkConnection } = useAppStore();
  const heartScale = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Latido de corazón rítmico (lub-dub... lub-dub...)
    const heartbeat = Animated.loop(
      Animated.sequence([
        // Primer latido
        Animated.parallel([
          Animated.timing(heartScale, {
            toValue: 1.35,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(heartScale, {
            toValue: 1.0,
            duration: 160,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.5,
            duration: 160,
            useNativeDriver: true,
          }),
        ]),
        // Segundo latido
        Animated.parallel([
          Animated.timing(heartScale, {
            toValue: 1.25,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.9,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(heartScale, {
            toValue: 1.0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.4,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        // Pausa diastólica en reposo
        Animated.delay(800),
      ])
    );

    heartbeat.start();
    return () => heartbeat.stop();
  }, [heartScale, glowAnim]);

  // Mensaje a mostrar: prop personalizado o el configurado en APP_CONFIG
  const displayText = customMessage
    ? customMessage
    : isOnline
    ? APP_CONFIG.BACKEND_STATUS_MESSAGE_ONLINE
    : APP_CONFIG.BACKEND_STATUS_MESSAGE_OFFLINE;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      checkConnection();
    }
  };

  const heartColor = isOnline ? colors.emeraldLight : colors.roseLight;
  const pillBg = isOnline
    ? colors.isDark
      ? 'rgba(34, 197, 94, 0.12)'
      : 'rgba(220, 252, 231, 0.85)'
    : colors.isDark
    ? 'rgba(244, 63, 94, 0.12)'
    : 'rgba(254, 226, 226, 0.85)';
  const pillBorder = isOnline
    ? colors.isDark
      ? 'rgba(74, 222, 128, 0.35)'
      : 'rgba(187, 247, 208, 1)'
    : colors.isDark
    ? 'rgba(251, 113, 133, 0.35)'
    : 'rgba(254, 205, 211, 1)';
  const textColor = isOnline ? (colors.isDark ? '#6EE7B7' : '#15803D') : (colors.isDark ? '#FDA4AF' : '#BE123C');

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={handlePress}
      style={[
        styles.container,
        {
          backgroundColor: pillBg,
          borderColor: pillBorder,
          paddingHorizontal: compact ? 8 : 10,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.heartWrapper,
          {
            transform: [{ scale: heartScale }],
            shadowColor: heartColor,
            shadowOpacity: isOnline ? 0.6 : 0.3,
          },
        ]}
      >
        <Ionicons name="heart" size={13} color={heartColor} />
      </Animated.View>

      <Text style={[styles.statusText, { color: textColor }]}>
        {displayText}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  heartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 5,
    elevation: 2,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
