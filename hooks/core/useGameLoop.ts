/**
 * Game Loop Hook - Extracted from monolithic useGameLogic
 * 
 * Handles:
 * - Animation frame management
 * - Delta time calculations  
 * - Game state validation
 * - Performance monitoring
 * - FPS tracking
 * 
 * This is a self-contained system with minimal dependencies.
 */

import { useCallback, useRef, useEffect } from 'react';
// Simplified performance monitoring for now
// import { PerformanceMonitor } from '@/utils/PerformanceMonitor';
// import { mobileOptimizer } from '@/utils/MobileOptimizer';

interface GameLoopStats {
  fps: number;
  frameTime: number;
  totalFrames: number;
  isRunning: boolean;
}

interface GameLoopConfig {
  targetFPS?: number;
  maxDeltaTime?: number;
  enablePerformanceMonitoring?: boolean;
}

export const useGameLoop = (
  isPlaying: boolean,
  gameOver: boolean,
  onUpdate: (deltaTime: number) => void,
  config: GameLoopConfig = {}
) => {
  const {
    targetFPS = 60,
    maxDeltaTime = 1000 / 30, // Cap at 30 FPS minimum
    enablePerformanceMonitoring = true,
  } = config;

  // Game loop refs
  const gameLoopRef = useRef<number | null>(null);
  const lastUpdateTime = useRef<number>(0);
  const frameCount = useRef<number>(0);
  const fpsHistory = useRef<number[]>([]);
  const lastFPSCalculation = useRef<number>(0);
  const currentFPS = useRef<number>(60);

  // Performance monitoring (simplified for now)
  const performanceMonitor = useRef<any>(null);

  // Initialize performance monitoring
  useEffect(() => {
    if (enablePerformanceMonitoring && !performanceMonitor.current) {
      // Simplified performance tracking
      performanceMonitor.current = {
        frameStartTime: 0,
        frameEndTime: 0,
      };
    }
  }, [enablePerformanceMonitoring]);

  // Calculate FPS
  const updateFPS = useCallback((currentTime: number) => {
    frameCount.current++;
    
    // Calculate FPS every 500ms
    if (currentTime - lastFPSCalculation.current >= 500) {
      const fps = (frameCount.current * 1000) / (currentTime - lastFPSCalculation.current);
      
      fpsHistory.current.push(fps);
      if (fpsHistory.current.length > 10) {
        fpsHistory.current.shift();
      }
      
      // Average FPS over last 10 measurements
      currentFPS.current = fpsHistory.current.reduce((sum, fps) => sum + fps, 0) / fpsHistory.current.length;
      
      frameCount.current = 0;
      lastFPSCalculation.current = currentTime;
    }
  }, []);

  // Main game loop
  const gameLoop = useCallback(() => {
    const currentTime = performance.now();
    
    // Initialize timing on first frame
    if (lastUpdateTime.current === 0) {
      lastUpdateTime.current = currentTime;
    }
    
    // Calculate delta time in seconds
    let deltaTime = (currentTime - lastUpdateTime.current) / 1000;
    
    // Cap delta time to prevent large jumps (e.g., when tab is inactive)
    deltaTime = Math.min(deltaTime, maxDeltaTime / 1000);
    
    // Update FPS calculation
    updateFPS(currentTime);
    
    // Performance monitoring (simplified)
    if (performanceMonitor.current) {
      performanceMonitor.current.frameStartTime = currentTime;
    }
    
    // Only update if game is playing and not over
    if (isPlaying && !gameOver && deltaTime > 0) {
      try {
        onUpdate(deltaTime);
      } catch (error) {
        console.error('Game loop update error:', error);
        // Continue running even if update fails
      }
    }
    
    // Performance monitoring (simplified)
    if (performanceMonitor.current) {
      performanceMonitor.current.frameEndTime = performance.now();
    }
    
    lastUpdateTime.current = currentTime;
    
    // Schedule next frame
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [isPlaying, gameOver, onUpdate, maxDeltaTime, updateFPS]);

  // Start/stop game loop based on playing state
  useEffect(() => {
    if (isPlaying && !gameOver) {
      // Reset timing when starting
      lastUpdateTime.current = 0;
      frameCount.current = 0;
      lastFPSCalculation.current = performance.now();
      
      // Start the game loop
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    } else {
      // Stop the game loop
      if (gameLoopRef.current !== null) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (gameLoopRef.current !== null) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    };
  }, [isPlaying, gameOver, gameLoop]);

  // Reset when game is reset
  useEffect(() => {
    if (!isPlaying && !gameOver) {
      lastUpdateTime.current = 0;
      frameCount.current = 0;
      fpsHistory.current = [];
      currentFPS.current = 60;
    }
  }, [isPlaying, gameOver]);

  // Get current stats
  const getStats = useCallback((): GameLoopStats => {
    return {
      fps: currentFPS.current,
      frameTime: 1000 / currentFPS.current,
      totalFrames: frameCount.current,
      isRunning: gameLoopRef.current !== null,
    };
  }, []);

  // Force FPS optimization based on performance (simplified)
  const optimizePerformance = useCallback(() => {
    if (currentFPS.current < 45) {
      // Poor performance detected
      console.warn('🎯 Game Loop: Poor performance detected, FPS:', currentFPS.current);
    } else if (currentFPS.current > 55) {
      // Good performance
      if (__DEV__) {
        console.log('🎯 Game Loop: Good performance, FPS:', currentFPS.current);
      }
    }
  }, []);

  // Auto-optimize performance every 5 seconds
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(optimizePerformance, 5000);
    return () => clearInterval(interval);
  }, [isPlaying, optimizePerformance]);

  return {
    // Stats
    getStats,
    fps: currentFPS.current,
    isRunning: gameLoopRef.current !== null,
    
    // Performance
    performanceMonitor: performanceMonitor.current,
    optimizePerformance,
  };
};