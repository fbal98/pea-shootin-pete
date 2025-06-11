import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { GAME_CONFIG } from '@/constants/GameConfig';

// UI-only state interface
interface UIState {
  score: number;
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

// Create UI-only action references
const createActions = (set: any, get: any) => ({
  updateScore: (points: number) =>
    set((state: GameStore) => {
      const newScore = state.score + points;
      const newLevel = Math.floor(newScore / GAME_CONFIG.LEVEL_UP_THRESHOLD) + 1;
      return {
        score: newScore,
        level: newLevel !== state.level ? newLevel : state.level,
      };
    }),

  setGameOver: (gameOver: boolean) => set({ gameOver }),

  setLevel: (level: number) => set({ level }),

  setLives: (lives: number) => set({ lives }),

  loseLife: () => set((state: GameStore) => {
    const newLives = state.lives - 1;
    return {
      lives: newLives,
      gameOver: newLives <= 0,
    };
  }),

  setIsPlaying: (playing: boolean) => set({ isPlaying: playing }),

  setIsPaused: (paused: boolean) => set({ isPaused: paused }),

  resetGame: () =>
    set({
      score: 0,
      lives: 3,
      gameOver: false,
      level: 1,
      isPlaying: true,
      isPaused: false,
    }),

  enemySpawnInterval: () => {
    const state = get();
    return Math.max(
      GAME_CONFIG.ENEMY_SPAWN_MIN_INTERVAL,
      GAME_CONFIG.ENEMY_SPAWN_BASE_INTERVAL - state.level * GAME_CONFIG.ENEMY_SPAWN_LEVEL_REDUCTION
    );
  },
});

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => {
    // Create actions once
    const actions = createActions(set, get);

    return {
      // Initial UI state only
      score: 0,
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
  level: number;
  lives: number;
  gameOver: boolean;
  isPlaying: boolean;
  isPaused: boolean;
};

// Selector for UI state
export const useUIState = (): UIStateSnapshot => {
  const score = useGameStore(state => state.score);
  const level = useGameStore(state => state.level);
  const lives = useGameStore(state => state.lives);
  const gameOver = useGameStore(state => state.gameOver);
  const isPlaying = useGameStore(state => state.isPlaying);
  const isPaused = useGameStore(state => state.isPaused);

  return { score, level, lives, gameOver, isPlaying, isPaused };
};

// Actions selector - returns stable reference
export const useGameActions = () => useGameStore(state => state.actions);

// Individual UI state selectors
export const useScore = () => useGameStore(state => state.score);
export const useLevel = () => useGameStore(state => state.level);
export const useLives = () => useGameStore(state => state.lives);
export const useGameOver = () => useGameStore(state => state.gameOver);
export const useIsPlaying = () => useGameStore(state => state.isPlaying);
export const useIsPaused = () => useGameStore(state => state.isPaused);
