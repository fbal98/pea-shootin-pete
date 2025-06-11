# Pea Shootin' Pete - Publishing Checklist

## 🎯 Overview
This comprehensive checklist covers all requirements for publishing Pea Shootin' Pete as a hyper-casual mobile game on iOS App Store and Google Play Store, including technical requirements, monetization, and retention mechanics.

---

## 📱 Platform Requirements

### iOS App Store Requirements ✅
- [ ] **Build Configuration**
  - [ ] Target iOS 14+ (currently supporting iOS/Android/Web ✓)
  - [ ] Use Xcode 14.1 or later for build
  - [ ] Ensure app size under 200MB for cellular download
  - [ ] Test on iPhone 6s and newer devices
  - [ ] Maintain 60fps on all supported devices

- [ ] **Required Assets**
  - [ ] App Icon: 1024x1024px PNG (no alpha)
  - [ ] Screenshots: 6.7", 6.5", 5.5" (minimum 2 each)
  - [ ] App Preview Video: 15-30 seconds (optional but recommended)
  - [ ] App Store Description: 4000 chars max
  - [ ] Keywords: 100 chars (e.g., "hyper-casual arcade shooter balloon pop")
  - [ ] Promotional Text: 170 chars

- [ ] **Metadata**
  - [ ] App Name: "Pea Shootin' Pete"
  - [ ] Subtitle: "Pop Balloons, Beat Your Score!"
  - [ ] Age Rating: 4+ (no violence, suitable for all)
  - [ ] Category: Games → Casual

### Google Play Store Requirements ✅
- [ ] **Build Configuration**
  - [ ] Target Android 14 (API 34) - check current Expo config
  - [ ] Minimum API 21 (Android 5.0)
  - [ ] Use App Bundle (AAB) format
  - [ ] Test on mid-range 2020+ devices

- [ ] **Required Assets**
  - [ ] App Icon: 512x512px PNG
  - [ ] Feature Graphic: 1024x500px (required)
  - [ ] Screenshots: Min 2, max 8 (16:9 ratio)
  - [ ] Short Description: 80 chars
  - [ ] Full Description: 4000 chars

- [ ] **Content Rating**
  - [ ] Complete IARC questionnaire
  - [ ] Expected rating: Everyone (E)

---

## 🔒 Privacy & Compliance

### GDPR Compliance 🚨 CRITICAL
- [ ] **Privacy Policy** (Time: 2-4 hours)
  ```typescript
  // Add to app/index.tsx or create PrivacyScreen.tsx
  - Host privacy policy on website
  - Link in app settings
  - Show before any data collection
  ```

- [ ] **Consent Management** (Time: 4-6 hours)
  - [ ] Implement consent dialog using expo-tracking-transparency
  - [ ] Store consent preferences
  - [ ] Block analytics/ads until consent given
  ```bash
  npm install expo-tracking-transparency
  ```

### App Tracking Transparency (iOS) 🚨 CRITICAL
- [ ] **Implementation** (Time: 2-3 hours)
  ```typescript
  // Add to app initialization
  import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
  
  const { status } = await requestTrackingPermissionsAsync();
  if (status === 'granted') {
    // Initialize analytics and ads
  }
  ```

### Data Safety (Google Play) ✅
- [ ] Complete data safety form
- [ ] Declare data types collected
- [ ] Specify data sharing practices
- [ ] Indicate encryption usage

---

## 💰 Monetization Implementation

### Ad Integration 🚨 CRITICAL (Time: 8-12 hours total)

#### 1. AdMob Setup (Primary)
- [ ] **Installation**
  ```bash
  expo install react-native-google-mobile-ads
  ```

- [ ] **Configuration**
  ```typescript
  // app.json
  {
    "expo": {
      "plugins": [
        [
          "react-native-google-mobile-ads",
          {
            "androidAppId": "ca-app-pub-xxxxx",
            "iosAppId": "ca-app-pub-xxxxx"
          }
        ]
      ]
    }
  }
  ```

- [ ] **Ad Placements**
  - [ ] Interstitial: After every 2-3 levels (game over screen)
  - [ ] Rewarded: Continue playing after game over
  - [ ] Banner: Main menu only (not during gameplay)

#### 2. Ad Timing Implementation
```typescript
// In store/gameStore.ts
interface GameState {
  // ... existing state
  levelsPlayedSinceAd: number;
  lastAdTimestamp: number;
  totalAdsThisSession: number;
}

// Ad frequency logic
const shouldShowInterstitial = () => {
  const minTimeBetweenAds = 90000; // 90 seconds
  const levelsBeforeAd = 3;
  return (
    levelsPlayedSinceAd >= levelsBeforeAd &&
    Date.now() - lastAdTimestamp > minTimeBetweenAds &&
    totalAdsThisSession < 5 // Cap per session
  );
};
```

#### 3. Mediation Setup (Time: 4-6 hours)
- [ ] Integrate ironSource or AppLovin MAX
- [ ] Configure waterfall with AdMob, Unity Ads, Meta
- [ ] Set up A/B testing for ad frequency

---

## 📊 Analytics Integration

### Firebase Analytics 🚨 CRITICAL (Time: 4-6 hours)
- [ ] **Installation**
  ```bash
  expo install expo-firebase-analytics
  ```

- [ ] **Critical Events to Track**
  ```typescript
  // Essential analytics events
  logEvent('game_start', { level: currentLevel });
  logEvent('level_complete', { 
    level: currentLevel,
    score: score,
    time_spent: timeSpent,
    balloons_popped: balloonsPopped
  });
  logEvent('game_over', {
    level: currentLevel,
    final_score: score,
    session_length: sessionLength
  });
  logEvent('ad_shown', { 
    ad_type: 'interstitial',
    placement: 'game_over'
  });
  ```

### Crash Reporting (Time: 2-3 hours)
- [ ] **Sentry Integration**
  ```bash
  expo install sentry-expo
  ```
  - [ ] Configure in app.json
  - [ ] Set up source maps
  - [ ] Test crash reporting

---

## 🎮 Game Features Implementation

### Core Gameplay Optimizations ✅ (Mostly Complete)
- [x] Session length: 2-6 minutes ✓
- [x] Instant comprehension (3-second rule) ✓
- [x] Level duration: 30-60 seconds ✓
- [ ] **Difficulty Balancing** (Time: 2-4 hours)
  ```typescript
  // In GameConfig.ts - Fine-tune these values
  DIFFICULTY_CONFIG: {
    LEVEL_1_FAIL_RATE: 0.05,      // 5% fail rate
    LEVEL_6_PLUS_FAIL_RATE: 0.20, // 20% fail rate
    SPAWN_RATE_INCREASE: 0.95,     // 5% faster each level
    BALLOON_SPEED_INCREASE: 1.02   // 2% faster each level
  }
  ```

### Retention Features 🚨 HIGH PRIORITY

#### 1. Daily Rewards (Time: 6-8 hours)
- [ ] **Implementation**
  ```typescript
  // New component: DailyRewardSystem.tsx
  interface DailyReward {
    day: number;
    coins: number;
    powerup?: string;
  }
  
  const DAILY_REWARDS: DailyReward[] = [
    { day: 1, coins: 10 },
    { day: 2, coins: 20 },
    { day: 3, coins: 30, powerup: 'rapid_fire' },
    { day: 7, coins: 100, powerup: 'mega_pea' }
  ];
  ```

#### 2. Achievement System (Time: 4-6 hours)
- [ ] **Quick Wins**
  - [ ] "First Pop!" - Pop your first balloon
  - [ ] "Sharp Shooter" - 10 balloons without missing
  - [ ] "Speed Demon" - Complete level in under 30 seconds

- [ ] **Milestone Achievements**
  - [ ] "Balloon Buster" - Pop 100/500/1000 total balloons
  - [ ] "High Scorer" - Reach 1000/5000/10000 points
  - [ ] "Survivor" - Reach level 10/25/50

#### 3. Local Leaderboards (Time: 3-4 hours)
- [ ] Integrate Game Center (iOS)
- [ ] Integrate Google Play Games (Android)
- [ ] Show "Top 10 Today" in main menu

### Psychological Hooks Implementation

#### 1. Near-Miss Mechanics (Time: 2-3 hours)
```typescript
// Show "Almost!" messages
if (score > highScore * 0.9 && score < highScore) {
  showMessage("So close to beating your record!");
}
```

#### 2. Juice & Polish (Time: 4-6 hours)
- [ ] **Screen shake** on balloon pop
- [ ] **Particle effects** for combos
- [ ] **Combo counter** with multiplier
- [ ] **"Perfect!" notifications** for skill shots

---

## 🚀 Launch Strategy

### Phase 1: Technical Implementation (Week 1-2)
**Quick Wins (Complete in 2-3 days)**
- [ ] App Tracking Transparency ⏱️ 2-3 hours
- [ ] Basic Analytics Events ⏱️ 3-4 hours
- [ ] Privacy Policy ⏱️ 2-4 hours
- [ ] Difficulty Balancing ⏱️ 2-4 hours

**Core Features (Complete in 1 week)**
- [ ] AdMob Integration ⏱️ 6-8 hours
- [ ] Daily Rewards ⏱️ 6-8 hours
- [ ] Achievement System ⏱️ 4-6 hours
- [ ] Sentry Crash Reporting ⏱️ 2-3 hours

### Phase 2: Polish & Testing (Week 2-3)
- [ ] Beta test with TestFlight (100 users)
- [ ] A/B test ad frequency
- [ ] Optimize onboarding flow
- [ ] Create App Store assets

### Phase 3: Soft Launch (Week 3-4)
- [ ] Launch in Philippines, Poland, Vietnam
- [ ] Monitor key metrics:
  - D1 Retention: Target 40%+
  - D7 Retention: Target 15%+
  - Session length: Target 3-5 minutes
  - Ads per session: Target 3-4

### Phase 4: Global Launch (Week 4-5)
- [ ] Launch in Tier 1 countries
- [ ] Implement limited-time launch event
- [ ] Activate push notifications
- [ ] Monitor and optimize

---

## 📈 Success Metrics & KPIs

### Target Metrics
- **D1 Retention**: 45%+ (Current hyper-casual average: 35-40%)
- **D7 Retention**: 18%+ (Current average: 12-15%)
- **D30 Retention**: 8%+ (Current average: 5-8%)
- **Session Length**: 4-6 minutes
- **Sessions/Day**: 3-5
- **ARPDAU**: $0.05-0.10
- **eCPM**: $15-30 (Tier 1 countries)

### A/B Testing Plan
1. **Ad Frequency**: 2 vs 3 levels between ads
2. **Difficulty Curve**: Steeper vs gradual
3. **Color Schemes**: Test new palettes
4. **Balloon Physics**: Bouncier vs current
5. **Pete Movement**: Current vs momentum-based

---

## 🛠️ Technical Debt & Cleanup

### Before Launch
- [ ] Remove legacy arcade components (as noted in CLAUDE.md)
- [ ] Optimize bundle size
- [ ] Implement proper error boundaries
- [ ] Add loading states for all async operations

### Performance Optimization
- [ ] Profile with React DevTools
- [ ] Optimize balloon collision detection
- [ ] Reduce re-renders in game loop
- [ ] Lazy load non-critical components

---

## 📝 Code Examples for Critical Features

### 1. Ad Integration Example
```typescript
// hooks/useAds.ts
import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';

const adUnitId = __DEV__ 
  ? TestIds.INTERSTITIAL
  : Platform.OS === 'ios'
    ? 'ca-app-pub-xxxxx/xxxxx'
    : 'ca-app-pub-xxxxx/xxxxx';

export const useInterstitialAd = () => {
  const interstitial = InterstitialAd.createForAdRequest(adUnitId);
  
  useEffect(() => {
    const unsubscribe = interstitial.addAdEventListener(
      AdEventType.LOADED,
      () => interstitial.show()
    );
    return unsubscribe;
  }, []);

  return { 
    loadAd: () => interstitial.load(),
    isLoaded: interstitial.loaded 
  };
};
```

### 2. Daily Reward Storage
```typescript
// utils/dailyRewards.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export const checkDailyReward = async () => {
  const lastClaim = await AsyncStorage.getItem('lastRewardClaim');
  const streak = await AsyncStorage.getItem('rewardStreak');
  
  if (!lastClaim) return { canClaim: true, streak: 0 };
  
  const lastDate = new Date(lastClaim);
  const today = new Date();
  const daysSince = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
  
  return {
    canClaim: daysSince >= 1,
    streak: daysSince === 1 ? parseInt(streak || '0') + 1 : 0,
    daysUntilNext: daysSince < 1 ? 1 - daysSince : 0
  };
};
```

### 3. Analytics Helper
```typescript
// utils/analytics.ts
import * as Analytics from 'expo-firebase-analytics';

export const logGameEvent = (eventName: string, params?: any) => {
  if (__DEV__) {
    console.log('Analytics Event:', eventName, params);
  }
  Analytics.logEvent(eventName, params);
};

// Usage in game
logGameEvent('balloon_popped', { 
  size: balloonSize,
  combo: currentCombo,
  level: currentLevel 
});
```

---

## ⏰ Timeline Summary

### Week 1: Core Implementation
- Day 1-2: Privacy, Analytics, ATT
- Day 3-4: Ad Integration
- Day 5-7: Retention features

### Week 2: Polish & Testing  
- Day 8-10: Achievement system, leaderboards
- Day 11-12: Performance optimization
- Day 13-14: Beta testing prep

### Week 3: Soft Launch
- Day 15-17: Deploy to test markets
- Day 18-21: Monitor and optimize

### Week 4: Global Launch
- Day 22-24: Final adjustments
- Day 25: Global release
- Day 26-28: Post-launch monitoring

---

## 🎯 Pete-Specific Recommendations

1. **Unique Selling Points**
   - Emphasize the satisfying balloon physics
   - Market the "trampoline floor" as a unique mechanic
   - Highlight the color-changing levels

2. **Monetization Tweaks**
   - Rewarded ad for "Super Pea" power-up (pierces through balloons)
   - Optional cosmetic Pete skins (unlockable or IAP)
   - "Continue with full health" rewarded ad

3. **Social Features**
   - Daily challenge: "Pop 100 balloons in one session"
   - Share high score with custom Pete celebration GIF
   - Ghost mode: See friend's best performance

4. **Quick Implementation Wins**
   - Add haptic feedback on balloon pops (already have haptics setup)
   - Implement combo system (consecutive hits without missing)
   - Add "zen mode" - infinite balloons, no game over

---

## 📞 Support Resources

- **Apple Developer Forums**: https://developer.apple.com/forums/
- **Google Play Console Help**: https://support.google.com/googleplay/android-developer
- **AdMob Support**: https://support.google.com/admob
- **Expo Forums**: https://forums.expo.dev/

---

**Last Updated**: January 2025
**Document Version**: 1.0
**For**: Pea Shootin' Pete v1.0.0