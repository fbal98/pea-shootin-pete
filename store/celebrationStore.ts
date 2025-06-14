/**
 * Celebration Store - Centralized celebration state management
 *
 * Manages all celebration events including:
 * - Level victory celebrations with star ratings
 * - Achievement unlocks with confetti
 * - Combo streak celebrations
 * - Mystery reward reveals
 * - Battle pass tier ups
 *
 * Used by CelebrationManager to render celebrations consistently.
 */

import { create } from 'zustand';
// Removed nanoid dependency - using fast UUID generation instead
import { generateFastId } from '@/utils/ObjectPool';
import { Achievement, MysteryReward } from '@/types/MetaProgressionTypes';

export interface VictoryCelebration {
  id: string;
  level: number;
  score: number;
  starsEarned: number;
  onComplete: () => void;
}

export interface AchievementCelebrationData {
  id: string;
  achievement: Achievement;
  onComplete: () => void;
}

export interface ComboCelebration {
  id: string;
  combo: number;
  multiplier: number;
  onComplete: () => void;
}

export interface MysteryRewardCelebration {
  id: string;
  reward: MysteryReward;
  x: number;
  y: number;
  onComplete: () => void;
}

export interface BattlePassCelebration {
  id: string;
  newTier: number;
  rewards: any[];
  onComplete: () => void;
}

export interface CelebrationState {
  // Active celebrations
  victoryCelebrations: VictoryCelebration[];
  achievementCelebrations: AchievementCelebrationData[];
  comboCelebrations: ComboCelebration[];
  mysteryRewardCelebrations: MysteryRewardCelebration[];
  battlePassCelebrations: BattlePassCelebration[];

  // Actions
  addVictoryCelebration: (celebration: Omit<VictoryCelebration, 'id'>) => string;
  addAchievementCelebration: (celebration: Omit<AchievementCelebrationData, 'id'>) => string;
  addComboCelebration: (celebration: Omit<ComboCelebration, 'id'>) => string;
  addMysteryRewardCelebration: (celebration: Omit<MysteryRewardCelebration, 'id'>) => string;
  addBattlePassCelebration: (celebration: Omit<BattlePassCelebration, 'id'>) => string;

  removeCelebration: (
    type: 'victory' | 'achievement' | 'combo' | 'mysteryReward' | 'battlePass',
    id: string
  ) => void;
  clearAllCelebrations: () => void;
}

export const useCelebrationStore = create<CelebrationState>((set, get) => ({
  // Initial state
  victoryCelebrations: [],
  achievementCelebrations: [],
  comboCelebrations: [],
  mysteryRewardCelebrations: [],
  battlePassCelebrations: [],

  // Actions
  addVictoryCelebration: celebration => {
    const id = `victory_${generateFastId()}`;
    const fullCelebration = { ...celebration, id };

    set(state => ({
      victoryCelebrations: [...state.victoryCelebrations, fullCelebration],
    }));

    return id;
  },

  addAchievementCelebration: celebration => {
    const id = `achievement_${generateFastId()}`;
    const fullCelebration = { ...celebration, id };

    set(state => ({
      achievementCelebrations: [...state.achievementCelebrations, fullCelebration],
    }));

    return id;
  },

  addComboCelebration: celebration => {
    const id = `combo_${generateFastId()}`;
    const fullCelebration = { ...celebration, id };

    set(state => ({
      comboCelebrations: [...state.comboCelebrations, fullCelebration],
    }));

    return id;
  },

  addMysteryRewardCelebration: celebration => {
    const id = `mysteryReward_${generateFastId()}`;
    const fullCelebration = { ...celebration, id };

    set(state => ({
      mysteryRewardCelebrations: [...state.mysteryRewardCelebrations, fullCelebration],
    }));

    return id;
  },

  addBattlePassCelebration: celebration => {
    const id = `battlePass_${generateFastId()}`;
    const fullCelebration = { ...celebration, id };

    set(state => ({
      battlePassCelebrations: [...state.battlePassCelebrations, fullCelebration],
    }));

    return id;
  },

  removeCelebration: (type, id) => {
    set(state => {
      switch (type) {
        case 'victory':
          return {
            victoryCelebrations: state.victoryCelebrations.filter(c => c.id !== id),
          };
        case 'achievement':
          return {
            achievementCelebrations: state.achievementCelebrations.filter(c => c.id !== id),
          };
        case 'combo':
          return {
            comboCelebrations: state.comboCelebrations.filter(c => c.id !== id),
          };
        case 'mysteryReward':
          return {
            mysteryRewardCelebrations: state.mysteryRewardCelebrations.filter(c => c.id !== id),
          };
        case 'battlePass':
          return {
            battlePassCelebrations: state.battlePassCelebrations.filter(c => c.id !== id),
          };
        default:
          return state;
      }
    });
  },

  clearAllCelebrations: () => {
    set({
      victoryCelebrations: [],
      achievementCelebrations: [],
      comboCelebrations: [],
      mysteryRewardCelebrations: [],
      battlePassCelebrations: [],
    });
  },
}));

// Selector hooks for individual celebration types
export const useVictoryCelebrations = () => useCelebrationStore(state => state.victoryCelebrations);
export const useAchievementCelebrations = () =>
  useCelebrationStore(state => state.achievementCelebrations);
export const useComboCelebrations = () => useCelebrationStore(state => state.comboCelebrations);
export const useMysteryRewardCelebrations = () =>
  useCelebrationStore(state => state.mysteryRewardCelebrations);
export const useBattlePassCelebrations = () =>
  useCelebrationStore(state => state.battlePassCelebrations);
// ✅ SAFE - Individual primitive selectors for actions
export const useAddVictoryCelebration = () =>
  useCelebrationStore(state => state.addVictoryCelebration);
export const useAddAchievementCelebration = () =>
  useCelebrationStore(state => state.addAchievementCelebration);
export const useAddComboCelebration = () => useCelebrationStore(state => state.addComboCelebration);
export const useAddMysteryRewardCelebration = () =>
  useCelebrationStore(state => state.addMysteryRewardCelebration);
export const useAddBattlePassCelebration = () =>
  useCelebrationStore(state => state.addBattlePassCelebration);
export const useRemoveCelebration = () => useCelebrationStore(state => state.removeCelebration);
export const useClearAllCelebrations = () =>
  useCelebrationStore(state => state.clearAllCelebrations);

// =============================================================================
// ⚠️  ANTI-PATTERN PREVENTION
// =============================================================================
// 
// DO NOT create composite selectors that return new objects on every render.
// This breaks React's memoization and causes infinite re-render loops.
//
// ❌ NEVER DO THIS:
// export const useCelebrationActions = () => useCelebrationStore(state => ({
//   addVictory: state.addVictoryCelebration,
//   addAchievement: state.addAchievementCelebration,
//   clear: state.clearAllCelebrations
// })); // <-- NEW OBJECT EVERY RENDER = INFINITE LOOPS
//
// ✅ INDIVIDUAL SELECTORS ABOVE ARE CORRECT
// =============================================================================
