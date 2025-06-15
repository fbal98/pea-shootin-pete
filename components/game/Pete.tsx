import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { ENTITY_CONFIG } from '@/constants/GameConfig';
import { getColorScheme } from '@/constants/HyperCasualColors';
import { useLevel } from '@/store/gameStore';

interface PeteProps {
  x: number;
  y: number;
  color?: string; // Keep for compatibility but will use level-based colors
  screenWidth: number;
  screenHeight: number;
  isVisible?: boolean;
  gameState?: {
    isMoving?: boolean;
    recentlyHit?: boolean;
    combo?: number;
  };
}

const PeteComponent: React.FC<PeteProps> = ({
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
  if (!isVisible || x < -ENTITY_CONFIG.PETE.SIZE || x > screenWidth || 
      y < -ENTITY_CONFIG.PETE.SIZE || y > screenHeight) {
    return null;
  }
  
  return (
    <View
      style={[
        styles.pete,
        {
          left: x,
          top: y,
          width: ENTITY_CONFIG.PETE.SIZE,
          height: ENTITY_CONFIG.PETE.SIZE,
          backgroundColor: colorScheme.primary,
          shadowColor: colorScheme.shadow,
        },
      ]}
    >
      {/* Minimal eye representation - just a subtle indent */}
      <View style={styles.faceContainer}>
        <View style={styles.eye} />
        <View style={styles.eye} />
      </View>
    </View>
  );
};

// Simple memoization
const Pete = memo(PeteComponent, (prevProps, nextProps) => {
  return (
    prevProps.x === nextProps.x &&
    prevProps.y === nextProps.y &&
    prevProps.isVisible === nextProps.isVisible
  );
});

const styles = StyleSheet.create({
  pete: {
    position: 'absolute',
    borderRadius: 50,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  faceContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '20%',
  },
  eye: {
    width: '20%',
    height: '20%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 50,
    marginHorizontal: '10%',
  },
});

Pete.displayName = 'Pete';

export default Pete;