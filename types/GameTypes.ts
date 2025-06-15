/**
 * Unified Game Object Interfaces
 * Single source of truth for all game entity data structures
 */

// Base GameObject interface - Common properties for all game entities
export interface GameObject {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  velocityX?: number;
  velocityY?: number;
  type?: 'basic' | 'fast' | 'strong' | 'bouncer' | 'splitter' | 'ghost';
  sizeLevel?: number;
  age?: number;
  createdAt?: number;
}

// Enhanced GameObject for rendering with additional visual properties
export interface RenderableGameObject extends GameObject {
  // Velocity as object for enhanced rendering components
  velocity?: { x: number; y: number };
  
  // Health properties for threat visualization
  health?: number;
  maxHealth?: number;
  
  // Visual enhancement properties
  age?: number;
  createdAt?: number;
  
  // Projectile-specific properties
  powerUpType?: string;
  penetration?: boolean;
  explosion?: boolean;
  
  // Enemy-specific properties
  size?: number; // Backward compatibility with existing size property
}

// Enemy-specific interface
export interface Enemy extends GameObject {
  type: 'basic' | 'fast' | 'strong' | 'bouncer' | 'splitter' | 'ghost';
  sizeLevel: number;
  size: number;
  velocityX: number;
  velocityY: number;
}

// Projectile-specific interface
export interface Projectile extends GameObject {
  velocityX: number;
  velocityY: number;
  size?: number;
  penetration?: boolean;
  explosion?: boolean;
  powerUpType?: string;
  age?: number;
  createdAt?: number;
}

// Pete (player) interface
export interface Pete {
  x: number;
  y: number;
  color: string;
}

// Game state interface
export interface GameState {
  pete: Pete;
  enemies: Enemy[];
  projectiles: Projectile[];
  mysteryBalloons: GameObject[];
  score: number;
  gameOver: boolean;
  level: number;
}

// Physics configuration interface
export interface PhysicsConfig {
  GRAVITY_PX_S2: number;
  AIR_RESISTANCE: number;
  BOUNCE: {
    FLOOR: number;
    WALL: number;
    CEIL: number;
  };
  MIN_BOUNCE_VELOCITY: number;
  MIN_HORIZONTAL_VELOCITY: number;
  MAX_VELOCITY?: number;
}

// Level configuration interface
export interface LevelConfig {
  ENTITY_CONFIG: any;
  BALLOON_PHYSICS: PhysicsConfig;
  INPUT_CONFIG: any;
  SCORING_CONFIG: any;
  ENEMY_CONFIG: any;
  ANIMATION_CONFIG: any;
  UI_CONFIG: any;
  LEVEL_OVERRIDES?: any;
}

// Collision event interface
export interface CollisionEvent {
  type: 'projectile-enemy' | 'enemy-pete';
  projectile?: GameObject;
  enemy: GameObject;
  pete?: GameObject;
}

// Collision result interface
export interface CollisionResult {
  events: CollisionEvent[];
  hitProjectileIds: Set<string>;
  hitEnemyIds: Set<string>;
  splitEnemies: GameObject[];
  scoreIncrease: number;
  shouldGameEnd: boolean;
}

// Export type aliases for backward compatibility
export type EnemyType = Enemy['type'];
export type GameObjectType = GameObject;
export type ProjectileType = Projectile;