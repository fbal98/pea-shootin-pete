import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getColorScheme } from '@/constants/GameColors';

interface ProjectileProps {
  x: number;
  y: number;
  size: number;
  level: number;
}

export const Projectile: React.FC<ProjectileProps> = ({ x, y, size, level }) => {
  const colorScheme = getColorScheme(level);

  return (
    <View style={[styles.container, { left: x, top: y }]}>
      {/* TODO: Add a proper particle trail system here for more juice */}
      <View style={[styles.trail, { width: size / 2, height: size, backgroundColor: colorScheme.particle, opacity: 0.5 }]} />
      <LinearGradient
        colors={[`${colorScheme.particle}ff`, `${colorScheme.particle}00`]}
        style={[
          styles.projectile,
          {
            width: size,
            height: size,
            shadowColor: colorScheme.shadow,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
  },
  projectile: {
    borderRadius: 50,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  trail: {
    position: 'absolute',
    top: size / 2,
    borderRadius: size / 4,
  }
});