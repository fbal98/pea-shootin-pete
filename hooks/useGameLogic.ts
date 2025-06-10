import { useCallback, useRef, useEffect, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { nanoid } from 'nanoid/non-secure';
import {
  useGameStore,
  useGameActions,
  useGameState,
  useLevel,
  useGameOver,
  useIsPlaying,
  useIsPaused,
} from '@/store/gameStore';
import { GameObject, updatePosition, isOutOfBounds, updateBouncingEnemy } from '@/utils/gameEngine';
import { CollisionSystem } from '@/systems/CollisionSystem';
import { GAME_CONFIG, EnemyType } from '@/constants/GameConfig';
import { ErrorLogger, safeHapticFeedback } from '@/utils/errorLogger';
import { PerformanceMonitor } from '@/utils/PerformanceMonitor';
import { GameObjectPools } from '@/utils/ObjectPool';
import * as Haptics from 'expo-haptics';

export const useGameLogic = () => {
  const dimensions = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Refs for game loop state
  const gameLoopRef = useRef<number | undefined>(undefined);
  const lastUpdateTime = useRef<number>(0);
  const lastEnemySpawnTime = useRef<number>(0);
  const lastHapticTime = useRef<number>(0);
  const performanceMonitor = useRef(PerformanceMonitor.getInstance());
  const objectPools = useRef(GameObjectPools.getInstance());

  // Memoize screen calculations to prevent infinite re-renders
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

  // Store the screenDimensions in a ref to prevent stale closures
  const screenDimensionsRef = useRef(screenDimensions);
  useEffect(() => {
    screenDimensionsRef.current = screenDimensions;
  }, [screenDimensions]);

  // Get stable actions reference
  const actions = useGameActions();
  const actionsRef = useRef(actions);
  
  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  // Get game state with shallow comparison
  const gameState = useGameState();

  // Get individual state values that are used in callbacks
  const level = useLevel();
  const gameOver = useGameOver();
  const isPlaying = useIsPlaying();
  const isPaused = useIsPaused();

  // Store these values in refs to prevent unnecessary re-renders
  const levelRef = useRef(level);
  const gameOverRef = useRef(gameOver);
  const isPlayingRef = useRef(isPlaying);
  const isPausedRef = useRef(isPaused);
  const gameStateRef = useRef<typeof gameState>(gameState);

  // Update individual state refs (these change less frequently)
  useEffect(() => {
    levelRef.current = level;
    gameOverRef.current = gameOver;
    isPlayingRef.current = isPlaying;
    isPausedRef.current = isPaused;
  }, [level, gameOver, isPlaying, isPaused]);

  // Update gameState ref separately (this changes frequently)
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Enemy spawning logic
  const spawnEnemyInternal = useCallback(() => {
    try {
      const currentLevel = gameStateRef.current.level;
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
      enemy.x = Math.random() * (screenDimensionsRef.current.SCREEN_WIDTH - size);
      enemy.y = screenDimensionsRef.current.GAME_AREA_TOP + 10;
      enemy.width = size;
      enemy.height = size;
      enemy.velocityX = horizontalSpeed;
      enemy.velocityY = 0;
      enemy.type = type;
      enemy.sizeLevel = sizeLevel;

      actionsRef.current.addEnemy(enemy);
    } catch (error) {
      ErrorLogger.logGameLogicError(
        error instanceof Error ? error : new Error(String(error)),
        'spawn_enemy',
        gameStateRef.current
      );
    }
  }, []);

  // Store spawn enemy function in ref to avoid dependency chain
  const spawnEnemyRef = useRef(spawnEnemyInternal);
  useEffect(() => {
    spawnEnemyRef.current = spawnEnemyInternal;
  }, [spawnEnemyInternal]);

  const spawnEnemy = useCallback(() => {
    spawnEnemyRef.current();
  }, []);

  // Projectile shooting logic
  const shootProjectile = useCallback(() => {
    try {
      if (gameStateRef.current.gameOver) return;

      const pete = gameStateRef.current.pete;
      
      // Get projectile from object pool
      const projectile = objectPools.current.acquireProjectile();
      projectile.id = `projectile-${nanoid(8)}`;
      projectile.x = pete.x + GAME_CONFIG.PETE_SIZE / 2 - GAME_CONFIG.PROJECTILE_SIZE / 2;
      projectile.y = pete.y;
      projectile.width = GAME_CONFIG.PROJECTILE_SIZE;
      projectile.height = GAME_CONFIG.PROJECTILE_SIZE;
      projectile.velocityX = 0;
      projectile.velocityY = -GAME_CONFIG.PROJECTILE_SPEED;

      actionsRef.current.addProjectile(projectile);
    } catch (error) {
      ErrorLogger.logGameLogicError(
        error instanceof Error ? error : new Error(String(error)),
        'shoot_projectile',
        gameStateRef.current
      );
    }
  }, []);

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

        // Get current state
        const currentState = gameStateRef.current;

        // Check if game is over
        if (currentState.gameOver) return;

        // Handle enemy spawning
        const enemySpawnIntervalMs = actionsRef.current.enemySpawnInterval();
        if (timestamp - lastEnemySpawnTime.current > enemySpawnIntervalMs) {
          lastEnemySpawnTime.current = timestamp;
          spawnEnemyRef.current();
        }

        // Update projectiles
        const updatedProjectiles = currentState.projectiles
          .map((projectile: GameObject) => updatePosition(projectile, currentDeltaTime))
          .filter((projectile: GameObject) => {
            const outOfBounds = isOutOfBounds(
              projectile,
              screenDimensionsRef.current.SCREEN_WIDTH,
              screenDimensionsRef.current.SCREEN_HEIGHT
            );
            if (outOfBounds) {
              // Return projectile to pool when it goes out of bounds
              objectPools.current.releaseProjectile(projectile);
            }
            return !outOfBounds;
          });

        if (updatedProjectiles.length !== currentState.projectiles.length) {
          actionsRef.current.setProjectiles(updatedProjectiles);
        }

        // Update enemies
        const updatedEnemies = currentState.enemies.map((enemy: GameObject) =>
          updateBouncingEnemy(
            enemy,
            currentDeltaTime,
            screenDimensionsRef.current.SCREEN_WIDTH,
            screenDimensionsRef.current.GAME_AREA_BOTTOM
          )
        );

        actionsRef.current.setEnemies(updatedEnemies);

        // Handle collisions
        const collisionResult = CollisionSystem.processCollisions(
          updatedProjectiles,
          updatedEnemies,
          currentState.pete
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
              actionsRef.current.setGameOver(true);
              safeHapticFeedback(
                () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
                'GameOver'
              );
              return;
            }
          }

          // Update score
          if (collisionResult.scoreIncrease > 0) {
            actionsRef.current.updateScore(collisionResult.scoreIncrease);

            // Check for level up with haptic feedback
            const newScore = currentState.score + collisionResult.scoreIncrease;
            const newLevel = Math.floor(newScore / GAME_CONFIG.LEVEL_UP_THRESHOLD) + 1;
            if (newLevel > currentState.level) {
              safeHapticFeedback(
                () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
                'LevelUp'
              );
            }
          }

          // Update game objects and return hit objects to pools
          const remainingProjectiles = updatedProjectiles.filter((p: GameObject) => {
            const isHit = collisionResult.hitProjectileIds.has(p.id);
            if (isHit) {
              objectPools.current.releaseProjectile(p);
            }
            return !isHit;
          });
          const remainingEnemies = updatedEnemies
            .filter((e: GameObject) => {
              const isHit = collisionResult.hitEnemyIds.has(e.id);
              if (isHit) {
                objectPools.current.releaseEnemy(e);
              }
              return !isHit;
            })
            .concat(collisionResult.splitEnemies);

          actionsRef.current.setProjectiles(remainingProjectiles);
          actionsRef.current.setEnemies(remainingEnemies);
        }

        // Continue the animation loop if game is not over
        if (!currentState.gameOver) {
          gameLoopRef.current = requestAnimationFrame(gameLoop);
        }
      } catch (error) {
        ErrorLogger.logGameLogicError(
          error instanceof Error ? error : new Error(String(error)),
          'game_loop',
          gameStateRef.current
        );
        actionsRef.current.setGameOver(true);
      }
    },
    []
  );

  // Start/stop game loop
  useEffect(() => {
    if (isPlaying && !gameOver && !isPaused) {
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
  }, [isPlaying, gameOver, isPaused, gameLoop]);

  // Reset game
  const resetGame = useCallback(() => {
    try {
      lastUpdateTime.current = 0;
      lastEnemySpawnTime.current = 0;
      lastHapticTime.current = 0;

      // Return all current objects to pools before reset
      const currentState = gameStateRef.current;
      currentState.projectiles.forEach((p: GameObject) => objectPools.current.releaseProjectile(p));
      currentState.enemies.forEach((e: GameObject) => objectPools.current.releaseEnemy(e));

      actionsRef.current.resetGame(screenDimensionsRef.current.SCREEN_WIDTH, screenDimensionsRef.current.GAME_AREA_BOTTOM);

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
  }, []);

  return {
    gameState,
    shootProjectile,
    resetGame,
    GAME_AREA_TOP: screenDimensions.GAME_AREA_TOP,
    GAME_AREA_BOTTOM: screenDimensions.GAME_AREA_BOTTOM,
    GAME_AREA_HEIGHT: screenDimensions.GAME_AREA_HEIGHT,
    SCREEN_WIDTH: screenDimensions.SCREEN_WIDTH,
  };
};
