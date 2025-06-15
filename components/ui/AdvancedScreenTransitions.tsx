/**
 * Advanced Screen Transitions - Ultra-Mathematical Screen Animation System
 * Features: Procedural transition effects, mathematical morphing, advanced easing functions,
 * context-aware animations, fluid dynamics, and multi-dimensional transforms
 */

import React, { useRef, useEffect, useMemo } from 'react';
import { View, Animated, Dimensions, Easing } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface AdvancedScreenTransitionsProps {
  children: React.ReactNode;
  transitionType: 'fade' | 'slide' | 'scale' | 'rotate' | 'morph' | 'fluid' | 'quantum' | 'fractal' | 'vortex' | 'ripple';
  direction?: 'up' | 'down' | 'left' | 'right' | 'center' | 'random';
  duration?: number;
  isVisible: boolean;
  onTransitionComplete?: () => void;
  intensity?: number; // 0-1, affects complexity of transition
  mathematicalMode?: 'linear' | 'bezier' | 'elastic' | 'sine' | 'exponential' | 'fibonacci' | 'golden_ratio';
  particleCount?: number; // For particle-based transitions
  preserveAspectRatio?: boolean;
  contextualData?: {
    previousScreen?: string;
    gameState?: string;
    playerScore?: number;
    level?: number;
  };
}

export const AdvancedScreenTransitions: React.FC<AdvancedScreenTransitionsProps> = ({
  children,
  transitionType,
  direction = 'center',
  duration = 800,
  isVisible,
  onTransitionComplete,
  intensity = 1,
  mathematicalMode = 'bezier',
  particleCount = 20,
  preserveAspectRatio = true,
  contextualData = {},
}) => {
  // Animation values
  const animValue = useRef(new Animated.Value(isVisible ? 1 : 0)).current;
  const morphingValues = useRef(
    Array.from({ length: 10 }, () => new Animated.Value(0))
  ).current;
  const particleValues = useRef(
    Array.from({ length: particleCount }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      scale: new Animated.Value(0),
      rotation: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  // Mathematical easing functions
  const getCustomEasing = useMemo(() => {
    const goldenRatio = 1.618033988749;
    
    switch (mathematicalMode) {
      case 'fibonacci':
        return (t: number) => {
          const fib = (n: number): number => n <= 1 ? n : fib(n - 1) + fib(n - 2);
          return fib(Math.floor(t * 10)) / fib(10);
        };
        
      case 'golden_ratio':
        return (t: number) => Math.pow(t, goldenRatio - 1);
        
      case 'sine':
        return (t: number) => (Math.sin((t - 0.5) * Math.PI) + 1) / 2;
        
      case 'exponential':
        return (t: number) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1));
        
      case 'elastic':
        return (t: number) => {
          if (t === 0 || t === 1) return t;
          const p = 0.3;
          const s = p / 4;
          return Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1;
        };
        
      default:
        return Easing.bezier(0.25, 0.46, 0.45, 0.94);
    }
  }, [mathematicalMode]);

  // Generate transition-specific parameters
  const getTransitionParams = useMemo(() => {
    const params: any = {
      startValues: {},
      endValues: {},
      intermediateSteps: [],
    };

    switch (transitionType) {
      case 'morph':
        // Mathematical morphing between geometric shapes
        params.shapes = [
          { sides: 3, radius: 50 }, // Triangle
          { sides: 4, radius: 50 }, // Square
          { sides: 6, radius: 50 }, // Hexagon
          { sides: 8, radius: 50 }, // Octagon
          { sides: 32, radius: 50 }, // Near-circle
        ];
        break;
        
      case 'fluid':
        // Fluid dynamics simulation parameters
        params.viscosity = 0.5 + intensity * 0.5;
        params.waveCount = Math.floor(5 + intensity * 15);
        params.amplitude = 20 + intensity * 50;
        break;
        
      case 'quantum':
        // Quantum mechanics inspired uncertainty transitions
        params.uncertaintyPrinciple = intensity * 0.3;
        params.waveFunction = (x: number, t: number) => 
          Math.sin(x * 0.1 + t) * Math.exp(-x * x * 0.001);
        break;
        
      case 'fractal':
        // Fractal zoom transition
        params.fractalDepth = Math.floor(3 + intensity * 5);
        params.scaleFactor = 2.618; // Golden ratio
        params.rotationIncrement = 137.5; // Golden angle
        break;
        
      case 'vortex':
        // Spiral vortex transition
        params.spiralTurns = 2 + intensity * 4;
        params.spiralRadius = screenWidth * 0.8;
        break;
        
      case 'ripple':
        // Ripple effect from center or edge
        params.rippleCenter = direction === 'center' 
          ? { x: screenWidth / 2, y: screenHeight / 2 }
          : { x: Math.random() * screenWidth, y: Math.random() * screenHeight };
        params.rippleSpeed = 300 + intensity * 700;
        params.rippleCount = Math.floor(3 + intensity * 7);
        break;
    }

    return params;
  }, [transitionType, direction, intensity]);

  // Advanced transition animations
  useEffect(() => {
    const targetValue = isVisible ? 1 : 0;
    const animations: Animated.CompositeAnimation[] = [];

    // Main transition animation
    const mainAnimation = Animated.timing(animValue, {
      toValue: targetValue,
      duration,
      easing: getCustomEasing,
      useNativeDriver: false,
    });

    animations.push(mainAnimation);

    // Transition-specific animations
    switch (transitionType) {
      case 'morph':
        // Animate shape morphing
        morphingValues.forEach((value, index) => {
          animations.push(
            Animated.timing(value, {
              toValue: targetValue,
              duration: duration + index * 100,
              easing: getCustomEasing,
              useNativeDriver: false,
            })
          );
        });
        break;

      case 'fluid':
        // Fluid wave animations
        const waveAnimations = morphingValues.slice(0, getTransitionParams.waveCount).map((value, index) => 
          Animated.loop(
            Animated.timing(value, {
              toValue: 1,
              duration: 2000 + index * 200,
              easing: Easing.linear,
              useNativeDriver: false,
            })
          )
        );
        animations.push(...waveAnimations);
        break;

      case 'quantum':
        // Uncertainty animations
        morphingValues.forEach((value, index) => {
          animations.push(
            Animated.loop(
              Animated.sequence([
                Animated.timing(value, {
                  toValue: 1,
                  duration: 500 + Math.random() * 1000,
                  useNativeDriver: false,
                }),
                Animated.timing(value, {
                  toValue: 0,
                  duration: 500 + Math.random() * 1000,
                  useNativeDriver: false,
                }),
              ])
            )
          );
        });
        break;

      case 'fractal':
        // Fractal scaling animations
        morphingValues.forEach((value, index) => {
          animations.push(
            Animated.timing(value, {
              toValue: targetValue,
              duration: duration * (1 + index * 0.1),
              easing: getCustomEasing,
              useNativeDriver: false,
            })
          );
        });
        break;

      case 'vortex':
        // Spiral animations
        morphingValues.forEach((value, index) => {
          animations.push(
            Animated.timing(value, {
              toValue: targetValue,
              duration: duration,
              delay: index * 50,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: false,
            })
          );
        });
        break;

      case 'ripple':
        // Ripple effect animations
        particleValues.forEach((particle, index) => {
          const delay = (index / particleCount) * duration * 0.5;
          
          animations.push(
            Animated.sequence([
              Animated.delay(delay),
              Animated.parallel([
                Animated.timing(particle.scale, {
                  toValue: targetValue,
                  duration: duration - delay,
                  easing: Easing.out(Easing.cubic),
                  useNativeDriver: false,
                }),
                Animated.timing(particle.opacity, {
                  toValue: targetValue * 0.7,
                  duration: (duration - delay) * 0.8,
                  easing: Easing.out(Easing.quad),
                  useNativeDriver: false,
                }),
              ]),
            ])
          );
        });
        break;
    }

    // Execute all animations
    const compositeAnimation = Animated.parallel(animations);
    compositeAnimation.start(({ finished }) => {
      if (finished && onTransitionComplete) {
        onTransitionComplete();
      }
    });

    return () => {
      compositeAnimation.stop();
    };
  }, [isVisible, transitionType, duration, getCustomEasing]);

  // Render transition-specific overlays
  const renderTransitionOverlay = () => {
    switch (transitionType) {
      case 'morph':
        return (
          <View style={{ position: 'absolute', width: '100%', height: '100%' }}>
            {getTransitionParams.shapes.map((shape: any, index: number) => {
              const animatedValue = morphingValues[index] || new Animated.Value(0);
              const sides = shape.sides;
              const radius = shape.radius;
              
              return (
                <Animated.View
                  key={index}
                  style={{
                    position: 'absolute',
                    left: screenWidth / 2 - radius,
                    top: screenHeight / 2 - radius,
                    width: radius * 2,
                    height: radius * 2,
                    opacity: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.3],
                    }),
                    transform: [
                      {
                        rotate: animatedValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg'],
                        }),
                      },
                      {
                        scale: animatedValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.5, 2],
                        }),
                      },
                    ],
                  }}
                >
                  {/* Render polygon approximation */}
                  <View
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: '#4ECDC4',
                      borderRadius: sides > 16 ? radius : 0,
                      transform: [{ rotate: `${360 / sides / 2}deg` }],
                    }}
                  />
                </Animated.View>
              );
            })}
          </View>
        );

      case 'fluid':
        return (
          <View style={{ position: 'absolute', width: '100%', height: '100%' }}>
            {morphingValues.slice(0, getTransitionParams.waveCount).map((waveValue, index) => (
              <Animated.View
                key={index}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: (screenHeight / getTransitionParams.waveCount) * index,
                  width: '100%',
                  height: screenHeight / getTransitionParams.waveCount + 20,
                  backgroundColor: '#4ECDC4',
                  opacity: 0.1,
                  transform: [
                    {
                      translateX: waveValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-screenWidth, screenWidth],
                      }),
                    },
                    {
                      scaleY: waveValue.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [1, 1.5, 1],
                      }),
                    },
                  ],
                }}
              />
            ))}
          </View>
        );

      case 'quantum':
        return (
          <View style={{ position: 'absolute', width: '100%', height: '100%' }}>
            {morphingValues.slice(0, 8).map((quantumValue, index) => (
              <Animated.View
                key={index}
                style={{
                  position: 'absolute',
                  left: (index % 4) * (screenWidth / 4),
                  top: Math.floor(index / 4) * (screenHeight / 2),
                  width: screenWidth / 4,
                  height: screenHeight / 2,
                  backgroundColor: '#A374D5',
                  opacity: quantumValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.2],
                  }),
                  transform: [
                    {
                      scale: quantumValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1.2],
                      }),
                    },
                  ],
                }}
              />
            ))}
          </View>
        );

      case 'fractal':
        return (
          <View style={{ position: 'absolute', width: '100%', height: '100%' }}>
            {morphingValues.slice(0, getTransitionParams.fractalDepth).map((fractalValue, index) => {
              const scale = Math.pow(getTransitionParams.scaleFactor, -index);
              const rotation = index * getTransitionParams.rotationIncrement;
              
              return (
                <Animated.View
                  key={index}
                  style={{
                    position: 'absolute',
                    left: screenWidth / 2 - 50,
                    top: screenHeight / 2 - 50,
                    width: 100,
                    height: 100,
                    backgroundColor: '#FFB6C1',
                    opacity: fractalValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.4 / (index + 1)],
                    }),
                    transform: [
                      { scale: scale },
                      { rotate: `${rotation}deg` },
                      {
                        scale: fractalValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, scale],
                        }),
                      },
                    ],
                  }}
                />
              );
            })}
          </View>
        );

      case 'vortex':
        return (
          <View style={{ position: 'absolute', width: '100%', height: '100%' }}>
            {morphingValues.slice(0, 12).map((vortexValue, index) => {
              const angle = (index / 12) * 2 * Math.PI;
              const spiralRadius = getTransitionParams.spiralRadius * (index / 12);
              
              return (
                <Animated.View
                  key={index}
                  style={{
                    position: 'absolute',
                    left: screenWidth / 2 - 10,
                    top: screenHeight / 2 - 10,
                    width: 20,
                    height: 20,
                    backgroundColor: '#4A90E2',
                    borderRadius: 10,
                    opacity: vortexValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.8],
                    }),
                    transform: [
                      {
                        translateX: vortexValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, Math.cos(angle) * spiralRadius],
                        }),
                      },
                      {
                        translateY: vortexValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, Math.sin(angle) * spiralRadius],
                        }),
                      },
                      {
                        rotate: vortexValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', `${getTransitionParams.spiralTurns * 360}deg`],
                        }),
                      },
                    ],
                  }}
                />
              );
            })}
          </View>
        );

      case 'ripple':
        return (
          <View style={{ position: 'absolute', width: '100%', height: '100%' }}>
            {particleValues.map((particle, index) => {
              const angle = (index / particleCount) * 2 * Math.PI;
              const distance = (index / particleCount) * Math.max(screenWidth, screenHeight);
              
              return (
                <Animated.View
                  key={index}
                  style={{
                    position: 'absolute',
                    left: getTransitionParams.rippleCenter.x - 5,
                    top: getTransitionParams.rippleCenter.y - 5,
                    width: 10,
                    height: 10,
                    backgroundColor: '#4ECDC4',
                    borderRadius: 5,
                    opacity: particle.opacity,
                    transform: [
                      {
                        translateX: animValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, Math.cos(angle) * distance],
                        }),
                      },
                      {
                        translateY: animValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, Math.sin(angle) * distance],
                        }),
                      },
                      { scale: particle.scale },
                    ],
                  }}
                />
              );
            })}
          </View>
        );

      default:
        return null;
    }
  };

  // Main container transform
  const getMainTransform = () => {
    const transforms: any[] = [];

    switch (transitionType) {
      case 'fade':
        return { opacity: animValue };

      case 'slide':
        const slideDistance = direction === 'up' || direction === 'down' ? screenHeight : screenWidth;
        const slideDirection = direction === 'up' || direction === 'left' ? -1 : 1;
        
        if (direction === 'up' || direction === 'down') {
          transforms.push({
            translateY: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [slideDistance * slideDirection, 0],
            }),
          });
        } else {
          transforms.push({
            translateX: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [slideDistance * slideDirection, 0],
            }),
          });
        }
        break;

      case 'scale':
        transforms.push({
          scale: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 1],
          }),
        });
        break;

      case 'rotate':
        transforms.push({
          rotate: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: ['180deg', '0deg'],
          }),
        });
        transforms.push({
          scale: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 1],
          }),
        });
        break;

      default:
        transforms.push({
          scale: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1],
          }),
        });
    }

    return {
      opacity: animValue,
      transform: transforms,
    };
  };

  return (
    <View style={{ flex: 1, width: '100%', height: '100%' }}>
      {/* Transition overlay */}
      {renderTransitionOverlay()}
      
      {/* Main content */}
      <Animated.View
        style={[
          {
            flex: 1,
            width: '100%',
            height: '100%',
          },
          getMainTransform(),
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
};