import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArcadeColors } from '@/constants/ArcadeColors';
import { LinearGradient } from 'expo-linear-gradient';

interface EnhancedGameHUDProps {
  score: number;
  level: number;
  lives: number;
  combo: number;
  specialCharge: number;
  scoreInLevel: number;
  nextLevelScore: number;
  isInDanger?: boolean;
}

export const EnhancedGameHUD: React.FC<EnhancedGameHUDProps> = ({
  score,
  level,
  lives,
  combo,
  specialCharge,
  scoreInLevel,
  nextLevelScore,
  isInDanger = false,
}) => {
  const insets = useSafeAreaInsets();
  const dangerPulse = useRef(new Animated.Value(0)).current;
  const comboScale = useRef(new Animated.Value(1)).current;
  const scoreFlip = useRef(new Animated.Value(0)).current;
  const heartBeat = useRef(new Animated.Value(1)).current;

  // Danger pulse animation
  useEffect(() => {
    if (isInDanger) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dangerPulse, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(dangerPulse, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      dangerPulse.setValue(0);
    }
  }, [isInDanger, dangerPulse]);

  // Combo animation
  useEffect(() => {
    if (combo > 1) {
      Animated.sequence([
        Animated.spring(comboScale, {
          toValue: 1.3,
          tension: 200,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.spring(comboScale, {
          toValue: 1,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [combo, comboScale]);

  // Low lives heartbeat
  useEffect(() => {
    if (lives === 1) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(heartBeat, {
            toValue: 1.2,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(heartBeat, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      heartBeat.setValue(1);
    }
  }, [lives, heartBeat]);

  const levelProgress = (scoreInLevel / nextLevelScore) * 100;
  const specialProgress = specialCharge;

  const dangerOpacity = dangerPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.3],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* CRT Bezel Effect */}
      <LinearGradient
        colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.8)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.bezelGradient}
      />

      {/* Danger Overlay */}
      <Animated.View
        style={[
          styles.dangerOverlay,
          {
            opacity: dangerOpacity,
          },
        ]}
      />

      {/* Main HUD Content */}
      <View style={styles.hudContent}>
        {/* Left Section - Score & Combo */}
        <View style={styles.leftSection}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.scoreValue}>{score.toString().padStart(6, '0')}</Text>
          {combo > 1 && (
            <Animated.View
              style={[
                styles.comboContainer,
                {
                  transform: [{ scale: comboScale }],
                },
              ]}
            >
              <Text style={styles.comboText}>×{combo} COMBO</Text>
            </Animated.View>
          )}
        </View>

        {/* Center Section - Level Progress */}
        <View style={styles.centerSection}>
          <Text style={styles.levelText}>LEVEL {level.toString().padStart(2, '0')}</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${levelProgress}%`,
                  },
                ]}
              />
              {levelProgress > 80 && (
                <View
                  style={[
                    styles.progressGlow,
                    {
                      width: `${levelProgress}%`,
                    },
                  ]}
                />
              )}
            </View>
            <Text style={styles.progressText}>NEXT: {nextLevelScore}</Text>
          </View>
        </View>

        {/* Right Section - Lives & Special */}
        <View style={styles.rightSection}>
          <View style={styles.livesContainer}>
            <Text style={styles.livesLabel}>LIVES</Text>
            <View style={styles.heartsRow}>
              {[0, 1, 2].map((i) => (
                <Animated.Text
                  key={i}
                  style={[
                    styles.heart,
                    i < lives ? styles.heartActive : styles.heartInactive,
                    lives === 1 && i === 0 && {
                      transform: [{ scale: heartBeat }],
                    },
                  ]}
                >
                  ♥
                </Animated.Text>
              ))}
            </View>
          </View>

          <View style={styles.specialContainer}>
            <Text style={styles.specialLabel}>SPECIAL</Text>
            <View style={styles.specialMeterContainer}>
              <View style={styles.specialMeterTrack}>
                <View
                  style={[
                    styles.specialMeterFill,
                    {
                      height: `${specialProgress}%`,
                    },
                  ]}
                />
                {specialProgress >= 100 && (
                  <Animated.View style={styles.specialReadyGlow} />
                )}
              </View>
              {specialProgress >= 100 && (
                <Text style={styles.specialReadyText}>READY!</Text>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Scanline Effect */}
      <View style={styles.scanlineOverlay} pointerEvents="none" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  bezelGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.6,
  },
  dangerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: ArcadeColors.hotPink,
    borderWidth: 3,
    borderColor: ArcadeColors.hotPink,
  },
  hudContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderBottomWidth: 3,
    borderBottomColor: ArcadeColors.electricBlue,
    ...Platform.select({
      ios: {
        shadowColor: ArcadeColors.blueGlow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.8,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: ArcadeColors.electricBlue,
    letterSpacing: 2,
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '900',
    color: ArcadeColors.yellow,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 3,
    textShadowColor: ArcadeColors.yellowGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  comboContainer: {
    marginTop: 4,
    backgroundColor: 'rgba(255, 0, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ArcadeColors.hotPink,
  },
  comboText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: ArcadeColors.hotPink,
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textShadowColor: ArcadeColors.pinkGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  levelText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: ArcadeColors.electricBlue,
    letterSpacing: 2,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textShadowColor: ArcadeColors.blueGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.3)',
  },
  progressFill: {
    position: 'absolute',
    height: '100%',
    backgroundColor: ArcadeColors.electricBlue,
    borderRadius: 3,
  },
  progressGlow: {
    position: 'absolute',
    height: '100%',
    backgroundColor: ArcadeColors.electricBlue,
    ...Platform.select({
      ios: {
        shadowColor: ArcadeColors.blueGlow,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
      },
    }),
  },
  progressText: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  livesContainer: {
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  livesLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: ArcadeColors.hotPink,
    letterSpacing: 2,
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  heartsRow: {
    flexDirection: 'row',
  },
  heart: {
    fontSize: 16,
    marginLeft: 2,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  heartActive: {
    color: '#FF0044',
    textShadowColor: 'rgba(255, 0, 68, 0.8)',
  },
  heartInactive: {
    color: 'rgba(255, 0, 68, 0.2)',
    textShadowColor: 'transparent',
  },
  specialContainer: {
    alignItems: 'flex-end',
  },
  specialLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: ArcadeColors.limeGreen,
    letterSpacing: 2,
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  specialMeterContainer: {
    alignItems: 'center',
  },
  specialMeterTrack: {
    width: 24,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.3)',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  specialMeterFill: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: ArcadeColors.limeGreen,
    borderRadius: 10,
  },
  specialReadyGlow: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: ArcadeColors.limeGreen,
    opacity: 0.6,
    ...Platform.select({
      ios: {
        shadowColor: ArcadeColors.greenGlow,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 15,
      },
    }),
  },
  specialReadyText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: ArcadeColors.limeGreen,
    marginTop: 2,
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textShadowColor: ArcadeColors.greenGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  scanlineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.02,
    backgroundColor: 'transparent',
    // Add scanline pattern via background image or gradient
  },
});