import { FloatingPeasBackground } from '@/components/ui/FloatingPeasBackground'; // Import new background
import { UI_PALETTE } from '@/constants/GameColors'; // Import new palette
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View, Easing } from 'react-native';
import { isFeatureEnabled } from '@/constants/FeatureFlagConfig';

interface MenuScreenProps {
  onStartGame: () => void;
  onSettings: () => void;
  onAbout: () => void;
  onWorldMap?: () => void;
  highScore?: number;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({
  onStartGame,
  onSettings,
  onAbout,
  onWorldMap,
  highScore = 0,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const playButtonScale = useRef(new Animated.Value(1)).current;
  const titleSlideAnim = useRef(new Animated.Value(-100)).current;
  const buttonsSlideAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    // Entrance animation
    Animated.stagger(150, [
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(titleSlideAnim, {
        toValue: 0,
        tension: 30,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.spring(buttonsSlideAnim, {
        toValue: 0,
        tension: 40,
        friction: 6,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, titleSlideAnim, buttonsSlideAnim]);

  const handlePlayButtonPressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.spring(playButtonScale, {
      toValue: 0.95,
      tension: 500,
      friction: 15,
      useNativeDriver: true,
    }).start();
  };

  const handlePlayButtonPressOut = () => {
    Animated.spring(playButtonScale, {
      toValue: 1,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handlePlayButtonPress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.sequence([
      Animated.timing(playButtonScale, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(playButtonScale, {
        toValue: 1,
        duration: 300,
        easing: Easing.bounce,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(onStartGame, 100);
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[UI_PALETTE.background_light, UI_PALETTE.background_dark]}
        style={styles.gradient}
      />
      <FloatingPeasBackground />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Top Navigation */}
        <View style={styles.topNavigation}>
          {isFeatureEnabled('core.basicUI') && (
            <TouchableOpacity style={styles.iconButton} onPress={onSettings}>
              <Ionicons name="settings-outline" size={28} color={UI_PALETTE.text_dark} />
            </TouchableOpacity>
          )}
          {isFeatureEnabled('core.basicUI') && (
            <TouchableOpacity style={styles.iconButton} onPress={onAbout}>
              <Ionicons name="information-circle-outline" size={28} color={UI_PALETTE.text_dark} />
            </TouchableOpacity>
          )}
        </View>

        {/* Game Title */}
        <Animated.View style={[styles.titleContainer, { transform: [{ translateY: titleSlideAnim }] }]}>
          <Text style={styles.titleShadow}>Pea Shootin&apos;</Text>
          <Text style={styles.title}>Pea Shootin&apos;</Text>
          <Text style={styles.subtitleShadow}>Pete</Text>
          <Text style={styles.subtitle}>Pete</Text>
        </Animated.View>

        {/* Play Button */}
        <Animated.View style={{ transform: [{ translateY: buttonsSlideAnim }] }}>
          <TouchableWithoutFeedback
            onPress={handlePlayButtonPress}
            onPressIn={handlePlayButtonPressIn}
            onPressOut={handlePlayButtonPressOut}
          >
            <Animated.View style={[styles.playButtonContainer, { transform: [{ scale: playButtonScale }] }]}>
              <View style={styles.playButtonShadow} />
              <View style={styles.playButton}>
                <Ionicons name="play" size={60} color={UI_PALETTE.text_light} style={styles.playIcon} />
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>

        {/* High Score & Bottom Nav */}
        <Animated.View style={[styles.bottomContainer, { transform: [{ translateY: buttonsSlideAnim }] }]}>
          {isFeatureEnabled('metaProgression.playerStats') && highScore > 0 && (
            <View style={styles.highScoreContainer}>
              <Ionicons name="trophy" size={20} color={UI_PALETTE.accent} />
              <Text style={styles.highScoreText}>HIGH SCORE: {highScore.toLocaleString()}</Text>
            </View>
          )}

          <View style={styles.bottomNav}>
            {isFeatureEnabled('metaProgression.levelMastery') && (
              <TouchableOpacity style={styles.bottomNavButton} onPress={onWorldMap}>
                <Ionicons name="map-outline" size={24} color={UI_PALETTE.text_dark} />
                <Text style={styles.bottomNavText}>MAP</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.bottomNavButton}>
              <Ionicons name="shirt-outline" size={24} color={UI_PALETTE.text_dark} />
              <Text style={styles.bottomNavText}>SKINS</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bottomNavButton}>
              <Ionicons name="people-outline" size={24} color={UI_PALETTE.text_dark} />
              <Text style={styles.bottomNavText}>FRIENDS</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 64, // 8 * 8
    paddingBottom: 48, // 8 * 6
  },
  topNavigation: {
    position: 'absolute',
    top: 56, // 8 * 7
    left: 24, // 8 * 3
    right: 24, // 8 * 3
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 56, // > 48dp
    height: 56, // > 48dp
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: UI_PALETTE.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 120, // Give space from top nav
  },
  title: {
    fontSize: 64,
    fontWeight: 'bold',
    color: UI_PALETTE.text_light,
    position: 'absolute',
    textShadowColor: UI_PALETTE.primary_shadow,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
  titleShadow: {
    fontSize: 64,
    fontWeight: 'bold',
    color: UI_PALETTE.primary_shadow,
    transform: [{ translateX: 4 }, { translateY: 4 }],
  },
  subtitle: {
    fontSize: 96,
    fontWeight: 'bold',
    color: UI_PALETTE.text_light,
    position: 'absolute',
    top: 50,
    textShadowColor: UI_PALETTE.primary_shadow,
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 0,
  },
  subtitleShadow: {
    fontSize: 96,
    fontWeight: 'bold',
    color: UI_PALETTE.primary_shadow,
    top: 50,
    transform: [{ translateX: 6 }, { translateY: 6 }],
  },
  playButtonContainer: {
    marginTop: 80, // Space from title
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: UI_PALETTE.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    borderColor: UI_PALETTE.text_light,
  },
  playButtonShadow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: UI_PALETTE.primary_shadow,
    transform: [{ translateY: 12 }],
  },
  playIcon: {
    marginLeft: 16, // Optical alignment for play icon
  },
  bottomContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  highScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  highScoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: UI_PALETTE.text_dark,
    marginLeft: 8,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    width: '100%',
    maxWidth: 350,
    paddingVertical: 8,
    borderRadius: 32, // Pill shape
    height: 64, // > 48dp
  },
  bottomNavButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNavText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: UI_PALETTE.text_dark,
    marginTop: 4,
  },
});
