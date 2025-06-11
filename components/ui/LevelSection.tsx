import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface LevelSectionProps {
  level: number;
  scoreInLevel: number;
  nextLevelScore: number;
}

export const LevelSection: React.FC<LevelSectionProps> = ({ 
  level, 
  scoreInLevel, 
  nextLevelScore 
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
    flex: 1,
    maxWidth: 140,
  },
  levelBadge: {
    backgroundColor: 'rgba(0, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#00FFFF',
    marginBottom: 8,
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  levelText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00FFFF',
    letterSpacing: 1,
    textShadowColor: '#008B8B',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 4,
  },
  progressFill: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#00FFFF',
    borderRadius: 4,
  },
  progressGlow: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#00FFFF',
    borderRadius: 4,
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
  progressText: {
    fontSize: 10,
    color: '#fff',
    fontFamily: 'monospace',
    opacity: 0.8,
  },
});