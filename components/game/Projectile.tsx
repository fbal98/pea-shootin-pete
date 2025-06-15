import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { ENTITY_CONFIG } from '@/constants/GameConfig';
import { getColorScheme } from '@/constants/HyperCasualColors';
import { useLevel } from '@/store/gameStore';

interface ProjectileProps {
  id: string;
  x: number;
  y: number;
  color?: string; // Keep for compatibility but will use level-based colors
  screenWidth: number;
  screenHeight: number;
  isVisible?: boolean;
  velocity?: { x: number; y: number };
  powerUpType?: string;
  age?: number;
  penetration?: boolean;
  explosion?: boolean;
}

const ProjectileComponent: React.FC<ProjectileProps> = ({ 
  x, 
  y, 
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
  if (!isVisible || x < -ENTITY_CONFIG.PROJECTILE.SIZE || x > screenWidth || 
      y < -ENTITY_CONFIG.PROJECTILE.SIZE || y > screenHeight) {
    return null;
  }

  return (
    <View
      style={[
        styles.projectile,
        {
          left: x,
          top: y,
          width: ENTITY_CONFIG.PROJECTILE.SIZE,
          height: ENTITY_CONFIG.PROJECTILE.SIZE,
          backgroundColor: colorScheme.particle,
          shadowColor: colorScheme.shadow,
        },
      ]}
    />
  );
};

// Simple memoization
const Projectile = memo(ProjectileComponent, (prevProps, nextProps) => {
  return (
    prevProps.x === nextProps.x &&
    prevProps.y === nextProps.y &&
    prevProps.isVisible === nextProps.isVisible
  );
});

const styles = StyleSheet.create({
  projectile: {
    position: 'absolute',
    borderRadius: 50,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
});

Projectile.displayName = 'Projectile';

export default Projectile;