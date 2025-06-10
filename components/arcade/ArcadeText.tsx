import React from 'react';
import { Text, StyleSheet, Platform, TextStyle } from 'react-native';
import { ArcadeColors } from '@/constants/ArcadeColors';

interface ArcadeTextProps {
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'xlarge' | 'title';
  color?: 'pink' | 'blue' | 'green' | 'yellow' | 'white';
  glow?: boolean;
  style?: TextStyle;
  align?: 'left' | 'center' | 'right';
}

export const ArcadeText: React.FC<ArcadeTextProps> = ({ 
  children, 
  size = 'medium',
  color = 'white',
  glow = true,
  style,
  align = 'center'
}) => {
  const getFontSize = () => {
    switch (size) {
      case 'small': return 16;
      case 'medium': return 24;
      case 'large': return 36;
      case 'xlarge': return 48;
      case 'title': return 64;
      default: return 24;
    }
  };

  const getColor = () => {
    switch (color) {
      case 'pink': return ArcadeColors.hotPink;
      case 'blue': return ArcadeColors.electricBlue;
      case 'green': return ArcadeColors.limeGreen;
      case 'yellow': return ArcadeColors.yellow;
      default: return ArcadeColors.white;
    }
  };

  const getGlowColor = () => {
    switch (color) {
      case 'pink': return ArcadeColors.pinkGlow;
      case 'blue': return ArcadeColors.blueGlow;
      case 'green': return ArcadeColors.greenGlow;
      case 'yellow': return ArcadeColors.yellowGlow;
      default: return 'rgba(255, 255, 255, 0.8)';
    }
  };

  const textColor = getColor();
  const glowColor = getGlowColor();

  return (
    <Text 
      style={[
        styles.text,
        {
          fontSize: getFontSize(),
          color: textColor,
          textAlign: align,
          ...(glow && Platform.OS === 'ios' ? {
            textShadowColor: glowColor,
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 10,
          } : {}),
        },
        style,
      ]}
    >
      {typeof children === 'string' ? children.toUpperCase() : children}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: Platform.OS === 'ios' ? 'bold' : '900',
    letterSpacing: 1,
  },
});