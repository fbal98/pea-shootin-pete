import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  useWindowDimensions,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// Components
import { HyperCasualBackground } from '@/components/game/HyperCasualBackground';
import { HyperCasualPete } from '@/components/game/HyperCasualPete';
import { HyperCasualEnemy } from '@/components/game/HyperCasualEnemy';
import { HyperCasualProjectile } from '@/components/game/HyperCasualProjectile';
import { HyperCasualHUD } from '@/components/ui/HyperCasualHUD';

// Hooks
import { useHyperCasualGameLogic } from '@/hooks/useHyperCasualGameLogic';
import { useHyperCasualInput } from '@/hooks/useHyperCasualInput';

// Store
import {
  useGameOver,
  useScore,
  useLevel,
  useGameActions,
  useIsPlaying,
} from '@/store/gameStore';

// Constants
import { GAME_CONFIG } from '@/constants/GameConfig';
import { UI_COLORS } from '@/constants/HyperCasualColors';

export const HyperCasualGameScreen: React.FC = () => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const gameAreaHeight = screenHeight - insets.top - insets.bottom;

  // Game state
  const score = useScore();
  const level = useLevel();
  const gameOver = useGameOver();
  const isPlaying = useIsPlaying();
  const actions = useGameActions();

  // Game logic hook
  const {
    petePosition,
    enemies,
    projectiles,
    gameAreaHeightRef,
    updatePetePosition,
    shootProjectile,
  } = useHyperCasualGameLogic(screenWidth, gameAreaHeight);

  // Update game area height ref
  useEffect(() => {
    gameAreaHeightRef.current = gameAreaHeight;
  }, [gameAreaHeight, gameAreaHeightRef]);

  // Hyper-casual input handling
  const {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    updateSmoothing,
  } = useHyperCasualInput(screenWidth, shootProjectile, updatePetePosition);

  // Smooth movement update loop
  useEffect(() => {
    const interval = setInterval(updateSmoothing, 16); // 60fps
    return () => clearInterval(interval);
  }, [updateSmoothing]);

  // Auto-start game when component mounts
  useEffect(() => {
    if (!isPlaying && !gameOver) {
      actions.resetGame();
    }
  }, []);

  const handleRestart = useCallback(() => {
    actions.resetGame();
  }, [actions]);

  const handleBackToMenu = useCallback(() => {
    actions.setIsPlaying(false);
  }, [actions]);

  // Calculate positions
  const peteY = gameAreaHeight - GAME_CONFIG.PETE_SIZE - GAME_CONFIG.BOTTOM_PADDING;

  return (
    <View style={styles.container}>
      {/* Gradient background with floating shapes */}
      <HyperCasualBackground level={level} isPlaying={isPlaying} />

      {/* Game area */}
      <View
        style={[styles.gameArea, { paddingTop: insets.top }]}
        onStartShouldSetResponder={() => true}
        onResponderGrant={handleTouchStart}
        onResponderMove={handleTouchMove}
        onResponderRelease={handleTouchEnd}
      >
        {/* Score display */}
        <HyperCasualHUD score={score} />

        {/* Game entities */}
        {isPlaying && !gameOver && (
          <>
            {/* Pete */}
            <HyperCasualPete
              x={petePosition.current}
              y={peteY}
              size={GAME_CONFIG.PETE_SIZE}
              level={level}
            />

            {/* Enemies */}
            {enemies.map(enemy => (
              <HyperCasualEnemy
                key={enemy.id}
                x={enemy.x}
                y={enemy.y}
                size={enemy.size}
                type={enemy.type}
                sizeLevel={enemy.sizeLevel}
                level={level}
              />
            ))}

            {/* Projectiles */}
            {projectiles.map(projectile => (
              <HyperCasualProjectile
                key={projectile.id}
                x={projectile.x}
                y={projectile.y}
                size={GAME_CONFIG.PROJECTILE_SIZE}
                level={level}
              />
            ))}
          </>
        )}

        {/* Game Over overlay */}
        {gameOver && (
          <View style={styles.gameOverOverlay}>
            <LinearGradient
              colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.98)']}
              style={styles.gameOverContainer}
            >
              <Text style={styles.gameOverTitle}>game over</Text>
              <Text style={styles.finalScore}>{score}</Text>
              
              <TouchableOpacity
                style={styles.restartButton}
                onPress={handleRestart}
                activeOpacity={0.8}
              >
                <Text style={styles.restartText}>PLAY AGAIN</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.menuButton}
                onPress={handleBackToMenu}
                activeOpacity={0.8}
              >
                <Text style={styles.menuText}>MENU</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gameArea: {
    flex: 1,
  },
  gameOverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  gameOverContainer: {
    paddingVertical: 60,
    paddingHorizontal: 60,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  gameOverTitle: {
    fontSize: 28,
    fontWeight: '300',
    color: UI_COLORS.menuText,
    marginBottom: 20,
  },
  finalScore: {
    fontSize: 64,
    fontWeight: '600',
    color: UI_COLORS.menuText,
    marginBottom: 40,
  },
  restartButton: {
    backgroundColor: UI_COLORS.tapToPlayBg,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginBottom: 16,
  },
  restartText: {
    fontSize: 14,
    fontWeight: '500',
    color: UI_COLORS.menuText,
    letterSpacing: 2,
  },
  menuButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '400',
    color: UI_COLORS.menuTextLight,
    letterSpacing: 1,
  },
});