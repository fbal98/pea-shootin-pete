/**
 * Feature Flag Configuration
 * 
 * Controls which features are enabled/disabled to focus on hyper-casual gameplay.
 * For launch, we disable meta-systems to keep the experience simple and focused
 * on the core loop: Play Game -> Get Score -> Repeat.
 * 
 * These can be re-enabled via A/B testing once Day 1/7 retention is proven.
 */

export interface FeatureFlags {
  // Core Game Features (always enabled)
  core: {
    gamePlay: boolean;
    basicUI: boolean;
    levelProgression: boolean;
    scoring: boolean;
  };

  // Tutorial & Onboarding
  tutorial: {
    modalOverlays: boolean;      // Disable modal tutorials for invisible FTUE
    animatedCues: boolean;       // Enable in-world animated guidance
    complexTutorial: boolean;    // Disable multi-step tutorial system
  };

  // Meta-Progression Systems
  metaProgression: {
    dailyChallenges: boolean;    // Disable to reduce cognitive load
    achievements: boolean;       // Disable to focus on core loop
    battlePass: boolean;         // Disable complex progression
    levelMastery: boolean;       // Disable mastery tracking
    playerStats: boolean;        // Disable detailed statistics
  };

  // Social Features
  social: {
    friendsSystem: boolean;      // Disable social complexity
    leaderboards: boolean;       // Disable competitive pressure
    socialSharing: boolean;      // Disable sharing prompts
    viralTracking: boolean;      // Disable viral mechanics
  };

  // Monetization & Economy
  economy: {
    inAppPurchases: boolean;     // Disable to avoid early monetization pressure
    characterCustomization: boolean; // Disable cosmetic complexity
    powerUpShop: boolean;        // Disable shop systems
    coins: boolean;              // Disable currency system
  };

  // Events & Notifications
  events: {
    specialEvents: boolean;      // Disable event distractions
    pushNotifications: boolean;  // Disable notification pressure
    timeLimitEvents: boolean;    // Disable FOMO mechanics
  };

  // Advanced Features
  advanced: {
    analytics: boolean;          // Keep enabled for optimization
    crashReporting: boolean;     // Keep enabled for stability
    performanceMonitoring: boolean; // Keep enabled for optimization
    remoteConfig: boolean;       // Keep enabled for live tuning
  };

  // Developer & Testing Tools
  debug: {
    performanceOverlay: boolean;
    gameTestingTools: boolean;
    debugLogging: boolean;
  };
}

/**
 * HYPER-CASUAL LAUNCH CONFIGURATION
 * 
 * This configuration focuses entirely on the core gameplay loop.
 * All meta-systems are disabled to eliminate distractions and
 * reduce cognitive load for new players.
 */
export const HYPER_CASUAL_FLAGS: FeatureFlags = {
  core: {
    gamePlay: true,
    basicUI: true,
    levelProgression: true,
    scoring: true,
  },

  tutorial: {
    modalOverlays: false,        // ✅ Disable modal tutorials
    animatedCues: true,          // ✅ Enable in-world guidance
    complexTutorial: false,      // ✅ Disable TutorialManager complexity
  },

  metaProgression: {
    dailyChallenges: false,      // ✅ Disable for simplicity
    achievements: false,         // ✅ Disable for simplicity
    battlePass: false,           // ✅ Disable for simplicity
    levelMastery: false,         // ✅ Disable for simplicity
    playerStats: false,          // ✅ Disable for simplicity
  },

  social: {
    friendsSystem: false,        // ✅ Disable social complexity
    leaderboards: false,         // ✅ Disable competitive pressure
    socialSharing: false,        // ✅ Disable sharing prompts
    viralTracking: false,        // ✅ Disable viral mechanics
  },

  economy: {
    inAppPurchases: false,       // ✅ Disable early monetization
    characterCustomization: false, // ✅ Disable cosmetic complexity
    powerUpShop: false,          // ✅ Disable shop systems
    coins: false,                // ✅ Disable currency system
  },

  events: {
    specialEvents: false,        // ✅ Disable event distractions
    pushNotifications: false,    // ✅ Disable notification pressure
    timeLimitEvents: false,      // ✅ Disable FOMO mechanics
  },

  advanced: {
    analytics: true,             // ✅ Keep for optimization
    crashReporting: true,        // ✅ Keep for stability
    performanceMonitoring: true, // ✅ Keep for optimization
    remoteConfig: true,          // ✅ Keep for live tuning
  },

  debug: {
    performanceOverlay: __DEV__,
    gameTestingTools: __DEV__,
    debugLogging: __DEV__,
  },
};

/**
 * FULL FEATURE CONFIGURATION
 * 
 * This configuration enables all features for testing or
 * more mature players who have proven retention.
 */
export const FULL_FEATURES_FLAGS: FeatureFlags = {
  core: {
    gamePlay: true,
    basicUI: true,
    levelProgression: true,
    scoring: true,
  },

  tutorial: {
    modalOverlays: true,
    animatedCues: true,
    complexTutorial: true,
  },

  metaProgression: {
    dailyChallenges: true,
    achievements: true,
    battlePass: true,
    levelMastery: true,
    playerStats: true,
  },

  social: {
    friendsSystem: true,
    leaderboards: true,
    socialSharing: true,
    viralTracking: true,
  },

  economy: {
    inAppPurchases: true,
    characterCustomization: true,
    powerUpShop: true,
    coins: true,
  },

  events: {
    specialEvents: true,
    pushNotifications: true,
    timeLimitEvents: true,
  },

  advanced: {
    analytics: true,
    crashReporting: true,
    performanceMonitoring: true,
    remoteConfig: true,
  },

  debug: {
    performanceOverlay: __DEV__,
    gameTestingTools: __DEV__,
    debugLogging: __DEV__,
  },
};

// Current active configuration - easily switchable
export const ACTIVE_FLAGS: FeatureFlags = HYPER_CASUAL_FLAGS;

/**
 * Helper function to check if a feature is enabled
 * 
 * Usage:
 * ```tsx
 * {isFeatureEnabled('social.friendsSystem') && <FriendsButton />}
 * {isFeatureEnabled('metaProgression.achievements') && <AchievementModal />}
 * ```
 */
export const isFeatureEnabled = (featurePath: string): boolean => {
  const pathParts = featurePath.split('.');
  let current: any = ACTIVE_FLAGS;
  
  for (const part of pathParts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      console.warn(`Feature flag path not found: ${featurePath}`);
      return false;
    }
  }
  
  return Boolean(current);
};

/**
 * Helper function to get all flags for a feature category
 * 
 * Usage:
 * ```tsx
 * const socialFlags = getFeatureCategory('social');
 * if (socialFlags.friendsSystem) { ... }
 * ```
 */
export const getFeatureCategory = (category: keyof FeatureFlags): any => {
  return ACTIVE_FLAGS[category] || {};
};

/**
 * Development helper to override specific flags
 * Only works in development mode
 */
export const overrideFeatureFlag = (featurePath: string, value: boolean): void => {
  if (!__DEV__) {
    console.warn('Feature flag overrides only work in development mode');
    return;
  }
  
  const pathParts = featurePath.split('.');
  let current: any = ACTIVE_FLAGS;
  
  // Navigate to the parent of the target property
  for (let i = 0; i < pathParts.length - 1; i++) {
    if (current && typeof current === 'object' && pathParts[i] in current) {
      current = current[pathParts[i]];
    } else {
      console.warn(`Feature flag path not found: ${featurePath}`);
      return;
    }
  }
  
  // Set the final property
  const finalKey = pathParts[pathParts.length - 1];
  if (current && typeof current === 'object') {
    current[finalKey] = value;
    console.log(`Feature flag overridden: ${featurePath} = ${value}`);
  } else {
    console.warn(`Cannot override feature flag: ${featurePath}`);
  }
};

export default ACTIVE_FLAGS;