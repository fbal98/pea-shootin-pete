// Game Configuration Constants
export const GAME_CONFIG = {
  // Character Sizes
  PETE_SIZE: 40,
  ENEMY_BASE_SIZE: 30,
  PROJECTILE_SIZE: 10,

  // Movement Speeds
  PROJECTILE_SPEED: 300,
  ENEMY_BASE_SPEED: 50,
  PETE_MOVE_THROTTLE_MS: 16, // ~60fps for smooth movement

  // Physics Constants
  GRAVITY: 500, // pixels per second squared
  BOUNCE_DAMPING: 0.8, // energy lost on bounce
  MIN_BOUNCE_VELOCITY: 50, // minimum velocity to keep bouncing

  // Enemy Splitting
  SPLIT_HORIZONTAL_VELOCITY: 150,
  SPLIT_VERTICAL_VELOCITY: 200,

  // Scoring
  SCORE_MULTIPLIER: {
    SIZE_1: 30, // smallest enemies
    SIZE_2: 20, // medium enemies
    SIZE_3: 10, // largest enemies
  },
  LEVEL_UP_THRESHOLD: 100,

  // Spawning
  ENEMY_SPAWN_BASE_INTERVAL: 2000, // milliseconds
  ENEMY_SPAWN_LEVEL_REDUCTION: 100, // ms reduction per level
  ENEMY_SPAWN_MIN_INTERVAL: 500, // minimum spawn interval

  // Enemy Types
  ENEMY_TYPE_UNLOCK_LEVELS: {
    FAST: 2,
    STRONG: 3,
  },

  ENEMY_TYPE_SPAWN_CHANCES: {
    FAST: 0.4, // 40% chance when unlocked
    STRONG: 0.2, // 20% chance when unlocked
  },

  ENEMY_TYPE_SPEED_MULTIPLIERS: {
    BASIC: 1.0,
    FAST: 1.5,
    STRONG: 0.7,
  },

  // Enemy Size Scaling
  ENEMY_SIZE_MULTIPLIERS: {
    SIZE_1: 0.7, // 70% of base size
    SIZE_2: 0.85, // 85% of base size
    SIZE_3: 1.0, // 100% of base size
  },

  // UI Constants
  HEADER_HEIGHT: 60,
  HUD_HEIGHT: 50,
  BOTTOM_PADDING: 20,
  SAFE_AREA_PADDING: 8,

  // Haptic Feedback
  HAPTIC_THROTTLE_MS: 100,

  // Animation Durations
  RIPPLE_DURATION: 300,
  ENEMY_FLOAT_DURATION: {
    BASIC: 1000,
    FAST: 800,
    STRONG: 1200,
  },
  ENEMY_PULSE_DURATION: 600,
  PROJECTILE_PULSE_DURATION: 300,
  PROJECTILE_GLOW_DURATION: 400,

  // Starfield
  STAR_COUNT: 50,
  STAR_LAYERS: {
    BACKGROUND: { sizeRange: [0.5, 2], speedRange: [10, 40], opacityRange: [0.1, 0.4] },
    MIDDLE: { sizeRange: [1.5, 4], speedRange: [40, 100], opacityRange: [0.3, 0.8] },
    FOREGROUND: { sizeRange: [2.5, 6], speedRange: [80, 200], opacityRange: [0.6, 1.0] },
  },
  STAR_LAYER_DISTRIBUTION: {
    BACKGROUND: 0.6, // 60% of stars
    MIDDLE: 0.25, // 25% of stars
    FOREGROUND: 0.15, // 15% of stars
  },
} as const;

// Type-safe access to config values
export type GameConfig = typeof GAME_CONFIG;
export type EnemyType = 'basic' | 'fast' | 'strong';
export type EnemySizeLevel = 1 | 2 | 3;
