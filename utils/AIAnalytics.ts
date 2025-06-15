/**
 * AI Analytics Engine - Comprehensive Data Collection for Autonomous Gameplay
 * 
 * This system captures detailed gameplay analytics from AI sessions to enable:
 * - Game balance optimization
 * - Performance monitoring and optimization
 * - Regression testing and validation
 * - Data-driven game tuning
 */

import { AIAnalyticsEvent, AIMetrics, GameBalanceInsights, GameState, AIAction, calculateAIMetrics } from '@/pete_ai';

export interface AnalyticsSession {
  sessionId: string;
  startTime: number;
  endTime?: number;
  aiConfig: any;
  events: AIAnalyticsEvent[];
  metrics?: AIMetrics;
  insights?: GameBalanceInsights;
}

export interface PerformanceSnapshot {
  timestamp: number;
  fps: number;
  memoryMB: number;
  cpuUsage?: number;
  batteryLevel?: number;
  thermalState?: 'normal' | 'fair' | 'serious' | 'critical';
}

/**
 * AI Analytics Engine - Real-time data collection and analysis
 */
export class AIAnalyticsEngine {
  private static instance: AIAnalyticsEngine;
  
  // Session Management
  private currentSession: AnalyticsSession | null = null;
  private sessionHistory: AnalyticsSession[] = [];
  
  // Real-time Performance Tracking
  private performanceSnapshots: PerformanceSnapshot[] = [];
  private lastPerformanceCheck = 0;
  private readonly PERFORMANCE_CHECK_INTERVAL = 1000; // 1 second
  
  // Event Tracking
  private eventBuffer: AIAnalyticsEvent[] = [];
  private lastEventFlush = 0;
  private readonly EVENT_FLUSH_INTERVAL = 5000; // 5 seconds
  
  // Collision Tracking (for hit/miss analysis)
  private pendingShots: Map<number, { timestamp: number; targetX: number; targetY: number }> = new Map();
  private shotIdCounter = 0;
  
  // Threat Detection
  private lastThreatDetection = 0;
  private threatReactionStart = 0;

  private constructor() {}

  public static getInstance(): AIAnalyticsEngine {
    if (!AIAnalyticsEngine.instance) {
      AIAnalyticsEngine.instance = new AIAnalyticsEngine();
    }
    return AIAnalyticsEngine.instance;
  }

  /**
   * Reset singleton instance for testing
   */
  public static resetInstance(): void {
    AIAnalyticsEngine.instance = new AIAnalyticsEngine();
  }

  /**
   * Start a new analytics session
   */
  public startSession(aiConfig: any): string {
    const sessionId = `ai_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.currentSession = {
      sessionId,
      startTime: Date.now(),
      aiConfig,
      events: [],
    };
    
    this.eventBuffer = [];
    this.performanceSnapshots = [];
    this.pendingShots.clear();
    this.shotIdCounter = 0;
    
    console.log('🎯 AI Analytics Session Started:', sessionId);
    
    // Record session start event
    this.recordEvent({
      timestamp: Date.now(),
      type: 'decision',
      data: {
        action: { type: 'idle' },
        decisionQuality: 'optimal',
        sessionStarted: true,
        aiConfig,
      },
    });
    
    return sessionId;
  }

  /**
   * End current analytics session and calculate final metrics
   */
  public endSession(finalGameState: GameState, gameHistory: Array<{ state: GameState; action: AIAction; timestamp: number }>): AnalyticsSession | null {
    if (!this.currentSession) {
      console.warn('No active AI analytics session to end');
      return null;
    }

    this.currentSession.endTime = Date.now();
    
    // Flush any remaining events
    this.flushEventBuffer();
    
    // Calculate comprehensive metrics
    this.currentSession.metrics = this.calculateSessionMetrics(gameHistory, finalGameState);
    
    // Generate balance insights
    this.currentSession.insights = this.generateBalanceInsights(this.currentSession.metrics);
    
    // Store in history
    this.sessionHistory.push({ ...this.currentSession });
    
    console.log('🎯 AI Analytics Session Ended:', {
      sessionId: this.currentSession.sessionId,
      duration: this.currentSession.endTime - this.currentSession.startTime,
      events: this.currentSession.events.length,
      metrics: this.currentSession.metrics,
    });
    
    const completedSession = { ...this.currentSession };
    this.currentSession = null;
    
    return completedSession;
  }

  /**
   * Record an analytics event
   */
  public recordEvent(event: AIAnalyticsEvent): void {
    if (!this.currentSession) return;
    
    this.eventBuffer.push(event);
    
    // Process specific event types for real-time analysis
    this.processEventRealTime(event);
    
    // Flush buffer if it gets too large or enough time has passed
    const now = Date.now();
    if (this.eventBuffer.length > 50 || (now - this.lastEventFlush) > this.EVENT_FLUSH_INTERVAL) {
      this.flushEventBuffer();
    }
  }

  /**
   * Record AI decision with quality assessment
   */
  public recordDecision(action: AIAction, gameState: GameState, reactionTime: number): void {
    const decisionQuality = this.assessDecisionQuality(action, gameState, reactionTime);
    
    this.recordEvent({
      timestamp: Date.now(),
      type: 'decision',
      data: {
        action,
        gameState: {
          peteX: gameState.peteX,
          enemies: gameState.enemies.map(e => ({ x: e.x, y: e.y, vx: e.vx, vy: e.vy, size: e.size, id: e.id })),
          projectiles: gameState.projectiles.map(p => ({ x: p.x, y: p.y, id: p.id })),
        },
        reactionTime,
        decisionQuality,
      },
    });
  }

  /**
   * Record projectile shot with target tracking
   */
  public recordShot(targetX: number, targetY: number): number {
    const shotId = ++this.shotIdCounter;
    const timestamp = Date.now();
    
    this.pendingShots.set(shotId, { timestamp, targetX, targetY });
    
    this.recordEvent({
      timestamp,
      type: 'shot',
      data: {
        shotId,
        targetX,
        targetY,
        action: { type: 'shoot' },
      },
    });
    
    return shotId;
  }

  /**
   * Record projectile hit
   */
  public recordHit(shotId: number, enemyX: number, enemyY: number): void {
    const shot = this.pendingShots.get(shotId);
    if (!shot) return;
    
    const accuracy = this.calculateShotAccuracy(shot.targetX, shot.targetY, enemyX, enemyY);
    const travelTime = Date.now() - shot.timestamp;
    
    this.recordEvent({
      timestamp: Date.now(),
      type: 'hit',
      data: {
        shotId,
        travelTime,
        accuracy,
        targetX: shot.targetX,
        targetY: shot.targetY,
        hitX: enemyX,
        hitY: enemyY,
      },
    });
    
    this.pendingShots.delete(shotId);
  }

  /**
   * Record projectile miss (shot expired without hitting)
   */
  public recordMiss(shotId: number): void {
    const shot = this.pendingShots.get(shotId);
    if (!shot) return;
    
    const travelTime = Date.now() - shot.timestamp;
    
    this.recordEvent({
      timestamp: Date.now(),
      type: 'miss',
      data: {
        shotId,
        travelTime,
        targetX: shot.targetX,
        targetY: shot.targetY,
      },
    });
    
    this.pendingShots.delete(shotId);
  }

  /**
   * Record threat detection and start reaction timer
   */
  public recordThreatDetected(threatLevel: number, enemyPosition: { x: number; y: number }): void {
    this.threatReactionStart = Date.now();
    
    this.recordEvent({
      timestamp: Date.now(),
      type: 'threat_detected',
      data: {
        threatLevel,
        enemyPosition,
        reactionStarted: true,
      },
    });
  }

  /**
   * Record successful dodge with reaction time
   */
  public recordDodge(newPosition: number): void {
    const reactionTime = this.threatReactionStart > 0 ? Date.now() - this.threatReactionStart : 0;
    
    this.recordEvent({
      timestamp: Date.now(),
      type: 'dodge',
      data: {
        newPosition,
        reactionTime,
        success: true,
      },
    });
    
    this.threatReactionStart = 0;
  }

  /**
   * Record performance metrics
   */
  public recordPerformance(fps: number, memoryMB: number): void {
    const now = Date.now();
    
    // Throttle performance recording to avoid overhead
    if (now - this.lastPerformanceCheck < this.PERFORMANCE_CHECK_INTERVAL) {
      return;
    }
    
    this.lastPerformanceCheck = now;
    
    const snapshot: PerformanceSnapshot = {
      timestamp: now,
      fps,
      memoryMB,
    };
    
    this.performanceSnapshots.push(snapshot);
    
    this.recordEvent({
      timestamp: now,
      type: 'performance',
      data: {
        fps,
        memoryMB,
        frameDropDetected: fps < 55,
        memoryPressure: memoryMB > 100,
      },
    });
    
    // Clean up old snapshots (keep last 100)
    if (this.performanceSnapshots.length > 100) {
      this.performanceSnapshots = this.performanceSnapshots.slice(-100);
    }
  }

  /**
   * Get current session analytics
   */
  public getCurrentSessionAnalytics(): AnalyticsSession | null {
    return this.currentSession;
  }

  /**
   * Get all session history
   */
  public getSessionHistory(): AnalyticsSession[] {
    return [...this.sessionHistory];
  }

  /**
   * Export analytics data for external analysis with ML-optimized format
   */
  public exportAnalyticsData(options?: {
    includeRawEvents?: boolean;
    includeSessionDetails?: boolean;
    format?: 'complete' | 'ml-optimized' | 'summary';
  }): any {
    const opts = {
      includeRawEvents: true,
      includeSessionDetails: true,
      format: 'complete' as const,
      ...options
    };

    const exportData: any = {
      metadata: {
        timestamp: Date.now(),
        exportFormat: opts.format,
        version: '2.0',
        totalSessions: this.sessionHistory.length,
        totalEvents: this.sessionHistory.reduce((sum, session) => sum + session.events.length, 0)
      },
      summary: this.calculateSummaryStats()
    };

    // Format data based on requested format
    switch (opts.format) {
      case 'ml-optimized':
        exportData.data = this.generateMLOptimizedData();
        break;
      case 'summary':
        exportData.sessions = this.sessionHistory.map(session => ({
          sessionId: session.sessionId,
          startTime: session.startTime,
          endTime: session.endTime,
          duration: session.endTime ? session.endTime - session.startTime : 0,
          metrics: session.metrics,
          insights: session.insights
        }));
        break;
      case 'complete':
      default:
        exportData.sessions = this.sessionHistory.map(session => ({
          sessionId: session.sessionId,
          startTime: session.startTime,
          endTime: session.endTime,
          duration: session.endTime ? session.endTime - session.startTime : 0,
          aiConfig: session.aiConfig,
          metrics: session.metrics,
          insights: session.insights,
          ...(opts.includeRawEvents && { events: session.events }),
          ...(opts.includeSessionDetails && { gameHistory: this.getSessionGameHistory(session.sessionId) })
        }));
        break;
    }

    console.log('📊 Exporting analytics data:', {
      format: opts.format,
      totalSessions: exportData.metadata.totalSessions,
      totalEvents: exportData.metadata.totalEvents,
      includeRawEvents: opts.includeRawEvents,
      dataSize: JSON.stringify(exportData).length
    });

    return exportData;
  }

  /**
   * Calculate summary statistics (legacy compatibility)
   */
  private calculateSummaryStats() {
    const totalSessions = this.sessionHistory.length;
    const totalPlaytime = this.sessionHistory.reduce((sum, session) => 
      sum + ((session.endTime || Date.now()) - session.startTime), 0
    );
    
    const accuracies = this.sessionHistory
      .map(s => s.metrics?.accuracy || 0)
      .filter(acc => acc > 0);
    const averageAccuracy = accuracies.length > 0 ? 
      accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length : 0;
    
    const fpsValues = this.sessionHistory
      .map(s => s.metrics?.averageFPS || 0)
      .filter(fps => fps > 0);
    const averageFPS = fpsValues.length > 0 ?
      fpsValues.reduce((sum, fps) => sum + fps, 0) / fpsValues.length : 0;
    
    const recommendations = this.generateGlobalRecommendations();
    
    return {
      totalSessions,
      totalPlaytime,
      averageAccuracy,
      averageFPS,
      recommendations,
    };
  }

  /**
   * Generate ML-optimized data format with features and labels
   */
  private generateMLOptimizedData(): any {
    const mlData: {
      features: number[][];
      labels: Array<{
        level_completed: number;
        satisfaction_score: number;
        difficulty_rating: number;
        performance_score: number;
      }>;
      eventSequences: Array<{
        sessionId: string;
        sequence: Array<{
          timestamp: number;
          type: string;
          features: number[];
        }>;
      }>;
      featureNames: string[];
    } = {
      features: [],
      labels: [],
      eventSequences: [],
      featureNames: [
        'session_duration', 'total_shots', 'accuracy', 'average_reaction_time',
        'dodge_success_rate', 'threats_detected', 'movement_efficiency',
        'average_distance_from_center', 'optimal_decisions', 'suboptimal_decisions',
        'survival_time', 'level_id', 'enemy_count_avg', 'projectile_count_avg'
      ]
    };

    for (const session of this.sessionHistory) {
      if (!session.metrics) continue;

      const m = session.metrics;
      
      // Extract features for ML models
      const features = [
        session.endTime ? session.endTime - session.startTime : 0, // session_duration
        m.totalShots,
        m.accuracy,
        m.averageReactionTime,
        m.dodgeSuccessRate,
        m.threatsDetected,
        m.movementEfficiency,
        m.averageDistanceFromCenter,
        m.optimalDecisions,
        m.suboptimalDecisions,
        m.survivalTime,
        m.level,
        // Calculate average enemy/projectile counts from events
        this.calculateAverageFromEvents(session.events, 'enemyCount'),
        this.calculateAverageFromEvents(session.events, 'projectileCount')
      ];

      // Labels for supervised learning (level completion, satisfaction, etc.)
      const labels = {
        level_completed: m.levelCompleted ? 1 : 0,
        satisfaction_score: m.balanceMetrics?.engagementQuality?.satisfactionScore || 0,
        difficulty_rating: session.insights?.levelDifficulty?.difficultyRating === 'balanced' ? 1 : 0,
        performance_score: m.score
      };

      mlData.features.push(features);
      mlData.labels.push(labels);

      // Event sequences for sequence modeling
      const eventSequence = session.events.map(event => ({
        timestamp: event.timestamp,
        type: event.type,
        features: this.extractEventFeatures(event)
      }));

      mlData.eventSequences.push({
        sessionId: session.sessionId,
        sequence: eventSequence
      });
    }

    return mlData;
  }

  /**
   * Extract features from individual events
   */
  private extractEventFeatures(event: AIAnalyticsEvent): number[] {
    const features = [
      event.timestamp,
      this.getEventTypeEncoding(event.type),
      event.data.reactionTime || 0,
      event.data.threatLevel || 0,
      event.data.fps || 60,
      event.data.memoryMB || 0
    ];

    return features;
  }

  /**
   * Encode event types as numbers for ML models
   */
  private getEventTypeEncoding(type: string): number {
    const encodings: { [key: string]: number } = {
      'shot': 1,
      'hit': 2,
      'miss': 3,
      'dodge': 4,
      'threat_detected': 5,
      'decision': 6,
      'performance': 7
    };
    return encodings[type] || 0;
  }

  /**
   * Calculate average value from event data
   */
  private calculateAverageFromEvents(events: AIAnalyticsEvent[], field: string): number {
    const values = events
      .filter(e => e.data[field] !== undefined)
      .map(e => e.data[field]);
    
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  /**
   * Get game history for a specific session
   */
  private getSessionGameHistory(sessionId: string): any[] {
    // This would need to be implemented to store game history per session
    // For now, return empty array
    return [];
  }

  /**
   * Clear all analytics data
   */
  public clearAnalyticsData(): void {
    this.sessionHistory = [];
    this.currentSession = null;
    this.eventBuffer = [];
    this.performanceSnapshots = [];
    this.pendingShots.clear();
    console.log('🎯 AI Analytics data cleared');
  }

  // Private helper methods

  private flushEventBuffer(): void {
    if (!this.currentSession || this.eventBuffer.length === 0) return;
    
    this.currentSession.events.push(...this.eventBuffer);
    this.eventBuffer = [];
    this.lastEventFlush = Date.now();
  }

  private processEventRealTime(event: AIAnalyticsEvent): void {
    // Real-time processing for immediate feedback
    switch (event.type) {
      case 'performance':
        if (event.data.fps && event.data.fps < 45) {
          console.warn('🎯 Performance Alert: Low FPS detected:', event.data.fps);
        }
        if (event.data.memoryMB && event.data.memoryMB > 150) {
          console.warn('🎯 Performance Alert: High memory usage:', event.data.memoryMB, 'MB');
        }
        break;
        
      case 'decision':
        if (event.data.decisionQuality === 'poor') {
          console.log('🎯 Decision Alert: Poor decision detected at', new Date(event.timestamp).toISOString());
        }
        break;
    }
  }

  private assessDecisionQuality(action: AIAction, gameState: GameState, reactionTime: number): 'optimal' | 'good' | 'poor' {
    // Simple heuristics for decision quality assessment
    
    if (reactionTime > 500) return 'poor'; // Too slow
    
    if (action.type === 'shoot') {
      const nearbyEnemies = gameState.enemies.filter(e => 
        Math.abs(e.x - gameState.peteX) < 100
      );
      return nearbyEnemies.length > 0 ? 'optimal' : 'good';
    }
    
    if (action.type === 'move') {
      const closeThreats = gameState.enemies.filter(e => 
        Math.abs(e.x - gameState.peteX) < 60
      );
      return closeThreats.length > 0 ? 'optimal' : 'good';
    }
    
    return 'good';
  }

  private calculateShotAccuracy(targetX: number, targetY: number, hitX: number, hitY: number): number {
    const distance = Math.sqrt(Math.pow(targetX - hitX, 2) + Math.pow(targetY - hitY, 2));
    return Math.max(0, 100 - distance); // 100% accuracy at exact hit, decreases with distance
  }

  private calculateSessionMetrics(gameHistory: Array<{ state: GameState; action: AIAction; timestamp: number }>, finalGameState: GameState): AIMetrics {
    // Use the comprehensive calculateAIMetrics function from pete_ai.ts instead of duplicate logic
    const analyticsEvents = this.currentSession?.events || [];
    
    console.log('📊 Calculating session metrics using centralized function', {
      gameHistoryLength: gameHistory.length,
      analyticsEventsLength: analyticsEvents.length,
      finalScore: finalGameState.score
    });
    
    // Call the comprehensive metrics calculation function
    return calculateAIMetrics(gameHistory, analyticsEvents, finalGameState);
  }

  private generateBalanceInsights(metrics: AIMetrics): GameBalanceInsights {
    const completionRate = metrics.levelCompleted ? 100 : 0;
    const difficultyRating = 
      completionRate > 80 ? 'too_easy' :
      completionRate < 20 ? 'too_hard' : 'balanced';
    
    const recommendations: string[] = [];
    
    if (metrics.accuracy < 30) {
      recommendations.push('Consider reducing enemy speed or increasing projectile size');
    }
    
    if (metrics.averageFPS < 50) {
      recommendations.push('Optimize game performance - consistent frame drops detected');
    }
    
    if (metrics.dodgeSuccessRate < 50) {
      recommendations.push('Enemy movement patterns may be too unpredictable');
    }
    
    return {
      levelDifficulty: {
        completionRate,
        averageAttempts: 1, // Would need multiple session data
        difficultyRating,
      },
      
      enemyBalance: {
        spawningRate: metrics.threatsDetected / (metrics.survivalTime / 1000),
        threatLevel: metrics.threatsHit / Math.max(1, metrics.threatsDetected),
        eliminationEfficiency: metrics.enemiesDestroyed / Math.max(1, metrics.totalShots),
      },
      
      performanceImpact: {
        fpsStability: Math.max(0, 100 - metrics.frameDrops),
        memoryEfficiency: Math.max(0, 100 - (metrics.memoryUsage / 2)), // Assuming 200MB is poor
        thermalThrottling: metrics.averageFPS < 45,
      },
      
      recommendations,
    };
  }

  private generateGlobalRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.sessionHistory.length === 0) {
      return ['No analytics data available yet'];
    }
    
    const avgAccuracy = this.sessionHistory.reduce((sum, s) => sum + (s.metrics?.accuracy || 0), 0) / this.sessionHistory.length;
    const avgFPS = this.sessionHistory.reduce((sum, s) => sum + (s.metrics?.averageFPS || 0), 0) / this.sessionHistory.length;
    
    if (avgAccuracy < 40) {
      recommendations.push('Overall AI accuracy is low - consider game balance adjustments');
    }
    
    if (avgFPS < 55) {
      recommendations.push('Performance optimization needed - consistent FPS issues detected');
    }
    
    if (this.sessionHistory.every(s => s.metrics?.levelCompleted === false)) {
      recommendations.push('Game difficulty may be too high - no successful level completions');
    }
    
    return recommendations.length > 0 ? recommendations : ['Game balance appears optimal based on AI performance'];
  }
}

// Export singleton instance
export const aiAnalytics = AIAnalyticsEngine.getInstance();