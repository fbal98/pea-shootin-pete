import { StyleSheet } from 'react-native';

import { Collapsible } from '@/components/Collapsible';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function TabTwoScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#4CAF50', dark: '#2E7D32' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#A5D6A7"
          name="gamecontroller.fill"
          style={styles.headerImage}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">About Pea Shootin&apos; Pete</ThemedText>
      </ThemedView>
      <ThemedText>A classic arcade-style defense game built with React Native and Expo.</ThemedText>

      <Collapsible title="How to Play">
        <ThemedText>
          <ThemedText type="defaultSemiBold">Touch</ThemedText> anywhere on the screen to shoot peas
          from Pete&apos;s position.
        </ThemedText>
        <ThemedText>
          <ThemedText type="defaultSemiBold">Drag</ThemedText> your finger to move Pete left and
          right.
        </ThemedText>
        <ThemedText>
          Destroy enemies before they reach the bottom to survive! The game gets progressively
          harder as you advance through levels.
        </ThemedText>
      </Collapsible>

      <Collapsible title="Scoring">
        <ThemedText>
          • Large enemies (size 3): <ThemedText type="defaultSemiBold">10 points</ThemedText>
        </ThemedText>
        <ThemedText>
          • Medium enemies (size 2): <ThemedText type="defaultSemiBold">20 points</ThemedText>
        </ThemedText>
        <ThemedText>
          • Small enemies (size 1): <ThemedText type="defaultSemiBold">30 points</ThemedText>
        </ThemedText>
        <ThemedText>
          • Level up every <ThemedText type="defaultSemiBold">100 points</ThemedText>
        </ThemedText>
        <ThemedText>• Higher levels spawn enemies faster and unlock new enemy types</ThemedText>
      </Collapsible>

      <Collapsible title="Game Features">
        <ThemedText>
          • <ThemedText type="defaultSemiBold">Pete (Yellow Character)</ThemedText>: Your character
          with antenna who shoots peas upward
        </ThemedText>
        <ThemedText>
          • <ThemedText type="defaultSemiBold">Basic Enemies (Red Squares)</ThemedText>: Standard
          enemies with angry faces that bounce around
        </ThemedText>
        <ThemedText>
          • <ThemedText type="defaultSemiBold">Fast Enemies (Orange Diamonds)</ThemedText>: Quick
          enemies that move 1.5x faster (unlocked at level 2)
        </ThemedText>
        <ThemedText>
          • <ThemedText type="defaultSemiBold">Strong Enemies (Purple Squares)</ThemedText>: Slower
          but tougher enemies with thick borders (unlocked at level 3)
        </ThemedText>
        <ThemedText>
          • <ThemedText type="defaultSemiBold">Projectiles (Glowing Green Peas)</ThemedText>:
          Animated peas with pulsing glow effects
        </ThemedText>
        <ThemedText>
          • <ThemedText type="defaultSemiBold">Enemy Splitting</ThemedText>: Large enemies split
          into smaller ones when hit
        </ThemedText>
      </Collapsible>

      <Collapsible title="Tips & Strategies">
        <ThemedText>• Stay mobile - enemies bounce around unpredictably</ThemedText>
        <ThemedText>• Rapid fire by tapping quickly in different positions</ThemedText>
        <ThemedText>
          • Target larger enemies first - they split into smaller, faster ones
        </ThemedText>
        <ThemedText>• Small enemies are worth more points but harder to hit</ThemedText>
        <ThemedText>
          • Watch enemy types - orange diamonds are fast, purple squares are slow
        </ThemedText>
        <ThemedText>• Plan your shots - projectiles travel in straight lines upward</ThemedText>
      </Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
