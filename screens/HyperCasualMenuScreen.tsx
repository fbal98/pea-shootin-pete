import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UI_COLORS } from '@/constants/HyperCasualColors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface HyperCasualMenuScreenProps {
  onStartGame: () => void;
  highScore?: number;
}

export const HyperCasualMenuScreen: React.FC<HyperCasualMenuScreenProps> = ({ 
  onStartGame, 
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
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Pulse animation for tap prompt
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
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

    createFloatAnimation(floatAnim1, 8000, 0);
    createFloatAnimation(floatAnim2, 10000, 2000);
    createFloatAnimation(floatAnim3, 12000, 4000);
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
          {renderFloatingElement(floatAnim1, 80, SCREEN_HEIGHT, 0.08)}
          {renderFloatingElement(floatAnim2, 120, SCREEN_HEIGHT + 200, 0.06)}
          {renderFloatingElement(floatAnim3, 60, SCREEN_HEIGHT + 400, 0.1)}
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
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
                <Text style={styles.tapText}>TAP TO PLAY</Text>
              </View>
            </Animated.View>
          </TouchableOpacity>
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
});