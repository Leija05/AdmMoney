import React, { useRef } from 'react';
import { View, PanResponder, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

// Secuencia de pestañas principales de la app móvil
export const TAB_ROUTES = [
  '/',
  '/expenses',
  '/scanner',
  '/cookies',
  '/analytics',
  '/settings',
] as const;

export type TabRoute = typeof TAB_ROUTES[number];

interface SwipeTabWrapperProps {
  children: React.ReactNode;
  currentRoute: TabRoute;
  enabled?: boolean;
}

export const SwipeTabWrapper: React.FC<SwipeTabWrapperProps> = ({
  children,
  currentRoute,
  enabled = true,
}) => {
  const router = useRouter();

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        if (!enabled) return false;
        // Solo activar cuando el gesto es claramente horizontal (al menos 35px y horizontal > vertical * 2.2)
        const isHorizontal = Math.abs(gestureState.dx) > 35 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2.2;
        return isHorizontal;
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (!enabled) return;

        const currentIndex = TAB_ROUTES.indexOf(currentRoute);
        if (currentIndex === -1) return;

        // Deslizar hacia la izquierda (ir a la siguiente pestaña)
        if (gestureState.dx < -65 && Math.abs(gestureState.vx) > 0.22) {
          if (currentIndex < TAB_ROUTES.length - 1) {
            const nextRoute = TAB_ROUTES[currentIndex + 1];
            router.push(nextRoute as any);
          }
        }
        // Deslizar hacia la derecha (ir a la pestaña anterior)
        else if (gestureState.dx > 65 && Math.abs(gestureState.vx) > 0.22) {
          if (currentIndex > 0) {
            const prevRoute = TAB_ROUTES[currentIndex - 1];
            router.push(prevRoute as any);
          }
        }
      },
    })
  ).current;

  return (
    <View style={styles.flexOne} {...panResponder.panHandlers}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
});
