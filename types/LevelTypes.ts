/**
 * Comprehensive Level System Types for Pea Shootin' Pete
 *
 * This file defines the complete type system for our data-driven level progression.
 * Designed to support remote configuration, A/B testing, and scalable content delivery.
 *
 * Based on 2025 hyper-casual best practices and publishing checklist requirements.
 */

// ===== CORE LEVEL STRUCTURE =====

export interface Level {
  // Core Metadata
  id: number;
  name: string;
  version: string; // For A/B testing different level versions
  difficulty: DifficultyTier;
  estimatedDuration: number; // Target seconds for completion

  // Victory & Failure Conditions
  objectives: LevelObjective[];
  failureConditions: FailureCondition[];

  // Enemy Configuration
  enemyWaves: EnemyWave[];
  totalEnemyCount: number; // Pre-calculated for progress tracking

  // Environmental Modifiers
  environment: EnvironmentModifiers;

  // Visual & Audio Theme
  theme: LevelTheme;

  // Difficulty & Balance Parameters
  balance: LevelBalance;

  // Rewards & Progression
  rewards: LevelRewards;

  // Analytics & Remote Config Metadata
  metadata: LevelMetadata;
}

// ===== DIFFICULTY & PROGRESSION =====

export type DifficultyTier = 'tutorial' | 'easy' | 'medium' | 'hard' | 'expert' | 'nightmare';

export interface LevelBalance {
  // Core Difficulty Multipliers (based on GameConfig defaults)
  enemySpeedMultiplier: number; // 1.0 = normal, 1.2 = 20% faster
  spawnRateMultiplier: number; // 1.0 = normal, 0.8 = 20% slower spawning
  balloonSizeMultiplier: number; // 1.0 = normal, 0.9 = 10% smaller (harder)

  // Physics Modifications
  gravityMultiplier: number; // 1.0 = normal, 1.2 = heavier balloons
  bounceEnergyMultiplier: number; // 1.0 = normal, 1.1 = bouncier

  // Player Assistance
  peteSpeedMultiplier: number; // 1.0 = normal movement speed
  projectileSpeedMultiplier: number; // 1.0 = normal pea speed

  // Fail Rate Targeting (from Publishing Checklist)
  targetFailRate: number; // 0.05 = 5% (level 1), 0.20 = 20% (level 6+)
}

// ===== VICTORY CONDITIONS =====

export interface LevelObjective {
  type: ObjectiveType;
  target: number;
  description: string;
  isOptional: boolean;
  rewardMultiplier: number; // Score multiplier for completing
}

export type ObjectiveType =
  | 'eliminate_all_enemies' // Classic mode: clear all balloons
  | 'survive_duration' // Survival mode: last X seconds
  | 'reach_score' // Score attack: reach target score
  | 'pop_specific_enemies' // Pop X enemies of specific type
  | 'achieve_combo' // Get X consecutive hits
  | 'collect_powerups'; // Collect X power-ups

export interface FailureCondition {
  type: FailureType;
  threshold: number;
}

export type FailureType =
  | 'time_limit' // Fail if not completed in X seconds
  | 'missed_shots' // Fail after X missed shots
  | 'enemies_escaped' // Fail if X enemies reach bottom
  | 'health_depleted'; // Fail when health reaches 0

// ===== ENEMY WAVE SYSTEM =====

export interface EnemyWave {
  id: string;
  startTime: number; // Seconds after level start
  duration: number; // How long this wave lasts
  enemies: EnemySpawnDefinition[];
  spawnPattern: SpawnPattern;

  // Wave Modifiers
  speedBonus: number; // Additional speed for this wave
  sizeVariation: number; // Random size variation (0.0-1.0)
  colorOverride?: string; // Override balloon color
}

export interface EnemySpawnDefinition {
  type: EnemyType;
  count: number;
  sizeLevel: 1 | 2 | 3; // Small, Medium, Large
  spawnInterval: number; // Seconds between spawns

  // Movement Behavior
  movementType: MovementType;
  movementSpeed: number;

  // Special Properties
  splitBehavior: SplitBehavior;
  specialAbilities?: SpecialAbility[];
}

export type EnemyType = 'basic' | 'fast' | 'strong' | 'bouncer' | 'splitter' | 'ghost';

export type MovementType =
  | 'physics_normal' // Standard balloon physics
  | 'physics_heavy' // More affected by gravity
  | 'physics_floaty' // Less affected by gravity
  | 'pattern_zigzag' // Predictable zigzag movement
  | 'pattern_circular' // Circular motion
  | 'pattern_homing' // Slowly moves toward Pete
  | 'chaotic_random'; // Unpredictable movement

export interface SplitBehavior {
  enabled: boolean;
  minSizeToSplit: 1 | 2 | 3; // Only split if size >= this
  splitInto: number; // How many pieces when split
  childSizeReduction: number; // How much smaller children are
  childSpeedBonus: number; // Extra speed for child balloons
}

export type SpawnPattern =
  | 'random' // Random positions across top
  | 'left_to_right' // Sequential from left
  | 'center_out' // From center outward
  | 'corners_first' // Prioritize corners
  | 'wave_formation' // Coordinated wave pattern
  | 'two_small' // Original: enemies at 20% and 80%
  | 'three_small_wide' // Original: wide spread at 15%, 50%, 85%
  | 'pipes' // Original: vertical columns at 25%, 50%, 75%
  | 'crazy' // Original: many positions 10%, 30%, 50%, 70%, 90%
  | 'entrap'; // Original: corners only at 10% and 90%

// ===== ENVIRONMENT & MODIFIERS =====

export interface EnvironmentModifiers {
  // Physics Overrides
  gravity?: number; // Override global gravity
  airResistance?: number; // Override global air resistance
  windForce?: WindEffect; // Add wind effects

  // Boundary Behavior
  wallBounceMultiplier?: number; // Change wall bounce energy
  floorBounceMultiplier?: number; // Change floor bounce energy
  ceilingBounceMultiplier?: number; // Change ceiling bounce energy

  // Special Effects
  screenShake?: ScreenShakeConfig; // Level-specific screen shake
  timeScale?: number; // Slow motion or fast forward

  // Obstacles (future expansion)
  obstacles?: Obstacle[];
}

export interface WindEffect {
  strength: number; // Wind force magnitude
  direction: number; // Angle in degrees (0 = right, 90 = up)
  variability: number; // How much wind changes (0-1)
  gusts: boolean; // Whether wind has sudden gusts
}

export interface ScreenShakeConfig {
  intensity: number; // Base shake intensity
  onBalloonPop: number; // Extra shake when balloon pops
  onCombo: number; // Extra shake for combos
}

export interface Obstacle {
  id: string;
  type: 'static_block' | 'moving_platform' | 'bouncer' | 'portal';
  position: { x: number; y: number };
  size: { width: number; height: number };
  properties: Record<string, any>; // Obstacle-specific properties
}

// ===== VISUAL THEMES =====

export interface LevelTheme {
  colorScheme: ColorSchemeOverride;
  backgroundType: BackgroundType;
  particleEffects: ParticleConfig;
  uiStyle: UIStyleOverride;
}

export interface ColorSchemeOverride {
  primary: string; // Main accent color
  secondary?: string; // Secondary accent
  background: {
    start: string; // Gradient start color
    end: string; // Gradient end color
  };
  balloonColors: string[]; // Balloon color palette
  peteColor?: string; // Override Pete's color
  projectileColor?: string; // Override pea color
}

export type BackgroundType =
  | 'gradient' // Standard gradient background
  | 'floating_shapes' // Gradient + floating geometric shapes
  | 'starfield' // Space theme with stars
  | 'bubbles' // Underwater theme with bubbles
  | 'clouds' // Sky theme with clouds
  | 'minimal'; // Solid color only

export interface ParticleConfig {
  balloonPopParticles: ParticleEffect;
  comboParticles: ParticleEffect;
  backgroundParticles?: ParticleEffect;
}

export interface ParticleEffect {
  enabled: boolean;
  count: number; // Number of particles
  color: string; // Particle color
  lifespan: number; // How long particles last
  scale: number; // Particle size multiplier
}

export interface UIStyleOverride {
  scoreColor?: string;
  levelProgressColor?: string;
  hudOpacity?: number;
}

// ===== REWARDS & PROGRESSION =====

export interface LevelRewards {
  baseScore: number; // Base score for completion
  perfectionBonus: number; // Bonus for perfect completion
  speedBonus: number; // Bonus for fast completion

  // Unlockables
  unlocksNextLevel: boolean;
  unlocksPowerup?: string;
  unlocksAchievement?: string;

  // Currency (future)
  coinsAwarded: number;
  gemsAwarded?: number;

  // 3-Star Mastery Thresholds
  masteryThresholds: MasteryThresholds;
}

// ===== 3-STAR MASTERY SYSTEM =====

export interface MasteryThresholds {
  // Time-based mastery (1 star for completing under this time)
  goldTimeThreshold: number; // Milliseconds for gold time star

  // Accuracy-based mastery (1 star for achieving this accuracy)
  goldAccuracyThreshold: number; // Percentage (0-100) for gold accuracy star

  // Style-based mastery (1 star for achieving this style score)
  goldStyleThreshold: number; // Style points for gold style star

  // Perfect completion bonus
  perfectCompletionMultiplier: number; // Score multiplier for 3-star completion
}

// ===== SPECIAL ABILITIES =====

export interface SpecialAbility {
  type: AbilityType;
  triggerCondition: TriggerCondition;
  effect: AbilityEffect;
}

export type AbilityType =
  | 'teleport' // Randomly teleport
  | 'shield' // Temporary invulnerability
  | 'multiply' // Create copies of self
  | 'camouflage' // Become partially invisible
  | 'speed_burst' // Sudden speed increase
  | 'size_change'; // Dynamically change size

export interface TriggerCondition {
  type: 'time_based' | 'health_based' | 'random_chance' | 'player_proximity';
  value: number;
}

export interface AbilityEffect {
  duration: number; // How long effect lasts
  magnitude: number; // Effect strength
  cooldown: number; // Time before can trigger again
}

// ===== ANALYTICS & METADATA =====

export interface LevelMetadata {
  // A/B Testing
  testGroup?: string; // Which test group this level belongs to
  variant?: string; // Specific variant within test group

  // Analytics Tags
  designIntent: string[]; // What this level is meant to teach/test
  expectedPlaytime: number; // Designer's expected completion time
  difficultyRating: number; // Internal difficulty rating (1-10)

  // Performance Tracking
  targetRetryRate: number; // Expected percentage of players who retry
  targetCompletionRate: number; // Expected percentage who complete on first try

  // Content Management
  createdDate: string; // When level was created
  lastModified: string; // When level was last modified
  createdBy: string; // Designer who created this level
  balanceNotes?: string; // Internal notes about balance changes
}

// ===== LEVEL LOADING & VALIDATION =====

export interface LevelValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface LevelLoadResult {
  success: boolean;
  level?: Level;
  error?: string;
}

// ===== REMOTE CONFIG SUPPORT =====

export interface RemoteLevelConfig {
  // Which levels are enabled
  enabledLevels: number[];

  // Global level modifiers
  globalDifficultyMultiplier: number;
  globalSpeedMultiplier: number;

  // A/B Testing Configuration
  testConfigs: Record<string, any>;

  // Feature Flags
  features: {
    powerupsEnabled: boolean;
    achievementsEnabled: boolean;
    leaderboardsEnabled: boolean;
    dailyRewardsEnabled: boolean;
  };
}

// ===== EXPORT UTILITY TYPES =====

export type LevelID = number;
export type WaveID = string;
export type ThemeID = string;

// JSON Schema for validation (can be used with libraries like Ajv)
export const LEVEL_JSON_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: [
    'id',
    'name',
    'version',
    'difficulty',
    'objectives',
    'enemyWaves',
    'theme',
    'balance',
    'rewards',
    'metadata',
  ],
  properties: {
    id: { type: 'number', minimum: 1 },
    name: { type: 'string', minLength: 1 },
    version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
    difficulty: {
      type: 'string',
      enum: ['tutorial', 'easy', 'medium', 'hard', 'expert', 'nightmare'],
    },
    estimatedDuration: { type: 'number', minimum: 10, maximum: 300 },
    // ... additional schema validation rules would go here
  },
};
