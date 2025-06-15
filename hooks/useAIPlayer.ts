/**
 * React hook to integrate Pete AI with the game
 * Add this to useGameLogic or GameScreen to enable AI mode
 */

import { useEffect, useRef, useCallback } from 'react';
import { peteAI, AIConfig, GameState, AIAction, DEFAULT_AI_CONFIG, AI_PRESETS } from '@/pete_ai';
import { useGameStore } from '@/store/gameStore';
import { useLevelProgressionStore } from '@/store/levelProgressionStore';
import { aiAnalytics } from '@/utils/AIAnalytics';

// Debug mode for AI logging (only in development with explicit flag)
const AI_DEBUG_MODE = __DEV__ && process.env.EXPO_PUBLIC_AI_DEBUG === 'true';

const debugLog = (message: string, data?: any) => {
  if (AI_DEBUG_MODE) {
    console.log(message, data);
  }
};

interface UseAIPlayerOptions {
  enabled: boolean;
  config?: AIConfig;
  preset?: keyof typeof AI_PRESETS;
  decisionInterval?: number; // ms between AI decisions (default: 100ms)
  onAction?: (action: AIAction, gameState: GameState) => void;
  enableAnalytics?: boolean; // Enable comprehensive analytics collection
  enablePerformanceMonitoring?: boolean; // Enable FPS and memory tracking
}

// Maximum history size to prevent memory leaks
const MAX_HISTORY_SIZE = 100;

// Performance optimizations
interface EnemyAnalysis {
  shootable: any[];
  threatening: any[];
  closest: any | null;
  averageDistance: number;
  totalCount: number;
}

export function useAIPlayer(
  petePosition: { current: number },
  enemies: Array<any> | undefined,
  projectiles: Array<any> | undefined,
  screenWidth: number,
  screenHeight: number,
  gameLogic: {
    updatePetePosition: (x: number) => void;
    shootProjectile: () => void;
  },
  options: UseAIPlayerOptions
) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const performanceIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const gameHistoryRef = useRef<Array<{ state: GameState; action: AIAction; timestamp: number }>>([]);
  const sessionIdRef = useRef<string | null>(null);
  const decisionStartTimeRef = useRef<number>(0);
  const shotCounterRef = useRef<number>(0);
  const lastAnalyticsRecordRef = useRef<number>(0);
  
  // Object caching for performance
  const enemyTransformCacheRef = useRef(new WeakMap());
  const projectileTransformCacheRef = useRef(new WeakMap());
  
  // Get game state from stores
  const isPlaying = useGameStore(state => state.isPlaying);
  const isPaused = useGameStore(state => state.isPaused);
  const gameOver = useGameStore(state => state.gameOver);
  const score = useGameStore(state => state.score);
  const lives = useGameStore(state => state.lives);
  const currentLevel = useLevelProgressionStore(state => state.currentLevel);
  const level = typeof currentLevel?.id === 'number' ? currentLevel.id : 1;
  
  // Get AI config
  const aiConfig = options.preset 
    ? AI_PRESETS[options.preset]
    : options.config || DEFAULT_AI_CONFIG;

  // Store latest values in refs to avoid stale closures
  const latestStateRef = useRef({
    petePosition,
    enemies: enemies || [],
    projectiles: projectiles || [],
    screenWidth,
    screenHeight,
    isPlaying,
    isPaused,
    score,
    lives,
    gameLogic,
    aiConfig,
    options
  });

  // Update refs on every render (with safety checks)
  latestStateRef.current = {
    petePosition,
    enemies: enemies || [],
    projectiles: projectiles || [],
    screenWidth,
    screenHeight,
    isPlaying,
    isPaused,
    score,
    lives,
    gameLogic,
    aiConfig,
    options
  };

  /**
   * Optimized enemy analysis - single pass through enemies array
   */
  const analyzeEnemies = useCallback((enemies: any[], peteX: number, config: AIConfig): EnemyAnalysis => {
    const analysis: EnemyAnalysis = {
      shootable: [],
      threatening: [],
      closest: null,
      averageDistance: 0,
      totalCount: enemies.length
    };

    if (enemies.length === 0) {
      return analysis;
    }

    let totalDistance = 0;
    let minDistance = Infinity;

    // Single pass through enemies array for all calculations
    for (const enemy of enemies) {
      const distance = Math.abs(enemy.x - peteX);
      totalDistance += distance;

      // Check shootability
      if (distance <= config.shootThreshold) {
        analysis.shootable.push(enemy);
      }
      
      // Check if threatening
      if (distance <= config.avoidThreshold) {
        analysis.threatening.push(enemy);
      }

      // Track closest enemy
      if (distance < minDistance) {
        minDistance = distance;
        analysis.closest = enemy;
      }
    }

    analysis.averageDistance = totalDistance / enemies.length;
    return analysis;
  }, []);

  /**
   * Create optimized game state with object caching
   */
  const createOptimizedGameState = useCallback((state: any, enemyAnalysis: EnemyAnalysis): GameState => {
    // Use cached transformations where possible
    const optimizedEnemies = state.enemies.map((enemy: any) => {
      if (!enemyTransformCacheRef.current.has(enemy)) {
        enemyTransformCacheRef.current.set(enemy, {
          x: enemy.x,
          y: enemy.y,
          vx: enemy.vx || 0,
          vy: enemy.vy || 0,
          size: enemy.size || 30,
          id: enemy.id || Math.random().toString(),
        });
      }
      return enemyTransformCacheRef.current.get(enemy);
    });

    const optimizedProjectiles = state.projectiles.map((projectile: any) => {
      if (!projectileTransformCacheRef.current.has(projectile)) {
        projectileTransformCacheRef.current.set(projectile, {
          x: projectile.x,
          y: projectile.y,
          id: projectile.id || Math.random().toString(),
        });
      }
      return projectileTransformCacheRef.current.get(projectile);
    });

    return {
      peteX: state.petePosition.current,
      peteY: state.screenHeight - 50,
      screenWidth: state.screenWidth,
      screenHeight: state.screenHeight,
      enemies: optimizedEnemies,
      projectiles: optimizedProjectiles,
      isPlaying: state.isPlaying,
      isPaused: state.isPaused,
      score: state.score,
      lives: state.lives,
      gameOver: gameOver,
      level: level,
    };
  }, [gameOver, level]);

  /**
   * Check if analytics should be recorded (throttled)
   */
  const shouldRecordAnalytics = useCallback((): boolean => {
    if (!options.enableAnalytics) return false;
    
    const now = Date.now();
    if (now - lastAnalyticsRecordRef.current < 500) return false; // Throttle to 2Hz
    lastAnalyticsRecordRef.current = now;
    return true;
  }, [options.enableAnalytics]);

  /**
   * Add entry to game history with size management
   */
  const addToHistory = useCallback((state: GameState, action: AIAction) => {
    const entry = { state, action, timestamp: Date.now() };
    
    if (gameHistoryRef.current.length >= MAX_HISTORY_SIZE) {
      // Remove oldest 50% when limit reached
      gameHistoryRef.current = gameHistoryRef.current.slice(-50);
    }
    
    gameHistoryRef.current.push(entry);
  }, []);
  
  const makeAIDecision = useCallback(() => {
    const state = latestStateRef.current;
    decisionStartTimeRef.current = Date.now();
    
    debugLog('🤖 AI Decision Cycle Starting...', {
      enabled: state.options.enabled,
      isPlaying: state.isPlaying,
      isPaused: state.isPaused,
      enemyCount: state.enemies?.length || 0
    });
    
    // Early returns for performance
    if (!state.options.enabled || !state.isPlaying || state.isPaused) {
      return;
    }
    
    debugLog('🤖 AI ACTIVE - Making decision...', {
      petePosition: state.petePosition.current,
      enemyCount: state.enemies?.length || 0
    });
    
    // Use optimized enemy analysis
    const enemyAnalysis = analyzeEnemies(state.enemies, state.petePosition.current, state.aiConfig);
    
    // Only perform expensive analytics if enabled and throttled
    let analyticsData = null;
    if (shouldRecordAnalytics() && enemyAnalysis.closest) {
      const threatLevel = Math.max(1, 100 - Math.abs(enemyAnalysis.closest.x - state.petePosition.current));
      aiAnalytics.recordThreatDetected(threatLevel, { x: enemyAnalysis.closest.x, y: enemyAnalysis.closest.y });
      analyticsData = { threatLevel, closestEnemy: enemyAnalysis.closest };
    }
    
    // Create optimized game state using cached objects
    const gameState = createOptimizedGameState(state, enemyAnalysis);
    
    debugLog('🤖 AI Game State:', {
      peteX: gameState.peteX,
      enemyCount: gameState.enemies.length,
      shootableEnemies: enemyAnalysis.shootable.length,
      threateningEnemies: enemyAnalysis.threatening.length
    });
    
    // Get AI decision
    debugLog('🤖 Calling peteAI with config:', state.aiConfig);
    const action = peteAI(gameState, state.aiConfig);
    debugLog('🤖 AI Decision Result:', action);
    
    // Calculate reaction time and record decision for analytics
    const reactionTime = Date.now() - decisionStartTimeRef.current;
    if (shouldRecordAnalytics()) {
      aiAnalytics.recordDecision(action, gameState, reactionTime);
    }
    
    // Add to history with size management
    addToHistory(gameState, action);
    
    // Execute AI action
    debugLog('🤖 Executing AI action:', action.type);
    switch (action.type) {
      case 'shoot':
        debugLog('🤖 SHOOTING projectile');
        // Record shot for analytics before shooting
        if (shouldRecordAnalytics() && enemyAnalysis.shootable.length > 0) {
          const targetEnemy = enemyAnalysis.shootable[0]; // Use pre-analyzed closest shootable enemy
          const shotId = aiAnalytics.recordShot(targetEnemy.x, targetEnemy.y);
          shotCounterRef.current = shotId;
        }
        state.gameLogic.shootProjectile();
        break;
      case 'move':
        if (action.x !== undefined) {
          debugLog('🤖 MOVING Pete to X:', action.x);
          // Record dodge for analytics if moving away from threat
          if (shouldRecordAnalytics() && enemyAnalysis.threatening.length > 0) {
            aiAnalytics.recordDodge(action.x);
          }
          state.gameLogic.updatePetePosition(action.x);
        }
        break;
      case 'idle':
        debugLog('🤖 IDLE - no action taken');
        break;
    }
    
    // Call optional callback
    state.options.onAction?.(action, gameState);
    
  }, []); // No dependencies needed since we use refs
  
  // Start analytics session when AI becomes active
  useEffect(() => {
    if (options.enabled && options.enableAnalytics && isPlaying && !isPaused && !sessionIdRef.current) {
      sessionIdRef.current = aiAnalytics.startSession({
        config: aiConfig,
        preset: options.preset,
        level: level,
      });
      debugLog('🎯 Analytics session started:', sessionIdRef.current);
    }
  }, [options.enabled, options.enableAnalytics, isPlaying, isPaused]);
  
  // End analytics session when game ends
  useEffect(() => {
    if (sessionIdRef.current && (gameOver || !isPlaying)) {
      const finalGameState: GameState = {
        peteX: petePosition.current,
        peteY: screenHeight - 50,
        screenWidth,
        screenHeight,
        enemies: enemies || [],
        projectiles: projectiles || [],
        isPlaying,
        isPaused,
        score,
        lives,
        gameOver,
        level,
      };
      
      const session = aiAnalytics.endSession(finalGameState, gameHistoryRef.current);
      if (session) {
        debugLog('🎯 Analytics session completed:', {
          sessionId: session.sessionId,
          score: session.metrics?.score,
          accuracy: session.metrics?.accuracy,
          duration: session.endTime ? session.endTime - session.startTime : 0
        });
      }
      
      sessionIdRef.current = null;
      gameHistoryRef.current = [];
    }
  }, [gameOver, isPlaying]);
  
  // Set up performance monitoring
  useEffect(() => {
    if (options.enabled && options.enablePerformanceMonitoring && isPlaying && !isPaused) {
      performanceIntervalRef.current = setInterval(() => {
        // Get performance metrics (mock implementation - would need platform-specific code)
        const fps = 60; // Would get from performance monitor
        const memoryMB = Math.random() * 100 + 50; // Mock memory usage
        
        if (options.enableAnalytics) {
          aiAnalytics.recordPerformance(fps, memoryMB);
        }
      }, 1000); // Check performance every second
      
      return () => {
        if (performanceIntervalRef.current) {
          clearInterval(performanceIntervalRef.current);
        }
      };
    }
  }, [options.enabled, options.enablePerformanceMonitoring, isPlaying, isPaused]);
  
  // Set up AI decision interval
  useEffect(() => {
    debugLog('🤖 AI Interval Effect Triggered:', {
      enabled: options.enabled,
      isPlaying,
      isPaused,
      shouldStart: options.enabled && isPlaying && !isPaused
    });
    
    if (options.enabled && isPlaying && !isPaused) {
      const interval = options.decisionInterval || 100; // 10 decisions per second
      debugLog(`🤖 STARTING AI Interval with ${interval} ms`);
      
      intervalRef.current = setInterval(() => {
        // Call the decision function directly to avoid stale closure issues
        makeAIDecision();
      }, interval);
      
      return () => {
        debugLog('🤖 STOPPING AI Interval');
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      debugLog('🤖 AI Interval NOT started - conditions not met');
      if (intervalRef.current) {
        debugLog('🤖 Clearing existing interval');
        clearInterval(intervalRef.current);
        intervalRef.current = undefined as any;
      }
    }
  }, [options.enabled, isPlaying, isPaused, options.decisionInterval]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (performanceIntervalRef.current) {
        clearInterval(performanceIntervalRef.current);
      }
      
      // End analytics session if still active
      if (sessionIdRef.current) {
        const finalGameState: GameState = {
          peteX: petePosition.current,
          peteY: screenHeight - 50,
          screenWidth,
          screenHeight,
          enemies: enemies || [],
          projectiles: projectiles || [],
          isPlaying,
          isPaused,
          score,
          lives,
          gameOver,
          level,
        };
        aiAnalytics.endSession(finalGameState, gameHistoryRef.current);
        sessionIdRef.current = null;
      }
    };
  }, []);
  
  // Return AI metrics and controls
  return {
    gameHistory: gameHistoryRef.current,
    clearHistory: () => { 
      gameHistoryRef.current = [];
      if (sessionIdRef.current) {
        // Restart session after clearing
        aiAnalytics.endSession({
          peteX: petePosition.current,
          peteY: screenHeight - 50,
          screenWidth,
          screenHeight,
          enemies: enemies || [],
          projectiles: projectiles || [],
          isPlaying,
          isPaused,
          score,
          lives,
          gameOver,
          level,
        }, []);
        if (options.enableAnalytics && isPlaying) {
          sessionIdRef.current = aiAnalytics.startSession({
            config: aiConfig,
            preset: options.preset,
            level: level,
          });
        }
      }
    },
    getCurrentConfig: () => aiConfig,
    getAnalyticsSession: () => aiAnalytics.getCurrentSessionAnalytics(),
    exportAnalytics: () => aiAnalytics.exportAnalyticsData(),
    clearAnalytics: () => aiAnalytics.clearAnalyticsData(),
    recordHit: (shotId: number, enemyX: number, enemyY: number) => {
      if (options.enableAnalytics) {
        aiAnalytics.recordHit(shotId, enemyX, enemyY);
      }
    },
    recordMiss: (shotId: number) => {
      if (options.enableAnalytics) {
        aiAnalytics.recordMiss(shotId);
      }
    },
  };
}

// Environment variable or feature flag to enable AI mode
export const AI_MODE_ENABLED = process.env.EXPO_PUBLIC_AI_MODE === 'true';

// Default options for comprehensive analytics
export const DEFAULT_AI_OPTIONS: UseAIPlayerOptions = {
  enabled: AI_MODE_ENABLED,
  enableAnalytics: true,
  enablePerformanceMonitoring: true,
  decisionInterval: 100,
};

// Note: AIDebugPanel is implemented directly in GameScreen.tsx
// This component was moved to avoid HTML element usage in React Native