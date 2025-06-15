/**
 * Level Transition UI Components
 *
 * Handles all level transition states:
 * - Level start introduction
 * - Victory screen with level completion
 * - Failure screen with retry options
 * - Next level transition
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedBalloon } from './AnimatedBalloon';
import { getColorScheme } from '@/constants/GameColors';
import {
  useLevelProgressionActions,
  useCurrentLevel,
  useFailureReason,
  useShowLevelTransition,
  useShowVictoryScreen,
  useShowFailureScreen,
  useCurrentScore,
  useCurrentCombo,
  useShotsFired,
  useShotsHit,
} from '@/store/levelProgressionStore';
import { useGameActions } from '@/store/gameStore';
import { ANIMATION_CONFIG } from '@/constants/GameConfig';

interface LevelTransitionProps {
  screenWidth: number;
  screenHeight: number;
}

export const LevelTransition: React.FC<LevelTransitionProps> = ({
  screenWidth: _screenWidth,
  screenHeight: _screenHeight,
}) => {
  const currentLevel = useCurrentLevel();
  const levelActions = useLevelProgressionActions();
  const gameActions = useGameActions();

  // Individual level UI selectors
  const failureReason = useFailureReason();
  const showLevelTransition = useShowLevelTransition();
  const showVictoryScreen = useShowVictoryScreen();
  const showFailureScreen = useShowFailureScreen();

  // Individual level progress selectors
  const currentScore = useCurrentScore();
  const currentCombo = useCurrentCombo();
  const shotsFired = useShotsFired();
  const shotsHit = useShotsHit();

  // Calculate accuracy
  const accuracy = shotsFired > 0 ? (shotsHit / shotsFired) * 100 : 0;

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [slideAnim] = useState(new Animated.Value(50));

  // Start entrance animation when component mounts
  useEffect(() => {
    if (showLevelTransition || showVictoryScreen || showFailureScreen) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: ANIMATION_CONFIG.MENU.FADE_IN_DURATION,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: ANIMATION_CONFIG.MENU.FADE_IN_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showLevelTransition, showVictoryScreen, showFailureScreen]);

  // Exit animation
  const animateExit = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(callback);
  };

  // Handle level start
  const handleStartLevel = () => {
    animateExit(() => {
      levelActions.showTransition(false);
      levelActions.startLevel();
      gameActions.setIsPlaying(true);
    });
  };

  // Handle retry level
  const handleRetryLevel = () => {
    animateExit(() => {
      levelActions.showFailure(false);
      levelActions.restartLevel();
      gameActions.setIsPlaying(true);
    });
  };

  // Handle next level
  const handleNextLevel = async () => {
    animateExit(async () => {
      await levelActions.proceedToNextLevel();
      gameActions.setIsPlaying(true);
    });
  };

  // Handle return to menu
  const handleReturnToMenu = () => {
    animateExit(() => {
      levelActions.showVictory(false);
      levelActions.showFailure(false);
      gameActions.setIsPlaying(false);
      // Navigation to menu would go here
    });
  };

  if (!currentLevel) return null;

  // Don't show anything if no UI state is active
  if (!showLevelTransition && !showVictoryScreen && !showFailureScreen) {
    return null;
  }

  // Get theme colors from current level
  const primaryColor = currentLevel.theme.colorScheme.primary;
  const backgroundColor = 'rgba(0, 0, 0, 0.8)';
  const colorScheme = getColorScheme(typeof currentLevel.id === 'string' ? parseInt(currentLevel.id) || 1 : currentLevel.id);

  return (
    <View style={[styles.overlay, { backgroundColor }]}>
      <Animated.View
        style={[
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={[colorScheme.background, colorScheme.backgroundGradient[1]]}
          style={styles.container}
        >
          {/* Level Start Transition */}
          {showLevelTransition && (
            <LevelStartScreen
              level={currentLevel}
              primaryColor={primaryColor}
              onStart={handleStartLevel}
            />
          )}

          {/* Victory Screen */}
          {showVictoryScreen && (
            <VictoryScreen
              level={currentLevel}
              progress={{ currentScore, accuracy, currentCombo }}
              primaryColor={primaryColor}
              onNextLevel={handleNextLevel}
              onReturnToMenu={handleReturnToMenu}
            />
          )}

          {/* Failure Screen */}
          {showFailureScreen && (
            <FailureScreen
              level={currentLevel}
              failureReason={failureReason}
              progress={{ currentScore, accuracy, currentCombo }}
              primaryColor={primaryColor}
              onRetry={handleRetryLevel}
              onReturnToMenu={handleReturnToMenu}
            />
          )}
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

// Level Start Screen Component
interface LevelStartScreenProps {
  level: any;
  primaryColor: string;
  onStart: () => void;
}

const LevelStartScreen: React.FC<LevelStartScreenProps> = ({ level, primaryColor, onStart }) => {
  return (
    <View style={styles.screenContainer}>
      <Text style={[styles.levelTitle, { color: primaryColor }]}>Level {level.id}</Text>
      <Text style={styles.levelName}>{level.name}</Text>

      <View style={styles.objectiveContainer}>
        <Text style={styles.objectiveTitle}>Objective:</Text>
        {level.objectives.map((objective: any, index: number) => (
          <Text key={index} style={styles.objectiveText}>
            {objective.description}
          </Text>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, styles.startButton, { borderColor: primaryColor }]}
        onPress={onStart}
      >
        <Text style={[styles.buttonText, { color: primaryColor }]}>START LEVEL</Text>
      </TouchableOpacity>
    </View>
  );
};

// Victory Screen Component
interface VictoryScreenProps {
  level: any;
  progress: any;
  primaryColor: string;
  onNextLevel: () => void;
  onReturnToMenu: () => void;
}

const VictoryScreen: React.FC<VictoryScreenProps> = ({
  level,
  progress,
  primaryColor,
  onNextLevel,
  onReturnToMenu,
}) => {
  const [showConfetti, setShowConfetti] = useState(true);
  const [animatedScore, setAnimatedScore] = useState(0);
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const starAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const buttonsAnim = useRef(new Animated.Value(0)).current;

  // Calculate stars based on performance
  const calculateStars = () => {
    if (progress.accuracy >= 100) return 3;
    if (progress.accuracy >= 80) return 2;
    return 1;
  };

  const starsEarned = calculateStars();
  const colorScheme = getColorScheme(level.id);

  // Calculate time from level duration (mock for now)
  const levelTime = 4.25; // This should come from actual game time tracking

  useEffect(() => {
    // Add listener for score animation
    const listener = scoreAnim.addListener(({ value }) => {
      setAnimatedScore(Math.round(value));
    });

    // Start confetti animation
    Animated.timing(confettiAnim, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: true,
    }).start(() => setShowConfetti(false));

    // Animate elements in sequence
    Animated.sequence([
      // Score counting animation
      Animated.timing(scoreAnim, {
        toValue: progress.currentScore,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      // Stars animation
      Animated.stagger(
        200,
        starAnims.slice(0, starsEarned).map(anim =>
          Animated.spring(anim, {
            toValue: 1,
            tension: 100,
            friction: 5,
            useNativeDriver: true,
          })
        )
      ),
      // Stats slide in
      Animated.spring(statsAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
      // Buttons fade in
      Animated.timing(buttonsAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Cleanup listener
    return () => {
      scoreAnim.removeListener(listener);
    };
  }, [
    scoreAnim,
    confettiAnim,
    starAnims,
    starsEarned,
    statsAnim,
    buttonsAnim,
    progress.currentScore,
  ]);

  return (
    <View style={styles.screenContainer}>
      {/* Simple confetti effect */}
      {showConfetti && (
        <View style={styles.confettiContainer}>
          {[...Array(20)].map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.confettiParticle,
                {
                  left: Math.random() * 300,
                  backgroundColor: [
                    colorScheme.primary,
                    colorScheme.secondary,
                    '#FFD700',
                    '#FF6B6B',
                  ][Math.floor(Math.random() * 4)],
                  transform: [
                    {
                      translateY: confettiAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-50, 400],
                      }),
                    },
                    {
                      rotate: confettiAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '720deg'],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>
      )}

      {/* Floating Balloons */}
      <AnimatedBalloon x={80} y={100} size={60} color={colorScheme.primary} delay={0} />
      <AnimatedBalloon x={240} y={80} size={50} color={colorScheme.secondary} delay={200} />
      <AnimatedBalloon x={320} y={120} size={55} color={colorScheme.particle} delay={400} />

      <Text style={[styles.successTitle, { color: primaryColor }]}>LEVEL COMPLETE!</Text>

      {/* Stars Display */}
      <View style={styles.starsContainer}>
        {[0, 1, 2].map(index => (
          <Animated.View
            key={index}
            style={[
              styles.star,
              {
                opacity: starAnims[index],
                transform: [
                  {
                    scale: starAnims[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                  {
                    rotate: starAnims[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={[styles.starIcon, { color: index < starsEarned ? '#FFD700' : '#DDD' }]}>
              ⭐
            </Text>
          </Animated.View>
        ))}
      </View>

      {/* Animated Score */}
      <Text style={[styles.scoreDisplay, { color: primaryColor }]}>
        {animatedScore.toLocaleString()}
      </Text>

      {/* Stats with icons */}
      <Animated.View
        style={[
          styles.statsContainer,
          {
            opacity: statsAnim,
            transform: [
              {
                translateY: statsAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.statRow}>
          <Text style={styles.statIcon}>⏱️</Text>
          <Text style={styles.statLabel}>Time</Text>
          <Text style={styles.statValue}>{levelTime.toFixed(2)}s</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statIcon}>🎯</Text>
          <Text style={styles.statLabel}>Accuracy</Text>
          <Text style={[styles.statValue, progress.accuracy === 100 && styles.perfectAccuracy]}>
            {Math.round(progress.accuracy)}%
          </Text>
        </View>
        {progress.currentCombo > 0 && (
          <View style={styles.statRow}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statLabel}>Best Combo</Text>
            <Text style={styles.statValue}>{progress.currentCombo}x</Text>
          </View>
        )}
      </Animated.View>

      {/* Animated Buttons */}
      <Animated.View
        style={[
          styles.buttonContainer,
          {
            opacity: buttonsAnim,
            transform: [
              {
                translateY: buttonsAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.button, styles.primaryButton, { backgroundColor: primaryColor }]}
          onPress={onNextLevel}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, { color: 'white' }]}>PLAY AGAIN</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton, { borderColor: primaryColor }]}
          onPress={onReturnToMenu}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, { color: primaryColor }]}>MAIN MENU</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// Failure Screen Component
interface FailureScreenProps {
  level: any;
  failureReason: string | null;
  progress: any;
  primaryColor: string;
  onRetry: () => void;
  onReturnToMenu: () => void;
}

const FailureScreen: React.FC<FailureScreenProps> = ({
  level,
  failureReason,
  progress,
  primaryColor,
  onRetry,
  onReturnToMenu,
}) => {
  return (
    <View style={styles.screenContainer}>
      <Text style={styles.failureTitle}>LEVEL FAILED</Text>
      <Text style={styles.levelName}>{level.name}</Text>

      {failureReason && <Text style={styles.failureReason}>{failureReason}</Text>}

      <View style={styles.statsContainer}>
        <StatRow label="Score" value={progress.currentScore.toString()} />
        <StatRow label="Accuracy" value={`${Math.round(progress.accuracy)}%`} />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton, { backgroundColor: primaryColor }]}
          onPress={onRetry}
        >
          <Text style={[styles.buttonText, { color: 'white' }]}>TRY AGAIN</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={onReturnToMenu}>
          <Text style={styles.buttonText}>MENU</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Statistics Row Component
interface StatRowProps {
  label: string;
  value: string;
}

const StatRow: React.FC<StatRowProps> = ({ label, value }) => (
  <View style={styles.statRow}>
    <Text style={styles.statLabel}>{label}:</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 30,
    padding: 40,
    margin: 20,
    minWidth: 320,
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  screenContainer: {
    alignItems: 'center',
    width: '100%',
  },
  levelTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  levelName: {
    fontSize: 24,
    color: '#666',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 20,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  failureTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E74C3C',
    marginBottom: 10,
  },
  objectiveContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  objectiveTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  objectiveText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  failureReason: {
    fontSize: 16,
    color: '#E74C3C',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  star: {
    marginHorizontal: 5,
  },
  starIcon: {
    fontSize: 40,
  },
  scoreDisplay: {
    fontSize: 64,
    fontWeight: '700',
    marginBottom: 30,
  },
  statsContainer: {
    marginBottom: 30,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 20,
    padding: 20,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  statIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  perfectAccuracy: {
    color: '#4CAF50',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  startButton: {
    backgroundColor: 'transparent',
  },
  primaryButton: {
    borderWidth: 0,
  },
  secondaryButton: {
    backgroundColor: 'white',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  confettiParticle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    top: -20,
  },
});
