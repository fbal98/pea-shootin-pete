import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useActivePowerUp, usePowerUpDuration } from '@/store/gameStore';
import { UI_PALETTE } from '@/constants/GameColors';
import { Typography, Spacing, BorderRadius } from '@/constants/DesignTokens';

export const PowerUpHUD: React.FC = () => {
  const activePowerUp = useActivePowerUp();
  const powerUpDuration = usePowerUpDuration();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Animate in/out based on power-up state
  useEffect(() => {
    if (activePowerUp) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Start pulsing animation
      const pulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (activePowerUp) pulse(); // Continue if still active
        });
      };
      pulse();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [activePowerUp, fadeAnim, scaleAnim, pulseAnim]);
  
  if (!activePowerUp) return null;
  
  // Get power-up display info
  const getPowerUpInfo = (powerUpType: string) => {
    switch (powerUpType) {
      case 'rapid_fire':
        return { name: 'RAPID FIRE', icon: '⚡', color: '#FFD700' };
      case 'big_shot':
        return { name: 'BIG SHOT', icon: '🎯', color: '#FF6B6B' };
      case 'triple_shot':
        return { name: 'TRIPLE SHOT', icon: '🔥', color: '#4ECDC4' };
      case 'piercing_shot':
        return { name: 'PIERCING', icon: '💎', color: '#A374D5' };
      case 'explosive_shot':
        return { name: 'EXPLOSIVE', icon: '💥', color: '#FF4757' };
      case 'time_slow':
        return { name: 'TIME SLOW', icon: '⏰', color: '#74B9FF' };
      default:
        return { name: 'POWER-UP', icon: '✨', color: '#FFD700' };
    }
  };
  
  const powerUpInfo = getPowerUpInfo(activePowerUp);
  const timeRemaining = Math.ceil(powerUpDuration / 1000); // Convert to seconds
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { scale: pulseAnim },
          ],
        },
      ]}
    >
      <View style={[styles.powerUpCard, { borderColor: powerUpInfo.color }]}>
        <Text style={[styles.icon, { color: powerUpInfo.color }]}>
          {powerUpInfo.icon}
        </Text>
        <View style={styles.textContainer}>
          <Text style={[styles.powerUpName, { color: powerUpInfo.color }]}>
            {powerUpInfo.name}
          </Text>
          <Text style={styles.timeRemaining}>
            {timeRemaining}s
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 80,
    left: 16,
    zIndex: 100,
  },
  powerUpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderWidth: 2,
    borderRadius: BorderRadius.large,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  icon: {
    fontSize: 24,
    marginRight: Spacing.small,
  },
  textContainer: {
    alignItems: 'flex-start',
  },
  powerUpName: {
    ...Typography.small,
    fontWeight: '700',
    letterSpacing: 1,
    lineHeight: 16,
  },
  timeRemaining: {
    ...Typography.caption,
    color: UI_PALETTE.text_light,
    fontWeight: '600',
    opacity: 0.9,
  },
});