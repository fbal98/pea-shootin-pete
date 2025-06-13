import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackAchievementUnlocked, trackMicroProgress } from '../utils/analytics';
import { useEconomyStore } from '../store/economyStore';

export interface MicroAchievement {
  id: string;
  category: 'gameplay' | 'progression' | 'social' | 'collection' | 'mastery' | 'special';
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  
  // Progress tracking
  type: 'counter' | 'milestone' | 'streak' | 'condition' | 'collection';
  target: number;
  current: number;
  completed: boolean;
  completedAt?: number;
  
  // Rewards
  rewards: AchievementReward[];
  
  // Requirements
  requirements?: {
    level?: number;
    prerequisiteAchievements?: string[];
    timeFrame?: number; // Time limit in milliseconds
    conditions?: string[]; // Special conditions
  };
  
  // Visual & UX
  hidden: boolean; // Hidden until discovered
  secret: boolean; // Secret achievement
  difficulty: 1 | 2 | 3 | 4 | 5;
  estimatedTime: string; // "5 minutes", "1 hour", etc.
  
  // Metadata
  createdAt: number;
  tags: string[];
  shareTemplate?: string; // Custom share message template
}

export interface AchievementReward {
  type: 'currency' | 'item' | 'title' | 'skin' | 'booster' | 'experience';
  amount?: number;
  currency?: 'coins' | 'gems' | 'energy' | 'tokens';
  itemId?: string;
  title?: string;
  experience?: number;
}

export interface AchievementProgress {
  achievementId: string;
  progress: number;
  milestones: number[]; // Progress milestones hit
  lastUpdated: number;
  streakCount?: number;
  startTime?: number; // For time-based achievements
}

export interface AchievementToast {
  achievement: MicroAchievement;
  progress?: AchievementProgress;
  type: 'unlocked' | 'progress' | 'milestone';
  timestamp: number;
}

export interface AchievementChain {
  id: string;
  name: string;
  description: string;
  achievementIds: string[];
  currentIndex: number;
  completed: boolean;
  chainReward?: AchievementReward;
}

class MicroAchievementSystem {
  private static instance: MicroAchievementSystem;
  private achievements: Map<string, MicroAchievement> = new Map();
  private progress: Map<string, AchievementProgress> = new Map();
  private chains: Map<string, AchievementChain> = new Map();
  private recentToasts: AchievementToast[] = [];
  private callbacks: {
    onAchievementUnlocked?: (achievement: MicroAchievement) => void;
    onProgressUpdate?: (achievement: MicroAchievement, progress: AchievementProgress) => void;
    onMilestoneReached?: (achievement: MicroAchievement, milestone: number) => void;
    onToastRequest?: (toast: AchievementToast) => void;
  } = {};

  private constructor() {
    this.loadAchievements();
    this.initializeDefaultAchievements();
  }

  public static getInstance(): MicroAchievementSystem {
    if (!MicroAchievementSystem.instance) {
      MicroAchievementSystem.instance = new MicroAchievementSystem();
    }
    return MicroAchievementSystem.instance;
  }

  private async loadAchievements() {
    try {
      const achievementsData = await AsyncStorage.getItem('micro-achievements');
      const progressData = await AsyncStorage.getItem('achievement-progress');
      const chainsData = await AsyncStorage.getItem('achievement-chains');

      if (achievementsData) {
        const achievements = JSON.parse(achievementsData);
        this.achievements = new Map(achievements);
      }

      if (progressData) {
        const progress = JSON.parse(progressData);
        this.progress = new Map(progress);
      }

      if (chainsData) {
        const chains = JSON.parse(chainsData);
        this.chains = new Map(chains);
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  }

  private async saveAchievements() {
    try {
      await AsyncStorage.setItem('micro-achievements', JSON.stringify(Array.from(this.achievements.entries())));
      await AsyncStorage.setItem('achievement-progress', JSON.stringify(Array.from(this.progress.entries())));
      await AsyncStorage.setItem('achievement-chains', JSON.stringify(Array.from(this.chains.entries())));
    } catch (error) {
      console.error('Error saving achievements:', error);
    }
  }

  private initializeDefaultAchievements() {
    const defaultAchievements: MicroAchievement[] = [
      // Gameplay achievements
      {
        id: 'first_shot',
        category: 'gameplay',
        name: 'First Shot',
        description: 'Fire your first projectile',
        icon: '🎯',
        rarity: 'common',
        type: 'counter',
        target: 1,
        current: 0,
        completed: false,
        rewards: [{ type: 'currency', currency: 'coins', amount: 50 }],
        hidden: false,
        secret: false,
        difficulty: 1,
        estimatedTime: '1 second',
        createdAt: Date.now(),
        tags: ['tutorial', 'first_time'],
      },
      {
        id: 'balloon_buster',
        name: 'Balloon Buster',
        description: 'Pop 100 balloons',
        category: 'gameplay',
        icon: '🎈',
        rarity: 'common',
        type: 'counter',
        target: 100,
        current: 0,
        completed: false,
        rewards: [{ type: 'currency', currency: 'coins', amount: 200 }],
        hidden: false,
        secret: false,
        difficulty: 2,
        estimatedTime: '10 minutes',
        createdAt: Date.now(),
        tags: ['basic', 'popping'],
      },
      {
        id: 'sharpshooter',
        name: 'Sharpshooter',
        description: 'Hit 10 balloons with 95%+ accuracy',
        category: 'mastery',
        icon: '🏹',
        rarity: 'rare',
        type: 'counter',
        target: 10,
        current: 0,
        completed: false,
        rewards: [
          { type: 'currency', currency: 'gems', amount: 25 },
          { type: 'title', title: 'Sharpshooter' },
        ],
        hidden: false,
        secret: false,
        difficulty: 3,
        estimatedTime: '15 minutes',
        createdAt: Date.now(),
        tags: ['precision', 'skill'],
      },
      {
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Complete a level in under 30 seconds',
        category: 'mastery',
        icon: '⚡',
        rarity: 'epic',
        type: 'condition',
        target: 1,
        current: 0,
        completed: false,
        rewards: [
          { type: 'currency', currency: 'gems', amount: 50 },
          { type: 'item', itemId: 'speed_booster' },
        ],
        hidden: false,
        secret: false,
        difficulty: 4,
        estimatedTime: '30 seconds',
        createdAt: Date.now(),
        tags: ['speed', 'challenge'],
      },
      {
        id: 'combo_king',
        name: 'Combo King',
        description: 'Achieve a 50x combo',
        category: 'mastery',
        icon: '👑',
        rarity: 'legendary',
        type: 'milestone',
        target: 50,
        current: 0,
        completed: false,
        rewards: [
          { type: 'currency', currency: 'gems', amount: 100 },
          { type: 'skin', itemId: 'pete_combo_king' },
          { type: 'title', title: 'Combo King' },
        ],
        hidden: false,
        secret: false,
        difficulty: 5,
        estimatedTime: '1 hour',
        createdAt: Date.now(),
        tags: ['combo', 'mastery'],
      },
      
      // Social achievements
      {
        id: 'social_butterfly',
        name: 'Social Butterfly',
        description: 'Share your score 5 times',
        category: 'social',
        icon: '🦋',
        rarity: 'rare',
        type: 'counter',
        target: 5,
        current: 0,
        completed: false,
        rewards: [
          { type: 'currency', currency: 'gems', amount: 30 },
          { type: 'title', title: 'Social Butterfly' },
        ],
        hidden: false,
        secret: false,
        difficulty: 2,
        estimatedTime: '5 minutes',
        createdAt: Date.now(),
        tags: ['social', 'sharing'],
      },
      
      // Collection achievements
      {
        id: 'skin_collector',
        name: 'Skin Collector',
        description: 'Collect 5 different Pete skins',
        category: 'collection',
        icon: '👕',
        rarity: 'epic',
        type: 'collection',
        target: 5,
        current: 0,
        completed: false,
        rewards: [
          { type: 'currency', currency: 'gems', amount: 75 },
          { type: 'skin', itemId: 'pete_collector' },
        ],
        hidden: false,
        secret: false,
        difficulty: 3,
        estimatedTime: '2 hours',
        createdAt: Date.now(),
        tags: ['collection', 'customization'],
      },
      
      // Progression achievements
      {
        id: 'level_master',
        name: 'Level Master',
        description: 'Complete 25 levels',
        category: 'progression',
        icon: '🏆',
        rarity: 'rare',
        type: 'counter',
        target: 25,
        current: 0,
        completed: false,
        rewards: [
          { type: 'currency', currency: 'coins', amount: 1000 },
          { type: 'experience', experience: 500 },
        ],
        hidden: false,
        secret: false,
        difficulty: 3,
        estimatedTime: '2 hours',
        createdAt: Date.now(),
        tags: ['progression', 'levels'],
      },
      
      // Special achievements
      {
        id: 'perfect_game',
        name: 'Perfect Game',
        description: 'Complete a level without missing a single shot',
        category: 'special',
        icon: '💎',
        rarity: 'mythic',
        type: 'condition',
        target: 1,
        current: 0,
        completed: false,
        rewards: [
          { type: 'currency', currency: 'gems', amount: 200 },
          { type: 'skin', itemId: 'pete_perfect' },
          { type: 'title', title: 'Perfectionist' },
        ],
        hidden: true,
        secret: true,
        difficulty: 5,
        estimatedTime: 'Unknown',
        createdAt: Date.now(),
        tags: ['perfect', 'secret', 'mastery'],
      },
      
      // Streak achievements
      {
        id: 'daily_player',
        name: 'Daily Player',
        description: 'Play the game for 7 consecutive days',
        category: 'progression',
        icon: '📅',
        rarity: 'rare',
        type: 'streak',
        target: 7,
        current: 0,
        completed: false,
        rewards: [
          { type: 'currency', currency: 'gems', amount: 100 },
          { type: 'item', itemId: 'loyalty_booster_pack' },
        ],
        hidden: false,
        secret: false,
        difficulty: 2,
        estimatedTime: '7 days',
        createdAt: Date.now(),
        tags: ['daily', 'loyalty', 'streak'],
      },
    ];

    // Add achievements if they don't exist
    defaultAchievements.forEach(achievement => {
      if (!this.achievements.has(achievement.id)) {
        this.achievements.set(achievement.id, achievement);
        this.progress.set(achievement.id, {
          achievementId: achievement.id,
          progress: 0,
          milestones: [],
          lastUpdated: Date.now(),
        });
      }
    });

    // Initialize achievement chains
    this.initializeAchievementChains();
    this.saveAchievements();
  }

  private initializeAchievementChains() {
    const chains: AchievementChain[] = [
      {
        id: 'balloon_mastery',
        name: 'Balloon Mastery',
        description: 'Master the art of balloon popping',
        achievementIds: ['first_shot', 'balloon_buster', 'sharpshooter', 'combo_king'],
        currentIndex: 0,
        completed: false,
        chainReward: {
          type: 'skin',
          itemId: 'pete_balloon_master',
        },
      },
      {
        id: 'social_influencer',
        name: 'Social Influencer',
        description: 'Become a social media sensation',
        achievementIds: ['social_butterfly'],
        currentIndex: 0,
        completed: false,
        chainReward: {
          type: 'title',
          title: 'Influencer',
        },
      },
    ];

    chains.forEach(chain => {
      if (!this.chains.has(chain.id)) {
        this.chains.set(chain.id, chain);
      }
    });
  }

  public setCallbacks(callbacks: {
    onAchievementUnlocked?: (achievement: MicroAchievement) => void;
    onProgressUpdate?: (achievement: MicroAchievement, progress: AchievementProgress) => void;
    onMilestoneReached?: (achievement: MicroAchievement, milestone: number) => void;
    onToastRequest?: (toast: AchievementToast) => void;
  }) {
    this.callbacks = callbacks;
  }

  // Core tracking methods
  public trackAction(action: string, data: Record<string, any> = {}) {
    // Find achievements that should be updated by this action
    this.achievements.forEach((achievement, achievementId) => {
      if (achievement.completed) return;
      
      const shouldUpdate = this.shouldUpdateAchievement(achievement, action, data);
      if (shouldUpdate) {
        this.updateAchievementProgress(achievementId, data);
      }
    });
  }

  private shouldUpdateAchievement(achievement: MicroAchievement, action: string, data: Record<string, any>): boolean {
    // Map actions to achievement IDs
    const actionMappings: Record<string, string[]> = {
      'shot_fired': ['first_shot'],
      'balloon_popped': ['balloon_buster'],
      'accurate_hit': ['sharpshooter'],
      'level_completed': ['speed_demon', 'perfect_game', 'level_master'],
      'combo_achieved': ['combo_king'],
      'score_shared': ['social_butterfly'],
      'skin_purchased': ['skin_collector'],
      'daily_login': ['daily_player'],
    };

    const relevantAchievements = actionMappings[action] || [];
    return relevantAchievements.includes(achievement.id);
  }

  private updateAchievementProgress(achievementId: string, data: Record<string, any>) {
    const achievement = this.achievements.get(achievementId);
    const progress = this.progress.get(achievementId);
    
    if (!achievement || !progress || achievement.completed) return;

    const previousProgress = progress.progress;
    let newProgress = previousProgress;

    // Update progress based on achievement type
    switch (achievement.type) {
      case 'counter':
        newProgress = Math.min(previousProgress + (data.increment || 1), achievement.target);
        break;
      case 'milestone':
        newProgress = Math.min(data.value || 0, achievement.target);
        break;
      case 'streak':
        newProgress = this.updateStreakProgress(achievement, progress, data);
        break;
      case 'condition':
        if (this.checkCondition(achievement, data)) {
          newProgress = achievement.target;
        }
        break;
      case 'collection':
        newProgress = data.collectionSize || 0;
        break;
    }

    // Update progress
    progress.progress = newProgress;
    progress.lastUpdated = Date.now();

    // Check for milestones (25%, 50%, 75% progress)
    const progressPercentage = (newProgress / achievement.target) * 100;
    const milestoneThresholds = [25, 50, 75];
    
    milestoneThresholds.forEach(threshold => {
      if (progressPercentage >= threshold && !progress.milestones.includes(threshold)) {
        progress.milestones.push(threshold);
        
        if (this.callbacks.onMilestoneReached) {
          this.callbacks.onMilestoneReached(achievement, threshold);
        }
        
        this.showToast({
          achievement,
          progress,
          type: 'milestone',
          timestamp: Date.now(),
        });
      }
    });

    // Check for completion
    if (newProgress >= achievement.target && !achievement.completed) {
      this.completeAchievement(achievementId);
    } else if (newProgress > previousProgress) {
      // Show progress update
      if (this.callbacks.onProgressUpdate) {
        this.callbacks.onProgressUpdate(achievement, progress);
      }
      
      this.showToast({
        achievement,
        progress,
        type: 'progress',
        timestamp: Date.now(),
      });
    }

    // Track analytics
    trackMicroProgress({
      achievementId,
      progress: newProgress,
      target: achievement.target,
      category: achievement.category,
      timestamp: Date.now(),
    });

    this.saveAchievements();
  }

  private updateStreakProgress(achievement: MicroAchievement, progress: AchievementProgress, data: Record<string, any>): number {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    if (!progress.startTime) {
      progress.startTime = now;
      progress.streakCount = 1;
      return 1;
    }

    const timeSinceLastUpdate = now - progress.lastUpdated;
    
    if (timeSinceLastUpdate <= oneDayMs * 1.5) { // Allow some buffer for daily streaks
      progress.streakCount = (progress.streakCount || 0) + 1;
      return progress.streakCount;
    } else {
      // Streak broken, restart
      progress.startTime = now;
      progress.streakCount = 1;
      return 1;
    }
  }

  private checkCondition(achievement: MicroAchievement, data: Record<string, any>): boolean {
    switch (achievement.id) {
      case 'speed_demon':
        return data.completionTime && data.completionTime < 30000; // 30 seconds
      case 'perfect_game':
        return data.accuracy === 1.0 && data.missCount === 0;
      default:
        return false;
    }
  }

  private completeAchievement(achievementId: string) {
    const achievement = this.achievements.get(achievementId);
    if (!achievement) return;

    achievement.completed = true;
    achievement.completedAt = Date.now();

    // Award rewards
    this.awardRewards(achievement.rewards);

    // Update chains
    this.updateAchievementChains(achievementId);

    // Notifications
    if (this.callbacks.onAchievementUnlocked) {
      this.callbacks.onAchievementUnlocked(achievement);
    }

    this.showToast({
      achievement,
      type: 'unlocked',
      timestamp: Date.now(),
    });

    // Track analytics
    trackAchievementUnlocked({
      achievementId,
      achievementName: achievement.name,
      category: achievement.category,
      rarity: achievement.rarity,
      difficulty: achievement.difficulty,
      timeToComplete: achievement.completedAt! - achievement.createdAt,
      timestamp: Date.now(),
    });

    this.saveAchievements();
  }

  private awardRewards(rewards: AchievementReward[]) {
    const economyStore = useEconomyStore.getState();

    rewards.forEach(reward => {
      switch (reward.type) {
        case 'currency':
          if (reward.currency && reward.amount) {
            economyStore.addCurrency(
              reward.currency,
              reward.amount,
              'Achievement reward'
            );
          }
          break;
        case 'item':
        case 'skin':
          // Handle item rewards through economy store
          break;
        case 'experience':
          // Handle experience rewards
          break;
      }
    });
  }

  private updateAchievementChains(completedAchievementId: string) {
    this.chains.forEach(chain => {
      if (chain.completed) return;
      
      const currentAchievementId = chain.achievementIds[chain.currentIndex];
      if (currentAchievementId === completedAchievementId) {
        chain.currentIndex++;
        
        if (chain.currentIndex >= chain.achievementIds.length) {
          chain.completed = true;
          
          if (chain.chainReward) {
            this.awardRewards([chain.chainReward]);
          }
        }
      }
    });
  }

  private showToast(toast: AchievementToast) {
    this.recentToasts.push(toast);
    
    // Keep only recent toasts
    if (this.recentToasts.length > 10) {
      this.recentToasts.shift();
    }
    
    if (this.callbacks.onToastRequest) {
      this.callbacks.onToastRequest(toast);
    }
  }

  // Public API
  public getAllAchievements(): MicroAchievement[] {
    return Array.from(this.achievements.values());
  }

  public getAchievementsByCategory(category: string): MicroAchievement[] {
    return Array.from(this.achievements.values())
      .filter(achievement => achievement.category === category);
  }

  public getCompletedAchievements(): MicroAchievement[] {
    return Array.from(this.achievements.values())
      .filter(achievement => achievement.completed);
  }

  public getAchievementProgress(achievementId: string): AchievementProgress | undefined {
    return this.progress.get(achievementId);
  }

  public getAchievementChains(): AchievementChain[] {
    return Array.from(this.chains.values());
  }

  public getRecentToasts(): AchievementToast[] {
    return [...this.recentToasts];
  }

  public clearRecentToasts() {
    this.recentToasts = [];
  }

  // Convenience tracking methods
  public trackShotFired() {
    this.trackAction('shot_fired');
  }

  public trackBalloonPopped() {
    this.trackAction('balloon_popped');
  }

  public trackAccurateHit(accuracy: number) {
    if (accuracy >= 0.95) {
      this.trackAction('accurate_hit');
    }
  }

  public trackLevelCompleted(stats: {
    completionTime: number;
    accuracy: number;
    missCount: number;
  }) {
    this.trackAction('level_completed', stats);
  }

  public trackComboAchieved(comboCount: number) {
    this.trackAction('combo_achieved', { value: comboCount });
  }

  public trackScoreShared() {
    this.trackAction('score_shared');
  }

  public trackSkinPurchased(collectionSize: number) {
    this.trackAction('skin_purchased', { collectionSize });
  }

  public trackDailyLogin() {
    this.trackAction('daily_login');
  }
}

export const microAchievementSystem = MicroAchievementSystem.getInstance();