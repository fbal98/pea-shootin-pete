import { EnemyType, GAME_CONFIG } from '@/constants/GameConfig';
import { useGameActions, useIsPlaying, useGameOver, useLevel, useScore } from '@/store/gameStore';
import { CollisionSystem } from '@/systems/CollisionSystem';
import { ErrorLogger, safeHapticFeedback } from '@/utils/errorLogger';
import {
  GameObject,
  isOutOfBounds,
  updateBouncingEnemyInPlace,
  updatePositionInPlace,
} from '@/utils/gameEngine';
import { GameObjectPools } from '@/utils/ObjectPool';
import * as Haptics from 'expo-haptics';
import { nanoid } from 'nanoid/non-secure';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const useGameLogic = () => {
  const dimensions = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // UI state from Zustand
  const isPlaying = useIsPlaying();
  const gameOver = useGameOver();
  const level = useLevel();
  const score = useScore();
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
  const objectPools = useRef(GameObjectPools.getInstance());

  // Use refs for high-frequency data to avoid React re-renders
  const deltaTimeRef = useRef(0);
  const renderTickRef = useRef(0);

  // Stable refs for game loop to prevent stale closures
  const uiStateRef = useRef({ isPlaying, gameOver, level, score });
  const actionsRef = useRef(actions);

  // Force re-render trigger for visual updates
  const [renderTrigger, setRenderTrigger] = useState(0);

  // Update refs when values change
  useEffect(() => {
    uiStateRef.current = { isPlaying, gameOver, level, score };
  }, [isPlaying, gameOver, level, score]);

  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

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

  // Ref for screen dimensions
  const screenDimensionsRef = useRef(screenDimensions);

  // Update screenDimensionsRef when screenDimensions change
  useEffect(() => {
    screenDimensionsRef.current = screenDimensions;
  }, [screenDimensions]);

  // Game loop function - defined once with stable refs
  const gameLoop = useCallback((timestamp: number) => {
    try {
      // Initialize timer on first run
      if (lastUpdateTime.current === 0) {
        lastUpdateTime.current = timestamp;
        lastEnemySpawnTime.current = timestamp;
      }

      const currentDeltaTime = Math.max(0, (timestamp - lastUpdateTime.current) / 1000);
      lastUpdateTime.current = timestamp;
      
      // Update delta time ref for other components (like Starfield)
      deltaTimeRef.current = currentDeltaTime;

      // Check if game should continue using refs
      if (uiStateRef.current.gameOver || !uiStateRef.current.isPlaying) {
        if (__DEV__) {
          console.log('Game loop stopping - gameOver:', uiStateRef.current.gameOver, 'isPlaying:', uiStateRef.current.isPlaying);
        }
        gameLoopRef.current = undefined;
        return;
      }

      // Update projectiles
      projectilesRef.current.forEach(projectile => {
        updatePositionInPlace(projectile, currentDeltaTime);
      });

      // Remove out-of-bounds projectiles
      projectilesRef.current = projectilesRef.current.filter(projectile => {
        const outOfBounds = isOutOfBounds(
          projectile,
          screenDimensionsRef.current.SCREEN_WIDTH,
          screenDimensionsRef.current.SCREEN_HEIGHT
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
          currentDeltaTime,
          screenDimensionsRef.current.SCREEN_WIDTH,
          screenDimensionsRef.current.GAME_AREA_BOTTOM
        );
      });

      // Remove out-of-bounds enemies
      enemiesRef.current = enemiesRef.current.filter(enemy => {
        const outOfBounds = isOutOfBounds(
          enemy,
          screenDimensionsRef.current.SCREEN_WIDTH,
          screenDimensionsRef.current.SCREEN_HEIGHT + 100 // Add buffer for bouncing
        );
        if (outOfBounds) {
          objectPools.current.releaseEnemy(enemy);
        }
        return !outOfBounds;
      });

      // Spawn new enemies
      const enemySpawnIntervalMs = actionsRef.current.enemySpawnInterval();
      if (timestamp - lastEnemySpawnTime.current > enemySpawnIntervalMs) {
        lastEnemySpawnTime.current = timestamp;
        
        // Create enemy
        try {
          const currentLevel = uiStateRef.current.level;
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

          enemiesRef.current.push(enemy);
        } catch (error) {
          ErrorLogger.logGameLogicError(
            error instanceof Error ? error : new Error(String(error)),
            'create_enemy'
          );
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
            return; // Game over, exit loop
          }
        }
      }

      // Update score
      if (collisionResult.scoreIncrease > 0) {
        actionsRef.current.updateScore(collisionResult.scoreIncrease);

        // Check for level up with haptic feedback
        const newScore = uiStateRef.current.score + collisionResult.scoreIncrease;
        const newLevel = Math.floor(newScore / GAME_CONFIG.LEVEL_UP_THRESHOLD) + 1;
        if (newLevel > uiStateRef.current.level) {
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

      // Increment render tick for components that need it
      renderTickRef.current += 1;

      // Force React re-render periodically for visual updates
      if (renderTickRef.current % 3 === 0) { // Every 3 frames
        setRenderTrigger(prev => prev + 1);
      }

      // Continue game loop if still playing
      if (!uiStateRef.current.gameOver && uiStateRef.current.isPlaying) {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
      } else {
        gameLoopRef.current = undefined;
      }
    } catch (error) {
      ErrorLogger.logGameLogicError(
        error instanceof Error ? error : new Error(String(error)),
        'game_loop'
      );
      // Continue loop even after error to keep game responsive
      if (!uiStateRef.current.gameOver && uiStateRef.current.isPlaying) {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
      }
    }
  }, []); // Empty dependency array since we use refs

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
    peteRef.current.x = Math.max(
      0,
      Math.min(newX, screenDimensionsRef.current.SCREEN_WIDTH - GAME_CONFIG.PETE_SIZE)
    );
  }, []);

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

      // Reset Pete position
      peteRef.current.x = screenDimensionsRef.current.SCREEN_WIDTH / 2 - GAME_CONFIG.PETE_SIZE / 2;
      peteRef.current.y = screenDimensionsRef.current.GAME_AREA_BOTTOM - GAME_CONFIG.PETE_SIZE - 10;

      // Reset refs
      deltaTimeRef.current = 0;
      renderTickRef.current = 0;

      // Reset UI state in Zustand (this will trigger the game loop to start)
      actions.resetGame();

      if (__DEV__) {
        objectPools.current.logStats();
      }
    } catch (error) {
      ErrorLogger.logGameLogicError(
        error instanceof Error ? error : new Error(String(error)),
        'reset_game'
      );
    }
  }, [actions]);

  // Initialize Pete position when screen dimensions are available
  useEffect(() => {
    if (peteRef.current.x === 0 && peteRef.current.y === 0) {
      peteRef.current.x = screenDimensionsRef.current.SCREEN_WIDTH / 2 - GAME_CONFIG.PETE_SIZE / 2;
      peteRef.current.y = screenDimensionsRef.current.GAME_AREA_BOTTOM - GAME_CONFIG.PETE_SIZE - 10;
    }
  }, [screenDimensions]);

  // Start/stop game loop based on playing state
  useEffect(() => {
    if (__DEV__) {
      console.log('Game loop effect triggered:', {
        isPlaying: uiState.isPlaying,
        gameOver: uiState.gameOver,
        hasLoop: !!gameLoopRef.current,
        loopId: gameLoopRef.current,
        timestamp: Date.now()
      });
    }

    if (isPlaying && !gameOver && !gameLoopRef.current) {
      if (__DEV__) {
        console.log('Starting game loop', { 
          timestamp: Date.now(),
          reason: 'isPlaying=true, gameOver=false, no existing loop'
        });
      }
      // Reset timing
      lastUpdateTime.current = 0;
      lastEnemySpawnTime.current = 0;
      
      // Start the game loop
      gameLoopRef.current = requestAnimationFrame(gameLoop);
      
      if (__DEV__) {
        console.log('Game loop started with ID:', gameLoopRef.current);
      }
    } else if ((!isPlaying || gameOver) && gameLoopRef.current) {
      if (__DEV__) {
        console.log('Stopping game loop', { 
          isPlaying: isPlaying, 
          gameOver: gameOver,
          loopId: gameLoopRef.current,
          timestamp: Date.now()
        });
      }
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = undefined;
    } else {
      if (__DEV__) {
        console.log('Game loop effect - no action needed:', {
          isPlaying: isPlaying,
          gameOver: gameOver,
          hasLoop: !!gameLoopRef.current,
          reason: !isPlaying ? 'not playing' : 
                  gameOver ? 'game over' : 
                  gameLoopRef.current ? 'loop already exists' : 'unknown'
        });
      }
    }

    return () => {
      if (gameLoopRef.current) {
        if (__DEV__) {
          console.log('Game loop effect cleanup - canceling loop:', gameLoopRef.current);
        }
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = undefined;
      }
    };
  }, [isPlaying, gameOver]);

  return {
    // Game object refs for rendering
    peteRef,
    enemiesRef,
    projectilesRef,

    // UI state
    uiState: { isPlaying, gameOver, level, score },

    // Actions
    shootProjectile,
    updatePetePosition,
    resetGame,

    // Screen dimensions
    ...screenDimensions,

    // Delta time for animations (via ref to avoid re-renders)
    deltaTimeRef,
    renderTickRef,
    renderTrigger, // For forcing React re-renders
  };
};