import React, { useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { HyperCasualMenuScreen } from '@/screens/HyperCasualMenuScreen';
import { HyperCasualGameScreen } from '@/screens/HyperCasualGameScreen';
import { useGameActions, useIsPlaying, useHighScore } from '@/store/gameStore';

export default function HomeScreen() {
  const isPlaying = useIsPlaying();
  const highScore = useHighScore();
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
      {isPlaying ? (
        <HyperCasualGameScreen />
      ) : (
        <HyperCasualMenuScreen onStartGame={handleStartGame} highScore={highScore} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
