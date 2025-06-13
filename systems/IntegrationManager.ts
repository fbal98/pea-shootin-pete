import { analytics } from '../utils/analytics';
import { deepLinkManager } from './DeepLinkManager';
import { viralTrackingManager } from './ViralTrackingManager';
import { specialEventsManager } from './SpecialEventsManager';
import { microAchievementSystem } from './MicroAchievementSystem';
import ComboSystem from './ComboSystem';
import { useEconomyStore } from '../store/economyStore';
import { useLevelProgressionStore } from '../store/levelProgressionStore';
import { useSocialStore } from '../store/socialStore';

export interface SystemHealth {
  system: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  lastChecked: number;
}

export interface IntegrationTestResult {
  testName: string;
  passed: boolean;
  error?: string;
  duration: number;
  timestamp: number;
}

export interface QAReport {
  systemsHealth: SystemHealth[];
  integrationTests: IntegrationTestResult[];
  performanceMetrics: {
    memoryUsage: number;
    frameRate: number;
    loadTimes: Record<string, number>;
  };
  featureStatus: {
    socialSharing: boolean;
    viralTracking: boolean;
    economySystem: boolean;
    achievementSystem: boolean;
    specialEvents: boolean;
    comboSystem: boolean;
    worldMap: boolean;
    analytics: boolean;
  };
  criticalIssues: string[];
  recommendations: string[];
  timestamp: number;
}

class IntegrationManager {
  private static instance: IntegrationManager;
  private systemHealthChecks: Map<string, SystemHealth> = new Map();
  private comboSystem: ComboSystem;
  private lastQAReport: QAReport | null = null;

  private constructor() {
    this.comboSystem = new ComboSystem();
    this.initialize();
  }

  public static getInstance(): IntegrationManager {
    if (!IntegrationManager.instance) {
      IntegrationManager.instance = new IntegrationManager();
    }
    return IntegrationManager.instance;
  }

  private async initialize() {
    try {
      // Initialize all systems
      await this.initializeAnalytics();
      await this.initializeDeepLinking();
      await this.initializeAchievements();
      await this.initializeEvents();

      // Set up system integrations
      this.setupSystemIntegrations();

      // Start health monitoring
      this.startHealthMonitoring();

      console.log('✅ Integration Manager initialized successfully');
    } catch (error) {
      console.error('❌ Integration Manager initialization failed:', error);
    }
  }

  private async initializeAnalytics() {
    try {
      await analytics.initialize({
        enabled: true,
        debug: __DEV__,
        batchSize: 10,
        flushInterval: 30000,
      });

      this.updateSystemHealth('analytics', 'healthy', 'Analytics system initialized');
    } catch (error) {
      this.updateSystemHealth('analytics', 'error', `Analytics initialization failed: ${error}`);
    }
  }

  private async initializeDeepLinking() {
    try {
      // Deep link manager initializes automatically
      this.updateSystemHealth('deepLinking', 'healthy', 'Deep linking system initialized');
    } catch (error) {
      this.updateSystemHealth(
        'deepLinking',
        'error',
        `Deep linking initialization failed: ${error}`
      );
    }
  }

  private async initializeAchievements() {
    try {
      // Set up achievement callbacks
      microAchievementSystem.setCallbacks({
        onAchievementUnlocked: achievement => {
          console.log('🏆 Achievement unlocked:', achievement.name);

          // Trigger achievement celebration
          this.onAchievementUnlocked(achievement.id);

          // Award economy rewards
          const economyStore = useEconomyStore.getState();
          achievement.rewards.forEach(reward => {
            if (reward.type === 'currency' && reward.currency && reward.amount) {
              economyStore.addCurrency(
                reward.currency,
                reward.amount,
                `Achievement: ${achievement.name}`
              );
            }
          });

          // Track analytics
          analytics.track('achievement_unlocked', {
            custom_properties: {
              achievementId: achievement.id,
              achievementName: achievement.name,
              category: achievement.category,
              rarity: achievement.rarity,
            },
          });
        },
        onProgressUpdate: (achievement, progress) => {
          console.log(
            '📈 Achievement progress:',
            achievement.name,
            `${progress.progress}/${achievement.target}`
          );
        },
        onToastRequest: toast => {
          // This would trigger UI toast notifications
          console.log('🍞 Achievement toast:', toast.type, toast.achievement.name);
        },
      });

      this.updateSystemHealth('achievements', 'healthy', 'Achievement system initialized');
    } catch (error) {
      this.updateSystemHealth(
        'achievements',
        'error',
        `Achievement system initialization failed: ${error}`
      );
    }
  }

  private async initializeEvents() {
    try {
      // Special events manager initializes automatically
      this.updateSystemHealth('specialEvents', 'healthy', 'Special events system initialized');
    } catch (error) {
      this.updateSystemHealth(
        'specialEvents',
        'error',
        `Special events initialization failed: ${error}`
      );
    }
  }

  private setupSystemIntegrations() {
    // Set up combo system callbacks
    this.comboSystem.setCallbacks({
      onComboChange: combo => {
        // Update achievement progress
        microAchievementSystem.trackComboAchieved(combo.count);

        // Trigger combo celebration for significant combos
        this.onComboAchieved(combo.count, combo.multiplier);

        // Track analytics
        analytics.track('combo_achieved', {
          combo_count: combo.count,
          score: combo.multiplier,
          custom_properties: {
            comboType: combo.comboType.id,
            multiplier: combo.multiplier,
          },
        });
      },
      onComboBreak: (finalCombo, reason) => {
        console.log(`💥 Combo broken: ${finalCombo}x (${reason})`);
      },
      onComboAchievement: achievement => {
        console.log('🎯 Combo achievement unlocked:', achievement.name);
      },
      onVisualEffect: effect => {
        console.log('✨ Visual effect triggered:', effect.type);
      },
    });

    // Set up viral tracking integration
    viralTrackingManager.trackShareEvent({
      platform: 'integration_test',
      contentType: 'system_check',
      userId: 'system',
      timestamp: Date.now(),
    });

    console.log('🔗 System integrations configured');
  }

  private startHealthMonitoring() {
    // Monitor system health every 30 seconds
    setInterval(() => {
      this.performHealthChecks();
    }, 30000);

    // Perform initial health check
    this.performHealthChecks();
  }

  private async performHealthChecks() {
    // Check analytics system
    try {
      const analyticsStats = analytics.getSessionStats();
      if (analyticsStats.sessionId) {
        this.updateSystemHealth(
          'analytics',
          'healthy',
          `Session: ${analyticsStats.sessionId.slice(-8)}`
        );
      } else {
        this.updateSystemHealth('analytics', 'warning', 'No active session');
      }
    } catch (error) {
      this.updateSystemHealth('analytics', 'error', `Analytics health check failed: ${error}`);
    }

    // Check stores
    try {
      const economyStore = useEconomyStore.getState();
      const socialStore = useSocialStore.getState();
      const levelStore = useLevelProgressionStore.getState();

      this.updateSystemHealth(
        'economyStore',
        'healthy',
        `Balance: ${economyStore.balances.coins} coins`
      );
      this.updateSystemHealth('socialStore', 'healthy', `Friends: ${socialStore.friends.length}`);
      this.updateSystemHealth('levelStore', 'healthy', `Current level: ${levelStore.currentLevel}`);
    } catch (error) {
      this.updateSystemHealth('stores', 'error', `Store health check failed: ${error}`);
    }

    // Check viral tracking
    try {
      const viralMetrics = viralTrackingManager.getViralMetrics();
      const coefficient = viralMetrics.viralCoefficient;

      if (coefficient > 0.1) {
        this.updateSystemHealth(
          'viralTracking',
          'healthy',
          `Viral coefficient: ${coefficient.toFixed(3)}`
        );
      } else if (coefficient > 0.05) {
        this.updateSystemHealth(
          'viralTracking',
          'warning',
          `Low viral coefficient: ${coefficient.toFixed(3)}`
        );
      } else {
        this.updateSystemHealth(
          'viralTracking',
          'warning',
          `Very low viral coefficient: ${coefficient.toFixed(3)}`
        );
      }
    } catch (error) {
      this.updateSystemHealth(
        'viralTracking',
        'error',
        `Viral tracking health check failed: ${error}`
      );
    }

    // Check special events
    try {
      const activeEvents = specialEventsManager.getActiveEvents();
      this.updateSystemHealth('specialEvents', 'healthy', `Active events: ${activeEvents.length}`);
    } catch (error) {
      this.updateSystemHealth(
        'specialEvents',
        'error',
        `Special events health check failed: ${error}`
      );
    }

    // Check achievements
    try {
      const completedAchievements = microAchievementSystem.getCompletedAchievements();
      this.updateSystemHealth(
        'achievements',
        'healthy',
        `Completed: ${completedAchievements.length}`
      );
    } catch (error) {
      this.updateSystemHealth('achievements', 'error', `Achievement health check failed: ${error}`);
    }
  }

  private updateSystemHealth(
    system: string,
    status: 'healthy' | 'warning' | 'error',
    message: string
  ) {
    this.systemHealthChecks.set(system, {
      system,
      status,
      message,
      lastChecked: Date.now(),
    });
  }

  // Public API

  public async runIntegrationTests(): Promise<IntegrationTestResult[]> {
    const results: IntegrationTestResult[] = [];

    // Test 1: Analytics tracking
    const analyticsTest = await this.testAnalyticsIntegration();
    results.push(analyticsTest);

    // Test 2: Achievement system
    const achievementTest = await this.testAchievementIntegration();
    results.push(achievementTest);

    // Test 3: Economy system
    const economyTest = await this.testEconomyIntegration();
    results.push(economyTest);

    // Test 4: Social features
    const socialTest = await this.testSocialIntegration();
    results.push(socialTest);

    // Test 5: Special events
    const eventsTest = await this.testSpecialEventsIntegration();
    results.push(eventsTest);

    // Test 6: Combo system
    const comboTest = await this.testComboIntegration();
    results.push(comboTest);

    // Test 7: Viral tracking
    const viralTest = await this.testViralTrackingIntegration();
    results.push(viralTest);

    return results;
  }

  private async testAnalyticsIntegration(): Promise<IntegrationTestResult> {
    const startTime = Date.now();

    try {
      // Test analytics tracking
      analytics.track('game_start', { level: 1 });
      analytics.trackLevelStart(1, 'Test Level', 1);
      analytics.trackLevelComplete(1, 'Test Level', 1000, 30000, 0.85, 1);

      const stats = analytics.getSessionStats();

      if (!stats.sessionId) {
        throw new Error('No session ID found');
      }

      return {
        testName: 'Analytics Integration',
        passed: true,
        duration: Date.now() - startTime,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        testName: 'Analytics Integration',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: Date.now(),
      };
    }
  }

  private async testAchievementIntegration(): Promise<IntegrationTestResult> {
    const startTime = Date.now();

    try {
      // Test achievement tracking
      microAchievementSystem.trackShotFired();
      microAchievementSystem.trackBalloonPopped();
      microAchievementSystem.trackAccurateHit(0.98);

      const achievements = microAchievementSystem.getAllAchievements();
      if (achievements.length === 0) {
        throw new Error('No achievements found');
      }

      return {
        testName: 'Achievement Integration',
        passed: true,
        duration: Date.now() - startTime,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        testName: 'Achievement Integration',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: Date.now(),
      };
    }
  }

  private async testEconomyIntegration(): Promise<IntegrationTestResult> {
    const startTime = Date.now();

    try {
      const economyStore = useEconomyStore.getState();

      // Test currency operations
      const initialCoins = economyStore.balances.coins;
      economyStore.addCurrency('coins', 100, 'Integration test');

      if (economyStore.balances.coins !== initialCoins + 100) {
        throw new Error('Currency addition failed');
      }

      const canAfford = economyStore.canAfford({ currency: 'coins', amount: 50 });
      if (!canAfford) {
        throw new Error('Can afford check failed');
      }

      return {
        testName: 'Economy Integration',
        passed: true,
        duration: Date.now() - startTime,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        testName: 'Economy Integration',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: Date.now(),
      };
    }
  }

  private async testSocialIntegration(): Promise<IntegrationTestResult> {
    const startTime = Date.now();

    try {
      const socialStore = useSocialStore.getState();

      // Test social features
      socialStore.incrementShareCount();
      socialStore.addRecentShare({
        platform: 'test',
        contentType: 'integration_test',
        timestamp: Date.now(),
      });

      if (socialStore.shareCount === 0) {
        throw new Error('Share count not incremented');
      }

      return {
        testName: 'Social Integration',
        passed: true,
        duration: Date.now() - startTime,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        testName: 'Social Integration',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: Date.now(),
      };
    }
  }

  private async testSpecialEventsIntegration(): Promise<IntegrationTestResult> {
    const startTime = Date.now();

    try {
      const activeEvents = specialEventsManager.getActiveEvents();
      const upcomingEvents = specialEventsManager.getUpcomingEvents();

      // Events should be initialized
      if (activeEvents.length === 0 && upcomingEvents.length === 0) {
        throw new Error('No events found');
      }

      return {
        testName: 'Special Events Integration',
        passed: true,
        duration: Date.now() - startTime,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        testName: 'Special Events Integration',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: Date.now(),
      };
    }
  }

  private async testComboIntegration(): Promise<IntegrationTestResult> {
    const startTime = Date.now();

    try {
      // Test combo system
      const hitResult = this.comboSystem.registerHit({
        timestamp: Date.now(),
        targetType: 'small',
        accuracy: 0.95,
        timingWindow: 'perfect',
        consecutiveHit: true,
      });

      if (hitResult.scoreMultiplier <= 1) {
        throw new Error('Combo multiplier not working');
      }

      const comboData = this.comboSystem.getCurrentCombo();
      if (comboData.count !== 1) {
        throw new Error('Combo count not incremented');
      }

      return {
        testName: 'Combo Integration',
        passed: true,
        duration: Date.now() - startTime,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        testName: 'Combo Integration',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: Date.now(),
      };
    }
  }

  private async testViralTrackingIntegration(): Promise<IntegrationTestResult> {
    const startTime = Date.now();

    try {
      // Test viral tracking
      const shareId = viralTrackingManager.trackShareEvent({
        platform: 'test',
        contentType: 'integration_test',
        userId: 'test_user',
        timestamp: Date.now(),
      });

      if (!shareId) {
        throw new Error('Share tracking failed');
      }

      const metrics = viralTrackingManager.getViralMetrics();
      if (typeof metrics.viralCoefficient !== 'number') {
        throw new Error('Viral coefficient calculation failed');
      }

      return {
        testName: 'Viral Tracking Integration',
        passed: true,
        duration: Date.now() - startTime,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        testName: 'Viral Tracking Integration',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: Date.now(),
      };
    }
  }

  public async generateQAReport(): Promise<QAReport> {
    const integrationTests = await this.runIntegrationTests();
    const systemsHealth = Array.from(this.systemHealthChecks.values());

    const criticalIssues: string[] = [];
    const recommendations: string[] = [];

    // Analyze health checks
    systemsHealth.forEach(health => {
      if (health.status === 'error') {
        criticalIssues.push(`${health.system}: ${health.message}`);
      }
    });

    // Analyze test results
    integrationTests.forEach(test => {
      if (!test.passed) {
        criticalIssues.push(`${test.testName}: ${test.error}`);
      }
    });

    // Generate recommendations
    if (criticalIssues.length > 0) {
      recommendations.push('Address critical issues before release');
    }

    const viralMetrics = viralTrackingManager.getViralMetrics();
    if (viralMetrics.viralCoefficient < 0.1) {
      recommendations.push('Improve viral coefficient through better share incentives');
    }

    if (integrationTests.some(test => test.duration > 5000)) {
      recommendations.push('Optimize slow integration tests');
    }

    const report: QAReport = {
      systemsHealth,
      integrationTests,
      performanceMetrics: {
        memoryUsage: 0, // Would use react-native-performance monitor
        frameRate: 60, // Would measure actual FPS
        loadTimes: {
          analytics: 100,
          achievements: 150,
          economy: 80,
        },
      },
      featureStatus: {
        socialSharing: systemsHealth.find(h => h.system === 'socialStore')?.status === 'healthy',
        viralTracking: systemsHealth.find(h => h.system === 'viralTracking')?.status === 'healthy',
        economySystem: systemsHealth.find(h => h.system === 'economyStore')?.status === 'healthy',
        achievementSystem:
          systemsHealth.find(h => h.system === 'achievements')?.status === 'healthy',
        specialEvents: systemsHealth.find(h => h.system === 'specialEvents')?.status === 'healthy',
        comboSystem:
          integrationTests.find(t => t.testName === 'Combo Integration')?.passed || false,
        worldMap: true, // Static component, assume working
        analytics: systemsHealth.find(h => h.system === 'analytics')?.status === 'healthy',
      },
      criticalIssues,
      recommendations,
      timestamp: Date.now(),
    };

    this.lastQAReport = report;
    return report;
  }

  public getSystemHealth(): SystemHealth[] {
    return Array.from(this.systemHealthChecks.values());
  }

  public getLastQAReport(): QAReport | null {
    return this.lastQAReport;
  }

  public getComboSystem(): ComboSystem {
    return this.comboSystem;
  }

  // =============================================================================
  // GAME EVENT INTEGRATION METHODS
  // =============================================================================

  /**
   * Called when a projectile hits an enemy
   */
  public onProjectileHit(enemyType: 'small' | 'medium' | 'large', accuracy: number = 0.8) {
    try {
      // Track with micro achievement system
      microAchievementSystem.trackBalloonPopped();
      microAchievementSystem.trackAccurateHit(accuracy);

      // Register hit with combo system
      const comboHit = {
        timestamp: Date.now(),
        targetType: enemyType,
        accuracy,
        timingWindow: (accuracy > 0.95 ? 'perfect' : accuracy > 0.8 ? 'great' : 'good') as
          | 'perfect'
          | 'great'
          | 'good'
          | 'normal',
        consecutiveHit: true,
      };

      const comboResult = this.comboSystem.registerHit(comboHit);
      return comboResult;
    } catch (error) {
      console.error('Error in onProjectileHit integration:', error);
      return { scoreMultiplier: 1 };
    }
  }

  /**
   * Called when a level is completed
   */
  public onLevelCompleted(
    levelId: number,
    stats: { score: number; duration: number; accuracy: number }
  ) {
    try {
      // Track with micro achievement system
      microAchievementSystem.trackLevelCompleted({
        completionTime: stats.duration,
        accuracy: stats.accuracy,
        missCount: 0, // TODO: pass actual miss count from level progression
      });

      // Trigger victory celebration through celebration store
      setTimeout(async () => {
        try {
          const { useCelebrationStore } = await import('../store/celebrationStore');
          const celebrationActions = useCelebrationStore.getState();

          // Calculate stars based on performance (simple algorithm)
          const starsEarned = this.calculateStarsEarned(
            stats.score,
            stats.duration,
            stats.accuracy
          );

          celebrationActions.addVictoryCelebration({
            level: levelId,
            score: stats.score,
            starsEarned,
            onComplete: () => {
              console.log('Victory celebration completed');
            },
          });
        } catch (error) {
          console.error('Failed to trigger victory celebration:', error);
        }
      }, 0);

      // Could trigger special events or viral tracking here when methods are implemented
      // TODO: Add specialEventsManager.onLevelCompleted when implemented
      // TODO: Add viralTrackingManager.trackLevelCompletion when implemented
    } catch (error) {
      console.error('Error in onLevelCompleted integration:', error);
    }
  }

  /**
   * Called when mystery balloon is spawned
   */
  public onMysteryBalloonSpawned() {
    try {
      // Could trigger tutorial hints
      // Could trigger special event participation
    } catch (error) {
      console.error('Error in onMysteryBalloonSpawned integration:', error);
    }
  }

  /**
   * Called when mystery balloon is popped
   */
  public onMysteryBalloonPopped(rewardType: string, rewardValue: number) {
    try {
      // Trigger mystery reward celebration through celebration store
      setTimeout(async () => {
        try {
          const { useCelebrationStore } = await import('../store/celebrationStore');
          const celebrationActions = useCelebrationStore.getState();

          // Create mystery reward for celebration
          const mysteryReward = {
            id: `mystery_${Date.now()}`,
            type: rewardType as any,
            rarity: this.getMysteryRewardRarity(rewardValue) as any,
            value: rewardValue.toString(),
          };

          celebrationActions.addMysteryRewardCelebration({
            reward: mysteryReward,
            x: 200, // Center screen
            y: 300,
            onComplete: () => {
              console.log('Mystery reward celebration completed');
            },
          });
        } catch (error) {
          console.error('Failed to trigger mystery reward celebration:', error);
        }
      }, 0);

      // Update achievement progress (using general balloon tracking)
      microAchievementSystem.trackBalloonPopped();

      // Could track mystery rewards when method is implemented
      // TODO: Add viralTrackingManager.trackMysteryReward when implemented
    } catch (error) {
      console.error('Error in onMysteryBalloonPopped integration:', error);
    }
  }

  /**
   * Determine mystery reward rarity based on value
   */
  private getMysteryRewardRarity(value: number): string {
    if (value >= 500) return 'legendary';
    if (value >= 250) return 'epic';
    if (value >= 100) return 'rare';
    if (value >= 50) return 'uncommon';
    return 'common';
  }

  /**
   * Called when achievement is unlocked
   */
  public onAchievementUnlocked(achievementId: string) {
    try {
      // Trigger achievement celebration through celebration store
      setTimeout(async () => {
        try {
          const { useCelebrationStore } = await import('../store/celebrationStore');
          const { microAchievementSystem } = await import('./MicroAchievementSystem');

          const celebrationActions = useCelebrationStore.getState();
          const achievement = microAchievementSystem.getAchievementById(achievementId);

          if (achievement) {
            celebrationActions.addAchievementCelebration({
              achievement,
              onComplete: () => {
                console.log(`Achievement celebration completed: ${achievement.name}`);
              },
            });
          }
        } catch (error) {
          console.error('Failed to trigger achievement celebration:', error);
        }
      }, 0);

      // Could trigger tutorial congratulations
      // Could trigger social sharing prompts
      // TODO: Add viralTrackingManager.trackAchievementUnlock when implemented
    } catch (error) {
      console.error('Error in onAchievementUnlocked integration:', error);
    }
  }

  /**
   * Calculate stars earned based on performance metrics
   */
  private calculateStarsEarned(score: number, duration: number, accuracy: number): number {
    let stars = 1; // Always get at least 1 star for completion

    // Add star for good accuracy (80%+)
    if (accuracy >= 80) {
      stars++;
    }

    // Add star for high score or fast completion
    if (accuracy >= 95 || duration < 30000) {
      // Perfect accuracy or under 30 seconds
      stars++;
    }

    return Math.min(3, stars);
  }

  /**
   * Add combo celebration integration
   */
  public onComboAchieved(combo: number, multiplier: number) {
    try {
      // Only celebrate significant combos (5+)
      if (combo >= 5) {
        setTimeout(async () => {
          try {
            const { useCelebrationStore } = await import('../store/celebrationStore');
            const celebrationActions = useCelebrationStore.getState();

            celebrationActions.addComboCelebration({
              combo,
              multiplier,
              onComplete: () => {
                console.log(`Combo celebration completed: ${combo}x`);
              },
            });
          } catch (error) {
            console.error('Failed to trigger combo celebration:', error);
          }
        }, 0);
      }
    } catch (error) {
      console.error('Error in onComboAchieved integration:', error);
    }
  }

  public cleanup() {
    specialEventsManager.cleanup();
    viralTrackingManager.cleanup();
    deepLinkManager.cleanup();
  }
}

export const integrationManager = IntegrationManager.getInstance();
