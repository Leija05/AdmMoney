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
          bottom: Platform.OS === 'ios' ? 18 : 10,
          left: 8,
          right: 8,
          height: Platform.OS === 'ios' ? 70 : 68,
          borderRadius: 28,
          backgroundColor: isDark ? 'rgba(18, 22, 32, 0.96)' : 'rgba(255, 255, 255, 0.97)',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          paddingBottom: Platform.OS === 'ios' ? 8 : 6,
          paddingTop: 6,
          overflow: 'visible',
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.45 : 0.10,
          shadowRadius: 18,
          elevation: 12,
        },
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textDim,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '700',
          letterSpacing: -0.2,
          marginTop: 1,
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
            <View style={[styles.tabIconWrapper, focused && { backgroundColor: isDark ? 'rgba(14, 165, 233, 0.16)' : 'rgba(2, 132, 199, 0.12)' }]}>
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
            <View style={[styles.tabIconWrapper, focused && { backgroundColor: isDark ? 'rgba(14, 165, 233, 0.16)' : 'rgba(2, 132, 199, 0.12)' }]}>
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
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconWrapper, focused && { backgroundColor: isDark ? 'rgba(14, 165, 233, 0.16)' : 'rgba(2, 132, 199, 0.12)' }]}>
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
            <View
              style={[
                styles.centerButtonOuter,
                {
                  backgroundColor: isDark ? '#121620' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
            >
              <LinearGradient
                colors={focused ? ['#38BDF8', '#0284C7'] : ['#0EA5E9', '#0369A1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.centerButtonGradient}
              >
                <Ionicons name="scan" size={22} color="#FFFFFF" />
              </LinearGradient>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="cookies"
        options={{
          title: 'Galletas',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconWrapper, focused && { backgroundColor: isDark ? 'rgba(14, 165, 233, 0.16)' : 'rgba(2, 132, 199, 0.12)' }]}>
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
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconWrapper, focused && { backgroundColor: isDark ? 'rgba(14, 165, 233, 0.16)' : 'rgba(2, 132, 199, 0.12)' }]}>
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
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconWrapper, focused && { backgroundColor: isDark ? 'rgba(14, 165, 233, 0.16)' : 'rgba(2, 132, 199, 0.12)' }]}>
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
    width: 32,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButtonOuter: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginTop: -14,
    padding: 2.5,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  centerButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
