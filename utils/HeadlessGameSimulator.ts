/**
 * Headless Game Simulator - Real AI testing without UI
 * 
 * This engine runs actual game physics and AI decision-making for authentic
 * balance testing. It replaces the fake data generation in BalanceAnalyzer.
 */

import { Level } from '@/types/LevelTypes';
import { levelManager } from '@/systems/LevelManager';
import { 
  peteAI, 
  AIConfig, 
  GameState, 
  AIAction, 
  AIMetrics, 
  calculateAIMetrics,
  AIAnalyticsEvent 
} from '@/pete_ai';
import { gameCache } from '@/utils/GameCache';

// Headless game entities (no rendering)
interface HeadlessEnemy {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  sizeLevel: 1 | 2 | 3;
  health: number;
  points: number;
}

interface HeadlessProjectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
}

interface HeadlessGameSession {
  sessionId: string;
  levelId: number;
  levelConfig: Level;
  aiConfig: AIConfig;
  
  // Game state
  peteX: number;
  peteY: number;
  enemies: HeadlessEnemy[];
  projectiles: HeadlessProjectile[];
  score: number;
  lives: number;
  isPlaying: boolean;
  gameOver: boolean;
  
  // Simulation tracking
  startTime: number;
  currentTime: number;
  maxDuration: number;
  deltaTime: number;
  
  // Analytics
  gameHistory: Array<{ state: GameState; action: AIAction; timestamp: number }>;
  analyticsEvents: AIAnalyticsEvent[];
  actionCount: number;
  
  // Level progression
  currentWave: number;
  enemiesSpawned: number;
  totalEnemiesInLevel: number;
  waveStartTime: number;
}

export interface SimulationResult {
  success: boolean;
  metrics: AIMetrics;
  finalState: GameState;
  duration: number;
  error?: string;
}

export class HeadlessGameSimulator {
  private static instance: HeadlessGameSimulator;
  
  // Game constants (matching main game)
  private readonly SCREEN_WIDTH = 350;
  private readonly SCREEN_HEIGHT = 600;
  private readonly PETE_Y = 550; // Near bottom
  private readonly GRAVITY = 500; // px/s²
  private readonly PROJECTILE_SPEED = 900; // px/s
  private readonly FRAME_RATE = 60; // FPS for simulation
  private readonly FRAME_TIME = 1000 / 60; // ~16.67ms per frame
  
  private constructor() {}
  
  public static getInstance(): HeadlessGameSimulator {
    if (!HeadlessGameSimulator.instance) {
      HeadlessGameSimulator.instance = new HeadlessGameSimulator();
    }
    return HeadlessGameSimulator.instance;
  }
  
  /**
   * Run a complete AI gameplay session on a specific level
   */
  public async runAISession(
    levelId: number,
    aiConfig: AIConfig,
    maxDuration: number = 180000 // 3 minutes max
  ): Promise<SimulationResult> {
    try {
      console.log(`🎮 Starting headless AI session - Level ${levelId}`);
      
      // Load the level configuration
      const levelResult = await levelManager.loadLevel(levelId);
      if (!levelResult.success || !levelResult.level) {
        return {
          success: false,
          metrics: this.createEmptyMetrics(),
          finalState: this.createEmptyGameState(),
          duration: 0,
          error: `Failed to load level ${levelId}: ${levelResult.error}`
        };
      }
      
      // Initialize game session
      const session = this.initializeSession(levelId, levelResult.level, aiConfig, maxDuration);
      
      // Run the main game loop
      const result = await this.runGameLoop(session);
      
      console.log(`🎮 AI session completed - Level ${levelId}`, {
        success: result.success,
        duration: result.duration,
        score: result.metrics.score,
        accuracy: result.metrics.accuracy
      });
      
      return result;
      
    } catch (error) {
      console.error('HeadlessGameSimulator error:', error);
      return {
        success: false,
        metrics: this.createEmptyMetrics(),
        finalState: this.createEmptyGameState(),
        duration: 0,
        error: `Simulation failed: ${error}`
      };
    }
  }
  
  /**
   * Initialize a new headless game session
   */
  private initializeSession(
    levelId: number,
    levelConfig: Level,
    aiConfig: AIConfig,
    maxDuration: number
  ): HeadlessGameSession {
    return {
      sessionId: `headless_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      levelId,
      levelConfig,
      aiConfig,
      
      // Initial game state
      peteX: this.SCREEN_WIDTH / 2,
      peteY: this.PETE_Y,
      enemies: [],
      projectiles: [],
      score: 0,
      lives: 3,
      isPlaying: true,
      gameOver: false,
      
      // Simulation tracking
      startTime: Date.now(),
      currentTime: Date.now(),
      maxDuration,
      deltaTime: this.FRAME_TIME,
      
      // Analytics
      gameHistory: [],
      analyticsEvents: [],
      actionCount: 0,
      
      // Level progression
      currentWave: 0,
      enemiesSpawned: 0,
      totalEnemiesInLevel: levelConfig.totalEnemyCount || 0,
      waveStartTime: Date.now(),
    };
  }
  
  /**
   * Main game simulation loop
   */
  private async runGameLoop(session: HeadlessGameSession): Promise<SimulationResult> {
    const AI_DECISION_INTERVAL = 100; // 100ms = 10 decisions per second
    let lastAIDecision = 0;
    
    while (session.isPlaying && !session.gameOver) {
      const now = Date.now();
      session.currentTime = now;
      const elapsed = now - session.startTime;
      
      // Check timeout
      if (elapsed > session.maxDuration) {
        console.log('🎮 Session timeout reached');
        session.gameOver = true;
        break;
      }
      
      // Update game physics
      this.updatePhysics(session);
      
      // Spawn enemies based on level configuration
      this.updateEnemySpawning(session);
      
      // Make AI decision if enough time has passed
      if (now - lastAIDecision >= AI_DECISION_INTERVAL) {
        this.makeAIDecision(session);
        lastAIDecision = now;
      }
      
      // Check win/loss conditions
      this.checkGameEndConditions(session);
      
      // Simulate frame timing (avoid burning CPU)
      await this.simulateFrameDelay();
    }
    
    // Calculate final metrics
    const finalGameState = this.createGameStateFromSession(session);
    const metrics = calculateAIMetrics(session.gameHistory, session.analyticsEvents, finalGameState);
    
    return {
      success: true,
      metrics,
      finalState: finalGameState,
      duration: session.currentTime - session.startTime
    };
  }
  
  /**
   * Update game physics for enemies and projectiles
   */
  private updatePhysics(session: HeadlessGameSession): void {
    const deltaSeconds = session.deltaTime / 1000;
    
    // Update enemies
    session.enemies = session.enemies.map(enemy => ({
      ...enemy,
      x: enemy.x + enemy.vx * deltaSeconds,
      y: enemy.y + enemy.vy * deltaSeconds,
      vy: enemy.vy + this.GRAVITY * deltaSeconds, // Apply gravity
    })).filter(enemy => {
      // Handle enemy bouncing
      if (enemy.y >= this.SCREEN_HEIGHT - enemy.size - 10) {
        enemy.y = this.SCREEN_HEIGHT - enemy.size - 10;
        enemy.vy = -enemy.vy * 0.95; // 95% energy retention (authentic DOS physics)
      }
      
      if (enemy.x <= enemy.size || enemy.x >= this.SCREEN_WIDTH - enemy.size) {
        enemy.vx = -enemy.vx * 0.9; // 90% energy retention for walls
        enemy.x = Math.max(enemy.size, Math.min(this.SCREEN_WIDTH - enemy.size, enemy.x));
      }
      
      if (enemy.y <= enemy.size) {
        enemy.vy = -enemy.vy * 0.85; // 85% energy retention for ceiling
        enemy.y = enemy.size;
      }
      
      // Remove enemies that are too far off screen
      return enemy.y < this.SCREEN_HEIGHT + 100;
    });
    
    // Update projectiles
    session.projectiles = session.projectiles.map(projectile => ({
      ...projectile,
      y: projectile.y - this.PROJECTILE_SPEED * deltaSeconds, // Move upward
    })).filter(projectile => projectile.y > -50); // Remove off-screen projectiles
    
    // Check collisions
    this.checkCollisions(session);
  }
  
  /**
   * Handle collision detection between projectiles and enemies
   */
  private checkCollisions(session: HeadlessGameSession): void {
    for (let i = session.projectiles.length - 1; i >= 0; i--) {
      const projectile = session.projectiles[i];
      
      for (let j = session.enemies.length - 1; j >= 0; j--) {
        const enemy = session.enemies[j];
        const distance = Math.sqrt(
          Math.pow(projectile.x - enemy.x, 2) + Math.pow(projectile.y - enemy.y, 2)
        );
        
        if (distance < enemy.size + 5) { // Hit detection
          // Record hit for analytics
          this.recordAnalyticsEvent(session, {
            timestamp: session.currentTime,
            type: 'hit',
            data: {
              enemyX: enemy.x,
              enemyY: enemy.y,
              projectileX: projectile.x,
              projectileY: projectile.y,
              enemySize: enemy.sizeLevel,
              points: enemy.points
            }
          });
          
          // Award points
          session.score += enemy.points;
          
          // Remove projectile and enemy
          session.projectiles.splice(i, 1);
          session.enemies.splice(j, 1);
          
          break; // One projectile can only hit one enemy
        }
      }
    }
  }
  
  /**
   * Spawn enemies based on level configuration
   */
  private updateEnemySpawning(session: HeadlessGameSession): void {
    const level = session.levelConfig;
    
    if (session.currentWave >= level.enemyWaves.length) {
      return; // No more waves to spawn
    }
    
    const currentWave = level.enemyWaves[session.currentWave];
    const waveElapsed = session.currentTime - session.waveStartTime;
    
    // Check if it's time to spawn this wave
    if (waveElapsed >= currentWave.startTime) {
      this.spawnWaveEnemies(session, currentWave);
      session.currentWave++;
      session.waveStartTime = session.currentTime;
    }
  }
  
  /**
   * Spawn enemies for a specific wave
   */
  private spawnWaveEnemies(session: HeadlessGameSession, wave: any): void {
    wave.enemies.forEach((enemyGroup: any) => {
      for (let i = 0; i < enemyGroup.count; i++) {
        const enemy = this.createEnemy(enemyGroup, session.enemiesSpawned);
        session.enemies.push(enemy);
        session.enemiesSpawned++;
      }
    });
    
    console.log(`🎮 Spawned wave ${session.currentWave + 1}, enemies: ${wave.enemies.length} groups`);
  }
  
  /**
   * Create a new enemy entity
   */
  private createEnemy(enemyConfig: any, spawnIndex: number): HeadlessEnemy {
    const sizeLevel = enemyConfig.sizeLevel || 2;
    const size = gameCache.getBalloonSize(sizeLevel);
    const points = gameCache.getBalloonPoints(sizeLevel);
    const speed = gameCache.getEnemySpeed(sizeLevel);
    
    // Use authentic DOS spawn positions
    const spawnPositions = {
      TWO_SMALL: [0.2, 0.8],
      THREE_SMALL_WIDE: [0.15, 0.5, 0.85],
      PIPES: [0.25, 0.5, 0.75],
      CRAZY: [0.1, 0.3, 0.5, 0.7, 0.9],
      ENTRAP: [0.1, 0.9]
    };
    
    const positions = spawnPositions[enemyConfig.pattern as keyof typeof spawnPositions] || [0.5];
    const xPercent = positions[spawnIndex % positions.length];
    const x = this.SCREEN_WIDTH * xPercent;
    
    // Authentic DOS Y spawn positions
    const ySpawnPositions = [0.285, 0.375, 0.385]; // 28.5%, 37.5%, 38.5% from top
    const yPercent = ySpawnPositions[spawnIndex % ySpawnPositions.length];
    const y = this.SCREEN_HEIGHT * yPercent;
    
    return {
      id: `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      x,
      y,
      vx: (Math.random() - 0.5) * speed, // Random horizontal velocity
      vy: Math.random() * speed * 0.5,   // Slight downward velocity
      size,
      sizeLevel,
      health: 1,
      points
    };
  }
  
  /**
   * Make AI decision and execute action
   */
  private makeAIDecision(session: HeadlessGameSession): void {
    const gameState = this.createGameStateFromSession(session);
    const decisionStartTime = Date.now();
    
    // Get AI action
    const action = peteAI(gameState, session.aiConfig);
    
    // Record decision for analytics
    const reactionTime = Date.now() - decisionStartTime;
    this.recordAnalyticsEvent(session, {
      timestamp: session.currentTime,
      type: 'decision',
      data: {
        action,
        gameState: {
          peteX: session.peteX,
          enemies: session.enemies.map(e => ({ x: e.x, y: e.y, vx: e.vx, vy: e.vy, size: e.size, id: e.id })),
          projectiles: session.projectiles.map(p => ({ x: p.x, y: p.y, id: p.id }))
        },
        reactionTime,
        decisionQuality: this.evaluateDecisionQuality(action, gameState)
      }
    });
    
    // Execute action
    this.executeAIAction(session, action);
    
    // Record game history
    session.gameHistory.push({
      state: gameState,
      action,
      timestamp: session.currentTime
    });
    
    session.actionCount++;
  }
  
  /**
   * Execute AI action in headless environment
   */
  private executeAIAction(session: HeadlessGameSession, action: AIAction): void {
    switch (action.type) {
      case 'shoot':
        this.shootProjectile(session);
        break;
      case 'move':
        if (action.x !== undefined) {
          session.peteX = Math.max(30, Math.min(this.SCREEN_WIDTH - 30, action.x));
        }
        break;
      case 'idle':
        // Do nothing
        break;
    }
  }
  
  /**
   * Create and shoot a projectile
   */
  private shootProjectile(session: HeadlessGameSession): void {
    const projectile: HeadlessProjectile = {
      id: `projectile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      x: session.peteX,
      y: session.peteY - 20,
      vx: 0,
      vy: -this.PROJECTILE_SPEED,
      speed: this.PROJECTILE_SPEED
    };
    
    session.projectiles.push(projectile);
    
    // Record shot for analytics
    this.recordAnalyticsEvent(session, {
      timestamp: session.currentTime,
      type: 'shot',
      data: {
        projectileX: projectile.x,
        projectileY: projectile.y,
        targetEnemies: session.enemies.filter(e => Math.abs(e.x - session.peteX) < 100)
      }
    });
  }
  
  /**
   * Check if game should end (win/loss conditions)
   */
  private checkGameEndConditions(session: HeadlessGameSession): void {
    // Check if all enemies are destroyed
    if (session.enemies.length === 0 && session.currentWave >= session.levelConfig.enemyWaves.length) {
      session.isPlaying = false;
      console.log('🎮 Level completed - all enemies destroyed');
      return;
    }
    
    // Check if Pete got hit by enemies (simplified collision)
    const peteHit = session.enemies.some(enemy => {
      const distance = Math.sqrt(
        Math.pow(enemy.x - session.peteX, 2) + Math.pow(enemy.y - session.peteY, 2)
      );
      return distance < enemy.size + 15; // Pete collision radius
    });
    
    if (peteHit) {
      session.lives--;
      console.log(`🎮 Pete hit! Lives remaining: ${session.lives}`);
      
      if (session.lives <= 0) {
        session.gameOver = true;
        session.isPlaying = false;
        console.log('🎮 Game over - no lives remaining');
      }
    }
  }
  
  /**
   * Record analytics event
   */
  private recordAnalyticsEvent(session: HeadlessGameSession, event: AIAnalyticsEvent): void {
    session.analyticsEvents.push(event);
  }
  
  /**
   * Create GameState from session for AI
   */
  private createGameStateFromSession(session: HeadlessGameSession): GameState {
    return {
      peteX: session.peteX,
      peteY: session.peteY,
      screenWidth: this.SCREEN_WIDTH,
      screenHeight: this.SCREEN_HEIGHT,
      enemies: session.enemies.map(enemy => ({
        x: enemy.x,
        y: enemy.y,
        vx: enemy.vx,
        vy: enemy.vy,
        size: enemy.size,
        id: enemy.id
      })),
      projectiles: session.projectiles.map(projectile => ({
        x: projectile.x,
        y: projectile.y,
        id: projectile.id
      })),
      isPlaying: session.isPlaying,
      isPaused: false,
      gameOver: session.gameOver,
      score: session.score,
      lives: session.lives,
      level: session.levelId
    };
  }
  
  /**
   * Evaluate quality of AI decision
   */
  private evaluateDecisionQuality(action: AIAction, gameState: GameState): 'optimal' | 'good' | 'poor' {
    // Simplified decision quality evaluation
    if (action.type === 'shoot') {
      const closeEnemies = gameState.enemies.filter(e => Math.abs(e.x - gameState.peteX) < 50);
      return closeEnemies.length > 0 ? 'optimal' : 'good';
    }
    
    if (action.type === 'move') {
      const threateningEnemies = gameState.enemies.filter(e => Math.abs(e.x - gameState.peteX) < 60);
      return threateningEnemies.length > 0 ? 'optimal' : 'good';
    }
    
    return 'good';
  }
  
  /**
   * Simulate frame delay to avoid CPU burning
   */
  private async simulateFrameDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, this.FRAME_TIME));
  }
  
  /**
   * Create empty metrics for error cases
   */
  private createEmptyMetrics(): AIMetrics {
    return {
      totalShots: 0,
      hits: 0,
      misses: 0,
      accuracy: 0,
      totalMovements: 0,
      averageDistanceFromCenter: 0,
      movementEfficiency: 0,
      dodgeSuccessRate: 0,
      averageReactionTime: 0,
      fastestReaction: 0,
      slowestReaction: 0,
      threatsDetected: 0,
      threatsAvoided: 0,
      threatsHit: 0,
      survivalTime: 0,
      score: 0,
      level: 0,
      levelCompleted: false,
      optimalDecisions: 0,
      suboptimalDecisions: 0,
      decisionSpeed: 0,
      enemiesDestroyed: 0,
      enemiesMissed: 0,
      powerUpsCollected: 0,
      averageFPS: 60,
      frameDrops: 0,
      memoryUsage: 0,
      balanceMetrics: {
        sweetSpotRatio: { almostWinRate: 0, clutchWinRate: 0, dominantWinRate: 0 },
        emotionalPulse: { tensionBuildupRate: 0, reliefMomentCount: 0, reliefMomentDuration: 0, panicEventCount: 0, peakTensionMoments: 0 },
        cognitiveLoad: { averageSimultaneousThreats: 0, peakSimultaneousThreats: 0, decisionComplexityScore: 0, reactionTimeUnderPressure: 0, overwhelmEvents: 0 },
        agencyBalance: { skillBasedFailureRate: 0, randomFailureRate: 0, playerInfluenceScore: 0, predictabilityIndex: 0, comebackPotential: 0 },
        learningCurve: { improvementRate: 0, plateauDetection: false, skillBreakthroughEvents: 0, retentionBetweenSessions: 0, masteryIndicators: 0 },
        flowState: { consistentPerformanceWindows: 0, distractionEvents: 0, immersionScore: 0, timePerceptionDistortion: 0, effortlessExecutionPeriods: 0 },
        engagementQuality: { skillExpressionOpportunities: 0, strategicDepth: 0, momentToMomentEngagement: 0, replayMotivation: 0, satisfactionScore: 0 }
      }
    };
  }
  
  /**
   * Create empty game state for error cases
   */
  private createEmptyGameState(): GameState {
    return {
      peteX: this.SCREEN_WIDTH / 2,
      peteY: this.PETE_Y,
      screenWidth: this.SCREEN_WIDTH,
      screenHeight: this.SCREEN_HEIGHT,
      enemies: [],
      projectiles: [],
      isPlaying: false,
      isPaused: false,
      gameOver: true,
      score: 0,
      lives: 0,
      level: 0
    };
  }
  
  /**
   * Add singleton reset method for testing
   */
  public static resetInstance(): void {
    HeadlessGameSimulator.instance = new HeadlessGameSimulator();
  }
}

// Export singleton instance
export const headlessGameSimulator = HeadlessGameSimulator.getInstance();