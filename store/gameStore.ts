import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { GameObject, GameState } from '@/utils/gameEngine';
import { GAME_CONFIG } from '@/constants/GameConfig';

interface GameStore extends GameState {
  // UI State
  isPlaying: boolean;
  isPaused: boolean;
  lastUpdateTime: number;
  lastEnemySpawnTime: number;

  // Actions
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

  // Computed values
  enemySpawnInterval: () => number;
}

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
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

    // Actions
    setPete: pete => set({ pete }),

    setEnemies: enemies => set({ enemies }),

    setProjectiles: projectiles => set({ projectiles }),

    addEnemy: enemy =>
      set(state => ({
        enemies: [...state.enemies, enemy],
      })),

    addProjectile: projectile =>
      set(state => ({
        projectiles: [...state.projectiles, projectile],
      })),

    removeEnemy: enemyId =>
      set(state => ({
        enemies: state.enemies.filter(enemy => enemy.id !== enemyId),
      })),

    removeProjectile: projectileId =>
      set(state => ({
        projectiles: state.projectiles.filter(projectile => projectile.id !== projectileId),
      })),

    updateScore: points =>
      set(state => {
        const newScore = state.score + points;
        const newLevel = Math.floor(newScore / GAME_CONFIG.LEVEL_UP_THRESHOLD) + 1;
        return {
          score: newScore,
          level: newLevel !== state.level ? newLevel : state.level,
        };
      }),

    setGameOver: gameOver => set({ gameOver }),

    setLevel: level => set({ level }),

    setIsPlaying: playing => set({ isPlaying: playing }),

    setIsPaused: paused => set({ isPaused: paused }),

    setLastUpdateTime: time => set({ lastUpdateTime: time }),

    setLastEnemySpawnTime: time => set({ lastEnemySpawnTime: time }),

    resetGame: (screenWidth, gameAreaBottom) =>
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

    // Computed values
    enemySpawnInterval: () => {
      const state = get();
      return Math.max(
        GAME_CONFIG.ENEMY_SPAWN_MIN_INTERVAL,
        GAME_CONFIG.ENEMY_SPAWN_BASE_INTERVAL -
          state.level * GAME_CONFIG.ENEMY_SPAWN_LEVEL_REDUCTION
      );
    },
  }))
);

// Selectors for performance optimization
export const useGameState = () =>
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

export const useGameActions = () =>
  useGameStore(state => ({
    setPete: state.setPete,
    setEnemies: state.setEnemies,
    setProjectiles: state.setProjectiles,
    addEnemy: state.addEnemy,
    addProjectile: state.addProjectile,
    removeEnemy: state.removeEnemy,
    removeProjectile: state.removeProjectile,
    updateScore: state.updateScore,
    setGameOver: state.setGameOver,
    setLevel: state.setLevel,
    setIsPlaying: state.setIsPlaying,
    setIsPaused: state.setIsPaused,
    setLastUpdateTime: state.setLastUpdateTime,
    setLastEnemySpawnTime: state.setLastEnemySpawnTime,
    resetGame: state.resetGame,
    enemySpawnInterval: state.enemySpawnInterval,
  }));
