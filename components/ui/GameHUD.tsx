import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { UI_CONFIG } from '@/constants/GameConfig';
import { UI_PALETTE } from '@/constants/GameColors';
import { Typography, Spacing, BorderRadius, Layout } from '@/constants/DesignTokens';
import { ScoreSection } from './ScoreSection';
import { LevelSection } from './LevelSection';
import { StatusSection } from './StatusSection';

interface GameHUDProps {
  score: number;
  lives: number;
  level: number;
  levelProgress: number; // 0-1
  levelObjective: string;
  combo?: number;
  scoreInLevel?: number;
  nextLevelScore?: number;
  onPause: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({ 
  score, 
  lives, 
  level, 
  levelProgress, 
  levelObjective, 
  combo = 0, 
  scoreInLevel = 0, 
  nextLevelScore = 100, 
  onPause 
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.medium }]}>
      {/* Top Row: Lives, Score, Pause */}
      <View style={styles.topRow}>
        <StatusSection lives={lives} />
        <ScoreSection score={score} combo={combo} />
        <TouchableOpacity onPress={onPause} style={styles.pauseButton}>
          <Ionicons name="pause" size={24} color={UI_PALETTE.text_light} />
        </TouchableOpacity>
      </View>
      
      {/* Level Progress Row */}
      <View style={styles.levelRow}>
        <LevelSection 
          level={level} 
          scoreInLevel={scoreInLevel} 
          nextLevelScore={nextLevelScore} 
        />
      </View>
      
      {/* Objective Row */}
      <View style={styles.objectiveContainer}>
        <Text style={styles.objectiveText}>{levelObjective}</Text>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${levelProgress * 100}%` }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.medium,
    zIndex: 100,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.small,
  },
  levelRow: {
    alignItems: 'center',
    marginBottom: Spacing.small,
  },
  pauseButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.medium,
    backgroundColor: UI_PALETTE.elevation_2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: UI_PALETTE.text_light,
    opacity: 0.9,
  },
  objectiveContainer: {
    alignItems: 'center',
  },
  objectiveText: {
    ...Typography.caption,
    fontWeight: '600',
    color: UI_PALETTE.text_light,
    textShadowColor: UI_PALETTE.shadow,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginBottom: Spacing.small,
    textAlign: 'center',
  },
  progressBarBackground: {
    width: '70%',
    height: 6,
    backgroundColor: UI_PALETTE.elevation_1,
    borderRadius: BorderRadius.small,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: UI_PALETTE.elevation_2,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: UI_PALETTE.accent,
    borderRadius: BorderRadius.small,
  },
});