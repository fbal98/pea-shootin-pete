import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { getColorScheme } from '@/constants/GameColors';
import { ENTITY_CONFIG, getBalloonOpacity } from '@/constants/GameConfig';

interface EnemyProps {
  x: number;
  y: number;
  size: number;
  type?: 'basic' | 'fast' | 'strong' | 'bouncer' | 'splitter' | 'ghost';
  sizeLevel?: number;
  level: number;
  onHit?: () => void; // Prop to trigger flash
}

export const Enemy: React.FC<EnemyProps> = ({
  x,
  y,
  size,
  type = 'basic',
  sizeLevel = 3,
  level,
  onHit
}) => {
  const colorScheme = getColorScheme(level);
  const hitFlashAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (onHit) {
      onHit(); // This can be used to trigger animations from parent
    }
  }, [onHit]);
  
  const triggerHitFlash = () => {
    Animated.sequence([
      Animated.timing(hitFlashAnim, { toValue: 1, duration: 50, useNativeDriver: false }),
      Animated.timing(hitFlashAnim, { toValue: 0, duration: 100, useNativeDriver: false }),
    ]).start();
  };
  
  // Expose method to parent if needed, though direct prop change is better
  // useImperativeHandle(ref, () => ({ triggerHitFlash }));


  // Minimal visual differentiation
  const getOpacity = () => {
    return getBalloonOpacity(sizeLevel as 1 | 2 | 3);
  };

  const getShapeStyle = () => {
    switch (type) {
      case 'fast':
        // Diamond shape (rotated square)
        return {
          transform: [{ rotate: '45deg' }],
          borderRadius: size * ENTITY_CONFIG.BALLOON.BORDER_RADIUS.DIAMOND,
        };
      case 'strong':
        // Square with rounded corners
        return {
          borderRadius: size * ENTITY_CONFIG.BALLOON.BORDER_RADIUS.STRONG,
        };
      default:
        // Circle
        return {
          borderRadius: (size * ENTITY_CONFIG.BALLOON.BORDER_RADIUS.CIRCLE) / 2,
        };
    }
  };

  const flashColor = hitFlashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', 'rgba(255, 255, 255, 0.7)'],
  });

  return (
    <View
      style={[
        styles.enemy,
        getShapeStyle(),
        {
          left: x,
          top: y,
          width: size,
          height: size,
          backgroundColor: colorScheme.secondary,
          opacity: getOpacity(),
          shadowColor: colorScheme.shadow,
        }
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: flashColor, borderRadius: getShapeStyle().borderRadius }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  enemy: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
});