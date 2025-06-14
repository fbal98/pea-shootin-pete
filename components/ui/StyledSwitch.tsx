import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Typography, Spacing, BorderRadius, Layout } from '@/constants/DesignTokens';
import { UI_PALETTE } from '@/constants/GameColors';

interface StyledSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export const StyledSwitch: React.FC<StyledSwitchProps> = ({ 
  value, 
  onValueChange, 
  disabled = false 
}) => {
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value, animatedValue]);

  const handlePress = () => {
    if (disabled) return;
    
    // Press animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onValueChange(!value);
  };

  const trackColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [UI_PALETTE.settingsSwitchOff, UI_PALETTE.primary],
  });

  const thumbTranslateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, Layout.switchWidth - 28], // 28 = thumb size + padding
  });

  const thumbColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [UI_PALETTE.text_secondary, UI_PALETTE.text_light],
  });

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.container,
        disabled && styles.disabled,
      ]}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.track,
          {
            backgroundColor: trackColor,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              backgroundColor: thumbColor,
              transform: [{ translateX: thumbTranslateX }],
            },
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: Layout.switchWidth,
    height: Layout.switchHeight,
    justifyContent: 'center',
  },
  track: {
    width: Layout.switchWidth,
    height: Layout.switchHeight,
    borderRadius: Layout.switchHeight / 2,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: UI_PALETTE.settingsBorder,
    shadowColor: UI_PALETTE.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  thumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    shadowColor: UI_PALETTE.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  disabled: {
    opacity: 0.5,
  },
});