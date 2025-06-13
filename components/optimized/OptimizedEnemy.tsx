/**
 * Optimized Enemy component with React.memo, viewport culling, and LOD
 */

import React, { memo } from 'react';
import { View } from 'react-native';

interface OptimizedEnemyProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  type: 'basic' | 'fast' | 'strong' | 'bouncer' | 'splitter' | 'ghost';
  sizeLevel: number;
  screenWidth: number;
  screenHeight: number;
  // Performance optimization props
  isVisible?: boolean;
  quality?: 'high' | 'medium' | 'low';
  distanceFromCenter?: number;
}

const OptimizedEnemyComponent: React.FC<OptimizedEnemyProps> = ({
  id,
  x,
  y,
  width,
  height,
  color,
  type,
  sizeLevel,
  screenWidth,
  screenHeight,
  isVisible = true,
  quality = 'high',
  distanceFromCenter = 0
}) => {
  // Viewport culling with margin for smooth entry/exit
  const cullMargin = Math.max(width, height);
  if (!isVisible || 
      x < -cullMargin || x > screenWidth + cullMargin ||
      y < -cullMargin || y > screenHeight + cullMargin) {
    return null;
  }

  // Level of Detail (LOD) based on distance and screen space
  const screenSpaceSize = Math.min(width / screenWidth, height / screenHeight);
  let effectiveQuality = quality;
  
  // Reduce quality for small or distant objects
  if (screenSpaceSize < 0.05 || distanceFromCenter > screenWidth * 0.6) {
    effectiveQuality = 'low';
  } else if (screenSpaceSize < 0.1 || distanceFromCenter > screenWidth * 0.4) {
    effectiveQuality = quality === 'high' ? 'medium' : 'low';
  }

  // Shape based on enemy type
  const getShapeStyle = () => {
    const baseStyle = {
      position: 'absolute' as const,
      left: x,
      top: y,
      width,
      height,
      backgroundColor: color,
    };

    switch (type) {
      case 'fast':
        // Diamond shape (rotated square)
        return {
          ...baseStyle,
          transform: [{ rotate: '45deg' }],
          borderRadius: effectiveQuality === 'low' ? 0 : width * 0.1,
        };
      case 'strong':
        // Rounded square
        return {
          ...baseStyle,
          borderRadius: effectiveQuality === 'low' ? 0 : width * 0.15,
        };
      case 'bouncer':
        // Circle with bounce indicator
        return {
          ...baseStyle,
          borderRadius: effectiveQuality === 'low' ? 0 : width / 2,
          borderWidth: effectiveQuality === 'high' ? 2 : 0,
          borderColor: 'rgba(255, 255, 255, 0.5)',
        };
      case 'splitter':
        // Circle with split lines
        return {
          ...baseStyle,
          borderRadius: effectiveQuality === 'low' ? 0 : width / 2,
        };
      case 'ghost':
        // Semi-transparent circle
        return {
          ...baseStyle,
          borderRadius: effectiveQuality === 'low' ? 0 : width / 2,
          opacity: 0.7,
        };
      default:
        // Basic circle
        return {
          ...baseStyle,
          borderRadius: effectiveQuality === 'low' ? 0 : width / 2,
        };
    }
  };

  const shapeStyle = getShapeStyle();

  // Shadow and effects based on quality
  const shadowStyle = effectiveQuality === 'high' ? {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  } : {};

  return (
    <View style={{ ...shapeStyle, ...shadowStyle }}>
      {/* Type-specific visual indicators - only in high quality */}
      {effectiveQuality === 'high' && type === 'splitter' && (
        <>
          {/* Split lines */}
          <View
            style={{
              position: 'absolute',
              left: width * 0.2,
              top: height * 0.45,
              width: width * 0.6,
              height: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: width * 0.45,
              top: height * 0.2,
              width: 1,
              height: height * 0.6,
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
            }}
          />
        </>
      )}

      {/* Size level indicator - only for medium+ quality */}
      {effectiveQuality !== 'low' && sizeLevel > 1 && (
        <View
          style={{
            position: 'absolute',
            right: 2,
            top: 2,
            width: Math.max(4, width * 0.15),
            height: Math.max(4, height * 0.15),
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderRadius: Math.max(2, width * 0.075),
          }}
        />
      )}
    </View>
  );
};

// Aggressive memoization to prevent re-renders
const OptimizedEnemy = memo(OptimizedEnemyComponent, (prevProps, nextProps) => {
  // Position threshold based on object size - larger objects can tolerate larger thresholds
  const positionThreshold = Math.max(0.5, Math.min(prevProps.width, prevProps.height) * 0.02);
  
  return (
    prevProps.id === nextProps.id &&
    Math.abs(prevProps.x - nextProps.x) < positionThreshold &&
    Math.abs(prevProps.y - nextProps.y) < positionThreshold &&
    Math.abs(prevProps.width - nextProps.width) < 0.1 &&
    Math.abs(prevProps.height - nextProps.height) < 0.1 &&
    prevProps.color === nextProps.color &&
    prevProps.type === nextProps.type &&
    prevProps.sizeLevel === nextProps.sizeLevel &&
    prevProps.isVisible === nextProps.isVisible &&
    prevProps.quality === nextProps.quality
  );
});

OptimizedEnemy.displayName = 'OptimizedEnemy';

export default OptimizedEnemy;