/**
 * Object pooling system for game objects to reduce garbage collection
 * Enhanced with ID generation to eliminate nanoid() usage
 */

import { GameObject } from '@/utils/gameEngine';
import { EnemyType } from '@/constants/GameConfig';

interface PooledObject {
  inUse: boolean;
  object: GameObject;
}

/**
 * High-performance ID generator for pooled objects
 * Eliminates nanoid() usage for better performance
 */
class PooledIdGenerator {
  private static projectileCounter = 0;
  private static enemyCounter = 0;
  private static gameSessionId = Date.now().toString(36);

  static generateProjectileId(): string {
    return `proj_${this.gameSessionId}_${++this.projectileCounter}`;
  }

  static generateEnemyId(): string {
    return `enemy_${this.gameSessionId}_${++this.enemyCounter}`;
  }

  static generateSplitEnemyId(parentId: string, splitIndex: number): string {
    return `${parentId}_split${splitIndex}_${++this.enemyCounter}`;
  }

  static reset(): void {
    this.projectileCounter = 0;
    this.enemyCounter = 0;
    this.gameSessionId = Date.now().toString(36);
  }
}

export class ObjectPool {
  private pool: PooledObject[] = [];
  private createObject: () => GameObject;
  private resetObject: (obj: GameObject) => void;
  private maxSize: number;

  constructor(
    createFn: () => GameObject,
    resetFn: (obj: GameObject) => void,
    initialSize: number = 10,
    maxSize: number = 100
  ) {
    this.createObject = createFn;
    this.resetObject = resetFn;
    this.maxSize = maxSize;

    // Pre-populate pool with initial objects
    for (let i = 0; i < initialSize; i++) {
      this.pool.push({
        inUse: false,
        object: this.createObject(),
      });
    }
  }

  /**
   * Get an object from the pool
   */
  acquire(): GameObject {
    // Find an unused object
    const pooledObject = this.pool.find(item => !item.inUse);

    if (pooledObject) {
      pooledObject.inUse = true;
      this.resetObject(pooledObject.object);
      return pooledObject.object;
    }

    // If no free objects and pool is not at max capacity, create new one
    if (this.pool.length < this.maxSize) {
      const newObject = this.createObject();
      this.pool.push({
        inUse: true,
        object: newObject,
      });
      return newObject;
    }

    // Pool is full - expand pool safely instead of corrupting in-use objects
    console.warn('Pool expansion: safely creating tracked object beyond maxSize');
    const newObject = this.createObject();
    this.pool.push({
      inUse: true,
      object: newObject,
    });
    return newObject;
  }

  /**
   * Return an object to the pool
   */
  release(object: GameObject): void {
    const pooledObject = this.pool.find(item => item.object === object);
    if (pooledObject) {
      pooledObject.inUse = false;
    }
  }

  /**
   * Release all objects matching a condition
   */
  releaseWhere(predicate: (obj: GameObject) => boolean): void {
    this.pool.forEach(pooledObject => {
      if (pooledObject.inUse && predicate(pooledObject.object)) {
        pooledObject.inUse = false;
      }
    });
  }

  /**
   * Get pool statistics
   */
  getStats() {
    const inUse = this.pool.filter(item => item.inUse).length;
    const available = this.pool.length - inUse;

    return {
      total: this.pool.length,
      inUse,
      available,
      maxSize: this.maxSize,
      utilization: (inUse / this.pool.length) * 100,
    };
  }

  /**
   * Clear all objects from pool
   */
  clear(): void {
    this.pool = [];
  }
}

/**
 * Factory for creating game object pools
 */
export class GameObjectPools {
  private static instance: GameObjectPools;

  private projectilePool: ObjectPool;
  private enemyPool: ObjectPool;

  private constructor() {
    // Projectile pool
    this.projectilePool = new ObjectPool(
      (): GameObject => ({
        id: '',
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        velocityX: 0,
        velocityY: 0,
      }),
      (obj: GameObject) => {
        obj.id = '';
        obj.x = 0;
        obj.y = 0;
        obj.width = 0;
        obj.height = 0;
        obj.velocityX = 0;
        obj.velocityY = 0;
      },
      20, // Initial size
      50 // Max size
    );

    // Enemy pool - increased max size to handle enemy splitting exponentially
    this.enemyPool = new ObjectPool(
      (): GameObject => ({
        id: '',
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        velocityX: 0,
        velocityY: 0,
        type: 'basic' as EnemyType,
        sizeLevel: 1,
      }),
      (obj: GameObject) => {
        obj.id = '';
        obj.x = 0;
        obj.y = 0;
        obj.width = 0;
        obj.height = 0;
        obj.velocityX = 0;
        obj.velocityY = 0;
        obj.type = 'basic' as EnemyType;
        obj.sizeLevel = 1;
      },
      25, // Initial size - increased for better performance
      150 // Max size - significantly increased to handle exponential enemy splitting
    );
  }

  static getInstance(): GameObjectPools {
    if (!GameObjectPools.instance) {
      GameObjectPools.instance = new GameObjectPools();
    }
    return GameObjectPools.instance;
  }

  /**
   * Get a projectile from the pool with optimized ID generation
   */
  acquireProjectile(): GameObject {
    const projectile = this.projectilePool.acquire();
    projectile.id = PooledIdGenerator.generateProjectileId();
    return projectile;
  }

  /**
   * Return a projectile to the pool
   */
  releaseProjectile(projectile: GameObject): void {
    this.projectilePool.release(projectile);
  }

  /**
   * Release projectiles matching condition
   */
  releaseProjectilesWhere(predicate: (obj: GameObject) => boolean): void {
    this.projectilePool.releaseWhere(predicate);
  }

  /**
   * Get an enemy from the pool with optimized ID generation
   */
  acquireEnemy(): GameObject {
    const enemy = this.enemyPool.acquire();
    enemy.id = PooledIdGenerator.generateEnemyId();
    return enemy;
  }

  /**
   * Get an enemy from the pool for splitting with optimized ID generation
   */
  acquireSplitEnemy(parentId: string, splitIndex: number): GameObject {
    const enemy = this.enemyPool.acquire();
    enemy.id = PooledIdGenerator.generateSplitEnemyId(parentId, splitIndex);
    return enemy;
  }

  /**
   * Return an enemy to the pool
   */
  releaseEnemy(enemy: GameObject): void {
    this.enemyPool.release(enemy);
  }

  /**
   * Release enemies matching condition
   */
  releaseEnemiesWhere(predicate: (obj: GameObject) => boolean): void {
    this.enemyPool.releaseWhere(predicate);
  }

  /**
   * Get statistics for all pools
   */
  getAllStats() {
    return {
      projectiles: this.projectilePool.getStats(),
      enemies: this.enemyPool.getStats(),
    };
  }

  /**
   * Clear all pools and reset ID generators
   */
  clearAll(): void {
    this.projectilePool.clear();
    this.enemyPool.clear();
    PooledIdGenerator.reset();
  }

  /**
   * Log pool statistics (development only)
   */
  logStats(): void {
    if (__DEV__) {
      const stats = this.getAllStats();
      console.log('🎯 Object Pool Stats:', stats);
    }
  }

  /**
   * Export ID generator for external use
   */
  getIdGenerator() {
    return PooledIdGenerator;
  }
}

// Export the ID generator for use in collision system
export { PooledIdGenerator };
