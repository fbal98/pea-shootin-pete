import React, { useEffect, useCallback, useRef, useState } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import { MenuScreen } from '@/screens/MenuScreen';
import { GameScreen } from '@/screens/GameScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { AboutScreen } from '@/screens/AboutScreen';
import { EnhancedWorldMapScreen } from '@/screens/EnhancedWorldMapScreen';
import { useGameActions, useHighScore } from '@/store/gameStore';

type Screen = 'menu' | 'game' | 'settings' | 'about' | 'worldmap';

export default function HomeScreen() {
  const highScore = useHighScore();
  const actions = useGameActions();
  const hasInitialized = useRef(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>('menu');

  // Initialize game state only once when component mounts
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Don't auto-start the game, show menu first
    actions.setIsPlaying(false);
  }, [actions]);

  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      if (currentScreen !== 'menu') {
        setCurrentScreen('menu');
        actions.setIsPlaying(false);
        return true; // Prevent default back action
      }
      return false; // Let default back action proceed (exit app)
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [currentScreen, actions]);

  const handleStartGame = useCallback(() => {
    actions.resetGame();
    actions.setIsPlaying(true);
    setCurrentScreen('game');
  }, [actions]);

  const handleSettings = useCallback(() => {
    setCurrentScreen('settings');
  }, []);

  const handleAbout = useCallback(() => {
    setCurrentScreen('about');
  }, []);

  const handleBackToMenu = useCallback(() => {
    setCurrentScreen('menu');
    actions.setIsPlaying(false);
  }, [actions]);

  const handleWorldMap = useCallback(() => {
    setCurrentScreen('worldmap');
  }, []);

  const handleLevelSelect = useCallback(
    (_levelId: number) => {
      // Start the selected level
      actions.resetGame();
      actions.setIsPlaying(true);
      setCurrentScreen('game');
    },
    [actions]
  );

  const renderScreen = () => {
    switch (currentScreen) {
      case 'game':
        return <GameScreen onBackToMenu={handleBackToMenu} onWorldMap={handleWorldMap} />;
      case 'settings':
        return <SettingsScreen onBack={handleBackToMenu} />;
      case 'about':
        return <AboutScreen onBack={handleBackToMenu} />;
      case 'worldmap':
        return <EnhancedWorldMapScreen onBack={handleBackToMenu} onLevelSelect={handleLevelSelect} />;
      default:
        return (
          <MenuScreen
            onStartGame={handleStartGame}
            onSettings={handleSettings}
            onAbout={handleAbout}
            onWorldMap={handleWorldMap}
            highScore={highScore}
          />
        );
    }
  };

  return <View style={styles.container}>{renderScreen()}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
