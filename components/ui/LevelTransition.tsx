/**
 * Level Transition UI Components
 * 
 * Handles all level transition states:
 * - Level start introduction
 * - Victory screen with level completion
 * - Failure screen with retry options
 * - Next level transition
 */

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { 
  useLevelProgressionStore, 
  useLevelProgressionActions, 
  useCurrentLevel,
  useLevelState,
  useLevelUI,
  useLevelProgress
} from '@/store/levelProgressionStore';
import { useGameActions } from '@/store/gameStore';
import { UI_CONFIG, ANIMATION_CONFIG } from '@/constants/GameConfig';

interface LevelTransitionProps {
  screenWidth: number;
  screenHeight: number;
}

export const LevelTransition: React.FC<LevelTransitionProps> = ({ 
  screenWidth, 
  screenHeight 
}) => {
  const currentLevel = useCurrentLevel();
  const levelActions = useLevelProgressionActions();
  const gameActions = useGameActions();
  const levelState = useLevelState();
  const levelUI = useLevelUI();
  const levelProgress = useLevelProgress();
  
  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [slideAnim] = useState(new Animated.Value(50));
  
  // Start entrance animation when component mounts
  useEffect(() => {
    if (levelUI.showTransition || levelUI.showVictory || levelUI.showFailure) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: ANIMATION_CONFIG.MENU.FADE_IN_DURATION,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: ANIMATION_CONFIG.MENU.FADE_IN_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [levelUI.showTransition, levelUI.showVictory, levelUI.showFailure]);
  
  // Exit animation
  const animateExit = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(callback);
  };
  
  // Handle level start
  const handleStartLevel = () => {
    animateExit(() => {
      levelActions.showTransition(false);
      levelActions.startLevel();
      gameActions.setIsPlaying(true);
    });
  };
  
  // Handle retry level
  const handleRetryLevel = () => {
    animateExit(() => {
      levelActions.showFailure(false);
      levelActions.restartLevel();
      gameActions.setIsPlaying(true);
    });
  };
  
  // Handle next level
  const handleNextLevel = async () => {
    animateExit(async () => {
      await levelActions.proceedToNextLevel();
      gameActions.setIsPlaying(true);
    });
  };
  
  // Handle return to menu
  const handleReturnToMenu = () => {
    animateExit(() => {
      levelActions.showVictory(false);
      levelActions.showFailure(false);
      gameActions.setIsPlaying(false);
      // Navigation to menu would go here
    });
  };
  
  if (!currentLevel) return null;
  
  // Don't show anything if no UI state is active
  if (!levelUI.showTransition && !levelUI.showVictory && !levelUI.showFailure) {
    return null;
  }
  
  // Get theme colors from current level
  const primaryColor = currentLevel.theme.colorScheme.primary;
  const backgroundColor = 'rgba(0, 0, 0, 0.8)';
  
  return (
    <View style={[styles.overlay, { backgroundColor }]}>
      <Animated.View 
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim }
            ]
          }
        ]}
      >
        {/* Level Start Transition */}
        {levelUI.showTransition && (
          <LevelStartScreen
            level={currentLevel}
            primaryColor={primaryColor}
            onStart={handleStartLevel}
          />
        )}
        
        {/* Victory Screen */}
        {levelUI.showVictory && (
          <VictoryScreen
            level={currentLevel}
            progress={levelProgress}
            primaryColor={primaryColor}
            onNextLevel={handleNextLevel}
            onReturnToMenu={handleReturnToMenu}
          />
        )}
        
        {/* Failure Screen */}
        {levelUI.showFailure && (
          <FailureScreen
            level={currentLevel}
            failureReason={levelState.failureReason}
            progress={levelProgress}
            primaryColor={primaryColor}
            onRetry={handleRetryLevel}
            onReturnToMenu={handleReturnToMenu}
          />
        )}
      </Animated.View>
    </View>
  );
};

// Level Start Screen Component
interface LevelStartScreenProps {
  level: any;
  primaryColor: string;
  onStart: () => void;
}

const LevelStartScreen: React.FC<LevelStartScreenProps> = ({
  level,
  primaryColor,
  onStart
}) => {
  return (
    <View style={styles.screenContainer}>
      <Text style={[styles.levelTitle, { color: primaryColor }]}>
        Level {level.id}
      </Text>
      <Text style={styles.levelName}>{level.name}</Text>
      
      <View style={styles.objectiveContainer}>
        <Text style={styles.objectiveTitle}>Objective:</Text>
        {level.objectives.map((objective: any, index: number) => (
          <Text key={index} style={styles.objectiveText}>
            {objective.description}
          </Text>
        ))}
      </View>
      
      <TouchableOpacity
        style={[styles.button, styles.startButton, { borderColor: primaryColor }]}
        onPress={onStart}
      >
        <Text style={[styles.buttonText, { color: primaryColor }]}>
          START LEVEL
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// Victory Screen Component
interface VictoryScreenProps {
  level: any;
  progress: any;
  primaryColor: string;
  onNextLevel: () => void;
  onReturnToMenu: () => void;
}

const VictoryScreen: React.FC<VictoryScreenProps> = ({
  level,
  progress,
  primaryColor,
  onNextLevel,
  onReturnToMenu
}) => {
  return (
    <View style={styles.screenContainer}>
      <Text style={[styles.successTitle, { color: primaryColor }]}>
        LEVEL COMPLETE!
      </Text>
      <Text style={styles.levelName}>{level.name}</Text>
      
      <View style={styles.statsContainer}>
        <StatRow label="Score" value={progress.currentScore.toString()} />
        <StatRow label="Accuracy" value={`${Math.round(progress.accuracy)}%`} />
        {progress.currentCombo > 0 && (
          <StatRow label="Best Combo" value={progress.currentCombo.toString()} />
        )}
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton, { backgroundColor: primaryColor }]}
          onPress={onNextLevel}
        >
          <Text style={[styles.buttonText, { color: 'white' }]}>
            NEXT LEVEL
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={onReturnToMenu}
        >
          <Text style={styles.buttonText}>
            MENU
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Failure Screen Component
interface FailureScreenProps {
  level: any;
  failureReason: string | null;
  progress: any;
  primaryColor: string;
  onRetry: () => void;
  onReturnToMenu: () => void;
}

const FailureScreen: React.FC<FailureScreenProps> = ({
  level,
  failureReason,
  progress,
  primaryColor,
  onRetry,
  onReturnToMenu
}) => {
  return (
    <View style={styles.screenContainer}>
      <Text style={styles.failureTitle}>
        LEVEL FAILED
      </Text>
      <Text style={styles.levelName}>{level.name}</Text>
      
      {failureReason && (
        <Text style={styles.failureReason}>{failureReason}</Text>
      )}
      
      <View style={styles.statsContainer}>
        <StatRow label="Score" value={progress.currentScore.toString()} />
        <StatRow label="Accuracy" value={`${Math.round(progress.accuracy)}%`} />
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton, { backgroundColor: primaryColor }]}
          onPress={onRetry}
        >
          <Text style={[styles.buttonText, { color: 'white' }]}>
            TRY AGAIN
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={onReturnToMenu}
        >
          <Text style={styles.buttonText}>
            MENU
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Statistics Row Component
interface StatRowProps {
  label: string;
  value: string;
}

const StatRow: React.FC<StatRowProps> = ({ label, value }) => (
  <View style={styles.statRow}>
    <Text style={styles.statLabel}>{label}:</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 40,
    margin: 20,
    minWidth: 300,
    maxWidth: 400,
    alignItems: 'center',
  },
  screenContainer: {
    alignItems: 'center',
    width: '100%',
  },
  levelTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  levelName: {
    fontSize: 24,
    color: '#666',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  failureTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E74C3C',
    marginBottom: 10,
  },
  objectiveContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  objectiveTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  objectiveText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  failureReason: {
    fontSize: 16,
    color: '#E74C3C',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  statsContainer: {
    marginBottom: 30,
    width: '100%',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 2,
  },
  startButton: {
    backgroundColor: 'transparent',
  },
  primaryButton: {
    borderWidth: 0,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderColor: '#ddd',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
});