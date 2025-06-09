import { useCallback, useRef, useEffect } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { nanoid } from 'nanoid/non-secure';
import { useGameStore, useGameActions } from '@/store/gameStore';
import { GameObject, updatePosition, isOutOfBounds, updateBouncingEnemy } from '@/utils/gameEngine';
import { CollisionSystem } from '@/systems/CollisionSystem';
import { GAME_CONFIG, EnemyType } from '@/constants/GameConfig';
import { ErrorLogger, safeHapticFeedback } from '@/utils/errorLogger';
import { PerformanceMonitor } from '@/utils/PerformanceMonitor';
import { GameObjectPools } from '@/utils/ObjectPool';
import * as Haptics from 'expo-haptics';

export const useGameLogic = () => {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const gameLoopRef = useRef<number | undefined>(undefined);
  const lastUpdateTime = useRef<number>(0);
  const lastEnemySpawnTime = useRef<number>(0);
  const lastHapticTime = useRef<number>(0);
  const performanceMonitor = useRef(PerformanceMonitor.getInstance());
  const objectPools = useRef(GameObjectPools.getInstance());

  // Calculate game area
  const GAME_AREA_TOP = insets.top + GAME_CONFIG.HEADER_HEIGHT;
  const GAME_AREA_BOTTOM = SCREEN_HEIGHT - insets.bottom - GAME_CONFIG.BOTTOM_PADDING;
  const GAME_AREA_HEIGHT = GAME_AREA_BOTTOM - GAME_AREA_TOP;

  // Store selectors
  const gameState = useGameStore();
  const actions = useGameActions();

  // Enemy spawning logic
  const spawnEnemy = useCallback(() => {
    try {
      let type: EnemyType = 'basic';
      const rand = Math.random();

      if (
        gameState.level >= GAME_CONFIG.ENEMY_TYPE_UNLOCK_LEVELS.STRONG &&
        rand < GAME_CONFIG.ENEMY_TYPE_SPAWN_CHANCES.STRONG
      ) {
        type = 'strong';
      } else if (
        gameState.level >= GAME_CONFIG.ENEMY_TYPE_UNLOCK_LEVELS.FAST &&
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
      enemy.x = Math.random() * (SCREEN_WIDTH - size);
      enemy.y = GAME_AREA_TOP + 10;
      enemy.width = size;
      enemy.height = size;
      enemy.velocityX = horizontalSpeed;
      enemy.velocityY = 0;
      enemy.type = type;
      enemy.sizeLevel = sizeLevel;

      actions.addEnemy(enemy);
    } catch (error) {
      ErrorLogger.logGameLogicError(
        error instanceof Error ? error : new Error(String(error)),
        'spawn_enemy',
        gameState
      );
    }
  }, [gameState.level, SCREEN_WIDTH, GAME_AREA_TOP, actions]);

  // Projectile shooting logic
  const shootProjectile = useCallback(() => {
    try {
      if (gameState.gameOver) return;

      // Get projectile from object pool
      const projectile = objectPools.current.acquireProjectile();
      projectile.id = `projectile-${nanoid(8)}`;
      projectile.x = gameState.pete.x + GAME_CONFIG.PETE_SIZE / 2 - GAME_CONFIG.PROJECTILE_SIZE / 2;
      projectile.y = gameState.pete.y;
      projectile.width = GAME_CONFIG.PROJECTILE_SIZE;
      projectile.height = GAME_CONFIG.PROJECTILE_SIZE;
      projectile.velocityX = 0;
      projectile.velocityY = -GAME_CONFIG.PROJECTILE_SPEED;

      actions.addProjectile(projectile);
    } catch (error) {
      ErrorLogger.logGameLogicError(
        error instanceof Error ? error : new Error(String(error)),
        'shoot_projectile',
        gameState
      );
    }
  }, [gameState.gameOver, gameState.pete, actions]);

  // Main game loop
  const gameLoop = useCallback(
    (timestamp: number) => {
      try {
        // Record frame for performance monitoring
        performanceMonitor.current.recordFrame(timestamp);

        if (lastUpdateTime.current === 0) {
          lastUpdateTime.current = timestamp;
          lastEnemySpawnTime.current = timestamp;
        }

        const currentDeltaTime = (timestamp - lastUpdateTime.current) / 1000;
        lastUpdateTime.current = timestamp;

        // Check if game is over
        if (gameState.gameOver) return;

        // Handle enemy spawning
        const enemySpawnInterval = actions.enemySpawnInterval();
        if (timestamp - lastEnemySpawnTime.current > enemySpawnInterval) {
          lastEnemySpawnTime.current = timestamp;
          spawnEnemy();
        }

        // Update projectiles
        const updatedProjectiles = gameState.projectiles
          .map(projectile => updatePosition(projectile, currentDeltaTime))
          .filter(projectile => {
            const outOfBounds = isOutOfBounds(projectile, SCREEN_WIDTH, SCREEN_HEIGHT);
            if (outOfBounds) {
              // Return projectile to pool when it goes out of bounds
              objectPools.current.releaseProjectile(projectile);
            }
            return !outOfBounds;
          });

        if (updatedProjectiles.length !== gameState.projectiles.length) {
          actions.setProjectiles(updatedProjectiles);
        }

        // Update enemies
        const updatedEnemies = gameState.enemies.map(enemy =>
          updateBouncingEnemy(enemy, currentDeltaTime, SCREEN_WIDTH, GAME_AREA_BOTTOM)
        );

        actions.setEnemies(updatedEnemies);

        // Handle collisions
        const collisionResult = CollisionSystem.processCollisions(
          gameState.projectiles,
          gameState.enemies,
          gameState.pete
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

          // Update score
          if (collisionResult.scoreIncrease > 0) {
            actions.updateScore(collisionResult.scoreIncrease);

            // Check for level up with haptic feedback
            const newScore = gameState.score + collisionResult.scoreIncrease;
            const newLevel = Math.floor(newScore / GAME_CONFIG.LEVEL_UP_THRESHOLD) + 1;
            if (newLevel > gameState.level) {
              safeHapticFeedback(
                () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
                'LevelUp'
              );
            }
          }

          // Update game objects and return hit objects to pools
          const remainingProjectiles = gameState.projectiles.filter(p => {
            const isHit = collisionResult.hitProjectileIds.has(p.id);
            if (isHit) {
              objectPools.current.releaseProjectile(p);
            }
            return !isHit;
          });
          const remainingEnemies = gameState.enemies
            .filter(e => {
              const isHit = collisionResult.hitEnemyIds.has(e.id);
              if (isHit) {
                objectPools.current.releaseEnemy(e);
              }
              return !isHit;
            })
            .concat(collisionResult.splitEnemies);

          actions.setProjectiles(remainingProjectiles);
          actions.setEnemies(remainingEnemies);
        }

        // Continue the animation loop if game is not over
        if (!gameState.gameOver) {
          gameLoopRef.current = requestAnimationFrame(gameLoop);
        }
      } catch (error) {
        ErrorLogger.logGameLogicError(
          error instanceof Error ? error : new Error(String(error)),
          'game_loop',
          gameState
        );
        actions.setGameOver(true);
      }
    },
    [gameState, actions, spawnEnemy, SCREEN_WIDTH, SCREEN_HEIGHT, GAME_AREA_BOTTOM]
  );

  // Start/stop game loop
  useEffect(() => {
    if (gameState.isPlaying && !gameState.gameOver && !gameState.isPaused) {
      performanceMonitor.current.start();
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    } else {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = undefined;
      }
      performanceMonitor.current.stop();
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = undefined;
      }
      performanceMonitor.current.stop();
    };
  }, [gameState.isPlaying, gameState.gameOver, gameState.isPaused, gameLoop]);

  // Reset game
  const resetGame = useCallback(() => {
    try {
      lastUpdateTime.current = 0;
      lastEnemySpawnTime.current = 0;
      lastHapticTime.current = 0;

      // Return all current objects to pools before reset
      gameState.projectiles.forEach(p => objectPools.current.releaseProjectile(p));
      gameState.enemies.forEach(e => objectPools.current.releaseEnemy(e));

      actions.resetGame(SCREEN_WIDTH, GAME_AREA_BOTTOM);

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
  }, [actions, SCREEN_WIDTH, GAME_AREA_BOTTOM, gameState.projectiles, gameState.enemies]);

  return {
    gameState,
    shootProjectile,
    resetGame,
    GAME_AREA_TOP,
    GAME_AREA_BOTTOM,
    GAME_AREA_HEIGHT,
  };
};
