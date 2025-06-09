import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';

interface Star {
  id: string;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

interface StarfieldProps {
  isPlaying: boolean;
  deltaTime?: number;
}

export const Starfield: React.FC<StarfieldProps> = ({ isPlaying, deltaTime = 0 }) => {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const [stars, setStars] = useState<Star[]>([]);
  const initializedRef = useRef(false);

  const createStar = useCallback((y?: number): Star => ({
    id: Math.random().toString(),
    x: Math.random() * SCREEN_WIDTH,
    y: y ?? Math.random() * SCREEN_HEIGHT,
    size: Math.random() * 3 + 1,
    speed: Math.random() * 50 + 20,
    opacity: Math.random() * 0.8 + 0.2,
  }), [SCREEN_WIDTH, SCREEN_HEIGHT]);

  useEffect(() => {
    if (!initializedRef.current) {
      // Initialize stars
      const initialStars: Star[] = [];
      for (let i = 0; i < 50; i++) {
        initialStars.push(createStar());
      }
      setStars(initialStars);
      initializedRef.current = true;
    }
  }, [SCREEN_WIDTH, SCREEN_HEIGHT, createStar]);

  useEffect(() => {
    if (!isPlaying || deltaTime === 0) return;

    setStars(prevStars => {
      return prevStars.map(star => {
        const newY = star.y + star.speed * deltaTime;
        
        // Reset star if it goes off screen
        if (newY > SCREEN_HEIGHT + star.size) {
          return createStar(-star.size);
        }
        
        return { ...star, y: newY };
      });
    });
  }, [isPlaying, deltaTime, SCREEN_HEIGHT, createStar]);

  return (
    <View style={styles.container}>
      {stars.map(star => (
        <View
          key={star.id}
          style={[
            styles.star,
            {
              left: star.x,
              top: star.y,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
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
  star: {
    position: 'absolute',
    backgroundColor: '#FFF',
    borderRadius: 2,
  },
});