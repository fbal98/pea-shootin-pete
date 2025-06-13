import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Share,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { HyperCasualColors } from '../../constants/HyperCasualColors';
import { useSocialStore } from '../../store/socialStore';
import { trackSocialShare } from '../../utils/analytics';

const { width: screenWidth } = Dimensions.get('window');

interface SocialSharingModalProps {
  visible: boolean;
  onClose: () => void;
  shareData: {
    type: 'achievement' | 'score' | 'challenge' | 'level_complete';
    title: string;
    description: string;
    score?: number;
    level?: number;
    achievement?: string;
    imageUrl?: string;
  };
}

interface SocialPlatform {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  shareUrl: (text: string, url: string) => string;
}

const socialPlatforms: SocialPlatform[] = [
  {
    id: 'twitter',
    name: 'Twitter',
    icon: 'logo-twitter',
    color: '#1DA1F2',
    shareUrl: (text, url) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: 'logo-facebook',
    color: '#4267B2',
    shareUrl: (text, url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: 'logo-instagram',
    color: '#E4405F',
    shareUrl: (text, url) => `https://www.instagram.com/`, // Instagram requires app integration
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: 'musical-notes',
    color: '#000000',
    shareUrl: (text, url) => `https://www.tiktok.com/`, // TikTok requires app integration
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: 'logo-discord',
    color: '#5865F2',
    shareUrl: (text, url) => `https://discord.com/`, // Discord requires app integration
  },
];

export const SocialSharingModal: React.FC<SocialSharingModalProps> = ({
  visible,
  onClose,
  shareData,
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const { incrementShareCount, addRecentShare } = useSocialStore();

  const generateShareText = (): string => {
    const { type, title, description, score, level, achievement } = shareData;
    
    switch (type) {
      case 'achievement':
        return `🏆 Just unlocked "${achievement}" in Pea Shootin' Pete! ${description} #PeaShootinPete #Achievement`;
      case 'score':
        return `🎯 Just scored ${score} points in Pea Shootin' Pete! ${description} Can you beat my score? #PeaShootinPete #HighScore`;
      case 'challenge':
        return `⚡ Completed the daily challenge in Pea Shootin' Pete! ${description} Join me and show your skills! #PeaShootinPete #Challenge`;
      case 'level_complete':
        return `🎮 Just completed Level ${level} in Pea Shootin' Pete! ${description} The balloon popping action is addictive! #PeaShootinPete #Gaming`;
      default:
        return `🎯 Playing Pea Shootin' Pete - the most addictive balloon popping game! ${description} #PeaShootinPete`;
    }
  };

  const generateShareUrl = (): string => {
    // Generate deep link URL for viral referrals
    const baseUrl = 'https://peashootinpete.com'; // Replace with actual app store URL
    const referralCode = useSocialStore.getState().playerProfile?.playerId || 'unknown';
    return `${baseUrl}?ref=${referralCode}&type=${shareData.type}`;
  };

  const handleNativeShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    
    try {
      const shareText = generateShareText();
      const shareUrl = generateShareUrl();
      const fullText = `${shareText}\n\n${shareUrl}`;
      
      const result = await Share.share({
        message: Platform.OS === 'ios' ? shareText : fullText,
        url: Platform.OS === 'ios' ? shareUrl : undefined,
        title: shareData.title,
      });

      if (result.action === Share.sharedAction) {
        handleShareSuccess('native');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const handlePlatformShare = async (platform: SocialPlatform) => {
    if (isSharing) return;
    setIsSharing(true);
    
    try {
      const shareText = generateShareText();
      const shareUrl = generateShareUrl();
      const platformUrl = platform.shareUrl(shareText, shareUrl);
      
      if (platform.id === 'instagram' || platform.id === 'tiktok' || platform.id === 'discord') {
        // These platforms require special handling or app integration
        Alert.alert(
          `Share on ${platform.name}`,
          `Copy the following text and share it on ${platform.name}:\n\n${shareText}\n\n${shareUrl}`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Copy & Open App', onPress: () => handleSpecialPlatformShare(platform, shareText, shareUrl) },
          ]
        );
      } else {
        await WebBrowser.openBrowserAsync(platformUrl);
        handleShareSuccess(platform.id);
      }
    } catch (error) {
      console.error(`Error sharing to ${platform.name}:`, error);
      Alert.alert('Error', `Failed to share to ${platform.name}. Please try again.`);
    } finally {
      setIsSharing(false);
    }
  };

  const handleSpecialPlatformShare = async (platform: SocialPlatform, text: string, url: string) => {
    try {
      // Copy to clipboard
      const fullText = `${text}\n\n${url}`;
      await Share.share({ message: fullText });
      
      // Open platform URL (will open app if installed)
      const platformUrls = {
        instagram: 'instagram://app',
        tiktok: 'tiktok://app',
        discord: 'discord://app',
      };
      
      const platformUrl = platformUrls[platform.id as keyof typeof platformUrls];
      if (platformUrl) {
        await WebBrowser.openBrowserAsync(platformUrl);
      }
      
      handleShareSuccess(platform.id);
    } catch (error) {
      console.error(`Error with special platform share for ${platform.name}:`, error);
    }
  };

  const handleShareSuccess = (platform: string) => {
    // Track analytics
    trackSocialShare({
      platform,
      contentType: shareData.type,
      level: shareData.level,
      score: shareData.score,
      achievement: shareData.achievement,
    });

    // Update store
    incrementShareCount();
    addRecentShare({
      platform,
      contentType: shareData.type,
      timestamp: Date.now(),
    });

    // Check for share rewards
    const shareCount = useSocialStore.getState().shareCount;
    if (shareCount % 5 === 0) {
      // Award share milestone reward
      Alert.alert(
        '🎉 Share Milestone!',
        `You've shared ${shareCount} times! Here's a bonus reward.`,
        [{ text: 'Claim Reward', onPress: onClose }]
      );
    } else {
      onClose();
    }
  };

  const currentTheme = HyperCasualColors.getTheme(1); // You can pass actual level here

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: currentTheme.background }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: currentTheme.text }]}>
              Share Your Achievement
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={currentTheme.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={[styles.shareText, { color: currentTheme.textSecondary }]}>
              {generateShareText()}
            </Text>

            <View style={styles.platformsContainer}>
              <TouchableOpacity
                style={[styles.nativeShareButton, { backgroundColor: currentTheme.primary }]}
                onPress={handleNativeShare}
                disabled={isSharing}
              >
                <Ionicons name="share-outline" size={24} color="white" />
                <Text style={styles.nativeShareText}>Share</Text>
              </TouchableOpacity>

              <View style={styles.platformsGrid}>
                {socialPlatforms.map((platform) => (
                  <TouchableOpacity
                    key={platform.id}
                    style={[styles.platformButton, { backgroundColor: platform.color }]}
                    onPress={() => handlePlatformShare(platform)}
                    disabled={isSharing}
                  >
                    <Ionicons name={platform.icon} size={24} color="white" />
                    <Text style={styles.platformText}>{platform.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  shareText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  platformsContainer: {
    gap: 20,
  },
  nativeShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  nativeShareText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  platformsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  platformButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    minWidth: (screenWidth - 80) / 3,
    gap: 4,
  },
  platformText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
});