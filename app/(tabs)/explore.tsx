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
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">About Pea Shootin&apos; Pete</ThemedText>
      </ThemedView>
      <ThemedText>A classic arcade-style defense game built with React Native and Expo.</ThemedText>
      
      <Collapsible title="How to Play">
        <ThemedText>
          <ThemedText type="defaultSemiBold">Touch</ThemedText> anywhere on the screen to shoot peas from Pete&apos;s position.
        </ThemedText>
        <ThemedText>
          <ThemedText type="defaultSemiBold">Drag</ThemedText> your finger to move Pete left and right.
        </ThemedText>
        <ThemedText>
          Destroy enemies before they reach the bottom to survive! The game gets progressively harder as you advance through levels.
        </ThemedText>
      </Collapsible>
      
      <Collapsible title="Scoring">
        <ThemedText>
          • Each enemy destroyed: <ThemedText type="defaultSemiBold">10 points</ThemedText>
        </ThemedText>
        <ThemedText>
          • Level up every <ThemedText type="defaultSemiBold">100 points</ThemedText>
        </ThemedText>
        <ThemedText>
          • Higher levels spawn enemies faster
        </ThemedText>
      </Collapsible>
      
      <Collapsible title="Game Features">
        <ThemedText>
          • <ThemedText type="defaultSemiBold">Pete (Green Circle)</ThemedText>: Your character that shoots peas
        </ThemedText>
        <ThemedText>
          • <ThemedText type="defaultSemiBold">Enemies (Red Squares)</ThemedText>: Basic enemies that fall from the top
        </ThemedText>
        <ThemedText>
          • <ThemedText type="defaultSemiBold">Projectiles (Light Green)</ThemedText>: Peas that Pete shoots upward
        </ThemedText>
      </Collapsible>
      
      <Collapsible title="Tips & Strategies">
        <ThemedText>
          • Stay mobile - don&apos;t let enemies corner you
        </ThemedText>
        <ThemedText>
          • Rapid fire by tapping quickly in different positions
        </ThemedText>
        <ThemedText>
          • Focus on enemies closest to the bottom first
        </ThemedText>
        <ThemedText>
          • Plan your shots - projectiles travel in straight lines
        </ThemedText>
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
