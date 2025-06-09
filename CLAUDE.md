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
npx tsc --noEmit       # TypeScript type checking

# Project Management
npm run reset-project   # Reset to fresh project state
```

## Architecture

### Navigation Structure
- Uses **Expo Router v5** with file-based routing
- Tab navigation defined in `app/(tabs)/_layout.tsx`
- Main game tab: `app/(tabs)/index.tsx`
- About/info tab: `app/(tabs)/explore.tsx`

### Game Architecture
```
screens/GameScreen.tsx     # Main game logic and state management
├── components/game/       # Visual game components
│   ├── Pete.tsx          # Player character (yellow with face & antenna)
│   ├── Enemy.tsx         # Enemy objects (3 types with animations & faces)
│   ├── Projectile.tsx    # Animated pea projectiles (glowing green)
│   └── Starfield.tsx     # Animated starfield background
└── utils/gameEngine.ts   # Core game mechanics (collision, movement, enemy types)
```

### Key Game Systems
1. **Touch Controls**: Direct responder methods on View component handle tap-to-shoot and drag-to-move
2. **Game Loop**: Uses setInterval for physics updates (16ms) and enemy spawning (dynamic based on level)
3. **Collision Detection**: AABB collision checking between game objects
4. **State Management**: Single GameState object containing pete, enemies, projectiles, score, level, gameOver
5. **Enemy Types**: Three enemy variants with different speeds, appearances, and animations
6. **Bouncing Physics**: Enemies bounce off walls, floor, and ceiling with gravity and damping
7. **Splitting Mechanic**: Enemies split into two smaller enemies when hit (3 size levels total)
8. **Visual Effects**: Animated starfield, glowing projectiles, bouncing enemies, retro HUD styling

## Important Technical Details

- **TypeScript**: Strict mode enabled with `@/*` path alias for imports
- **Platform**: Supports iOS, Android, and Web through Expo
- **React**: Version 19.0.0 with React Native 0.79.3
- **Touch Handling**: Uses onResponderGrant/onResponderMove instead of PanResponder to avoid synthetic event issues

## Game Constants
- Pete size: 40px
- Enemy base size: 30px (scales with size level: 1=70%, 2=85%, 3=100%)
- Projectile size: 10px
- Base projectile speed: 300px/s (shoots vertically upward)
- Gravity: 500px/s²
- Bounce damping: 0.8 (20% energy lost per bounce)
- Score: Size-based (10 pts for large, 20 pts for medium, 30 pts for small)
- Level up: Every 100 points

## Visual Design
### Character Appearances
- **Pete**: Yellow cartoon character with black eyes, smile, and red antenna
- **Basic Enemy**: Red square with angry face and frown
- **Fast Enemy**: Orange diamond (rotated) with worried expression (1.5x speed)
- **Strong Enemy**: Purple square with mean eyes and thick border (0.7x speed)

### Animations & Effects
- **Projectiles**: Pulsing scale animation with glow effect and white core
- **Enemies**: Bouncing motion with gravity, wall/floor collisions, and face features that scale with size
- **Background**: 50 animated stars scrolling downward at varying speeds
- **HUD**: Retro-styled with cyan/magenta colors, monospace font, and glow effects

### Enemy Behavior
- **Spawning**: Enemies spawn at top with random horizontal velocity
- **Movement**: Bounce off walls, ceiling, and floor with realistic physics
- **Splitting**: Large enemies (size 3) → 2 medium enemies → 2 small enemies each
- **Size Levels**: 3 (largest, splits twice), 2 (medium, splits once), 1 (smallest, no split)
- **Types**: Basic (red), Fast (orange, 1.5x speed), Strong (purple, 0.7x speed)