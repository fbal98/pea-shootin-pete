import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  Platform,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { GestureResponderEvent } from 'react-native';
import { Pete } from '@/components/game/Pete';
import { Enemy } from '@/components/game/Enemy';
import { Projectile } from '@/components/game/Projectile';
import { Starfield } from '@/components/game/Starfield';
import {
  GameObject,
  GameState,
  checkCollision,
  updatePosition,
  isOutOfBounds,
  updateBouncingEnemy,
  splitEnemy,
} from '@/utils/gameEngine';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PETE_SIZE = 40;
const ENEMY_SIZE = 30;
const PROJECTILE_SIZE = 10;
const PROJECTILE_SPEED = 300;
const ENEMY_SPEED = 50;
const GAME_LOOP_INTERVAL = 16;
const MOVE_THROTTLE_MS = 32;

export const GameScreen: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    pete: {
      id: 'pete',
      x: SCREEN_WIDTH / 2 - PETE_SIZE / 2,
      y: SCREEN_HEIGHT - 50 - PETE_SIZE - 10,
      width: PETE_SIZE,
      height: PETE_SIZE,
    },
    enemies: [],
    projectiles: [],
    score: 0,
    gameOver: false,
    level: 1,
  });

  const gameLoopRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const enemySpawnRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const lastUpdateTime = useRef(Date.now());
  
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;
  const [ripplePosition, setRipplePosition] = useState({ x: 0, y: 0 });
  
  const isMounted = useRef(true);
  const lastMoveTime = useRef(0);

  const showRippleEffect = (x: number, y: number) => {
    if (!isMounted.current) return;
    
    setRipplePosition({ x, y });
    
    rippleAnim.setValue(0);
    rippleOpacity.setValue(1);
    
    Animated.parallel([
      Animated.timing(rippleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(rippleOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleGameTouch = useCallback((x: number, y: number) => {
    if (!isMounted.current || gameState.gameOver) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    
    showRippleEffect(x, y);
    shootProjectile();
    updatePetePosition(x);
  }, [gameState.gameOver]);

  const handleTouch = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    handleGameTouch(locationX, locationY);
  };

  const handleTouchMove = (event: GestureResponderEvent) => {
    const { locationX } = event.nativeEvent;
    updatePetePosition(locationX);
  };

  const updatePetePosition = useCallback((x: number) => {
    const now = Date.now();
    if (now - lastMoveTime.current < MOVE_THROTTLE_MS) return;
    lastMoveTime.current = now;
    
    if (!isMounted.current) return;
    
    setGameState((prev) => {
      if (prev.gameOver) return prev;
      
      const newX = Math.max(
        0,
        Math.min(x - PETE_SIZE / 2, SCREEN_WIDTH - PETE_SIZE)
      );
      
      return {
        ...prev,
        pete: {
          ...prev.pete,
          x: newX,
        },
      };
    });
  }, []);

  const shootProjectile = () => {
    if (!isMounted.current) return;
    
    const projectile: GameObject = {
      id: `projectile-${Date.now()}`,
      x: gameState.pete.x + PETE_SIZE / 2 - PROJECTILE_SIZE / 2,
      y: gameState.pete.y,
      width: PROJECTILE_SIZE,
      height: PROJECTILE_SIZE,
      velocityX: 0,
      velocityY: -PROJECTILE_SPEED,
    };

    setGameState((prev) => {
      if (!isMounted.current || prev.gameOver) return prev;
      
      return {
        ...prev,
        projectiles: [...prev.projectiles, projectile],
      };
    });
  };

  const spawnEnemy = () => {
    let type: 'basic' | 'fast' | 'strong' = 'basic';
    const rand = Math.random();
    
    if (gameState.level >= 3 && rand < 0.2) {
      type = 'strong';
    } else if (gameState.level >= 2 && rand < 0.4) {
      type = 'fast';
    }

    const sizeLevel = 3;
    const size = ENEMY_SIZE * (1 + (sizeLevel - 1) * 0.3);
    const horizontalSpeed = (Math.random() - 0.5) * 200;
    
    const enemy: GameObject = {
      id: `enemy-${Date.now()}`,
      x: Math.random() * (SCREEN_WIDTH - size),
      y: 50,
      width: size,
      height: size,
      velocityX: horizontalSpeed,
      velocityY: 0,
      type,
      sizeLevel,
    };

    setGameState((prev) => ({
      ...prev,
      enemies: [...prev.enemies, enemy],
    }));
  };

  const gameLoop = () => {
    const currentTime = Date.now();
    const deltaTime = (currentTime - lastUpdateTime.current) / 1000;
    lastUpdateTime.current = currentTime;

    setGameState((prev) => {
      if (prev.gameOver) return prev;

      let newState = { ...prev };
      let updatedProjectiles = [...prev.projectiles];
      let updatedEnemies = [...prev.enemies];

      updatedProjectiles = updatedProjectiles
        .map((projectile) => updatePosition(projectile, deltaTime))
        .filter((projectile) => !isOutOfBounds(projectile, SCREEN_WIDTH, SCREEN_HEIGHT));

      updatedEnemies = updatedEnemies
        .map((enemy) => updateBouncingEnemy(enemy, deltaTime, SCREEN_WIDTH, SCREEN_HEIGHT));

      const remainingProjectiles: GameObject[] = [];
      const newEnemies: GameObject[] = [];
      const hitEnemyIds = new Set<string>();

      updatedProjectiles.forEach((projectile) => {
        let hit = false;
        updatedEnemies.forEach((enemy) => {
          if (!hit && checkCollision(projectile, enemy)) {
            hit = true;
            hitEnemyIds.add(enemy.id);
            
            const points = 10 * (4 - (enemy.sizeLevel || 1));
            newState.score += points;
            
            if (enemy.sizeLevel === 1) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            } else {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            }
            
            if (newState.score > 0 && newState.score % 100 === 0) {
              newState.level += 1;
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            }
            
            const splitEnemies = splitEnemy(enemy);
            newEnemies.push(...splitEnemies);
          }
        });
        if (!hit) {
          remainingProjectiles.push(projectile);
        }
      });

      const remainingEnemies = updatedEnemies.filter(enemy => !hitEnemyIds.has(enemy.id));
      remainingEnemies.push(...newEnemies);

      remainingEnemies.forEach((enemy) => {
        if (checkCollision(enemy, prev.pete)) {
          newState.gameOver = true;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        }
      });

      return {
        ...newState,
        projectiles: remainingProjectiles,
        enemies: remainingEnemies,
      };
    });
  };

  useEffect(() => {
    if (!gameState.gameOver && isMounted.current) {
      gameLoopRef.current = setInterval(gameLoop, GAME_LOOP_INTERVAL);
      enemySpawnRef.current = setInterval(spawnEnemy, Math.max(500, 2000 - gameState.level * 100));
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = undefined;
      }
      if (enemySpawnRef.current) {
        clearInterval(enemySpawnRef.current);
        enemySpawnRef.current = undefined;
      }
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = undefined;
      }
      if (enemySpawnRef.current) {
        clearInterval(enemySpawnRef.current);
        enemySpawnRef.current = undefined;
      }
    };
  }, [gameState.gameOver, gameState.level]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
      if (enemySpawnRef.current) {
        clearInterval(enemySpawnRef.current);
      }
    };
  }, []);

  const resetGame = () => {
    setGameState({
      pete: {
        id: 'pete',
        x: SCREEN_WIDTH / 2 - PETE_SIZE / 2,
        y: SCREEN_HEIGHT - 50 - PETE_SIZE - 10,
        width: PETE_SIZE,
        height: PETE_SIZE,
      },
      enemies: [],
      projectiles: [],
      score: 0,
      gameOver: false,
      level: 1,
    });
  };

  const renderGameContent = () => (
    <>
      <Starfield isPlaying={!gameState.gameOver} />
      
      <View style={styles.header}>
        <Text style={styles.scoreText}>Score: {gameState.score}</Text>
        <Text style={styles.levelText}>Level: {gameState.level}</Text>
      </View>

      <Animated.View
        style={[
          styles.ripple,
          {
            left: ripplePosition.x - 25,
            top: ripplePosition.y - 25,
            opacity: rippleOpacity,
            transform: [
              {
                scale: rippleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 2],
                }),
              },
            ],
          },
        ]}
      />

      <Pete
        x={gameState.pete.x}
        y={gameState.pete.y}
        size={PETE_SIZE}
      />

      {gameState.enemies.map((enemy) => (
        <Enemy
          key={enemy.id}
          x={enemy.x}
          y={enemy.y}
          size={enemy.width}
          type={enemy.type}
          sizeLevel={enemy.sizeLevel}
        />
      ))}

      {gameState.projectiles.map((projectile) => (
        <Projectile
          key={projectile.id}
          x={projectile.x}
          y={projectile.y}
          size={PROJECTILE_SIZE}
        />
      ))}

      {gameState.gameOver && (
        <View style={styles.gameOverContainer}>
          <Text style={styles.gameOverText}>Game Over!</Text>
          <Text style={styles.finalScoreText}>Final Score: {gameState.score}</Text>
          <TouchableOpacity style={styles.restartButton} onPress={resetGame}>
            <Text style={styles.restartButtonText}>Play Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  return (
    <View 
      style={styles.container}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handleTouch}
      onResponderMove={handleTouchMove}
    >
      {renderGameContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    borderBottomWidth: 2,
    borderBottomColor: '#00FFFF',
    marginBottom: 10,
  },
  scoreText: {
    color: '#00FFFF',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textShadowColor: '#00FFFF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  levelText: {
    color: '#FF00FF',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textShadowColor: '#FF00FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  gameOverContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameOverText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  finalScoreText: {
    color: '#fff',
    fontSize: 24,
    marginBottom: 30,
  },
  restartButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  restartButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  ripple: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 255, 255, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(0, 255, 255, 0.6)',
    pointerEvents: 'none',
  },
});