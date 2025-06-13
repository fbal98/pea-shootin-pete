/**
 * Tutorial System Types - Interactive guidance for progression features
 *
 * Comprehensive tutorial system that introduces players to:
 * - Core gameplay mechanics
 * - Meta progression systems
 * - Daily challenges
 * - Mystery balloon rewards
 * - Battle pass progression
 * - Customization features
 *
 * Designed for 2025 onboarding best practices with progressive disclosure.
 */

export interface TutorialStep {
  id: string;
  type: TutorialStepType;
  title: string;
  description: string;

  // Targeting
  targetElement?: string; // CSS selector or component identifier
  targetPosition?: TutorialPosition;

  // Visual Properties
  highlightArea?: HighlightArea;
  arrow?: ArrowDirection;
  backdrop?: BackdropStyle;

  // Interaction
  trigger: TutorialTrigger;
  actionRequired?: TutorialAction;
  skipAllowed: boolean;

  // Flow Control
  nextStepId?: string;
  prerequisiteSteps?: string[];

  // Timing
  delay?: number; // Milliseconds before showing
  autoAdvance?: number; // Auto-advance after X milliseconds

  // Analytics
  category: TutorialCategory;
  importance: TutorialImportance;
}

export type TutorialStepType =
  | 'tooltip' // Small overlay with arrow
  | 'modal' // Full-screen overlay
  | 'spotlight' // Highlight specific area
  | 'guided_interaction' // Step-through interaction
  | 'contextual_hint' // In-context help bubble
  | 'celebration' // Achievement celebration tutorial
  | 'progressive_disclosure'; // Reveal feature incrementally

export interface TutorialPosition {
  x: number; // Screen percentage or absolute px
  y: number;
  anchor: PositionAnchor;
}

export type PositionAnchor =
  | 'top_left'
  | 'top_center'
  | 'top_right'
  | 'center_left'
  | 'center'
  | 'center_right'
  | 'bottom_left'
  | 'bottom_center'
  | 'bottom_right';

export interface HighlightArea {
  shape: 'rectangle' | 'circle' | 'rounded_rectangle';
  padding: number; // Extra space around target
  glow: boolean;
  animation: 'none' | 'pulse' | 'glow' | 'bounce';
}

export type ArrowDirection = 'up' | 'down' | 'left' | 'right' | 'none';

export interface BackdropStyle {
  enabled: boolean;
  opacity: number; // 0.0 to 1.0
  color: string;
  blurEffect: boolean;
}

export type TutorialTrigger =
  | 'immediate' // Show right away
  | 'user_action' // Wait for specific action
  | 'game_event' // Wait for game event
  | 'timer' // After time delay
  | 'level_start' // When level begins
  | 'feature_unlock' // When feature becomes available
  | 'first_mystery_balloon' // When first mystery balloon appears
  | 'achievement_unlock' // When achievement is earned
  | 'challenge_available'; // When daily challenge appears

export interface TutorialAction {
  type: TutorialActionType;
  target?: string; // What to interact with
  value?: any; // Expected value/result
  timeout?: number; // Max time to wait for action
}

export type TutorialActionType =
  | 'tap' // Tap specific element
  | 'swipe' // Swipe gesture
  | 'drag' // Drag movement
  | 'wait' // Just wait for time
  | 'observe' // Watch for specific event
  | 'navigate' // Go to specific screen
  | 'complete_challenge'; // Complete a tutorial challenge

export type TutorialCategory =
  | 'core_gameplay' // Basic game mechanics
  | 'progression' // Meta progression features
  | 'monetization' // Purchase/premium features
  | 'social' // Social and sharing features
  | 'advanced' // Advanced strategies
  | 'seasonal'; // Time-limited content

export type TutorialImportance = 'critical' | 'recommended' | 'optional';

// Tutorial Series - Groups of related steps
export interface TutorialSeries {
  id: string;
  name: string;
  description: string;
  category: TutorialCategory;

  // Steps in order
  steps: TutorialStep[];

  // Prerequisites
  prerequisiteSeries?: string[];
  unlockConditions?: TutorialUnlockCondition[];

  // Completion
  completionReward?: TutorialReward;
  skippable: boolean;

  // Targeting
  triggerConditions: TutorialTriggerCondition[];

  // Analytics
  completionRate?: number;
  averageTimeToComplete?: number;
}

export interface TutorialUnlockCondition {
  type: TutorialUnlockType;
  value: any;
}

export type TutorialUnlockType =
  | 'level_reached' // Player reached level X
  | 'feature_unlocked' // Specific feature unlocked
  | 'tutorial_completed' // Other tutorial completed
  | 'time_played' // Played for X minutes
  | 'achievement_earned' // Earned specific achievement
  | 'first_session' // First time playing
  | 'return_player'; // Returning after absence

export interface TutorialTriggerCondition {
  event: TutorialTriggerEvent;
  parameters?: Record<string, any>;
  frequency: TutorialFrequency;
}

export type TutorialTriggerEvent =
  | 'app_launch'
  | 'level_start'
  | 'feature_first_encounter'
  | 'mystery_balloon_spawn'
  | 'achievement_unlock'
  | 'challenge_available'
  | 'level_complete'
  | 'battle_pass_tier_up'
  | 'combo_achieved'
  | 'first_mystery_balloon';

export type TutorialFrequency = 'once' | 'daily' | 'weekly' | 'always';

export interface TutorialReward {
  type: TutorialRewardType;
  amount: number;
  itemId?: string;
}

export type TutorialRewardType = 'coins' | 'xp' | 'customization' | 'achievement_progress';

// Tutorial State Management
export interface TutorialState {
  // Completion tracking
  completedSteps: Set<string>;
  completedSeries: Set<string>;
  skippedSeries: Set<string>;

  // Current state
  activeTutorial?: string;
  currentStep?: string;

  // Settings
  tutorialsEnabled: boolean;
  showTooltips: boolean;
  autoAdvanceEnabled: boolean;

  // Analytics
  tutorialStartTimes: Record<string, number>;
  stepCompletionTimes: Record<string, number>;

  // Player preferences
  preferredTutorialSpeed: TutorialSpeed;
  skipNonCritical: boolean;
}

export type TutorialSpeed = 'slow' | 'normal' | 'fast';

// Tutorial Manager Interface
export interface TutorialManager {
  // Core functionality
  startTutorial: (seriesId: string) => Promise<boolean>;
  completeTutorialStep: (stepId: string) => void;
  skipTutorial: (seriesId: string) => void;

  // State queries
  isTutorialActive: () => boolean;
  getCurrentTutorial: () => TutorialSeries | null;
  getCurrentStep: () => TutorialStep | null;
  isTutorialCompleted: (seriesId: string) => boolean;

  // Event handling
  onTutorialEvent: (event: TutorialTriggerEvent, parameters?: any) => void;
  checkTriggerConditions: () => void;

  // Settings
  updateTutorialSettings: (settings: Partial<TutorialState>) => void;
  resetTutorialProgress: () => void;

  // Analytics
  trackTutorialMetrics: (stepId: string, action: TutorialAnalyticsAction) => void;
}

export type TutorialAnalyticsAction =
  | 'started'
  | 'completed'
  | 'skipped'
  | 'abandoned'
  | 'help_requested';

// Predefined Tutorial Series IDs
export const TUTORIAL_SERIES = {
  // Core gameplay (mandatory)
  FIRST_GAME: 'first_game',
  BASIC_CONTROLS: 'basic_controls',

  // Progression features (recommended)
  MYSTERY_BALLOONS: 'mystery_balloons',
  DAILY_CHALLENGES: 'daily_challenges',
  BATTLE_PASS_INTRO: 'battle_pass_intro',
  ACHIEVEMENTS: 'achievements',
  LEVEL_MASTERY: 'level_mastery',

  // Advanced features (optional)
  CUSTOMIZATION: 'customization',
  SOCIAL_FEATURES: 'social_features',
  STRATEGIES: 'advanced_strategies',

  // Seasonal/Special
  SEASONAL_EVENTS: 'seasonal_events',
  NEW_FEATURES: 'new_features',
} as const;

export type TutorialSeriesId = (typeof TUTORIAL_SERIES)[keyof typeof TUTORIAL_SERIES];

// Tutorial Component Props
export interface TutorialOverlayProps {
  step: TutorialStep;
  onNext: () => void;
  onSkip: () => void;
  onComplete: () => void;
  progress: {
    current: number;
    total: number;
  };
}

export interface TutorialTooltipProps {
  step: TutorialStep;
  targetRef: React.RefObject<any>;
  onDismiss: () => void;
  visible: boolean;
}

export interface TutorialSpotlightProps {
  step: TutorialStep;
  targetArea: HighlightArea;
  onInteraction: () => void;
}

// Tutorial Content Configuration
export interface TutorialContent {
  [seriesId: string]: {
    series: TutorialSeries;
    localizedContent: Record<string, LocalizedTutorialContent>;
  };
}

export interface LocalizedTutorialContent {
  title: string;
  description: string;
  steps: Record<
    string,
    {
      title: string;
      description: string;
      actionText?: string;
    }
  >;
}

// Tutorial Analytics Data
export interface TutorialAnalyticsEvent {
  tutorialId: string;
  stepId?: string;
  action: TutorialAnalyticsAction;
  timestamp: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export default TutorialStep;
