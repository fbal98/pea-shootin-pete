import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getColorScheme } from '@/constants/GameColors';
import { AtmosphericBackground } from '@/components/ui/AtmosphericBackground';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GameBackgroundProps {
  level: number;
  isPlaying: boolean;
}

const levelToTheme: { [key: number]: 'beach' | 'space' | 'city' | 'forest' | 'arctic' | 'volcano' | 'desert' | 'underwater' } = {
  1: 'beach',
  2: 'volcano',
  3: 'space',
  4: 'forest',
  5: 'underwater',
};


export const GameBackground: React.FC<GameBackgroundProps> = ({ level, isPlaying }) => {
  const colorScheme = getColorScheme(level);
  const theme = levelToTheme[(level - 1) % 5 + 1] || 'space';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colorScheme.backgroundGradient, colorScheme.backgroundGradient]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradient}
      />
      <AtmosphericBackground theme={theme} intensity={isPlaying ? 0.7 : 0.2} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradient: {
    flex: 1,
  },
});