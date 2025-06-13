import React, { useEffect, useCallback, useRef, useState } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import { HyperCasualMenuScreen } from '@/screens/HyperCasualMenuScreen';
import { HyperCasualGameScreen } from '@/screens/HyperCasualGameScreen';
import { HyperCasualSettingsScreen } from '@/screens/HyperCasualSettingsScreen';
import { HyperCasualAboutScreen } from '@/screens/HyperCasualAboutScreen';
import { WorldMapScreen } from '@/screens/WorldMapScreen';
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

  const handleLevelSelect = useCallback((_levelId: number) => {
    // Start the selected level
    actions.resetGame();
    actions.setIsPlaying(true);
    setCurrentScreen('game');
  }, [actions]);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'game':
        return <HyperCasualGameScreen onBackToMenu={handleBackToMenu} onWorldMap={handleWorldMap} />;
      case 'settings':
        return <HyperCasualSettingsScreen onBack={handleBackToMenu} />;
      case 'about':
        return <HyperCasualAboutScreen onBack={handleBackToMenu} />;
      case 'worldmap':
        return <WorldMapScreen onBack={handleBackToMenu} onLevelSelect={handleLevelSelect} />;
      default:
        return (
          <HyperCasualMenuScreen 
            onStartGame={handleStartGame} 
            onSettings={handleSettings}
            onAbout={handleAbout}
            onWorldMap={handleWorldMap}
            highScore={highScore} 
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
