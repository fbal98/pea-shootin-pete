/**
 * Comprehensive Game Configuration
 * Centralized location for ALL game behavior, physics, UI, and visual parameters
 * Easy to modify for balancing, A/B testing, and leveling system changes
 */

// =============================================================================
// CORE ENTITY SIZES & DIMENSIONS
// =============================================================================
export const ENTITY_CONFIG = {
  // Player Character
  PETE: {
    SIZE: 40,
    FACE_PADDING_HORIZONTAL: 0.2, // 20% of container width
    EYE_SIZE_RATIO: 0.2, // 20% of face container
    EYE_MARGIN_RATIO: 0.1, // 10% margin between eyes
  },

  // Enemy Balloons - Core sizing system for leveling
  BALLOON: {
    BASE_SIZE: 30,
    // Size multipliers for split levels (easily configurable for leveling system)
    SIZE_MULTIPLIERS: {
      LEVEL_1: 0.7,  // Smallest balloons (70% of base)
      LEVEL_2: 0.85, // Medium balloons (85% of base)
      LEVEL_3: 1.0,  // Largest balloons (100% of base)
    },
    // Visual opacity by size level
    OPACITY_BY_LEVEL: {
      LEVEL_1: 1.0,    // Fully opaque for smallest
      LEVEL_2: 0.85,   // Slightly transparent for medium
      LEVEL_3: 0.7,    // More transparent for largest
    },
    // Border radius multipliers for different balloon types
    BORDER_RADIUS: {
      CIRCLE: 1.0,     // Perfect circle (50% border radius)
      DIAMOND: 0.1,    // 10% border radius for diamond shape
      STRONG: 0.2,     // 20% border radius for strong (rounded square)
    },
  },

  // Projectiles
  PROJECTILE: {
    SIZE: 10,
    SPEED: 300, // pixels per second
  },
} as const;

// =============================================================================
// BALLOON PHYSICS SYSTEM
// =============================================================================
export const BALLOON_PHYSICS = {
  // Core physics constants
  GRAVITY_MULTIPLIER: 0.4,        // Balloons have 40% of normal gravity
  AIR_RESISTANCE: 0.995,          // Air resistance factor (0.5% drag per frame)
  MIN_BOUNCE_VELOCITY: 280,       // Minimum velocity to maintain balloon bounce

  // Bounce coefficients per surface
  BOUNCE_COEFFICIENTS: {
    WALLS: 0.9,     // 90% energy retained on wall bounce (10% loss)
    CEILING: 0.8,   // 80% energy retained on ceiling bounce (20% loss)
    FLOOR: 1.4,     // 140% energy GAIN on floor bounce (super-bouncy trampoline)
  },

  // Initial spawn velocities
  SPAWN_VELOCITY: {
    HORIZONTAL_RANGE: 200,     // Random horizontal velocity ±100
    VERTICAL_BASE: 20,         // Base downward velocity
    VERTICAL_RANDOM: 50,       // Additional random downward velocity
  },

  // Enemy splitting physics
  SPLIT: {
    HORIZONTAL_VELOCITY: 150,  // How fast split enemies move apart
    VERTICAL_VELOCITY: 200,    // How fast split enemies bounce up
    OFFSET_DISTANCE: 10,       // Pixel distance to offset split enemies
  },
} as const;

// =============================================================================
// PLAYER INPUT & MOVEMENT
// =============================================================================
export const INPUT_CONFIG = {
  // Pete movement smoothing
  MOVEMENT_SMOOTHING: 0.2,       // Interpolation factor for smooth movement
  SMOOTHING_THRESHOLD: 0.5,      // Minimum distance to trigger smoothing
  SMOOTHING_UPDATE_INTERVAL: 16, // 60fps update interval (16ms)
  
  // Touch responsiveness
  MOVE_THROTTLE_MS: 16,          // Throttle movement updates to 60fps
  
  // Haptic feedback
  HAPTIC_THROTTLE_MS: 100,       // Minimum time between haptic feedback
} as const;

// =============================================================================
// SCORING & PROGRESSION SYSTEM
// =============================================================================
export const SCORING_CONFIG = {
  // Points by balloon size (smaller = more points)
  POINTS_BY_SIZE: {
    LEVEL_1: 30,  // Smallest balloons worth most points
    LEVEL_2: 20,  // Medium balloons
    LEVEL_3: 10,  // Largest balloons worth least points
  },
  
  // Level progression
  LEVEL_UP_THRESHOLD: 100,       // Points needed to advance level
  
  // Enemy spawn timing per level
  SPAWN_TIMING: {
    BASE_INTERVAL: 2000,         // Base spawn interval (2 seconds)
    LEVEL_REDUCTION: 100,        // Reduce interval by 100ms per level
    MIN_INTERVAL: 500,           // Minimum spawn interval (0.5 seconds)
  },
} as const;

// =============================================================================
// ENEMY TYPES & BEHAVIOR
// =============================================================================
export const ENEMY_CONFIG = {
  // Base movement speeds
  BASE_SPEED: 50,
  
  // Enemy type unlock levels
  TYPE_UNLOCK_LEVELS: {
    BASIC: 1,    // Available from start
    FAST: 2,     // Unlocked at level 2
    STRONG: 3,   // Unlocked at level 3
  },
  
  // Spawn probability when unlocked
  TYPE_SPAWN_CHANCES: {
    BASIC: 0.6,   // 60% chance (remaining after fast/strong)
    FAST: 0.4,    // 40% chance when unlocked
    STRONG: 0.2,  // 20% chance when unlocked
  },
  
  // Speed multipliers by type
  TYPE_SPEED_MULTIPLIERS: {
    BASIC: 1.0,   // Normal speed
    FAST: 1.5,    // 50% faster
    STRONG: 0.7,  // 30% slower
  },
} as const;

// =============================================================================
// ANIMATION & VISUAL EFFECTS
// =============================================================================
export const ANIMATION_CONFIG = {
  // Menu screen animations
  MENU: {
    FADE_IN_DURATION: 600,        // Menu fade in time
    PULSE_DURATION: 1200,         // Tap to play pulse duration
    FLOATING_ELEMENTS: {
      DURATIONS: [8000, 10000, 12000],  // Different float speeds
      DELAYS: [0, 2000, 4000],          // Staggered start times
      SIZES: [80, 120, 60],             // Element sizes
      OPACITIES: [0.08, 0.06, 0.1],     // Element transparencies
    },
  },

  // Background floating shapes
  BACKGROUND: {
    BASE_DURATION: 15000,         // Base animation duration
    DURATION_INCREMENT: 3000,     // Additional time per element
    DELAY_INCREMENT: 2000,        // Stagger delay between elements
    BASE_SIZE: 30,                // Base floating shape size
    SIZE_INCREMENT: 10,           // Size increase per element
    HORIZONTAL_SPACING: 80,       // Spacing between shapes
  },

  // Game entity animations
  ENTITIES: {
    RIPPLE_DURATION: 300,         // Hit effect ripple duration
    ENEMY_FLOAT_DURATION: {
      BASIC: 1000,                // Basic enemy float animation
      FAST: 800,                  // Fast enemy float animation
      STRONG: 1200,               // Strong enemy float animation
    },
    ENEMY_PULSE_DURATION: 600,    // Enemy pulse effect
    PROJECTILE_PULSE_DURATION: 300,   // Projectile pulse effect
    PROJECTILE_GLOW_DURATION: 400,    // Projectile glow effect
  },
} as const;

// =============================================================================
// UI LAYOUT & TYPOGRAPHY
// =============================================================================
export const UI_CONFIG = {
  // Layout dimensions
  LAYOUT: {
    HEADER_HEIGHT: 60,
    HUD_HEIGHT: 50,
    BOTTOM_PADDING: 20,
    SAFE_AREA_PADDING: 8,
  },

  // Score display
  SCORE: {
    FONT_SIZE: 36,
    TOP_PADDING: 20,              // Additional padding from safe area
    SHADOW_OFFSET: { width: 0, height: 2 },
    SHADOW_RADIUS: 4,
  },

  // Game Over screen
  GAME_OVER: {
    CONTAINER_PADDING: 40,
    TITLE_FONT_SIZE: 48,
    SCORE_FONT_SIZE: 32,
    BUTTON_FONT_SIZE: 18,
    SPACING: {
      TITLE_MARGIN: 20,
      SCORE_MARGIN: 40,
      BUTTON_MARGIN: 20,
    },
  },

  // Settings & About screens
  SETTINGS: {
    TITLE_FONT_SIZE: 28,
    SETTING_FONT_SIZE: 20,
    BACK_BUTTON_SIZE: 40,
    SWITCH_SCALE: 1.1,            // Scale factor for switches
  },
} as const;

// =============================================================================
// STARFIELD BACKGROUND (Legacy - for reference)
// =============================================================================
export const STARFIELD_CONFIG = {
  STAR_COUNT: 50,
  STAR_LAYERS: {
    BACKGROUND: { 
      sizeRange: [0.5, 2], 
      speedRange: [10, 40], 
      opacityRange: [0.1, 0.4] 
    },
    MIDDLE: { 
      sizeRange: [1.5, 4], 
      speedRange: [40, 100], 
      opacityRange: [0.3, 0.8] 
    },
    FOREGROUND: { 
      sizeRange: [2.5, 6], 
      speedRange: [80, 200], 
      opacityRange: [0.6, 1.0] 
    },
  },
  STAR_LAYER_DISTRIBUTION: {
    BACKGROUND: 0.6,  // 60% of stars
    MIDDLE: 0.25,     // 25% of stars
    FOREGROUND: 0.15, // 15% of stars
  },
} as const;

// =============================================================================
// COMPUTED VALUES & HELPER FUNCTIONS
// =============================================================================

/**
 * Get balloon size for a specific level
 * Makes balloon sizing easily configurable for leveling system
 */
export const getBalloonSize = (sizeLevel: 1 | 2 | 3): number => {
  const multipliers = ENTITY_CONFIG.BALLOON.SIZE_MULTIPLIERS;
  const multiplier = sizeLevel === 1 ? multipliers.LEVEL_1 : 
                    sizeLevel === 2 ? multipliers.LEVEL_2 : 
                    multipliers.LEVEL_3;
  return ENTITY_CONFIG.BALLOON.BASE_SIZE * multiplier;
};

/**
 * Get points for destroying a balloon of specific size
 */
export const getBalloonPoints = (sizeLevel: 1 | 2 | 3): number => {
  return sizeLevel === 1 ? SCORING_CONFIG.POINTS_BY_SIZE.LEVEL_1 :
         sizeLevel === 2 ? SCORING_CONFIG.POINTS_BY_SIZE.LEVEL_2 :
         SCORING_CONFIG.POINTS_BY_SIZE.LEVEL_3;
};

/**
 * Get balloon opacity for visual feedback by size
 */
export const getBalloonOpacity = (sizeLevel: 1 | 2 | 3): number => {
  return sizeLevel === 1 ? ENTITY_CONFIG.BALLOON.OPACITY_BY_LEVEL.LEVEL_1 :
         sizeLevel === 2 ? ENTITY_CONFIG.BALLOON.OPACITY_BY_LEVEL.LEVEL_2 :
         ENTITY_CONFIG.BALLOON.OPACITY_BY_LEVEL.LEVEL_3;
};

/**
 * Calculate enemy spawn interval for current level
 */
export const getSpawnInterval = (level: number): number => {
  const baseInterval = SCORING_CONFIG.SPAWN_TIMING.BASE_INTERVAL;
  const reduction = SCORING_CONFIG.SPAWN_TIMING.LEVEL_REDUCTION * (level - 1);
  const minInterval = SCORING_CONFIG.SPAWN_TIMING.MIN_INTERVAL;
  return Math.max(minInterval, baseInterval - reduction);
};

/**
 * Get enemy speed for type and level
 */
export const getEnemySpeed = (type: 'basic' | 'fast' | 'strong'): number => {
  const baseSpeed = ENEMY_CONFIG.BASE_SPEED;
  const multiplier = type === 'fast' ? ENEMY_CONFIG.TYPE_SPEED_MULTIPLIERS.FAST :
                    type === 'strong' ? ENEMY_CONFIG.TYPE_SPEED_MULTIPLIERS.STRONG :
                    ENEMY_CONFIG.TYPE_SPEED_MULTIPLIERS.BASIC;
  return baseSpeed * multiplier;
};

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================
export type BalloonSizeLevel = 1 | 2 | 3;
export type EnemyType = 'basic' | 'fast' | 'strong';
export type GameConfigType = typeof ENTITY_CONFIG;

// =============================================================================
// LEGACY COMPATIBILITY
// =============================================================================
// Re-export as GAME_CONFIG for backward compatibility during migration
export const GAME_CONFIG = {
  // Legacy field mappings - will be removed after migration
  PETE_SIZE: ENTITY_CONFIG.PETE.SIZE,
  ENEMY_BASE_SIZE: ENTITY_CONFIG.BALLOON.BASE_SIZE,
  PROJECTILE_SIZE: ENTITY_CONFIG.PROJECTILE.SIZE,
  PROJECTILE_SPEED: ENTITY_CONFIG.PROJECTILE.SPEED,
  ENEMY_BASE_SPEED: ENEMY_CONFIG.BASE_SPEED,
  PETE_MOVE_THROTTLE_MS: INPUT_CONFIG.MOVE_THROTTLE_MS,
  
  // Physics constants
  GRAVITY: 500, // Keep original gravity, balloon physics uses multiplier
  BOUNCE_DAMPING: 0.8,
  MIN_BOUNCE_VELOCITY: 50,
  
  // Enemy splitting (legacy)
  SPLIT_HORIZONTAL_VELOCITY: BALLOON_PHYSICS.SPLIT.HORIZONTAL_VELOCITY,
  SPLIT_VERTICAL_VELOCITY: BALLOON_PHYSICS.SPLIT.VERTICAL_VELOCITY,
  
  // Scoring (legacy format)
  SCORE_MULTIPLIER: {
    SIZE_1: SCORING_CONFIG.POINTS_BY_SIZE.LEVEL_1,
    SIZE_2: SCORING_CONFIG.POINTS_BY_SIZE.LEVEL_2,
    SIZE_3: SCORING_CONFIG.POINTS_BY_SIZE.LEVEL_3,
  },
  LEVEL_UP_THRESHOLD: SCORING_CONFIG.LEVEL_UP_THRESHOLD,
  
  // Spawning (legacy)
  ENEMY_SPAWN_BASE_INTERVAL: SCORING_CONFIG.SPAWN_TIMING.BASE_INTERVAL,
  ENEMY_SPAWN_LEVEL_REDUCTION: SCORING_CONFIG.SPAWN_TIMING.LEVEL_REDUCTION,
  ENEMY_SPAWN_MIN_INTERVAL: SCORING_CONFIG.SPAWN_TIMING.MIN_INTERVAL,
  
  // Enemy types (legacy)
  ENEMY_TYPE_UNLOCK_LEVELS: ENEMY_CONFIG.TYPE_UNLOCK_LEVELS,
  ENEMY_TYPE_SPAWN_CHANCES: ENEMY_CONFIG.TYPE_SPAWN_CHANCES,
  ENEMY_TYPE_SPEED_MULTIPLIERS: ENEMY_CONFIG.TYPE_SPEED_MULTIPLIERS,
  
  // Enemy size scaling (legacy)
  ENEMY_SIZE_MULTIPLIERS: {
    SIZE_1: ENTITY_CONFIG.BALLOON.SIZE_MULTIPLIERS.LEVEL_1,
    SIZE_2: ENTITY_CONFIG.BALLOON.SIZE_MULTIPLIERS.LEVEL_2,
    SIZE_3: ENTITY_CONFIG.BALLOON.SIZE_MULTIPLIERS.LEVEL_3,
  },
  
  // UI (legacy)
  HEADER_HEIGHT: UI_CONFIG.LAYOUT.HEADER_HEIGHT,
  HUD_HEIGHT: UI_CONFIG.LAYOUT.HUD_HEIGHT,
  BOTTOM_PADDING: UI_CONFIG.LAYOUT.BOTTOM_PADDING,
  SAFE_AREA_PADDING: UI_CONFIG.LAYOUT.SAFE_AREA_PADDING,
  HAPTIC_THROTTLE_MS: INPUT_CONFIG.HAPTIC_THROTTLE_MS,
  
  // Animations (legacy)
  RIPPLE_DURATION: ANIMATION_CONFIG.ENTITIES.RIPPLE_DURATION,
  ENEMY_FLOAT_DURATION: ANIMATION_CONFIG.ENTITIES.ENEMY_FLOAT_DURATION,
  ENEMY_PULSE_DURATION: ANIMATION_CONFIG.ENTITIES.ENEMY_PULSE_DURATION,
  PROJECTILE_PULSE_DURATION: ANIMATION_CONFIG.ENTITIES.PROJECTILE_PULSE_DURATION,
  PROJECTILE_GLOW_DURATION: ANIMATION_CONFIG.ENTITIES.PROJECTILE_GLOW_DURATION,
  
  // Starfield (legacy)
  STAR_COUNT: STARFIELD_CONFIG.STAR_COUNT,
  STAR_LAYERS: STARFIELD_CONFIG.STAR_LAYERS,
  STAR_LAYER_DISTRIBUTION: STARFIELD_CONFIG.STAR_LAYER_DISTRIBUTION,
} as const;