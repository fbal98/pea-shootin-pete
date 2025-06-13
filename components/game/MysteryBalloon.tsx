/**
 * Mystery Balloon Component - Visual representation of mystery rewards
 *
 * Displays special mystery balloons with shimmering effects and distinct appearance.
 * Integrates with MysteryBalloonManager for reward functionality.
 * Designed to trigger psychological excitement and anticipation.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { getColorScheme } from '@/constants/GameColors';
import { ENTITY_CONFIG } from '@/constants/GameConfig';
import { MysteryBalloonInstance } from '@/systems/MysteryBalloonManager';
import { MysteryReward } from '@/types/MetaProgressionTypes';

interface MysteryBalloonProps {
  x: number;
  y: number;
  size: number;
  level: number;
  mysteryBalloon: MysteryBalloonInstance;
  onPopped?: (balloonId: string, reward: MysteryReward) => void;
}

export const MysteryBalloon: React.FC<MysteryBalloonProps> = ({
  x,
  y,
  size,
  level,
  mysteryBalloon,
  onPopped,
}) => {
  const colorScheme = getColorScheme(level);

  // Animation values for shimmering effect
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Start animations when component mounts
  useEffect(() => {
    // Entrance animation - scale up with bounce
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 120,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Continuous shimmer effect
    const shimmerLoop = Animated.loop(
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
    );
    shimmerLoop.start();

    // Continuous glow effect
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );
    glowLoop.start();

    return () => {
      shimmerLoop.stop();
      glowLoop.stop();
    };
  }, []);

  // Get mystery balloon colors based on reward rarity
  const getMysteryColors = () => {
    const rarity = mysteryBalloon.reward.rarity;

    switch (rarity) {
      case 'legendary':
        return {
          primary: '#FFD700', // Gold
          secondary: '#FFA500', // Orange gold
          shimmer: '#FFFF99', // Light yellow
          glow: '#FFD700',
        };
      case 'epic':
        return {
          primary: '#A374D5', // Purple
          secondary: '#B19CD9', // Light purple
          shimmer: '#DDD6FE', // Very light purple
          glow: '#A374D5',
        };
      case 'rare':
        return {
          primary: '#E17055', // Orange-red
          secondary: '#F39C12', // Orange
          shimmer: '#FFE5B4', // Light orange
          glow: '#E17055',
        };
      case 'uncommon':
        return {
          primary: '#4ECDC4', // Teal
          secondary: '#7FDBDA', // Light teal
          shimmer: '#B8F2F1', // Very light teal
          glow: '#4ECDC4',
        };
      default: // common
        return {
          primary: '#74B9FF', // Blue
          secondary: '#A8D1FF', // Light blue
          shimmer: '#E1F0FF', // Very light blue
          glow: '#74B9FF',
        };
    }
  };

  const colors = getMysteryColors();

  // Dynamic shimmer effect color
  const shimmerColor = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [colors.primary, colors.shimmer, colors.primary],
  });

  // Dynamic glow intensity
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  // Handle mystery balloon being "popped" (touched)
  const handlePopped = () => {
    if (onPopped && !mysteryBalloon.isPopped) {
      onPopped(mysteryBalloon.id, mysteryBalloon.reward);
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          left: x,
          top: y,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Outer glow effect */}
      <Animated.View
        style={[
          styles.glow,
          {
            width: size * 1.4,
            height: size * 1.4,
            borderRadius: (size * 1.4) / 2,
            backgroundColor: colors.glow,
            opacity: glowOpacity,
          },
        ]}
      />

      {/* Main balloon body */}
      <Animated.View
        style={[
          styles.balloon,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: shimmerColor,
            shadowColor: colors.glow,
          },
        ]}
        // Make it touchable for popping
        onTouchEnd={handlePopped}
      >
        {/* Inner sparkle effect */}
        <View style={[styles.innerSparkle, { borderRadius: size / 2 }]}>
          <Animated.View
            style={[
              styles.sparkle,
              {
                backgroundColor: colors.shimmer,
                opacity: shimmerAnim,
              },
            ]}
          />
        </View>

        {/* Highlight to give 3D effect */}
        <View
          style={[
            styles.highlight,
            {
              width: size * 0.3,
              height: size * 0.3,
              borderRadius: (size * 0.3) / 2,
              top: size * 0.15,
              left: size * 0.25,
            },
          ]}
        />

        {/* Rarity indicator (small dot) */}
        <View
          style={[
            styles.rarityIndicator,
            {
              backgroundColor: colors.shimmer,
              width: size * 0.15,
              height: size * 0.15,
              borderRadius: (size * 0.15) / 2,
              bottom: size * 0.1,
              right: size * 0.1,
            },
          ]}
        />
      </Animated.View>

      {/* Floating particles for epic+ rewards */}
      {(mysteryBalloon.reward.rarity === 'epic' ||
        mysteryBalloon.reward.rarity === 'legendary') && (
        <>
          <Animated.View
            style={[
              styles.floatingParticle,
              {
                top: -size * 0.2,
                left: size * 0.1,
                opacity: shimmerAnim,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.floatingParticle,
              {
                top: -size * 0.1,
                right: size * 0.15,
                opacity: glowAnim,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.floatingParticle,
              {
                bottom: -size * 0.15,
                left: size * 0.3,
                opacity: shimmerAnim,
              },
            ]}
          />
        </>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },

  glow: {
    position: 'absolute',
    zIndex: 0,
  },

  balloon: {
    position: 'relative',
    zIndex: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  innerSparkle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },

  sparkle: {
    position: 'absolute',
    top: '10%',
    left: '10%',
    right: '10%',
    bottom: '10%',
    borderRadius: 999,
  },

  highlight: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },

  rarityIndicator: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },

  floatingParticle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
});

export default MysteryBalloon;
