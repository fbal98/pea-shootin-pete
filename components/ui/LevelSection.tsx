import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Typography, Spacing, BorderRadius } from '@/constants/DesignTokens';
import { UI_PALETTE } from '@/constants/GameColors';

interface LevelSectionProps {
  level: number;
  scoreInLevel: number;
  nextLevelScore: number;
}

export const LevelSection: React.FC<LevelSectionProps> = ({
  level,
  scoreInLevel,
  nextLevelScore,
}) => {
  const levelScale = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const prevLevel = useRef(level);

  useEffect(() => {
    // Animate level badge when level changes
    if (level !== prevLevel.current) {
      Animated.sequence([
        Animated.timing(levelScale, {
          toValue: 1.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(levelScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      prevLevel.current = level;
    }
  }, [level, levelScale]);

  useEffect(() => {
    // Animate progress bar
    const progress = Math.min(scoreInLevel / nextLevelScore, 1);
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();

    // Glow effect when near completion (>80%)
    if (progress > 0.8) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      glowAnim.setValue(0);
    }
  }, [scoreInLevel, nextLevelScore, progressAnim, glowAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.8],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.levelBadge,
          {
            transform: [{ scale: levelScale }],
          },
        ]}
      >
        <Text style={styles.levelText}>LVL {level}</Text>
      </Animated.View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressWidth,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.progressGlow,
              {
                width: progressWidth,
                opacity: glowOpacity,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {scoreInLevel}/{nextLevelScore}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    minWidth: 120,
  },
  levelBadge: {
    backgroundColor: UI_PALETTE.primary,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    borderRadius: BorderRadius.large,
    borderWidth: 2,
    borderColor: UI_PALETTE.primary_shadow,
    marginBottom: Spacing.small,
    shadowColor: UI_PALETTE.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  levelText: {
    ...Typography.caption,
    fontWeight: '700',
    color: UI_PALETTE.text_light,
    letterSpacing: 1,
    textShadowColor: UI_PALETTE.primary_shadow,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: UI_PALETTE.elevation_1,
    borderRadius: BorderRadius.small,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: UI_PALETTE.elevation_2,
    marginBottom: Spacing.micro,
  },
  progressFill: {
    position: 'absolute',
    height: '100%',
    backgroundColor: UI_PALETTE.accent,
    borderRadius: BorderRadius.small,
  },
  progressGlow: {
    position: 'absolute',
    height: '100%',
    backgroundColor: UI_PALETTE.accent,
    borderRadius: BorderRadius.small,
    shadowColor: UI_PALETTE.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
  },
  progressText: {
    ...Typography.small,
    color: UI_PALETTE.text_light,
    fontFamily: 'monospace',
    opacity: 0.9,
    textShadowColor: UI_PALETTE.shadow,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});
