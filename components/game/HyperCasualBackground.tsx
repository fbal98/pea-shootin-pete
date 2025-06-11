import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getColorScheme } from '@/constants/HyperCasualColors';
import { ANIMATION_CONFIG } from '@/constants/GameConfig';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface HyperCasualBackgroundProps {
  level: number;
  isPlaying: boolean;
}

export const HyperCasualBackground: React.FC<HyperCasualBackgroundProps> = ({ 
  level, 
  isPlaying 
}) => {
  const colorScheme = getColorScheme(level);
  
  // Animated values for floating geometric shapes
  const floatAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    if (!isPlaying) return;

    // Create floating animations for geometric shapes
    const animations = floatAnims.map((anim, index) => {
      const duration = ANIMATION_CONFIG.BACKGROUND.BASE_DURATION + index * ANIMATION_CONFIG.BACKGROUND.DURATION_INCREMENT;
      const delay = index * ANIMATION_CONFIG.BACKGROUND.DELAY_INCREMENT;

      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }),
        ])
      );
    });

    // Start all animations
    animations.forEach(animation => animation.start());

    // Cleanup
    return () => {
      animations.forEach(animation => animation.stop());
      floatAnims.forEach(anim => anim.setValue(0));
    };
  }, [isPlaying, level]);

  const renderFloatingShape = (index: number) => {
    const anim = floatAnims[index];
    const shapeType = index % 3; // 0: circle, 1: square, 2: triangle
    const size = ANIMATION_CONFIG.BACKGROUND.BASE_SIZE + (index * ANIMATION_CONFIG.BACKGROUND.SIZE_INCREMENT);
    const startX = (index * ANIMATION_CONFIG.BACKGROUND.HORIZONTAL_SPACING) % (SCREEN_WIDTH - size);
    
    const translateY = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [SCREEN_HEIGHT + size, -size],
    });

    const rotate = anim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    const opacity = anim.interpolate({
      inputRange: [0, 0.1, 0.9, 1],
      outputRange: [0, 0.15, 0.15, 0],
    });

    let shapeStyle;
    switch (shapeType) {
      case 0: // Circle
        shapeStyle = {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colorScheme.primary,
        };
        break;
      case 1: // Square
        shapeStyle = {
          width: size,
          height: size,
          backgroundColor: colorScheme.secondary,
        };
        break;
      case 2: // Diamond (rotated square)
        shapeStyle = {
          width: size,
          height: size,
          backgroundColor: colorScheme.particle,
          transform: [{ rotate: '45deg' }],
        };
        break;
    }

    return (
      <Animated.View
        key={index}
        style={[
          styles.floatingShape,
          shapeStyle,
          {
            left: startX,
            opacity,
            transform: [
              { translateY },
              { rotate },
            ],
          },
        ]}
      />
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colorScheme.backgroundGradient[0], colorScheme.backgroundGradient[1]]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradient}
      />
      
      {/* Subtle geometric pattern overlay */}
      <View style={styles.patternOverlay} pointerEvents="none">
        {floatAnims.map((_, index) => renderFloatingShape(index))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradient: {
    flex: 1,
  },
  patternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingShape: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
});