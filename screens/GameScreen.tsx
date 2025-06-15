import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Components - OPTIMIZED VERSIONS ONLY!
import { GameBackground } from '@/components/ui/GameBackground';
import GameRenderer from '@/components/game/GameRenderer';
import {
  CelebrationManager,
} from '@/components/ui/CelebrationSystem';
import { GameHUD } from '@/components/ui/GameHUD';
import InWorldTutorial from '@/components/ui/InWorldTutorial';
import { MysteryRewardDisplay } from '@/components/ui/MysteryRewardDisplay';
import { PowerUpHUD } from '@/components/ui/PowerUpHUD';
import { ProgressionHUD } from '@/components/ui/ProgressionHUD';
import { VictoryModal } from '@/components/ui/VictoryModal';
import AdvancedParticleSystem from '@/components/effects/AdvancedParticleSystem';
import { isFeatureEnabled } from '@/constants/FeatureFlagConfig';
import { MysteryReward } from '@/types/MetaProgressionTypes';

// Hooks - REFACTORED VERSION ONLY!
import { useCelebrationManager } from '@/hooks/useCelebrationManager';
import { useGameLogicRefactored } from '@/hooks/useGameLogicRefactored';
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
import { GAME_CONFIG, ENTITY_CONFIG, getPeteColor } from '@/constants/GameConfig';

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
  
  // Debug game state changes (removed for performance)
  // Performance-sensitive: Console logging on every state change was causing significant slowdown

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
    reward: MysteryReward;
    x: number;
    y: number;
  }[]>([]);
  
  // Save Me state (one per level)
  const [saveMeUsed, setSaveMeUsed] = useState(false);

  // Particle effect system state
  const [activeParticleEffects, setActiveParticleEffects] = useState<Array<{
    id: string;
    type: 'explosion' | 'impact' | 'power_up' | 'trail';
    position: { x: number; y: number };
    intensity: number;
    duration: number;
    startTime: number;
  }>>([]);

  // AI Player state (only when AI mode is enabled via environment)
  const isAIModeEnabled = AI_MODE_ENABLED;
  const [aiEnabled, setAIEnabled] = useState(AI_MODE_ENABLED);
  const [aiPreset, setAIPreset] = useState<keyof typeof AI_PRESETS>('aggressive');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [currentSession, setCurrentSession] = useState<AnalyticsSession | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AIMetrics | null>(null);
  
  // Debug AI state changes (removed for performance)
  // Performance-sensitive: Console logging was causing render cycle slowdown

  // Calculate positions first
  const peteY = gameAreaHeight - GAME_CONFIG.PETE_SIZE - GAME_CONFIG.BOTTOM_PADDING;

  // Game logic hook
  const {
    petePosition,
    enemies,
    projectiles,
    mysteryBalloons,
    gameAreaHeightRef,
    updatePetePosition,
    shootProjectile,
    // New optimized systems from refactored hook
    gameLoop,
    levelManager,
    powerUpSystem,
    debugInfo,
  } = useGameLogicRefactored(screenWidth, gameAreaHeight);

  // Debug AI Player initialization (removed for performance)
  // Performance-sensitive: This was logging on every entity count change, causing significant slowdown

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
      Animated.timing(gameOverAnim, { 
        toValue: 1, 
        duration: 300, 
        useNativeDriver: true 
      }).start();
    } else {
      gameOverAnim.setValue(0);
    }
  }, [gameOver]);

  // Enhanced shoot function to track tutorial progress
  const enhancedShootProjectile = useCallback(() => {
    shootProjectile();
    trackTutorialProgress('tap');
    
    // Add muzzle flash particle effect
    const effectId = `shoot-${Date.now()}`;
    setActiveParticleEffects(prev => [...prev, {
      id: effectId,
      type: 'impact',
      position: { x: petePosition.x, y: peteY - 20 },
      intensity: 0.5,
      duration: 300,
      startTime: Date.now(),
    }]);
  }, [shootProjectile, trackTutorialProgress, petePosition.x, peteY]);

  // Enhanced position update to track tutorial progress
  const enhancedUpdatePetePosition = useCallback((x: number) => {
    updatePetePosition(x);
    trackTutorialProgress('swipe');
  }, [updatePetePosition, trackTutorialProgress]);

  // AI Player integration (only when AI mode is enabled via environment)
  // Create ref wrapper for AI Player compatibility
  const petePositionRef = useRef({ current: petePosition.x });
  petePositionRef.current.current = petePosition.x;
  
  // Always call useAIPlayer hook, but disable it when not needed
  const aiPlayer = useAIPlayer(
    petePositionRef.current,
    enemies,
    projectiles,
    screenWidth,
    gameAreaHeight,
    {
      updatePetePosition: enhancedUpdatePetePosition,
      shootProjectile: enhancedShootProjectile,
    },
    {
      enabled: isAIModeEnabled && aiEnabled,
      preset: aiPreset,
      decisionInterval: 100,
      enableAnalytics: isAIModeEnabled,
      enablePerformanceMonitoring: isAIModeEnabled,
      onAction: (action, gameState) => {
        // AI Action Executed (logging removed for performance)
        
        // Update current session for real-time analytics display
        const session = aiPlayer?.getAnalyticsSession();
        if (session) {
          setCurrentSession(session);
        }
      }
    }
  );

  // Optimized game input handling (disabled when AI is active)
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useOptimizedGameInputBridge(
    screenWidth,
    enhancedShootProjectile,
    enhancedUpdatePetePosition,
    {
      debounceMs: 16, // 60fps throttling
      disabled: isAIModeEnabled && aiEnabled, // Disable touch input when AI is controlling
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

  // Positions already calculated above

  // Particle effect cleanup and management
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now();
      setActiveParticleEffects(prev => 
        prev.filter(effect => now - effect.startTime < effect.duration + 1000) // Keep for extra 1s for trail fadeout
      );
    };

    const interval = setInterval(cleanup, 500); // Cleanup every 500ms
    return () => clearInterval(interval);
  }, []);

  // Add particle effects for enemy hits (example integration point)
  const addEnemyHitEffect = useCallback((position: { x: number; y: number }, powerUpType?: string) => {
    const effectId = `hit-${Date.now()}-${Math.random()}`;
    const effectType = powerUpType === 'explosive_shot' ? 'explosion' : 'impact';
    const intensity = powerUpType ? 1.0 : 0.7;
    
    setActiveParticleEffects(prev => [...prev, {
      id: effectId,
      type: effectType,
      position,
      intensity,
      duration: effectType === 'explosion' ? 1500 : 800,
      startTime: Date.now(),
    }]);
  }, []);

  // Add power-up activation effect
  const addPowerUpEffect = useCallback((position: { x: number; y: number }) => {
    const effectId = `powerup-${Date.now()}`;
    setActiveParticleEffects(prev => [...prev, {
      id: effectId,
      type: 'power_up',
      position,
      intensity: 1.0,
      duration: 2000,
      startTime: Date.now(),
    }]);
  }, []);

  // Enhanced game state for visual effects
  const enhancedGameState = useMemo(() => ({
    combo: currentCombo,
    recentlyHit: lives < 3, // Simple heuristic for recent damage
    intensity: Math.min(1, currentCombo / 10), // Intensity based on combo
    peteVelocity: { x: 0, y: 0 }, // Could be calculated from position changes
    lastShotTime: Date.now(), // Would need to track actual shot timing
  }), [currentCombo, lives]);

  // Memoized entity arrays - MOVED TO TOP LEVEL TO FIX HOOKS ERROR
  // These must be at the component's top level, not inside conditional rendering
  const memoizedEnemies = useMemo(() => 
    enemies.map(enemy => ({
      id: enemy.id,
      x: enemy.x,
      y: enemy.y,
      width: enemy.size,
      height: enemy.size,
      type: enemy.type,
      sizeLevel: enemy.sizeLevel,
      velocity: { x: enemy.velocityX || 0, y: enemy.velocityY || 0 },
      health: 100,
      maxHealth: 100
    })), [enemies]);

  const memoizedProjectiles = useMemo(() => 
    projectiles.map(projectile => ({
      id: projectile.id,
      x: projectile.x,
      y: projectile.y,
      width: ENTITY_CONFIG.PROJECTILE.SIZE,
      height: ENTITY_CONFIG.PROJECTILE.SIZE,
      velocity: { x: projectile.velocityX || 0, y: projectile.velocityY || -900 },
      powerUpType: projectile.powerUpType,
      age: projectile.age || 0,
      penetration: projectile.penetration || false,
      explosion: projectile.explosion || false
    })), [projectiles]);

  const memoizedMysteryBalloons = useMemo(() => 
    mysteryBalloons.map(mysteryBalloon => ({
      id: mysteryBalloon.id,
      x: mysteryBalloon.position.x,
      y: mysteryBalloon.position.y,
      width: 30,
      height: 30
    })), [mysteryBalloons]);

  return (
    <CelebrationManager>
      <View style={styles.container}>
        {/* Enhanced procedural background */}
        <GameBackground 
          level={level} 
          isPlaying={isPlaying}
          playerPosition={{ x: petePosition.x, y: peteY }}
          gameState={enhancedGameState}
        />

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

          {/* Game entities - All entities now rendered by GameRenderer */}
          {isPlaying && !gameOver && (
            <>
              {/* Performance optimization: Memoized entity arrays to prevent unnecessary re-renders */}
              <GameRenderer
                // Game objects
                pete={{ 
                  x: petePosition.x, 
                  y: peteY, 
                  color: getPeteColor(currentLevel) 
                }}
                enemies={memoizedEnemies}
                projectiles={memoizedProjectiles}
                mysteryBalloons={memoizedMysteryBalloons}
            
            // Screen dimensions
            screenWidth={screenWidth}
            screenHeight={gameAreaHeight}
            
            // Colors and theme
            enemyColor={UI_PALETTE.primary}
            projectileColor={UI_PALETTE.accent}
            mysteryBalloonColor={UI_PALETTE.secondary}
            
            // Performance settings - Simplified without dynamic quality
            enableViewportCulling={true}
            maxVisibleEnemies={20}
            maxVisibleProjectiles={15}
            
            // Game state
            isPlaying={isPlaying}
            isPaused={gameOver}
            
                // Enhanced game state for visual effects
                gameState={enhancedGameState}
              />

              {/* Advanced Particle System for Visual Effects */}
              {activeParticleEffects.map(effect => (
                <AdvancedParticleSystem
                  key={effect.id}
                  emissionPoint={{ x: effect.position.x, y: effect.position.y }}
                  particleType={effect.type}
                  intensity={effect.intensity}
                  duration={effect.duration}
                  maxParticles={effect.type === 'explosion' ? 150 : 50}
                  onComplete={() => {
                    setActiveParticleEffects(prev => 
                      prev.filter(e => e.id !== effect.id)
                    );
                  }}
                />
              ))}

              {/* TODO: Mystery Balloon interaction will be integrated into GameRenderer in future */}
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
                <Text style={styles.gameOverTitle}>GAME OVER</Text>
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
                    // AI Toggle Pressed (logging removed for performance)
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
                      // AI Preset changing (logging removed for performance)
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
                  Game: {isPlaying ? 'Playing' : 'Stopped'} | Enemies: {enemies?.length || 0} | Pete: {Math.round(petePosition.x)}
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
                        // Analytics Export (logging removed for performance)
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
                        // Analytics cleared (logging removed for performance)
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