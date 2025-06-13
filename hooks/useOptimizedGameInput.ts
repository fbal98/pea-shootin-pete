/**
 * Optimized game input hook with predictive interpolation and performance tuning
 */

import { useCallback, useRef, useEffect } from 'react';
import { PanGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Gesture, GestureType } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue, useAnimatedGestureHandler } from 'react-native-reanimated';

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

interface OptimizedGameInputResult {
  petePosition: number;
  setupTouchHandlers: (
    onMove: (x: number) => void,
    onTap: (x: number, y: number) => void
  ) => any;
  resetInput: () => void;
  getInputStats: () => {
    totalTouches: number;
    averageResponseTime: number;
    smoothingEfficiency: number;
  };
}

const DEFAULT_CONFIG: TouchInputConfig = {
  smoothingFactor: 0.15, // Lower = more smoothing, higher = more responsive
  predictionFrames: 2, // Number of frames to predict ahead
  deadZone: 2, // Minimum movement threshold in pixels
  maxVelocity: 1000, // Maximum velocity in pixels/second
  tapThreshold: 10, // Maximum movement for tap detection
  debounceMs: 16, // Minimum time between input updates (~60fps)
};

export const useOptimizedGameInput = (
  screenWidth: number,
  peteSize: number,
  config: Partial<TouchInputConfig> = {}
): OptimizedGameInputResult => {
  const inputConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Touch tracking state
  const touchHistory = useRef<TouchPoint[]>([]);
  const lastUpdateTime = useRef<number>(0);
  const currentPosition = useRef<number>(screenWidth / 2);
  const targetPosition = useRef<number>(screenWidth / 2);
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
  
  // Shared values for gesture handler
  const positionX = useSharedValue(screenWidth / 2);
  const isActive = useSharedValue(false);
  
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
    velocity: { x: number; y: number },
    deltaTime: number
  ): number => {
    // Simple prediction based on velocity
    const prediction = targetPos + (velocity.x * deltaTime * inputConfig.predictionFrames / 1000);
    
    // Clamp to screen bounds
    return Math.max(0, Math.min(screenWidth - peteSize, prediction));
  }, [screenWidth, peteSize, inputConfig.predictionFrames]);
  
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
  const updatePetePosition = useCallback((
    x: number,
    onMove: (x: number) => void,
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
    targetPosition.current = Math.max(0, Math.min(screenWidth - peteSize, x));
    
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
    onMove(smoothedPos);
  }, [
    screenWidth,
    peteSize,
    inputConfig.debounceMs,
    calculateVelocity,
    predictPosition,
    applySmoothingFilter
  ]);
  
  /**
   * Handle tap detection
   */
  const handleTap = useCallback((
    x: number,
    y: number,
    onTap: (x: number, y: number) => void,
    timestamp: number = performance.now()
  ): void => {
    // Debounce taps
    if (timestamp - lastTapTime.current < inputConfig.debounceMs * 2) {
      return;
    }
    
    lastTapTime.current = timestamp;
    onTap(x, y);
  }, [inputConfig.debounceMs]);
  
  /**
   * Create optimized gesture handlers
   */
  const setupTouchHandlers = useCallback((
    onMove: (x: number) => void,
    onTap: (x: number, y: number) => void
  ) => {
    const panGesture = Gesture.Pan()
      .onStart((event) => {
        'worklet';
        isActive.value = true;
        tapStartPosition.current = { x: event.x, y: event.y };
        tapStartTime.current = Date.now();
        
        // Initialize position immediately
        runOnJS(updatePetePosition)(event.x, onMove, Date.now());
      })
      .onUpdate((event) => {
        'worklet';
        // Update position with throttling
        runOnJS(updatePetePosition)(event.x, onMove, Date.now());
      })
      .onEnd((event) => {
        'worklet';
        isActive.value = false;
        
        // Check for tap
        const startPos = tapStartPosition.current;
        const endTime = Date.now();
        const duration = endTime - tapStartTime.current;
        
        if (startPos && duration < 300) { // 300ms tap threshold
          const distance = Math.sqrt(
            Math.pow(event.x - startPos.x, 2) + 
            Math.pow(event.y - startPos.y, 2)
          );
          
          if (distance < inputConfig.tapThreshold) {
            runOnJS(handleTap)(event.x, event.y, onTap, endTime);
          }
        }
        
        tapStartPosition.current = null;
      });
    
    return panGesture;
  }, [updatePetePosition, handleTap, inputConfig.tapThreshold]);
  
  /**
   * Reset input state
   */
  const resetInput = useCallback((): void => {
    touchHistory.current = [];
    lastUpdateTime.current = 0;
    currentPosition.current = screenWidth / 2;
    targetPosition.current = screenWidth / 2;
    velocity.current = { x: 0, y: 0 };
    tapStartPosition.current = null;
    tapStartTime.current = 0;
    lastTapTime.current = 0;
    
    // Reset shared values
    positionX.value = screenWidth / 2;
    isActive.value = false;
    
    // Reset stats
    inputStats.current = {
      totalTouches: 0,
      totalResponseTime: 0,
      smoothingApplications: 0,
      smoothingSkips: 0,
    };
  }, [screenWidth]);
  
  /**
   * Get input performance statistics
   */
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
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetInput();
    };
  }, [resetInput]);
  
  return {
    petePosition: currentPosition.current,
    setupTouchHandlers,
    resetInput,
    getInputStats,
  };
};