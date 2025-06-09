import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  Platform,
  Animated,
  useWindowDimensions,
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

const PETE_SIZE = 40;
const ENEMY_SIZE = 30;
const PROJECTILE_SIZE = 10;
const PROJECTILE_SPEED = 300;
const ENEMY_SPEED = 50;
const MOVE_THROTTLE_MS = 32;

export const GameScreen: React.FC = () => {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  
  // High-frequency state stored in ref (positions, velocities)
  const gameStateRef = useRef<GameState>({
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

  // Low-frequency state for triggering renders
  const [renderTrigger, setRenderTrigger] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);

  const gameLoopRef = useRef<number | undefined>(undefined);
  const lastUpdateTime = useRef<number>(0);
  const lastEnemySpawnTime = useRef<number>(0);
  const [deltaTime, setDeltaTime] = useState<number>(0);
  
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;
  const [ripplePosition, setRipplePosition] = useState({ x: 0, y: 0 });
  
  const lastMoveTime = useRef(0);

  const showRippleEffect = (x: number, y: number) => {
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
    if (gameStateRef.current.gameOver) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    
    showRippleEffect(x, y);
    shootProjectile();
    updatePetePosition(x);
  }, []);

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
    
    if (gameStateRef.current.gameOver) return;
    
    const newX = Math.max(
      0,
      Math.min(x - PETE_SIZE / 2, SCREEN_WIDTH - PETE_SIZE)
    );
    
    gameStateRef.current.pete.x = newX;
    setRenderTrigger(prev => prev + 1);
  }, [SCREEN_WIDTH]);

  const shootProjectile = () => {
    if (gameStateRef.current.gameOver) return;
    
    const projectile: GameObject = {
      id: `projectile-${Date.now()}`,
      x: gameStateRef.current.pete.x + PETE_SIZE / 2 - PROJECTILE_SIZE / 2,
      y: gameStateRef.current.pete.y,
      width: PROJECTILE_SIZE,
      height: PROJECTILE_SIZE,
      velocityX: 0,
      velocityY: -PROJECTILE_SPEED,
    };

    gameStateRef.current.projectiles.push(projectile);
  };

  const spawnEnemy = () => {
    let type: 'basic' | 'fast' | 'strong' = 'basic';
    const rand = Math.random();
    
    if (gameStateRef.current.level >= 3 && rand < 0.2) {
      type = 'strong';
    } else if (gameStateRef.current.level >= 2 && rand < 0.4) {
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

    gameStateRef.current.enemies.push(enemy);
  };

  const gameLoop = useCallback((timestamp: number) => {
    if (lastUpdateTime.current === 0) {
      lastUpdateTime.current = timestamp;
      lastEnemySpawnTime.current = timestamp;
    }
    
    const currentDeltaTime = (timestamp - lastUpdateTime.current) / 1000;
    lastUpdateTime.current = timestamp;
    setDeltaTime(currentDeltaTime);

    // Check if game is over
    if (gameStateRef.current.gameOver) return;

    // Handle enemy spawning based on time
    const enemySpawnInterval = Math.max(500, 2000 - gameStateRef.current.level * 100);
    if (timestamp - lastEnemySpawnTime.current > enemySpawnInterval) {
      lastEnemySpawnTime.current = timestamp;
      spawnEnemy();
    }

    // Update projectiles
    gameStateRef.current.projectiles = gameStateRef.current.projectiles
      .map((projectile) => updatePosition(projectile, currentDeltaTime))
      .filter((projectile) => !isOutOfBounds(projectile, SCREEN_WIDTH, SCREEN_HEIGHT));

    // Update enemies
    gameStateRef.current.enemies = gameStateRef.current.enemies
      .map((enemy) => updateBouncingEnemy(enemy, currentDeltaTime, SCREEN_WIDTH, SCREEN_HEIGHT - 50));

    // Handle collisions
    const remainingProjectiles: GameObject[] = [];
    const newEnemies: GameObject[] = [];
    const hitEnemyIds = new Set<string>();
    let scoreChanged = false;
    let levelChanged = false;

    gameStateRef.current.projectiles.forEach((projectile) => {
      let hit = false;
      gameStateRef.current.enemies.forEach((enemy) => {
        if (!hit && checkCollision(projectile, enemy)) {
          hit = true;
          hitEnemyIds.add(enemy.id);
          
          const points = 10 * (4 - (enemy.sizeLevel || 1));
          gameStateRef.current.score += points;
          scoreChanged = true;
          
          if (enemy.sizeLevel === 1) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          }
          
          if (gameStateRef.current.score > 0 && gameStateRef.current.score % 100 === 0) {
            gameStateRef.current.level += 1;
            levelChanged = true;
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

    // Update enemies array with remaining enemies and new split enemies
    gameStateRef.current.enemies = gameStateRef.current.enemies
      .filter(enemy => !hitEnemyIds.has(enemy.id))
      .concat(newEnemies);
    gameStateRef.current.projectiles = remainingProjectiles;

    // Check for collisions with Pete
    gameStateRef.current.enemies.forEach((enemy) => {
      if (checkCollision(enemy, gameStateRef.current.pete)) {
        gameStateRef.current.gameOver = true;
        setGameOver(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
    });

    // Update React state only when necessary
    if (scoreChanged) {
      setScore(gameStateRef.current.score);
    }
    if (levelChanged) {
      setLevel(gameStateRef.current.level);
    }

    // Trigger render for position updates
    setRenderTrigger(prev => prev + 1);

    // Continue the animation loop if game is not over
    if (!gameStateRef.current.gameOver) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
  }, [SCREEN_WIDTH, SCREEN_HEIGHT]);

  useEffect(() => {
    if (!gameOver) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    } else {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = undefined;
      }
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = undefined;
      }
    };
  }, [gameOver, gameLoop]);


  const resetGame = () => {
    lastUpdateTime.current = 0;
    lastEnemySpawnTime.current = 0;
    
    // Reset ref state
    gameStateRef.current = {
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
    };
    
    // Reset React state
    setGameOver(false);
    setScore(0);
    setLevel(1);
    setRenderTrigger(0);
  };

  const renderGameContent = () => (
    <>
      <Starfield isPlaying={!gameOver} deltaTime={deltaTime} />
      
      <View style={styles.header}>
        <Text style={styles.scoreText}>Score: {score}</Text>
        <Text style={styles.levelText}>Level: {level}</Text>
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
        x={gameStateRef.current.pete.x}
        y={gameStateRef.current.pete.y}
        size={PETE_SIZE}
      />

      {gameStateRef.current.enemies.map((enemy) => (
        <Enemy
          key={enemy.id}
          x={enemy.x}
          y={enemy.y}
          size={enemy.width}
          type={enemy.type}
          sizeLevel={enemy.sizeLevel}
        />
      ))}

      {gameStateRef.current.projectiles.map((projectile) => (
        <Projectile
          key={projectile.id}
          x={projectile.x}
          y={projectile.y}
          size={PROJECTILE_SIZE}
        />
      ))}

      {gameOver && (
        <View style={styles.gameOverContainer}>
          <Text style={styles.gameOverText}>Game Over!</Text>
          <Text style={styles.finalScoreText}>Final Score: {score}</Text>
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