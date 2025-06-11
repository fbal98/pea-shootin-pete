import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StatusSectionProps {
  lives: number;
  specialCharge: number; // 0-100
}

export const StatusSection: React.FC<StatusSectionProps> = ({ lives, specialCharge }) => {
  const livesScale = useRef(new Animated.Value(1)).current;
  const specialFillAnim = useRef(new Animated.Value(0)).current;
  const specialGlowAnim = useRef(new Animated.Value(0)).current;
  const prevLives = useRef(lives);

  useEffect(() => {
    // Animate lives indicator when lives change
    if (lives !== prevLives.current) {
      Animated.sequence([
        Animated.timing(livesScale, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(livesScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      
      prevLives.current = lives;
    }
  }, [lives, livesScale]);

  useEffect(() => {
    // Animate special meter fill
    Animated.timing(specialFillAnim, {
      toValue: specialCharge / 100,
      duration: 300,
      useNativeDriver: false,
    }).start();

    // Glow effect when special is ready (100%)
    if (specialCharge >= 100) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(specialGlowAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(specialGlowAnim, {
            toValue: 0.4,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      specialGlowAnim.setValue(0);
    }
  }, [specialCharge, specialFillAnim, specialGlowAnim]);

  const specialHeight = specialFillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const specialGlowOpacity = specialGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.9],
  });

  const renderHearts = () => {
    const hearts = [];
    for (let i = 0; i < 3; i++) {
      hearts.push(
        <Animated.View
          key={i}
          style={[
            styles.heartContainer,
            {
              transform: [{ scale: livesScale }],
            },
          ]}
        >
          <Ionicons
            name="heart"
            size={16}
            color={i < lives ? '#FF4444' : 'rgba(255, 68, 68, 0.3)'}
            style={[
              styles.heart,
              i < lives && styles.heartActive,
            ]}
          />
        </Animated.View>
      );
    }
    return hearts;
  };

  return (
    <View style={styles.container}>
      <View style={styles.livesContainer}>
        <Text style={styles.label}>LIVES</Text>
        <View style={styles.heartsRow}>
          {renderHearts()}
        </View>
      </View>
      
      <View style={styles.specialContainer}>
        <Text style={styles.label}>SPECIAL</Text>
        <View style={styles.specialMeter}>
          <Animated.View
            style={[
              styles.specialFill,
              {
                height: specialHeight,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.specialGlow,
              {
                height: specialHeight,
                opacity: specialGlowOpacity,
              },
            ]}
          />
          <Text style={styles.specialText}>{Math.round(specialCharge)}%</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  livesContainer: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#00FFFF',
    letterSpacing: 1,
    marginBottom: 4,
    textShadowColor: '#008B8B',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  heartsRow: {
    flexDirection: 'row',
  },
  heartContainer: {
    marginLeft: 2,
  },
  heart: {
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  heartActive: {
    shadowColor: '#FF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  specialContainer: {
    alignItems: 'flex-end',
  },
  specialMeter: {
    width: 20,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  specialFill: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#FF00FF',
    borderRadius: 8,
  },
  specialGlow: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#FF00FF',
    borderRadius: 8,
    shadowColor: '#FF00FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
  specialText: {
    fontSize: 8,
    color: '#fff',
    fontWeight: 'bold',
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -4 }],
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});