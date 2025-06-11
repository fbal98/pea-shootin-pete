# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pea Shootin' Pete is a React Native hyper-casual mobile game built with Expo. Originally a modern remaster of the 1994 DOS game, it has been transformed into a hyper-casual experience where the player controls Pete who shoots peas at bouncing balloon-like enemies that split into smaller pieces when hit.

## Essential Commands

```bash
# Development
npm start                # Start Expo dev server (or expo start)
npm run ios             # Run on iOS simulator
npm run android         # Run on Android emulator  
npm run web             # Run in web browser

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues automatically
npm run format          # Format code with Prettier
npm run type-check      # TypeScript type checking (npx tsc --noEmit)
npm run validate        # Run all checks (type-check + lint + format:check)

# Project Management
npm run reset-project   # Reset to fresh project state
```

## Architecture

### Navigation Structure
- Uses **Expo Router v5** with file-based routing
- **Hyper-casual single-screen approach** - Simple state-based navigation
- Main entry point: `app/index.tsx` (manages all screen transitions)
- **Screen Flow**: Menu ↔ Game ↔ Settings ↔ About
- State-based screen switching with smooth transitions
- Minimal navigation buttons in corners for settings/about access

### Level Progression Game Architecture
```
screens/HyperCasualGameScreen.tsx  # Main game with level progression UI
├── levels/                        # Level configuration system
│   ├── level_001.json            # Tutorial level (5 enemies, basic mechanics)
│   ├── level_002.json            # Progressive difficulty level
│   ├── levels_index.json         # Master level index and metadata
│   └── README.md                 # Level creation documentation
├── systems/
│   └── LevelManager.ts           # Core level loading and progression management
├── hooks/
│   ├── useHyperCasualGameLogic.ts # Wave-based enemy spawning and level physics
│   └── useHyperCasualInput.ts     # Smooth swipe controls for Pete
├── store/
│   ├── gameStore.ts              # Basic game state (score, lives, etc.)
│   └── levelProgressionStore.ts  # Level state, objectives, victory conditions
├── components/
│   ├── game/                     # Level-aware visual game components
│   │   ├── HyperCasualPete.tsx   # Pete with theme-based coloring
│   │   ├── HyperCasualEnemy.tsx  # Enemies with type differentiation
│   │   ├── HyperCasualProjectile.tsx # Projectiles with level physics
│   │   └── HyperCasualBackground.tsx # Theme-based backgrounds
│   └── ui/
│       ├── LevelHUD.tsx          # Level progress, objectives, combo display
│       └── LevelTransition.tsx   # Level start/victory/failure screens
├── constants/
│   ├── GameConfig.ts             # Level-configurable game parameters
│   └── HyperCasualColors.ts      # Theme-based color schemes
├── types/
│   └── LevelTypes.ts             # Comprehensive level configuration types
├── utils/
│   └── analytics.ts              # Level progression analytics tracking
└── screens/
    ├── HyperCasualMenuScreen.tsx # Main menu with level selection
    ├── HyperCasualGameScreen.tsx # Level-based game screen
    ├── HyperCasualSettingsScreen.tsx # Settings integration
    └── HyperCasualAboutScreen.tsx # About screen
```

### Critical Architecture Patterns

#### Level Progression System (NEW)
- **Data-driven design**: All levels defined in JSON with full configurability
- **Hot-reloadable**: Remote config support for live updates without app releases
- **Wave-based spawning**: Complex enemy patterns with timing and positioning control
- **Victory conditions**: Flexible objectives (eliminate all, score targets, time limits)
- **Analytics integration**: Comprehensive tracking per publishing checklist requirements
- **A/B testing ready**: Easy configuration variants and balance testing

#### Hyper-Casual Design Philosophy
- **3-second comprehension**: Game is instantly understandable without tutorials
- **One-touch gameplay**: Tap to shoot, swipe to move Pete smoothly
- **Progressive disclosure**: Tutorial level introduces mechanics gradually
- **Level-based color schemes**: 5 rotating palettes that change per level
- **Persistent progression**: Level unlocking and completion tracking

#### Advanced Balloon Physics System
- **Level-configurable physics**: Gravity, air resistance, and bounce can be modified per level
- **Light gravity**: 40% of normal gravity for floaty balloon feel
- **Air resistance**: 0.5% resistance for realistic balloon movement
- **Enhanced bouncing**: Energetic bounces with trampoline floor
  - Walls: 10% energy loss
  - Floor: 40% energy GAIN (super-bouncy trampoline effect)
  - Ceiling: 20% energy loss
- **Smart splitting**: Enemies split based on level configuration (size, count, behavior)

#### Dual State Management Strategy
- **Game Store** (`store/gameStore.ts`): Basic game state (score, lives, UI state)
- **Level Progression Store** (`store/levelProgressionStore.ts`): Level state, objectives, victory tracking
- **LevelManager**: Singleton for level loading, validation, and player progress
- **High-frequency data in refs**: Position data stored in `useRef` to avoid React re-render overhead
- **Analytics integration**: Real-time event tracking with offline queuing

#### Enhanced Touch Controls System
- **Smooth swipe movement**: Pete follows finger with interpolation and smoothing
- **Tap to shoot**: Instant projectile firing with level progression tracking
- **Combo system**: Consecutive hits build multipliers with visual feedback
- **Responsive feedback**: Level-aware visual and haptic responses

### Key Game Systems
1. **Level Progression**: Data-driven level loading with JSON configuration
2. **Wave Management**: Timed enemy spawning with configurable patterns
3. **Victory Conditions**: Flexible objective system (eliminate all, score, time, combo)
4. **Balloon Physics**: Level-configurable physics with enhanced bouncing
5. **Analytics Tracking**: Comprehensive event tracking for publishing compliance
6. **Theme System**: Level-based color schemes and visual customization
7. **Player Progress**: Level unlocking, completion tracking, and statistics
8. **Collision Detection**: Optimized system with enemy splitting mechanics
9. **UI Transitions**: Professional level start/victory/failure screens
10. **Remote Configuration**: Hot-reloadable level parameters for live updates

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

**Balloon Physics:**
- Gravity multiplier: 40% (lighter than normal physics)
- Air resistance: 0.5% per frame (99.5% retention)
- Wall bounce: 90% energy retained
- Floor bounce: 140% energy GAIN (super-bouncy trampoline)
- Ceiling bounce: 80% energy retained
- Minimum bounce velocity: 280px/s

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

### Hyper-Casual Color Schemes
The game uses 5 rotating color schemes that change per level:

1. **Mint/Teal**: `#4ECDC4` primary, `#F7FFF7` to `#E0F2F1` gradient
2. **Burgundy/Red**: `#C1666B` primary, `#FFF5F5` to `#FFE0E0` gradient  
3. **Purple/Pink**: `#A374D5` primary, `#F5F0FF` to `#E6D5FF` gradient
4. **Soft Pastel**: `#FFB6C1` primary, `#FFF0F5` to `#FFE4E1` gradient
5. **Ocean Blue**: `#4A90E2` primary, `#F0F8FF` to `#E1F5FE` gradient

### Minimal UI Elements
- **Main Menu**: "TAP TO PLAY" with subtle settings/about navigation in corners
- **Settings**: Minimal toggles for sound and haptics only
- **About**: Simple game info, version, and tagline
- **HUD**: Score only, top center, white text with shadow
- **Game Over**: Clean overlay with score and restart/menu options
- **No decorative elements**: All UI serves gameplay purpose

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

### Level Progression System Implementation (Latest - January 2025)
- **Complete level system**: Data-driven JSON configuration with comprehensive TypeScript types
- **LevelManager singleton**: Handles loading, validation, player progress, and remote config
- **Dual state management**: Separated basic game state from level progression state
- **Wave-based enemy spawning**: Configurable enemy patterns with timing and positioning
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

### Hyper-Casual Transformation (Previous)
- **Complete visual overhaul**: Stripped arcade aesthetic for clean hyper-casual design
- **Balloon physics**: Implemented light, bouncy enemy movement with air resistance
- **Color scheme system**: Level-based rotating palettes for visual variety
- **Smooth controls**: Added interpolated swipe movement for Pete
- **High score tracking**: Persistent best score across game sessions
- **Collision fixes**: Resolved duplicate React key issues with Set-based collision detection

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

## Legacy Components (To Be Removed)

The following files are **obsolete** after the hyper-casual transformation and can be safely removed in future cleanup:

### Arcade UI Components (OBSOLETE)
- `components/arcade/` - All arcade-style UI components
- `constants/ArcadeColors.ts` - Neon color palette (replaced by HyperCasualColors.ts)
- `screens/MenuScreen.tsx` - Old arcade menu (replaced by HyperCasualMenuScreen.tsx)
- `screens/EnhancedMenuScreen.tsx` - Enhanced arcade menu
- `screens/GameScreen.tsx` - Old arcade game screen (replaced by HyperCasualGameScreen.tsx)
- `components/ui/EnhancedGameHUD.tsx` - Complex arcade HUD (replaced by HyperCasualHUD.tsx)
- `components/ui/CRTFrame.tsx` - CRT screen effect component
- `components/ui/AnimatedLogo.tsx` - Arcade-style animated logo
- `hooks/useGameLogic.ts` - Complex arcade game logic (replaced by useHyperCasualGameLogic.ts)
- `hooks/useGameInput.ts` - Arcade input handling (replaced by useHyperCasualInput.ts)

### Original Game Components (LEGACY)
- `components/game/Pete.tsx` - Detailed arcade Pete (replaced by HyperCasualPete.tsx)
- `components/game/Enemy.tsx` - Complex arcade enemies (replaced by HyperCasualEnemy.tsx)
- `components/game/Projectile.tsx` - Animated arcade projectiles (replaced by HyperCasualProjectile.tsx)
- `components/game/Starfield.tsx` - Arcade starfield background (replaced by HyperCasualBackground.tsx)

**Note**: These files are kept for reference but are no longer used in the active hyper-casual game.

## Development Notes
- **Level-driven development**: All new features should integrate with the level progression system
- **Data-driven design**: Use JSON configuration for game behavior instead of hardcoding
- **Mobile-first**: Design for touch controls and mobile performance with level-specific optimization
- **Analytics-first**: Track all player interactions for publishing compliance and optimization
- **Remote config ready**: Design features to support hot-reloadable configuration
- **Publishing ready**: Follows 2025 hyper-casual and app store best practices
- **Type-safe**: Comprehensive TypeScript coverage for level system and analytics

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