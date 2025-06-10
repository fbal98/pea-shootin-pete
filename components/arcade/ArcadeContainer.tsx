import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { ArcadeColors } from '@/constants/ArcadeColors';

interface ArcadeContainerProps {
  children: React.ReactNode;
  showBorder?: boolean;
  variant?: 'game' | 'menu' | 'overlay';
}

export const ArcadeContainer: React.FC<ArcadeContainerProps> = ({
  children,
  showBorder = true,
  variant = 'menu',
}) => {
  const getBorderStyle = () => {
    if (!showBorder) return {};

    switch (variant) {
      case 'game':
        return {
          borderWidth: 4,
          borderColor: ArcadeColors.electricBlue,
          ...Platform.select({
            ios: {
              shadowColor: ArcadeColors.blueGlow,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 20,
            },
            android: {
              elevation: 15,
            },
          }),
        };
      case 'overlay':
        return {
          borderWidth: 2,
          borderColor: ArcadeColors.hotPink,
          backgroundColor: ArcadeColors.blackOverlay,
        };
      default:
        return {
          borderWidth: 3,
          borderColor: ArcadeColors.hotPink,
          ...Platform.select({
            ios: {
              shadowColor: ArcadeColors.pinkGlow,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 15,
            },
            android: {
              elevation: 10,
            },
          }),
        };
    }
  };

  return (
    <View style={[styles.container, variant === 'overlay' && styles.overlay, getBorderStyle()]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ArcadeColors.deepBlack,
    padding: 20,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
