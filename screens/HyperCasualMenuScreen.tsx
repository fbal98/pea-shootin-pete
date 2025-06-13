import { ANIMATION_CONFIG } from '@/constants/GameConfig';
import { UI_COLORS } from '@/constants/HyperCasualColors';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface HyperCasualMenuScreenProps {
  onStartGame: () => void;
  onSettings: () => void;
  onAbout: () => void;
  onWorldMap?: () => void;
  highScore?: number;
}

export const HyperCasualMenuScreen: React.FC<HyperCasualMenuScreenProps> = ({ 
  onStartGame,
  onSettings,
  onAbout,
  onWorldMap,
  highScore = 0 
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const floatAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: ANIMATION_CONFIG.MENU.FADE_IN_DURATION,
      useNativeDriver: true,
    }).start();

    // Pulse animation for tap prompt
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: ANIMATION_CONFIG.MENU.PULSE_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: ANIMATION_CONFIG.MENU.PULSE_DURATION,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating background elements
    const createFloatAnimation = (anim: Animated.Value, duration: number, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    createFloatAnimation(floatAnim1, ANIMATION_CONFIG.MENU.FLOATING_ELEMENTS.DURATIONS[0], ANIMATION_CONFIG.MENU.FLOATING_ELEMENTS.DELAYS[0]);
    createFloatAnimation(floatAnim2, ANIMATION_CONFIG.MENU.FLOATING_ELEMENTS.DURATIONS[1], ANIMATION_CONFIG.MENU.FLOATING_ELEMENTS.DELAYS[1]);
    createFloatAnimation(floatAnim3, ANIMATION_CONFIG.MENU.FLOATING_ELEMENTS.DURATIONS[2], ANIMATION_CONFIG.MENU.FLOATING_ELEMENTS.DELAYS[2]);
  }, []);

  const renderFloatingElement = (
    anim: Animated.Value, 
    size: number, 
    startY: number, 
    opacity: number = 0.1
  ) => {
    const translateY = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [startY, startY - SCREEN_HEIGHT - size],
    });

    return (
      <Animated.View
        style={[
          styles.floatingElement,
          {
            width: size,
            height: size,
            opacity,
            transform: [{ translateY }],
          },
        ]}
      />
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F7FFF7', '#E0F2F1']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradient}
      >
        {/* Floating geometric background elements */}
        <View style={styles.backgroundElements}>
          {renderFloatingElement(floatAnim1, ANIMATION_CONFIG.MENU.FLOATING_ELEMENTS.SIZES[0], SCREEN_HEIGHT, ANIMATION_CONFIG.MENU.FLOATING_ELEMENTS.OPACITIES[0])}
          {renderFloatingElement(floatAnim2, ANIMATION_CONFIG.MENU.FLOATING_ELEMENTS.SIZES[1], SCREEN_HEIGHT + 200, ANIMATION_CONFIG.MENU.FLOATING_ELEMENTS.OPACITIES[1])}
          {renderFloatingElement(floatAnim3, ANIMATION_CONFIG.MENU.FLOATING_ELEMENTS.SIZES[2], SCREEN_HEIGHT + 400, ANIMATION_CONFIG.MENU.FLOATING_ELEMENTS.OPACITIES[2])}
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Top navigation buttons */}
          <View style={styles.topNavigation}>
            <TouchableOpacity 
              style={styles.navButton} 
              onPress={onSettings}
              activeOpacity={0.6}
            >
              <Text style={styles.navButtonText}>settings</Text>
            </TouchableOpacity>
            <View style={styles.navSpacer} />
            <TouchableOpacity 
              style={styles.navButton} 
              onPress={onAbout}
              activeOpacity={0.6}
            >
              <Text style={styles.navButtonText}>about</Text>
            </TouchableOpacity>
          </View>

          {/* Minimal title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>pea shootin'</Text>
            <Text style={styles.titleEmphasis}>pete</Text>
          </View>

          {/* High score - only show if > 0 */}
          {highScore > 0 && (
            <View style={styles.highScoreContainer}>
              <Text style={styles.highScoreText}>best {highScore}</Text>
            </View>
          )}

          {/* Tap to play prompt */}
          <TouchableOpacity 
            style={styles.tapContainer} 
            onPress={onStartGame}
            activeOpacity={0.8}
          >
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <View style={styles.tapButton}>
                <Text style={styles.tapText}>PLAY</Text>
              </View>
            </Animated.View>
          </TouchableOpacity>

          {/* Secondary navigation buttons */}
          <View style={styles.secondaryNavigation}>
            {onWorldMap && (
              <TouchableOpacity 
                style={styles.secondaryButton} 
                onPress={onWorldMap}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>🗺️ WORLD MAP</Text>
              </TouchableOpacity>
            )}
            
            <View style={styles.secondaryButtonRow}>
              <TouchableOpacity 
                style={[styles.secondaryButton, styles.smallButton]} 
                onPress={() => {/* TODO: Add customization navigation */}}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>🎨 CUSTOMIZE</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.secondaryButton, styles.smallButton]} 
                onPress={() => {/* TODO: Add social navigation */}}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>👥 SOCIAL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  backgroundElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingElement: {
    position: 'absolute',
    backgroundColor: '#4ECDC4',
    borderRadius: 12,
    left: Math.random() * (SCREEN_WIDTH - 120),
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  topNavigation: {
    position: 'absolute',
    top: 60,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '300',
    color: UI_COLORS.menuTextLight,
  },
  navSpacer: {
    flex: 1,
  },
  titleContainer: {
    marginBottom: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    color: UI_COLORS.menuText,
    marginBottom: -5,
  },
  titleEmphasis: {
    fontSize: 48,
    fontWeight: '600',
    color: UI_COLORS.menuText,
    letterSpacing: -1,
  },
  highScoreContainer: {
    marginBottom: 40,
  },
  highScoreText: {
    fontSize: 18,
    fontWeight: '400',
    color: UI_COLORS.menuTextLight,
  },
  tapContainer: {
    paddingVertical: 40,
    paddingHorizontal: 60,
  },
  tapButton: {
    backgroundColor: UI_COLORS.tapToPlayBg,
    paddingVertical: 20,
    paddingHorizontal: 50,
    borderRadius: 30,
  },
  tapText: {
    fontSize: 16,
    fontWeight: '500',
    color: UI_COLORS.menuText,
    letterSpacing: 2,
  },
  secondaryNavigation: {
    alignItems: 'center',
    marginTop: 20,
    gap: 12,
  },
  secondaryButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: UI_COLORS.menuTextLight,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  smallButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: '400',
    color: UI_COLORS.menuTextLight,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});