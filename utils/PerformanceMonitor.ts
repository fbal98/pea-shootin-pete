/**
 * Performance monitoring utility for tracking FPS and game performance
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
   * Record a frame for performance tracking
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

    // Detect dropped frames (assuming 60 FPS target = ~16.67ms per frame)
    const expectedFrameTime = 16.67;
    if (frameTime > expectedFrameTime * 2) {
      this.droppedFrames++;
    }

    // Notify listeners with current metrics
    const metrics = this.getMetrics();
    this.notifyListeners(metrics);

    // Log warnings for poor performance
    if (this.config.enableLogging) {
      if (metrics.fps < this.config.criticalThreshold) {
        console.warn('🔴 Critical FPS drop:', metrics.fps.toFixed(1), 'fps');
      } else if (metrics.fps < this.config.warningThreshold) {
        console.warn('🟡 FPS warning:', metrics.fps.toFixed(1), 'fps');
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

  /**
   * Reset all metrics
   */
  reset(): void {
    this.frameTimes = [];
    this.totalFrames = 0;
    this.droppedFrames = 0;
    this.lastFrameTime = performance.now();
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
