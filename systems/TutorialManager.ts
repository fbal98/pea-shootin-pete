/**
 * Tutorial Manager - Interactive guidance system for progression features
 *
 * Manages the complete tutorial experience including:
 * - Progressive disclosure of features
 * - Contextual hints and guided interactions
 * - Completion tracking and analytics
 * - Adaptive tutorials based on player behavior
 *
 * Designed for maximum engagement and minimal friction.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  TutorialManager as ITutorialManager,
  TutorialState,
  TutorialSeries,
  TutorialStep,
  TutorialTriggerEvent,
  TutorialAnalyticsAction,
  TutorialAnalyticsEvent,
  TutorialSeriesId,
  TUTORIAL_SERIES,
} from '../types/TutorialTypes';

// Storage keys
const STORAGE_KEYS = {
  TUTORIAL_STATE: 'psp_tutorial_state',
  TUTORIAL_ANALYTICS: 'psp_tutorial_analytics',
} as const;

export class TutorialManager implements ITutorialManager {
  private static instance: TutorialManager;
  private state: TutorialState;
  private tutorialContent: Map<string, TutorialSeries> = new Map();
  private listeners: Map<string, ((step: TutorialStep) => void)[]> = new Map();
  private analyticsQueue: TutorialAnalyticsEvent[] = [];

  private constructor() {
    this.state = this.createInitialState();
    this.initializeTutorialContent();
    this.loadState();
  }

  public static getInstance(): TutorialManager {
    if (!TutorialManager.instance) {
      TutorialManager.instance = new TutorialManager();
    }
    return TutorialManager.instance;
  }

  // Core functionality
  public async startTutorial(seriesId: string): Promise<boolean> {
    const series = this.tutorialContent.get(seriesId);
    if (!series) {
      console.warn(`Tutorial series not found: ${seriesId}`);
      return false;
    }

    // Check if already completed
    if (this.state.completedSeries.has(seriesId)) {
      console.log(`Tutorial already completed: ${seriesId}`);
      return false;
    }

    // Check prerequisites
    if (!this.checkPrerequisites(series)) {
      console.log(`Prerequisites not met for tutorial: ${seriesId}`);
      return false;
    }

    // Start tutorial
    this.state.activeTutorial = seriesId;
    this.state.currentStep = series.steps[0]?.id;
    this.state.tutorialStartTimes[seriesId] = Date.now();

    // Track analytics
    this.trackTutorialMetrics(seriesId, 'started');

    // Show first step
    if (series.steps.length > 0) {
      this.showTutorialStep(series.steps[0]);
    }

    await this.saveState();
    return true;
  }

  public completeTutorialStep(stepId: string): void {
    if (!this.state.activeTutorial || !this.state.currentStep) return;

    const currentSeries = this.tutorialContent.get(this.state.activeTutorial);
    if (!currentSeries) return;

    // Mark step as completed
    this.state.completedSteps.add(stepId);
    this.state.stepCompletionTimes[stepId] = Date.now();

    // Track analytics
    this.trackTutorialMetrics(stepId, 'completed');

    // Find next step
    const currentStepIndex = currentSeries.steps.findIndex(step => step.id === stepId);
    const nextStep = currentSeries.steps[currentStepIndex + 1];

    if (nextStep) {
      // Continue to next step
      this.state.currentStep = nextStep.id;
      this.showTutorialStep(nextStep);
    } else {
      // Tutorial series completed
      this.completeTutorialSeries(this.state.activeTutorial);
    }

    this.saveState();
  }

  public skipTutorial(seriesId: string): void {
    this.state.skippedSeries.add(seriesId);

    if (this.state.activeTutorial === seriesId) {
      this.state.activeTutorial = undefined;
      this.state.currentStep = undefined;
    }

    // Track analytics
    this.trackTutorialMetrics(seriesId, 'skipped');

    this.saveState();
    this.notifyListeners('tutorial_skipped', null);
  }

  // State queries
  public isTutorialActive(): boolean {
    return !!this.state.activeTutorial;
  }

  public getCurrentTutorial(): TutorialSeries | null {
    if (!this.state.activeTutorial) return null;
    return this.tutorialContent.get(this.state.activeTutorial) || null;
  }

  public getCurrentStep(): TutorialStep | null {
    if (!this.state.currentStep) return null;

    const currentTutorial = this.getCurrentTutorial();
    if (!currentTutorial) return null;

    return currentTutorial.steps.find(step => step.id === this.state.currentStep) || null;
  }

  public isTutorialCompleted(seriesId: string): boolean {
    return this.state.completedSeries.has(seriesId);
  }

  // Event handling
  public onTutorialEvent(event: TutorialTriggerEvent, parameters?: any): void {
    // Check if any tutorials should be triggered by this event
    this.tutorialContent.forEach((series, seriesId) => {
      if (this.shouldTriggerTutorial(series, event, parameters)) {
        this.startTutorial(seriesId);
      }
    });
  }

  public checkTriggerConditions(): void {
    // Check all tutorials for trigger conditions
    this.tutorialContent.forEach((series, seriesId) => {
      if (this.evaluateTriggerConditions(series)) {
        this.startTutorial(seriesId);
      }
    });
  }

  // Settings
  public updateTutorialSettings(settings: Partial<TutorialState>): void {
    this.state = { ...this.state, ...settings };
    this.saveState();
  }

  public resetTutorialProgress(): void {
    this.state = this.createInitialState();
    this.saveState();
    AsyncStorage.removeItem(STORAGE_KEYS.TUTORIAL_ANALYTICS);
  }

  // Analytics
  public trackTutorialMetrics(id: string, action: TutorialAnalyticsAction): void {
    const event: TutorialAnalyticsEvent = {
      tutorialId: this.state.activeTutorial || id,
      stepId: action === 'started' ? undefined : id,
      action,
      timestamp: Date.now(),
      metadata: {
        tutorialsEnabled: this.state.tutorialsEnabled,
        playerPreferredSpeed: this.state.preferredTutorialSpeed,
      },
    };

    // Calculate duration for completed steps
    if (action === 'completed' && this.state.tutorialStartTimes[id]) {
      event.duration = Date.now() - this.state.tutorialStartTimes[id];
    }

    this.analyticsQueue.push(event);
    this.flushAnalytics();
  }

  // Public helper methods
  public addTutorialSeries(series: TutorialSeries): void {
    this.tutorialContent.set(series.id, series);
  }

  public addEventListener(event: string, callback: (step: TutorialStep) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  public removeEventListener(event: string, callback: (step: TutorialStep) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  // Private methods
  private createInitialState(): TutorialState {
    return {
      completedSteps: new Set(),
      completedSeries: new Set(),
      skippedSeries: new Set(),
      activeTutorial: undefined,
      currentStep: undefined,
      tutorialsEnabled: true,
      showTooltips: true,
      autoAdvanceEnabled: true,
      tutorialStartTimes: {},
      stepCompletionTimes: {},
      preferredTutorialSpeed: 'normal',
      skipNonCritical: false,
    };
  }

  private async loadState(): Promise<void> {
    try {
      const storedState = await AsyncStorage.getItem(STORAGE_KEYS.TUTORIAL_STATE);
      if (storedState) {
        const parsed = JSON.parse(storedState);
        this.state = {
          ...this.state,
          ...parsed,
          completedSteps: new Set(parsed.completedSteps || []),
          completedSeries: new Set(parsed.completedSeries || []),
          skippedSeries: new Set(parsed.skippedSeries || []),
        };
      }
    } catch (error) {
      console.error('Failed to load tutorial state:', error);
    }
  }

  private async saveState(): Promise<void> {
    try {
      const stateToSave = {
        ...this.state,
        completedSteps: Array.from(this.state.completedSteps),
        completedSeries: Array.from(this.state.completedSeries),
        skippedSeries: Array.from(this.state.skippedSeries),
      };
      await AsyncStorage.setItem(STORAGE_KEYS.TUTORIAL_STATE, JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Failed to save tutorial state:', error);
    }
  }

  private checkPrerequisites(series: TutorialSeries): boolean {
    // Check prerequisite series
    if (series.prerequisiteSeries) {
      for (const prereqId of series.prerequisiteSeries) {
        if (!this.state.completedSeries.has(prereqId)) {
          return false;
        }
      }
    }

    // Check unlock conditions
    if (series.unlockConditions) {
      for (const condition of series.unlockConditions) {
        if (!this.evaluateUnlockCondition(condition)) {
          return false;
        }
      }
    }

    return true;
  }

  private evaluateUnlockCondition(condition: any): boolean {
    // This would integrate with the meta progression system
    // For now, return true as a placeholder
    return true;
  }

  private shouldTriggerTutorial(
    series: TutorialSeries,
    event: TutorialTriggerEvent,
    parameters?: any
  ): boolean {
    // Already completed or skipped
    if (this.state.completedSeries.has(series.id) || this.state.skippedSeries.has(series.id)) {
      return false;
    }

    // Already active
    if (this.state.activeTutorial === series.id) {
      return false;
    }

    // Check if this event should trigger this tutorial
    return series.triggerConditions.some(condition => {
      return (
        condition.event === event && this.checkTriggerFrequency(series.id, condition.frequency)
      );
    });
  }

  private checkTriggerFrequency(seriesId: string, frequency: any): boolean {
    // Implement frequency checking logic
    switch (frequency) {
      case 'once':
        return !this.state.completedSeries.has(seriesId) && !this.state.skippedSeries.has(seriesId);
      case 'daily':
        // Check if shown today
        return true; // Placeholder
      case 'always':
        return true;
      default:
        return true;
    }
  }

  private evaluateTriggerConditions(series: TutorialSeries): boolean {
    // Check prerequisites first
    if (!this.checkPrerequisites(series)) {
      return false;
    }

    // Already completed, skipped, or active
    if (
      this.state.completedSeries.has(series.id) ||
      this.state.skippedSeries.has(series.id) ||
      this.state.activeTutorial === series.id
    ) {
      return false;
    }

    // Tutorials disabled
    if (!this.state.tutorialsEnabled) {
      return false;
    }

    return true;
  }

  private completeTutorialSeries(seriesId: string): void {
    this.state.completedSeries.add(seriesId);
    this.state.activeTutorial = undefined;
    this.state.currentStep = undefined;

    // Award completion reward
    const series = this.tutorialContent.get(seriesId);
    if (series?.completionReward) {
      this.awardTutorialReward(series.completionReward);
    }

    // Track analytics
    const startTime = this.state.tutorialStartTimes[seriesId];
    const duration = startTime ? Date.now() - startTime : undefined;

    this.trackTutorialMetrics(seriesId, 'completed');

    this.notifyListeners('tutorial_completed', null);
  }

  private awardTutorialReward(reward: any): void {
    // This would integrate with the meta progression system
    console.log('Tutorial reward awarded:', reward);
  }

  private showTutorialStep(step: TutorialStep): void {
    // Apply delay if specified
    const delay = step.delay || 0;

    setTimeout(() => {
      this.notifyListeners('step_shown', step);

      // Auto-advance if specified
      if (step.autoAdvance && step.autoAdvance > 0) {
        setTimeout(() => {
          this.completeTutorialStep(step.id);
        }, step.autoAdvance);
      }
    }, delay);
  }

  private notifyListeners(event: string, step: TutorialStep | null): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners && step) {
      eventListeners.forEach(callback => callback(step));
    }
  }

  private async flushAnalytics(): Promise<void> {
    if (this.analyticsQueue.length === 0) return;

    try {
      const existingData = await AsyncStorage.getItem(STORAGE_KEYS.TUTORIAL_ANALYTICS);
      const allEvents = existingData ? JSON.parse(existingData) : [];

      allEvents.push(...this.analyticsQueue);

      await AsyncStorage.setItem(STORAGE_KEYS.TUTORIAL_ANALYTICS, JSON.stringify(allEvents));
      this.analyticsQueue = [];
    } catch (error) {
      console.error('Failed to save tutorial analytics:', error);
    }
  }

  private initializeTutorialContent(): void {
    // Initialize built-in tutorial series
    this.addTutorialSeries(this.createFirstGameTutorial());
    this.addTutorialSeries(this.createMysteryBalloonTutorial());
    this.addTutorialSeries(this.createDailyChallengesTutorial());
    this.addTutorialSeries(this.createBattlePassTutorial());
    this.addTutorialSeries(this.createAchievementsTutorial());
  }

  private createFirstGameTutorial(): TutorialSeries {
    return {
      id: TUTORIAL_SERIES.FIRST_GAME,
      name: "Welcome to Pea Shootin' Pete!",
      description: 'Learn the basics of gameplay',
      category: 'core_gameplay',
      steps: [
        {
          id: 'welcome',
          type: 'modal',
          title: 'Welcome!',
          description: 'Tap to shoot peas at bouncing balloons. Swipe to move Pete left and right.',
          trigger: 'immediate',
          skipAllowed: false,
          category: 'core_gameplay',
          importance: 'critical',
        },
        {
          id: 'first_tap',
          type: 'spotlight',
          title: 'Tap to Shoot',
          description: 'Tap anywhere to shoot a pea upward!',
          trigger: 'user_action',
          actionRequired: {
            type: 'tap',
            timeout: 30000,
          },
          skipAllowed: false,
          category: 'core_gameplay',
          importance: 'critical',
        },
        {
          id: 'first_swipe',
          type: 'guided_interaction',
          title: 'Move Pete',
          description: 'Swipe left and right to move Pete around!',
          trigger: 'user_action',
          actionRequired: {
            type: 'swipe',
            timeout: 30000,
          },
          skipAllowed: false,
          category: 'core_gameplay',
          importance: 'critical',
        },
      ],
      skippable: false,
      triggerConditions: [
        {
          event: 'app_launch',
          frequency: 'once',
        },
      ],
    };
  }

  private createMysteryBalloonTutorial(): TutorialSeries {
    return {
      id: TUTORIAL_SERIES.MYSTERY_BALLOONS,
      name: 'Mystery Balloon Rewards',
      description: 'Discover special reward balloons',
      category: 'progression',
      steps: [
        {
          id: 'mystery_intro',
          type: 'tooltip',
          title: 'Mystery Balloon!',
          description:
            'This shimmering balloon contains a special reward! Shoot it to collect coins, XP, or cosmetics.',
          trigger: 'first_mystery_balloon',
          skipAllowed: true,
          category: 'progression',
          importance: 'recommended',
          highlightArea: {
            shape: 'circle',
            padding: 20,
            glow: true,
            animation: 'pulse',
          },
          arrow: 'down',
        },
        {
          id: 'mystery_collect',
          type: 'celebration',
          title: 'Reward Collected!',
          description:
            'Mystery balloons appear randomly and contain valuable rewards. Keep playing to find more!',
          trigger: 'user_action',
          actionRequired: {
            type: 'tap',
            timeout: 15000,
          },
          skipAllowed: true,
          category: 'progression',
          importance: 'recommended',
        },
      ],
      skippable: true,
      triggerConditions: [
        {
          event: 'mystery_balloon_spawn',
          frequency: 'once',
        },
      ],
      completionReward: {
        type: 'coins',
        amount: 100,
      },
    };
  }

  private createDailyChallengesTutorial(): TutorialSeries {
    return {
      id: TUTORIAL_SERIES.DAILY_CHALLENGES,
      name: 'Daily Challenges',
      description: 'Complete daily objectives for rewards',
      category: 'progression',
      steps: [
        {
          id: 'challenges_intro',
          type: 'tooltip',
          title: 'Daily Challenge',
          description:
            'Complete this challenge today for bonus coins and XP! New challenges appear every day.',
          trigger: 'challenge_available',
          skipAllowed: true,
          category: 'progression',
          importance: 'recommended',
          targetElement: 'challenge_progress_bar',
          arrow: 'up',
        },
      ],
      skippable: true,
      triggerConditions: [
        {
          event: 'challenge_available',
          frequency: 'once',
        },
      ],
    };
  }

  private createBattlePassTutorial(): TutorialSeries {
    return {
      id: TUTORIAL_SERIES.BATTLE_PASS_INTRO,
      name: 'Battle Pass Progression',
      description: 'Earn XP to unlock rewards',
      category: 'progression',
      steps: [
        {
          id: 'battlepass_intro',
          type: 'tooltip',
          title: 'Battle Pass',
          description:
            'Earn XP by playing to unlock tiers and claim rewards! Each tier has cool prizes.',
          trigger: 'level_start',
          skipAllowed: true,
          category: 'progression',
          importance: 'recommended',
          targetElement: 'battle_pass_progress',
          arrow: 'down',
        },
      ],
      skippable: true,
      triggerConditions: [
        {
          event: 'battle_pass_tier_up',
          frequency: 'once',
        },
      ],
    };
  }

  private createAchievementsTutorial(): TutorialSeries {
    return {
      id: TUTORIAL_SERIES.ACHIEVEMENTS,
      name: 'Achievements',
      description: 'Unlock achievements for special rewards',
      category: 'progression',
      steps: [
        {
          id: 'achievement_unlock',
          type: 'celebration',
          title: 'Achievement Unlocked!',
          description:
            'You earned an achievement! These provide coins, XP, and sometimes unlock new customizations.',
          trigger: 'achievement_unlock',
          skipAllowed: true,
          category: 'progression',
          importance: 'recommended',
          autoAdvance: 3000,
        },
      ],
      skippable: true,
      triggerConditions: [
        {
          event: 'achievement_unlock',
          frequency: 'once',
        },
      ],
    };
  }
}

// Export singleton instance
export const tutorialManager = TutorialManager.getInstance();
