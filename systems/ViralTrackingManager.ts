import { useSocialStore } from '../store/socialStore';
import { trackViralMetrics, trackShareConversion } from '../utils/analytics';

export interface ViralMetrics {
  totalShares: number;
  successfulReferrals: number;
  viralCoefficient: number;
  shareConversionRate: number;
  platformBreakdown: Record<string, number>;
  conversionByPlatform: Record<string, number>;
  averageTimeToConversion: number;
  retentionAfterReferral: number;
}

export interface ShareConversionData {
  shareId: string;
  platform: string;
  shareTimestamp: number;
  conversionTimestamp?: number;
  referredUserId?: string;
  converted: boolean;
}

class ViralTrackingManager {
  private static instance: ViralTrackingManager;
  private shareConversions: Map<string, ShareConversionData> = new Map();
  private metricsUpdateInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startMetricsTracking();
  }

  public static getInstance(): ViralTrackingManager {
    if (!ViralTrackingManager.instance) {
      ViralTrackingManager.instance = new ViralTrackingManager();
    }
    return ViralTrackingManager.instance;
  }

  private startMetricsTracking() {
    // Update viral metrics every 5 minutes
    this.metricsUpdateInterval = setInterval(() => {
      this.updateViralMetrics();
    }, 5 * 60 * 1000);
  }

  public trackShareEvent(shareData: {
    platform: string;
    contentType: string;
    userId: string;
    timestamp: number;
  }): string {
    const shareId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const conversionData: ShareConversionData = {
      shareId,
      platform: shareData.platform,
      shareTimestamp: shareData.timestamp,
      converted: false,
    };

    this.shareConversions.set(shareId, conversionData);

    // Track in analytics
    trackShareConversion({
      shareId,
      platform: shareData.platform,
      contentType: shareData.contentType,
      userId: shareData.userId,
      timestamp: shareData.timestamp,
      event: 'share_sent',
    });

    return shareId;
  }

  public trackReferralConversion(referralData: {
    shareId?: string;
    platform: string;
    referredUserId: string;
    referrerId: string;
    timestamp: number;
  }) {
    let shareConversion: ShareConversionData | undefined;

    if (referralData.shareId) {
      shareConversion = this.shareConversions.get(referralData.shareId);
    } else {
      // Find the most recent share from this platform
      const recentShares = Array.from(this.shareConversions.values())
        .filter(share => share.platform === referralData.platform && !share.converted)
        .sort((a, b) => b.shareTimestamp - a.shareTimestamp);
      
      shareConversion = recentShares[0];
    }

    if (shareConversion) {
      shareConversion.converted = true;
      shareConversion.conversionTimestamp = referralData.timestamp;
      shareConversion.referredUserId = referralData.referredUserId;
      
      this.shareConversions.set(shareConversion.shareId, shareConversion);

      // Track conversion in analytics
      trackShareConversion({
        shareId: shareConversion.shareId,
        platform: referralData.platform,
        userId: referralData.referrerId,
        referredUserId: referralData.referredUserId,
        timestamp: referralData.timestamp,
        event: 'referral_converted',
        conversionTime: referralData.timestamp - shareConversion.shareTimestamp,
      });

      // Update store
      const socialStore = useSocialStore.getState();
      socialStore.addSuccessfulReferral(referralData.referredUserId);
      
      // Trigger metrics update
      this.updateViralMetrics();
    }
  }

  public calculateViralCoefficient(): number {
    const socialStore = useSocialStore.getState();
    const totalShares = socialStore.shareCount;
    const successfulReferrals = socialStore.successfulReferrals.length;

    if (totalShares === 0) return 0;

    // Basic viral coefficient: successful referrals / total shares
    const basicCoefficient = successfulReferrals / totalShares;

    // Enhanced coefficient considering time decay and platform effectiveness
    const platformWeights = this.calculatePlatformWeights();
    const timeDecayFactor = this.calculateTimeDecayFactor();
    
    const enhancedCoefficient = basicCoefficient * platformWeights * timeDecayFactor;

    return Math.round(enhancedCoefficient * 1000) / 1000; // Round to 3 decimal places
  }

  private calculatePlatformWeights(): number {
    const conversions = Array.from(this.shareConversions.values()).filter(c => c.converted);
    
    if (conversions.length === 0) return 1;

    const platformStats = new Map<string, { shares: number; conversions: number }>();
    
    // Count shares and conversions by platform
    this.shareConversions.forEach(share => {
      const stats = platformStats.get(share.platform) || { shares: 0, conversions: 0 };
      stats.shares++;
      if (share.converted) stats.conversions++;
      platformStats.set(share.platform, stats);
    });

    // Calculate weighted average based on platform conversion rates
    let totalWeight = 0;
    let weightedSum = 0;
    
    platformStats.forEach(stats => {
      const conversionRate = stats.conversions / stats.shares;
      const weight = stats.shares; // Weight by number of shares
      weightedSum += conversionRate * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? weightedSum / totalWeight : 1;
  }

  private calculateTimeDecayFactor(): number {
    const now = Date.now();
    const conversions = Array.from(this.shareConversions.values()).filter(c => c.converted);
    
    if (conversions.length === 0) return 1;

    // Give more weight to recent conversions
    const decayRate = 0.1; // 10% decay per day
    let totalWeight = 0;
    let weightedSum = 0;

    conversions.forEach(conversion => {
      const ageInDays = (now - conversion.shareTimestamp) / (24 * 60 * 60 * 1000);
      const weight = Math.exp(-decayRate * ageInDays);
      totalWeight += weight;
      weightedSum += weight;
    });

    return totalWeight > 0 ? weightedSum / totalWeight : 1;
  }

  public getViralMetrics(): ViralMetrics {
    const socialStore = useSocialStore.getState();
    const conversions = Array.from(this.shareConversions.values());
    const successfulConversions = conversions.filter(c => c.converted);

    // Platform breakdown
    const platformBreakdown: Record<string, number> = {};
    const conversionByPlatform: Record<string, number> = {};

    conversions.forEach(conversion => {
      platformBreakdown[conversion.platform] = (platformBreakdown[conversion.platform] || 0) + 1;
      if (conversion.converted) {
        conversionByPlatform[conversion.platform] = (conversionByPlatform[conversion.platform] || 0) + 1;
      }
    });

    // Calculate average time to conversion
    const conversionTimes = successfulConversions
      .filter(c => c.conversionTimestamp)
      .map(c => c.conversionTimestamp! - c.shareTimestamp);
    
    const averageTimeToConversion = conversionTimes.length > 0
      ? conversionTimes.reduce((sum, time) => sum + time, 0) / conversionTimes.length
      : 0;

    return {
      totalShares: socialStore.shareCount,
      successfulReferrals: socialStore.successfulReferrals.length,
      viralCoefficient: this.calculateViralCoefficient(),
      shareConversionRate: conversions.length > 0 ? successfulConversions.length / conversions.length : 0,
      platformBreakdown,
      conversionByPlatform,
      averageTimeToConversion,
      retentionAfterReferral: this.calculateRetentionRate(),
    };
  }

  private calculateRetentionRate(): number {
    // This would require tracking user activity after referral
    // For now, return a placeholder value
    // In a real implementation, this would track:
    // - Day 1 retention of referred users
    // - Day 7 retention of referred users
    // - Day 30 retention of referred users
    return 0.75; // 75% placeholder retention rate
  }

  private updateViralMetrics() {
    const metrics = this.getViralMetrics();
    const socialStore = useSocialStore.getState();
    
    // Update viral coefficient in store
    socialStore.updateViralCoefficient(metrics.viralCoefficient);
    
    // Track metrics in analytics
    trackViralMetrics(metrics);
  }

  public optimizeViralGrowth(): {
    recommendations: string[];
    priorityPlatforms: string[];
    suggestedActions: string[];
  } {
    const metrics = this.getViralMetrics();
    const recommendations: string[] = [];
    const priorityPlatforms: string[] = [];
    const suggestedActions: string[] = [];

    // Analyze platform performance
    const platformPerformance = Object.entries(metrics.conversionByPlatform).map(([platform, conversions]) => ({
      platform,
      conversions,
      shares: metrics.platformBreakdown[platform] || 0,
      conversionRate: conversions / (metrics.platformBreakdown[platform] || 1),
    })).sort((a, b) => b.conversionRate - a.conversionRate);

    // Best performing platforms
    priorityPlatforms.push(...platformPerformance.slice(0, 3).map(p => p.platform));

    // Generate recommendations
    if (metrics.viralCoefficient < 0.1) {
      recommendations.push('Viral coefficient is low. Focus on improving share incentives and content quality.');
      suggestedActions.push('Increase share rewards', 'Improve share content templates', 'Add share tutorials');
    }

    if (metrics.shareConversionRate < 0.05) {
      recommendations.push('Share conversion rate is low. Improve targeting and share content relevance.');
      suggestedActions.push('A/B test share messages', 'Improve onboarding flow', 'Add social proof');
    }

    if (metrics.averageTimeToConversion > 24 * 60 * 60 * 1000) {
      recommendations.push('Time to conversion is high. Streamline the referral process.');
      suggestedActions.push('Simplify app installation', 'Add immediate rewards', 'Improve deep linking');
    }

    // Platform-specific recommendations
    if (platformPerformance.length > 0) {
      const bestPlatform = platformPerformance[0];
      recommendations.push(`${bestPlatform.platform} has the highest conversion rate (${(bestPlatform.conversionRate * 100).toFixed(1)}%). Focus marketing efforts here.`);
    }

    return {
      recommendations,
      priorityPlatforms,
      suggestedActions,
    };
  }

  public getShareRewardTier(shareCount: number): {
    tier: number;
    reward: { coins: number; gems: number; title: string };
    nextTierAt: number;
  } {
    const tiers = [
      { shares: 1, coins: 50, gems: 5, title: 'First Share Bonus' },
      { shares: 5, coins: 100, gems: 10, title: 'Social Butterfly' },
      { shares: 10, coins: 200, gems: 20, title: 'Viral Starter' },
      { shares: 25, coins: 500, gems: 50, title: 'Influence Builder' },
      { shares: 50, coins: 1000, gems: 100, title: 'Viral Master' },
      { shares: 100, coins: 2000, gems: 200, title: 'Social Legend' },
    ];

    let currentTier = 0;
    let nextTierAt = tiers[0].shares;

    for (let i = 0; i < tiers.length; i++) {
      if (shareCount >= tiers[i].shares) {
        currentTier = i;
        nextTierAt = i < tiers.length - 1 ? tiers[i + 1].shares : -1;
      }
    }

    const tier = tiers[currentTier];
    
    return {
      tier: currentTier + 1,
      reward: {
        coins: tier.coins,
        gems: tier.gems,
        title: tier.title,
      },
      nextTierAt,
    };
  }

  public cleanup() {
    if (this.metricsUpdateInterval) {
      clearInterval(this.metricsUpdateInterval);
      this.metricsUpdateInterval = null;
    }
  }
}

export const viralTrackingManager = ViralTrackingManager.getInstance();