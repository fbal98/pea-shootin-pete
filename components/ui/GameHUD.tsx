import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UI_COLORS } from '@/constants/GameColors';
import { UI_CONFIG } from '@/constants/GameConfig';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface GameHUDProps {
  score: number;
}

export const GameHUD: React.FC<GameHUDProps> = ({ score }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + UI_CONFIG.SCORE.TOP_PADDING }]}>
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
    fontSize: UI_CONFIG.SCORE.FONT_SIZE,
    fontWeight: '600',
    color: UI_COLORS.scoreText,
    textShadowColor: UI_COLORS.scoreTextShadow,
    textShadowOffset: UI_CONFIG.SCORE.SHADOW_OFFSET,
    textShadowRadius: UI_CONFIG.SCORE.SHADOW_RADIUS,
  },
});
