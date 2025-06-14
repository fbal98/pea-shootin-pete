import { useCallback, useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useGameActions, useIsPlaying, useGameOver, useActivePowerUp, usePowerUpDuration } from '@/store/gameStore';
import {
  useLevelProgressionActions,
  useCurrentLevel,
  useEnemiesRemaining,
  useTotalEnemies,
  useCurrentScore,
  useShotsFired,
  useShotsHit,
  useCurrentCombo,
  useLevelCompleted,
  useLevelFailed,
  useLevelStartTime,
  useCurrentWave,
  useWaveIndex,
} from '@/store/levelProgressionStore';
import {
  GAME_CONFIG,
  GAME_PHYSICS,
  getBalloonSize,
  getBalloonPoints,
  getEnemySpeedBySize,
  getSpawnYPosition,
  ENTITY_CONFIG,
  UI_CONFIG,
  ENEMY_CONFIG,
  PHYSICS,
  createLevelConfig,
  levelBalanceToConfigOverrides,
  applyEnvironmentalModifiers,
} from '@/constants/GameConfig';
import { GameObject } from '@/utils/gameEngine';
import { EnemyWave, EnemySpawnDefinition } from '@/types/LevelTypes';
import { mysteryBalloonManager, MysteryBalloonInstance } from '@/systems/MysteryBalloonManager';
import { useMetaProgressionActions } from '@/store/metaProgressionStore';
import { useCelebrationManager } from '@/hooks/useCelebrationManager';
import { trackBalloonPopped, trackMysteryBalloonPopped } from '@/utils/analytics';
import { CollisionSystem } from '@/systems/CollisionSystem';
import { GameObjectPools } from '@/utils/ObjectPool';
import { integrationManager } from '@/systems/IntegrationManager';
import { gameCache } from '@/utils/GameCache';
import { PerformanceMonitor } from '@/utils/PerformanceMonitor';
import { mobileOptimizer } from '@/utils/MobileOptimizer';

interface Enemy {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  size: number;
  type: 'basic' | 'fast' | 'strong' | 'bouncer' | 'splitter' | 'ghost';
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

interface MysteryBalloonGameObject {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  mysteryBalloon: MysteryBalloonInstance;
}

export const useGameLogic = (screenWidth: number, gameAreaHeight: number) => {
  const isPlaying = useIsPlaying();
  const gameOver = useGameOver();
  const actions = useGameActions();

  // Level progression state and actions
  const currentLevel = useCurrentLevel();
  const levelActions = useLevelProgressionActions();

  // Meta progression actions for mystery rewards
  const metaActions = useMetaProgressionActions();
  
  // Power-up state
  const activePowerUp = useActivePowerUp();
  const powerUpDuration = usePowerUpDuration();
  
  // Celebration system for feedback
  const { queueCelebration } = useCelebrationManager();
  const enemiesRemaining = useEnemiesRemaining();
  const totalEnemies = useTotalEnemies();
  const currentScore = useCurrentScore();
  const shotsFired = useShotsFired();
  const shotsHit = useShotsHit();
  const currentCombo = useCurrentCombo();
  const levelCompleted = useLevelCompleted();
  const levelFailed = useLevelFailed();
  const levelStartTime = useLevelStartTime();
  const currentWave = useCurrentWave();
  const waveIndex = useWaveIndex();

  // Initialize level if not loaded (only once per game session)
  const hasInitializedLevel = useRef(false);
  useEffect(() => {
    if (!hasInitializedLevel.current && !currentLevel && !levelCompleted && !levelFailed) {
      hasInitializedLevel.current = true;
      console.log('Initializing level 1');
      levelActions.loadLevel(1);
    }
  }, []);

  // Reset initialization and clear game entities when game is reset
  useEffect(() => {
    if (!isPlaying && gameOver) {
      // Game has ended, reset initialization flag for next game
      hasInitializedLevel.current = false;

      // Release all objects back to pool before clearing
      enemies.current.forEach(enemy => objectPools.current.releaseEnemy(enemy));
      projectiles.current.forEach(projectile => objectPools.current.releaseProjectile(projectile));

      // Clear all game entities
      enemies.current = [];
      projectiles.current = [];
      mysteryBalloons.current = [];
      activeWaves.current.clear();
      waveSpawnTimers.current.clear();

      // Reset wave management
      renderTickRef.current = 0;
      lastUpdateTime.current = 0;
    }
  }, [isPlaying, gameOver]);

  // Additional effect to handle game reset (when isPlaying becomes true after gameOver was true)
  const wasGameOver = useRef(false);
  useEffect(() => {
    if (gameOver) {
      wasGameOver.current = true;
    } else if (wasGameOver.current && isPlaying) {
      // Game was over but now is playing again (restart scenario)
      console.log('🔄 Game restart detected, clearing entities');
      wasGameOver.current = false;
      hasInitializedLevel.current = false;

      // Release all objects back to pool before clearing
      enemies.current.forEach(enemy => objectPools.current.releaseEnemy(enemy));
      projectiles.current.forEach(projectile => objectPools.current.releaseProjectile(projectile));

      // Clear all game entities
      enemies.current = [];
      projectiles.current = [];
      mysteryBalloons.current = [];
      activeWaves.current.clear();
      waveSpawnTimers.current.clear();

      // Reset wave management
      renderTickRef.current = 0;
      lastUpdateTime.current = 0;
    }
  }, [isPlaying, gameOver]);

  // Initialize meta progression system once
  const hasInitializedMeta = useRef(false);
  useEffect(() => {
    if (!hasInitializedMeta.current) {
      hasInitializedMeta.current = true;
      metaActions.initialize();
    }
  }, []);

  // Initialize object pools and spatial grid
  const objectPools = useRef<GameObjectPools>(GameObjectPools.getInstance());
  
  // Pre-allocated objects for performance optimization
  const reusableObjects = useRef({
    // Pre-allocated arrays to avoid garbage collection
    tempProjectileArray: [] as any[],
    tempEnemyArray: [] as any[],
    tempMysteryArray: [] as any[],
    // Pre-allocated coordinate conversion objects
    coordinateBuffer: { x: 0, y: 0 },
    // Cache for expensive calculations
    lastMysteryConversion: new Map<string, { x: number; y: number }>()
  });
  
  // Initialize spatial grid when screen dimensions are available
  useEffect(() => {
    if (screenWidth > 0 && gameAreaHeight > 0) {
      CollisionSystem.initializeSpatialGrid(screenWidth, gameAreaHeight);
    }
  }, [screenWidth, gameAreaHeight]);

  // Start level when it's loaded and game is playing
  useEffect(() => {
    if (currentLevel && isPlaying && !levelCompleted && !levelFailed && levelStartTime === 0) {
      console.log('Starting level:', currentLevel.id);

      // Reset mystery balloon manager for new level
      mysteryBalloonManager.resetSession();
      mysteryBalloonManager.setCurrentLevel(currentLevel.id);

      // Start session tracking
      metaActions.startSession();

      levelActions.startLevel();
    }
  }, [currentLevel, isPlaying, levelCompleted, levelFailed, levelStartTime]);

  // Stable refs for game loop to prevent stale closures
  const uiStateRef = useRef({ isPlaying, gameOver });
  const levelActionsRef = useRef(levelActions);
  const currentLevelRef = useRef(currentLevel);
  const levelStateRef = useRef({
    levelCompleted,
    levelFailed,
    levelStartTime,
  });

  // Keep levelActionsRef current without causing re-renders
  levelActionsRef.current = levelActions;

  // Game state refs
  const petePosition = useRef(screenWidth / 2 - GAME_CONFIG.PETE_SIZE / 2);
  const enemies = useRef<Enemy[]>([]);
  const projectiles = useRef<Projectile[]>([]);
  const mysteryBalloons = useRef<MysteryBalloonGameObject[]>([]);
  const gameAreaHeightRef = useRef(gameAreaHeight);

  // Level-specific configuration
  const levelConfig = useRef(createLevelConfig());

  // Wave management refs
  const activeWaves = useRef<
    Map<
      string,
      {
        wave: EnemyWave;
        startTime: number;
        spawnedCount: number;
        spawnedCountPerEnemy?: Record<number, number>;
      }
    >
  >(new Map());
  const waveSpawnTimers = useRef<Map<string, number>>(new Map());

  // Force re-render trigger for visual updates (controlled)
  const [renderTrigger, setRenderTrigger] = useState(0);
  const renderTickRef = useRef(0);

  // Update refs when values change
  useEffect(() => {
    uiStateRef.current = { isPlaying, gameOver };
  }, [isPlaying, gameOver]);

  useEffect(() => {
    currentLevelRef.current = currentLevel;
  }, [currentLevel]);

  useEffect(() => {
    levelStateRef.current = {
      levelCompleted,
      levelFailed,
      levelStartTime,
    };
  }, [levelCompleted, levelFailed, levelStartTime]);

  // Update level configuration when current level changes (with caching)
  useEffect(() => {
    if (!currentLevel) {
      levelConfig.current = createLevelConfig();
      return;
    }

    // Try to get from cache first
    const cached = gameCache.getLevel(currentLevel.id);
    if (cached) {
      levelConfig.current = cached;
      return;
    }

    // Create level-specific configuration
    const balanceOverrides = levelBalanceToConfigOverrides(currentLevel.balance);
    const environmentOverrides = applyEnvironmentalModifiers(currentLevel.environment);
    const combinedOverrides = { ...balanceOverrides, ...environmentOverrides };

    levelConfig.current = createLevelConfig(combinedOverrides);
    
    // Cache the computed configuration
    gameCache.cacheLevel(currentLevel.id, levelConfig.current);
  }, [currentLevel]);

  // Update Pete position
  const updatePetePosition = useCallback((x: number) => {
    petePosition.current = x;
    // Don't force update here - let the game loop handle visual updates
  }, []);

  // Shoot projectile with power-up support
  const shootProjectile = useCallback(() => {
    if (
      uiStateRef.current.gameOver ||
      levelStateRef.current.levelCompleted ||
      levelStateRef.current.levelFailed
    )
      return;

    // Track projectile fired for level progression
    levelActionsRef.current.projectileFired();

    // Track for meta progression
    metaActions.recordShotFired();

    const config = levelConfig.current;
    
    // === POWER-UP SYSTEM: MODIFY SHOOTING BEHAVIOR ===
    const currentActivePowerUp = activePowerUp; // Get current power-up from state
    
    // Base projectile properties
    const baseX = petePosition.current + ENTITY_CONFIG.PETE.SIZE / 2 - ENTITY_CONFIG.PROJECTILE.SIZE / 2;
    const baseY = gameAreaHeightRef.current -
      ENTITY_CONFIG.PETE.SIZE -
      UI_CONFIG.LAYOUT.BOTTOM_PADDING -
      ENTITY_CONFIG.PROJECTILE.SIZE;
    let projectileSize = ENTITY_CONFIG.PROJECTILE.SIZE;
    let projectileSpeed = config.ENTITY_CONFIG.PROJECTILE.SPEED;
    
    // Apply power-up modifications
    if (currentActivePowerUp === 'big_shot') {
      projectileSize *= 2; // Double size for big shot
    } else if (currentActivePowerUp === 'rapid_fire') {
      projectileSpeed *= 1.5; // 50% faster
    }
    
    // Create projectiles based on power-up type
    const projectilesToCreate: Array<{x: number, y: number, velocityX: number, velocityY: number}> = [];
    
    if (currentActivePowerUp === 'triple_shot') {
      // Triple shot: center, left, and right projectiles
      projectilesToCreate.push(
        { x: baseX, y: baseY, velocityX: 0, velocityY: -projectileSpeed }, // Center
        { x: baseX - 15, y: baseY, velocityX: -50, velocityY: -projectileSpeed }, // Left
        { x: baseX + 15, y: baseY, velocityX: 50, velocityY: -projectileSpeed } // Right
      );
    } else {
      // Single shot (default for all other power-ups)
      projectilesToCreate.push({ x: baseX, y: baseY, velocityX: 0, velocityY: -projectileSpeed });
    }
    
    // Create all projectiles
    projectilesToCreate.forEach((projectileData) => {
      const projectile = objectPools.current.acquireProjectile();
      projectile.x = projectileData.x;
      projectile.y = projectileData.y;
      projectile.width = projectileSize;
      projectile.height = projectileSize;
      projectile.size = projectileSize;
      projectile.velocityX = projectileData.velocityX;
      projectile.velocityY = projectileData.velocityY;
      
      // Mark special projectiles for collision handling
      if (currentActivePowerUp === 'explosive_shot') {
        (projectile as any).isExplosive = true;
      } else if (currentActivePowerUp === 'piercing_shot') {
        (projectile as any).isPiercing = true;
      }
      
      projectiles.current.push(projectile);
    });
    
    // Don't force update here - let the game loop handle visual updates
  }, [activePowerUp, metaActions]);

  // Spawn enemy from wave definition with original game patterns
  const spawnEnemyFromWave = useCallback(
    (enemyDef: EnemySpawnDefinition, wave: EnemyWave, spawnIndex: number) => {
      const config = levelConfig.current;
      const size = getBalloonSize(enemyDef.sizeLevel);

      // Use original game spawn patterns
      let spawnX: number;
      let spawnY: number;

      // Get Y position from original game's fixed spawn heights
      spawnY = getSpawnYPosition(spawnIndex, gameAreaHeightRef.current);

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
          // Corners only: 10% and 90%
          spawnX = spawnIndex % 2 === 0 ? screenWidth * 0.1 : screenWidth * 0.9;
          break;
        default:
          // Default to original left_to_right pattern
          spawnX = (spawnIndex * 0.15 + 0.1) * screenWidth;
          break;
      }

      // Get speed based on balloon size (original game logic)
      const enemySpeed = getEnemySpeedBySize(enemyDef.sizeLevel);

      const enemy = objectPools.current.acquireEnemy();
      enemy.x = Math.max(0, Math.min(screenWidth - size, spawnX));
      enemy.y = spawnY;
      enemy.width = size;
      enemy.height = size;
      enemy.size = size;
      enemy.type = enemyDef.type;
      enemy.sizeLevel = enemyDef.sizeLevel;
      enemy.velocityX = 0; // Will be set below
      enemy.velocityY = config.BALLOON_PHYSICS.SPAWN_VELOCITY.VERTICAL_BASE;

      // Set horizontal velocity based on spawn position
      // Enemies spawned on left move right, on right move left, center can go either way
      if (spawnX < screenWidth * 0.3) {
        enemy.velocityX = config.BALLOON_PHYSICS.SPAWN_VELOCITY.HORIZONTAL_BASE;
      } else if (spawnX > screenWidth * 0.7) {
        enemy.velocityX = -config.BALLOON_PHYSICS.SPAWN_VELOCITY.HORIZONTAL_BASE;
      } else {
        // Center spawns go either direction
        enemy.velocityX =
          (Math.random() < 0.5 ? 1 : -1) * config.BALLOON_PHYSICS.SPAWN_VELOCITY.HORIZONTAL_BASE;
      }

      // Add small variation to make it less robotic
      enemy.velocityX +=
        (Math.random() - 0.5) * config.BALLOON_PHYSICS.SPAWN_VELOCITY.HORIZONTAL_VARIATION;

      // Ensure minimum horizontal velocity
      if (Math.abs(enemy.velocityX) < config.BALLOON_PHYSICS.MIN_HORIZONTAL_VELOCITY) {
        enemy.velocityX =
          enemy.velocityX >= 0
            ? config.BALLOON_PHYSICS.MIN_HORIZONTAL_VELOCITY
            : -config.BALLOON_PHYSICS.MIN_HORIZONTAL_VELOCITY;
      }

      enemies.current.push(enemy);

      // Notify mystery balloon manager of enemy spawn
      mysteryBalloonManager.onBalloonSpawned();
    },
    []
  );

  // Update wave management
  const updateWaves = useCallback((gameTime: number) => {
    if (
      !currentLevelRef.current ||
      levelStateRef.current.levelCompleted ||
      levelStateRef.current.levelFailed
    )
      return;

    // Use Date.now() to match levelStartTime which is also Date.now()
    const currentTime = Date.now();
    const levelDuration = currentTime - levelStateRef.current.levelStartTime;

    // Check for new waves to activate
    currentLevelRef.current.enemyWaves.forEach(wave => {
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
        console.log(
          `Activated wave ${waveKey} at levelDuration=${levelDuration}ms (waveStart=${waveStartTime}ms, waveEnd=${waveEndTime}ms)`
        );
        waveSpawnTimers.current.set(waveKey, 0);
      }

      // Debug timing info for first wave
      if (waveKey === 'tutorial_wave_1' && !activeWaves.current.has(waveKey)) {
        console.log(
          `Wave ${waveKey}: levelDuration=${levelDuration}ms, waveStart=${waveStartTime}ms, waveEnd=${waveEndTime}ms, levelStartTime=${levelStateRef.current.levelStartTime}`
        );
      }

      // Deactivate wave if time is up
      if (levelDuration > waveEndTime && activeWaves.current.has(waveKey)) {
        activeWaves.current.delete(waveKey);
        waveSpawnTimers.current.delete(waveKey);
      }
    });
  }, []);

  // Spawn enemies from active waves
  const updateEnemySpawning = useCallback((deltaTime: number) => {
    activeWaves.current.forEach((waveData, waveKey) => {
      const { wave } = waveData;

      // Each enemy type in a wave has its own spawn timing
      wave.enemies.forEach((enemyDef, enemyIndex) => {
        const enemyKey = `${waveKey}_${enemyIndex}`;
        let spawnTimer = waveSpawnTimers.current.get(enemyKey) || 0;
        spawnTimer += deltaTime;

        const spawnInterval = enemyDef.spawnInterval * 1000; // Convert to milliseconds

        // Track spawned count per enemy type, not per wave
        if (!waveData.spawnedCountPerEnemy) {
          waveData.spawnedCountPerEnemy = {};
        }
        const spawnedForThisType = waveData.spawnedCountPerEnemy[enemyIndex] || 0;

        if (spawnTimer >= spawnInterval && spawnedForThisType < enemyDef.count) {
          spawnEnemyFromWave(enemyDef, wave, spawnedForThisType);
          waveData.spawnedCountPerEnemy[enemyIndex] = spawnedForThisType + 1;
          waveSpawnTimers.current.set(enemyKey, 0); // Reset timer for this enemy type
          console.log(
            `Spawned enemy ${spawnedForThisType + 1}/${enemyDef.count} of type ${enemyIndex} from wave ${waveKey}`
          );
        } else {
          waveSpawnTimers.current.set(enemyKey, spawnTimer);
        }
      });
    });
  }, []);

  // Update mystery balloons with caching optimization
  const updateMysteryBalloons = useCallback((deltaTime: number) => {
    if (!currentLevelRef.current) return;

    // Update current level in mystery balloon manager
    mysteryBalloonManager.setCurrentLevel(currentLevelRef.current.id);

    // Get active mystery balloons from manager
    const activeMysteryBalloons = mysteryBalloonManager.getActiveMysteryBalloons();

    // Use pre-allocated array and cache coordinate conversions
    const tempArray = reusableObjects.current.tempMysteryArray;
    tempArray.length = 0; // Clear without allocating new array

    // Convert to game objects with cached screen coordinates
    const conversionCache = reusableObjects.current.lastMysteryConversion;
    const size = ENTITY_CONFIG.BALLOON.BASE_SIZE * 1.2; // Pre-calculate size once

    for (const mysteryBalloon of activeMysteryBalloons) {
      // Check if coordinates are cached and haven't changed
      const cached = conversionCache.get(mysteryBalloon.id);
      let screenX: number, screenY: number;
      
      if (cached && 
          cached.x === mysteryBalloon.position.x && 
          cached.y === mysteryBalloon.position.y) {
        // Use cached coordinates
        screenX = cached.x * screenWidth;
        screenY = cached.y * gameAreaHeightRef.current;
      } else {
        // Calculate and cache new coordinates
        screenX = mysteryBalloon.position.x * screenWidth;
        screenY = mysteryBalloon.position.y * gameAreaHeightRef.current;
        conversionCache.set(mysteryBalloon.id, {
          x: mysteryBalloon.position.x,
          y: mysteryBalloon.position.y
        });
      }

      tempArray.push({
        id: mysteryBalloon.id,
        x: screenX - size / 2,
        y: screenY,
        width: size,
        height: size,
        mysteryBalloon,
      });
    }

    // Assign to current array (no new allocation)
    mysteryBalloons.current = tempArray.slice(); // Shallow copy

    // Clean up old mystery balloons and cache
    mysteryBalloonManager.cleanupOldBalloons();
    
    // Clean up stale cache entries
    if (conversionCache.size > activeMysteryBalloons.length * 2) {
      const activeIds = new Set(activeMysteryBalloons.map(b => b.id));
      for (const [id] of conversionCache) {
        if (!activeIds.has(id)) {
          conversionCache.delete(id);
        }
      }
    }
  }, []);

  // Game loop ref for managing animation frame
  const gameLoopRef = useRef<number | undefined>(undefined);
  const lastUpdateTime = useRef<number>(0);

  // Game loop function - defined once with stable refs (exactly like working useGameLogic)
  const gameLoop = useCallback((timestamp: number) => {
    try {
      // Record frame for performance monitoring
      const performanceMonitor = PerformanceMonitor.getInstance();
      performanceMonitor.recordFrame(timestamp);
      
      // Initialize timer on first run
      if (lastUpdateTime.current === 0) {
        lastUpdateTime.current = timestamp;
      }

      const currentDeltaTime = Math.max(0, (timestamp - lastUpdateTime.current) / 1000);
      lastUpdateTime.current = timestamp;

      // Check if game should continue using refs
      if (
        !uiStateRef.current.isPlaying ||
        uiStateRef.current.gameOver ||
        !currentLevelRef.current ||
        levelStateRef.current.levelCompleted ||
        levelStateRef.current.levelFailed
      ) {
        gameLoopRef.current = undefined;
        return;
      }

      const config = levelConfig.current;

      // === UPDATE POWER-UP TIMERS ===
      actions.updatePowerUpDuration(currentDeltaTime);

      // Update wave management
      updateWaves(timestamp);

      // Update enemy spawning from active waves
      updateEnemySpawning(currentDeltaTime * 1000); // Convert back to milliseconds for spawning

      // Update mystery balloons
      updateMysteryBalloons(currentDeltaTime);

      // === OPTIMIZED PROJECTILE UPDATE: IN-PLACE MUTATION (NO ARRAY RE-ALLOCATION) ===
      // Update projectiles with straight-line movement and remove off-screen ones
      for (let i = projectiles.current.length - 1; i >= 0; i--) {
        const p = projectiles.current[i];
        p.y += p.velocityY * currentDeltaTime;
        
        // Remove projectiles that are well off screen (iterate backward to avoid index issues)
        if (p.y <= -100) {
          objectPools.current.releaseProjectile(p); // Release back to pool
          projectiles.current.splice(i, 1);         // Remove in-place - no new array allocation
        }
      }

      // === OPTIMIZED ENEMY UPDATE: IN-PLACE MUTATION (NO ARRAY RE-ALLOCATION) ===
      // Use level-specific physics configuration (cache outside loop)
      const balloonGravity = config.BALLOON_PHYSICS.GRAVITY_PX_S2;
      const minBounceVelocity = config.BALLOON_PHYSICS.MIN_BOUNCE_VELOCITY;
      
      // Update enemies with physics and remove off-screen ones (iterate backward)
      for (let i = enemies.current.length - 1; i >= 0; i--) {
        const enemy = enemies.current[i];
        
        // Apply lighter gravity (convert to pixels per frame)
        enemy.velocityY += balloonGravity * currentDeltaTime;

        // === APPLY ENEMY TYPE SPEED MULTIPLIERS ===
        // Get type-specific speed multiplier from game config
        const typeSpeedMultiplier = ENEMY_CONFIG.TYPE_SPEED_MULTIPLIERS[enemy.type] || 1.0;
        
        // Update position with type-specific speed modifications
        enemy.x += (enemy.velocityX * typeSpeedMultiplier) * currentDeltaTime;
        enemy.y += enemy.velocityY * currentDeltaTime; // Vertical movement unchanged for predictable physics

        // Bounce off walls with level-specific physics
        if (enemy.x <= 0 || enemy.x >= screenWidth - enemy.size) {
          enemy.velocityX *= -config.BALLOON_PHYSICS.BOUNCE.WALL;
          enemy.x = Math.max(0, Math.min(screenWidth - enemy.size, enemy.x));
        }

        // Bounce off ceiling with more energy loss
        if (enemy.y <= 0) {
          enemy.velocityY *= -config.BALLOON_PHYSICS.BOUNCE.CEIL;
          enemy.y = 0;
        }

        // Bounce off floor with level-specific physics
        if (enemy.y >= gameAreaHeightRef.current - enemy.size) {
          // Calculate bounce velocity using level-specific physics
          const bounceVelocity = enemy.velocityY * -config.BALLOON_PHYSICS.BOUNCE.FLOOR;
          // Only apply bounce if it's strong enough, otherwise stop bouncing
          enemy.velocityY = Math.abs(bounceVelocity) >= minBounceVelocity ? bounceVelocity : 0;
          enemy.y = gameAreaHeightRef.current - enemy.size;
        }

        // Enforce minimum horizontal velocity to prevent vertical-only movement
        if (Math.abs(enemy.velocityX) < config.BALLOON_PHYSICS.MIN_HORIZONTAL_VELOCITY) {
          const direction = enemy.velocityX >= 0 ? 1 : -1;
          enemy.velocityX = direction * config.BALLOON_PHYSICS.MIN_HORIZONTAL_VELOCITY;
        }

        // Remove enemies that fall off screen (in-place removal)
        if (enemy.y >= gameAreaHeightRef.current + enemy.size) {
          objectPools.current.releaseEnemy(enemy); // Release back to pool
          enemies.current.splice(i, 1);            // Remove in-place - no new array allocation
        }
      }

      // Check collisions using CollisionSystem
      const hitMysteryBalloonIds = new Set<string>();
      const newEnemies: Enemy[] = [];
      let enemiesEliminatedThisFrame = 0;

      // Convert current game objects to GameObject format for collision system
      const projectileObjects: GameObject[] = projectiles.current.map(p => ({
        id: p.id,
        x: p.x,
        y: p.y,
        width: p.width,
        height: p.height,
        velocityX: p.velocityX,
        velocityY: p.velocityY,
      }));

      const enemyObjects: GameObject[] = enemies.current.map(e => ({
        id: e.id,
        x: e.x,
        y: e.y,
        width: e.width,
        height: e.height,
        velocityX: e.velocityX,
        velocityY: e.velocityY,
        type: e.type,
        sizeLevel: e.sizeLevel,
      }));

      // Pete object for collision detection
      const peteObject: GameObject = {
        id: 'pete',
        x: petePosition.current,
        y: gameAreaHeightRef.current - ENTITY_CONFIG.PETE.SIZE - UI_CONFIG.LAYOUT.BOTTOM_PADDING,
        width: ENTITY_CONFIG.PETE.SIZE,
        height: ENTITY_CONFIG.PETE.SIZE,
        velocityX: 0,
        velocityY: 0,
      };

      // Process collisions with level-specific physics configuration
      const collisionResult = CollisionSystem.processCollisions(
        projectileObjects,
        enemyObjects,
        peteObject,
        objectPools.current,
        config // Pass level configuration for physics-consistent splitting
      );

      // Handle collision results
      if (collisionResult.shouldGameEnd) {
        actions.setGameOver(true);
        return;
      }

      // Process each collision event
      collisionResult.events.forEach(event => {
        if (event.type === 'projectile-enemy') {
          const enemy = enemies.current.find(e => e.id === event.enemy.id);
          if (!enemy) return;

          // Track projectile hit for level progression
          levelActionsRef.current.projectileHit();

          // Track for meta progression
          metaActions.recordShotHit();

          // === ADD JUICE: HAPTIC FEEDBACK AND CELEBRATION ===
          // Haptic feedback for balloon pop
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          
          // Visual celebration at enemy position
          queueCelebration({
            type: 'combo',
            priority: 3,
            props: {
              position: { x: enemy.x + enemy.width / 2, y: enemy.y + enemy.height / 2 },
              theme: 'beach', // TODO: Use level theme
              intensity: enemy.sizeLevel === 1 ? 'high' : 'medium', // Smaller balloons = more satisfying
            },
          });

          // Update score based on enemy size
          const points = getBalloonPoints(enemy.sizeLevel as 1 | 2 | 3);

          // Integrate with combo system and achievements through IntegrationManager
          const enemyTypeForCombo =
            enemy.sizeLevel === 1 ? 'small' : enemy.sizeLevel === 2 ? 'medium' : 'large';
          const comboResult = integrationManager.onProjectileHit(enemyTypeForCombo, 0.85); // Default accuracy

          // Apply combo multiplier to score
          const finalPoints = Math.round(points * comboResult.scoreMultiplier);
          actions.updateScore(finalPoints);

          // === COMBO MILESTONE CELEBRATIONS ===
          // Check for combo milestones and add enhanced celebration
          const newCombo = comboResult.scoreMultiplier > 1 ? currentCombo + 1 : currentCombo;
          if (newCombo >= 5 && newCombo % 5 === 0) {
            // Every 5 combo milestone gets enhanced feedback
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            queueCelebration({
              type: 'combo',
              priority: 7,
              props: {
                position: { x: screenWidth / 2, y: gameAreaHeight / 3 },
                theme: 'space',
                intensity: newCombo >= 15 ? 'high' : 'medium',
                message: `${newCombo}x COMBO!`,
              },
            });
          } else if (newCombo >= 10 && newCombo % 10 === 0) {
            // Every 10 combo milestone gets the biggest celebration
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            queueCelebration({
              type: 'achievement',
              priority: 10,
              props: {
                position: { x: screenWidth / 2, y: gameAreaHeight / 2 },
                theme: 'volcano',
                intensity: 'high',
                message: `AMAZING ${newCombo}x COMBO!`,
              },
            });
          }

          // Track balloon popped analytics
          trackBalloonPopped(
            enemy.sizeLevel,
            finalPoints,
            currentCombo,
            currentLevelRef.current?.id
          );

          // Split enemy if not smallest size, otherwise it's eliminated
          if (enemy.sizeLevel > 1) {
            const newSize = enemy.sizeLevel - 1;
            const size = getBalloonSize(newSize as 1 | 2 | 3);

            // Create split enemies based on level configuration
            const splitBehavior = currentLevelRef.current?.enemyWaves
              .flatMap(wave => wave.enemies)
              .find(def => def.type === enemy.type)?.splitBehavior;

            const splitCount = splitBehavior?.splitInto || 2;
            const childSizeReduction = splitBehavior?.childSizeReduction || 0.7;
            const childSpeedBonus = splitBehavior?.childSpeedBonus || 1.1;

            // Create smaller enemies
            for (let i = 0; i < splitCount; i++) {
              const angle = (Math.PI * 2 * i) / splitCount;
              const splitEnemy: Enemy = {
                id: `split_${enemy.id}_${i}_${Date.now()}`,
                x: enemy.x + Math.cos(angle) * config.BALLOON_PHYSICS.SPLIT.OFFSET_DISTANCE,
                y: enemy.y,
                size: size * childSizeReduction,
                width: size * childSizeReduction,
                height: size * childSizeReduction,
                type: enemy.type,
                sizeLevel: newSize,
                velocityX:
                  Math.cos(angle) *
                  config.BALLOON_PHYSICS.SPLIT.HORIZONTAL_VELOCITY *
                  childSpeedBonus,
                velocityY: -config.BALLOON_PHYSICS.SPLIT.VERTICAL_VELOCITY * childSpeedBonus,
              };
              newEnemies.push(splitEnemy);
            }
          } else {
            // Enemy completely eliminated
            enemiesEliminatedThisFrame++;

            // Track balloon pop for meta progression
            metaActions.recordBalloonPop();

            // Update daily challenge progress (balloon_pop challenge type)
            metaActions.updateChallengeProgress('daily_balloons', 1);
          }
        }
      });

      // Track eliminated enemies for level progression
      if (enemiesEliminatedThisFrame > 0) {
        for (let i = 0; i < enemiesEliminatedThisFrame; i++) {
          levelActionsRef.current.enemyEliminated(`eliminated_${Date.now()}_${i}`, getBalloonPoints(1)); // Use smallest balloon points as base
        }
      }

      // === OPTIMIZED COLLISION CLEANUP: IN-PLACE REMOVAL ===
      // Remove hit enemies and projectiles in-place (iterate backward to avoid index issues)
      
      // Remove hit enemies from the array
      for (let i = enemies.current.length - 1; i >= 0; i--) {
        const enemy = enemies.current[i];
        if (collisionResult.hitEnemyIds.has(enemy.id)) {
          objectPools.current.releaseEnemy(enemy); // Release back to pool
          enemies.current.splice(i, 1);            // Remove in-place
        }
      }
      
      // Remove hit projectiles from the array
      for (let i = projectiles.current.length - 1; i >= 0; i--) {
        const p = projectiles.current[i];
        if (collisionResult.hitProjectileIds.has(p.id)) {
          objectPools.current.releaseProjectile(p); // Release back to pool
          projectiles.current.splice(i, 1);         // Remove in-place
        }
      }
      
      // Add new split enemies efficiently (direct push - no array spread)
      newEnemies.forEach(enemy => {
        enemies.current.push(enemy);
      });

      // Check collisions with mystery balloons
      const hitMysteryProjectileIds = new Set<string>();
      projectiles.current.forEach(projectile => {
        mysteryBalloons.current.forEach(mysteryBalloon => {
          if (
            hitMysteryBalloonIds.has(mysteryBalloon.id) ||
            hitMysteryProjectileIds.has(projectile.id)
          )
            return;

          // Create compatible objects for collision detection
          const projectileObj: GameObject = {
            id: projectile.id,
            x: projectile.x,
            y: projectile.y,
            width: projectile.width,
            height: projectile.height,
          };

          if (CollisionSystem.checkCollision(projectileObj, mysteryBalloon)) {
            // Mark both as hit
            hitMysteryBalloonIds.add(mysteryBalloon.id);
            hitMysteryProjectileIds.add(projectile.id);

            // Handle mystery balloon pop
            const reward = mysteryBalloonManager.onMysteryBalloonPopped(
              mysteryBalloon.mysteryBalloon.id
            );
            if (reward) {
              // Process reward through meta progression system
              metaActions.processMysteryReward(reward);

              // Integrate with achievement and viral tracking systems
              integrationManager.onMysteryBalloonPopped(reward.type, Number(reward.value));

              // Track analytics
              trackMysteryBalloonPopped(
                reward.type,
                reward.rarity,
                reward.value,
                currentLevelRef.current?.id
              );
            }
          }
        });
      });

      // Release mystery balloon hit projectiles back to pool
      const mysteryHitProjectiles = projectiles.current.filter(p => hitMysteryProjectileIds.has(p.id));
      mysteryHitProjectiles.forEach(p => objectPools.current.releaseProjectile(p));

      // Remove popped mystery balloons and hit projectiles
      mysteryBalloons.current = mysteryBalloons.current.filter(
        balloon => !hitMysteryBalloonIds.has(balloon.id)
      );
      projectiles.current = projectiles.current.filter(p => !hitMysteryProjectileIds.has(p.id));

      // Check for missed projectiles (projectiles that hit the ground without hitting enemies)
      const missedProjectiles = projectiles.current.filter(p => p.y <= -p.size);
      if (missedProjectiles.length > 0) {
        missedProjectiles.forEach(() => levelActionsRef.current.projectileMissed());
      }

      // Check for level completion - no enemies left and all waves finished
      const totalEnemiesOnScreen = enemies.current.length;
      if (totalEnemiesOnScreen === 0 && currentLevelRef.current) {
        // Check if all waves have finished spawning
        const levelDuration = timestamp - levelStateRef.current.levelStartTime;

        const allWavesFinished = currentLevelRef.current.enemyWaves.every(wave => {
          const waveEndTime = (wave.startTime + wave.duration) * 1000;
          return levelDuration > waveEndTime;
        });

        if (allWavesFinished) {
          // All enemies eliminated and no more will spawn - trigger victory
          levelActionsRef.current.completeObjective('eliminate_all_enemies');
        }
      }

      // Check level victory/failure conditions
      levelActionsRef.current.checkVictoryConditions();
      levelActionsRef.current.checkFailureConditions();

      // Increment render tick
      renderTickRef.current += 1;

      // Periodic maintenance tasks
      if (renderTickRef.current % 1800 === 0) {
        // Cache cleanup (every 1800 frames = ~30 seconds at 60fps)
        gameCache.cleanup();
        
        // Log performance statistics in development
        if (__DEV__) {
          objectPools.current.logStats();
          gameCache.logStats();
        }
      }
      
      // Performance monitoring and optimization (every 600 frames = ~10 seconds at 60fps)
      if (renderTickRef.current % 600 === 0) {
        const performanceMonitor = PerformanceMonitor.getInstance();
        const memoryStats = performanceMonitor.getMemoryStats();
        
        // Update mobile optimizer with current performance
        mobileOptimizer.forceOptimization();
        const profile = mobileOptimizer.getPerformanceProfile();
        
        // Apply performance profile adjustments
        if (profile.reducedPhysics) {
          // Reduce physics update frequency if needed
          if (renderTickRef.current % 2 === 0) {
            return; // Skip physics update this frame
          }
        }
        
        // Force garbage collection if memory pressure is high
        if (memoryStats.memoryPressure === 'high' || profile.batchUpdates) {
          if (global.gc) {
            global.gc();
          }
          
          // Clear caches more aggressively under memory pressure
          gameCache.reset();
          
          // Only clear object pools if memory pressure is critical
          if (memoryStats.memoryPressure === 'high') {
            objectPools.current.clearAll();
          }
        }
        
        // Log performance stats in development
        if (__DEV__) {
          const optimizationStats = mobileOptimizer.getOptimizationStats();
          console.log('📊 Performance Stats:', {
            fps: optimizationStats.averageFPS.toFixed(1),
            deviceTier: optimizationStats.deviceTier,
            quality: profile.renderQuality,
            entities: `${enemies.current.length}/${profile.maxEntityCount}`,
            thermalThrottles: optimizationStats.thermalThrottleCount
          });
        }
      }

      // Force React re-render periodically for visual updates (every 3 frames)
      if (renderTickRef.current % 3 === 0) {
        setRenderTrigger(prev => prev + 1);
      }

      // Continue game loop if still playing (exactly like working useGameLogic)
      if (
        !levelStateRef.current.levelCompleted &&
        !levelStateRef.current.levelFailed &&
        uiStateRef.current.isPlaying &&
        !uiStateRef.current.gameOver
      ) {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
      } else {
        gameLoopRef.current = undefined;
      }
    } catch (error) {
      console.error('Game loop error:', error);
      // Continue loop even after error to keep game responsive
      if (
        !levelStateRef.current.levelCompleted &&
        !levelStateRef.current.levelFailed &&
        uiStateRef.current.isPlaying &&
        !uiStateRef.current.gameOver
      ) {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
      }
    }
  }, []); // Empty dependency array since we use refs

  // Start/stop game loop based on playing state (exactly like working useGameLogic)
  useEffect(() => {
    if (
      isPlaying &&
      !gameOver &&
      currentLevel &&
      !levelCompleted &&
      !levelFailed &&
      !gameLoopRef.current
    ) {
      // Reset timing
      lastUpdateTime.current = 0;
      // Start the game loop
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    } else if ((!isPlaying || gameOver || levelCompleted || levelFailed) && gameLoopRef.current) {
      // Stop the game loop
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = undefined;
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = undefined;
      }
    };
  }, [isPlaying, gameOver, currentLevel, levelCompleted, levelFailed]);

  return {
    petePosition,
    enemies: enemies.current,
    projectiles: projectiles.current,
    mysteryBalloons: mysteryBalloons.current,
    gameAreaHeightRef,
    updatePetePosition,
    shootProjectile,
  };
};
