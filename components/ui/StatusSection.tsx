import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius } from '@/constants/DesignTokens';
import { UI_PALETTE } from '@/constants/GameColors';

interface StatusSectionProps {
  lives: number;
}

export const StatusSection: React.FC<StatusSectionProps> = ({ lives }) => {
  const livesScale = useRef(new Animated.Value(1)).current;
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
            size={20}
            color={i < lives ? UI_PALETTE.error : UI_PALETTE.text_disabled}
            style={[styles.heart, i < lives && styles.heartActive]}
          />
        </Animated.View>
      );
    }
    return hearts;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>LIVES</Text>
      <View style={styles.heartsRow}>{renderHearts()}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    minWidth: 80,
  },
  label: {
    ...Typography.small,
    fontWeight: '600',
    color: UI_PALETTE.text_light,
    letterSpacing: 1,
    marginBottom: Spacing.micro,
    textShadowColor: UI_PALETTE.shadow,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    opacity: 0.9,
  },
  heartsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heartContainer: {
    marginRight: Spacing.micro,
  },
  heart: {
    textShadowColor: UI_PALETTE.shadow,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  heartActive: {
    shadowColor: UI_PALETTE.error,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 3,
  },
});
