import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, Text, Dimensions } from 'react-native';
import { CRTFrame } from '@/components/ui/CRTFrame';
import { ArcadeButton } from '@/components/arcade/ArcadeButton';
import { ArcadeText } from '@/components/arcade/ArcadeText';
import { ArcadeColors } from '@/constants/ArcadeColors';
import { Starfield } from '@/components/game/Starfield';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface EnhancedMenuScreenProps {
  onStartGame: () => void;
}

export const EnhancedMenuScreen: React.FC<EnhancedMenuScreenProps> = ({ onStartGame }) => {
  const titleAnimation = useRef(new Animated.Value(0)).current;
  const insertCoinBlink = useRef(new Animated.Value(1)).current;
  const peaFloat1 = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const peaFloat2 = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const peaFloat3 = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const highScoreGlow = useRef(new Animated.Value(0.8)).current;
  const [showAttractMode, setShowAttractMode] = useState(false);

  useEffect(() => {
    // Title entrance animation
    Animated.timing(titleAnimation, {
      toValue: 1,
      duration: 1500,
      easing: Easing.elastic(1),
      useNativeDriver: true,
    }).start();

    // Insert coin blinking
    Animated.loop(
      Animated.sequence([
        Animated.timing(insertCoinBlink, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(insertCoinBlink, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating pea animations
    const createFloatAnimation = (animValue: Animated.ValueXY, delay: number) => {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(animValue.x, {
              toValue: 30,
              duration: 3000,
              delay,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(animValue.x, {
              toValue: -30,
              duration: 3000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(animValue.y, {
              toValue: -20,
              duration: 2000,
              delay,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(animValue.y, {
              toValue: 20,
              duration: 2000,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    };

    createFloatAnimation(peaFloat1, 0);
    createFloatAnimation(peaFloat2, 1000);
    createFloatAnimation(peaFloat3, 2000);

    // High score glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(highScoreGlow, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(highScoreGlow, {
          toValue: 0.6,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Attract mode timer
    const timer = setTimeout(() => setShowAttractMode(true), 30000);
    return () => clearTimeout(timer);
  }, []);

  const titleScale = titleAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  const titleOpacity = titleAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.8, 1],
  });

  const renderFloatingPea = (position: Animated.ValueXY, size: number, color: string) => (
    <Animated.View
      style={[
        styles.floatingPea,
        {
          width: size,
          height: size,
          backgroundColor: color,
          transform: [
            { translateX: position.x },
            { translateY: position.y },
          ],
        },
      ]}
    />
  );

  return (
    <CRTFrame showScanlines={true} intensity={0.8}>
      <View style={styles.container}>
        {/* Animated starfield background */}
        <Starfield isPlaying={true} />

        {/* Gradient overlay for depth */}
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.gradientOverlay}
          pointerEvents="none"
        />

        {/* Floating peas background */}
        <View style={styles.floatingPeasContainer} pointerEvents="none">
          {renderFloatingPea(peaFloat1, 12, ArcadeColors.limeGreen)}
          {renderFloatingPea(peaFloat2, 10, ArcadeColors.limeGreen)}
          {renderFloatingPea(peaFloat3, 14, ArcadeColors.limeGreen)}
        </View>

        <View style={styles.content}>
          {/* Animated Title */}
          <Animated.View
            style={[
              styles.titleContainer,
              {
                transform: [{ scale: titleScale }],
                opacity: titleOpacity,
              },
            ]}
          >
            <View style={styles.titleRow}>
              <Text style={styles.titleEmoji}>⚡</Text>
              <ArcadeText size="title" color="pink" glow>
                PEA
              </ArcadeText>
              <Text style={styles.titleEmoji}>⚡</Text>
            </View>
            <ArcadeText size="xlarge" color="blue" glow style={styles.titleMiddle}>
              SHOOTIN'
            </ArcadeText>
            <View style={styles.titleRow}>
              <Text style={styles.titleEmoji}>★</Text>
              <ArcadeText size="title" color="green" glow>
                PETE
              </ArcadeText>
              <Text style={styles.titleEmoji}>★</Text>
            </View>
          </Animated.View>

          {/* High Score Display */}
          <Animated.View
            style={[
              styles.highScoreContainer,
              {
                opacity: highScoreGlow,
              },
            ]}
          >
            <Text style={styles.highScoreLabel}>HIGH SCORE</Text>
            <Text style={styles.highScoreValue}>042,000</Text>
          </Animated.View>

          {/* Insert Coin Button */}
          <Animated.View
            style={[
              styles.insertCoinContainer,
              {
                opacity: insertCoinBlink,
              },
            ]}
          >
            <ArcadeButton
              text="▶ INSERT COIN TO PLAY"
              onPress={onStartGame}
              variant="primary"
              size="large"
              style={styles.insertCoinButton}
            />
          </Animated.View>

          {/* Menu Options */}
          <View style={styles.menuOptions}>
            <ArcadeButton
              text="HOW TO PLAY"
              onPress={() => console.log('How to Play')}
              variant="secondary"
              size="medium"
              style={styles.menuButton}
            />
            <ArcadeButton
              text="LEADERBOARD"
              onPress={() => console.log('Leaderboard')}
              variant="secondary"
              size="medium"
              style={styles.menuButton}
            />
          </View>

          {/* Arcade Credits Display */}
          <View style={styles.creditsContainer}>
            <View style={styles.creditItem}>
              <Text style={styles.creditLabel}>CREDITS</Text>
              <Text style={styles.creditValue}>1</Text>
            </View>
            <View style={styles.creditDivider} />
            <View style={styles.creditItem}>
              <Text style={styles.creditLabel}>PLAYERS</Text>
              <Text style={styles.creditValue}>1</Text>
            </View>
          </View>

          {/* Retro arcade text */}
          <ArcadeText size="small" color="yellow" glow style={styles.copyrightText}>
            © 2025 ARCADE REMASTER
          </ArcadeText>
          <Text style={styles.versionText}>v1.0.0</Text>
        </View>

        {/* Attract mode overlay */}
        {showAttractMode && (
          <View style={styles.attractModeOverlay}>
            <Text style={styles.attractModeText}>PRESS ANY BUTTON TO START</Text>
          </View>
        )}
      </View>
    </CRTFrame>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ArcadeColors.deepBlack,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingPeasContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingPea: {
    position: 'absolute',
    borderRadius: 50,
    top: '50%',
    left: '50%',
    opacity: 0.6,
    shadowColor: ArcadeColors.limeGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleEmoji: {
    fontSize: 32,
    marginHorizontal: 10,
  },
  titleMiddle: {
    marginVertical: -5,
  },
  highScoreContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: ArcadeColors.yellow,
    marginBottom: 40,
  },
  highScoreLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: ArcadeColors.yellow,
    letterSpacing: 2,
    textAlign: 'center',
    fontFamily: 'monospace',
    marginBottom: 5,
  },
  highScoreValue: {
    fontSize: 28,
    fontWeight: '900',
    color: ArcadeColors.yellow,
    letterSpacing: 3,
    textAlign: 'center',
    fontFamily: 'monospace',
    textShadowColor: ArcadeColors.yellowGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  insertCoinContainer: {
    marginBottom: 30,
  },
  insertCoinButton: {
    borderWidth: 3,
    shadowColor: ArcadeColors.pinkGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 15,
  },
  menuOptions: {
    alignItems: 'center',
    marginBottom: 40,
  },
  menuButton: {
    marginVertical: 8,
  },
  creditsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 30,
  },
  creditItem: {
    alignItems: 'center',
  },
  creditLabel: {
    fontSize: 10,
    color: ArcadeColors.electricBlue,
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
  creditValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: ArcadeColors.electricBlue,
    fontFamily: 'monospace',
    textShadowColor: ArcadeColors.blueGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  creditDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 20,
  },
  copyrightText: {
    marginTop: 20,
  },
  versionText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.3)',
    fontFamily: 'monospace',
    marginTop: 5,
  },
  attractModeOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  attractModeText: {
    fontSize: 16,
    color: ArcadeColors.electricBlue,
    fontWeight: 'bold',
    letterSpacing: 2,
    fontFamily: 'monospace',
    textShadowColor: ArcadeColors.blueGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});