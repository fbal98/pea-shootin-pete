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
  score: number;
  lives: number;
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
 * AI performance metrics for data collection
 */
export interface AIMetrics {
  totalShots: number;
  hits: number;
  accuracy: number;
  totalMovements: number;
  averageDistanceFromCenter: number;
  survivalTime: number;
  score: number;
  level: number;
}

/**
 * Calculate AI performance metrics from game data
 */
export function calculateAIMetrics(
  gameHistory: Array<{ state: GameState; action: AIAction; timestamp: number }>,
  finalState: GameState
): AIMetrics {
  const totalShots = gameHistory.filter(entry => entry.action.type === 'shoot').length;
  const movements = gameHistory.filter(entry => entry.action.type === 'move');
  
  // Calculate average distance from center
  const centerX = finalState.screenWidth / 2;
  const avgDistanceFromCenter = gameHistory.reduce((sum, entry) => 
    sum + Math.abs(entry.state.peteX - centerX), 0
  ) / gameHistory.length;
  
  // Calculate survival time
  const startTime = gameHistory[0]?.timestamp || 0;
  const endTime = gameHistory[gameHistory.length - 1]?.timestamp || 0;
  const survivalTime = endTime - startTime;
  
  return {
    totalShots,
    hits: 0, // Would need to be calculated from collision events
    accuracy: 0, // Would need hit data
    totalMovements: movements.length,
    averageDistanceFromCenter: avgDistanceFromCenter,
    survivalTime,
    score: finalState.score,
    level: 1, // Would need level data from game state
  };
}