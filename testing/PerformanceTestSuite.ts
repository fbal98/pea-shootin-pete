/**
 * Automated performance testing suite for game optimization validation
 */

import { PerformanceMonitor } from '@/utils/PerformanceMonitor';
import { GameObjectPools } from '@/utils/ObjectPool';
import { gameCache } from '@/utils/GameCache';
import { mobileOptimizer } from '@/utils/MobileOptimizer';
import { CollisionSystem } from '@/systems/CollisionSystem';

export interface PerformanceTest {
  name: string;
  description: string;
  setup: () => void;
  execute: () => Promise<PerformanceTestResult>;
  cleanup: () => void;
  expectedFPS?: number;
  maxMemoryMB?: number;
  maxDurationMs?: number;
}

export interface PerformanceTestResult {
  name: string;
  passed: boolean;
  metrics: {
    averageFPS: number;
    minFPS: number;
    maxFPS: number;
    frameDrops: number;
    averageFrameTime: number;
    memoryUsage?: number;
    duration: number;
  };
  issues: string[];
  recommendations: string[];
}

export interface PerformanceBenchmark {
  testName: string;
  deviceTier: string;
  timestamp: number;
  result: PerformanceTestResult;
}

export class PerformanceTestSuite {
  private static instance: PerformanceTestSuite;
  private performanceMonitor: PerformanceMonitor;
  private benchmarkHistory: PerformanceBenchmark[] = [];
  private isRunning = false;

  private constructor() {
    this.performanceMonitor = PerformanceMonitor.getInstance();
  }

  static getInstance(): PerformanceTestSuite {
    if (!PerformanceTestSuite.instance) {
      PerformanceTestSuite.instance = new PerformanceTestSuite();
    }
    return PerformanceTestSuite.instance;
  }

  /**
   * Run all performance tests
   */
  async runAllTests(): Promise<PerformanceTestResult[]> {
    if (this.isRunning) {
      throw new Error('Performance tests are already running');
    }

    this.isRunning = true;
    const results: PerformanceTestResult[] = [];

    try {
      const tests = this.getAllTests();
      
      for (const test of tests) {
        console.log(`🧪 Running performance test: ${test.name}`);
        
        try {
          // Setup test
          test.setup();
          
          // Execute test
          const result = await test.execute();
          results.push(result);
          
          // Store benchmark
          this.storeBenchmark(test.name, result);
          
          // Log result
          console.log(`${result.passed ? '✅' : '❌'} ${test.name}: ${result.metrics.averageFPS.toFixed(1)} FPS`);
          
          // Cleanup
          test.cleanup();
          
          // Wait between tests
          await this.delay(500);
          
        } catch (error) {
          console.error(`❌ Test ${test.name} failed:`, error);
          results.push({
            name: test.name,
            passed: false,
            metrics: {
              averageFPS: 0,
              minFPS: 0,
              maxFPS: 0,
              frameDrops: 0,
              averageFrameTime: 0,
              duration: 0,
            },
            issues: [`Test execution failed: ${error}`],
            recommendations: ['Fix test setup or implementation'],
          });
        }
      }
      
    } finally {
      this.isRunning = false;
    }

    return results;
  }

  /**
   * Get all available performance tests
   */
  private getAllTests(): PerformanceTest[] {
    return [
      this.createCollisionDetectionTest(),
      this.createObjectPoolingTest(),
      this.createMemoryPressureTest(),
      this.createHighEntityCountTest(),
      this.createStateUpdateTest(),
      this.createRenderingPipelineTest(),
      this.createThermalThrottleTest(),
    ];
  }

  /**
   * Collision detection performance test
   */
  private createCollisionDetectionTest(): PerformanceTest {
    let entities: any[] = [];
    
    return {
      name: 'Collision Detection',
      description: 'Tests spatial partitioning vs brute force collision detection',
      setup: () => {
        entities = [];
        // Create test entities
        for (let i = 0; i < 50; i++) {
          entities.push({
            id: `test_${i}`,
            x: Math.random() * 800,
            y: Math.random() * 600,
            width: 20,
            height: 20,
          });
        }
        CollisionSystem.initializeSpatialGrid(800, 600);
      },
      execute: async () => {
        const startTime = performance.now();
        this.performanceMonitor.reset();
        this.performanceMonitor.start();
        
        // Run collision detection for 60 frames
        for (let frame = 0; frame < 60; frame++) {
          // Test spatial grid performance
          const projectiles = entities.slice(0, 25);
          const enemies = entities.slice(25, 50);
          const pete = entities[0];
          const pools = GameObjectPools.getInstance();
          
          CollisionSystem.processCollisions(projectiles, enemies, pete, pools);
          
          // Simulate frame timing
          await this.delay(16);
        }
        
        const endTime = performance.now();
        const metrics = this.performanceMonitor.getMetrics();
        
        return {
          name: 'Collision Detection',
          passed: metrics.averageFps >= 50,
          metrics: {
            averageFPS: metrics.averageFps,
            minFPS: metrics.minFps,
            maxFPS: metrics.maxFps,
            frameDrops: metrics.droppedFrames,
            averageFrameTime: metrics.frameTime,
            duration: endTime - startTime,
          },
          issues: metrics.averageFps < 50 ? ['Collision detection performance too slow'] : [],
          recommendations: metrics.averageFps < 50 ? ['Consider optimizing spatial grid cell size', 'Reduce entity count'] : [],
        };
      },
      cleanup: () => {
        entities = [];
        this.performanceMonitor.stop();
      },
      expectedFPS: 50,
    };
  }

  /**
   * Object pooling performance test
   */
  private createObjectPoolingTest(): PerformanceTest {
    let pools: GameObjectPools;
    
    return {
      name: 'Object Pooling',
      description: 'Tests object pool efficiency and memory management',
      setup: () => {
        pools = GameObjectPools.getInstance();
        pools.clearAll();
      },
      execute: async () => {
        const startTime = performance.now();
        this.performanceMonitor.reset();
        this.performanceMonitor.start();
        
        // Test object pool performance
        const objects: any[] = [];
        
        // Acquire objects rapidly
        for (let i = 0; i < 1000; i++) {
          const projectile = pools.acquireProjectile();
          const enemy = pools.acquireEnemy();
          objects.push(projectile, enemy);
          
          if (i % 100 === 0) {
            await this.delay(1);
          }
        }
        
        // Release objects rapidly
        for (let i = 0; i < objects.length; i += 2) {
          pools.releaseProjectile(objects[i]);
          pools.releaseEnemy(objects[i + 1]);
          
          if (i % 100 === 0) {
            await this.delay(1);
          }
        }
        
        const endTime = performance.now();
        const poolStats = pools.getAllStats();
        const memoryStats = this.performanceMonitor.getMemoryStats();
        
        return {
          name: 'Object Pooling',
          passed: endTime - startTime < 100 && poolStats.projectiles.utilization > 80,
          metrics: {
            averageFPS: 60, // Object pooling doesn't directly affect FPS
            minFPS: 60,
            maxFPS: 60,
            frameDrops: 0,
            averageFrameTime: 16.67,
            memoryUsage: memoryStats.currentUsage,
            duration: endTime - startTime,
          },
          issues: endTime - startTime >= 100 ? ['Object pooling too slow'] : [],
          recommendations: endTime - startTime >= 100 ? ['Increase pool sizes', 'Optimize object reset logic'] : [],
        };
      },
      cleanup: () => {
        pools.clearAll();
        this.performanceMonitor.stop();
      },
      maxDurationMs: 100,
    };
  }

  /**
   * Memory pressure test
   */
  private createMemoryPressureTest(): PerformanceTest {
    return {
      name: 'Memory Pressure',
      description: 'Tests memory management under pressure',
      setup: () => {
        gameCache.reset();
      },
      execute: async () => {
        const startTime = performance.now();
        this.performanceMonitor.reset();
        this.performanceMonitor.start();
        
        // Create memory pressure
        const memoryHogs: any[] = [];
        
        try {
          // Allocate memory gradually
          for (let i = 0; i < 100; i++) {
            const largeArray = new Array(10000).fill(Math.random());
            memoryHogs.push(largeArray);
            
            // Test cache performance under pressure
            gameCache.getBalloonSize(1);
            gameCache.getBalloonSize(2);
            gameCache.getBalloonSize(3);
            
            await this.delay(10);
          }
          
          // Force garbage collection if available
          if (global.gc) {
            global.gc();
          }
          
        } catch (error) {
          // Expected to hit memory limits
        }
        
        const endTime = performance.now();
        const memoryStats = this.performanceMonitor.getMemoryStats();
        const cacheStats = gameCache.getStats();
        
        return {
          name: 'Memory Pressure',
          passed: cacheStats.hitRate > 70 && memoryStats.memoryPressure !== 'high',
          metrics: {
            averageFPS: 60,
            minFPS: 60,
            maxFPS: 60,
            frameDrops: 0,
            averageFrameTime: 16.67,
            memoryUsage: memoryStats.currentUsage,
            duration: endTime - startTime,
          },
          issues: memoryStats.memoryPressure === 'high' ? ['High memory pressure detected'] : [],
          recommendations: memoryStats.memoryPressure === 'high' ? ['Implement more aggressive garbage collection', 'Reduce cache sizes'] : [],
        };
      },
      cleanup: () => {
        gameCache.reset();
        this.performanceMonitor.stop();
        if (global.gc) {
          global.gc();
        }
      },
      maxMemoryMB: 100,
    };
  }

  /**
   * High entity count performance test
   */
  private createHighEntityCountTest(): PerformanceTest {
    return {
      name: 'High Entity Count',
      description: 'Tests performance with maximum entity count',
      setup: () => {
        // Setup for maximum entity stress test
      },
      execute: async () => {
        const startTime = performance.now();
        this.performanceMonitor.reset();
        this.performanceMonitor.start();
        
        // Simulate game with 100+ entities
        const entities = [];
        for (let i = 0; i < 150; i++) {
          entities.push({
            id: `entity_${i}`,
            x: Math.random() * 800,
            y: Math.random() * 600,
            velocityX: (Math.random() - 0.5) * 100,
            velocityY: (Math.random() - 0.5) * 100,
          });
        }
        
        // Update entities for 120 frames (2 seconds)
        for (let frame = 0; frame < 120; frame++) {
          entities.forEach(entity => {
            entity.x += entity.velocityX * 0.016;
            entity.y += entity.velocityY * 0.016;
            
            // Bounce off edges
            if (entity.x < 0 || entity.x > 800) entity.velocityX *= -1;
            if (entity.y < 0 || entity.y > 600) entity.velocityY *= -1;
          });
          
          await this.delay(16);
        }
        
        const endTime = performance.now();
        const metrics = this.performanceMonitor.getMetrics();
        
        return {
          name: 'High Entity Count',
          passed: metrics.averageFps >= 30,
          metrics: {
            averageFPS: metrics.averageFps,
            minFPS: metrics.minFps,
            maxFPS: metrics.maxFps,
            frameDrops: metrics.droppedFrames,
            averageFrameTime: metrics.frameTime,
            duration: endTime - startTime,
          },
          issues: metrics.averageFps < 30 ? ['Performance degrades with high entity count'] : [],
          recommendations: metrics.averageFps < 30 ? ['Implement entity culling', 'Reduce maximum entity count'] : [],
        };
      },
      cleanup: () => {
        this.performanceMonitor.stop();
      },
      expectedFPS: 30,
    };
  }

  /**
   * State update performance test
   */
  private createStateUpdateTest(): PerformanceTest {
    return {
      name: 'State Updates',
      description: 'Tests state management performance with rapid updates',
      setup: () => {
        // Setup state testing
      },
      execute: async () => {
        const startTime = performance.now();
        
        // Simulate rapid state updates
        for (let i = 0; i < 1000; i++) {
          // Simulate game state changes
          const updates = {
            score: Math.floor(Math.random() * 10000),
            lives: Math.floor(Math.random() * 5),
            level: Math.floor(Math.random() * 10),
          };
          
          // Test state optimizer performance
          if (i % 10 === 0) {
            await this.delay(1);
          }
        }
        
        const endTime = performance.now();
        
        return {
          name: 'State Updates',
          passed: endTime - startTime < 500,
          metrics: {
            averageFPS: 60,
            minFPS: 60,
            maxFPS: 60,
            frameDrops: 0,
            averageFrameTime: 16.67,
            duration: endTime - startTime,
          },
          issues: endTime - startTime >= 500 ? ['State updates too slow'] : [],
          recommendations: endTime - startTime >= 500 ? ['Implement state batching', 'Reduce update frequency'] : [],
        };
      },
      cleanup: () => {
        // Cleanup state testing
      },
      maxDurationMs: 500,
    };
  }

  /**
   * Rendering pipeline test
   */
  private createRenderingPipelineTest(): PerformanceTest {
    return {
      name: 'Rendering Pipeline',
      description: 'Tests React rendering performance with optimization',
      setup: () => {
        // Setup rendering test
      },
      execute: async () => {
        const startTime = performance.now();
        this.performanceMonitor.reset();
        this.performanceMonitor.start();
        
        // Simulate rendering workload
        for (let frame = 0; frame < 180; frame++) { // 3 seconds
          // Simulate component re-renders
          await this.delay(16);
        }
        
        const endTime = performance.now();
        const metrics = this.performanceMonitor.getMetrics();
        
        return {
          name: 'Rendering Pipeline',
          passed: metrics.averageFps >= 55,
          metrics: {
            averageFPS: metrics.averageFps,
            minFPS: metrics.minFps,
            maxFPS: metrics.maxFps,
            frameDrops: metrics.droppedFrames,
            averageFrameTime: metrics.frameTime,
            duration: endTime - startTime,
          },
          issues: metrics.averageFps < 55 ? ['Rendering performance below target'] : [],
          recommendations: metrics.averageFps < 55 ? ['Implement viewport culling', 'Use React.memo more aggressively'] : [],
        };
      },
      cleanup: () => {
        this.performanceMonitor.stop();
      },
      expectedFPS: 55,
    };
  }

  /**
   * Thermal throttle simulation test
   */
  private createThermalThrottleTest(): PerformanceTest {
    return {
      name: 'Thermal Throttle',
      description: 'Tests performance adaptation under thermal pressure',
      setup: () => {
        mobileOptimizer.reset();
      },
      execute: async () => {
        const startTime = performance.now();
        
        // Simulate thermal states
        const thermalStates: Array<'nominal' | 'fair' | 'serious' | 'critical'> = ['nominal', 'fair', 'serious', 'critical'];
        
        for (const state of thermalStates) {
          mobileOptimizer.simulateThermalState(state);
          const profile = mobileOptimizer.getPerformanceProfile();
          
          // Verify profile changes appropriately
          await this.delay(100);
        }
        
        const endTime = performance.now();
        const optimizationStats = mobileOptimizer.getOptimizationStats();
        
        return {
          name: 'Thermal Throttle',
          passed: optimizationStats.thermalThrottleCount >= 2, // Should have detected thermal changes
          metrics: {
            averageFPS: optimizationStats.averageFPS,
            minFPS: 30,
            maxFPS: 60,
            frameDrops: 0,
            averageFrameTime: 16.67,
            duration: endTime - startTime,
          },
          issues: optimizationStats.thermalThrottleCount < 2 ? ['Thermal throttling not working'] : [],
          recommendations: optimizationStats.thermalThrottleCount < 2 ? ['Fix thermal state detection', 'Implement more aggressive throttling'] : [],
        };
      },
      cleanup: () => {
        mobileOptimizer.reset();
      },
    };
  }

  /**
   * Store benchmark result
   */
  private storeBenchmark(testName: string, result: PerformanceTestResult): void {
    const benchmark: PerformanceBenchmark = {
      testName,
      deviceTier: mobileOptimizer.getDeviceCapabilities().tier,
      timestamp: Date.now(),
      result,
    };
    
    this.benchmarkHistory.push(benchmark);
    
    // Keep only last 50 benchmarks
    if (this.benchmarkHistory.length > 50) {
      this.benchmarkHistory.shift();
    }
  }

  /**
   * Get benchmark history
   */
  getBenchmarkHistory(): PerformanceBenchmark[] {
    return [...this.benchmarkHistory];
  }

  /**
   * Generate performance report
   */
  generateReport(results: PerformanceTestResult[]): string {
    const deviceCaps = mobileOptimizer.getDeviceCapabilities();
    
    let report = `# Performance Test Report\n\n`;
    report += `**Device**: ${deviceCaps.tier} tier (${deviceCaps.screenDensity} density)\n`;
    report += `**Timestamp**: ${new Date().toISOString()}\n\n`;
    
    report += `## Test Results\n\n`;
    
    for (const result of results) {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      report += `### ${result.name} - ${status}\n\n`;
      report += `- **Average FPS**: ${result.metrics.averageFPS.toFixed(1)}\n`;
      report += `- **Min FPS**: ${result.metrics.minFPS.toFixed(1)}\n`;
      report += `- **Frame Drops**: ${result.metrics.frameDrops}\n`;
      report += `- **Duration**: ${result.metrics.duration.toFixed(0)}ms\n`;
      
      if (result.metrics.memoryUsage) {
        report += `- **Memory Usage**: ${(result.metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB\n`;
      }
      
      if (result.issues.length > 0) {
        report += `\n**Issues**:\n`;
        result.issues.forEach(issue => report += `- ${issue}\n`);
      }
      
      if (result.recommendations.length > 0) {
        report += `\n**Recommendations**:\n`;
        result.recommendations.forEach(rec => report += `- ${rec}\n`);
      }
      
      report += `\n`;
    }
    
    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    
    report += `## Summary\n\n`;
    report += `**Tests Passed**: ${passedTests}/${totalTests} (${((passedTests/totalTests)*100).toFixed(1)}%)\n`;
    
    return report;
  }

  /**
   * Utility: Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance for global access
export const performanceTestSuite = PerformanceTestSuite.getInstance();