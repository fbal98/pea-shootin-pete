import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { GAME_CONFIG } from '@/constants/GameConfig';
import { stateOptimizer } from '@/utils/StateOptimizer';

// Power-up state interface
interface PowerUpState {
  activePowerUp: string | null;
  powerUpDuration: number; // remaining duration in milliseconds
  powerUpStartTime: number; // when the power-up was activated
}

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

interface GameStoreState extends UIState, PowerUpState {}

interface GameStore extends GameStoreState {
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
    // Power-up actions
    activatePowerUp: (powerUpType: string, duration: number) => void;
    clearPowerUp: () => void;
    updatePowerUpDuration: (deltaTime: number) => void;
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
        // Reset power-ups
        activePowerUp: null,
        powerUpDuration: 0,
        powerUpStartTime: 0,
      }, 'high'); // High priority for game reset
    },

    enemySpawnInterval: () => {
      const state = get();
      return Math.max(
        GAME_CONFIG.ENEMY_SPAWN_MIN_INTERVAL,
        GAME_CONFIG.ENEMY_SPAWN_BASE_INTERVAL - state.level * GAME_CONFIG.ENEMY_SPAWN_LEVEL_REDUCTION
      );
    },

    // === POWER-UP SYSTEM ACTIONS ===
    activatePowerUp: (powerUpType: string, duration: number) => {
      stateOptimizer.batchUpdates('gameStore', {
        activePowerUp: powerUpType,
        powerUpDuration: duration,
        powerUpStartTime: Date.now(),
      }, 'high'); // High priority for power-up activation
    },

    clearPowerUp: () => {
      stateOptimizer.batchUpdates('gameStore', {
        activePowerUp: null,
        powerUpDuration: 0,
        powerUpStartTime: 0,
      }, 'normal');
    },

    updatePowerUpDuration: (deltaTime: number) => {
      const state = get();
      if (state.activePowerUp && state.powerUpDuration > 0) {
        const newDuration = Math.max(0, state.powerUpDuration - deltaTime * 1000); // deltaTime is in seconds
        if (newDuration <= 0) {
          // Power-up expired
          stateOptimizer.batchUpdates('gameStore', {
            activePowerUp: null,
            powerUpDuration: 0,
            powerUpStartTime: 0,
          }, 'normal');
        } else {
          stateOptimizer.batchUpdates('gameStore', {
            powerUpDuration: newDuration,
          }, 'low'); // Low priority for duration updates
        }
      }
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
      // Initial power-up state
      activePowerUp: null,
      powerUpDuration: 0,
      powerUpStartTime: 0,
      actions, // Stable reference to actions
    };
  })
);

// =============================================================================
// ⚠️  ANTI-PATTERN PREVENTION
// =============================================================================
//
// DO NOT create composite selectors that return new objects on every render.
// This breaks React's memoization and causes infinite re-render loops.
//
// ❌ NEVER DO THIS:
// export const useMultipleValues = () => useGameStore(state => ({
//   score: state.score,
//   lives: state.lives,
//   gameOver: state.gameOver
// })); // <-- NEW OBJECT EVERY RENDER = INFINITE LOOPS
//
// ✅ ALWAYS DO THIS INSTEAD:
// export const useScore = () => useGameStore(state => state.score);
// export const useLives = () => useGameStore(state => state.lives);
// export const useGameOver = () => useGameStore(state => state.gameOver);
//
// Components should subscribe to individual, primitive state values only.
// =============================================================================

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

// Power-up state selectors
export const useActivePowerUp = () => useGameStore(state => state.activePowerUp);
export const usePowerUpDuration = () => useGameStore(state => state.powerUpDuration);
export const usePowerUpStartTime = () => useGameStore(state => state.powerUpStartTime);
