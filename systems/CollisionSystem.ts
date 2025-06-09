import { GameObject } from '@/utils/gameEngine';
import { GAME_CONFIG } from '@/constants/GameConfig';

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
    pete: GameObject
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
    this.processProjectileEnemyCollisions(projectiles, enemies, result);

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
    result: CollisionResult
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
          const splitEnemies = this.splitEnemy(enemy);
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
  private static splitEnemy(enemy: GameObject): GameObject[] {
    if (!enemy.sizeLevel || enemy.sizeLevel <= 1) {
      return []; // Smallest size, don't split
    }

    const newSizeLevel = enemy.sizeLevel - 1;
    const sizeMultiplier = this.getSizeMultiplier(newSizeLevel);
    const newWidth = GAME_CONFIG.ENEMY_BASE_SIZE * sizeMultiplier;
    const newHeight = GAME_CONFIG.ENEMY_BASE_SIZE * sizeMultiplier;

    // Create two smaller enemies with opposite horizontal velocities
    const enemy1: GameObject = {
      id: `${enemy.id}-split1-${Date.now()}-${Math.random()}`,
      x: enemy.x - newWidth / 4,
      y: enemy.y,
      width: newWidth,
      height: newHeight,
      velocityX: -GAME_CONFIG.SPLIT_HORIZONTAL_VELOCITY,
      velocityY: -GAME_CONFIG.SPLIT_VERTICAL_VELOCITY,
      type: enemy.type,
      sizeLevel: newSizeLevel,
    };

    const enemy2: GameObject = {
      id: `${enemy.id}-split2-${Date.now()}-${Math.random()}`,
      x: enemy.x + enemy.width - newWidth * 0.75,
      y: enemy.y,
      width: newWidth,
      height: newHeight,
      velocityX: GAME_CONFIG.SPLIT_HORIZONTAL_VELOCITY,
      velocityY: -GAME_CONFIG.SPLIT_VERTICAL_VELOCITY,
      type: enemy.type,
      sizeLevel: newSizeLevel,
    };

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
