import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Typography, Spacing, BorderRadius } from '@/constants/DesignTokens';
import { UI_PALETTE } from '@/constants/GameColors';

interface ScoreSectionProps {
  score: number;
  combo?: number;
}

export const ScoreSection: React.FC<ScoreSectionProps> = ({ score, combo = 0 }) => {
  const scoreScale = useRef(new Animated.Value(1)).current;
  const comboOpacity = useRef(new Animated.Value(0)).current;
  const comboScale = useRef(new Animated.Value(0.8)).current;
  const prevScore = useRef(score);

  useEffect(() => {
    // Animate score when it changes
    if (score !== prevScore.current && score > prevScore.current) {
      Animated.sequence([
        Animated.timing(scoreScale, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scoreScale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      prevScore.current = score;
    }
  }, [score, scoreScale]);

  useEffect(() => {
    // Animate combo indicator
    if (combo > 1) {
      Animated.parallel([
        Animated.timing(comboOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(comboScale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(comboOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(comboScale, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [combo, comboOpacity, comboScale]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>SCORE</Text>
      <Animated.Text
        style={[
          styles.scoreValue,
          {
            transform: [{ scale: scoreScale }],
          },
        ]}
      >
        {score.toLocaleString()}
      </Animated.Text>

      {combo > 1 && (
        <Animated.View
          style={[
            styles.comboContainer,
            {
              opacity: comboOpacity,
              transform: [{ scale: comboScale }],
            },
          ]}
        >
          <Text style={styles.comboText}>COMBO x{combo}</Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
  },
  label: {
    ...Typography.small,
    fontWeight: '600',
    color: UI_PALETTE.text_light,
    letterSpacing: 1,
    marginBottom: 2,
    textShadowColor: UI_PALETTE.shadow,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    opacity: 0.9,
  },
  scoreValue: {
    ...Typography.h2,
    fontWeight: '700',
    color: UI_PALETTE.accent,
    fontFamily: 'monospace',
    textShadowColor: UI_PALETTE.accent_shadow,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  comboContainer: {
    backgroundColor: UI_PALETTE.primary,
    paddingHorizontal: Spacing.small,
    paddingVertical: Spacing.micro,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: UI_PALETTE.primary_shadow,
    marginTop: Spacing.micro,
    shadowColor: UI_PALETTE.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  comboText: {
    ...Typography.small,
    fontWeight: '700',
    color: UI_PALETTE.text_light,
    letterSpacing: 0.5,
    textShadowColor: UI_PALETTE.primary_shadow,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
