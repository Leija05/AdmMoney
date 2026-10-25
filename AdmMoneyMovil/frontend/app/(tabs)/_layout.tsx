import React, { useRef, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../src/theme';
import { Platform, View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function TabLayout() {
  const colors = useThemeColors();
  const isDark = colors.isDark;

  // Gentle breathing glow animation for the center Scanner button
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 18 : 10,
          left: 10,
          right: 10,
          height: Platform.OS === 'ios' ? 72 : 70,
          borderRadius: 32,
          backgroundColor: isDark ? 'rgba(14, 19, 30, 0.95)' : 'rgba(255, 255, 255, 0.98)',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(15, 23, 42, 0.08)',
          paddingBottom: Platform.OS === 'ios' ? 8 : 6,
          paddingTop: 6,
          overflow: 'visible',
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.55 : 0.08,
          shadowRadius: 18,
          elevation: isDark ? 16 : 6,
        },
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textDim,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '800',
          letterSpacing: -0.2,
          marginTop: 2,
          paddingBottom: Platform.OS === 'android' ? 2 : 0,
        },
        tabBarItemStyle: {
          paddingHorizontal: 0,
          paddingVertical: 1,
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'visible',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Resumen',
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.tabIconWrapper,
                focused && {
                  backgroundColor: isDark ? 'rgba(14, 165, 233, 0.18)' : 'rgba(2, 132, 199, 0.12)',
                  borderColor: isDark ? 'rgba(56, 189, 248, 0.35)' : 'rgba(2, 132, 199, 0.25)',
                },
              ]}
            >
              <Ionicons
                name={focused ? 'grid' : 'grid-outline'}
                size={19}
                color={focused ? colors.brand : colors.textDim}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Gastos',
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.tabIconWrapper,
                focused && {
                  backgroundColor: isDark ? 'rgba(244, 63, 94, 0.16)' : 'rgba(225, 29, 72, 0.10)',
                  borderColor: isDark ? 'rgba(244, 63, 94, 0.35)' : 'rgba(225, 29, 72, 0.25)',
                },
              ]}
            >
              <Ionicons
                name={focused ? 'receipt' : 'receipt-outline'}
                size={19}
                color={focused ? colors.roseLight : colors.textDim}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.tabIconWrapper,
                focused && {
                  backgroundColor: isDark ? 'rgba(245, 158, 11, 0.18)' : 'rgba(217, 119, 6, 0.12)',
                  borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : 'rgba(217, 119, 6, 0.25)',
                },
              ]}
            >
              <Ionicons
                name={focused ? 'bag-handle' : 'bag-handle-outline'}
                size={19}
                color={focused ? colors.amberLight : colors.textDim}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Escanear',
          tabBarIcon: ({ focused }) => (
            <Animated.View
              style={[
                styles.centerButtonOuter,
                {
                  transform: [{ scale: pulseAnim }],
                  backgroundColor: isDark ? '#0A0D15' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(56, 189, 248, 0.45)' : 'rgba(2, 132, 199, 0.35)',
                },
              ]}
            >
              <LinearGradient
                colors={focused ? ['#38BDF8', '#0284C7', '#0369A1'] : ['#0EA5E9', '#0284C7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.centerButtonGradient}
              >
                <Ionicons name="scan" size={23} color="#FFFFFF" />
              </LinearGradient>
            </Animated.View>
          ),
        }}
      />
      <Tabs.Screen
        name="cookies"
        options={{
          title: 'Galletas',
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.tabIconWrapper,
                focused && {
                  backgroundColor: isDark ? 'rgba(245, 158, 11, 0.18)' : 'rgba(217, 119, 6, 0.12)',
                  borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : 'rgba(217, 119, 6, 0.25)',
                },
              ]}
            >
              <Ionicons
                name={focused ? 'cafe' : 'cafe-outline'}
                size={19}
                color={focused ? colors.amberLight : colors.textDim}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Gráficas',
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.tabIconWrapper,
                focused && {
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.16)' : 'rgba(5, 150, 105, 0.10)',
                  borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : 'rgba(5, 150, 105, 0.25)',
                },
              ]}
            >
              <Ionicons
                name={focused ? 'bar-chart' : 'bar-chart-outline'}
                size={19}
                color={focused ? colors.emeraldLight : colors.textDim}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.tabIconWrapper,
                focused && {
                  backgroundColor: isDark ? 'rgba(168, 85, 247, 0.16)' : 'rgba(124, 58, 237, 0.10)',
                  borderColor: isDark ? 'rgba(168, 85, 247, 0.35)' : 'rgba(124, 58, 237, 0.25)',
                },
              ]}
            >
              <Ionicons
                name={focused ? 'settings' : 'settings-outline'}
                size={19}
                color={focused ? colors.purpleLight : colors.textDim}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconWrapper: {
    width: 34,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  centerButtonOuter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginTop: -16,
    padding: 2.5,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 10,
  },
  centerButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
