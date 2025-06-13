/**
 * Real-Time Progression HUD - Live feedback during gameplay
 * 
 * Shows real-time progression updates including:
 * - XP gains with animated counters
 * - Daily challenge progress bars
 * - Combo multipliers with visual feedback
 * - Battle pass tier progress
 * - Mystery reward notifications
 * - Achievement unlock notifications
 * 
 * Designed for maximum psychological engagement and addiction.
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { getColorScheme } from '@/constants/HyperCasualColors';
import { 
  useBattlePassXP, 
  useBattlePassTier,
  useNewAchievements,
  useMetaProgressionActions,
  useSessionStats
} from '@/store/metaProgressionStore';
import { useMetaProgressionStore } from '@/store/metaProgressionStore';
import { 
  useCurrentCombo,
  useCurrentScore,
  useShotsHit,
  useShotsFired
} from '@/store/levelProgressionStore';
import { useTutorialTarget } from '@/hooks/useTutorialIntegration';

const { width: screenWidth } = Dimensions.get('window');

interface FloatingTextProps {
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
  duration: number;
  onComplete: () => void;
}

const FloatingText: React.FC<FloatingTextProps> = ({ 
  text, x, y, color, fontSize, duration, onComplete 
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const moveAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Start animations
    const fadeIn = Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    });

    const scaleIn = Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 120,
      friction: 8,
      useNativeDriver: true,
    });

    const moveUp = Animated.timing(moveAnim, {
      toValue: -60,
      duration: duration,
      useNativeDriver: true,
    });

    const fadeOut = Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      delay: duration - 300,
      useNativeDriver: true,
    });

    Animated.sequence([
      Animated.parallel([fadeIn, scaleIn]),
      Animated.parallel([moveUp, fadeOut])
    ]).start(onComplete);
  }, []);

  return (
    <Animated.View
      style={[
        styles.floatingText,
        {
          left: x,
          top: y,
          opacity: fadeAnim,
          transform: [
            { translateY: moveAnim },
            { scale: scaleAnim }
          ]
        }
      ]}
    >
      <Text style={[styles.floatingTextLabel, { color, fontSize }]}>
        {text}
      </Text>
    </Animated.View>
  );
};

interface XPGainProps {
  amount: number;
  source: string;
  x?: number;
  y?: number;
}

const XPGainNotification: React.FC<XPGainProps> = ({ amount, source, x = screenWidth * 0.8, y = 100 }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <FloatingText
      text={`+${amount} XP`}
      x={x}
      y={y}
      color="#4ECDC4"
      fontSize={16}
      duration={2000}
      onComplete={() => setIsVisible(false)}
    />
  );
};

interface ComboDisplayProps {
  combo: number;
  level: number;
}

const ComboDisplay: React.FC<ComboDisplayProps> = ({ combo, level }) => {
  const colorScheme = getColorScheme(level);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (combo > 0) {
      // Pulse animation when combo increases
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        })
      ]).start();

      // Glow effect for high combos
      if (combo >= 5) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: false,
            }),
            Animated.timing(glowAnim, {
              toValue: 0.3,
              duration: 500,
              useNativeDriver: false,
            })
          ])
        ).start();
      }
    }
  }, [combo]);

  if (combo === 0) return null;

  const multiplier = Math.min(combo, 10); // Cap visual multiplier at 10x
  const comboColor = combo >= 10 ? '#FFD700' : combo >= 5 ? '#FF6B6B' : colorScheme.primary;

  return (
    <Animated.View
      style={[
        styles.comboContainer,
        {
          transform: [{ scale: scaleAnim }],
          backgroundColor: glowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 215, 0, 0.2)']
          })
        }
      ]}
    >
      <Text style={[styles.comboText, { color: comboColor }]}>
        {combo}x
      </Text>
      <Text style={styles.comboLabel}>COMBO</Text>
    </Animated.View>
  );
};

interface ChallengeProgressProps {
  challengeId: string;
  title: string;
  progress: number;
  target: number;
  level: number;
}

const ChallengeProgressMini: React.FC<ChallengeProgressProps> = ({ 
  title, progress, target, level 
}) => {
  const colorScheme = getColorScheme(level);
  const progressPercent = Math.min((progress / target) * 100, 100);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const challengeRef = useTutorialTarget('challenge_progress_bar');

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressPercent,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [progressPercent]);

  return (
    <View ref={challengeRef} style={styles.challengeProgressContainer}>
      <Text style={styles.challengeTitle} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.progressBarContainer}>
        <Animated.View
          style={[
            styles.progressBarFill,
            {
              backgroundColor: colorScheme.primary,
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%']
              })
            }
          ]}
        />
      </View>
      <Text style={styles.progressText}>
        {progress}/{target}
      </Text>
    </View>
  );
};

interface BattlePassProgressProps {
  currentXP: number;
  currentTier: number;
  level: number;
}

const BattlePassProgress: React.FC<BattlePassProgressProps> = ({ 
  currentXP, currentTier, level 
}) => {
  const colorScheme = getColorScheme(level);
  const xpToNextTier = 1000; // This should come from meta progression store
  const progressPercent = (currentXP / xpToNextTier) * 100;
  const battlePassRef = useTutorialTarget('battle_pass_progress');
  
  return (
    <View ref={battlePassRef} style={styles.battlePassContainer}>
      <Text style={styles.battlePassTier}>Tier {currentTier}</Text>
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBarFill,
            {
              backgroundColor: colorScheme.secondary,
              width: `${progressPercent}%`
            }
          ]}
        />
      </View>
      <Text style={styles.battlePassXP}>
        {currentXP}/{xpToNextTier} XP
      </Text>
    </View>
  );
};

interface ProgressionHUDProps {
  level: number;
  isPlaying: boolean;
}

export const ProgressionHUD: React.FC<ProgressionHUDProps> = ({ level, isPlaying }) => {
  const combo = useCurrentCombo();
  const currentScore = useCurrentScore();
  const battlePassXP = useBattlePassXP();
  const battlePassTier = useBattlePassTier();
  const sessionStats = useSessionStats();
  const newAchievements = useNewAchievements();
  const metaActions = useMetaProgressionActions();
  
  // Get daily challenges data
  const dailyChallenges = useMetaProgressionStore(state => state.dailyChallenges);
  const challengeProgress = useMetaProgressionStore(state => state.challengeProgress);
  
  // Get the first active challenge to display
  const activeChallenge = dailyChallenges.find(challenge => {
    const progress = challengeProgress[challenge.id];
    return !progress?.completed;
  });

  // Track XP gains for floating notifications
  const [xpGains, setXpGains] = useState<Array<{ id: string; amount: number; source: string }>>([]);
  const prevBattlePassXP = useRef(battlePassXP);

  useEffect(() => {
    // Detect XP gains
    if (battlePassXP > prevBattlePassXP.current) {
      const gain = battlePassXP - prevBattlePassXP.current;
      setXpGains(prev => [...prev, {
        id: `xp_${Date.now()}`,
        amount: gain,
        source: 'gameplay'
      }]);
      
      // Remove after animation
      setTimeout(() => {
        setXpGains(prev => prev.slice(1));
      }, 2500);
    }
    prevBattlePassXP.current = battlePassXP;
  }, [battlePassXP]);

  // Achievement notifications
  useEffect(() => {
    if (newAchievements.length > 0) {
      // Show achievement notification (implement later)
      setTimeout(() => {
        metaActions.clearNewAchievements();
      }, 3000);
    }
  }, [newAchievements]);

  if (!isPlaying) return null;

  return (
    <View style={styles.container}>
      {/* Top-right: Battle Pass Progress */}
      <View style={styles.topRightContainer}>
        <BattlePassProgress
          currentXP={battlePassXP}
          currentTier={battlePassTier}
          level={level}
        />
      </View>

      {/* Top-left: Session Stats */}
      <View style={styles.topLeftContainer}>
        <Text style={styles.sessionStat}>
          Accuracy: {sessionStats.shotsFired > 0 ? Math.round((sessionStats.shotsHit / sessionStats.shotsFired) * 100) : 0}%
        </Text>
        <Text style={styles.sessionStat}>
          Balloons: {sessionStats.balloonsPopped}
        </Text>
      </View>

      {/* Center-right: Combo Display */}
      <View style={styles.centerRightContainer}>
        <ComboDisplay combo={combo} level={level} />
      </View>

      {/* Bottom: Daily Challenge Progress (show first active challenge) */}
      {activeChallenge && (
        <View style={styles.bottomContainer}>
          <ChallengeProgressMini
            challengeId={activeChallenge.id}
            title={activeChallenge.name}
            progress={challengeProgress[activeChallenge.id]?.currentProgress || 0}
            target={activeChallenge.objective.target}
            level={level}
          />
        </View>
      )}

      {/* Floating XP notifications */}
      {xpGains.map((gain, index) => (
        <XPGainNotification
          key={gain.id}
          amount={gain.amount}
          source={gain.source}
          x={screenWidth * 0.75}
          y={120 + (index * 30)}
        />
      ))}

      {/* Achievement notifications */}
      {newAchievements.map((achievement, index) => (
        <FloatingText
          key={achievement.id}
          text={`Achievement: ${achievement.name}`}
          x={screenWidth * 0.1}
          y={200 + (index * 40)}
          color="#FFD700"
          fontSize={14}
          duration={3000}
          onComplete={() => {}}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none', // Allow touches to pass through
  },
  
  topRightContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    alignItems: 'flex-end',
  },
  
  topLeftContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    alignItems: 'flex-start',
  },
  
  centerRightContainer: {
    position: 'absolute',
    top: '40%',
    right: 20,
    alignItems: 'center',
  },
  
  bottomContainer: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  
  // Battle Pass Progress
  battlePassContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  
  battlePassTier: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  
  battlePassXP: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  
  // Session Stats
  sessionStat: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  
  // Combo Display
  comboContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  comboText: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
  },
  
  comboLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 1,
  },
  
  // Challenge Progress
  challengeProgressContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 200,
  },
  
  challengeTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
    marginBottom: 6,
  },
  
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  
  progressText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'right',
  },
  
  // Floating Text
  floatingText: {
    position: 'absolute',
    zIndex: 1000,
  },
  
  floatingTextLabel: {
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default ProgressionHUD;