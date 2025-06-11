/**
 * LevelManager - Central system for managing level progression in Pea Shootin' Pete
 * 
 * This system handles:
 * - Loading and validating level configurations
 * - Level progression and unlocking
 * - Remote configuration support
 * - Analytics integration
 * - A/B testing capabilities
 * - Performance optimization for 100+ levels
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Level,
  LevelID,
  LevelValidationResult,
  LevelLoadResult,
  RemoteLevelConfig,
  LevelMetadata,
  LEVEL_JSON_SCHEMA
} from '../types/LevelTypes';

// Import level configurations
import LevelsIndex from '../levels/levels_index.json';
import Level001 from '../levels/level_001.json';
import Level002 from '../levels/level_002.json';

// Storage keys for persistence
const STORAGE_KEYS = {
  COMPLETED_LEVELS: 'psp_completed_levels',
  UNLOCKED_LEVELS: 'psp_unlocked_levels',
  LEVEL_PROGRESS: 'psp_level_progress',
  PLAYER_STATS: 'psp_player_stats',
  REMOTE_CONFIG: 'psp_remote_config',
  ANALYTICS_CACHE: 'psp_analytics_cache'
} as const;

// Analytics event types
export interface LevelAnalyticsEvent {
  type: 'level_start' | 'level_complete' | 'level_failed' | 'objective_complete' | 'retry_level';
  levelId: number;
  timestamp: number;
  data: Record<string, any>;
}

// Player progression data
export interface PlayerProgress {
  currentLevel: number;
  completedLevels: Set<number>;
  unlockedLevels: Set<number>;
  levelStats: Record<number, LevelStats>;
  totalPlaytime: number;
  totalScore: number;
  achievementsUnlocked: string[];
}

export interface LevelStats {
  attempts: number;
  completions: number;
  bestScore: number;
  bestTime: number;
  totalPlaytime: number;
  lastPlayed: number;
  averageRetries: number;
}

// Level loading cache for performance
interface LevelCache {
  [levelId: number]: Level;
}

// Remote config interface
interface RemoteConfigData {
  enabledLevels: number[];
  globalDifficultyMultiplier: number;
  globalSpeedMultiplier: number;
  testConfigs: Record<string, any>;
  features: {
    powerupsEnabled: boolean;
    achievementsEnabled: boolean;
    leaderboardsEnabled: boolean;
    dailyRewardsEnabled: boolean;
  };
}

export class LevelManager {
  private static instance: LevelManager;
  private levelCache: LevelCache = {};
  private playerProgress: PlayerProgress | null = null;
  private remoteConfig: RemoteConfigData | null = null;
  private analyticsQueue: LevelAnalyticsEvent[] = [];
  private initialized = false;

  // Static level data mapping
  private static LEVEL_DATA_MAP: Record<number, any> = {
    1: Level001,
    2: Level002,
    // Add more levels here as they're created
  };

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get singleton instance of LevelManager
   */
  public static getInstance(): LevelManager {
    if (!LevelManager.instance) {
      LevelManager.instance = new LevelManager();
    }
    return LevelManager.instance;
  }

  /**
   * Initialize the level manager
   * Must be called before using other methods
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load player progress from storage
      await this.loadPlayerProgress();
      
      // Load remote configuration
      await this.loadRemoteConfig();
      
      // Preload essential levels (first 5 levels)
      await this.preloadLevels([1, 2, 3, 4, 5]);
      
      // Process any cached analytics events
      await this.processCachedAnalytics();
      
      this.initialized = true;
      console.log('LevelManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize LevelManager:', error);
      throw error;
    }
  }

  /**
   * Load a specific level by ID
   */
  public async loadLevel(levelId: LevelID): Promise<LevelLoadResult> {
    try {
      // Check cache first
      if (this.levelCache[levelId]) {
        return {
          success: true,
          level: this.levelCache[levelId]
        };
      }

      // Check if level exists in our data map
      const levelData = LevelManager.LEVEL_DATA_MAP[levelId];
      if (!levelData) {
        return {
          success: false,
          error: `Level ${levelId} not found`
        };
      }

      // Validate level data
      const validation = this.validateLevel(levelData);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Level ${levelId} validation failed: ${validation.errors.join(', ')}`
        };
      }

      // Apply remote config overrides
      const level = this.applyRemoteConfig(levelData as Level);
      
      // Cache the level
      this.levelCache[levelId] = level;

      return {
        success: true,
        level
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to load level ${levelId}: ${error}`
      };
    }
  }

  /**
   * Validate level configuration against schema
   */
  public validateLevel(levelData: any): LevelValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Basic required field validation
      if (!levelData.id || typeof levelData.id !== 'number') {
        errors.push('Level ID is required and must be a number');
      }

      if (!levelData.name || typeof levelData.name !== 'string') {
        errors.push('Level name is required and must be a string');
      }

      if (!levelData.version || typeof levelData.version !== 'string') {
        errors.push('Level version is required and must be a string');
      }

      // Validate objectives
      if (!Array.isArray(levelData.objectives) || levelData.objectives.length === 0) {
        errors.push('Level must have at least one objective');
      }

      // Validate enemy waves
      if (!Array.isArray(levelData.enemyWaves) || levelData.enemyWaves.length === 0) {
        errors.push('Level must have at least one enemy wave');
      }

      // Validate total enemy count matches waves
      if (levelData.totalEnemyCount) {
        const calculatedTotal = levelData.enemyWaves.reduce((total: number, wave: any) => {
          return total + wave.enemies.reduce((waveTotal: number, enemy: any) => {
            return waveTotal + enemy.count;
          }, 0);
        }, 0);

        if (calculatedTotal !== levelData.totalEnemyCount) {
          warnings.push(`Total enemy count (${levelData.totalEnemyCount}) doesn't match calculated total (${calculatedTotal})`);
        }
      }

      // Performance validation
      if (levelData.totalEnemyCount > 50) {
        warnings.push('High enemy count may impact performance on lower-end devices');
      }

      // Balance validation
      if (levelData.balance?.targetFailRate > 0.7) {
        warnings.push('Very high fail rate may frustrate players');
      }

      if (levelData.estimatedDuration > 300) {
        warnings.push('Level duration over 5 minutes may reduce retention');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation error: ${error}`],
        warnings
      };
    }
  }

  /**
   * Get all available levels with their unlock status
   */
  public async getAvailableLevels(): Promise<Array<{ level: Level; unlocked: boolean; completed: boolean }>> {
    const result: Array<{ level: Level; unlocked: boolean; completed: boolean }> = [];
    
    for (const levelInfo of LevelsIndex.levels) {
      const loadResult = await this.loadLevel(levelInfo.id);
      if (loadResult.success && loadResult.level) {
        result.push({
          level: loadResult.level,
          unlocked: this.isLevelUnlocked(levelInfo.id),
          completed: this.isLevelCompleted(levelInfo.id)
        });
      }
    }

    return result;
  }

  /**
   * Check if a level is unlocked for the player
   */
  public isLevelUnlocked(levelId: LevelID): boolean {
    if (!this.playerProgress) return levelId === 1; // First level always unlocked
    
    // Check remote config for disabled levels
    if (this.remoteConfig && !this.remoteConfig.enabledLevels.includes(levelId)) {
      return false;
    }

    return this.playerProgress.unlockedLevels.has(levelId);
  }

  /**
   * Check if a level has been completed
   */
  public isLevelCompleted(levelId: LevelID): boolean {
    if (!this.playerProgress) return false;
    return this.playerProgress.completedLevels.has(levelId);
  }

  /**
   * Mark a level as completed and unlock next levels
   */
  public async completeLevel(levelId: LevelID, stats: Partial<LevelStats>): Promise<void> {
    if (!this.playerProgress) return;

    // Mark level as completed
    this.playerProgress.completedLevels.add(levelId);

    // Update level stats
    const currentStats = this.playerProgress.levelStats[levelId] || {
      attempts: 0,
      completions: 0,
      bestScore: 0,
      bestTime: 0,
      totalPlaytime: 0,
      lastPlayed: Date.now(),
      averageRetries: 0
    };

    this.playerProgress.levelStats[levelId] = {
      ...currentStats,
      completions: currentStats.completions + 1,
      bestScore: Math.max(currentStats.bestScore, stats.bestScore || 0),
      bestTime: stats.bestTime && (currentStats.bestTime === 0 || stats.bestTime < currentStats.bestTime) 
        ? stats.bestTime 
        : currentStats.bestTime,
      totalPlaytime: currentStats.totalPlaytime + (stats.totalPlaytime || 0),
      lastPlayed: Date.now()
    };

    // Unlock next levels based on current level's rewards
    const levelResult = await this.loadLevel(levelId);
    if (levelResult.success && levelResult.level?.rewards.unlocksNextLevel) {
      this.playerProgress.unlockedLevels.add(levelId + 1);
    }

    // Update totals
    this.playerProgress.totalScore += stats.bestScore || 0;
    this.playerProgress.totalPlaytime += stats.totalPlaytime || 0;

    // Save progress
    await this.savePlayerProgress();

    // Track analytics
    this.trackAnalyticsEvent({
      type: 'level_complete',
      levelId,
      timestamp: Date.now(),
      data: {
        score: stats.bestScore || 0,
        time: stats.bestTime || 0,
        attempts: currentStats.attempts + 1
      }
    });
  }

  /**
   * Record a level attempt (success or failure)
   */
  public async recordLevelAttempt(levelId: LevelID, success: boolean, stats: Partial<LevelStats>): Promise<void> {
    if (!this.playerProgress) return;

    // Initialize or update level stats
    const currentStats = this.playerProgress.levelStats[levelId] || {
      attempts: 0,
      completions: 0,
      bestScore: 0,
      bestTime: 0,
      totalPlaytime: 0,
      lastPlayed: Date.now(),
      averageRetries: 0
    };

    currentStats.attempts += 1;
    currentStats.totalPlaytime += stats.totalPlaytime || 0;
    currentStats.lastPlayed = Date.now();

    this.playerProgress.levelStats[levelId] = currentStats;

    // Save progress
    await this.savePlayerProgress();

    // Track analytics
    this.trackAnalyticsEvent({
      type: success ? 'level_complete' : 'level_failed',
      levelId,
      timestamp: Date.now(),
      data: {
        attempts: currentStats.attempts,
        ...stats
      }
    });
  }

  /**
   * Get player's current progression status
   */
  public getPlayerProgress(): PlayerProgress | null {
    return this.playerProgress;
  }

  /**
   * Get statistics for a specific level
   */
  public getLevelStats(levelId: LevelID): LevelStats | null {
    if (!this.playerProgress) return null;
    return this.playerProgress.levelStats[levelId] || null;
  }

  /**
   * Apply remote configuration overrides to a level
   */
  private applyRemoteConfig(level: Level): Level {
    if (!this.remoteConfig) return level;

    // Apply global multipliers
    const modifiedLevel = { ...level };
    
    modifiedLevel.balance = {
      ...level.balance,
      enemySpeedMultiplier: level.balance.enemySpeedMultiplier * this.remoteConfig.globalSpeedMultiplier,
      spawnRateMultiplier: level.balance.spawnRateMultiplier * this.remoteConfig.globalDifficultyMultiplier
    };

    // Apply A/B test configurations if applicable
    if (level.metadata.testGroup && this.remoteConfig.testConfigs[level.metadata.testGroup]) {
      const testConfig = this.remoteConfig.testConfigs[level.metadata.testGroup];
      // Apply test-specific overrides here
      Object.assign(modifiedLevel.balance, testConfig.balanceOverrides || {});
    }

    return modifiedLevel;
  }

  /**
   * Track analytics events
   */
  private trackAnalyticsEvent(event: LevelAnalyticsEvent): void {
    // Add to queue for batch processing
    this.analyticsQueue.push(event);

    // Process immediately in development, batch in production
    if (__DEV__) {
      this.processAnalyticsEvent(event);
    } else if (this.analyticsQueue.length >= 10) {
      this.processCachedAnalytics();
    }
  }

  /**
   * Process a single analytics event
   */
  private processAnalyticsEvent(event: LevelAnalyticsEvent): void {
    // In a real implementation, this would send to Firebase Analytics, GameAnalytics, etc.
    console.log('Analytics Event:', event);
    
    // For now, just log the event
    // TODO: Integrate with actual analytics service
  }

  /**
   * Process cached analytics events
   */
  private async processCachedAnalytics(): Promise<void> {
    if (this.analyticsQueue.length === 0) return;

    const events = [...this.analyticsQueue];
    this.analyticsQueue = [];

    // Process all events
    events.forEach(event => this.processAnalyticsEvent(event));

    // Cache events to storage in case of network issues
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ANALYTICS_CACHE, JSON.stringify(events));
    } catch (error) {
      console.warn('Failed to cache analytics events:', error);
    }
  }

  /**
   * Preload specified levels for performance
   */
  private async preloadLevels(levelIds: LevelID[]): Promise<void> {
    const preloadPromises = levelIds.map(id => this.loadLevel(id));
    await Promise.all(preloadPromises);
  }

  /**
   * Load player progress from storage
   */
  private async loadPlayerProgress(): Promise<void> {
    try {
      const progressData = await AsyncStorage.getItem(STORAGE_KEYS.LEVEL_PROGRESS);
      
      if (progressData) {
        const parsed = JSON.parse(progressData);
        this.playerProgress = {
          ...parsed,
          completedLevels: new Set(parsed.completedLevels || []),
          unlockedLevels: new Set(parsed.unlockedLevels || [1]) // Level 1 always unlocked
        };
      } else {
        // Initialize new player progress
        this.playerProgress = {
          currentLevel: 1,
          completedLevels: new Set(),
          unlockedLevels: new Set([1]),
          levelStats: {},
          totalPlaytime: 0,
          totalScore: 0,
          achievementsUnlocked: []
        };
      }
    } catch (error) {
      console.error('Failed to load player progress:', error);
      // Initialize default progress on error
      this.playerProgress = {
        currentLevel: 1,
        completedLevels: new Set(),
        unlockedLevels: new Set([1]),
        levelStats: {},
        totalPlaytime: 0,
        totalScore: 0,
        achievementsUnlocked: []
      };
    }
  }

  /**
   * Save player progress to storage
   */
  private async savePlayerProgress(): Promise<void> {
    if (!this.playerProgress) return;

    try {
      const dataToSave = {
        ...this.playerProgress,
        completedLevels: Array.from(this.playerProgress.completedLevels),
        unlockedLevels: Array.from(this.playerProgress.unlockedLevels)
      };

      await AsyncStorage.setItem(STORAGE_KEYS.LEVEL_PROGRESS, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to save player progress:', error);
    }
  }

  /**
   * Load remote configuration
   */
  private async loadRemoteConfig(): Promise<void> {
    try {
      // In a real implementation, this would fetch from Firebase Remote Config
      // For now, use local configuration from levels_index.json
      this.remoteConfig = {
        enabledLevels: LevelsIndex.remoteConfig.enabledLevels,
        globalDifficultyMultiplier: LevelsIndex.remoteConfig.globalDifficultyMultiplier,
        globalSpeedMultiplier: LevelsIndex.remoteConfig.globalSpeedMultiplier,
        testConfigs: {},
        features: LevelsIndex.remoteConfig.features
      };
    } catch (error) {
      console.warn('Failed to load remote config, using defaults:', error);
      // Fallback to default configuration
      this.remoteConfig = {
        enabledLevels: [1, 2],
        globalDifficultyMultiplier: 1.0,
        globalSpeedMultiplier: 1.0,
        testConfigs: {},
        features: {
          powerupsEnabled: false,
          achievementsEnabled: true,
          leaderboardsEnabled: false,
          dailyRewardsEnabled: false
        }
      };
    }
  }

  /**
   * Get current remote configuration
   */
  public getRemoteConfig(): RemoteConfigData | null {
    return this.remoteConfig;
  }

  /**
   * Clear all player progress (for testing/debugging)
   */
  public async clearPlayerProgress(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.COMPLETED_LEVELS,
      STORAGE_KEYS.UNLOCKED_LEVELS,
      STORAGE_KEYS.LEVEL_PROGRESS,
      STORAGE_KEYS.PLAYER_STATS
    ]);

    this.playerProgress = {
      currentLevel: 1,
      completedLevels: new Set(),
      unlockedLevels: new Set([1]),
      levelStats: {},
      totalPlaytime: 0,
      totalScore: 0,
      achievementsUnlocked: []
    };
  }

  /**
   * Get the next recommended level for the player
   */
  public getNextLevel(): LevelID {
    if (!this.playerProgress) return 1;

    // Find the first unlocked level that hasn't been completed
    const availableLevels = LevelsIndex.levels
      .filter(level => this.isLevelUnlocked(level.id))
      .filter(level => !this.isLevelCompleted(level.id));

    if (availableLevels.length > 0) {
      return availableLevels[0].id;
    }

    // If all unlocked levels are completed, return the current level
    return this.playerProgress.currentLevel;
  }
}

// Export singleton instance
export const levelManager = LevelManager.getInstance();