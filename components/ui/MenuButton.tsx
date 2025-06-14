import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/DesignTokens';
import { UI_PALETTE } from '@/constants/GameColors';

interface MenuButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  children: string;
  primary?: boolean;
  onPress?: () => void;
  delay?: number;
}

export const MenuButton: React.FC<MenuButtonProps> = ({
  icon,
  children,
  primary = false,
  onPress,
  delay = 0,
}) => {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation with staggered delay
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Continuous glow animation for primary button
    if (primary) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [slideAnim, opacityAnim, glowAnim, delay, primary]);

  const handlePress = () => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Press animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onPress?.();
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      {primary && (
        <Animated.View
          style={[
            styles.glowEffect,
            {
              opacity: glowOpacity,
            },
          ]}
        />
      )}

      <TouchableOpacity
        style={[styles.button, primary ? styles.primaryButton : styles.secondaryButton]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Ionicons
          name={icon}
          size={24}
          color={primary ? UI_PALETTE.text_dark : UI_PALETTE.accent}
          style={styles.icon}
        />
        <Text style={[styles.text, primary ? styles.primaryText : styles.secondaryText]}>
          {children}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.small,
    width: 280,
  },
  glowEffect: {
    position: 'absolute',
    top: -Spacing.micro,
    left: -Spacing.micro,
    right: -Spacing.micro,
    bottom: -Spacing.micro,
    backgroundColor: UI_PALETTE.accent,
    borderRadius: BorderRadius.xlarge + Spacing.micro,
    zIndex: 0,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.large,
    borderRadius: BorderRadius.xlarge,
    borderWidth: 2,
    ...Shadows.medium,
    zIndex: 1,
  },
  primaryButton: {
    backgroundColor: UI_PALETTE.accent,
    borderColor: UI_PALETTE.accent_shadow,
    shadowColor: UI_PALETTE.accent,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: UI_PALETTE.accent,
    shadowColor: UI_PALETTE.shadow,
  },
  icon: {
    marginRight: Spacing.medium,
  },
  text: {
    ...Typography.buttonLarge,
    letterSpacing: 1,
  },
  primaryText: {
    color: UI_PALETTE.text_dark,
  },
  secondaryText: {
    color: UI_PALETTE.accent,
  },
});
