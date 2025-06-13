import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { GAME_CONFIG } from '@/constants/GameConfig';
import { stateOptimizer } from '@/utils/StateOptimizer';

// UI-only state interface
interface UIState {
  score: number;
  highScore: number;
  level: number;
  lives: number;
  gameOver: boolean;
  isPlaying: boolean;
  isPaused: boolean;
}

interface GameStore extends UIState {
  // Actions - grouped in a stable object
  actions: {
    updateScore: (points: number) => void;
    setGameOver: (gameOver: boolean) => void;
    setLevel: (level: number) => void;
    setLives: (lives: number) => void;
    loseLife: () => void;
    setIsPlaying: (playing: boolean) => void;
    setIsPaused: (paused: boolean) => void;
    resetGame: () => void;
    enemySpawnInterval: () => number;
  };
}

// Create optimized action references with state batching
const createActions = (set: any, get: any) => {
  // Register update handler with state optimizer
  stateOptimizer.registerUpdateHandler('gameStore', (updates) => {
    set(updates);
  });

  return {
    updateScore: (points: number) => {
      const state = get();
      const newScore = state.score + points;
      const newLevel = Math.floor(newScore / GAME_CONFIG.LEVEL_UP_THRESHOLD) + 1;
      
      // Use optimized batched updates
      stateOptimizer.batchUpdates('gameStore', {
        score: newScore,
        highScore: Math.max(newScore, state.highScore),
        level: newLevel !== state.level ? newLevel : state.level,
      }, 'normal');
    },

    setGameOver: (gameOver: boolean) => {
      const state = get();
      stateOptimizer.batchUpdates('gameStore', {
        gameOver,
        highScore: gameOver ? Math.max(state.score, state.highScore) : state.highScore,
      }, 'high'); // High priority for game over
    },

    setLevel: (level: number) => {
      stateOptimizer.batchUpdates('gameStore', { level }, 'normal');
    },

    setLives: (lives: number) => {
      stateOptimizer.batchUpdates('gameStore', { lives }, 'normal');
    },

    loseLife: () => {
      const state = get();
      const newLives = state.lives - 1;
      stateOptimizer.batchUpdates('gameStore', {
        lives: newLives,
        gameOver: newLives <= 0,
      }, 'high'); // High priority for life changes
    },

    setIsPlaying: (playing: boolean) => {
      stateOptimizer.batchUpdates('gameStore', { isPlaying: playing }, 'high');
    },

    setIsPaused: (paused: boolean) => {
      stateOptimizer.batchUpdates('gameStore', { isPaused: paused }, 'high');
    },

    resetGame: () => {
      const state = get();
      stateOptimizer.batchUpdates('gameStore', {
        score: 0,
        lives: 3,
        gameOver: false,
        level: 1,
        isPlaying: true,
        isPaused: false,
        // Preserve high score
        highScore: state.highScore,
      }, 'high'); // High priority for game reset
    },

    enemySpawnInterval: () => {
      const state = get();
      return Math.max(
        GAME_CONFIG.ENEMY_SPAWN_MIN_INTERVAL,
        GAME_CONFIG.ENEMY_SPAWN_BASE_INTERVAL - state.level * GAME_CONFIG.ENEMY_SPAWN_LEVEL_REDUCTION
      );
    },
  };
};

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => {
    // Create actions once
    const actions = createActions(set, get);

    return {
      // Initial UI state only
      score: 0,
      highScore: 0,
      lives: 3,
      gameOver: false,
      level: 1,
      isPlaying: false,
      isPaused: false,
      actions, // Stable reference to actions
    };
  })
);

// Define the return type for UI state only
export type UIStateSnapshot = {
  score: number;
  highScore: number;
  level: number;
  lives: number;
  gameOver: boolean;
  isPlaying: boolean;
  isPaused: boolean;
};

// DEPRECATED: This hook is an anti-pattern and causes performance issues.
// It creates a new object on every render, which breaks React's memoization
// and can lead to infinite re-render loops.
//
// ERROR: "Warning: The result of getSnapshot should be cached to avoid an infinite loop"
//
// INSTEAD, use the individual, granular selectors below (e.g., useScore(), useIsPlaying()).
// This ensures components only re-render when the specific state they need changes.
export const useUIState = (): UIStateSnapshot => {
  const score = useGameStore(state => state.score);
  const highScore = useGameStore(state => state.highScore);
  const level = useGameStore(state => state.level);
  const lives = useGameStore(state => state.lives);
  const gameOver = useGameStore(state => state.gameOver);
  const isPlaying = useGameStore(state => state.isPlaying);
  const isPaused = useGameStore(state => state.isPaused);

  return { score, highScore, level, lives, gameOver, isPlaying, isPaused };
};

// Actions selector - returns stable reference
export const useGameActions = () => useGameStore(state => state.actions);

// Individual UI state selectors
export const useScore = () => useGameStore(state => state.score);
export const useHighScore = () => useGameStore(state => state.highScore);
export const useLevel = () => useGameStore(state => state.level);
export const useLives = () => useGameStore(state => state.lives);
export const useGameOver = () => useGameStore(state => state.gameOver);
export const useIsPlaying = () => useGameStore(state => state.isPlaying);
export const useIsPaused = () => useGameStore(state => state.isPaused);
