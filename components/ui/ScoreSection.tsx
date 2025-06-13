import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

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
    alignItems: 'flex-start',
    minWidth: 100,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#00FFFF',
    letterSpacing: 1,
    marginBottom: 2,
    textShadowColor: '#008B8B',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    fontFamily: 'monospace',
    textShadowColor: '#FFA500',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  comboContainer: {
    backgroundColor: 'rgba(255, 0, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF00FF',
    marginTop: 4,
  },
  comboText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FF00FF',
    letterSpacing: 0.5,
    textShadowColor: '#800080',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
