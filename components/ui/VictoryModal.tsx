/**
 * Victory Modal - Level completion overlay
 *
 * Shows when a level is completed with:
 * - Level completion celebration with confetti
 * - Star rating display (1-3 stars based on performance)
 * - Final score with level-specific color scheme
 * - Continue button to proceed to next level
 * - Mystery reward reveal (25% chance)
 *
 * Integrates with:
 * - LevelMasteryDisplay for canonical star rating display
 * - CelebrationSystem for victory animations
 * - MysteryRewardDisplay for bonus rewards
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getColorScheme } from '@/constants/GameColors';
import { LevelMasteryDisplay } from '@/components/ui/LevelMasteryDisplay';
import { MysteryRewardDisplay } from '@/components/ui/MysteryRewardDisplay';
import { AnimatedBalloon } from '@/components/ui/AnimatedBalloon';
import { useAddVictoryCelebration } from '@/store/celebrationStore';
import { MysteryReward } from '@/types/MetaProgressionTypes';
import { audioManager } from '@/systems/AudioManager';

interface VictoryModalProps {
  level: number;
  score: number;
  starsEarned: number;
  isVisible: boolean;
  onContinue: () => void;
  onBackToMenu: () => void;
  onWorldMap?: () => void;
  time?: number;
  accuracy?: number;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  level,
  score,
  starsEarned,
  isVisible,
  onContinue,
  onBackToMenu,
  onWorldMap,
  time = 4.25,
  accuracy = 100,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const colorScheme = getColorScheme(level);
  const addVictoryCelebration = useAddVictoryCelebration();

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Mystery reward state
  const [mysteryReward, setMysteryReward] = useState<MysteryReward | null>(null);
  const [showMysteryReward, setShowMysteryReward] = useState(false);
  const [hasRevealedMystery, setHasRevealedMystery] = useState(false);

  // Determine if player gets mystery reward (25% chance)
  const [hasMysteryReward] = useState(() => Math.random() < 0.25);

  useEffect(() => {
    if (isVisible) {
      audioManager.playSound('victory_jingle');
      // Trigger victory celebration through celebration store
      addVictoryCelebration({
        level,
        score,
        starsEarned,
        onComplete: () => {
          // Victory celebration complete
        },
      });

      // Start entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animation values when modal becomes invisible
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      slideAnim.setValue(50);
      setShowMysteryReward(false);
      setHasRevealedMystery(false);
      setMysteryReward(null);
    }
  }, [isVisible, addVictoryCelebration, level, score, starsEarned]);

  const handleRevealMystery = () => {
    // Generate mystery reward
    const rewards: MysteryReward[] = [
      { id: 'coins_100', type: 'coins', rarity: 'common', value: '100' },
      { id: 'coins_250', type: 'coins', rarity: 'rare', value: '250' },
      { id: 'xp_50', type: 'experience', rarity: 'common', value: '50' },
      { id: 'power_speed', type: 'experience', rarity: 'epic', value: 'speed_boost' }, // Use experience type for now
    ];

    const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
    setMysteryReward(randomReward);
    setShowMysteryReward(true);
    setHasRevealedMystery(true);
  };

  const handleMysteryRewardComplete = () => {
    setShowMysteryReward(false);
  };

  if (!isVisible) return null;

  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.modalContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={[colorScheme.background, colorScheme.backgroundGradient[1]]}
          style={styles.modalContent}
        >
          {/* Floating Balloons */}
          <AnimatedBalloon x={60} y={80} size={40} color={colorScheme.primary} delay={0} />
          <AnimatedBalloon x={290} y={60} size={35} color={colorScheme.secondary} delay={200} />
          <AnimatedBalloon x={320} y={100} size={38} color={colorScheme.particle} delay={400} />

          {/* Header */}
          <Text style={[styles.title, { color: colorScheme.primary }]}>Level Complete!</Text>

          {/* Score Display */}
          <Text style={[styles.score, { color: colorScheme.primary }]}>
            {score.toLocaleString()}
          </Text>

          {/* Level Mastery Display */}
          <View style={styles.masteryContainer}>
            <LevelMasteryDisplay
              levelId={level}
              starsEarned={starsEarned}
              totalStars={3}
              showProgress={true}
            />
          </View>

          {/* Detailed Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <Text style={styles.statIcon}>⏱️</Text>
              <Text style={styles.statLabel}>Time</Text>
              <Text style={styles.statValue}>{time.toFixed(2)}s</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statIcon}>🎯</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
              <Text style={[styles.statValue, accuracy === 100 && styles.perfectAccuracy]}>
                {Math.round(accuracy)}%
              </Text>
            </View>
          </View>

          {/* Mystery Reward Section */}
          {hasMysteryReward && !hasRevealedMystery && (
            <TouchableOpacity
              style={[styles.mysteryButton, { borderColor: colorScheme.primary }]}
              onPress={handleRevealMystery}
              activeOpacity={0.8}
            >
              <Text style={[styles.mysteryButtonText, { color: colorScheme.primary }]}>
                🎁 Reveal Mystery Reward
              </Text>
            </TouchableOpacity>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {onWorldMap ? (
              <TouchableOpacity
                style={[styles.continueButton, { backgroundColor: colorScheme.primary }]}
                onPress={onWorldMap}
                activeOpacity={0.8}
                disabled={hasMysteryReward && !hasRevealedMystery}
              >
                <Text style={styles.continueButtonText}>View World Map</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.continueButton, { backgroundColor: colorScheme.primary }]}
                onPress={onContinue}
                activeOpacity={0.8}
                disabled={hasMysteryReward && !hasRevealedMystery}
              >
                <Text style={styles.continueButtonText}>PLAY AGAIN</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.menuButton, { borderColor: colorScheme.primary }]}
              onPress={onBackToMenu}
              activeOpacity={0.8}
            >
              <Text style={[styles.menuButtonText, { color: colorScheme.primary }]}>MAIN MENU</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Mystery Reward Display */}
      {showMysteryReward && mysteryReward && (
        <MysteryRewardDisplay
          reward={mysteryReward}
          x={screenWidth / 2}
          y={200}
          onComplete={handleMysteryRewardComplete}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 1000,
  },

  modalContainer: {
    width: '100%',
    maxWidth: 350,
  },

  modalContent: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },

  score: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },

  masteryContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },

  statsContainer: {
    marginBottom: 24,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 16,
    padding: 16,
  },

  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 8,
  },

  statIcon: {
    fontSize: 18,
    marginRight: 12,
  },

  statLabel: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },

  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },

  perfectAccuracy: {
    color: '#4CAF50',
  },

  mysteryButton: {
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  mysteryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  buttonContainer: {
    width: '100%',
    gap: 12,
  },

  continueButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 20,
    alignItems: 'center',
  },

  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    letterSpacing: 1,
  },

  menuButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  menuButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});