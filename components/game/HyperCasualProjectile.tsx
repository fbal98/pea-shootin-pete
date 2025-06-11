import React from 'react';
import { View, StyleSheet } from 'react-native';
import { getColorScheme } from '@/constants/HyperCasualColors';

interface HyperCasualProjectileProps {
  x: number;
  y: number;
  size: number;
  level: number;
}

export const HyperCasualProjectile: React.FC<HyperCasualProjectileProps> = ({ 
  x, 
  y, 
  size,
  level 
}) => {
  const colorScheme = getColorScheme(level);

  return (
    <View
      style={[
        styles.projectile,
        {
          left: x,
          top: y,
          width: size,
          height: size,
          backgroundColor: colorScheme.particle,
          shadowColor: colorScheme.shadow,
        },
      ]}
    />
  );
};

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