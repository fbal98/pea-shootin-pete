import React, { useEffect, useRef } from 'react';
import { Animated, View, Easing } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

interface DynamicPathProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  theme: 'beach' | 'space' | 'city' | 'forest' | 'arctic' | 'volcano' | 'desert' | 'underwater';
  status: 'locked' | 'available' | 'completed';
  animated?: boolean;
}

export const DynamicPath: React.FC<DynamicPathProps> = ({
  from,
  to,
  theme,
  status,
  animated = true,
}) => {
  const dashAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated && status === 'available') {
      Animated.loop(
        Animated.timing(dashAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [status, animated, dashAnim]);

  const dashOffset = dashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -40], // Creates marching ants effect
  });

  const getThemeColors = () => {
    switch (status) {
      case 'locked':
        return { primary: '#9E9E9E', secondary: '#757575' };
      case 'available':
        return { primary: '#66BB6A', secondary: '#4CAF50' };
      case 'completed':
      default:
        return { primary: '#FFC107', secondary: '#FFA000' };
    }
  };

  const colors = getThemeColors();
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const controlPointOffset = 30;
  const midX = (from.x + to.x) / 2 + Math.sin(angle) * controlPointOffset;
  const midY = (from.y + to.y) / 2 - Math.cos(angle) * controlPointOffset;
  const pathData = `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;

  const getStrokeWidth = () => {
    switch (status) {
      case 'locked': return 8;
      case 'available': return 10;
      case 'completed': return 12;
      default: return 8;
    }
  };

  const strokeWidth = getStrokeWidth();

  return (
    <View style={{ position: 'absolute', width: '100%', height: '100%' }} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <SvgLinearGradient id={`grad_${status}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={colors.primary} />
            <Stop offset="1" stopColor={colors.secondary} />
          </SvgLinearGradient>
        </Defs>

        {/* Path Shadow */}
        <Path d={pathData} stroke="#00000040" strokeWidth={strokeWidth} fill="none" strokeLinecap="round" transform="translate(0, 4)" />

        {/* Main Path */}
        <Path d={pathData} stroke={`url(#grad_${status})`} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />

        {/* Animated Dashes for Available Path */}
        {status === 'available' && animated && (
          <AnimatedPath
            d={pathData}
            stroke="white"
            strokeWidth={strokeWidth / 3}
            fill="none"
            strokeLinecap="round"
            strokeDasharray="10, 10"
            strokeDashoffset={dashOffset}
          />
        )}
      </Svg>
    </View>
  );
};

const AnimatedPath = Animated.createAnimatedComponent(Path);