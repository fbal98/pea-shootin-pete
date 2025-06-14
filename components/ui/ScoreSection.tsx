import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Typography, Spacing, BorderRadius } from '@/constants/DesignTokens';
import { UI_PALETTE } from '@/constants/GameColors';

interface ScoreSectionProps {
  score: number;
  combo?: number;
}

export const ScoreSection: React.FC<ScoreSectionProps> = ({ score, combo = 0 }) => {
  const [displayScore, setDisplayScore] = useState(score);
  const scoreAnim = useRef(new Animated.Value(score)).current;
  const scoreScale = useRef(new Animated.Value(1)).current;
  const comboOpacity = useRef(new Animated.Value(0)).current;
  const comboScale = useRef(new Animated.Value(0.8)).current;
  const comboFlash = useRef(new Animated.Value(0)).current;
  const prevScore = useRef(score);
  const prevCombo = useRef(combo);

  useEffect(() => {
    const listener = scoreAnim.addListener(({ value }) => {
      setDisplayScore(Math.round(value));
    });

    return () => {
      scoreAnim.removeListener(listener);
    };
  }, [scoreAnim]);

  useEffect(() => {
    if (score > prevScore.current) {
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
        Animated.timing(scoreAnim, {
          toValue: score,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
       scoreAnim.setValue(score);
    }
    prevScore.current = score;
  }, [score, scoreScale, scoreAnim]);

  useEffect(() => {
    // Animate combo indicator and flash on combo increase
    if (combo > 1) {
      // Flash animation when combo increases
      if (combo > prevCombo.current) {
        Animated.sequence([
          Animated.timing(comboFlash, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(comboFlash, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }

      Animated.parallel([
        Animated.timing(comboOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(comboScale, {
          toValue: combo > prevCombo.current ? 1.2 : 1, // Extra scale on increase
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (combo > prevCombo.current) {
          // Scale back down after the initial burst
          Animated.spring(comboScale, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }).start();
        }
      });
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
    
    prevCombo.current = combo;
  }, [combo, comboOpacity, comboScale, comboFlash]);

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
        {displayScore.toLocaleString()}
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
          <Animated.Text
            style={[
              styles.comboText,
            ]}
          >
            COMBO x{combo}
          </Animated.Text>
          
          {/* Flash overlay for extra juice */}
          <Animated.View
            style={[
              styles.comboFlashOverlay,
              {
                opacity: comboFlash,
              },
            ]}
          />
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
  comboFlashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFD700',
    borderRadius: BorderRadius.medium,
    zIndex: -1,
  },
});