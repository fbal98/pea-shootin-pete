/**
 * High-performance caching system for game calculations
 * Reduces redundant computations and improves frame rate consistency
 * 
 * IMPORTANT: This wraps actual GameConfig functions to avoid logic duplication
 */

import { 
  getBalloonSize, 
  getBalloonPoints, 
  getEnemySpeedBySize 
} from '@/constants/GameConfig';
import { LevelID } from '@/types/LevelTypes';

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
}

export class GameCache {
  private static instance: GameCache;
  private levelConfigCache = new Map<number, any>();
  private coordinateConversions = new WeakMap<object, { x: number; y: number }>();
  private balloonSizeCache = new Map<number, number>();
  private balloonPointsCache = new Map<number, number>();
  private enemySpeedCache = new Map<number, number>();
  private spawnPositionCache = new Map<string, { x: number; y: number }>();
  
  // Performance tracking
  private cacheHits = 0;
  private cacheMisses = 0;
  private lastCleanup = Date.now();
  
  // Cache configuration
  private readonly CLEANUP_INTERVAL = 30000; // 30 seconds
  private readonly MAX_CACHE_AGE = 60000; // 1 minute
  private readonly MAX_COORDINATE_CACHE_SIZE = 1000;

  private constructor() {}

  static getInstance(): GameCache {
    if (!GameCache.instance) {
      GameCache.instance = new GameCache();
    }
    return GameCache.instance;
  }

  /**
   * Convert LevelID to number for caching
   * String IDs are converted to hash codes for cache keys
   */
  private levelIdToNumber(levelId: LevelID): number {
    if (typeof levelId === 'number') {
      return levelId;
    }
    // Convert string to consistent number for caching
    let hash = 0;
    for (let i = 0; i < levelId.length; i++) {
      const char = levelId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Cache level configuration to avoid recreation
   */
  cacheLevel(levelId: LevelID, config: any): void {
    const numericId = this.levelIdToNumber(levelId);
    this.levelConfigCache.set(numericId, {
      value: config,
      timestamp: Date.now(),
      accessCount: 0
    });
  }

  /**
   * Get cached level configuration
   */
  getLevel(levelId: LevelID): any | null {
    const numericId = this.levelIdToNumber(levelId);
    const cached = this.levelConfigCache.get(numericId);
    if (cached) {
      cached.accessCount++;
      this.cacheHits++;
      return cached.value;
    }
    this.cacheMisses++;
    return null;
  }

  /**
   * Cache balloon size calculations (wraps GameConfig.getBalloonSize)
   */
  getBalloonSize(sizeLevel: 1 | 2 | 3): number {
    if (this.balloonSizeCache.has(sizeLevel)) {
      this.cacheHits++;
      return this.balloonSizeCache.get(sizeLevel)!;
    }
    
    this.cacheMisses++;
    // Use actual GameConfig function - no logic duplication
    const size = getBalloonSize(sizeLevel);
    
    this.balloonSizeCache.set(sizeLevel, size);
    return size;
  }

  /**
   * Cache balloon points calculations (wraps GameConfig.getBalloonPoints)
   */
  getBalloonPoints(sizeLevel: 1 | 2 | 3): number {
    if (this.balloonPointsCache.has(sizeLevel)) {
      this.cacheHits++;
      return this.balloonPointsCache.get(sizeLevel)!;
    }
    
    this.cacheMisses++;
    // Use actual GameConfig function - no logic duplication
    const points = getBalloonPoints(sizeLevel);
    
    this.balloonPointsCache.set(sizeLevel, points);
    return points;
  }

  /**
   * Cache enemy speed calculations (wraps GameConfig.getEnemySpeedBySize)
   */
  getEnemySpeed(sizeLevel: 1 | 2 | 3): number {
    if (this.enemySpeedCache.has(sizeLevel)) {
      this.cacheHits++;
      return this.enemySpeedCache.get(sizeLevel)!;
    }
    
    this.cacheMisses++;
    // Use actual GameConfig function - no logic duplication
    const speed = getEnemySpeedBySize(sizeLevel);
    
    this.enemySpeedCache.set(sizeLevel, speed);
    return speed;
  }

  /**
   * Cache spawn position calculations
   */
  cacheSpawnPosition(key: string, x: number, y: number): void {
    this.spawnPositionCache.set(key, { x, y });
    
    // Prevent unbounded growth
    if (this.spawnPositionCache.size > 200) {
      const firstKey = this.spawnPositionCache.keys().next().value;
      if (firstKey) {
        this.spawnPositionCache.delete(firstKey);
      }
    }
  }

  /**
   * Get cached spawn position
   */
  getSpawnPosition(key: string): { x: number; y: number } | null {
    const cached = this.spawnPositionCache.get(key);
    if (cached) {
      this.cacheHits++;
      return cached;
    }
    this.cacheMisses++;
    return null;
  }

  /**
   * Cache coordinate conversions using WeakMap for memory efficiency
   */
  cacheCoordinateConversion(obj: object, x: number, y: number): void {
    this.coordinateConversions.set(obj, { x, y });
  }

  /**
   * Get cached coordinate conversion
   */
  getCoordinateConversion(obj: object): { x: number; y: number } | null {
    const cached = this.coordinateConversions.get(obj);
    if (cached) {
      this.cacheHits++;
      return cached;
    }
    this.cacheMisses++;
    return null;
  }

  /**
   * Periodic cleanup of expired cache entries
   */
  cleanup(): void {
    const now = Date.now();
    if (now - this.lastCleanup < this.CLEANUP_INTERVAL) {
      return;
    }

    // Clean level config cache
    for (const [key, entry] of this.levelConfigCache.entries()) {
      if (now - entry.timestamp > this.MAX_CACHE_AGE) {
        this.levelConfigCache.delete(key);
      }
    }

    // Clean spawn position cache
    for (const [key, entry] of this.spawnPositionCache.entries()) {
      // Remove old entries to prevent memory leaks
      if (this.spawnPositionCache.size > 100) {
        this.spawnPositionCache.delete(key);
        break;
      }
    }

    this.lastCleanup = now;
  }

  /**
   * Get cache performance statistics
   */
  getStats(): {
    hitRate: number;
    totalRequests: number;
    cacheHits: number;
    cacheMisses: number;
    levelConfigCacheSize: number;
    spawnPositionCacheSize: number;
    balloonSizeCacheSize: number;
    balloonPointsCacheSize: number;
    enemySpeedCacheSize: number;
  } {
    const totalRequests = this.cacheHits + this.cacheMisses;
    return {
      hitRate: totalRequests > 0 ? (this.cacheHits / totalRequests) * 100 : 0,
      totalRequests,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      levelConfigCacheSize: this.levelConfigCache.size,
      spawnPositionCacheSize: this.spawnPositionCache.size,
      balloonSizeCacheSize: this.balloonSizeCache.size,
      balloonPointsCacheSize: this.balloonPointsCache.size,
      enemySpeedCacheSize: this.enemySpeedCache.size,
    };
  }

  /**
   * Reset all caches and statistics
   */
  reset(): void {
    this.levelConfigCache.clear();
    this.coordinateConversions = new WeakMap();
    this.balloonSizeCache.clear();
    this.balloonPointsCache.clear();
    this.enemySpeedCache.clear();
    this.spawnPositionCache.clear();
    
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.lastCleanup = Date.now();
  }

  /**
   * Log cache statistics (development only)
   */
  logStats(): void {
    if (__DEV__) {
      const stats = this.getStats();
      console.log('🎯 Game Cache Stats:', {
        hitRate: `${stats.hitRate.toFixed(2)}%`,
        requests: stats.totalRequests,
        caches: {
          levelConfig: stats.levelConfigCacheSize,
          spawnPositions: stats.spawnPositionCacheSize,
          balloonSizes: stats.balloonSizeCacheSize,
          balloonPoints: stats.balloonPointsCacheSize,
          enemySpeeds: stats.enemySpeedCacheSize,
        }
      });
    }
  }
}

// Singleton instance for global access
export const gameCache = GameCache.getInstance();