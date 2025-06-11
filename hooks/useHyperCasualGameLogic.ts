import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameActions, useIsPlaying, useGameOver } from '@/store/gameStore';
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
  useWaveIndex
} from '@/store/levelProgressionStore';
import { 
  GAME_CONFIG, 
  BALLOON_PHYSICS, 
  getBalloonSize, 
  getBalloonPoints,
  ENTITY_CONFIG,
  UI_CONFIG,
  createLevelConfig,
  levelBalanceToConfigOverrides,
  applyEnvironmentalModifiers
} from '@/constants/GameConfig';
import { GameObject } from '@/utils/gameEngine';
import { nanoid } from 'nanoid/non-secure';
import { EnemyWave, EnemySpawnDefinition } from '@/types/LevelTypes';

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

export const useHyperCasualGameLogic = (screenWidth: number, gameAreaHeight: number) => {
  const isPlaying = useIsPlaying();
  const gameOver = useGameOver();
  const actions = useGameActions();
  
  // Level progression state and actions
  const currentLevel = useCurrentLevel();
  const levelActions = useLevelProgressionActions();
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
  
  // Initialize level if not loaded (only once)
  const hasInitializedLevel = useRef(false);
  useEffect(() => {
    if (!hasInitializedLevel.current && !currentLevel && !levelCompleted && !levelFailed) {
      hasInitializedLevel.current = true;
      console.log('Initializing level 1');
      levelActions.loadLevel(1);
    }
  }, []);

  // Start level when it's loaded and game is playing
  useEffect(() => {
    if (currentLevel && isPlaying && !levelCompleted && !levelFailed && levelStartTime === 0) {
      console.log('Starting level:', currentLevel.id);
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
    levelStartTime 
  });
  
  // Keep levelActionsRef current without causing re-renders
  levelActionsRef.current = levelActions;
  
  // Game state refs
  const petePosition = useRef(screenWidth / 2 - GAME_CONFIG.PETE_SIZE / 2);
  const enemies = useRef<Enemy[]>([]);
  const projectiles = useRef<Projectile[]>([]);
  const gameAreaHeightRef = useRef(gameAreaHeight);
  
  // Level-specific configuration
  const levelConfig = useRef(createLevelConfig());
  
  // Wave management refs
  const activeWaves = useRef<Map<string, { wave: EnemyWave; startTime: number; spawnedCount: number; spawnedCountPerEnemy?: Record<number, number> }>>(new Map());
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
      levelStartTime 
    };
  }, [levelCompleted, levelFailed, levelStartTime]);

  // Update level configuration when current level changes
  useEffect(() => {
    if (!currentLevel) {
      levelConfig.current = createLevelConfig();
      return;
    }
    
    // Create level-specific configuration
    const balanceOverrides = levelBalanceToConfigOverrides(currentLevel.balance);
    const environmentOverrides = applyEnvironmentalModifiers(currentLevel.environment);
    const combinedOverrides = { ...balanceOverrides, ...environmentOverrides };
    
    levelConfig.current = createLevelConfig(combinedOverrides);
  }, [currentLevel]);
  
  // Update Pete position
  const updatePetePosition = useCallback((x: number) => {
    petePosition.current = x;
    // Don't force update here - let the game loop handle visual updates
  }, []);
  
  // Shoot projectile
  const shootProjectile = useCallback(() => {
    if (uiStateRef.current.gameOver || levelStateRef.current.levelCompleted || levelStateRef.current.levelFailed) return;
    
    // Track projectile fired for level progression
    levelActionsRef.current.projectileFired();
    
    const config = levelConfig.current;
    const projectile: Projectile = {
      id: nanoid(),
      x: petePosition.current + ENTITY_CONFIG.PETE.SIZE / 2 - ENTITY_CONFIG.PROJECTILE.SIZE / 2,
      y: gameAreaHeightRef.current - ENTITY_CONFIG.PETE.SIZE - UI_CONFIG.LAYOUT.BOTTOM_PADDING - ENTITY_CONFIG.PROJECTILE.SIZE,
      size: ENTITY_CONFIG.PROJECTILE.SIZE,
      width: ENTITY_CONFIG.PROJECTILE.SIZE,
      height: ENTITY_CONFIG.PROJECTILE.SIZE,
      velocityY: -config.ENTITY_CONFIG.PROJECTILE.SPEED,
    };
    
    projectiles.current.push(projectile);
    // Don't force update here - let the game loop handle visual updates
  }, []);
  
  // Spawn enemy from wave definition  
  const spawnEnemyFromWave = useCallback((enemyDef: EnemySpawnDefinition, wave: EnemyWave) => {
    const config = levelConfig.current;
    const size = getBalloonSize(enemyDef.sizeLevel);
    
    // Calculate spawn position based on pattern
    let spawnX: number;
    switch (wave.spawnPattern) {
      case 'left_to_right':
        spawnX = (Math.random() * 0.8 + 0.1) * screenWidth; // 10-90% across screen
        break;
      case 'center_out':
        spawnX = screenWidth / 2 + (Math.random() - 0.5) * screenWidth * 0.6;
        break;
      case 'corners_first':
        spawnX = Math.random() < 0.5 ? Math.random() * screenWidth * 0.2 : screenWidth * 0.8 + Math.random() * screenWidth * 0.2;
        break;
      case 'random':
      default:
        spawnX = Math.random() * (screenWidth - size);
        break;
    }
    
    // Apply wave modifiers
    const baseSpeed = config.ENEMY_CONFIG.BASE_SPEED;
    const waveSpeedMultiplier = 1.0 + wave.speedBonus;
    const enemySpeed = baseSpeed * enemyDef.movementSpeed * waveSpeedMultiplier;
    
    const enemy: Enemy = {
      id: nanoid(),
      x: Math.max(0, Math.min(screenWidth - size, spawnX)),
      y: -size,
      size,
      width: size,
      height: size,
      type: enemyDef.type,
      sizeLevel: enemyDef.sizeLevel,
      velocityX: (Math.random() - 0.5) * config.BALLOON_PHYSICS.SPAWN_VELOCITY.HORIZONTAL_RANGE,
      velocityY: Math.random() * config.BALLOON_PHYSICS.SPAWN_VELOCITY.VERTICAL_RANDOM + config.BALLOON_PHYSICS.SPAWN_VELOCITY.VERTICAL_BASE,
    };
    
    // Apply movement type modifiers
    switch (enemyDef.movementType) {
      case 'physics_heavy':
        enemy.velocityY *= 1.3; // Fall faster
        break;
      case 'physics_floaty':
        enemy.velocityY *= 0.7; // Fall slower
        break;
      case 'pattern_homing':
        // Will be handled in update loop
        break;
    }
    
    enemies.current.push(enemy);
    // Don't force update here - let the game loop handle visual updates
  }, []);
  
  // Update wave management
  const updateWaves = useCallback((gameTime: number) => {
    if (!currentLevelRef.current || levelStateRef.current.levelCompleted || levelStateRef.current.levelFailed) return;
    
    // Use Date.now() to match levelStartTime which is also Date.now()
    const currentTime = Date.now();
    const levelDuration = currentTime - levelStateRef.current.levelStartTime;
    
    // Check for new waves to activate
    currentLevelRef.current.enemyWaves.forEach(wave => {
      const waveKey = wave.id;
      const waveStartTime = wave.startTime * 1000; // Convert to milliseconds
      const waveEndTime = waveStartTime + wave.duration * 1000;
      
      // Activate wave if it's time and not already active
      if (levelDuration >= waveStartTime && levelDuration <= waveEndTime && !activeWaves.current.has(waveKey)) {
        activeWaves.current.set(waveKey, {
          wave,
          startTime: currentTime,
          spawnedCount: 0,
          spawnedCountPerEnemy: {}
        });
        console.log(`Activated wave ${waveKey} at levelDuration=${levelDuration}ms (waveStart=${waveStartTime}ms, waveEnd=${waveEndTime}ms)`);
        waveSpawnTimers.current.set(waveKey, 0);
      }
      
      // Debug timing info for first wave
      if (waveKey === 'tutorial_wave_1' && !activeWaves.current.has(waveKey)) {
        console.log(`Wave ${waveKey}: levelDuration=${levelDuration}ms, waveStart=${waveStartTime}ms, waveEnd=${waveEndTime}ms, levelStartTime=${levelStateRef.current.levelStartTime}`);
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
          spawnEnemyFromWave(enemyDef, wave);
          waveData.spawnedCountPerEnemy[enemyIndex] = spawnedForThisType + 1;
          waveSpawnTimers.current.set(enemyKey, 0); // Reset timer for this enemy type
          console.log(`Spawned enemy ${spawnedForThisType + 1}/${enemyDef.count} of type ${enemyIndex} from wave ${waveKey}`);
        } else {
          waveSpawnTimers.current.set(enemyKey, spawnTimer);
        }
      });
    });
  }, []);
  
  // Game loop ref for managing animation frame
  const gameLoopRef = useRef<number | undefined>(undefined);
  const lastUpdateTime = useRef<number>(0);

  // Game loop function - defined once with stable refs (exactly like working useGameLogic)
  const gameLoop = useCallback((timestamp: number) => {
    try {
      // Initialize timer on first run
      if (lastUpdateTime.current === 0) {
        lastUpdateTime.current = timestamp;
      }

      const currentDeltaTime = Math.max(0, (timestamp - lastUpdateTime.current) / 1000);
      lastUpdateTime.current = timestamp;

      // Check if game should continue using refs
      if (!uiStateRef.current.isPlaying || uiStateRef.current.gameOver || !currentLevelRef.current || levelStateRef.current.levelCompleted || levelStateRef.current.levelFailed) {
        gameLoopRef.current = undefined;
        return;
      }
    
      const config = levelConfig.current;
      
      // Update wave management
      updateWaves(timestamp);
      
      // Update enemy spawning from active waves
      updateEnemySpawning(currentDeltaTime * 1000); // Convert back to milliseconds for spawning
      
      // Update projectiles
      projectiles.current = projectiles.current.filter(p => {
        p.y += p.velocityY * currentDeltaTime;
        return p.y > -p.size;
      });
      
      // Update enemies with balloon physics
      enemies.current = enemies.current.filter(enemy => {
        // Use level-specific physics configuration
        const balloonGravity = GAME_CONFIG.GRAVITY * config.BALLOON_PHYSICS.GRAVITY_MULTIPLIER;
        const airResistance = config.BALLOON_PHYSICS.AIR_RESISTANCE;
        const minBounceVelocity = config.BALLOON_PHYSICS.MIN_BOUNCE_VELOCITY;
        
        // Apply lighter gravity (convert to pixels per frame)
        enemy.velocityY += balloonGravity * currentDeltaTime;
        
        // Apply air resistance to both directions
        enemy.velocityX *= airResistance;
        enemy.velocityY *= airResistance;
        
        // Update position
        enemy.x += enemy.velocityX * currentDeltaTime;
        enemy.y += enemy.velocityY * currentDeltaTime;
        
        // Bounce off walls with minimal energy loss
        if (enemy.x <= 0 || enemy.x >= screenWidth - enemy.size) {
          enemy.velocityX *= -config.BALLOON_PHYSICS.BOUNCE_COEFFICIENTS.WALLS;
          enemy.x = Math.max(0, Math.min(screenWidth - enemy.size, enemy.x));
        }
        
        // Bounce off ceiling
        if (enemy.y <= 0) {
          enemy.velocityY *= -config.BALLOON_PHYSICS.BOUNCE_COEFFICIENTS.CEILING;
          enemy.y = 0;
        }
        
        // Bounce off floor with super-bouncy trampoline effect
        if (enemy.y >= gameAreaHeightRef.current - enemy.size) {
          // Super energetic trampoline floor - like original Pang physics with high energy return
          enemy.velocityY = Math.max(-minBounceVelocity, enemy.velocityY * -config.BALLOON_PHYSICS.BOUNCE_COEFFICIENTS.FLOOR);
          enemy.y = gameAreaHeightRef.current - enemy.size;
        }
        
        // Remove if somehow fallen off screen
        return enemy.y < gameAreaHeightRef.current + enemy.size;
      });
      
      // Check collisions
      const hitEnemyIds = new Set<string>();
      const hitProjectileIds = new Set<string>();
      const newEnemies: Enemy[] = [];
      let enemiesEliminatedThisFrame = 0;
      
      // Find all collisions first
      projectiles.current.forEach(projectile => {
        if (hitProjectileIds.has(projectile.id)) return;
        
        enemies.current.forEach(enemy => {
          if (hitEnemyIds.has(enemy.id) || hitProjectileIds.has(projectile.id)) return;
          
          // Create compatible objects for collision detection
          const projectileObj: GameObject = {
            id: projectile.id,
            x: projectile.x,
            y: projectile.y,
            width: projectile.width,
            height: projectile.height
          };
          const enemyObj: GameObject = {
            id: enemy.id,
            x: enemy.x,
            y: enemy.y,
            width: enemy.width,
            height: enemy.height
          };
          
          if (checkCollision(projectileObj, enemyObj)) {
            // Mark both as hit
            hitEnemyIds.add(enemy.id);
            hitProjectileIds.add(projectile.id);
            
            // Track projectile hit for level progression
            levelActionsRef.current.projectileHit();
            
            // Update score based on enemy size
            const points = getBalloonPoints(enemy.sizeLevel as 1 | 2 | 3);
            actions.updateScore(points);
            
            // Track balloon popped analytics
            const { trackBalloonPopped } = require('../utils/analytics');
            trackBalloonPopped(
              enemy.sizeLevel,
              points,
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
                  id: nanoid(),
                  x: enemy.x + Math.cos(angle) * config.BALLOON_PHYSICS.SPLIT.OFFSET_DISTANCE,
                  y: enemy.y,
                  size: size * childSizeReduction,
                  width: size * childSizeReduction,
                  height: size * childSizeReduction,
                  type: enemy.type,
                  sizeLevel: newSize,
                  velocityX: Math.cos(angle) * config.BALLOON_PHYSICS.SPLIT.HORIZONTAL_VELOCITY * childSpeedBonus,
                  velocityY: -config.BALLOON_PHYSICS.SPLIT.VERTICAL_VELOCITY * childSpeedBonus,
                };
                newEnemies.push(splitEnemy);
              }
            } else {
              // Enemy completely eliminated
              enemiesEliminatedThisFrame++;
            }
          }
        });
      });
      
      // Track eliminated enemies for level progression
      if (enemiesEliminatedThisFrame > 0) {
        for (let i = 0; i < enemiesEliminatedThisFrame; i++) {
          levelActionsRef.current.enemyEliminated(nanoid(), getBalloonPoints(1)); // Use smallest balloon points as base
        }
      }
      
      // Keep enemies that weren't hit and add new split enemies
      enemies.current = [
        ...enemies.current.filter(enemy => !hitEnemyIds.has(enemy.id)),
        ...newEnemies
      ];
      
      // Keep projectiles that didn't hit anything
      projectiles.current = projectiles.current.filter(projectile => !hitProjectileIds.has(projectile.id));
      
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

      // Force React re-render periodically for visual updates (every 3 frames)
      if (renderTickRef.current % 3 === 0) {
        setRenderTrigger(prev => prev + 1);
      }

      // Continue game loop if still playing (exactly like working useGameLogic)
      if (!levelStateRef.current.levelCompleted && !levelStateRef.current.levelFailed && uiStateRef.current.isPlaying && !uiStateRef.current.gameOver) {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
      } else {
        gameLoopRef.current = undefined;
      }
      
    } catch (error) {
      console.error('Game loop error:', error);
      // Continue loop even after error to keep game responsive
      if (!levelStateRef.current.levelCompleted && !levelStateRef.current.levelFailed && uiStateRef.current.isPlaying && !uiStateRef.current.gameOver) {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
      }
    }
  }, []); // Empty dependency array since we use refs

  // Start/stop game loop based on playing state (exactly like working useGameLogic)
  useEffect(() => {
    if (isPlaying && !gameOver && currentLevel && !levelCompleted && !levelFailed && !gameLoopRef.current) {
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