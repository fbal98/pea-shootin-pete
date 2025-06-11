# Levels Directory

This directory contains all level configurations for Pea Shootin' Pete. The level system is designed to be data-driven, allowing for easy modification, A/B testing, and remote configuration.

## File Structure

- `levels_index.json` - Master index of all available levels
- `level_XXX.json` - Individual level configuration files
- `README.md` - This documentation file

## Level Numbering Convention

- `level_001.json` - Level 1 (Tutorial)
- `level_002.json` - Level 2 (Easy)
- `level_XXX.json` - Continue with zero-padded numbers

## Level Configuration Format

Each level file follows the TypeScript interface defined in `/types/LevelTypes.ts`. Key sections:

### Core Metadata
```json
{
  "id": 1,
  "name": "Level Name",
  "version": "1.0.0",
  "difficulty": "tutorial|easy|medium|hard|expert|nightmare",
  "estimatedDuration": 45
}
```

### Victory Conditions
```json
{
  "objectives": [
    {
      "type": "eliminate_all_enemies",
      "target": 5,
      "description": "Pop all balloons!",
      "isOptional": false,
      "rewardMultiplier": 1.0
    }
  ]
}
```

### Enemy Waves
```json
{
  "enemyWaves": [
    {
      "id": "wave_1",
      "startTime": 2.0,
      "duration": 30.0,
      "enemies": [
        {
          "type": "basic",
          "count": 3,
          "sizeLevel": 3,
          "spawnInterval": 3.0,
          "movementType": "physics_normal",
          "movementSpeed": 1.0,
          "splitBehavior": {
            "enabled": true,
            "minSizeToSplit": 2,
            "splitInto": 2,
            "childSizeReduction": 0.7,
            "childSpeedBonus": 1.1
          }
        }
      ],
      "spawnPattern": "left_to_right"
    }
  ]
}
```

## Difficulty Guidelines

Based on the Publishing Checklist requirements:

| Difficulty | Target Fail Rate | Level Range | Description |
|------------|------------------|-------------|-------------|
| Tutorial   | 5%              | 1           | Learn basics |
| Easy       | 15%             | 2-5         | Gentle progression |
| Medium     | 25%             | 6-15        | Moderate challenge |
| Hard       | 35%             | 16-30       | Serious challenge |
| Expert     | 45%             | 31-50       | Master level |
| Nightmare  | 60%             | 51+         | Ultimate challenge |

## Balance Parameters

### Enemy Speed Multipliers
- `0.8` = 20% slower (tutorial)
- `1.0` = Normal speed
- `1.2` = 20% faster (challenging)

### Spawn Rate Multipliers
- `1.2` = 20% more frequent spawning
- `1.0` = Normal spawn rate
- `0.8` = 20% less frequent spawning

### Balloon Size Multipliers
- `1.1` = 10% larger (easier to hit)
- `1.0` = Normal size
- `0.9` = 10% smaller (harder to hit)

## Color Schemes

The game uses 5 rotating color schemes:

1. **Mint/Teal** (`#4ECDC4`) - Fresh, calming
2. **Burgundy/Red** (`#C1666B`) - Warm, energetic  
3. **Purple/Pink** (`#A374D5`) - Playful, magical
4. **Soft Pastel** (`#FFB6C1`) - Gentle, dreamy
5. **Ocean Blue** (`#4A90E2`) - Cool, trustworthy

## Enemy Types

- `basic` - Standard balloon with normal physics
- `fast` - Moves 30% faster than basic
- `strong` - Takes 2 hits to pop (splits differently)
- `bouncer` - Extra bouncy physics
- `splitter` - Splits into more pieces
- `ghost` - Partially transparent, harder to see

## Movement Types

- `physics_normal` - Standard balloon physics
- `physics_heavy` - More affected by gravity
- `physics_floaty` - Less affected by gravity  
- `pattern_zigzag` - Predictable zigzag movement
- `pattern_circular` - Circular motion
- `pattern_homing` - Slowly moves toward Pete
- `chaotic_random` - Unpredictable movement

## Spawn Patterns

- `random` - Random positions across top
- `left_to_right` - Sequential from left
- `center_out` - From center outward  
- `corners_first` - Prioritize corners
- `wave_formation` - Coordinated wave pattern

## Adding New Levels

1. Create new `level_XXX.json` file with incremented number
2. Follow the JSON schema defined in `/types/LevelTypes.ts`
3. Update `levels_index.json` to include the new level
4. Test the level in the game
5. Validate JSON schema compliance

## A/B Testing Support

Levels support A/B testing through:
- `version` field for different level variants
- `testGroup` in metadata
- `variant` specification
- Remote config overrides

## Analytics Integration

Each level automatically tracks:
- `level_start` - When level begins
- `level_complete` - When objectives are met
- `level_failed` - When failure conditions are met
- `objective_complete` - When individual objectives are met
- `retry_level` - When player retries after failure

## Remote Configuration

The level system supports remote configuration for:
- Enabling/disabling specific levels
- Global difficulty multipliers
- Feature flags (powerups, achievements, etc.)
- A/B testing parameters

## Validation

All level files are validated against the JSON schema defined in `/types/LevelTypes.ts`. Use the LevelManager's validation functions to check level files before deployment.

## Performance Considerations

- Keep `totalEnemyCount` under 50 for mobile performance
- Limit simultaneous enemies to 10-15 on screen
- Use reasonable spawn intervals (minimum 0.5 seconds)
- Avoid excessive particle effects on lower-end devices

## Best Practices

1. **Start Simple**: Begin with basic enemy types and simple objectives
2. **Progressive Difficulty**: Gradually introduce new mechanics every 5 levels
3. **Clear Objectives**: Make victory conditions obvious to players
4. **Balanced Rewards**: Match rewards to difficulty and time investment
5. **Test Thoroughly**: Validate on multiple devices and skill levels
6. **Document Changes**: Update balance notes when modifying levels

## Future Expansion

The level system is designed to support:
- Power-ups and special abilities
- Environmental obstacles
- Boss enemies
- Multiplayer modes
- Seasonal events
- User-generated content