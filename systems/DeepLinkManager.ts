import * as Linking from 'expo-linking';
import { useSocialStore } from '../store/socialStore';
import { trackViralReferral, trackDeepLinkUsage } from '../utils/analytics';

export interface DeepLinkData {
  type: 'referral' | 'challenge' | 'achievement' | 'level' | 'general';
  referrerId?: string;
  challengeId?: string;
  achievementId?: string;
  levelId?: number;
  campaign?: string;
  medium?: string;
  source?: string;
}

export interface ReferralData {
  referrerId: string;
  referrerName?: string;
  campaign?: string;
  medium: string;
  source: string;
  timestamp: number;
  rewardClaimed: boolean;
}

class DeepLinkManager {
  private static instance: DeepLinkManager;
  private linkingListener: any;
  private appStateListener: any;
  private pendingDeepLink: DeepLinkData | null = null;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): DeepLinkManager {
    if (!DeepLinkManager.instance) {
      DeepLinkManager.instance = new DeepLinkManager();
    }
    return DeepLinkManager.instance;
  }

  private async initialize() {
    try {
      // Handle initial deep link when app is opened from a link
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        this.handleDeepLink(initialUrl);
      }

      // Handle deep links when app is already running
      this.linkingListener = Linking.addEventListener('url', event => {
        this.handleDeepLink(event.url);
      });
    } catch (error) {
      console.error('Error initializing deep link manager:', error);
    }
  }

  private handleDeepLink(url: string) {
    try {
      const parsedUrl = Linking.parse(url);
      const deepLinkData = this.parseDeepLinkData(parsedUrl);

      if (deepLinkData) {
        this.pendingDeepLink = deepLinkData;
        this.processDeepLink(deepLinkData);
      }
    } catch (error) {
      console.error('Error handling deep link:', error);
    }
  }

  private parseDeepLinkData(parsedUrl: any): DeepLinkData | null {
    const { queryParams } = parsedUrl;

    if (!queryParams) return null;

    // Track deep link usage
    trackDeepLinkUsage({
      url: parsedUrl.hostname + parsedUrl.path,
      queryParams,
      timestamp: Date.now(),
    });

    // Referral link
    if (queryParams.ref) {
      return {
        type: 'referral',
        referrerId: queryParams.ref,
        campaign: queryParams.utm_campaign,
        medium: queryParams.utm_medium || 'social',
        source: queryParams.utm_source || 'unknown',
      };
    }

    // Challenge link
    if (queryParams.challenge) {
      return {
        type: 'challenge',
        challengeId: queryParams.challenge,
        campaign: queryParams.utm_campaign,
      };
    }

    // Achievement link
    if (queryParams.achievement) {
      return {
        type: 'achievement',
        achievementId: queryParams.achievement,
      };
    }

    // Level link
    if (queryParams.level) {
      return {
        type: 'level',
        levelId: parseInt(queryParams.level, 10),
      };
    }

    // General marketing link
    return {
      type: 'general',
      campaign: queryParams.utm_campaign,
      medium: queryParams.utm_medium,
      source: queryParams.utm_source,
    };
  }

  private async processDeepLink(data: DeepLinkData) {
    const socialStore = useSocialStore.getState();

    switch (data.type) {
      case 'referral':
        await this.handleReferral(data);
        break;
      case 'challenge':
        await this.handleChallenge(data);
        break;
      case 'achievement':
        await this.handleAchievement(data);
        break;
      case 'level':
        await this.handleLevel(data);
        break;
      case 'general':
        await this.handleGeneral(data);
        break;
    }
  }

  private async handleReferral(data: DeepLinkData) {
    if (!data.referrerId) return;

    const socialStore = useSocialStore.getState();
    const currentPlayerId = socialStore.playerProfile?.playerId;

    // Don't process self-referrals
    if (currentPlayerId === data.referrerId) {
      console.log('Self-referral detected, ignoring');
      return;
    }

    // Check if already referred by this user
    const existingReferral = socialStore.referralData?.referrerId === data.referrerId;
    if (existingReferral) {
      console.log('Already referred by this user');
      return;
    }

    // Create referral data
    const referralData: ReferralData = {
      referrerId: data.referrerId,
      campaign: data.campaign,
      medium: data.medium || 'social',
      source: data.source || 'unknown',
      timestamp: Date.now(),
      rewardClaimed: false,
    };

    // Store referral data
    socialStore.setReferralData(referralData);

    // Track viral referral
    trackViralReferral({
      referrerId: data.referrerId,
      newUserId: currentPlayerId || 'anonymous',
      campaign: data.campaign,
      medium: data.medium,
      source: data.source,
      timestamp: Date.now(),
    });

    // Award referral bonus (both referrer and referee get rewards)
    this.awardReferralBonus(data.referrerId);
  }

  private async handleChallenge(data: DeepLinkData) {
    if (!data.challengeId) return;

    // Navigate to specific challenge
    // This would integrate with your navigation system
    console.log(`Navigating to challenge: ${data.challengeId}`);

    // Track challenge deep link
    trackDeepLinkUsage({
      type: 'challenge',
      challengeId: data.challengeId,
      timestamp: Date.now(),
    });
  }

  private async handleAchievement(data: DeepLinkData) {
    if (!data.achievementId) return;

    // Show achievement details or navigate to achievements screen
    console.log(`Showing achievement: ${data.achievementId}`);

    // Track achievement deep link
    trackDeepLinkUsage({
      type: 'achievement',
      achievementId: data.achievementId,
      timestamp: Date.now(),
    });
  }

  private async handleLevel(data: DeepLinkData) {
    if (!data.levelId) return;

    // Navigate to specific level (if unlocked)
    console.log(`Navigating to level: ${data.levelId}`);

    // Track level deep link
    trackDeepLinkUsage({
      type: 'level',
      levelId: data.levelId,
      timestamp: Date.now(),
    });
  }

  private async handleGeneral(data: DeepLinkData) {
    // Handle general marketing campaigns
    console.log('General deep link processed:', data);

    // Track marketing campaign
    trackDeepLinkUsage({
      type: 'marketing',
      campaign: data.campaign,
      medium: data.medium,
      source: data.source,
      timestamp: Date.now(),
    });
  }

  private awardReferralBonus(referrerId: string) {
    const socialStore = useSocialStore.getState();

    // Award bonus to current player (referee)
    socialStore.awardReferralBonus('referee', {
      coins: 100,
      gems: 10,
      title: 'Welcome Bonus',
      description: 'Thanks for joining through a friend!',
    });

    // Award bonus to referrer (this would be handled server-side in production)
    // For now, we'll track it for analytics
    trackViralReferral({
      referrerId,
      newUserId: socialStore.playerProfile?.playerId || 'anonymous',
      bonusAwarded: true,
      bonusType: 'coins_and_gems',
      bonusAmount: 100,
      timestamp: Date.now(),
    });
  }

  // Public methods for generating share links
  public generateReferralLink(playerId: string, campaign?: string): string {
    const baseUrl = 'https://peashootinpete.com'; // Replace with actual deep link URL
    const params = new URLSearchParams({
      ref: playerId,
      utm_source: 'app',
      utm_medium: 'social',
      utm_campaign: campaign || 'referral',
    });
    return `${baseUrl}?${params.toString()}`;
  }

  public generateChallengeLink(challengeId: string, playerId: string): string {
    const baseUrl = 'https://peashootinpete.com';
    const params = new URLSearchParams({
      challenge: challengeId,
      ref: playerId,
      utm_source: 'app',
      utm_medium: 'challenge',
      utm_campaign: 'daily_challenge',
    });
    return `${baseUrl}?${params.toString()}`;
  }

  public generateAchievementLink(achievementId: string, playerId: string): string {
    const baseUrl = 'https://peashootinpete.com';
    const params = new URLSearchParams({
      achievement: achievementId,
      ref: playerId,
      utm_source: 'app',
      utm_medium: 'achievement',
      utm_campaign: 'achievement_share',
    });
    return `${baseUrl}?${params.toString()}`;
  }

  public generateLevelLink(levelId: number, playerId: string): string {
    const baseUrl = 'https://peashootinpete.com';
    const params = new URLSearchParams({
      level: levelId.toString(),
      ref: playerId,
      utm_source: 'app',
      utm_medium: 'level',
      utm_campaign: 'level_share',
    });
    return `${baseUrl}?${params.toString()}`;
  }

  // Viral coefficient tracking
  public calculateViralCoefficient(): number {
    const socialStore = useSocialStore.getState();
    const shareCount = socialStore.shareCount;
    const referralCount = socialStore.successfulReferrals?.length || 0;

    // Simple viral coefficient: successful referrals / total shares
    return shareCount > 0 ? referralCount / shareCount : 0;
  }

  // Get pending deep link (useful for handling after user login)
  public getPendingDeepLink(): DeepLinkData | null {
    return this.pendingDeepLink;
  }

  public clearPendingDeepLink() {
    this.pendingDeepLink = null;
  }

  // Cleanup
  public cleanup() {
    if (this.linkingListener) {
      this.linkingListener.remove();
    }
  }
}

export const deepLinkManager = DeepLinkManager.getInstance();
