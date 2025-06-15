/**
 * Advanced Particle System - Ultra-Mathematical Particle Generation
 * Features: Procedural particle behaviors, mathematical force fields, fluid dynamics,
 * advanced physics simulation, fractal patterns, and contextual particle evolution
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Animated, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface AdvancedParticle {
  id: string;
  x: Animated.Value;
  y: Animated.Value;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  size: Animated.Value;
  opacity: Animated.Value;
  rotation: Animated.Value;
  color: string;
  life: number;
  maxLife: number;
  mass: number;
  charge: number; // For electromagnetic effects
  type: 'default' | 'spark' | 'smoke' | 'energy' | 'plasma' | 'quantum' | 'fractal';
  behavior: 'linear' | 'orbital' | 'chaotic' | 'flocking' | 'magnetic' | 'gravitational';
  generation: number; // For fractal spawning
  parentId?: string;
}

interface ForceField {
  x: number;
  y: number;
  strength: number;
  type: 'gravity' | 'magnetic' | 'repulsion' | 'vortex' | 'turbulence';
  radius: number;
}

interface AdvancedParticleSystemProps {
  particleCount: number;
  emissionPoint?: { x: number; y: number };
  forceFields?: ForceField[];
  colors: string[];
  minSize: number;
  maxSize: number;
  minSpeed: number;
  maxSpeed: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'radial' | 'vortex' | 'random';
  lifetime: number;
  emissionRate: number;
  gravity?: number;
  turbulence?: number;
  particleType?: 'default' | 'spark' | 'smoke' | 'energy' | 'plasma' | 'quantum' | 'fractal';
  behavior?: 'linear' | 'orbital' | 'chaotic' | 'flocking' | 'magnetic' | 'gravitational';
  mathMode?: 'fibonacci' | 'mandelbrot' | 'lorenz' | 'julia' | 'golden_ratio' | 'chaos';
  interactionMode?: 'none' | 'collision' | 'magnetic' | 'flocking' | 'fluid';
  style?: any;
  onParticleCollision?: (particle1: AdvancedParticle, particle2: AdvancedParticle) => void;
  evolutionEnabled?: boolean; // Particles can spawn children and evolve
}

export const AdvancedParticleSystem: React.FC<AdvancedParticleSystemProps> = ({
  particleCount,
  emissionPoint = { x: screenWidth / 2, y: screenHeight / 2 },
  forceFields = [],
  colors,
  minSize,
  maxSize,
  minSpeed,
  maxSpeed,
  direction = 'random',
  lifetime,
  emissionRate,
  gravity = 0,
  turbulence = 0,
  particleType = 'default',
  behavior = 'linear',
  mathMode = 'fibonacci',
  interactionMode = 'none',
  style,
  onParticleCollision,
  evolutionEnabled = false,
}) => {
  const [particles, setParticles] = useState<AdvancedParticle[]>([]);
  const animationRef = useRef<number>(0);
  const lastTime = useRef<number>(Date.now());
  const particleIdCounter = useRef<number>(0);

  // Mathematical constants and sequences
  const goldenRatio = 1.618033988749;
  const fibonacciSequence = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144];

  // Create particle with mathematical positioning
  const createParticle = (
    parentId?: string,
    generation: number = 0,
    inheritedProps?: Partial<AdvancedParticle>
  ): AdvancedParticle => {
    const id = `particle-${particleIdCounter.current++}`;
    const size = minSize + Math.random() * (maxSize - minSize);
    const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    let startX, startY, directionAngle, vx, vy;

    // Mathematical emission patterns
    if (mathMode === 'fibonacci') {
      const fibIndex = particles.length % fibonacciSequence.length;
      const angle = fibIndex * goldenRatio * 2 * Math.PI;
      const radius = Math.sqrt(fibIndex) * 20;
      startX = emissionPoint.x + Math.cos(angle) * radius;
      startY = emissionPoint.y + Math.sin(angle) * radius;
      directionAngle = angle + Math.PI / 2;
    } else if (mathMode === 'golden_ratio') {
      const angle = particles.length * goldenRatio * 2 * Math.PI;
      const radius = Math.sqrt(particles.length) * 15;
      startX = emissionPoint.x + Math.cos(angle) * radius;
      startY = emissionPoint.y + Math.sin(angle) * radius;
      directionAngle = angle;
    } else if (mathMode === 'mandelbrot') {
      // Sample from Mandelbrot set boundary
      const c_re = (Math.random() - 0.5) * 3;
      const c_im = (Math.random() - 0.5) * 3;
      let z_re = 0, z_im = 0;
      let iterations = 0;
      const maxIterations = 50;
      
      while (z_re * z_re + z_im * z_im < 4 && iterations < maxIterations) {
        const temp = z_re * z_re - z_im * z_im + c_re;
        z_im = 2 * z_re * z_im + c_im;
        z_re = temp;
        iterations++;
      }
      
      startX = emissionPoint.x + (c_re / 3) * 200;
      startY = emissionPoint.y + (c_im / 3) * 200;
      directionAngle = (iterations / maxIterations) * 2 * Math.PI;
    } else if (mathMode === 'lorenz') {
      // Lorenz attractor sampling
      const t = particles.length * 0.01;
      const sigma = 10, rho = 28, beta = 8/3;
      startX = emissionPoint.x + Math.sin(t * sigma) * 50;
      startY = emissionPoint.y + Math.cos(t * rho) * 50;
      directionAngle = t;
    } else {
      // Standard directional emission
      switch (direction) {
        case 'radial':
          directionAngle = Math.random() * 2 * Math.PI;
          startX = emissionPoint.x;
          startY = emissionPoint.y;
          break;
        case 'vortex':
          const vortexAngle = Math.random() * 2 * Math.PI;
          const vortexRadius = Math.random() * 100;
          startX = emissionPoint.x + Math.cos(vortexAngle) * vortexRadius;
          startY = emissionPoint.y + Math.sin(vortexAngle) * vortexRadius;
          directionAngle = vortexAngle + Math.PI / 2; // Tangential
          break;
        default:
          startX = Math.random() * screenWidth;
          startY = Math.random() * screenHeight;
          directionAngle = Math.random() * 2 * Math.PI;
      }
    }

    vx = Math.cos(directionAngle) * speed + (Math.random() - 0.5) * turbulence;
    vy = Math.sin(directionAngle) * speed + (Math.random() - 0.5) * turbulence;

    return {
      id,
      x: new Animated.Value(inheritedProps?.x?._value || startX),
      y: new Animated.Value(inheritedProps?.y?._value || startY),
      vx: inheritedProps?.vx || vx,
      vy: inheritedProps?.vy || vy,
      ax: 0,
      ay: gravity,
      size: new Animated.Value(inheritedProps?.size?._value || size),
      opacity: new Animated.Value(0),
      rotation: new Animated.Value(0),
      color: inheritedProps?.color || color,
      life: 0,
      maxLife: lifetime + (Math.random() - 0.5) * lifetime * 0.5,
      mass: size / 10,
      charge: (Math.random() - 0.5) * 2, // -1 to 1
      type: inheritedProps?.type || particleType,
      behavior: inheritedProps?.behavior || behavior,
      generation,
      parentId,
    };
  };

  // Physics simulation with advanced force calculations
  const updateParticlePhysics = (particle: AdvancedParticle, deltaTime: number, allParticles: AdvancedParticle[]) => {
    // Reset acceleration
    particle.ax = 0;
    particle.ay = gravity;

    // Apply force fields
    forceFields.forEach(field => {
      const dx = field.x - (particle.x as any)._value;
      const dy = field.y - (particle.y as any)._value;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < field.radius && distance > 0) {
        const forceMagnitude = field.strength / (distance * distance + 1);
        const forceX = (dx / distance) * forceMagnitude;
        const forceY = (dy / distance) * forceMagnitude;
        
        switch (field.type) {
          case 'gravity':
            particle.ax += forceX / particle.mass;
            particle.ay += forceY / particle.mass;
            break;
          case 'repulsion':
            particle.ax -= forceX / particle.mass;
            particle.ay -= forceY / particle.mass;
            break;
          case 'magnetic':
            // Magnetic force perpendicular to motion
            const perpX = -particle.vy;
            const perpY = particle.vx;
            const perpMag = Math.sqrt(perpX * perpX + perpY * perpY);
            if (perpMag > 0) {
              particle.ax += (perpX / perpMag) * forceMagnitude * particle.charge;
              particle.ay += (perpY / perpMag) * forceMagnitude * particle.charge;
            }
            break;
          case 'vortex':
            // Tangential force for vortex
            const tangentX = -dy / distance;
            const tangentY = dx / distance;
            particle.ax += tangentX * forceMagnitude;
            particle.ay += tangentY * forceMagnitude;
            break;
          case 'turbulence':
            // Random turbulent force
            particle.ax += (Math.random() - 0.5) * forceMagnitude;
            particle.ay += (Math.random() - 0.5) * forceMagnitude;
            break;
        }
      }
    });

    // Inter-particle interactions
    if (interactionMode !== 'none') {
      allParticles.forEach(otherParticle => {
        if (particle.id === otherParticle.id) return;
        
        const dx = (otherParticle.x as any)._value - (particle.x as any)._value;
        const dy = (otherParticle.y as any)._value - (particle.y as any)._value;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          switch (interactionMode) {
            case 'collision':
              if (distance < (particle.size as any)._value + (otherParticle.size as any)._value) {
                onParticleCollision?.(particle, otherParticle);
                // Elastic collision
                const totalMass = particle.mass + otherParticle.mass;
                const newVx = ((particle.mass - otherParticle.mass) * particle.vx + 2 * otherParticle.mass * otherParticle.vx) / totalMass;
                const newVy = ((particle.mass - otherParticle.mass) * particle.vy + 2 * otherParticle.mass * otherParticle.vy) / totalMass;
                particle.vx = newVx;
                particle.vy = newVy;
              }
              break;
              
            case 'magnetic':
              // Coulomb-like force between charged particles
              if (distance < 100) {
                const force = (particle.charge * otherParticle.charge * 1000) / (distance * distance + 1);
                const forceX = (dx / distance) * force;
                const forceY = (dy / distance) * force;
                particle.ax -= forceX / particle.mass;
                particle.ay -= forceY / particle.mass;
              }
              break;
              
            case 'flocking':
              // Boids-like flocking behavior
              if (distance < 50) {
                // Separation
                particle.ax -= dx / distance * 10;
                particle.ay -= dy / distance * 10;
              } else if (distance < 100) {
                // Alignment
                particle.ax += (otherParticle.vx - particle.vx) * 0.1;
                particle.ay += (otherParticle.vy - particle.vy) * 0.1;
                // Cohesion
                particle.ax += dx * 0.001;
                particle.ay += dy * 0.001;
              }
              break;
              
            case 'fluid':
              // Simplified fluid dynamics
              if (distance < 30) {
                const pressure = Math.max(0, 30 - distance) / 30;
                particle.ax -= (dx / distance) * pressure * 100;
                particle.ay -= (dy / distance) * pressure * 100;
              }
              break;
          }
        }
      });
    }

    // Behavioral modifications
    switch (particle.behavior) {
      case 'orbital':
        // Circular orbital motion around emission point
        const orbitalDx = emissionPoint.x - (particle.x as any)._value;
        const orbitalDy = emissionPoint.y - (particle.y as any)._value;
        const orbitalDistance = Math.sqrt(orbitalDx * orbitalDx + orbitalDy * orbitalDy);
        if (orbitalDistance > 0) {
          particle.ax += -orbitalDy / orbitalDistance * 50;
          particle.ay += orbitalDx / orbitalDistance * 50;
        }
        break;
        
      case 'chaotic':
        // Chaotic attractor behavior
        const chaoticFactor = Math.sin(particle.life * 0.1) * Math.cos(particle.life * 0.07);
        particle.ax += chaoticFactor * 100;
        particle.ay += Math.sin(chaoticFactor) * 100;
        break;
        
      case 'gravitational':
        // Attract to emission point
        const gravDx = emissionPoint.x - (particle.x as any)._value;
        const gravDy = emissionPoint.y - (particle.y as any)._value;
        const gravDistance = Math.sqrt(gravDx * gravDx + gravDy * gravDy);
        if (gravDistance > 0) {
          particle.ax += (gravDx / gravDistance) * 100 / (gravDistance + 1);
          particle.ay += (gravDy / gravDistance) * 100 / (gravDistance + 1);
        }
        break;
    }

    // Update velocity and position using Verlet integration
    particle.vx += particle.ax * deltaTime;
    particle.vy += particle.ay * deltaTime;
    
    // Damping
    particle.vx *= 0.999;
    particle.vy *= 0.999;
    
    // Update position
    const newX = (particle.x as any)._value + particle.vx * deltaTime;
    const newY = (particle.y as any)._value + particle.vy * deltaTime;
    
    particle.x.setValue(newX);
    particle.y.setValue(newY);
    
    // Update life
    particle.life += deltaTime;
    
    // Update visual properties based on life
    const lifeRatio = particle.life / particle.maxLife;
    const opacity = Math.max(0, 1 - lifeRatio);
    particle.opacity.setValue(opacity);
    
    // Size evolution based on type
    let sizeMultiplier = 1;
    switch (particle.type) {
      case 'smoke':
        sizeMultiplier = 1 + lifeRatio * 2; // Grows over time
        break;
      case 'spark':
        sizeMultiplier = 1 - lifeRatio * 0.8; // Shrinks quickly
        break;
      case 'energy':
        sizeMultiplier = 1 + Math.sin(particle.life * 0.01) * 0.3; // Pulsing
        break;
      case 'plasma':
        sizeMultiplier = 1 + Math.random() * 0.5; // Random fluctuation
        break;
    }
    
    particle.size.setValue((minSize + (maxSize - minSize) * (1 - lifeRatio)) * sizeMultiplier);
    
    // Rotation
    particle.rotation.setValue(particle.life * 0.002 + Math.sin(particle.life * 0.005) * 2);
  };

  // Spawn child particles for evolution
  const spawnChildParticles = (parent: AdvancedParticle): AdvancedParticle[] => {
    if (!evolutionEnabled || parent.generation >= 3) return [];
    
    const children: AdvancedParticle[] = [];
    const childCount = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < childCount; i++) {
      const childType = parent.type === 'fractal' ? 'fractal' : 
                       Math.random() > 0.7 ? 'spark' : 'energy';
      
      const child = createParticle(parent.id, parent.generation + 1, {
        x: parent.x,
        y: parent.y,
        vx: parent.vx + (Math.random() - 0.5) * 100,
        vy: parent.vy + (Math.random() - 0.5) * 100,
        size: new Animated.Value((parent.size as any)._value * 0.7),
        color: parent.color,
        type: childType,
        behavior: parent.behavior,
      });
      
      children.push(child);
    }
    
    return children;
  };

  // Animation loop
  useEffect(() => {
    const animate = () => {
      const currentTime = Date.now();
      const deltaTime = Math.min((currentTime - lastTime.current) / 1000, 0.016); // Cap at 60fps
      lastTime.current = currentTime;

      setParticles(prevParticles => {
        const updatedParticles = [...prevParticles];
        const newParticles: AdvancedParticle[] = [];
        
        // Update existing particles
        for (let i = updatedParticles.length - 1; i >= 0; i--) {
          const particle = updatedParticles[i];
          updateParticlePhysics(particle, deltaTime, updatedParticles);
          
          // Remove dead particles
          if (particle.life >= particle.maxLife) {
            // Spawn children before removal
            if (evolutionEnabled && Math.random() > 0.8) {
              newParticles.push(...spawnChildParticles(particle));
            }
            updatedParticles.splice(i, 1);
          }
        }
        
        // Add new particles from emission
        if (updatedParticles.length < particleCount && Math.random() < emissionRate * deltaTime) {
          const newParticle = createParticle();
          
          // Initialize with fade-in animation
          Animated.timing(newParticle.opacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
          
          updatedParticles.push(newParticle);
        }
        
        // Add evolved children
        updatedParticles.push(...newParticles);
        
        return updatedParticles;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [emissionRate, particleCount, lifetime, gravity, turbulence]);

  // Render particle based on type
  const renderParticle = (particle: AdvancedParticle) => {
    const baseStyle = {
      position: 'absolute' as const,
      transform: [
        { translateX: particle.x },
        { translateY: particle.y },
        { rotate: particle.rotation.interpolate({
          inputRange: [0, 2 * Math.PI],
          outputRange: ['0deg', '360deg'],
        }) },
        { scale: particle.size.interpolate({
          inputRange: [0, maxSize],
          outputRange: [0, 1],
        }) },
      ],
      opacity: particle.opacity,
    };

    switch (particle.type) {
      case 'spark':
        return (
          <Animated.View
            key={particle.id}
            style={[baseStyle, {
              width: maxSize,
              height: maxSize,
            }]}
          >
            {/* Spark core */}
            <View
              style={{
                width: '100%',
                height: '20%',
                backgroundColor: particle.color,
                borderRadius: maxSize,
              }}
            />
            {/* Spark trails */}
            <View
              style={{
                position: 'absolute',
                top: '40%',
                left: 0,
                width: '80%',
                height: '10%',
                backgroundColor: particle.color,
                opacity: 0.6,
                borderRadius: maxSize,
              }}
            />
          </Animated.View>
        );
        
      case 'smoke':
        return (
          <Animated.View
            key={particle.id}
            style={[baseStyle, {
              width: maxSize * 1.5,
              height: maxSize * 1.5,
              backgroundColor: particle.color,
              borderRadius: maxSize * 0.75,
              opacity: particle.opacity.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.3],
              }),
            }]}
          />
        );
        
      case 'energy':
        return (
          <Animated.View
            key={particle.id}
            style={[baseStyle, {
              width: maxSize,
              height: maxSize,
            }]}
          >
            {/* Energy core */}
            <View
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: particle.color,
                borderRadius: maxSize / 2,
                shadowColor: particle.color,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 8,
                elevation: 5,
              }}
            />
            {/* Energy rings */}
            {[1, 2, 3].map(ring => (
              <View
                key={ring}
                style={{
                  position: 'absolute',
                  left: -ring * 4,
                  top: -ring * 4,
                  right: -ring * 4,
                  bottom: -ring * 4,
                  borderRadius: (maxSize + ring * 8) / 2,
                  borderWidth: 1,
                  borderColor: particle.color,
                  opacity: 0.3 / ring,
                }}
              />
            ))}
          </Animated.View>
        );
        
      case 'plasma':
        return (
          <Animated.View
            key={particle.id}
            style={[baseStyle, {
              width: maxSize,
              height: maxSize,
            }]}
          >
            {/* Plasma blob with random shape */}
            <View
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: particle.color,
                borderRadius: maxSize / 2,
                transform: [
                  { scaleX: 0.8 + Math.random() * 0.4 },
                  { scaleY: 0.8 + Math.random() * 0.4 },
                ],
              }}
            />
          </Animated.View>
        );
        
      case 'quantum':
        return (
          <Animated.View
            key={particle.id}
            style={[baseStyle, {
              width: maxSize,
              height: maxSize,
            }]}
          >
            {/* Quantum probability cloud */}
            {[0, 120, 240].map(angle => (
              <View
                key={angle}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backgroundColor: particle.color,
                  borderRadius: maxSize / 2,
                  opacity: 0.3,
                  transform: [
                    { rotate: `${angle}deg` },
                    { scaleX: 0.5 },
                  ],
                }}
              />
            ))}
          </Animated.View>
        );
        
      case 'fractal':
        return (
          <Animated.View
            key={particle.id}
            style={[baseStyle, {
              width: maxSize,
              height: maxSize,
            }]}
          >
            {/* Fractal pattern */}
            {[1, 0.6, 0.36, 0.216].map((scale, index) => (
              <View
                key={index}
                style={{
                  position: 'absolute',
                  left: `${25 * index}%`,
                  top: `${25 * index}%`,
                  width: `${100 * scale}%`,
                  height: `${100 * scale}%`,
                  backgroundColor: particle.color,
                  borderRadius: maxSize / 2,
                  opacity: scale,
                }}
              />
            ))}
          </Animated.View>
        );
        
      default:
        return (
          <Animated.View
            key={particle.id}
            style={[baseStyle, {
              width: maxSize,
              height: maxSize,
              backgroundColor: particle.color,
              borderRadius: maxSize / 2,
            }]}
          />
        );
    }
  };

  return (
    <View style={[{ position: 'absolute', width: '100%', height: '100%' }, style]} pointerEvents="none">
      {particles.map(renderParticle)}
    </View>
  );
};