import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { GAME_CONFIG } from '@/constants/GameConfig';
import { safeAnimation, ErrorLogger } from '@/utils/errorLogger';

interface EnemyProps {
  x: number;
  y: number;
  size: number;
  type?: 'basic' | 'fast' | 'strong';
  sizeLevel?: number;
}

export const Enemy: React.FC<EnemyProps> = ({ x, y, size, type = 'basic', sizeLevel = 3 }) => {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const animationsRef = useRef<{
    float?: Animated.CompositeAnimation;
    pulse?: Animated.CompositeAnimation;
  }>({});

  useEffect(() => {
    try {
      const floatDuration =
        GAME_CONFIG.ENEMY_FLOAT_DURATION[
          type.toUpperCase() as keyof typeof GAME_CONFIG.ENEMY_FLOAT_DURATION
        ] || GAME_CONFIG.ENEMY_FLOAT_DURATION.BASIC;

      const float = Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: 1,
            duration: floatDuration,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: floatDuration,
            useNativeDriver: true,
          }),
        ])
      );

      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: GAME_CONFIG.ENEMY_PULSE_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: GAME_CONFIG.ENEMY_PULSE_DURATION,
            useNativeDriver: true,
          }),
        ])
      );

      // Store references for proper cleanup
      animationsRef.current = { float, pulse };

      safeAnimation(
        () => {
          float.start();
          pulse.start();
        },
        'Enemy',
        `start_animations_${type}`
      );
    } catch (error) {
      ErrorLogger.logAnimationError(
        error instanceof Error ? error : new Error(String(error)),
        'Enemy',
        `setup_${type}`
      );
    }

    return () => {
      try {
        // Properly stop all animations
        if (animationsRef.current.float) {
          animationsRef.current.float.stop();
        }
        if (animationsRef.current.pulse) {
          animationsRef.current.pulse.stop();
        }

        // Reset animation values to prevent memory leaks
        floatAnim.setValue(0);
        scaleAnim.setValue(1);

        // Clear references
        animationsRef.current = {};
      } catch (error) {
        ErrorLogger.logAnimationError(
          error instanceof Error ? error : new Error(String(error)),
          'Enemy',
          `cleanup_${type}`
        );
      }
    };
  }, [type, floatAnim, scaleAnim]);

  const getColor = () => {
    switch (type) {
      case 'fast':
        return '#FF9800';
      case 'strong':
        return '#9C27B0';
      default:
        return '#F44336';
    }
  };

  const getShapeStyle = () => {
    switch (type) {
      case 'fast':
        return {
          // Diamond-like appearance without rotation to maintain accurate collision detection
          borderRadius: 15,
          borderWidth: 2,
          borderColor: '#FF6F00',
        };
      case 'strong':
        return {
          borderRadius: 10,
          borderWidth: 3,
          borderColor: '#6A1B9A',
        };
      default:
        return { borderRadius: 5 };
    }
  };

  const renderFace = () => {
    // Scale face features based on size level
    const eyeSize = Math.max(4, 6 * (sizeLevel / 3));
    const eyeOffset = 3 * (sizeLevel / 3);

    switch (type) {
      case 'fast':
        return (
          <>
            {/* Worried eyes */}
            <View
              style={[
                styles.eye,
                {
                  left: size * 0.2 - eyeOffset,
                  top: size * 0.25,
                  width: eyeSize,
                  height: eyeSize,
                },
              ]}
            />
            <View
              style={[
                styles.eye,
                {
                  right: size * 0.2 - eyeOffset,
                  top: size * 0.25,
                  width: eyeSize,
                  height: eyeSize,
                },
              ]}
            />
            {/* Worried mouth */}
            <View
              style={[
                styles.worriedMouth,
                {
                  width: size * 0.4,
                  left: size * 0.3,
                  height: Math.max(4, 8 * (sizeLevel / 3)),
                },
              ]}
            />
          </>
        );
      case 'strong':
        return (
          <>
            {/* Mean eyes */}
            <View
              style={[
                styles.meanEye,
                {
                  left: size * 0.2 - eyeOffset - 1,
                  width: Math.max(4, 8 * (sizeLevel / 3)),
                  height: Math.max(2, 4 * (sizeLevel / 3)),
                },
              ]}
            />
            <View
              style={[
                styles.meanEye,
                {
                  right: size * 0.2 - eyeOffset - 1,
                  width: Math.max(4, 8 * (sizeLevel / 3)),
                  height: Math.max(2, 4 * (sizeLevel / 3)),
                },
              ]}
            />
            {/* Angry mouth */}
            <View
              style={[
                styles.angryMouth,
                {
                  width: size * 0.5,
                  height: Math.max(2, 4 * (sizeLevel / 3)),
                },
              ]}
            />
          </>
        );
      default:
        return (
          <>
            {/* Basic angry eyes */}
            <View
              style={[
                styles.eye,
                {
                  left: size * 0.25 - eyeOffset,
                  width: eyeSize,
                  height: eyeSize,
                },
              ]}
            />
            <View
              style={[
                styles.eye,
                {
                  right: size * 0.25 - eyeOffset,
                  width: eyeSize,
                  height: eyeSize,
                },
              ]}
            />
            {/* Frown */}
            <View
              style={[
                styles.frown,
                {
                  height: Math.max(2, 3 * (sizeLevel / 3)),
                },
              ]}
            />
          </>
        );
    }
  };

  const floatOffset = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 5],
  });

  return (
    <Animated.View
      style={[
        styles.enemy,
        getShapeStyle(),
        {
          left: x,
          top: y,
          width: size,
          height: size,
          backgroundColor: getColor(),
          transform: [{ translateY: floatOffset }, { scale: scaleAnim }],
        },
      ]}
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel={`${type} enemy, size level ${sizeLevel}`}
      accessibilityHint={`Bouncing ${getColor()} enemy that splits when hit`}
    >
      {renderFace()}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  enemy: {
    position: 'absolute',
    overflow: 'visible',
  },
  eye: {
    position: 'absolute',
    width: 6,
    height: 6,
    backgroundColor: '#FFF',
    borderRadius: 3,
    top: '25%',
  },
  meanEye: {
    position: 'absolute',
    width: 8,
    height: 4,
    backgroundColor: '#FFF',
    top: '30%',
    transform: [{ rotate: '-10deg' }],
  },
  frown: {
    position: 'absolute',
    width: '40%',
    height: 3,
    backgroundColor: '#000',
    bottom: '25%',
    left: '30%',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    transform: [{ rotate: '180deg' }],
  },
  worriedMouth: {
    position: 'absolute',
    height: 8,
    backgroundColor: '#000',
    borderRadius: 4,
    bottom: '20%',
  },
  angryMouth: {
    position: 'absolute',
    height: 4,
    backgroundColor: '#000',
    bottom: '20%',
    left: '25%',
  },
});
