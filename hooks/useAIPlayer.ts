/**
 * React hook to integrate Pete AI with the game
 * Add this to useGameLogic or GameScreen to enable AI mode
 */

import { useEffect, useRef, useCallback } from 'react';
import { peteAI, AIConfig, GameState, AIAction, DEFAULT_AI_CONFIG, AI_PRESETS } from '@/pete_ai';
import { useGameStore } from '@/store/gameStore';
import { useLevelProgressionStore } from '@/store/levelProgressionStore';

interface UseAIPlayerOptions {
  enabled: boolean;
  config?: AIConfig;
  preset?: keyof typeof AI_PRESETS;
  decisionInterval?: number; // ms between AI decisions (default: 100ms)
  onAction?: (action: AIAction, gameState: GameState) => void;
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
  const gameHistoryRef = useRef<Array<{ state: GameState; action: AIAction; timestamp: number }>>([]);
  
  // Get game state from stores
  const isPlaying = useGameStore(state => state.isPlaying);
  const isPaused = useGameStore(state => state.isPaused);
  const score = useGameStore(state => state.score);
  const lives = useGameStore(state => state.lives);
  
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
    };
    
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
        state.gameLogic.shootProjectile();
        break;
      case 'move':
        console.log('🤖 MOVING Pete to X:', action.x);
        state.gameLogic.updatePetePosition(action.x);
        break;
      case 'idle':
        console.log('🤖 IDLE - no action taken');
        break;
    }
    
    // Call optional callback
    state.options.onAction?.(action, gameState);
    
  }, []); // No dependencies needed since we use refs
  
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
        intervalRef.current = undefined;
      }
    }
  }, [options.enabled, isPlaying, isPaused, options.decisionInterval]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  // Return AI metrics and controls
  return {
    gameHistory: gameHistoryRef.current,
    clearHistory: () => { gameHistoryRef.current = []; },
    getCurrentConfig: () => aiConfig,
  };
}

// Environment variable or feature flag to enable AI mode
export const AI_MODE_ENABLED = process.env.EXPO_PUBLIC_AI_MODE === 'true' || __DEV__;

// Note: AIDebugPanel is implemented directly in GameScreen.tsx
// This component was moved to avoid HTML element usage in React Native