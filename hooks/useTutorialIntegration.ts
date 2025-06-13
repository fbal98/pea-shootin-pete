/**
 * Tutorial Integration Hook - Connects tutorial system with gameplay
 *
 * Provides seamless integration between:
 * - Game events and tutorial triggers
 * - UI components and tutorial targets
 * - Progress tracking and tutorial completion
 * - Context-aware tutorial timing
 *
 * Designed for non-intrusive, contextual guidance.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { tutorialManager } from '@/systems/TutorialManager';
import { TutorialStep, TutorialTriggerEvent } from '@/types/TutorialTypes';
import { useMetaProgressionActions, usePlayerMetaProgress } from '@/store/metaProgressionStore';
import {
  useCurrentLevel,
  useLevelCompleted,
  useLevelFailed,
  useCurrentCombo,
} from '@/store/levelProgressionStore';

interface TutorialIntegrationState {
  currentTutorial: TutorialStep | null;
  isShowingTutorial: boolean;
  tutorialTargets: Map<string, React.RefObject<any>>;
}

export const useTutorialIntegration = () => {
  const [state, setState] = useState<TutorialIntegrationState>({
    currentTutorial: null,
    isShowingTutorial: false,
    tutorialTargets: new Map(),
  });

  // Game state for tutorial triggers
  const currentLevel = useCurrentLevel();
  const levelCompleted = useLevelCompleted();
  const levelFailed = useLevelFailed();
  const currentCombo = useCurrentCombo();
  const metaProgress = usePlayerMetaProgress();
  const metaActions = useMetaProgressionActions();

  // Refs for tracking tutorial events
  const hasTriggeredFirstGame = useRef(false);
  const hasTriggeredMysteryBalloon = useRef(false);
  const hasTriggeredDailyChallenge = useRef(false);
  const lastCombo = useRef(0);

  // Initialize tutorial system
  useEffect(() => {
    // Set up tutorial event listeners
    tutorialManager.addEventListener('step_shown', handleTutorialStepShown);
    tutorialManager.addEventListener('tutorial_completed', handleTutorialCompleted);
    tutorialManager.addEventListener('tutorial_skipped', handleTutorialSkipped);

    // Check for first-time player
    if (!metaProgress || metaProgress.firstPlayDate === metaProgress.lastPlayDate) {
      triggerFirstGameTutorial();
    }

    return () => {
      tutorialManager.removeEventListener('step_shown', handleTutorialStepShown);
      tutorialManager.removeEventListener('tutorial_completed', handleTutorialCompleted);
      tutorialManager.removeEventListener('tutorial_skipped', handleTutorialSkipped);
    };
  }, []);

  // Monitor game events for tutorial triggers
  useEffect(() => {
    // Level start events
    if (currentLevel && !hasTriggeredFirstGame.current) {
      triggerEvent('level_start', { levelId: currentLevel.id });
    }
  }, [currentLevel]);

  useEffect(() => {
    // Level completion events
    if (levelCompleted) {
      triggerEvent('level_complete', { levelId: currentLevel?.id });
    }
  }, [levelCompleted]);

  useEffect(() => {
    // Combo achievement events
    if (currentCombo > lastCombo.current && currentCombo >= 5) {
      triggerEvent('combo_achieved', { combo: currentCombo });
    }
    lastCombo.current = currentCombo;
  }, [currentCombo]);

  // Tutorial event handlers
  const handleTutorialStepShown = useCallback((step: TutorialStep) => {
    setState(prev => ({
      ...prev,
      currentTutorial: step,
      isShowingTutorial: true,
    }));
  }, []);

  const handleTutorialCompleted = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentTutorial: null,
      isShowingTutorial: false,
    }));
  }, []);

  const handleTutorialSkipped = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentTutorial: null,
      isShowingTutorial: false,
    }));
  }, []);

  // Tutorial trigger functions
  const triggerFirstGameTutorial = useCallback(() => {
    if (!hasTriggeredFirstGame.current) {
      hasTriggeredFirstGame.current = true;
      tutorialManager.startTutorial('first_game');
    }
  }, []);

  const triggerMysteryBalloonTutorial = useCallback(() => {
    if (!hasTriggeredMysteryBalloon.current) {
      hasTriggeredMysteryBalloon.current = true;
      triggerEvent('first_mystery_balloon');
    }
  }, []);

  const triggerDailyChallengesTutorial = useCallback(() => {
    if (!hasTriggeredDailyChallenge.current) {
      hasTriggeredDailyChallenge.current = true;
      triggerEvent('challenge_available');
    }
  }, []);

  // Event triggering
  const triggerEvent = useCallback((event: TutorialTriggerEvent, parameters?: any) => {
    tutorialManager.onTutorialEvent(event, parameters);
  }, []);

  // Tutorial step completion
  const completeTutorialStep = useCallback(
    (stepId?: string) => {
      if (stepId) {
        tutorialManager.completeTutorialStep(stepId);
      } else if (state.currentTutorial) {
        tutorialManager.completeTutorialStep(state.currentTutorial.id);
      }
    },
    [state.currentTutorial]
  );

  // Tutorial skipping
  const skipCurrentTutorial = useCallback(() => {
    const currentTutorialSeries = tutorialManager.getCurrentTutorial();
    if (currentTutorialSeries) {
      tutorialManager.skipTutorial(currentTutorialSeries.id);
    }
  }, []);

  // Target element registration
  const registerTutorialTarget = useCallback((targetId: string, ref: React.RefObject<any>) => {
    setState(prev => {
      const newTargets = new Map(prev.tutorialTargets);
      newTargets.set(targetId, ref);
      return {
        ...prev,
        tutorialTargets: newTargets,
      };
    });
  }, []);

  const unregisterTutorialTarget = useCallback((targetId: string) => {
    setState(prev => {
      const newTargets = new Map(prev.tutorialTargets);
      newTargets.delete(targetId);
      return {
        ...prev,
        tutorialTargets: newTargets,
      };
    });
  }, []);

  const getTutorialTarget = useCallback(
    (targetId: string) => {
      return state.tutorialTargets.get(targetId);
    },
    [state.tutorialTargets]
  );

  // Context-aware tutorial suggestions
  const checkContextualTutorials = useCallback(() => {
    // Check if player seems stuck and might need help
    if (metaProgress) {
      const playTime = metaProgress.totalPlaytime;
      const shotsHit = metaProgress.shotsHit;
      const shotsFired = metaProgress.shotsFired;
      const accuracy = shotsFired > 0 ? (shotsHit / shotsFired) * 100 : 0;

      // Low accuracy after sufficient playtime - suggest aiming tutorial
      if (playTime > 60000 && shotsFired > 50 && accuracy < 50) {
        // Could trigger an aiming tips tutorial
        console.log('Player might benefit from aiming tutorial');
      }

      // No mystery balloons collected after playtime - emphasize feature
      if (playTime > 120000 && !hasTriggeredMysteryBalloon.current) {
        triggerMysteryBalloonTutorial();
      }
    }
  }, [metaProgress, triggerMysteryBalloonTutorial]);

  // Periodically check for contextual tutorials
  useEffect(() => {
    const interval = setInterval(checkContextualTutorials, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [checkContextualTutorials]);

  // Tutorial progress tracking for specific game events
  const trackTutorialProgress = useCallback(
    (action: string, metadata?: any) => {
      // Track specific actions that might complete tutorial objectives
      if (state.currentTutorial) {
        const step = state.currentTutorial;

        // Check if this action completes the tutorial step
        if (step.actionRequired) {
          const required = step.actionRequired;

          switch (required.type) {
            case 'tap':
              if (action === 'tap') {
                completeTutorialStep();
              }
              break;
            case 'swipe':
              if (action === 'swipe') {
                completeTutorialStep();
              }
              break;
            case 'observe':
              if (action === required.target) {
                completeTutorialStep();
              }
              break;
          }
        }
      }
    },
    [state.currentTutorial, completeTutorialStep]
  );

  // Special tutorial triggers for mystery balloons
  const onMysteryBalloonSpawned = useCallback(() => {
    triggerEvent('mystery_balloon_spawn');
    triggerMysteryBalloonTutorial();
  }, [triggerEvent, triggerMysteryBalloonTutorial]);

  // Achievement unlock tutorial trigger
  const onAchievementUnlocked = useCallback(
    (achievementId: string) => {
      triggerEvent('achievement_unlock', { achievementId });
    },
    [triggerEvent]
  );

  // Battle pass tier up tutorial trigger
  const onBattlePassTierUp = useCallback(
    (newTier: number) => {
      triggerEvent('battle_pass_tier_up', { tier: newTier });
    },
    [triggerEvent]
  );

  // Daily challenge available tutorial trigger
  const onDailyChallengeAvailable = useCallback(() => {
    triggerDailyChallengesTutorial();
  }, [triggerDailyChallengesTutorial]);

  return {
    // State
    currentTutorial: state.currentTutorial,
    isShowingTutorial: state.isShowingTutorial,

    // Tutorial control
    completeTutorialStep,
    skipCurrentTutorial,

    // Target management
    registerTutorialTarget,
    unregisterTutorialTarget,
    getTutorialTarget,

    // Event tracking
    trackTutorialProgress,

    // Specific triggers
    onMysteryBalloonSpawned,
    onAchievementUnlocked,
    onBattlePassTierUp,
    onDailyChallengeAvailable,

    // Manual triggers
    triggerFirstGameTutorial,
    triggerMysteryBalloonTutorial,
    triggerDailyChallengesTutorial,

    // Utility
    triggerEvent,
    checkContextualTutorials,
  };
};

// Hook for tutorial target components
export const useTutorialTarget = (targetId: string) => {
  const targetRef = useRef(null);
  const { registerTutorialTarget, unregisterTutorialTarget } = useTutorialIntegration();

  useEffect(() => {
    registerTutorialTarget(targetId, targetRef);
    return () => unregisterTutorialTarget(targetId);
  }, [targetId, registerTutorialTarget, unregisterTutorialTarget]);

  return targetRef;
};

export default useTutorialIntegration;
