import React, { useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { MenuScreen } from '@/screens/MenuScreen';
import { GameScreen } from '@/screens/GameScreen';
import { useGameActions, useIsPlaying } from '@/store/gameStore';
import { ArcadeColors } from '@/constants/ArcadeColors';

export default function HomeScreen() {
  const isPlaying = useIsPlaying();
  const actions = useGameActions();
  const hasInitialized = useRef(false);

  // Initialize game state only once when component mounts
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Don't auto-start the game, show menu first
    actions.setIsPlaying(false);
  }, [actions]);

  const handleStartGame = useCallback(() => {
    actions.resetGame();
    actions.setIsPlaying(true);
  }, [actions]);

  return (
    <View style={styles.container}>
      {isPlaying ? <GameScreen /> : <MenuScreen onStartGame={handleStartGame} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ArcadeColors.deepBlack,
  },
});
