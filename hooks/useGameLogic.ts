import { useCallback, useRef, useEffect, useMemo, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { nanoid } from 'nanoid/non-secure';
import {
  useGameActions,
  useUIState,
} from '@/store/gameStore';
import { GameObject, updatePositionInPlace, isOutOfBounds, updateBouncingEnemyInPlace } from '@/utils/gameEngine';
import { CollisionSystem } from '@/systems/CollisionSystem';
import { GAME_CONFIG, EnemyType } from '@/constants/GameConfig';
import { ErrorLogger, safeHapticFeedback } from '@/utils/errorLogger';
import { PerformanceMonitor } from '@/utils/PerformanceMonitor';
import { GameObjectPools } from '@/utils/ObjectPool';
import * as Haptics from 'expo-haptics';

export const useGameLogic = () => {
  const dimensions = useWindowDimensions();
  const insets = useSafeAreaInsets();
  
  // UI state from Zustand
  const uiState = useUIState();
  const actions = useGameActions();

  // Game object refs (the real game state)
  const peteRef = useRef<GameObject>({
    id: 'pete',
    x: 0,
    y: 0,
    width: GAME_CONFIG.PETE_SIZE,
    height: GAME_CONFIG.PETE_SIZE,
  });
  const enemiesRef = useRef<GameObject[]>([]);
  const projectilesRef = useRef<GameObject[]>([]);

  // Game loop refs
  const gameLoopRef = useRef<number | undefined>(undefined);
  const lastUpdateTime = useRef<number>(0);
  const lastEnemySpawnTime = useRef<number>(0);
  const lastHapticTime = useRef<number>(0);
  const performanceMonitor = useRef(PerformanceMonitor.getInstance());
  const objectPools = useRef(GameObjectPools.getInstance());
  
  // Force re-render ticker
  const [renderTick, setRenderTick] = useState(0);

  // Screen dimensions
  const screenDimensions = useMemo(() => {
    const width = dimensions.width;
    const height = dimensions.height;
    const gameAreaTop = insets.top + GAME_CONFIG.HEADER_HEIGHT;
    const gameAreaBottom = height - insets.bottom - GAME_CONFIG.BOTTOM_PADDING;
    return {
      SCREEN_WIDTH: width,
      SCREEN_HEIGHT: height,
      GAME_AREA_TOP: gameAreaTop,
      GAME_AREA_BOTTOM: gameAreaBottom,
      GAME_AREA_HEIGHT: gameAreaBottom - gameAreaTop,
    };
  }, [dimensions.width, dimensions.height, insets.top, insets.bottom]);

  // Enemy creation function
  const createNewEnemy = useCallback((): GameObject | null => {
    try {
      const currentLevel = uiState.level;
      let type: EnemyType = 'basic';
      const rand = Math.random();

      if (
        currentLevel >= GAME_CONFIG.ENEMY_TYPE_UNLOCK_LEVELS.STRONG &&
        rand < GAME_CONFIG.ENEMY_TYPE_SPAWN_CHANCES.STRONG
      ) {
        type = 'strong';
      } else if (
        currentLevel >= GAME_CONFIG.ENEMY_TYPE_UNLOCK_LEVELS.FAST &&
        rand < GAME_CONFIG.ENEMY_TYPE_SPAWN_CHANCES.FAST
      ) {
        type = 'fast';
      }

      const sizeLevel = 3;
      const sizeMultiplier = GAME_CONFIG.ENEMY_SIZE_MULTIPLIERS.SIZE_3;
      const size = GAME_CONFIG.ENEMY_BASE_SIZE * sizeMultiplier;
      const horizontalSpeed = (Math.random() - 0.5) * 200;

      // Get enemy from object pool
      const enemy = objectPools.current.acquireEnemy();
      enemy.id = `enemy-${nanoid(8)}`;
      enemy.x = Math.random() * (screenDimensions.SCREEN_WIDTH - size);
      enemy.y = screenDimensions.GAME_AREA_TOP + 10;
      enemy.width = size;
      enemy.height = size;
      enemy.velocityX = horizontalSpeed;
      enemy.velocityY = 0;
      enemy.type = type;
      enemy.sizeLevel = sizeLevel;

      return enemy;
    } catch (error) {
      ErrorLogger.logGameLogicError(
        error instanceof Error ? error : new Error(String(error)),
        'create_enemy'
      );
      return null;
    }
  }, [uiState.level, screenDimensions]);

  // Projectile shooting
  const shootProjectile = useCallback(() => {
    try {
      const projectile = objectPools.current.acquireProjectile();
      const pete = peteRef.current;
      
      projectile.id = `projectile-${nanoid(8)}`;
      projectile.x = pete.x + pete.width / 2 - GAME_CONFIG.PROJECTILE_SIZE / 2;
      projectile.y = pete.y;
      projectile.width = GAME_CONFIG.PROJECTILE_SIZE;
      projectile.height = GAME_CONFIG.PROJECTILE_SIZE;
      projectile.velocityX = 0;
      projectile.velocityY = -GAME_CONFIG.PROJECTILE_SPEED;

      projectilesRef.current.push(projectile);
    } catch (error) {
      ErrorLogger.logGameLogicError(
        error instanceof Error ? error : new Error(String(error)),
        'shoot_projectile'
      );
    }
  }, []);

  // Update Pete position
  const updatePetePosition = useCallback((newX: number) => {
    peteRef.current.x = Math.max(0, Math.min(newX, screenDimensions.SCREEN_WIDTH - GAME_CONFIG.PETE_SIZE));
  }, [screenDimensions.SCREEN_WIDTH]);

  // Reset game
  const resetGame = useCallback(() => {
    try {
      // Stop current game loop
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = undefined;
      }

      // Reset timers
      lastUpdateTime.current = 0;
      lastEnemySpawnTime.current = 0;
      lastHapticTime.current = 0;

      // Return all objects to pools
      projectilesRef.current.forEach(p => objectPools.current.releaseProjectile(p));
      enemiesRef.current.forEach(e => objectPools.current.releaseEnemy(e));

      // Clear game object arrays
      projectilesRef.current = [];
      enemiesRef.current = [];

      // Reset Pete position at bottom of game area
      peteRef.current.x = screenDimensions.SCREEN_WIDTH / 2 - GAME_CONFIG.PETE_SIZE / 2;
      peteRef.current.y = screenDimensions.GAME_AREA_BOTTOM - GAME_CONFIG.PETE_SIZE - 10;

      // Reset UI state in Zustand
      actions.resetGame();

      // Log pool stats in development
      if (__DEV__) {
        objectPools.current.logStats();
      }
    } catch (error) {
      ErrorLogger.logGameLogicError(
        error instanceof Error ? error : new Error(String(error)),
        'reset_game'
      );
    }
  }, [screenDimensions, actions]);

  // Game loop
  const gameLoop = useCallback((timestamp: number) => {
    try {
      // Initialize timer on first run
      if (lastUpdateTime.current === 0) {
        lastUpdateTime.current = timestamp;
        lastEnemySpawnTime.current = timestamp;
      }

      const deltaTime = (timestamp - lastUpdateTime.current) / 1000;
      lastUpdateTime.current = timestamp;

      // Check if game should continue
      if (uiState.gameOver || !uiState.isPlaying) {
        return;
      }

      // Update projectiles
      projectilesRef.current.forEach(projectile => {
        updatePositionInPlace(projectile, deltaTime);
      });

      // Remove out-of-bounds projectiles
      projectilesRef.current = projectilesRef.current.filter(projectile => {
        const outOfBounds = isOutOfBounds(
          projectile,
          screenDimensions.SCREEN_WIDTH,
          screenDimensions.SCREEN_HEIGHT
        );
        if (outOfBounds) {
          objectPools.current.releaseProjectile(projectile);
        }
        return !outOfBounds;
      });

      // Update enemies
      enemiesRef.current.forEach(enemy => {
        updateBouncingEnemyInPlace(
          enemy,
          deltaTime,
          screenDimensions.SCREEN_WIDTH,
          screenDimensions.GAME_AREA_BOTTOM
        );
      });

      // Remove out-of-bounds enemies (similar to projectiles)
      enemiesRef.current = enemiesRef.current.filter(enemy => {
        const outOfBounds = isOutOfBounds(
          enemy,
          screenDimensions.SCREEN_WIDTH,
          screenDimensions.SCREEN_HEIGHT + 100 // Add buffer to account for bouncing
        );
        if (outOfBounds) {
          objectPools.current.releaseEnemy(enemy);
          if (__DEV__) {
            console.log('Removing out-of-bounds enemy:', {
              id: enemy.id.substring(0, 8),
              x: Math.round(enemy.x),
              y: Math.round(enemy.y),
              remaining: enemiesRef.current.length - 1
            });
          }
        }
        return !outOfBounds;
      });

      // Spawn new enemies
      const enemySpawnIntervalMs = actions.enemySpawnInterval();
      if (timestamp - lastEnemySpawnTime.current > enemySpawnIntervalMs) {
        lastEnemySpawnTime.current = timestamp;
        const newEnemy = createNewEnemy();
        if (newEnemy) {
          enemiesRef.current.push(newEnemy);
          
          if (__DEV__) {
            console.log('Spawning enemy:', {
              id: newEnemy.id.substring(0, 8),
              y: newEnemy.y,
              count: enemiesRef.current.length
            });
          }
        }
      }

      // Handle collisions
      const collisionResult = CollisionSystem.processCollisions(
        projectilesRef.current,
        enemiesRef.current,
        peteRef.current,
        objectPools.current
      );

      if (collisionResult.events.length > 0) {
        // Process collision events
        for (const event of collisionResult.events) {
          if (event.type === 'projectile-enemy') {
            // Handle haptic feedback with throttling
            const now = Date.now();
            if (now - lastHapticTime.current >= GAME_CONFIG.HAPTIC_THROTTLE_MS) {
              lastHapticTime.current = now;
              const hapticType = event.enemy.sizeLevel === 1 ? 'Light' : 'Medium';
              safeHapticFeedback(
                () =>
                  Haptics.impactAsync(
                    event.enemy.sizeLevel === 1
                      ? Haptics.ImpactFeedbackStyle.Light
                      : Haptics.ImpactFeedbackStyle.Medium
                  ),
                hapticType
              );
            }
          } else if (event.type === 'enemy-pete') {
            actions.setGameOver(true);
            safeHapticFeedback(
              () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
              'GameOver'
            );
            return;
          }
        }
      }

      // Update score
      if (collisionResult.scoreIncrease > 0) {
        actions.updateScore(collisionResult.scoreIncrease);

        // Check for level up with haptic feedback
        const newScore = uiState.score + collisionResult.scoreIncrease;
        const newLevel = Math.floor(newScore / GAME_CONFIG.LEVEL_UP_THRESHOLD) + 1;
        if (newLevel > uiState.level) {
          safeHapticFeedback(
            () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
            'LevelUp'
          );
        }
      }

      // Remove hit objects
      projectilesRef.current = projectilesRef.current.filter(p => {
        const isHit = collisionResult.hitProjectileIds.has(p.id);
        if (isHit) {
          objectPools.current.releaseProjectile(p);
        }
        return !isHit;
      });

      enemiesRef.current = enemiesRef.current.filter(e => {
        const isHit = collisionResult.hitEnemyIds.has(e.id);
        if (isHit) {
          objectPools.current.releaseEnemy(e);
        }
        return !isHit;
      });

      // Add newly split enemies
      enemiesRef.current.push(...collisionResult.splitEnemies);

      // Force React re-render
      setRenderTick(t => t + 1);

      // Continue game loop
      if (!uiState.gameOver && uiState.isPlaying) {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
      }
    } catch (error) {
      ErrorLogger.logGameLogicError(
        error instanceof Error ? error : new Error(String(error)),
        'game_loop'
      );
    }
  }, [uiState, screenDimensions, actions, createNewEnemy]);

  // Initialize Pete position when screen dimensions are available
  useEffect(() => {
    if (peteRef.current.x === 0 && peteRef.current.y === 0) {
      peteRef.current.x = screenDimensions.SCREEN_WIDTH / 2 - GAME_CONFIG.PETE_SIZE / 2;
      peteRef.current.y = screenDimensions.GAME_AREA_BOTTOM - GAME_CONFIG.PETE_SIZE - 10;
    }
  }, [screenDimensions]);

  // Start/stop game loop based on playing state
  useEffect(() => {
    if (uiState.isPlaying && !uiState.gameOver && !gameLoopRef.current) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    } else if ((!uiState.isPlaying || uiState.gameOver) && gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = undefined;
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = undefined;
      }
    };
  }, [uiState.isPlaying, uiState.gameOver, gameLoop]);

  return {
    // Game object refs for rendering
    peteRef,
    enemiesRef,
    projectilesRef,
    
    // UI state
    uiState,
    
    // Actions
    shootProjectile,
    updatePetePosition,
    resetGame,
    
    // Screen dimensions
    ...screenDimensions,
  };
};