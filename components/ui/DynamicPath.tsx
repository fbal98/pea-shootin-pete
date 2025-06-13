import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import Svg, { Path, Circle, LinearGradient, Defs, Stop } from 'react-native-svg';

interface DynamicPathProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  theme: 'beach' | 'space' | 'city' | 'forest' | 'arctic' | 'volcano' | 'desert' | 'underwater';
  status: 'locked' | 'available' | 'completed';
  animated?: boolean;
}

export const DynamicPath: React.FC<DynamicPathProps> = ({
  from,
  to,
  theme,
  status,
  animated = true,
}) => {
  const flowAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(0)).current;
  const glowAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;

    if (status === 'completed') {
      // Flowing energy animation for completed paths
      Animated.loop(
        Animated.timing(flowAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    }

    if (status === 'available') {
      // Pulsing glow for available paths
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    // Subtle glow animation
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
  }, [status, animated]);

  const getThemeColors = () => {
    switch (theme) {
      case 'beach':
        return {
          primary: '#FFD93D',
          secondary: '#6BCF7F',
          glow: '#87CEEB',
          particles: ['#FFD93D', '#6BCF7F', '#87CEEB'],
        };
      case 'space':
        return {
          primary: '#6C5CE7',
          secondary: '#A29BFE',
          glow: '#74B9FF',
          particles: ['#6C5CE7', '#A29BFE', '#74B9FF'],
        };
      case 'city':
        return {
          primary: '#FF7675',
          secondary: '#FD79A8',
          glow: '#FDCB6E',
          particles: ['#FF7675', '#FD79A8', '#FDCB6E'],
        };
      case 'forest':
        return {
          primary: '#00B894',
          secondary: '#55A3FF',
          glow: '#98FB98',
          particles: ['#00B894', '#55A3FF', '#98FB98'],
        };
      case 'arctic':
        return {
          primary: '#74B9FF',
          secondary: '#FFFFFF',
          glow: '#E1F5FE',
          particles: ['#74B9FF', '#FFFFFF', '#E1F5FE'],
        };
      case 'volcano':
        return {
          primary: '#FF6348',
          secondary: '#FF9F43',
          glow: '#FF7979',
          particles: ['#FF6348', '#FF9F43', '#FF7979'],
        };
      case 'desert':
        return {
          primary: '#FDCB6E',
          secondary: '#E17055',
          glow: '#F8C471',
          particles: ['#FDCB6E', '#E17055', '#F8C471'],
        };
      case 'underwater':
        return {
          primary: '#0984E3',
          secondary: '#6C5CE7',
          glow: '#74B9FF',
          particles: ['#0984E3', '#6C5CE7', '#74B9FF'],
        };
      default:
        return {
          primary: '#6C5CE7',
          secondary: '#A29BFE',
          glow: '#74B9FF',
          particles: ['#6C5CE7', '#A29BFE', '#74B9FF'],
        };
    }
  };

  const colors = getThemeColors();
  const distance = Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2));
  const angle = Math.atan2(to.y - from.y, to.x - from.x);

  // Create curved path for more organic feel
  const midX = (from.x + to.x) / 2 + Math.sin(angle + Math.PI / 2) * 30;
  const midY = (from.y + to.y) / 2 + Math.cos(angle + Math.PI / 2) * 30;

  const pathData = `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;

  const getOpacity = () => {
    switch (status) {
      case 'locked': return 0.2;
      case 'available': return 0.7;
      case 'completed': return 1.0;
      default: return 0.5;
    }
  };

  const getStrokeWidth = () => {
    switch (status) {
      case 'locked': return 2;
      case 'available': return 4;
      case 'completed': return 6;
      default: return 3;
    }
  };

  const renderFlowingParticles = () => {
    if (status !== 'completed' || !animated) return null;

    const particleCount = 5;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const delay = (i / particleCount) * 2000;
      
      particles.push(
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            width: 6,
            height: 6,
            backgroundColor: colors.particles[i % colors.particles.length],
            borderRadius: 3,
            shadowColor: colors.glow,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 4,
            transform: [
              { translateX: from.x + (to.x - from.x) * 0.5 },
              { translateY: from.y + (to.y - from.y) * 0.5 },
            ],
            opacity: 0.8,
          }}
        />
      );
    }

    return particles;
  };

  const renderThemeSpecificEffects = () => {
    switch (theme) {
      case 'space':
        return (
          <Circle
            cx={(from.x + to.x) / 2}
            cy={(from.y + to.y) / 2}
            r="8"
            fill={colors.glow}
            opacity={0.5}
          />
        );
      case 'volcano':
        return [...Array(3)].map((_, i) => (
          <Circle
            key={i}
            cx={from.x + (to.x - from.x) * (0.3 + i * 0.2)}
            cy={from.y + (to.y - from.y) * (0.3 + i * 0.2)}
            r="4"
            fill={colors.particles[i]}
            opacity={0.6}
          />
        ));
      case 'underwater':
        return (
          <Path
            d={pathData}
            stroke={`rgba(0, 255, 255, 0.1)`}
            fill="none"
            strokeWidth="12"
            opacity={0.3}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={{ position: 'absolute', width: '100%', height: '100%' }} pointerEvents="none">
      <Svg width="100%" height="100%" style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id={`pathGradient_${theme}_${status}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={colors.primary} />
            <Stop offset="50%" stopColor={colors.secondary} />
            <Stop offset="100%" stopColor={colors.primary} />
          </LinearGradient>
          
          <LinearGradient id={`glowGradient_${theme}_${status}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="transparent" />
            <Stop offset="50%" stopColor={colors.glow} />
            <Stop offset="100%" stopColor="transparent" />
          </LinearGradient>
        </Defs>

        {/* Glow effect */}
        {status !== 'locked' && (
          <Path
            d={pathData}
            stroke={`url(#glowGradient_${theme}_${status})`}
            strokeWidth={getStrokeWidth() + 4}
            fill="none"
            opacity={status === 'available' ? 0.4 : 0.5}
          />
        )}

        {/* Main path */}
        <Path
          d={pathData}
          stroke={status === 'locked' ? '#666666' : `url(#pathGradient_${theme}_${status})`}
          strokeWidth={getStrokeWidth()}
          fill="none"
          opacity={getOpacity()}
          strokeDasharray={status === 'locked' ? '10,5' : '0'}
        />

        {/* Theme-specific effects */}
        {renderThemeSpecificEffects()}
      </Svg>

      {/* Flowing particles */}
      {renderFlowingParticles()}
    </View>
  );
};