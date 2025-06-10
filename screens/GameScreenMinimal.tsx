import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const GameScreenMinimal: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Minimal Game Screen - Testing</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontSize: 24,
  },
});
