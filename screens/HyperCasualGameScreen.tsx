import React, { useRef, useEffect, useCallback, useState } from 'react';
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
import { MysteryBalloon } from '@/components/game/MysteryBalloon';
import { ProgressionHUD } from '@/components/ui/ProgressionHUD';
import { MysteryRewardDisplay } from '@/components/ui/MysteryRewardDisplay';
import { CelebrationManager, AchievementCelebration, LevelVictoryCelebration, ComboStreakCelebration } from '@/components/ui/CelebrationSystem';
import { VictoryModal } from '@/components/ui/VictoryModal';

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
import {
  useShowVictoryScreen,
  useCurrentScore,
  useLevelProgressionActions,
  useCurrentLevel,
} from '@/store/levelProgressionStore';

// Constants
import { GAME_CONFIG, INPUT_CONFIG } from '@/constants/GameConfig';
import { UI_COLORS } from '@/constants/HyperCasualColors';

interface HyperCasualGameScreenProps {
  onBackToMenu?: () => void;
  onWorldMap?: () => void;
}

export const HyperCasualGameScreen: React.FC<HyperCasualGameScreenProps> = ({ onBackToMenu, onWorldMap }) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const gameAreaHeight = screenHeight - insets.top - insets.bottom;

  // Game state
  const score = useScore();
  const level = useLevel();
  const gameOver = useGameOver();
  const isPlaying = useIsPlaying();
  const actions = useGameActions();
  
  // Level progression state
  const showVictoryScreen = useShowVictoryScreen();
  const currentLevelScore = useCurrentScore();
  const currentLevel = useCurrentLevel();
  const levelActions = useLevelProgressionActions();
  
  // Mystery reward display state
  const [mysteryRewards, setMysteryRewards] = useState<Array<{
    id: string;
    reward: any;
    x: number;
    y: number;
  }>>([]);

  // Game logic hook
  const {
    petePosition,
    enemies,
    projectiles,
    mysteryBalloons,
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
    const interval = setInterval(updateSmoothing, INPUT_CONFIG.SMOOTHING_UPDATE_INTERVAL);
    return () => clearInterval(interval);
  }, [updateSmoothing]);

  // Game starts when isPlaying is set to true by parent component

  const handleRestart = useCallback(() => {
    actions.resetGame();
  }, [actions]);

  const handleBackToMenu = useCallback(() => {
    actions.setIsPlaying(false);
    onBackToMenu?.();
  }, [actions, onBackToMenu]);

  const handleContinue = useCallback(async () => {
    // Hide victory screen and proceed to next level
    levelActions.showVictory(false);
    await levelActions.proceedToNextLevel();
  }, [levelActions]);

  const handleVictoryBackToMenu = useCallback(() => {
    levelActions.showVictory(false);
    handleBackToMenu();
  }, [levelActions, handleBackToMenu]);

  // Calculate positions
  const peteY = gameAreaHeight - GAME_CONFIG.PETE_SIZE - GAME_CONFIG.BOTTOM_PADDING;

  return (
    <CelebrationManager>
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

              {/* Mystery Balloons */}
              {mysteryBalloons.map(mysteryBalloon => (
                <MysteryBalloon
                  key={mysteryBalloon.id}
                  x={mysteryBalloon.x}
                  y={mysteryBalloon.y}
                  size={mysteryBalloon.width}
                  level={level}
                  mysteryBalloon={mysteryBalloon.mysteryBalloon}
                  onPopped={(balloonId, reward) => {
                    // Show reward celebration
                    setMysteryRewards(prev => [...prev, {
                      id: `reward_${Date.now()}`,
                      reward,
                      x: mysteryBalloon.x + mysteryBalloon.width / 2,
                      y: mysteryBalloon.y + mysteryBalloon.width / 2
                    }]);
                  }}
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
          
          {/* Real-time Progression HUD */}
          <ProgressionHUD level={level} isPlaying={isPlaying && !gameOver} />
          
          {/* Mystery Reward Celebrations */}
          {mysteryRewards.map(mysteryReward => (
            <MysteryRewardDisplay
              key={mysteryReward.id}
              reward={mysteryReward.reward}
              x={mysteryReward.x}
              y={mysteryReward.y}
              onComplete={() => {
                setMysteryRewards(prev => prev.filter(r => r.id !== mysteryReward.id));
              }}
            />
          ))}
          
          {/* Victory Modal */}
          <VictoryModal
            level={currentLevel?.id || 1}
            score={currentLevelScore}
            starsEarned={3} // TODO: Calculate actual stars based on performance
            isVisible={showVictoryScreen}
            onContinue={handleContinue}
            onBackToMenu={handleVictoryBackToMenu}
            onWorldMap={onWorldMap}
          />
        </View>
      </View>
    </CelebrationManager>
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