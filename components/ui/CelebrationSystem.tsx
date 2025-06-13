/**
 * Celebration System - Enhanced reward celebration animations
 *
 * Provides spectacular celebration effects for:
 * - Achievement unlocks with confetti and screen effects
 * - Level completion with victory animations
 * - Mystery reward collections with particle systems
 * - Combo achievements with streak effects
 * - Battle pass tier ups with progression celebrations
 *
 * Designed for maximum dopamine response and engagement.
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import { Achievement, MysteryReward, RewardRarity } from '@/types/MetaProgressionTypes';
import { getColorScheme } from '@/constants/GameColors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Confetti Particle Component
interface ConfettiParticleProps {
  x: number;
  y: number;
  color: string;
  shape: 'square' | 'circle' | 'triangle';
  size: number;
  velocity: { x: number; y: number };
  rotation: number;
  gravity: number;
  life: number;
}

const ConfettiParticle: React.FC<ConfettiParticleProps> = ({
  x,
  y,
  color,
  shape,
  size,
  velocity,
  rotation,
  gravity,
  life,
}) => {
  const positionAnim = useRef(new Animated.ValueXY({ x, y })).current;
  const rotationAnim = useRef(new Animated.Value(rotation)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Physics simulation for confetti
    const animateParticle = () => {
      const endX = x + velocity.x * (life / 1000);
      const endY = y + velocity.y * (life / 1000) + (gravity * Math.pow(life / 1000, 2)) / 2;

      Animated.parallel([
        Animated.timing(positionAnim, {
          toValue: { x: endX, y: endY },
          duration: life,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(rotationAnim, {
          toValue: rotation + 720, // 2 full rotations
          duration: life,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(life * 0.7),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: life * 0.3,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: life * 0.1,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: life * 0.9,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    };

    animateParticle();
  }, []);

  const getShapeStyle = () => {
    const baseStyle = {
      width: size,
      height: size,
      backgroundColor: color,
    };

    switch (shape) {
      case 'circle':
        return { ...baseStyle, borderRadius: size / 2 };
      case 'triangle':
        return {
          width: 0,
          height: 0,
          backgroundColor: 'transparent',
          borderStyle: 'solid' as const,
          borderLeftWidth: size / 2,
          borderRightWidth: size / 2,
          borderBottomWidth: size,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
        };
      default:
        return baseStyle;
    }
  };

  return (
    <Animated.View
      style={[
        styles.confettiParticle,
        getShapeStyle(),
        {
          opacity: opacityAnim,
          transform: [
            { translateX: positionAnim.x },
            { translateY: positionAnim.y },
            {
              rotate: rotationAnim.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg'],
              }),
            },
            { scale: scaleAnim },
          ],
        },
      ]}
    />
  );
};

// Main Confetti System
interface ConfettiSystemProps {
  isActive: boolean;
  intensity: 'low' | 'medium' | 'high' | 'spectacular';
  colors: string[];
  duration: number;
  onComplete: () => void;
}

const ConfettiSystem: React.FC<ConfettiSystemProps> = ({
  isActive,
  intensity,
  colors,
  duration,
  onComplete,
}) => {
  const [particles, setParticles] = useState<ConfettiParticleProps[]>([]);

  useEffect(() => {
    if (!isActive) return;

    const particleCount = getParticleCount(intensity);
    const newParticles: ConfettiParticleProps[] = [];

    for (let i = 0; i < particleCount; i++) {
      const life = 2000 + Math.random() * 3000; // 2-5 seconds
      newParticles.push({
        x: Math.random() * screenWidth,
        y: -50,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: ['square', 'circle', 'triangle'][Math.floor(Math.random() * 3)] as any,
        size: 4 + Math.random() * 8,
        velocity: {
          x: (Math.random() - 0.5) * 200,
          y: Math.random() * 100 + 50,
        },
        rotation: Math.random() * 360,
        gravity: 300 + Math.random() * 200,
        life,
      });
    }

    setParticles(newParticles);

    // Clean up after duration
    setTimeout(() => {
      setParticles([]);
      onComplete();
    }, duration);
  }, [isActive]);

  const getParticleCount = (intensity: string): number => {
    switch (intensity) {
      case 'spectacular':
        return 100;
      case 'high':
        return 60;
      case 'medium':
        return 30;
      case 'low':
        return 15;
      default:
        return 30;
    }
  };

  if (!isActive) return null;

  return (
    <View style={styles.confettiContainer}>
      {particles.map((particle, index) => (
        <ConfettiParticle key={index} {...particle} />
      ))}
    </View>
  );
};

// Achievement Celebration Component
interface AchievementCelebrationProps {
  achievement: Achievement;
  onComplete: () => void;
}

export const AchievementCelebration: React.FC<AchievementCelebrationProps> = ({
  achievement,
  onComplete,
}) => {
  const [showConfetti, setShowConfetti] = useState(true);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Main entrance animation
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.2,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      // Settle animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      // Bounce emphasis
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -20,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // Hold for reading
      Animated.delay(2000),
      // Exit animation
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start(onComplete);

    // Shimmer effect for rare achievements
    if (achievement.rarity === 'epic' || achievement.rarity === 'legendary') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, []);

  const getRarityColors = () => {
    switch (achievement.rarity) {
      case 'legendary':
        return ['#FFD700', '#FFA500', '#FFFF99', '#FFE4B5'];
      case 'epic':
        return ['#A374D5', '#B19CD9', '#DDD6FE', '#E6D5FF'];
      case 'rare':
        return ['#E17055', '#F39C12', '#FFE5B4', '#FFA500'];
      default:
        return ['#4ECDC4', '#7FDBDA', '#B8F2F1', '#E0F8F8'];
    }
  };

  const getRarityStyle = () => {
    const colors = getRarityColors();
    return {
      backgroundColor: colors[0] + '20',
      borderColor: colors[0],
      glowColor: colors[0],
    };
  };

  const rarityStyle = getRarityStyle();

  return (
    <View style={styles.achievementContainer}>
      {/* Confetti System */}
      <ConfettiSystem
        isActive={showConfetti}
        intensity={achievement.rarity === 'legendary' ? 'spectacular' : 'high'}
        colors={getRarityColors()}
        duration={4000}
        onComplete={() => setShowConfetti(false)}
      />

      {/* Main Achievement Display */}
      <Animated.View
        style={[
          styles.achievementCard,
          {
            backgroundColor: rarityStyle.backgroundColor,
            borderColor: rarityStyle.borderColor,
            shadowColor: rarityStyle.glowColor,
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { translateY: bounceAnim }],
          },
        ]}
      >
        {/* Shimmer overlay for epic+ achievements */}
        {(achievement.rarity === 'epic' || achievement.rarity === 'legendary') && (
          <Animated.View
            style={[
              styles.shimmerOverlay,
              {
                opacity: shimmerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.3],
                }),
              },
            ]}
          />
        )}

        {/* Achievement Icon */}
        <View style={styles.achievementIcon}>
          <Text style={styles.achievementEmoji}>{achievement.icon || '🏆'}</Text>
        </View>

        {/* Achievement Text */}
        <Text style={styles.achievementTitle}>Achievement Unlocked!</Text>
        <Text style={styles.achievementName}>{achievement.name}</Text>
        <Text style={styles.achievementDescription}>{achievement.description}</Text>

        {/* Reward Display */}
        <View style={styles.rewardContainer}>
          <Text style={styles.rewardText}>
            +{achievement.coinReward} Coins • +{achievement.scoreReward} Score
          </Text>
        </View>

        {/* Rarity Badge */}
        <View style={[styles.rarityBadge, { backgroundColor: rarityStyle.borderColor }]}>
          <Text style={styles.rarityText}>{achievement.rarity.toUpperCase()}</Text>
        </View>
      </Animated.View>
    </View>
  );
};

// Level Victory Celebration
interface LevelVictoryCelebrationProps {
  level: number;
  score: number;
  starsEarned: number;
  onComplete: () => void;
}

export const LevelVictoryCelebration: React.FC<LevelVictoryCelebrationProps> = ({
  level,
  score,
  starsEarned,
  onComplete,
}) => {
  const [showConfetti, setShowConfetti] = useState(true);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const starsAnimation = useRef(new Animated.Value(0)).current;

  const colorScheme = getColorScheme(level);

  useEffect(() => {
    // Main animation sequence
    Animated.sequence([
      // Entrance
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      // Stars animation
      Animated.timing(starsAnimation, {
        toValue: starsEarned,
        duration: 1500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      // Hold
      Animated.delay(2500),
      // Exit
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(onComplete);
  }, []);

  const renderStars = () => {
    const stars = [];
    for (let i = 0; i < 3; i++) {
      const isEarned = i < starsEarned;
      stars.push(
        <Animated.View
          key={i}
          style={[
            styles.star,
            {
              opacity: starsAnimation.interpolate({
                inputRange: [i, i + 0.5, i + 1],
                outputRange: [0.3, 0.6, isEarned ? 1 : 0.3],
                extrapolate: 'clamp',
              }),
              transform: [
                {
                  scale: starsAnimation.interpolate({
                    inputRange: [i, i + 0.5, i + 1],
                    outputRange: [0.5, 1.2, 1],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={[styles.starText, { color: isEarned ? '#FFD700' : '#DDD' }]}>⭐</Text>
        </Animated.View>
      );
    }
    return stars;
  };

  return (
    <View style={styles.victoryContainer}>
      {/* Confetti */}
      <ConfettiSystem
        isActive={showConfetti}
        intensity={starsEarned === 3 ? 'spectacular' : 'high'}
        colors={[colorScheme.primary, colorScheme.secondary, '#FFD700']}
        duration={3000}
        onComplete={() => setShowConfetti(false)}
      />

      {/* Victory Display */}
      <Animated.View
        style={[
          styles.victoryCard,
          {
            backgroundColor: colorScheme.background,
            borderColor: colorScheme.primary,
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.victoryTitle}>Level Complete!</Text>
        <Text style={styles.victoryScore}>{score.toLocaleString()}</Text>

        {/* Stars Display */}
        <View style={styles.starsContainer}>{renderStars()}</View>

        <Text style={styles.starsLabel}>{starsEarned} of 3 Stars Earned</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Confetti System
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: 1000,
  },

  confettiParticle: {
    position: 'absolute',
  },

  // Achievement Celebration
  achievementContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 999,
  },

  achievementCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 32,
    margin: 20,
    alignItems: 'center',
    borderWidth: 3,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
    maxWidth: 320,
  },

  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    borderRadius: 24,
  },

  achievementIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  achievementEmoji: {
    fontSize: 40,
  },

  achievementTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },

  achievementName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },

  achievementDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },

  rewardContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },

  rewardText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },

  rarityBadge: {
    position: 'absolute',
    top: -12,
    right: -12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'white',
  },

  rarityText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 1,
  },

  // Level Victory
  victoryContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 999,
  },

  victoryCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 32,
    margin: 20,
    alignItems: 'center',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },

  victoryTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },

  victoryScore: {
    fontSize: 48,
    fontWeight: '700',
    color: '#4ECDC4',
    marginBottom: 24,
  },

  starsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },

  star: {
    marginHorizontal: 8,
  },

  starText: {
    fontSize: 32,
  },

  starsLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },

  // Combo celebration styles
  comboContainer: {
    position: 'absolute',
    top: screenHeight * 0.3,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 998,
  },

  comboCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
    borderWidth: 2,
    borderColor: '#FFD700',
  },

  comboText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FF6B6B',
    marginBottom: 4,
  },

  comboLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },

  multiplierText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },

  // Battle pass celebration styles
  battlePassContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 999,
  },

  battlePassCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 32,
    margin: 20,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFD700',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
    maxWidth: 320,
  },

  battlePassTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },

  battlePassTier: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 8,
  },

  battlePassSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },

  rewardsPreview: {
    width: '100%',
    alignItems: 'center',
  },

  rewardsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },

  rewardItem: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },

  moreRewards: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
});

// Combo Streak Celebration
interface ComboStreakCelebrationProps {
  combo: number;
  multiplier: number;
  onComplete: () => void;
}

export const ComboStreakCelebration: React.FC<ComboStreakCelebrationProps> = ({
  combo,
  multiplier,
  onComplete,
}) => {
  const [showParticles, setShowParticles] = useState(true);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Quick celebration for combos
    Animated.sequence([
      // Fast entrance
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.3,
          tension: 200,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 360,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Settle
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 150,
        friction: 8,
        useNativeDriver: true,
      }),
      // Hold briefly
      Animated.delay(800),
      // Fast exit
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start(onComplete);
  }, []);

  const getComboIntensity = (): 'low' | 'medium' | 'high' | 'spectacular' => {
    if (combo >= 15) return 'spectacular';
    if (combo >= 10) return 'high';
    if (combo >= 5) return 'medium';
    return 'low';
  };

  const getComboColors = () => {
    if (combo >= 15) return ['#FFD700', '#FF6B6B', '#4ECDC4', '#A374D5'];
    if (combo >= 10) return ['#FF6B6B', '#FFA500', '#FFFF99'];
    if (combo >= 5) return ['#4ECDC4', '#7FDBDA', '#B8F2F1'];
    return ['#74B9FF', '#A8D1FF'];
  };

  return (
    <View style={styles.comboContainer}>
      {/* Particle explosion */}
      <ConfettiSystem
        isActive={showParticles}
        intensity={getComboIntensity()}
        colors={getComboColors()}
        duration={1500}
        onComplete={() => setShowParticles(false)}
      />

      {/* Combo display */}
      <Animated.View
        style={[
          styles.comboCard,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              {
                rotate: rotateAnim.interpolate({
                  inputRange: [0, 360],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.comboText}>{combo}x</Text>
        <Text style={styles.comboLabel}>COMBO!</Text>
        <Text style={styles.multiplierText}>+{multiplier.toFixed(1)}x Points</Text>
      </Animated.View>
    </View>
  );
};

// Battle Pass Tier Celebration
interface BattlePassCelebrationProps {
  newTier: number;
  rewards: any[];
  onComplete: () => void;
}

export const BattlePassCelebration: React.FC<BattlePassCelebrationProps> = ({
  newTier,
  rewards,
  onComplete,
}) => {
  const [showConfetti, setShowConfetti] = useState(true);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.sequence([
      // Entrance
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Hold
      Animated.delay(3000),
      // Exit
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(onComplete);
  }, []);

  return (
    <View style={styles.battlePassContainer}>
      {/* Golden confetti */}
      <ConfettiSystem
        isActive={showConfetti}
        intensity="spectacular"
        colors={['#FFD700', '#FFA500', '#FFFF99', '#FFE4B5']}
        duration={3500}
        onComplete={() => setShowConfetti(false)}
      />

      {/* Tier upgrade display */}
      <Animated.View
        style={[
          styles.battlePassCard,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.battlePassTitle}>Tier Up!</Text>
        <Text style={styles.battlePassTier}>TIER {newTier}</Text>
        <Text style={styles.battlePassSubtitle}>Battle Pass Progress</Text>

        {/* Rewards preview */}
        <View style={styles.rewardsPreview}>
          <Text style={styles.rewardsTitle}>New Rewards Unlocked:</Text>
          {rewards.slice(0, 3).map((reward, index) => (
            <Text key={index} style={styles.rewardItem}>
              • {reward.name}
            </Text>
          ))}
          {rewards.length > 3 && (
            <Text style={styles.moreRewards}>+{rewards.length - 3} more...</Text>
          )}
        </View>
      </Animated.View>
    </View>
  );
};

// Celebration Manager Component - Now a pure renderer using the centralized store
interface CelebrationManagerProps {
  children: React.ReactNode;
}

export const CelebrationManager: React.FC<CelebrationManagerProps> = ({ children }) => {
  // Import celebration store hooks
  const {
    useVictoryCelebrations,
    useAchievementCelebrations,
    useComboCelebrations,
    useMysteryRewardCelebrations,
    useBattlePassCelebrations,
    useRemoveCelebration,
  } = require('@/store/celebrationStore');

  // Get active celebrations from store
  const victoryCelebrations = useVictoryCelebrations();
  const achievementCelebrations = useAchievementCelebrations();
  const comboCelebrations = useComboCelebrations();
  const mysteryRewardCelebrations = useMysteryRewardCelebrations();
  const battlePassCelebrations = useBattlePassCelebrations();
  const removeCelebration = useRemoveCelebration();

  return (
    <>
      {children}

      {/* Render all active celebrations from store */}
      {/* Victory celebrations */}
      {victoryCelebrations.map((celebration: any) => (
        <LevelVictoryCelebration
          key={celebration.id}
          level={celebration.level}
          score={celebration.score}
          starsEarned={celebration.starsEarned}
          onComplete={() => {
            celebration.onComplete();
            removeCelebration('victory', celebration.id);
          }}
        />
      ))}

      {/* Achievement celebrations */}
      {achievementCelebrations.map((celebration: any) => (
        <AchievementCelebration
          key={celebration.id}
          achievement={celebration.achievement}
          onComplete={() => {
            celebration.onComplete();
            removeCelebration('achievement', celebration.id);
          }}
        />
      ))}

      {/* Combo celebrations */}
      {comboCelebrations.map((celebration: any) => (
        <ComboStreakCelebration
          key={celebration.id}
          combo={celebration.combo}
          multiplier={celebration.multiplier}
          onComplete={() => {
            celebration.onComplete();
            removeCelebration('combo', celebration.id);
          }}
        />
      ))}

      {/* Mystery reward celebrations */}
      {mysteryRewardCelebrations.map((celebration: any) => (
        <View key={celebration.id}>
          {/* Import and use MysteryRewardDisplay */}
          {(() => {
            const { MysteryRewardDisplay } = require('../ui/MysteryRewardDisplay');
            return (
              <MysteryRewardDisplay
                reward={celebration.reward}
                x={celebration.x}
                y={celebration.y}
                onComplete={() => {
                  celebration.onComplete();
                  removeCelebration('mysteryReward', celebration.id);
                }}
              />
            );
          })()}
        </View>
      ))}

      {/* Battle pass celebrations */}
      {battlePassCelebrations.map((celebration: any) => (
        <BattlePassCelebration
          key={celebration.id}
          newTier={celebration.newTier}
          rewards={celebration.rewards}
          onComplete={() => {
            celebration.onComplete();
            removeCelebration('battlePass', celebration.id);
          }}
        />
      ))}
    </>
  );
};

export default AchievementCelebration;
