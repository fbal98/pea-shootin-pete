import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ScoreSection } from './ScoreSection';
import { LevelSection } from './LevelSection';
import { StatusSection } from './StatusSection';

interface GameHeaderProps {
  score: number;
  level: number;
  lives: number;
  combo?: number;
  specialCharge?: number;
  scoreInLevel?: number;
  nextLevelScore?: number;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  score,
  level,
  lives,
  combo = 0,
  specialCharge = 0,
  scoreInLevel = 0,
  nextLevelScore = 100,
}) => {
  return (
    <View style={styles.container}>
      {/* Left side - Score */}
      <ScoreSection score={score} combo={combo} />
      
      {/* Center - Level Progress */}
      <LevelSection 
        level={level} 
        scoreInLevel={scoreInLevel} 
        nextLevelScore={nextLevelScore} 
      />
      
      {/* Right side - Lives/Special */}
      <StatusSection lives={lives} specialCharge={specialCharge} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});