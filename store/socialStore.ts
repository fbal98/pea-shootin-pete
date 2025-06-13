/**
 * Social Store - Zustand store for social features and friend system
 * 
 * Manages:
 * - Friend list and friendship status
 * - Friend requests (sent/received)
 * - Social player profiles and discovery
 * - Leaderboards and rankings
 * - Social challenges and competitions
 * - Gift system and exchanges
 * - Social groups and communities
 * 
 * Designed for real-time social interaction and viral growth.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
  LeaderboardCategory,
  LeaderboardType,
  LeaderboardTimeframe,
  ChallengeFilter,
  SocialEvent,
  SOCIAL_CONSTANTS
} from '@/types/SocialTypes';

// Additional interfaces for viral features
export interface ShareData {
  platform: string;
  contentType: string;
  timestamp: number;
  success?: boolean;
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

export interface PlayerProfile {
  playerId: string;
  playerName: string;
  avatar?: string;
  level: number;
  joinDate: number;
}

export interface ReferralBonus {
  coins: number;
  gems: number;
  title: string;
  description: string;
}

interface SocialState {
  // Current player's social profile
  currentPlayer: SocialPlayer | null;
  
  // Friend system
  friends: Friend[];
  sentFriendRequests: FriendRequest[];
  receivedFriendRequests: FriendRequest[];
  blockedPlayers: string[];
  
  // Player discovery
  suggestedFriends: SocialPlayer[];
  recentPlayers: SocialPlayer[];
  nearbyPlayers: SocialPlayer[];
  
  // Leaderboards
  globalLeaderboards: Record<string, Leaderboard>;
  friendsLeaderboards: Record<string, Leaderboard>;
  playerRankings: Record<string, number>;
  
  // Social challenges
  activeChallenges: SocialChallenge[];
  completedChallenges: SocialChallenge[];
  invitedChallenges: SocialChallenge[];
  
  // Gift system
  receivedGifts: Gift[];
  sentGifts: Gift[];
  giftInventory: Record<string, number>;
  
  // Groups
  joinedGroups: SocialGroup[];
  invitedGroups: SocialGroup[];
  
  // Social analytics
  socialAnalytics: SocialAnalytics | null;
  
  // Viral features
  playerProfile: PlayerProfile | null;
  shareCount: number;
  recentShares: ShareData[];
  referralData: ReferralData | null;
  successfulReferrals: string[];
  viralCoefficient: number;
  shareRewards: ReferralBonus[];
  
  // UI state
  lastSocialUpdate: number;
  socialNotifications: number;
  unreadMessages: number;
  
  // Connection status
  isOnline: boolean;
  lastOnlineAt: number;
  socialConnectionStatus: 'connected' | 'connecting' | 'disconnected';
}

interface SocialActions {
  // Profile management
  updateCurrentPlayer: (player: SocialPlayer) => void;
  setOnlineStatus: (isOnline: boolean) => void;
  
  // Friend management
  addFriend: (friend: Friend) => void;
  removeFriend: (playerId: string) => void;
  updateFriend: (playerId: string, updates: Partial<Friend>) => void;
  
  // Friend requests
  addSentFriendRequest: (request: FriendRequest) => void;
  addReceivedFriendRequest: (request: FriendRequest) => void;
  removeFriendRequest: (requestId: string) => void;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  declineFriendRequest: (requestId: string) => void;
  
  // Player discovery
  setSuggestedFriends: (players: SocialPlayer[]) => void;
  addRecentPlayer: (player: SocialPlayer) => void;
  setNearbyPlayers: (players: SocialPlayer[]) => void;
  
  // Blocking
  blockPlayer: (playerId: string) => void;
  unblockPlayer: (playerId: string) => void;
  
  // Leaderboards
  updateLeaderboard: (key: string, leaderboard: Leaderboard) => void;
  setPlayerRank: (category: string, rank: number) => void;
  
  // Challenges
  addActiveChallenge: (challenge: SocialChallenge) => void;
  updateChallenge: (challengeId: string, updates: Partial<SocialChallenge>) => void;
  completeChallenge: (challengeId: string) => void;
  removeChallenge: (challengeId: string) => void;
  
  // Gifts
  addReceivedGift: (gift: Gift) => void;
  addSentGift: (gift: Gift) => void;
  claimGift: (giftId: string) => void;
  removeGift: (giftId: string) => void;
  updateGiftInventory: (itemType: string, amount: number) => void;
  
  // Groups
  joinGroup: (group: SocialGroup) => void;
  leaveGroup: (groupId: string) => void;
  updateGroup: (groupId: string, updates: Partial<SocialGroup>) => void;
  
  // Viral features
  setPlayerProfile: (profile: PlayerProfile) => void;
  incrementShareCount: () => void;
  addRecentShare: (share: ShareData) => void;
  setReferralData: (data: ReferralData) => void;
  addSuccessfulReferral: (playerId: string) => void;
  updateViralCoefficient: (coefficient: number) => void;
  awardReferralBonus: (type: 'referrer' | 'referee', bonus: ReferralBonus) => void;
  
  // Analytics
  updateSocialAnalytics: (analytics: SocialAnalytics) => void;
  trackSocialEvent: (event: SocialEvent) => void;
  
  // UI state
  setSocialNotifications: (count: number) => void;
  setUnreadMessages: (count: number) => void;
  setSocialConnectionStatus: (status: 'connected' | 'connecting' | 'disconnected') => void;
  
  // Utility actions
  refreshSocialData: () => Promise<void>;
  clearSocialData: () => void;
}

type SocialStore = SocialState & SocialActions;

const initialState: SocialState = {
  currentPlayer: null,
  friends: [],
  sentFriendRequests: [],
  receivedFriendRequests: [],
  blockedPlayers: [],
  suggestedFriends: [],
  recentPlayers: [],
  nearbyPlayers: [],
  globalLeaderboards: {},
  friendsLeaderboards: {},
  playerRankings: {},
  activeChallenges: [],
  completedChallenges: [],
  invitedChallenges: [],
  receivedGifts: [],
  sentGifts: [],
  giftInventory: {},
  joinedGroups: [],
  invitedGroups: [],
  socialAnalytics: null,
  playerProfile: null,
  shareCount: 0,
  recentShares: [],
  referralData: null,
  successfulReferrals: [],
  viralCoefficient: 0,
  shareRewards: [],
  lastSocialUpdate: 0,
  socialNotifications: 0,
  unreadMessages: 0,
  isOnline: false,
  lastOnlineAt: 0,
  socialConnectionStatus: 'disconnected'
};

export const useSocialStore = create<SocialStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Profile management
      updateCurrentPlayer: (player: SocialPlayer) => set({ currentPlayer: player }),
      
      setOnlineStatus: (isOnline: boolean) => set({ 
        isOnline, 
        lastOnlineAt: isOnline ? Date.now() : get().lastOnlineAt 
      }),

      // Friend management
      addFriend: (friend: Friend) => set(state => ({
        friends: [...state.friends.filter(f => f.player.id !== friend.player.id), friend]
      })),

      removeFriend: (playerId: string) => set(state => ({
        friends: state.friends.filter(f => f.player.id !== playerId)
      })),

      updateFriend: (playerId: string, updates: Partial<Friend>) => set(state => ({
        friends: state.friends.map(f => 
          f.player.id === playerId ? { ...f, ...updates } : f
        )
      })),

      // Friend requests
      addSentFriendRequest: (request: FriendRequest) => set(state => ({
        sentFriendRequests: [...state.sentFriendRequests, request]
      })),

      addReceivedFriendRequest: (request: FriendRequest) => set(state => ({
        receivedFriendRequests: [...state.receivedFriendRequests, request],
        socialNotifications: state.socialNotifications + 1
      })),

      removeFriendRequest: (requestId: string) => set(state => ({
        sentFriendRequests: state.sentFriendRequests.filter(r => r.id !== requestId),
        receivedFriendRequests: state.receivedFriendRequests.filter(r => r.id !== requestId)
      })),

      acceptFriendRequest: async (requestId: string) => {
        const state = get();
        const request = state.receivedFriendRequests.find(r => r.id === requestId);
        
        if (request) {
          // Convert request to friendship
          const newFriend: Friend = {
            player: request.fromPlayer,
            friendship: {
              status: 'friends',
              since: Date.now()
            },
            mutualFriends: 0, // Will be calculated by backend
            recentAchievements: [],
            recentHighScores: [],
            gamesPlayedTogether: 0,
            giftsExchanged: 0,
            lastInteraction: Date.now()
          };
          
          set(state => ({
            friends: [...state.friends, newFriend],
            receivedFriendRequests: state.receivedFriendRequests.filter(r => r.id !== requestId),
            socialNotifications: Math.max(0, state.socialNotifications - 1)
          }));
          
          // Track social event
          get().trackSocialEvent({
            type: 'friend_added',
            playerId: state.currentPlayer?.id || '',
            targetId: request.fromPlayer.id,
            timestamp: Date.now()
          });
        }
      },

      declineFriendRequest: (requestId: string) => set(state => ({
        receivedFriendRequests: state.receivedFriendRequests.filter(r => r.id !== requestId),
        socialNotifications: Math.max(0, state.socialNotifications - 1)
      })),

      // Player discovery
      setSuggestedFriends: (players: SocialPlayer[]) => set({ suggestedFriends: players }),
      
      addRecentPlayer: (player: SocialPlayer) => set(state => ({
        recentPlayers: [
          player,
          ...state.recentPlayers.filter(p => p.id !== player.id)
        ].slice(0, 20) // Keep only recent 20 players
      })),
      
      setNearbyPlayers: (players: SocialPlayer[]) => set({ nearbyPlayers: players }),

      // Blocking
      blockPlayer: (playerId: string) => set(state => ({
        blockedPlayers: [...state.blockedPlayers, playerId],
        friends: state.friends.filter(f => f.player.id !== playerId),
        sentFriendRequests: state.sentFriendRequests.filter(r => r.toPlayerId !== playerId),
        receivedFriendRequests: state.receivedFriendRequests.filter(r => r.fromPlayer.id !== playerId)
      })),

      unblockPlayer: (playerId: string) => set(state => ({
        blockedPlayers: state.blockedPlayers.filter(id => id !== playerId)
      })),

      // Leaderboards
      updateLeaderboard: (key: string, leaderboard: Leaderboard) => set(state => ({
        globalLeaderboards: leaderboard.type === 'global' 
          ? { ...state.globalLeaderboards, [key]: leaderboard }
          : state.globalLeaderboards,
        friendsLeaderboards: leaderboard.type === 'friends'
          ? { ...state.friendsLeaderboards, [key]: leaderboard }
          : state.friendsLeaderboards,
        lastSocialUpdate: Date.now()
      })),

      setPlayerRank: (category: string, rank: number) => set(state => ({
        playerRankings: { ...state.playerRankings, [category]: rank }
      })),

      // Challenges
      addActiveChallenge: (challenge: SocialChallenge) => set(state => ({
        activeChallenges: [...state.activeChallenges, challenge]
      })),

      updateChallenge: (challengeId: string, updates: Partial<SocialChallenge>) => set(state => ({
        activeChallenges: state.activeChallenges.map(c =>
          c.id === challengeId ? { ...c, ...updates } : c
        ),
        completedChallenges: state.completedChallenges.map(c =>
          c.id === challengeId ? { ...c, ...updates } : c
        )
      })),

      completeChallenge: (challengeId: string) => set(state => {
        const challenge = state.activeChallenges.find(c => c.id === challengeId);
        if (challenge) {
          return {
            activeChallenges: state.activeChallenges.filter(c => c.id !== challengeId),
            completedChallenges: [...state.completedChallenges, { ...challenge, status: 'completed' }]
          };
        }
        return state;
      }),

      removeChallenge: (challengeId: string) => set(state => ({
        activeChallenges: state.activeChallenges.filter(c => c.id !== challengeId),
        invitedChallenges: state.invitedChallenges.filter(c => c.id !== challengeId)
      })),

      // Gifts
      addReceivedGift: (gift: Gift) => set(state => ({
        receivedGifts: [...state.receivedGifts, gift],
        socialNotifications: state.socialNotifications + 1
      })),

      addSentGift: (gift: Gift) => set(state => ({
        sentGifts: [...state.sentGifts, gift]
      })),

      claimGift: (giftId: string) => set(state => {
        const gift = state.receivedGifts.find(g => g.id === giftId);
        if (gift && gift.status === 'pending') {
          return {
            receivedGifts: state.receivedGifts.map(g =>
              g.id === giftId ? { ...g, status: 'claimed', claimedAt: Date.now() } : g
            ),
            giftInventory: {
              ...state.giftInventory,
              [gift.itemType]: (state.giftInventory[gift.itemType] || 0) + gift.amount
            },
            socialNotifications: Math.max(0, state.socialNotifications - 1)
          };
        }
        return state;
      }),

      removeGift: (giftId: string) => set(state => ({
        receivedGifts: state.receivedGifts.filter(g => g.id !== giftId),
        sentGifts: state.sentGifts.filter(g => g.id !== giftId)
      })),

      updateGiftInventory: (itemType: string, amount: number) => set(state => ({
        giftInventory: {
          ...state.giftInventory,
          [itemType]: Math.max(0, (state.giftInventory[itemType] || 0) + amount)
        }
      })),

      // Groups
      joinGroup: (group: SocialGroup) => set(state => ({
        joinedGroups: [...state.joinedGroups.filter(g => g.id !== group.id), group]
      })),

      leaveGroup: (groupId: string) => set(state => ({
        joinedGroups: state.joinedGroups.filter(g => g.id !== groupId)
      })),

      updateGroup: (groupId: string, updates: Partial<SocialGroup>) => set(state => ({
        joinedGroups: state.joinedGroups.map(g =>
          g.id === groupId ? { ...g, ...updates } : g
        )
      })),

      // Analytics
      updateSocialAnalytics: (analytics: SocialAnalytics) => set({ socialAnalytics: analytics }),

      trackSocialEvent: (event: SocialEvent) => {
        // In a real implementation, this would send to analytics service
        console.log('Social event tracked:', event);
        
        // Update local analytics counters
        const state = get();
        if (state.socialAnalytics) {
          const analytics = { ...state.socialAnalytics };
          
          switch (event.type) {
            case 'friend_request_sent':
              analytics.friendRequestsSent++;
              break;
            case 'friend_request_received':
              analytics.friendRequestsReceived++;
              break;
            case 'friend_added':
              analytics.friendsGained++;
              break;
            case 'friend_removed':
              analytics.friendsLost++;
              break;
            case 'content_shared':
              analytics.sharesSent++;
              break;
            case 'challenge_created':
              analytics.challengesCreated++;
              break;
            case 'challenge_joined':
              analytics.challengesJoined++;
              break;
            case 'gift_sent':
              analytics.giftsSent++;
              break;
            case 'gift_received':
              analytics.giftsReceived++;
              break;
          }
          
          set({ socialAnalytics: analytics });
        }
      },

      // Viral features
      setPlayerProfile: (profile: PlayerProfile) => set({ playerProfile: profile }),
      
      incrementShareCount: () => set(state => ({ shareCount: state.shareCount + 1 })),
      
      addRecentShare: (share: ShareData) => set(state => ({
        recentShares: [share, ...state.recentShares].slice(0, 100) // Keep recent 100 shares
      })),
      
      setReferralData: (data: ReferralData) => set({ referralData: data }),
      
      addSuccessfulReferral: (playerId: string) => set(state => ({
        successfulReferrals: [...state.successfulReferrals, playerId]
      })),
      
      updateViralCoefficient: (coefficient: number) => set({ viralCoefficient: coefficient }),
      
      awardReferralBonus: (type: 'referrer' | 'referee', bonus: ReferralBonus) => set(state => ({
        shareRewards: [...state.shareRewards, bonus],
        socialNotifications: state.socialNotifications + 1
      })),

      // UI state
      setSocialNotifications: (count: number) => set({ socialNotifications: count }),
      setUnreadMessages: (count: number) => set({ unreadMessages: count }),
      setSocialConnectionStatus: (status) => set({ socialConnectionStatus: status }),

      // Utility actions
      refreshSocialData: async () => {
        // In a real implementation, this would fetch fresh data from the server
        set({ lastSocialUpdate: Date.now() });
      },

      clearSocialData: () => set(initialState)
    }),
    {
      name: 'social-store',
      storage: {
        getItem: async (name: string) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name: string, value: any) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name: string) => {
          await AsyncStorage.removeItem(name);
        },
      },
      // Only persist essential social data, not real-time state
      partialize: (state) => ({
        currentPlayer: state.currentPlayer,
        friends: state.friends,
        blockedPlayers: state.blockedPlayers,
        giftInventory: state.giftInventory,
        joinedGroups: state.joinedGroups,
        socialAnalytics: state.socialAnalytics,
        playerProfile: state.playerProfile,
        shareCount: state.shareCount,
        recentShares: state.recentShares,
        referralData: state.referralData,
        successfulReferrals: state.successfulReferrals,
        viralCoefficient: state.viralCoefficient,
        shareRewards: state.shareRewards,
        lastSocialUpdate: state.lastSocialUpdate
      }),
    }
  )
);

// Individual selectors for optimal performance
export const useCurrentPlayer = () => useSocialStore(state => state.currentPlayer);
export const useFriends = () => useSocialStore(state => state.friends);
export const useFriendRequests = () => useSocialStore(state => ({
  sent: state.sentFriendRequests,
  received: state.receivedFriendRequests
}));
export const useSuggestedFriends = () => useSocialStore(state => state.suggestedFriends);
export const useActiveChallenges = () => useSocialStore(state => state.activeChallenges);
export const useReceivedGifts = () => useSocialStore(state => state.receivedGifts);
export const useJoinedGroups = () => useSocialStore(state => state.joinedGroups);
export const useSocialNotifications = () => useSocialStore(state => state.socialNotifications);
export const useIsOnline = () => useSocialStore(state => state.isOnline);
export const useSocialConnectionStatus = () => useSocialStore(state => state.socialConnectionStatus);

// Viral feature selectors
export const usePlayerProfile = () => useSocialStore(state => state.playerProfile);
export const useShareCount = () => useSocialStore(state => state.shareCount);
export const useRecentShares = () => useSocialStore(state => state.recentShares);
export const useReferralData = () => useSocialStore(state => state.referralData);
export const useSuccessfulReferrals = () => useSocialStore(state => state.successfulReferrals);
export const useViralCoefficient = () => useSocialStore(state => state.viralCoefficient);
export const useShareRewards = () => useSocialStore(state => state.shareRewards);

// Action selectors
export const useSocialActions = () => useSocialStore(state => ({
  updateCurrentPlayer: state.updateCurrentPlayer,
  setOnlineStatus: state.setOnlineStatus,
  addFriend: state.addFriend,
  removeFriend: state.removeFriend,
  acceptFriendRequest: state.acceptFriendRequest,
  declineFriendRequest: state.declineFriendRequest,
  addReceivedFriendRequest: state.addReceivedFriendRequest,
  blockPlayer: state.blockPlayer,
  claimGift: state.claimGift,
  joinGroup: state.joinGroup,
  trackSocialEvent: state.trackSocialEvent,
  setSocialNotifications: state.setSocialNotifications,
  refreshSocialData: state.refreshSocialData,
  clearSocialData: state.clearSocialData
}));

// Viral action selectors
export const useViralActions = () => useSocialStore(state => ({
  setPlayerProfile: state.setPlayerProfile,
  incrementShareCount: state.incrementShareCount,
  addRecentShare: state.addRecentShare,
  setReferralData: state.setReferralData,
  addSuccessfulReferral: state.addSuccessfulReferral,
  updateViralCoefficient: state.updateViralCoefficient,
  awardReferralBonus: state.awardReferralBonus,
}));

export default useSocialStore;