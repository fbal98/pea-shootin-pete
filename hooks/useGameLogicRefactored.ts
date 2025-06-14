/**
 * Refactored Game Logic Hook - Orchestrates specialized systems
 * 
 * This is the new, modular version of useGameLogic that coordinates
 * multiple specialized hooks instead of handling everything in one place.
 * 
 * This serves as a proof-of-concept for the refactoring approach.
 * Once validated, this can replace the original useGameLogic.ts
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import { useGameActions, useIsPlaying, useGameOver } from '@/store/gameStore';
import { useLevelProgressionActions } from '@/store/levelProgressionStore';

// New specialized hooks
import { useGameLoop } from './core/useGameLoop';
import { useLevelManager } from './core/useLevelManager';
import { usePowerUpSystem } from './core/usePowerUpSystem';

// Legacy systems (to be extracted later)
import { GameObject } from '@/utils/gameEngine';
import { MysteryBalloonInstance } from '@/systems/MysteryBalloonManager';
import { CollisionSystem } from '@/systems/CollisionSystem';
import { GameObjectPools } from '@/utils/ObjectPool';
import { ENTITY_CONFIG, PHYSICS } from '@/constants/GameConfig';

interface Enemy extends GameObject {
  size: number;
  type: 'basic' | 'fast' | 'strong' | 'bouncer' | 'splitter' | 'ghost';
  sizeLevel: number;
  velocityX: number;
  velocityY: number;
}

interface Projectile extends GameObject {
  size: number;
  velocityX: number;
  velocityY: number;
  penetration?: boolean;
  explosion?: boolean;
  powerUpType?: string;
}

export const useGameLogicRefactored = (screenWidth: number, gameAreaHeight: number) => {
  // Core game state
  const isPlaying = useIsPlaying();
  const gameOver = useGameOver();
  const gameActions = useGameActions();
  const levelActions = useLevelProgressionActions();

  // Specialized system hooks
  const levelManager = useLevelManager();
  const powerUpSystem = usePowerUpSystem();

  // Game entities (still managed here for now)
  const petePosition = useRef<{ x: number; y: number }>({
    x: screenWidth / 2 - ENTITY_CONFIG.PETE.SIZE / 2,
    y: gameAreaHeight - ENTITY_CONFIG.PETE.SIZE - 20,
  });
  
  const enemies = useRef<Enemy[]>([]);
  const projectiles = useRef<Projectile[]>([]);
  const mysteryBalloons = useRef<MysteryBalloonInstance[]>([]);
  const gameAreaHeightRef = useRef<number>(gameAreaHeight);

  // Force React re-renders for visual updates
  const [renderTrigger, setRenderTrigger] = useState(0);
  const forceRender = useCallback(() => {
    setRenderTrigger(prev => prev + 1);
  }, []);

  // Object pools for performance
  const objectPools = useRef<GameObjectPools | null>(null);
  const collisionSystem = useRef<CollisionSystem | null>(null);

  // Initialize systems
  useEffect(() => {
    if (!objectPools.current) {
      objectPools.current = new GameObjectPools();
    }
    if (!collisionSystem.current) {
      collisionSystem.current = new CollisionSystem();
    }
  }, []);

  // Main game update function
  const handleGameUpdate = useCallback((deltaTime: number) => {
    if (!levelManager.currentLevel || !levelManager.levelConfig) return;

    // Update power-up durations
    powerUpSystem.updateDuration(deltaTime);

    // Update enemy physics
    const levelConfig = levelManager.levelConfig;
    for (let i = enemies.current.length - 1; i >= 0; i--) {
      const enemy = enemies.current[i];
      
      // Apply gravity
      enemy.velocityY += levelConfig.BALLOON_PHYSICS.GRAVITY_PX_S2 * deltaTime;
      
      // Update position
      enemy.x += enemy.velocityX * deltaTime;
      enemy.y += enemy.velocityY * deltaTime;
      
      // Handle bouncing
      if (enemy.y + enemy.size > gameAreaHeightRef.current) {
        enemy.y = gameAreaHeightRef.current - enemy.size;
        enemy.velocityY = -Math.abs(enemy.velocityY) * levelConfig.BALLOON_PHYSICS.BOUNCE.FLOOR;
      }
      
      if (enemy.x <= 0 || enemy.x + enemy.size >= screenWidth) {
        enemy.x = Math.max(0, Math.min(enemy.x, screenWidth - enemy.size));
        enemy.velocityX = -enemy.velocityX * levelConfig.BALLOON_PHYSICS.BOUNCE.WALL;
      }
      
      if (enemy.y <= 0) {
        enemy.y = 0;
        enemy.velocityY = Math.abs(enemy.velocityY) * levelConfig.BALLOON_PHYSICS.BOUNCE.CEIL;
      }
    }

    // Update projectile physics
    for (let i = projectiles.current.length - 1; i >= 0; i--) {
      const projectile = projectiles.current[i];
      
      // Update position
      projectile.x += projectile.velocityX * deltaTime;
      projectile.y += projectile.velocityY * deltaTime;
      
      // Remove off-screen projectiles
      if (projectile.y <= -100 || projectile.x < -100 || projectile.x > screenWidth + 100) {
        if (objectPools.current) {
          objectPools.current.releaseProjectile(projectile);
        }
        projectiles.current.splice(i, 1);
        continue;
      }
    }

    // Handle collisions
    if (collisionSystem.current) {
      const collisionResults = collisionSystem.current.checkProjectileEnemyCollisions(
        projectiles.current,
        enemies.current,
        levelManager.levelConfig
      );

      // Process collision results
      for (const result of collisionResults) {
        // Remove hit projectile (unless it has penetration)
        if (!result.projectile.penetration) {
          const projIndex = projectiles.current.indexOf(result.projectile as Projectile);
          if (projIndex !== -1) {
            if (objectPools.current) {
              objectPools.current.releaseProjectile(result.projectile);
            }
            projectiles.current.splice(projIndex, 1);
          }
        }

        // Remove hit enemy
        const enemyIndex = enemies.current.indexOf(result.enemy as Enemy);
        if (enemyIndex !== -1) {
          enemies.current.splice(enemyIndex, 1);
          
          // Track level progression
          levelActions.enemyEliminated(result.enemy.id, result.points);
          levelActions.projectileHit();
        }

        // Handle enemy splitting
        if (result.splitEnemies && result.splitEnemies.length > 0) {
          enemies.current.push(...(result.splitEnemies as Enemy[]));
        }
      }
    }

    // Check level completion
    levelManager.checkLevelCompletion(enemies.current.length);

    // Trigger React re-render
    forceRender();
  }, [levelManager, powerUpSystem, levelActions, screenWidth, forceRender]);

  // Initialize game loop
  const gameLoop = useGameLoop(isPlaying, gameOver, handleGameUpdate, {
    targetFPS: 60,
    enablePerformanceMonitoring: true,
  });

  // Pete movement
  const updatePetePosition = useCallback((x: number) => {
    const clampedX = Math.max(0, Math.min(x, screenWidth - ENTITY_CONFIG.PETE.SIZE));
    petePosition.current = {
      x: clampedX,
      y: petePosition.current.y,
    };
  }, [screenWidth]);

  // Shooting projectiles
  const shootProjectile = useCallback(() => {
    if (!objectPools.current || gameOver || !isPlaying) return;

    // Track shot fired
    levelActions.projectileFired();

    // Create base projectile
    const baseProjectile = objectPools.current.getProjectile();
    baseProjectile.x = petePosition.current.x + ENTITY_CONFIG.PETE.SIZE / 2 - ENTITY_CONFIG.PROJECTILE.SIZE / 2;
    baseProjectile.y = petePosition.current.y;
    baseProjectile.velocityX = 0;
    baseProjectile.velocityY = -ENTITY_CONFIG.PROJECTILE.SPEED;
    baseProjectile.size = ENTITY_CONFIG.PROJECTILE.SIZE;
    baseProjectile.width = ENTITY_CONFIG.PROJECTILE.SIZE;
    baseProjectile.height = ENTITY_CONFIG.PROJECTILE.SIZE;

    // Apply power-up effects and create projectiles
    const newProjectiles = powerUpSystem.createProjectiles(baseProjectile);
    projectiles.current.push(...(newProjectiles as Projectile[]));
  }, [gameOver, isPlaying, levelActions, powerUpSystem]);

  // Reset game entities when game resets
  useEffect(() => {
    if (!isPlaying && !gameOver) {
      enemies.current = [];
      projectiles.current = [];
      mysteryBalloons.current = [];
      
      // Reset Pete position
      petePosition.current = {
        x: screenWidth / 2 - ENTITY_CONFIG.PETE.SIZE / 2,
        y: gameAreaHeight - ENTITY_CONFIG.PETE.SIZE - 20,
      };

      // Reset level manager
      levelManager.resetInitialization();
    }
  }, [isPlaying, gameOver, screenWidth, gameAreaHeight, levelManager]);

  return {
    // Game entities
    petePosition: petePosition.current,
    enemies: enemies.current,
    projectiles: projectiles.current,
    mysteryBalloons: mysteryBalloons.current,
    gameAreaHeightRef,

    // Actions
    updatePetePosition,
    shootProjectile,

    // System states
    gameLoop,
    levelManager,
    powerUpSystem,

    // Debug info
    debugInfo: {
      fps: gameLoop.fps,
      enemyCount: enemies.current.length,
      projectileCount: projectiles.current.length,
      isLevelManagerInitialized: levelManager.isInitialized,
      powerUpActive: powerUpSystem.isActive,
    },
  };
};