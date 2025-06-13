import { trackComboEvent } from '../utils/analytics';

export interface ComboData {
  count: number;
  multiplier: number;
  baseMultiplier: number;
  accuracyBonus: number;
  timingBonus: number;
  typeBonus: number;
  maxCombo: number;
  currentStreak: number;
  lastHitTime: number;
  comboStartTime: number;
  comboType: ComboType;
  achievements: ComboAchievement[];
}

export interface ComboHit {
  timestamp: number;
  targetType: 'small' | 'medium' | 'large' | 'special';
  accuracy: number; // 0-1, how close to center
  timingWindow: 'perfect' | 'great' | 'good' | 'normal';
  consecutiveHit: boolean;
  distanceFromPrevious?: number;
}

export interface ComboType {
  id: string;
  name: string;
  description: string;
  multiplier: number;
  requirements: ComboRequirement[];
  visualEffect: string;
  soundEffect: string;
}

export interface ComboRequirement {
  type: 'accuracy' | 'timing' | 'target_type' | 'speed' | 'distance';
  threshold: number;
  consecutive?: number;
}

export interface ComboAchievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: number;
  icon: string;
  rarity: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
}

export interface ComboVisualEffect {
  type: 'particle' | 'screen_shake' | 'color_shift' | 'zoom' | 'trail';
  intensity: number;
  duration: number;
  color?: string;
  animation?: string;
}

const COMBO_TYPES: ComboType[] = [
  {
    id: 'rapid_fire',
    name: 'Rapid Fire',
    description: 'Hit 5 targets within 3 seconds',
    multiplier: 1.5,
    requirements: [{ type: 'speed', threshold: 5, consecutive: 5 }],
    visualEffect: 'rapid_fire_effect',
    soundEffect: 'rapid_fire_sound',
  },
  {
    id: 'sharpshooter',
    name: 'Sharpshooter',
    description: 'Hit 3 targets with perfect accuracy',
    multiplier: 2.0,
    requirements: [{ type: 'accuracy', threshold: 0.95, consecutive: 3 }],
    visualEffect: 'precision_effect',
    soundEffect: 'precision_sound',
  },
  {
    id: 'giant_slayer',
    name: 'Giant Slayer',
    description: 'Hit 3 large balloons in a row',
    multiplier: 1.8,
    requirements: [
      { type: 'target_type', threshold: 1, consecutive: 3 }, // Large balloons
    ],
    visualEffect: 'giant_slayer_effect',
    soundEffect: 'giant_slayer_sound',
  },
  {
    id: 'perfect_timing',
    name: 'Perfect Timing',
    description: 'Hit 4 targets with perfect timing',
    multiplier: 2.2,
    requirements: [
      { type: 'timing', threshold: 1, consecutive: 4 }, // Perfect timing
    ],
    visualEffect: 'timing_effect',
    soundEffect: 'timing_sound',
  },
  {
    id: 'crowd_pleaser',
    name: 'Crowd Pleaser',
    description: 'Hit 10 small balloons consecutively',
    multiplier: 2.5,
    requirements: [
      { type: 'target_type', threshold: 0, consecutive: 10 }, // Small balloons
    ],
    visualEffect: 'crowd_pleaser_effect',
    soundEffect: 'crowd_pleaser_sound',
  },
  {
    id: 'distance_master',
    name: 'Distance Master',
    description: 'Hit targets from varying distances',
    multiplier: 1.7,
    requirements: [{ type: 'distance', threshold: 200, consecutive: 5 }],
    visualEffect: 'distance_effect',
    soundEffect: 'distance_sound',
  },
];

const COMBO_ACHIEVEMENTS: ComboAchievement[] = [
  {
    id: 'first_combo',
    name: 'First Combo',
    description: 'Achieve your first combo',
    unlocked: false,
    icon: '🎯',
    rarity: 'bronze',
  },
  {
    id: 'combo_master',
    name: 'Combo Master',
    description: 'Achieve a 50x combo',
    unlocked: false,
    icon: '⚡',
    rarity: 'gold',
  },
  {
    id: 'unstoppable',
    name: 'Unstoppable',
    description: 'Achieve a 100x combo',
    unlocked: false,
    icon: '🔥',
    rarity: 'platinum',
  },
  {
    id: 'legend',
    name: 'Legend',
    description: 'Achieve a 200x combo',
    unlocked: false,
    icon: '💎',
    rarity: 'diamond',
  },
  {
    id: 'rapid_specialist',
    name: 'Rapid Fire Specialist',
    description: 'Achieve 10 Rapid Fire combos',
    unlocked: false,
    icon: '🚀',
    rarity: 'silver',
  },
  {
    id: 'precision_expert',
    name: 'Precision Expert',
    description: 'Achieve 5 Sharpshooter combos',
    unlocked: false,
    icon: '🎪',
    rarity: 'gold',
  },
];

class ComboSystem {
  private comboData: ComboData;
  private hitHistory: ComboHit[] = [];
  private activeEffects: ComboVisualEffect[] = [];
  private callbacks: {
    onComboChange?: (combo: ComboData) => void;
    onComboBreak?: (finalCombo: number, reason: string) => void;
    onComboAchievement?: (achievement: ComboAchievement) => void;
    onVisualEffect?: (effect: ComboVisualEffect) => void;
  } = {};

  constructor() {
    this.comboData = this.initializeComboData();
  }

  private initializeComboData(): ComboData {
    return {
      count: 0,
      multiplier: 1.0,
      baseMultiplier: 1.0,
      accuracyBonus: 0,
      timingBonus: 0,
      typeBonus: 0,
      maxCombo: 0,
      currentStreak: 0,
      lastHitTime: 0,
      comboStartTime: 0,
      comboType: COMBO_TYPES[0],
      achievements: [...COMBO_ACHIEVEMENTS],
    };
  }

  public setCallbacks(callbacks: {
    onComboChange?: (combo: ComboData) => void;
    onComboBreak?: (finalCombo: number, reason: string) => void;
    onComboAchievement?: (achievement: ComboAchievement) => void;
    onVisualEffect?: (effect: ComboVisualEffect) => void;
  }) {
    this.callbacks = callbacks;
  }

  public registerHit(hit: ComboHit): { scoreMultiplier: number; comboType?: ComboType } {
    const now = Date.now();

    // Check if combo should break due to time gap
    const maxTimeBetweenHits = 3000; // 3 seconds
    if (this.comboData.count > 0 && now - this.comboData.lastHitTime > maxTimeBetweenHits) {
      this.breakCombo('time_gap');
    }

    // Add hit to history
    this.hitHistory.push(hit);
    if (this.hitHistory.length > 20) {
      this.hitHistory.shift(); // Keep only recent hits
    }

    // Update combo data
    this.comboData.count++;
    this.comboData.currentStreak++;
    this.comboData.lastHitTime = now;

    if (this.comboData.count === 1) {
      this.comboData.comboStartTime = now;
    }

    // Calculate multiplier components
    this.updateMultiplierComponents(hit);

    // Check for combo type triggers
    const triggeredComboType = this.checkComboTypes();
    if (triggeredComboType) {
      this.comboData.comboType = triggeredComboType;
      this.triggerVisualEffect(this.getComboVisualEffect(triggeredComboType));
    }

    // Update max combo
    if (this.comboData.count > this.comboData.maxCombo) {
      this.comboData.maxCombo = this.comboData.count;
    }

    // Check achievements
    this.checkAchievements();

    // Notify callbacks
    if (this.callbacks.onComboChange) {
      this.callbacks.onComboChange(this.comboData);
    }

    // Track analytics
    trackComboEvent({
      comboCount: this.comboData.count,
      multiplier: this.comboData.multiplier,
      comboType: this.comboData.comboType.id,
      accuracy: hit.accuracy,
      timing: hit.timingWindow,
      timestamp: now,
    });

    return {
      scoreMultiplier: this.comboData.multiplier,
      comboType: triggeredComboType || undefined,
    };
  }

  private updateMultiplierComponents(hit: ComboHit) {
    // Base multiplier increases with combo count
    this.comboData.baseMultiplier = 1.0 + Math.min(this.comboData.count * 0.1, 5.0); // Max 6x from count

    // Accuracy bonus (0-50% bonus)
    this.comboData.accuracyBonus = hit.accuracy * 0.5;

    // Timing bonus
    const timingBonuses = {
      perfect: 0.5,
      great: 0.3,
      good: 0.1,
      normal: 0,
    };
    this.comboData.timingBonus = timingBonuses[hit.timingWindow];

    // Target type bonus
    const typeBonuses = {
      small: 0.1,
      medium: 0.2,
      large: 0.3,
      special: 0.5,
    };
    this.comboData.typeBonus = typeBonuses[hit.targetType];

    // Calculate total multiplier
    this.comboData.multiplier =
      this.comboData.baseMultiplier +
      this.comboData.accuracyBonus +
      this.comboData.timingBonus +
      this.comboData.typeBonus;

    // Apply combo type multiplier if active
    if (this.comboData.comboType) {
      this.comboData.multiplier *= this.comboData.comboType.multiplier;
    }
  }

  private checkComboTypes(): ComboType | null {
    if (this.hitHistory.length < 3) return null;

    for (const comboType of COMBO_TYPES) {
      if (this.meetsComboRequirements(comboType)) {
        return comboType;
      }
    }

    return null;
  }

  private meetsComboRequirements(comboType: ComboType): boolean {
    for (const requirement of comboType.requirements) {
      if (!this.checkRequirement(requirement)) {
        return false;
      }
    }
    return true;
  }

  private checkRequirement(requirement: ComboRequirement): boolean {
    const recentHits = this.hitHistory.slice(-(requirement.consecutive || 1));

    switch (requirement.type) {
      case 'accuracy':
        return recentHits.every(hit => hit.accuracy >= requirement.threshold);

      case 'timing':
        const timingValues = { perfect: 1, great: 0.8, good: 0.6, normal: 0.4 };
        return recentHits.every(hit => timingValues[hit.timingWindow] >= requirement.threshold);

      case 'target_type':
        const typeValues = { small: 0, medium: 1, large: 2, special: 3 };
        const targetRequirement = requirement.threshold;
        return recentHits.every(hit => typeValues[hit.targetType] === targetRequirement);

      case 'speed':
        if (recentHits.length < 2) return false;
        const timeSpan = recentHits[recentHits.length - 1].timestamp - recentHits[0].timestamp;
        const hitsPerSecond = recentHits.length / (timeSpan / 1000);
        return hitsPerSecond >= requirement.threshold;

      case 'distance':
        return recentHits.every(hit => (hit.distanceFromPrevious || 0) >= requirement.threshold);

      default:
        return false;
    }
  }

  private checkAchievements() {
    this.comboData.achievements.forEach(achievement => {
      if (achievement.unlocked) return;

      let shouldUnlock = false;

      switch (achievement.id) {
        case 'first_combo':
          shouldUnlock = this.comboData.count >= 5;
          break;
        case 'combo_master':
          shouldUnlock = this.comboData.count >= 50;
          break;
        case 'unstoppable':
          shouldUnlock = this.comboData.count >= 100;
          break;
        case 'legend':
          shouldUnlock = this.comboData.count >= 200;
          break;
        // Add more achievement logic here
      }

      if (shouldUnlock) {
        achievement.unlocked = true;
        achievement.unlockedAt = Date.now();

        if (this.callbacks.onComboAchievement) {
          this.callbacks.onComboAchievement(achievement);
        }
      }
    });
  }

  private getComboVisualEffect(comboType: ComboType): ComboVisualEffect {
    const effectMappings: Record<string, ComboVisualEffect> = {
      rapid_fire_effect: {
        type: 'particle',
        intensity: 0.8,
        duration: 1000,
        color: '#FF6B6B',
        animation: 'burst',
      },
      precision_effect: {
        type: 'color_shift',
        intensity: 1.0,
        duration: 1500,
        color: '#4ECDC4',
        animation: 'pulse',
      },
      giant_slayer_effect: {
        type: 'screen_shake',
        intensity: 0.6,
        duration: 800,
        animation: 'impact',
      },
      timing_effect: {
        type: 'zoom',
        intensity: 0.3,
        duration: 1200,
        color: '#FFD93D',
        animation: 'focus',
      },
      crowd_pleaser_effect: {
        type: 'trail',
        intensity: 1.0,
        duration: 2000,
        color: '#FF9FF3',
        animation: 'celebration',
      },
      distance_effect: {
        type: 'particle',
        intensity: 0.7,
        duration: 1000,
        color: '#54A0FF',
        animation: 'spread',
      },
    };

    return (
      effectMappings[comboType.visualEffect] || {
        type: 'particle',
        intensity: 0.5,
        duration: 1000,
      }
    );
  }

  private triggerVisualEffect(effect: ComboVisualEffect) {
    this.activeEffects.push(effect);

    if (this.callbacks.onVisualEffect) {
      this.callbacks.onVisualEffect(effect);
    }

    // Remove effect after duration
    setTimeout(() => {
      const index = this.activeEffects.indexOf(effect);
      if (index > -1) {
        this.activeEffects.splice(index, 1);
      }
    }, effect.duration);
  }

  public breakCombo(reason: string = 'miss') {
    const finalCombo = this.comboData.count;

    if (finalCombo > 0) {
      // Track combo break
      trackComboEvent({
        comboCount: finalCombo,
        multiplier: this.comboData.multiplier,
        comboType: this.comboData.comboType.id,
        action: 'combo_break',
        reason,
        timestamp: Date.now(),
      });

      if (this.callbacks.onComboBreak) {
        this.callbacks.onComboBreak(finalCombo, reason);
      }
    }

    // Reset combo data but preserve achievements and max combo
    const maxCombo = this.comboData.maxCombo;
    const achievements = this.comboData.achievements;

    this.comboData = this.initializeComboData();
    this.comboData.maxCombo = maxCombo;
    this.comboData.achievements = achievements;

    this.hitHistory = [];
    this.activeEffects = [];
  }

  public getCurrentCombo(): ComboData {
    return { ...this.comboData };
  }

  public getComboTypes(): ComboType[] {
    return [...COMBO_TYPES];
  }

  public getActiveEffects(): ComboVisualEffect[] {
    return [...this.activeEffects];
  }

  public getTimingWindow(reactionTime: number): 'perfect' | 'great' | 'good' | 'normal' {
    if (reactionTime <= 100) return 'perfect';
    if (reactionTime <= 200) return 'great';
    if (reactionTime <= 400) return 'good';
    return 'normal';
  }

  public calculateAccuracy(
    targetCenter: { x: number; y: number },
    hitPoint: { x: number; y: number },
    targetRadius: number
  ): number {
    const distance = Math.sqrt(
      Math.pow(hitPoint.x - targetCenter.x, 2) + Math.pow(hitPoint.y - targetCenter.y, 2)
    );

    const accuracy = Math.max(0, 1 - distance / targetRadius);
    return Math.round(accuracy * 100) / 100; // Round to 2 decimal places
  }

  public reset() {
    this.comboData = this.initializeComboData();
    this.hitHistory = [];
    this.activeEffects = [];
  }
}

export default ComboSystem;
