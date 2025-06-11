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

### Hyper-Casual Game Architecture
```
screens/HyperCasualGameScreen.tsx  # Main game with minimal UI
├── hooks/
│   ├── useHyperCasualGameLogic.ts # Simplified game loop and balloon physics
│   └── useHyperCasualInput.ts     # Smooth swipe controls for Pete
├── components/
│   ├── game/                      # Minimal visual game components
│   │   ├── HyperCasualPete.tsx    # Simple circular Pete with subtle eyes
│   │   ├── HyperCasualEnemy.tsx   # Minimal balloon enemies (circle/square/diamond)
│   │   ├── HyperCasualProjectile.tsx # Simple dot projectiles
│   │   └── HyperCasualBackground.tsx # Gradient backgrounds with floating shapes
│   └── ui/
│       └── HyperCasualHUD.tsx     # Score-only display
├── store/
│   └── gameStore.ts               # Zustand state with high score tracking
├── constants/
│   ├── GameConfig.ts              # Centralized game configuration system
│   └── HyperCasualColors.ts       # Level-based color schemes
└── screens/
    ├── HyperCasualMenuScreen.tsx  # Main menu with settings/about navigation
    ├── HyperCasualGameScreen.tsx  # Core game screen
    ├── HyperCasualSettingsScreen.tsx # Minimal settings (sound/haptics)
    └── HyperCasualAboutScreen.tsx # Simple about/version info
```

### Critical Architecture Patterns

#### Hyper-Casual Design Philosophy
- **3-second comprehension**: Game is instantly understandable without tutorials
- **One-touch gameplay**: Tap to shoot, swipe to move Pete smoothly
- **Minimal visual complexity**: Clean gradients, simple shapes, no decorative elements
- **Level-based color schemes**: 5 rotating palettes (mint/teal, burgundy, purple/pink, pastel, ocean blue)
- **Persistent high scores**: Track and display best score across sessions

#### Balloon Physics System
- **Light gravity**: 40% of normal gravity for floaty balloon feel
- **Air resistance**: 2% resistance for realistic balloon movement
- **Enhanced bouncing**: Energetic bounces with trampoline floor
  - Walls: 10% energy loss
  - Floor: 10% energy GAIN (super-bouncy trampoline effect)
  - Ceiling: 20% energy loss
- **No trap zones**: Enemies maintain bounce height to stay above player level

#### State Management Strategy
- **Zustand Store** (`store/gameStore.ts`): Centralized game state with high score persistence
- **High-frequency data in refs**: Position data stored in `useRef` to avoid React re-render overhead
- **Collision detection with Sets**: Prevents duplicate key issues when enemies split
- **Force re-render triggers**: Manual `forceUpdate` for visual updates

#### Touch Controls System
- **Smooth swipe movement**: Pete follows finger with interpolation and smoothing
- **Tap to shoot**: Instant projectile firing on any screen tap
- **No complex gestures**: Single-touch optimized for mobile
- **Responsive feedback**: Immediate visual response to touch input

### Key Game Systems
1. **Balloon Physics**: Light enemies with enhanced bouncing and air resistance
2. **Level Color Schemes**: Rotating visual themes that change every level
3. **High Score Tracking**: Persistent best score display and saving
4. **Collision Detection**: Set-based system preventing duplicate enemy IDs
5. **Enemy Splitting**: Balloons split into two smaller enemies when hit (3 size levels)
6. **Gradient Backgrounds**: Floating geometric shapes for visual depth
7. **Smooth Controls**: Interpolated Pete movement with swipe gestures

## Important Technical Details

- **TypeScript**: Strict mode enabled with `@/*` path alias for imports
- **Platform**: Supports iOS, Android, and Web through Expo
- **Touch Handling**: Uses direct touch responders for immediate response
- **Performance**: Frame-rate independent physics using deltaTime
- **Responsive Design**: Uses `useWindowDimensions` for dynamic screen sizing

## Centralized Game Configuration System

All game behavior is now controlled from a single source: `constants/GameConfig.ts`

### Core Configuration Structure
```typescript
ENTITY_CONFIG      # Pete, Balloon, and Projectile dimensions
BALLOON_PHYSICS    # Gravity, air resistance, bounce coefficients
INPUT_CONFIG       # Touch smoothing and responsiveness
SCORING_CONFIG     # Points system and level progression
ENEMY_CONFIG       # Enemy types, speeds, and behavior  
ANIMATION_CONFIG   # All animation durations and effects
UI_CONFIG          # Font sizes, spacing, layout dimensions
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

### Helper Functions for Easy Access
```typescript
getBalloonSize(sizeLevel: 1 | 2 | 3): number
getBalloonPoints(sizeLevel: 1 | 2 | 3): number
getBalloonOpacity(sizeLevel: 1 | 2 | 3): number
getSpawnInterval(level: number): number
getEnemySpeed(type: 'basic' | 'fast' | 'strong'): number
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

### Configuration Centralization & Navigation (Latest)
- **Centralized game configuration**: All 47+ scattered constants moved to single `GameConfig.ts`
- **Balloon sizing system**: Completely configurable for easy leveling system integration
- **Navigation enhancement**: Added Settings and About screens with hyper-casual design
- **Helper functions**: Easy access functions for balloon sizes, points, and physics
- **A/B testing ready**: Single location to modify all game behavior and balance

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
- **Game not animating**: Check if game loop started and `isPlaying` state is true
- **Collision issues**: Verify Set-based collision detection working properly
- **Color scheme problems**: Ensure level number correctly indexes into color schemes array
- **Physics feeling wrong**: Adjust values in `BALLOON_PHYSICS` section of GameConfig.ts
- **Touch not working**: Check touch responder setup and Pete position updates
- **High score not saving**: Verify Zustand store high score persistence logic
- **Performance issues**: Monitor frame rate and simplify visual effects if needed
- **Configuration changes not taking effect**: Ensure importing correct config section from GameConfig.ts
- **Navigation issues**: Check screen state management in app/index.tsx

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
- **Hyper-casual focus**: Every feature should serve the core gameplay loop
- **Mobile-first**: Design for touch controls and mobile performance
- **Configuration-driven**: All game behavior controlled from centralized GameConfig.ts
- **Leveling system ready**: Balloon sizes and difficulty easily adjustable
- **Iteration-friendly**: Architecture supports rapid A/B testing of mechanics
- **Monetization ready**: Clean checkpoint for adding ads and IAP systems
- **App store ready**: Follows hyper-casual publishing best practices
- **Clean architecture**: New hyper-casual components are completely separate from legacy arcade code

## Configuration Best Practices
- **Modify values in GameConfig.ts**: Single source of truth for all game behavior
- **Use helper functions**: `getBalloonSize()`, `getBalloonPoints()` etc. for type safety
- **Test configuration changes**: Run `npm run type-check` after modifying GameConfig.ts
- **Document significant changes**: Update this CLAUDE.md when adding new config sections
- **Balloon sizing**: Adjust `ENTITY_CONFIG.BALLOON.SIZE_MULTIPLIERS` for leveling system tweaks