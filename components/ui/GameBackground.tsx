/**
 * Enhanced Game Background Component
 * Features:
 * - Procedural pattern generation using mathematical algorithms
 * - Fibonacci spiral particles
 * - Parallax layering system
 * - Dynamic atmospheric effects
 * - Perlin noise-inspired movement patterns
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getColorScheme } from '@/constants/GameColors';

// Mathematical constants
const PHI = (1 + Math.sqrt(5)) / 2; // Golden ratio
const GOLDEN_ANGLE = 137.5; // Golden angle in degrees

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
  velocity: { x: number; y: number };
  phase: number;
  layer: number;
}

interface GameBackgroundProps {
  level: number;
  isPlaying?: boolean;
  playerPosition?: { x: number; y: number };
  gameState?: {
    combo?: number;
    intensity?: number;
  };
}

// Fibonacci spiral particle generator
const generateFibonacciParticles = (
  count: number, 
  screenWidth: number, 
  screenHeight: number, 
  colorScheme: any,
  layer: number = 0
): Particle[] => {
  const particles: Particle[] = [];
  
  for (let i = 0; i < count; i++) {
    const angle = i * GOLDEN_ANGLE;
    const radius = Math.sqrt(i) * 15; // Spiral outward
    
    // Center the spiral
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;
    
    const x = centerX + radius * Math.cos(angle * Math.PI / 180);
    const y = centerY + radius * Math.sin(angle * Math.PI / 180);
    
    // Only include particles within screen bounds (with margin)
    if (x >= -50 && x <= screenWidth + 50 && y >= -50 && y <= screenHeight + 50) {
      const colors = [colorScheme.primary, colorScheme.secondary, colorScheme.accent];
      const color = colors[i % colors.length];
      
      particles.push({
        id: i + layer * 1000,
        x,
        y,
        size: 8 + (i % 5) * 3 - layer * 2, // Varied sizes, smaller for background layers
        color,
        opacity: (0.15 + (i % 3) * 0.05) * (1 - layer * 0.3), // Fade background layers
        velocity: {
          x: (Math.random() - 0.5) * 0.5 * (1 + layer * 0.5), // Faster background layers
          y: (Math.random() - 0.5) * 0.5 * (1 + layer * 0.5),
        },
        phase: i * 0.1, // For wave motion
        layer,
      });
    }
  }
  
  return particles;
};

// Simplified procedural pattern overlay
const PatternOverlay: React.FC<{
  colorScheme: any;
  screenWidth: number;
  screenHeight: number;
  intensity: number;
}> = ({ colorScheme, screenWidth, screenHeight, intensity }) => {
  const patterns = useMemo(() => {
    const result = [];
    const gridSize = 120; // Larger grid for fewer elements
    const numX = Math.ceil(screenWidth / gridSize);
    const numY = Math.ceil(screenHeight / gridSize);
    
    for (let x = 0; x < numX; x++) {
      for (let y = 0; y < numY; y++) {
        // Simplified pattern
        const value = Math.sin(x * 0.8) * Math.cos(y * 0.6);
        
        if (Math.abs(value) > 0.8) { // Higher threshold for fewer patterns
          result.push({
            id: `${x}-${y}`,
            x: x * gridSize + gridSize * 0.25,
            y: y * gridSize + gridSize * 0.25,
            size: gridSize * 0.15,
            opacity: Math.abs(value) * 0.08 * intensity,
          });
        }
      }
    }
    
    return result;
  }, [screenWidth, screenHeight, intensity]);
  
  return (
    <View style={StyleSheet.absoluteFillObject}>
      {patterns.map(pattern => (
        <View
          key={pattern.id}
          style={{
            position: 'absolute',
            left: pattern.x,
            top: pattern.y,
            width: pattern.size,
            height: pattern.size,
            backgroundColor: colorScheme.primary,
            opacity: pattern.opacity,
            borderRadius: pattern.size / 2,
          }}
        />
      ))}
    </View>
  );
};

export const GameBackground: React.FC<GameBackgroundProps> = ({ 
  level, 
  isPlaying = false,
  playerPosition = { x: 0, y: 0 },
  gameState = {}
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const colorScheme = getColorScheme(level);
  
  // Animation values
  const animationValue = useRef(new Animated.Value(0)).current;
  const parallaxAnim = useRef(new Animated.Value(0)).current;
  
  // Particle systems (3 layers for depth)
  const [particleLayers, setParticleLayers] = useState<Particle[][]>([]);
  
  // Initialize particle systems
  useEffect(() => {
    if (!isPlaying) return;
    
    const layers = [
      generateFibonacciParticles(10, screenWidth, screenHeight, colorScheme, 0), // Foreground
      generateFibonacciParticles(15, screenWidth, screenHeight, colorScheme, 1), // Midground
      generateFibonacciParticles(20, screenWidth, screenHeight, colorScheme, 2), // Background
    ];
    
    setParticleLayers(layers);
  }, [isPlaying, screenWidth, screenHeight, colorScheme, level]);
  
  // Continuous animation
  useEffect(() => {
    if (!isPlaying) return;
    
    const animate = () => {
      Animated.timing(animationValue, {
        toValue: 1,
        duration: 20000, // 20 second cycle
        useNativeDriver: true,
      }).start(() => {
        animationValue.setValue(0);
        animate();
      });
    };
    
    animate();
  }, [isPlaying, animationValue]);
  
  // Parallax effect based on player position
  useEffect(() => {
    if (!isPlaying) return;
    
    const normalizedX = (playerPosition.x / screenWidth) * 2 - 1; // -1 to 1
    const targetValue = normalizedX * 0.1; // Subtle parallax
    
    Animated.timing(parallaxAnim, {
      toValue: targetValue,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [playerPosition.x, isPlaying, screenWidth, parallaxAnim]);
  
  // Dynamic intensity based on game state
  const intensity = useMemo(() => {
    let base = 0.5;
    if (gameState.combo && gameState.combo > 5) base += 0.3;
    if (gameState.intensity) base += gameState.intensity * 0.2;
    return Math.min(1, base);
  }, [gameState]);
  
  // Enhanced gradient with more stops for complexity
  const enhancedGradient = useMemo(() => {
    const base = colorScheme.backgroundGradient;
    // Add intermediate colors for richer gradients
    return [
      base[0],
      base[0] + '88', // Semi-transparent
      base[1] + '44', // More transparent
      base[1],
    ];
  }, [colorScheme]);
  
  return (
    <View style={styles.container}>
      {/* Enhanced gradient background */}
      <LinearGradient
        colors={enhancedGradient}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        locations={[0, 0.3, 0.7, 1]}
      />
      
      {/* Procedural pattern overlay */}
      {isPlaying && (
        <PatternOverlay
          colorScheme={colorScheme}
          screenWidth={screenWidth}
          screenHeight={screenHeight}
          intensity={intensity * 0.5}
        />
      )}
      
      {/* Parallax particle layers */}
      {isPlaying && particleLayers.map((particles, layerIndex) => {
        const parallaxOffset = parallaxAnim.interpolate({
          inputRange: [-1, 1],
          outputRange: [-20 * (layerIndex + 1), 20 * (layerIndex + 1)],
        });
        
        return (
          <Animated.View
            key={`layer-${layerIndex}`}
            style={[
              styles.particleLayer,
              {
                transform: [{ translateX: parallaxOffset }],
              },
            ]}
          >
            {particles.map(particle => {
              // Simplified floating effect using transform (native driver compatible)
              const translateY = animationValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, Math.sin(particle.phase) * 20],
              });
              
              const translateX = animationValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, Math.cos(particle.phase) * 15],
              });
              
              return (
                <Animated.View
                  key={particle.id}
                  style={[
                    styles.particle,
                    {
                      left: particle.x,
                      top: particle.y,
                      width: particle.size,
                      height: particle.size,
                      backgroundColor: particle.color,
                      opacity: particle.opacity * intensity,
                      borderRadius: particle.size / 2,
                      transform: [
                        { translateX },
                        { translateY },
                      ],
                    },
                  ]}
                />
              );
            })}
          </Animated.View>
        );
      })}
      
      {/* Atmospheric overlay for depth */}
      {isPlaying && (
        <View style={styles.atmosphericOverlay}>
          <LinearGradient
            colors={[
              'transparent',
              colorScheme.backgroundGradient[0] + '10',
              'transparent',
              colorScheme.backgroundGradient[1] + '08',
              'transparent',
            ]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            locations={[0, 0.25, 0.5, 0.75, 1]}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    flex: 1,
  },
  particleLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  particle: {
    position: 'absolute',
  },
  atmosphericOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
  },
});