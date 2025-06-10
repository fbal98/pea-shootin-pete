import React, { useEffect, useRef, useCallback } from 'react';
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
}

export const Starfield: React.FC<StarfieldProps> = ({ isPlaying }) => {
  const dimensions = useWindowDimensions();
  const starsRef = useRef<Star[]>([]);
  const initializedRef = useRef(false);
  const screenDimensionsRef = useRef({ width: dimensions.width, height: dimensions.height });
  const accumulatorRef = useRef(0);
  const TARGET_FRAME_TIME = 33; // ~30fps for starfield updates
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Force component re-render when stars update
  const [, forceRender] = React.useReducer(x => x + 1, 0);

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
    [] // No dependencies needed since we use ref
  );

  // Initialize stars once
  useEffect(() => {
    if (!initializedRef.current) {
      const initialStars: Star[] = [];
      for (let i = 0; i < GAME_CONFIG.STAR_COUNT; i++) {
        initialStars.push(createStar());
      }
      starsRef.current = initialStars;
      initializedRef.current = true;
      forceRender(); // Initial render
    }
  }, [createStar]);

  // Update stars independently (throttled to ~30fps)
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
      return;
    }

    let lastTimestamp = 0;

    const updateStars = (timestamp: number) => {
      if (!lastTimestamp) {
        lastTimestamp = timestamp;
      }

      const deltaTime = Math.max(0, (timestamp - lastTimestamp) / 1000);
      lastTimestamp = timestamp;

      // Accumulate time and only update when we reach target frame time
      accumulatorRef.current += deltaTime * 1000;

      if (accumulatorRef.current >= TARGET_FRAME_TIME) {
        const deltaTimeSeconds = accumulatorRef.current / 1000;

        // Update stars in place without triggering React state
        starsRef.current = starsRef.current.map(star => {
          const newY = star.y + star.speed * deltaTimeSeconds;

          // Reset star if it goes off screen
          if (newY > screenDimensionsRef.current.height + star.size) {
            return createStar(-star.size);
          }

          return { ...star, y: newY };
        });

        accumulatorRef.current = 0;
        forceRender(); // Minimal React update only when positions change
      }

      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(updateStars);
      }
    };

    if (initializedRef.current) {
      animationFrameRef.current = requestAnimationFrame(updateStars);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    };
  }, [isPlaying, createStar]); // Removed deltaTimeRef and renderTickRef dependencies

  return (
    <View style={styles.container}>
      {starsRef.current.map(star => (
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
