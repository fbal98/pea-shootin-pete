# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pea Shootin' Pete is a React Native mobile arcade game built with Expo. This is a modern remaster of the 1994 DOS game, where the player controls Pete who shoots peas at bouncing balloon-like enemies that split into smaller pieces when hit.

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
- Uses **Expo Router v5** with file-based routing and Slot routing
- **Removed tab navigation system** for cleaner arcade-style experience
- Main entry point: `app/index.tsx` (manages MenuScreen ↔ GameScreen navigation)
- Single-screen navigation with state-based screen switching
- Arcade-style menu system with navigation buttons

### Game Architecture
```
screens/GameScreen.tsx     # Main game logic and state management
├── hooks/
│   ├── useGameLogic.ts   # Core game loop, enemy spawning, collision handling
│   └── useGameInput.ts   # Touch input, Pete movement, projectile shooting
├── components/
│   ├── game/             # Visual game components
│   │   ├── Pete.tsx      # Player character (yellow with face & antenna)
│   │   ├── Enemy.tsx     # Enemy objects (3 types with animations & faces)
│   │   ├── Projectile.tsx # Animated pea projectiles (glowing green)
│   │   └── Starfield.tsx # Animated starfield background
│   └── arcade/           # Arcade UI components
│       ├── ArcadeButton.tsx    # Neon-styled buttons with glow effects
│       ├── ArcadeText.tsx      # Multi-color animated text
│       ├── ArcadeContainer.tsx # Styled containers with borders
│       └── index.ts            # Component exports
├── systems/
│   └── CollisionSystem.ts # Collision detection and enemy splitting logic
├── store/
│   └── gameStore.ts      # Zustand state management with optimized selectors
├── constants/
│   ├── GameConfig.ts     # Game mechanics configuration
│   └── ArcadeColors.ts   # Neon color palette and glow effects
└── utils/
    ├── gameEngine.ts     # Core game mechanics (collision, movement, enemy types)
    ├── ObjectPool.ts     # Memory optimization for projectiles and enemies
    ├── PerformanceMonitor.ts # FPS tracking and performance metrics
    └── errorLogger.ts    # Error tracking with haptic feedback integration
```

### Critical Architecture Patterns

#### State Management Strategy
- **Zustand Store** (`store/gameStore.ts`): Centralized game state with stable action references
- **High-frequency data in refs**: Position data stored in `useRef` to avoid React re-render overhead
- **Memoized selectors**: `useGameState()` uses individual selectors + `useMemo` to prevent infinite loops
- **Ref synchronization**: Game state copied to refs in `useGameLogic.ts` for game loop access

#### Game Loop Architecture  
- **Main loop**: `useGameLogic.ts` manages `requestAnimationFrame` game loop
- **Frame-rate independence**: All physics calculations use `deltaTime` for consistent speed
- **Separated concerns**: Game logic separated from input handling and rendering
- **Performance monitoring**: Real-time FPS tracking in development builds

#### Object Pool System
- **Memory optimization**: Pre-allocated pools for projectiles and enemies in `utils/ObjectPool.ts`
- **Pool lifecycle**: Objects acquired from pool → used in game → released back to pool
- **Critical requirement**: ALL game objects must use `objectPools.current.acquireEnemy()` and `objectPools.current.releaseEnemy()`
- **Split enemy handling**: When enemies split in `CollisionSystem.ts`, new enemies MUST be acquired from pool, not created directly

### Key Game Systems
1. **Touch Controls**: Direct responder methods on View component handle tap-to-shoot and drag-to-move
2. **Game Loop**: Uses `requestAnimationFrame` for 60fps synchronization with screen refresh cycle
3. **Collision Detection**: AABB collision checking between game objects in separated `CollisionSystem.ts`
4. **State Management**: High-frequency state (positions) stored in `useRef`, low-frequency state (score, level) in `useState`
5. **Enemy Types**: Three enemy variants with different speeds, appearances, and animations
6. **Bouncing Physics**: Enemies bounce off walls, floor, and ceiling with gravity and damping
7. **Splitting Mechanic**: Enemies split into two smaller enemies when hit (3 size levels total)
8. **Visual Effects**: Animated starfield synchronized with main game loop, glowing projectiles, bouncing enemies, arcade-style neon HUD with LED displays

## Important Technical Details

- **TypeScript**: Strict mode enabled with `@/*` path alias for imports
- **Platform**: Supports iOS, Android, and Web through Expo
- **React**: Version 19.0.0 with React Native 0.79.3
- **Touch Handling**: Uses onResponderGrant/onResponderMove instead of PanResponder to avoid synthetic event issues
- **Performance**: Frame-rate independent physics using deltaTime, optimized state management with useRef for high-frequency updates
- **Responsive Design**: Uses `useWindowDimensions` for dynamic screen sizing and device rotation support

## Game Constants
- Pete size: 40px
- Enemy base size: 30px (scales with size level: 1=70%, 2=85%, 3=100%)
- Projectile size: 10px
- Base projectile speed: 300px/s (shoots vertically upward)
- Gravity: 500px/s²
- Bounce damping: 0.8 (20% energy lost per bounce)
- Score: Size-based (10 pts for large, 20 pts for medium, 30 pts for small)
- Level up: Every 100 points
- Split velocities: 150px/s horizontal, 200px/s vertical
- Pete move throttle: 16ms for smooth touch position updates (~60fps)

## Visual Design

### Arcade UI Architecture
The game features a complete arcade-style transformation:

#### Color Scheme (`constants/ArcadeColors.ts`)
- **Primary Colors**: Hot Pink (#FF1493) and Electric Blue (#00FFFF)
- **Secondary Colors**: Lime Green (#00FF00) and Yellow (#FFFF00) 
- **Background**: Deep Black (#000000) for maximum contrast
- **Glow Effects**: Semi-transparent versions of all colors for neon lighting
- **Typography**: White text with monospace fonts (Courier-Bold on iOS)

#### Arcade Components
- **ArcadeButton**: Rectangular buttons with neon borders, glow effects, and uppercase text
- **ArcadeText**: Multi-color animated text with letter-spacing and glow shadows
- **ArcadeContainer**: Styled containers with neon borders and background overlays
- **LED Numbers**: Zero-padded displays (e.g., "00042") with digital styling

#### Menu System
- **Animated Title**: Multi-color "PEA SHOOTIN' PETE" with elastic entrance animation
- **Navigation Buttons**: START GAME, HOW TO PLAY, SETTINGS with neon styling
- **Background**: Animated starfield with arcade color scheme

#### Game Over Screen
- **Simplified Design**: No initials entry, direct restart/menu options
- **Animated Entrance**: Spring animation with scaling and opacity transitions
- **Score Display**: LED-style formatting with neon glow effects

### Character Appearances
- **Pete**: Yellow cartoon character with black eyes, smile, and red antenna
- **Basic Enemy**: Red square with angry face and frown
- **Fast Enemy**: Orange diamond (rotated) with worried expression (1.5x speed)
- **Strong Enemy**: Purple square with mean eyes and thick border (0.7x speed)

### Animations & Effects
- **Projectiles**: Pulsing scale animation with glow effect and white core
- **Enemies**: Bouncing motion with gravity, wall/floor collisions, and face features that scale with size
- **Background**: 50 animated stars scrolling downward with self-contained `requestAnimationFrame` loop
- **HUD**: LED-style score/level display with hot pink/electric blue neon colors and zero padding
- **Touch Effects**: Ripple animation on tap with eased scaling (quad) and opacity (cubic) transitions
- **Menu Animations**: Elastic title entrance, staggered button fade-ins, continuous glow effects

### Enemy Behavior
- **Spawning**: Enemies spawn at top with random horizontal velocity, spawn rate increases with level
- **Movement**: Bounce off walls, ceiling, and floor with realistic physics using configurable game area height
- **Splitting**: Large enemies (size 3) → 2 medium enemies → 2 small enemies each
- **Size Levels**: 3 (largest, splits twice), 2 (medium, splits once), 1 (smallest, no split)
- **Types**: Basic (red), Fast (orange, 1.5x speed, unlocked level 2), Strong (purple, 0.7x speed, unlocked level 3)

## Critical Implementation Notes

### Preventing Infinite Loops
- **Zustand selectors**: NEVER return new objects directly from `useGameStore()` - use individual selectors + `useMemo`
- **useEffect dependencies**: Be extremely careful with object dependencies that change frequently
- **Ref assignments**: NEVER assign to `.current` during render - always use `useEffect`
- **Animation loops**: Use proper `requestAnimationFrame` cleanup in useEffect return functions

### Object Pool Requirements
- **Enemy splitting**: In `CollisionSystem.ts`, split enemies MUST use `objectPools.current.acquireEnemy()`
- **Memory leaks**: Ensure every `acquireEnemy()` has matching `releaseEnemy()` 
- **Pool exhaustion**: Monitor console for "Object pool exhausted" warnings indicating memory leaks
- **Pool sizing**: Current pools (15-40 objects) may need expansion for exponential enemy splitting

### Performance Optimizations
- **requestAnimationFrame**: Replaces setInterval for smooth 60fps animation synchronized with display refresh
- **State Management**: High-frequency position data stored in useRef to avoid React re-render overhead
- **Render Triggers**: Only essential UI state (score, level, gameOver) triggers React renders
- **Starfield Animation**: Self-contained loop throttled to 30fps to reduce CPU usage
- **Frame-Rate Independence**: All movement calculations use deltaTime for consistent speed across devices

### Recent Bug Fixes & Optimizations

#### Pete Positioning Fix
- **Issue**: Pete appearing off-screen due to incorrect Y offset calculation
- **Solution**: Changed Y offset from -80 to -10 pixels for proper bottom positioning
- **Location**: `hooks/useGameLogic.ts` - Pete position initialization

#### Component Layering
- **Issue**: UI elements appearing behind game components
- **Solution**: Proper z-index and View hierarchy management
- **Impact**: Game Over screen and HUD now properly overlay game area

#### State Management Race Conditions
- **Issue**: Game state initialization causing render loops
- **Solution**: Added `hasInitialized` ref to prevent duplicate initialization
- **Location**: `app/index.tsx` - Component mount lifecycle

### Known Performance Issues

#### Memory Leaks in Object Pool System
- **Issue**: Objects not properly released back to pool during enemy splitting
- **Impact**: Gradual memory buildup, potential app crashes on long sessions
- **Location**: `systems/CollisionSystem.ts` - Enemy split logic
- **Status**: Requires immediate attention

#### Game Loop Race Conditions
- **Issue**: Multiple `requestAnimationFrame` loops running simultaneously
- **Impact**: Inconsistent frame rates, potential performance degradation
- **Status**: Monitoring required

#### Excessive Re-renders
- **Issue**: High-frequency state updates triggering unnecessary React renders
- **Impact**: Reduced frame rate on lower-end devices
- **Solution**: Continue using refs for position data, React state for UI-only changes

### Common Debugging Patterns
- **Game not animating**: Check if `isPlaying` state is true and game loop is running in `useGameLogic.ts`
- **Starfield static**: Verify Starfield component receives proper `isPlaying` prop and has self-contained animation loop
- **Object pool warnings**: Look for objects created directly instead of via `acquireEnemy()`/`acquireProjectile()`
- **Infinite loops**: Check Zustand selectors for new object creation and useEffect dependency arrays
- **Touch not working**: Verify touch responders are properly set up and Pete position updates
- **Pete positioning**: Ensure Y offset calculations account for safe area and proper bottom alignment
- **Arcade styling**: Check ArcadeColors import and component prop passing for consistent theming