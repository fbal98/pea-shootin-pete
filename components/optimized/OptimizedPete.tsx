/**
 * Optimized Pete component with React.memo and viewport culling
 */

import React, { memo } from 'react';
import { View } from 'react-native';
import { ENTITY_CONFIG } from '@/constants/GameConfig';

interface OptimizedPeteProps {
  x: number;
  y: number;
  color: string;
  screenWidth: number;
  screenHeight: number;
  // Performance optimization props
  isVisible?: boolean;
  quality?: 'high' | 'medium' | 'low';
}

const OptimizedPeteComponent: React.FC<OptimizedPeteProps> = ({
  x,
  y,
  color,
  screenWidth,
  screenHeight,
  isVisible = true,
  quality = 'high'
}) => {
  // Viewport culling - don't render if off-screen
  if (!isVisible || x < -ENTITY_CONFIG.PETE.SIZE || x > screenWidth || 
      y < -ENTITY_CONFIG.PETE.SIZE || y > screenHeight) {
    return null;
  }

  // Quality-based rendering adjustments
  const shadowOpacity = quality === 'high' ? 0.3 : quality === 'medium' ? 0.15 : 0;
  const borderRadius = quality === 'low' ? 0 : ENTITY_CONFIG.PETE.SIZE / 2;
  
  return (
    <View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: ENTITY_CONFIG.PETE.SIZE,
        height: ENTITY_CONFIG.PETE.SIZE,
        backgroundColor: color,
        borderRadius,
        // Conditional shadow for performance
        ...(shadowOpacity > 0 && {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity,
          shadowRadius: 3,
          elevation: 3,
        }),
      }}
    >
      {/* Eyes - only render in medium/high quality */}
      {quality !== 'low' && (
        <>
          <View
            style={{
              position: 'absolute',
              left: ENTITY_CONFIG.PETE.SIZE * 0.25,
              top: ENTITY_CONFIG.PETE.SIZE * 0.3,
              width: ENTITY_CONFIG.PETE.SIZE * 0.15,
              height: ENTITY_CONFIG.PETE.SIZE * 0.15,
              backgroundColor: 'white',
              borderRadius: ENTITY_CONFIG.PETE.SIZE * 0.075,
            }}
          />
          <View
            style={{
              position: 'absolute',
              right: ENTITY_CONFIG.PETE.SIZE * 0.25,
              top: ENTITY_CONFIG.PETE.SIZE * 0.3,
              width: ENTITY_CONFIG.PETE.SIZE * 0.15,
              height: ENTITY_CONFIG.PETE.SIZE * 0.15,
              backgroundColor: 'white',
              borderRadius: ENTITY_CONFIG.PETE.SIZE * 0.075,
            }}
          />
        </>
      )}
    </View>
  );
};

// Memoization with custom comparison for performance
const OptimizedPete = memo(OptimizedPeteComponent, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  const positionThreshold = 0.5; // Only re-render if position changes by more than 0.5px
  
  return (
    Math.abs(prevProps.x - nextProps.x) < positionThreshold &&
    Math.abs(prevProps.y - nextProps.y) < positionThreshold &&
    prevProps.color === nextProps.color &&
    prevProps.isVisible === nextProps.isVisible &&
    prevProps.quality === nextProps.quality
  );
});

OptimizedPete.displayName = 'OptimizedPete';

export default OptimizedPete;