import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, radii } from '../../theme';
import { LinearGradient } from 'expo-linear-gradient';

import { RomanticDedicationModal } from './RomanticDedicationModal';

export const RomanticDedicationCard: React.FC = () => {
  const colors = useThemeColors();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const heartScale = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // Latido de corazón romántico rítmico
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(heartScale, {
            toValue: 1.38,
            duration: 170,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 170,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(heartScale, {
            toValue: 1.0,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.6,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(heartScale, {
            toValue: 1.22,
            duration: 160,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.9,
            duration: 160,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(heartScale, {
            toValue: 1.0,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.5,
            duration: 220,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(650),
      ])
    );

    pulse.start();
    return () => pulse.stop();
  }, [heartScale, glowAnim]);

  const handleCardPress = () => {
    setIsModalOpen(true);
  };

  const isDark = colors.isDark;

  return (
    <>
      <TouchableOpacity activeOpacity={0.88} onPress={handleCardPress}>
        <View
          style={[
            styles.container,
            {
              borderColor: isDark ? 'rgba(244, 63, 94, 0.4)' : 'rgba(251, 113, 133, 0.5)',
              backgroundColor: isDark ? '#1F151B' : '#FFF1F2',
            },
          ]}
        >
          <LinearGradient
            colors={
              isDark
                ? ['rgba(244, 63, 94, 0.16)', 'rgba(236, 72, 153, 0.08)', 'rgba(28, 20, 25, 0.95)']
                : ['rgba(255, 241, 242, 0.95)', 'rgba(253, 242, 248, 0.9)', 'rgba(255, 255, 255, 0.95)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            {/* Header Row with Animated Beating Red Heart */}
            <View style={styles.topRow}>
              <View style={styles.badge}>
                <Text style={styles.sparkle}>💜</Text>
                <Text style={styles.badgeText}>Para Mi Natycita</Text>
                <Text style={styles.sparkle}>💜</Text>
              </View>

              <Animated.View
                style={[
                  styles.heartWrapper,
                  {
                    transform: [{ scale: heartScale }],
                    shadowOpacity: glowAnim,
                  },
                ]}
              >
                <Ionicons name="heart" size={26} color="#F43F5E" />
              </Animated.View>
            </View>

            {/* Romantic Message */}
            <View style={styles.quoteBox}>
              <Text style={[styles.quoteMark, { color: isDark ? '#FDA4AF' : '#FB7185' }]}>“</Text>
              <Text style={[styles.dedicationText, { color: isDark ? '#FFE4E6' : '#881337' }]}>
                Aplicacion hecha con amor y mucho cariño para el amor de mi vida, te apoyo en tus emprendimientos, te apoyo en todo lo que tu quieras hacer y siempre sera asi, vamos por mas meses juntos hermosa, Te amo demasiado
              </Text>
              <Text style={[styles.quoteMarkEnd, { color: isDark ? '#FDA4AF' : '#FB7185' }]}>”</Text>
            </View>

            {/* Sweet Footer Signature */}
            <View style={[styles.footerRow, { borderTopColor: isDark ? 'rgba(244, 63, 94, 0.25)' : 'rgba(251, 113, 133, 0.3)' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="infinite" size={16} color="#F43F5E" />
                <Text style={[styles.footerSub, { color: isDark ? '#FDA4AF' : '#9F1239' }]}>
                  Hecho con Amor • Jectorini
                </Text>
              </View>
              <Text style={styles.touchHint}>Toca aquí 💌</Text>
            </View>
          </LinearGradient>
        </View>
      </TouchableOpacity>
      <RomanticDedicationModal visible={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.outer,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginVertical: 14,
    shadowColor: '#F43F5E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  gradient: {
    padding: 18,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(244, 63, 94, 0.18)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.35)',
  },
  sparkle: {
    fontSize: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#F43F5E',
    letterSpacing: 0.8,
  },
  heartWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F43F5E',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 3,
  },
  quoteBox: {
    position: 'relative',
    paddingHorizontal: 8,
    marginVertical: 4,
  },
  quoteMark: {
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 28,
    height: 18,
    opacity: 0.6,
  },
  quoteMarkEnd: {
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 28,
    height: 18,
    textAlign: 'right',
    opacity: 0.6,
  },
  dedicationText: {
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: '600',
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  footerSub: {
    fontSize: 11,
    fontWeight: '700',
  },
  touchHint: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F43F5E',
  },
});
