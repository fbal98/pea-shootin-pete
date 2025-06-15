/**
 * Procedural Game Background - Ultra-Advanced Environmental System
 * Features: Mathematical pattern generation, fractal backgrounds, dynamic theming,
 * procedural shape generation, advanced parallax effects, and contextual atmosphere
 */

import React, { useMemo, useRef, useEffect } from 'react';
import { View, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getColorScheme } from '@/constants/GameColors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ProceduralGameBackgroundProps {
  level: number;
  isPlaying?: boolean;
  gameIntensity?: number; // 0-1, affects visual complexity
  playerPosition?: { x: number; y: number };
  enemyCount?: number;
  gameState?: 'menu' | 'playing' | 'paused' | 'victory' | 'defeat';
  timeOfDay?: 'dawn' | 'day' | 'dusk' | 'night';
}

export const ProceduralGameBackground: React.FC<ProceduralGameBackgroundProps> = ({
  level,
  isPlaying = false,
  gameIntensity = 0,
  playerPosition = { x: screenWidth / 2, y: screenHeight / 2 },
  enemyCount: _enemyCount = 0,
  gameState = 'playing',
  timeOfDay = 'day',
}) => {
  // Animation controllers
  const parallaxAnim = useRef(new Animated.Value(0)).current;
  const intensityAnim = useRef(new Animated.Value(0)).current;
  const atmosphereAnim = useRef(new Animated.Value(0)).current;
  const patternAnim = useRef(new Animated.Value(0)).current;

  const colorScheme = getColorScheme(level);

  // Initialize animations
  useEffect(() => {
    // Continuous parallax scrolling
    if (isPlaying) {
      Animated.loop(
        Animated.timing(parallaxAnim, {
          toValue: 1,
          duration: 30000, // 30 second cycle
          useNativeDriver: false,
        })
      ).start();
    }

    // Intensity-based effects
    Animated.timing(intensityAnim, {
      toValue: gameIntensity,
      duration: 2000,
      useNativeDriver: false,
    }).start();

    // Atmospheric breathing effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(atmosphereAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: false,
        }),
        Animated.timing(atmosphereAnim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Pattern rotation/morphing
    Animated.loop(
      Animated.timing(patternAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: false,
      })
    ).start();
  }, [isPlaying, gameIntensity]);

  // Generate mathematical patterns based on level
  const generateMathematicalPatterns = useMemo(() => {
    const patterns = [];
    const complexity = Math.min(level, 10);
    
    // Fibonacci spiral background
    if (level >= 3) {
      const fibSequence = [1, 1, 2, 3, 5, 8, 13, 21, 34];
      const spiralPoints = Math.min(complexity * 8, 50);
      
      for (let i = 0; i < spiralPoints; i++) {
        const angle = i * 0.618034 * 2 * Math.PI; // Golden ratio
        const radius = Math.sqrt(i) * 15;
        const size = fibSequence[i % fibSequence.length] * 2;
        
        patterns.push({
          type: 'fibonacci',
          x: screenWidth / 2 + Math.cos(angle) * radius,
          y: screenHeight / 2 + Math.sin(angle) * radius,
          size,
          opacity: 0.1 + (level % 5) * 0.02,
          color: colorScheme.primary,
          index: i,
        });
      }
    }

    // Fractal tree branches
    if (level >= 5) {
      const generateBranch = (x: number, y: number, angle: number, length: number, depth: number) => {
        if (depth <= 0 || length < 5) return;
        
        const endX = x + Math.cos(angle) * length;
        const endY = y + Math.sin(angle) * length;
        
        patterns.push({
          type: 'branch',
          x1: x,
          y1: y,
          x2: endX,
          y2: endY,
          width: depth,
          opacity: depth * 0.08,
          color: colorScheme.secondary,
          index: patterns.length,
        });
        
        // Recursive branches
        if (depth > 1) {
          generateBranch(endX, endY, angle - 0.5, length * 0.7, depth - 1);
          generateBranch(endX, endY, angle + 0.5, length * 0.7, depth - 1);
        }
      };
      
      // Multiple tree starting points
      const treeCount = Math.min(complexity / 2, 4);
      for (let t = 0; t < treeCount; t++) {
        const startX = (screenWidth / (treeCount + 1)) * (t + 1);
        const startY = screenHeight * 0.8;
        generateBranch(startX, startY, -Math.PI / 2, 60, 5);
      }
    }

    // Geometric tessellation
    if (level >= 7) {
      const hexSize = 40;
      const rows = Math.ceil(screenHeight / (hexSize * 0.866)) + 1;
      const cols = Math.ceil(screenWidth / (hexSize * 1.5)) + 1;
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * hexSize * 1.5;
          const y = row * hexSize * 0.866 + (col % 2) * hexSize * 0.433;
          
          if (Math.random() > 0.7) { // Sparse distribution
            patterns.push({
              type: 'hexagon',
              x,
              y,
              size: hexSize * (0.3 + Math.random() * 0.4),
              opacity: 0.05 + Math.random() * 0.1,
              color: colorScheme.primary,
              rotation: Math.random() * 360,
              index: patterns.length,
            });
          }
        }
      }
    }

    // Mandelbrot-inspired dots
    if (level >= 10) {
      const iterations = 50;
      const dotCount = 100;
      
      for (let i = 0; i < dotCount; i++) {
        const x = (Math.random() - 0.5) * 4;
        const y = (Math.random() - 0.5) * 4;
        
        let zx = 0, zy = 0;
        let iter = 0;
        
        while (zx * zx + zy * zy < 4 && iter < iterations) {
          const temp = zx * zx - zy * zy + x;
          zy = 2 * zx * zy + y;
          zx = temp;
          iter++;
        }
        
        if (iter < iterations) {
          const screenX = ((x + 2) / 4) * screenWidth;
          const screenY = ((y + 2) / 4) * screenHeight;
          const intensity = iter / iterations;
          
          patterns.push({
            type: 'mandelbrot',
            x: screenX,
            y: screenY,
            size: 3 + intensity * 5,
            opacity: intensity * 0.3,
            color: `hsl(${intensity * 360}, 70%, 60%)`,
            index: patterns.length,
          });
        }
      }
    }

    return patterns;
  }, [level, colorScheme]);

  // Generate dynamic gradient based on game state and intensity
  const getDynamicGradient = useMemo(() => {
    const baseColors = colorScheme.backgroundGradient;
    const intensityFactor = gameIntensity;
    
    // Modify colors based on game state
    let stateModifier = { r: 0, g: 0, b: 0 };
    switch (gameState) {
      case 'victory':
        stateModifier = { r: 20, g: 40, b: 20 }; // Green tint
        break;
      case 'defeat':
        stateModifier = { r: 40, g: 0, b: 0 }; // Red tint
        break;
      case 'paused':
        stateModifier = { r: -20, g: -20, b: 0 }; // Desaturated
        break;
    }
    
    // Time of day modulation
    let timeModifier = { r: 0, g: 0, b: 0 };
    switch (timeOfDay) {
      case 'dawn':
        timeModifier = { r: 40, g: 20, b: -10 };
        break;
      case 'dusk':
        timeModifier = { r: 30, g: -10, b: -20 };
        break;
      case 'night':
        timeModifier = { r: -30, g: -30, b: 20 };
        break;
    }
    
    // Apply intensity and state modulations
    const modifiedColors = baseColors.map(color => {
      // Parse hex color
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      
      // Apply modulations
      const newR = Math.max(0, Math.min(255, r + stateModifier.r + timeModifier.r + intensityFactor * 30));
      const newG = Math.max(0, Math.min(255, g + stateModifier.g + timeModifier.g + intensityFactor * 20));
      const newB = Math.max(0, Math.min(255, b + stateModifier.b + timeModifier.b + intensityFactor * 40));
      
      return `rgb(${Math.floor(newR)}, ${Math.floor(newG)}, ${Math.floor(newB)})`;
    });
    
    // Add intensity-based gradient stops
    if (intensityFactor > 0.5) {
      const midColor = `rgba(${parseInt(colorScheme.primary.slice(1, 3), 16)}, ${parseInt(colorScheme.primary.slice(3, 5), 16)}, ${parseInt(colorScheme.primary.slice(5, 7), 16)}, ${intensityFactor * 0.2})`;
      return [modifiedColors[0], midColor, modifiedColors[1]];
    }
    
    return modifiedColors;
  }, [colorScheme, gameState, gameIntensity, timeOfDay]);

  // Generate parallax layers
  const generateParallaxLayers = useMemo(() => {
    const layers = [];
    const layerCount = Math.min(level + 2, 6);
    
    for (let layer = 0; layer < layerCount; layer++) {
      const depth = (layer + 1) / layerCount; // 0.16 to 1.0
      const speed = 1 - depth; // Closer layers move faster
      const elementCount = Math.floor((level + layer) / 2);
      const elements = [];
      
      for (let i = 0; i < elementCount; i++) {
        elements.push({
          x: Math.random() * screenWidth * 1.5, // Extend beyond screen
          y: Math.random() * screenHeight,
          size: 20 + Math.random() * 40 * depth,
          opacity: (0.1 + Math.random() * 0.2) * depth,
          type: Math.random() > 0.5 ? 'circle' : 'square',
          color: layer % 2 === 0 ? colorScheme.primary : colorScheme.secondary,
        });
      }
      
      layers.push({
        depth,
        speed,
        elements,
        index: layer,
      });
    }
    
    return layers;
  }, [level, colorScheme]);

  // Particle field based on player position
  const generateProximityField = useMemo(() => {
    const particles = [];
    const particleCount = Math.floor(gameIntensity * 20);
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * 2 * Math.PI;
      const distance = 100 + Math.random() * 150;
      const x = playerPosition.x + Math.cos(angle) * distance;
      const y = playerPosition.y + Math.sin(angle) * distance;
      
      // Only include particles that are on screen
      if (x >= 0 && x <= screenWidth && y >= 0 && y <= screenHeight) {
        particles.push({
          x,
          y,
          size: 2 + Math.random() * 4,
          opacity: 0.3 + Math.random() * 0.4,
          color: colorScheme.particle,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }
    
    return particles;
  }, [playerPosition, gameIntensity, colorScheme]);

  // Render pattern element
  const renderPattern = (pattern: any) => {
    const key = `pattern-${pattern.index}`;
    
    switch (pattern.type) {
      case 'fibonacci':
        return (
          <Animated.View
            key={key}
            style={{
              position: 'absolute',
              left: pattern.x - pattern.size / 2,
              top: pattern.y - pattern.size / 2,
              width: pattern.size,
              height: pattern.size,
              borderRadius: pattern.size / 2,
              backgroundColor: pattern.color,
              opacity: pattern.opacity,
              transform: [
                {
                  rotate: patternAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
                {
                  scale: atmosphereAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.2],
                  }),
                },
              ],
            }}
          />
        );
        
      case 'branch':
        const length = Math.sqrt((pattern.x2 - pattern.x1) ** 2 + (pattern.y2 - pattern.y1) ** 2);
        const angle = Math.atan2(pattern.y2 - pattern.y1, pattern.x2 - pattern.x1);
        
        return (
          <View
            key={key}
            style={{
              position: 'absolute',
              left: pattern.x1,
              top: pattern.y1 - pattern.width / 2,
              width: length,
              height: pattern.width,
              backgroundColor: pattern.color,
              opacity: pattern.opacity,
              transformOrigin: 'left center',
              transform: [{ rotate: `${angle}rad` }],
            }}
          />
        );
        
      case 'hexagon':
        return (
          <Animated.View
            key={key}
            style={{
              position: 'absolute',
              left: pattern.x - pattern.size / 2,
              top: pattern.y - pattern.size / 2,
              width: pattern.size,
              height: pattern.size,
              backgroundColor: pattern.color,
              opacity: pattern.opacity,
              transform: [
                { rotate: `${pattern.rotation}deg` },
                {
                  scale: intensityAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.2],
                  }),
                },
              ],
            }}
          >
            {/* Hexagon shape approximation using CSS */}
            <View
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: pattern.color,
                transform: [{ rotate: '30deg' }],
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: pattern.color,
                transform: [{ rotate: '-30deg' }],
              }}
            />
          </Animated.View>
        );
        
      case 'mandelbrot':
        return (
          <Animated.View
            key={key}
            style={{
              position: 'absolute',
              left: pattern.x - pattern.size / 2,
              top: pattern.y - pattern.size / 2,
              width: pattern.size,
              height: pattern.size,
              borderRadius: pattern.size / 2,
              backgroundColor: pattern.color,
              opacity: pattern.opacity,
              transform: [
                {
                  scale: patternAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.5, 1.5, 0.5],
                  }),
                },
              ],
            }}
          />
        );
        
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1, position: 'absolute', width: '100%', height: '100%' }}>
      {/* Dynamic gradient background */}
      <LinearGradient
        colors={getDynamicGradient}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Parallax layers */}
      {generateParallaxLayers.map(layer => (
        <Animated.View
          key={`layer-${layer.index}`}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            transform: [
              {
                translateX: parallaxAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -screenWidth * layer.speed * 0.5],
                }),
              },
            ],
          }}
        >
          {layer.elements.map((element, elemIndex) => (
            <View
              key={`element-${layer.index}-${elemIndex}`}
              style={{
                position: 'absolute',
                left: element.x,
                top: element.y,
                width: element.size,
                height: element.size,
                backgroundColor: element.color,
                opacity: element.opacity,
                borderRadius: element.type === 'circle' ? element.size / 2 : element.size * 0.1,
              }}
            />
          ))}
        </Animated.View>
      ))}
      
      {/* Mathematical patterns */}
      <View style={{ position: 'absolute', width: '100%', height: '100%' }}>
        {generateMathematicalPatterns.map(renderPattern)}
      </View>
      
      {/* Proximity field particles */}
      <View style={{ position: 'absolute', width: '100%', height: '100%' }}>
        {generateProximityField.map((particle, index) => (
          <Animated.View
            key={`proximity-${index}`}
            style={{
              position: 'absolute',
              left: particle.x - particle.size / 2,
              top: particle.y - particle.size / 2,
              width: particle.size,
              height: particle.size,
              borderRadius: particle.size / 2,
              backgroundColor: particle.color,
              opacity: atmosphereAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [particle.opacity * 0.5, particle.opacity],
              }),
              transform: [
                {
                  scale: atmosphereAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.2],
                  }),
                },
              ],
            }}
          />
        ))}
      </View>
      
      {/* Intensity overlay */}
      <Animated.View
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundColor: colorScheme.primary,
          opacity: intensityAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.1],
          }),
          pointerEvents: 'none',
        }}
      />
    </View>
  );
};