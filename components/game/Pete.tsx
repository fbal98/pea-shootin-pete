import React from 'react';
import { View, StyleSheet } from 'react-native';
import { getColorScheme } from '@/constants/GameColors';

interface PeteProps {
  x: number;
  y: number;
  size: number;
  level: number;
}

export const Pete: React.FC<PeteProps> = ({ x, y, size, level }) => {
  const colorScheme = getColorScheme(level);

  return (
    <View
      style={[
        styles.pete,
        {
          left: x,
          top: y,
          width: size,
          height: size,
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
