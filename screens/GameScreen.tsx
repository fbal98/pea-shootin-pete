import React, { useEffect, useCallback, useState } from 'react';
import { View, StyleSheet, useWindowDimensions, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// Components
import { GameBackground } from '@/components/game/GameBackground';
import { Pete } from '@/components/game/Pete';
import { Enemy } from '@/components/game/Enemy';
import { Projectile } from '@/components/game/Projectile';
import { GameHUD } from '@/components/ui/GameHUD';
import { MysteryBalloon } from '@/components/game/MysteryBalloon';
import { ProgressionHUD } from '@/components/ui/ProgressionHUD';
import { MysteryRewardDisplay } from '@/components/ui/MysteryRewardDisplay';
import {
  CelebrationManager,
} from '@/components/ui/CelebrationSystem';
import { VictoryModal } from '@/components/ui/VictoryModal';
import { TutorialOverlay } from '@/components/ui/TutorialOverlay';

// Hooks
import { useGameLogic } from '@/hooks/useGameLogic';
import { useOptimizedGameInputBridge } from '@/hooks/useOptimizedGameInputBridge';
import { useTutorialIntegration } from '@/hooks/useTutorialIntegration';
import { useCelebrationManager } from '@/hooks/useCelebrationManager';

// Store
import { useGameOver, useScore, useLevel, useGameActions, useIsPlaying, useLives } from '@/store/gameStore';
import {
  useShowVictoryScreen,
  useCurrentScore,
  useLevelProgressionActions,
  useCurrentLevel,
  useShotsFired,
  useShotsHit,
  useTotalEnemies,
  useEnemiesRemaining,
  useCurrentCombo,
} from '@/store/levelProgressionStore';

// Constants
import { GAME_CONFIG, INPUT_CONFIG } from '@/constants/GameConfig';
import { UI_PALETTE } from '@/constants/GameColors';

interface GameScreenProps {
  onBackToMenu?: () => void;
  onWorldMap?: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({ onBackToMenu, onWorldMap }) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const gameAreaHeight = screenHeight - insets.top - insets.bottom;

  // Game state
  const score = useScore();
  const level = useLevel();
  const lives = useLives();
  const gameOver = useGameOver();
  const isPlaying = useIsPlaying();
  const actions = useGameActions();

  // Level progression state
  const showVictoryScreen = useShowVictoryScreen();
  const currentLevelScore = useCurrentScore();
  const currentLevel = useCurrentLevel();
  const levelActions = useLevelProgressionActions();
  const shotsFired = useShotsFired();
  const shotsHit = useShotsHit();
  const totalEnemies = useTotalEnemies();
  const enemiesRemaining = useEnemiesRemaining();
  const currentCombo = useCurrentCombo();

  // Calculate accuracy and progress
  const accuracy = shotsFired > 0 ? (shotsHit / shotsFired) * 100 : 0;
  const levelProgress = totalEnemies > 0 ? (totalEnemies - enemiesRemaining) / totalEnemies : 0;

  // Tutorial integration
  const {
    currentTutorial,
    isShowingTutorial,
    completeTutorialStep,
    skipCurrentTutorial,
    trackTutorialProgress,
  } = useTutorialIntegration();

  // Celebration system for enhanced feedback
  const { queueCelebration } = useCelebrationManager();

  // Mystery reward display state
  const [mysteryRewards, setMysteryRewards] = useState<{
    id: string;
    reward: unknown;
    x: number;
    y: number;
  }[]>([]);

  // Game logic hook
  const {
    petePosition,
    enemies,
    projectiles,
    mysteryBalloons,
    gameAreaHeightRef,
    updatePetePosition,
    shootProjectile,
  } = useGameLogic(screenWidth, gameAreaHeight);

  // Update game area height ref
  useEffect(() => {
    gameAreaHeightRef.current = gameAreaHeight;
  }, [gameAreaHeight, gameAreaHeightRef]);

  // Enhanced shoot function to track tutorial progress
  const enhancedShootProjectile = useCallback(() => {
    shootProjectile();
    trackTutorialProgress('tap');
  }, [shootProjectile, trackTutorialProgress]);

  // Enhanced position update to track tutorial progress
  const enhancedUpdatePetePosition = useCallback((x: number) => {
    updatePetePosition(x);
    trackTutorialProgress('swipe');
  }, [updatePetePosition, trackTutorialProgress]);

  // Optimized game input handling
  const { handleTouchStart, handleTouchMove, handleTouchEnd, updateSmoothing, getInputStats } = useOptimizedGameInputBridge(
    screenWidth,
    enhancedShootProjectile,
    enhancedUpdatePetePosition,
    {
      smoothingFactor: 0.2, // Slightly more responsive for mobile
      predictionFrames: 1, // Conservative prediction for stable feel
      deadZone: 1.5, // Smaller dead zone for precise control
      tapThreshold: 15, // Slightly larger tap threshold for touch screens
    }
  );

  // Smooth movement update loop
  useEffect(() => {
    const interval = setInterval(updateSmoothing, INPUT_CONFIG.SMOOTHING_UPDATE_INTERVAL);
    return () => clearInterval(interval);
  }, [updateSmoothing]);

  // Game starts when isPlaying is set to true by parent component

  const handleRestart = useCallback(async () => {
    // First, reset game store state (this will hide game over screen)
    actions.resetGame();
    
    // Reset level progression state completely
    levelActions.resetForNewGame();
    
    // Wait a tiny bit for state to settle, then load level 1
    setTimeout(async () => {
      await levelActions.loadLevel(1);
    }, 100);
  }, [actions, levelActions]);

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

  // Input performance tracking (development only)
  const [inputStats, setInputStats] = useState<{
    totalTouches: number;
    averageResponseTime: number;
    smoothingEfficiency: number;
  } | null>(null);

  useEffect(() => {
    if (__DEV__) {
      const interval = setInterval(() => {
        setInputStats(getInputStats());
      }, 2000); // Update every 2 seconds
      return () => clearInterval(interval);
    }
  }, [getInputStats]);

  // Performance tracking for victory screen
  const [levelStartTime, setLevelStartTime] = useState<number>(Date.now());
  const [levelDuration, setLevelDuration] = useState<number>(0);

  // Track level start time
  useEffect(() => {
    if (isPlaying && !gameOver) {
      setLevelStartTime(Date.now());
    }
  }, [currentLevel?.id]);

  // Calculate level duration
  useEffect(() => {
    if (showVictoryScreen) {
      setLevelDuration((Date.now() - levelStartTime) / 1000); // in seconds
    }
  }, [showVictoryScreen, levelStartTime]);

  // Calculate stars earned based on performance
  const calculateStarsEarned = useCallback(() => {
    if (!currentLevel) return 1;

    let stars = 1; // Base star for completion
    
    // Star 2: Good accuracy (>75%)
    if (accuracy >= 75) {
      stars = 2;
    }
    
    // Star 3: Excellent performance
    const goldTime = currentLevel.rewards?.masteryThresholds?.goldTimeThreshold || 60000;
    const goldAccuracy = currentLevel.rewards?.masteryThresholds?.goldAccuracyThreshold || 85;
    
    if (accuracy >= goldAccuracy && levelDuration <= goldTime / 1000) {
      stars = 3;
    }
    
    return stars;
  }, [currentLevel, accuracy, levelDuration]);

  // Calculate positions
  const peteY = gameAreaHeight - GAME_CONFIG.PETE_SIZE - GAME_CONFIG.BOTTOM_PADDING;

  return (
    <CelebrationManager>
      <View style={styles.container}>
        {/* Gradient background with floating shapes */}
        <GameBackground level={level} isPlaying={isPlaying} />

        {/* Game area */}
        <View
          style={[styles.gameArea, { paddingTop: insets.top }]}
          onStartShouldSetResponder={() => true}
          onResponderGrant={handleTouchStart}
          onResponderMove={handleTouchMove}
          onResponderRelease={handleTouchEnd}
        >
          {/* Enhanced Game HUD */}
          <GameHUD
            score={score}
            lives={lives}
            level={level}
            levelProgress={levelProgress}
            levelObjective={currentLevel?.objectives[0]?.description || 'Pop the balloons!'}
            combo={currentCombo}
            onPause={() => actions.setIsPaused(true)}
          />

          {/* Game entities */}
          {isPlaying && !gameOver && (
            <>
              {/* Pete */}
              <Pete x={petePosition.current} y={peteY} size={GAME_CONFIG.PETE_SIZE} level={level} />

              {/* Enemies */}
              {enemies.map(enemy => (
                <Enemy
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
                <Projectile
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
                    // === ENHANCED MYSTERY BALLOON CELEBRATION ===
                    const centerX = mysteryBalloon.x + mysteryBalloon.width / 2;
                    const centerY = mysteryBalloon.y + mysteryBalloon.width / 2;
                    
                    // High-priority celebration for mystery balloon pop
                    queueCelebration({
                      type: 'mystery_reward',
                      priority: 15, // Very high priority - interrupts other celebrations
                      props: {
                        position: { x: centerX, y: centerY },
                        theme: 'volcano',
                        intensity: 'high',
                        message: 'MYSTERY BONUS!',
                      },
                    });

                    // Show reward celebration after a brief delay
                    setTimeout(() => {
                      setMysteryRewards(prev => [
                        ...prev,
                        {
                          id: `reward_${Date.now()}`,
                          reward: reward as any, // TODO: Fix reward type compatibility
                          x: centerX,
                          y: centerY,
                        },
                      ]);
                    }, 500); // Small delay to let the main celebration play first
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
                <Text style={styles.gameOverTitle}>GAME OVER</Text>
                <Text style={styles.finalScore}>{score}</Text>

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: UI_PALETTE.primary }]}
                  onPress={handleRestart}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionButtonText}>PLAY AGAIN</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryButton]}
                  onPress={handleBackToMenu}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryButtonText}>MAIN MENU</Text>
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
            level={typeof currentLevel?.id === 'string' ? parseInt(currentLevel.id) || 1 : currentLevel?.id || 1}
            score={currentLevelScore}
            starsEarned={calculateStarsEarned()}
            isVisible={showVictoryScreen}
            onContinue={handleContinue}
            onBackToMenu={handleVictoryBackToMenu}
            onWorldMap={onWorldMap}
            time={levelDuration}
            accuracy={accuracy}
          />

          {/* Tutorial Overlay */}
          {isShowingTutorial && currentTutorial && (
            <TutorialOverlay
              step={currentTutorial}
              onNext={completeTutorialStep}
              onSkip={skipCurrentTutorial}
              onComplete={completeTutorialStep}
              progress={{
                current: 1, // TODO: Get actual progress from tutorial system
                total: 3, // TODO: Get actual total from tutorial system
              }}
            />
          )}

          {/* Input Performance Debug (Development Only) */}
          {__DEV__ && inputStats && (
            <View style={styles.debugOverlay}>
              <Text style={styles.debugText}>Input Performance:</Text>
              <Text style={styles.debugText}>Touches: {inputStats.totalTouches}</Text>
              <Text style={styles.debugText}>Avg Response: {inputStats.averageResponseTime.toFixed(1)}ms</Text>
              <Text style={styles.debugText}>Smoothing: {inputStats.smoothingEfficiency.toFixed(1)}%</Text>
            </View>
          )}
        </View>
      </View>
    </CelebrationManager>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_PALETTE.background_light,
  },
  gameArea: {
    flex: 1,
  },
  gameOverOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  gameOverContainer: {
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    width: '85%',
  },
  gameOverTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: UI_PALETTE.text_dark,
    marginBottom: 16,
  },
  finalScore: {
    fontSize: 56,
    fontWeight: 'bold',
    color: UI_PALETTE.primary,
    marginBottom: 32,
  },
  actionButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    marginBottom: 16,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: UI_PALETTE.text_light,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: UI_PALETTE.primary,
  },
  secondaryButtonText: {
    color: UI_PALETTE.primary,
  },
  debugOverlay: {
    position: 'absolute',
    top: 100,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 4,
    zIndex: 200,
  },
  debugText: {
    color: '#ffffff',
    fontSize: 10,
    fontFamily: 'monospace',
  },
});
