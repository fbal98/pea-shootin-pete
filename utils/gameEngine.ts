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

export const updatePosition = (
  obj: GameObject,
  deltaTime: number
): GameObject => {
  return {
    ...obj,
    x: obj.x + (obj.velocityX || 0) * deltaTime,
    y: obj.y + (obj.velocityY || 0) * deltaTime,
  };
};

export const isOutOfBounds = (
  obj: GameObject,
  screenWidth: number,
  screenHeight: number
): boolean => {
  return (
    obj.x + obj.width < 0 ||
    obj.x > screenWidth ||
    obj.y + obj.height < 0 ||
    obj.y > screenHeight
  );
};

// Constants for bouncing physics
export const GRAVITY = 500; // pixels per second squared
export const BOUNCE_DAMPING = 0.8; // energy lost on bounce
export const MIN_BOUNCE_VELOCITY = 50; // minimum velocity to keep bouncing

export const updateBouncingEnemy = (
  enemy: GameObject,
  deltaTime: number,
  screenWidth: number,
  screenHeight: number
): GameObject => {
  let newEnemy = { ...enemy };
  
  // Apply gravity
  newEnemy.velocityY = (newEnemy.velocityY || 0) + GRAVITY * deltaTime;
  
  // Update position
  newEnemy.x += (newEnemy.velocityX || 0) * deltaTime;
  newEnemy.y += (newEnemy.velocityY || 0) * deltaTime;
  
  // Bounce off floor
  if (newEnemy.y + newEnemy.height > screenHeight - 50) { // Leave space for UI
    newEnemy.y = screenHeight - 50 - newEnemy.height;
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

export const splitEnemy = (enemy: GameObject): GameObject[] => {
  if (!enemy.sizeLevel || enemy.sizeLevel <= 1) {
    return []; // Smallest size, don't split
  }
  
  const newSize = enemy.sizeLevel - 1;
  const newWidth = enemy.width * 0.7; // Smaller enemies are 70% the size
  const newHeight = enemy.height * 0.7;
  
  // Create two smaller enemies with opposite horizontal velocities
  const timestamp = Date.now();
  const random1 = Math.random().toString(36).substr(2, 9);
  const random2 = Math.random().toString(36).substr(2, 9);
  
  const enemy1: GameObject = {
    id: `${enemy.id}-split1-${timestamp}-${random1}`,
    x: enemy.x - newWidth / 4,
    y: enemy.y,
    width: newWidth,
    height: newHeight,
    velocityX: -150, // Move left
    velocityY: -200, // Bounce up
    type: enemy.type,
    sizeLevel: newSize,
  };
  
  const enemy2: GameObject = {
    id: `${enemy.id}-split2-${timestamp}-${random2}`,
    x: enemy.x + enemy.width - newWidth * 0.75,
    y: enemy.y,
    width: newWidth,
    height: newHeight,
    velocityX: 150, // Move right
    velocityY: -200, // Bounce up
    type: enemy.type,
    sizeLevel: newSize,
  };
  
  return [enemy1, enemy2];
};