/**
 * Level Mastery Display Component - Shows 3-star rating system
 *
 * Displays time, accuracy, and style stars for level mastery.
 * Provides visual feedback for player progression and achievements.
 * Designed for hyper-casual aesthetics with clear visual hierarchy.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useMasteryRecord } from '../../store/metaProgressionStore';
import { LevelMasteryRecord } from '../../types/MetaProgressionTypes';

interface LevelMasteryDisplayProps {
  levelId: number;
  size?: 'small' | 'medium' | 'large';
  showLabels?: boolean;
  showProgress?: boolean;
  style?: any;
}

interface StarDisplayProps {
  earned: boolean;
  color: string;
  size: number;
}

const StarDisplay: React.FC<StarDisplayProps> = ({ earned, color, size }) => (
  <Text
    style={[
      styles.star,
      {
        fontSize: size,
        color: earned ? color : '#E0E0E0',
        textShadowColor: earned ? color : 'transparent',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: earned ? 4 : 0,
      },
    ]}
  >
    ★
  </Text>
);

export const LevelMasteryDisplay: React.FC<LevelMasteryDisplayProps> = ({
  levelId,
  size = 'medium',
  showLabels = false,
  showProgress = false,
  style,
}) => {
  const masteryRecord = useMasteryRecord(levelId);

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { starSize: 16, fontSize: 12, spacing: 4 };
      case 'large':
        return { starSize: 32, fontSize: 16, spacing: 12 };
      default:
        return { starSize: 24, fontSize: 14, spacing: 8 };
    }
  };

  const config = getSizeConfig();

  // Default empty record if no mastery data exists
  const record: LevelMasteryRecord = masteryRecord || {
    levelId,
    timeStars: 0,
    accuracyStars: 0,
    styleStars: 0,
    totalStars: 0,
    bestTime: 0,
    bestAccuracy: 0,
    maxCombo: 0,
    styleScore: 0,
    badges: [],
    firstCompletionDate: 0,
    lastAttemptDate: 0,
    totalAttempts: 0,
  };

  const totalStars = record.timeStars + record.accuracyStars + record.styleStars;

  return (
    <View style={[styles.container, style]}>
      {/* Stars Row */}
      <View style={[styles.starsRow, { gap: config.spacing }]}>
        <View style={styles.starCategory}>
          {showLabels && (
            <Text style={[styles.label, { fontSize: config.fontSize - 2 }]}>TIME</Text>
          )}
          <StarDisplay earned={record.timeStars > 0} color="#4ECDC4" size={config.starSize} />
        </View>

        <View style={styles.starCategory}>
          {showLabels && <Text style={[styles.label, { fontSize: config.fontSize - 2 }]}>AIM</Text>}
          <StarDisplay earned={record.accuracyStars > 0} color="#FFD700" size={config.starSize} />
        </View>

        <View style={styles.starCategory}>
          {showLabels && (
            <Text style={[styles.label, { fontSize: config.fontSize - 2 }]}>STYLE</Text>
          )}
          <StarDisplay earned={record.styleStars > 0} color="#E17055" size={config.starSize} />
        </View>
      </View>

      {/* Total Stars Summary */}
      {size !== 'small' && (
        <View style={styles.summary}>
          <Text style={[styles.totalStars, { fontSize: config.fontSize }]}>
            {totalStars}/3 Stars
          </Text>
          {totalStars === 3 && (
            <Text style={[styles.perfectText, { fontSize: config.fontSize - 2 }]}>PERFECT! 🏆</Text>
          )}
        </View>
      )}

      {/* Progress Details */}
      {showProgress && record.totalAttempts > 0 && (
        <View style={styles.progressDetails}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Best Time:</Text>
            <Text style={styles.progressValue}>{formatTime(record.bestTime)}</Text>
          </View>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Best Accuracy:</Text>
            <Text style={styles.progressValue}>{record.bestAccuracy.toFixed(1)}%</Text>
          </View>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Style Score:</Text>
            <Text style={styles.progressValue}>{record.styleScore.toLocaleString()}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

// Helper function to format time in MM:SS format
const formatTime = (milliseconds: number): string => {
  if (milliseconds === 0) return '--:--';

  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Component for showing mastery requirements/thresholds
interface MasteryThresholdDisplayProps {
  timeThreshold: number;
  accuracyThreshold: number;
  styleThreshold: number;
  style?: any;
}

export const MasteryThresholdDisplay: React.FC<MasteryThresholdDisplayProps> = ({
  timeThreshold,
  accuracyThreshold,
  styleThreshold,
  style,
}) => (
  <View style={[styles.thresholdContainer, style]}>
    <Text style={styles.thresholdTitle}>Star Requirements:</Text>

    <View style={styles.thresholdRow}>
      <StarDisplay earned={true} color="#4ECDC4" size={16} />
      <Text style={styles.thresholdText}>Complete in under {formatTime(timeThreshold)}</Text>
    </View>

    <View style={styles.thresholdRow}>
      <StarDisplay earned={true} color="#FFD700" size={16} />
      <Text style={styles.thresholdText}>Achieve {accuracyThreshold}% accuracy</Text>
    </View>

    <View style={styles.thresholdRow}>
      <StarDisplay earned={true} color="#E17055" size={16} />
      <Text style={styles.thresholdText}>Score {styleThreshold.toLocaleString()} style points</Text>
    </View>
  </View>
);

// Simple stars-only component for compact display
interface CompactStarsProps {
  timeStars: number;
  accuracyStars: number;
  styleStars: number;
  size?: number;
  style?: any;
}

export const CompactStars: React.FC<CompactStarsProps> = ({
  timeStars,
  accuracyStars,
  styleStars,
  size = 16,
  style,
}) => (
  <View style={[styles.compactStars, style]}>
    <StarDisplay earned={timeStars > 0} color="#4ECDC4" size={size} />
    <StarDisplay earned={accuracyStars > 0} color="#FFD700" size={size} />
    <StarDisplay earned={styleStars > 0} color="#E17055" size={size} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },

  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  starCategory: {
    alignItems: 'center',
  },

  label: {
    color: '#666',
    fontWeight: '600',
    marginBottom: 2,
    letterSpacing: 0.5,
  },

  star: {
    fontWeight: 'bold',
  },

  summary: {
    alignItems: 'center',
    marginTop: 8,
  },

  totalStars: {
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 2,
  },

  perfectText: {
    color: '#00B894',
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  progressDetails: {
    marginTop: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    width: '100%',
  },

  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },

  progressLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },

  progressValue: {
    fontSize: 12,
    color: '#2D3436',
    fontWeight: '600',
  },

  thresholdContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },

  thresholdTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 8,
    textAlign: 'center',
  },

  thresholdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  thresholdText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },

  compactStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});

export default LevelMasteryDisplay;
