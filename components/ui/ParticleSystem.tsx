import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Particle {
  id: string;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  rotation?: Animated.Value;
  color: string;
  size: number;
  speed: number;
  direction: number;
  lifetime: number;
}

interface ParticleSystemProps {
  particleCount: number;
  colors: string[];
  minSize: number;
  maxSize: number;
  minSpeed: number;
  maxSpeed: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'random';
  lifetime: number;
  emissionRate: number;
  style?: any;
}

export const ParticleSystem: React.FC<ParticleSystemProps> = ({
  particleCount,
  colors,
  minSize,
  maxSize,
  minSpeed,
  maxSpeed,
  direction = 'random',
  lifetime,
  emissionRate,
  style,
}) => {
  const particles = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);

  const createParticle = (): Particle => {
    const size = minSize + Math.random() * (maxSize - minSize);
    const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    let startX, startY, directionAngle;
    
    switch (direction) {
      case 'up':
        startX = Math.random() * screenWidth;
        startY = screenHeight + size;
        directionAngle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5;
        break;
      case 'down':
        startX = Math.random() * screenWidth;
        startY = -size;
        directionAngle = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
        break;
      case 'left':
        startX = screenWidth + size;
        startY = Math.random() * screenHeight;
        directionAngle = Math.PI + (Math.random() - 0.5) * 0.5;
        break;
      case 'right':
        startX = -size;
        startY = Math.random() * screenHeight;
        directionAngle = (Math.random() - 0.5) * 0.5;
        break;
      default:
        startX = Math.random() * screenWidth;
        startY = Math.random() * screenHeight;
        directionAngle = Math.random() * Math.PI * 2;
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      x: new Animated.Value(startX),
      y: new Animated.Value(startY),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
      rotation: new Animated.Value(0),
      color,
      size,
      speed,
      direction: directionAngle,
      lifetime,
    };
  };

  const animateParticle = (particle: Particle) => {
    const endX = (particle.x as any)._value + Math.cos(particle.direction) * particle.speed * lifetime;
    const endY = (particle.y as any)._value + Math.sin(particle.direction) * particle.speed * lifetime;

    // Fade in
    Animated.timing(particle.opacity, {
      toValue: 0.7,
      duration: 500,
      useNativeDriver: true,
    }).start();

    Animated.timing(particle.scale, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Movement
    Animated.parallel([
      Animated.timing(particle.x, {
        toValue: endX,
        duration: lifetime,
        useNativeDriver: true,
      }),
      Animated.timing(particle.y, {
        toValue: endY,
        duration: lifetime,
        useNativeDriver: true,
      }),
      particle.rotation ? Animated.timing(particle.rotation, {
        toValue: Math.random() * 360,
        duration: lifetime,
        useNativeDriver: true,
      }) : Animated.timing(new Animated.Value(0), { toValue: 0, duration: 0, useNativeDriver: true } as any),
    ]).start();

    // Fade out
    setTimeout(() => {
      Animated.timing(particle.opacity, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    }, lifetime - 1000);
  };

  useEffect(() => {
    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      const particle = createParticle();
      particles.current.push(particle);
      setTimeout(() => animateParticle(particle), i * (1000 / emissionRate));
    }

    // Continuous emission
    const interval = setInterval(() => {
      // Remove old particles
      particles.current = particles.current.filter(p => p.lifetime > 0);
      
      // Add new particles
      if (particles.current.length < particleCount) {
        const particle = createParticle();
        particles.current.push(particle);
        animateParticle(particle);
      }
    }, 1000 / emissionRate);

    return () => {
      clearInterval(interval);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <View style={[{ position: 'absolute', width: '100%', height: '100%' }, style]} pointerEvents="none">
      {particles.current.map((particle) => (
        <Animated.View
          key={particle.id}
          style={{
            position: 'absolute',
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            borderRadius: particle.size / 2,
            transform: [
              { translateX: particle.x },
              { translateY: particle.y },
              { scale: particle.scale },
              { rotate: particle.rotation?.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg'],
              }) || '0deg' },
            ],
            opacity: particle.opacity,
          }}
        />
      ))}
    </View>
  );
};