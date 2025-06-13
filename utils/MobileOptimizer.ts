/**
 * Mobile-specific performance optimization utilities
 * Handles battery management, thermal throttling, and device capability detection
 */

import { Platform, Dimensions, PixelRatio } from 'react-native';
import { PerformanceMonitor } from './PerformanceMonitor';

export interface DeviceCapabilities {
  tier: 'low' | 'medium' | 'high' | 'flagship';
  ram: 'low' | 'medium' | 'high';
  cpu: 'low' | 'medium' | 'high';
  gpu: 'low' | 'medium' | 'high';
  thermalState: 'nominal' | 'fair' | 'serious' | 'critical';
  batteryLevel: number;
  lowPowerMode: boolean;
  screenDensity: 'low' | 'medium' | 'high' | 'xhigh';
}

export interface PerformanceProfile {
  targetFPS: number;
  maxEntityCount: number;
  renderQuality: 'low' | 'medium' | 'high';
  enableParticles: boolean;
  enableShadows: boolean;
  enableViewportCulling: boolean;
  cullDistance: number;
  batchUpdates: boolean;
  reducedPhysics: boolean;
}

export class MobileOptimizer {
  private static instance: MobileOptimizer;
  private performanceMonitor: PerformanceMonitor;
  private capabilities: DeviceCapabilities;
  private currentProfile: PerformanceProfile;
  private frameRateHistory: number[] = [];
  private thermalThrottleCount = 0;
  private lastOptimizationCheck = 0;
  private optimizationInterval = 5000; // Check every 5 seconds
  
  // Performance thresholds
  private readonly THERMAL_FPS_THRESHOLD = 45;
  private readonly BATTERY_FPS_THRESHOLD = 50;
  private readonly MEMORY_PRESSURE_THRESHOLD = 0.8;

  private constructor() {
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.capabilities = this.detectDeviceCapabilities();
    this.currentProfile = this.createOptimalProfile();
  }

  static getInstance(): MobileOptimizer {
    if (!MobileOptimizer.instance) {
      MobileOptimizer.instance = new MobileOptimizer();
    }
    return MobileOptimizer.instance;
  }

  /**
   * Detect device capabilities for optimization
   */
  private detectDeviceCapabilities(): DeviceCapabilities {
    const { width, height } = Dimensions.get('window');
    const pixelRatio = PixelRatio.get();
    const screenPixels = width * height * pixelRatio * pixelRatio;
    
    // Estimate device tier based on screen resolution and platform
    let tier: DeviceCapabilities['tier'] = 'medium';
    let ram: DeviceCapabilities['ram'] = 'medium';
    let cpu: DeviceCapabilities['cpu'] = 'medium';
    let gpu: DeviceCapabilities['gpu'] = 'medium';
    
    // Screen density classification
    let screenDensity: DeviceCapabilities['screenDensity'] = 'medium';
    if (pixelRatio >= 3.5) {
      screenDensity = 'xhigh';
    } else if (pixelRatio >= 2.5) {
      screenDensity = 'high';
    } else if (pixelRatio >= 1.5) {
      screenDensity = 'medium';
    } else {
      screenDensity = 'low';
    }
    
    // Device tier estimation based on platform and screen
    if (Platform.OS === 'ios') {
      // iOS device estimation
      if (screenPixels > 3000000) { // iPhone Pro models, iPad Pro
        tier = 'flagship';
        ram = 'high';
        cpu = 'high';
        gpu = 'high';
      } else if (screenPixels > 2000000) { // Recent iPhones
        tier = 'high';
        ram = 'high';
        cpu = 'high';
        gpu = 'medium';
      } else if (screenPixels > 1000000) { // Older iPhones, base iPads
        tier = 'medium';
        ram = 'medium';
        cpu = 'medium';
        gpu = 'medium';
      } else { // Very old devices
        tier = 'low';
        ram = 'low';
        cpu = 'low';
        gpu = 'low';
      }
    } else {
      // Android device estimation (more conservative)
      if (screenPixels > 4000000 && pixelRatio >= 3) { // Flagship Android
        tier = 'flagship';
        ram = 'high';
        cpu = 'high';
        gpu = 'high';
      } else if (screenPixels > 2500000) { // High-end Android
        tier = 'high';
        ram = 'medium';
        cpu = 'high';
        gpu = 'medium';
      } else if (screenPixels > 1500000) { // Mid-range Android
        tier = 'medium';
        ram = 'medium';
        cpu = 'medium';
        gpu = 'low';
      } else { // Budget Android
        tier = 'low';
        ram = 'low';
        cpu = 'low';
        gpu = 'low';
      }
    }

    return {
      tier,
      ram,
      cpu,
      gpu,
      thermalState: 'nominal',
      batteryLevel: 1.0, // Will be updated dynamically
      lowPowerMode: false, // Will be updated dynamically
      screenDensity
    };
  }

  /**
   * Create optimal performance profile based on device capabilities
   */
  private createOptimalProfile(): PerformanceProfile {
    const caps = this.capabilities;
    
    // Base profile based on device tier
    let profile: PerformanceProfile;
    
    switch (caps.tier) {
      case 'flagship':
        profile = {
          targetFPS: 60,
          maxEntityCount: 100,
          renderQuality: 'high',
          enableParticles: true,
          enableShadows: true,
          enableViewportCulling: true,
          cullDistance: 100,
          batchUpdates: false,
          reducedPhysics: false,
        };
        break;
        
      case 'high':
        profile = {
          targetFPS: 60,
          maxEntityCount: 75,
          renderQuality: 'high',
          enableParticles: true,
          enableShadows: true,
          enableViewportCulling: true,
          cullDistance: 80,
          batchUpdates: true,
          reducedPhysics: false,
        };
        break;
        
      case 'medium':
        profile = {
          targetFPS: 60,
          maxEntityCount: 50,
          renderQuality: 'medium',
          enableParticles: false,
          enableShadows: false,
          enableViewportCulling: true,
          cullDistance: 60,
          batchUpdates: true,
          reducedPhysics: false,
        };
        break;
        
      case 'low':
        profile = {
          targetFPS: 30,
          maxEntityCount: 25,
          renderQuality: 'low',
          enableParticles: false,
          enableShadows: false,
          enableViewportCulling: true,
          cullDistance: 40,
          batchUpdates: true,
          reducedPhysics: true,
        };
        break;
    }
    
    // Adjust for screen density
    if (caps.screenDensity === 'xhigh') {
      profile.maxEntityCount = Math.floor(profile.maxEntityCount * 0.8);
      profile.cullDistance = Math.floor(profile.cullDistance * 0.9);
    } else if (caps.screenDensity === 'low') {
      profile.maxEntityCount = Math.floor(profile.maxEntityCount * 1.2);
      profile.cullDistance = Math.floor(profile.cullDistance * 1.1);
    }
    
    return profile;
  }

  /**
   * Update device capabilities dynamically
   */
  updateCapabilities(updates: Partial<DeviceCapabilities>): void {
    this.capabilities = { ...this.capabilities, ...updates };
    
    // Trigger profile optimization if critical values changed
    if (updates.thermalState || updates.batteryLevel !== undefined || updates.lowPowerMode !== undefined) {
      this.optimizeProfile();
    }
  }

  /**
   * Optimize performance profile based on current conditions
   */
  private optimizeProfile(): void {
    const now = performance.now();
    if (now - this.lastOptimizationCheck < this.optimizationInterval) {
      return;
    }
    
    this.lastOptimizationCheck = now;
    
    const metrics = this.performanceMonitor.getMetrics();
    const caps = this.capabilities;
    let profile = { ...this.currentProfile };
    
    // Track FPS history
    this.frameRateHistory.push(metrics.fps);
    if (this.frameRateHistory.length > 20) {
      this.frameRateHistory.shift();
    }
    
    const avgFPS = this.frameRateHistory.reduce((a, b) => a + b, 0) / this.frameRateHistory.length;
    
    // Thermal throttling detection and response
    if (caps.thermalState === 'serious' || caps.thermalState === 'critical') {
      this.thermalThrottleCount++;
      
      // Aggressive thermal management
      profile.targetFPS = Math.min(30, profile.targetFPS);
      profile.maxEntityCount = Math.floor(profile.maxEntityCount * 0.6);
      profile.renderQuality = 'low';
      profile.enableParticles = false;
      profile.enableShadows = false;
      profile.reducedPhysics = true;
      profile.batchUpdates = true;
      
    } else if (caps.thermalState === 'fair') {
      // Moderate thermal management
      profile.targetFPS = Math.min(45, profile.targetFPS);
      profile.maxEntityCount = Math.floor(profile.maxEntityCount * 0.8);
      profile.renderQuality = profile.renderQuality === 'high' ? 'medium' : profile.renderQuality;
      profile.enableParticles = false;
      profile.batchUpdates = true;
    }
    
    // Battery optimization
    if (caps.lowPowerMode || caps.batteryLevel < 0.2) {
      profile.targetFPS = Math.min(30, profile.targetFPS);
      profile.maxEntityCount = Math.floor(profile.maxEntityCount * 0.7);
      profile.renderQuality = 'low';
      profile.enableParticles = false;
      profile.enableShadows = false;
      profile.batchUpdates = true;
      profile.reducedPhysics = true;
    } else if (caps.batteryLevel < 0.5) {
      profile.targetFPS = Math.min(45, profile.targetFPS);
      profile.renderQuality = profile.renderQuality === 'high' ? 'medium' : profile.renderQuality;
      profile.batchUpdates = true;
    }
    
    // Performance-based adjustments
    if (avgFPS < profile.targetFPS * 0.8) {
      // Performance is poor, reduce quality
      if (profile.renderQuality === 'high') {
        profile.renderQuality = 'medium';
      } else if (profile.renderQuality === 'medium') {
        profile.renderQuality = 'low';
      }
      
      profile.maxEntityCount = Math.floor(profile.maxEntityCount * 0.9);
      profile.enableParticles = false;
      profile.enableShadows = false;
      profile.batchUpdates = true;
    } else if (avgFPS > profile.targetFPS * 1.1 && caps.thermalState === 'nominal' && !caps.lowPowerMode) {
      // Performance is good, potentially increase quality
      if (profile.renderQuality === 'low' && caps.tier !== 'low') {
        profile.renderQuality = 'medium';
      } else if (profile.renderQuality === 'medium' && caps.tier === 'flagship') {
        profile.renderQuality = 'high';
      }
      
      if (profile.maxEntityCount < this.createOptimalProfile().maxEntityCount) {
        profile.maxEntityCount = Math.floor(profile.maxEntityCount * 1.1);
      }
    }
    
    // Memory pressure response
    if (metrics.memoryPressure === 'high') {
      profile.maxEntityCount = Math.floor(profile.maxEntityCount * 0.8);
      profile.batchUpdates = true;
      profile.enableParticles = false;
    }
    
    this.currentProfile = profile;
  }

  /**
   * Get current performance profile
   */
  getPerformanceProfile(): PerformanceProfile {
    this.optimizeProfile();
    return { ...this.currentProfile };
  }

  /**
   * Get device capabilities
   */
  getDeviceCapabilities(): DeviceCapabilities {
    return { ...this.capabilities };
  }

  /**
   * Force performance optimization check
   */
  forceOptimization(): void {
    this.lastOptimizationCheck = 0;
    this.optimizeProfile();
  }

  /**
   * Get optimization statistics
   */
  getOptimizationStats(): {
    thermalThrottleCount: number;
    averageFPS: number;
    currentProfile: PerformanceProfile;
    optimizationsSinceStart: number;
    deviceTier: string;
  } {
    const avgFPS = this.frameRateHistory.length > 0 
      ? this.frameRateHistory.reduce((a, b) => a + b, 0) / this.frameRateHistory.length
      : 0;
      
    return {
      thermalThrottleCount: this.thermalThrottleCount,
      averageFPS: avgFPS,
      currentProfile: { ...this.currentProfile },
      optimizationsSinceStart: Math.floor((performance.now() - 0) / this.optimizationInterval),
      deviceTier: this.capabilities.tier,
    };
  }

  /**
   * Simulate thermal state change (for testing)
   */
  simulateThermalState(state: DeviceCapabilities['thermalState']): void {
    if (__DEV__) {
      this.updateCapabilities({ thermalState: state });
      console.log(`🌡️ Simulated thermal state: ${state}`);
    }
  }

  /**
   * Simulate battery level change (for testing)
   */
  simulateBatteryLevel(level: number): void {
    if (__DEV__) {
      this.updateCapabilities({ 
        batteryLevel: Math.max(0, Math.min(1, level)),
        lowPowerMode: level < 0.2
      });
      console.log(`🔋 Simulated battery level: ${(level * 100).toFixed(0)}%`);
    }
  }

  /**
   * Reset optimization state
   */
  reset(): void {
    this.frameRateHistory = [];
    this.thermalThrottleCount = 0;
    this.lastOptimizationCheck = 0;
    this.currentProfile = this.createOptimalProfile();
    this.capabilities = this.detectDeviceCapabilities();
  }
}

// Singleton instance for global access
export const mobileOptimizer = MobileOptimizer.getInstance();