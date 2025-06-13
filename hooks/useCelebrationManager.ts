/**
 * Celebration Manager Hook - Manages celebration events and triggers
 *
 * Integrates celebration animations with game events:
 * - Achievement unlocks
 * - Level completions
 * - Combo streaks
 * - Battle pass tier ups
 * - Mystery reward collections
 *
 * Provides centralized celebration orchestration.
 */

import { useCallback, useRef } from 'react';
import { Achievement, MysteryReward } from '@/types/MetaProgressionTypes';

export interface CelebrationEvent {
  id: string;
  type: 'achievement' | 'victory' | 'combo' | 'battlepass' | 'mystery_reward';
  props: any;
  priority: number; // Higher priority celebrations can interrupt lower ones
}

export const useCelebrationManager = () => {
  const celebrationQueueRef = useRef<CelebrationEvent[]>([]);
  const activeCelebrationRef = useRef<CelebrationEvent | null>(null);
  const celebrationCallbacksRef = useRef<{
    onCelebrationStart?: (event: CelebrationEvent) => void;
    onCelebrationComplete?: (event: CelebrationEvent) => void;
  }>({});

  // Register celebration event handlers
  const setCelebrationCallbacks = useCallback(
    (callbacks: {
      onCelebrationStart?: (event: CelebrationEvent) => void;
      onCelebrationComplete?: (event: CelebrationEvent) => void;
    }) => {
      celebrationCallbacksRef.current = callbacks;
    },
    []
  );

  // Add celebration to queue
  const queueCelebration = useCallback((event: Omit<CelebrationEvent, 'id'>) => {
    const celebrationEvent: CelebrationEvent = {
      ...event,
      id: `celebration_${Date.now()}_${Math.random()}`,
    };

    // Check if this celebration should interrupt current one
    const currentCelebration = activeCelebrationRef.current;
    if (currentCelebration && event.priority > currentCelebration.priority) {
      // Interrupt current celebration
      celebrationQueueRef.current = [celebrationEvent, ...celebrationQueueRef.current];
      celebrationCallbacksRef.current.onCelebrationComplete?.(currentCelebration);
    } else {
      // Add to queue
      celebrationQueueRef.current.push(celebrationEvent);
    }

    // Start next celebration if nothing is playing
    if (!activeCelebrationRef.current) {
      processNextCelebration();
    }
  }, []);

  // Process next celebration in queue
  const processNextCelebration = useCallback(() => {
    if (celebrationQueueRef.current.length === 0) {
      activeCelebrationRef.current = null;
      return;
    }

    // Get highest priority celebration
    celebrationQueueRef.current.sort((a, b) => b.priority - a.priority);
    const nextCelebration = celebrationQueueRef.current.shift()!;

    activeCelebrationRef.current = nextCelebration;
    celebrationCallbacksRef.current.onCelebrationStart?.(nextCelebration);
  }, []);

  // Complete current celebration and start next
  const completeCelebration = useCallback(
    (celebrationId: string) => {
      const currentCelebration = activeCelebrationRef.current;
      if (currentCelebration && currentCelebration.id === celebrationId) {
        celebrationCallbacksRef.current.onCelebrationComplete?.(currentCelebration);
        activeCelebrationRef.current = null;

        // Start next celebration
        setTimeout(() => {
          processNextCelebration();
        }, 300); // Brief pause between celebrations
      }
    },
    [processNextCelebration]
  );

  // Convenience methods for specific celebration types
  const celebrateAchievement = useCallback(
    (achievement: Achievement) => {
      queueCelebration({
        type: 'achievement',
        priority:
          achievement.rarity === 'legendary'
            ? 100
            : achievement.rarity === 'epic'
              ? 80
              : achievement.rarity === 'rare'
                ? 60
                : 40,
        props: { achievement },
      });
    },
    [queueCelebration]
  );

  const celebrateLevelVictory = useCallback(
    (level: number, score: number, starsEarned: number) => {
      queueCelebration({
        type: 'victory',
        priority: starsEarned === 3 ? 90 : 70,
        props: { level, score, starsEarned },
      });
    },
    [queueCelebration]
  );

  const celebrateComboStreak = useCallback(
    (combo: number, multiplier: number) => {
      // Only celebrate significant combos to avoid spam
      if (combo >= 5) {
        queueCelebration({
          type: 'combo',
          priority: combo >= 15 ? 50 : combo >= 10 ? 30 : 20,
          props: { combo, multiplier },
        });
      }
    },
    [queueCelebration]
  );

  const celebrateBattlePassTierUp = useCallback(
    (newTier: number, rewards: any[]) => {
      queueCelebration({
        type: 'battlepass',
        priority: 85,
        props: { newTier, rewards },
      });
    },
    [queueCelebration]
  );

  const celebrateMysteryReward = useCallback((reward: MysteryReward, x: number, y: number) => {
    // Mystery rewards use the existing MysteryRewardDisplay system
    // This is just for tracking purposes
    const priority =
      reward.rarity === 'legendary'
        ? 95
        : reward.rarity === 'epic'
          ? 75
          : reward.rarity === 'rare'
            ? 55
            : 35;

    // Don't queue mystery rewards as they have their own display system
    // Just track for analytics
    console.log(`Mystery reward celebrated: ${reward.type} (${reward.rarity}) at ${x},${y}`);
  }, []);

  // Clear all celebrations (for game reset, etc.)
  const clearCelebrations = useCallback(() => {
    celebrationQueueRef.current = [];
    const currentCelebration = activeCelebrationRef.current;
    if (currentCelebration) {
      celebrationCallbacksRef.current.onCelebrationComplete?.(currentCelebration);
      activeCelebrationRef.current = null;
    }
  }, []);

  // Get current celebration state
  const getCurrentCelebration = useCallback(() => {
    return activeCelebrationRef.current;
  }, []);

  const getQueueLength = useCallback(() => {
    return celebrationQueueRef.current.length;
  }, []);

  return {
    // Core functionality
    setCelebrationCallbacks,
    queueCelebration,
    completeCelebration,
    clearCelebrations,

    // Convenience methods
    celebrateAchievement,
    celebrateLevelVictory,
    celebrateComboStreak,
    celebrateBattlePassTierUp,
    celebrateMysteryReward,

    // State queries
    getCurrentCelebration,
    getQueueLength,
  };
};

export default useCelebrationManager;
