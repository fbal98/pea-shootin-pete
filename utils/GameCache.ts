/**
 * High-performance caching system for game calculations
 * Reduces redundant computations and improves frame rate consistency
 */

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
   * Cache level configuration to avoid recreation
   */
  cacheLevel(levelId: number, config: any): void {
    this.levelConfigCache.set(levelId, {
      value: config,
      timestamp: Date.now(),
      accessCount: 0
    });
  }

  /**
   * Get cached level configuration
   */
  getLevel(levelId: number): any | null {
    const cached = this.levelConfigCache.get(levelId);
    if (cached) {
      cached.accessCount++;
      this.cacheHits++;
      return cached.value;
    }
    this.cacheMisses++;
    return null;
  }

  /**
   * Cache balloon size calculations
   */
  getBalloonSize(sizeLevel: number): number {
    if (this.balloonSizeCache.has(sizeLevel)) {
      this.cacheHits++;
      return this.balloonSizeCache.get(sizeLevel)!;
    }
    
    this.cacheMisses++;
    // Calculate size (this should match the actual getBalloonSize function)
    const ENTITY_CONFIG = { BALLOON: { BASE_SIZE: 30 } }; // Import actual value
    const SIZE_MULTIPLIERS = { 1: 0.7, 2: 0.85, 3: 1.0 };
    const size = ENTITY_CONFIG.BALLOON.BASE_SIZE * (SIZE_MULTIPLIERS[sizeLevel as keyof typeof SIZE_MULTIPLIERS] || 1.0);
    
    this.balloonSizeCache.set(sizeLevel, size);
    return size;
  }

  /**
   * Cache balloon points calculations
   */
  getBalloonPoints(sizeLevel: number): number {
    if (this.balloonPointsCache.has(sizeLevel)) {
      this.cacheHits++;
      return this.balloonPointsCache.get(sizeLevel)!;
    }
    
    this.cacheMisses++;
    // Calculate points (this should match the actual getBalloonPoints function)
    const POINTS = { 1: 30, 2: 20, 3: 10 };
    const points = POINTS[sizeLevel as keyof typeof POINTS] || 10;
    
    this.balloonPointsCache.set(sizeLevel, points);
    return points;
  }

  /**
   * Cache enemy speed calculations
   */
  getEnemySpeed(sizeLevel: number): number {
    if (this.enemySpeedCache.has(sizeLevel)) {
      this.cacheHits++;
      return this.enemySpeedCache.get(sizeLevel)!;
    }
    
    this.cacheMisses++;
    // Calculate speed (this should match the actual getEnemySpeedBySize function)
    const SPEEDS = { 1: 80, 2: 64, 3: 50 };
    const speed = SPEEDS[sizeLevel as keyof typeof SPEEDS] || 50;
    
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