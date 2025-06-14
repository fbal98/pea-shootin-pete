/**
 * Bridge hook that provides the optimized input system with the existing API
 * This allows us to use the advanced gesture handling while maintaining compatibility
 */

import { useCallback, useRef, useEffect } from 'react';
import { GestureResponderEvent } from 'react-native';
import { useGameOver } from '@/store/gameStore';
import { GAME_CONFIG, INPUT_CONFIG } from '@/constants/GameConfig';
import { ErrorLogger } from '@/utils/errorLogger';

interface TouchInputConfig {
  smoothingFactor: number;
  predictionFrames: number;
  deadZone: number;
  maxVelocity: number;
  tapThreshold: number;
  debounceMs: number;
}

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
  velocity?: { x: number; y: number };
}

const DEFAULT_CONFIG: TouchInputConfig = {
  smoothingFactor: 0.15, // Lower = more smoothing, higher = more responsive
  predictionFrames: 2, // Number of frames to predict ahead
  deadZone: 2, // Minimum movement threshold in pixels
  maxVelocity: 1000, // Maximum velocity in pixels/second
  tapThreshold: 10, // Maximum movement for tap detection
  debounceMs: 16, // Minimum time between input updates (~60fps)
};

export const useOptimizedGameInputBridge = (
  screenWidth: number,
  shootProjectile: () => void,
  updatePetePosition: (x: number) => void,
  config: Partial<TouchInputConfig> = {}
) => {
  const inputConfig = { ...DEFAULT_CONFIG, ...config };
  const gameOver = useGameOver();

  // Touch tracking state
  const touchHistory = useRef<TouchPoint[]>([]);
  const lastUpdateTime = useRef<number>(0);
  const currentPosition = useRef<number>(screenWidth / 2 - GAME_CONFIG.PETE_SIZE / 2);
  const targetPosition = useRef<number>(screenWidth / 2 - GAME_CONFIG.PETE_SIZE / 2);
  const velocity = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Performance tracking
  const inputStats = useRef({
    totalTouches: 0,
    totalResponseTime: 0,
    smoothingApplications: 0,
    smoothingSkips: 0,
  });
  
  // Tap detection state
  const tapStartPosition = useRef<{ x: number; y: number } | null>(null);
  const tapStartTime = useRef<number>(0);
  const lastTapTime = useRef<number>(0);
  const isTouching = useRef<boolean>(false);

  /**
   * Calculate velocity from touch history
   */
  const calculateVelocity = useCallback((currentTouch: TouchPoint): { x: number; y: number } => {
    const history = touchHistory.current;
    if (history.length < 2) return { x: 0, y: 0 };
    
    // Use last 3 points for velocity calculation
    const recentPoints = history.slice(-3);
    const timeDelta = currentTouch.timestamp - recentPoints[0].timestamp;
    
    if (timeDelta <= 0) return velocity.current;
    
    const xDelta = currentTouch.x - recentPoints[0].x;
    const yDelta = currentTouch.y - recentPoints[0].y;
    
    return {
      x: Math.max(-inputConfig.maxVelocity, Math.min(inputConfig.maxVelocity, xDelta / timeDelta * 1000)),
      y: Math.max(-inputConfig.maxVelocity, Math.min(inputConfig.maxVelocity, yDelta / timeDelta * 1000))
    };
  }, [inputConfig.maxVelocity]);
  
  /**
   * Predictive interpolation for smoother movement
   */
  const predictPosition = useCallback((
    currentPos: number,
    targetPos: number,
    vel: { x: number; y: number },
    deltaTime: number
  ): number => {
    // Simple prediction based on velocity
    const prediction = targetPos + (vel.x * deltaTime * inputConfig.predictionFrames / 1000);
    
    // Clamp to screen bounds
    return Math.max(0, Math.min(screenWidth - GAME_CONFIG.PETE_SIZE, prediction));
  }, [screenWidth, inputConfig.predictionFrames]);
  
  /**
   * Apply smoothing to position updates
   */
  const applySmoothingFilter = useCallback((
    currentPos: number,
    targetPos: number,
    deltaTime: number
  ): number => {
    const distance = Math.abs(targetPos - currentPos);
    
    // Skip smoothing if movement is too small (dead zone)
    if (distance < inputConfig.deadZone) {
      inputStats.current.smoothingSkips++;
      return currentPos;
    }
    
    // Dynamic smoothing factor based on distance and velocity
    const velocityMagnitude = Math.abs(velocity.current.x);
    const dynamicSmoothing = inputConfig.smoothingFactor * 
      (1 + Math.min(velocityMagnitude / 500, 1)); // Increase smoothing for fast movements
    
    const smoothedPos = currentPos + (targetPos - currentPos) * dynamicSmoothing;
    inputStats.current.smoothingApplications++;
    
    return smoothedPos;
  }, [inputConfig.deadZone, inputConfig.smoothingFactor]);

  /**
   * Update Pete's position with optimization
   */
  const updatePetePositionOptimized = useCallback((
    x: number,
    timestamp: number = performance.now()
  ): void => {
    const deltaTime = timestamp - lastUpdateTime.current;
    
    // Debounce rapid updates
    if (deltaTime < inputConfig.debounceMs) {
      return;
    }
    
    // Create touch point
    const touchPoint: TouchPoint = { x, y: 0, timestamp };
    
    // Update velocity
    velocity.current = calculateVelocity(touchPoint);
    touchPoint.velocity = velocity.current;
    
    // Add to history and limit size
    touchHistory.current.push(touchPoint);
    if (touchHistory.current.length > 10) {
      touchHistory.current.shift();
    }
    
    // Update target position with bounds checking
    targetPosition.current = Math.max(0, Math.min(screenWidth - GAME_CONFIG.PETE_SIZE, x));
    
    // Apply predictive interpolation
    const predictedPos = predictPosition(
      currentPosition.current,
      targetPosition.current,
      velocity.current,
      deltaTime
    );
    
    // Apply smoothing
    const smoothedPos = applySmoothingFilter(
      currentPosition.current,
      predictedPos,
      deltaTime
    );
    
    // Update current position
    currentPosition.current = smoothedPos;
    lastUpdateTime.current = timestamp;
    
    // Update performance stats
    inputStats.current.totalTouches++;
    inputStats.current.totalResponseTime += deltaTime;
    
    // Call the position update callback
    updatePetePosition(smoothedPos);
  }, [
    screenWidth,
    inputConfig.debounceMs,
    calculateVelocity,
    predictPosition,
    applySmoothingFilter,
    updatePetePosition
  ]);

  // Handle touch start
  const handleTouchStart = useCallback(
    (event: GestureResponderEvent) => {
      try {
        if (gameOver) return;

        const { locationX, locationY } = event.nativeEvent;
        const timestamp = performance.now();
        
        tapStartPosition.current = { x: locationX, y: locationY };
        tapStartTime.current = timestamp;
        isTouching.current = true;

        // Shoot on tap
        shootProjectile();

        // Start optimized position tracking
        updatePetePositionOptimized(locationX, timestamp);
      } catch (error) {
        ErrorLogger.logGameLogicError(
          error instanceof Error ? error : new Error(String(error)),
          'optimized_touch_start',
          { screenWidth }
        );
      }
    },
    [gameOver, shootProjectile, updatePetePositionOptimized, screenWidth]
  );

  // Handle swipe movement with optimization
  const handleTouchMove = useCallback(
    (event: GestureResponderEvent) => {
      try {
        if (gameOver || !isTouching.current) return;

        const { locationX } = event.nativeEvent;
        const timestamp = performance.now();

        updatePetePositionOptimized(locationX, timestamp);
      } catch (error) {
        ErrorLogger.logGameLogicError(
          error instanceof Error ? error : new Error(String(error)),
          'optimized_touch_move',
          { screenWidth }
        );
      }
    },
    [gameOver, screenWidth, updatePetePositionOptimized]
  );

  // Handle touch end with tap detection
  const handleTouchEnd = useCallback(
    (event: GestureResponderEvent) => {
      try {
        const { locationX, locationY } = event.nativeEvent;
        const endTime = performance.now();
        const startPos = tapStartPosition.current;
        
        isTouching.current = false;
        
        // Enhanced tap detection
        if (startPos && endTime - tapStartTime.current < 300) { // 300ms tap threshold
          const distance = Math.sqrt(
            Math.pow(locationX - startPos.x, 2) + 
            Math.pow(locationY - startPos.y, 2)
          );
          
          // If movement was minimal, treat as a tap (already shot on touch start)
          if (distance < inputConfig.tapThreshold) {
            // Debounce rapid taps
            if (endTime - lastTapTime.current > inputConfig.debounceMs * 2) {
              lastTapTime.current = endTime;
              // Additional tap logic could go here if needed
            }
          }
        }
        
        tapStartPosition.current = null;
      } catch (error) {
        ErrorLogger.logGameLogicError(
          error instanceof Error ? error : new Error(String(error)),
          'optimized_touch_end',
          { screenWidth }
        );
      }
    },
    [inputConfig.tapThreshold, inputConfig.debounceMs, screenWidth]
  );

  // Smooth animation frame update with enhanced physics
  const updateSmoothing = useCallback(() => {
    if (
      !isTouching.current &&
      Math.abs(targetPosition.current - currentPosition.current) > INPUT_CONFIG.SMOOTHING_THRESHOLD
    ) {
      const timestamp = performance.now();
      const deltaTime = timestamp - lastUpdateTime.current;
      
      // Apply smoothing to catch up to target position
      const smoothedPos = applySmoothingFilter(
        currentPosition.current,
        targetPosition.current,
        deltaTime
      );
      
      currentPosition.current = smoothedPos;
      lastUpdateTime.current = timestamp;
      updatePetePosition(smoothedPos);
    }
  }, [applySmoothingFilter, updatePetePosition]);

  // Get input performance statistics
  const getInputStats = useCallback(() => {
    const stats = inputStats.current;
    return {
      totalTouches: stats.totalTouches,
      averageResponseTime: stats.totalTouches > 0 ? stats.totalResponseTime / stats.totalTouches : 0,
      smoothingEfficiency: stats.smoothingApplications + stats.smoothingSkips > 0 
        ? (stats.smoothingApplications / (stats.smoothingApplications + stats.smoothingSkips)) * 100
        : 0,
    };
  }, []);

  // Reset input state
  const resetInput = useCallback(() => {
    touchHistory.current = [];
    lastUpdateTime.current = 0;
    currentPosition.current = screenWidth / 2 - GAME_CONFIG.PETE_SIZE / 2;
    targetPosition.current = screenWidth / 2 - GAME_CONFIG.PETE_SIZE / 2;
    velocity.current = { x: 0, y: 0 };
    tapStartPosition.current = null;
    tapStartTime.current = 0;
    lastTapTime.current = 0;
    isTouching.current = false;
    
    // Reset stats
    inputStats.current = {
      totalTouches: 0,
      totalResponseTime: 0,
      smoothingApplications: 0,
      smoothingSkips: 0,
    };
  }, [screenWidth]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetInput();
    };
  }, [resetInput]);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    updateSmoothing,
    getInputStats,
    resetInput,
  };
};