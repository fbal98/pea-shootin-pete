import React from 'react';
import { View, StyleSheet } from 'react-native';

interface PeteProps {
  x: number;
  y: number;
  size: number;
}

export const Pete: React.FC<PeteProps> = ({ x, y, size }) => {
  const eyeSize = size * 0.2; // Eyes scale with Pete's size
  const eyeOffset = size * 0.25 - eyeSize / 2; // Center the eyes properly

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
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel="Pete, the main character"
      accessibilityHint="Yellow character with antenna that shoots peas"
    >
      {/* Eyes */}
      <View
        style={[
          styles.eye,
          {
            left: eyeOffset,
            width: eyeSize,
            height: eyeSize,
            borderRadius: eyeSize / 2,
          },
        ]}
      />
      <View
        style={[
          styles.eye,
          {
            right: eyeOffset,
            width: eyeSize,
            height: eyeSize,
            borderRadius: eyeSize / 2,
          },
        ]}
      />

      {/* Mouth */}
      <View style={styles.mouth} />

      {/* Antenna */}
      <View style={[styles.antennaStick, { height: size * 0.375 }]} />
      <View style={[styles.antennaTop, { top: -(size * 0.5) }]} />
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
    backgroundColor: '#000',
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
    left: '50%',
    marginLeft: -4,
  },
});
