import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Polygon, Path, LinearGradient, Defs, Stop, RadialGradient } from 'react-native-svg';

interface WorldNode {
  id: string;
  levelId: number;
  name: string;
  theme: 'beach' | 'space' | 'city' | 'forest' | 'arctic' | 'volcano' | 'desert' | 'underwater';
  position: { x: number; y: number };
  connections: string[];
  locked: boolean;
  completed: boolean;
  stars: number;
  requirements?: {
    previousNodes?: string[];
    minStars?: number;
    specialUnlock?: string;
  };
  landmark?: {
    type: 'boss' | 'challenge' | 'bonus' | 'special';
    icon: string;
    description: string;
  };
}

interface EnhancedWorldNodeProps {
  node: WorldNode;
  isSelected: boolean;
  onPress: (node: WorldNode) => void;
  scale?: Animated.Value;
}

export const EnhancedWorldNode: React.FC<EnhancedWorldNodeProps> = ({
  node,
  isSelected,
  onPress,
  scale,
}) => {
  const breathingAnimation = useRef(new Animated.Value(0)).current;
  const glowAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(0)).current;
  const starAnimation = useRef(new Animated.Value(0)).current;
  const celebrationAnimation = useRef(new Animated.Value(0)).current;
  
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    // Breathing animation for available nodes
    if (!node.locked && !node.completed) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(breathingAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(breathingAnimation, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    // Glow animation for completed nodes
    if (node.completed) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnimation, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnimation, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    // Pulse animation for selected nodes
    if (isSelected) {
      Animated.loop(
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      pulseAnimation.setValue(0);
    }

    // Star twinkling for completed nodes
    if (node.completed && node.stars > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(starAnimation, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(starAnimation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [node.locked, node.completed, isSelected, node.stars]);

  const triggerCelebration = () => {
    setShowCelebration(true);
    
    Animated.sequence([
      Animated.timing(celebrationAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(celebrationAnimation, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowCelebration(false);
    });
  };

  const handlePress = () => {
    if (node.completed && node.stars === 3) {
      triggerCelebration();
    }
    onPress(node);
  };

  const getThemeColors = () => {
    switch (node.theme) {
      case 'beach':
        return {
          primary: '#FFD93D',
          secondary: '#6BCF7F',
          accent: '#87CEEB',
          glow: 'rgba(255, 217, 61, 0.6)',
        };
      case 'space':
        return {
          primary: '#6C5CE7',
          secondary: '#A29BFE',
          accent: '#74B9FF',
          glow: 'rgba(108, 92, 231, 0.6)',
        };
      case 'city':
        return {
          primary: '#FF7675',
          secondary: '#FD79A8',
          accent: '#FDCB6E',
          glow: 'rgba(255, 118, 117, 0.6)',
        };
      case 'forest':
        return {
          primary: '#00B894',
          secondary: '#55A3FF',
          accent: '#98FB98',
          glow: 'rgba(0, 184, 148, 0.6)',
        };
      case 'arctic':
        return {
          primary: '#74B9FF',
          secondary: '#FFFFFF',
          accent: '#E1F5FE',
          glow: 'rgba(116, 185, 255, 0.6)',
        };
      case 'volcano':
        return {
          primary: '#FF6348',
          secondary: '#FF9F43',
          accent: '#FF7979',
          glow: 'rgba(255, 99, 72, 0.6)',
        };
      case 'desert':
        return {
          primary: '#FDCB6E',
          secondary: '#E17055',
          accent: '#F8C471',
          glow: 'rgba(253, 203, 110, 0.6)',
        };
      case 'underwater':
        return {
          primary: '#0984E3',
          secondary: '#6C5CE7',
          accent: '#74B9FF',
          glow: 'rgba(9, 132, 227, 0.6)',
        };
      default:
        return {
          primary: '#6C5CE7',
          secondary: '#A29BFE',
          accent: '#74B9FF',
          glow: 'rgba(108, 92, 231, 0.6)',
        };
    }
  };

  const colors = getThemeColors();
  const nodeSize = node.landmark ? 60 : 50;
  const isLandmark = !!node.landmark;

  const renderNodeBackground = () => {
    if (node.locked) {
      return (
        <Circle
          cx={nodeSize / 2}
          cy={nodeSize / 2}
          r={nodeSize / 2 - 2}
          fill="#666666"
          stroke="#444444"
          strokeWidth="2"
        />
      );
    }

    const gradientId = `nodeGradient_${node.id}`;
    
    return (
      <Svg width={nodeSize} height={nodeSize}>
        <Defs>
          <RadialGradient id={gradientId} cx="50%" cy="30%" r="70%">
            <Stop offset="0%" stopColor={colors.secondary} />
            <Stop offset="70%" stopColor={colors.primary} />
            <Stop offset="100%" stopColor={colors.accent} />
          </RadialGradient>
        </Defs>
        
        {isLandmark ? (
          <Polygon
            points={`${nodeSize/2},5 ${nodeSize-10},${nodeSize/2-5} ${nodeSize-5},${nodeSize-5} ${nodeSize/2},${nodeSize-10} 5,${nodeSize-5} 10,${nodeSize/2-5}`}
            fill={`url(#${gradientId})`}
            stroke={node.completed ? '#FFD700' : colors.accent}
            strokeWidth={isSelected ? "4" : "2"}
          />
        ) : (
          <Circle
            cx={nodeSize / 2}
            cy={nodeSize / 2}
            r={nodeSize / 2 - 2}
            fill={`url(#${gradientId})`}
            stroke={node.completed ? '#FFD700' : colors.accent}
            strokeWidth={isSelected ? "4" : "2"}
          />
        )}
      </Svg>
    );
  };

  const renderGlowEffect = () => {
    if (node.locked) return null;

    return (
      <Animated.View
        style={[
          styles.glowEffect,
          {
            width: nodeSize + 20,
            height: nodeSize + 20,
            borderRadius: isLandmark ? 0 : (nodeSize + 20) / 2,
            backgroundColor: colors.glow,
            opacity: node.completed 
              ? glowAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0.8],
                })
              : breathingAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.1, 0.4],
                }),
            transform: [
              {
                scale: node.completed
                  ? glowAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.2],
                    })
                  : breathingAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1.1],
                    }),
              },
            ],
          },
        ]}
      />
    );
  };

  const renderPulseEffect = () => {
    if (!isSelected) return null;

    return (
      <Animated.View
        style={[
          styles.pulseEffect,
          {
            width: nodeSize + 40,
            height: nodeSize + 40,
            borderRadius: isLandmark ? 0 : (nodeSize + 40) / 2,
            borderColor: colors.primary,
            opacity: pulseAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 0],
            }),
            transform: [
              {
                scale: pulseAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.5],
                }),
              },
            ],
          },
        ]}
      />
    );
  };

  const renderCelebrationEffect = () => {
    if (!showCelebration) return null;

    return (
      <View style={styles.celebrationContainer}>
        {[...Array(8)].map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.celebrationParticle,
              {
                backgroundColor: colors.primary,
                transform: [
                  {
                    translateX: celebrationAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, Math.cos(i * Math.PI / 4) * 50],
                    }),
                  },
                  {
                    translateY: celebrationAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, Math.sin(i * Math.PI / 4) * 50],
                    }),
                  },
                  {
                    scale: celebrationAnimation.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, 1, 0],
                    }),
                  },
                ],
                opacity: celebrationAnimation.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 1, 0],
                }),
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const renderStars = () => {
    if (!node.completed) return null;

    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3].map(star => (
          <Animated.View
            key={star}
            style={{
              opacity: star <= node.stars ? starAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.7, 1],
              }) : 0.3,
              transform: [
                {
                  scale: star <= node.stars ? starAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.2],
                  }) : 1,
                },
              ],
            }}
          >
            <Ionicons
              name={star <= node.stars ? 'star' : 'star-outline'}
              size={10}
              color={star <= node.stars ? '#FFD700' : '#CCCCCC'}
            />
          </Animated.View>
        ))}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.nodeContainer,
        {
          left: node.position.x - nodeSize / 2,
          top: node.position.y - nodeSize / 2,
          width: nodeSize,
          height: nodeSize,
        },
      ]}
      onPress={handlePress}
      disabled={node.locked}
      activeOpacity={0.8}
    >
      {renderGlowEffect()}
      {renderPulseEffect()}
      
      <Animated.View
        style={[
          styles.nodeContent,
          {
            transform: [
              {
                scale: scale || breathingAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.05],
                }),
              },
            ],
          },
        ]}
      >
        {renderNodeBackground()}
        
        <View style={styles.nodeInner}>
          {node.landmark ? (
            <Text style={styles.landmarkIcon}>{node.landmark.icon}</Text>
          ) : (
            <Text style={[styles.levelNumber, { color: node.locked ? '#CCCCCC' : '#333' }]}>
              {node.levelId}
            </Text>
          )}

          {node.locked && (
            <View style={styles.lockOverlay}>
              <Ionicons name="lock-closed" size={16} color="white" />
            </View>
          )}
        </View>
      </Animated.View>

      {renderStars()}
      {renderCelebrationEffect()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  nodeContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowEffect: {
    position: 'absolute',
    top: -10,
    left: -10,
  },
  pulseEffect: {
    position: 'absolute',
    top: -20,
    left: -20,
    borderWidth: 2,
  },
  nodeContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeInner: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  landmarkIcon: {
    fontSize: 28,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starsContainer: {
    position: 'absolute',
    bottom: -15,
    flexDirection: 'row',
    gap: 3,
  },
  celebrationContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationParticle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});