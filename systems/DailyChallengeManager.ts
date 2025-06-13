/**
 * Daily Challenge Manager - Handles rotating daily challenges for player retention
 *
 * This system provides:
 * - Rotating daily objectives with varying difficulty
 * - Streak-based rewards to encourage consecutive daily play
 * - Analytics integration for optimization
 * - Challenge templates for easy content creation
 * - Time-zone aware challenge refresh
 *
 * Based on 2025 mobile game retention best practices and psychological engagement.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DailyChallenge,
  DailyChallengeProgress,
  ChallengeHistory,
  ChallengeObjective,
  ChallengeReward,
  ChallengeDifficulty,
  ChallengeObjectiveType,
  META_PROGRESSION_CONSTANTS,
} from '../types/MetaProgressionTypes';

// Storage keys
const STORAGE_KEYS = {
  DAILY_CHALLENGES: 'psp_daily_challenges',
  CHALLENGE_PROGRESS: 'psp_challenge_progress',
  CHALLENGE_HISTORY: 'psp_challenge_history',
  LAST_CHALLENGE_REFRESH: 'psp_last_challenge_refresh',
} as const;

// Challenge templates for generation
interface ChallengeTemplate {
  name: string;
  description: string;
  objective: Omit<ChallengeObjective, 'allowedAttempts'>;
  difficulty: ChallengeDifficulty;
  baseReward: ChallengeReward;
  weight: number; // Probability weight for selection
}

export class DailyChallengeManager {
  private static instance: DailyChallengeManager;
  private challengeTemplates: ChallengeTemplate[] = [];
  private currentChallenges: DailyChallenge[] = [];
  private challengeProgress: Record<string, DailyChallengeProgress> = {};
  private challengeHistory: ChallengeHistory;
  private lastRefreshDate: number = 0;

  private constructor() {
    this.challengeHistory = {
      completedChallenges: new Set(),
      currentStreak: 0,
      longestStreak: 0,
      totalChallengesCompleted: 0,
      weeklyCompletionRate: 0,
    };

    this.initializeChallengeTemplates();
  }

  public static getInstance(): DailyChallengeManager {
    if (!DailyChallengeManager.instance) {
      DailyChallengeManager.instance = new DailyChallengeManager();
    }
    return DailyChallengeManager.instance;
  }

  /**
   * Initialize predefined challenge templates
   */
  private initializeChallengeTemplates(): void {
    this.challengeTemplates = [
      // Easy challenges (high completion rate, good for streaks)
      {
        name: 'Balloon Buster',
        description: 'Pop 25 balloons',
        objective: {
          type: 'pop_balloons',
          target: 25,
          contextFilter: undefined,
        },
        difficulty: 'easy',
        baseReward: { coins: 50, experiencePoints: 75 },
        weight: 25,
      },
      {
        name: 'Level Runner',
        description: 'Complete 3 levels',
        objective: {
          type: 'complete_levels',
          target: 3,
          contextFilter: undefined,
        },
        difficulty: 'easy',
        baseReward: { coins: 75, experiencePoints: 100 },
        weight: 20,
      },
      {
        name: 'Sharp Shooter',
        description: 'Achieve 80% accuracy in any level',
        objective: {
          type: 'achieve_accuracy',
          target: 80,
          contextFilter: undefined,
        },
        difficulty: 'medium',
        baseReward: { coins: 100, experiencePoints: 125 },
        weight: 15,
      },

      // Medium challenges (moderate difficulty, good rewards)
      {
        name: 'Perfect Performance',
        description: 'Complete any level with 100% accuracy',
        objective: {
          type: 'achieve_accuracy',
          target: 100,
          contextFilter: undefined,
        },
        difficulty: 'medium',
        baseReward: { coins: 150, experiencePoints: 200 },
        weight: 12,
      },
      {
        name: 'Combo Master',
        description: 'Achieve a 5-hit combo',
        objective: {
          type: 'consecutive_hits',
          target: 5,
          contextFilter: undefined,
        },
        difficulty: 'medium',
        baseReward: { coins: 125, experiencePoints: 175 },
        weight: 15,
      },
      {
        name: 'Speed Runner',
        description: 'Complete level 1 in under 30 seconds',
        objective: {
          type: 'speed_completion',
          target: 30,
          contextFilter: {
            levelIds: [1],
          },
        },
        difficulty: 'medium',
        baseReward: { coins: 175, experiencePoints: 225 },
        weight: 10,
      },

      // Hard challenges (high skill requirement, great rewards)
      {
        name: 'Three Star Elite',
        description: 'Get 3 stars on any level',
        objective: {
          type: 'specific_level_mastery',
          target: 3,
          contextFilter: undefined,
        },
        difficulty: 'hard',
        baseReward: { coins: 250, experiencePoints: 300 },
        weight: 8,
      },
      {
        name: 'Precision Master',
        description: 'Complete 2 levels without missing a shot',
        objective: {
          type: 'perfect_levels',
          target: 2,
          contextFilter: undefined,
        },
        difficulty: 'hard',
        baseReward: { coins: 300, experiencePoints: 400 },
        weight: 5,
      },
      {
        name: 'Chain Reaction',
        description: 'Achieve a 10-hit combo',
        objective: {
          type: 'consecutive_hits',
          target: 10,
          contextFilter: undefined,
        },
        difficulty: 'expert',
        baseReward: { coins: 500, experiencePoints: 600 },
        weight: 3,
      },
    ];
  }

  /**
   * Initialize the challenge manager
   */
  public async initialize(): Promise<void> {
    try {
      await this.loadFromStorage();
      await this.checkAndRefreshChallenges();
    } catch (error) {
      console.error('Failed to initialize DailyChallengeManager:', error);
      // Generate default challenges if loading fails
      await this.generateDailyChallenges();
    }
  }

  /**
   * Check if challenges need to be refreshed and do so if necessary
   */
  public async checkAndRefreshChallenges(): Promise<boolean> {
    const now = Date.now();
    const todayStart = this.getTodayStartTime();

    // Check if we need to refresh (new day)
    if (this.lastRefreshDate < todayStart) {
      await this.generateDailyChallenges();
      return true;
    }

    return false;
  }

  /**
   * Generate new daily challenges
   */
  public async generateDailyChallenges(): Promise<void> {
    const now = Date.now();
    const todayStart = this.getTodayStartTime();
    const tomorrowStart = todayStart + 24 * 60 * 60 * 1000;

    // Update streak logic
    if (this.lastRefreshDate > 0) {
      const daysSinceLastRefresh = Math.floor(
        (todayStart - this.lastRefreshDate) / (24 * 60 * 60 * 1000)
      );

      if (daysSinceLastRefresh === 1) {
        // Consecutive day - maintain or increase streak
        const completedYesterday = this.didCompleteAnyChallenge(this.lastRefreshDate);
        if (completedYesterday) {
          this.challengeHistory.currentStreak += 1;
          this.challengeHistory.longestStreak = Math.max(
            this.challengeHistory.longestStreak,
            this.challengeHistory.currentStreak
          );
        } else {
          this.challengeHistory.currentStreak = 0;
        }
      } else if (daysSinceLastRefresh > 1) {
        // Missed days - reset streak
        this.challengeHistory.currentStreak = 0;
      }
    }

    // Select challenges based on player skill and history
    const selectedTemplates = this.selectChallengeTemplates();

    // Generate challenges from templates
    this.currentChallenges = selectedTemplates.map((template, index) => {
      const challengeId = `daily_${todayStart}_${index}`;

      return {
        id: challengeId,
        name: template.name,
        description: template.description,
        objective: {
          ...template.objective,
          allowedAttempts: this.getAllowedAttempts(template.difficulty),
        },
        difficulty: template.difficulty,
        baseReward: template.baseReward,
        streakBonus: this.calculateStreakBonus(template.baseReward),
        startDate: todayStart,
        endDate: tomorrowStart,
        refreshType: 'daily',
        completionRate: this.estimateCompletionRate(template),
        averageAttempts: this.estimateAverageAttempts(template),
      };
    });

    // Reset progress for new challenges
    this.challengeProgress = {};
    this.currentChallenges.forEach(challenge => {
      this.challengeProgress[challenge.id] = {
        challengeId: challenge.id,
        currentProgress: 0,
        targetProgress: challenge.objective.target,
        completed: false,
        claimed: false,
        attempts: 0,
      };
    });

    this.lastRefreshDate = todayStart;
    await this.saveToStorage();
  }

  /**
   * Select challenge templates based on difficulty progression and player history
   */
  private selectChallengeTemplates(): ChallengeTemplate[] {
    const maxChallenges = META_PROGRESSION_CONSTANTS.MAX_DAILY_CHALLENGES;
    const selected: ChallengeTemplate[] = [];

    // Ensure difficulty distribution: 1 easy, 1 medium, 1 hard/expert
    const easyTemplates = this.challengeTemplates.filter(t => t.difficulty === 'easy');
    const mediumTemplates = this.challengeTemplates.filter(t => t.difficulty === 'medium');
    const hardTemplates = this.challengeTemplates.filter(
      t => t.difficulty === 'hard' || t.difficulty === 'expert'
    );

    // Select one from each difficulty category
    if (easyTemplates.length > 0) {
      selected.push(this.weightedRandomSelect(easyTemplates));
    }

    if (mediumTemplates.length > 0) {
      selected.push(this.weightedRandomSelect(mediumTemplates));
    }

    if (hardTemplates.length > 0) {
      selected.push(this.weightedRandomSelect(hardTemplates));
    }

    return selected.slice(0, maxChallenges);
  }

  /**
   * Weighted random selection from templates
   */
  private weightedRandomSelect(templates: ChallengeTemplate[]): ChallengeTemplate {
    const totalWeight = templates.reduce((sum, template) => sum + template.weight, 0);
    let random = Math.random() * totalWeight;

    for (const template of templates) {
      random -= template.weight;
      if (random <= 0) {
        return template;
      }
    }

    return templates[templates.length - 1]; // Fallback
  }

  /**
   * Calculate streak bonus rewards
   */
  private calculateStreakBonus(baseReward: ChallengeReward): ChallengeReward {
    const streak = this.challengeHistory.currentStreak;
    const multiplier = Math.min(
      1 + streak * 0.1,
      META_PROGRESSION_CONSTANTS.CHALLENGE_STREAK_BONUS_MULTIPLIER
    );

    return {
      coins: Math.floor(baseReward.coins * (multiplier - 1)),
      experiencePoints: Math.floor((baseReward.experiencePoints || 0) * (multiplier - 1)),
    };
  }

  /**
   * Update progress for a specific challenge
   */
  public updateChallengeProgress(challengeId: string, progress: number): void {
    const challengeProgress = this.challengeProgress[challengeId];
    if (!challengeProgress) return;

    const oldProgress = challengeProgress.currentProgress;
    challengeProgress.currentProgress = Math.max(oldProgress, progress);
    challengeProgress.attempts += 1;

    // Check if challenge is completed
    if (
      challengeProgress.currentProgress >= challengeProgress.targetProgress &&
      !challengeProgress.completed
    ) {
      challengeProgress.completed = true;
      this.onChallengeCompleted(challengeId);
    }

    // Auto-save progress
    this.saveToStorage();
  }

  /**
   * Handle challenge completion
   */
  private onChallengeCompleted(challengeId: string): void {
    const challenge = this.currentChallenges.find(c => c.id === challengeId);
    if (!challenge) return;

    // Update history
    this.challengeHistory.completedChallenges.add(challengeId);
    this.challengeHistory.totalChallengesCompleted += 1;

    // Track analytics
    this.trackChallengeCompletion(challenge);
  }

  /**
   * Claim rewards for a completed challenge
   */
  public claimChallengeReward(challengeId: string): ChallengeReward | null {
    const challengeProgress = this.challengeProgress[challengeId];
    const challenge = this.currentChallenges.find(c => c.id === challengeId);

    if (
      !challengeProgress ||
      !challenge ||
      !challengeProgress.completed ||
      challengeProgress.claimed
    ) {
      return null;
    }

    challengeProgress.claimed = true;

    // Calculate total reward (base + streak bonus)
    const totalReward: ChallengeReward = {
      coins: challenge.baseReward.coins + (challenge.streakBonus?.coins || 0),
      experiencePoints:
        (challenge.baseReward.experiencePoints || 0) +
        (challenge.streakBonus?.experiencePoints || 0),
      unlockableItem: challenge.baseReward.unlockableItem,
    };

    this.saveToStorage();
    return totalReward;
  }

  /**
   * Get current daily challenges
   */
  public getCurrentChallenges(): DailyChallenge[] {
    return [...this.currentChallenges];
  }

  /**
   * Get challenge progress
   */
  public getChallengeProgress(): Record<string, DailyChallengeProgress> {
    return { ...this.challengeProgress };
  }

  /**
   * Get challenge history
   */
  public getChallengeHistory(): ChallengeHistory {
    return { ...this.challengeHistory };
  }

  /**
   * Check if any challenge was completed on a specific date
   */
  private didCompleteAnyChallenge(date: number): boolean {
    const dayStart = this.getDayStartTime(date);
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;

    return Array.from(this.challengeHistory.completedChallenges).some(challengeId => {
      const challengeDate = this.extractDateFromChallengeId(challengeId);
      return challengeDate >= dayStart && challengeDate < dayEnd;
    });
  }

  /**
   * Extract date from challenge ID
   */
  private extractDateFromChallengeId(challengeId: string): number {
    const parts = challengeId.split('_');
    return parseInt(parts[1]) || 0;
  }

  /**
   * Get allowed attempts based on difficulty
   */
  private getAllowedAttempts(difficulty: ChallengeDifficulty): number {
    switch (difficulty) {
      case 'easy':
        return 5;
      case 'medium':
        return 3;
      case 'hard':
        return 2;
      case 'expert':
        return 1;
      default:
        return 3;
    }
  }

  /**
   * Estimate completion rate for analytics
   */
  private estimateCompletionRate(template: ChallengeTemplate): number {
    switch (template.difficulty) {
      case 'easy':
        return 0.85;
      case 'medium':
        return 0.65;
      case 'hard':
        return 0.35;
      case 'expert':
        return 0.15;
      default:
        return 0.5;
    }
  }

  /**
   * Estimate average attempts for analytics
   */
  private estimateAverageAttempts(template: ChallengeTemplate): number {
    switch (template.difficulty) {
      case 'easy':
        return 1.2;
      case 'medium':
        return 2.1;
      case 'hard':
        return 3.8;
      case 'expert':
        return 4.5;
      default:
        return 2.5;
    }
  }

  /**
   * Get start of today in milliseconds
   */
  private getTodayStartTime(): number {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.getTime();
  }

  /**
   * Get start of specific day in milliseconds
   */
  private getDayStartTime(timestamp: number): number {
    const date = new Date(timestamp);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }

  /**
   * Track challenge completion for analytics
   */
  private trackChallengeCompletion(challenge: DailyChallenge): void {
    // This would integrate with the analytics system
    console.log('Challenge completed:', {
      challengeId: challenge.id,
      difficulty: challenge.difficulty,
      attempts: this.challengeProgress[challenge.id]?.attempts || 0,
      streak: this.challengeHistory.currentStreak,
    });
  }

  /**
   * Save data to AsyncStorage
   */
  private async saveToStorage(): Promise<void> {
    try {
      const savePromises = [
        AsyncStorage.setItem(STORAGE_KEYS.DAILY_CHALLENGES, JSON.stringify(this.currentChallenges)),
        AsyncStorage.setItem(
          STORAGE_KEYS.CHALLENGE_PROGRESS,
          JSON.stringify(this.challengeProgress)
        ),
        AsyncStorage.setItem(
          STORAGE_KEYS.CHALLENGE_HISTORY,
          JSON.stringify({
            ...this.challengeHistory,
            completedChallenges: Array.from(this.challengeHistory.completedChallenges),
          })
        ),
        AsyncStorage.setItem(STORAGE_KEYS.LAST_CHALLENGE_REFRESH, this.lastRefreshDate.toString()),
      ];

      await Promise.all(savePromises);
    } catch (error) {
      console.error('Failed to save daily challenge data:', error);
    }
  }

  /**
   * Load data from AsyncStorage
   */
  private async loadFromStorage(): Promise<void> {
    try {
      const [challengesData, progressData, historyData, refreshData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.DAILY_CHALLENGES),
        AsyncStorage.getItem(STORAGE_KEYS.CHALLENGE_PROGRESS),
        AsyncStorage.getItem(STORAGE_KEYS.CHALLENGE_HISTORY),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_CHALLENGE_REFRESH),
      ]);

      if (challengesData) {
        this.currentChallenges = JSON.parse(challengesData);
      }

      if (progressData) {
        this.challengeProgress = JSON.parse(progressData);
      }

      if (historyData) {
        const parsed = JSON.parse(historyData);
        this.challengeHistory = {
          ...parsed,
          completedChallenges: new Set(parsed.completedChallenges || []),
        };
      }

      if (refreshData) {
        this.lastRefreshDate = parseInt(refreshData);
      }
    } catch (error) {
      console.error('Failed to load daily challenge data:', error);
    }
  }

  /**
   * Clear all data (for testing/debugging)
   */
  public async clearAllData(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.DAILY_CHALLENGES,
      STORAGE_KEYS.CHALLENGE_PROGRESS,
      STORAGE_KEYS.CHALLENGE_HISTORY,
      STORAGE_KEYS.LAST_CHALLENGE_REFRESH,
    ]);

    this.currentChallenges = [];
    this.challengeProgress = {};
    this.challengeHistory = {
      completedChallenges: new Set(),
      currentStreak: 0,
      longestStreak: 0,
      totalChallengesCompleted: 0,
      weeklyCompletionRate: 0,
    };
    this.lastRefreshDate = 0;
  }
}

// Export singleton instance
export const dailyChallengeManager = DailyChallengeManager.getInstance();
