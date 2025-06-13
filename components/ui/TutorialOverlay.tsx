/**
 * Tutorial Overlay - Interactive tutorial UI components
 *
 * Provides various tutorial overlay types:
 * - Modal tutorials with step progression
 * - Tooltip guidance with arrows
 * - Spotlight highlighting with backdrop
 * - Guided interactions with visual cues
 *
 * Designed for seamless integration and maximum engagement.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Modal,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  TutorialStep,
  TutorialOverlayProps,
  TutorialTooltipProps,
  TutorialSpotlightProps,
  HighlightArea,
} from '@/types/TutorialTypes';
import { getColorScheme } from '@/constants/GameColors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Main Tutorial Overlay Component
export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  step,
  onNext,
  onSkip,
  onComplete,
  progress,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 120,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleNext = () => {
    if (progress.current === progress.total) {
      onComplete();
    } else {
      onNext();
    }
  };

  const handleSkip = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onSkip();
    });
  };

  if (step.type === 'modal') {
    return (
      <Modal visible={true} transparent={true} animationType="none" onRequestClose={handleSkip}>
        <View style={styles.modalBackdrop}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{step.title}</Text>
              {step.skipAllowed && (
                <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                  <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.modalDescription}>{step.description}</Text>

            {/* Progress indicator */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(progress.current / progress.total) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {progress.current} of {progress.total}
              </Text>
            </View>

            <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
              <Text style={styles.nextButtonText}>
                {progress.current === progress.total ? 'Complete' : 'Next'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    );
  }

  return null;
};

// Tooltip Component
export const TutorialTooltip: React.FC<TutorialTooltipProps> = ({
  step,
  targetRef,
  onDismiss,
  visible,
}) => {
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(-10)).current;

  useEffect(() => {
    if (visible) {
      // Calculate position relative to target
      if (targetRef.current) {
        targetRef.current.measure(
          (fx: number, fy: number, width: number, height: number, px: number, py: number) => {
            const tooltipWidth = 250;
            const tooltipHeight = 80;

            let x = px + width / 2 - tooltipWidth / 2;
            let y = py - tooltipHeight - 10; // Above target by default

            // Adjust for arrow direction
            if (step.arrow === 'down') {
              y = py + height + 10;
            } else if (step.arrow === 'left') {
              x = px - tooltipWidth - 10;
              y = py + height / 2 - tooltipHeight / 2;
            } else if (step.arrow === 'right') {
              x = px + width + 10;
              y = py + height / 2 - tooltipHeight / 2;
            }

            // Keep within screen bounds
            x = Math.max(10, Math.min(screenWidth - tooltipWidth - 10, x));
            y = Math.max(10, Math.min(screenHeight - tooltipHeight - 10, y));

            setTooltipPosition({ x, y });
          }
        );
      }

      // Show animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Hide animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateAnim, {
          toValue: -10,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.tooltipContainer,
        {
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          opacity: fadeAnim,
          transform: [
            {
              translateY:
                step.arrow === 'up'
                  ? translateAnim
                  : step.arrow === 'down'
                    ? Animated.multiply(translateAnim, -1)
                    : 0,
            },
            {
              translateX:
                step.arrow === 'left'
                  ? translateAnim
                  : step.arrow === 'right'
                    ? Animated.multiply(translateAnim, -1)
                    : 0,
            },
          ],
        },
      ]}
    >
      {/* Arrow */}
      {step.arrow && step.arrow !== 'none' && (
        <View
          style={[
            styles.arrow,
            step.arrow === 'up' && styles.arrowUp,
            step.arrow === 'down' && styles.arrowDown,
            step.arrow === 'left' && styles.arrowLeft,
            step.arrow === 'right' && styles.arrowRight,
          ]}
        />
      )}

      <Text style={styles.tooltipTitle}>{step.title}</Text>
      <Text style={styles.tooltipDescription}>{step.description}</Text>

      <TouchableOpacity onPress={onDismiss} style={styles.tooltipButton}>
        <Text style={styles.tooltipButtonText}>Got it!</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Spotlight Component
export const TutorialSpotlight: React.FC<TutorialSpotlightProps> = ({
  step,
  targetArea,
  onInteraction,
}) => {
  const [spotlightDimensions, setSpotlightDimensions] = useState({
    width: 100,
    height: 100,
    x: 0,
    y: 0,
  });
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start pulsing animation
    if (targetArea.animation === 'pulse') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, []);

  const renderSpotlight = () => {
    const { shape, padding } = targetArea;
    const { width, height, x, y } = spotlightDimensions;

    const spotlightStyle = {
      position: 'absolute' as const,
      left: x - padding,
      top: y - padding,
      width: width + padding * 2,
      height: height + padding * 2,
      borderWidth: 3,
      borderColor: '#4ECDC4',
    };

    let borderRadius = 0;
    if (shape === 'circle') {
      borderRadius = (width + padding * 2) / 2;
    } else if (shape === 'rounded_rectangle') {
      borderRadius = 12;
    }

    const finalSpotlightStyle = {
      ...spotlightStyle,
      borderRadius,
    };

    return (
      <Animated.View
        style={[
          finalSpotlightStyle,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
    );
  };

  return (
    <View style={styles.spotlightContainer}>
      {/* Dark backdrop */}
      <TouchableWithoutFeedback onPress={onInteraction}>
        <View style={styles.spotlightBackdrop} />
      </TouchableWithoutFeedback>

      {/* Spotlight highlight */}
      {renderSpotlight()}

      {/* Instruction text */}
      <View style={styles.spotlightInstructions}>
        <Text style={styles.spotlightTitle}>{step.title}</Text>
        <Text style={styles.spotlightDescription}>{step.description}</Text>
      </View>
    </View>
  );
};

// Hook for managing tutorial state
export const useTutorial = () => {
  const [currentStep, setCurrentStep] = useState<TutorialStep | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const showTutorial = (step: TutorialStep) => {
    setCurrentStep(step);
    setIsVisible(true);
  };

  const hideTutorial = () => {
    setIsVisible(false);
    setCurrentStep(null);
  };

  return {
    currentStep,
    isVisible,
    showTutorial,
    hideTutorial,
  };
};

const styles = StyleSheet.create({
  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    maxWidth: 340,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },

  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  skipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },

  modalDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 24,
  },

  progressContainer: {
    marginBottom: 24,
  },

  progressBar: {
    height: 6,
    backgroundColor: '#E5E5E5',
    borderRadius: 3,
    marginBottom: 8,
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#4ECDC4',
    borderRadius: 3,
  },

  progressText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },

  nextButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },

  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },

  // Tooltip styles
  tooltipContainer: {
    position: 'absolute',
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 16,
    maxWidth: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },

  tooltipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },

  tooltipDescription: {
    fontSize: 12,
    color: '#E5E5E5',
    lineHeight: 18,
    marginBottom: 12,
  },

  tooltipButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },

  tooltipButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },

  // Arrow styles
  arrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
  },

  arrowUp: {
    bottom: -8,
    left: '50%',
    marginLeft: -8,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#333',
  },

  arrowDown: {
    top: -8,
    left: '50%',
    marginLeft: -8,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#333',
  },

  arrowLeft: {
    right: -8,
    top: '50%',
    marginTop: -8,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#333',
  },

  arrowRight: {
    left: -8,
    top: '50%',
    marginTop: -8,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderRightWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: '#333',
  },

  // Spotlight styles
  spotlightContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },

  spotlightBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },

  spotlightInstructions: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },

  spotlightTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },

  spotlightDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    textAlign: 'center',
  },
});

export default TutorialOverlay;
