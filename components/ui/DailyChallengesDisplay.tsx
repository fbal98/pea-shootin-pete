/**
 * Daily Challenges Display Component
 * 
 * Shows current daily challenges with progress tracking and reward claiming.
 * Designed for maximum engagement with streak visualization and clear CTAs.
 * Implements 2025 mobile game retention best practices.
 */

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useMetaProgressionStore, useMetaProgressionActions } from '../../store/metaProgressionStore';
import { DailyChallenge, DailyChallengeProgress, ChallengeDifficulty } from '../../types/MetaProgressionTypes';

interface DailyChallengesDisplayProps {
  onChallengeClicked?: (challenge: DailyChallenge) => void;
  style?: any;
}

interface ChallengeCardProps {
  challenge: DailyChallenge;
  progress: DailyChallengeProgress;
  onClaimReward: (challengeId: string) => void;
  onChallengeClicked?: (challenge: DailyChallenge) => void;
}

const DifficultyBadge: React.FC<{ difficulty: ChallengeDifficulty }> = ({ difficulty }) => {
  const getDifficultyConfig = () => {
    switch (difficulty) {
      case 'easy':
        return { color: '#00B894', bg: '#E8F5F0', text: 'EASY' };
      case 'medium':
        return { color: '#FDCB6E', bg: '#FEF5E7', text: 'MEDIUM' };
      case 'hard':
        return { color: '#E17055', bg: '#FFEEE9', text: 'HARD' };
      case 'expert':
        return { color: '#A29BFE', bg: '#F1F0FF', text: 'EXPERT' };
      default:
        return { color: '#74B9FF', bg: '#EBF3FF', text: 'NORMAL' };
    }
  };

  const config = getDifficultyConfig();

  return (
    <View style={[styles.difficultyBadge, { backgroundColor: config.bg }]}>
      <Text style={[styles.difficultyText, { color: config.color }]}>
        {config.text}
      </Text>
    </View>
  );
};

const ProgressBar: React.FC<{ current: number; target: number; color: string }> = ({ 
  current, 
  target, 
  color 
}) => {
  const progress = Math.min(100, (current / target) * 100);
  
  return (
    <View style={styles.progressBarContainer}>
      <View style={styles.progressBarTrack}>
        <View 
          style={[
            styles.progressBarFill, 
            { width: `${progress}%`, backgroundColor: color }
          ]} 
        />
      </View>
      <Text style={styles.progressText}>
        {current}/{target}
      </Text>
    </View>
  );
};

const ChallengeCard: React.FC<ChallengeCardProps> = ({ 
  challenge, 
  progress, 
  onClaimReward, 
  onChallengeClicked 
}) => {
  const isCompleted = progress.completed;
  const isClaimed = progress.claimed;
  const canClaim = isCompleted && !isClaimed;

  const handlePress = () => {
    if (canClaim) {
      onClaimReward(challenge.id);
    } else if (onChallengeClicked) {
      onChallengeClicked(challenge);
    }
  };

  const getCardColor = () => {
    if (isClaimed) return '#F8F9FA';
    if (isCompleted) return '#E8F5F0';
    return '#FFFFFF';
  };

  const totalReward = challenge.baseReward.coins + (challenge.streakBonus?.coins || 0);

  return (
    <TouchableOpacity 
      style={[styles.challengeCard, { backgroundColor: getCardColor() }]}
      onPress={handlePress}
      disabled={isClaimed}
    >
      {/* Header */}
      <View style={styles.challengeHeader}>
        <View style={styles.challengeTitle}>
          <Text style={styles.challengeName}>{challenge.name}</Text>
          <DifficultyBadge difficulty={challenge.difficulty} />
        </View>
        {isCompleted && (
          <Text style={styles.completedBadge}>
            {isClaimed ? 'CLAIMED ✓' : 'COMPLETE!'}
          </Text>
        )}
      </View>

      {/* Description */}
      <Text style={styles.challengeDescription}>
        {challenge.description}
      </Text>

      {/* Progress */}
      <ProgressBar
        current={progress.currentProgress}
        target={progress.targetProgress}
        color={isCompleted ? '#00B894' : '#4ECDC4'}
      />

      {/* Rewards */}
      <View style={styles.rewardSection}>
        <View style={styles.rewardRow}>
          <Text style={styles.rewardLabel}>Reward:</Text>
          <View style={styles.rewardValues}>
            <Text style={styles.coinReward}>🪙 {totalReward}</Text>
            {challenge.baseReward.experiencePoints && (
              <Text style={styles.xpReward}>
                ⭐ {challenge.baseReward.experiencePoints + (challenge.streakBonus?.experiencePoints || 0)}
              </Text>
            )}
          </View>
        </View>
        
        {challenge.streakBonus && (challenge.streakBonus.coins > 0 || (challenge.streakBonus.experiencePoints || 0) > 0) && (
          <Text style={styles.streakBonusText}>
            🔥 Streak bonus included!
          </Text>
        )}
      </View>

      {/* Action Button */}
      {canClaim && (
        <View style={styles.claimButton}>
          <Text style={styles.claimButtonText}>CLAIM REWARD</Text>
        </View>
      )}
      
      {progress.attempts > 0 && !isCompleted && (
        <Text style={styles.attemptsText}>
          Attempts: {progress.attempts}/{challenge.objective.allowedAttempts || '∞'}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const StreakDisplay: React.FC<{ streak: number; longestStreak: number }> = ({ 
  streak, 
  longestStreak 
}) => (
  <View style={styles.streakContainer}>
    <View style={styles.streakItem}>
      <Text style={styles.streakNumber}>{streak}</Text>
      <Text style={styles.streakLabel}>Current Streak</Text>
    </View>
    <View style={styles.streakSeparator} />
    <View style={styles.streakItem}>
      <Text style={styles.streakNumber}>{longestStreak}</Text>
      <Text style={styles.streakLabel}>Best Streak</Text>
    </View>
  </View>
);

export const DailyChallengesDisplay: React.FC<DailyChallengesDisplayProps> = ({ 
  onChallengeClicked, 
  style 
}) => {
  const dailyChallenges = useMetaProgressionStore(state => state.dailyChallenges);
  const challengeProgress = useMetaProgressionStore(state => state.challengeProgress);
  const challengeHistory = useMetaProgressionStore(state => state.challengeHistory);
  const actions = useMetaProgressionActions();

  // Initialize challenges on component mount
  useEffect(() => {
    actions.generateDailyChallenges();
  }, []);

  // Auto-refresh challenges periodically
  useEffect(() => {
    const interval = setInterval(() => {
      actions.refreshChallenges();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const handleClaimReward = async (challengeId: string) => {
    await actions.claimChallengeReward(challengeId);
  };

  const getTimeUntilRefresh = (): string => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const completedToday = dailyChallenges.filter(challenge => 
    challengeProgress[challenge.id]?.completed
  ).length;

  return (
    <ScrollView style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Daily Challenges</Text>
        <Text style={styles.refreshTimer}>
          Refreshes in {getTimeUntilRefresh()}
        </Text>
      </View>

      {/* Streak Display */}
      <StreakDisplay 
        streak={challengeHistory.currentStreak} 
        longestStreak={challengeHistory.longestStreak} 
      />

      {/* Progress Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>
          Completed today: {completedToday}/{dailyChallenges.length}
        </Text>
        {completedToday === dailyChallenges.length && dailyChallenges.length > 0 && (
          <Text style={styles.allCompleteText}>
            🎉 All challenges complete! Great job!
          </Text>
        )}
      </View>

      {/* Challenge Cards */}
      <View style={styles.challengesList}>
        {dailyChallenges.map(challenge => {
          const progress = challengeProgress[challenge.id];
          if (!progress) return null;

          return (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              progress={progress}
              onClaimReward={handleClaimReward}
              onChallengeClicked={onChallengeClicked}
            />
          );
        })}
      </View>

      {/* Empty State */}
      {dailyChallenges.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No challenges available</Text>
          <Text style={styles.emptyStateDescription}>
            New challenges will be available tomorrow!
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  header: {
    padding: 20,
    alignItems: 'center',
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 4,
  },

  refreshTimer: {
    fontSize: 14,
    color: '#636E72',
    fontWeight: '500',
  },

  streakContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  streakItem: {
    flex: 1,
    alignItems: 'center',
  },

  streakNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FF6B6B',
    marginBottom: 4,
  },

  streakLabel: {
    fontSize: 12,
    color: '#636E72',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  streakSeparator: {
    width: 1,
    backgroundColor: '#DDD',
    marginHorizontal: 16,
  },

  summaryContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    alignItems: 'center',
  },

  summaryText: {
    fontSize: 16,
    color: '#2D3436',
    fontWeight: '600',
    marginBottom: 4,
  },

  allCompleteText: {
    fontSize: 14,
    color: '#00B894',
    fontWeight: '600',
  },

  challengesList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  challengeCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },

  challengeTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  challengeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3436',
    flex: 1,
  },

  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },

  difficultyText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  completedBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B894',
    letterSpacing: 0.5,
  },

  challengeDescription: {
    fontSize: 14,
    color: '#636E72',
    marginBottom: 12,
    lineHeight: 20,
  },

  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },

  progressBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E3E3E3',
    borderRadius: 3,
    overflow: 'hidden',
  },

  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#636E72',
    minWidth: 40,
    textAlign: 'right',
  },

  rewardSection: {
    marginBottom: 12,
  },

  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },

  rewardLabel: {
    fontSize: 14,
    color: '#636E72',
    fontWeight: '500',
  },

  rewardValues: {
    flexDirection: 'row',
    gap: 12,
  },

  coinReward: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F39C12',
  },

  xpReward: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9B59B6',
  },

  streakBonusText: {
    fontSize: 12,
    color: '#FF6B6B',
    fontWeight: '600',
    fontStyle: 'italic',
  },

  claimButton: {
    backgroundColor: '#00B894',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },

  claimButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  attemptsText: {
    fontSize: 12,
    color: '#E17055',
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },

  emptyState: {
    alignItems: 'center',
    padding: 40,
  },

  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#636E72',
    marginBottom: 8,
  },

  emptyStateDescription: {
    fontSize: 14,
    color: '#636E72',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default DailyChallengesDisplay;