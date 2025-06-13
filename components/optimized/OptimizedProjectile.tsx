/**
 * Optimized Projectile component with aggressive memoization
 */

import React, { memo } from 'react';
import { View } from 'react-native';
import { ENTITY_CONFIG } from '@/constants/GameConfig';

interface OptimizedProjectileProps {
  id: string;
  x: number;
  y: number;
  color: string;
  screenWidth: number;
  screenHeight: number;
  // Performance optimization props
  isVisible?: boolean;
  quality?: 'high' | 'medium' | 'low';
}

const OptimizedProjectileComponent: React.FC<OptimizedProjectileProps> = ({
  id,
  x,
  y,
  color,
  screenWidth,
  screenHeight,
  isVisible = true,
  quality = 'high'
}) => {
  // Viewport culling - projectiles move fast so we need minimal margin
  const size = ENTITY_CONFIG.PROJECTILE.SIZE;
  if (!isVisible || y < -size || y > screenHeight + size ||
      x < -size || x > screenWidth + size) {
    return null;
  }

  // Simplified rendering for projectiles based on quality
  const shadowStyle = quality === 'high' ? {
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 3,
  } : {};

  const borderRadius = quality === 'low' ? 0 : size / 2;

  return (
    <View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius,
        ...shadowStyle,
      }}
    />
  );
};

// Ultra-aggressive memoization for projectiles (they're numerous and fast-moving)
const OptimizedProjectile = memo(OptimizedProjectileComponent, (prevProps, nextProps) => {
  // Very tight threshold for projectiles since they move in straight lines
  const positionThreshold = 1.0; // 1px threshold
  
  return (
    prevProps.id === nextProps.id &&
    Math.abs(prevProps.x - nextProps.x) < positionThreshold &&
    Math.abs(prevProps.y - nextProps.y) < positionThreshold &&
    prevProps.color === nextProps.color &&
    prevProps.isVisible === nextProps.isVisible &&
    prevProps.quality === nextProps.quality
  );
});

OptimizedProjectile.displayName = 'OptimizedProjectile';

export default OptimizedProjectile;