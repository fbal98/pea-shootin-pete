# Pea Shootin' Pete - Game Glossary

A comprehensive reference guide to all game-specific terms, concepts, mechanics, and elements within the Pea Shootin' Pete game.

## Table of Contents

- [Core Game Concepts](#core-game-concepts)
- [Game Components](#game-components)
- [Physics & Game Mechanics](#physics--game-mechanics)
- [Touch Input System](#touch-input-system)
- [Visual Effects & Animations](#visual-effects--animations)
- [Constants & Configuration](#constants--configuration)
- [Game Engine & Utilities](#game-engine--utilities)

---

## Core Game Concepts

### Pete
The main player character - a yellow cartoon character with black eyes, smile, and red antenna. Size: 40px. Controlled via touch input for movement and shooting.

### Enemy Types
- **Basic Enemy**: Red square with angry face and frown (base speed)
- **Fast Enemy**: Orange diamond (rotated) with worried expression (1.5x speed, unlocked at level 2)
- **Strong Enemy**: Purple square with mean eyes and thick border (0.7x speed, unlocked at level 3)

### Size Levels
Enemies have 3 size variants:
- **Size 3 (Large)**: 100% of base size (30px), splits into 2 medium enemies when hit
- **Size 2 (Medium)**: 85% of base size, splits into 2 small enemies when hit  
- **Size 1 (Small)**: 70% of base size, destroyed when hit (no splitting)

### Projectiles
Green pea shots fired by Pete with glow effect and white core. Size: 10px. Travel vertically upward at 300px/s.

### Splitting Mechanic
When an enemy is hit by a projectile, it splits into two smaller enemies (if not already smallest size). Split enemies inherit horizontal velocity (150px/s) and vertical velocity (200px/s upward).

### Game Loop
Core animation cycle running at 60fps using `requestAnimationFrame`. Manages all game object updates, collision detection, physics, and rendering.

### Starfield
Animated background consisting of 50 stars in 3 depth layers:
- **Background Layer**: 60% of stars, slow speed, dim appearance
- **Middle Layer**: 25% of stars, medium speed
- **Foreground Layer**: 15% of stars, fast speed, bright appearance

---

## Game Components

### GameScreen
Main game component located in `screens/GameScreen.tsx`. Contains all game state management, touch handling, game loop, and renders all game elements.

### Pete Component
Player character component in `components/game/Pete.tsx`. Renders the player with position, size, and visual styling. Accepts position props from parent GameScreen.

### Enemy Component  
Enemy rendering component in `components/game/Enemy.tsx`. Handles visual representation of enemies with different types, sizes, and animated faces.

### Projectile Component
Projectile rendering component in `components/game/Projectile.tsx`. Displays pea shots with pulsing scale animation and glow effects.

### Starfield Component
Background animation component in `components/game/Starfield.tsx`. Manages animated star field with multiple depth layers and scrolling effects.

### MenuScreen
Menu/start screen component in `screens/MenuScreen.tsx` for game navigation and initial UI.

---

## Physics & Game Mechanics

### AABB Collision Detection
Axis-Aligned Bounding Box collision checking algorithm used to detect overlaps between rectangular game objects (Pete, enemies, projectiles).

### Gravity
Constant downward acceleration of 500 pixels per second squared applied to enemies, creating realistic falling motion.

### Bouncing Physics
Enemies bounce off walls, floor, and ceiling. Uses bounce damping factor of 0.8 (20% energy loss per bounce) and minimum bounce velocity of 50px/s.

### deltaTime
Frame-rate independent timing calculation. Represents time elapsed since last frame, used for consistent physics calculations across different device refresh rates.

### Game Area Height
Configurable play area height that defines boundaries for enemy movement and collision detection with walls/ceiling/floor.

### Spawn Rate
Rate at which new enemies appear, increases with player level to create progressive difficulty.

### Score System
Point values based on enemy size when destroyed:
- Small enemies (size 1): 30 points
- Medium enemies (size 2): 20 points  
- Large enemies (size 3): 10 points


---

## Touch Input System

### Tap to Shoot
Touch input mechanism where tapping the screen fires a projectile from Pete's current position.

### Drag to Move
Touch input mechanism where dragging on the screen moves Pete to follow the touch position.

### Touch Coordinates
Screen position data converted to game world coordinates for Pete movement and shooting direction.

### Movement Throttling
16ms throttling interval for Pete movement updates to maintain smooth ~60fps responsiveness.

### Haptic Feedback
Tactile response system that provides vibration feedback when Pete shoots or moves, with 100ms throttling to prevent excessive vibration.

---

## Visual Effects & Animations

### Ripple Effect
Touch feedback animation that creates expanding circle effect at tap location with opacity and scale transitions.

### Pulse Animation
Projectile scaling animation that creates breathing/pulsing effect using sinusoidal timing.

### Float Animation
Subtle hovering effect applied to enemies to make them appear to float.

### Glow Effect
Visual effect applied to projectiles creating a bright, glowing appearance with white core.

### Easing Functions
- **Quad Easing**: Quadratic acceleration/deceleration curves for smooth animations
- **Cubic Easing**: Cubic acceleration/deceleration curves for more dramatic animations

### Animation Timing
Synchronized animation system where all effects use the same deltaTime source for consistent timing across all visual elements.

---

## Constants & Configuration

### PETE_SIZE
40 pixels - standard size for the player character Pete.

### ENEMY_SIZE
30 pixels - base size for enemies before size level scaling is applied.

### PROJECTILE_SIZE
10 pixels - diameter of pea projectiles.

### PROJECTILE_SPEED
300 pixels per second - vertical velocity of fired projectiles.

### ENEMY_SPEED
50 pixels per second - base horizontal movement speed for enemies.

### GRAVITY
500 pixels per second squared - downward acceleration applied to enemies.

### BOUNCE_DAMPING
0.8 - energy retention factor (20% energy loss per bounce).

### MIN_BOUNCE_VELOCITY
50 pixels per second - minimum velocity required for enemies to continue bouncing.

### SPLIT_HORIZONTAL_VELOCITY
150 pixels per second - horizontal velocity applied to enemies when they split.

### SPLIT_VERTICAL_VELOCITY
200 pixels per second - upward velocity applied to enemies when they split.

### HUD_HEIGHT
50 pixels - reserved vertical space for heads-up display elements.

### HEADER_HEIGHT
60 pixels - reserved vertical space for game header/title area.

---

## Game Engine & Utilities

### GameObject Interface
Core data structure defining properties for all game entities (position, size, velocity, etc.).

### GameState Interface
Complete game state container including Pete, enemies, projectiles, score, level, and game status.

### Game Engine Utilities
Functions in `utils/gameEngine.ts` for collision detection, physics calculations, and game object management.

### Unique ID Generation
System for generating unique identifiers for game objects to track them throughout their lifecycle.

---

*This glossary serves as a living document and should be updated as the codebase evolves.*