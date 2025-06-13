import React from 'react';
import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage?: number;
  batteryLevel?: number;
  thermalState?: string;
}

export interface LODSettings {
  particleCount: number;
  animationQuality: 'low' | 'medium' | 'high';
  enableGlowEffects: boolean;
  enableParallax: boolean;
  enableComplexAnimations: boolean;
  renderDistance: number;
}

class PerformanceOptimizer {
  private frameCount = 0;
  private lastFrameTime = performance.now();
  private fpsHistory: number[] = [];
  private currentLOD: LODSettings;
  private targetFPS = 60;
  private minFPS = 30;
  
  private callbacks: Array<(metrics: PerformanceMetrics) => void> = [];
  private lodCallbacks: Array<(lod: LODSettings) => void> = [];
  
  constructor() {
    this.currentLOD = this.getHighQualityLOD();
    this.startMonitoring();
  }

  // Start performance monitoring
  startMonitoring() {
    const monitor = () => {
      const currentTime = performance.now();
      const frameTime = currentTime - this.lastFrameTime;
      const fps = 1000 / frameTime;
      
      this.fpsHistory.push(fps);
      if (this.fpsHistory.length > 30) {
        this.fpsHistory.shift();
      }
      
      const averageFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
      
      const metrics: PerformanceMetrics = {
        fps: averageFPS,
        frameTime,
      };
      
      // Notify callbacks
      this.callbacks.forEach(callback => callback(metrics));
      
      // Auto-adjust LOD based on performance
      this.autoAdjustLOD(averageFPS);
      
      this.lastFrameTime = currentTime;
      this.frameCount++;
      
      requestAnimationFrame(monitor);
    };
    
    requestAnimationFrame(monitor);
  }

  // Subscribe to performance updates
  onPerformanceUpdate(callback: (metrics: PerformanceMetrics) => void) {
    this.callbacks.push(callback);
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  // Subscribe to LOD updates
  onLODUpdate(callback: (lod: LODSettings) => void) {
    this.lodCallbacks.push(callback);
    return () => {
      const index = this.lodCallbacks.indexOf(callback);
      if (index > -1) {
        this.lodCallbacks.splice(index, 1);
      }
    };
  }

  // Auto-adjust Level of Detail based on performance
  private autoAdjustLOD(averageFPS: number) {
    let newLOD: LODSettings;
    
    if (averageFPS < this.minFPS) {
      // Performance is poor, reduce quality
      newLOD = this.getLowQualityLOD();
    } else if (averageFPS < this.targetFPS * 0.8) {
      // Performance is okay, medium quality
      newLOD = this.getMediumQualityLOD();
    } else {
      // Performance is good, high quality
      newLOD = this.getHighQualityLOD();
    }
    
    // Only update if LOD has changed
    if (JSON.stringify(newLOD) !== JSON.stringify(this.currentLOD)) {
      this.currentLOD = newLOD;
      this.lodCallbacks.forEach(callback => callback(newLOD));
    }
  }

  // LOD presets
  private getLowQualityLOD(): LODSettings {
    return {
      particleCount: 5,
      animationQuality: 'low',
      enableGlowEffects: false,
      enableParallax: false,
      enableComplexAnimations: false,
      renderDistance: 500,
    };
  }

  private getMediumQualityLOD(): LODSettings {
    return {
      particleCount: 15,
      animationQuality: 'medium',
      enableGlowEffects: true,
      enableParallax: false,
      enableComplexAnimations: true,
      renderDistance: 800,
    };
  }

  private getHighQualityLOD(): LODSettings {
    return {
      particleCount: 30,
      animationQuality: 'high',
      enableGlowEffects: true,
      enableParallax: true,
      enableComplexAnimations: true,
      renderDistance: 1200,
    };
  }

  // Get current LOD settings
  getCurrentLOD(): LODSettings {
    return { ...this.currentLOD };
  }

  // Force LOD level
  setLOD(lod: LODSettings) {
    this.currentLOD = lod;
    this.lodCallbacks.forEach(callback => callback(lod));
  }

  // Calculate distance-based culling
  shouldRenderObject(objectPosition: { x: number; y: number }, cameraPosition: { x: number; y: number }): boolean {
    const distance = Math.sqrt(
      Math.pow(objectPosition.x - cameraPosition.x, 2) + 
      Math.pow(objectPosition.y - cameraPosition.y, 2)
    );
    
    return distance <= this.currentLOD.renderDistance;
  }

  // Get particle count with LOD scaling
  getParticleCount(baseCount: number): number {
    const scaleFactor = this.currentLOD.particleCount / 30; // 30 is max particle count
    return Math.floor(baseCount * scaleFactor);
  }

  // Get animation duration with LOD scaling
  getAnimationDuration(baseDuration: number): number {
    switch (this.currentLOD.animationQuality) {
      case 'low':
        return baseDuration * 0.5;
      case 'medium':
        return baseDuration * 0.75;
      case 'high':
      default:
        return baseDuration;
    }
  }

  // Check if effect should be enabled
  shouldEnableEffect(effectType: 'glow' | 'parallax' | 'complex'): boolean {
    switch (effectType) {
      case 'glow':
        return this.currentLOD.enableGlowEffects;
      case 'parallax':
        return this.currentLOD.enableParallax;
      case 'complex':
        return this.currentLOD.enableComplexAnimations;
      default:
        return true;
    }
  }

  // Get viewport culling bounds
  getViewportBounds(cameraPosition: { x: number; y: number }, scale: number) {
    const padding = 100; // Extra padding for smooth transitions
    
    return {
      left: cameraPosition.x - (screenWidth / scale) / 2 - padding,
      right: cameraPosition.x + (screenWidth / scale) / 2 + padding,
      top: cameraPosition.y - (screenHeight / scale) / 2 - padding,
      bottom: cameraPosition.y + (screenHeight / scale) / 2 + padding,
    };
  }

  // Check if object is in viewport
  isInViewport(
    objectPosition: { x: number; y: number },
    objectSize: { width: number; height: number },
    cameraPosition: { x: number; y: number },
    scale: number
  ): boolean {
    const bounds = this.getViewportBounds(cameraPosition, scale);
    
    return !(
      objectPosition.x + objectSize.width < bounds.left ||
      objectPosition.x > bounds.right ||
      objectPosition.y + objectSize.height < bounds.top ||
      objectPosition.y > bounds.bottom
    );
  }

  // Memory management utilities
  scheduleGarbageCollection() {
    // Force garbage collection hint (if available)
    if (global.gc) {
      global.gc();
    }
  }

  // Adaptive quality based on device capabilities
  detectDeviceCapability(): 'low' | 'medium' | 'high' {
    const screenPixels = screenWidth * screenHeight;
    
    // Basic heuristics based on screen resolution
    if (screenPixels > 2000000) { // > 2MP (high-res devices)
      return 'high';
    } else if (screenPixels > 1000000) { // > 1MP (medium devices)
      return 'medium';
    } else {
      return 'low';
    }
  }

  // Get performance report
  getPerformanceReport(): {
    averageFPS: number;
    minFPS: number;
    maxFPS: number;
    currentLOD: LODSettings;
    recommendations: string[];
  } {
    const averageFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    const minFPS = Math.min(...this.fpsHistory);
    const maxFPS = Math.max(...this.fpsHistory);
    
    const recommendations: string[] = [];
    
    if (averageFPS < this.minFPS) {
      recommendations.push('Consider reducing particle effects');
      recommendations.push('Disable complex animations');
      recommendations.push('Use lower quality textures');
    } else if (averageFPS < this.targetFPS * 0.9) {
      recommendations.push('Monitor performance closely');
      recommendations.push('Consider reducing glow effects');
    } else {
      recommendations.push('Performance is optimal');
    }
    
    return {
      averageFPS,
      minFPS,
      maxFPS,
      currentLOD: this.currentLOD,
      recommendations,
    };
  }
}

// Singleton instance
export const performanceOptimizer = new PerformanceOptimizer();

// React hook for using performance optimization
export const usePerformanceOptimizer = () => {
  const [lod, setLOD] = React.useState<LODSettings>(performanceOptimizer.getCurrentLOD());
  const [metrics, setMetrics] = React.useState<PerformanceMetrics>({ fps: 60, frameTime: 16.67 });

  React.useEffect(() => {
    const unsubscribeLOD = performanceOptimizer.onLODUpdate(setLOD);
    const unsubscribeMetrics = performanceOptimizer.onPerformanceUpdate(setMetrics);
    
    return () => {
      unsubscribeLOD();
      unsubscribeMetrics();
    };
  }, []);

  return {
    lod,
    metrics,
    shouldRenderObject: performanceOptimizer.shouldRenderObject.bind(performanceOptimizer),
    getParticleCount: performanceOptimizer.getParticleCount.bind(performanceOptimizer),
    shouldEnableEffect: performanceOptimizer.shouldEnableEffect.bind(performanceOptimizer),
    isInViewport: performanceOptimizer.isInViewport.bind(performanceOptimizer),
  };
};