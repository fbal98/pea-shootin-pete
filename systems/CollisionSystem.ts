import { GameObject } from '@/utils/gameEngine';
import { GAME_CONFIG } from '@/constants/GameConfig';
import { GameObjectPools } from '@/utils/ObjectPool';
import { nanoid } from 'nanoid/non-secure';

export interface CollisionEvent {
  type: 'projectile-enemy' | 'enemy-pete';
  projectile?: GameObject;
  enemy: GameObject;
  pete?: GameObject;
}

export interface CollisionResult {
  events: CollisionEvent[];
  hitProjectileIds: Set<string>;
  hitEnemyIds: Set<string>;
  splitEnemies: GameObject[];
  scoreIncrease: number;
  shouldGameEnd: boolean;
}

export class CollisionSystem {
  /**
   * Check AABB collision between two game objects
   */
  static checkCollision(obj1: GameObject, obj2: GameObject): boolean {
    return (
      obj1.x < obj2.x + obj2.width &&
      obj1.x + obj1.width > obj2.x &&
      obj1.y < obj2.y + obj2.height &&
      obj1.y + obj1.height > obj2.y
    );
  }

  /**
   * Process all collisions in the game and return results
   */
  static processCollisions(
    projectiles: GameObject[],
    enemies: GameObject[],
    pete: GameObject,
    objectPools: GameObjectPools
  ): CollisionResult {
    const result: CollisionResult = {
      events: [],
      hitProjectileIds: new Set(),
      hitEnemyIds: new Set(),
      splitEnemies: [],
      scoreIncrease: 0,
      shouldGameEnd: false,
    };

    // Check projectile-enemy collisions
    this.processProjectileEnemyCollisions(projectiles, enemies, result, objectPools);

    // Check enemy-pete collisions
    this.processEnemyPeteCollisions(enemies, pete, result);

    return result;
  }

  /**
   * Process collisions between projectiles and enemies
   */
  private static processProjectileEnemyCollisions(
    projectiles: GameObject[],
    enemies: GameObject[],
    result: CollisionResult,
    objectPools: GameObjectPools
  ): void {
    for (const projectile of projectiles) {
      if (result.hitProjectileIds.has(projectile.id)) continue;

      for (const enemy of enemies) {
        if (result.hitEnemyIds.has(enemy.id)) continue;

        if (this.checkCollision(projectile, enemy)) {
          // Record collision event
          result.events.push({
            type: 'projectile-enemy',
            projectile,
            enemy,
          });

          // Mark objects as hit
          result.hitProjectileIds.add(projectile.id);
          result.hitEnemyIds.add(enemy.id);

          // Calculate score
          const points = this.calculateScore(enemy);
          result.scoreIncrease += points;

          // Handle enemy splitting
          const splitEnemies = this.splitEnemy(enemy, objectPools);
          result.splitEnemies.push(...splitEnemies);

          // Only one collision per projectile
          break;
        }
      }
    }
  }

  /**
   * Process collisions between enemies and Pete
   */
  private static processEnemyPeteCollisions(
    enemies: GameObject[],
    pete: GameObject,
    result: CollisionResult
  ): void {
    for (const enemy of enemies) {
      if (this.checkCollision(enemy, pete)) {
        result.events.push({
          type: 'enemy-pete',
          enemy,
          pete,
        });
        result.shouldGameEnd = true;
        return; // Game over, no need to check more
      }
    }
  }

  /**
   * Calculate score based on enemy size level
   */
  private static calculateScore(enemy: GameObject): number {
    const sizeLevel = enemy.sizeLevel || 1;
    switch (sizeLevel) {
      case 1:
        return GAME_CONFIG.SCORE_MULTIPLIER.SIZE_1;
      case 2:
        return GAME_CONFIG.SCORE_MULTIPLIER.SIZE_2;
      case 3:
        return GAME_CONFIG.SCORE_MULTIPLIER.SIZE_3;
      default:
        return GAME_CONFIG.SCORE_MULTIPLIER.SIZE_1;
    }
  }

  /**
   * Split an enemy into smaller enemies if possible
   */
  private static splitEnemy(enemy: GameObject, objectPools: GameObjectPools): GameObject[] {
    if (!enemy.sizeLevel || enemy.sizeLevel <= 1) {
      return []; // Smallest size, don't split
    }

    const newSizeLevel = enemy.sizeLevel - 1;
    const sizeMultiplier = this.getSizeMultiplier(newSizeLevel);
    const newWidth = GAME_CONFIG.ENEMY_BASE_SIZE * sizeMultiplier;
    const newHeight = GAME_CONFIG.ENEMY_BASE_SIZE * sizeMultiplier;

    // Create two smaller enemies using object pool
    const enemy1 = objectPools.acquireEnemy();
    enemy1.id = `${enemy.id}-split1-${nanoid(8)}`;
    enemy1.x = enemy.x - newWidth / 4;
    enemy1.y = enemy.y;
    enemy1.width = newWidth;
    enemy1.height = newHeight;
    enemy1.velocityX = -GAME_CONFIG.SPLIT_HORIZONTAL_VELOCITY;
    enemy1.velocityY = -GAME_CONFIG.SPLIT_VERTICAL_VELOCITY;
    enemy1.type = enemy.type;
    enemy1.sizeLevel = newSizeLevel;

    const enemy2 = objectPools.acquireEnemy();
    enemy2.id = `${enemy.id}-split2-${nanoid(8)}`;
    enemy2.x = enemy.x + enemy.width - newWidth * 0.75;
    enemy2.y = enemy.y;
    enemy2.width = newWidth;
    enemy2.height = newHeight;
    enemy2.velocityX = GAME_CONFIG.SPLIT_HORIZONTAL_VELOCITY;
    enemy2.velocityY = -GAME_CONFIG.SPLIT_VERTICAL_VELOCITY;
    enemy2.type = enemy.type;
    enemy2.sizeLevel = newSizeLevel;

    return [enemy1, enemy2];
  }

  /**
   * Get size multiplier for enemy size level
   */
  private static getSizeMultiplier(sizeLevel: number): number {
    switch (sizeLevel) {
      case 1:
        return GAME_CONFIG.ENEMY_SIZE_MULTIPLIERS.SIZE_1;
      case 2:
        return GAME_CONFIG.ENEMY_SIZE_MULTIPLIERS.SIZE_2;
      case 3:
        return GAME_CONFIG.ENEMY_SIZE_MULTIPLIERS.SIZE_3;
      default:
        return GAME_CONFIG.ENEMY_SIZE_MULTIPLIERS.SIZE_1;
    }
  }
}
