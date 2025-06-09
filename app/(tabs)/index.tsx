import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { MenuScreen } from '@/screens/MenuScreen';
import { GameScreen } from '@/screens/GameScreen';
import { useGameStore, useGameActions } from '@/store/gameStore';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GAME_CONFIG } from '@/constants/GameConfig';

export default function HomeScreen() {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isPlaying = useGameStore(state => state.isPlaying);
  const actions = useGameActions();

  // Calculate game area for initial Pete position
  const GAME_AREA_BOTTOM = SCREEN_HEIGHT - insets.bottom - GAME_CONFIG.BOTTOM_PADDING;

  // Initialize game state when component mounts
  useEffect(() => {
    actions.resetGame(SCREEN_WIDTH, GAME_AREA_BOTTOM);
  }, [SCREEN_WIDTH, GAME_AREA_BOTTOM, actions]);

  const handleStartGame = () => {
    actions.resetGame(SCREEN_WIDTH, GAME_AREA_BOTTOM);
    actions.setIsPlaying(true);
  };

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
