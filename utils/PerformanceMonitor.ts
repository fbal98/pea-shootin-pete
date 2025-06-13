/**
 * Performance monitoring utility for tracking FPS and game performance
 * Enhanced with memory management and performance optimization features
 */

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  totalFrames: number;
  droppedFrames: number;
  averageFps: number;
  minFps: number;
  maxFps: number;
  memoryUsage?: number;
  gcCollections?: number;
  memoryPressure?: 'low' | 'medium' | 'high';
  performanceLevel?: 'optimal' | 'degraded' | 'critical';
}

interface PerformanceConfig {
  sampleSize: number;
  warningThreshold: number;
  criticalThreshold: number;
  enableLogging: boolean;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private frameTimes: number[] = [];
  private lastFrameTime = 0;
  private totalFrames = 0;
  private droppedFrames = 0;
  private config: PerformanceConfig;
  private listeners: Array<(metrics: PerformanceMetrics) => void> = [];
  private isRunning = false;
  private lastNotificationTime = 0;
  private notificationThrottle = 250; // Throttle notifications to ~4 times per second
  
  // Enhanced memory tracking
  private lastMemoryUsage = 0;
  private memoryReadings: number[] = [];
  private gcCollections = 0;
  private lastGCCheck = 0;
  private memoryPressureLevel: 'low' | 'medium' | 'high' = 'low';
  
  // Performance level tracking
  private performanceLevel: 'optimal' | 'degraded' | 'critical' = 'optimal';
  private performanceDegradationCount = 0;

  private constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      sampleSize: 60, // Track last 60 frames for FPS calculation
      warningThreshold: 50, // Warn if FPS drops below 50
      criticalThreshold: 30, // Critical if FPS drops below 30
      enableLogging: false, // Disable logging to reduce console noise
      ...config,
    };
  }

  static getInstance(config?: Partial<PerformanceConfig>): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor(config);
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start performance monitoring
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.lastNotificationTime = performance.now();
    this.frameTimes = [];
    this.totalFrames = 0;
    this.droppedFrames = 0;

    if (this.config.enableLogging) {
      console.log('🚀 Performance monitoring started');
    }
  }

  /**
   * Stop performance monitoring
   */
  stop(): void {
    this.isRunning = false;

    if (this.config.enableLogging) {
      const metrics = this.getMetrics();
      console.log('⏹️ Performance monitoring stopped. Final metrics:', metrics);
    }
  }

  /**
   * Record a frame for performance tracking with enhanced memory monitoring
   */
  recordFrame(timestamp: number = performance.now()): void {
    if (!this.isRunning) return;

    const frameTime = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;
    this.totalFrames++;

    // Skip first frame (usually large due to initialization)
    if (this.totalFrames === 1) return;

    // Track frame times
    this.frameTimes.push(frameTime);

    // Keep only recent frames for FPS calculation
    if (this.frameTimes.length > this.config.sampleSize) {
      this.frameTimes.shift();
    }

    // Monitor memory usage periodically (every 60 frames ≈ 1 second)
    if (this.totalFrames % 60 === 0) {
      this.updateMemoryMetrics();
    }

    // Detect dropped frames (assuming 60 FPS target = ~16.67ms per frame)
    const expectedFrameTime = 16.67;
    if (frameTime > expectedFrameTime * 2) {
      this.droppedFrames++;
    }

    // Throttle notifications to prevent excessive React re-renders
    const now = performance.now();
    if (now - this.lastNotificationTime >= this.notificationThrottle) {
      const metrics = this.getMetrics();
      this.notifyListeners(metrics);
      this.lastNotificationTime = now;

      // Log warnings for poor performance
      if (this.config.enableLogging) {
        if (metrics.fps < this.config.criticalThreshold) {
          console.warn('🔴 Critical FPS drop:', metrics.fps.toFixed(1), 'fps');
        } else if (metrics.fps < this.config.warningThreshold) {
          console.warn('🟡 FPS warning:', metrics.fps.toFixed(1), 'fps');
        }
      }
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    if (this.frameTimes.length === 0) {
      return {
        fps: 0,
        frameTime: 0,
        totalFrames: this.totalFrames,
        droppedFrames: this.droppedFrames,
        averageFps: 0,
        minFps: 0,
        maxFps: 0,
      };
    }

    // Calculate FPS from frame times
    const averageFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    const currentFps = 1000 / averageFrameTime;

    // Calculate min/max FPS
    const fpsSamples = this.frameTimes.map(ft => 1000 / ft);
    const minFps = Math.min(...fpsSamples);
    const maxFps = Math.max(...fpsSamples);

    // Calculate average FPS over all frames
    const averageFps = this.totalFrames > 1 ? 1000 / averageFrameTime : 0;

    // Get memory usage if available
    let memoryUsage: number | undefined;
    if ('memory' in performance) {
      memoryUsage = (performance as any).memory?.usedJSHeapSize;
    }

    return {
      fps: currentFps,
      frameTime: averageFrameTime,
      totalFrames: this.totalFrames,
      droppedFrames: this.droppedFrames,
      averageFps,
      minFps,
      maxFps,
      memoryUsage,
      gcCollections: this.gcCollections,
      memoryPressure: this.memoryPressureLevel,
      performanceLevel: this.performanceLevel,
    };
  }

  /**
   * Add a listener for performance updates
   */
  addListener(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get performance summary for debugging
   */
  getSummary(): string {
    const metrics = this.getMetrics();
    return `FPS: ${metrics.fps.toFixed(1)} | Avg: ${metrics.averageFps.toFixed(1)} | Min: ${metrics.minFps.toFixed(1)} | Max: ${metrics.maxFps.toFixed(1)} | Dropped: ${metrics.droppedFrames}/${metrics.totalFrames}`;
  }


  private notifyListeners(metrics: PerformanceMetrics): void {
    this.listeners.forEach(callback => {
      try {
        callback(metrics);
      } catch (error) {
        console.error('Performance monitor listener error:', error);
      }
    });
  }

  /**
   * Update memory metrics and detect memory pressure
   */
  private updateMemoryMetrics(): void {
    try {
      // Get memory information if available
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        if (memory) {
          const currentMemory = memory.usedJSHeapSize || 0;
          const memoryLimit = memory.jsHeapSizeLimit || 0;
          
          // Track memory readings
          this.memoryReadings.push(currentMemory);
          if (this.memoryReadings.length > 10) {
            this.memoryReadings.shift(); // Keep last 10 readings
          }
          
          // Detect potential garbage collection
          if (this.lastMemoryUsage > 0 && currentMemory < this.lastMemoryUsage * 0.8) {
            this.gcCollections++;
          }
          
          this.lastMemoryUsage = currentMemory;
          
          // Determine memory pressure level
          if (memoryLimit > 0) {
            const memoryUsageRatio = currentMemory / memoryLimit;
            if (memoryUsageRatio > 0.8) {
              this.memoryPressureLevel = 'high';
            } else if (memoryUsageRatio > 0.6) {
              this.memoryPressureLevel = 'medium';
            } else {
              this.memoryPressureLevel = 'low';
            }
          }
          
          // Update performance level based on both FPS and memory
          this.updatePerformanceLevel();
        }
      }
    } catch (error) {
      // Silently handle memory monitoring errors
      if (this.config.enableLogging) {
        console.warn('Memory monitoring error:', error);
      }
    }
  }

  /**
   * Update overall performance level assessment
   */
  private updatePerformanceLevel(): void {
    const metrics = this.getMetrics();
    
    // Determine performance level based on FPS and memory pressure
    if (metrics.fps < this.config.criticalThreshold || this.memoryPressureLevel === 'high') {
      this.performanceLevel = 'critical';
      this.performanceDegradationCount++;
    } else if (metrics.fps < this.config.warningThreshold || this.memoryPressureLevel === 'medium') {
      this.performanceLevel = 'degraded';
      this.performanceDegradationCount++;
    } else {
      this.performanceLevel = 'optimal';
      // Gradually recover from degradation count
      if (this.performanceDegradationCount > 0) {
        this.performanceDegradationCount = Math.max(0, this.performanceDegradationCount - 1);
      }
    }
  }

  /**
   * Get memory statistics
   */
  getMemoryStats(): {
    currentUsage: number;
    memoryPressure: 'low' | 'medium' | 'high';
    gcCollections: number;
    averageUsage: number;
    memoryTrend: 'increasing' | 'stable' | 'decreasing';
  } {
    const currentUsage = this.lastMemoryUsage;
    const averageUsage = this.memoryReadings.length > 0 
      ? this.memoryReadings.reduce((a, b) => a + b, 0) / this.memoryReadings.length
      : 0;
    
    // Determine memory trend
    let memoryTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (this.memoryReadings.length >= 3) {
      const recent = this.memoryReadings.slice(-3);
      const trend = recent[2] - recent[0];
      if (trend > currentUsage * 0.1) {
        memoryTrend = 'increasing';
      } else if (trend < -currentUsage * 0.1) {
        memoryTrend = 'decreasing';
      }
    }

    return {
      currentUsage,
      memoryPressure: this.memoryPressureLevel,
      gcCollections: this.gcCollections,
      averageUsage,
      memoryTrend
    };
  }

  /**
   * Get performance recommendations based on current metrics
   */
  getPerformanceRecommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = this.getMetrics();
    
    if (this.performanceLevel === 'critical') {
      recommendations.push('Consider reducing visual effects');
      recommendations.push('Limit number of game entities');
      recommendations.push('Enable performance mode if available');
    }
    
    if (this.memoryPressureLevel === 'high') {
      recommendations.push('Force garbage collection');
      recommendations.push('Clear unnecessary object pools');
      recommendations.push('Reduce cache sizes');
    }
    
    if (metrics.droppedFrames > metrics.totalFrames * 0.1) {
      recommendations.push('Optimize game loop performance');
      recommendations.push('Reduce collision detection frequency');
    }
    
    return recommendations;
  }

  /**
   * Reset all performance tracking data
   */
  reset(): void {
    this.frameTimes = [];
    this.totalFrames = 0;
    this.droppedFrames = 0;
    this.lastFrameTime = performance.now();
    this.lastNotificationTime = performance.now();
    
    // Reset memory tracking
    this.lastMemoryUsage = 0;
    this.memoryReadings = [];
    this.gcCollections = 0;
    this.lastGCCheck = 0;
    this.memoryPressureLevel = 'low';
    this.performanceLevel = 'optimal';
    this.performanceDegradationCount = 0;
  }
}

// React hook for using performance monitoring
import { useEffect, useState, useRef } from 'react';

export const usePerformanceMonitor = (enabled: boolean = __DEV__) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const monitorRef = useRef<PerformanceMonitor | undefined>(undefined);
  const hasStartedRef = useRef(false);

  // Get or create monitor instance
  if (!monitorRef.current) {
    monitorRef.current = PerformanceMonitor.getInstance();
  }

  useEffect(() => {
    if (!enabled || !monitorRef.current) return;

    const monitor = monitorRef.current;

    // Only start if not already running
    if (!hasStartedRef.current && monitor) {
      monitor.start();
      hasStartedRef.current = true;
    }

    const unsubscribe = monitor.addListener(setMetrics);

    return () => {
      unsubscribe();
      // Don't stop the monitor on cleanup - let it keep running
      // This prevents start/stop cycles on re-renders
    };
  }, [enabled]);

  // Only stop monitor when component is truly unmounting
  useEffect(() => {
    return () => {
      if (hasStartedRef.current && monitorRef.current) {
        monitorRef.current.stop();
        hasStartedRef.current = false;
      }
    };
  }, []);

  return {
    metrics,
    monitor: monitorRef.current,
    summary: monitorRef.current?.getSummary() || '',
  };
};
