import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { getColorScheme } from '@/constants/HyperCasualColors';
import { useLevel } from '@/store/gameStore';

interface EnemyProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string; // Keep for compatibility but will use level-based colors
  type?: 'basic' | 'fast' | 'strong' | 'bouncer' | 'splitter' | 'ghost';
  sizeLevel?: number;
  screenWidth: number;
  screenHeight: number;
  isVisible?: boolean;
  velocity?: { x: number; y: number };
  health?: number;
  maxHealth?: number;
}

const EnemyComponent: React.FC<EnemyProps> = ({ 
  id,
  x, 
  y, 
  width,
  height,
  type = 'basic', 
  sizeLevel = 3,
  screenWidth,
  screenHeight,
  isVisible = true,
}) => {
  const level = useLevel();
  const colorScheme = getColorScheme(level);
  
  // Safety checks for props
  if (isNaN(x) || isNaN(y) || !screenWidth || !screenHeight || 
      typeof x !== 'number' || typeof y !== 'number' || 
      typeof screenWidth !== 'number' || typeof screenHeight !== 'number') {
    return null;
  }
  
  // Viewport culling
  if (!isVisible || x < -width || x > screenWidth || 
      y < -height || y > screenHeight) {
    return null;
  }

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
    const size = Math.min(width, height);
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
          width: width,
          height: height,
          backgroundColor: colorScheme.secondary,
          opacity: getOpacity(),
          shadowColor: colorScheme.shadow,
        },
      ]}
    />
  );
};

// Simple memoization
const Enemy = memo(EnemyComponent, (prevProps, nextProps) => {
  return (
    prevProps.x === nextProps.x &&
    prevProps.y === nextProps.y &&
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height &&
    prevProps.type === nextProps.type &&
    prevProps.sizeLevel === nextProps.sizeLevel &&
    prevProps.isVisible === nextProps.isVisible
  );
});

const styles = StyleSheet.create({
  enemy: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
});

Enemy.displayName = 'Enemy';

export default Enemy;