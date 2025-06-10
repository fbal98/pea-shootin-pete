import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform, Animated } from 'react-native';
import { Pete } from '@/components/game/Pete';
import { Enemy } from '@/components/game/Enemy';
import { Projectile } from '@/components/game/Projectile';
import { Starfield } from '@/components/game/Starfield';
import { GameErrorBoundary } from '@/components/GameErrorBoundary';
import { DebugFPSCounter } from '@/components/DebugFPSCounter';
import { useGameLogic } from '@/hooks/useGameLogic';
import { useGameInput } from '@/hooks/useGameInput';
import { GAME_CONFIG } from '@/constants/GameConfig';

export const GameScreen: React.FC = () => {
  // Use our custom hooks for clean separation of concerns
  const { gameState, shootProjectile, resetGame, GAME_AREA_TOP, SCREEN_WIDTH } = useGameLogic();

  const { handleTouch, handleTouchMove, rippleAnim, rippleOpacity, ripplePosition } = useGameInput(
    SCREEN_WIDTH,
    shootProjectile
  );

  // Render game header
  const renderHeader = () => (
    <View
      style={[
        styles.header,
        {
          paddingTop: GAME_CONFIG.SAFE_AREA_PADDING,
          height: GAME_CONFIG.HEADER_HEIGHT,
        },
      ]}
    >
      <Text style={styles.scoreText}>Score: {gameState.score}</Text>
      <Text style={styles.levelText}>Level: {gameState.level}</Text>
    </View>
  );

  // Render touch ripple effect
  const renderRippleEffect = () => (
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
  );

  // Render Pete character
  const renderPete = () => (
    <GameErrorBoundary
      fallbackComponent={
        <View
          style={[
            styles.errorPlaceholder,
            {
              left: gameState.pete.x,
              top: gameState.pete.y,
            },
          ]}
        >
          <Text style={styles.errorText}>Pete Error</Text>
        </View>
      }
    >
      <Pete x={gameState.pete.x} y={gameState.pete.y} size={GAME_CONFIG.PETE_SIZE} />
    </GameErrorBoundary>
  );

  // Render all enemies
  const renderEnemies = () =>
    gameState.enemies.map((enemy: any) => (
      <GameErrorBoundary
        key={enemy.id}
        fallbackComponent={
          <View
            style={[
              styles.errorPlaceholder,
              {
                left: enemy.x,
                top: enemy.y,
                width: enemy.width,
                height: enemy.height,
              },
            ]}
          >
            <Text style={styles.errorText}>Enemy Error</Text>
          </View>
        }
      >
        <Enemy
          x={enemy.x}
          y={enemy.y}
          size={enemy.width}
          type={enemy.type}
          sizeLevel={enemy.sizeLevel}
        />
      </GameErrorBoundary>
    ));

  // Render all projectiles
  const renderProjectiles = () =>
    gameState.projectiles.map((projectile: any) => (
      <GameErrorBoundary
        key={projectile.id}
        fallbackComponent={
          <View
            style={[
              styles.errorPlaceholder,
              {
                left: projectile.x,
                top: projectile.y,
                width: GAME_CONFIG.PROJECTILE_SIZE,
                height: GAME_CONFIG.PROJECTILE_SIZE,
              },
            ]}
          >
            <Text style={styles.errorText}>P</Text>
          </View>
        }
      >
        <Projectile x={projectile.x} y={projectile.y} size={GAME_CONFIG.PROJECTILE_SIZE} />
      </GameErrorBoundary>
    ));

  // Render game over overlay
  const renderGameOverOverlay = () => {
    if (!gameState.gameOver) return null;

    return (
      <View style={styles.gameOverContainer}>
        <Text style={styles.gameOverText}>Game Over!</Text>
        <Text style={styles.finalScoreText}>Final Score: {gameState.score}</Text>
        <Text style={styles.finalLevelText}>Level Reached: {gameState.level}</Text>
        <TouchableOpacity style={styles.restartButton} onPress={resetGame}>
          <Text style={styles.restartButtonText}>Play Again</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Main render method
  return (
    <GameErrorBoundary onRetry={resetGame}>
      <View
        style={styles.container}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={handleTouch}
        onResponderMove={handleTouchMove}
        accessible={true}
        accessibilityLabel={`Game area - Score: ${gameState.score}, Level: ${gameState.level}. Touch to shoot and move Pete`}
        accessibilityRole="button"
        accessibilityHint="Touch anywhere to move Pete and shoot peas at enemies"
        accessibilityState={{ disabled: gameState.gameOver }}
      >
        {/* Background starfield */}
        <GameErrorBoundary>
          <Starfield isPlaying={gameState.isPlaying && !gameState.gameOver} />
        </GameErrorBoundary>

        {/* Game header */}
        {renderHeader()}

        {/* Touch ripple effect */}
        {renderRippleEffect()}

        {/* Game objects */}
        {renderPete()}
        {renderEnemies()}
        {renderProjectiles()}

        {/* Game over overlay */}
        {renderGameOverOverlay()}

        {/* Debug FPS Counter (only in development) */}
        <DebugFPSCounter visible={__DEV__} position="top-right" />
      </View>
    </GameErrorBoundary>
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
    paddingHorizontal: 20,
    paddingBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  scoreText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  levelText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
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
    textAlign: 'center',
  },
  finalScoreText: {
    color: '#fff',
    fontSize: 24,
    marginBottom: 10,
    textAlign: 'center',
  },
  finalLevelText: {
    color: '#fff',
    fontSize: 20,
    marginBottom: 30,
    textAlign: 'center',
    opacity: 0.8,
  },
  restartButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
  errorPlaceholder: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 0, 0, 0.5)',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 20,
    minHeight: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
