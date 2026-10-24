import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../src/theme';
import { Platform, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function TabLayout() {
  const colors = useThemeColors();
  const isDark = colors.isDark;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 20 : 12,
          left: 14,
          right: 14,
          height: 64,
          borderRadius: 24,
          backgroundColor: isDark ? 'rgba(28, 32, 43, 0.94)' : 'rgba(255, 255, 255, 0.96)',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.07)',
          paddingBottom: 6,
          paddingTop: 6,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.40 : 0.12,
          shadowRadius: 16,
          elevation: 10,
        },
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textDim,
        tabBarLabelStyle: {
          fontSize: 9.5,
          fontWeight: '700',
          letterSpacing: -0.2,
          marginTop: -2,
        },
        tabBarItemStyle: {
          paddingHorizontal: 0,
          justifyContent: 'center',
          alignItems: 'center',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Resumen',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconWrapper, focused && { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.12)' }]}>
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
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconWrapper, focused && { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.12)' }]}>
              <Ionicons
                name={focused ? 'receipt' : 'receipt-outline'}
                size={19}
                color={focused ? colors.brand : colors.textDim}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconWrapper, focused && { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.12)' }]}>
              <Ionicons
                name={focused ? 'bag-handle' : 'bag-handle-outline'}
                size={19}
                color={focused ? colors.brand : colors.textDim}
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
            <View style={styles.centerButtonOuter}>
              <LinearGradient
                colors={focused ? ['#38BDF8', '#0284C7'] : ['#0284C7', '#0369A1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.centerButtonGradient}
              >
                <Ionicons name="scan" size={24} color="#FFFFFF" />
              </LinearGradient>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="cookies"
        options={{
          title: 'Galletas',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconWrapper, focused && { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.12)' }]}>
              <Ionicons
                name={focused ? 'cafe' : 'cafe-outline'}
                size={19}
                color={focused ? colors.brand : colors.textDim}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Gráficas',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconWrapper, focused && { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.12)' }]}>
              <Ionicons
                name={focused ? 'bar-chart' : 'bar-chart-outline'}
                size={19}
                color={focused ? colors.brand : colors.textDim}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconWrapper, focused && { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.12)' }]}>
              <Ionicons
                name={focused ? 'settings' : 'settings-outline'}
                size={19}
                color={focused ? colors.brand : colors.textDim}
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
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  centerButtonOuter: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginTop: -20,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  centerButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
});
