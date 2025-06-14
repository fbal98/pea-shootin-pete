/**
 * In-World Tutorial - Invisible FTUE with animated cues
 * 
 * Replaces complex modal tutorials with simple, in-game visual cues that teach
 * through interaction rather than explanation. Perfect for hyper-casual games.
 * 
 * Features:
 * - Pulsing "TAP!" indicator for shooting
 * - Swipe trail effect for movement guidance  
 * - Contextual hints that appear and fade naturally
 * - No interruption to gameplay flow
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { isFeatureEnabled } from '@/constants/FeatureFlagConfig';
import { UI_PALETTE } from '@/constants/GameColors';
import { Typography, Spacing } from '@/constants/DesignTokens';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface InWorldTutorialProps {
  step: 'tap_to_shoot' | 'swipe_to_move' | 'aim_for_balloons' | 'great_job' | null;
  balloonPosition?: { x: number; y: number }; // Position of first balloon for targeting hint
  onStepCompleted?: (step: string) => void;
}

export const InWorldTutorial: React.FC<InWorldTutorialProps> = ({
  step,
  balloonPosition,
  onStepCompleted,
}) => {
  // Don't show tutorial if feature flag disabled
  if (!isFeatureEnabled('tutorial.animatedCues')) {
    return null;
  }

  // Don't show complex tutorial
  if (isFeatureEnabled('tutorial.complexTutorial')) {
    return null;
  }

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (step) {
      // Fade in the tutorial element
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      // Start pulsing for attention-grabbing steps
      if (step === 'tap_to_shoot' || step === 'aim_for_balloons') {
        const pulseLoop = Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.3,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        );
        pulseLoop.start();

        // Auto-complete after 3 seconds if user doesn't act
        const timer = setTimeout(() => {
          if (onStepCompleted) {
            onStepCompleted(step);
          }
        }, 3000);

        return () => {
          pulseLoop.stop();
          clearTimeout(timer);
        };
      }

      // Auto-fade for non-interactive steps
      if (step === 'great_job') {
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: -30,
              duration: 500,
              useNativeDriver: true,
            }),
          ]).start(() => {
            if (onStepCompleted) {
              onStepCompleted(step);
            }
          });
        }, 1500);
      }
    }
  }, [step]);

  if (!step) return null;

  const renderTutorialContent = () => {
    switch (step) {
      case 'tap_to_shoot':
        return (
          <Animated.View
            style={[
              styles.tapIndicator,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: pulseAnim },
                ],
              },
            ]}
          >
            <Text style={styles.tapText}>TAP!</Text>
            <View style={styles.fingerIcon} />
          </Animated.View>
        );

      case 'swipe_to_move':
        return (
          <Animated.View
            style={[
              styles.swipeIndicator,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.swipeText}>Swipe to move</Text>
            <View style={styles.swipeArrow} />
          </Animated.View>
        );

      case 'aim_for_balloons':
        return balloonPosition ? (
          <Animated.View
            style={[
              styles.aimIndicator,
              {
                left: balloonPosition.x - 30,
                top: balloonPosition.y - 80,
                opacity: fadeAnim,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <Text style={styles.aimText}>Hit me!</Text>
            <View style={styles.aimArrow} />
          </Animated.View>
        ) : null;

      case 'great_job':
        return (
          <Animated.View
            style={[
              styles.congratsIndicator,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.congratsText}>Great!</Text>
            <Text style={styles.congratsSubtext}>Keep popping!</Text>
          </Animated.View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {renderTutorialContent()}
    </View>
  );
};

// Component for swipe trail effect
export const SwipeTrailEffect: React.FC<{
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  visible: boolean;
}> = ({ startX, startY, endX, endY, visible }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && isFeatureEnabled('tutorial.animatedCues')) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(500),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible || !isFeatureEnabled('tutorial.animatedCues')) return null;

  const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
  const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);

  return (
    <Animated.View
      style={[
        styles.swipeTrail,
        {
          left: startX,
          top: startY,
          width: length,
          opacity: fadeAnim,
          transform: [
            { rotate: `${angle}deg` },
            { scaleX: scaleAnim },
          ],
        },
      ]}
      pointerEvents="none"
    />
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },

  // Tap to shoot indicator
  tapIndicator: {
    position: 'absolute',
    bottom: screenHeight * 0.3,
    left: screenWidth * 0.5 - 40,
    alignItems: 'center',
    backgroundColor: UI_PALETTE.primary,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    borderRadius: 20,
    shadowColor: UI_PALETTE.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  tapText: {
    ...Typography.h3,
    color: UI_PALETTE.text_light,
    fontWeight: 'bold',
    marginBottom: Spacing.micro,
  },

  fingerIcon: {
    width: 20,
    height: 20,
    backgroundColor: UI_PALETTE.text_light,
    borderRadius: 10,
    opacity: 0.9,
  },

  // Swipe to move indicator
  swipeIndicator: {
    position: 'absolute',
    bottom: screenHeight * 0.2,
    left: screenWidth * 0.5 - 60,
    alignItems: 'center',
    backgroundColor: UI_PALETTE.secondary,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    borderRadius: 16,
    shadowColor: UI_PALETTE.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  swipeText: {
    ...Typography.body,
    color: UI_PALETTE.text_light,
    fontWeight: '600',
    marginBottom: Spacing.micro,
  },

  swipeArrow: {
    width: 30,
    height: 3,
    backgroundColor: UI_PALETTE.text_light,
    borderRadius: 2,
    opacity: 0.8,
  },

  // Aim indicator (points to balloon)
  aimIndicator: {
    position: 'absolute',
    alignItems: 'center',
    backgroundColor: UI_PALETTE.accent,
    paddingHorizontal: Spacing.small,
    paddingVertical: Spacing.micro,
    borderRadius: 12,
    shadowColor: UI_PALETTE.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },

  aimText: {
    ...Typography.small,
    color: UI_PALETTE.text_light,
    fontWeight: 'bold',
  },

  aimArrow: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -4,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: UI_PALETTE.accent,
  },

  // Congratulations indicator
  congratsIndicator: {
    position: 'absolute',
    top: screenHeight * 0.4,
    left: screenWidth * 0.5 - 80,
    alignItems: 'center',
    backgroundColor: UI_PALETTE.success,
    paddingHorizontal: Spacing.large,
    paddingVertical: Spacing.medium,
    borderRadius: 20,
    shadowColor: UI_PALETTE.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },

  congratsText: {
    ...Typography.h2,
    color: UI_PALETTE.text_light,
    fontWeight: 'bold',
  },

  congratsSubtext: {
    ...Typography.body,
    color: UI_PALETTE.text_light,
    opacity: 0.9,
    marginTop: Spacing.micro,
  },

  // Swipe trail effect
  swipeTrail: {
    position: 'absolute',
    height: 4,
    backgroundColor: UI_PALETTE.primary,
    borderRadius: 2,
    transformOrigin: '0 50%',
    shadowColor: UI_PALETTE.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
});

export default InWorldTutorial;