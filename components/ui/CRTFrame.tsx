import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArcadeColors } from '@/constants/ArcadeColors';

interface CRTFrameProps {
  children: React.ReactNode;
  showScanlines?: boolean;
  showStaticNoise?: boolean;
  intensity?: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const CRTFrame: React.FC<CRTFrameProps> = ({
  children,
  showScanlines = true,
  showStaticNoise = false,
  intensity = 1,
}) => {
  const insets = useSafeAreaInsets();
  const glowAnimation = useRef(new Animated.Value(0.8)).current;
  const staticAnimation = useRef(new Animated.Value(0)).current;

  // CRT glow pulsing effect
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnimation, {
          toValue: 0.8,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [glowAnimation]);

  // Static noise animation for transitions
  useEffect(() => {
    if (showStaticNoise) {
      Animated.loop(
        Animated.timing(staticAnimation, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        })
      ).start();
    } else {
      staticAnimation.setValue(0);
    }
  }, [showStaticNoise, staticAnimation]);

  const renderScanlines = () => {
    if (!showScanlines) return null;
    
    return (
      <View style={styles.scanlinesContainer} pointerEvents="none">
        {Array.from({ length: Math.floor(SCREEN_HEIGHT / 4) }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.scanline,
              {
                top: i * 4,
                opacity: 0.02 * intensity,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const renderStaticNoise = () => {
    if (!showStaticNoise) return null;

    return (
      <Animated.View
        style={[
          styles.staticNoise,
          {
            opacity: staticAnimation,
          },
        ]}
        pointerEvents="none"
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Outer bezel with device safe areas */}
      <View
        style={[
          styles.outerBezel,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          },
        ]}
      >
        {/* CRT Monitor Frame */}
        <View style={styles.monitorFrame}>
          {/* Corner decorations */}
          <View style={[styles.cornerDecoration, styles.topLeft]} />
          <View style={[styles.cornerDecoration, styles.topRight]} />
          <View style={[styles.cornerDecoration, styles.bottomLeft]} />
          <View style={[styles.cornerDecoration, styles.bottomRight]} />

          {/* Inner screen with rounded corners */}
          <View style={styles.innerScreen}>
            {/* Edge gradients for CRT curve effect */}
            <LinearGradient
              colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.4)']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.horizontalEdgeGradient}
              pointerEvents="none"
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.4)']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.verticalEdgeGradient}
              pointerEvents="none"
            />

            {/* Screen glow effect */}
            <Animated.View
              style={[
                styles.screenGlow,
                {
                  opacity: glowAnimation,
                },
              ]}
              pointerEvents="none"
            />

            {/* Main content */}
            <View style={styles.contentArea}>
              {children}
            </View>

            {/* CRT Effects Overlay */}
            {renderScanlines()}
            {renderStaticNoise()}

            {/* Vignette effect */}
            <LinearGradient
              colors={[
                'rgba(0,0,0,0)',
                'rgba(0,0,0,0)',
                'rgba(0,0,0,0.1)',
                'rgba(0,0,0,0.3)',
              ]}
              locations={[0, 0.7, 0.9, 1]}
              style={styles.vignette}
              pointerEvents="none"
            />

            {/* Reflection effect */}
            <LinearGradient
              colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.reflection}
              pointerEvents="none"
            />
          </View>

          {/* Monitor brand label */}
          <View style={styles.brandLabel}>
            <View style={styles.brandDot} />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ArcadeColors.deepBlack,
  },
  outerBezel: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  monitorFrame: {
    flex: 1,
    margin: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#2a2a2a',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  cornerDecoration: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#3a3a3a',
    borderWidth: 2,
  },
  topLeft: {
    top: 20,
    left: 20,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 20,
    right: 20,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 20,
    left: 20,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 20,
    right: 20,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  innerScreen: {
    flex: 1,
    margin: 12,
    backgroundColor: ArcadeColors.deepBlack,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: ArcadeColors.electricBlue,
  },
  horizontalEdgeGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  verticalEdgeGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 11,
  },
  screenGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: ArcadeColors.blueGlow,
    ...Platform.select({
      ios: {
        shadowColor: ArcadeColors.electricBlue,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
      },
    }),
  },
  contentArea: {
    flex: 1,
    zIndex: 1,
  },
  scanlinesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
  },
  scanline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#000',
  },
  staticNoise: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 30,
  },
  vignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
  },
  reflection: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '50%',
    height: '50%',
    zIndex: 50,
    opacity: 0.3,
  },
  brandLabel: {
    position: 'absolute',
    bottom: 8,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00FF00',
    opacity: 0.6,
    ...Platform.select({
      ios: {
        shadowColor: '#00FF00',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
      },
    }),
  },
});