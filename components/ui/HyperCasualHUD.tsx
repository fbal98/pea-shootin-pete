import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UI_COLORS } from '@/constants/HyperCasualColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HyperCasualHUDProps {
  score: number;
}

export const HyperCasualHUD: React.FC<HyperCasualHUDProps> = ({ score }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <Text style={styles.scoreText}>{score}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  scoreText: {
    fontSize: 36,
    fontWeight: '600',
    color: UI_COLORS.scoreText,
    textShadowColor: UI_COLORS.scoreTextShadow,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});