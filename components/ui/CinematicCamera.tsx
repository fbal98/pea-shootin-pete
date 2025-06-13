import React, { useRef, useEffect } from 'react';
import { Animated, Dimensions, Easing } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CinematicCameraProps {
  children: React.ReactNode;
  focusPoint?: { x: number; y: number };
  zoom?: number;
  duration?: number;
  easing?: any;
  autoFocus?: boolean;
  parallaxLayers?: Array<{
    component: React.ReactNode;
    depth: number; // 0-1, where 0 is background, 1 is foreground
  }>;
}

export const CinematicCamera: React.FC<CinematicCameraProps> = ({
  children,
  focusPoint,
  zoom = 1,
  duration = 1500,
  easing = Easing.out(Easing.cubic),
  autoFocus = true,
  parallaxLayers = [],
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const blurRadius = useRef(new Animated.Value(0)).current;
  
  const lastFocusPoint = useRef({ x: 0, y: 0 });
  const lastZoom = useRef(1);

  useEffect(() => {
    if (!focusPoint || !autoFocus) return;

    const targetX = screenWidth / 2 - focusPoint.x * zoom;
    const targetY = screenHeight / 2 - focusPoint.y * zoom;

    // Smooth camera transition
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: targetX,
        duration,
        easing,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: targetY,
        duration,
        easing,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: zoom,
        duration: duration * 0.8,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    lastFocusPoint.current = focusPoint;
    lastZoom.current = zoom;
  }, [focusPoint, zoom, autoFocus]);

  const createParallaxTransform = (depth: number) => {
    const parallaxFactor = 1 - depth;
    
    return {
      transform: [
        {
          translateX: translateX.interpolate({
            inputRange: [-1000, 1000],
            outputRange: [-1000 * parallaxFactor, 1000 * parallaxFactor],
          }),
        },
        {
          translateY: translateY.interpolate({
            inputRange: [-1000, 1000],
            outputRange: [-1000 * parallaxFactor, 1000 * parallaxFactor],
          }),
        },
        {
          scale: scale.interpolate({
            inputRange: [0.5, 2],
            outputRange: [0.5 + (1 - parallaxFactor) * 0.3, 2 - (1 - parallaxFactor) * 0.5],
          }),
        },
      ],
    };
  };

  const createDepthOfFieldBlur = (depth: number) => {
    const blurAmount = Math.abs(depth - 0.8) * 5; // Focus plane at depth 0.8
    
    return {
      opacity: scale.interpolate({
        inputRange: [0.5, 1, 2],
        outputRange: [0.7, 1, 0.9],
      }),
    };
  };

  return (
    <>
      {/* Background parallax layers */}
      {parallaxLayers
        .filter(layer => layer.depth < 0.5)
        .map((layer, index) => (
          <Animated.View
            key={`bg-${index}`}
            style={[
              { position: 'absolute', width: '100%', height: '100%' },
              createParallaxTransform(layer.depth),
              createDepthOfFieldBlur(layer.depth),
            ]}
          >
            {layer.component}
          </Animated.View>
        ))}

      {/* Main content */}
      <Animated.View
        style={{
          transform: [
            { translateX },
            { translateY },
            { scale },
          ],
        }}
      >
        {children}
      </Animated.View>

      {/* Foreground parallax layers */}
      {parallaxLayers
        .filter(layer => layer.depth >= 0.5)
        .map((layer, index) => (
          <Animated.View
            key={`fg-${index}`}
            style={[
              { position: 'absolute', width: '100%', height: '100%' },
              createParallaxTransform(layer.depth),
              createDepthOfFieldBlur(layer.depth),
            ]}
            pointerEvents="none"
          >
            {layer.component}
          </Animated.View>
        ))}
    </>
  );
};

// Hook for camera controls
export const useCinematicCamera = () => {
  const cameraRef = useRef<{
    focusOn: (point: { x: number; y: number }, zoom?: number) => void;
    resetView: () => void;
    smoothPan: (deltaX: number, deltaY: number) => void;
    zoomTo: (zoom: number) => void;
  }>({} as any);

  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const focusOn = (point: { x: number; y: number }, zoom: number = 1.5) => {
    const targetX = screenWidth / 2 - point.x * zoom;
    const targetY = screenHeight / 2 - point.y * zoom;

    Animated.parallel([
      Animated.spring(translateX, {
        toValue: targetX,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }),
      Animated.spring(translateY, {
        toValue: targetY,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }),
      Animated.spring(scale, {
        toValue: zoom,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }),
    ]).start();
  };

  const resetView = () => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }),
    ]).start();
  };

  const smoothPan = (deltaX: number, deltaY: number) => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: (translateX as any)._value + deltaX,
        useNativeDriver: true,
        tension: 120,
        friction: 8,
      }),
      Animated.spring(translateY, {
        toValue: (translateY as any)._value + deltaY,
        useNativeDriver: true,
        tension: 120,
        friction: 8,
      }),
    ]).start();
  };

  const zoomTo = (zoom: number) => {
    Animated.spring(scale, {
      toValue: zoom,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  };

  cameraRef.current = {
    focusOn,
    resetView,
    smoothPan,
    zoomTo,
  };

  return {
    cameraControls: cameraRef.current,
    cameraTransform: {
      transform: [
        { translateX },
        { translateY },
        { scale },
      ],
    },
    translateX,
    translateY,
    scale,
  };
};

// Utility component for automatic world transition detection
export const WorldTransitionDetector: React.FC<{
  currentWorld: string;
  onWorldChange: (world: string) => void;
  children: React.ReactNode;
}> = ({ currentWorld, onWorldChange, children }) => {
  const lastWorld = useRef(currentWorld);

  useEffect(() => {
    if (lastWorld.current !== currentWorld) {
      onWorldChange(currentWorld);
      lastWorld.current = currentWorld;
    }
  }, [currentWorld, onWorldChange]);

  return <>{children}</>;
};