import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Platform } from 'react-native';
import { ArcadeColors } from '@/constants/ArcadeColors';

interface ArcadeButtonProps {
  onPress: () => void;
  text: string;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const ArcadeButton: React.FC<ArcadeButtonProps> = ({ 
  onPress, 
  text, 
  variant = 'primary',
  disabled = false,
  size = 'medium'
}) => {
  const getButtonColors = () => {
    if (variant === 'primary') {
      return {
        background: ArcadeColors.hotPink,
        glow: ArcadeColors.pinkGlow,
        text: ArcadeColors.white,
      };
    }
    return {
      background: ArcadeColors.electricBlue,
      glow: ArcadeColors.blueGlow,
      text: ArcadeColors.deepBlack,
    };
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: 20,
          paddingVertical: 10,
          fontSize: 16,
        };
      case 'large':
        return {
          paddingHorizontal: 60,
          paddingVertical: 25,
          fontSize: 28,
        };
      default:
        return {
          paddingHorizontal: 40,
          paddingVertical: 15,
          fontSize: 22,
        };
    }
  };

  const colors = getButtonColors();
  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.button,
        { backgroundColor: colors.background },
        disabled && styles.disabled,
      ]}
    >
      <View style={[
        styles.glowContainer,
        {
          shadowColor: colors.glow,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: sizeStyles.paddingVertical,
        }
      ]}>
        <Text style={[
          styles.text,
          { 
            color: colors.text,
            fontSize: sizeStyles.fontSize,
          }
        ]}>
          {text.toUpperCase()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 0,
    borderWidth: 2,
    borderColor: ArcadeColors.white,
    margin: 10,
  },
  glowContainer: {
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  text: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: Platform.OS === 'ios' ? 'bold' : '900',
    textAlign: 'center',
    letterSpacing: 2,
  },
  disabled: {
    opacity: 0.5,
  },
});