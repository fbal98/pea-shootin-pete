import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UI_COLORS } from '@/constants/GameColors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SettingsScreenProps {
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;

  // Simple settings state - minimal options following hyper-casual philosophy
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [hapticEnabled, setHapticEnabled] = React.useState(true);

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Floating background elements - subtle movement
    const createFloatAnimation = (anim: Animated.Value, duration: number, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    createFloatAnimation(floatAnim1, 10000, 0);
    createFloatAnimation(floatAnim2, 12000, 3000);
  }, []);

  const renderFloatingElement = (
    anim: Animated.Value,
    size: number,
    startY: number,
    opacity: number = 0.06
  ) => {
    const translateY = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [startY, startY - SCREEN_HEIGHT - size],
    });

    return (
      <Animated.View
        style={[
          styles.floatingElement,
          {
            width: size,
            height: size,
            opacity,
            transform: [{ translateY }],
          },
        ]}
      />
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F7FFF7', '#E0F2F1']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradient}
      >
        {/* Subtle floating background elements */}
        <View style={styles.backgroundElements}>
          {renderFloatingElement(floatAnim1, 90, SCREEN_HEIGHT, 0.04)}
          {renderFloatingElement(floatAnim2, 70, SCREEN_HEIGHT + 300, 0.06)}
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Header with back button */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>settings</Text>
            <View style={styles.spacer} />
          </View>

          {/* Minimal settings options */}
          <View style={styles.settingsContainer}>
            {/* Sound toggle */}
            <View style={styles.setting}>
              <Text style={styles.settingLabel}>sound</Text>
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{ false: UI_COLORS.settingsSwitchOff, true: UI_COLORS.primary }}
                thumbColor={UI_COLORS.white}
                style={styles.switch}
              />
            </View>

            {/* Haptic feedback toggle */}
            <View style={styles.setting}>
              <Text style={styles.settingLabel}>haptics</Text>
              <Switch
                value={hapticEnabled}
                onValueChange={setHapticEnabled}
                trackColor={{ false: UI_COLORS.settingsSwitchOff, true: UI_COLORS.primary }}
                thumbColor={UI_COLORS.white}
                style={styles.switch}
              />
            </View>
          </View>

          {/* Minimal footer info */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>tap anywhere to play</Text>
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  backgroundElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingElement: {
    position: 'absolute',
    backgroundColor: '#4ECDC4',
    borderRadius: 16,
    left: Math.random() * (SCREEN_WIDTH - 120),
  },
  content: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 80,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 28,
    color: UI_COLORS.menuText,
    fontWeight: '300',
  },
  title: {
    flex: 1,
    fontSize: 28,
    fontWeight: '300',
    color: UI_COLORS.menuText,
    textAlign: 'center',
    marginLeft: -40, // Compensate for back button
  },
  spacer: {
    width: 40,
  },
  settingsContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: UI_COLORS.settingsBorder,
  },
  settingLabel: {
    fontSize: 20,
    fontWeight: '400',
    color: UI_COLORS.menuText,
  },
  switch: {
    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '300',
    color: UI_COLORS.menuTextLight,
  },
});
