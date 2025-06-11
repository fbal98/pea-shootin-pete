import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameActions, useUIState } from '@/store/gameStore';
import { 
  GAME_CONFIG, 
  BALLOON_PHYSICS, 
  getBalloonSize, 
  getBalloonPoints,
  ENTITY_CONFIG 
} from '@/constants/GameConfig';
import { GameObject } from '@/utils/gameEngine';
import { nanoid } from 'nanoid/non-secure';

interface Enemy extends GameObject {
  id: string;
  x: number;
  y: number;
  size: number;
  type: 'basic' | 'fast' | 'strong';
  sizeLevel: number;
  velocityX: number;
  velocityY: number;
}

interface Projectile extends GameObject {
  id: string;
  x: number;
  y: number;
  size: number;
  velocityY: number;
}

export const useHyperCasualGameLogic = (screenWidth: number, gameAreaHeight: number) => {
  const uiState = useUIState();
  const actions = useGameActions();
  
  // Game state refs
  const petePosition = useRef(screenWidth / 2 - GAME_CONFIG.PETE_SIZE / 2);
  const enemies = useRef<Enemy[]>([]);
  const projectiles = useRef<Projectile[]>([]);
  const gameAreaHeightRef = useRef(gameAreaHeight);
  
  // Force re-render for visual updates
  const [, forceUpdate] = useState(0);
  
  // Update Pete position
  const updatePetePosition = useCallback((x: number) => {
    petePosition.current = x;
    forceUpdate(prev => prev + 1);
  }, []);
  
  // Shoot projectile
  const shootProjectile = useCallback(() => {
    if (uiState.gameOver) return;
    
    const projectile: Projectile = {
      id: nanoid(),
      x: petePosition.current + GAME_CONFIG.PETE_SIZE / 2 - GAME_CONFIG.PROJECTILE_SIZE / 2,
      y: gameAreaHeight - GAME_CONFIG.PETE_SIZE - GAME_CONFIG.BOTTOM_PADDING - GAME_CONFIG.PROJECTILE_SIZE,
      size: GAME_CONFIG.PROJECTILE_SIZE,
      width: GAME_CONFIG.PROJECTILE_SIZE,
      height: GAME_CONFIG.PROJECTILE_SIZE,
      velocityY: -GAME_CONFIG.PROJECTILE_SPEED,
    };
    
    projectiles.current.push(projectile);
    forceUpdate(prev => prev + 1);
  }, [uiState.gameOver, gameAreaHeight]);
  
  // Spawn enemy
  const spawnEnemy = useCallback(() => {
    const types: Array<'basic' | 'fast' | 'strong'> = ['basic'];
    if (uiState.level >= 2) types.push('fast');
    if (uiState.level >= 3) types.push('strong');
    
    const type = types[Math.floor(Math.random() * types.length)];
    const size = GAME_CONFIG.ENEMY_BASE_SIZE;
    
    const enemy: Enemy = {
      id: nanoid(),
      x: Math.random() * (screenWidth - size),
      y: -size,
      size,
      width: size,
      height: size,
      type,
      sizeLevel: 3,
      velocityX: (Math.random() - 0.5) * BALLOON_PHYSICS.SPAWN_VELOCITY.HORIZONTAL_RANGE,
      velocityY: Math.random() * BALLOON_PHYSICS.SPAWN_VELOCITY.VERTICAL_RANDOM + BALLOON_PHYSICS.SPAWN_VELOCITY.VERTICAL_BASE,
    };
    
    enemies.current.push(enemy);
    forceUpdate(prev => prev + 1);
  }, [screenWidth, uiState.level]);
  
  // Game loop
  useEffect(() => {
    if (!uiState.isPlaying || uiState.gameOver) return;
    
    let lastTime = performance.now();
    let spawnTimer = 0;
    
    const gameLoop = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      
      // Update enemy spawn timer
      spawnTimer += deltaTime;
      const spawnInterval = actions.enemySpawnInterval() / 1000;
      if (spawnTimer >= spawnInterval) {
        spawnEnemy();
        spawnTimer = 0;
      }
      
      // Update projectiles
      projectiles.current = projectiles.current.filter(p => {
        p.y += p.velocityY * deltaTime;
        return p.y > -p.size;
      });
      
      // Update enemies with balloon physics
      enemies.current = enemies.current.filter(enemy => {
        // Balloon physics: lighter gravity and minimal air resistance
        const balloonGravity = GAME_CONFIG.GRAVITY * BALLOON_PHYSICS.GRAVITY_MULTIPLIER;
        const airResistance = BALLOON_PHYSICS.AIR_RESISTANCE;
        const minBounceVelocity = BALLOON_PHYSICS.MIN_BOUNCE_VELOCITY;
        
        // Apply lighter gravity
        enemy.velocityY += balloonGravity * deltaTime;
        
        // Apply air resistance to both directions
        enemy.velocityX *= airResistance;
        enemy.velocityY *= airResistance;
        
        // Update position
        enemy.x += enemy.velocityX * deltaTime;
        enemy.y += enemy.velocityY * deltaTime;
        
        // Bounce off walls with minimal energy loss
        if (enemy.x <= 0 || enemy.x >= screenWidth - enemy.size) {
          enemy.velocityX *= -BALLOON_PHYSICS.BOUNCE_COEFFICIENTS.WALLS;
          enemy.x = Math.max(0, Math.min(screenWidth - enemy.size, enemy.x));
        }
        
        // Bounce off ceiling
        if (enemy.y <= 0) {
          enemy.velocityY *= -BALLOON_PHYSICS.BOUNCE_COEFFICIENTS.CEILING;
          enemy.y = 0;
        }
        
        // Bounce off floor with super-bouncy trampoline effect
        if (enemy.y >= gameAreaHeightRef.current - enemy.size) {
          // Super energetic trampoline floor - like original Pang physics with high energy return
          enemy.velocityY = Math.max(-minBounceVelocity, enemy.velocityY * -BALLOON_PHYSICS.BOUNCE_COEFFICIENTS.FLOOR);
          enemy.y = gameAreaHeightRef.current - enemy.size;
        }
        
        // Remove if somehow fallen off screen
        return enemy.y < gameAreaHeightRef.current + enemy.size;
      });
      
      // Check collisions
      const hitEnemyIds = new Set<string>();
      const hitProjectileIds = new Set<string>();
      const newEnemies: Enemy[] = [];
      
      // Find all collisions first
      projectiles.current.forEach(projectile => {
        if (hitProjectileIds.has(projectile.id)) return;
        
        enemies.current.forEach(enemy => {
          if (hitEnemyIds.has(enemy.id) || hitProjectileIds.has(projectile.id)) return;
          
          if (checkCollision(projectile, enemy)) {
            // Mark both as hit
            hitEnemyIds.add(enemy.id);
            hitProjectileIds.add(projectile.id);
            
            // Update score based on enemy size
            const points = getBalloonPoints(enemy.sizeLevel as 1 | 2 | 3);
            actions.updateScore(points);
            
            // Split enemy if not smallest size
            if (enemy.sizeLevel > 1) {
              const newSize = enemy.sizeLevel - 1;
              const size = getBalloonSize(newSize as 1 | 2 | 3);
              
              // Create two smaller enemies
              for (let i = 0; i < 2; i++) {
                const splitEnemy: Enemy = {
                  id: nanoid(),
                  x: enemy.x + (i === 0 ? -BALLOON_PHYSICS.SPLIT.OFFSET_DISTANCE : BALLOON_PHYSICS.SPLIT.OFFSET_DISTANCE),
                  y: enemy.y,
                  size,
                  width: size,
                  height: size,
                  type: enemy.type,
                  sizeLevel: newSize,
                  velocityX: (i === 0 ? -1 : 1) * BALLOON_PHYSICS.SPLIT.HORIZONTAL_VELOCITY,
                  velocityY: -BALLOON_PHYSICS.SPLIT.VERTICAL_VELOCITY,
                };
                newEnemies.push(splitEnemy);
              }
            }
          }
        });
      });
      
      // Keep enemies that weren't hit and add new split enemies
      enemies.current = [
        ...enemies.current.filter(enemy => !hitEnemyIds.has(enemy.id)),
        ...newEnemies
      ];
      
      // Keep projectiles that didn't hit anything
      projectiles.current = projectiles.current.filter(projectile => !hitProjectileIds.has(projectile.id));
      
      // Force re-render
      forceUpdate(prev => prev + 1);
      
      // Continue loop
      requestAnimationFrame(gameLoop);
    };
    
    const animationId = requestAnimationFrame(gameLoop);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [uiState.isPlaying, uiState.gameOver, spawnEnemy, actions, screenWidth]);
  
  return {
    petePosition,
    enemies: enemies.current,
    projectiles: projectiles.current,
    gameAreaHeightRef,
    updatePetePosition,
    shootProjectile,
  };
};

// Simple AABB collision detection
function checkCollision(a: GameObject, b: GameObject): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}