import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { getColorScheme } from '@/constants/GameColors';

interface PeteProps {
  x: number;
  y: number;
  size: number;
  level: number;
}

export interface PeteRef {
  triggerRecoil: () => void;
  triggerMove: () => void;
}

export const Pete = forwardRef<PeteRef, PeteProps>(({ x, y, size, level }, ref) => {
  const colorScheme = getColorScheme(level);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const squashAnim = useRef(new Animated.Value(1)).current;

  useImperativeHandle(ref, () => ({
    triggerRecoil: () => {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 0.9, duration: 50, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    },
    triggerMove: () => {
       Animated.sequence([
        Animated.timing(squashAnim, { toValue: 1.1, duration: 100, useNativeDriver: true }),
        Animated.spring(squashAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
      ]).start();
    }
  }));

  return (
    <Animated.View
      style={[
        styles.pete,
        {
          left: x,
          top: y,
          width: size,
          height: size,
          backgroundColor: colorScheme.primary,
          shadowColor: colorScheme.shadow,
          transform: [{ scale: scaleAnim }, { scaleY: squashAnim }],
        },
      ]}
    >
      {/* Minimal eye representation - just a subtle indent */}
      <View style={styles.faceContainer}>
        <View style={styles.eye} />
        <View style={styles.eye} />
      </View>
    </Animated.View>
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