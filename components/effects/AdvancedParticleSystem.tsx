/**
 * Advanced Particle System with Physics-Based Simulation
 * Features:
 * - Verlet integration for stable physics
 * - Inter-particle forces and flocking behavior
 * - Force fields and environmental effects
 * - Mathematical emission patterns
 * - Performance-optimized rendering
 */

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';

// Mathematical utilities (PHI not currently used but available for future enhancements)
// const PHI = (1 + Math.sqrt(5)) / 2; // Golden ratio

// Vector2 class for 2D math operations
class Vector2 {
  constructor(public x: number = 0, public y: number = 0) {}

  static add(a: Vector2, b: Vector2): Vector2 {
    return new Vector2(a.x + b.x, a.y + b.y);
  }

  static subtract(a: Vector2, b: Vector2): Vector2 {
    return new Vector2(a.x - b.x, a.y - b.y);
  }

  static multiply(v: Vector2, scalar: number): Vector2 {
    return new Vector2(v.x * scalar, v.y * scalar);
  }

  static magnitude(v: Vector2): number {
    return Math.sqrt(v.x * v.x + v.y * v.y);
  }

  static normalize(v: Vector2): Vector2 {
    const mag = Vector2.magnitude(v);
    if (mag === 0) return new Vector2(0, 0);
    return new Vector2(v.x / mag, v.y / mag);
  }

  static distance(a: Vector2, b: Vector2): number {
    return Vector2.magnitude(Vector2.subtract(a, b));
  }
}

// Advanced particle with physics properties
interface AdvancedParticle {
  id: number;
  position: Vector2;
  oldPosition: Vector2;
  acceleration: Vector2;
  velocity: Vector2;
  mass: number;
  size: number;
  color: string;
  alpha: number;
  age: number;
  lifetime: number;
  trail: Vector2[];
  hue: number;
  baseHue: number;
  saturation: number;
  baseSaturation: number;
  lightness: number;
  baseLightness: number;
  scale: number;
}

// Force field for environmental effects
interface ForceField {
  position: Vector2;
  strength: number;
  radius: number;
  type: 'attract' | 'repel' | 'vortex' | 'wind';
}

interface AdvancedParticleSystemProps {
  emissionPoint: Vector2;
  particleType: 'explosion' | 'trail' | 'impact' | 'power_up' | 'ambient';
  intensity: number;
  duration: number;
  maxParticles?: number;
  forceFields?: ForceField[];
  onComplete?: () => void;
}

const AdvancedParticleSystem: React.FC<AdvancedParticleSystemProps> = ({
  emissionPoint,
  particleType,
  intensity,
  duration,
  maxParticles = 100,
  forceFields = [],
  onComplete
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const particles = useRef<AdvancedParticle[]>([]);
  const animationRef = useRef<number | null>(null);
  const lastTime = useRef<number>(Date.now());
  const emissionTimer = useRef<number>(0);
  const systemAge = useRef<number>(0);

  // Particle emission configuration based on type
  const emissionConfig = useMemo(() => {
    switch (particleType) {
      case 'explosion':
        return {
          emissionRate: 50 * intensity,
          particleLife: 2000,
          speed: { min: 100, max: 300 },
          size: { min: 4, max: 12 },
          colors: ['#FF6B6B', '#FFE66D', '#FF8E53', '#FF3366'],
        };
      case 'trail':
        return {
          emissionRate: 20 * intensity,
          particleLife: 1000,
          speed: { min: 20, max: 80 },
          size: { min: 2, max: 6 },
          colors: ['#50C878', '#66D9EE', '#A8E6CF'],
        };
      case 'impact':
        return {
          emissionRate: 30 * intensity,
          particleLife: 800,
          speed: { min: 50, max: 150 },
          size: { min: 3, max: 8 },
          colors: ['#FFD700', '#FFA500', '#FF4500'],
        };
      case 'power_up':
        return {
          emissionRate: 15 * intensity,
          particleLife: 3000,
          speed: { min: 10, max: 50 },
          size: { min: 6, max: 14 },
          colors: ['#9D4EDD', '#C77DFF', '#E0AAFF'],
        };
      default: // ambient
        return {
          emissionRate: 5 * intensity,
          particleLife: 5000,
          speed: { min: 5, max: 25 },
          size: { min: 2, max: 5 },
          colors: ['#A8E6CF', '#88D8C0', '#7FCDCD'],
        };
    }
  }, [particleType, intensity]);

  // HSL color utilities
  const hexToHsl = useCallback((hex: string): [number, number, number] => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    const add = max + min;
    const l = add * 0.5;
    
    let s, h;
    if (diff === 0) {
      s = h = 0;
    } else {
      s = l < 0.5 ? diff / add : diff / (2 - add);
      switch (max) {
        case r: h = ((g - b) / diff) + (g < b ? 6 : 0); break;
        case g: h = (b - r) / diff + 2; break;
        case b: h = (r - g) / diff + 4; break;
        default: h = 0;
      }
      h /= 6;
    }
    return [h * 360, s * 100, l * 100];
  }, []);

  // Create new particle
  const createParticle = useCallback((id: number): AdvancedParticle => {
    const config = emissionConfig;
    const angle = Math.random() * Math.PI * 2;
    const speed = config.speed.min + Math.random() * (config.speed.max - config.speed.min);
    const color = config.colors[Math.floor(Math.random() * config.colors.length)];
    const [h, s, l] = hexToHsl(color);

    // Fibonacci spiral emission for organic patterns
    const fibIndex = particles.current.length;
    const fibAngle = fibIndex * 137.5 * Math.PI / 180; // Golden angle
    const fibRadius = Math.sqrt(fibIndex) * 5;
    
    const emissionX = emissionPoint.x + fibRadius * Math.cos(fibAngle);
    const emissionY = emissionPoint.y + fibRadius * Math.sin(fibAngle);

    return {
      id,
      position: new Vector2(emissionX, emissionY),
      oldPosition: new Vector2(emissionX, emissionY),
      acceleration: new Vector2(0, 0),
      velocity: new Vector2(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      ),
      mass: 1 + Math.random() * 0.5,
      size: config.size.min + Math.random() * (config.size.max - config.size.min),
      color,
      alpha: 1,
      age: 0,
      lifetime: config.particleLife + Math.random() * config.particleLife * 0.5,
      trail: [],
      hue: h,
      baseHue: h,
      saturation: s,
      baseSaturation: s,
      lightness: l,
      baseLightness: l,
      scale: 1,
    };
  }, [emissionPoint, emissionConfig, hexToHsl]);

  // Calculate inter-particle forces
  const calculateInterParticleForce = useCallback((particle: AdvancedParticle, otherParticle: AdvancedParticle): Vector2 => {
    const distance = Vector2.distance(particle.position, otherParticle.position);
    if (distance === 0 || distance > 50) return new Vector2(0, 0);

    const direction = Vector2.normalize(Vector2.subtract(particle.position, otherParticle.position));
    
    // Weak repulsion to prevent clustering
    const repulsionStrength = 10 / (distance * distance);
    return Vector2.multiply(direction, repulsionStrength);
  }, []);

  // Calculate environmental forces
  const calculateEnvironmentalForces = useCallback((particle: AdvancedParticle): Vector2 => {
    let totalForce = new Vector2(0, 0);

    // Gravity
    totalForce = Vector2.add(totalForce, new Vector2(0, 50));

    // Force fields
    forceFields.forEach(field => {
      const distance = Vector2.distance(particle.position, field.position);
      if (distance > field.radius) return;

      const direction = Vector2.normalize(Vector2.subtract(field.position, particle.position));
      const strength = field.strength * (1 - distance / field.radius);

      switch (field.type) {
        case 'attract':
          totalForce = Vector2.add(totalForce, Vector2.multiply(direction, strength));
          break;
        case 'repel':
          totalForce = Vector2.subtract(totalForce, Vector2.multiply(direction, strength));
          break;
        case 'vortex':
          const perpendicular = new Vector2(-direction.y, direction.x);
          totalForce = Vector2.add(totalForce, Vector2.multiply(perpendicular, strength));
          break;
        case 'wind':
          totalForce = Vector2.add(totalForce, new Vector2(strength, 0));
          break;
      }
    });

    // Boundary forces (soft boundaries)
    const margin = 50;
    if (particle.position.x < margin) {
      totalForce = Vector2.add(totalForce, new Vector2((margin - particle.position.x) * 2, 0));
    }
    if (particle.position.x > screenWidth - margin) {
      totalForce = Vector2.add(totalForce, new Vector2((screenWidth - margin - particle.position.x) * 2, 0));
    }
    if (particle.position.y < margin) {
      totalForce = Vector2.add(totalForce, new Vector2(0, (margin - particle.position.y) * 2));
    }
    if (particle.position.y > screenHeight - margin) {
      totalForce = Vector2.add(totalForce, new Vector2(0, (screenHeight - margin - particle.position.y) * 2));
    }

    return totalForce;
  }, [forceFields, screenWidth, screenHeight]);

  // Smoothstep function for smooth interpolation
  const smoothstep = useCallback((edge0: number, edge1: number, x: number): number => {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }, []);

  // Update particle physics
  const updateParticlePhysics = useCallback((deltaTime: number) => {
    particles.current.forEach((particle, index) => {
      // Reset acceleration
      particle.acceleration = new Vector2(0, 0);

      // Inter-particle forces (only check nearby particles for performance)
      particles.current.forEach((otherParticle, otherIndex) => {
        if (index !== otherIndex && Math.abs(index - otherIndex) < 10) {
          const force = calculateInterParticleForce(particle, otherParticle);
          particle.acceleration = Vector2.add(particle.acceleration, force);
        }
      });

      // Environmental forces
      const environmentalForce = calculateEnvironmentalForces(particle);
      particle.acceleration = Vector2.add(particle.acceleration, environmentalForce);

      // Verlet integration for stable physics
      const newPosition = Vector2.add(
        Vector2.subtract(
          Vector2.add(particle.position, particle.velocity),
          particle.oldPosition
        ),
        Vector2.multiply(particle.acceleration, deltaTime * deltaTime)
      );

      particle.oldPosition = particle.position;
      particle.position = newPosition;
      particle.velocity = Vector2.multiply(
        Vector2.subtract(newPosition, particle.oldPosition),
        0.98 // Damping
      );

      // Update trail
      particle.trail.push(new Vector2(particle.position.x, particle.position.y));
      if (particle.trail.length > 5) {
        particle.trail.shift();
      }

      // Age particle
      particle.age += deltaTime;
      const lifetimeRatio = particle.age / particle.lifetime;

      // Update visual properties
      particle.alpha = smoothstep(0, particle.lifetime * 0.1, particle.age) * 
                      (1 - smoothstep(particle.lifetime * 0.7, particle.lifetime, particle.age));

      // Dynamic scaling based on physics
      const velocityMagnitude = Vector2.magnitude(particle.velocity);
      particle.scale = 1 + (velocityMagnitude / 100) * 0.3;

      // Color evolution
      particle.hue = (particle.baseHue + lifetimeRatio * 60) % 360;
      particle.saturation = Math.max(0, particle.baseSaturation - lifetimeRatio * 30);
      particle.lightness = particle.baseLightness + Math.sin(lifetimeRatio * Math.PI) * 15;
    });

    // Remove dead particles
    particles.current = particles.current.filter(p => p.age < p.lifetime);
  }, [calculateInterParticleForce, calculateEnvironmentalForces, smoothstep]);

  // Main animation loop
  const animate = useCallback(() => {
    const currentTime = Date.now();
    const deltaTime = (currentTime - lastTime.current) / 1000; // Convert to seconds
    lastTime.current = currentTime;

    systemAge.current += deltaTime * 1000;
    emissionTimer.current += deltaTime * 1000;

    // Emit new particles
    if (systemAge.current < duration && particles.current.length < maxParticles) {
      const emissionInterval = 1000 / emissionConfig.emissionRate;
      if (emissionTimer.current >= emissionInterval) {
        const newParticle = createParticle(particles.current.length);
        particles.current.push(newParticle);
        emissionTimer.current = 0;
      }
    }

    // Update physics
    updateParticlePhysics(deltaTime);

    // Continue animation or complete
    if (particles.current.length > 0 || systemAge.current < duration) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      onComplete?.();
    }
  }, [duration, maxParticles, emissionConfig.emissionRate, createParticle, updateParticlePhysics, onComplete]);

  // Start animation
  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.current.map(particle => (
        <View
          key={particle.id}
          style={[
            styles.particle,
            {
              left: particle.position.x - (particle.size * particle.scale) / 2,
              top: particle.position.y - (particle.size * particle.scale) / 2,
              width: particle.size * particle.scale,
              height: particle.size * particle.scale,
              backgroundColor: `hsl(${particle.hue}, ${particle.saturation}%, ${particle.lightness}%)`,
              opacity: particle.alpha,
              borderRadius: (particle.size * particle.scale) / 2,
              shadowColor: `hsl(${particle.hue}, ${particle.saturation}%, ${particle.lightness}%)`,
              shadowOpacity: particle.alpha * 0.8,
              shadowRadius: particle.size * particle.scale * 0.5,
              elevation: 3,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  particle: {
    position: 'absolute',
  },
});

export default AdvancedParticleSystem;