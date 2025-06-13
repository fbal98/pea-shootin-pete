/**
 * Meta-Progression Types for Pea Shootin' Pete
 * 
 * Defines the addictive progression systems that keep players engaged beyond individual levels.
 * Based on 2025 hyper-casual game retention best practices and psychological engagement principles.
 * 
 * Key Systems:
 * - 3-Star Level Mastery
 * - Achievement & Micro-Achievement System
 * - Pete Customization & Cosmetic Progression
 * - Daily Challenges & Streak Rewards
 * - Variable Ratio Mystery Rewards
 * - Battle Pass & Seasonal Progression
 * - World Map Progression UI
 */

// ===== PLAYER STATISTICS & PERSISTENCE =====

export interface PlayerMetaProgress {
  // Core Statistics
  totalScore: number;
  totalPlaytime: number;              // Total milliseconds played
  balloonsPopped: number;
  shotsFired: number;
  shotsHit: number;
  
  // Streak & Combo Records
  longestCombo: number;
  perfectLevelsCompleted: number;     // Levels completed with 100% accuracy
  consecutiveDaysPlayed: number;
  currentLoginStreak: number;
  
  // Mastery Progress
  totalStarsEarned: number;           // Total 3-star ratings across all levels
  masteryChallengesCompleted: number;
  
  // Social & Competition
  personalBests: Record<number, LevelMasteryRecord>;
  globalRankings: PlayerRankingData;
  
  // Progression Timestamps
  firstPlayDate: number;
  lastPlayDate: number;
  lastDailyRewardClaim: number;
  
  // Customization Progress
  unlockedCustomizations: UnlockedCustomizations;
  activeCustomizations: ActiveCustomizations;
  
  // Achievement Progress
  achievements: AchievementProgress;
  
  // Battle Pass Progress
  battlePassProgress: BattlePassProgress;
  
  // Currency & Resources
  coins: number;                      // Earned through gameplay
  gems?: number;                      // Premium currency (future)
  
  // Feature Unlocks
  unlockedFeatures: UnlockedFeature[];
}

// ===== 3-STAR LEVEL MASTERY SYSTEM =====

export interface LevelMasteryRecord {
  levelId: number;
  
  // Star Ratings (0-3 stars total)
  timeStars: number;                  // 0-1 stars for completion time
  accuracyStars: number;              // 0-1 stars for shot accuracy
  styleStars: number;                 // 0-1 stars for style points
  totalStars: number;                 // Sum of all star categories
  
  // Performance Metrics
  bestTime: number;                   // Milliseconds
  bestAccuracy: number;               // Percentage (0-100)
  maxCombo: number;
  styleScore: number;                 // Points from trick shots, perfect timing, etc.
  
  // Mastery Badges
  badges: MasteryBadge[];
  
  // Completion Status
  firstCompletionDate: number;
  lastAttemptDate: number;
  totalAttempts: number;
}

export interface MasteryBadge {
  id: string;
  name: string;
  description: string;
  rarity: BadgeRarity;
  unlockedDate: number;
}

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface MasteryThresholds {
  // Time Thresholds (level-specific)
  timeGoldThreshold: number;          // Milliseconds for 1 time star
  
  // Accuracy Thresholds
  accuracyGoldThreshold: number;      // Percentage for 1 accuracy star (usually 95%)
  
  // Style Thresholds
  styleGoldThreshold: number;         // Style points for 1 style star
  
  // Perfect Completion Bonus
  perfectCompletionBonus: number;     // Extra points for 3-star completion
}

// ===== ACHIEVEMENT SYSTEM =====

export interface AchievementProgress {
  unlockedAchievements: Set<string>;
  achievementProgress: Record<string, AchievementProgressData>;
  recentlyUnlocked: Achievement[];    // For UI notifications
  totalAchievementScore: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  type: AchievementType;
  
  // Requirements
  target: number;                     // Target value to unlock
  condition: AchievementCondition;
  
  // Rewards
  scoreReward: number;
  coinReward: number;
  unlockReward?: UnlockableItem;      // Cosmetic or feature unlock
  
  // Display Properties
  icon: string;
  rarity: BadgeRarity;
  secretAchievement: boolean;         // Hidden until unlocked
  
  // Analytics
  unlockRate: number;                 // Percentage of players who unlock this
}

export type AchievementCategory = 
  | 'gameplay'                        // Core game mechanics
  | 'mastery'                         // Skill-based achievements
  | 'progression'                     // Level completion milestones
  | 'collection'                      // Unlocking customizations
  | 'social'                          // Sharing and competition
  | 'special'                         // Event or hidden achievements
  | 'daily';                          // Daily activity achievements

export type AchievementType =
  | 'cumulative'                      // Track progress over time (pop 1000 balloons)
  | 'milestone'                       // Single moment achievement (complete level 10)
  | 'streak'                          // Consecutive actions (10 perfect shots in a row)
  | 'challenge'                       // Special conditions (complete level without missing)
  | 'discovery';                      // Finding hidden content or easter eggs

export interface AchievementCondition {
  metric: AchievementMetric;
  comparison: ComparisonOperator;
  value: number;
  timeframe?: TimeframeType;          // Optional time constraint
  contextFilter?: ContextFilter;      // Optional level/mode filter
}

export type AchievementMetric =
  | 'balloons_popped'
  | 'levels_completed' 
  | 'perfect_levels'
  | 'consecutive_hits'
  | 'combo_achieved'
  | 'time_played'
  | 'days_played'
  | 'stars_earned'
  | 'shots_fired'
  | 'accuracy_percentage'
  | 'level_completion_time'
  | 'customizations_unlocked';

export type ComparisonOperator = 'equals' | 'greater_than' | 'less_than' | 'greater_equal' | 'less_equal';

export type TimeframeType = 'single_session' | 'single_level' | 'daily' | 'weekly' | 'all_time';

export interface ContextFilter {
  levelIds?: number[];                // Specific levels only
  difficulties?: string[];            // Specific difficulty tiers only
  modes?: string[];                   // Specific game modes only
}

export interface AchievementProgressData {
  currentValue: number;
  targetValue: number;
  progressPercentage: number;
  firstProgressDate: number;
  lastProgressDate: number;
}

// ===== PETE CUSTOMIZATION SYSTEM =====

export interface UnlockedCustomizations {
  colors: Set<string>;                // Pete color schemes
  trails: Set<string>;                // Movement trail effects
  shootingEffects: Set<string>;       // Projectile visual effects
  poses: Set<string>;                 // Pete idle animations
  emotes: Set<string>;                // Victory celebration animations
  backgrounds: Set<string>;           // Background themes
}

export interface ActiveCustomizations {
  color: string;
  trail: string;
  shootingEffect: string;
  pose: string;
  emote: string;
  background: string;
}

export interface CustomizationItem {
  id: string;
  name: string;
  category: CustomizationCategory;
  rarity: BadgeRarity;
  
  // Unlock Requirements
  unlockCondition: UnlockCondition;
  
  // Visual Properties
  previewImage: string;
  colorPalette: string[];
  animationData?: any;               // Animation configuration
  
  // Monetization
  purchasable: boolean;
  coinCost?: number;
  gemCost?: number;                  // Premium currency
}

export type CustomizationCategory = 'color' | 'trail' | 'shooting_effect' | 'pose' | 'emote' | 'background';

export interface UnlockCondition {
  type: UnlockConditionType;
  requirements: Record<string, any>;
}

export type UnlockConditionType =
  | 'achievement'                     // Unlock specific achievement
  | 'level_completion'                // Complete specific level
  | 'star_total'                      // Earn X total stars
  | 'level_mastery'                   // Get 3 stars on specific level
  | 'streak'                          // Maintain X day login streak
  | 'daily_challenge'                 // Complete X daily challenges
  | 'battle_pass'                     // Reach specific battle pass tier
  | 'purchase';                       // Buy with coins/gems

export interface UnlockableItem {
  type: CustomizationCategory | 'feature' | 'currency' | 'booster';
  itemId: string;
  quantity?: number;
}

// ===== DAILY CHALLENGES SYSTEM =====

export interface DailyChallenge {
  id: string;
  name: string;
  description: string;
  
  // Challenge Definition
  objective: ChallengeObjective;
  difficulty: ChallengeDifficulty;
  
  // Rewards
  baseReward: ChallengeReward;
  streakBonus?: ChallengeReward;      // Extra reward for consecutive completions
  
  // Timing
  startDate: number;                  // When challenge becomes available
  endDate: number;                    // When challenge expires
  refreshType: ChallengeRefreshType;
  
  // Analytics
  completionRate: number;             // Percentage of players who complete
  averageAttempts: number;
}

export interface ChallengeObjective {
  type: ChallengeObjectiveType;
  target: number;
  contextFilter?: ContextFilter;
  allowedAttempts?: number;           // Limit attempts per day
}

export type ChallengeObjectiveType =
  | 'complete_levels'                 // Complete X levels
  | 'pop_balloons'                    // Pop X balloons
  | 'achieve_accuracy'                // Maintain X% accuracy
  | 'earn_score'                      // Earn X points
  | 'perfect_levels'                  // Complete X levels perfectly
  | 'consecutive_hits'                // Hit X consecutive shots
  | 'speed_completion'                // Complete level in under X seconds
  | 'use_no_powerups'                 // Complete level without powerups
  | 'specific_level_mastery';         // Get 3 stars on specific level

export type ChallengeDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export type ChallengeRefreshType = 'daily' | 'weekly' | 'special_event';

export interface ChallengeReward {
  coins: number;
  gems?: number;
  unlockableItem?: UnlockableItem;
  experiencePoints?: number;          // Battle pass XP
}

export interface DailyChallengeProgress {
  challengeId: string;
  currentProgress: number;
  targetProgress: number;
  completed: boolean;
  claimed: boolean;
  completionDate?: number;
  attempts: number;
}

export interface ChallengeHistory {
  completedChallenges: Set<string>;
  currentStreak: number;
  longestStreak: number;
  totalChallengesCompleted: number;
  weeklyCompletionRate: number;
}

// ===== MYSTERY BALLOON & VARIABLE REWARDS =====

export interface MysteryBalloonConfig {
  spawnRate: number;                  // Base probability (0.0-1.0)
  spawnRateProgression: number[];     // Increased rates per level
  
  // Variable Ratio Schedule (psychological addiction)
  minSpawnInterval: number;           // Minimum balloons between mystery spawns
  maxSpawnInterval: number;           // Maximum balloons between mystery spawns
  averageSpawnInterval: number;       // Average (creates uncertainty)
  
  // Visual Properties
  colorScheme: string[];
  shimmerEffect: boolean;
  sparkleIntensity: number;
}

export interface MysteryReward {
  id: string;
  type: MysteryRewardType;
  value: number | string;
  rarity: RewardRarity;
  
  // Drop Rate (variable ratio)
  baseDropRate: number;               // Base probability
  scalingFactor: number;              // How drop rate changes with level
  
  // Player Feedback
  celebrationIntensity: CelebrationLevel;
  announcementText: string;
  particleEffect: string;
}

export type MysteryRewardType =
  | 'coins'                           // Currency reward
  | 'experience'                      // Battle pass XP
  | 'customization'                   // Unlock cosmetic item
  | 'power_boost'                     // Temporary game modifier
  | 'score_multiplier'                // Points multiplier for current level
  | 'achievement_progress'            // Bonus progress toward achievement
  | 'mystery_box';                    // Secondary mystery reward

export type RewardRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type CelebrationLevel = 'subtle' | 'medium' | 'dramatic' | 'spectacular';

// ===== BATTLE PASS SYSTEM =====

export interface BattlePassProgress {
  currentSeason: string;
  currentTier: number;
  currentXP: number;
  xpToNextTier: number;
  
  // Track Progression
  freeTrackRewards: Set<number>;      // Claimed free tier rewards
  premiumTrackRewards: Set<number>;   // Claimed premium tier rewards (if purchased)
  hasPremiumPass: boolean;
  
  // Season History
  completedSeasons: BattlePassSeasonHistory[];
  
  // XP Sources
  xpThisSession: number;
  xpThisWeek: number;
  totalXPEarned: number;
}

export interface BattlePassSeason {
  id: string;
  name: string;
  theme: string;                      // Visual theme (e.g., "Tokyo Neon", "Paris Vintage")
  
  // Timing
  startDate: number;
  endDate: number;
  duration: number;                   // Days
  
  // Structure
  totalTiers: number;
  baseXPPerTier: number;
  xpScalingFactor: number;            // How much more XP each tier requires
  
  // Rewards
  freeTrackRewards: BattlePassReward[];
  premiumTrackRewards: BattlePassReward[];
  
  // Pricing
  premiumPassCost: number;            // In premium currency
  
  // Meta
  backgroundArt: string;
  musicTheme?: string;
}

export interface BattlePassReward {
  tier: number;
  type: BattlePassRewardType;
  itemId: string;
  quantity: number;
  rarity: RewardRarity;
  
  // Display
  name: string;
  description: string;
  icon: string;
  celebrationLevel: CelebrationLevel;
}

export type BattlePassRewardType =
  | 'coins'
  | 'gems'  
  | 'customization'
  | 'achievement_booster'             // 2x progress on achievements
  | 'xp_booster'                      // Bonus XP for next few games
  | 'mystery_balloon_boost'           // Higher mystery balloon spawn rate
  | 'exclusive_cosmetic'              // Season-exclusive items
  | 'emote'
  | 'background_theme';

export interface BattlePassSeasonHistory {
  seasonId: string;
  finalTier: number;
  hadPremiumPass: boolean;
  totalXPEarned: number;
  rewardsEarned: number;
}

export interface XPSource {
  source: XPSourceType;
  baseXP: number;
  bonusMultipliers: XPBonus[];
}

export type XPSourceType =
  | 'level_completion'                // Base XP for finishing level
  | 'star_earned'                     // XP for each mastery star
  | 'achievement_unlock'              // XP for achievements
  | 'daily_challenge'                 // XP for daily challenges
  | 'perfect_accuracy'                // Bonus for 100% accuracy
  | 'speed_bonus'                     // Bonus for fast completion
  | 'combo_bonus'                     // XP for large combos
  | 'daily_first_game'               // Bonus for first game of day
  | 'mystery_balloon';                // XP from mystery balloons

export interface XPBonus {
  type: XPBonusType;
  multiplier: number;
  source: string;                     // What provides this bonus
}

export type XPBonusType = 'premium_pass' | 'weekend_boost' | 'achievement_booster' | 'special_event';

// ===== WORLD MAP PROGRESSION =====

export interface WorldMapRegion {
  id: string;
  name: string;
  landmark: string;                   // Famous landmark (Tokyo Tower, Eiffel Tower, etc.)
  
  // Levels in this region
  levelRange: [number, number];       // [startLevel, endLevel]
  
  // Visual Properties
  backgroundImage: string;
  primaryColor: string;
  accentColor: string;
  
  // Unlock Requirements
  unlockCondition: RegionUnlockCondition;
  
  // Regional Bonuses
  regionBonus?: RegionBonus;
  
  // Completion Rewards
  completionReward: UnlockableItem;
}

export interface RegionUnlockCondition {
  type: 'previous_region_complete' | 'total_stars' | 'specific_level' | 'achievement';
  value: number | string;
}

export interface RegionBonus {
  type: 'xp_multiplier' | 'coin_multiplier' | 'mystery_balloon_boost';
  multiplier: number;
  description: string;
}

export interface WorldMapProgress {
  currentRegion: string;
  unlockedRegions: Set<string>;
  completedRegions: Set<string>;
  regionProgress: Record<string, RegionProgressData>;
}

export interface RegionProgressData {
  levelsCompleted: number;
  totalLevels: number;
  starsEarned: number;
  maxStars: number;
  landmarkVisited: boolean;
}

// ===== GENERAL UTILITY TYPES =====

export type UnlockedFeature = 
  | 'achievements'
  | 'daily_challenges' 
  | 'battle_pass'
  | 'world_map'
  | 'leaderboards'
  | 'mystery_balloons'
  | 'pete_customization'
  | 'advanced_stats';

export interface FeatureUnlockCondition {
  feature: UnlockedFeature;
  condition: UnlockCondition;
  announcement: FeatureAnnouncement;
}

export interface FeatureAnnouncement {
  title: string;
  description: string;
  celebrationLevel: CelebrationLevel;
  tutorialRequired: boolean;
}

export interface PlayerRankingData {
  globalRank?: number;
  localRank?: number;                 // Among friends/region
  percentile?: number;                // Top X% of players
  lastUpdated: number;
}

// ===== EXPORT CONSTANTS =====

export const META_PROGRESSION_CONSTANTS = {
  // Mastery Star Thresholds
  DEFAULT_ACCURACY_GOLD: 95,          // 95% accuracy for gold star
  DEFAULT_STYLE_GOLD: 1000,           // 1000 style points for gold star
  
  // XP Scaling
  BASE_XP_PER_LEVEL: 100,
  XP_SCALING_FACTOR: 1.1,             // Each tier requires 10% more XP
  
  // Mystery Balloon Rates
  BASE_MYSTERY_SPAWN_RATE: 0.05,      // 5% chance per balloon
  MAX_MYSTERY_SPAWN_RATE: 0.15,       // Cap at 15%
  
  // Battle Pass
  DEFAULT_BATTLE_PASS_TIERS: 50,
  PREMIUM_PASS_COST: 500,             // In gems
  
  // Daily Challenges
  MAX_DAILY_CHALLENGES: 3,
  CHALLENGE_STREAK_BONUS_MULTIPLIER: 1.5,
  
  // Currency Scaling
  BASE_COINS_PER_LEVEL: 10,
  COIN_SCALING_FACTOR: 1.05,          // 5% more coins per level
} as const;