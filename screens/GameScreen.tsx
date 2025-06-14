import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Components
import { Enemy } from '@/components/game/Enemy';
import { GameBackground } from '@/components/game/GameBackground';
import { MysteryBalloon } from '@/components/game/MysteryBalloon';
import { Pete } from '@/components/game/Pete';
import { Projectile } from '@/components/game/Projectile';
import {
  CelebrationManager,
} from '@/components/ui/CelebrationSystem';
import { GameHUD } from '@/components/ui/GameHUD';
import InWorldTutorial from '@/components/ui/InWorldTutorial';
import { MysteryRewardDisplay } from '@/components/ui/MysteryRewardDisplay';
import { PowerUpHUD } from '@/components/ui/PowerUpHUD';
import { ProgressionHUD } from '@/components/ui/ProgressionHUD';
import { VictoryModal } from '@/components/ui/VictoryModal';
import { isFeatureEnabled } from '@/constants/FeatureFlagConfig';

// Hooks
import { useCelebrationManager } from '@/hooks/useCelebrationManager';
import { useGameLogic } from '@/hooks/useGameLogic';
import { useOptimizedGameInputBridge } from '@/hooks/useOptimizedGameInputBridge';
import { useTutorialIntegration } from '@/hooks/useTutorialIntegration';

// Store
import { useGameActions, useGameOver, useIsPlaying, useLevel, useLives, useScore } from '@/store/gameStore';
import {
  useCurrentCombo,
  useCurrentLevel,
  useCurrentScore,
  useEnemiesRemaining,
  useLevelProgressionActions,
  useShotsFired,
  useShotsHit,
  useShowVictoryScreen,
  useTotalEnemies,
} from '@/store/levelProgressionStore';

// Constants
import { UI_PALETTE } from '@/constants/GameColors';
import { GAME_CONFIG, INPUT_CONFIG } from '@/constants/GameConfig';

interface GameScreenProps {
  onBackToMenu?: () => void;
  onWorldMap?: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({ onBackToMenu, onWorldMap }) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const gameAreaHeight = screenHeight - insets.top - insets.bottom;
  const gameOverAnim = useRef(new Animated.Value(0)).current;

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
  
  // Save Me state (one per level)
  const [saveMeUsed, setSaveMeUsed] = useState(false);

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

  // Start level music when level begins
  useEffect(() => {
    if (isPlaying && !gameOver && currentLevel) {
      // A simple mapping for now. This could be part of level config.
      // const musicMap = ['level_music_1', 'level_music_2', 'level_music_3'];
      // const musicKey = musicMap[(currentLevel.id -1) % musicMap.length];
      // audioManager.playMusic(musicKey); // Assuming you have loaded these sounds
    }
  }, [isPlaying, gameOver, currentLevel]);

  // Game Over animation
  useEffect(() => {
    if (gameOver) {
      Animated.sequence([
        Animated.timing(gameOverAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(gameOverAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
        Animated.timing(gameOverAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(gameOverAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
        Animated.spring(gameOverAnim, { toValue: 1, friction: 3, useNativeDriver: true })
      ]).start();
    } else {
      gameOverAnim.setValue(0);
    }
  }, [gameOver]);

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

  // === SAVE ME FEATURE ===
  const handleSaveMe = useCallback(async () => {
    if (saveMeUsed) return; // Prevent multiple uses
    
    // Mark Save Me as used for this level
    setSaveMeUsed(true);
    
    // TODO: Show rewarded ad here
    // For now, we'll just activate the save immediately
    console.log('Save Me activated - would show rewarded ad here');
    
    // Simulate ad completion after a brief delay
    setTimeout(() => {
      // Revive the player with 1 life
      actions.setLives(1);
      actions.setGameOver(false);
      
      // Add celebration for dramatic save
      queueCelebration({
        type: 'achievement',
        priority: 20, // Very high priority
        props: {
          position: { x: 200, y: 300 }, // Center-ish of screen
          theme: 'beach',
          intensity: 'high',
          message: 'SAVED!',
        },
      });
      
      console.log('Player saved! Game continues...');
    }, 1000); // 1 second delay to simulate ad
  }, [saveMeUsed, actions, queueCelebration]);
  
  // Reset Save Me when starting a new level
  useEffect(() => {
    if (currentLevel?.id) {
      setSaveMeUsed(false);
    }
  }, [currentLevel?.id]);

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
                    
                    // === POWER-UP SYSTEM: ACTIVATE POWER-UPS FROM MYSTERY BALLOONS ===
                    if (reward && typeof reward === 'object' && 'type' in reward) {
                      const mysteryReward = reward as any;
                      if (mysteryReward.type === 'power_boost') {
                        // Activate power-up with duration based on rarity
                        const duration = mysteryReward.rarity === 'epic' ? 15000 : // 15 seconds for epic
                                        mysteryReward.rarity === 'rare' ? 12000 : // 12 seconds for rare  
                                        mysteryReward.rarity === 'uncommon' ? 10000 : // 10 seconds for uncommon
                                        8000; // 8 seconds for common
                        
                        actions.activatePowerUp(mysteryReward.value, duration);
                        console.log(`Power-up activated: ${mysteryReward.value} for ${duration}ms`);
                      }
                    }
                    
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
            <Animated.View style={[styles.gameOverOverlay, {
              opacity: gameOverAnim,
              transform: [{
                scale: gameOverAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1.2, 1]
                })
              }]
            }]}>
              <LinearGradient
                colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.98)']}
                style={styles.gameOverContainer}
              >
                <Animated.Text style={[styles.gameOverTitle, {
                  transform: [{
                    translateX: gameOverAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [Math.random() * 10 - 5, 0]
                    })
                  }]
                }]}>GAME OVER</Animated.Text>
                <Text style={styles.finalScore}>{score}</Text>

                {/* Save Me Button - Only show if not used yet */}
                {!saveMeUsed && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.saveMeButton]}
                    onPress={handleSaveMe}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.saveMeButtonText}>💎 SAVE ME</Text>
                    <Text style={styles.saveMeSubText}>Watch ad to continue</Text>
                  </TouchableOpacity>
                )}

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
            </Animated.View>
          )}

          {/* Real-time Progression HUD */}
          {isFeatureEnabled('metaProgression.playerStats') && (
            <ProgressionHUD level={level} isPlaying={isPlaying && !gameOver} />
          )}
          
          {/* Power-up Display */}
          {isFeatureEnabled('economy.powerUpShop') && <PowerUpHUD />}

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

          {/* Simplified In-World Tutorial */}
          {isFeatureEnabled('tutorial.animatedCues') && (
            <InWorldTutorial
              step={isShowingTutorial && currentTutorial ? 'tap_to_shoot' : null}
              balloonPosition={enemies.length > 0 ? { x: enemies[0].x, y: enemies[0].y } : undefined}
              onStepCompleted={completeTutorialStep}
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
  saveMeButton: {
    backgroundColor: '#FF6B6B', // Attention-grabbing red
    borderWidth: 2,
    borderColor: '#FF4757',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  saveMeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: UI_PALETTE.text_light,
    textAlign: 'center',
  },
  saveMeSubText: {
    fontSize: 12,
    color: UI_PALETTE.text_light,
    textAlign: 'center',
    opacity: 0.9,
    marginTop: 2,
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