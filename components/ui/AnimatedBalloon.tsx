/**
 * Animated Balloon Component
 *
 * Decorative floating balloon for victory screens and celebrations
 * Features smooth floating animation and color variations
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

interface AnimatedBalloonProps {
  x: number;
  y: number;
  size: number;
  color: string;
  delay?: number;
  floatHeight?: number;
  duration?: number;
}

export const AnimatedBalloon: React.FC<AnimatedBalloonProps> = ({
  x,
  y,
  size,
  color,
  delay = 0,
  floatHeight = 30,
  duration = 3000,
}) => {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry animation
    Animated.sequence([
      Animated.delay(delay),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -floatHeight,
          duration: duration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Gentle rotation
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: duration * 2,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: -1,
          duration: duration * 2,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const rotation = rotateAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-10deg', '10deg'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          left: x - size / 2,
          top: y - size / 2,
          transform: [{ translateY: floatAnim }, { rotate: rotation }, { scale: scaleAnim }],
        },
      ]}
    >
      {/* Balloon body */}
      <View
        style={[
          styles.balloon,
          {
            width: size,
            height: size * 1.2,
            backgroundColor: color,
          },
        ]}
      />

      {/* Balloon highlight */}
      <View
        style={[
          styles.highlight,
          {
            width: size * 0.3,
            height: size * 0.4,
            left: size * 0.2,
            top: size * 0.15,
          },
        ]}
      />

      {/* String */}
      <View
        style={[
          styles.string,
          {
            left: size / 2 - 1,
            top: size * 1.2,
            height: size * 0.8,
          },
        ]}
      />

      {/* Triangle at bottom of balloon */}
      <View
        style={[
          styles.triangle,
          {
            left: size / 2 - 4,
            top: size * 1.15,
            borderLeftWidth: 4,
            borderRightWidth: 4,
            borderTopWidth: 8,
            borderTopColor: color,
          },
        ]}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
  balloon: {
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  highlight: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 999,
  },
  string: {
    position: 'absolute',
    width: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  triangle: {
    position: 'absolute',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
