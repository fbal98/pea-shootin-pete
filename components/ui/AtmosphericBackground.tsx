import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';
import Svg, { Path, Circle, Polygon, LinearGradient, Defs, Stop } from 'react-native-svg';
import { ParticleSystem } from './ParticleSystem';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface AtmosphericBackgroundProps {
  theme: 'beach' | 'space' | 'city' | 'forest' | 'arctic' | 'volcano' | 'desert' | 'underwater';
  intensity?: number; // 0-1 for performance scaling
}

export const AtmosphericBackground: React.FC<AtmosphericBackgroundProps> = ({ 
  theme, 
  intensity = 1 
}) => {
  const waveAnimation = useRef(new Animated.Value(0)).current;
  const twinkleAnimation = useRef(new Animated.Value(0)).current;
  const floatAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Continuous wave animation for beach
    if (theme === 'beach') {
      Animated.loop(
        Animated.timing(waveAnimation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ).start();
    }

    // Twinkling animation for space
    if (theme === 'space') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(twinkleAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(twinkleAnimation, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    // Floating animation for forest/underwater
    if (theme === 'forest' || theme === 'underwater') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnimation, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnimation, {
            toValue: 0,
            duration: 4000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [theme]);

  const renderBeachBackground = () => (
    <>
      {/* Animated Waves */}
      <Svg width={screenWidth} height={screenHeight} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="rgba(135, 206, 235, 0.3)" />
            <Stop offset="100%" stopColor="rgba(135, 206, 235, 0.1)" />
          </LinearGradient>
        </Defs>
        <Animated.View style={{ 
          transform: [{ 
            translateY: waveAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -20],
            })
          }]
        }}>
          <Path
            d={`M0,${screenHeight * 0.8} Q${screenWidth * 0.25},${screenHeight * 0.75} ${screenWidth * 0.5},${screenHeight * 0.8} T${screenWidth},${screenHeight * 0.8} L${screenWidth},${screenHeight} L0,${screenHeight} Z`}
            fill="url(#waveGradient)"
          />
        </Animated.View>
      </Svg>
      
      {/* Floating Bubbles */}
      <ParticleSystem
        particleCount={Math.floor(15 * intensity)}
        colors={['rgba(135, 206, 235, 0.6)', 'rgba(173, 216, 230, 0.5)', 'rgba(255, 255, 255, 0.4)']}
        minSize={8}
        maxSize={20}
        minSpeed={20}
        maxSpeed={50}
        direction="up"
        lifetime={8000}
        emissionRate={2}
      />
      
      {/* Sand particles */}
      <ParticleSystem
        particleCount={Math.floor(8 * intensity)}
        colors={['rgba(255, 218, 185, 0.3)', 'rgba(244, 164, 96, 0.2)']}
        minSize={2}
        maxSize={6}
        minSpeed={10}
        maxSpeed={30}
        direction="random"
        lifetime={12000}
        emissionRate={1}
      />
    </>
  );

  const renderSpaceBackground = () => (
    <>
      {/* Twinkling Stars */}
      <View style={{ position: 'absolute', width: '100%', height: '100%' }}>
        {[...Array(Math.floor(30 * intensity))].map((_, i) => (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: Math.random() * screenWidth,
              top: Math.random() * screenHeight,
              width: 3,
              height: 3,
              backgroundColor: '#FFFFFF',
              borderRadius: 1.5,
              opacity: twinkleAnimation.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.2, 1, 0.2],
              }),
            }}
          />
        ))}
      </View>
      
      {/* Nebula Particles */}
      <ParticleSystem
        particleCount={Math.floor(20 * intensity)}
        colors={['rgba(108, 92, 231, 0.3)', 'rgba(162, 155, 254, 0.2)', 'rgba(116, 185, 255, 0.2)']}
        minSize={15}
        maxSize={40}
        minSpeed={5}
        maxSpeed={15}
        direction="random"
        lifetime={15000}
        emissionRate={1.5}
      />
      
      {/* Asteroid particles */}
      <ParticleSystem
        particleCount={Math.floor(5 * intensity)}
        colors={['rgba(128, 128, 128, 0.4)', 'rgba(169, 169, 169, 0.3)']}
        minSize={5}
        maxSize={12}
        minSpeed={30}
        maxSpeed={60}
        direction="left"
        lifetime={10000}
        emissionRate={0.5}
      />
    </>
  );

  const renderForestBackground = () => (
    <>
      {/* Floating Pollen */}
      <ParticleSystem
        particleCount={Math.floor(25 * intensity)}
        colors={['rgba(255, 255, 0, 0.4)', 'rgba(255, 215, 0, 0.3)', 'rgba(255, 250, 205, 0.2)']}
        minSize={3}
        maxSize={8}
        minSpeed={8}
        maxSpeed={20}
        direction="random"
        lifetime={20000}
        emissionRate={1.5}
      />
      
      {/* Fireflies */}
      <View style={{ position: 'absolute', width: '100%', height: '100%' }}>
        {[...Array(Math.floor(8 * intensity))].map((_, i) => (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: Math.random() * screenWidth,
              top: Math.random() * screenHeight,
              width: 6,
              height: 6,
              backgroundColor: '#90EE90',
              borderRadius: 3,
              shadowColor: '#90EE90',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 8,
              transform: [{
                translateY: floatAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -30],
                }),
              }],
              opacity: floatAnimation.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.3, 1, 0.3],
              }),
            }}
          />
        ))}
      </View>
      
      {/* Falling leaves */}
      <ParticleSystem
        particleCount={Math.floor(12 * intensity)}
        colors={['rgba(34, 139, 34, 0.6)', 'rgba(154, 205, 50, 0.5)', 'rgba(107, 142, 35, 0.4)']}
        minSize={8}
        maxSize={15}
        minSpeed={15}
        maxSpeed={35}
        direction="down"
        lifetime={12000}
        emissionRate={1}
      />
    </>
  );

  const renderCityBackground = () => (
    <>
      {/* Neon glow particles */}
      <ParticleSystem
        particleCount={Math.floor(20 * intensity)}
        colors={['rgba(255, 0, 255, 0.3)', 'rgba(0, 255, 255, 0.3)', 'rgba(255, 255, 0, 0.2)']}
        minSize={4}
        maxSize={12}
        minSpeed={20}
        maxSpeed={40}
        direction="up"
        lifetime={8000}
        emissionRate={2.5}
      />
      
      {/* Traffic light effects */}
      <View style={{ position: 'absolute', width: '100%', height: '100%' }}>
        {[...Array(Math.floor(6 * intensity))].map((_, i) => (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: Math.random() * screenWidth,
              top: Math.random() * screenHeight,
              width: 8,
              height: 8,
              backgroundColor: ['#FF0000', '#FFFF00', '#00FF00'][Math.floor(Math.random() * 3)],
              borderRadius: 4,
              opacity: twinkleAnimation,
            }}
          />
        ))}
      </View>
      
      {/* Smog particles */}
      <ParticleSystem
        particleCount={Math.floor(15 * intensity)}
        colors={['rgba(128, 128, 128, 0.2)', 'rgba(105, 105, 105, 0.15)']}
        minSize={20}
        maxSize={50}
        minSpeed={5}
        maxSpeed={15}
        direction="random"
        lifetime={25000}
        emissionRate={0.8}
      />
    </>
  );

  const renderArcticBackground = () => (
    <>
      {/* Falling Snow */}
      <ParticleSystem
        particleCount={Math.floor(40 * intensity)}
        colors={['rgba(255, 255, 255, 0.8)', 'rgba(240, 248, 255, 0.6)', 'rgba(230, 230, 250, 0.5)']}
        minSize={2}
        maxSize={6}
        minSpeed={20}
        maxSpeed={50}
        direction="down"
        lifetime={10000}
        emissionRate={4}
      />
      
      {/* Ice crystals */}
      <ParticleSystem
        particleCount={Math.floor(10 * intensity)}
        colors={['rgba(173, 216, 230, 0.6)', 'rgba(175, 238, 238, 0.5)']}
        minSize={6}
        maxSize={14}
        minSpeed={10}
        maxSpeed={25}
        direction="random"
        lifetime={15000}
        emissionRate={1}
      />
      
      {/* Aurora effect simulation */}
      <View style={{ position: 'absolute', width: '100%', height: '100%' }}>
        {[...Array(Math.floor(3 * intensity))].map((_, i) => (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: i * (screenWidth / 3),
              top: Math.random() * screenHeight * 0.3,
              width: screenWidth / 3,
              height: 100,
              backgroundColor: ['rgba(0, 255, 0, 0.1)', 'rgba(0, 0, 255, 0.1)', 'rgba(255, 0, 255, 0.1)'][i],
              opacity: floatAnimation.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.1, 0.3, 0.1],
              }),
            }}
          />
        ))}
      </View>
    </>
  );

  const renderVolcanoBackground = () => (
    <>
      {/* Lava bubbles */}
      <ParticleSystem
        particleCount={Math.floor(18 * intensity)}
        colors={['rgba(255, 69, 0, 0.7)', 'rgba(255, 140, 0, 0.6)', 'rgba(255, 165, 0, 0.5)']}
        minSize={8}
        maxSize={25}
        minSpeed={15}
        maxSpeed={40}
        direction="up"
        lifetime={6000}
        emissionRate={3}
      />
      
      {/* Ash particles */}
      <ParticleSystem
        particleCount={Math.floor(25 * intensity)}
        colors={['rgba(64, 64, 64, 0.4)', 'rgba(128, 128, 128, 0.3)', 'rgba(105, 105, 105, 0.2)']}
        minSize={3}
        maxSize={8}
        minSpeed={10}
        maxSpeed={30}
        direction="up"
        lifetime={12000}
        emissionRate={2}
      />
      
      {/* Ember glow */}
      <ParticleSystem
        particleCount={Math.floor(12 * intensity)}
        colors={['rgba(255, 215, 0, 0.6)', 'rgba(255, 69, 0, 0.5)']}
        minSize={4}
        maxSize={10}
        minSpeed={5}
        maxSpeed={20}
        direction="random"
        lifetime={8000}
        emissionRate={1.5}
      />
    </>
  );

  const renderDesertBackground = () => (
    <>
      {/* Sand storm */}
      <ParticleSystem
        particleCount={Math.floor(30 * intensity)}
        colors={['rgba(255, 218, 185, 0.4)', 'rgba(244, 164, 96, 0.3)', 'rgba(210, 180, 140, 0.2)']}
        minSize={3}
        maxSize={12}
        minSpeed={40}
        maxSpeed={80}
        direction="left"
        lifetime={8000}
        emissionRate={4}
      />
      
      {/* Heat shimmer effect */}
      <View style={{ position: 'absolute', width: '100%', height: '100%' }}>
        {[...Array(Math.floor(5 * intensity))].map((_, i) => (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: Math.random() * screenWidth,
              top: screenHeight * 0.6 + Math.random() * screenHeight * 0.4,
              width: 50,
              height: 100,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              transform: [{
                scaleY: floatAnimation.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 1.2, 1],
                }),
              }],
              opacity: floatAnimation.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.1, 0.3, 0.1],
              }),
            }}
          />
        ))}
      </View>
      
      {/* Dust devils */}
      <ParticleSystem
        particleCount={Math.floor(8 * intensity)}
        colors={['rgba(160, 82, 45, 0.3)', 'rgba(139, 69, 19, 0.2)']}
        minSize={15}
        maxSize={35}
        minSpeed={25}
        maxSpeed={50}
        direction="random"
        lifetime={10000}
        emissionRate={1}
      />
    </>
  );

  const renderUnderwaterBackground = () => (
    <>
      {/* Bubble streams */}
      <ParticleSystem
        particleCount={Math.floor(25 * intensity)}
        colors={['rgba(173, 216, 230, 0.6)', 'rgba(135, 206, 235, 0.5)', 'rgba(255, 255, 255, 0.4)']}
        minSize={6}
        maxSize={20}
        minSpeed={20}
        maxSpeed={50}
        direction="up"
        lifetime={8000}
        emissionRate={3}
      />
      
      {/* Bioluminescent particles */}
      <View style={{ position: 'absolute', width: '100%', height: '100%' }}>
        {[...Array(Math.floor(15 * intensity))].map((_, i) => (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: Math.random() * screenWidth,
              top: Math.random() * screenHeight,
              width: 4,
              height: 4,
              backgroundColor: '#00FFFF',
              borderRadius: 2,
              shadowColor: '#00FFFF',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 6,
              transform: [{
                translateX: floatAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, Math.random() * 20 - 10],
                }),
              }],
              opacity: floatAnimation.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.2, 1, 0.2],
              }),
            }}
          />
        ))}
      </View>
      
      {/* Kelp sway simulation */}
      <ParticleSystem
        particleCount={Math.floor(10 * intensity)}
        colors={['rgba(46, 125, 50, 0.4)', 'rgba(76, 175, 80, 0.3)']}
        minSize={3}
        maxSize={8}
        minSpeed={5}
        maxSpeed={15}
        direction="random"
        lifetime={20000}
        emissionRate={0.5}
      />
    </>
  );

  const renderThemeBackground = () => {
    switch (theme) {
      case 'beach': return renderBeachBackground();
      case 'space': return renderSpaceBackground();
      case 'forest': return renderForestBackground();
      case 'city': return renderCityBackground();
      case 'arctic': return renderArcticBackground();
      case 'volcano': return renderVolcanoBackground();
      case 'desert': return renderDesertBackground();
      case 'underwater': return renderUnderwaterBackground();
      default: return null;
    }
  };

  return (
    <View style={{ position: 'absolute', width: '100%', height: '100%' }} pointerEvents="none">
      {renderThemeBackground()}
    </View>
  );
};