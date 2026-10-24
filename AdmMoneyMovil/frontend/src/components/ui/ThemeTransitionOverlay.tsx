import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Animated, Easing } from 'react-native';
import { useAppStore } from '../../stores/app.store';

export const ThemeTransitionOverlay: React.FC = () => {
  const theme = useAppStore((state) => state.theme);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const prevThemeRef = useRef(theme);
  const isInitialMount = useRef(true);
  const [transitionBg, setTransitionBg] = useState<string | null>(null);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (prevThemeRef.current !== theme) {
      // Tomamos el color del tema PREVIO para disolverlo suavemente sobre el nuevo tema
      const prevColor = prevThemeRef.current === 'dark' ? '#0B0F19' : '#FFFFFF';
      prevThemeRef.current = theme;

      setTransitionBg(prevColor);
      fadeAnim.setValue(1);

      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setTransitionBg(null);
      });
    }
  }, [theme, fadeAnim]);

  if (!transitionBg) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFillObject,
        {
          backgroundColor: transitionBg,
          opacity: fadeAnim,
          zIndex: 999999,
        },
      ]}
    />
  );
};
