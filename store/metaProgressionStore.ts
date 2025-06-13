/**
 * Meta-Progression Store - Zustand store for persistent player statistics and progression
 * 
 * This store handles:
 * - Player statistics and records
 * - Achievement progress and unlocks
 * - Pete customization and cosmetics
 * - Daily challenges and streaks
 * - Battle pass progression
 * - 3-star level mastery system
 * - Mystery balloon rewards
 * - AsyncStorage persistence
 * 
 * Designed for 2025 hyper-casual retention and psychological engagement.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PlayerMetaProgress,
  LevelMasteryRecord,
  Achievement,
  AchievementProgress,
  AchievementProgressData,
  UnlockedCustomizations,
  ActiveCustomizations,
  DailyChallenge,
  DailyChallengeProgress,
  ChallengeHistory,
  BattlePassProgress,
  MysteryReward,
  CustomizationItem,
  UnlockableItem,
  XPSource,
  META_PROGRESSION_CONSTANTS
} from '../types/MetaProgressionTypes';

// Storage keys for persistence
const STORAGE_KEYS = {
  META_PROGRESS: 'psp_meta_progress',
  ACHIEVEMENTS: 'psp_achievements',
  CUSTOMIZATIONS: 'psp_customizations',
  DAILY_CHALLENGES: 'psp_daily_challenges',
  BATTLE_PASS: 'psp_battle_pass',
  MASTERY_RECORDS: 'psp_mastery_records'
} as const;

// ===== STORE STATE INTERFACE =====

interface MetaProgressionState {
  // Core Player Progress
  metaProgress: PlayerMetaProgress | null;
  
  // Achievement System
  achievements: Achievement[];
  achievementProgress: AchievementProgress;
  
  // Level Mastery (3-star system)
  masteryRecords: Record<number, LevelMasteryRecord>;
  
  // Pete Customization
  unlockedCustomizations: UnlockedCustomizations;
  activeCustomizations: ActiveCustomizations;
  availableCustomizations: CustomizationItem[];
  
  // Daily Challenges
  dailyChallenges: DailyChallenge[];
  challengeProgress: Record<string, DailyChallengeProgress>;
  challengeHistory: ChallengeHistory;
  
  // Battle Pass
  battlePassProgress: BattlePassProgress;
  
  // Mystery Rewards
  mysteryRewardHistory: MysteryReward[];
  
  // UI State
  isLoading: boolean;
  lastSyncTime: number;
  pendingRewards: UnlockableItem[];      // Rewards waiting to be shown to player
  newAchievements: Achievement[];        // Recently unlocked achievements
  
  // Session Statistics
  sessionStats: {
    balloonsPopped: number;
    shotsFired: number;
    shotsHit: number;
    sessionStartTime: number;
    xpEarnedThisSession: number;
  };
}

interface MetaProgressionActions {
  // Initialization
  initialize: () => Promise<void>;
  
  // Player Statistics
  updatePlayerStats: (updates: Partial<PlayerMetaProgress>) => void;
  addPlaytime: (milliseconds: number) => void;
  recordBalloonPop: () => void;
  recordShotFired: () => void;
  recordShotHit: () => void;
  
  // Achievement System
  checkAchievements: () => void;
  unlockAchievement: (achievementId: string) => void;
  updateAchievementProgress: (achievementId: string, value: number) => void;
  clearNewAchievements: () => void;
  
  // Level Mastery
  recordLevelCompletion: (levelId: number, time: number, accuracy: number, styleScore: number) => void;
  calculateMasteryStars: (time: number, accuracy: number, styleScore: number, thresholds: any) => number;
  getMasteryRecord: (levelId: number) => LevelMasteryRecord | null;
  
  // Pete Customization
  unlockCustomization: (itemId: string) => void;
  setActiveCustomization: (category: string, itemId: string) => void;
  purchaseCustomization: (itemId: string) => boolean;
  
  // Daily Challenges
  generateDailyChallenges: () => void;
  updateChallengeProgress: (challengeId: string, progress: number) => void;
  claimChallengeReward: (challengeId: string) => void;
  refreshChallenges: () => void;
  
  // Battle Pass
  earnXP: (amount: number, source: XPSource) => void;
  claimBattlePassReward: (tier: number, isPremium: boolean) => void;
  purchasePremiumPass: () => boolean;
  
  // Mystery Rewards
  processMysteryReward: (reward: MysteryReward) => void;
  
  // Currency
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  addGems: (amount: number) => void;
  spendGems: (amount: number) => boolean;
  
  // Helper methods
  processUnlockableItem: (item: UnlockableItem) => void;
  processMysteryBox: (boxType: string) => void;
  
  // Persistence
  saveToStorage: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
  
  // Session Management
  startSession: () => void;
  endSession: () => void;
  
  // Feature Unlocks
  checkFeatureUnlocks: () => void;
  unlockFeature: (featureId: string) => void;
}

interface MetaProgressionStore extends MetaProgressionState {
  actions: MetaProgressionActions;
}

// ===== INITIAL STATE =====

const createInitialMetaProgress = (): PlayerMetaProgress => ({
  totalScore: 0,
  totalPlaytime: 0,
  balloonsPopped: 0,
  shotsFired: 0,
  shotsHit: 0,
  
  longestCombo: 0,
  perfectLevelsCompleted: 0,
  consecutiveDaysPlayed: 0,
  currentLoginStreak: 0,
  
  totalStarsEarned: 0,
  masteryChallengesCompleted: 0,
  
  personalBests: {},
  globalRankings: {
    lastUpdated: Date.now()
  },
  
  firstPlayDate: Date.now(),
  lastPlayDate: Date.now(),
  lastDailyRewardClaim: 0,
  
  unlockedCustomizations: {
    colors: new Set(['default']),
    trails: new Set(['none']),
    shootingEffects: new Set(['basic']),
    poses: new Set(['default']),
    emotes: new Set(['wave']),
    backgrounds: new Set(['gradient'])
  },
  
  activeCustomizations: {
    color: 'default',
    trail: 'none',
    shootingEffect: 'basic',
    pose: 'default',
    emote: 'wave',
    background: 'gradient'
  },
  
  achievements: {
    unlockedAchievements: new Set(),
    achievementProgress: {},
    recentlyUnlocked: [],
    totalAchievementScore: 0
  },
  
  battlePassProgress: {
    currentSeason: 'season_1',
    currentTier: 0,
    currentXP: 0,
    xpToNextTier: META_PROGRESSION_CONSTANTS.BASE_XP_PER_LEVEL,
    freeTrackRewards: new Set(),
    premiumTrackRewards: new Set(),
    hasPremiumPass: false,
    completedSeasons: [],
    xpThisSession: 0,
    xpThisWeek: 0,
    totalXPEarned: 0
  },
  
  coins: 0,
  gems: 0,
  
  unlockedFeatures: ['achievements']
});

const createInitialChallengeHistory = (): ChallengeHistory => ({
  completedChallenges: new Set(),
  currentStreak: 0,
  longestStreak: 0,
  totalChallengesCompleted: 0,
  weeklyCompletionRate: 0
});

// ===== STORE IMPLEMENTATION =====

const createMetaProgressionStore = (set: any, get: any): MetaProgressionStore => {
  const actions: MetaProgressionActions = {
    // Initialize the store
    initialize: async () => {
      set({ isLoading: true });
      
      try {
        await actions.loadFromStorage();
        actions.checkFeatureUnlocks();
        actions.generateDailyChallenges();
        actions.checkAchievements();
        
        set({ 
          isLoading: false,
          lastSyncTime: Date.now()
        });
      } catch (error) {
        console.error('Failed to initialize meta progression:', error);
        set({ isLoading: false });
      }
    },

    // Update player statistics
    updatePlayerStats: (updates: Partial<PlayerMetaProgress>) => {
      set((state: MetaProgressionState) => ({
        metaProgress: state.metaProgress ? {
          ...state.metaProgress,
          ...updates,
          lastPlayDate: Date.now()
        } : null
      }));
    },

    // Add playtime tracking
    addPlaytime: (milliseconds: number) => {
      set((state: MetaProgressionState) => ({
        metaProgress: state.metaProgress ? {
          ...state.metaProgress,
          totalPlaytime: state.metaProgress.totalPlaytime + milliseconds
        } : null
      }));
      
      // Auto-save every 30 seconds of playtime
      const state = get();
      if (state.metaProgress && state.metaProgress.totalPlaytime % 30000 < milliseconds) {
        actions.saveToStorage();
      }
    },

    // Record balloon pop
    recordBalloonPop: () => {
      set((state: MetaProgressionState) => ({
        metaProgress: state.metaProgress ? {
          ...state.metaProgress,
          balloonsPopped: state.metaProgress.balloonsPopped + 1
        } : null,
        sessionStats: {
          ...state.sessionStats,
          balloonsPopped: state.sessionStats.balloonsPopped + 1
        }
      }));
      
      // Check achievements that might be triggered by balloon pops
      actions.checkAchievements();
    },

    // Record shot fired
    recordShotFired: () => {
      set((state: MetaProgressionState) => ({
        metaProgress: state.metaProgress ? {
          ...state.metaProgress,
          shotsFired: state.metaProgress.shotsFired + 1
        } : null,
        sessionStats: {
          ...state.sessionStats,
          shotsFired: state.sessionStats.shotsFired + 1
        }
      }));
    },

    // Record shot hit
    recordShotHit: () => {
      set((state: MetaProgressionState) => ({
        metaProgress: state.metaProgress ? {
          ...state.metaProgress,
          shotsHit: state.metaProgress.shotsHit + 1
        } : null,
        sessionStats: {
          ...state.sessionStats,
          shotsHit: state.sessionStats.shotsHit + 1
        }
      }));
    },

    // Check all achievements for potential unlocks
    checkAchievements: () => {
      const state = get();
      if (!state.metaProgress || !state.achievements) return;

      const newUnlocks: Achievement[] = [];

      state.achievements.forEach((achievement: Achievement) => {
        const alreadyUnlocked = state.achievementProgress.unlockedAchievements.has(achievement.id);
        if (alreadyUnlocked) return;

        // Get current progress for this achievement
        const progress = state.achievementProgress.achievementProgress[achievement.id];
        const currentValue = progress?.currentValue || 0;

        // Check if achievement should be unlocked
        let shouldUnlock = false;
        
        switch (achievement.condition.metric) {
          case 'balloons_popped':
            shouldUnlock = state.metaProgress.balloonsPopped >= achievement.target;
            break;
          case 'levels_completed':
            // This would need to be integrated with level progression store
            break;
          case 'consecutive_hits':
            shouldUnlock = state.metaProgress.longestCombo >= achievement.target;
            break;
          case 'stars_earned':
            shouldUnlock = state.metaProgress.totalStarsEarned >= achievement.target;
            break;
          // Add more achievement checks here
        }

        if (shouldUnlock) {
          newUnlocks.push(achievement);
          actions.unlockAchievement(achievement.id);
        }
      });

      if (newUnlocks.length > 0) {
        set((state: MetaProgressionState) => ({
          newAchievements: [...state.newAchievements, ...newUnlocks]
        }));
      }
    },

    // Unlock specific achievement
    unlockAchievement: (achievementId: string) => {
      const state = get();
      const achievement = state.achievements.find((a: Achievement) => a.id === achievementId);
      if (!achievement) return;

      set((state: MetaProgressionState) => ({
        achievementProgress: {
          ...state.achievementProgress,
          unlockedAchievements: new Set([...state.achievementProgress.unlockedAchievements, achievementId]),
          totalAchievementScore: state.achievementProgress.totalAchievementScore + achievement.scoreReward
        },
        metaProgress: state.metaProgress ? {
          ...state.metaProgress,
          coins: state.metaProgress.coins + achievement.coinReward
        } : null
      }));

      // Process any unlock rewards
      if (achievement.unlockReward) {
        actions.processUnlockableItem(achievement.unlockReward);
      }

      actions.saveToStorage();
    },

    // Update achievement progress
    updateAchievementProgress: (achievementId: string, value: number) => {
      set((state: MetaProgressionState) => {
        const currentProgress = state.achievementProgress.achievementProgress[achievementId];
        const achievement = state.achievements.find((a: Achievement) => a.id === achievementId);
        
        if (!achievement) return state;

        const newProgress: AchievementProgressData = {
          currentValue: Math.max(currentProgress?.currentValue || 0, value),
          targetValue: achievement.target,
          progressPercentage: Math.min(100, (value / achievement.target) * 100),
          firstProgressDate: currentProgress?.firstProgressDate || Date.now(),
          lastProgressDate: Date.now()
        };

        return {
          achievementProgress: {
            ...state.achievementProgress,
            achievementProgress: {
              ...state.achievementProgress.achievementProgress,
              [achievementId]: newProgress
            }
          }
        };
      });
    },

    // Clear new achievements (after showing to player)
    clearNewAchievements: () => {
      set({ newAchievements: [] });
    },

    // Record level completion for mastery system
    recordLevelCompletion: async (levelId: number, time: number, accuracy: number, styleScore: number) => {
      // Get level configuration for mastery thresholds
      let masteryThresholds;
      try {
        const { levelManager } = await import('../systems/LevelManager');
        const levelResult = await levelManager.loadLevel(levelId);
        masteryThresholds = levelResult.level?.rewards.masteryThresholds;
      } catch (error) {
        console.warn(`Could not load level ${levelId} for mastery thresholds, using defaults`);
        masteryThresholds = {
          goldTimeThreshold: getMasteryTimeThreshold(levelId),
          goldAccuracyThreshold: META_PROGRESSION_CONSTANTS.DEFAULT_ACCURACY_GOLD,
          goldStyleThreshold: META_PROGRESSION_CONSTANTS.DEFAULT_STYLE_GOLD,
          perfectCompletionMultiplier: 2.0
        };
      }
      
      const stars = actions.calculateMasteryStars(time, accuracy, styleScore, masteryThresholds!);
      
      set((state: MetaProgressionState) => {
        const existingRecord = state.masteryRecords[levelId];
        const isFirstCompletion = !existingRecord;
        
        const newRecord: LevelMasteryRecord = {
          levelId,
          timeStars: time <= masteryThresholds!.goldTimeThreshold ? 1 : 0,
          accuracyStars: accuracy >= masteryThresholds!.goldAccuracyThreshold ? 1 : 0,
          styleStars: styleScore >= masteryThresholds!.goldStyleThreshold ? 1 : 0,
          totalStars: stars,
          bestTime: Math.min(existingRecord?.bestTime || Infinity, time),
          bestAccuracy: Math.max(existingRecord?.bestAccuracy || 0, accuracy),
          maxCombo: Math.max(existingRecord?.maxCombo || 0, state.metaProgress?.longestCombo || 0),
          styleScore: Math.max(existingRecord?.styleScore || 0, styleScore),
          badges: existingRecord?.badges || [],
          firstCompletionDate: existingRecord?.firstCompletionDate || Date.now(),
          lastAttemptDate: Date.now(),
          totalAttempts: (existingRecord?.totalAttempts || 0) + 1
        };

        const starsEarned = stars - (existingRecord?.totalStars || 0);
        
        return {
          masteryRecords: {
            ...state.masteryRecords,
            [levelId]: newRecord
          },
          metaProgress: state.metaProgress ? {
            ...state.metaProgress,
            totalStarsEarned: state.metaProgress.totalStarsEarned + starsEarned,
            perfectLevelsCompleted: accuracy === 100 
              ? state.metaProgress.perfectLevelsCompleted + (isFirstCompletion && accuracy === 100 ? 1 : 0)
              : state.metaProgress.perfectLevelsCompleted
          } : null
        };
      });

      // Award XP for completion and stars
      actions.earnXP(META_PROGRESSION_CONSTANTS.BASE_XP_PER_LEVEL, {
        source: 'level_completion',
        baseXP: META_PROGRESSION_CONSTANTS.BASE_XP_PER_LEVEL,
        bonusMultipliers: []
      });

      if (stars > 0) {
        actions.earnXP(stars * 50, {
          source: 'star_earned',
          baseXP: 50,
          bonusMultipliers: []
        });
      }

      actions.saveToStorage();
    },

    // Calculate mastery stars for a level completion
    calculateMasteryStars: (time: number, accuracy: number, styleScore: number, thresholds: any): number => {
      let stars = 0;
      
      // Time star
      if (time <= thresholds.goldTimeThreshold) stars += 1;
      
      // Accuracy star  
      if (accuracy >= thresholds.goldAccuracyThreshold) stars += 1;
      
      // Style star
      if (styleScore >= thresholds.goldStyleThreshold) stars += 1;
      
      return stars;
    },

    // Helper methods
    processUnlockableItem: (item: UnlockableItem) => {
      // This will be assigned later in the function
    },
    
    processMysteryBox: (boxType: string) => {
      // This will be assigned later in the function  
    },

    // Get mastery record for level
    getMasteryRecord: (levelId: number): LevelMasteryRecord | null => {
      const state = get();
      return state.masteryRecords[levelId] || null;
    },

    // Battle Pass XP earning
    earnXP: (amount: number, source: XPSource) => {
      set((state: MetaProgressionState) => {
        let finalAmount = amount;
        
        // Apply bonus multipliers
        source.bonusMultipliers.forEach(bonus => {
          finalAmount *= bonus.multiplier;
        });

        const newXP = state.battlePassProgress.currentXP + finalAmount;
        const xpPerTier = META_PROGRESSION_CONSTANTS.BASE_XP_PER_LEVEL * 
          Math.pow(META_PROGRESSION_CONSTANTS.XP_SCALING_FACTOR, state.battlePassProgress.currentTier);
        
        let newTier = state.battlePassProgress.currentTier;
        let remainingXP = newXP;
        
        // Calculate tier ups
        while (remainingXP >= xpPerTier && newTier < META_PROGRESSION_CONSTANTS.DEFAULT_BATTLE_PASS_TIERS) {
          remainingXP -= xpPerTier;
          newTier += 1;
        }

        return {
          battlePassProgress: {
            ...state.battlePassProgress,
            currentTier: newTier,
            currentXP: remainingXP,
            xpToNextTier: xpPerTier - remainingXP,
            xpThisSession: state.battlePassProgress.xpThisSession + finalAmount,
            totalXPEarned: state.battlePassProgress.totalXPEarned + finalAmount
          }
        };
      });
    },

    // Add coins
    addCoins: (amount: number) => {
      set((state: MetaProgressionState) => ({
        metaProgress: state.metaProgress ? {
          ...state.metaProgress,
          coins: state.metaProgress.coins + amount
        } : null
      }));
    },

    // Spend coins
    spendCoins: (amount: number): boolean => {
      const state = get();
      if (!state.metaProgress || state.metaProgress.coins < amount) {
        return false;
      }

      set((state: MetaProgressionState) => ({
        metaProgress: state.metaProgress ? {
          ...state.metaProgress,
          coins: state.metaProgress.coins - amount
        } : null
      }));

      return true;
    },

    // Start session tracking
    startSession: () => {
      set({
        sessionStats: {
          balloonsPopped: 0,
          shotsFired: 0,
          shotsHit: 0,
          sessionStartTime: Date.now(),
          xpEarnedThisSession: 0
        }
      });
    },

    // End session and save progress
    endSession: () => {
      const state = get();
      const sessionDuration = Date.now() - state.sessionStats.sessionStartTime;
      
      actions.addPlaytime(sessionDuration);
      actions.saveToStorage();
    },

    // Save all data to AsyncStorage
    saveToStorage: async () => {
      const state = get();
      
      try {
        const savePromises = [
          AsyncStorage.setItem(STORAGE_KEYS.META_PROGRESS, JSON.stringify({
            ...state.metaProgress,
            unlockedCustomizations: {
              colors: Array.from(state.metaProgress?.unlockedCustomizations.colors || []),
              trails: Array.from(state.metaProgress?.unlockedCustomizations.trails || []),
              shootingEffects: Array.from(state.metaProgress?.unlockedCustomizations.shootingEffects || []),
              poses: Array.from(state.metaProgress?.unlockedCustomizations.poses || []),
              emotes: Array.from(state.metaProgress?.unlockedCustomizations.emotes || []),
              backgrounds: Array.from(state.metaProgress?.unlockedCustomizations.backgrounds || [])
            },
            achievements: {
              ...state.metaProgress?.achievements,
              unlockedAchievements: Array.from(state.metaProgress?.achievements.unlockedAchievements || [])
            }
          })),
          AsyncStorage.setItem(STORAGE_KEYS.MASTERY_RECORDS, JSON.stringify(state.masteryRecords)),
          AsyncStorage.setItem(STORAGE_KEYS.BATTLE_PASS, JSON.stringify({
            ...state.battlePassProgress,
            freeTrackRewards: Array.from(state.battlePassProgress.freeTrackRewards),
            premiumTrackRewards: Array.from(state.battlePassProgress.premiumTrackRewards)
          }))
        ];

        await Promise.all(savePromises);
      } catch (error) {
        console.error('Failed to save meta progression data:', error);
      }
    },

    // Load all data from AsyncStorage
    loadFromStorage: async () => {
      try {
        const [metaProgressData, masteryData, battlePassData] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.META_PROGRESS),
          AsyncStorage.getItem(STORAGE_KEYS.MASTERY_RECORDS),
          AsyncStorage.getItem(STORAGE_KEYS.BATTLE_PASS)
        ]);

        let metaProgress = createInitialMetaProgress();
        let masteryRecords = {};
        let battlePassProgress = metaProgress.battlePassProgress;

        if (metaProgressData) {
          const parsed = JSON.parse(metaProgressData);
          metaProgress = {
            ...parsed,
            unlockedCustomizations: {
              colors: new Set(parsed.unlockedCustomizations?.colors || ['default']),
              trails: new Set(parsed.unlockedCustomizations?.trails || ['none']),
              shootingEffects: new Set(parsed.unlockedCustomizations?.shootingEffects || ['basic']),
              poses: new Set(parsed.unlockedCustomizations?.poses || ['default']),
              emotes: new Set(parsed.unlockedCustomizations?.emotes || ['wave']),
              backgrounds: new Set(parsed.unlockedCustomizations?.backgrounds || ['gradient'])
            },
            achievements: {
              ...parsed.achievements,
              unlockedAchievements: new Set(parsed.achievements?.unlockedAchievements || [])
            }
          };
        }

        if (masteryData) {
          masteryRecords = JSON.parse(masteryData);
        }

        if (battlePassData) {
          const parsed = JSON.parse(battlePassData);
          battlePassProgress = {
            ...parsed,
            freeTrackRewards: new Set(parsed.freeTrackRewards || []),
            premiumTrackRewards: new Set(parsed.premiumTrackRewards || [])
          };
        }

        set({
          metaProgress,
          masteryRecords,
          battlePassProgress,
          achievementProgress: metaProgress.achievements,
          unlockedCustomizations: metaProgress.unlockedCustomizations,
          activeCustomizations: metaProgress.activeCustomizations
        });

      } catch (error) {
        console.error('Failed to load meta progression data:', error);
        // Initialize with default data
        set({
          metaProgress: createInitialMetaProgress(),
          masteryRecords: {},
          challengeHistory: createInitialChallengeHistory()
        });
      }
    },

    // Daily Challenges
    generateDailyChallenges: async () => {
      try {
        const { dailyChallengeManager } = await import('../systems/DailyChallengeManager');
        await dailyChallengeManager.checkAndRefreshChallenges();
        
        // Update store with new challenges
        const challenges = dailyChallengeManager.getCurrentChallenges();
        const progress = dailyChallengeManager.getChallengeProgress();
        const history = dailyChallengeManager.getChallengeHistory();
        
        set({
          dailyChallenges: challenges,
          challengeProgress: progress,
          challengeHistory: history
        });
      } catch (error) {
        console.error('Failed to generate daily challenges:', error);
      }
    },

    updateChallengeProgress: async (challengeId: string, progress: number) => {
      try {
        const { dailyChallengeManager } = await import('../systems/DailyChallengeManager');
        dailyChallengeManager.updateChallengeProgress(challengeId, progress);
        
        // Update store with new progress
        const updatedProgress = dailyChallengeManager.getChallengeProgress();
        const updatedHistory = dailyChallengeManager.getChallengeHistory();
        
        set({
          challengeProgress: updatedProgress,
          challengeHistory: updatedHistory
        });
        
        // Check if challenge was completed and award XP
        const challengeProgressData = updatedProgress[challengeId];
        if (challengeProgressData?.completed && !challengeProgressData.claimed) {
          const challenge = get().dailyChallenges.find((c: DailyChallenge) => c.id === challengeId);
          if (challenge) {
            // Award XP for challenge completion
            actions.earnXP(challenge.baseReward.experiencePoints || 100, {
              source: 'daily_challenge',
              baseXP: challenge.baseReward.experiencePoints || 100,
              bonusMultipliers: []
            });
          }
        }
      } catch (error) {
        console.error('Failed to update challenge progress:', error);
      }
    },

    claimChallengeReward: async (challengeId: string) => {
      try {
        const { dailyChallengeManager } = await import('../systems/DailyChallengeManager');
        const reward = dailyChallengeManager.claimChallengeReward(challengeId);
        
        if (reward) {
          // Add coins to player
          actions.addCoins(reward.coins);
          
          // Process any unlockable items
          if (reward.unlockableItem) {
            actions.processUnlockableItem(reward.unlockableItem);
          }
          
          // Update store progress
          const updatedProgress = dailyChallengeManager.getChallengeProgress();
          set({ challengeProgress: updatedProgress });
          
          console.log('Challenge reward claimed:', reward);
        }
      } catch (error) {
        console.error('Failed to claim challenge reward:', error);
      }
    },

    refreshChallenges: async () => {
      try {
        const { dailyChallengeManager } = await import('../systems/DailyChallengeManager');
        const wasRefreshed = await dailyChallengeManager.checkAndRefreshChallenges();
        
        if (wasRefreshed) {
          // Update store with refreshed challenges
          await actions.generateDailyChallenges();
        }
      } catch (error) {
        console.error('Failed to refresh challenges:', error);
      }
    },

    // Pete Customization (placeholder implementations)
    unlockCustomization: (itemId: string) => {
      set((state: MetaProgressionState) => {
        const category = extractCustomizationCategory(itemId);
        if (!category || !state.metaProgress) return state;

        const currentUnlocked = state.metaProgress.unlockedCustomizations[category as keyof typeof state.metaProgress.unlockedCustomizations];
        if (currentUnlocked.has(itemId)) return state;

        return {
          metaProgress: {
            ...state.metaProgress,
            unlockedCustomizations: {
              ...state.metaProgress.unlockedCustomizations,
              [category]: new Set([...currentUnlocked, itemId])
            }
          }
        };
      });
    },

    setActiveCustomization: (category: string, itemId: string) => {
      set((state: MetaProgressionState) => {
        if (!state.metaProgress) return state;

        // Check if item is unlocked
        const unlockedItems = state.metaProgress.unlockedCustomizations[category as keyof typeof state.metaProgress.unlockedCustomizations];
        if (!unlockedItems?.has(itemId)) {
          console.warn(`Customization ${itemId} not unlocked for category ${category}`);
          return state;
        }

        return {
          metaProgress: {
            ...state.metaProgress,
            activeCustomizations: {
              ...state.metaProgress.activeCustomizations,
              [category]: itemId
            }
          }
        };
      });
    },

    purchaseCustomization: (itemId: string): boolean => {
      const state = get();
      
      // Find customization item (would come from a customization catalog)
      const item = state.availableCustomizations.find((c: CustomizationItem) => c.id === itemId);
      if (!item || !item.purchasable) return false;

      // Check if player has enough coins
      if (!state.metaProgress || state.metaProgress.coins < (item.coinCost || 0)) {
        return false;
      }

      // Spend coins and unlock item
      if (actions.spendCoins(item.coinCost || 0)) {
        actions.unlockCustomization(itemId);
        return true;
      }

      return false;
    },
    // Mystery Balloon Rewards
    processMysteryReward: (reward: MysteryReward) => {
      try {
        console.log('Processing mystery reward:', reward);
        
        switch (reward.type) {
          case 'coins':
            const coinAmount = typeof reward.value === 'number' ? reward.value : 0;
            actions.addCoins(coinAmount);
            break;
            
          case 'experience':
            const xpAmount = typeof reward.value === 'number' ? reward.value : 0;
            actions.earnXP(xpAmount, {
              source: 'mystery_balloon',
              baseXP: xpAmount,
              bonusMultipliers: []
            });
            break;
            
          case 'customization':
            // For now, randomly unlock a color customization
            const colorIds = ['color_red', 'color_blue', 'color_green', 'color_purple', 'color_orange'];
            const randomColor = colorIds[Math.floor(Math.random() * colorIds.length)];
            actions.unlockCustomization(randomColor);
            break;
            
          case 'score_multiplier':
            // This would be handled by the game engine for current level
            // For now, just add it to pending rewards for UI display
            set((state: MetaProgressionState) => ({
              pendingRewards: [...state.pendingRewards, {
                type: 'booster',
                itemId: 'score_multiplier',
                quantity: typeof reward.value === 'number' ? reward.value : 1
              }]
            }));
            break;
            
          case 'mystery_box':
            // Process secondary mystery reward (mystery within mystery!)
            actions.processMysteryBox(reward.value as string);
            break;
            
          default:
            console.warn('Unknown mystery reward type:', reward.type);
        }
        
        // Track reward in history
        set((state: MetaProgressionState) => ({
          mysteryRewardHistory: [...state.mysteryRewardHistory, reward]
        }));
        
      } catch (error) {
        console.error('Failed to process mystery reward:', error);
      }
    },


    claimBattlePassReward: (tier: number, isPremium: boolean) => { /* TODO */ },
    purchasePremiumPass: (): boolean => false,
    addGems: (amount: number) => { /* TODO */ },
    spendGems: (amount: number): boolean => false,
    checkFeatureUnlocks: () => { /* TODO */ },
    unlockFeature: (featureId: string) => { /* TODO */ }
  };

  // Helper function to extract customization category from item ID
  const extractCustomizationCategory = (itemId: string): string | null => {
    // Simple convention: itemId format like "color_red", "trail_sparkle", etc.
    const parts = itemId.split('_');
    if (parts.length < 2) return null;
    
    const category = parts[0];
    const validCategories = ['color', 'trail', 'shootingEffect', 'pose', 'emote', 'background'];
    
    return validCategories.includes(category) ? category : null;
  };

  // Helper method for processing unlockable items
  const processUnlockableItem = (item: UnlockableItem) => {
    switch (item.type) {
      case 'color':
      case 'trail':
      case 'shooting_effect':
      case 'pose':
      case 'emote':
      case 'background':
        actions.unlockCustomization(item.itemId);
        break;
      case 'currency':
        if (item.itemId === 'coins') {
          actions.addCoins(item.quantity || 0);
        } else if (item.itemId === 'gems') {
          actions.addGems(item.quantity || 0);
        }
        break;
    }
  };

  actions.processUnlockableItem = processUnlockableItem;
  actions.processMysteryBox = (boxType: string) => {
    // Mystery boxes contain multiple smaller rewards
    const rewards: any[] = [];
    
    switch (boxType) {
      case 'common_box':
        rewards.push(
          { type: 'coins', value: 100 + Math.floor(Math.random() * 100) },
          { type: 'experience', value: 50 + Math.floor(Math.random() * 50) }
        );
        break;
        
      case 'rare_box':
        rewards.push(
          { type: 'coins', value: 200 + Math.floor(Math.random() * 200) },
          { type: 'experience', value: 100 + Math.floor(Math.random() * 100) },
          { type: 'customization', value: 'random_cosmetic' }
        );
        break;
        
      case 'epic_box':
        rewards.push(
          { type: 'coins', value: 500 + Math.floor(Math.random() * 300) },
          { type: 'experience', value: 200 + Math.floor(Math.random() * 200) },
          { type: 'customization', value: 'rare_cosmetic' },
          { type: 'score_multiplier', value: 3 }
        );
        break;
        
      case 'legendary_box':
        rewards.push(
          { type: 'coins', value: 1000 + Math.floor(Math.random() * 500) },
          { type: 'experience', value: 500 + Math.floor(Math.random() * 300) },
          { type: 'customization', value: 'legendary_cosmetic' },
          { type: 'score_multiplier', value: 5 }
        );
        break;
    }
    
    // Process each reward in the box
    rewards.forEach(reward => {
      actions.processMysteryReward(reward as any);
    });
  };

  return {
    // Initial state
    metaProgress: null,
    achievements: [],
    achievementProgress: {
      unlockedAchievements: new Set(),
      achievementProgress: {},
      recentlyUnlocked: [],
      totalAchievementScore: 0
    },
    masteryRecords: {},
    unlockedCustomizations: {
      colors: new Set(['default']),
      trails: new Set(['none']),
      shootingEffects: new Set(['basic']),
      poses: new Set(['default']),
      emotes: new Set(['wave']),
      backgrounds: new Set(['gradient'])
    },
    activeCustomizations: {
      color: 'default',
      trail: 'none',
      shootingEffect: 'basic',
      pose: 'default',
      emote: 'wave',
      background: 'gradient'
    },
    availableCustomizations: [],
    dailyChallenges: [],
    challengeProgress: {},
    challengeHistory: createInitialChallengeHistory(),
    battlePassProgress: createInitialMetaProgress().battlePassProgress,
    mysteryRewardHistory: [],
    isLoading: false,
    lastSyncTime: 0,
    pendingRewards: [],
    newAchievements: [],
    sessionStats: {
      balloonsPopped: 0,
      shotsFired: 0,
      shotsHit: 0,
      sessionStartTime: Date.now(),
      xpEarnedThisSession: 0
    },
    actions
  };
};

// Helper function to get mastery time threshold for a level
const getMasteryTimeThreshold = (levelId: number): number => {
  // Base time decreases as levels get harder
  const baseTime = 120000; // 2 minutes for level 1
  const reductionPerLevel = 5000; // 5 seconds less per level
  return Math.max(30000, baseTime - (levelId - 1) * reductionPerLevel);
};

// Create the store
export const useMetaProgressionStore = create<MetaProgressionStore>()(
  subscribeWithSelector(createMetaProgressionStore)
);

// Individual selectors to avoid infinite re-render loops
export const useMetaProgressionActions = () => 
  useMetaProgressionStore(state => state.actions);

export const usePlayerMetaProgress = () => 
  useMetaProgressionStore(state => state.metaProgress);

export const useTotalStarsEarned = () => 
  useMetaProgressionStore(state => state.metaProgress?.totalStarsEarned || 0);

export const usePlayerCoins = () => 
  useMetaProgressionStore(state => state.metaProgress?.coins || 0);

export const usePlayerGems = () => 
  useMetaProgressionStore(state => state.metaProgress?.gems || 0);

export const useCurrentLoginStreak = () => 
  useMetaProgressionStore(state => state.metaProgress?.currentLoginStreak || 0);

export const useBattlePassTier = () => 
  useMetaProgressionStore(state => state.battlePassProgress.currentTier);

export const useBattlePassXP = () => 
  useMetaProgressionStore(state => state.battlePassProgress.currentXP);

export const useNewAchievements = () => 
  useMetaProgressionStore(state => state.newAchievements);

export const useActiveCustomizations = () => 
  useMetaProgressionStore(state => state.activeCustomizations);

export const useSessionStats = () => 
  useMetaProgressionStore(state => state.sessionStats);

export const useMasteryRecord = (levelId: number) => 
  useMetaProgressionStore(state => state.masteryRecords[levelId] || null);

export const useIsMetaProgressionLoading = () => 
  useMetaProgressionStore(state => state.isLoading);