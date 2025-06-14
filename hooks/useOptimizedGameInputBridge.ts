/**
 * Bridge hook that provides the optimized input system with the existing API
 * This allows us to use the advanced gesture handling while maintaining compatibility
 */

import { useCallback, useRef, useEffect } from 'react';
import { GestureResponderEvent } from 'react-native';
import { useGameOver } from '@/store/gameStore';
import { GAME_CONFIG } from '@/constants/GameConfig';
import { ErrorLogger } from '@/utils/errorLogger';

interface TouchInputConfig {
  debounceMs: number;
  disabled?: boolean;
}

interface ActiveTouch {
  id: string;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startTime: number;
  isMovementTouch: boolean;
}

const DEFAULT_CONFIG: TouchInputConfig = {
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

  // Multi-touch tracking state
  const activeTouches = useRef<Map<string, ActiveTouch>>(new Map());
  const movementTouchId = useRef<string | null>(null);
  const lastUpdateTime = useRef<number>(0);
  const lastShootTime = useRef<number>(0);


  /**
   * Update Pete's position directly
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
    
    // Apply bounds checking and update directly
    const boundedX = Math.max(0, Math.min(screenWidth - GAME_CONFIG.PETE_SIZE, x));
    lastUpdateTime.current = timestamp;
    
    // Call the position update callback directly
    updatePetePosition(boundedX);
  }, [
    screenWidth,
    inputConfig.debounceMs,
    updatePetePosition
  ]);

  // Handle touch start - New two-finger system
  const handleTouchStart = useCallback(
    (event: GestureResponderEvent) => {
      try {
        if (gameOver || inputConfig.disabled) return;

        const { changedTouches } = event.nativeEvent;
        const timestamp = performance.now();
        
        // Process all new touches
        changedTouches?.forEach((touch) => {
          const { locationX, locationY, identifier } = touch;
          const touchId = identifier.toString();
          
          // Check if this is the first touch (movement touch) or additional touch (shooting touch)
          const isFirstTouch = activeTouches.current.size === 0;
          
          const newTouch: ActiveTouch = {
            id: touchId,
            startX: locationX,
            startY: locationY,
            currentX: locationX,
            currentY: locationY,
            startTime: timestamp,
            isMovementTouch: isFirstTouch,
          };
          
          activeTouches.current.set(touchId, newTouch);
          
          if (isFirstTouch) {
            // First touch - set as movement touch and start position tracking
            movementTouchId.current = touchId;
            updatePetePositionOptimized(locationX, timestamp);
          } else {
            // Additional touch - shoot projectile
            // Debounce rapid shooting
            if (timestamp - lastShootTime.current > inputConfig.debounceMs * 2) {
              shootProjectile();
              lastShootTime.current = timestamp;
            }
          }
        });
      } catch (error) {
        ErrorLogger.logGameLogicError(
          error instanceof Error ? error : new Error(String(error)),
          'optimized_touch_start',
          { screenWidth }
        );
      }
    },
    [gameOver, shootProjectile, updatePetePositionOptimized, screenWidth, inputConfig.debounceMs]
  );

  // Handle touch move - Only move Pete when movement touch moves
  const handleTouchMove = useCallback(
    (event: GestureResponderEvent) => {
      try {
        if (gameOver || inputConfig.disabled) return;

        const { changedTouches } = event.nativeEvent;
        const timestamp = performance.now();
        
        // Process all moving touches
        changedTouches?.forEach((touch) => {
          const { locationX, locationY, identifier } = touch;
          const touchId = identifier.toString();
          
          // Only process movement if this is the designated movement touch
          if (touchId === movementTouchId.current) {
            const activeTouch = activeTouches.current.get(touchId);
            if (activeTouch) {
              // Update touch position
              activeTouch.currentX = locationX;
              activeTouch.currentY = locationY;
              activeTouches.current.set(touchId, activeTouch);
              
              // Update Pete's position
              updatePetePositionOptimized(locationX, timestamp);
            }
          }
          // Update position for other touches but don't move Pete
          else {
            const activeTouch = activeTouches.current.get(touchId);
            if (activeTouch) {
              activeTouch.currentX = locationX;
              activeTouch.currentY = locationY;
              activeTouches.current.set(touchId, activeTouch);
            }
          }
        });
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

  // Handle touch end - Clean up multi-touch state
  const handleTouchEnd = useCallback(
    (event: GestureResponderEvent) => {
      try {
        if (inputConfig.disabled) return;
        const { changedTouches } = event.nativeEvent;
        
        // Process all ending touches
        changedTouches?.forEach((touch) => {
          const { identifier } = touch;
          const touchId = identifier.toString();
          
          // Remove this touch from active touches
          const activeTouch = activeTouches.current.get(touchId);
          if (activeTouch) {
            activeTouches.current.delete(touchId);
            
            // If this was the movement touch, clear movement tracking
            if (touchId === movementTouchId.current) {
              movementTouchId.current = null;
              
              // If there are other touches remaining, promote the first one to movement touch
              if (activeTouches.current.size > 0) {
                const remainingTouches = Array.from(activeTouches.current.values());
                const newMovementTouch = remainingTouches[0];
                movementTouchId.current = newMovementTouch.id;
                newMovementTouch.isMovementTouch = true;
                activeTouches.current.set(newMovementTouch.id, newMovementTouch);
                
                // Update Pete's position to the new movement touch position
                updatePetePositionOptimized(newMovementTouch.currentX, performance.now());
              }
            }
          }
        });
      } catch (error) {
        ErrorLogger.logGameLogicError(
          error instanceof Error ? error : new Error(String(error)),
          'optimized_touch_end',
          { screenWidth }
        );
      }
    },
    [screenWidth, updatePetePositionOptimized]
  );



  // Reset input state
  const resetInput = useCallback(() => {
    activeTouches.current.clear();
    movementTouchId.current = null;
    lastUpdateTime.current = 0;
    lastShootTime.current = 0;
  }, []);

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
    resetInput,
  };
};