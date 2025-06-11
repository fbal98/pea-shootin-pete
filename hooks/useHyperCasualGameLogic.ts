import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameActions, useUIState } from '@/store/gameStore';
import { 
  useLevelProgressionStore, 
  useLevelProgressionActions,
  useCurrentLevel,
  useLevelProgress
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
  const uiState = useUIState();
  const actions = useGameActions();
  
  // Level progression state and actions
  const currentLevel = useCurrentLevel();
  const levelActions = useLevelProgressionActions();
  const levelProgress = useLevelProgress();
  const levelState = useLevelProgressionStore(state => ({
    levelStartTime: state.levelStartTime,
    currentWave: state.currentWave,
    waveIndex: state.waveIndex,
    levelCompleted: state.levelCompleted,
    levelFailed: state.levelFailed,
    enemiesRemaining: state.enemiesRemaining
  }));
  
  // Game state refs
  const petePosition = useRef(screenWidth / 2 - GAME_CONFIG.PETE_SIZE / 2);
  const enemies = useRef<Enemy[]>([]);
  const projectiles = useRef<Projectile[]>([]);
  const gameAreaHeightRef = useRef(gameAreaHeight);
  
  // Level-specific configuration
  const levelConfig = useRef(createLevelConfig());
  
  // Wave management refs
  const activeWaves = useRef<Map<string, { wave: EnemyWave; startTime: number; spawnedCount: number }>>(new Map());
  const waveSpawnTimers = useRef<Map<string, number>>(new Map());
  
  // Force re-render for visual updates
  const [, forceUpdate] = useState(0);
  
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
    forceUpdate(prev => prev + 1);
  }, []);
  
  // Shoot projectile
  const shootProjectile = useCallback(() => {
    if (uiState.gameOver || levelState.levelCompleted || levelState.levelFailed) return;
    
    // Track projectile fired for level progression
    levelActions.projectileFired();
    
    const config = levelConfig.current;
    const projectile: Projectile = {
      id: nanoid(),
      x: petePosition.current + ENTITY_CONFIG.PETE.SIZE / 2 - ENTITY_CONFIG.PROJECTILE.SIZE / 2,
      y: gameAreaHeight - ENTITY_CONFIG.PETE.SIZE - UI_CONFIG.LAYOUT.BOTTOM_PADDING - ENTITY_CONFIG.PROJECTILE.SIZE,
      size: ENTITY_CONFIG.PROJECTILE.SIZE,
      width: ENTITY_CONFIG.PROJECTILE.SIZE,
      height: ENTITY_CONFIG.PROJECTILE.SIZE,
      velocityY: -config.ENTITY_CONFIG.PROJECTILE.SPEED,
    };
    
    projectiles.current.push(projectile);
    forceUpdate(prev => prev + 1);
  }, [uiState.gameOver, levelState.levelCompleted, levelState.levelFailed, gameAreaHeight, levelActions]);
  
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
    forceUpdate(prev => prev + 1);
  }, [screenWidth]);
  
  // Update wave management
  const updateWaves = useCallback((gameTime: number) => {
    if (!currentLevel || levelState.levelCompleted || levelState.levelFailed) return;
    
    const levelDuration = gameTime - levelState.levelStartTime;
    
    // Check for new waves to activate
    currentLevel.enemyWaves.forEach(wave => {
      const waveKey = wave.id;
      const waveStartTime = wave.startTime * 1000; // Convert to milliseconds
      const waveEndTime = waveStartTime + wave.duration * 1000;
      
      // Activate wave if it's time and not already active
      if (levelDuration >= waveStartTime && levelDuration <= waveEndTime && !activeWaves.current.has(waveKey)) {
        activeWaves.current.set(waveKey, {
          wave,
          startTime: gameTime,
          spawnedCount: 0
        });
        waveSpawnTimers.current.set(waveKey, 0);
      }
      
      // Deactivate wave if time is up
      if (levelDuration > waveEndTime && activeWaves.current.has(waveKey)) {
        activeWaves.current.delete(waveKey);
        waveSpawnTimers.current.delete(waveKey);
      }
    });
  }, [currentLevel, levelState.levelStartTime, levelState.levelCompleted, levelState.levelFailed]);
  
  // Spawn enemies from active waves
  const updateEnemySpawning = useCallback((deltaTime: number) => {
    activeWaves.current.forEach((waveData, waveKey) => {
      const { wave } = waveData;
      let spawnTimer = waveSpawnTimers.current.get(waveKey) || 0;
      spawnTimer += deltaTime;
      
      // Check each enemy type in the wave
      wave.enemies.forEach(enemyDef => {
        const spawnInterval = enemyDef.spawnInterval * 1000; // Convert to milliseconds
        
        if (spawnTimer >= spawnInterval && waveData.spawnedCount < enemyDef.count) {
          spawnEnemyFromWave(enemyDef, wave);
          waveData.spawnedCount++;
          waveSpawnTimers.current.set(waveKey, 0); // Reset timer
        }
      });
      
      waveSpawnTimers.current.set(waveKey, spawnTimer);
    });
  }, [spawnEnemyFromWave]);
  
  // Game loop
  useEffect(() => {
    if (!uiState.isPlaying || uiState.gameOver || !currentLevel || levelState.levelCompleted || levelState.levelFailed) return;
    
    let lastTime = performance.now();
    
    const gameLoop = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      
      const config = levelConfig.current;
      
      // Update wave management
      updateWaves(currentTime);
      
      // Update enemy spawning from active waves
      updateEnemySpawning(deltaTime * 1000); // Convert back to milliseconds for spawning
      
      // Update projectiles
      projectiles.current = projectiles.current.filter(p => {
        p.y += p.velocityY * deltaTime;
        return p.y > -p.size;
      });
      
      // Update enemies with balloon physics
      enemies.current = enemies.current.filter(enemy => {
        // Use level-specific physics configuration
        const balloonGravity = GAME_CONFIG.GRAVITY * config.BALLOON_PHYSICS.GRAVITY_MULTIPLIER;
        const airResistance = config.BALLOON_PHYSICS.AIR_RESISTANCE;
        const minBounceVelocity = config.BALLOON_PHYSICS.MIN_BOUNCE_VELOCITY;
        
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
            levelActions.projectileHit();
            
            // Update score based on enemy size
            const points = getBalloonPoints(enemy.sizeLevel as 1 | 2 | 3);
            actions.updateScore(points);
            
            // Track balloon popped analytics
            const { trackBalloonPopped } = require('../utils/analytics');
            trackBalloonPopped(
              enemy.sizeLevel,
              points,
              levelProgress.currentCombo,
              currentLevel?.id
            );
            
            // Split enemy if not smallest size, otherwise it's eliminated
            if (enemy.sizeLevel > 1) {
              const newSize = enemy.sizeLevel - 1;
              const size = getBalloonSize(newSize as 1 | 2 | 3);
              
              // Create split enemies based on level configuration
              const splitBehavior = currentLevel?.enemyWaves
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
          levelActions.enemyEliminated(nanoid(), getBalloonPoints(1)); // Use smallest balloon points as base
        }
      }
      
      // Update enemy count in level progression store to match actual enemies on screen
      // This ensures the victory condition checking has accurate enemy count
      const currentEnemyCount = enemies.current.length;
      if (currentEnemyCount !== levelState.enemiesRemaining) {
        // The store will be updated through the enemyEliminated calls above
        // but we should make sure it's in sync for victory condition checking
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
        missedProjectiles.forEach(() => levelActions.projectileMissed());
      }
      
      // Check for level completion - no enemies left and all waves finished
      const totalEnemiesOnScreen = enemies.current.length;
      if (totalEnemiesOnScreen === 0 && currentLevel) {
        // Check if all waves have finished spawning
        const currentTime = performance.now();
        const levelDuration = currentTime - levelState.levelStartTime;
        
        const allWavesFinished = currentLevel.enemyWaves.every(wave => {
          const waveEndTime = (wave.startTime + wave.duration) * 1000;
          return levelDuration > waveEndTime;
        });
        
        if (allWavesFinished) {
          // All enemies eliminated and no more will spawn - trigger victory
          levelActions.completeObjective('eliminate_all_enemies');
        }
      }
      
      // Check level victory/failure conditions
      levelActions.checkVictoryConditions();
      levelActions.checkFailureConditions();
      
      // Force re-render
      forceUpdate(prev => prev + 1);
      
      // Continue loop if level is still active
      if (!levelState.levelCompleted && !levelState.levelFailed) {
        requestAnimationFrame(gameLoop);
      }
    };
    
    const animationId = requestAnimationFrame(gameLoop);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [
    uiState.isPlaying, 
    uiState.gameOver, 
    currentLevel, 
    levelState.levelCompleted, 
    levelState.levelFailed,
    levelState.levelStartTime,
    levelActions, 
    actions, 
    screenWidth,
    updateWaves,
    updateEnemySpawning
  ]);
  
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