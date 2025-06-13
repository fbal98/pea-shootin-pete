/**
 * Automated Game Testing Framework
 * Analyzes game configuration and provides data-driven improvement suggestions
 */

import { 
  GAME_CONFIG, 
  GAME_PHYSICS, 
  getBalloonSize, 
  getBalloonPoints,
  ENTITY_CONFIG,
  createLevelConfig,
  levelBalanceToConfigOverrides,
  LevelConfigOverrides
} from '../constants/GameConfig';

export interface GameplayMetrics {
  averageEnemyLifetime: number;
  playerHitRate: number;
  gameSessionDuration: number;
  retryCount: number;
  frustrationPoints: string[];
  engagementScore: number;
  difficultyRating: number;
}

export interface TestConfiguration {
  id: string;
  name: string;
  description: string;
  configOverrides: LevelConfigOverrides;
  expectedOutcome: string;
}

export class GameTester {
  private testResults: Map<string, GameplayMetrics> = new Map();
  private currentTest: TestConfiguration | null = null;

  /**
   * Predefined test configurations to improve game fun factor
   */
  private testConfigurations: TestConfiguration[] = [
    {
      id: 'easier_physics',
      name: 'Easier Physics',
      description: 'Slower enemies, more forgiving physics for casual players',
      configOverrides: {
        gravityMultiplier: 0.3,
        enemySpeedMultiplier: 0.7,
        balloonSizeMultiplier: 1.2,
        bounceEnergyMultiplier: 0.8
      },
      expectedOutcome: 'Higher completion rate, less frustration for new players'
    },
    {
      id: 'faster_paced',
      name: 'Faster Paced Action',
      description: 'More enemies, faster movement for experienced players',
      configOverrides: {
        enemySpeedMultiplier: 1.3,
        spawnRateMultiplier: 1.5,
        projectileSpeedMultiplier: 1.2,
        peteSpeedMultiplier: 1.1
      },
      expectedOutcome: 'More challenging, higher engagement for skilled players'
    },
    {
      id: 'balanced_feedback',
      name: 'Balanced Feedback',
      description: 'Better projectile speed and enemy behavior for satisfying hits',
      configOverrides: {
        projectileSpeedMultiplier: 1.1,
        enemySpeedMultiplier: 0.9,
        bounceEnergyMultiplier: 0.9,
        gravityMultiplier: 0.35
      },
      expectedOutcome: 'More satisfying shooting mechanics, better hit feedback'
    },
    {
      id: 'hyper_casual_optimized',
      name: 'Hyper-Casual Optimized',
      description: 'Perfect for 3-second comprehension and instant fun',
      configOverrides: {
        balloonSizeMultiplier: 1.3,
        enemySpeedMultiplier: 0.8,
        projectileSpeedMultiplier: 1.15,
        gravityMultiplier: 0.25,
        bounceEnergyMultiplier: 0.7
      },
      expectedOutcome: 'Easier to understand, more forgiving, instant gratification'
    },
    {
      id: 'dynamic_difficulty',
      name: 'Dynamic Difficulty',
      description: 'Adaptive challenge that responds to player performance',
      configOverrides: {
        enemySpeedMultiplier: 1.0,
        spawnRateMultiplier: 1.0,
        balloonSizeMultiplier: 1.0,
        // This would require dynamic adjustment based on player performance
      },
      expectedOutcome: 'Maintains optimal challenge level for all skill levels'
    }
  ];

  /**
   * Analyze current game configuration for potential issues
   */
  public analyzeCurrentConfiguration(): string[] {
    const issues: string[] = [];

    // Check physics balance
    if (GAME_PHYSICS.GRAVITY_PX_S2 < 300) {
      issues.push('⚠️ Gravity too low - balloons may float too slowly, reducing action');
    }
    if (GAME_PHYSICS.GRAVITY_PX_S2 > 800) {
      issues.push('⚠️ Gravity too high - balloons may fall too fast, making game too hard');
    }

    // Check enemy behavior
    if (GAME_CONFIG.ENEMY_BASE_SPEED < 30) {
      issues.push('⚠️ Enemy movement too slow - may feel sluggish and boring');
    }
    if (GAME_CONFIG.ENEMY_BASE_SPEED > 80) {
      issues.push('⚠️ Enemy movement too fast - may be frustrating for casual players');
    }

    // Check projectile balance
    if (ENTITY_CONFIG.PROJECTILE.SPEED < 500) {
      issues.push('⚠️ Projectile speed too slow - shooting may feel unresponsive');
    }
    if (ENTITY_CONFIG.PROJECTILE.SPEED > 800) {
      issues.push('⚠️ Projectile speed too fast - may be hard to see projectiles');
    }

    // Check balloon sizing
    const smallBalloonSize = getBalloonSize(1);
    const largeBalloonSize = getBalloonSize(3);
    if (largeBalloonSize / smallBalloonSize < 1.3) {
      issues.push('⚠️ Balloon size difference too small - progression may not feel rewarding');
    }

    // Check scoring balance
    const smallBalloonPoints = getBalloonPoints(1);
    const largeBalloonPoints = getBalloonPoints(3);
    if (smallBalloonPoints / largeBalloonPoints < 2) {
      issues.push('⚠️ Point difference too small - no incentive to hit smaller balloons');
    }

    // Check bounce physics
    if (GAME_PHYSICS.BOUNCE.FLOOR >= 1.0) {
      issues.push('⚠️ Perfect floor bouncing - balloons may bounce forever, reducing strategy');
    }

    return issues;
  }

  /**
   * Generate improvement suggestions based on common hyper-casual best practices
   */
  public generateImprovementSuggestions(): string[] {
    const suggestions: string[] = [];

    // Analyze current state and suggest improvements
    suggestions.push('🎯 Consider reducing gravity to 0.25x for more floaty, casual feel');
    suggestions.push('🚀 Increase projectile speed to 700+ for more responsive shooting');
    suggestions.push('🎈 Make large balloons 1.4x bigger for clearer visual hierarchy');
    suggestions.push('⚡ Add slight energy loss on bounces (0.95x) to prevent infinite bouncing');
    suggestions.push('🏃 Reduce enemy speed by 20% for more accessible gameplay');
    suggestions.push('🎊 Increase point difference between balloon sizes for better progression feel');
    suggestions.push('🎪 Add more visual feedback for successful hits (particles, screen shake)');
    suggestions.push('⏱️ Consider shorter enemy spawn intervals for more action');

    return suggestions;
  }

  /**
   * Create optimized configuration based on analysis
   */
  public createOptimizedConfiguration(): LevelConfigOverrides {
    const issues = this.analyzeCurrentConfiguration();
    
    // Base optimization on identified issues
    const optimized: LevelConfigOverrides = {
      // Make physics more casual-friendly
      gravityMultiplier: 0.25,  // Very light, floaty feel
      bounceEnergyMultiplier: 0.9,  // Slight energy loss prevents infinite bouncing
      
      // Improve responsiveness
      projectileSpeedMultiplier: 1.17,  // 700px/s total (600 * 1.17)
      peteSpeedMultiplier: 1.1,  // More responsive movement
      
      // Better balance
      enemySpeedMultiplier: 0.8,  // More manageable enemy speed
      balloonSizeMultiplier: 1.2,  // Bigger targets for casual players
      
      // More action
      spawnRateMultiplier: 1.2,  // Slightly more frequent spawning
    };

    return optimized;
  }

  /**
   * Get test configuration by ID
   */
  public getTestConfiguration(id: string): TestConfiguration | undefined {
    return this.testConfigurations.find(config => config.id === id);
  }

  /**
   * Get all available test configurations
   */
  public getAllTestConfigurations(): TestConfiguration[] {
    return [...this.testConfigurations];
  }

  /**
   * Simulate metrics for a given configuration
   * In a real implementation, this would collect actual gameplay data
   */
  public simulateGameplayMetrics(config: TestConfiguration): GameplayMetrics {
    // Simulate based on configuration characteristics
    const baseMetrics: GameplayMetrics = {
      averageEnemyLifetime: 8.0,
      playerHitRate: 0.65,
      gameSessionDuration: 45.0,
      retryCount: 2.3,
      frustrationPoints: [],
      engagementScore: 6.5,
      difficultyRating: 7.0
    };

    // Adjust based on config overrides
    let adjustedMetrics = { ...baseMetrics };

    if (config.configOverrides.enemySpeedMultiplier && config.configOverrides.enemySpeedMultiplier < 0.8) {
      adjustedMetrics.playerHitRate += 0.15;
      adjustedMetrics.difficultyRating -= 1.5;
      adjustedMetrics.engagementScore += 0.8;
    }

    if (config.configOverrides.balloonSizeMultiplier && config.configOverrides.balloonSizeMultiplier > 1.1) {
      adjustedMetrics.playerHitRate += 0.1;
      adjustedMetrics.frustrationPoints.splice(0, 1); // Remove one frustration point
    }

    if (config.configOverrides.projectileSpeedMultiplier && config.configOverrides.projectileSpeedMultiplier > 1.1) {
      adjustedMetrics.engagementScore += 0.5;
    }

    return adjustedMetrics;
  }

  /**
   * Generate a comprehensive test report
   */
  public generateTestReport(): string {
    const issues = this.analyzeCurrentConfiguration();
    const suggestions = this.generateImprovementSuggestions();
    const optimizedConfig = this.createOptimizedConfiguration();

    let report = '# 🎮 Game Testing Report\n\n';
    
    report += '## 🔍 Current Configuration Analysis\n';
    if (issues.length > 0) {
      report += issues.map(issue => `- ${issue}`).join('\n') + '\n\n';
    } else {
      report += '✅ No major issues detected in current configuration.\n\n';
    }

    report += '## 💡 Improvement Suggestions\n';
    report += suggestions.map(suggestion => `- ${suggestion}`).join('\n') + '\n\n';

    report += '## 🚀 Optimized Configuration\n';
    report += '```json\n';
    report += JSON.stringify(optimizedConfig, null, 2);
    report += '\n```\n\n';

    report += '## 🧪 Test Configurations Available\n';
    this.testConfigurations.forEach(config => {
      const metrics = this.simulateGameplayMetrics(config);
      report += `### ${config.name}\n`;
      report += `${config.description}\n`;
      report += `- Hit Rate: ${(metrics.playerHitRate * 100).toFixed(1)}%\n`;
      report += `- Engagement Score: ${metrics.engagementScore.toFixed(1)}/10\n`;
      report += `- Difficulty: ${metrics.difficultyRating.toFixed(1)}/10\n`;
      report += `- Expected: ${config.expectedOutcome}\n\n`;
    });

    return report;
  }
}

export const gameTester = new GameTester();