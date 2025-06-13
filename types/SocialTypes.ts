/**
 * Social System Types - Friend system and social features
 * 
 * Comprehensive social networking features for viral growth and retention:
 * - Friend system with invitations and management
 * - Leaderboards and competitive features
 * - Social sharing and achievements
 * - Group challenges and tournaments
 * - Gift system and social rewards
 * 
 * Designed for 2025 mobile gaming social requirements.
 */

export interface SocialPlayer {
  id: string;
  displayName: string;
  username: string;
  avatar: PlayerAvatar;
  
  // Public stats
  level: number;
  totalScore: number;
  highestCombo: number;
  achievementsUnlocked: number;
  
  // Social presence
  lastSeen: number;
  isOnline: boolean;
  currentlyPlaying: boolean;
  
  // Social metrics
  friendsCount: number;
  gamesPlayed: number;
  averageAccuracy: number;
  
  // Privacy settings
  isProfilePublic: boolean;
  allowFriendRequests: boolean;
  showOnlineStatus: boolean;
}

export interface PlayerAvatar {
  peteSkin: string;           // Pete customization ID
  backgroundColor: string;    // Profile background color
  frame: string;             // Profile frame/border
  badge: string;             // Achievement badge display
  emoji: string;             // Personal emoji identifier
}

// Friend System
export interface FriendshipStatus {
  status: 'none' | 'pending_sent' | 'pending_received' | 'friends' | 'blocked';
  since?: number;            // Timestamp when friendship established
  requestSentAt?: number;    // When friend request was sent
}

export interface FriendRequest {
  id: string;
  fromPlayer: SocialPlayer;
  toPlayerId: string;
  message?: string;
  sentAt: number;
  expiresAt: number;
}

export interface Friend {
  player: SocialPlayer;
  friendship: FriendshipStatus;
  mutualFriends: number;
  
  // Recent activity  
  recentAchievements: any[]; // Will be properly typed when Achievement types are imported
  recentHighScores: any[];   // Will be properly typed when GameSession types are imported
  
  // Interaction history
  gamesPlayedTogether: number;
  giftsExchanged: number;
  lastInteraction: number;
}

// Leaderboards
export interface LeaderboardEntry {
  rank: number;
  player: SocialPlayer;
  score: number;
  additionalData?: Record<string, any>; // Category-specific data
  
  // Change tracking
  previousRank?: number;
  rankChange: 'up' | 'down' | 'same' | 'new';
  
  // Time tracking
  achievedAt: number;
  updatedAt: number;
}

export interface Leaderboard {
  id: string;
  type: LeaderboardType;
  category: LeaderboardCategory;
  timeframe: LeaderboardTimeframe;
  
  // Display info
  title: string;
  description: string;
  icon: string;
  
  // Data
  entries: LeaderboardEntry[];
  totalParticipants: number;
  
  // Player's position
  playerEntry?: LeaderboardEntry;
  playerRank?: number;
  
  // Metadata
  lastUpdated: number;
  nextUpdateAt: number;
  
  // Rewards
  rewards: LeaderboardReward[];
}

export type LeaderboardType = 'global' | 'friends' | 'local' | 'guild';

export type LeaderboardCategory = 
  | 'high_score'           // All-time high score
  | 'weekly_score'         // Best score this week
  | 'accuracy'             // Best accuracy percentage
  | 'combo'                // Highest combo achieved
  | 'levels_completed'     // Most levels completed
  | 'speed_run'            // Fastest level completion
  | 'consistency'          // Most consistent performance
  | 'achievements'         // Most achievements unlocked
  | 'social_activity'      // Most social interactions
  | 'challenge_wins';      // Most challenge victories

export type LeaderboardTimeframe = 'all_time' | 'monthly' | 'weekly' | 'daily';

export interface LeaderboardReward {
  rankRange: { min: number; max: number };
  rewardType: 'coins' | 'xp' | 'customization' | 'title' | 'badge';
  amount: number;
  itemId?: string;
}

// Social Sharing
export interface ShareableContent {
  type: ShareContentType;
  data: any;
  
  // Display properties
  title: string;
  description: string;
  imageUrl?: string;
  deepLink: string;
  
  // Tracking
  shareId: string;
  sharedBy: string;
  sharedAt: number;
  platform?: SocialPlatform;
  
  // Metrics
  views: number;
  clicks: number;
  installs: number;
}

export type ShareContentType = 
  | 'achievement_unlock'    // Achievement celebration
  | 'high_score'           // New high score
  | 'level_complete'       // Level completion with stars
  | 'combo_streak'         // Amazing combo achievement
  | 'friend_challenge'     // Challenge a friend
  | 'tournament_win'       // Tournament victory
  | 'custom_creation'      // Custom content creation
  | 'app_recommendation';  // General app sharing

export type SocialPlatform = 'facebook' | 'twitter' | 'instagram' | 'tiktok' | 'discord' | 'whatsapp' | 'messages' | 'clipboard';

// Gift System
export interface Gift {
  id: string;
  type: GiftType;
  
  // Participants
  fromPlayer: SocialPlayer;
  toPlayerId: string;
  
  // Content
  itemType: 'coins' | 'lives' | 'boosters' | 'customization';
  itemId?: string;
  amount: number;
  
  // Metadata
  message?: string;
  occasion?: GiftOccasion;
  
  // Status
  status: GiftStatus;
  sentAt: number;
  expiresAt: number;
  claimedAt?: number;
  
  // Restrictions
  isReciprocal: boolean;      // Can recipient send back?
  maxClaims: number;          // For broadcast gifts
  currentClaims: number;
}

export type GiftType = 'direct' | 'broadcast' | 'request_response' | 'achievement_reward';

export type GiftOccasion = 'birthday' | 'achievement' | 'level_up' | 'daily' | 'holiday' | 'apology' | 'celebration';

export type GiftStatus = 'pending' | 'claimed' | 'expired' | 'rejected';

// Social Challenges
export interface SocialChallenge {
  id: string;
  type: ChallengeType;
  
  // Participants
  createdBy: SocialPlayer;
  participants: ChallengeParticipant[];
  maxParticipants: number;
  
  // Challenge definition
  objective: ChallengeObjective;
  difficulty: ChallengeDifficulty;
  rewards: ChallengeReward[];
  
  // Timing
  startTime: number;
  endTime: number;
  duration: number;          // in milliseconds
  
  // Status
  status: ChallengeStatus;
  
  // Results
  leaderboard: ChallengeEntry[];
  winner?: string;           // Player ID
  
  // Social features
  comments: ChallengeComment[];
  spectators: string[];      // Player IDs watching
  
  // Metadata
  shareCount: number;
  viewCount: number;
}

export type ChallengeType = 'direct' | 'group' | 'open' | 'tournament';

export interface ChallengeParticipant {
  playerId: string;
  joinedAt: number;
  status: 'invited' | 'joined' | 'declined' | 'completed' | 'abandoned';
  invitedBy?: string;
}

export interface ChallengeObjective {
  type: ChallengeObjectiveType;
  target: number;
  levelId?: number;          // For level-specific challenges
  timeLimit?: number;        // Additional time constraint
  restrictions?: ChallengeRestriction[];
}

export type ChallengeObjectiveType = 
  | 'high_score'             // Achieve highest score
  | 'speed_run'              // Complete level fastest
  | 'accuracy'               // Achieve best accuracy
  | 'combo'                  // Achieve highest combo
  | 'survival'               // Survive longest
  | 'collection'             // Collect most items
  | 'precision'              // Perfect execution challenge
  | 'endurance';             // Complete most levels

export interface ChallengeRestriction {
  type: 'no_boosters' | 'specific_pete' | 'time_limit' | 'lives_limit';
  value?: any;
}

export type ChallengeDifficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'legendary';

export type ChallengeStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';

export interface ChallengeEntry {
  playerId: string;
  player: SocialPlayer;
  score: number;
  completedAt: number;
  rank: number;
  
  // Additional metrics
  accuracy?: number;
  combo?: number;
  timeToComplete?: number;
  
  // Verification
  isVerified: boolean;
  replayData?: string;       // For verification
}

export interface ChallengeReward {
  rank: number;              // 1 = winner, 2 = second, etc. 0 = participation
  rewardType: 'coins' | 'xp' | 'customization' | 'title' | 'trophy';
  amount: number;
  itemId?: string;
}

export interface ChallengeComment {
  id: string;
  playerId: string;
  player: SocialPlayer;
  content: string;
  timestamp: number;
  
  // Reactions
  reactions: ChallengeReaction[];
  replyToId?: string;        // For threaded comments
}

export interface ChallengeReaction {
  playerId: string;
  type: 'like' | 'love' | 'wow' | 'fire' | 'trophy';
  timestamp: number;
}

// Social Groups/Guilds
export interface SocialGroup {
  id: string;
  name: string;
  description: string;
  
  // Visual
  icon: string;
  color: string;
  banner?: string;
  
  // Members
  members: GroupMember[];
  maxMembers: number;
  
  // Settings
  isPublic: boolean;
  requiresApproval: boolean;
  minLevel: number;
  
  // Activity
  totalScore: number;
  weeklyActivity: number;
  achievements: GroupAchievement[];
  
  // Social features
  currentChallenges: SocialChallenge[];
  recentActivity: GroupActivity[];
  
  // Metadata
  createdAt: number;
  createdBy: string;
  lastActivity: number;
}

export interface GroupMember {
  playerId: string;
  player: SocialPlayer;
  role: GroupRole;
  joinedAt: number;
  
  // Contributions
  weeklyScore: number;
  totalContribution: number;
  challengesWon: number;
  
  // Status
  isActive: boolean;
  lastSeen: number;
}

export type GroupRole = 'member' | 'officer' | 'leader' | 'founder';

export interface GroupAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: number;
  contributors: string[];    // Player IDs who contributed
}

export interface GroupActivity {
  id: string;
  type: GroupActivityType;
  playerId: string;
  player: SocialPlayer;
  timestamp: number;
  data: any;                 // Type-specific data
}

export type GroupActivityType = 
  | 'member_joined' | 'member_left' | 'member_promoted' | 'member_demoted'
  | 'challenge_created' | 'challenge_completed' | 'achievement_unlocked'
  | 'high_score' | 'level_completed' | 'gift_sent';

// Social Analytics
export interface SocialAnalytics {
  // Player social metrics
  friendRequestsSent: number;
  friendRequestsReceived: number;
  friendsGained: number;
  friendsLost: number;
  
  // Engagement metrics
  sharesSent: number;
  sharesReceived: number;
  challengesCreated: number;
  challengesJoined: number;
  challengesWon: number;
  
  // Gift metrics
  giftsSent: number;
  giftsReceived: number;
  giftsClaimed: number;
  
  // Social influence
  invitesSuccessful: number;
  viralCoefficient: number;   // New users per existing user
  socialRetention: number;    // Retention rate for social users
  
  // Time-based data
  timeframe: 'daily' | 'weekly' | 'monthly' | 'all_time';
  periodStart: number;
  periodEnd: number;
}

// Social Store and Manager Interfaces
export interface SocialManager {
  // Friend management
  sendFriendRequest: (playerId: string, message?: string) => Promise<boolean>;
  acceptFriendRequest: (requestId: string) => Promise<boolean>;
  declineFriendRequest: (requestId: string) => Promise<boolean>;
  removeFriend: (playerId: string) => Promise<boolean>;
  blockPlayer: (playerId: string) => Promise<boolean>;
  
  // Friend queries
  getFriends: () => Promise<Friend[]>;
  getFriendRequests: () => Promise<FriendRequest[]>;
  searchPlayers: (query: string) => Promise<SocialPlayer[]>;
  
  // Leaderboards
  getLeaderboard: (category: LeaderboardCategory, type: LeaderboardType, timeframe: LeaderboardTimeframe) => Promise<Leaderboard>;
  getPlayerRank: (category: LeaderboardCategory) => Promise<number>;
  
  // Sharing
  shareContent: (content: ShareableContent, platform: SocialPlatform) => Promise<boolean>;
  trackShareMetrics: (shareId: string, event: 'view' | 'click' | 'install') => void;
  
  // Gifts
  sendGift: (gift: Omit<Gift, 'id' | 'sentAt' | 'status'>) => Promise<string>;
  claimGift: (giftId: string) => Promise<boolean>;
  getReceivedGifts: () => Promise<Gift[]>;
  
  // Challenges
  createChallenge: (challenge: Omit<SocialChallenge, 'id' | 'createdAt'>) => Promise<string>;
  joinChallenge: (challengeId: string) => Promise<boolean>;
  getChallenges: (filter?: ChallengeFilter) => Promise<SocialChallenge[]>;
  
  // Groups
  createGroup: (group: Omit<SocialGroup, 'id' | 'createdAt' | 'members'>) => Promise<string>;
  joinGroup: (groupId: string) => Promise<boolean>;
  leaveGroup: (groupId: string) => Promise<boolean>;
  getGroups: () => Promise<SocialGroup[]>;
  
  // Analytics
  getSocialAnalytics: (timeframe: 'daily' | 'weekly' | 'monthly') => Promise<SocialAnalytics>;
  trackSocialEvent: (event: SocialEvent) => void;
}

export interface ChallengeFilter {
  type?: ChallengeType;
  status?: ChallengeStatus;
  difficulty?: ChallengeDifficulty;
  involving?: string;        // Player ID
  createdBy?: string;        // Player ID
}

export interface SocialEvent {
  type: SocialEventType;
  playerId: string;
  targetId?: string;         // For interactions with other players
  data?: Record<string, any>;
  timestamp: number;
}

export type SocialEventType = 
  | 'friend_request_sent' | 'friend_request_received' | 'friend_added' | 'friend_removed'
  | 'content_shared' | 'challenge_created' | 'challenge_joined' | 'challenge_completed'
  | 'gift_sent' | 'gift_received' | 'group_joined' | 'group_left'
  | 'leaderboard_rank_up' | 'achievement_shared';

// Predefined constants
export const SOCIAL_CONSTANTS = {
  // Friend system
  MAX_FRIENDS: 500,
  MAX_FRIEND_REQUESTS_PENDING: 50,
  FRIEND_REQUEST_EXPIRY_DAYS: 30,
  
  // Challenges
  MAX_ACTIVE_CHALLENGES: 10,
  MAX_CHALLENGE_PARTICIPANTS: 100,
  MIN_CHALLENGE_DURATION: 60000,      // 1 minute
  MAX_CHALLENGE_DURATION: 604800000,  // 1 week
  
  // Gifts
  MAX_PENDING_GIFTS: 100,
  GIFT_EXPIRY_DAYS: 7,
  MAX_DAILY_GIFTS_SENT: 50,
  
  // Groups
  MAX_GROUP_MEMBERS: 50,
  MAX_GROUPS_PER_PLAYER: 5,
  
  // Leaderboards
  LEADERBOARD_UPDATE_INTERVAL: 300000, // 5 minutes
  MAX_LEADERBOARD_ENTRIES: 1000,
  
  // Sharing
  SHARE_COOLDOWN_MINUTES: 5,
  MAX_DAILY_SHARES: 20,
} as const;

export default SocialPlayer;