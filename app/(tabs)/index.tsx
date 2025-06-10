import React, { useEffect, useMemo, useCallback, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { MenuScreen } from '@/screens/MenuScreen';
import { GameScreen } from '@/screens/GameScreen';
// import { GameScreenMinimal } from '@/screens/GameScreenMinimal';
import { useGameActions, useIsPlaying } from '@/store/gameStore';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GAME_CONFIG } from '@/constants/GameConfig';

export default function HomeScreen() {
  const dimensions = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isPlaying = useIsPlaying();
  const actions = useGameActions();
  const hasInitialized = useRef(false);

  // Memoize screen calculations to prevent infinite re-renders
  const { SCREEN_WIDTH, GAME_AREA_BOTTOM } = useMemo(
    () => ({
      SCREEN_WIDTH: dimensions.width,
      GAME_AREA_BOTTOM: dimensions.height - insets.bottom - GAME_CONFIG.BOTTOM_PADDING,
    }),
    [dimensions.width, dimensions.height, insets.bottom]
  );

  // Initialize game state only once when component mounts
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const { width } = dimensions;
    const gameAreaBottom = dimensions.height - insets.bottom - GAME_CONFIG.BOTTOM_PADDING;
    actions.resetGame(width, gameAreaBottom);
  }, [dimensions, insets, actions]);

  const handleStartGame = useCallback(() => {
    actions.resetGame(SCREEN_WIDTH, GAME_AREA_BOTTOM);
    actions.setIsPlaying(true);
  }, [SCREEN_WIDTH, GAME_AREA_BOTTOM, actions]);

  return (
    <View style={styles.container}>
      {isPlaying ? <GameScreen /> : <MenuScreen onStartGame={handleStartGame} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
