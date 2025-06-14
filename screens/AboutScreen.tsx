import { UI_PALETTE } from '@/constants/GameColors';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AboutScreenProps {
  onBack: () => void;
}

export const AboutScreen: React.FC<AboutScreenProps> = ({ onBack }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Subtle pulse animation for version text
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating background elements - very subtle
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

    createFloatAnimation(floatAnim1, 14000, 0);
    createFloatAnimation(floatAnim2, 16000, 5000);
  }, [fadeAnim, floatAnim1, floatAnim2, pulseAnim ]);

  const renderFloatingElement = (
    anim: Animated.Value,
    size: number,
    startY: number,
    opacity: number = 0.04
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
        {/* Very subtle floating background elements */}
        <View style={styles.backgroundElements}>
          {renderFloatingElement(floatAnim1, 100, SCREEN_HEIGHT, 0.03)}
          {renderFloatingElement(floatAnim2, 80, SCREEN_HEIGHT + 400, 0.04)}
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Header with back button */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>about</Text>
            <View style={styles.spacer} />
          </View>

          {/* Minimal about content */}
          <View style={styles.aboutContainer}>
            {/* Game title */}
            <View style={styles.gameTitle}>
              <Text style={styles.gameTitleText}>pea shootin&apos; pete</Text>
            </View>

            {/* Simple description */}
            <View style={styles.description}>
              <Text style={styles.descriptionText}>
                tap to shoot peas{'\n'}
                swipe to move pete{'\n'}
                pop all the balloons
              </Text>
            </View>

            {/* Version info */}
            <Animated.View style={[styles.versionContainer, { transform: [{ scale: pulseAnim }] }]}>
              <Text style={styles.versionText}>v1.0</Text>
            </Animated.View>
          </View>

          {/* Minimal footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>simple. fun. addictive.</Text>
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
    backgroundColor: UI_PALETTE.accent,
    borderRadius: 20,
    left: Math.random() * (SCREEN_WIDTH - 120),
  },
  content: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 28,
    color: UI_PALETTE.menuText,
    fontWeight: '300',
  },
  title: {
    flex: 1,
    fontSize: 28,
    fontWeight: '300',
    color: UI_PALETTE.menuText,
    textAlign: 'center',
    marginLeft: -40, // Compensate for back button
  },
  spacer: {
    width: 40,
  },
  aboutContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  gameTitle: {
    marginBottom: 60,
  },
  gameTitleText: {
    fontSize: 36,
    fontWeight: '300',
    color: UI_PALETTE.primary,
    textAlign: 'center',
  },
  description: {
    marginBottom: 80,
    alignItems: 'center',
  },
  descriptionText: {
    fontSize: 18,
    fontWeight: '300',
    color: UI_PALETTE.menuText,
    textAlign: 'center',
    lineHeight: 28,
  },
  versionContainer: {
    backgroundColor: UI_PALETTE.versionBg,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
  },
  versionText: {
    fontSize: 14,
    fontWeight: '400',
    color: UI_PALETTE.menuTextLight,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '300',
    color: UI_PALETTE.menuTextLight,
    fontStyle: 'italic',
  },
});
