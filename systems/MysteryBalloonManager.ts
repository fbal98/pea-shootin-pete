/**
 * Mystery Balloon Manager - Variable Ratio Reward System
 * 
 * Implements the psychological addiction mechanism through unpredictable rewards.
 * Based on operant conditioning principles and variable ratio reinforcement schedules.
 * 
 * Key Features:
 * - Unpredictable spawn intervals (variable ratio schedule)
 * - Escalating reward rarity to maintain engagement
 * - Visual and audio feedback for maximum dopamine response
 * - Analytics integration for optimization
 * - Level-specific spawn rate scaling
 * 
 * Based on 2025 mobile game monetization and retention best practices.
 */

import {
  MysteryBalloonConfig,
  MysteryReward,
  MysteryRewardType,
  RewardRarity,
  CelebrationLevel,
  META_PROGRESSION_CONSTANTS
} from '../types/MetaProgressionTypes';
import { nanoid } from 'nanoid/non-secure';

// Reward distribution configuration (probabilities add up to 100%)
interface RewardDistribution {
  [key: string]: {
    probability: number;
    rarityWeights: Record<RewardRarity, number>;
  };
}

export interface MysteryBalloonInstance {
  id: string;
  spawnTime: number;
  position: { x: number; y: number };
  reward: MysteryReward;
  isPopped: boolean;
  poppedTime?: number;
}

export class MysteryBalloonManager {
  private static instance: MysteryBalloonManager;
  
  // Configuration
  private config: MysteryBalloonConfig;
  private rewardDistribution: RewardDistribution = {};
  private rewardTemplates: Record<MysteryRewardType, MysteryReward[]> = {} as Record<MysteryRewardType, MysteryReward[]>;
  
  // State
  private currentLevel: number = 1;
  private balloonsSpawnedSinceLastMystery: number = 0;
  private nextMysterySpawnThreshold: number = 0;
  private activeMysteryBalloons: Map<string, MysteryBalloonInstance> = new Map();
  private sessionMysteryCount: number = 0;
  private totalMysteryRewards: number = 0;

  private constructor() {
    this.config = this.createDefaultConfig();
    this.initializeRewardDistribution();
    this.initializeRewardTemplates();
    this.calculateNextSpawnThreshold();
  }

  public static getInstance(): MysteryBalloonManager {
    if (!MysteryBalloonManager.instance) {
      MysteryBalloonManager.instance = new MysteryBalloonManager();
    }
    return MysteryBalloonManager.instance;
  }

  /**
   * Create default mystery balloon configuration
   */
  private createDefaultConfig(): MysteryBalloonConfig {
    return {
      spawnRate: META_PROGRESSION_CONSTANTS.BASE_MYSTERY_SPAWN_RATE,
      spawnRateProgression: [0.05, 0.06, 0.07, 0.08, 0.09, 0.10, 0.11, 0.12, 0.13, 0.15],
      minSpawnInterval: 8,
      maxSpawnInterval: 25,
      averageSpawnInterval: 15,
      colorScheme: ['#FFD700', '#FF6B6B', '#4ECDC4', '#A374D5'],
      shimmerEffect: true,
      sparkleIntensity: 1.5
    };
  }

  /**
   * Initialize reward type distribution and rarity weights
   */
  private initializeRewardDistribution(): void {
    this.rewardDistribution = {
      coins: {
        probability: 45, // 45% chance for coins
        rarityWeights: {
          common: 60,    // Small coin amounts
          uncommon: 25,  // Medium coin amounts  
          rare: 12,      // Large coin amounts
          epic: 2.5,     // Very large coin amounts
          legendary: 0.5 // Massive coin jackpot
        }
      },
      experience: {
        probability: 25, // 25% chance for XP
        rarityWeights: {
          common: 70,
          uncommon: 20,
          rare: 8,
          epic: 2,
          legendary: 0
        }
      },
      customization: {
        probability: 15, // 15% chance for cosmetics
        rarityWeights: {
          common: 40,
          uncommon: 35,
          rare: 20,
          epic: 4.5,
          legendary: 0.5
        }
      },
      score_multiplier: {
        probability: 10, // 10% chance for score boost
        rarityWeights: {
          common: 50,
          uncommon: 30,
          rare: 15,
          epic: 5,
          legendary: 0
        }
      },
      mystery_box: {
        probability: 5, // 5% chance for meta-mystery (mystery within mystery)
        rarityWeights: {
          common: 0,
          uncommon: 60,
          rare: 30,
          epic: 9,
          legendary: 1
        }
      }
    };
  }

  /**
   * Initialize reward templates for each type and rarity
   */
  private initializeRewardTemplates(): void {
    this.rewardTemplates = {
      coins: [
        // Common coins (60% of coin rewards)
        { id: 'coins_small_1', type: 'coins', value: 25, rarity: 'common', baseDropRate: 0.6, scalingFactor: 1.0, celebrationIntensity: 'subtle', announcementText: '+25 Coins!', particleEffect: 'coin_sparkle' },
        { id: 'coins_small_2', type: 'coins', value: 50, rarity: 'common', baseDropRate: 0.6, scalingFactor: 1.0, celebrationIntensity: 'subtle', announcementText: '+50 Coins!', particleEffect: 'coin_sparkle' },
        
        // Uncommon coins (25% of coin rewards)
        { id: 'coins_medium_1', type: 'coins', value: 100, rarity: 'uncommon', baseDropRate: 0.25, scalingFactor: 1.1, celebrationIntensity: 'medium', announcementText: '+100 Coins!', particleEffect: 'coin_burst' },
        { id: 'coins_medium_2', type: 'coins', value: 150, rarity: 'uncommon', baseDropRate: 0.25, scalingFactor: 1.1, celebrationIntensity: 'medium', announcementText: '+150 Coins!', particleEffect: 'coin_burst' },
        
        // Rare coins (12% of coin rewards)
        { id: 'coins_large_1', type: 'coins', value: 250, rarity: 'rare', baseDropRate: 0.12, scalingFactor: 1.2, celebrationIntensity: 'dramatic', announcementText: '+250 Coins!', particleEffect: 'coin_explosion' },
        { id: 'coins_large_2', type: 'coins', value: 400, rarity: 'rare', baseDropRate: 0.12, scalingFactor: 1.2, celebrationIntensity: 'dramatic', announcementText: '+400 Coins!', particleEffect: 'coin_explosion' },
        
        // Epic coins (2.5% of coin rewards)
        { id: 'coins_huge', type: 'coins', value: 750, rarity: 'epic', baseDropRate: 0.025, scalingFactor: 1.3, celebrationIntensity: 'spectacular', announcementText: '+750 COINS!', particleEffect: 'coin_fountain' },
        
        // Legendary coins (0.5% of coin rewards)
        { id: 'coins_jackpot', type: 'coins', value: 1500, rarity: 'legendary', baseDropRate: 0.005, scalingFactor: 1.5, celebrationIntensity: 'spectacular', announcementText: 'JACKPOT! +1500 COINS!', particleEffect: 'coin_jackpot' }
      ],

      experience: [
        { id: 'xp_small', type: 'experience', value: 50, rarity: 'common', baseDropRate: 0.7, scalingFactor: 1.0, celebrationIntensity: 'subtle', announcementText: '+50 XP', particleEffect: 'xp_glow' },
        { id: 'xp_medium', type: 'experience', value: 100, rarity: 'uncommon', baseDropRate: 0.2, scalingFactor: 1.1, celebrationIntensity: 'medium', announcementText: '+100 XP', particleEffect: 'xp_burst' },
        { id: 'xp_large', type: 'experience', value: 200, rarity: 'rare', baseDropRate: 0.08, scalingFactor: 1.2, celebrationIntensity: 'dramatic', announcementText: '+200 XP!', particleEffect: 'xp_explosion' },
        { id: 'xp_huge', type: 'experience', value: 500, rarity: 'epic', baseDropRate: 0.02, scalingFactor: 1.3, celebrationIntensity: 'spectacular', announcementText: '+500 XP!', particleEffect: 'xp_fountain' }
      ],

      customization: [
        { id: 'color_unlock', type: 'customization', value: 'random_color', rarity: 'uncommon', baseDropRate: 0.35, scalingFactor: 1.0, celebrationIntensity: 'medium', announcementText: 'New Color Unlocked!', particleEffect: 'rainbow_burst' },
        { id: 'trail_unlock', type: 'customization', value: 'random_trail', rarity: 'rare', baseDropRate: 0.2, scalingFactor: 1.0, celebrationIntensity: 'dramatic', announcementText: 'New Trail Unlocked!', particleEffect: 'trail_sparkle' },
        { id: 'effect_unlock', type: 'customization', value: 'random_effect', rarity: 'epic', baseDropRate: 0.045, scalingFactor: 1.0, celebrationIntensity: 'spectacular', announcementText: 'Special Effect Unlocked!', particleEffect: 'effect_burst' },
        { id: 'legendary_unlock', type: 'customization', value: 'legendary_cosmetic', rarity: 'legendary', baseDropRate: 0.005, scalingFactor: 1.0, celebrationIntensity: 'spectacular', announcementText: 'LEGENDARY COSMETIC!', particleEffect: 'legendary_explosion' }
      ],

      score_multiplier: [
        { id: 'score_2x', type: 'score_multiplier', value: 2, rarity: 'common', baseDropRate: 0.5, scalingFactor: 1.0, celebrationIntensity: 'medium', announcementText: '2x Score Boost!', particleEffect: 'score_glow' },
        { id: 'score_3x', type: 'score_multiplier', value: 3, rarity: 'uncommon', baseDropRate: 0.3, scalingFactor: 1.0, celebrationIntensity: 'dramatic', announcementText: '3x Score Boost!', particleEffect: 'score_burst' },
        { id: 'score_5x', type: 'score_multiplier', value: 5, rarity: 'rare', baseDropRate: 0.15, scalingFactor: 1.0, celebrationIntensity: 'spectacular', announcementText: '5x SCORE BOOST!', particleEffect: 'score_explosion' },
        { id: 'score_10x', type: 'score_multiplier', value: 10, rarity: 'epic', baseDropRate: 0.05, scalingFactor: 1.0, celebrationIntensity: 'spectacular', announcementText: '10x MEGA BOOST!', particleEffect: 'score_mega' }
      ],

      mystery_box: [
        { id: 'mystery_common', type: 'mystery_box', value: 'common_box', rarity: 'uncommon', baseDropRate: 0.6, scalingFactor: 1.0, celebrationIntensity: 'medium', announcementText: 'Mystery Box!', particleEffect: 'mystery_glow' },
        { id: 'mystery_rare', type: 'mystery_box', value: 'rare_box', rarity: 'rare', baseDropRate: 0.3, scalingFactor: 1.0, celebrationIntensity: 'dramatic', announcementText: 'Rare Mystery Box!', particleEffect: 'mystery_burst' },
        { id: 'mystery_epic', type: 'mystery_box', value: 'epic_box', rarity: 'epic', baseDropRate: 0.09, scalingFactor: 1.0, celebrationIntensity: 'spectacular', announcementText: 'Epic Mystery Box!', particleEffect: 'mystery_explosion' },
        { id: 'mystery_legendary', type: 'mystery_box', value: 'legendary_box', rarity: 'legendary', baseDropRate: 0.01, scalingFactor: 1.0, celebrationIntensity: 'spectacular', announcementText: 'LEGENDARY MYSTERY!', particleEffect: 'mystery_legendary' }
      ],

      power_boost: [], // Will be implemented later
      achievement_progress: [] // Will be implemented later
    };
  }

  /**
   * Update current level (affects spawn rates and rewards)
   */
  public setCurrentLevel(level: number): void {
    this.currentLevel = level;
  }

  /**
   * Called when a regular balloon is spawned - tracks spawn intervals
   */
  public onBalloonSpawned(): void {
    this.balloonsSpawnedSinceLastMystery++;
    
    // Check if we should spawn a mystery balloon
    if (this.balloonsSpawnedSinceLastMystery >= this.nextMysterySpawnThreshold) {
      this.spawnMysteryBalloon();
    }
  }

  /**
   * Spawn a mystery balloon with random reward
   */
  private spawnMysteryBalloon(): void {
    const reward = this.generateRandomReward();
    const position = this.generateSpawnPosition();
    
    const mysteryBalloon: MysteryBalloonInstance = {
      id: `mystery_${nanoid(8)}`,
      spawnTime: Date.now(),
      position,
      reward,
      isPopped: false
    };

    this.activeMysteryBalloons.set(mysteryBalloon.id, mysteryBalloon);
    this.sessionMysteryCount++;
    
    // Reset counter and calculate next threshold
    this.balloonsSpawnedSinceLastMystery = 0;
    this.calculateNextSpawnThreshold();

    // Track analytics
    this.trackMysteryBalloonSpawn(mysteryBalloon);
  }

  /**
   * Generate a random reward based on distribution and rarity weights
   */
  private generateRandomReward(): MysteryReward {
    // Select reward type based on distribution
    const rewardType = this.selectRewardType();
    
    // Select rarity based on weights for this type
    const rarity = this.selectRarity(rewardType);
    
    // Get templates for this type and rarity
    const templates = this.rewardTemplates[rewardType].filter(t => t.rarity === rarity);
    if (templates.length === 0) {
      // Fallback to common coins if no templates found
      return this.rewardTemplates.coins[0];
    }
    
    // Select random template and apply level scaling
    const template = templates[Math.floor(Math.random() * templates.length)];
    return this.scaleRewardForLevel(template);
  }

  /**
   * Select reward type based on probability distribution
   */
  private selectRewardType(): MysteryRewardType {
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (const [type, config] of Object.entries(this.rewardDistribution)) {
      cumulative += config.probability;
      if (random <= cumulative) {
        return type as MysteryRewardType;
      }
    }
    
    return 'coins'; // Fallback
  }

  /**
   * Select rarity based on weights for reward type
   */
  private selectRarity(rewardType: MysteryRewardType): RewardRarity {
    const weights = this.rewardDistribution[rewardType]?.rarityWeights;
    if (!weights) return 'common';
    
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    const random = Math.random() * totalWeight;
    let cumulative = 0;
    
    for (const [rarity, weight] of Object.entries(weights)) {
      cumulative += weight;
      if (random <= cumulative) {
        return rarity as RewardRarity;
      }
    }
    
    return 'common'; // Fallback
  }

  /**
   * Scale reward value based on current level
   */
  private scaleRewardForLevel(template: MysteryReward): MysteryReward {
    const levelMultiplier = 1 + ((this.currentLevel - 1) * 0.1); // 10% increase per level
    const scaledValue = typeof template.value === 'number' 
      ? Math.floor(template.value * levelMultiplier * template.scalingFactor)
      : template.value;
    
    return {
      ...template,
      value: scaledValue
    };
  }

  /**
   * Generate random spawn position for mystery balloon
   */
  private generateSpawnPosition(): { x: number; y: number } {
    // Mystery balloons spawn at top of screen with random X position
    return {
      x: 0.1 + Math.random() * 0.8, // 10% to 90% across screen width
      y: 0.1 // 10% from top
    };
  }

  /**
   * Calculate next mystery balloon spawn threshold using variable ratio schedule
   */
  private calculateNextSpawnThreshold(): void {
    const { minSpawnInterval, maxSpawnInterval, averageSpawnInterval } = this.config;
    
    // Use normal distribution around average for more natural feeling
    const range = maxSpawnInterval - minSpawnInterval;
    const normalized = this.gaussianRandom();
    const scaled = normalized * range + minSpawnInterval;
    
    // Clamp to min/max bounds
    this.nextMysterySpawnThreshold = Math.round(
      Math.max(minSpawnInterval, Math.min(maxSpawnInterval, scaled))
    );
  }

  /**
   * Generate gaussian random number (Box-Muller transform)
   */
  private gaussianRandom(): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    
    // Normalize to 0-1 range around 0.5
    return Math.max(0, Math.min(1, (z0 * 0.15) + 0.5));
  }

  /**
   * Handle mystery balloon being popped
   */
  public onMysteryBalloonPopped(balloonId: string): MysteryReward | null {
    const mysteryBalloon = this.activeMysteryBalloons.get(balloonId);
    if (!mysteryBalloon || mysteryBalloon.isPopped) {
      return null;
    }

    mysteryBalloon.isPopped = true;
    mysteryBalloon.poppedTime = Date.now();
    this.totalMysteryRewards++;

    // Track analytics
    this.trackMysteryBalloonPopped(mysteryBalloon);

    return mysteryBalloon.reward;
  }

  /**
   * Get all active mystery balloons
   */
  public getActiveMysteryBalloons(): MysteryBalloonInstance[] {
    return Array.from(this.activeMysteryBalloons.values()).filter(balloon => !balloon.isPopped);
  }

  /**
   * Clean up old mystery balloons
   */
  public cleanupOldBalloons(): void {
    const now = Date.now();
    const maxAge = 30000; // 30 seconds
    
    for (const [id, balloon] of this.activeMysteryBalloons.entries()) {
      if (now - balloon.spawnTime > maxAge) {
        this.activeMysteryBalloons.delete(id);
      }
    }
  }

  /**
   * Get session statistics
   */
  public getSessionStats(): {
    mysteryBalloonsSpawned: number;
    mysteryRewardsCollected: number;
    nextSpawnIn: number;
  } {
    return {
      mysteryBalloonsSpawned: this.sessionMysteryCount,
      mysteryRewardsCollected: this.totalMysteryRewards,
      nextSpawnIn: this.nextMysterySpawnThreshold - this.balloonsSpawnedSinceLastMystery
    };
  }

  /**
   * Track mystery balloon spawn for analytics
   */
  private trackMysteryBalloonSpawn(balloon: MysteryBalloonInstance): void {
    console.log('Mystery balloon spawned:', {
      id: balloon.id,
      rewardType: balloon.reward.type,
      rarity: balloon.reward.rarity,
      value: balloon.reward.value,
      level: this.currentLevel,
      sessionCount: this.sessionMysteryCount
    });
  }

  /**
   * Track mystery balloon popped for analytics
   */
  private trackMysteryBalloonPopped(balloon: MysteryBalloonInstance): void {
    const timeToCollect = (balloon.poppedTime || 0) - balloon.spawnTime;
    
    console.log('Mystery balloon popped:', {
      id: balloon.id,
      rewardType: balloon.reward.type,
      rarity: balloon.reward.rarity,
      value: balloon.reward.value,
      timeToCollect,
      level: this.currentLevel,
      totalRewards: this.totalMysteryRewards
    });
  }

  /**
   * Reset session data (for new game/level)
   */
  public resetSession(): void {
    this.balloonsSpawnedSinceLastMystery = 0;
    this.calculateNextSpawnThreshold();
    this.activeMysteryBalloons.clear();
    this.sessionMysteryCount = 0;
  }

  /**
   * Update configuration (for remote config)
   */
  public updateConfig(newConfig: Partial<MysteryBalloonConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export singleton instance
export const mysteryBalloonManager = MysteryBalloonManager.getInstance();