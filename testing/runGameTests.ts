#!/usr/bin/env ts-node
/**
 * Automated Game Testing Runner
 * Runs comprehensive analysis of game configuration and generates improvement recommendations
 */

import { gameTester, TestConfiguration } from './GameTester';
import {
  createLevelConfig,
  levelBalanceToConfigOverrides,
  LevelConfigOverrides,
} from '../constants/GameConfig';
import * as fs from 'fs';
import * as path from 'path';

interface TestSession {
  timestamp: string;
  testId: string;
  configUsed: LevelConfigOverrides;
  results: {
    funFactor: number;
    frustrationLevel: number;
    replayability: number;
    accessibility: number;
    overallScore: number;
  };
  recommendations: string[];
}

class GameTestRunner {
  private testSessions: TestSession[] = [];
  private outputDir: string;

  constructor() {
    this.outputDir = path.join(__dirname, 'results');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Run comprehensive game analysis
   */
  public async runCompleteAnalysis(): Promise<void> {
    console.log('🚀 Starting Comprehensive Game Analysis...\n');

    // 1. Analyze current configuration
    console.log('📊 Analyzing Current Configuration...');
    const currentIssues = gameTester.analyzeCurrentConfiguration();
    const suggestions = gameTester.generateImprovementSuggestions();

    console.log(`Found ${currentIssues.length} potential issues in current config`);
    console.log(`Generated ${suggestions.length} improvement suggestions\n`);

    // 2. Test each configuration variant
    console.log('🧪 Testing Configuration Variants...');
    const testConfigs = gameTester.getAllTestConfigurations();

    for (const config of testConfigs) {
      await this.runSingleTest(config);
    }

    // 3. Generate optimized configuration
    console.log('⚡ Generating Optimized Configuration...');
    const optimizedConfig = gameTester.createOptimizedConfiguration();
    await this.testOptimizedConfiguration(optimizedConfig);

    // 4. Generate comprehensive report
    console.log('📝 Generating Test Report...');
    const report = this.generateComprehensiveReport();

    // Save report to file
    const reportPath = path.join(this.outputDir, `game_analysis_${Date.now()}.md`);
    fs.writeFileSync(reportPath, report);

    console.log(`✅ Analysis complete! Report saved to: ${reportPath}`);

    // 5. Output immediate recommendations
    this.outputImmediateRecommendations();
  }

  /**
   * Run a single test configuration
   */
  private async runSingleTest(config: TestConfiguration): Promise<void> {
    console.log(`  Testing: ${config.name}...`);

    // Simulate gameplay with this configuration
    const metrics = gameTester.simulateGameplayMetrics(config);

    // Calculate scores based on metrics
    const results = {
      funFactor: this.calculateFunFactor(metrics, config),
      frustrationLevel: this.calculateFrustrationLevel(metrics),
      replayability: this.calculateReplayability(metrics),
      accessibility: this.calculateAccessibility(config),
      overallScore: 0,
    };

    results.overallScore =
      (results.funFactor +
        (10 - results.frustrationLevel) +
        results.replayability +
        results.accessibility) /
      4;

    // Generate specific recommendations for this config
    const recommendations = this.generateConfigRecommendations(config, metrics, results);

    const session: TestSession = {
      timestamp: new Date().toISOString(),
      testId: config.id,
      configUsed: config.configOverrides,
      results,
      recommendations,
    };

    this.testSessions.push(session);

    console.log(`    Fun Factor: ${results.funFactor.toFixed(1)}/10`);
    console.log(`    Overall Score: ${results.overallScore.toFixed(1)}/10`);
  }

  /**
   * Test the optimized configuration
   */
  private async testOptimizedConfiguration(config: LevelConfigOverrides): Promise<void> {
    const optimizedTestConfig: TestConfiguration = {
      id: 'optimized',
      name: 'AI-Optimized Configuration',
      description: 'Configuration optimized based on analysis of current issues',
      configOverrides: config,
      expectedOutcome: 'Maximum fun factor with minimal frustration',
    };

    await this.runSingleTest(optimizedTestConfig);
  }

  /**
   * Calculate fun factor based on metrics (0-10 scale)
   */
  private calculateFunFactor(metrics: any, config: TestConfiguration): number {
    let score = 5.0; // Base score

    // Higher hit rate = more fun
    score += (metrics.playerHitRate - 0.5) * 4;

    // Optimal session duration (30-60 seconds for hyper-casual)
    if (metrics.gameSessionDuration >= 30 && metrics.gameSessionDuration <= 60) {
      score += 1;
    } else if (metrics.gameSessionDuration < 20 || metrics.gameSessionDuration > 90) {
      score -= 1;
    }

    // Lower retry count = more accessible
    score += Math.max(0, 3 - metrics.retryCount) * 0.5;

    // Configuration-specific bonuses
    if (
      config.configOverrides.balloonSizeMultiplier &&
      config.configOverrides.balloonSizeMultiplier > 1.1
    ) {
      score += 0.5; // Bigger targets = more fun for casual
    }

    if (
      config.configOverrides.projectileSpeedMultiplier &&
      config.configOverrides.projectileSpeedMultiplier > 1.1
    ) {
      score += 0.3; // Faster projectiles = more responsive
    }

    return Math.min(10, Math.max(0, score));
  }

  /**
   * Calculate frustration level (0-10 scale, 0 = no frustration)
   */
  private calculateFrustrationLevel(metrics: any): number {
    let frustration = 0;

    // High retry count = frustrating
    frustration += Math.min(5, metrics.retryCount * 1.5);

    // Low hit rate = frustrating
    if (metrics.playerHitRate < 0.4) {
      frustration += 3;
    } else if (metrics.playerHitRate < 0.6) {
      frustration += 1;
    }

    // Too high difficulty = frustrating
    if (metrics.difficultyRating > 8) {
      frustration += 2;
    }

    // Add frustration points
    frustration += metrics.frustrationPoints.length * 0.5;

    return Math.min(10, frustration);
  }

  /**
   * Calculate replayability score (0-10 scale)
   */
  private calculateReplayability(metrics: any): number {
    let score = 5;

    // Good engagement = high replayability
    score += (metrics.engagementScore - 5) * 0.8;

    // Optimal difficulty = replayable
    if (metrics.difficultyRating >= 6 && metrics.difficultyRating <= 8) {
      score += 1;
    }

    // Quick sessions = more likely to replay
    if (metrics.gameSessionDuration <= 45) {
      score += 0.5;
    }

    return Math.min(10, Math.max(0, score));
  }

  /**
   * Calculate accessibility score (0-10 scale)
   */
  private calculateAccessibility(config: TestConfiguration): number {
    let score = 5;

    // Easier physics = more accessible
    if (
      config.configOverrides.gravityMultiplier &&
      config.configOverrides.gravityMultiplier < 0.4
    ) {
      score += 1;
    }

    // Slower enemies = more accessible
    if (
      config.configOverrides.enemySpeedMultiplier &&
      config.configOverrides.enemySpeedMultiplier < 0.9
    ) {
      score += 1;
    }

    // Bigger balloons = more accessible
    if (
      config.configOverrides.balloonSizeMultiplier &&
      config.configOverrides.balloonSizeMultiplier > 1.1
    ) {
      score += 1;
    }

    // Faster projectiles = more accessible (better feedback)
    if (
      config.configOverrides.projectileSpeedMultiplier &&
      config.configOverrides.projectileSpeedMultiplier > 1.1
    ) {
      score += 0.5;
    }

    return Math.min(10, score);
  }

  /**
   * Generate specific recommendations for a configuration
   */
  private generateConfigRecommendations(
    config: TestConfiguration,
    metrics: any,
    results: any
  ): string[] {
    const recommendations: string[] = [];

    if (results.funFactor < 6) {
      recommendations.push('🎯 Increase balloon size by 20% for easier targeting');
      recommendations.push('⚡ Increase projectile speed for better responsiveness');
    }

    if (results.frustrationLevel > 6) {
      recommendations.push('😌 Reduce enemy speed by 15-20% to lower frustration');
      recommendations.push('🎈 Make balloons slightly bigger to improve hit rate');
    }

    if (results.accessibility < 7) {
      recommendations.push('👶 Reduce gravity multiplier to 0.3 for more casual feel');
      recommendations.push('🎯 Increase target sizes for better accessibility');
    }

    if (metrics.playerHitRate < 0.6) {
      recommendations.push('🎯 Improve hit rate by slowing enemies or enlarging targets');
    }

    if (metrics.difficultyRating > 8) {
      recommendations.push('⚖️ Reduce overall difficulty for hyper-casual audience');
    }

    return recommendations;
  }

  /**
   * Generate comprehensive test report
   */
  private generateComprehensiveReport(): string {
    let report = gameTester.generateTestReport();

    report += '\n## 🧪 Test Session Results\n\n';

    // Sort sessions by overall score
    const sortedSessions = [...this.testSessions].sort(
      (a, b) => b.results.overallScore - a.results.overallScore
    );

    sortedSessions.forEach((session, index) => {
      report += `### ${index + 1}. ${session.testId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}\n`;
      report += `**Overall Score: ${session.results.overallScore.toFixed(1)}/10**\n\n`;
      report += `- Fun Factor: ${session.results.funFactor.toFixed(1)}/10\n`;
      report += `- Frustration Level: ${session.results.frustrationLevel.toFixed(1)}/10\n`;
      report += `- Replayability: ${session.results.replayability.toFixed(1)}/10\n`;
      report += `- Accessibility: ${session.results.accessibility.toFixed(1)}/10\n\n`;

      if (session.recommendations.length > 0) {
        report += '**Recommendations:**\n';
        session.recommendations.forEach(rec => {
          report += `- ${rec}\n`;
        });
      }

      report += '\n';
    });

    report += '\n## 🏆 Top Recommended Configuration\n\n';
    const bestConfig = sortedSessions[0];
    report += `**${bestConfig.testId}** scored highest with ${bestConfig.results.overallScore.toFixed(1)}/10\n\n`;

    report += '```json\n';
    report += JSON.stringify(bestConfig.configUsed, null, 2);
    report += '\n```\n\n';

    return report;
  }

  /**
   * Output immediate actionable recommendations
   */
  private outputImmediateRecommendations(): void {
    console.log('\n🎯 IMMEDIATE RECOMMENDATIONS:\n');

    const bestSession = this.testSessions.reduce((best, current) =>
      current.results.overallScore > best.results.overallScore ? current : best
    );

    console.log(`🏆 Best Configuration: ${bestSession.testId}`);
    console.log(`📊 Score: ${bestSession.results.overallScore.toFixed(1)}/10\n`);

    console.log('🚀 Apply these changes to improve fun factor:');
    console.log('```typescript');
    console.log('// In constants/GameConfig.ts, modify these values:');

    Object.entries(bestSession.configUsed).forEach(([key, value]) => {
      if (value !== undefined) {
        console.log(`${key}: ${value},`);
      }
    });

    console.log('```\n');

    console.log('🎯 Top 3 Actions:');
    bestSession.recommendations.slice(0, 3).forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });

    console.log("\n💡 This should improve the game's fun factor and reduce player frustration!");
  }
}

// Run the analysis if this script is executed directly
if (require.main === module) {
  const runner = new GameTestRunner();
  runner.runCompleteAnalysis().catch(console.error);
}

export { GameTestRunner };
