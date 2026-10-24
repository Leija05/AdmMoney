import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface FadeSlideInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: ViewStyle | ViewStyle[];
  distance?: number;
}

export const FadeSlideIn: React.FC<FadeSlideInProps> = ({
  children,
  delay = 0,
  duration = 320,
  style,
  distance = 16,
}) => {
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          friction: 8,
          tension: 70,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: opacityAnim,
          transform: [{ translateY: translateYAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};
