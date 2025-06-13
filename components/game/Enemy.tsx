import React from 'react';
import { View, StyleSheet } from 'react-native';
import { getColorScheme } from '@/constants/GameColors';
import { ENTITY_CONFIG, getBalloonOpacity } from '@/constants/GameConfig';

interface EnemyProps {
  x: number;
  y: number;
  size: number;
  type?: 'basic' | 'fast' | 'strong' | 'bouncer' | 'splitter' | 'ghost';
  sizeLevel?: number;
  level: number;
}

export const Enemy: React.FC<EnemyProps> = ({
  x,
  y,
  size,
  type = 'basic',
  sizeLevel = 3,
  level,
}) => {
  const colorScheme = getColorScheme(level);

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
        },
      ]}
    />
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
