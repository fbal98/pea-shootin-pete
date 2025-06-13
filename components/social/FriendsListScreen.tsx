/**
 * Friends List Screen - Core social interface for friend management
 * 
 * Features:
 * - Friends list with online status and recent activity
 * - Friend request management (sent/received)
 * - Player search and friend discovery
 * - Quick actions (message, challenge, gift)
 * - Social statistics and insights
 * 
 * Designed for maximum engagement and easy friend interaction.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// Social system imports
import {
  useFriends,
  useFriendRequests,
  useSuggestedFriends,
  useSocialActions,
  useCurrentPlayer,
  useSocialConnectionStatus
} from '@/store/socialStore';
import { socialManager } from '@/systems/SocialManager';
import { SocialPlayer, Friend, FriendRequest } from '@/types/SocialTypes';

// UI constants
import { getColorScheme } from '@/constants/HyperCasualColors';

interface FriendsListScreenProps {
  onBack: () => void;
  onPlayerProfile: (playerId: string) => void;
  onChallengeFriend: (friendId: string) => void;
}

type FriendsTab = 'friends' | 'requests' | 'discover';

export const FriendsListScreen: React.FC<FriendsListScreenProps> = ({
  onBack,
  onPlayerProfile,
  onChallengeFriend
}) => {
  const insets = useSafeAreaInsets();
  const colorScheme = getColorScheme(1); // Use primary color scheme
  
  // State management
  const friends = useFriends();
  const friendRequests = useFriendRequests();
  const suggestedFriends = useSuggestedFriends();
  const currentPlayer = useCurrentPlayer();
  const connectionStatus = useSocialConnectionStatus();
  const socialActions = useSocialActions();
  
  // Local state
  const [activeTab, setActiveTab] = useState<FriendsTab>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SocialPlayer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize and refresh data
  useEffect(() => {
    refreshSocialData();
  }, []);

  const refreshSocialData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await socialActions.refreshSocialData();
      await socialManager.getFriends();
      await socialManager.getFriendRequests();
    } catch (error) {
      console.error('Failed to refresh social data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [socialActions]);

  // Search functionality
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const results = await socialManager.searchPlayers(query.trim());
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Friend actions
  const handleSendFriendRequest = useCallback(async (playerId: string) => {
    try {
      const success = await socialManager.sendFriendRequest(playerId);
      if (success) {
        Alert.alert('Success', 'Friend request sent!');
        // Remove from search results to avoid duplicate requests
        setSearchResults(prev => prev.filter(p => p.id !== playerId));
      } else {
        Alert.alert('Error', 'Failed to send friend request');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send friend request');
    }
  }, []);

  const handleAcceptFriendRequest = useCallback(async (requestId: string) => {
    try {
      const success = await socialManager.acceptFriendRequest(requestId);
      if (success) {
        Alert.alert('Success', 'Friend request accepted!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to accept friend request');
    }
  }, []);

  const handleDeclineFriendRequest = useCallback(async (requestId: string) => {
    try {
      const success = await socialManager.declineFriendRequest(requestId);
      if (success) {
        // No success message for decline
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to decline friend request');
    }
  }, []);

  const handleRemoveFriend = useCallback(async (friendId: string) => {
    Alert.alert(
      'Remove Friend',
      'Are you sure you want to remove this friend?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await socialManager.removeFriend(friendId);
            } catch (error) {
              Alert.alert('Error', 'Failed to remove friend');
            }
          }
        }
      ]
    );
  }, []);

  // Render helper functions
  const renderFriendItem = (friend: Friend) => (
    <TouchableOpacity
      key={friend.player.id}
      style={styles.friendItem}
      onPress={() => onPlayerProfile(friend.player.id)}
    >
      <View style={styles.friendAvatar}>
        <View style={[
          styles.avatarContainer,
          { backgroundColor: friend.player.avatar.backgroundColor }
        ]}>
          <Text style={styles.avatarEmoji}>{friend.player.avatar.emoji}</Text>
        </View>
        {friend.player.isOnline && <View style={styles.onlineIndicator} />}
      </View>
      
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{friend.player.displayName}</Text>
        <Text style={styles.friendStatus}>
          {friend.player.isOnline ? 'Online' : `Last seen ${getTimeAgo(friend.player.lastSeen)}`}
        </Text>
        <Text style={styles.friendStats}>
          Level {friend.player.level} • {friend.player.totalScore.toLocaleString()} points
        </Text>
      </View>
      
      <View style={styles.friendActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colorScheme.primary }]}
          onPress={() => onChallengeFriend(friend.player.id)}
        >
          <Text style={styles.actionButtonText}>Challenge</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => handleRemoveFriend(friend.player.id)}
        >
          <Text style={styles.menuButtonText}>⋯</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderFriendRequestItem = (request: FriendRequest, isReceived: boolean) => (
    <TouchableOpacity
      key={request.id}
      style={styles.requestItem}
      onPress={() => onPlayerProfile(request.fromPlayer.id)}
    >
      <View style={styles.friendAvatar}>
        <View style={[
          styles.avatarContainer,
          { backgroundColor: request.fromPlayer.avatar.backgroundColor }
        ]}>
          <Text style={styles.avatarEmoji}>{request.fromPlayer.avatar.emoji}</Text>
        </View>
      </View>
      
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{request.fromPlayer.displayName}</Text>
        <Text style={styles.friendStatus}>
          {isReceived ? 'Wants to be friends' : 'Request sent'}
        </Text>
        {request.message && (
          <Text style={styles.requestMessage}>"{request.message}"</Text>
        )}
      </View>
      
      {isReceived && (
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[styles.acceptButton, { backgroundColor: colorScheme.primary }]}
            onPress={() => handleAcceptFriendRequest(request.id)}
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.declineButton}
            onPress={() => handleDeclineFriendRequest(request.id)}
          >
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderSearchResultItem = (player: SocialPlayer) => {
    const isFriend = friends.some(f => f.player.id === player.id);
    const hasPendingRequest = friendRequests.sent.some(r => r.toPlayerId === player.id);
    
    return (
      <TouchableOpacity
        key={player.id}
        style={styles.searchItem}
        onPress={() => onPlayerProfile(player.id)}
      >
        <View style={styles.friendAvatar}>
          <View style={[
            styles.avatarContainer,
            { backgroundColor: player.avatar.backgroundColor }
          ]}>
            <Text style={styles.avatarEmoji}>{player.avatar.emoji}</Text>
          </View>
          {player.isOnline && <View style={styles.onlineIndicator} />}
        </View>
        
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{player.displayName}</Text>
          <Text style={styles.friendStatus}>@{player.username}</Text>
          <Text style={styles.friendStats}>
            Level {player.level} • {player.friendsCount} friends
          </Text>
        </View>
        
        <View style={styles.searchActions}>
          {isFriend ? (
            <Text style={styles.friendStatusText}>Friends</Text>
          ) : hasPendingRequest ? (
            <Text style={styles.pendingStatusText}>Pending</Text>
          ) : (
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colorScheme.primary }]}
              onPress={() => handleSendFriendRequest(player.id)}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const getTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  // Tab content rendering
  const renderTabContent = () => {
    switch (activeTab) {
      case 'friends':
        if (friends.length === 0) {
          return (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No Friends Yet</Text>
              <Text style={styles.emptyStateText}>
                Add friends to challenge them and share achievements!
              </Text>
              <TouchableOpacity
                style={[styles.emptyStateButton, { backgroundColor: colorScheme.primary }]}
                onPress={() => setActiveTab('discover')}
              >
                <Text style={styles.emptyStateButtonText}>Find Friends</Text>
              </TouchableOpacity>
            </View>
          );
        }
        
        return (
          <ScrollView
            style={styles.contentList}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={refreshSocialData} />
            }
          >
            {friends
              .sort((a, b) => {
                // Online friends first, then by last interaction
                if (a.player.isOnline && !b.player.isOnline) return -1;
                if (!a.player.isOnline && b.player.isOnline) return 1;
                return b.lastInteraction - a.lastInteraction;
              })
              .map(renderFriendItem)}
          </ScrollView>
        );
        
      case 'requests':
        const receivedRequests = friendRequests.received;
        const sentRequests = friendRequests.sent;
        
        if (receivedRequests.length === 0 && sentRequests.length === 0) {
          return (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No Friend Requests</Text>
              <Text style={styles.emptyStateText}>
                When you send or receive friend requests, they'll appear here.
              </Text>
            </View>
          );
        }
        
        return (
          <ScrollView style={styles.contentList}>
            {receivedRequests.length > 0 && (
              <>
                <Text style={styles.sectionHeader}>Received Requests</Text>
                {receivedRequests.map(request => renderFriendRequestItem(request, true))}
              </>
            )}
            
            {sentRequests.length > 0 && (
              <>
                <Text style={styles.sectionHeader}>Sent Requests</Text>
                {sentRequests.map(request => renderFriendRequestItem(request, false))}
              </>
            )}
          </ScrollView>
        );
        
      case 'discover':
        return (
          <View style={styles.discoverContent}>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search for players..."
                value={searchQuery}
                onChangeText={handleSearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {isSearching && (
                <ActivityIndicator style={styles.searchLoader} color={colorScheme.primary} />
              )}
            </View>
            
            <ScrollView style={styles.contentList}>
              {searchQuery.trim() ? (
                searchResults.length > 0 ? (
                  searchResults.map(renderSearchResultItem)
                ) : !isSearching ? (
                  <View style={styles.emptySearch}>
                    <Text style={styles.emptySearchText}>No players found</Text>
                  </View>
                ) : null
              ) : (
                <>
                  {suggestedFriends.length > 0 && (
                    <>
                      <Text style={styles.sectionHeader}>Suggested Friends</Text>
                      {suggestedFriends.map(renderSearchResultItem)}
                    </>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        );
        
      default:
        return null;
    }
  };

  return (
    <LinearGradient 
      colors={[colorScheme.primary, colorScheme.secondary]} 
      style={styles.container}
    >
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Friends</Text>
        
        <View style={styles.headerRight}>
          <View style={[
            styles.connectionStatus,
            { backgroundColor: connectionStatus === 'connected' ? '#4CAF50' : '#FF9800' }
          ]}>
            <Text style={styles.connectionStatusText}>
              {connectionStatus === 'connected' ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {[
          { key: 'friends', label: 'Friends', count: friends.length },
          { key: 'requests', label: 'Requests', count: friendRequests.received.length },
          { key: 'discover', label: 'Discover', count: 0 }
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.activeTab
            ]}
            onPress={() => setActiveTab(tab.key as FriendsTab)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab.key && styles.activeTabText
            ]}>
              {tab.label}
              {tab.count > 0 && (
                <Text style={styles.tabBadge}> ({tab.count})</Text>
              )}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Tab Content */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  backButtonText: {
    fontSize: 20,
    color: 'white',
    fontWeight: '600',
  },
  
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
  
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  
  connectionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  connectionStatusText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
  },
  
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  
  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  tabText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  
  activeTabText: {
    color: 'white',
    fontWeight: '600',
  },
  
  tabBadge: {
    fontSize: 12,
    fontWeight: '700',
  },
  
  content: {
    flex: 1,
    marginTop: 20,
  },
  
  contentList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  
  friendAvatar: {
    position: 'relative',
    marginRight: 12,
  },
  
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  avatarEmoji: {
    fontSize: 24,
  },
  
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: 'white',
  },
  
  friendInfo: {
    flex: 1,
  },
  
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  
  friendStatus: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  
  friendStats: {
    fontSize: 11,
    color: '#999',
  },
  
  friendActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  
  actionButtonText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  
  menuButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  
  menuButtonText: {
    fontSize: 16,
    color: '#666',
  },
  
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  
  requestMessage: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 2,
  },
  
  requestActions: {
    flexDirection: 'row',
  },
  
  acceptButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  
  acceptButtonText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  
  declineButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  
  declineButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  
  searchActions: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  
  addButtonText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  
  friendStatusText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  
  pendingStatusText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '600',
  },
  
  discoverContent: {
    flex: 1,
  },
  
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  
  searchInput: {
    flex: 1,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    paddingHorizontal: 20,
    fontSize: 16,
  },
  
  searchLoader: {
    marginLeft: 12,
  },
  
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
    marginTop: 8,
  },
  
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
  },
  
  emptyStateText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  
  emptyStateButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  
  emptyStateButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  
  emptySearch: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  
  emptySearchText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
});

export default FriendsListScreen;