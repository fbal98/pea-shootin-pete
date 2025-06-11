import React from 'react';
import { View, StyleSheet } from 'react-native';
import { getColorScheme } from '@/constants/HyperCasualColors';

interface HyperCasualEnemyProps {
  x: number;
  y: number;
  size: number;
  type?: 'basic' | 'fast' | 'strong';
  sizeLevel?: number;
  level: number;
}

export const HyperCasualEnemy: React.FC<HyperCasualEnemyProps> = ({ 
  x, 
  y, 
  size, 
  type = 'basic', 
  sizeLevel = 3,
  level 
}) => {
  const colorScheme = getColorScheme(level);
  
  // Minimal visual differentiation
  const getOpacity = () => {
    switch (sizeLevel) {
      case 3: return 1;      // Large
      case 2: return 0.85;   // Medium
      case 1: return 0.7;    // Small
      default: return 1;
    }
  };

  const getShapeStyle = () => {
    switch (type) {
      case 'fast':
        // Diamond shape (rotated square)
        return {
          transform: [{ rotate: '45deg' }],
          borderRadius: size * 0.1,
        };
      case 'strong':
        // Square with rounded corners
        return {
          borderRadius: size * 0.2,
        };
      default:
        // Circle
        return {
          borderRadius: size / 2,
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