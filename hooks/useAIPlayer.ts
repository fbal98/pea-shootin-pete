/**
 * React hook to integrate Pete AI with the game
 * Add this to useGameLogic or GameScreen to enable AI mode
 */

import { useEffect, useRef, useCallback } from 'react';
import { peteAI, AIConfig, GameState, AIAction, DEFAULT_AI_CONFIG, AI_PRESETS } from '@/pete_ai';
import { useGameStore } from '@/store/gameStore';
import { useLevelProgressionStore } from '@/store/levelProgressionStore';
import { aiAnalytics } from '@/utils/AIAnalytics';

interface UseAIPlayerOptions {
  enabled: boolean;
  config?: AIConfig;
  preset?: keyof typeof AI_PRESETS;
  decisionInterval?: number; // ms between AI decisions (default: 100ms)
  onAction?: (action: AIAction, gameState: GameState) => void;
  enableAnalytics?: boolean; // Enable comprehensive analytics collection
  enablePerformanceMonitoring?: boolean; // Enable FPS and memory tracking
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
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const performanceIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const gameHistoryRef = useRef<Array<{ state: GameState; action: AIAction; timestamp: number }>>([]);
  const sessionIdRef = useRef<string | null>(null);
  const decisionStartTimeRef = useRef<number>(0);
  const shotCounterRef = useRef<number>(0);
  
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
  
  const makeAIDecision = useCallback(() => {
    const state = latestStateRef.current;
    decisionStartTimeRef.current = Date.now();
    
    console.log('🤖 AI Decision Cycle Starting...', {
      enabled: state.options.enabled,
      isPlaying: state.isPlaying,
      isPaused: state.isPaused,
      peteX: state.petePosition.current,
      enemyCount: state.enemies?.length || 0,
      projectileCount: state.projectiles?.length || 0
    });
    
    if (!state.options.enabled) {
      console.log('🤖 AI DISABLED - options.enabled =', state.options.enabled);
      return;
    }
    
    if (!state.isPlaying) {
      console.log('🤖 AI SKIPPING - Game not playing. isPlaying =', state.isPlaying);
      return;
    }
    
    if (state.isPaused) {
      console.log('🤖 AI SKIPPING - Game paused. isPaused =', state.isPaused);
      return;
    }
    
    console.log('🤖 AI ACTIVE - Making decision...', {
      petePosition: state.petePosition.current,
      screenDimensions: { width: state.screenWidth, height: state.screenHeight },
      gameState: { isPlaying: state.isPlaying, isPaused: state.isPaused, score: state.score, lives: state.lives }
    });
    
    // Prepare game state for AI
    const gameState: GameState = {
      peteX: state.petePosition.current,
      peteY: state.screenHeight - 50, // Approximate Pete Y position
      screenWidth: state.screenWidth,
      screenHeight: state.screenHeight,
      enemies: (state.enemies || []).map(enemy => ({
        x: enemy.x,
        y: enemy.y,
        vx: enemy.vx || 0,
        vy: enemy.vy || 0,
        size: enemy.size || 30,
        id: enemy.id || Math.random().toString(),
      })),
      projectiles: (state.projectiles || []).map(projectile => ({
        x: projectile.x,
        y: projectile.y,
        id: projectile.id || Math.random().toString(),
      })),
      isPlaying: state.isPlaying,
      isPaused: state.isPaused,
      score: state.score,
      lives: state.lives,
      gameOver: gameOver,
      level: level,
    };
    
    // Detect threats for analytics
    if (state.options.enableAnalytics) {
      const closeEnemies = gameState.enemies.filter(enemy => 
        Math.abs(enemy.x - gameState.peteX) < 80
      );
      
      if (closeEnemies.length > 0) {
        const closestEnemy = closeEnemies.reduce((closest, enemy) => 
          Math.abs(enemy.x - gameState.peteX) < Math.abs(closest.x - gameState.peteX) ? enemy : closest
        );
        
        const threatLevel = Math.max(1, 100 - Math.abs(closestEnemy.x - gameState.peteX));
        aiAnalytics.recordThreatDetected(threatLevel, { x: closestEnemy.x, y: closestEnemy.y });
      }
    }
    
    console.log('🤖 AI Game State:', {
      peteX: gameState.peteX,
      enemyCount: gameState.enemies.length,
      projectileCount: gameState.projectiles.length,
      enemies: gameState.enemies.map(e => ({ x: e.x, y: e.y, size: e.size })),
      projectiles: gameState.projectiles.map(p => ({ x: p.x, y: p.y }))
    });
    
    // Get AI decision
    console.log('🤖 Calling peteAI with config:', state.aiConfig);
    const action = peteAI(gameState, state.aiConfig);
    console.log('🤖 AI Decision Result:', action);
    
    // Calculate reaction time and record decision for analytics
    const reactionTime = Date.now() - decisionStartTimeRef.current;
    if (state.options.enableAnalytics) {
      aiAnalytics.recordDecision(action, gameState, reactionTime);
    }
    
    // Record for analytics
    gameHistoryRef.current.push({
      state: gameState,
      action,
      timestamp: Date.now(),
    });
    
    // Execute AI action
    console.log('🤖 Executing AI action:', action.type);
    switch (action.type) {
      case 'shoot':
        console.log('🤖 SHOOTING projectile');
        // Record shot for analytics before shooting
        if (state.options.enableAnalytics) {
          const targetEnemy = gameState.enemies
            .filter(e => Math.abs(e.x - gameState.peteX) < 100)
            .reduce((closest, enemy) => 
              Math.abs(enemy.x - gameState.peteX) < Math.abs(closest.x - gameState.peteX) ? enemy : closest
            , gameState.enemies[0]);
          
          if (targetEnemy) {
            const shotId = aiAnalytics.recordShot(targetEnemy.x, targetEnemy.y);
            shotCounterRef.current = shotId;
          }
        }
        state.gameLogic.shootProjectile();
        break;
      case 'move':
        if (action.x !== undefined) {
          console.log('🤖 MOVING Pete to X:', action.x);
          // Record dodge for analytics if moving away from threat
          if (state.options.enableAnalytics) {
            const wasAvoidingThreat = gameState.enemies.some(e => 
              Math.abs(e.x - gameState.peteX) < 60
            );
            if (wasAvoidingThreat) {
              aiAnalytics.recordDodge(action.x);
            }
          }
          state.gameLogic.updatePetePosition(action.x);
        }
        break;
      case 'idle':
        console.log('🤖 IDLE - no action taken');
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
      console.log('🎯 Analytics session started:', sessionIdRef.current);
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
        console.log('🎯 Analytics session completed:', {
          sessionId: session.sessionId,
          metrics: session.metrics,
          insights: session.insights,
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
    console.log('🤖 AI Interval Effect Triggered:', {
      enabled: options.enabled,
      isPlaying,
      isPaused,
      shouldStart: options.enabled && isPlaying && !isPaused
    });
    
    if (options.enabled && isPlaying && !isPaused) {
      const interval = options.decisionInterval || 100; // 10 decisions per second
      console.log('🤖 STARTING AI Interval with', interval, 'ms');
      
      intervalRef.current = setInterval(() => {
        // Call the decision function directly to avoid stale closure issues
        makeAIDecision();
      }, interval);
      
      return () => {
        console.log('🤖 STOPPING AI Interval');
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      console.log('🤖 AI Interval NOT started - conditions not met');
      if (intervalRef.current) {
        console.log('🤖 Clearing existing interval');
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
export const AI_MODE_ENABLED = process.env.EXPO_PUBLIC_AI_MODE === 'true' || __DEV__;

// Default options for comprehensive analytics
export const DEFAULT_AI_OPTIONS: UseAIPlayerOptions = {
  enabled: AI_MODE_ENABLED,
  enableAnalytics: true,
  enablePerformanceMonitoring: true,
  decisionInterval: 100,
};

// Note: AIDebugPanel is implemented directly in GameScreen.tsx
// This component was moved to avoid HTML element usage in React Native