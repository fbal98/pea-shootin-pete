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
import { useAIPlayer, AI_MODE_ENABLED, DEFAULT_AI_OPTIONS } from '@/hooks/useAIPlayer';
import { AI_PRESETS, AIMetrics } from '@/pete_ai';
import { aiAnalytics, AnalyticsSession } from '@/utils/AIAnalytics';

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
import { GAME_CONFIG } from '@/constants/GameConfig';

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
  
  // Debug game state changes
  useEffect(() => {
    console.log('🎮 Game State Changed:', {
      score,
      level,
      lives,
      gameOver,
      isPlaying,
      timestamp: Date.now()
    });
  }, [score, level, lives, gameOver, isPlaying]);

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

  // AI Player state (only when AI mode is enabled via environment)
  const isAIModeEnabled = AI_MODE_ENABLED;
  const [aiEnabled, setAIEnabled] = useState(AI_MODE_ENABLED);
  const [aiPreset, setAIPreset] = useState<keyof typeof AI_PRESETS>('aggressive');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [currentSession, setCurrentSession] = useState<AnalyticsSession | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AIMetrics | null>(null);
  
  // Debug AI state changes
  useEffect(() => {
    console.log('🎮 GameScreen AI State:', {
      aiEnabled,
      aiPreset,
      AI_MODE_ENABLED,
      envVar: process.env.EXPO_PUBLIC_AI_MODE,
      __DEV__
    });
  }, [aiEnabled, aiPreset]);

  // Debug AI Player initialization
  useEffect(() => {
    console.log('🎮 AI Player State:', {
      aiEnabled,
      aiPreset,
      peteXPosition: petePosition.current,
      enemyCount: enemies?.length || 0,
      projectileCount: projectiles?.length || 0,
      screenDimensions: { width: screenWidth, height: gameAreaHeight },
      gameState: { isPlaying, gameOver, score, lives }
    });
  }, [aiEnabled, aiPreset, enemies?.length, projectiles?.length, isPlaying, gameOver]);

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

  // AI Player integration (only when AI mode is enabled via environment)
  const aiPlayer = isAIModeEnabled ? useAIPlayer(
    petePosition,
    enemies,
    projectiles,
    screenWidth,
    gameAreaHeight,
    {
      updatePetePosition: enhancedUpdatePetePosition,
      shootProjectile: enhancedShootProjectile,
    },
    {
      enabled: aiEnabled,
      preset: aiPreset,
      decisionInterval: 100,
      enableAnalytics: true,
      enablePerformanceMonitoring: true,
      onAction: (action, gameState) => {
        console.log('🎮 AI Action Executed:', action.type, 'with', gameState.enemies.length, 'enemies');
        
        // Update current session for real-time analytics display
        const session = aiPlayer?.getAnalyticsSession();
        if (session) {
          setCurrentSession(session);
        }
      }
    }
  ) : null;

  // Optimized game input handling (disabled when AI is active)
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useOptimizedGameInputBridge(
    screenWidth,
    enhancedShootProjectile,
    enhancedUpdatePetePosition,
    {
      debounceMs: 16, // 60fps throttling
      disabled: isAIModeEnabled && aiEnabled, // Disable touch input only when AI mode is enabled AND AI is controlling
    }
  );


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
          onMoveShouldSetResponder={() => true}
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

          {/* AI Debug Panel - only show when AI mode is enabled via environment */}
          {__DEV__ && isAIModeEnabled && (
            <View style={styles.aiDebugPanel}>
              <Text style={styles.aiDebugTitle}>AI Analytics & Debug</Text>
              
              {/* AI Controls */}
              <View style={styles.aiToggleRow}>
                <Text style={styles.aiDebugLabel}>AI Mode:</Text>
                <TouchableOpacity
                  style={[styles.aiToggle, aiEnabled && styles.aiToggleActive]}
                  onPress={() => {
                    console.log('🎮 AI Toggle Pressed - changing from', aiEnabled, 'to', !aiEnabled);
                    setAIEnabled(!aiEnabled);
                  }}
                >
                  <Text style={[styles.aiToggleText, aiEnabled && styles.aiToggleTextActive]}>
                    {aiEnabled ? 'ON' : 'OFF'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.aiToggle, { marginLeft: 10 }, showAnalytics && styles.aiToggleActive]}
                  onPress={() => setShowAnalytics(!showAnalytics)}
                >
                  <Text style={[styles.aiToggleText, showAnalytics && styles.aiToggleTextActive]}>
                    Analytics
                  </Text>
                </TouchableOpacity>
              </View>
              
              {aiEnabled && (
                <View style={styles.aiPresetRow}>
                  <Text style={styles.aiDebugLabel}>Preset:</Text>
                  <TouchableOpacity
                    style={styles.aiPresetButton}
                    onPress={() => {
                      const presets = Object.keys(AI_PRESETS) as (keyof typeof AI_PRESETS)[];
                      const currentIndex = presets.indexOf(aiPreset);
                      const nextIndex = (currentIndex + 1) % presets.length;
                      console.log('🎮 AI Preset changing from', aiPreset, 'to', presets[nextIndex]);
                      setAIPreset(presets[nextIndex]);
                    }}
                  >
                    <Text style={styles.aiPresetText}>{aiPreset}</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {/* Game State Debug Info */}
              <View style={styles.aiDebugInfoRow}>
                <Text style={styles.aiDebugInfo}>
                  Game: {isPlaying ? 'Playing' : 'Stopped'} | Enemies: {enemies?.length || 0} | Pete: {Math.round(petePosition.current)}
                </Text>
              </View>
              
              {/* Real-time Analytics Display */}
              {showAnalytics && currentSession && (
                <View style={styles.analyticsPanel}>
                  <Text style={styles.analyticsTitle}>Live Analytics</Text>
                  <Text style={styles.analyticsText}>
                    Events: {currentSession.events.length} | Session: {((Date.now() - currentSession.startTime) / 1000).toFixed(1)}s
                  </Text>
                  
                  {currentSession.metrics && (
                    <View style={styles.metricsGrid}>
                      <Text style={styles.metricsText}>
                        Accuracy: {currentSession.metrics.accuracy.toFixed(1)}% | Shots: {currentSession.metrics.totalShots}
                      </Text>
                      <Text style={styles.metricsText}>
                        Movements: {currentSession.metrics.totalMovements} | FPS: {currentSession.metrics.averageFPS.toFixed(1)}
                      </Text>
                      <Text style={styles.metricsText}>
                        Threats: {currentSession.metrics.threatsDetected} | Dodged: {currentSession.metrics.threatsAvoided}
                      </Text>
                    </View>
                  )}
                  
                  {currentSession.insights && (
                    <View style={styles.insightsPanel}>
                      <Text style={styles.insightsTitle}>Game Balance Insights:</Text>
                      <Text style={styles.insightsText}>
                        Difficulty: {currentSession.insights.levelDifficulty.difficultyRating.replace('_', ' ')}
                      </Text>
                      {currentSession.insights.recommendations.slice(0, 2).map((rec, index) => (
                        <Text key={index} style={styles.recommendationText}>
                          • {rec}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              )}
              
              {/* Analytics Controls */}
              {showAnalytics && (
                <View style={styles.analyticsControls}>
                  <TouchableOpacity
                    style={styles.analyticsButton}
                    onPress={() => {
                      if (aiPlayer) {
                        const data = aiPlayer.exportAnalytics();
                        setAnalyticsData(data.summary as any);
                        console.log('🎯 Analytics Export:', data);
                      }
                    }}
                  >
                    <Text style={styles.analyticsButtonText}>Export Data</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.analyticsButton, { backgroundColor: '#e74c3c' }]}
                    onPress={() => {
                      if (aiPlayer) {
                        aiPlayer.clearAnalytics();
                        setCurrentSession(null);
                        setAnalyticsData(null);
                        console.log('🎯 Analytics cleared');
                      }
                    }}
                  >
                    <Text style={styles.analyticsButtonText}>Clear Data</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {/* Quick Start Button */}
              {!isPlaying && (
                <TouchableOpacity
                  style={styles.aiStartButton}
                  onPress={async () => {
                    console.log('🎮 Quick Start pressed - starting game');
                    await levelActions.loadLevel(1);
                    actions.setIsPlaying(true);
                  }}
                >
                  <Text style={styles.aiStartButtonText}>START GAME</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

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
  aiDebugPanel: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 8,
    padding: 10,
    minWidth: 120,
    zIndex: 1000,
  },
  aiDebugTitle: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  aiToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  aiPresetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiDebugLabel: {
    color: 'white',
    fontSize: 10,
    flex: 1,
  },
  aiToggle: {
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 35,
  },
  aiToggleActive: {
    backgroundColor: UI_PALETTE.primary,
  },
  aiToggleText: {
    color: '#999',
    fontSize: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  aiToggleTextActive: {
    color: 'white',
  },
  aiPresetButton: {
    backgroundColor: '#444',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
    flex: 1,
    marginLeft: 5,
  },
  aiPresetText: {
    color: 'white',
    fontSize: 9,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  aiDebugInfoRow: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#555',
  },
  aiDebugInfo: {
    color: '#ccc',
    fontSize: 8,
    textAlign: 'center',
  },
  aiStartButton: {
    backgroundColor: UI_PALETTE.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 6,
  },
  aiStartButtonText: {
    color: 'white',
    fontSize: 9,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  // Enhanced Analytics Styles
  analyticsPanel: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#555',
  },
  analyticsTitle: {
    color: '#4CAF50',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  analyticsText: {
    color: '#ccc',
    fontSize: 9,
    marginBottom: 4,
  },
  metricsGrid: {
    marginVertical: 4,
  },
  metricsText: {
    color: '#87CEEB',
    fontSize: 8,
    marginBottom: 2,
  },
  insightsPanel: {
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  insightsTitle: {
    color: '#FFB74D',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  insightsText: {
    color: '#FFD54F',
    fontSize: 8,
    marginBottom: 2,
  },
  recommendationText: {
    color: '#A5D6A7',
    fontSize: 8,
    marginBottom: 1,
  },
  analyticsControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    gap: 5,
  },
  analyticsButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
    flex: 1,
  },
  analyticsButtonText: {
    color: 'white',
    fontSize: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});