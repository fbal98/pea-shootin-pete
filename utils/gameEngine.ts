import { nanoid } from 'nanoid/non-secure';

export interface GameObject {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  velocityX?: number;
  velocityY?: number;
  type?: 'basic' | 'fast' | 'strong';
  sizeLevel?: number; // 1 = smallest, 2 = medium, 3 = large
}

export interface GameState {
  pete: GameObject;
  enemies: GameObject[];
  projectiles: GameObject[];
  score: number;
  gameOver: boolean;
  level: number;
}

export const checkCollision = (obj1: GameObject, obj2: GameObject): boolean => {
  return (
    obj1.x < obj2.x + obj2.width &&
    obj1.x + obj1.width > obj2.x &&
    obj1.y < obj2.y + obj2.height &&
    obj1.y + obj1.height > obj2.y
  );
};

export const updatePosition = (obj: GameObject, deltaTime: number): GameObject => {
  return {
    ...obj,
    x: obj.x + (obj.velocityX || 0) * deltaTime,
    y: obj.y + (obj.velocityY || 0) * deltaTime,
  };
};

// In-place version for performance (no new objects created)
export const updatePositionInPlace = (obj: GameObject, deltaTime: number): void => {
  obj.x += (obj.velocityX || 0) * deltaTime;
  obj.y += (obj.velocityY || 0) * deltaTime;
};

export const isOutOfBounds = (
  obj: GameObject,
  screenWidth: number,
  screenHeight: number
): boolean => {
  return (
    obj.x + obj.width < 0 || obj.x > screenWidth || obj.y + obj.height < 0 || obj.y > screenHeight
  );
};

// Constants for bouncing physics
export const GRAVITY = 500; // pixels per second squared
export const BOUNCE_DAMPING = 0.8; // energy lost on bounce
export const MIN_BOUNCE_VELOCITY = 50; // minimum velocity to keep bouncing

// Constants for enemy splitting
export const SPLIT_HORIZONTAL_VELOCITY = 150; // horizontal velocity when enemy splits
export const SPLIT_VERTICAL_VELOCITY = 200; // upward velocity when enemy splits

// UI Constants
export const HUD_HEIGHT = 50; // Height reserved for HUD at bottom

export const updateBouncingEnemy = (
  enemy: GameObject,
  deltaTime: number,
  screenWidth: number,
  gameAreaBottom: number
): GameObject => {
  let newEnemy = { ...enemy };

  // Apply gravity
  newEnemy.velocityY = (newEnemy.velocityY || 0) + GRAVITY * deltaTime;

  // Update position
  newEnemy.x += (newEnemy.velocityX || 0) * deltaTime;
  newEnemy.y += (newEnemy.velocityY || 0) * deltaTime;

  // Debug logging (remove in production)
  if (__DEV__ && Math.random() < 0.02) { // Log 2% of the time
    console.log('Enemy physics:', {
      id: enemy.id.substring(0, 8),
      oldY: enemy.y,
      newY: newEnemy.y,
      deltaY: newEnemy.y - enemy.y,
      oldVelocityY: enemy.velocityY || 0,
      newVelocityY: newEnemy.velocityY,
      gravityApplied: GRAVITY * deltaTime,
      deltaTime,
      gameAreaBottom,
      willBounce: newEnemy.y + newEnemy.height > gameAreaBottom
    });
  }

  // Bounce off floor
  if (newEnemy.y + newEnemy.height > gameAreaBottom) {
    newEnemy.y = gameAreaBottom - newEnemy.height;
    newEnemy.velocityY = -Math.abs(newEnemy.velocityY || 0) * BOUNCE_DAMPING;

    // Stop tiny bounces
    if (Math.abs(newEnemy.velocityY || 0) < MIN_BOUNCE_VELOCITY) {
      newEnemy.velocityY = -MIN_BOUNCE_VELOCITY;
    }
  }

  // Bounce off walls
  if (newEnemy.x <= 0) {
    newEnemy.x = 0;
    newEnemy.velocityX = Math.abs(newEnemy.velocityX || 0);
  } else if (newEnemy.x + newEnemy.width >= screenWidth) {
    newEnemy.x = screenWidth - newEnemy.width;
    newEnemy.velocityX = -Math.abs(newEnemy.velocityX || 0);
  }

  // Bounce off ceiling
  if (newEnemy.y <= 0) {
    newEnemy.y = 0;
    newEnemy.velocityY = Math.abs(newEnemy.velocityY || 0);
  }

  return newEnemy;
};

// In-place version for performance (no new objects created)
export const updateBouncingEnemyInPlace = (
  enemy: GameObject,
  deltaTime: number,
  screenWidth: number,
  gameAreaBottom: number
): void => {
  // Apply gravity
  enemy.velocityY = (enemy.velocityY || 0) + GRAVITY * deltaTime;

  // Update position
  enemy.x += (enemy.velocityX || 0) * deltaTime;
  enemy.y += (enemy.velocityY || 0) * deltaTime;

  // Bounce off floor
  if (enemy.y + enemy.height > gameAreaBottom) {
    enemy.y = gameAreaBottom - enemy.height;
    enemy.velocityY = -Math.abs(enemy.velocityY || 0) * BOUNCE_DAMPING;

    // Stop tiny bounces
    if (Math.abs(enemy.velocityY || 0) < MIN_BOUNCE_VELOCITY) {
      enemy.velocityY = -MIN_BOUNCE_VELOCITY;
    }
  }

  // Bounce off walls
  if (enemy.x <= 0) {
    enemy.x = 0;
    enemy.velocityX = Math.abs(enemy.velocityX || 0);
  } else if (enemy.x + enemy.width >= screenWidth) {
    enemy.x = screenWidth - enemy.width;
    enemy.velocityX = -Math.abs(enemy.velocityX || 0);
  }

  // Bounce off ceiling
  if (enemy.y <= 0) {
    enemy.y = 0;
    enemy.velocityY = Math.abs(enemy.velocityY || 0);
  }
};

export const splitEnemy = (enemy: GameObject): GameObject[] => {
  if (!enemy.sizeLevel || enemy.sizeLevel <= 1) {
    return []; // Smallest size, don't split
  }

  const newSize = enemy.sizeLevel - 1;
  const newWidth = enemy.width * 0.7; // Smaller enemies are 70% the size
  const newHeight = enemy.height * 0.7;

  // Create two smaller enemies with opposite horizontal velocities
  const enemy1: GameObject = {
    id: `${enemy.id}-split1-${nanoid(8)}`,
    x: enemy.x - newWidth / 4,
    y: enemy.y,
    width: newWidth,
    height: newHeight,
    velocityX: -SPLIT_HORIZONTAL_VELOCITY, // Move left
    velocityY: -SPLIT_VERTICAL_VELOCITY, // Bounce up
    type: enemy.type,
    sizeLevel: newSize,
  };

  const enemy2: GameObject = {
    id: `${enemy.id}-split2-${nanoid(8)}`,
    x: enemy.x + enemy.width - newWidth * 0.75,
    y: enemy.y,
    width: newWidth,
    height: newHeight,
    velocityX: SPLIT_HORIZONTAL_VELOCITY, // Move right
    velocityY: -SPLIT_VERTICAL_VELOCITY, // Bounce up
    type: enemy.type,
    sizeLevel: newSize,
  };

  return [enemy1, enemy2];
};
