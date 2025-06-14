/**
 * Power-up System Hook - Extracted from monolithic useGameLogic
 * 
 * Handles:
 * - Power-up state management
 * - Duration tracking and expiration
 * - Power-up effects on projectiles and gameplay
 * - Power-up activation and deactivation
 * 
 * This is an isolated feature system.
 */

import { useCallback, useRef } from 'react';
import { useActivePowerUp, usePowerUpDuration, useGameActions } from '@/store/gameStore';
import { ENTITY_CONFIG } from '@/constants/GameConfig';

interface PowerUpEffects {
  projectileSpeedMultiplier: number;
  projectileSizeMultiplier: number;
  projectileCountMultiplier: number;
  fireRateMultiplier: number;
  penetrationEnabled: boolean;
  explosionEnabled: boolean;
}

interface PowerUpState {
  type: string | null;
  duration: number;
  effects: PowerUpEffects;
  isActive: boolean;
}

const DEFAULT_EFFECTS: PowerUpEffects = {
  projectileSpeedMultiplier: 1.0,
  projectileSizeMultiplier: 1.0,
  projectileCountMultiplier: 1.0,
  fireRateMultiplier: 1.0,
  penetrationEnabled: false,
  explosionEnabled: false,
};

export const usePowerUpSystem = () => {
  // Power-up state from store
  const activePowerUp = useActivePowerUp();
  const powerUpDuration = usePowerUpDuration();
  const gameActions = useGameActions();

  // Power-up effects cache
  const currentEffects = useRef<PowerUpEffects>(DEFAULT_EFFECTS);
  const lastUpdateTime = useRef<number>(0);

  // Calculate power-up effects based on type
  const calculateEffects = useCallback((powerUpType: string | null): PowerUpEffects => {
    if (!powerUpType) return DEFAULT_EFFECTS;

    switch (powerUpType) {
      case 'rapid_fire':
        return {
          ...DEFAULT_EFFECTS,
          fireRateMultiplier: 2.0,
          projectileSpeedMultiplier: 1.2,
        };

      case 'multi_shot':
        return {
          ...DEFAULT_EFFECTS,
          projectileCountMultiplier: 3.0,
          projectileSpeedMultiplier: 0.9, // Slightly slower to balance
        };

      case 'power_boost':
        return {
          ...DEFAULT_EFFECTS,
          projectileSpeedMultiplier: 1.5,
          projectileSizeMultiplier: 1.3,
          penetrationEnabled: true,
        };

      case 'explosive_shot':
        return {
          ...DEFAULT_EFFECTS,
          projectileSizeMultiplier: 1.2,
          explosionEnabled: true,
          projectileSpeedMultiplier: 0.8, // Slower for balance
        };

      case 'precision_mode':
        return {
          ...DEFAULT_EFFECTS,
          projectileSpeedMultiplier: 2.0,
          projectileSizeMultiplier: 0.8, // Smaller, faster projectiles
          penetrationEnabled: true,
        };

      default:
        console.warn(`Unknown power-up type: ${powerUpType}`);
        return DEFAULT_EFFECTS;
    }
  }, []);

  // Update power-up effects when active power-up changes
  const updateEffects = useCallback(() => {
    const newEffects = calculateEffects(activePowerUp);
    currentEffects.current = newEffects;
  }, [activePowerUp, calculateEffects]);

  // Update power-up duration
  const updateDuration = useCallback((deltaTime: number) => {
    if (activePowerUp && powerUpDuration > 0) {
      gameActions.updatePowerUpDuration(deltaTime);
    }
  }, [activePowerUp, powerUpDuration, gameActions]);

  // Apply power-up effects to projectile
  const applyProjectileEffects = useCallback((baseProjectile: any) => {
    const effects = currentEffects.current;
    
    return {
      ...baseProjectile,
      // Apply speed multiplier
      velocityY: baseProjectile.velocityY * effects.projectileSpeedMultiplier,
      
      // Apply size multiplier
      size: (baseProjectile.size || ENTITY_CONFIG.PROJECTILE.SIZE) * effects.projectileSizeMultiplier,
      width: (baseProjectile.width || ENTITY_CONFIG.PROJECTILE.SIZE) * effects.projectileSizeMultiplier,
      height: (baseProjectile.height || ENTITY_CONFIG.PROJECTILE.SIZE) * effects.projectileSizeMultiplier,
      
      // Add special properties
      penetration: effects.penetrationEnabled,
      explosion: effects.explosionEnabled,
      powerUpType: activePowerUp,
    };
  }, [activePowerUp]);

  // Create multiple projectiles for multi-shot
  const createProjectiles = useCallback((baseProjectile: any) => {
    const effects = currentEffects.current;
    const projectileCount = Math.floor(effects.projectileCountMultiplier);
    
    if (projectileCount <= 1) {
      return [applyProjectileEffects(baseProjectile)];
    }
    
    // Create multiple projectiles with spread
    const projectiles = [];
    const spreadAngle = Math.PI / 6; // 30 degrees total spread
    const angleStep = spreadAngle / (projectileCount - 1);
    const startAngle = -spreadAngle / 2;
    
    for (let i = 0; i < projectileCount; i++) {
      const angle = startAngle + (angleStep * i);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      
      const projectile = applyProjectileEffects({
        ...baseProjectile,
        x: baseProjectile.x + (sin * 20 * i), // Slight horizontal offset
        velocityX: sin * effects.projectileSpeedMultiplier * 50, // Add horizontal velocity
        velocityY: baseProjectile.velocityY * cos, // Adjust vertical velocity
      });
      
      projectiles.push(projectile);
    }
    
    return projectiles;
  }, [applyProjectileEffects]);

  // Check if power-up affects fire rate
  const getFireRateMultiplier = useCallback((): number => {
    return currentEffects.current.fireRateMultiplier;
  }, []);

  // Check if power-up is active
  const isActive = useCallback((): boolean => {
    return activePowerUp !== null && powerUpDuration > 0;
  }, [activePowerUp, powerUpDuration]);

  // Get remaining duration as percentage
  const getRemainingDurationPercent = useCallback((): number => {
    if (!activePowerUp || powerUpDuration <= 0) return 0;
    
    // Assume max duration is stored somewhere or calculate from initial
    const maxDuration = 10000; // 10 seconds default
    return Math.max(0, Math.min(100, (powerUpDuration / maxDuration) * 100));
  }, [activePowerUp, powerUpDuration]);

  // Get power-up display info
  const getPowerUpInfo = useCallback(() => {
    if (!activePowerUp) return null;
    
    const effects = currentEffects.current;
    
    return {
      type: activePowerUp,
      duration: powerUpDuration,
      durationPercent: getRemainingDurationPercent(),
      effects: {
        speedBoost: effects.projectileSpeedMultiplier > 1,
        multiShot: effects.projectileCountMultiplier > 1,
        penetration: effects.penetrationEnabled,
        explosion: effects.explosionEnabled,
        rapidFire: effects.fireRateMultiplier > 1,
      },
    };
  }, [activePowerUp, powerUpDuration, getRemainingDurationPercent]);

  // Initialize effects when power-up changes
  updateEffects();

  return {
    // State
    isActive: isActive(),
    currentPowerUp: activePowerUp,
    duration: powerUpDuration,
    effects: currentEffects.current,
    
    // Actions
    updateDuration,
    createProjectiles,
    applyProjectileEffects,
    
    // Utils
    getFireRateMultiplier,
    getRemainingDurationPercent,
    getPowerUpInfo,
  };
};