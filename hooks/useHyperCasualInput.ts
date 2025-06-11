import { useCallback, useRef } from 'react';
import { GestureResponderEvent } from 'react-native';
import { useGameOver } from '@/store/gameStore';
import { GAME_CONFIG } from '@/constants/GameConfig';
import { ErrorLogger } from '@/utils/errorLogger';

export const useHyperCasualInput = (
  screenWidth: number,
  shootProjectile: () => void,
  updatePetePosition: (x: number) => void
) => {
  const gameOver = useGameOver();
  
  // Track touch state for smooth swipe controls
  const touchStartX = useRef<number>(0);
  const lastTouchX = useRef<number>(0);
  const isTouching = useRef<boolean>(false);
  
  // Smoothing for swipe movement
  const targetPeteX = useRef<number>(screenWidth / 2 - GAME_CONFIG.PETE_SIZE / 2);
  const currentPeteX = useRef<number>(screenWidth / 2 - GAME_CONFIG.PETE_SIZE / 2);
  const smoothingFactor = 0.2; // How quickly Pete follows touch (0-1)

  // Handle touch start
  const handleTouchStart = useCallback(
    (event: GestureResponderEvent) => {
      try {
        if (gameOver) return;
        
        const { locationX } = event.nativeEvent;
        touchStartX.current = locationX;
        lastTouchX.current = locationX;
        isTouching.current = true;
        
        // Shoot on tap
        shootProjectile();
      } catch (error) {
        ErrorLogger.logGameLogicError(
          error instanceof Error ? error : new Error(String(error)),
          'touch_start',
          { screenWidth }
        );
      }
    },
    [gameOver, shootProjectile]
  );

  // Handle swipe movement
  const handleTouchMove = useCallback(
    (event: GestureResponderEvent) => {
      try {
        if (gameOver || !isTouching.current) return;
        
        const { locationX } = event.nativeEvent;
        const deltaX = locationX - lastTouchX.current;
        lastTouchX.current = locationX;
        
        // Update target position based on swipe delta
        targetPeteX.current = Math.max(
          0,
          Math.min(
            targetPeteX.current + deltaX,
            screenWidth - GAME_CONFIG.PETE_SIZE
          )
        );
        
        // Smooth interpolation to target
        currentPeteX.current += (targetPeteX.current - currentPeteX.current) * smoothingFactor;
        updatePetePosition(currentPeteX.current);
      } catch (error) {
        ErrorLogger.logGameLogicError(
          error instanceof Error ? error : new Error(String(error)),
          'touch_move',
          { screenWidth }
        );
      }
    },
    [gameOver, screenWidth, updatePetePosition]
  );

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    isTouching.current = false;
  }, []);

  // Smooth animation frame update
  const updateSmoothing = useCallback(() => {
    if (!isTouching.current && Math.abs(targetPeteX.current - currentPeteX.current) > 0.5) {
      currentPeteX.current += (targetPeteX.current - currentPeteX.current) * smoothingFactor;
      updatePetePosition(currentPeteX.current);
    }
  }, [updatePetePosition]);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    updateSmoothing,
  };
};