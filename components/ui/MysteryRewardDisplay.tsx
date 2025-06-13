/**
 * Mystery Reward Display - Celebration animations for mystery balloon rewards
 * 
 * Shows immediate visual feedback when mystery balloons are popped:
 * - Reward type and value with rarity-based styling
 * - Particle effects and animations
 * - Sound and haptic feedback integration points
 * - Smooth transitions and celebrations
 * 
 * Designed to maximize dopamine response and reward satisfaction.
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { MysteryReward, RewardRarity } from '@/types/MetaProgressionTypes';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ParticleProps {
  x: number;
  y: number;
  color: string;
  size: number;
  velocity: { x: number; y: number };
  life: number;
}

const Particle: React.FC<ParticleProps> = ({ x, y, color, size, velocity, life }) => {
  const positionAnim = useRef(new Animated.ValueXY({ x, y })).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Particle movement and fade animation
    Animated.parallel([
      Animated.timing(positionAnim, {
        toValue: {
          x: x + velocity.x * life,
          y: y + velocity.y * life
        },
        duration: life,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: life,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.5,
          duration: life * 0.3,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: life * 0.7,
          useNativeDriver: true,
        })
      ])
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: size / 2,
          opacity: opacityAnim,
          transform: [
            { translateX: positionAnim.x },
            { translateY: positionAnim.y },
            { scale: scaleAnim }
          ]
        }
      ]}
    />
  );
};

interface ParticleSystemProps {
  x: number;
  y: number;
  rarity: RewardRarity;
  onComplete: () => void;
}

const ParticleSystem: React.FC<ParticleSystemProps> = ({ x, y, rarity, onComplete }) => {
  const [particles, setParticles] = useState<ParticleProps[]>([]);

  useEffect(() => {
    const particleCount = getParticleCount(rarity);
    const colors = getParticleColors(rarity);
    
    const newParticles: ParticleProps[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 50 + Math.random() * 100;
      const life = 1000 + Math.random() * 1000;
      
      newParticles.push({
        x,
        y,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 8,
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed - 30 // Slight upward bias
        },
        life
      });
    }
    
    setParticles(newParticles);
    
    // Clean up after longest particle life
    setTimeout(onComplete, 2000);
  }, []);

  return (
    <View style={styles.particleContainer}>
      {particles.map((particle, index) => (
        <Particle key={index} {...particle} />
      ))}
    </View>
  );
};

const getParticleCount = (rarity: RewardRarity): number => {
  switch (rarity) {
    case 'legendary': return 20;
    case 'epic': return 15;
    case 'rare': return 10;
    case 'uncommon': return 6;
    default: return 4;
  }
};

const getParticleColors = (rarity: RewardRarity): string[] => {
  switch (rarity) {
    case 'legendary':
      return ['#FFD700', '#FFA500', '#FFFF99', '#FFE4B5'];
    case 'epic':
      return ['#A374D5', '#B19CD9', '#DDD6FE', '#E6D5FF'];
    case 'rare':
      return ['#E17055', '#F39C12', '#FFE5B4', '#FFA500'];
    case 'uncommon':
      return ['#4ECDC4', '#7FDBDA', '#B8F2F1', '#E0F8F8'];
    default:
      return ['#74B9FF', '#A8D1FF', '#E1F0FF', '#B3D9FF'];
  }
};

interface MysteryRewardDisplayProps {
  reward: MysteryReward;
  x: number;
  y: number;
  onComplete: () => void;
}

export const MysteryRewardDisplay: React.FC<MysteryRewardDisplayProps> = ({
  reward,
  x,
  y,
  onComplete
}) => {
  const [showParticles, setShowParticles] = useState(true);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.2,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]),
      // Settle to normal size
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 150,
        friction: 10,
        useNativeDriver: true,
      }),
      // Bounce effect for emphasis
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -10,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]),
      // Hold for readability
      Animated.delay(1000),
      // Exit animation
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ])
    ]).start(onComplete);
  }, []);

  const getRarityStyle = (rarity: RewardRarity) => {
    switch (rarity) {
      case 'legendary':
        return {
          backgroundColor: 'rgba(255, 215, 0, 0.95)',
          borderColor: '#FFD700',
          textColor: '#B8860B'
        };
      case 'epic':
        return {
          backgroundColor: 'rgba(163, 116, 213, 0.95)',
          borderColor: '#A374D5',
          textColor: '#FFFFFF'
        };
      case 'rare':
        return {
          backgroundColor: 'rgba(225, 112, 85, 0.95)',
          borderColor: '#E17055',
          textColor: '#FFFFFF'
        };
      case 'uncommon':
        return {
          backgroundColor: 'rgba(78, 205, 196, 0.95)',
          borderColor: '#4ECDC4',
          textColor: '#FFFFFF'
        };
      default:
        return {
          backgroundColor: 'rgba(116, 185, 255, 0.95)',
          borderColor: '#74B9FF',
          textColor: '#FFFFFF'
        };
    }
  };

  const formatRewardText = () => {
    const value = reward.value;
    
    switch (reward.type) {
      case 'coins':
        return `+${value} Coins`;
      case 'experience':
        return `+${value} XP`;
      case 'score_multiplier':
        return `${value}x Score Boost!`;
      case 'customization':
        return 'New Cosmetic!';
      case 'mystery_box':
        return 'Mystery Box!';
      default:
        return 'Bonus Reward!';
    }
  };

  const rarityStyle = getRarityStyle(reward.rarity);

  return (
    <View style={styles.container}>
      {/* Particle effects */}
      {showParticles && (
        <ParticleSystem
          x={x}
          y={y}
          rarity={reward.rarity}
          onComplete={() => setShowParticles(false)}
        />
      )}
      
      {/* Main reward display */}
      <Animated.View
        style={[
          styles.rewardContainer,
          {
            left: x - 100, // Center on tap point
            top: y - 40,
            backgroundColor: rarityStyle.backgroundColor,
            borderColor: rarityStyle.borderColor,
            opacity: opacityAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: bounceAnim }
            ]
          }
        ]}
      >
        {/* Rarity indicator */}
        <View style={[styles.rarityBadge, { backgroundColor: rarityStyle.borderColor }]}>
          <Text style={styles.rarityText}>
            {reward.rarity.toUpperCase()}
          </Text>
        </View>
        
        {/* Reward text */}
        <Text style={[styles.rewardText, { color: rarityStyle.textColor }]}>
          {formatRewardText()}
        </Text>
        
        {/* Reward type icon area - could add icons here */}
        <View style={styles.iconPlaceholder}>
          <Text style={[styles.iconText, { color: rarityStyle.textColor }]}>
            {getRewardIcon(reward.type)}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

const getRewardIcon = (type: string): string => {
  switch (type) {
    case 'coins': return '💰';
    case 'experience': return '⭐';
    case 'score_multiplier': return '🚀';
    case 'customization': return '🎨';
    case 'mystery_box': return '📦';
    default: return '🎁';
  }
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  
  particleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  particle: {
    position: 'absolute',
  },
  
  rewardContainer: {
    position: 'absolute',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    alignItems: 'center',
    minWidth: 200,
  },
  
  rarityBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  
  rarityText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 1,
  },
  
  rewardText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  
  iconPlaceholder: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  iconText: {
    fontSize: 20,
  },
});

export default MysteryRewardDisplay;