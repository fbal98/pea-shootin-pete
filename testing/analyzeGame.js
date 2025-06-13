/**
 * Simple Game Analysis Script
 * Analyzes current game configuration and provides improvement recommendations
 */

// Simulate the current game configuration values
const CURRENT_CONFIG = {
  GRAVITY_MULTIPLIER: 0.4,
  ENEMY_BASE_SPEED: 50,
  PROJECTILE_SPEED: 600,
  BALLOON_BASE_SIZE: 45,
  BOUNCE_FLOOR: 1.0,
  BOUNCE_WALL: 1.0,
  BALLOON_SIZE_MULTIPLIERS: {
    LEVEL_1: 0.7, // Small
    LEVEL_2: 0.85, // Medium
    LEVEL_3: 1.0, // Large
  },
  POINTS_BY_SIZE: {
    LEVEL_1: 30,
    LEVEL_2: 20,
    LEVEL_3: 10,
  },
};

class GameAnalyzer {
  analyzeCurrentConfig() {
    console.log('🎮 CURRENT GAME CONFIGURATION ANALYSIS');
    console.log('=====================================\n');

    const issues = [];
    const suggestions = [];

    // Analyze physics
    console.log('⚖️ PHYSICS ANALYSIS:');
    if (CURRENT_CONFIG.GRAVITY_MULTIPLIER <= 0.4) {
      issues.push('Gravity too low - balloons float too slowly');
      console.log('❌ Gravity (0.4x): Too low - creates sluggish, floaty gameplay');
      suggestions.push('Increase gravity to 0.5-0.6x for more action');
    } else {
      console.log('✅ Gravity looks reasonable');
    }

    if (CURRENT_CONFIG.BOUNCE_FLOOR >= 1.0) {
      issues.push('Perfect floor bouncing - balloons bounce forever');
      console.log('❌ Floor bounce (1.0x): Perfect bouncing = infinite bouncing');
      suggestions.push('Reduce floor bounce to 0.9x to add energy loss');
    }

    // Analyze enemy behavior
    console.log('\n🎈 ENEMY BEHAVIOR ANALYSIS:');
    if (CURRENT_CONFIG.ENEMY_BASE_SPEED <= 50) {
      issues.push('Enemy movement too slow for engaging gameplay');
      console.log('❌ Enemy speed (50px/s): Too slow for exciting gameplay');
      suggestions.push('Increase enemy speed to 60-80px/s for more action');
    }

    // Analyze projectile responsiveness
    console.log('\n🚀 PROJECTILE ANALYSIS:');
    if (CURRENT_CONFIG.PROJECTILE_SPEED < 700) {
      issues.push('Projectile speed feels sluggish');
      console.log('⚠️ Projectile speed (600px/s): Could be faster for better responsiveness');
      suggestions.push('Increase projectile speed to 700-800px/s');
    } else {
      console.log('✅ Projectile speed looks good');
    }

    // Analyze balloon progression
    console.log('\n🎯 BALLOON PROGRESSION ANALYSIS:');
    const sizeRatio =
      CURRENT_CONFIG.BALLOON_SIZE_MULTIPLIERS.LEVEL_3 /
      CURRENT_CONFIG.BALLOON_SIZE_MULTIPLIERS.LEVEL_1;
    if (sizeRatio < 1.4) {
      issues.push('Balloon size difference too small');
      console.log(
        `❌ Size progression (${sizeRatio.toFixed(2)}x): Too small for clear visual hierarchy`
      );
      suggestions.push('Make large balloons 1.5x bigger than small ones');
    }

    const pointRatio =
      CURRENT_CONFIG.POINTS_BY_SIZE.LEVEL_1 / CURRENT_CONFIG.POINTS_BY_SIZE.LEVEL_3;
    console.log(
      `📊 Point progression (${pointRatio}x): ${pointRatio >= 3 ? 'Good' : 'Could be better'}`
    );
    if (pointRatio < 3) {
      suggestions.push('Increase point difference - small balloons should give 3x+ points');
    }

    return { issues, suggestions };
  }

  generateOptimizedConfig() {
    console.log('\n🚀 OPTIMIZED CONFIGURATION RECOMMENDATIONS');
    console.log('==========================================\n');

    const optimized = {
      // Physics improvements for better feel
      gravityMultiplier: 0.25, // Much lighter, more casual
      bounceEnergyMultiplier: 0.9, // Slight energy loss prevents infinite bouncing
      airResistanceMultiplier: 1.0, // Keep air resistance as is

      // Responsiveness improvements
      projectileSpeedMultiplier: 1.17, // 700px/s total (600 * 1.17)
      peteSpeedMultiplier: 1.1, // More responsive Pete movement

      // Enemy behavior improvements
      enemySpeedMultiplier: 0.9, // Slightly slower for accessibility
      spawnRateMultiplier: 1.1, // Slightly more frequent spawning

      // Visual/target improvements
      balloonSizeMultiplier: 1.3, // 30% bigger balloons for easier targeting
    };

    console.log('💡 Apply these multipliers to improve fun factor:');
    console.log('```json');
    console.log(JSON.stringify(optimized, null, 2));
    console.log('```\n');

    return optimized;
  }

  calculateFunFactorScore() {
    console.log('📊 FUN FACTOR ANALYSIS');
    console.log('======================\n');

    let score = 5.0; // Base score out of 10
    let breakdown = [];

    // Physics feel (weight: 2.0)
    if (CURRENT_CONFIG.GRAVITY_MULTIPLIER <= 0.3) {
      score += 1.0;
      breakdown.push('✅ Physics: Casual-friendly (+1.0)');
    } else if (CURRENT_CONFIG.GRAVITY_MULTIPLIER <= 0.5) {
      score += 0.5;
      breakdown.push('⚠️ Physics: Decent (+0.5)');
    } else {
      score -= 0.5;
      breakdown.push('❌ Physics: Too heavy (-0.5)');
    }

    // Responsiveness (weight: 1.5)
    if (CURRENT_CONFIG.PROJECTILE_SPEED >= 700) {
      score += 1.0;
      breakdown.push('✅ Responsiveness: Great (+1.0)');
    } else if (CURRENT_CONFIG.PROJECTILE_SPEED >= 600) {
      score += 0.3;
      breakdown.push('⚠️ Responsiveness: OK (+0.3)');
    } else {
      score -= 0.5;
      breakdown.push('❌ Responsiveness: Sluggish (-0.5)');
    }

    // Enemy engagement (weight: 1.5)
    if (CURRENT_CONFIG.ENEMY_BASE_SPEED >= 60 && CURRENT_CONFIG.ENEMY_BASE_SPEED <= 80) {
      score += 1.0;
      breakdown.push('✅ Enemy Speed: Perfect (+1.0)');
    } else if (CURRENT_CONFIG.ENEMY_BASE_SPEED >= 45) {
      score += 0.2;
      breakdown.push('⚠️ Enemy Speed: Acceptable (+0.2)');
    } else {
      score -= 0.8;
      breakdown.push('❌ Enemy Speed: Too slow (-0.8)');
    }

    // Progression clarity (weight: 1.0)
    const sizeRatio =
      CURRENT_CONFIG.BALLOON_SIZE_MULTIPLIERS.LEVEL_3 /
      CURRENT_CONFIG.BALLOON_SIZE_MULTIPLIERS.LEVEL_1;
    if (sizeRatio >= 1.5) {
      score += 0.8;
      breakdown.push('✅ Progression: Clear (+0.8)');
    } else if (sizeRatio >= 1.3) {
      score += 0.4;
      breakdown.push('⚠️ Progression: OK (+0.4)');
    } else {
      score -= 0.3;
      breakdown.push('❌ Progression: Unclear (-0.3)');
    }

    // Infinite bouncing penalty
    if (CURRENT_CONFIG.BOUNCE_FLOOR >= 1.0) {
      score -= 1.0;
      breakdown.push('❌ Bouncing: Infinite bouncing (-1.0)');
    }

    score = Math.max(0, Math.min(10, score));

    console.log('Current Fun Factor Score: ' + score.toFixed(1) + '/10\n');
    breakdown.forEach(item => console.log(item));

    if (score < 6) {
      console.log('\n🚨 CRITICAL: Game needs significant improvements to be fun!');
    } else if (score < 7.5) {
      console.log('\n⚠️ WARNING: Game has fun potential but needs tuning');
    } else {
      console.log('\n✅ GOOD: Game is reasonably fun');
    }

    return score;
  }

  generateActionPlan() {
    console.log('\n\n🎯 IMMEDIATE ACTION PLAN');
    console.log('========================\n');

    console.log('1. 🏃‍♂️ URGENT (Fix immediately):');
    console.log('   - Reduce gravity to 0.25x for lighter, more casual feel');
    console.log('   - Add bounce energy loss (0.9x) to prevent infinite bouncing');
    console.log('   - Increase balloon size by 30% for easier targeting\n');

    console.log('2. 🚀 HIGH PRIORITY (Next iteration):');
    console.log('   - Increase projectile speed to 700px/s for better responsiveness');
    console.log('   - Slightly reduce enemy speed (0.9x) for accessibility');
    console.log('   - Improve Pete movement responsiveness (1.1x speed)\n');

    console.log('3. 🎨 MEDIUM PRIORITY (Polish):');
    console.log('   - Add more visual feedback for successful hits');
    console.log('   - Improve particle effects and screen shake');
    console.log('   - Test different color schemes for better contrast\n');

    console.log('4. 📊 TESTING (Validate changes):');
    console.log('   - Test with casual players (target: 80%+ completion rate)');
    console.log('   - Measure average session time (target: 30-60 seconds)');
    console.log('   - Check retry rate (target: <3 retries per level)\n');
  }
}

// Run the analysis
const analyzer = new GameAnalyzer();
const { issues, suggestions } = analyzer.analyzeCurrentConfig();
const funScore = analyzer.calculateFunFactorScore();
const optimizedConfig = analyzer.generateOptimizedConfig();
analyzer.generateActionPlan();

console.log('\n🏁 ANALYSIS COMPLETE!');
console.log(`Found ${issues.length} issues and ${suggestions.length} suggestions.`);
console.log(`Current fun factor: ${funScore.toFixed(1)}/10`);
