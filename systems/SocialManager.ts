/**
 * Social Manager - Central hub for all social features and networking
 * 
 * Handles:
 * - Friend system operations and networking
 * - Real-time social updates and synchronization
 * - Leaderboard management and caching
 * - Challenge creation and participation
 * - Gift system and exchange protocols
 * - Social group management
 * - Viral sharing and referral tracking
 * 
 * Designed as a singleton for centralized social state management.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SocialPlayer,
  Friend,
  FriendRequest,
  Leaderboard,
  SocialChallenge,
  Gift,
  SocialGroup,
  SocialAnalytics,
  ShareableContent,
  SocialManager as ISocialManager,
  LeaderboardCategory,
  LeaderboardType,
  LeaderboardTimeframe,
  ChallengeFilter,
  SocialEvent,
  SocialPlatform,
  SOCIAL_CONSTANTS
} from '@/types/SocialTypes';
import { useSocialStore } from '@/store/socialStore';

interface SocialNetworkConfig {
  apiBaseUrl: string;
  websocketUrl: string;
  apiKey: string;
  enableRealTimeUpdates: boolean;
  enableAnalytics: boolean;
  enableViralTracking: boolean;
  maxRetries: number;
  retryDelay: number;
}

class SocialManager implements ISocialManager {
  private static instance: SocialManager;
  private config: SocialNetworkConfig;
  private websocket: WebSocket | null = null;
  private isConnected = false;
  private retryCount = 0;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  
  // Cache for performance
  private leaderboardCache = new Map<string, { data: Leaderboard; expiry: number }>();
  private playerCache = new Map<string, { data: SocialPlayer; expiry: number }>();
  
  private constructor() {
    this.config = {
      apiBaseUrl: process.env.EXPO_PUBLIC_SOCIAL_API_URL || 'https://api.peashootinpete.com/social',
      websocketUrl: process.env.EXPO_PUBLIC_SOCIAL_WS_URL || 'wss://ws.peashootinpete.com/social',
      apiKey: process.env.EXPO_PUBLIC_SOCIAL_API_KEY || 'demo-key',
      enableRealTimeUpdates: true,
      enableAnalytics: true,
      enableViralTracking: true,
      maxRetries: 3,
      retryDelay: 1000
    };
  }

  public static getInstance(): SocialManager {
    if (!SocialManager.instance) {
      SocialManager.instance = new SocialManager();
    }
    return SocialManager.instance;
  }

  // Connection Management
  public async initialize(): Promise<void> {
    try {
      await this.connectWebSocket();
      await this.loadPersistedSocialData();
      this.startHeartbeat();
      
      const store = useSocialStore.getState();
      store.setSocialConnectionStatus('connected');
      
      console.log('Social Manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Social Manager:', error);
      const store = useSocialStore.getState();
      store.setSocialConnectionStatus('disconnected');
    }
  }

  private async connectWebSocket(): Promise<void> {
    if (!this.config.enableRealTimeUpdates) return;

    return new Promise((resolve, reject) => {
      try {
        this.websocket = new WebSocket(this.config.websocketUrl);
        
        this.websocket.onopen = () => {
          this.isConnected = true;
          this.retryCount = 0;
          console.log('Social WebSocket connected');
          resolve();
        };
        
        this.websocket.onmessage = (event) => {
          this.handleWebSocketMessage(event);
        };
        
        this.websocket.onclose = () => {
          this.isConnected = false;
          console.log('Social WebSocket disconnected');
          this.scheduleReconnect();
        };
        
        this.websocket.onerror = (error) => {
          console.error('Social WebSocket error:', error);
          reject(error);
        };
        
        // Timeout for connection
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('WebSocket connection timeout'));
          }
        }, 5000);
        
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleWebSocketMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      const store = useSocialStore.getState();
      
      switch (message.type) {
        case 'friend_request_received':
          store.addReceivedFriendRequest(message.data);
          break;
          
        case 'friend_online':
          store.updateFriend(message.data.playerId, {
            player: { ...message.data.player, isOnline: true }
          });
          break;
          
        case 'friend_offline':
          store.updateFriend(message.data.playerId, {
            player: { ...message.data.player, isOnline: false, lastSeen: Date.now() }
          });
          break;
          
        case 'gift_received':
          store.addReceivedGift(message.data);
          break;
          
        case 'challenge_invitation':
          store.addActiveChallenge(message.data);
          break;
          
        case 'leaderboard_update':
          const { category, type, timeframe, leaderboard } = message.data;
          const key = `${category}_${type}_${timeframe}`;
          store.updateLeaderboard(key, leaderboard);
          break;
          
        case 'social_achievement':
          // Handle social achievements (friend milestones, etc.)
          console.log('Social achievement unlocked:', message.data);
          break;
          
        default:
          console.log('Unknown social message type:', message.type);
      }
    } catch (error) {
      console.error('Error processing social message:', error);
    }
  }

  private scheduleReconnect(): void {
    if (this.retryCount < this.config.maxRetries) {
      setTimeout(() => {
        this.retryCount++;
        console.log(`Attempting social reconnect ${this.retryCount}/${this.config.maxRetries}`);
        this.connectWebSocket();
      }, this.config.retryDelay * Math.pow(2, this.retryCount));
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.websocket && this.isConnected) {
        this.websocket.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // 30 seconds
  }

  private async loadPersistedSocialData(): Promise<void> {
    try {
      // Load and refresh critical social data
      await this.refreshFriendsList();
      await this.refreshFriendRequests();
      await this.refreshActiveGifts();
    } catch (error) {
      console.warn('Could not load persisted social data:', error);
    }
  }

  // API Helper Methods
  private async makeApiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.apiBaseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      ...options.headers
    };

    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      throw new Error(`Social API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  private getCacheKey(category: LeaderboardCategory, type: LeaderboardType, timeframe: LeaderboardTimeframe): string {
    return `${category}_${type}_${timeframe}`;
  }

  // Friend Management Implementation
  public async sendFriendRequest(playerId: string, message?: string): Promise<boolean> {
    try {
      const request = await this.makeApiCall<FriendRequest>('/friends/request', {
        method: 'POST',
        body: JSON.stringify({ playerId, message })
      });
      
      const store = useSocialStore.getState();
      store.addSentFriendRequest(request);
      store.trackSocialEvent({
        type: 'friend_request_sent',
        playerId: store.currentPlayer?.id || '',
        targetId: playerId,
        timestamp: Date.now()
      });
      
      return true;
    } catch (error) {
      console.error('Failed to send friend request:', error);
      return false;
    }
  }

  public async acceptFriendRequest(requestId: string): Promise<boolean> {
    try {
      const friend = await this.makeApiCall<Friend>(`/friends/request/${requestId}/accept`, {
        method: 'POST'
      });
      
      const store = useSocialStore.getState();
      await store.acceptFriendRequest(requestId);
      
      return true;
    } catch (error) {
      console.error('Failed to accept friend request:', error);
      return false;
    }
  }

  public async declineFriendRequest(requestId: string): Promise<boolean> {
    try {
      await this.makeApiCall(`/friends/request/${requestId}/decline`, {
        method: 'POST'
      });
      
      const store = useSocialStore.getState();
      store.declineFriendRequest(requestId);
      
      return true;
    } catch (error) {
      console.error('Failed to decline friend request:', error);
      return false;
    }
  }

  public async removeFriend(playerId: string): Promise<boolean> {
    try {
      await this.makeApiCall(`/friends/${playerId}`, {
        method: 'DELETE'
      });
      
      const store = useSocialStore.getState();
      store.removeFriend(playerId);
      store.trackSocialEvent({
        type: 'friend_removed',
        playerId: store.currentPlayer?.id || '',
        targetId: playerId,
        timestamp: Date.now()
      });
      
      return true;
    } catch (error) {
      console.error('Failed to remove friend:', error);
      return false;
    }
  }

  public async blockPlayer(playerId: string): Promise<boolean> {
    try {
      await this.makeApiCall(`/players/${playerId}/block`, {
        method: 'POST'
      });
      
      const store = useSocialStore.getState();
      store.blockPlayer(playerId);
      
      return true;
    } catch (error) {
      console.error('Failed to block player:', error);
      return false;
    }
  }

  // Friend Queries
  public async getFriends(): Promise<Friend[]> {
    try {
      const friends = await this.makeApiCall<Friend[]>('/friends');
      const store = useSocialStore.getState();
      
      // Update store with fresh friend data
      friends.forEach(friend => store.addFriend(friend));
      
      return friends;
    } catch (error) {
      console.error('Failed to get friends:', error);
      // Return cached friends if API fails
      return useSocialStore.getState().friends;
    }
  }

  public async getFriendRequests(): Promise<FriendRequest[]> {
    try {
      const requests = await this.makeApiCall<FriendRequest[]>('/friends/requests');
      return requests;
    } catch (error) {
      console.error('Failed to get friend requests:', error);
      const store = useSocialStore.getState();
      return [...store.sentFriendRequests, ...store.receivedFriendRequests];
    }
  }

  public async searchPlayers(query: string): Promise<SocialPlayer[]> {
    try {
      const players = await this.makeApiCall<SocialPlayer[]>(`/players/search?q=${encodeURIComponent(query)}`);
      
      // Cache searched players
      players.forEach(player => {
        this.playerCache.set(player.id, {
          data: player,
          expiry: Date.now() + 300000 // 5 minutes
        });
      });
      
      return players;
    } catch (error) {
      console.error('Failed to search players:', error);
      return [];
    }
  }

  // Leaderboard Implementation
  public async getLeaderboard(
    category: LeaderboardCategory,
    type: LeaderboardType,
    timeframe: LeaderboardTimeframe
  ): Promise<Leaderboard> {
    const cacheKey = this.getCacheKey(category, type, timeframe);
    
    // Check cache first
    const cached = this.leaderboardCache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    
    try {
      const leaderboard = await this.makeApiCall<Leaderboard>(
        `/leaderboards/${category}/${type}/${timeframe}`
      );
      
      // Update cache
      this.leaderboardCache.set(cacheKey, {
        data: leaderboard,
        expiry: Date.now() + SOCIAL_CONSTANTS.LEADERBOARD_UPDATE_INTERVAL
      });
      
      // Update store
      const store = useSocialStore.getState();
      store.updateLeaderboard(cacheKey, leaderboard);
      
      return leaderboard;
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
      
      // Return cached data if available
      if (cached) {
        return cached.data;
      }
      
      throw error;
    }
  }

  public async getPlayerRank(category: LeaderboardCategory): Promise<number> {
    try {
      const response = await this.makeApiCall<{ rank: number }>(`/leaderboards/${category}/rank`);
      
      const store = useSocialStore.getState();
      store.setPlayerRank(category, response.rank);
      
      return response.rank;
    } catch (error) {
      console.error('Failed to get player rank:', error);
      return useSocialStore.getState().playerRankings[category] || 0;
    }
  }

  // Social Sharing Implementation
  public async shareContent(content: ShareableContent, platform: SocialPlatform): Promise<boolean> {
    try {
      // Track sharing attempt
      const store = useSocialStore.getState();
      store.trackSocialEvent({
        type: 'content_shared',
        playerId: store.currentPlayer?.id || '',
        data: { contentType: content.type, platform },
        timestamp: Date.now()
      });
      
      // Platform-specific sharing logic would go here
      // For now, just log and copy to clipboard if needed
      if (platform === 'clipboard') {
        // Would use clipboard API here
        console.log('Copied to clipboard:', content.deepLink);
      }
      
      // Update share metrics
      await this.makeApiCall(`/sharing/${content.shareId}/shared`, {
        method: 'POST',
        body: JSON.stringify({ platform })
      });
      
      return true;
    } catch (error) {
      console.error('Failed to share content:', error);
      return false;
    }
  }

  public trackShareMetrics(shareId: string, event: 'view' | 'click' | 'install'): void {
    // Track share performance metrics
    this.makeApiCall(`/sharing/${shareId}/${event}`, {
      method: 'POST'
    }).catch(error => {
      console.warn('Failed to track share metric:', error);
    });
  }

  // Gift System Implementation
  public async sendGift(gift: Omit<Gift, 'id' | 'sentAt' | 'status'>): Promise<string> {
    try {
      const sentGift = await this.makeApiCall<Gift>('/gifts/send', {
        method: 'POST',
        body: JSON.stringify(gift)
      });
      
      const store = useSocialStore.getState();
      store.addSentGift(sentGift);
      store.trackSocialEvent({
        type: 'gift_sent',
        playerId: store.currentPlayer?.id || '',
        targetId: gift.toPlayerId,
        timestamp: Date.now()
      });
      
      return sentGift.id;
    } catch (error) {
      console.error('Failed to send gift:', error);
      throw error;
    }
  }

  public async claimGift(giftId: string): Promise<boolean> {
    try {
      await this.makeApiCall(`/gifts/${giftId}/claim`, {
        method: 'POST'
      });
      
      const store = useSocialStore.getState();
      store.claimGift(giftId);
      
      return true;
    } catch (error) {
      console.error('Failed to claim gift:', error);
      return false;
    }
  }

  public async getReceivedGifts(): Promise<Gift[]> {
    try {
      const gifts = await this.makeApiCall<Gift[]>('/gifts/received');
      
      const store = useSocialStore.getState();
      gifts.forEach(gift => store.addReceivedGift(gift));
      
      return gifts;
    } catch (error) {
      console.error('Failed to get received gifts:', error);
      return useSocialStore.getState().receivedGifts;
    }
  }

  // Challenge System Implementation
  public async createChallenge(challenge: Omit<SocialChallenge, 'id' | 'createdAt'>): Promise<string> {
    try {
      const createdChallenge = await this.makeApiCall<SocialChallenge>('/challenges', {
        method: 'POST',
        body: JSON.stringify(challenge)
      });
      
      const store = useSocialStore.getState();
      store.addActiveChallenge(createdChallenge);
      store.trackSocialEvent({
        type: 'challenge_created',
        playerId: store.currentPlayer?.id || '',
        timestamp: Date.now()
      });
      
      return createdChallenge.id;
    } catch (error) {
      console.error('Failed to create challenge:', error);
      throw error;
    }
  }

  public async joinChallenge(challengeId: string): Promise<boolean> {
    try {
      await this.makeApiCall(`/challenges/${challengeId}/join`, {
        method: 'POST'
      });
      
      const store = useSocialStore.getState();
      store.trackSocialEvent({
        type: 'challenge_joined',
        playerId: store.currentPlayer?.id || '',
        data: { challengeId },
        timestamp: Date.now()
      });
      
      return true;
    } catch (error) {
      console.error('Failed to join challenge:', error);
      return false;
    }
  }

  public async getChallenges(filter?: ChallengeFilter): Promise<SocialChallenge[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const challenges = await this.makeApiCall<SocialChallenge[]>(
        `/challenges?${queryParams.toString()}`
      );
      
      return challenges;
    } catch (error) {
      console.error('Failed to get challenges:', error);
      return useSocialStore.getState().activeChallenges;
    }
  }

  // Group System (Basic Implementation)
  public async createGroup(group: Omit<SocialGroup, 'id' | 'createdAt' | 'members'>): Promise<string> {
    try {
      const createdGroup = await this.makeApiCall<SocialGroup>('/groups', {
        method: 'POST',
        body: JSON.stringify(group)
      });
      
      const store = useSocialStore.getState();
      store.joinGroup(createdGroup);
      
      return createdGroup.id;
    } catch (error) {
      console.error('Failed to create group:', error);
      throw error;
    }
  }

  public async joinGroup(groupId: string): Promise<boolean> {
    try {
      const group = await this.makeApiCall<SocialGroup>(`/groups/${groupId}/join`, {
        method: 'POST'
      });
      
      const store = useSocialStore.getState();
      store.joinGroup(group);
      
      return true;
    } catch (error) {
      console.error('Failed to join group:', error);
      return false;
    }
  }

  public async leaveGroup(groupId: string): Promise<boolean> {
    try {
      await this.makeApiCall(`/groups/${groupId}/leave`, {
        method: 'POST'
      });
      
      const store = useSocialStore.getState();
      store.leaveGroup(groupId);
      
      return true;
    } catch (error) {
      console.error('Failed to leave group:', error);
      return false;
    }
  }

  public async getGroups(): Promise<SocialGroup[]> {
    try {
      const groups = await this.makeApiCall<SocialGroup[]>('/groups');
      return groups;
    } catch (error) {
      console.error('Failed to get groups:', error);
      return useSocialStore.getState().joinedGroups;
    }
  }

  // Analytics Implementation
  public async getSocialAnalytics(timeframe: 'daily' | 'weekly' | 'monthly'): Promise<SocialAnalytics> {
    try {
      const analytics = await this.makeApiCall<SocialAnalytics>(`/analytics/${timeframe}`);
      
      const store = useSocialStore.getState();
      store.updateSocialAnalytics(analytics);
      
      return analytics;
    } catch (error) {
      console.error('Failed to get social analytics:', error);
      throw error;
    }
  }

  public trackSocialEvent(event: SocialEvent): void {
    if (!this.config.enableAnalytics) return;
    
    // Update local store
    const store = useSocialStore.getState();
    store.trackSocialEvent(event);
    
    // Send to analytics service (fire and forget)
    this.makeApiCall('/analytics/events', {
      method: 'POST',
      body: JSON.stringify(event)
    }).catch(error => {
      console.warn('Failed to track social event:', error);
    });
  }

  // Utility Methods
  private async refreshFriendsList(): Promise<void> {
    try {
      await this.getFriends();
    } catch (error) {
      console.warn('Could not refresh friends list:', error);
    }
  }

  private async refreshFriendRequests(): Promise<void> {
    try {
      await this.getFriendRequests();
    } catch (error) {
      console.warn('Could not refresh friend requests:', error);
    }
  }

  private async refreshActiveGifts(): Promise<void> {
    try {
      await this.getReceivedGifts();
    } catch (error) {
      console.warn('Could not refresh gifts:', error);
    }
  }

  public async cleanup(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    
    this.isConnected = false;
    this.leaderboardCache.clear();
    this.playerCache.clear();
  }
}

// Export singleton instance
export const socialManager = SocialManager.getInstance();
export default SocialManager;