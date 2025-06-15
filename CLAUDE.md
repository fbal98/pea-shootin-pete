# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pea Shootin' Pete is a React Native professional mobile game built with Expo. Originally a modern remaster of the 1994 DOS game, it has evolved into a polished, professional mobile experience with comprehensive progression systems, social features, and monetization. The player controls Pete who shoots peas at bouncing balloon-like enemies that split into smaller pieces when hit.

**Recent Major Enhancements (January 2025):**
- **AI Analytics System**: Comprehensive autonomous gameplay analytics for data-driven optimization
- **Advanced Feature Flag System**: Hyper-casual focus with configurable complexity levels
- **Performance Optimization**: High-performance caching and mobile-specific optimizations
- **Enhanced Audio Integration**: Professional audio system with music and sound effects

## Essential Commands

```bash
# Development
npm start                # Start Expo dev server (or expo start)
npm run ios             # Run on iOS simulator
npm run android         # Run on Android emulator  
npm run web             # Run in web browser

# AI Testing & Analytics (ENHANCED)
npm run start:ai         # Start with AI mode enabled for testing
npm run ios:ai          # Run iOS with AI analytics enabled
npm run android:ai      # Run Android with AI analytics enabled

# Balance Testing & Analytics (NEW - PRODUCTION READY)
npm run balance:test     # Run comprehensive balance testing suite
npm run balance:test:all # Run balance tests with full reporting (JSON, CSV, Markdown)
npm run balance:test:quick # Quick balance test (3 runs, levels 1-2)
npm run balance:test:dry # Show test plan without execution

# Code Quality (ALWAYS run before committing)
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues automatically
npm run format          # Format code with Prettier
npm run type-check      # TypeScript type checking (npx tsc --noEmit)
npm run validate        # Run all checks (type-check + lint + format:check)

# Testing & Debugging
expo doctor             # Check for common development issues
npx expo install --fix  # Fix dependency issues

# Project Management
npm run reset-project   # Reset to fresh project state
```

## CLI Balance Testing Suite (REAL AI TESTING) 🚨 CRITICAL FIX APPLIED

The game now includes a production-ready CLI tool for **AUTHENTIC** balance testing using real AI across all levels and personas:

**🚨 MAJOR BUG FIXED**: This tool was previously generating completely fake data - it now uses REAL AI testing via HeadlessGameSimulator!

### Quick Start
```bash
# Run comprehensive balance tests
npm run balance:test

# Generate all report formats with verbose output
npm run balance:test:all

# Quick test for development (3 runs, levels 1-2)
npm run balance:test:quick

# See test plan without execution
npm run balance:test:dry
```

### Advanced Usage
```bash
# Test specific levels
node testing/runBalanceSuite.js --levels=1,2,3 --runs=5

# Test specific personas
node testing/runBalanceSuite.js --personas=nervous_newbie,focused_gamer

# Generate CSV reports for external analysis
node testing/runBalanceSuite.js --format=csv --output=reports

# Parallel testing with custom worker count
node testing/runBalanceSuite.js --parallel=5 --timeout=300

# Full help
node testing/runBalanceSuite.js --help
```

## Architecture

### Navigation Structure
- Uses **Expo Router v5** with file-based routing
- **Professional mobile game navigation** - State-based screen management
- Main entry point: `app/index.tsx` (manages all screen transitions)
- **Screen Flow**: Menu ↔ Game ↔ World Map ↔ Settings ↔ About
- State-based screen switching with smooth transitions
- Professional UI with comprehensive navigation options

### Current Project Architecture
```
app/
├── index.tsx                     # Main entry point with screen routing
├── _layout.tsx                   # Root layout configuration
└── +not-found.tsx               # 404 handling

screens/                          # All game screens
├── GameScreen.tsx               # Main game with level progression UI
├── MenuScreen.tsx               # Professional main menu
├── SettingsScreen.tsx           # Settings with sound and haptics
├── AboutScreen.tsx              # About screen with credits
└── EnhancedWorldMapScreen.tsx   # World map with level progression

components/
├── game/                        # Core game visual components
│   ├── Pete.tsx                # Pete with theme-based coloring
│   ├── Enemy.tsx               # Enemies with type differentiation
│   ├── Projectile.tsx          # Projectiles with level physics
│   ├── GameBackground.tsx      # Theme-based backgrounds
│   └── MysteryBalloon.tsx      # Special mystery balloon mechanic
├── ui/                         # UI components and HUD elements
│   ├── GameHUD.tsx            # Main game HUD with professional design
│   ├── LevelHUD.tsx           # Level progress, objectives, combo display
│   ├── GameHeader.tsx         # Game header with score and status
│   ├── LevelSection.tsx       # Level information display
│   ├── ScoreSection.tsx       # Score display component
│   ├── StatusSection.tsx      # Game status indicators
│   ├── MenuButton.tsx         # Reusable menu button component
│   ├── StyledSwitch.tsx       # Custom styled switch component
│   ├── LevelTransition.tsx    # Level start/victory/failure screens
│   ├── CelebrationSystem.tsx  # Victory celebrations and rewards
│   ├── ProgressionHUD.tsx     # Meta-progression display
│   ├── TutorialOverlay.tsx    # Tutorial system
│   ├── VictoryModal.tsx       # Level completion modal
│   ├── DailyChallengesDisplay.tsx # Daily challenges UI
│   ├── LevelMasteryDisplay.tsx # Level mastery indicators
│   ├── MysteryRewardDisplay.tsx # Mystery reward system
│   ├── EnhancedWorldNode.tsx  # World map node component
│   ├── DynamicPath.tsx        # Animated path connections
│   ├── PowerUpHUD.tsx         # Power-up status display with animations
│   ├── SoundToggle.tsx        # Audio toggle with animations
│   ├── InWorldTutorial.tsx    # In-world tutorial guidance
│   ├── ParticleSystem.tsx     # Particle effects system
│   ├── AtmosphericBackground.tsx # Enhanced background effects
│   ├── AnalyticsDashboard.tsx # AI analytics display and controls (NEW)
│   └── [Other UI components]   # Various UI elements
├── social/                     # Social features
│   └── SocialSharingModal.tsx # Social sharing functionality
├── optimized/                  # Performance-optimized components
│   ├── OptimizedGameRenderer.tsx # Optimized game rendering
│   ├── OptimizedEnemy.tsx      # Performance-optimized enemies
│   ├── OptimizedPete.tsx       # Performance-optimized Pete
│   ├── OptimizedProjectile.tsx # Performance-optimized projectiles
│   └── ViewportCuller.tsx      # Viewport culling system
└── [Standard Expo components]  # ThemedText, ThemedView, etc.

systems/                        # Core game systems and managers
├── LevelManager.ts            # Core level loading and progression management
├── CollisionSystem.ts         # Optimized collision detection
├── ComboSystem.ts             # Combo mechanics and scoring
├── TutorialManager.ts         # Tutorial progression system
├── CelebrationSystem.ts       # Victory celebrations
├── MysteryBalloonManager.ts   # Mystery balloon mechanics
├── DailyChallengeManager.ts   # Daily challenges system
├── SocialManager.ts           # Social features management
├── IAPManager.ts              # In-app purchase system
├── IntegrationManager.ts      # Cross-system integration
├── MicroAchievementSystem.ts  # Micro-achievements
├── SpecialEventsManager.ts    # Special events handling
├── DeepLinkManager.ts         # Deep linking system
├── ViralTrackingManager.ts    # Viral growth tracking
├── AudioManager.ts            # Audio system with music and sound effects (ENHANCED)
└── SpatialGrid.ts             # Spatial partitioning for collision optimization

store/                          # State management (Zustand)
├── gameStore.ts               # Basic game state (score, lives, etc.)
├── levelProgressionStore.ts   # Level state, objectives, victory conditions
├── metaProgressionStore.ts    # Long-term player progression
├── economyStore.ts            # In-game economy and purchases
├── socialStore.ts             # Social features state
└── celebrationStore.ts        # Celebration system state

hooks/                          # Custom React hooks
├── useGameLogicRefactored.ts # Primary game logic with wave spawning and level physics (CURRENT)
├── useGameInput.ts           # Smooth swipe controls for Pete
├── useOptimizedGameInputBridge.ts # Optimized input handling with debouncing
├── useCelebrationManager.ts   # Celebration system integration
├── useTutorialIntegration.ts  # Tutorial system hooks
├── useAIPlayer.ts            # AI player system for automated testing (ENHANCED)
└── core/                     # Core game hooks (isolated systems)
    ├── useGameLoop.ts        # Main game loop management
    ├── useLevelManager.ts    # Level loading and management
    └── usePowerUpSystem.ts   # Power-up system integration

levels/                         # Level configuration system
├── level_001.json            # Tutorial level (5 enemies, basic mechanics)
├── level_002.json            # Progressive difficulty level
├── levels_index.json         # Master level index and metadata
└── README.md                 # Level creation documentation

types/                          # TypeScript type definitions
├── LevelTypes.ts             # Comprehensive level configuration types
├── MetaProgressionTypes.ts   # Meta-progression type definitions
├── SocialTypes.ts            # Social features types
└── TutorialTypes.ts          # Tutorial system types

constants/                      # Configuration and constants
├── GameConfig.ts             # Level-configurable game parameters
├── GameColors.ts             # Professional game color schemes
├── DesignTokens.ts           # Design system tokens and themes
├── FeatureFlagConfig.ts      # Feature flags for hyper-casual vs full features (ENHANCED)
└── Colors.ts                 # Standard Expo color definitions

utils/                          # Utility functions and helpers
├── analytics.ts              # Level progression analytics tracking
├── gameEngine.ts             # Core game engine utilities
├── ObjectPool.ts             # Performance optimization
├── PerformanceMonitor.ts     # Performance tracking
├── errorLogger.ts            # Error logging and reporting
├── GameCache.ts              # High-performance caching system (ENHANCED)
├── MobileOptimizer.ts        # Mobile-specific optimizations
├── StateOptimizer.ts         # State management optimizations
├── AIAnalytics.ts            # AI gameplay analytics and data collection (ENHANCED)
├── HeadlessGameSimulator.ts  # Real AI testing engine for balance analysis (NEW)
└── BalanceAnalyzer.ts        # Persona-based balance reporting system (ENHANCED)

AI System Files                # Autonomous AI testing and analytics (NEW)
├── pete_ai.ts                # Core AI logic for automated gameplay testing
└── AI_ANALYTICS_IMPLEMENTATION.md # Comprehensive AI analytics documentation

testing/                        # Testing and development tools
├── GameTester.ts             # Game testing utilities
├── analyzeGame.js            # Game analysis tools
├── iosTestSession.js         # iOS testing helpers
├── runGameTests.ts           # Test runner
├── runBalanceSuite.js        # CLI balance testing suite with parallel execution (NEW)
└── reports/                  # Generated balance testing reports directory

ios/                           # iOS-specific build files
└── [Standard iOS project structure]
```

### Critical Architecture Patterns
#### Authentic DOS Game Physics System ⭐ CORE GAME PHILOSOPHY ⭐
**CRITICAL**: We ALWAYS want precise, predictable physics with enemies spawning at specific heights and bouncing in consistent patterns. This is based on analysis of the original 1994 DOS game.

- **Fixed spawn positions**: Enemies spawn at exactly 3 Y positions: 28.5%, 37.5%, 38.5% from top
- **Predictable X patterns**: 
  - `TWO_SMALL`: 20% and 80% screen width
  - `THREE_SMALL_WIDE`: 15%, 50%, 85% screen width  
  - `PIPES`: 25%, 50%, 75% screen width
  - `CRAZY`: 10%, 30%, 50%, 70%, 90% screen width
  - `ENTRAP`: 10% and 90% screen width
- **Size-based speeds**: Small=80px/s, Medium=64px/s, Large=50px/s (from original game analysis)
- **Lighter gravity**: 500px/s² (vs normal 800px/s²) for authentic floaty balloon feel
- **No air resistance**: Perfect velocity retention for arcade physics
- **Consistent bounces**: Floor=95%, Wall=90%, Ceiling=85% energy retention
- **Straight-line projectiles**: 900px/s speed with NO gravity (matches original)
- **Smart splitting**: Enemies split based on level configuration (size, count, behavior)

#### Multi-Store State Management Strategy
- **Game Store** (`store/gameStore.ts`): Basic game state (score, lives, UI state)
- **Level Progression Store** (`store/levelProgressionStore.ts`): Level state, objectives, victory tracking
- **Meta-Progression Store** (`store/metaProgressionStore.ts`): Long-term player advancement and unlocks
- **Economy Store** (`store/economyStore.ts`): In-game currency, purchases, and monetization
- **Social Store** (`store/socialStore.ts`): Friends, leaderboards, and social features
- **Celebration Store** (`store/celebrationStore.ts`): Victory celebrations and reward states
- **LevelManager**: Singleton for level loading, validation, and player progress
- **High-frequency data in refs**: Position data stored in `useRef` to avoid React re-render overhead
- **Analytics integration**: Real-time event tracking with offline queuing


#### Hyper-Casual Feature Flag System (NEW)
- **Focus on core gameplay**: Feature flags disable complex meta-systems for launch
- **HYPER_CASUAL_FLAGS**: Default configuration eliminating cognitive load for new players
- **Easy feature toggling**: Switch between simple and full feature sets via `ACTIVE_FLAGS`
- **A/B testing ready**: Easy configuration variants for retention optimization
- **Categories**: Core, Tutorial, Meta-progression, Social, Economy, Events, Advanced, Debug
- **Helper functions**: `isFeatureEnabled()` and `getFeatureCategory()` for conditional rendering
- **Development overrides**: Runtime feature flag modification in development mode

## Important Technical Details

- **TypeScript**: Strict mode enabled with comprehensive type definitions
- **Platform**: Supports iOS, Android, and Web through Expo
- **Level System**: JSON-based configuration with TypeScript validation
- **Analytics**: Event-driven tracking compatible with Firebase Analytics
- **Performance**: Frame-rate independent physics with level-specific optimization
- **Persistence**: AsyncStorage for player progress and level completion
- **Remote Config**: Designed for Firebase Remote Config integration
- **Responsive Design**: Uses `useWindowDimensions` for dynamic screen sizing

## Level Progression Configuration System

The game now uses a comprehensive level system with multiple configuration layers:

### Level JSON Structure (`levels/level_XXX.json`)
```typescript
{
  "id": 1,                          // Level identifier
  "name": "First Pop",              // Display name
  "difficulty": "tutorial",         // Difficulty tier
  "objectives": [...],              // Victory conditions
  "enemyWaves": [...],             // Wave-based enemy spawning
  "environment": {...},            // Physics modifiers
  "theme": {...},                  // Visual customization
  "balance": {...},                // Difficulty parameters
  "metadata": {...}                // Analytics and A/B testing
}
```

### Game Configuration (`constants/GameConfig.ts`)
```typescript
ENTITY_CONFIG      # Pete, Balloon, and Projectile dimensions
BALLOON_PHYSICS    # Gravity, air resistance, bounce coefficients
INPUT_CONFIG       # Touch smoothing and responsiveness
SCORING_CONFIG     # Points system and level progression
ENEMY_CONFIG       # Enemy types, speeds, and behavior  
ANIMATION_CONFIG   # All animation durations and effects
UI_CONFIG          # Font sizes, spacing, layout dimensions
LevelConfigOverrides # Level-specific parameter modifications
```

### Key Configurable Values
**Balloon Sizing (Easily Adjustable for Leveling System):**
- Base size: 30px
- Level 1 (smallest): 70% of base size = 21px
- Level 2 (medium): 85% of base size = 25.5px  
- Level 3 (largest): 100% of base size = 30px

**Original DOS Game Physics (AUTHENTIC):**
- Gravity: 500px/s² (lighter than normal for floaty feel)
- Air resistance: None (1.0 = perfect velocity retention)
- Wall bounce: 90% energy retained
- Floor bounce: 95% energy retained (consistent bouncing)
- Ceiling bounce: 85% energy retained
- Enemy speeds by size: Small=80px/s, Medium=64px/s, Large=50px/s
- Projectile speed: 900px/s with no gravity (straight lines)

### Level Management Functions
```typescript
// Level Loading and Management
levelManager.loadLevel(levelId): Promise<LevelLoadResult>
levelManager.completeLevel(levelId, stats): Promise<void>
levelManager.isLevelUnlocked(levelId): boolean
levelManager.getNextLevel(): LevelID

// Configuration Helpers
getBalloonSize(sizeLevel: 1 | 2 | 3): number
getBalloonPoints(sizeLevel: 1 | 2 | 3): number
createLevelConfig(overrides): LevelConfig
levelBalanceToConfigOverrides(balance): LevelConfigOverrides

// Analytics Integration  
trackLevelStart(levelId, levelName, attempts)
trackLevelComplete(levelId, levelName, score, duration, accuracy)
trackLevelFailed(levelId, levelName, reason, score, duration)
```


### Entity Appearances
- **Pete**: Colored circle with subtle white eyes, matches level color scheme
- **Enemies**: Minimal shapes differentiated by form:
  - Basic: Circle
  - Fast: Diamond (rotated square)
  - Strong: Rounded square
- **Projectiles**: Simple colored dots matching level particle color
- **Background**: Gradient with floating geometric shapes

## Recent Major Improvements

### AI Analytics System (Production Ready)
- **Real AI Testing**: HeadlessGameSimulator provides authentic game physics simulation
- **CLI Testing Suite**: Production-ready balance testing with 5 player personas
- **Performance Optimized**: Reduced object creation from 600+/sec to <50/sec
- **ML-Optimized Export**: Enhanced data format for machine learning analysis
- **Comprehensive Metrics**: 25+ performance indicators including accuracy and reaction times

## Development Notes
- **Primary game logic**: Use `useGameLogicRefactored.ts` as the main game hook
- **State management**: ALWAYS use individual primitive selectors, NEVER composite object selectors
- **Visual rendering**: Pete and enemies render as circles with proper theming (squares = bug)
- **AI testing integration**: Use real AI testing via `HeadlessGameSimulator` - never fake data
- **ALWAYS run code quality checks**: Use `npm run validate` before any commit
- **Component optimization**: Use memoization in OptimizedPete/Enemy/Projectile for performance
- **Cache optimization**: Leverage GameCache for balloon size, speed, and coordinate calculations
- **Environment-based features**: Conditionally enable AI and analytics via `EXPO_PUBLIC_AI_MODE`
- **Level management**: Use LevelManager singleton for all level loading and progression
- **Audio integration**: Initialize AudioManager in app startup for music and sound effects
- **Error prevention**: Monitor for Zustand infinite loop warnings and fix immediately

## AI Analytics Best Practices
- **Real testing only**: Always use HeadlessGameSimulator for authentic balance testing - never fake data
- **Performance optimization**: Use object caching and throttling in useAIPlayer to maintain <50 object creations/sec
- **Batch testing workflow**: Use `npm run balance:test:quick` during development, full suite for final validation
- **Persona-based analysis**: Test all 5 player personas for comprehensive insights
- **Report analysis**: Monitor level health scores (>80% = balanced, <60% = needs attention)

## Level Development Best Practices
- **Start with JSON**: Define levels in `levels/level_XXX.json` using the established schema
- **Use LevelManager**: Load and validate levels through the centralized manager
- **Test thoroughly**: Validate JSON schema compliance and level progression flow
- **Balance iteratively**: Use level-specific overrides to fine-tune difficulty without code changes

## Audio System Integration

### AudioManager Features
- **Singleton pattern**: Global access through `audioManager` instance
- **Music management**: Background music with loop control and volume management
- **Sound effects**: Individual sound loading and playback with error handling
- **User controls**: Sound and music toggle functionality with state persistence

### Audio Implementation
```typescript
// Initialize audio system
await audioManager.loadSounds({
  shoot: require('@/assets/sounds/shoot.wav'),
  hit: require('@/assets/sounds/hit.wav'),
  powerup: require('@/assets/sounds/powerup.wav')
});

// Play sounds during gameplay
audioManager.playSound('shoot'); // On projectile fire
audioManager.playSound('hit');   // On enemy collision

// Control audio state
audioManager.setSoundEnabled(enabled);
audioManager.setMusicEnabled(enabled);
```

## Power-Up System Integration
The power-up system provides temporary gameplay modifiers with visual feedback:

### Power-Up Types
- **Rapid Fire**: Increased fire rate and projectile speed
- **Multi Shot**: Multiple projectiles with spread pattern
- **Power Boost**: Enhanced projectile speed, size, and penetration
- **Explosive Shot**: Projectiles with explosion effects
- **Precision Mode**: Fast, small projectiles with penetration

### Power-Up Implementation
```typescript
// Using the power-up system
const powerUpSystem = usePowerUpSystem();

// Apply effects to projectiles
const enhancedProjectiles = powerUpSystem.createProjectiles(baseProjectile);

// Update power-up duration
powerUpSystem.updateDuration(deltaTime);

// Check power-up status
if (powerUpSystem.isActive) {
  const fireRateMultiplier = powerUpSystem.getFireRateMultiplier();
}
```

### Power-Up UI Components
- **PowerUpHUD**: Real-time display with animations and countdown timer
- **Visual effects**: Pulsing animations and color-coded power-up indicators
- **Duration tracking**: Percentage-based progress indicators

## AI Analytics & Data Collection System ⭐ NEW MAJOR FEATURE ⭐

### Overview
The AI Analytics system provides comprehensive autonomous gameplay data collection for:
- **Data-driven game optimization** and balance tuning
- **Automated regression testing** through AI gameplay sessions
- **Performance monitoring** and technical optimization
- **Game balance insights** and difficulty assessment
- **Machine learning data collection** for predictive modeling

### Core Components

#### 1. AI Player System (`pete_ai.ts`, `hooks/useAIPlayer.ts`)
- **Autonomous gameplay**: AI player that can complete levels independently
- **Configurable behavior**: Multiple presets (aggressive, defensive, stationary, chaotic)
- **Real-time decision making**: 100ms decision intervals with threat assessment
- **Performance tracking**: All actions tracked with timing and accuracy metrics

#### 2. Analytics Engine (`utils/AIAnalytics.ts`)
- **Session management**: Complete lifecycle tracking of AI gameplay sessions
- **Real-time data collection**: 25+ performance metrics captured during gameplay
- **Performance monitoring**: FPS, memory usage, thermal state, and battery impact
- **Data export**: JSON format optimized for machine learning analysis

#### 3. AI Debug Panel (Integrated in GameScreen)
- **Live session monitoring**: Real-time display of AI performance metrics in development mode
- **AI controls**: Toggle AI on/off, switch between presets, view live analytics
- **Performance tracking**: Display FPS, enemy count, accuracy, and other key metrics
- **Export controls**: One-click data export and session management

#### 4. Environment-Based Activation
AI features are conditionally enabled based on environment flags:
```typescript
// Enable AI mode with environment variable
export EXPO_PUBLIC_AI_MODE=true
npm run start:ai    # AI-enabled development mode
```

### Key Metrics Collected
- **Basic Performance**: Total shots, hits, misses, accuracy percentage
- **Movement Analysis**: Movement efficiency, dodge success rate, positioning
- **Timing & Reactions**: Average/fastest/slowest reaction times to threats
- **Threat Assessment**: Threats detected/avoided/hit ratios
- **Performance Metrics**: FPS consistency, frame drops, memory usage
- **Game Balance**: Level completion rates, optimal vs suboptimal decisions

### Usage Examples

```typescript
// Enable AI Analytics
import { useAIPlayer } from '@/hooks/useAIPlayer';
const aiPlayer = useAIPlayer(petePosition, enemies, projectiles, screenWidth, gameAreaHeight, gameLogic, {
  enabled: true,
  enableAnalytics: true,
  preset: 'aggressive'
});

// Access Analytics Data
import { aiAnalytics } from '@/utils/AIAnalytics';
const currentMetrics = aiAnalytics.getCurrentSessionAnalytics();
const exportData = aiAnalytics.exportAnalyticsData();
```

### Data Output Format
```json
{
  "sessionId": "ai_session_1640995200000_abc123def",
  "metrics": {
    "totalShots": 45, "hits": 38, "accuracy": 84.4,
    "averageReactionTime": 156, "averageFPS": 58.2, "levelCompleted": true
  },
  "insights": {
    "levelDifficulty": { "difficultyRating": "balanced", "completionRate": 100 },
    "recommendations": ["Game balance appears optimal based on AI performance"]
  }
}
```

### Benefits
- **Data-Driven Optimization**: Make informed game balance decisions
- **Automated Testing**: Continuous regression testing through AI gameplay
- **Performance Monitoring**: Real-time technical performance tracking

## Enhanced Feature Flag System

### Hyper-Casual Focus Configuration
The feature flag system (`constants/FeatureFlagConfig.ts`) enables precise control over game complexity:
```typescript
// Hyper-casual launch configuration
export const HYPER_CASUAL_FLAGS: FeatureFlags = {
  core: { gamePlay: true, basicUI: true, levelProgression: true, scoring: true },
  tutorial: { modalOverlays: false, animatedCues: true, complexTutorial: false },
  metaProgression: { dailyChallenges: false, achievements: false, battlePass: false },
  social: { friendsSystem: false, leaderboards: false, socialSharing: false },
  economy: { inAppPurchases: false, characterCustomization: false, powerUpShop: false }
};

// Check feature availability
if (isFeatureEnabled('metaProgression.achievements')) {
  // Show achievements UI
}
```

## High-Performance Caching System

### GameCache Optimization (`utils/GameCache.ts`)
```typescript
import { gameCache } from '@/utils/GameCache';

// Cache balloon calculations
const balloonSize = gameCache.getBalloonSize(sizeLevel);
const balloonPoints = gameCache.getBalloonPoints(sizeLevel);
const enemySpeed = gameCache.getEnemySpeed(sizeLevel);

// Monitor cache performance  
const stats = gameCache.getCacheStats();
console.log(`Cache hit rate: ${stats.hitRate}%`);
```

## Critical State Management Issues (RESOLVED)

### Problem: Infinite Loop from Composite Selectors
**Error**: `"Warning: The result of getSnapshot should be cached to avoid an infinite loop"` followed by `"Maximum update depth exceeded"`

**Root Cause**: Zustand selectors that return new objects on every render cause infinite React re-render loops.

```typescript
// ❌ DANGEROUS - Creates new object every render
export const useUIState = (): UIStateSnapshot => {
  const score = useGameStore(state => state.score);
  const highScore = useGameStore(state => state.highScore);
  
  return { score, highScore, level, lives, gameOver, isPlaying, isPaused }; // NEW OBJECT EVERY TIME
};
```

### Solution: Individual Primitive Selectors
**Fix**: Use granular selectors that return primitive values (strings, numbers, booleans) instead of objects.

```typescript
// ✅ SAFE - Returns stable primitive values
export const useScore = () => useGameStore(state => state.score);
export const useHighScore = () => useGameStore(state => state.highScore);
export const useLevel = () => useGameStore(state => state.level);
```

### Prevention Guidelines
- **Never return objects from Zustand selectors** - Always return primitive values
- **Use individual selectors** - Create separate hooks for each state value
- **Monitor console warnings** - The "getSnapshot should be cached" warning is an early indicator

### Current Architecture State (January 2025) ✅ STABLE

#### ✅ **WORKING SYSTEMS**
- **Game Startup**: App initializes properly with professional navigation
- **Enemy Spawning**: Wave management fully functional in `useGameLogicRefactored.ts`
- **Visual Rendering**: Pete and enemies appear as proper circles with level theming
- **State Management**: Individual primitive selectors prevent infinite loops
- **AI Analytics**: Real testing produces authentic balance data
- **Performance**: Simplified optimization provides stable 60fps
- **Level System**: 10 levels with JSON configuration
- **Audio System**: Background music and sound effects integrated
- **Professional UI**: Complete mobile game UI with world map and HUD

#### 🔧 **ARCHITECTURAL DECISIONS**
- **Primary Hook**: `useGameLogicRefactored.ts` is the main game logic
- **Optimization Strategy**: Simplified approach without dynamic quality adjustment
- **State Pattern**: Individual primitive selectors only (no composite objects)
- **Rendering Strategy**: OptimizedGameRenderer with viewport culling
- **AI Integration**: Environment-based activation via `EXPO_PUBLIC_AI_MODE`