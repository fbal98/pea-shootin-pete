import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { UI_PALETTE } from '@/constants/GameColors';
import { Typography, Spacing, BorderRadius, Layout } from '@/constants/DesignTokens';
import { FloatingPeasBackground } from '@/components/ui/FloatingPeasBackground';
import { StyledSwitch } from '@/components/ui/StyledSwitch';


interface SettingsScreenProps {
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Simple settings state - minimal options following hyper-casual philosophy
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [hapticEnabled, setHapticEnabled] = React.useState(true);

  useEffect(() => {
    // Entrance animation
    Animated.stagger(100, [
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);


  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[UI_PALETTE.background_light, UI_PALETTE.background_dark]}
        style={styles.gradient}
      />
      <FloatingPeasBackground />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={28} color={UI_PALETTE.text_dark} />
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
          <View style={styles.spacer} />
        </View>

        {/* Settings sections */}
        <Animated.View 
          style={[
            styles.settingsContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Audio Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Audio</Text>
            
            <View style={styles.setting}>
              <View style={styles.settingInfo}>
                <Ionicons name="volume-high" size={24} color={UI_PALETTE.text_dark} style={styles.settingIcon} />
                <View>
                  <Text style={styles.settingLabel}>Sound Effects</Text>
                  <Text style={styles.settingDescription}>Game sounds and audio feedback</Text>
                </View>
              </View>
              <StyledSwitch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
              />
            </View>
          </View>

          {/* Interaction Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interaction</Text>
            
            <View style={styles.setting}>
              <View style={styles.settingInfo}>
                <Ionicons name="phone-portrait" size={24} color={UI_PALETTE.text_dark} style={styles.settingIcon} />
                <View>
                  <Text style={styles.settingLabel}>Haptic Feedback</Text>
                  <Text style={styles.settingDescription}>Vibration for game actions</Text>
                </View>
              </View>
              <StyledSwitch
                value={hapticEnabled}
                onValueChange={setHapticEnabled}
              />
            </View>
          </View>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Ready to play? Head back to the menu!</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    paddingTop: Layout.hudTopPadding,
    paddingHorizontal: Spacing.large,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xlarge,
  },
  backButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: UI_PALETTE.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    ...Typography.h1,
    flex: 1,
    color: UI_PALETTE.text_dark,
    textAlign: 'center',
    marginLeft: -56, // Compensate for back button
    fontWeight: '700',
  },
  spacer: {
    width: 56,
  },
  settingsContainer: {
    flex: 1,
  },
  section: {
    marginBottom: Spacing.xlarge,
  },
  sectionTitle: {
    ...Typography.h3,
    color: UI_PALETTE.text_dark,
    marginBottom: Spacing.medium,
    fontWeight: '600',
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.medium,
    borderRadius: BorderRadius.large,
    marginBottom: Spacing.medium,
    shadowColor: UI_PALETTE.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: Spacing.medium,
  },
  settingLabel: {
    ...Typography.body,
    color: UI_PALETTE.text_dark,
    fontWeight: '600',
  },
  settingDescription: {
    ...Typography.caption,
    color: UI_PALETTE.text_secondary,
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: Spacing.xlarge,
  },
  footerText: {
    ...Typography.bodySmall,
    color: UI_PALETTE.text_secondary,
    textAlign: 'center',
  },
});
