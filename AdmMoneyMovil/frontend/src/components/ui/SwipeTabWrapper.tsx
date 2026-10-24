import React, { useRef, useEffect } from 'react';
import {
  View,
  PanResponder,
  StyleSheet,
  Animated,
  Dimensions,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';

// Secuencia exacta de las 7 pestañas principales de la app móvil
export const TAB_ROUTES = [
  '/',
  '/expenses',
  '/orders',
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
  const screenWidth = Dimensions.get('window').width;
  const translateX = useRef(new Animated.Value(0)).current;
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    // Reset position when route mounts
    translateX.setValue(0);
    isNavigatingRef.current = false;
  }, [currentRoute]);

  const currentIndex = TAB_ROUTES.indexOf(currentRoute);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        if (!enabled || isNavigatingRef.current) return false;
        // Solo capturar cuando el gesto es claramente horizontal para no interferir con scroll vertical
        const isHorizontal =
          Math.abs(gestureState.dx) > 14 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
        return isHorizontal;
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        if (!enabled || isNavigatingRef.current) return false;
        // Para swipes rápidos horizontales
        return Math.abs(gestureState.dx) > 28 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2.0;
      },
      onPanResponderGrant: () => {
        translateX.stopAnimation();
      },
      onPanResponderMove: (evt, gestureState) => {
        if (!enabled || isNavigatingRef.current) return;

        let dx = gestureState.dx;

        // Resistencia tipo resorte si estamos en los extremos
        if (currentIndex === 0 && dx > 0) {
          dx = dx * 0.22; // No hay pestaña a la izquierda de Resumen
        } else if (currentIndex === TAB_ROUTES.length - 1 && dx < 0) {
          dx = dx * 0.22; // No hay pestaña a la derecha de Ajustes
        }

        // Desplaza la pantalla en tiempo real siguiendo el dedo
        translateX.setValue(dx);
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (!enabled || isNavigatingRef.current) return;

        const threshold = screenWidth * 0.22;
        const isFastSwipe = Math.abs(gestureState.vx) > 0.35;
        const dx = gestureState.dx;

        // Deslizar hacia la izquierda (avanzar a la pestaña siguiente)
        if ((dx < -threshold || (dx < -25 && isFastSwipe)) && currentIndex < TAB_ROUTES.length - 1) {
          isNavigatingRef.current = true;
          const nextRoute = TAB_ROUTES[currentIndex + 1];

          Animated.timing(translateX, {
            toValue: -screenWidth,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            router.push(nextRoute as any);
            // Pequeña espera para reiniciar tras cambiar de ruta
            setTimeout(() => {
              translateX.setValue(0);
              isNavigatingRef.current = false;
            }, 50);
          });
        }
        // Deslizar hacia la derecha (volver a la pestaña anterior)
        else if ((dx > threshold || (dx > 25 && isFastSwipe)) && currentIndex > 0) {
          isNavigatingRef.current = true;
          const prevRoute = TAB_ROUTES[currentIndex - 1];

          Animated.timing(translateX, {
            toValue: screenWidth,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            router.push(prevRoute as any);
            setTimeout(() => {
              translateX.setValue(0);
              isNavigatingRef.current = false;
            }, 50);
          });
        }
        // Si no superó el umbral, regresar elásticamente a su posición original
        else {
          Animated.spring(translateX, {
            toValue: 0,
            friction: 7,
            tension: 70,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, {
          toValue: 0,
          friction: 7,
          tension: 70,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  return (
    <View style={styles.outerContainer} {...panResponder.panHandlers}>
      <Animated.View
        style={[
          styles.flexOne,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  flexOne: {
    flex: 1,
  },
});
