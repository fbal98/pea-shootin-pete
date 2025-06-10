import React, { useEffect, useRef, useCallback, useState } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { GAME_CONFIG } from '@/constants/GameConfig';

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

export const Starfield: React.FC<StarfieldProps> = ({ isPlaying, deltaTime: _deltaTime = 0 }) => {
  const dimensions = useWindowDimensions();
  const [stars, setStars] = useState<Star[]>([]);
  const initializedRef = useRef(false);
  const screenDimensionsRef = useRef({ width: dimensions.width, height: dimensions.height });

  // Update dimensions ref without causing re-renders
  useEffect(() => {
    screenDimensionsRef.current = { width: dimensions.width, height: dimensions.height };
  }, [dimensions.width, dimensions.height]);

  const createStar = useCallback(
    (y?: number): Star => {
      const layer = Math.random();
      let size, speed, opacity;

      if (layer < GAME_CONFIG.STAR_LAYER_DISTRIBUTION.BACKGROUND) {
        // Background layer
        const bg = GAME_CONFIG.STAR_LAYERS.BACKGROUND;
        size = Math.random() * (bg.sizeRange[1] - bg.sizeRange[0]) + bg.sizeRange[0];
        speed = Math.random() * (bg.speedRange[1] - bg.speedRange[0]) + bg.speedRange[0];
        opacity = Math.random() * (bg.opacityRange[1] - bg.opacityRange[0]) + bg.opacityRange[0];
      } else if (
        layer <
        GAME_CONFIG.STAR_LAYER_DISTRIBUTION.BACKGROUND + GAME_CONFIG.STAR_LAYER_DISTRIBUTION.MIDDLE
      ) {
        // Middle layer
        const mid = GAME_CONFIG.STAR_LAYERS.MIDDLE;
        size = Math.random() * (mid.sizeRange[1] - mid.sizeRange[0]) + mid.sizeRange[0];
        speed = Math.random() * (mid.speedRange[1] - mid.speedRange[0]) + mid.speedRange[0];
        opacity = Math.random() * (mid.opacityRange[1] - mid.opacityRange[0]) + mid.opacityRange[0];
      } else {
        // Foreground layer
        const fg = GAME_CONFIG.STAR_LAYERS.FOREGROUND;
        size = Math.random() * (fg.sizeRange[1] - fg.sizeRange[0]) + fg.sizeRange[0];
        speed = Math.random() * (fg.speedRange[1] - fg.speedRange[0]) + fg.speedRange[0];
        opacity = Math.random() * (fg.opacityRange[1] - fg.opacityRange[0]) + fg.opacityRange[0];
      }

      return {
        id: `star-${Date.now()}-${Math.random()}`,
        x: Math.random() * screenDimensionsRef.current.width,
        y: y ?? Math.random() * screenDimensionsRef.current.height,
        size,
        speed,
        opacity,
      };
    },
    [screenDimensionsRef] // Include screenDimensionsRef in dependencies
  );

  // Initialize stars once
  useEffect(() => {
    if (!initializedRef.current) {
      const initialStars: Star[] = [];
      for (let i = 0; i < GAME_CONFIG.STAR_COUNT; i++) {
        initialStars.push(createStar());
      }
      setStars(initialStars);
      initializedRef.current = true;
      
    }
  }, [createStar]);

  // Animation loop with its own timing
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastUpdateTimeRef = useRef<number>(0);
  const accumulatorRef = useRef(0);

  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
      return;
    }

    const targetFrameTime = 33; // ~30fps for starfield

    const updateStars = (currentDeltaTime: number) => {
      setStars(prevStars =>
        prevStars.map(star => {
          const newY = star.y + star.speed * currentDeltaTime;

          // Reset star if it goes off screen
          if (newY > screenDimensionsRef.current.height + star.size) {
            return createStar(-star.size);
          }

          return { ...star, y: newY };
        })
      );
      
    };

    const animationLoop = (timestamp: number) => {
      if (!isPlaying) return;

      if (lastUpdateTimeRef.current === 0) {
        lastUpdateTimeRef.current = timestamp;
      }

      const elapsed = timestamp - lastUpdateTimeRef.current;
      lastUpdateTimeRef.current = timestamp;
      accumulatorRef.current += elapsed;

      // Throttle updates to ~30fps for starfield
      if (accumulatorRef.current >= targetFrameTime) {
        const deltaTimeSeconds = accumulatorRef.current / 1000;
        updateStars(deltaTimeSeconds);
        accumulatorRef.current = 0;
      }

      animationFrameRef.current = requestAnimationFrame(animationLoop);
    };

    animationFrameRef.current = requestAnimationFrame(animationLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    };
  }, [isPlaying, createStar]);

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
