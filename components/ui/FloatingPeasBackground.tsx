import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FloatingPea {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  size: number;
  speed: number;
  opacity: Animated.Value;
}

export const FloatingPeasBackground: React.FC = () => {
  const peasRef = useRef<FloatingPea[]>([]);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    // Create floating peas
    peasRef.current = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: new Animated.Value(Math.random() * SCREEN_WIDTH),
      y: new Animated.Value(SCREEN_HEIGHT + Math.random() * 200),
      size: 8 + Math.random() * 6, // 8-14px
      speed: 0.5 + Math.random() * 1.5, // 0.5-2x speed
      opacity: new Animated.Value(0.3 + Math.random() * 0.4), // 0.3-0.7 opacity
    }));

    // Start animation loop
    const animate = () => {
      peasRef.current.forEach((pea) => {
        // Move pea upward
        pea.y.setValue((pea.y as any)._value - pea.speed);
        
        // Reset pea when it goes off screen
        if ((pea.y as any)._value < -20) {
          pea.y.setValue(SCREEN_HEIGHT + Math.random() * 100);
          pea.x.setValue(Math.random() * SCREEN_WIDTH);
        }
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {peasRef.current.map((pea) => (
        <Animated.View
          key={pea.id}
          style={[
            styles.pea,
            {
              left: pea.x,
              top: pea.y,
              width: pea.size,
              height: pea.size,
              borderRadius: pea.size / 2,
              opacity: pea.opacity,
            },
          ]}
        />
      ))}
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
  pea: {
    position: 'absolute',
    backgroundColor: '#4CAF50',
    borderWidth: 1,
    borderColor: '#66BB6A',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 5,
  },
});