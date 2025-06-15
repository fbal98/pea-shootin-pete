/**
 * AI Analytics Engine - Comprehensive Data Collection for Autonomous Gameplay
 * 
 * This system captures detailed gameplay analytics from AI sessions to enable:
 * - Game balance optimization
 * - Performance monitoring and optimization
 * - Regression testing and validation
 * - Data-driven game tuning
 */

import { AIAnalyticsEvent, AIMetrics, GameBalanceInsights, GameState, AIAction } from '@/pete_ai';

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
   * Export analytics data for external analysis
   */
  public exportAnalyticsData(): {
    sessions: AnalyticsSession[];
    summary: {
      totalSessions: number;
      totalPlaytime: number;
      averageAccuracy: number;
      averageFPS: number;
      recommendations: string[];
    };
  } {
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
      sessions: this.sessionHistory,
      summary: {
        totalSessions,
        totalPlaytime,
        averageAccuracy,
        averageFPS,
        recommendations,
      },
    };
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
    // Calculate metrics using the same logic as pete_ai.ts but inline to avoid import issues
    const analyticsEvents = this.currentSession?.events || [];
    
    const totalShots = gameHistory.filter(entry => entry.action.type === 'shoot').length;
    const movements = gameHistory.filter(entry => entry.action.type === 'move');
    
    // Calculate hits and misses from analytics events
    const hitEvents = analyticsEvents.filter(e => e.type === 'hit');
    const missEvents = analyticsEvents.filter(e => e.type === 'miss');
    const hits = hitEvents.length;
    const misses = missEvents.length;
    const accuracy = totalShots > 0 ? (hits / totalShots) * 100 : 0;
    
    // Calculate movement efficiency and center distance
    const centerX = finalGameState.screenWidth / 2;
    const avgDistanceFromCenter = gameHistory.reduce((sum, entry) => 
      sum + Math.abs(entry.state.peteX - centerX), 0
    ) / gameHistory.length;
    
    // Calculate reaction times
    const reactionTimes = analyticsEvents
      .filter(e => e.data.reactionTime)
      .map(e => e.data.reactionTime!);
    const averageReactionTime = reactionTimes.length > 0 ? 
      reactionTimes.reduce((sum, time) => sum + time, 0) / reactionTimes.length : 0;
    
    // Calculate threat detection and avoidance
    const threatEvents = analyticsEvents.filter(e => e.type === 'threat_detected');
    const dodgeEvents = analyticsEvents.filter(e => e.type === 'dodge');
    const threatsDetected = threatEvents.length;
    const dodgeSuccessRate = threatsDetected > 0 ? (dodgeEvents.length / threatsDetected) * 100 : 0;
    
    // Calculate decision quality
    const decisionEvents = analyticsEvents.filter(e => e.type === 'decision');
    const optimalDecisions = decisionEvents.filter(e => e.data.decisionQuality === 'optimal').length;
    const suboptimalDecisions = decisionEvents.filter(e => e.data.decisionQuality === 'poor').length;
    
    // Calculate performance metrics
    const performanceEvents = analyticsEvents.filter(e => e.type === 'performance');
    const fpsValues = performanceEvents.map(e => e.data.fps!).filter(fps => fps > 0);
    const averageFPS = fpsValues.length > 0 ? 
      fpsValues.reduce((sum, fps) => sum + fps, 0) / fpsValues.length : 60;
    const frameDrops = fpsValues.filter(fps => fps < 55).length;
    
    // Calculate survival time
    const startTime = gameHistory[0]?.timestamp || 0;
    const endTime = gameHistory[gameHistory.length - 1]?.timestamp || 0;
    const survivalTime = endTime - startTime;
    
    return {
      // Basic Performance
      totalShots,
      hits,
      misses,
      accuracy,
      
      // Movement Analysis
      totalMovements: movements.length,
      averageDistanceFromCenter: avgDistanceFromCenter,
      movementEfficiency: 0, // Simple implementation
      dodgeSuccessRate,
      
      // Timing & Reactions
      averageReactionTime,
      fastestReaction: reactionTimes.length > 0 ? Math.min(...reactionTimes) : 0,
      slowestReaction: reactionTimes.length > 0 ? Math.max(...reactionTimes) : 0,
      
      // Threat Assessment
      threatsDetected,
      threatsAvoided: dodgeEvents.length,
      threatsHit: threatsDetected - dodgeEvents.length,
      
      // Game Progression
      survivalTime,
      score: finalGameState.score,
      level: finalGameState.level || 1,
      levelCompleted: !finalGameState.gameOver && finalGameState.score > 0,
      
      // Decision Quality
      optimalDecisions,
      suboptimalDecisions,
      decisionSpeed: decisionEvents.length > 0 ? survivalTime / decisionEvents.length : 0,
      
      // Enemy Interaction
      enemiesDestroyed: hitEvents.length,
      enemiesMissed: missEvents.length,
      powerUpsCollected: 0, // Will be enhanced later
      
      // Performance Metrics
      averageFPS,
      frameDrops,
      memoryUsage: performanceEvents.length > 0 ? 
        performanceEvents[performanceEvents.length - 1].data.memoryMB || 0 : 0,
    };
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