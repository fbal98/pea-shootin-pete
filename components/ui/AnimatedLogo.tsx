import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Animated } from 'react-native';

interface AnimatedPeteProps {
  size: number;
}

const AnimatedPete: React.FC<AnimatedPeteProps> = ({ size }) => {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const eyeBlinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Bounce animation
    const bounce = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    // Eye blink animation
    const blink = Animated.loop(
      Animated.sequence([
        Animated.delay(3000),
        Animated.timing(eyeBlinkAnim, {
          toValue: 0.1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(eyeBlinkAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ])
    );

    bounce.start();
    blink.start();

    return () => {
      bounce.stop();
      blink.stop();
    };
  }, [bounceAnim, eyeBlinkAnim]);

  const eyeSize = size * 0.2;
  const eyeOffset = size * 0.25 - eyeSize / 2;

  return (
    <Animated.View
      style={[
        styles.pete,
        {
          width: size,
          height: size,
          transform: [{ translateY: bounceAnim }],
        },
      ]}
    >
      {/* Eyes with blink animation */}
      <Animated.View
        style={[
          styles.eye,
          {
            left: eyeOffset,
            width: eyeSize,
            height: eyeSize,
            borderRadius: eyeSize / 2,
            opacity: eyeBlinkAnim,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.eye,
          {
            right: eyeOffset,
            width: eyeSize,
            height: eyeSize,
            borderRadius: eyeSize / 2,
            opacity: eyeBlinkAnim,
          },
        ]}
      />

      {/* Mouth */}
      <View style={styles.mouth} />

      {/* Antenna */}
      <View style={[styles.antennaStick, { height: size * 0.375 }]} />
      <View style={[styles.antennaTop, { top: -(size * 0.5) }]} />
    </Animated.View>
  );
};

interface AnimatedLogoProps {
  children?: React.ReactNode;
}

export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ children }) => {
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Logo entrance animation
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(titleSlide, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [logoScale, logoOpacity, titleSlide]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <AnimatedPete size={80} />
      </Animated.View>
      
      <Animated.View
        style={[
          styles.titleContainer,
          {
            transform: [{ translateY: titleSlide }],
          },
        ]}
      >
        <Text style={styles.title}>PEA SHOOTIN' PETE</Text>
        <Text style={styles.subtitle}>Retro Arcade Adventure</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoContainer: {
    marginBottom: 20,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  pete: {
    backgroundColor: '#FFD700',
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFA500',
    overflow: 'visible',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  eye: {
    position: 'absolute',
    backgroundColor: '#000',
    top: '30%',
  },
  mouth: {
    position: 'absolute',
    width: '50%',
    height: 4,
    backgroundColor: '#000',
    borderRadius: 2,
    bottom: '25%',
    left: '25%',
  },
  antennaStick: {
    position: 'absolute',
    width: 3,
    backgroundColor: '#333',
    top: -12,
    left: '50%',
    marginLeft: -1.5,
  },
  antennaTop: {
    position: 'absolute',
    width: 10,
    height: 10,
    backgroundColor: '#FF0000',
    borderRadius: 5,
    left: '50%',
    marginLeft: -5,
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 5,
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    textShadowColor: '#FFA500',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#00FFFF',
    textAlign: 'center',
    fontWeight: '600',
    textShadowColor: '#008B8B',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 1,
  },
});