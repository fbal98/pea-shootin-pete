import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { MenuScreen } from '@/screens/MenuScreen';
import { GameScreen } from '@/screens/GameScreen';

export default function HomeScreen() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <View style={styles.container}>
      {isPlaying ? (
        <GameScreen />
      ) : (
        <MenuScreen onStartGame={() => setIsPlaying(true)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
