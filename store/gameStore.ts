import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { GameObject, GameState } from '@/utils/gameEngine';
import { GAME_CONFIG } from '@/constants/GameConfig';

interface GameStore extends GameState {
  // UI State
  isPlaying: boolean;
  isPaused: boolean;
  lastUpdateTime: number;
  lastEnemySpawnTime: number;

  // Actions - grouped in a stable object
  actions: {
    setPete: (pete: GameObject) => void;
    setEnemies: (enemies: GameObject[]) => void;
    setProjectiles: (projectiles: GameObject[]) => void;
    addEnemy: (enemy: GameObject) => void;
    addProjectile: (projectile: GameObject) => void;
    removeEnemy: (enemyId: string) => void;
    removeProjectile: (projectileId: string) => void;
    updateScore: (points: number) => void;
    setGameOver: (gameOver: boolean) => void;
    setLevel: (level: number) => void;
    setIsPlaying: (playing: boolean) => void;
    setIsPaused: (paused: boolean) => void;
    setLastUpdateTime: (time: number) => void;
    setLastEnemySpawnTime: (time: number) => void;
    resetGame: (screenWidth: number, gameAreaBottom: number) => void;
    enemySpawnInterval: () => number;
  };
}

// Create stable action references outside the store
const createActions = (set: any, get: any) => ({
  setPete: (pete: GameObject) => set({ pete }),

  setEnemies: (enemies: GameObject[]) => set({ enemies }),

  setProjectiles: (projectiles: GameObject[]) => set({ projectiles }),

  addEnemy: (enemy: GameObject) =>
    set((state: GameStore) => ({
      enemies: [...state.enemies, enemy],
    })),

  addProjectile: (projectile: GameObject) =>
    set((state: GameStore) => ({
      projectiles: [...state.projectiles, projectile],
    })),

  removeEnemy: (enemyId: string) =>
    set((state: GameStore) => ({
      enemies: state.enemies.filter((enemy: GameObject) => enemy.id !== enemyId),
    })),

  removeProjectile: (projectileId: string) =>
    set((state: GameStore) => ({
      projectiles: state.projectiles.filter(
        (projectile: GameObject) => projectile.id !== projectileId
      ),
    })),

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

  setIsPlaying: (playing: boolean) => set({ isPlaying: playing }),

  setIsPaused: (paused: boolean) => set({ isPaused: paused }),

  setLastUpdateTime: (time: number) => set({ lastUpdateTime: time }),

  setLastEnemySpawnTime: (time: number) => set({ lastEnemySpawnTime: time }),

  resetGame: (screenWidth: number, gameAreaBottom: number) =>
    set({
      pete: {
        id: 'pete',
        x: screenWidth / 2 - GAME_CONFIG.PETE_SIZE / 2,
        y: gameAreaBottom - GAME_CONFIG.PETE_SIZE - 10,
        width: GAME_CONFIG.PETE_SIZE,
        height: GAME_CONFIG.PETE_SIZE,
      },
      enemies: [],
      projectiles: [],
      score: 0,
      gameOver: false,
      level: 1,
      isPlaying: true,
      isPaused: false,
      lastUpdateTime: 0,
      lastEnemySpawnTime: 0,
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
      // Initial state
      pete: {
        id: 'pete',
        x: 0, // Will be set properly on reset
        y: 0, // Will be set properly on reset
        width: GAME_CONFIG.PETE_SIZE,
        height: GAME_CONFIG.PETE_SIZE,
      },
      enemies: [],
      projectiles: [],
      score: 0,
      gameOver: false,
      level: 1,
      isPlaying: false,
      isPaused: false,
      lastUpdateTime: 0,
      lastEnemySpawnTime: 0,
      actions, // Stable reference to actions
    };
  })
);

// Define the return type for game state
type GameStateSnapshot = {
  pete: GameObject;
  enemies: GameObject[];
  projectiles: GameObject[];
  score: number;
  level: number;
  gameOver: boolean;
  isPlaying: boolean;
  isPaused: boolean;
};

// Optimized selectors with shallow comparison
export const useGameState = (): GameStateSnapshot =>
  useGameStore(state => ({
    pete: state.pete,
    enemies: state.enemies,
    projectiles: state.projectiles,
    score: state.score,
    level: state.level,
    gameOver: state.gameOver,
    isPlaying: state.isPlaying,
    isPaused: state.isPaused,
  }));

// Actions selector - returns stable reference
export const useGameActions = () => useGameStore(state => state.actions);

// Individual action selectors for when you only need specific actions
export const useGameAction = <K extends keyof GameStore['actions']>(
  actionName: K
): GameStore['actions'][K] => useGameStore(state => state.actions[actionName]);

// Granular selectors for specific values
export const usePete = () => useGameStore(state => state.pete);
export const useEnemies = () => useGameStore(state => state.enemies);
export const useProjectiles = () => useGameStore(state => state.projectiles);
export const useScore = () => useGameStore(state => state.score);
export const useLevel = () => useGameStore(state => state.level);
export const useGameOver = () => useGameStore(state => state.gameOver);
export const useIsPlaying = () => useGameStore(state => state.isPlaying);
export const useIsPaused = () => useGameStore(state => state.isPaused);
