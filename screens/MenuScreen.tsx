import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, Dimensions } from 'react-native';
import { ArcadeContainer } from '@/components/arcade/ArcadeContainer';
import { ArcadeButton } from '@/components/arcade/ArcadeButton';
import { ArcadeText } from '@/components/arcade/ArcadeText';
import { ArcadeColors } from '@/constants/ArcadeColors';
import { Starfield } from '@/components/game/Starfield';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MenuScreenProps {
  onStartGame: () => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({ onStartGame }) => {
  const titleScale = useRef(new Animated.Value(0.8)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;


  useEffect(() => {
    // Animate title entrance
    Animated.parallel([
      Animated.timing(titleScale, {
        toValue: 1,
        duration: 1000,
        easing: Easing.elastic(1),
        useNativeDriver: true,
      }),
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate buttons entrance
    Animated.timing(buttonsOpacity, {
      toValue: 1,
      duration: 600,
      delay: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleHowToPlay = () => {
    // Placeholder for How to Play screen
    console.log('How to Play pressed');
  };

  const handleSettings = () => {
    // Placeholder for Settings screen
    console.log('Settings pressed');
  };

  return (
    <View style={styles.container}>
      {/* Animated starfield background */}
      <Starfield isPlaying={true} />
      <ArcadeContainer showBorder={false}>
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
            <ArcadeText size="title" color="pink" glow>
              PEA
            </ArcadeText>
            <ArcadeText size="xlarge" color="blue" glow>
              SHOOTIN'
            </ArcadeText>
            <ArcadeText size="title" color="green" glow>
              PETE
            </ArcadeText>
          </Animated.View>

          {/* Menu Buttons */}
          <Animated.View style={[styles.buttonsContainer, { opacity: buttonsOpacity }]}>
            <ArcadeButton text="PLAY" onPress={onStartGame} variant="primary" size="large" />
            <ArcadeButton
              text="HOW TO PLAY"
              onPress={handleHowToPlay}
              variant="secondary"
              size="medium"
            />
            <ArcadeButton
              text="SETTINGS"
              onPress={handleSettings}
              variant="secondary"
              size="medium"
            />
          </Animated.View>

          {/* Retro arcade text */}
          <Animated.View style={{ opacity: buttonsOpacity }}>
            <ArcadeText size="small" color="yellow" glow style={styles.arcadeText}>
              © 2025 ARCADE REMASTER
            </ArcadeText>
          </Animated.View>
        </View>
      </ArcadeContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ArcadeColors.deepBlack,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  buttonsContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  arcadeText: {
    marginTop: 20,
  },
});
