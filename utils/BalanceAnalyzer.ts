/**
 * Balance Analyzer - Persona-specific balance reporting for manual level tuning
 * 
 * This system analyzes AI gameplay data across different personas to provide
 * actionable insights for manual level balancing decisions.
 */

import { AIMetrics, BalanceMetrics, AI_PRESETS } from '@/pete_ai';
import { aiAnalytics } from './AIAnalytics';
import { headlessGameSimulator, SimulationResult } from './HeadlessGameSimulator';

// Persona definitions for balance analysis
export interface BalancePersona {
  id: string;
  name: string;
  description: string;
  targetMetrics: PersonaTargets;
  aiPreset: keyof typeof AI_PRESETS;
}

export interface PersonaTargets {
  completionRate: { min: number; max: number };
  averageAttempts: { min: number; max: number };
  sessionDuration: { min: number; max: number }; // in seconds
  satisfactionScore: { min: number; max: number };
  cognitiveLoad: { min: number; max: number };
  flowStateScore: { min: number; max: number };
}

export interface PersonaBalanceReport {
  persona: BalancePersona;
  levelId: number;
  levelName: string;
  testResults: {
    completionRate: number;
    averageAttempts: number;
    sessionDuration: number;
    balanceMetrics: BalanceMetrics;
  };
  balanceScore: 'healthy' | 'too_easy' | 'too_hard' | 'needs_review' | 'broken';
  healthScore: number; // 0-1, where 1 = perfect balance
  specificIssues: string[];
  recommendations: string[];
  confidence: number; // 0-1, based on sample size
}

export interface LevelBalanceOverview {
  levelId: number;
  levelName: string;
  overallHealthScore: number;
  personaReports: PersonaBalanceReport[];
  criticalIssues: string[];
  priorityRecommendations: string[];
  difficultySpike: boolean;
}

// Define the 5 key personas for balance testing
export const BALANCE_PERSONAS: BalancePersona[] = [
  {
    id: 'nervous_newbie',
    name: 'Nervous Newbie',
    description: 'First-time players, slow reactions, needs forgiving difficulty',
    aiPreset: 'defensive',
    targetMetrics: {
      completionRate: { min: 0.6, max: 0.8 },
      averageAttempts: { min: 2, max: 4 },
      sessionDuration: { min: 60, max: 180 },
      satisfactionScore: { min: 0.4, max: 0.7 },
      cognitiveLoad: { min: 1, max: 3 },
      flowStateScore: { min: 0.3, max: 0.6 },
    },
  },
  {
    id: 'casual_commuter',
    name: 'Casual Commuter',
    description: 'Casual players, average skills, plays in short bursts',
    aiPreset: 'stationary',
    targetMetrics: {
      completionRate: { min: 0.75, max: 0.9 },
      averageAttempts: { min: 1, max: 3 },
      sessionDuration: { min: 90, max: 300 },
      satisfactionScore: { min: 0.5, max: 0.8 },
      cognitiveLoad: { min: 2, max: 4 },
      flowStateScore: { min: 0.4, max: 0.7 },
    },
  },
  {
    id: 'focused_gamer',
    name: 'Focused Gamer',
    description: 'Regular gamers, good skills, seeks challenge and progression',
    aiPreset: 'aggressive',
    targetMetrics: {
      completionRate: { min: 0.8, max: 0.95 },
      averageAttempts: { min: 1, max: 2 },
      sessionDuration: { min: 180, max: 600 },
      satisfactionScore: { min: 0.6, max: 0.9 },
      cognitiveLoad: { min: 3, max: 6 },
      flowStateScore: { min: 0.6, max: 0.9 },
    },
  },
  {
    id: 'twitchy_speedrunner',
    name: 'Twitchy Speedrunner',
    description: 'Expert players, lightning reflexes, seeks optimization',
    aiPreset: 'chaotic',
    targetMetrics: {
      completionRate: { min: 0.9, max: 1.0 },
      averageAttempts: { min: 1, max: 1 },
      sessionDuration: { min: 30, max: 180 },
      satisfactionScore: { min: 0.7, max: 1.0 },
      cognitiveLoad: { min: 4, max: 8 },
      flowStateScore: { min: 0.7, max: 1.0 },
    },
  },
  {
    id: 'methodical_strategist',
    name: 'Methodical Strategist',
    description: 'Thoughtful players, high precision, values mastery',
    aiPreset: 'defensive',
    targetMetrics: {
      completionRate: { min: 0.85, max: 1.0 },
      averageAttempts: { min: 1, max: 2 },
      sessionDuration: { min: 300, max: 900 },
      satisfactionScore: { min: 0.65, max: 0.95 },
      cognitiveLoad: { min: 2, max: 5 },
      flowStateScore: { min: 0.5, max: 0.9 },
    },
  },
];

export class BalanceAnalyzer {
  private static instance: BalanceAnalyzer;
  private testResults: Map<string, AIMetrics[]> = new Map();
  
  private constructor() {}
  
  public static getInstance(): BalanceAnalyzer {
    if (!BalanceAnalyzer.instance) {
      BalanceAnalyzer.instance = new BalanceAnalyzer();
    }
    return BalanceAnalyzer.instance;
  }

  /**
   * Run comprehensive balance testing for a specific level across all personas
   */
  public async runLevelBalanceTest(
    levelId: number,
    levelName: string,
    testCount: number = 20
  ): Promise<LevelBalanceOverview> {
    console.log(`🎯 Running balance test for Level ${levelId} with ${testCount} tests per persona`);
    
    const personaReports: PersonaBalanceReport[] = [];
    
    // Test each persona
    for (const persona of BALANCE_PERSONAS) {
      const report = await this.testPersonaOnLevel(persona, levelId, levelName, testCount);
      personaReports.push(report);
    }
    
    // Calculate overall health and identify issues
    const overallHealthScore = this.calculateOverallHealth(personaReports);
    const criticalIssues = this.identifyCriticalIssues(personaReports);
    const priorityRecommendations = this.generatePriorityRecommendations(personaReports);
    const difficultySpike = this.detectDifficultySpike(levelId, personaReports);
    
    return {
      levelId,
      levelName,
      overallHealthScore,
      personaReports,
      criticalIssues,
      priorityRecommendations,
      difficultySpike,
    };
  }

  /**
   * Test a specific persona on a level multiple times
   */
  private async testPersonaOnLevel(
    persona: BalancePersona,
    levelId: number,
    levelName: string,
    testCount: number
  ): Promise<PersonaBalanceReport> {
    const results: AIMetrics[] = [];
    
    console.log(`🧪 Testing ${persona.name} on Level ${levelId} (${testCount} runs)`);
    
    // Run multiple tests with this persona's AI preset
    for (let i = 0; i < testCount; i++) {
      console.log(`🧪 Running test ${i + 1}/${testCount} for ${persona.name}`);
      
      try {
        // Use REAL AI testing instead of fake simulation
        const metrics = await this.runRealPersonaTest(persona, levelId);
        results.push(metrics);
        
        // Log progress for long test runs
        if (i % 5 === 0 || i === testCount - 1) {
          console.log(`🧪 Progress: ${i + 1}/${testCount} tests completed for ${persona.name}`);
        }
      } catch (error) {
        console.error(`🧪 Test failed for ${persona.name}, run ${i + 1}:`, error);
        // Continue with other tests even if one fails
      }
    }
    
    // Store results for future analysis
    const key = `${persona.id}_${levelId}`;
    this.testResults.set(key, results);
    
    // Analyze results
    const testResults = this.analyzePersonaResults(results);
    const balanceScore = this.calculateBalanceScore(testResults, persona.targetMetrics);
    const healthScore = this.calculateHealthScore(testResults, persona.targetMetrics);
    const issues = this.identifyPersonaIssues(testResults, persona.targetMetrics);
    const recommendations = this.generatePersonaRecommendations(issues, testResults, persona);
    const confidence = Math.min(1, testCount / 20); // Full confidence at 20+ tests
    
    return {
      persona,
      levelId,
      levelName,
      testResults,
      balanceScore,
      healthScore,
      specificIssues: issues,
      recommendations,
      confidence,
    };
  }

  /**
   * Run REAL AI testing for a persona using HeadlessGameSimulator
   */
  private async runRealPersonaTest(persona: BalancePersona, levelId: number): Promise<AIMetrics> {
    try {
      // Get AI configuration for this persona
      const aiConfig = AI_PRESETS[persona.aiPreset];
      
      console.log(`🤖 Running real AI test: ${persona.name} (${persona.aiPreset}) on Level ${levelId}`);
      
      // Run actual game simulation with real AI
      const simulationResult = await headlessGameSimulator.runAISession(
        levelId,
        aiConfig,
        180000 // 3 minute timeout
      );
      
      if (!simulationResult.success) {
        console.error(`🤖 Simulation failed for ${persona.name}:`, simulationResult.error);
        throw new Error(`Simulation failed: ${simulationResult.error}`);
      }
      
      console.log(`🤖 Real AI test completed for ${persona.name}:`, {
        score: simulationResult.metrics.score,
        accuracy: simulationResult.metrics.accuracy.toFixed(1),
        duration: simulationResult.duration,
        completed: simulationResult.metrics.levelCompleted
      });
      
      return simulationResult.metrics;
      
    } catch (error) {
      console.error(`🤖 Real AI test failed for ${persona.name}:`, error);
      
      // Return empty metrics instead of fake data when real test fails
      return this.createEmptyAIMetrics(levelId);
    }
  }

  /**
   * Create empty AI metrics for failed tests
   */
  private createEmptyAIMetrics(levelId: number): AIMetrics {
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
      level: levelId,
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
      balanceMetrics: this.createEmptyBalanceMetrics()
    };
  }

  /**
   * Create empty balance metrics
   */
  private createEmptyBalanceMetrics(): BalanceMetrics {
    return {
      sweetSpotRatio: {
        almostWinRate: 0,
        clutchWinRate: 0,
        dominantWinRate: 0,
      },
      emotionalPulse: {
        tensionBuildupRate: 0,
        reliefMomentCount: 0,
        reliefMomentDuration: 0,
        panicEventCount: 0,
        peakTensionMoments: 0,
      },
      cognitiveLoad: {
        averageSimultaneousThreats: 0,
        peakSimultaneousThreats: 0,
        decisionComplexityScore: 0,
        reactionTimeUnderPressure: 0,
        overwhelmEvents: 0,
      },
      agencyBalance: {
        skillBasedFailureRate: 0,
        randomFailureRate: 0,
        playerInfluenceScore: 0,
        predictabilityIndex: 0,
        comebackPotential: 0,
      },
      learningCurve: {
        improvementRate: 0,
        plateauDetection: false,
        skillBreakthroughEvents: 0,
        retentionBetweenSessions: 0,
        masteryIndicators: 0,
      },
      flowState: {
        consistentPerformanceWindows: 0,
        distractionEvents: 0,
        immersionScore: 0,
        timePerceptionDistortion: 0,
        effortlessExecutionPeriods: 0,
      },
      engagementQuality: {
        skillExpressionOpportunities: 0,
        strategicDepth: 0,
        momentToMomentEngagement: 0,
        replayMotivation: 0,
        satisfactionScore: 0,
      },
    };
  }

  /**
   * Add singleton reset method for testing
   */
  public static resetInstance(): void {
    BalanceAnalyzer.instance = new BalanceAnalyzer();
  }

  private analyzePersonaResults(results: AIMetrics[]) {
    const completions = results.filter(r => r.levelCompleted).length;
    const completionRate = completions / results.length;
    const averageAttempts = 1 / Math.max(0.1, completionRate); // Simplified calculation
    const avgSessionDuration = results.reduce((sum, r) => sum + r.survivalTime, 0) / results.length / 1000;
    
    // Aggregate balance metrics
    const avgBalanceMetrics: BalanceMetrics = {
      sweetSpotRatio: {
        almostWinRate: this.avgMetric(results, r => r.balanceMetrics.sweetSpotRatio.almostWinRate),
        clutchWinRate: this.avgMetric(results, r => r.balanceMetrics.sweetSpotRatio.clutchWinRate),
        dominantWinRate: this.avgMetric(results, r => r.balanceMetrics.sweetSpotRatio.dominantWinRate),
      },
      emotionalPulse: {
        tensionBuildupRate: this.avgMetric(results, r => r.balanceMetrics.emotionalPulse.tensionBuildupRate),
        reliefMomentCount: this.avgMetric(results, r => r.balanceMetrics.emotionalPulse.reliefMomentCount),
        reliefMomentDuration: this.avgMetric(results, r => r.balanceMetrics.emotionalPulse.reliefMomentDuration),
        panicEventCount: this.avgMetric(results, r => r.balanceMetrics.emotionalPulse.panicEventCount),
        peakTensionMoments: this.avgMetric(results, r => r.balanceMetrics.emotionalPulse.peakTensionMoments),
      },
      cognitiveLoad: {
        averageSimultaneousThreats: this.avgMetric(results, r => r.balanceMetrics.cognitiveLoad.averageSimultaneousThreats),
        peakSimultaneousThreats: this.avgMetric(results, r => r.balanceMetrics.cognitiveLoad.peakSimultaneousThreats),
        decisionComplexityScore: this.avgMetric(results, r => r.balanceMetrics.cognitiveLoad.decisionComplexityScore),
        reactionTimeUnderPressure: this.avgMetric(results, r => r.balanceMetrics.cognitiveLoad.reactionTimeUnderPressure),
        overwhelmEvents: this.avgMetric(results, r => r.balanceMetrics.cognitiveLoad.overwhelmEvents),
      },
      agencyBalance: {
        skillBasedFailureRate: this.avgMetric(results, r => r.balanceMetrics.agencyBalance.skillBasedFailureRate),
        randomFailureRate: this.avgMetric(results, r => r.balanceMetrics.agencyBalance.randomFailureRate),
        playerInfluenceScore: this.avgMetric(results, r => r.balanceMetrics.agencyBalance.playerInfluenceScore),
        predictabilityIndex: this.avgMetric(results, r => r.balanceMetrics.agencyBalance.predictabilityIndex),
        comebackPotential: this.avgMetric(results, r => r.balanceMetrics.agencyBalance.comebackPotential),
      },
      learningCurve: {
        improvementRate: this.avgMetric(results, r => r.balanceMetrics.learningCurve.improvementRate),
        plateauDetection: results.filter(r => r.balanceMetrics.learningCurve.plateauDetection).length > results.length / 2,
        skillBreakthroughEvents: this.avgMetric(results, r => r.balanceMetrics.learningCurve.skillBreakthroughEvents),
        retentionBetweenSessions: this.avgMetric(results, r => r.balanceMetrics.learningCurve.retentionBetweenSessions),
        masteryIndicators: this.avgMetric(results, r => r.balanceMetrics.learningCurve.masteryIndicators),
      },
      flowState: {
        consistentPerformanceWindows: this.avgMetric(results, r => r.balanceMetrics.flowState.consistentPerformanceWindows),
        distractionEvents: this.avgMetric(results, r => r.balanceMetrics.flowState.distractionEvents),
        immersionScore: this.avgMetric(results, r => r.balanceMetrics.flowState.immersionScore),
        timePerceptionDistortion: this.avgMetric(results, r => r.balanceMetrics.flowState.timePerceptionDistortion),
        effortlessExecutionPeriods: this.avgMetric(results, r => r.balanceMetrics.flowState.effortlessExecutionPeriods),
      },
      engagementQuality: {
        skillExpressionOpportunities: this.avgMetric(results, r => r.balanceMetrics.engagementQuality.skillExpressionOpportunities),
        strategicDepth: this.avgMetric(results, r => r.balanceMetrics.engagementQuality.strategicDepth),
        momentToMomentEngagement: this.avgMetric(results, r => r.balanceMetrics.engagementQuality.momentToMomentEngagement),
        replayMotivation: this.avgMetric(results, r => r.balanceMetrics.engagementQuality.replayMotivation),
        satisfactionScore: this.avgMetric(results, r => r.balanceMetrics.engagementQuality.satisfactionScore),
      },
    };

    return {
      completionRate,
      averageAttempts,
      sessionDuration: avgSessionDuration,
      balanceMetrics: avgBalanceMetrics,
    };
  }

  private avgMetric(results: AIMetrics[], extractor: (r: AIMetrics) => number): number {
    return results.reduce((sum, r) => sum + extractor(r), 0) / results.length;
  }

  private calculateBalanceScore(
    testResults: any,
    targets: PersonaTargets
  ): 'healthy' | 'too_easy' | 'too_hard' | 'needs_review' | 'broken' {
    const completion = testResults.completionRate;
    const attempts = testResults.averageAttempts;
    const satisfaction = testResults.balanceMetrics.engagementQuality.satisfactionScore;
    
    // Check for broken state
    if (completion < 0.1 || attempts > 10 || satisfaction < 0.1) {
      return 'broken';
    }
    
    // Check if too easy
    if (completion > targets.completionRate.max && attempts < targets.averageAttempts.min) {
      return 'too_easy';
    }
    
    // Check if too hard
    if (completion < targets.completionRate.min || attempts > targets.averageAttempts.max) {
      return 'too_hard';
    }
    
    // Check if in healthy range
    if (completion >= targets.completionRate.min && 
        completion <= targets.completionRate.max &&
        attempts >= targets.averageAttempts.min && 
        attempts <= targets.averageAttempts.max) {
      return 'healthy';
    }
    
    return 'needs_review';
  }

  private calculateHealthScore(testResults: any, targets: PersonaTargets): number {
    let score = 0;
    let checks = 0;
    
    // Completion rate health
    if (testResults.completionRate >= targets.completionRate.min && 
        testResults.completionRate <= targets.completionRate.max) {
      score += 0.3;
    }
    checks++;
    
    // Attempts health
    if (testResults.averageAttempts >= targets.averageAttempts.min && 
        testResults.averageAttempts <= targets.averageAttempts.max) {
      score += 0.2;
    }
    checks++;
    
    // Satisfaction health
    const satisfaction = testResults.balanceMetrics.engagementQuality.satisfactionScore;
    if (satisfaction >= targets.satisfactionScore.min && satisfaction <= targets.satisfactionScore.max) {
      score += 0.2;
    }
    checks++;
    
    // Cognitive load health
    const cogLoad = testResults.balanceMetrics.cognitiveLoad.averageSimultaneousThreats;
    if (cogLoad >= targets.cognitiveLoad.min && cogLoad <= targets.cognitiveLoad.max) {
      score += 0.15;
    }
    checks++;
    
    // Flow state health
    const flow = testResults.balanceMetrics.flowState.immersionScore;
    if (flow >= targets.flowStateScore.min && flow <= targets.flowStateScore.max) {
      score += 0.15;
    }
    checks++;
    
    return score;
  }

  private identifyPersonaIssues(testResults: any, targets: PersonaTargets): string[] {
    const issues: string[] = [];
    
    if (testResults.completionRate < targets.completionRate.min) {
      issues.push(`Completion rate too low (${(testResults.completionRate * 100).toFixed(1)}%)`);
    }
    if (testResults.completionRate > targets.completionRate.max) {
      issues.push(`Completion rate too high (${(testResults.completionRate * 100).toFixed(1)}%)`);
    }
    if (testResults.averageAttempts > targets.averageAttempts.max) {
      issues.push(`Too many attempts required (${testResults.averageAttempts.toFixed(1)})`);
    }
    
    const cogLoad = testResults.balanceMetrics.cognitiveLoad.averageSimultaneousThreats;
    if (cogLoad > targets.cognitiveLoad.max) {
      issues.push(`Cognitive overload (${cogLoad.toFixed(1)} simultaneous threats)`);
    }
    
    const satisfaction = testResults.balanceMetrics.engagementQuality.satisfactionScore;
    if (satisfaction < targets.satisfactionScore.min) {
      issues.push(`Low satisfaction score (${(satisfaction * 100).toFixed(1)}%)`);
    }
    
    return issues;
  }

  private generatePersonaRecommendations(
    issues: string[],
    testResults: any,
    persona: BalancePersona
  ): string[] {
    const recommendations: string[] = [];
    
    if (testResults.completionRate < persona.targetMetrics.completionRate.min) {
      recommendations.push('Reduce enemy speed by 10-15%');
      recommendations.push('Decrease enemy spawn rate');
      recommendations.push('Add more relief periods between waves');
    }
    
    if (testResults.completionRate > persona.targetMetrics.completionRate.max) {
      recommendations.push('Increase enemy count by 1-2');
      recommendations.push('Increase enemy speed by 10%');
      recommendations.push('Reduce projectile size slightly');
    }
    
    const cogLoad = testResults.balanceMetrics.cognitiveLoad.averageSimultaneousThreats;
    if (cogLoad > persona.targetMetrics.cognitiveLoad.max) {
      recommendations.push('Limit simultaneous enemies to maximum of 4');
      recommendations.push('Increase spacing between enemy spawns');
    }
    
    return recommendations;
  }

  private calculateOverallHealth(personaReports: PersonaBalanceReport[]): number {
    return personaReports.reduce((sum, report) => sum + report.healthScore, 0) / personaReports.length;
  }

  private identifyCriticalIssues(personaReports: PersonaBalanceReport[]): string[] {
    const issues: string[] = [];
    
    const brokenCount = personaReports.filter(r => r.balanceScore === 'broken').length;
    if (brokenCount > 0) {
      issues.push(`${brokenCount} personas cannot complete level (BROKEN)`);
    }
    
    const tooHardCount = personaReports.filter(r => r.balanceScore === 'too_hard').length;
    if (tooHardCount >= 3) {
      issues.push('Level too difficult for majority of players');
    }
    
    const tooEasyCount = personaReports.filter(r => r.balanceScore === 'too_easy').length;
    if (tooEasyCount >= 3) {
      issues.push('Level too easy for majority of players');
    }
    
    return issues;
  }

  private generatePriorityRecommendations(personaReports: PersonaBalanceReport[]): string[] {
    const recommendations: string[] = [];
    const allRecommendations = personaReports.flatMap(r => r.recommendations);
    
    // Count frequency of recommendations
    const recCounts = new Map<string, number>();
    allRecommendations.forEach(rec => {
      recCounts.set(rec, (recCounts.get(rec) || 0) + 1);
    });
    
    // Sort by frequency and return top recommendations
    return Array.from(recCounts.entries())
      .filter(([_, count]) => count >= 2) // Recommended by 2+ personas
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 5)
      .map(([rec, _]) => rec);
  }

  private detectDifficultySpike(levelId: number, personaReports: PersonaBalanceReport[]): boolean {
    // Simplified spike detection - in reality, you'd compare with previous level
    const avgHealthScore = this.calculateOverallHealth(personaReports);
    return avgHealthScore < 0.4; // Arbitrary threshold for demo
  }

  /**
   * Export balance data for external analysis
   */
  public exportBalanceData(levelId?: number): any {
    const data = {
      timestamp: Date.now(),
      testResults: Object.fromEntries(this.testResults),
      personas: BALANCE_PERSONAS,
    };
    
    if (levelId) {
      const filteredResults = new Map();
      for (const [key, value] of this.testResults) {
        if (key.includes(`_${levelId}`)) {
          filteredResults.set(key, value);
        }
      }
      data.testResults = Object.fromEntries(filteredResults);
    }
    
    return data;
  }
}

// Export singleton instance
export const balanceAnalyzer = BalanceAnalyzer.getInstance();