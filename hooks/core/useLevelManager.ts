/**
 * Level Manager Hook - Extracted from monolithic useGameLogic
 * 
 * Handles:
 * - Level initialization and loading
 * - Level configuration management
 * - Level completion/failure detection
 * - Level progression logic
 * - Level-specific physics configuration
 * 
 * This is a relatively isolated system with minimal dependencies.
 */

import { useEffect, useRef, useCallback } from 'react';
import { levelManager } from '@/systems/LevelManager';
import {
  useLevelProgressionActions,
  useCurrentLevel,
  useEnemiesRemaining,
  useTotalEnemies,
  useLevelCompleted,
  useLevelFailed,
  useLevelStartTime,
} from '@/store/levelProgressionStore';
import {
  createLevelConfig,
  levelBalanceToConfigOverrides,
  applyEnvironmentalModifiers,
} from '@/constants/GameConfig';
import { gameCache } from '@/utils/GameCache';
import { Level } from '@/types/LevelTypes';

// Simplified LevelConfig type for now
interface LevelConfig {
  BALLOON_PHYSICS: any;
  ENTITY_CONFIG: any;
  [key: string]: any;
}

interface LevelManagerState {
  currentLevel: Level | null;
  levelConfig: LevelConfig | null;
  isInitialized: boolean;
  isLoading: boolean;
}

export const useLevelManager = () => {
  // Level progression state
  const currentLevel = useCurrentLevel();
  const enemiesRemaining = useEnemiesRemaining();
  const totalEnemies = useTotalEnemies();
  const levelCompleted = useLevelCompleted();
  const levelFailed = useLevelFailed();
  const levelStartTime = useLevelStartTime();
  const levelActions = useLevelProgressionActions();

  // Level manager state
  const isInitialized = useRef<boolean>(false);
  const levelConfig = useRef<LevelConfig | null>(null);
  const isLoading = useRef<boolean>(false);

  // Initialize level if not loaded (only once per game session)
  const initializeLevel = useCallback(async () => {
    if (isInitialized.current || isLoading.current) return;

    isLoading.current = true;
    
    try {
      // Load level 1 if no level is currently loaded
      if (!currentLevel) {
        await levelActions.loadLevel(1);
      }
      
      isInitialized.current = true;
    } catch (error) {
      console.error('Failed to initialize level:', error);
    } finally {
      isLoading.current = false;
    }
  }, [currentLevel, levelActions]);

  // Reset initialization when game is reset
  const resetInitialization = useCallback(() => {
    isInitialized.current = false;
    levelConfig.current = null;
    isLoading.current = false;
    
    // Clear level cache
    gameCache.reset();
  }, []);

  // Update level configuration when current level changes (with caching)
  useEffect(() => {
    if (!currentLevel) {
      levelConfig.current = null;
      return;
    }

    // Check cache first
    const cachedConfig = gameCache.getLevel(currentLevel.id);
    if (cachedConfig) {
      levelConfig.current = cachedConfig;
      return;
    }

    // Create level-specific configuration
    const balanceOverrides = currentLevel.balance 
      ? levelBalanceToConfigOverrides(currentLevel.balance)
      : {};
    
    const environmentalOverrides = currentLevel.environment
      ? applyEnvironmentalModifiers(currentLevel.environment)
      : {};

    const combinedOverrides = {
      ...balanceOverrides,
      ...environmentalOverrides,
    };

    const newLevelConfig = createLevelConfig(combinedOverrides);
    
    // Cache the configuration for performance
    gameCache.cacheLevel(currentLevel.id, newLevelConfig);
    
    levelConfig.current = newLevelConfig;
  }, [currentLevel]);

  // Start level when it's loaded and appropriate
  const startLevelIfReady = useCallback(() => {
    if (currentLevel && !levelCompleted && !levelFailed && levelStartTime === 0) {
      levelActions.startLevel();
    }
  }, [currentLevel, levelCompleted, levelFailed, levelStartTime, levelActions]);

  // Check level completion conditions
  const checkLevelCompletion = useCallback((currentEnemyCount: number) => {
    if (!currentLevel || levelCompleted || levelFailed) return;

    // Check if all enemies are eliminated (main victory condition)
    if (currentEnemyCount === 0 && enemiesRemaining === 0) {
      // Mark the primary objective as completed
      levelActions.completeObjective('eliminate_all_enemies');
      
      // Trigger victory condition check
      levelActions.checkVictoryConditions();
    }
  }, [currentLevel, levelCompleted, levelFailed, enemiesRemaining, levelActions]);

  // Check level failure conditions
  const checkLevelFailure = useCallback(() => {
    if (!currentLevel || levelCompleted || levelFailed) return;

    // Check time limit and other failure conditions
    levelActions.checkFailureConditions();
  }, [currentLevel, levelCompleted, levelFailed, levelActions]);

  // Load next level
  const loadNextLevel = useCallback(async () => {
    if (!currentLevel) return;

    const nextLevelId = levelManager.getNextLevel();
    if (nextLevelId) {
      await levelActions.loadLevel(Number(nextLevelId));
    }
  }, [currentLevel, levelActions]);

  // Restart current level
  const restartCurrentLevel = useCallback(() => {
    if (currentLevel) {
      levelActions.restartLevel();
    }
  }, [currentLevel, levelActions]);

  // Get current level stats
  const getLevelStats = useCallback(() => {
    if (!currentLevel) return null;

    const progress = totalEnemies > 0 ? (totalEnemies - enemiesRemaining) / totalEnemies : 0;
    const duration = levelStartTime > 0 ? Date.now() - levelStartTime : 0;

    return {
      levelId: currentLevel.id,
      levelName: currentLevel.name,
      progress,
      duration,
      enemiesRemaining,
      totalEnemies,
      isCompleted: levelCompleted,
      isFailed: levelFailed,
    };
  }, [currentLevel, totalEnemies, enemiesRemaining, levelStartTime, levelCompleted, levelFailed]);

  // Initialize level on mount
  useEffect(() => {
    initializeLevel();
  }, [initializeLevel]);

  // Auto-start level when ready
  useEffect(() => {
    startLevelIfReady();
  }, [startLevelIfReady]);

  return {
    // State
    currentLevel,
    levelConfig: levelConfig.current,
    isInitialized: isInitialized.current,
    isLoading: isLoading.current,
    
    // Actions
    initializeLevel,
    resetInitialization,
    checkLevelCompletion,
    checkLevelFailure,
    loadNextLevel,
    restartCurrentLevel,
    
    // Utils
    getLevelStats,
  };
};