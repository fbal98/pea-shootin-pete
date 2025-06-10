# Pea Shootin' Pete 🟢

A React Native mobile arcade game built with Expo - a modern remaster of the 1994 DOS classic with full **arcade-style neon UI**. Control Pete as he defends against bouncing balloon-like enemies that split when hit!

🎨 **New in v2.0**: Complete arcade-style visual overhaul with hot pink/electric blue neon colors, LED-style displays, animated menus, and simplified navigation.

![React Native](https://img.shields.io/badge/React_Native-0.79.3-blue)
![Expo](https://img.shields.io/badge/Expo-53.0.10-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## 🎮 Game Features

### Arcade-Style UI & Visual Design
- **Neon Color Scheme**: Hot pink (#FF1493) and electric blue (#00FFFF) primary colors
- **LED-Style Displays**: Zero-padded score displays (e.g., "00042") with glow effects  
- **Animated Menu**: Multi-color title with elastic entrance animations
- **Arcade Buttons**: Rectangular neon buttons with glow effects and uppercase text
- **Retro Typography**: Monospace fonts (Courier-Bold) with letter spacing

### Game Mechanics
- **Touch Controls**: Tap to shoot, drag to move Pete
- **Enemy Types**: Three enemy variants with unique behaviors
  - Basic (Red): Standard speed
  - Fast (Orange): 1.5x speed, unlocked at level 2
  - Strong (Purple): 0.7x speed, more durable, unlocked at level 3
- **Physics System**: Realistic bouncing with gravity and damping
- **Split Mechanics**: Enemies split into smaller versions when hit
- **Progressive Difficulty**: Enemy spawn rate increases with level
- **Visual Effects**: Animated starfield, glowing projectiles, character animations
- **Haptic Feedback**: Touch response and collision feedback

## 🚀 Quick Start

### Prerequisites
- Node.js (v20.17.0 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/pea-shootin-pete.git
cd pea-shootin-pete

# Install dependencies
npm install

# Start the development server
npm start
```

### Running the Game

```bash
# iOS Simulator
npm run ios

# Android Emulator  
npm run android

# Web Browser (experimental)
npm run web
```

## 🏗️ Architecture

### State Management
- **Zustand**: Centralized game state with optimized selectors
- **Performance-focused**: High-frequency updates in refs, UI state in React

### Project Structure
```
pea-shootin-pete/
├── app/                    # Expo Router navigation (Slot routing)
│   ├── index.tsx          # Main entry point (MenuScreen ↔ GameScreen)
│   └── _layout.tsx        # Root layout with error boundary
├── components/            
│   ├── game/              # Game-specific components
│   │   ├── Pete.tsx       # Player character
│   │   ├── Enemy.tsx      # Enemy entities
│   │   ├── Projectile.tsx # Pea projectiles
│   │   └── Starfield.tsx  # Background animation
│   ├── arcade/            # Arcade UI components (NEW)
│   │   ├── ArcadeButton.tsx    # Neon-styled buttons
│   │   ├── ArcadeText.tsx      # Multi-color animated text
│   │   ├── ArcadeContainer.tsx # Styled containers
│   │   └── index.ts            # Component exports
│   └── GameErrorBoundary.tsx # Game-specific error handling
├── screens/
│   ├── GameScreen.tsx     # Main game view with arcade HUD
│   └── MenuScreen.tsx     # Arcade-styled start menu
├── hooks/
│   ├── useGameLogic.ts    # Core game loop and mechanics
│   └── useGameInput.ts    # Touch input handling
├── systems/
│   └── CollisionSystem.ts # Collision detection and resolution
├── store/
│   └── gameStore.ts       # Zustand state management
├── utils/
│   ├── gameEngine.ts      # Physics and movement
│   ├── ObjectPool.ts      # Performance optimization
│   ├── errorLogger.ts     # Error tracking
│   └── PerformanceMonitor.ts # FPS monitoring
└── constants/
    ├── GameConfig.ts      # Game configuration
    └── ArcadeColors.ts    # Neon color palette (NEW)

```

### Key Systems

#### Game Loop
- Uses `requestAnimationFrame` for 60fps synchronization
- Frame-rate independent physics with deltaTime
- Optimized render triggers only for essential updates

#### Collision System
- AABB (Axis-Aligned Bounding Box) detection
- Separated collision detection from game logic
- Event-based collision handling

#### Object Pooling
- Reduces garbage collection pressure
- Pre-allocated pools for projectiles and enemies
- Automatic pool management with statistics

#### Performance Monitoring
- Real-time FPS counter (development only)
- Frame time tracking
- Memory usage monitoring
- Dropped frame detection

## 🛠️ Development

### Available Scripts

```bash
# Development
npm start              # Start Expo dev server
npm run ios           # Run on iOS simulator
npm run android       # Run on Android emulator
npm run web           # Run in browser

# Code Quality
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint issues
npm run format        # Format code with Prettier
npm run type-check    # TypeScript validation
npm run validate      # Run all checks

# Project Management
npm run reset-project # Reset to fresh state
```

### Development Tools

- **TypeScript**: Strict mode enabled for type safety
- **ESLint**: Custom configuration for React Native
- **Prettier**: Code formatting with project standards
- **Metro**: Optimized bundler configuration
- **Error Boundaries**: Comprehensive error handling
- **Performance Monitor**: FPS tracking in development

### Debugging

1. **FPS Counter**: Visible in top-right corner (dev mode)
2. **Error Logging**: Check console for detailed error context
3. **Object Pool Stats**: Monitor memory usage in console
4. **Collision Events**: Logged with haptic feedback

## 🎯 Game Mechanics

### Controls
- **Tap**: Shoot pea projectile upward
- **Drag**: Move Pete horizontally
- **Touch & Hold**: Continuous movement

### Scoring System
- Large enemies (Size 3): 10 points
- Medium enemies (Size 2): 20 points  
- Small enemies (Size 1): 30 points
- Level up every 100 points

### Enemy Behavior
- Spawn from top with random horizontal velocity
- Bounce off walls, floor, and ceiling
- Affected by gravity (500 px/s²)
- Energy loss on bounce (20% damping)
- Split into two smaller enemies when hit

### Power-ups & Features
- Progressive difficulty with faster spawn rates
- Multiple enemy types with unique characteristics
- Visual feedback with ripple effects
- Haptic feedback on all interactions

## 🔧 Configuration

All game constants are centralized in `constants/GameConfig.ts`:

```typescript
// Example configuration
PETE_SIZE: 40,
PROJECTILE_SPEED: 300,
GRAVITY: 500,
ENEMY_SPAWN_BASE_INTERVAL: 2000,
// ... and many more
```

## 📱 Platform Support

- ✅ iOS (14.0+)
- ✅ Android (API 21+)
- ⚠️ Web (Experimental)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- Follow existing TypeScript patterns
- Use ESLint and Prettier configurations
- Write meaningful commit messages
- Add appropriate error handling
- Consider performance implications

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Original Pea Shootin' Pete (1994) for inspiration
- Expo team for the excellent framework
- React Native community for tools and libraries

## 🐛 Known Issues & Recent Fixes

### Recently Fixed (v2.0)
- ✅ **Pete Positioning**: Fixed Pete appearing off-screen (Y offset corrected from -80 to -10)
- ✅ **Component Layering**: Game Over screen and HUD now properly overlay game area
- ✅ **Navigation System**: Removed tab navigation for cleaner arcade experience
- ✅ **UI Overhaul**: Complete arcade-style transformation with neon colors

### Current Known Issues
- ⚠️ **Memory Leaks**: Object pool system has memory leaks during enemy splitting (high priority)
- ⚠️ **Game Loop Race Conditions**: Multiple animation loops may run simultaneously
- ⚠️ **Performance**: Excessive re-renders on high enemy counts
- 🌐 **Web Platform**: Limited haptic feedback support
- 📱 **Low-end Devices**: Starfield animation may stutter
- 🔊 **Audio**: Sound system not yet implemented

### Performance Monitoring
- Real-time FPS counter available in development builds
- Memory usage tracking for object pools
- Frame time monitoring for optimization

## 📮 Contact

For questions, suggestions, or bug reports, please open an issue on GitHub.