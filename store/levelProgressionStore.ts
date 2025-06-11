/**
 * Level Progression Store - Zustand store for managing level-based game progression
 * 
 * This store handles:
 * - Current level state and loading
 * - Victory condition tracking
 * - Level transitions and unlocking
 * - Integration with LevelManager
 * - Analytics events for level progression
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { levelManager } from '../systems/LevelManager';
import { Level, LevelID, EnemyWave, LevelObjective } from '../types/LevelTypes';

// Level statistics interface
export interface LevelStats {
  attempts: number;
  completions: number;
  bestScore: number;
  bestTime: number;
  totalPlaytime: number;
  lastPlayed: number;
  averageRetries: number;
}

// Current level progression state
interface LevelProgressionState {
  // Level Loading & Current State
  currentLevel: Level | null;
  currentLevelId: LevelID;
  isLevelLoading: boolean;
  levelLoadError: string | null;
  
  // Level Progress Tracking
  enemiesRemaining: number;
  totalEnemies: number;
  objectivesCompleted: LevelObjective[];
  currentWave: EnemyWave | null;
  waveIndex: number;
  
  // Victory & Failure State
  levelCompleted: boolean;
  levelFailed: boolean;
  failureReason: string | null;
  
  // Timing & Statistics
  levelStartTime: number;
  levelDuration: number;
  currentScore: number;
  shotsFired: number;
  shotsHit: number;
  currentCombo: number;
  maxCombo: number;
  
  // Player Progress
  unlockedLevels: number[];
  completedLevels: number[];
  levelStats: Record<number, LevelStats>;
  
  // UI State
  showLevelTransition: boolean;
  showVictoryScreen: boolean;
  showFailureScreen: boolean;
}

interface LevelProgressionActions {
  // Level Management
  loadLevel: (levelId: LevelID) => Promise<void>;
  startLevel: () => void;
  restartLevel: () => void;
  
  // Progress Tracking
  enemyEliminated: (enemyId: string, points: number) => void;
  projectileFired: () => void;
  projectileHit: () => void;
  projectileMissed: () => void;
  
  // Objective Management
  completeObjective: (objectiveType: string) => void;
  checkVictoryConditions: () => void;
  checkFailureConditions: () => void;
  
  // Level Completion
  completeLevel: () => Promise<void>;
  failLevel: (reason: string) => void;
  proceedToNextLevel: () => Promise<void>;
  
  // UI Management
  showTransition: (show: boolean) => void;
  showVictory: (show: boolean) => void;
  showFailure: (show: boolean) => void;
  
  // Analytics & Statistics
  updateCombo: (combo: number) => void;
  resetLevelStats: () => void;
  
  // Player Progress Management
  refreshPlayerProgress: () => Promise<void>;
}

interface LevelProgressionStore extends LevelProgressionState {
  actions: LevelProgressionActions;
}

// Helper function to calculate accuracy
const calculateAccuracy = (hit: number, fired: number): number => {
  return fired > 0 ? (hit / fired) * 100 : 0;
};

// Helper function to check if all objectives are completed
const areAllObjectivesCompleted = (level: Level, completedObjectives: LevelObjective[]): boolean => {
  const requiredObjectives = level.objectives.filter((obj: any) => !obj.isOptional);
  
  return requiredObjectives.every(required => 
    completedObjectives.some(completed => 
      completed.type === required.type && completed.target === required.target
    )
  );
};

// Create the store
const createLevelProgressionStore = (set: any, get: any): LevelProgressionStore => {
  const actions: LevelProgressionActions = {
    // Load a specific level
    loadLevel: async (levelId: LevelID) => {
      set({ isLevelLoading: true, levelLoadError: null });
      
      try {
        const result = await levelManager.loadLevel(levelId);
        
        if (result.success && result.level) {
          set({
            currentLevel: result.level,
            currentLevelId: levelId,
            isLevelLoading: false,
            totalEnemies: result.level.totalEnemyCount,
            enemiesRemaining: result.level.totalEnemyCount,
            objectivesCompleted: [],
            waveIndex: 0,
            currentWave: result.level.enemyWaves.length > 0 ? result.level.enemyWaves[0] : null,
            levelCompleted: false,
            levelFailed: false,
            failureReason: null
          });
        } else {
          set({
            isLevelLoading: false,
            levelLoadError: result.error || 'Failed to load level'
          });
        }
      } catch (error) {
        set({
          isLevelLoading: false,
          levelLoadError: `Error loading level: ${error}`
        });
      }
    },

    // Start the current level
    startLevel: () => {
      set({
        levelStartTime: Date.now(),
        levelDuration: 0,
        currentScore: 0,
        shotsFired: 0,
        shotsHit: 0,
        currentCombo: 0,
        maxCombo: 0,
        levelCompleted: false,
        levelFailed: false,
        failureReason: null,
        showLevelTransition: false,
        showVictoryScreen: false,
        showFailureScreen: false
      });

      // Track analytics
      const state = get();
      if (state.currentLevel) {
        const { trackLevelStart } = require('../utils/analytics');
        trackLevelStart(
          state.currentLevelId, 
          state.currentLevel.name,
          (state.levelStats[state.currentLevelId]?.attempts || 0) + 1
        );
      }
    },

    // Restart the current level
    restartLevel: () => {
      const state = get();
      if (state.currentLevel) {
        actions.resetLevelStats();
        actions.startLevel();
      }
    },

    // Handle enemy elimination
    enemyEliminated: (enemyId: string, points: number) => {
      set((state: LevelProgressionState) => {
        const newEnemiesRemaining = Math.max(0, state.enemiesRemaining - 1);
        const newScore = state.currentScore + points;
        
        return {
          enemiesRemaining: newEnemiesRemaining,
          currentScore: newScore,
          levelDuration: Date.now() - state.levelStartTime
        };
      });

      // Victory conditions will be checked by the game loop
    },

    // Track projectile fired
    projectileFired: () => {
      set((state: LevelProgressionState) => ({
        shotsFired: state.shotsFired + 1
      }));
    },

    // Track projectile hit
    projectileHit: () => {
      set((state: LevelProgressionState) => ({
        shotsHit: state.shotsHit + 1,
        currentCombo: state.currentCombo + 1,
        maxCombo: Math.max(state.maxCombo, state.currentCombo + 1)
      }));
    },

    // Track projectile miss
    projectileMissed: () => {
      set({ currentCombo: 0 });
    },

    // Complete a specific objective
    completeObjective: (objectiveType: string) => {
      set((state: LevelProgressionState) => {
        if (!state.currentLevel) return state;

        const objective = state.currentLevel.objectives.find(obj => obj.type === objectiveType);
        if (!objective) return state;

        const alreadyCompleted = state.objectivesCompleted.some(
          completed => completed.type === objectiveType
        );
        
        if (alreadyCompleted) return state;

        const newCompleted = [...state.objectivesCompleted, objective];
        
        return {
          objectivesCompleted: newCompleted
        };
      });

      // Victory conditions will be checked by the game loop
    },

    // Check if victory conditions are met
    checkVictoryConditions: () => {
      const state = get();
      if (!state.currentLevel || state.levelCompleted || state.levelFailed) return;

      // For eliminate_all_enemies objective, check if there are no enemies on screen
      // The actual enemy count will be checked by the game logic hook
      const primaryObjective = state.currentLevel.objectives.find((obj: any) => obj.type === 'eliminate_all_enemies');
      
      // Check if all required objectives are completed
      if (areAllObjectivesCompleted(state.currentLevel, state.objectivesCompleted)) {
        actions.completeLevel();
      }
    },

    // Check if failure conditions are met
    checkFailureConditions: () => {
      const state = get();
      if (!state.currentLevel || state.levelCompleted || state.levelFailed) return;

      const currentTime = Date.now();
      const timeSinceStart = currentTime - state.levelStartTime;

      // Check failure conditions
      for (const failureCondition of state.currentLevel.failureConditions) {
        switch (failureCondition.type) {
          case 'time_limit':
            if (timeSinceStart > failureCondition.threshold * 1000) {
              actions.failLevel('Time limit exceeded');
              return;
            }
            break;
          
          case 'missed_shots':
            const missedShots = state.shotsFired - state.shotsHit;
            if (missedShots >= failureCondition.threshold) {
              actions.failLevel('Too many missed shots');
              return;
            }
            break;
            
          // Add more failure condition checks here
        }
      }
    },

    // Complete the current level
    completeLevel: async () => {
      const state = get();
      if (!state.currentLevel || state.levelCompleted) return;

      set({
        levelCompleted: true,
        levelDuration: Date.now() - state.levelStartTime,
        showVictoryScreen: true
      });

      // Calculate final stats
      const finalStats: Partial<LevelStats> = {
        bestScore: state.currentScore,
        bestTime: state.levelDuration,
        totalPlaytime: state.levelDuration,
      };

      // Record completion in LevelManager
      try {
        await levelManager.completeLevel(state.currentLevelId, finalStats);
        await actions.refreshPlayerProgress();
      } catch (error) {
        console.error('Failed to record level completion:', error);
      }

      // Track analytics
      const { trackLevelComplete } = require('../utils/analytics');
      trackLevelComplete(
        state.currentLevelId,
        state.currentLevel?.name || `Level ${state.currentLevelId}`,
        state.currentScore,
        state.levelDuration,
        calculateAccuracy(state.shotsHit, state.shotsFired),
        (state.levelStats[state.currentLevelId]?.attempts || 0) + 1
      );
    },

    // Fail the current level
    failLevel: (reason: string) => {
      const state = get();
      
      set({
        levelFailed: true,
        failureReason: reason,
        levelDuration: Date.now() - state.levelStartTime,
        showFailureScreen: true
      });

      // Record attempt in LevelManager
      const finalStats: Partial<LevelStats> = {
        totalPlaytime: Date.now() - state.levelStartTime,
      };

      levelManager.recordLevelAttempt(state.currentLevelId, false, finalStats);

      // Track analytics
      const { trackLevelFailed } = require('../utils/analytics');
      trackLevelFailed(
        state.currentLevelId,
        state.currentLevel?.name || `Level ${state.currentLevelId}`,
        reason,
        state.currentScore,
        Date.now() - state.levelStartTime,
        (state.levelStats[state.currentLevelId]?.attempts || 0) + 1
      );
    },

    // Proceed to next level
    proceedToNextLevel: async () => {
      const nextLevelId = levelManager.getNextLevel();
      await actions.loadLevel(nextLevelId);
      actions.showVictory(false);
      actions.showTransition(true);
    },

    // UI Management
    showTransition: (show: boolean) => set({ showLevelTransition: show }),
    showVictory: (show: boolean) => set({ showVictoryScreen: show }),
    showFailure: (show: boolean) => set({ showFailureScreen: show }),

    // Update combo counter
    updateCombo: (combo: number) => {
      set((state: LevelProgressionState) => ({
        currentCombo: combo,
        maxCombo: Math.max(state.maxCombo, combo)
      }));
    },

    // Reset level statistics
    resetLevelStats: () => {
      const state = get();
      set({
        currentScore: 0,
        shotsFired: 0,
        shotsHit: 0,
        currentCombo: 0,
        maxCombo: 0,
        levelStartTime: Date.now(),
        levelDuration: 0,
        enemiesRemaining: state.currentLevel?.totalEnemyCount || 0,
        objectivesCompleted: []
      });
    },

    // Refresh player progress from LevelManager
    refreshPlayerProgress: async () => {
      try {
        const progress = levelManager.getPlayerProgress();
        if (progress) {
          set({
            unlockedLevels: Array.from(progress.unlockedLevels),
            completedLevels: Array.from(progress.completedLevels),
            levelStats: progress.levelStats
          });
        }
      } catch (error) {
        console.error('Failed to refresh player progress:', error);
      }
    }
  };

  return {
    // Initial state
    currentLevel: null,
    currentLevelId: 1,
    isLevelLoading: false,
    levelLoadError: null,
    
    enemiesRemaining: 0,
    totalEnemies: 0,
    objectivesCompleted: [],
    currentWave: null,
    waveIndex: 0,
    
    levelCompleted: false,
    levelFailed: false,
    failureReason: null,
    
    levelStartTime: 0,
    levelDuration: 0,
    currentScore: 0,
    shotsFired: 0,
    shotsHit: 0,
    currentCombo: 0,
    maxCombo: 0,
    
    unlockedLevels: [1],
    completedLevels: [],
    levelStats: {},
    
    showLevelTransition: false,
    showVictoryScreen: false,
    showFailureScreen: false,
    
    actions
  };
};

// Create the store with subscribeWithSelector for reactive updates
export const useLevelProgressionStore = create<LevelProgressionStore>()(
  subscribeWithSelector(createLevelProgressionStore)
);

// Selectors for specific parts of the state
export const useLevelProgressionActions = () => 
  useLevelProgressionStore(state => state.actions);

export const useCurrentLevel = () => 
  useLevelProgressionStore(state => state.currentLevel);

// DEPRECATED: These composite selectors cause infinite re-render loops
// Use individual selectors below instead

// export const useLevelProgress = () => 
//   useLevelProgressionStore(state => ({
//     enemiesRemaining: state.enemiesRemaining,
//     totalEnemies: state.totalEnemies,
//     currentScore: state.currentScore,
//     accuracy: calculateAccuracy(state.shotsHit, state.shotsFired),
//     currentCombo: state.currentCombo
//   }));

// export const useLevelState = () =>
//   useLevelProgressionStore(state => ({
//     isLoading: state.isLevelLoading,
//     completed: state.levelCompleted,
//     failed: state.levelFailed,
//     failureReason: state.failureReason
//   }));

// export const useLevelUI = () =>
//   useLevelProgressionStore(state => ({
//     showTransition: state.showLevelTransition,
//     showVictory: state.showVictoryScreen,
//     showFailure: state.showFailureScreen
//   }));

// export const usePlayerProgress = () =>
//   useLevelProgressionStore(state => ({
//     unlockedLevels: state.unlockedLevels,
//     completedLevels: state.completedLevels,
//     currentLevelId: state.currentLevelId
//   }));

// Individual selectors for level progression (to avoid infinite loop issues)
export const useEnemiesRemaining = () => useLevelProgressionStore(state => state.enemiesRemaining);
export const useTotalEnemies = () => useLevelProgressionStore(state => state.totalEnemies);
export const useCurrentScore = () => useLevelProgressionStore(state => state.currentScore);
export const useShotsFired = () => useLevelProgressionStore(state => state.shotsFired);
export const useShotsHit = () => useLevelProgressionStore(state => state.shotsHit);
export const useCurrentCombo = () => useLevelProgressionStore(state => state.currentCombo);
export const useLevelCompleted = () => useLevelProgressionStore(state => state.levelCompleted);
export const useLevelFailed = () => useLevelProgressionStore(state => state.levelFailed);
export const useLevelStartTime = () => useLevelProgressionStore(state => state.levelStartTime);
export const useCurrentWave = () => useLevelProgressionStore(state => state.currentWave);
export const useWaveIndex = () => useLevelProgressionStore(state => state.waveIndex);

// Individual selectors for level state
export const useIsLevelLoading = () => useLevelProgressionStore(state => state.isLevelLoading);
export const useFailureReason = () => useLevelProgressionStore(state => state.failureReason);

// Individual selectors for level UI
export const useShowLevelTransition = () => useLevelProgressionStore(state => state.showLevelTransition);
export const useShowVictoryScreen = () => useLevelProgressionStore(state => state.showVictoryScreen);
export const useShowFailureScreen = () => useLevelProgressionStore(state => state.showFailureScreen);

// Individual selectors for player progress
export const useUnlockedLevels = () => useLevelProgressionStore(state => state.unlockedLevels);
export const useCompletedLevels = () => useLevelProgressionStore(state => state.completedLevels);
export const useCurrentLevelId = () => useLevelProgressionStore(state => state.currentLevelId);