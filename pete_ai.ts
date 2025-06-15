/**
 * Pete AI - Simple AI for automated gameplay testing and data collection
 * 
 * This AI implements basic survival and shooting logic for regression testing
 * and automated data collection. It's designed to be predictable rather than optimal.
 */

export interface GameState {
  // Pete's current position
  peteX: number;
  peteY: number;
  
  // Screen dimensions
  screenWidth: number;
  screenHeight: number;
  
  // Enemy data
  enemies: Array<{
    x: number;
    y: number;
    vx: number;  // velocity x
    vy: number;  // velocity y
    size: number;
    id: string;
  }>;
  
  // Active projectiles (to avoid shooting in same lane)
  projectiles: Array<{
    x: number;
    y: number;
    id: string;
  }>;
  
  // Game status
  isPlaying: boolean;
  isPaused: boolean;
  gameOver: boolean;
  score: number;
  lives: number;
  level: number;
}

export interface AIConfig {
  // Shooting behavior
  shootThreshold: number;     // px - horizontal distance to shoot at enemies
  laneWidth: number;          // px - width of "lane" to check for existing projectiles
  
  // Avoidance behavior  
  avoidThreshold: number;     // px - horizontal distance to start dodging
  dodgeSpeed: number;         // px - how far to move when dodging
  
  // Centering behavior
  centerBias: number;         // 0-1 - % of screen width considered "center zone"
  centerSpeed: number;        // px - how fast to drift toward center
  
  // Movement constraints
  minX: number;              // minimum X position (screen edge buffer)
  maxX: number;              // maximum X position (screen edge buffer)
}

export type AIAction = 
  | { type: 'shoot' }
  | { type: 'move', x: number }
  | { type: 'idle' };

/**
 * Default AI configuration - tuned for basic survival and shooting
 */
export const DEFAULT_AI_CONFIG: AIConfig = {
  // Shooting - fairly aggressive to test collision system
  shootThreshold: 80,    // Shoot when enemy within 80px horizontally
  laneWidth: 20,         // Don't shoot if projectile within 20px of target lane
  
  // Avoidance - moderate defensive behavior
  avoidThreshold: 60,    // Start dodging when enemy within 60px
  dodgeSpeed: 40,        // Move 40px away when dodging
  
  // Centering - gentle drift back to center
  centerBias: 0.4,       // Center zone = 40% of screen width
  centerSpeed: 15,       // Move 15px toward center per decision
  
  // Movement bounds - stay away from screen edges
  minX: 30,              // 30px from left edge
  maxX: -30,             // 30px from right edge (relative to screenWidth)
};

/**
 * Simple AI decision function for Pete
 * 
 * Priority order:
 * 1. Shoot at enemies in range (if lane is clear)
 * 2. Dodge nearby enemies
 * 3. Drift toward screen center
 * 4. Stay idle if no action needed
 */
export function peteAI(gameState: GameState, config: AIConfig = DEFAULT_AI_CONFIG): AIAction {
  const { peteX, enemies, projectiles, screenWidth, isPlaying, isPaused } = gameState;
  
  console.log('🎯 peteAI called with:', {
    peteX,
    enemyCount: enemies.length,
    projectileCount: projectiles.length,
    screenWidth,
    isPlaying,
    isPaused,
    config: {
      shootThreshold: config.shootThreshold,
      avoidThreshold: config.avoidThreshold,
      centerBias: config.centerBias
    }
  });
  
  // Don't act if game isn't running
  if (!isPlaying || isPaused) {
    console.log('🎯 AI IDLE - Game not running:', { isPlaying, isPaused });
    return { type: 'idle' };
  }
  
  // Calculate movement bounds
  const minX = config.minX;
  const maxX = screenWidth + config.maxX; // maxX is negative offset
  const centerX = screenWidth / 2;
  const centerZoneHalf = (screenWidth * config.centerBias) / 2;
  
  // Priority 1: Shooting Logic
  // Find enemies within shooting threshold
  const shootableEnemies = enemies.filter(enemy => 
    Math.abs(enemy.x - peteX) <= config.shootThreshold
  );
  
  console.log('🎯 Priority 1 - Shooting Check:', {
    shootableEnemyCount: shootableEnemies.length,
    shootThreshold: config.shootThreshold,
    peteX,
    enemyPositions: enemies.map(e => ({ x: e.x, distanceFromPete: Math.abs(e.x - peteX) }))
  });
  
  if (shootableEnemies.length > 0) {
    // Check if any projectile is already in the lane of the closest enemy
    const closestEnemy = shootableEnemies.reduce((closest, enemy) => 
      Math.abs(enemy.x - peteX) < Math.abs(closest.x - peteX) ? enemy : closest
    );
    
    const laneOccupied = projectiles.some(projectile => 
      Math.abs(projectile.x - closestEnemy.x) <= config.laneWidth
    );
    
    console.log('🎯 Shooting Decision:', {
      closestEnemyX: closestEnemy.x,
      distanceFromPete: Math.abs(closestEnemy.x - peteX),
      laneOccupied,
      laneWidth: config.laneWidth,
      projectilePositions: projectiles.map(p => ({ x: p.x, distanceFromEnemy: Math.abs(p.x - closestEnemy.x) }))
    });
    
    if (!laneOccupied) {
      console.log('🎯 DECISION: SHOOT at enemy at', closestEnemy.x);
      return { type: 'shoot' };
    } else {
      console.log('🎯 SHOOT blocked - lane occupied');
    }
  } else {
    console.log('🎯 No shootable enemies found');
  }
  
  // Priority 2: Avoidance Logic
  // Find threatening enemies (close horizontally)
  const threateningEnemies = enemies.filter(enemy => 
    Math.abs(enemy.x - peteX) <= config.avoidThreshold
  );
  
  if (threateningEnemies.length > 0) {
    // Find the closest threatening enemy
    const closestThreat = threateningEnemies.reduce((closest, enemy) => 
      Math.abs(enemy.x - peteX) < Math.abs(closest.x - peteX) ? enemy : closest
    );
    
    // Dodge away from the threat
    let dodgeX: number;
    if (closestThreat.x > peteX) {
      // Enemy is to the right, dodge left
      dodgeX = Math.max(minX, peteX - config.dodgeSpeed);
    } else {
      // Enemy is to the left, dodge right
      dodgeX = Math.min(maxX, peteX + config.dodgeSpeed);
    }
    
    return { type: 'move', x: dodgeX };
  }
  
  // Priority 3: Centering Logic
  // Check if Pete is outside the center zone
  const centerZoneLeft = centerX - centerZoneHalf;
  const centerZoneRight = centerX + centerZoneHalf;
  
  if (peteX < centerZoneLeft || peteX > centerZoneRight) {
    // Drift toward center
    let targetX: number;
    if (peteX < centerX) {
      // Pete is left of center, move right
      targetX = Math.min(centerX, peteX + config.centerSpeed);
    } else {
      // Pete is right of center, move left
      targetX = Math.max(centerX, peteX - config.centerSpeed);
    }
    
    // Ensure we stay within bounds
    targetX = Math.max(minX, Math.min(maxX, targetX));
    
    return { type: 'move', x: targetX };
  }
  
  // Priority 4: Default - stay idle
  console.log('🎯 DECISION: IDLE - no action needed');
  return { type: 'idle' };
}

/**
 * Utility function to create AI config variations for different test scenarios
 */
export function createAIConfig(overrides: Partial<AIConfig>): AIConfig {
  return { ...DEFAULT_AI_CONFIG, ...overrides };
}

/**
 * Predefined AI configurations for different testing scenarios
 */
export const AI_PRESETS = {
  // Aggressive AI - shoots frequently, moves a lot
  aggressive: createAIConfig({
    shootThreshold: 120,
    avoidThreshold: 40,
    dodgeSpeed: 60,
    centerSpeed: 25,
  }),
  
  // Defensive AI - focuses on survival over scoring
  defensive: createAIConfig({
    shootThreshold: 60,
    avoidThreshold: 100,
    dodgeSpeed: 80,
    centerSpeed: 10,
  }),
  
  // Stationary AI - minimal movement, tests shooting accuracy
  stationary: createAIConfig({
    shootThreshold: 100,
    avoidThreshold: 30,
    dodgeSpeed: 20,
    centerSpeed: 5,
    centerBias: 0.1, // Very narrow center zone
  }),
  
  // Chaotic AI - unpredictable movement for stress testing
  chaotic: createAIConfig({
    shootThreshold: 90,
    avoidThreshold: 80,
    dodgeSpeed: 100,
    centerSpeed: 40,
    centerBias: 0.8, // Very wide center zone
  }),
};

/**
 * Comprehensive AI performance metrics for data collection and game balance analysis
 */
export interface AIMetrics {
  // Basic Performance
  totalShots: number;
  hits: number;
  misses: number;
  accuracy: number;
  
  // Movement Analysis
  totalMovements: number;
  averageDistanceFromCenter: number;
  movementEfficiency: number;
  dodgeSuccessRate: number;
  
  // Timing & Reactions
  averageReactionTime: number;
  fastestReaction: number;
  slowestReaction: number;
  
  // Threat Assessment
  threatsDetected: number;
  threatsAvoided: number;
  threatsHit: number;
  
  // Game Progression
  survivalTime: number;
  score: number;
  level: number;
  levelCompleted: boolean;
  
  // Decision Quality
  optimalDecisions: number;
  suboptimalDecisions: number;
  decisionSpeed: number;
  
  // Enemy Interaction
  enemiesDestroyed: number;
  enemiesMissed: number;
  powerUpsCollected: number;
  
  // Performance Metrics
  averageFPS: number;
  frameDrops: number;
  memoryUsage: number;
  
  // Balance-Focused Metrics (NEW)
  balanceMetrics: BalanceMetrics;
}

/**
 * Enhanced balance-focused metrics for manual level tuning
 */
export interface BalanceMetrics {
  // Sweet Spot Ratio - The core of fun balancing
  sweetSpotRatio: {
    almostWinRate: number;      // % of attempts that reach 90%+ completion but fail
    clutchWinRate: number;      // % of wins with <10% health/time remaining
    dominantWinRate: number;    // % of wins with >50% resources remaining
  };
  
  // Emotional Pulse Tracking
  emotionalPulse: {
    tensionBuildupRate: number;     // Rate of threat accumulation (threats/second)
    reliefMomentCount: number;      // Number of low-stress periods
    reliefMomentDuration: number;   // Average duration of relief periods
    panicEventCount: number;        // Times when performance drops >30%
    peakTensionMoments: number;     // Times with 5+ simultaneous threats
  };
  
  // Cognitive Load Assessment
  cognitiveLoad: {
    averageSimultaneousThreats: number;  // Average enemy count during gameplay
    peakSimultaneousThreats: number;     // Maximum enemies at once
    decisionComplexityScore: number;     // Average options per decision point
    reactionTimeUnderPressure: number;   // Reaction time with 3+ enemies
    overwhelmEvents: number;             // Times with >6 simultaneous threats
  };
  
  // Player Agency vs Chaos Balance
  agencyBalance: {
    skillBasedFailureRate: number;    // % of failures due to player skill
    randomFailureRate: number;        // % of failures due to unpredictable events
    playerInfluenceScore: number;     // How much player decisions affect outcome (0-1)
    predictabilityIndex: number;      // How predictable outcomes are (0-1)
    comebackPotential: number;        // Ability to recover from bad situations
  };
  
  // Learning Curve Indicators
  learningCurve: {
    improvementRate: number;          // Performance increase over attempts
    plateauDetection: boolean;        // Whether improvement has stopped
    skillBreakthroughEvents: number;  // Sudden performance jumps
    retentionBetweenSessions: number; // Skill retained between plays
    masteryIndicators: number;        // Signs of deep game understanding
  };
  
  // Flow State Indicators
  flowState: {
    consistentPerformanceWindows: number;  // Periods of stable performance
    distractionEvents: number;             // Performance drops from external factors
    immersionScore: number;                // How "in the zone" the player seems
    timePerceptionDistortion: number;      // Longer sessions = better flow
    effortlessExecutionPeriods: number;    // Times when actions seem automatic
  };
  
  // Engagement Quality Score
  engagementQuality: {
    skillExpressionOpportunities: number;  // Chances to show mastery
    strategicDepth: number;                // Number of viable strategies
    momentToMomentEngagement: number;      // Constant meaningful decisions
    replayMotivation: number;              // Desire to play again after session
    satisfactionScore: number;             // Overall enjoyment estimate (0-1)
  };
}

/**
 * Real-time analytics event for tracking individual game actions
 */
export interface AIAnalyticsEvent {
  timestamp: number;
  type: 'shot' | 'hit' | 'miss' | 'dodge' | 'threat_detected' | 'enemy_destroyed' | 'decision' | 'performance';
  data: {
    action?: AIAction;
    gameState?: Partial<GameState>;
    reactionTime?: number;
    threatLevel?: number;
    decisionQuality?: 'optimal' | 'good' | 'poor';
    fps?: number;
    memoryMB?: number;
    [key: string]: any;
  };
}

/**
 * Game balance insights derived from AI analytics
 */
export interface GameBalanceInsights {
  levelDifficulty: {
    completionRate: number;
    averageAttempts: number;
    difficultyRating: 'too_easy' | 'balanced' | 'too_hard';
  };
  
  enemyBalance: {
    spawningRate: number;
    threatLevel: number;
    eliminationEfficiency: number;
  };
  
  performanceImpact: {
    fpsStability: number;
    memoryEfficiency: number;
    thermalThrottling: boolean;
  };
  
  recommendations: string[];
}

/**
 * Calculate comprehensive AI performance metrics from game data and analytics events
 */
export function calculateAIMetrics(
  gameHistory: Array<{ state: GameState; action: AIAction; timestamp: number }>,
  analyticsEvents: AIAnalyticsEvent[],
  finalState: GameState
): AIMetrics {
  const totalShots = gameHistory.filter(entry => entry.action.type === 'shoot').length;
  const movements = gameHistory.filter(entry => entry.action.type === 'move');
  
  // Calculate hits and misses from analytics events
  const hitEvents = analyticsEvents.filter(e => e.type === 'hit');
  const missEvents = analyticsEvents.filter(e => e.type === 'miss');
  const hits = hitEvents.length;
  const misses = missEvents.length;
  const accuracy = totalShots > 0 ? (hits / totalShots) * 100 : 0;
  
  // Calculate movement efficiency and center distance
  const centerX = finalState.screenWidth / 2;
  const avgDistanceFromCenter = gameHistory.reduce((sum, entry) => 
    sum + Math.abs(entry.state.peteX - centerX), 0
  ) / gameHistory.length;
  
  // Calculate movement efficiency (distance moved vs threats avoided)
  const totalDistance = movements.reduce((sum, move, index) => {
    if (index === 0 || move.action.type !== 'move') return sum;
    const prevMove = movements[index - 1];
    if (prevMove.action.type !== 'move') return sum;
    return sum + Math.abs(move.action.x - prevMove.action.x);
  }, 0);
  const threatsAvoided = analyticsEvents.filter(e => e.type === 'dodge').length;
  const movementEfficiency = threatsAvoided > 0 ? totalDistance / threatsAvoided : 0;
  
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
    fpsValues.reduce((sum, fps) => sum + fps, 0) / fpsValues.length : 0;
  const frameDrops = fpsValues.filter(fps => fps < 55).length;
  
  // Calculate survival time
  const startTime = gameHistory[0]?.timestamp || 0;
  const endTime = gameHistory[gameHistory.length - 1]?.timestamp || 0;
  const survivalTime = endTime - startTime;
  
  // Calculate balance-focused metrics
  const balanceMetrics = calculateBalanceMetrics(gameHistory, analyticsEvents, finalState);

  return {
    // Basic Performance
    totalShots,
    hits,
    misses,
    accuracy,
    
    // Movement Analysis
    totalMovements: movements.length,
    averageDistanceFromCenter: avgDistanceFromCenter,
    movementEfficiency,
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
    score: finalState.score,
    level: finalState.level || 1,
    levelCompleted: !finalState.gameOver && finalState.score > 0,
    
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
    
    // Balance-Focused Metrics (NEW)
    balanceMetrics,
  };
}

/**
 * Calculate enhanced balance-focused metrics for manual level tuning
 */
function calculateBalanceMetrics(
  gameHistory: Array<{ state: GameState; action: AIAction; timestamp: number }>,
  analyticsEvents: AIAnalyticsEvent[],
  finalState: GameState
): BalanceMetrics {
  const totalTime = gameHistory.length > 0 ? 
    gameHistory[gameHistory.length - 1].timestamp - gameHistory[0].timestamp : 0;
  const isWin = !finalState.gameOver && finalState.score > 0;
  
  // Calculate Sweet Spot Ratio
  const progressionEvents = gameHistory.map((entry, index) => ({
    progress: calculateProgressPercentage(entry.state, finalState),
    timestamp: entry.timestamp,
    index
  }));
  
  const maxProgress = Math.max(...progressionEvents.map(e => e.progress));
  const almostWin = maxProgress >= 90 && !isWin;
  const clutchWin = isWin && (finalState.lives <= 1 || maxProgress >= 85);
  const dominantWin = isWin && finalState.lives > 2 && maxProgress < 70;
  
  // Calculate Emotional Pulse
  const threatCounts = gameHistory.map(entry => entry.state.enemies.length);
  const avgThreats = threatCounts.reduce((sum, count) => sum + count, 0) / threatCounts.length;
  const peakThreats = Math.max(...threatCounts);
  const tensionSpikes = threatCounts.filter(count => count >= 5).length;
  const reliefPeriods = findReliefPeriods(threatCounts);
  const panicMoments = findPerformanceDrops(gameHistory, analyticsEvents);
  
  // Calculate Cognitive Load
  const decisionPoints = analyticsEvents.filter(e => e.type === 'decision').length;
  const pressureReactions = analyticsEvents
    .filter(e => e.type === 'decision' && e.data.reactionTime)
    .filter((_, index) => threatCounts[index] >= 3);
  const avgPressureReaction = pressureReactions.length > 0 ?
    pressureReactions.reduce((sum, e) => sum + (e.data.reactionTime || 0), 0) / pressureReactions.length : 0;
  
  // Calculate Agency Balance
  const skillBasedEvents = analyticsEvents.filter(e => 
    e.data.decisionQuality === 'optimal' || e.data.decisionQuality === 'good'
  ).length;
  const randomEvents = analyticsEvents.filter(e => 
    e.type === 'performance' && e.data.fps && e.data.fps < 30
  ).length; // Poor performance as proxy for "unfair" events
  const playerInfluence = decisionPoints > 0 ? skillBasedEvents / decisionPoints : 0;
  
  // Calculate Learning Curve (simplified for single session)
  const performanceOverTime = calculatePerformanceTrend(gameHistory, analyticsEvents);
  const improvementDetected = performanceOverTime.slope > 0.1;
  const breakthroughs = detectBreakthroughs(performanceOverTime.values);
  
  // Calculate Flow State
  const consistentPeriods = findConsistentPerformancePeriods(gameHistory, analyticsEvents);
  const distractions = analyticsEvents.filter(e => 
    e.type === 'performance' && e.data.fps && e.data.fps < 45
  ).length;
  
  // Calculate Engagement Quality
  const uniqueStrategies = countUniqueStrategies(gameHistory);
  const skillfulMoments = analyticsEvents.filter(e => 
    e.data.decisionQuality === 'optimal'
  ).length;
  
  return {
    sweetSpotRatio: {
      almostWinRate: almostWin ? 1 : 0,  // Single session, so 1 or 0
      clutchWinRate: clutchWin ? 1 : 0,
      dominantWinRate: dominantWin ? 1 : 0,
    },
    
    emotionalPulse: {
      tensionBuildupRate: totalTime > 0 ? tensionSpikes / (totalTime / 1000) : 0,
      reliefMomentCount: reliefPeriods.count,
      reliefMomentDuration: reliefPeriods.avgDuration,
      panicEventCount: panicMoments,
      peakTensionMoments: tensionSpikes,
    },
    
    cognitiveLoad: {
      averageSimultaneousThreats: avgThreats,
      peakSimultaneousThreats: peakThreats,
      decisionComplexityScore: decisionPoints > 0 ? avgThreats : 0,
      reactionTimeUnderPressure: avgPressureReaction,
      overwhelmEvents: threatCounts.filter(count => count > 6).length,
    },
    
    agencyBalance: {
      skillBasedFailureRate: !isWin && skillBasedEvents > randomEvents ? 0.8 : 0.3,
      randomFailureRate: !isWin && randomEvents > skillBasedEvents ? 0.7 : 0.2,
      playerInfluenceScore: playerInfluence,
      predictabilityIndex: avgThreats > 0 ? Math.min(1, 2 / avgThreats) : 0,
      comebackPotential: isWin && maxProgress > 85 ? 0.8 : 0.4,
    },
    
    learningCurve: {
      improvementRate: performanceOverTime.slope,
      plateauDetection: Math.abs(performanceOverTime.slope) < 0.05,
      skillBreakthroughEvents: breakthroughs,
      retentionBetweenSessions: 0, // Requires multiple sessions
      masteryIndicators: skillfulMoments,
    },
    
    flowState: {
      consistentPerformanceWindows: consistentPeriods,
      distractionEvents: distractions,
      immersionScore: totalTime > 180000 ? 0.8 : totalTime / 180000, // 3+ min = good flow
      timePerceptionDistortion: Math.min(1, totalTime / 300000), // 5+ min = excellent flow
      effortlessExecutionPeriods: Math.floor(consistentPeriods / 2),
    },
    
    engagementQuality: {
      skillExpressionOpportunities: skillfulMoments,
      strategicDepth: uniqueStrategies,
      momentToMomentEngagement: decisionPoints / (totalTime / 1000),
      replayMotivation: isWin ? 0.7 : 0.4,
      satisfactionScore: calculateSatisfactionScore(isWin, maxProgress, skillfulMoments, totalTime),
    },
  };
}

// Helper functions for balance metrics calculation
function calculateProgressPercentage(state: GameState, finalState: GameState): number {
  // Simplified progress calculation based on score and survival time
  const scoreProgress = finalState.score > 0 ? (state.score / finalState.score) * 100 : 0;
  return Math.min(100, scoreProgress);
}

function findReliefPeriods(threatCounts: number[]): { count: number; avgDuration: number } {
  let reliefCount = 0;
  let totalReliefDuration = 0;
  let currentReliefDuration = 0;
  
  for (const count of threatCounts) {
    if (count <= 2) {
      currentReliefDuration++;
    } else {
      if (currentReliefDuration >= 3) { // 3+ frames of low threat = relief period
        reliefCount++;
        totalReliefDuration += currentReliefDuration;
      }
      currentReliefDuration = 0;
    }
  }
  
  return {
    count: reliefCount,
    avgDuration: reliefCount > 0 ? totalReliefDuration / reliefCount : 0,
  };
}

function findPerformanceDrops(
  gameHistory: Array<{ state: GameState; action: AIAction; timestamp: number }>,
  analyticsEvents: AIAnalyticsEvent[]
): number {
  // Look for periods where reaction time increases significantly
  const reactionTimes = analyticsEvents
    .filter(e => e.data.reactionTime)
    .map(e => e.data.reactionTime!);
  
  if (reactionTimes.length < 5) return 0;
  
  const avgReaction = reactionTimes.reduce((sum, time) => sum + time, 0) / reactionTimes.length;
  return reactionTimes.filter(time => time > avgReaction * 1.5).length;
}

function calculatePerformanceTrend(
  gameHistory: Array<{ state: GameState; action: AIAction; timestamp: number }>,
  analyticsEvents: AIAnalyticsEvent[]
): { slope: number; values: number[] } {
  const windowSize = Math.floor(gameHistory.length / 5); // 5 windows
  const values: number[] = [];
  
  for (let i = 0; i < 5; i++) {
    const start = i * windowSize;
    const end = Math.min(start + windowSize, gameHistory.length);
    const windowEvents = analyticsEvents.filter((_, index) => index >= start && index < end);
    const hits = windowEvents.filter(e => e.type === 'hit').length;
    const total = windowEvents.filter(e => e.type === 'shot').length;
    const accuracy = total > 0 ? hits / total : 0;
    values.push(accuracy);
  }
  
  // Calculate simple linear regression slope
  const n = values.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = values.reduce((sum, val) => sum + val, 0);
  const sumXY = values.reduce((sum, val, index) => sum + index * val, 0);
  const sumX2 = values.reduce((sum, _, index) => sum + index * index, 0);
  
  const slope = n > 1 ? (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) : 0;
  
  return { slope, values };
}

function detectBreakthroughs(performanceValues: number[]): number {
  let breakthroughs = 0;
  for (let i = 1; i < performanceValues.length; i++) {
    if (performanceValues[i] - performanceValues[i - 1] > 0.2) {
      breakthroughs++;
    }
  }
  return breakthroughs;
}

function findConsistentPerformancePeriods(
  gameHistory: Array<{ state: GameState; action: AIAction; timestamp: number }>,
  analyticsEvents: AIAnalyticsEvent[]
): number {
  // Count periods where performance variance is low
  const windowSize = Math.floor(gameHistory.length / 10);
  let consistentWindows = 0;
  
  for (let i = 0; i < 10; i++) {
    const start = i * windowSize;
    const end = Math.min(start + windowSize, analyticsEvents.length);
    const windowEvents = analyticsEvents.slice(start, end);
    
    const reactionTimes = windowEvents
      .filter(e => e.data.reactionTime)
      .map(e => e.data.reactionTime!);
    
    if (reactionTimes.length >= 3) {
      const avg = reactionTimes.reduce((sum, time) => sum + time, 0) / reactionTimes.length;
      const variance = reactionTimes.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / reactionTimes.length;
      
      if (variance < avg * 0.3) { // Low variance = consistent performance
        consistentWindows++;
      }
    }
  }
  
  return consistentWindows;
}

function countUniqueStrategies(
  gameHistory: Array<{ state: GameState; action: AIAction; timestamp: number }>
): number {
  // Simplified strategy detection based on action patterns
  const strategies = new Set<string>();
  
  for (let i = 0; i < gameHistory.length - 2; i++) {
    const pattern = `${gameHistory[i].action.type}-${gameHistory[i + 1].action.type}-${gameHistory[i + 2].action.type}`;
    strategies.add(pattern);
  }
  
  return strategies.size;
}

function calculateSatisfactionScore(
  isWin: boolean,
  maxProgress: number,
  skillfulMoments: number,
  totalTime: number
): number {
  let score = 0;
  
  // Win bonus
  if (isWin) score += 0.4;
  
  // Progress bonus (even if they didn't win)
  score += Math.min(0.3, maxProgress / 100 * 0.3);
  
  // Skill expression bonus
  score += Math.min(0.2, skillfulMoments / 10 * 0.2);
  
  // Engagement duration bonus
  score += Math.min(0.1, totalTime / 300000 * 0.1); // 5 min = max bonus
  
  return Math.min(1, score);
}