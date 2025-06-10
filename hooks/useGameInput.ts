import { useCallback, useRef, useState } from 'react';
import { GestureResponderEvent, Animated, Easing } from 'react-native';
import { useGameOver } from '@/store/gameStore';
import { GAME_CONFIG } from '@/constants/GameConfig';
import { safeHapticFeedback, ErrorLogger } from '@/utils/errorLogger';
import * as Haptics from 'expo-haptics';

interface RipplePosition {
  x: number;
  y: number;
}

export const useGameInput = (
  screenWidth: number,
  shootProjectile: () => void,
  updatePetePosition: (x: number) => void
) => {
  // Get UI state
  const gameOver = useGameOver();

  // Ripple effect state
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;
  const [ripplePosition, setRipplePosition] = useState<RipplePosition>({ x: 0, y: 0 });

  // Throttling refs
  const lastMoveTime = useRef<number>(0);
  const lastHapticTime = useRef<number>(0);

  // Show ripple effect at touch position
  const showRippleEffect = useCallback(
    (x: number, y: number) => {
      try {
        setRipplePosition({ x, y });

        rippleAnim.setValue(0);
        rippleOpacity.setValue(1);

        Animated.parallel([
          Animated.timing(rippleAnim, {
            toValue: 1,
            duration: GAME_CONFIG.RIPPLE_DURATION,
            useNativeDriver: true,
            easing: Easing.out(Easing.quad),
          }),
          Animated.timing(rippleOpacity, {
            toValue: 0,
            duration: GAME_CONFIG.RIPPLE_DURATION,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
          }),
        ]).start();
      } catch (error) {
        ErrorLogger.logAnimationError(
          error instanceof Error ? error : new Error(String(error)),
          'GameInput',
          'ripple_effect'
        );
      }
    },
    [rippleAnim, rippleOpacity]
  );

  // Handle game touch (tap to shoot and move Pete)
  const handleGameTouch = useCallback(
    (x: number, y: number) => {
      try {
        if (gameOver) return;

        // Haptic feedback with throttling
        const now = Date.now();
        if (now - lastHapticTime.current >= GAME_CONFIG.HAPTIC_THROTTLE_MS) {
          lastHapticTime.current = now;
          safeHapticFeedback(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 'Touch');
        }

        // Show visual feedback
        showRippleEffect(x, y);

        // Move Pete to tap position (immediate response)
        const newX = Math.max(
          0,
          Math.min(x - GAME_CONFIG.PETE_SIZE / 2, screenWidth - GAME_CONFIG.PETE_SIZE)
        );

        updatePetePosition(newX);

        // Shoot projectile
        shootProjectile();
      } catch (error) {
        ErrorLogger.logGameLogicError(
          error instanceof Error ? error : new Error(String(error)),
          'handle_touch',
          { x, y, screenWidth }
        );
      }
    },
    [gameOver, screenWidth, showRippleEffect, shootProjectile, updatePetePosition]
  );

  // Handle touch events from React Native
  const handleTouch = useCallback(
    (event: GestureResponderEvent) => {
      const { locationX, locationY } = event.nativeEvent;
      handleGameTouch(locationX, locationY);
    },
    [handleGameTouch]
  );

  // Update Pete position with throttling (for drag movement)
  const updatePetePositionThrottled = useCallback(
    (x: number) => {
      try {
        const now = Date.now();
        if (now - lastMoveTime.current < GAME_CONFIG.PETE_MOVE_THROTTLE_MS) return;
        lastMoveTime.current = now;

        if (gameOver) return;

        const newX = Math.max(
          0,
          Math.min(x - GAME_CONFIG.PETE_SIZE / 2, screenWidth - GAME_CONFIG.PETE_SIZE)
        );

        updatePetePosition(newX);
      } catch (error) {
        ErrorLogger.logGameLogicError(
          error instanceof Error ? error : new Error(String(error)),
          'update_pete_position',
          { x, screenWidth }
        );
      }
    },
    [gameOver, screenWidth, updatePetePosition]
  );

  // Handle drag movement (touch move)
  const handleTouchMove = useCallback(
    (event: GestureResponderEvent) => {
      const { locationX } = event.nativeEvent;
      updatePetePositionThrottled(locationX);
    },
    [updatePetePositionThrottled]
  );

  return {
    // Touch handlers
    handleTouch,
    handleTouchMove,

    // Ripple effect
    rippleAnim,
    rippleOpacity,
    ripplePosition,

    // Direct touch handler for custom usage
    handleGameTouch,
  };
};
