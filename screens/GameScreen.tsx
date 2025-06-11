import React, { useEffect, useRef } from 'react';
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
import { ArcadeContainer } from '@/components/arcade/ArcadeContainer';
import { ArcadeButton } from '@/components/arcade/ArcadeButton';
import { ArcadeText } from '@/components/arcade/ArcadeText';
import { ArcadeColors } from '@/constants/ArcadeColors';
import { useGameActions } from '@/store/gameStore';
import { CRTFrame } from '@/components/ui/CRTFrame';
import { EnhancedGameHUD } from '@/components/ui/EnhancedGameHUD';

export const GameScreen: React.FC = () => {
  // Use our custom hooks for clean separation of concerns
  const {
    peteRef,
    enemiesRef,
    projectilesRef,
    uiState,
    shootProjectile,
    updatePetePosition,
    resetGame,
    GAME_AREA_TOP,
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
    GAME_AREA_BOTTOM,
    deltaTimeRef,
    renderTickRef,
    renderTrigger,
  } = useGameLogic();

  const { handleTouch, handleTouchMove, rippleAnim, rippleOpacity, ripplePosition } = useGameInput(
    SCREEN_WIDTH,
    shootProjectile,
    updatePetePosition
  );

  const actions = useGameActions();
  const gameOverScale = useRef(new Animated.Value(0)).current;
  const gameOverOpacity = useRef(new Animated.Value(0)).current;

  // Calculate enhanced HUD props
  const isInDanger = enemiesRef.current.some((enemy: any) => 
    enemy.y > SCREEN_HEIGHT * 0.7
  );
  const currentCombo = uiState.score > 0 ? Math.min(Math.floor(uiState.score / 50) + 1, 10) : 1;
  const specialCharge = Math.min((uiState.score % 200) * 0.5, 100);
  const scoreInLevel = uiState.score % 100;
  const nextLevelScore = 100;

  // Auto-start the game when component mounts
  useEffect(() => {
    if (!uiState.isPlaying && !uiState.gameOver) {
      if (__DEV__) {
        console.log('GameScreen: Auto-starting game');
      }
      resetGame();
    }
  }, []); // Only run once on mount


  // Animate game over screen
  useEffect(() => {
    if (uiState.gameOver) {
      Animated.parallel([
        Animated.spring(gameOverScale, {
          toValue: 1,
          tension: 40,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(gameOverOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      gameOverScale.setValue(0);
      gameOverOpacity.setValue(0);
    }
  }, [uiState.gameOver]);

  // Render game header with arcade styling
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
      <View style={styles.scoreContainer}>
        <ArcadeText size="small" color="yellow" glow>
          SCORE
        </ArcadeText>
        <Text style={styles.scoreValue}>{uiState.score.toString().padStart(6, '0')}</Text>
      </View>
      <View style={styles.levelContainer}>
        <ArcadeText size="small" color="blue" glow>
          LEVEL
        </ArcadeText>
        <Text style={styles.levelValue}>{uiState.level.toString().padStart(2, '0')}</Text>
      </View>
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
              left: peteRef.current.x,
              top: peteRef.current.y,
            },
          ]}
        >
          <Text style={styles.errorText}>Pete Error</Text>
        </View>
      }
    >
      <Pete x={peteRef.current.x} y={peteRef.current.y} size={GAME_CONFIG.PETE_SIZE} />
    </GameErrorBoundary>
  );

  // Render all enemies
  const renderEnemies = () =>
    enemiesRef.current.map((enemy: any) => (
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
    projectilesRef.current.map((projectile: any) => (
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

  // Render game over overlay with arcade styling
  const renderGameOverOverlay = () => {
    if (!uiState.gameOver) return null;

    const handlePlayAgain = () => {
      resetGame();
    };

    const handleBackToMenu = () => {
      actions.setIsPlaying(false);
      actions.resetGame();
    };

    return (
      <ArcadeContainer variant="overlay" showBorder>
        <Animated.View
          style={[
            styles.gameOverContent,
            {
              transform: [{ scale: gameOverScale }],
              opacity: gameOverOpacity,
            },
          ]}
        >
          <ArcadeText size="xlarge" color="pink" glow style={styles.gameOverTitle}>
            GAME OVER
          </ArcadeText>

          <View style={styles.finalScoreContainer}>
            <ArcadeText size="medium" color="yellow" glow>
              FINAL SCORE
            </ArcadeText>
            <Text style={styles.finalScoreValue}>{uiState.score.toString().padStart(6, '0')}</Text>
          </View>

          <View style={styles.finalLevelContainer}>
            <ArcadeText size="small" color="blue" glow>
              LEVEL REACHED: {uiState.level}
            </ArcadeText>
          </View>

          <View style={styles.gameOverButtons}>
            <ArcadeButton
              text="PLAY AGAIN"
              onPress={handlePlayAgain}
              variant="primary"
              size="medium"
            />
            <ArcadeButton
              text="MAIN MENU"
              onPress={handleBackToMenu}
              variant="secondary"
              size="medium"
            />
          </View>
        </Animated.View>
      </ArcadeContainer>
    );
  };

  // Main render method
  return (
    <GameErrorBoundary onRetry={resetGame}>
      <CRTFrame showScanlines={true} intensity={1}>
        {/* Enhanced HUD overlay */}
        <EnhancedGameHUD
          score={uiState.score}
          level={uiState.level}
          lives={uiState.lives}
          combo={currentCombo}
          specialCharge={specialCharge}
          scoreInLevel={scoreInLevel}
          nextLevelScore={nextLevelScore}
          isInDanger={isInDanger}
        />
        <View
          style={styles.gameArea}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={handleTouch}
          onResponderMove={handleTouchMove}
          accessible={true}
          accessibilityLabel={`Game area - Score: ${uiState.score}, Level: ${uiState.level}. Touch to shoot and move Pete`}
          accessibilityRole="button"
          accessibilityHint="Touch anywhere to move Pete and shoot peas at enemies"
          accessibilityState={{ disabled: uiState.gameOver }}
        >
          {/* Background starfield */}
          <GameErrorBoundary>
            <Starfield
              isPlaying={uiState.isPlaying && !uiState.gameOver}
            />
          </GameErrorBoundary>


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

          {/* Debug enemy info */}
          {__DEV__ && (
            <View style={styles.debugInfo}>
              <Text style={styles.debugText}>Enemies: {enemiesRef.current.length}</Text>
              <Text style={styles.debugText}>
                Pete X: {Math.round(peteRef.current.x)}, Y: {Math.round(peteRef.current.y)}
              </Text>
              <Text style={styles.debugText}>
                Screen: {Math.round(SCREEN_WIDTH)}x{Math.round(SCREEN_HEIGHT)}
              </Text>
              <Text style={styles.debugText}>Game Area Bottom: {Math.round(GAME_AREA_BOTTOM)}</Text>
              {enemiesRef.current.length > 0 && (
                <Text style={styles.debugText}>
                  First enemy Y: {Math.round(enemiesRef.current[0].y)}
                </Text>
              )}
            </View>
          )}
        </View>
      </CRTFrame>
    </GameErrorBoundary>
  );
};

const styles = StyleSheet.create({
  gameArea: {
    flex: 1,
    backgroundColor: ArcadeColors.deepBlack,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: ArcadeColors.deepBlack,
    borderBottomWidth: 3,
    borderBottomColor: ArcadeColors.electricBlue,
    ...Platform.select({
      ios: {
        shadowColor: ArcadeColors.blueGlow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  scoreContainer: {
    alignItems: 'center',
  },
  levelContainer: {
    alignItems: 'center',
  },
  scoreValue: {
    color: ArcadeColors.yellow,
    fontSize: 28,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
    letterSpacing: 2,
    textShadowColor: ArcadeColors.yellowGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  levelValue: {
    color: ArcadeColors.electricBlue,
    fontSize: 28,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
    letterSpacing: 2,
    textShadowColor: ArcadeColors.blueGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  gameOverContent: {
    alignItems: 'center',
    padding: 40,
  },
  gameOverTitle: {
    marginBottom: 30,
  },
  finalScoreContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  finalScoreValue: {
    color: ArcadeColors.yellow,
    fontSize: 48,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
    letterSpacing: 3,
    marginTop: 10,
    textShadowColor: ArcadeColors.yellowGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  finalLevelContainer: {
    marginBottom: 40,
  },
  gameOverButtons: {
    alignItems: 'center',
  },
  ripple: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 255, 255, 0.3)',
    borderWidth: 2,
    borderColor: ArcadeColors.electricBlue,
    pointerEvents: 'none',
    ...Platform.select({
      ios: {
        shadowColor: ArcadeColors.blueGlow,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
      },
    }),
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
  debugInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ArcadeColors.electricBlue,
    maxWidth: 200,
  },
  debugText: {
    color: ArcadeColors.electricBlue,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textShadowColor: ArcadeColors.blueGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
    lineHeight: 14,
  },
});
