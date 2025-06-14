# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pea Shootin' Pete is a React Native professional mobile game built with Expo. Originally a modern remaster of the 1994 DOS game, it has evolved into a polished, professional mobile experience with comprehensive progression systems, social features, and monetization. The player controls Pete who shoots peas at bouncing balloon-like enemies that split into smaller pieces when hit.

## Essential Commands

```bash
# Development
npm start                # Start Expo dev server (or expo start)
npm run ios             # Run on iOS simulator
npm run android         # Run on Android emulator  
npm run web             # Run in web browser

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
├── AudioManager.ts            # Audio system with music and sound effects
└── SpatialGrid.ts             # Spatial partitioning for collision optimization

store/                          # State management (Zustand)
├── gameStore.ts               # Basic game state (score, lives, etc.)
├── levelProgressionStore.ts   # Level state, objectives, victory conditions
├── metaProgressionStore.ts    # Long-term player progression
├── economyStore.ts            # In-game economy and purchases
├── socialStore.ts             # Social features state
└── celebrationStore.ts        # Celebration system state

hooks/                          # Custom React hooks
├── useGameLogic.ts           # Wave-based enemy spawning and level physics
├── useGameInput.ts           # Smooth swipe controls for Pete
├── useCelebrationManager.ts   # Celebration system integration
├── useTutorialIntegration.ts  # Tutorial system hooks
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
├── FeatureFlagConfig.ts      # Feature flags for hyper-casual vs full features
└── Colors.ts                 # Standard Expo color definitions

utils/                          # Utility functions and helpers
├── analytics.ts              # Level progression analytics tracking
├── gameEngine.ts             # Core game engine utilities
├── ObjectPool.ts             # Performance optimization
├── PerformanceMonitor.ts     # Performance tracking
├── errorLogger.ts            # Error logging and reporting
├── GameCache.ts              # High-performance caching system
├── MobileOptimizer.ts        # Mobile-specific optimizations
└── StateOptimizer.ts         # State management optimizations

testing/                        # Testing and development tools
├── GameTester.ts             # Game testing utilities
├── analyzeGame.js            # Game analysis tools
├── iosTestSession.js         # iOS testing helpers
└── runGameTests.ts           # Test runner

ios/                           # iOS-specific build files
└── [Standard iOS project structure]
```

### Critical Architecture Patterns

#### Level Progression System (NEW)
- **Data-driven design**: All levels defined in JSON with full configurability
- **Hot-reloadable**: Remote config support for live updates without app releases
- **Wave-based spawning**: Complex enemy patterns with timing and positioning control
- **Victory conditions**: Flexible objectives (eliminate all, score targets, time limits)
- **Analytics integration**: Comprehensive tracking per publishing checklist requirements
- **A/B testing ready**: Easy configuration variants and balance testing

#### Professional Mobile Game Design Philosophy
- **Polished user experience**: Professional UI with smooth animations and transitions
- **Intuitive controls**: Tap to shoot, swipe to move Pete with responsive feedback
- **Comprehensive progression**: Multiple progression systems including levels, achievements, and meta-progression
- **Visual variety**: Professional themes and color schemes that enhance gameplay
- **Player retention**: Daily challenges, social features, and long-term goals

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

#### Enhanced Touch Controls System
- **Smooth swipe movement**: Pete follows finger with interpolation and smoothing
- **Tap to shoot**: Instant projectile firing with level progression tracking
- **Combo system**: Consecutive hits build multipliers with visual feedback
- **Responsive feedback**: Level-aware visual and haptic responses

#### Hyper-Casual Feature Flag System (NEW)
- **Focus on core gameplay**: Feature flags disable complex meta-systems for launch
- **HYPER_CASUAL_FLAGS**: Default configuration eliminating cognitive load for new players
- **Easy feature toggling**: Switch between simple and full feature sets via `ACTIVE_FLAGS`
- **A/B testing ready**: Easy configuration variants for retention optimization
- **Categories**: Core, Tutorial, Meta-progression, Social, Economy, Events, Advanced, Debug
- **Helper functions**: `isFeatureEnabled()` and `getFeatureCategory()` for conditional rendering
- **Development overrides**: Runtime feature flag modification in development mode

### Key Game Systems
1. **Authentic Physics**: Original 1994 DOS game physics with fixed spawn positions and predictable patterns
2. **Level Progression**: Data-driven level loading with JSON configuration
3. **Wave Management**: Original game wave patterns (TWO_SMALL, THREE_SMALL_WIDE, PIPES, etc.)
4. **Victory Conditions**: Flexible objective system (eliminate all, score, time, combo)
5. **Size-Based Movement**: Enemy speed determined by balloon size (Small=80, Medium=64, Large=50)
6. **Analytics Tracking**: Comprehensive event tracking for publishing compliance
7. **Theme System**: Level-based color schemes and visual customization
8. **Player Progress**: Level unlocking, completion tracking, and statistics
9. **Collision Detection**: Optimized system with enemy splitting mechanics
10. **UI Transitions**: Professional level start/victory/failure screens
11. **Remote Configuration**: Hot-reloadable level parameters for live updates
12. **Meta-Progression**: Long-term player advancement beyond individual levels
13. **Social Features**: Friends lists, leaderboards, and social sharing
14. **Tutorial System**: Contextual onboarding and progressive skill introduction
15. **Celebration System**: Dynamic victory celebrations and reward presentations
16. **Mystery Balloons**: Special balloon mechanics with surprise rewards
17. **Daily Challenges**: Time-limited objectives for player retention
18. **Combo System**: Consecutive hit mechanics with multiplier rewards
19. **In-App Purchases**: Monetization through character customization and power-ups
20. **Performance Monitoring**: Real-time FPS tracking and optimization tools
21. **Error Handling**: Comprehensive error logging and crash reporting
22. **Deep Linking**: URL-based navigation for marketing and user acquisition
23. **Viral Tracking**: Social sharing and referral system analytics
24. **Audio System**: Full audio manager with music, sound effects, and user controls
25. **Power-Up System**: Temporary gameplay modifiers with visual feedback and effects
26. **Feature Flags**: Hyper-casual focus with ability to toggle complex features
27. **Game Caching**: High-performance caching for calculations and frame rate optimization
28. **Spatial Partitioning**: Optimized collision detection using spatial grid system
29. **Trail Effects**: Enhanced visual feedback for projectiles and gameplay elements
30. **Mobile Optimization**: Platform-specific optimizations for touch devices

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

**Touch Input:**
- Movement smoothing: 20% interpolation factor
- Smoothing threshold: 0.5px minimum distance
- Update interval: 16ms (60fps)

**Scoring & Progression:**
- Small balloons: 30 points
- Medium balloons: 20 points  
- Large balloons: 10 points
- Level up threshold: 100 points

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

## Visual Design

### Professional Color Themes
The game uses a sophisticated design system with multiple themes:

1. **Default Theme**: Professional blue/purple gradient with clean UI
2. **Dark Theme**: Sophisticated dark mode with high contrast
3. **Colorful Theme**: Vibrant colors for engaging gameplay
4. **Level-specific Themes**: Dynamic themes that adapt to level content

### Professional UI Elements
- **Main Menu**: Polished menu with animated elements and clear navigation
- **World Map**: 3D-inspired level selection with progression tracking
- **Settings**: Professional settings screen with custom styled components
- **About**: Comprehensive about screen with credits and version info
- **Game HUD**: Multi-section HUD with score, level, lives, and objectives
- **Victory Modal**: Engaging completion screen with rewards and progression
- **Transitions**: Smooth, professional animations between screens

### Entity Appearances
- **Pete**: Colored circle with subtle white eyes, matches level color scheme
- **Enemies**: Minimal shapes differentiated by form:
  - Basic: Circle
  - Fast: Diamond (rotated square)
  - Strong: Rounded square
- **Projectiles**: Simple colored dots matching level particle color
- **Background**: Gradient with floating geometric shapes

## Performance Optimizations
- **Simplified rendering**: Minimal draw calls with basic shapes
- **Collision optimization**: Set-based duplicate prevention
- **Smooth animations**: 60fps game loop with deltaTime calculations
- **Memory efficient**: Direct array management instead of object pools for simplicity
- **Mobile optimized**: Light physics and minimal particle effects

## Recent Improvements

### Expert Review Follow-up & Audio Integration (Latest - January 2025) ⭐ NEW FEATURES ⭐
- **Audio System Integration**: Complete AudioManager implementation with background music and sound effects
- **Power-Up System**: Full power-up mechanics with visual HUD, effects, and gameplay integration
- **Feature Flag System**: Hyper-casual focus configuration with ability to toggle complex features
- **Performance Caching**: GameCache system for optimized calculations and reduced frame drops
- **Enhanced UI Components**: SoundToggle with animations, PowerUpHUD with real-time tracking
- **Advanced Input System**: Optimized touch handling with improved responsiveness
- **Trail Effects**: Enhanced projectile visual trails for better gameplay feedback

### Professional Mobile Game Transformation (Previous - January 2025) ⭐ MAJOR ACHIEVEMENT ⭐
- **Professional UI overhaul**: Complete redesign with modern mobile game aesthetics
- **Enhanced world map**: 3D-inspired level selection with dynamic paths and animations
- **Design system**: Implemented comprehensive design tokens and theming system
- **Component architecture**: Modular UI components for consistent design language
- **Performance optimization**: Added specialized optimized components for smooth 60fps gameplay
- **Professional HUD**: Multi-section game HUD with clear information hierarchy
- **Polished menus**: Animated menu screens with professional transitions
- **Custom components**: StyledSwitch, MenuButton, and other reusable UI elements

### Original DOS Game Physics Implementation (Previous - January 2025)
- **Authentic physics system**: Reverse-engineered 1994 DOS game physics through binary analysis
- **Fixed spawn positions**: Enemies spawn at exact Y positions (28.5%, 37.5%, 38.5%) like original
- **Original wave patterns**: TWO_SMALL, THREE_SMALL_WIDE, PIPES, CRAZY, ENTRAP with precise X positions
- **Size-based speeds**: Small=80px/s, Medium=64px/s, Large=50px/s (extracted from original game data)
- **Predictable physics**: 500px/s² gravity, no air resistance, consistent bounce patterns
- **Straight-line projectiles**: 900px/s with no gravity, matching original game behavior
- **Complete level system**: Data-driven JSON configuration with comprehensive TypeScript types
- **LevelManager singleton**: Handles loading, validation, player progress, and remote config
- **Dual state management**: Separated basic game state from level progression state
- **Victory condition system**: Flexible objectives with "eliminate all enemies" implementation
- **Analytics integration**: Full event tracking for publishing checklist compliance
- **UI transitions**: Professional level start/victory/failure screens with animations
- **Level HUD**: Progress tracking, objectives display, and combo system
- **Hot-reloadable config**: Remote configuration support for live balance updates

### Configuration Centralization & Navigation (Previous)
- **Centralized game configuration**: All 47+ scattered constants moved to single `GameConfig.ts`  
- **Level-specific overrides**: Physics and behavior can be modified per level
- **Navigation enhancement**: Added Settings and About screens with hyper-casual design
- **Helper functions**: Easy access functions for balloon sizes, points, and physics
- **A/B testing ready**: Multiple configuration layers for testing and balance

### Clean Architecture Implementation (Previous)
- **Repository cleanup**: Removed obsolete files and documentation
- **Code organization**: Structured components into logical directories
- **Type safety**: Enhanced TypeScript definitions throughout
- **Performance patterns**: Implemented optimized rendering components
- **State management**: Refined Zustand stores for better performance
- **Component modularity**: Created reusable UI components

### Previous Fixes
- **Game loop stability**: Resolved freezing issues with ref-based game loop
- **UI rendering**: Fixed font loading and layout issues
- **Touch responsiveness**: Optimized input handling for mobile devices

## Common Debugging Patterns

### Level System Issues
- **Level not loading**: Check JSON syntax in level files and LevelManager initialization
- **Victory not triggering**: Verify all enemies eliminated and wave completion logic
- **Analytics not tracking**: Ensure analytics initialization and event queue processing
- **Progress not saving**: Check AsyncStorage permissions and LevelManager persistence
- **Wrong level showing**: Verify levelProgressionStore current level state

### Game Loop Issues  
- **Game not animating**: Check if game loop started and `isPlaying` state is true
- **Wave spawning broken**: Verify wave timing logic and enemy spawn definitions
- **Collision issues**: Check collision detection between projectiles and enemies
- **Physics feeling wrong**: Adjust level-specific physics overrides in JSON config
- **Touch not working**: Check touch responder setup and Pete position updates

### Configuration Issues
- **Level config not applying**: Ensure `createLevelConfig()` called with correct overrides
- **Colors not changing**: Verify level theme application in components
- **Performance issues**: Monitor enemy count and wave spawning frequency
- **Type errors**: Run `npm run type-check` and verify LevelTypes compliance


## Development Notes
- **⭐ PROFESSIONAL QUALITY ⭐**: Maintain high standards for UI, UX, and code quality
- **Physics fidelity**: Preserve precise, predictable physics from original DOS game
- **Component-driven**: Use modular, reusable components for consistent design
- **Performance-first**: Optimize for smooth 60fps gameplay on all devices
- **Type-safe**: Comprehensive TypeScript coverage throughout the codebase
- **Analytics-ready**: Track all player interactions for optimization
- **Mobile-optimized**: Design for touch controls and mobile performance
- **Publishing ready**: Follows 2025 mobile game best practices
- **Clean architecture**: Maintain organized, scalable code structure
- **ALWAYS run code quality checks**: Use `npm run validate` before any commit
- **Feature flag driven**: Use `isFeatureEnabled()` for conditional feature rendering
- **Audio integration**: Initialize AudioManager in app startup for music and sound effects
- **Power-up effects**: Use `usePowerUpSystem()` hook for gameplay modifications
- **Cache optimization**: Leverage GameCache for expensive calculations and better performance
- **Isolated systems**: Keep core game hooks in `hooks/core/` for modularity

## Level Development Best Practices
- **Start with JSON**: Define levels in `levels/level_XXX.json` using the established schema
- **Use LevelManager**: Load and validate levels through the centralized manager
- **Track everything**: Implement analytics events for all player actions and level events
- **Test thoroughly**: Validate JSON schema compliance and level progression flow
- **Document levels**: Update `levels/README.md` when adding new mechanics or patterns
- **Balance iteratively**: Use level-specific overrides to fine-tune difficulty without code changes

## Configuration Best Practices
- **Level-specific overrides**: Use JSON config to modify physics, behavior, and visuals per level
- **Type safety**: All level configurations validated against TypeScript types
- **Analytics integration**: Every level event automatically tracked for optimization
- **Remote config ready**: Architecture supports Firebase Remote Config for live updates
- **A/B testing support**: Easy configuration variants through level metadata

## Audio System Integration
The game now includes a comprehensive audio system with background music and sound effects:

### AudioManager Features
- **Singleton pattern**: Global access through `audioManager` instance
- **Music management**: Background music with loop control and volume management
- **Sound effects**: Individual sound loading and playback with error handling
- **User controls**: Sound and music toggle functionality with state persistence
- **Error resilience**: Graceful fallback when audio files fail to load

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

## Key Features & Systems

### Professional Game Features
1. **World Map System**: 3D-inspired level selection with progression tracking
2. **Design Token System**: Comprehensive theming with DesignTokens.ts
3. **Professional HUD**: Multi-section display with GameHeader, LevelSection, ScoreSection, StatusSection
4. **Optimized Rendering**: Dedicated performance components in components/optimized/
5. **Custom UI Components**: StyledSwitch, MenuButton, and other reusable elements
6. **Smooth Animations**: Professional transitions and visual feedback
7. **Responsive Design**: Adapts to different screen sizes and orientations

### Core Systems Integration
- **LevelManager**: Centralized level loading and progression
- **Analytics**: Comprehensive event tracking throughout
- **State Management**: Multiple Zustand stores for different concerns
- **Performance Monitoring**: Built-in FPS tracking and optimization
- **Error Handling**: Comprehensive error boundaries and logging

## Critical Issues & Troubleshooting

### Zustand State Management Issues (RESOLVED - January 2025)

#### The Problem: Infinite Loop from Composite Selectors
**Error**: `"Warning: The result of getSnapshot should be cached to avoid an infinite loop"` followed by `"Maximum update depth exceeded"`

**Root Cause**: Zustand selectors that return new objects on every render cause infinite React re-render loops.

```typescript
// ❌ DANGEROUS - Creates new object every render
export const useUIState = (): UIStateSnapshot => {
  const score = useGameStore(state => state.score);
  const highScore = useGameStore(state => state.highScore);
  // ... other selectors
  
  return { score, highScore, level, lives, gameOver, isPlaying, isPaused }; // NEW OBJECT EVERY TIME
};

// ❌ DANGEROUS - Same issue with level progression
export const useLevelProgress = () => 
  useLevelProgressionStore(state => ({
    enemiesRemaining: state.enemiesRemaining,
    totalEnemies: state.totalEnemies,
    currentScore: state.currentScore,
    accuracy: calculateAccuracy(state.shotsHit, state.shotsFired),
    currentCombo: state.currentCombo
  })); // NEW OBJECT EVERY TIME
```

#### The Solution: Individual Primitive Selectors
**Fix**: Use granular selectors that return primitive values (strings, numbers, booleans) instead of objects.

```typescript
// ✅ SAFE - Returns stable primitive values
export const useScore = () => useGameStore(state => state.score);
export const useHighScore = () => useGameStore(state => state.highScore);
export const useLevel = () => useGameStore(state => state.level);
export const useLives = () => useGameStore(state => state.lives);
export const useGameOver = () => useGameStore(state => state.gameOver);
export const useIsPlaying = () => useGameStore(state => state.isPlaying);
export const useIsPaused = () => useGameStore(state => state.isPaused);

// ✅ SAFE - Level progression individual selectors
export const useEnemiesRemaining = () => useLevelProgressionStore(state => state.enemiesRemaining);
export const useTotalEnemies = () => useLevelProgressionStore(state => state.totalEnemies);
export const useCurrentScore = () => useLevelProgressionStore(state => state.currentScore);
export const useCurrentCombo = () => useLevelProgressionStore(state => state.currentCombo);
// ... etc for all state values
```

#### Files That Were Fixed
1. **`store/gameStore.ts`**: Added deprecation warning to `useUIState()` hook
2. **`store/levelProgressionStore.ts`**: Added individual selectors for all state values
3. **`hooks/useGameLogic.ts`**: Replaced composite selectors with individual ones
4. **`hooks/useGameLogic.ts`**: Applied same fixes to legacy hook
5. **`components/ui/LevelHUD.tsx`**: Replaced `useLevelProgress()` with individual selectors

#### Prevention Guidelines
- **Never return objects from Zustand selectors** - Always return primitive values
- **Use individual selectors** - Create separate hooks for each state value
- **Deprecate composite selectors** - Mark object-returning selectors as deprecated with clear warnings
- **Test with React DevTools** - Watch for excessive re-renders in components
- **Monitor console warnings** - The "getSnapshot should be cached" warning is an early indicator

#### Performance Impact
- **Before fix**: Infinite loops causing app crashes and 100% CPU usage
- **After fix**: Stable 60fps performance, minimal re-renders
- **Component optimization**: Components now only re-render when their specific data changes

#### Warning Signs to Watch For
1. `"Warning: The result of getSnapshot should be cached to avoid an infinite loop"`
2. `"Maximum update depth exceeded"`
3. App becomes unresponsive or crashes
4. Excessive re-renders in React DevTools profiler
5. High CPU usage in development

#### Best Practices for Zustand Selectors
```typescript
// ✅ DO: Individual primitive selectors
const useSpecificValue = () => useStore(state => state.specificValue);

// ✅ DO: Memoized object selectors (when absolutely necessary)
const useComplexData = () => useStore(
  useCallback(state => ({
    computed: state.a + state.b,
    formatted: state.value.toUpperCase()
  }), [])
);

// ❌ DON'T: Object-returning selectors without memoization
const useBadSelector = () => useStore(state => ({ 
  multiple: state.values,
  in: state.object 
}));
```

This issue was critical because it prevented the game from running at all. The fix ensures stable performance and proper React rendering patterns throughout the application.