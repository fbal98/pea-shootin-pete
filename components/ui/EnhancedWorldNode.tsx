import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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
}) => {
  const pressAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!node.locked && !node.completed) {
      // Add a subtle pulse for available levels to draw attention
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [node.locked, node.completed, pulseAnim]);

  const handlePressIn = () => {
    Animated.spring(pressAnim, { toValue: 0.95, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(pressAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  const nodeSize = node.landmark ? 88 : 72;
  const isAvailable = !node.locked && !node.completed;
  const nodeStyles = [
    styles.nodeContainer,
    {
      width: nodeSize,
      height: nodeSize,
      left: node.position.x - nodeSize / 2,
      top: node.position.y - nodeSize / 2,
    },
  ];

  return (
    <Animated.View style={[nodeStyles, { transform: [{ scale: pressAnim }, { scale: pulseAnim }] }]}>
      <TouchableOpacity
        onPress={() => onPress(node)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={node.locked}
        activeOpacity={0.9}
        style={styles.touchable}
      >
        <View style={styles.nodeShadow} />
        <LinearGradient
          colors={
            node.locked
              ? ['#B0B0B0', '#888888']
              : isAvailable
              ? ['#60D47A', '#4CAF50']
              : ['#FFD700', '#FFA500']
          }
          style={[styles.node, { borderRadius: nodeSize / 2 }]}
        >
          {node.locked ? (
            <Ionicons name="lock-closed" size={32} color="rgba(255,255,255,0.7)" />
          ) : (
            <Text style={styles.levelNumber}>{node.levelId}</Text>
          )}
        </LinearGradient>

        {node.completed && (
          <View style={styles.starsContainer}>
            {[1, 2, 3].map(i => (
              <Ionicons
                key={i}
                name="star"
                size={14}
                color={i <= node.stars ? '#FFD700' : '#FFFFFF30'}
                style={styles.starIcon}
              />
            ))}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  nodeContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchable: {
    width: '100%',
    height: '100%',
  },
  nodeShadow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#00000040',
    borderRadius: 50,
    transform: [{ translateY: 4 }],
  },
  node: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  levelNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
  starsContainer: {
    position: 'absolute',
    bottom: -8,
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  starIcon: {
    marginHorizontal: 1,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});