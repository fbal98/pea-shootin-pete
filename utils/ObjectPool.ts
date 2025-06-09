/**
 * Object pooling system for game objects to reduce garbage collection
 */

import { GameObject } from '@/utils/gameEngine';
import { EnemyType } from '@/constants/GameConfig';

interface PooledObject {
  inUse: boolean;
  object: GameObject;
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

    // Pool is full, force create a new object (not pooled)
    console.warn('Object pool exhausted, creating non-pooled object');
    return this.createObject();
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

    // Enemy pool
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
      15, // Initial size
      40 // Max size
    );
  }

  static getInstance(): GameObjectPools {
    if (!GameObjectPools.instance) {
      GameObjectPools.instance = new GameObjectPools();
    }
    return GameObjectPools.instance;
  }

  /**
   * Get a projectile from the pool
   */
  acquireProjectile(): GameObject {
    return this.projectilePool.acquire();
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
   * Get an enemy from the pool
   */
  acquireEnemy(): GameObject {
    return this.enemyPool.acquire();
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
   * Clear all pools
   */
  clearAll(): void {
    this.projectilePool.clear();
    this.enemyPool.clear();
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
}
