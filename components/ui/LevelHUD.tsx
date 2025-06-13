/**
 * Level HUD - Heads-up display for level progression
 *
 * Shows:
 * - Current level name and number
 * - Progress indicator (enemies remaining)
 * - Current score
 * - Level objectives
 * - Time remaining (if applicable)
 * - Combo counter
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import {
  useCurrentLevel,
  useEnemiesRemaining,
  useTotalEnemies,
  useCurrentScore,
  useCurrentCombo,
  useShotsFired,
  useShotsHit,
  useLevelCompleted,
  useLevelFailed,
} from '@/store/levelProgressionStore';
import { useIsPlaying } from '@/store/gameStore';
import { UI_CONFIG, ANIMATION_CONFIG } from '@/constants/GameConfig';

interface LevelHUDProps {
  screenWidth: number;
}

export const LevelHUD: React.FC<LevelHUDProps> = ({ screenWidth }) => {
  const currentLevel = useCurrentLevel();
  const enemiesRemaining = useEnemiesRemaining();
  const totalEnemies = useTotalEnemies();
  const currentScore = useCurrentScore();
  const currentCombo = useCurrentCombo();
  const shotsFired = useShotsFired();
  const shotsHit = useShotsHit();

  // Calculate accuracy
  const accuracy = shotsFired > 0 ? (shotsHit / shotsFired) * 100 : 0;
  const levelCompleted = useLevelCompleted();
  const levelFailed = useLevelFailed();
  const isPlaying = useIsPlaying();

  // Animation values for combo display
  const [comboAnim] = useState(new Animated.Value(1));
  const [comboOpacity] = useState(new Animated.Value(0));
  const [previousCombo, setPreviousCombo] = useState(0);

  // Animate combo changes
  useEffect(() => {
    if (currentCombo > previousCombo && currentCombo > 1) {
      // Show combo with scale animation
      Animated.sequence([
        Animated.parallel([
          Animated.timing(comboOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(comboAnim, {
            toValue: 1.3,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(comboAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (currentCombo === 0 && previousCombo > 0) {
      // Hide combo when broken
      Animated.timing(comboOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }

    setPreviousCombo(currentCombo);
  }, [currentCombo]);

  if (!currentLevel || !isPlaying || levelCompleted || levelFailed) {
    return null;
  }

  // Get theme colors from level
  const primaryColor = currentLevel.theme.colorScheme.primary;
  const textColor = currentLevel.theme.uiStyle.scoreColor || '#FFFFFF';

  // Calculate progress percentage
  const progressPercentage =
    totalEnemies > 0 ? ((totalEnemies - enemiesRemaining) / totalEnemies) * 100 : 0;

  // Check if level has time limit
  const timeLimit = currentLevel.failureConditions.find((fc: any) => fc.type === 'time_limit');
  const hasTimeLimit = Boolean(timeLimit);

  return (
    <View style={styles.container}>
      {/* Top HUD - Level info and score */}
      <View style={styles.topHUD}>
        <View style={styles.levelInfo}>
          <Text style={[styles.levelNumber, { color: primaryColor }]}>LEVEL {currentLevel.id}</Text>
          <Text style={[styles.levelName, { color: textColor }]}>{currentLevel.name}</Text>
        </View>

        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreLabel, { color: textColor }]}>SCORE</Text>
          <Text style={[styles.scoreValue, { color: primaryColor }]}>
            {currentScore.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progressPercentage}%`,
                backgroundColor: primaryColor,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: textColor }]}>
          {enemiesRemaining} enemies remaining
        </Text>
      </View>

      {/* Current objectives */}
      <View style={styles.objectiveContainer}>
        {currentLevel.objectives.map((objective: any, index: number) => (
          <ObjectiveItem
            key={index}
            objective={objective}
            textColor={textColor}
            primaryColor={primaryColor}
          />
        ))}
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatItem label="Accuracy" value={`${Math.round(accuracy)}%`} textColor={textColor} />

        {hasTimeLimit && timeLimit && (
          <TimeDisplay
            timeLimit={timeLimit.threshold}
            textColor={textColor}
            warningColor="#E74C3C"
          />
        )}
      </View>

      {/* Combo display */}
      {currentCombo > 1 && (
        <Animated.View
          style={[
            styles.comboContainer,
            {
              opacity: comboOpacity,
              transform: [{ scale: comboAnim }],
            },
          ]}
        >
          <Text style={[styles.comboText, { color: primaryColor }]}>{currentCombo}x COMBO!</Text>
        </Animated.View>
      )}
    </View>
  );
};

// Objective Item Component
interface ObjectiveItemProps {
  objective: any;
  textColor: string;
  primaryColor: string;
}

const ObjectiveItem: React.FC<ObjectiveItemProps> = ({ objective, textColor, primaryColor }) => {
  return (
    <View style={styles.objectiveItem}>
      <View style={[styles.objectiveIcon, { borderColor: primaryColor }]}>
        <Text style={[styles.objectiveIconText, { color: primaryColor }]}>•</Text>
      </View>
      <Text style={[styles.objectiveText, { color: textColor }]}>{objective.description}</Text>
    </View>
  );
};

// Stat Item Component
interface StatItemProps {
  label: string;
  value: string;
  textColor: string;
}

const StatItem: React.FC<StatItemProps> = ({ label, value, textColor }) => (
  <View style={styles.statItem}>
    <Text style={[styles.statLabel, { color: textColor }]}>{label}</Text>
    <Text style={[styles.statValue, { color: textColor }]}>{value}</Text>
  </View>
);

// Time Display Component
interface TimeDisplayProps {
  timeLimit: number | undefined;
  textColor: string;
  warningColor: string;
}

const TimeDisplay: React.FC<TimeDisplayProps> = ({ timeLimit, textColor, warningColor }) => {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit || 0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const isWarning = timeRemaining <= 30;

  return (
    <View style={styles.statItem}>
      <Text style={[styles.statLabel, { color: textColor }]}>Time</Text>
      <Text style={[styles.statValue, { color: isWarning ? warningColor : textColor }]}>
        {timeString}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50, // Safe area
    paddingHorizontal: 20,
    zIndex: 100,
  },
  topHUD: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  levelInfo: {
    alignItems: 'flex-start',
  },
  levelNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  levelName: {
    fontSize: 14,
    opacity: 0.8,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreLabel: {
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginBottom: 15,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    minWidth: 2,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.8,
  },
  objectiveContainer: {
    marginBottom: 15,
  },
  objectiveItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  objectiveIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  objectiveIconText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  objectiveText: {
    fontSize: 14,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  comboContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -75 }, { translateY: -20 }],
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  comboText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
