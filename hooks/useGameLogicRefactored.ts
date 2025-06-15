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
import { useLevelProgressionActions, useLevelStartTime } from '@/store/levelProgressionStore';

// New specialized hooks
import { useGameLoop } from './core/useGameLoop';
import { useLevelManager } from './core/useLevelManager';
import { usePowerUpSystem } from './core/usePowerUpSystem';

// Legacy systems (to be extracted later)
import { MysteryBalloonInstance } from '@/systems/MysteryBalloonManager';
import { CollisionSystem } from '@/systems/CollisionSystem';
import { GameObjectPools } from '@/utils/ObjectPool';
import { ENTITY_CONFIG, PHYSICS, getBalloonSize, getEnemySpeedBySize, getSpawnYPosition } from '@/constants/GameConfig';
import { EnemyWave, EnemySpawnDefinition } from '@/types/LevelTypes';
import { Enemy, Projectile, GameObject } from '@/types/GameTypes';

export const useGameLogicRefactored = (screenWidth: number, gameAreaHeight: number) => {
  // Core game state
  const isPlaying = useIsPlaying();
  const gameOver = useGameOver();
  const gameActions = useGameActions();
  const levelActions = useLevelProgressionActions();
  const levelStartTime = useLevelStartTime();

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

  // Wave management state
  const activeWaves = useRef<Map<string, {
    wave: EnemyWave;
    startTime: number;
    spawnedCount: number;
    spawnedCountPerEnemy?: Record<number, number>;
  }>>(new Map());
  const waveSpawnTimers = useRef<Map<string, number>>(new Map());

  // Note: Removed forced re-renders for performance - entities update via refs
  // React will re-render naturally when Zustand state changes (score, lives, etc.)

  // Object pools for performance
  const objectPools = useRef<GameObjectPools | null>(null);

  // Reusable Pete GameObject for collision detection (avoid creating new objects every frame)
  const peteGameObject = useRef<GameObject>({
    id: 'pete',
    x: 0,
    y: 0,
    width: ENTITY_CONFIG.PETE.SIZE,
    height: ENTITY_CONFIG.PETE.SIZE
  });


  // Initialize systems
  useEffect(() => {
    if (!objectPools.current) {
      objectPools.current = GameObjectPools.getInstance();
    }
  }, []);

  // Enemy spawning function from waves (CRITICAL - Missing from refactored version)
  const spawnEnemyFromWave = useCallback(
    (enemyDef: EnemySpawnDefinition, wave: EnemyWave, spawnIndex: number) => {
      if (!levelManager.levelConfig || !objectPools.current) return;

      const config = levelManager.levelConfig;
      const size = getBalloonSize(enemyDef.sizeLevel);

      // Use original game spawn patterns
      let spawnX: number;
      let spawnY: number;

      // Get Y position from original game's fixed spawn heights
      spawnY = getSpawnYPosition(spawnIndex, gameAreaHeight);

      // Calculate X position based on wave pattern
      switch (wave.spawnPattern) {
        case 'two_small':
          // Classic pattern: enemies at 20% and 80% of screen width
          spawnX = spawnIndex % 2 === 0 ? screenWidth * 0.2 : screenWidth * 0.8;
          break;
        case 'three_small_wide':
          // Wide spread: 15%, 50%, 85%
          const positions = [0.15, 0.5, 0.85];
          spawnX = screenWidth * positions[spawnIndex % 3];
          break;
        case 'pipes':
          // Vertical columns: 25%, 50%, 75%
          const pipePositions = [0.25, 0.5, 0.75];
          spawnX = screenWidth * pipePositions[spawnIndex % 3];
          break;
        case 'crazy':
          // Many positions: 10%, 30%, 50%, 70%, 90%
          const crazyPositions = [0.1, 0.3, 0.5, 0.7, 0.9];
          spawnX = screenWidth * crazyPositions[spawnIndex % 5];
          break;
        case 'entrap':
          // Edge positions: 10% and 90%
          spawnX = spawnIndex % 2 === 0 ? screenWidth * 0.1 : screenWidth * 0.9;
          break;
        default:
          // Default to center with slight randomization
          spawnX = screenWidth * 0.5 + (Math.random() - 0.5) * screenWidth * 0.3;
          break;
      }

      // Ensure spawn position is within bounds
      spawnX = Math.max(size / 2, Math.min(spawnX, screenWidth - size / 2));

      // Get enemy from object pool
      const enemyObject = objectPools.current.acquireEnemy();
      const enemy = enemyObject as Enemy;
      enemy.id = `enemy_${Date.now()}_${Math.random()}`;
      enemy.x = spawnX - size / 2;
      enemy.y = spawnY;
      enemy.width = size;
      enemy.height = size;
      enemy.size = size;
      enemy.type = enemyDef.type;
      enemy.sizeLevel = enemyDef.sizeLevel;
      

      // Set initial velocity to match original DOS game physics
      const baseSpeed = getEnemySpeedBySize(enemyDef.sizeLevel) * (enemyDef.movementSpeed || 1.0);
      
      // Give enemies substantial horizontal movement like original game
      // Horizontal velocity should be significant portion of their rated speed
      enemy.velocityX = (Math.random() > 0.5 ? 1 : -1) * baseSpeed * (0.6 + Math.random() * 0.4); // 60-100% of rated speed
      
      // Small initial vertical velocity (gravity will take over)
      enemy.velocityY = Math.random() * 50; // Small downward drift, gravity handles the rest

      // Add to enemies array
      enemies.current.push(enemy);
    },
    [screenWidth, gameAreaHeight, levelManager]
  );

  // Wave management function (CRITICAL - Missing from refactored version)
  const updateWaves = useCallback(() => {
    if (!levelManager.currentLevel || !levelManager.isInitialized || levelStartTime === 0) {
      return;
    }

    // Use Date.now() to match levelStartTime which is also Date.now()
    const currentTime = Date.now();
    const levelDuration = currentTime - levelStartTime;

    // Check for new waves to activate
    levelManager.currentLevel.enemyWaves.forEach(wave => {
      const waveKey = wave.id;
      const waveStartTime = wave.startTime * 1000; // Convert to milliseconds
      const waveEndTime = waveStartTime + wave.duration * 1000;

      // Activate wave if it's time and not already active
      if (
        levelDuration >= waveStartTime &&
        levelDuration <= waveEndTime &&
        !activeWaves.current.has(waveKey)
      ) {
        activeWaves.current.set(waveKey, {
          wave,
          startTime: currentTime,
          spawnedCount: 0,
          spawnedCountPerEnemy: {},
        });
        waveSpawnTimers.current.set(waveKey, 0);
      }

      // Deactivate wave if time is up
      if (levelDuration > waveEndTime && activeWaves.current.has(waveKey)) {
        activeWaves.current.delete(waveKey);
        waveSpawnTimers.current.delete(waveKey);
      }
    });
  }, [levelManager, levelStartTime]);

  // Enemy spawning from active waves (CRITICAL - Missing from refactored version)
  const updateEnemySpawning = useCallback((deltaTime: number) => {
    activeWaves.current.forEach((waveData, waveKey) => {
      const { wave } = waveData;

      // Each enemy type in a wave has its own spawn timing
      wave.enemies.forEach((enemyDef, enemyIndex) => {
        const enemyKey = `${waveKey}_${enemyIndex}`;
        let spawnTimer = waveSpawnTimers.current.get(enemyKey) || 0;
        spawnTimer += deltaTime;

        const spawnInterval = enemyDef.spawnInterval; // Keep in seconds to match deltaTime

        // Track spawned count per enemy type, not per wave
        if (!waveData.spawnedCountPerEnemy) {
          waveData.spawnedCountPerEnemy = {};
        }
        const spawnedForThisType = waveData.spawnedCountPerEnemy[enemyIndex] || 0;

        if (spawnTimer >= spawnInterval && spawnedForThisType < enemyDef.count) {
          spawnEnemyFromWave(enemyDef, wave, spawnedForThisType);
          waveData.spawnedCountPerEnemy[enemyIndex] = spawnedForThisType + 1;
          waveSpawnTimers.current.set(enemyKey, 0); // Reset timer for this enemy type
        } else {
          waveSpawnTimers.current.set(enemyKey, spawnTimer);
        }
      });
    });
  }, [spawnEnemyFromWave]);

  // Main game update function
  const handleGameUpdate = useCallback((deltaTime: number) => {
    if (!levelManager.currentLevel || !levelManager.levelConfig) return;

    // Update wave management and enemy spawning (CRITICAL - Missing from refactored version)
    updateWaves();
    updateEnemySpawning(deltaTime); // Use consistent delta time in seconds

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
      
      // ✅ UPDATE: Age tracking for visual effects
      if (projectile.createdAt) {
        projectile.age = (Date.now() - projectile.createdAt) / 1000; // Age in seconds
      }
      
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
    // Update reusable Pete GameObject position (avoid object creation)
    peteGameObject.current.x = petePosition.current.x;
    peteGameObject.current.y = petePosition.current.y;
    
    const collisionResults = CollisionSystem.processCollisions(
      projectiles.current,
      enemies.current,
      peteGameObject.current,
      objectPools.current!,
      levelManager.levelConfig
    );

    // Process collision results
    // Remove hit projectiles
    for (let i = projectiles.current.length - 1; i >= 0; i--) {
      const projectile = projectiles.current[i];
      if (collisionResults.hitProjectileIds.has(projectile.id)) {
        if (objectPools.current) {
          objectPools.current.releaseProjectile(projectile);
        }
        projectiles.current.splice(i, 1);
      }
    }

    // Remove hit enemies and track scoring
    for (let i = enemies.current.length - 1; i >= 0; i--) {
      const enemy = enemies.current[i];
      if (collisionResults.hitEnemyIds.has(enemy.id)) {
        enemies.current.splice(i, 1);
        
        // Track level progression
        levelActions.enemyEliminated(enemy.id, 10); // Base points, could be improved
        levelActions.projectileHit();
      }
    }

    // Add split enemies
    if (collisionResults.splitEnemies.length > 0) {
      enemies.current.push(...(collisionResults.splitEnemies as Enemy[]));
    }

    // Handle game over condition
    if (collisionResults.shouldGameEnd) {
      gameActions.setGameOver(true);
    }

    // Check level completion
    levelManager.checkLevelCompletion(enemies.current.length);

    // Trigger React re-render to update visual components
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
    const baseProjectile = objectPools.current.acquireProjectile() as Projectile;
    baseProjectile.x = petePosition.current.x + ENTITY_CONFIG.PETE.SIZE / 2 - ENTITY_CONFIG.PROJECTILE.SIZE / 2;
    baseProjectile.y = petePosition.current.y;
    baseProjectile.velocityX = 0;
    baseProjectile.velocityY = -ENTITY_CONFIG.PROJECTILE.SPEED;
    // Set projectile size via width/height (GameObject interface)
    baseProjectile.width = ENTITY_CONFIG.PROJECTILE.SIZE;
    baseProjectile.height = ENTITY_CONFIG.PROJECTILE.SIZE;
    // ✅ ADD: Age tracking for visual effects
    baseProjectile.age = 0;
    baseProjectile.createdAt = Date.now();

    // Apply power-up effects and create projectiles
    const newProjectiles = powerUpSystem.createProjectiles(baseProjectile);
    projectiles.current.push(...(newProjectiles as Projectile[]));
  }, [gameOver, isPlaying, levelActions, powerUpSystem]);

  // Start level when game begins playing
  useEffect(() => {
    if (isPlaying && !gameOver && levelStartTime === 0) {
      levelActions.startLevel();
    }
  }, [isPlaying, gameOver, levelStartTime, levelActions]);

  // Reset game entities when game resets
  useEffect(() => {
    if (!isPlaying && !gameOver) {
      enemies.current = [];
      projectiles.current = [];
      mysteryBalloons.current = [];
      
      // Reset wave management (CRITICAL - Missing from refactored version)
      activeWaves.current.clear();
      waveSpawnTimers.current.clear();
      
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
    enemies: [...enemies.current], // Create new array reference to trigger React updates
    projectiles: [...projectiles.current], // Create new array reference to trigger React updates  
    mysteryBalloons: [...mysteryBalloons.current], // Create new array reference to trigger React updates
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