import React from 'react';
import { View, StyleSheet } from 'react-native';

interface PeteProps {
  x: number;
  y: number;
  size: number;
}

export const Pete: React.FC<PeteProps> = ({ x, y, size }) => {
  return (
    <View
      style={[
        styles.pete,
        {
          left: x,
          top: y,
          width: size,
          height: size,
        },
      ]}
    >
      {/* Eyes */}
      <View style={[styles.eye, { left: size * 0.25 - 4 }]} />
      <View style={[styles.eye, { right: size * 0.25 - 4 }]} />
      
      {/* Mouth */}
      <View style={styles.mouth} />
      
      {/* Antenna */}
      <View style={styles.antennaStick} />
      <View style={styles.antennaTop} />
    </View>
  );
};

const styles = StyleSheet.create({
  pete: {
    position: 'absolute',
    backgroundColor: '#FFD700',
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#FFA500',
    overflow: 'visible',
  },
  eye: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: '#000',
    borderRadius: 4,
    top: '30%',
  },
  mouth: {
    position: 'absolute',
    width: '50%',
    height: 4,
    backgroundColor: '#000',
    borderRadius: 2,
    bottom: '25%',
    left: '25%',
  },
  antennaStick: {
    position: 'absolute',
    width: 2,
    height: 15,
    backgroundColor: '#333',
    top: -15,
    left: '50%',
    marginLeft: -1,
  },
  antennaTop: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: '#FF0000',
    borderRadius: 4,
    top: -20,
    left: '50%',
    marginLeft: -4,
  },
});