import React from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MenuScreenProps {
  onStartGame: () => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({ onStartGame }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pea Shootin&apos; Pete</Text>
      <Text style={styles.subtitle}>Defend against the invaders!</Text>
      
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>How to Play:</Text>
        <Text style={styles.instructionText}>• Touch to shoot peas</Text>
        <Text style={styles.instructionText}>• Drag to move Pete</Text>
        <Text style={styles.instructionText}>• Don&apos;t let enemies reach the bottom!</Text>
      </View>

      <TouchableOpacity style={styles.playButton} onPress={onStartGame}>
        <Text style={styles.playButtonText}>Play Game</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 40,
  },
  instructions: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 10,
    marginBottom: 40,
    width: SCREEN_WIDTH * 0.8,
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 5,
  },
  playButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 50,
    paddingVertical: 20,
    borderRadius: 30,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});