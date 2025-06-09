import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface ProjectileProps {
  x: number;
  y: number;
  size: number;
}

export const Projectile: React.FC<ProjectileProps> = ({ x, y, size }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ])
    );

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.7,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();
    glow.start();

    return () => {
      pulse.stop();
      glow.stop();
    };
  }, [scaleAnim, glowAnim]);

  return (
    <View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
      }}
    >
      <Animated.View
        style={[
          styles.projectile,
          {
            width: size,
            height: size,
            transform: [{ scale: scaleAnim }],
            opacity: glowAnim,
          },
        ]}
      />
      <View
        style={[
          styles.core,
          {
            width: size * 0.6,
            height: size * 0.6,
            left: size * 0.2,
            top: size * 0.2,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  projectile: {
    position: 'absolute',
    backgroundColor: '#7ED321',
    borderRadius: 50,
    shadowColor: '#7ED321',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 8,
  },
  core: {
    position: 'absolute',
    backgroundColor: '#FFF',
    borderRadius: 50,
  },
});