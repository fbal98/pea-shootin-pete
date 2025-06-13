/**
 * Analytics System for Pea Shootin' Pete
 * 
 * Comprehensive analytics tracking that supports:
 * - Level progression events (required by publishing checklist)
 * - Player behavior tracking
 * - Performance metrics
 * - Revenue optimization data
 * - A/B testing event tagging
 * 
 * Designed to integrate with Firebase Analytics, GameAnalytics, etc.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Event types based on publishing checklist requirements
export type AnalyticsEventType = 
  // Core level progression events (CRITICAL for publishing)
  | 'level_start'
  | 'level_complete' 
  | 'level_failed'
  | 'game_over'
  
  // Player behavior events
  | 'game_start'
  | 'session_start'
  | 'session_end'
  | 'balloon_popped'
  | 'projectile_fired'
  | 'combo_achieved'
  | 'retry_level'
  | 'mystery_balloon_popped'
  
  // Social and viral events
  | 'social_share'
  | 'viral_referral'
  | 'deep_link_used'
  | 'friend_invited'
  | 'challenge_shared'
  
  // Monetization events
  | 'purchase_initiated'
  | 'purchase_completed'
  | 'purchase_failed'
  | 'currency_earned'
  | 'currency_spent'
  | 'ad_shown'
  | 'ad_clicked'
  | 'ad_completed'
  | 'ad_failed'
  
  // Special events and FOMO
  | 'special_event_joined'
  | 'special_event_completed'
  | 'flash_sale_viewed'
  | 'flash_sale_purchased'
  | 'event_participation'
  
  // Progression events
  | 'level_unlocked'
  | 'achievement_unlocked'
  | 'micro_achievement_progress'
  | 'combo_milestone'
  | 'high_score_achieved'
  | 'skin_equipped'
  | 'customization_changed'
  | 'ab_test_assigned'
  
  // World map and navigation
  | 'world_map_opened'
  | 'node_selected'
  | 'theme_unlocked'
  
  // Performance events
  | 'crash_reported'
  | 'performance_issue'
  | 'loading_time';

// Event data interface
export interface AnalyticsEventData {
  // Core identifiers
  event_type: AnalyticsEventType;
  timestamp: number;
  session_id: string;
  user_id?: string;
  
  // Level-specific data
  level?: number;
  level_name?: string;
  level_duration?: number;
  level_attempts?: number;
  
  // Score and performance data
  score?: number;
  high_score?: number;
  accuracy?: number;
  combo_count?: number;
  enemies_eliminated?: number;
  
  // Failure/completion data
  failure_reason?: string;
  completion_time?: number;
  objectives_completed?: string[];
  
  // Device and session data
  device_info?: {
    platform: string;
    os_version: string;
    app_version: string;
    device_model?: string;
  };
  
  // A/B testing data
  ab_test_group?: string;
  ab_test_variant?: string;
  
  // Custom properties
  custom_properties?: Record<string, any>;
}

// Analytics configuration
interface AnalyticsConfig {
  enabled: boolean;
  debug: boolean;
  batchSize: number;
  flushInterval: number; // milliseconds
  retryAttempts: number;
  trackingId?: string;
}

// Default configuration
const DEFAULT_CONFIG: AnalyticsConfig = {
  enabled: !__DEV__, // Disable in development by default
  debug: __DEV__,
  batchSize: 10,
  flushInterval: 30000, // 30 seconds
  retryAttempts: 3,
};

// Storage keys
const STORAGE_KEYS = {
  EVENTS_QUEUE: 'psp_analytics_queue',
  SESSION_ID: 'psp_session_id',
  USER_ID: 'psp_user_id',
  CONFIG: 'psp_analytics_config',
} as const;

export class AnalyticsManager {
  private static instance: AnalyticsManager;
  private config: AnalyticsConfig = DEFAULT_CONFIG;
  private eventQueue: AnalyticsEventData[] = [];
  private sessionId: string = '';
  private userId: string = '';
  private flushTimer?: any;
  private isInitialized = false;

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): AnalyticsManager {
    if (!AnalyticsManager.instance) {
      AnalyticsManager.instance = new AnalyticsManager();
    }
    return AnalyticsManager.instance;
  }

  /**
   * Initialize the analytics system
   */
  public async initialize(config?: Partial<AnalyticsConfig>): Promise<void> {
    try {
      // Load stored configuration
      const storedConfig = await AsyncStorage.getItem(STORAGE_KEYS.CONFIG);
      if (storedConfig) {
        this.config = { ...this.config, ...JSON.parse(storedConfig) };
      }

      // Apply runtime configuration
      if (config) {
        this.config = { ...this.config, ...config };
      }

      // Initialize session and user IDs
      await this.initializeIdentifiers();

      // Load queued events from storage
      await this.loadQueuedEvents();

      // Start flush timer
      this.startFlushTimer();

      this.isInitialized = true;

      if (this.config.debug) {
        console.log('Analytics initialized:', this.config);
      }

      // Track session start
      this.track('session_start', {
        session_id: this.sessionId,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
    }
  }

  /**
   * Track an analytics event
   */
  public track(eventType: AnalyticsEventType, data: Partial<AnalyticsEventData> = {}): void {
    if (!this.config.enabled) return;

    const eventData: AnalyticsEventData = {
      event_type: eventType,
      timestamp: Date.now(),
      session_id: this.sessionId,
      user_id: this.userId,
      device_info: this.getDeviceInfo(),
      ...data,
    };

    // Add to queue
    this.eventQueue.push(eventData);

    // Debug logging
    if (this.config.debug) {
      console.log('Analytics Event:', eventType, eventData);
    }

    // Flush if batch size reached
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }

    // Save queue to storage
    this.saveQueueToStorage();
  }

  /**
   * Track level-specific events (convenience methods)
   */
  public trackLevelStart(levelId: number, levelName: string, attempts: number = 1): void {
    this.track('level_start', {
      level: levelId,
      level_name: levelName,
      level_attempts: attempts,
    });
  }

  public trackLevelComplete(
    levelId: number, 
    levelName: string, 
    score: number, 
    duration: number,
    accuracy: number,
    attempts: number = 1
  ): void {
    this.track('level_complete', {
      level: levelId,
      level_name: levelName,
      score,
      level_duration: duration,
      accuracy,
      level_attempts: attempts,
      completion_time: duration,
    });
  }

  public trackLevelFailed(
    levelId: number, 
    levelName: string, 
    reason: string,
    score: number = 0,
    duration: number = 0,
    attempts: number = 1
  ): void {
    this.track('level_failed', {
      level: levelId,
      level_name: levelName,
      failure_reason: reason,
      score,
      level_duration: duration,
      level_attempts: attempts,
    });
  }

  public trackGameOver(finalScore: number, highScore: number, levelsCompleted: number): void {
    this.track('game_over', {
      score: finalScore,
      high_score: highScore,
      level: levelsCompleted,
    });
  }

  public trackBalloonPopped(
    balloonSize: number,
    points: number,
    combo: number = 0,
    levelId?: number
  ): void {
    this.track('balloon_popped', {
      score: points,
      combo_count: combo,
      level: levelId,
      custom_properties: {
        balloon_size: balloonSize,
      },
    });
  }

  public trackMysteryBalloonPopped(
    rewardType: string,
    rarity: string,
    value: string | number,
    levelId?: number
  ): void {
    this.track('mystery_balloon_popped', {
      level: levelId,
      custom_properties: {
        reward_type: rewardType,
        reward_rarity: rarity,
        reward_value: value,
      },
    });
  }

  /**
   * Flush events to analytics service
   */
  public async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // In a real implementation, this would send to Firebase Analytics, etc.
      await this.sendEventsToService(eventsToSend);
      
      if (this.config.debug) {
        console.log(`Flushed ${eventsToSend.length} analytics events`);
      }

      // Clear from storage
      await AsyncStorage.removeItem(STORAGE_KEYS.EVENTS_QUEUE);
    } catch (error) {
      console.error('Failed to flush analytics events:', error);
      
      // Re-add events to queue for retry
      this.eventQueue = [...eventsToSend, ...this.eventQueue];
      await this.saveQueueToStorage();
    }
  }

  /**
   * Set A/B testing group for event tagging
   */
  public setABTestGroup(group: string, variant: string): void {
    // Store for future events
    this.track('ab_test_assigned', {
      ab_test_group: group,
      ab_test_variant: variant,
    });
  }

  /**
   * Update analytics configuration
   */
  public updateConfig(config: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...config };
    AsyncStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(this.config));
  }

  /**
   * Get current session statistics
   */
  public getSessionStats(): {
    sessionId: string;
    eventsTracked: number;
    queueSize: number;
  } {
    return {
      sessionId: this.sessionId,
      eventsTracked: this.eventQueue.length,
      queueSize: this.eventQueue.length,
    };
  }

  // Private methods

  private async initializeIdentifiers(): Promise<void> {
    // Generate or load session ID
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Load or generate user ID
    let storedUserId = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!storedUserId) {
      storedUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, storedUserId);
    }
    this.userId = storedUserId;
  }

  private async loadQueuedEvents(): Promise<void> {
    try {
      const queuedEvents = await AsyncStorage.getItem(STORAGE_KEYS.EVENTS_QUEUE);
      if (queuedEvents) {
        this.eventQueue = JSON.parse(queuedEvents);
      }
    } catch (error) {
      console.error('Failed to load queued events:', error);
    }
  }

  private async saveQueueToStorage(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.EVENTS_QUEUE, JSON.stringify(this.eventQueue));
    } catch (error) {
      console.error('Failed to save events queue:', error);
    }
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private async sendEventsToService(events: AnalyticsEventData[]): Promise<void> {
    // TODO: Implement actual analytics service integration
    // For now, just log events in development
    if (this.config.debug) {
      events.forEach(event => {
        console.log('📊 Analytics:', event.event_type, {
          level: event.level,
          score: event.score,
          duration: event.level_duration,
          timestamp: new Date(event.timestamp).toISOString(),
        });
      });
    }

    // In production, this would be something like:
    // await firebaseAnalytics.logEvent(event.event_type, event);
    // or
    // await gameAnalytics.track(event);
  }

  private getDeviceInfo() {
    return {
      platform: 'react-native',
      os_version: 'unknown', // Would use react-native-device-info
      app_version: '1.0.0', // Would get from app config
    };
  }
}

// Export singleton instance
export const analytics = AnalyticsManager.getInstance();

// Convenience function exports
export const trackLevelStart = (levelId: number, levelName: string, attempts?: number) => 
  analytics.trackLevelStart(levelId, levelName, attempts);

export const trackLevelComplete = (levelId: number, levelName: string, score: number, duration: number, accuracy: number, attempts?: number) => 
  analytics.trackLevelComplete(levelId, levelName, score, duration, accuracy, attempts);

export const trackLevelFailed = (levelId: number, levelName: string, reason: string, score?: number, duration?: number, attempts?: number) => 
  analytics.trackLevelFailed(levelId, levelName, reason, score, duration, attempts);

export const trackGameOver = (finalScore: number, highScore: number, levelsCompleted: number) => 
  analytics.trackGameOver(finalScore, highScore, levelsCompleted);

export const trackBalloonPopped = (balloonSize: number, points: number, combo?: number, levelId?: number) => 
  analytics.trackBalloonPopped(balloonSize, points, combo, levelId);

export const trackMysteryBalloonPopped = (rewardType: string, rarity: string, value: string | number, levelId?: number) => 
  analytics.trackMysteryBalloonPopped(rewardType, rarity, value, levelId);

// Social and viral tracking
export const trackSocialShare = (data: {
  platform: string;
  contentType: string;
  level?: number;
  score?: number;
  achievement?: string;
}) => analytics.track('social_share', { custom_properties: data });

export const trackViralReferral = (data: {
  referrerId: string;
  newUserId: string;
  campaign?: string;
  medium?: string;
  source?: string;
  bonusAwarded?: boolean;
  bonusType?: string;
  bonusAmount?: number;
  timestamp: number;
}) => analytics.track('viral_referral', { custom_properties: data });

export const trackDeepLinkUsage = (data: {
  url?: string;
  type?: string;
  challengeId?: string;
  achievementId?: string;
  levelId?: number;
  queryParams?: any;
  timestamp: number;
}) => analytics.track('deep_link_used', { custom_properties: data });

// Monetization tracking
export const trackPurchase = (data: {
  itemId: string;
  itemName: string;
  category: string;
  price: { currency: string; amount: number };
  currency: string;
  amount: number;
  timestamp: number;
}) => analytics.track('purchase_completed', { custom_properties: data });

export const trackCurrencyEarned = (data: {
  currency: string;
  amount: number;
  reason: string;
  newBalance: number;
  metadata?: any;
}) => analytics.track('currency_earned', { custom_properties: data });

export const trackCurrencySpent = (data: {
  currency: string;
  amount: number;
  reason: string;
  newBalance: number;
  metadata?: any;
}) => analytics.track('currency_spent', { custom_properties: data });

// Special events tracking
export const trackSpecialEvent = (data: {
  eventId: string;
  eventName: string;
  eventType: string;
  action: string;
  timestamp: number;
}) => analytics.track('special_event_joined', { custom_properties: data });

export const trackEventParticipation = (data: {
  eventId: string;
  eventName: string;
  playerId: string;
  action: string;
  objectiveId?: string;
  timestamp: number;
}) => analytics.track('event_participation', { custom_properties: data });

// Achievement tracking
export const trackAchievementUnlocked = (data: {
  achievementId: string;
  achievementName: string;
  category: string;
  rarity: string;
  difficulty: number;
  timeToComplete: number;
  timestamp: number;
}) => analytics.track('achievement_unlocked', { custom_properties: data });

export const trackMicroProgress = (data: {
  achievementId: string;
  progress: number;
  target: number;
  category: string;
  timestamp: number;
}) => analytics.track('micro_achievement_progress', { custom_properties: data });

// Combo tracking
export const trackComboEvent = (data: {
  comboCount: number;
  multiplier: number;
  comboType: string;
  accuracy?: number;
  timing?: string;
  action?: string;
  reason?: string;
  timestamp: number;
}) => analytics.track('combo_achieved', { custom_properties: data });

// Viral metrics tracking
export const trackViralMetrics = (data: {
  totalShares: number;
  successfulReferrals: number;
  viralCoefficient: number;
  shareConversionRate: number;
  platformBreakdown: Record<string, number>;
  conversionByPlatform: Record<string, number>;
  averageTimeToConversion: number;
  retentionAfterReferral: number;
}) => analytics.track('viral_referral', { custom_properties: data });

export const trackShareConversion = (data: {
  shareId: string;
  platform: string;
  contentType?: string;
  userId: string;
  referredUserId?: string;
  timestamp: number;
  event: string;
  conversionTime?: number;
}) => analytics.track('social_share', { custom_properties: data });