import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { GAME_CONFIG } from '@/constants/GameConfig';
import { safeAnimation, ErrorLogger } from '@/utils/errorLogger';

interface ProjectileProps {
  x: number;
  y: number;
  size: number;
}

export const Projectile: React.FC<ProjectileProps> = ({ x, y, size }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.7)).current;
  const animationsRef = useRef<{
    pulse?: Animated.CompositeAnimation;
    glow?: Animated.CompositeAnimation;
  }>({});

  useEffect(() => {
    try {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.3,
            duration: GAME_CONFIG.PROJECTILE_PULSE_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: GAME_CONFIG.PROJECTILE_PULSE_DURATION,
            useNativeDriver: true,
          }),
        ])
      );

      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: GAME_CONFIG.PROJECTILE_GLOW_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.7,
            duration: GAME_CONFIG.PROJECTILE_GLOW_DURATION,
            useNativeDriver: true,
          }),
        ])
      );

      // Store references for proper cleanup
      animationsRef.current = { pulse, glow };

      safeAnimation(
        () => {
          pulse.start();
          glow.start();
        },
        'Projectile',
        'start_animations'
      );
    } catch (error) {
      ErrorLogger.logAnimationError(
        error instanceof Error ? error : new Error(String(error)),
        'Projectile',
        'setup'
      );
    }

    return () => {
      try {
        // Properly stop all animations
        if (animationsRef.current.pulse) {
          animationsRef.current.pulse.stop();
        }
        if (animationsRef.current.glow) {
          animationsRef.current.glow.stop();
        }

        // Reset animation values to prevent memory leaks
        scaleAnim.setValue(1);
        glowAnim.setValue(0.7);

        // Clear references
        animationsRef.current = {};
      } catch (error) {
        ErrorLogger.logAnimationError(
          error instanceof Error ? error : new Error(String(error)),
          'Projectile',
          'cleanup'
        );
      }
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
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel="Pea projectile"
      accessibilityHint="Glowing green pea moving upward"
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
