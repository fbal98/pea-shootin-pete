import React, { useRef, useEffect } from 'react';
import { View, Animated, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface InteractionFeedback {
  id: string;
  type: 'tap' | 'unlock' | 'complete' | 'focus';
  position: { x: number; y: number };
  theme: 'beach' | 'space' | 'city' | 'forest' | 'arctic' | 'volcano' | 'desert' | 'underwater';
  intensity: 'low' | 'medium' | 'high';
}

interface ThemedInteractionsProps {
  interactions: InteractionFeedback[];
  onInteractionComplete: (id: string) => void;
}

export const ThemedInteractions: React.FC<ThemedInteractionsProps> = ({
  interactions,
  onInteractionComplete,
}) => {
  const renderInteraction = (interaction: InteractionFeedback) => {
    switch (interaction.type) {
      case 'tap':
        return <TapRipple key={interaction.id} interaction={interaction} onComplete={onInteractionComplete} />;
      case 'unlock':
        return <UnlockBurst key={interaction.id} interaction={interaction} onComplete={onInteractionComplete} />;
      case 'complete':
        return <CompletionCelebration key={interaction.id} interaction={interaction} onComplete={onInteractionComplete} />;
      case 'focus':
        return <FocusGlow key={interaction.id} interaction={interaction} onComplete={onInteractionComplete} />;
      default:
        return null;
    }
  };

  return (
    <View style={{ position: 'absolute', width: '100%', height: '100%' }} pointerEvents="none">
      {interactions.map(renderInteraction)}
    </View>
  );
};

// Tap ripple effect
const TapRipple: React.FC<{
  interaction: InteractionFeedback;
  onComplete: (id: string) => void;
}> = ({ interaction, onComplete }) => {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Haptic feedback
    if (interaction.intensity === 'high') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else if (interaction.intensity === 'medium') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    Animated.parallel([
      Animated.timing(scale, {
        toValue: 3,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete(interaction.id);
    });
  }, []);

  const getThemeColor = () => {
    switch (interaction.theme) {
      case 'beach': return '#FFD93D';
      case 'space': return '#6C5CE7';
      case 'city': return '#FF7675';
      case 'forest': return '#00B894';
      case 'arctic': return '#74B9FF';
      case 'volcano': return '#FF6348';
      case 'desert': return '#FDCB6E';
      case 'underwater': return '#0984E3';
      default: return '#6C5CE7';
    }
  };

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: interaction.position.x - 25,
        top: interaction.position.y - 25,
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: getThemeColor(),
        transform: [{ scale }],
        opacity,
      }}
    />
  );
};

// Unlock burst effect
const UnlockBurst: React.FC<{
  interaction: InteractionFeedback;
  onComplete: (id: string) => void;
}> = ({ interaction, onComplete }) => {
  const animations = useRef([...Array(8)].map(() => ({
    scale: new Animated.Value(0),
    translateX: new Animated.Value(0),
    translateY: new Animated.Value(0),
    opacity: new Animated.Value(1),
  }))).current;

  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const burstAnimations = animations.map((anim, index) => {
      const angle = (index / 8) * Math.PI * 2;
      const distance = 80;

      return Animated.parallel([
        Animated.timing(anim.scale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(anim.translateX, {
          toValue: Math.cos(angle) * distance,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(anim.translateY, {
          toValue: Math.sin(angle) * distance,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(anim.opacity, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(burstAnimations).start(() => {
      onComplete(interaction.id);
    });
  }, []);

  const getThemeColors = () => {
    switch (interaction.theme) {
      case 'beach': return ['#FFD93D', '#6BCF7F', '#87CEEB'];
      case 'space': return ['#6C5CE7', '#A29BFE', '#74B9FF'];
      case 'city': return ['#FF7675', '#FD79A8', '#FDCB6E'];
      case 'forest': return ['#00B894', '#55A3FF', '#98FB98'];
      case 'arctic': return ['#74B9FF', '#FFFFFF', '#E1F5FE'];
      case 'volcano': return ['#FF6348', '#FF9F43', '#FF7979'];
      case 'desert': return ['#FDCB6E', '#E17055', '#F8C471'];
      case 'underwater': return ['#0984E3', '#6C5CE7', '#74B9FF'];
      default: return ['#6C5CE7', '#A29BFE', '#74B9FF'];
    }
  };

  const colors = getThemeColors();

  return (
    <View
      style={{
        position: 'absolute',
        left: interaction.position.x,
        top: interaction.position.y,
      }}
    >
      {animations.map((anim, index) => (
        <Animated.View
          key={index}
          style={{
            position: 'absolute',
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: colors[index % colors.length],
            transform: [
              { scale: anim.scale },
              { translateX: anim.translateX },
              { translateY: anim.translateY },
            ],
            opacity: anim.opacity,
          }}
        />
      ))}
    </View>
  );
};

// Completion celebration
const CompletionCelebration: React.FC<{
  interaction: InteractionFeedback;
  onComplete: (id: string) => void;
}> = ({ interaction, onComplete }) => {
  const fireworkAnimations = useRef([...Array(12)].map(() => ({
    scale: new Animated.Value(0),
    translateX: new Animated.Value(0),
    translateY: new Animated.Value(0),
    opacity: new Animated.Value(1),
    rotation: new Animated.Value(0),
  }))).current;

  const starAnimations = useRef([...Array(5)].map(() => ({
    scale: new Animated.Value(0),
    translateY: new Animated.Value(0),
    opacity: new Animated.Value(1),
  }))).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Firework burst
    const fireworkBurst = fireworkAnimations.map((anim, index) => {
      const angle = (index / 12) * Math.PI * 2;
      const distance = 60 + Math.random() * 40;

      return Animated.parallel([
        Animated.spring(anim.scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(anim.translateX, {
          toValue: Math.cos(angle) * distance,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(anim.translateY, {
          toValue: Math.sin(angle) * distance - 50, // Slight upward bias
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(anim.rotation, {
          toValue: 360,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(800),
          Animated.timing(anim.opacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    // Star shower
    const starShower = starAnimations.map((anim, index) => {
      return Animated.sequence([
        Animated.delay(index * 100),
        Animated.parallel([
          Animated.spring(anim.scale, {
            toValue: 1.5,
            useNativeDriver: true,
            tension: 120,
            friction: 8,
          }),
          Animated.timing(anim.translateY, {
            toValue: -100,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(600),
            Animated.timing(anim.opacity, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]);
    });

    Animated.parallel([
      ...fireworkBurst,
      ...starShower,
    ]).start(() => {
      onComplete(interaction.id);
    });
  }, []);

  const getThemeColors = () => {
    switch (interaction.theme) {
      case 'beach': return ['#FFD93D', '#6BCF7F', '#87CEEB', '#F4A460'];
      case 'space': return ['#6C5CE7', '#A29BFE', '#74B9FF', '#81ECEC'];
      case 'city': return ['#FF7675', '#FD79A8', '#FDCB6E', '#E17055'];
      case 'forest': return ['#00B894', '#55A3FF', '#98FB98', '#8FBC8F'];
      case 'arctic': return ['#74B9FF', '#FFFFFF', '#E1F5FE', '#BBDEFB'];
      case 'volcano': return ['#FF6348', '#FF9F43', '#FF7979', '#FDCB6E'];
      case 'desert': return ['#FDCB6E', '#E17055', '#F8C471', '#D68910'];
      case 'underwater': return ['#0984E3', '#6C5CE7', '#74B9FF', '#00CEC9'];
      default: return ['#6C5CE7', '#A29BFE', '#74B9FF', '#81ECEC'];
    }
  };

  const colors = getThemeColors();

  return (
    <View
      style={{
        position: 'absolute',
        left: interaction.position.x,
        top: interaction.position.y,
      }}
    >
      {/* Firework particles */}
      {fireworkAnimations.map((anim, index) => (
        <Animated.View
          key={`firework-${index}`}
          style={{
            position: 'absolute',
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors[index % colors.length],
            transform: [
              { scale: anim.scale },
              { translateX: anim.translateX },
              { translateY: anim.translateY },
              { rotate: anim.rotation.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg'],
              }) },
            ],
            opacity: anim.opacity,
          }}
        />
      ))}

      {/* Star particles */}
      {starAnimations.map((anim, index) => (
        <Animated.View
          key={`star-${index}`}
          style={{
            position: 'absolute',
            left: (index - 2) * 20,
            width: 16,
            height: 16,
            backgroundColor: '#FFD700',
            transform: [
              { scale: anim.scale },
              { translateY: anim.translateY },
            ],
            opacity: anim.opacity,
          }}
        >
          <View style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            transform: [{ rotate: '45deg' }],
          }}>
            <View style={{
              position: 'absolute',
              width: '100%',
              height: '20%',
              backgroundColor: '#FFD700',
              top: '40%',
            }} />
            <View style={{
              position: 'absolute',
              height: '100%',
              width: '20%',
              backgroundColor: '#FFD700',
              left: '40%',
            }} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
};

// Focus glow effect
const FocusGlow: React.FC<{
  interaction: InteractionFeedback;
  onComplete: (id: string) => void;
}> = ({ interaction, onComplete }) => {
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1.2,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }),
      Animated.timing(opacity, {
        toValue: 0.6,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-complete after duration
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 0.8,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onComplete(interaction.id);
      });
    }, 2000);
  }, []);

  const getThemeColor = () => {
    switch (interaction.theme) {
      case 'beach': return '#FFD93D';
      case 'space': return '#6C5CE7';
      case 'city': return '#FF7675';
      case 'forest': return '#00B894';
      case 'arctic': return '#74B9FF';
      case 'volcano': return '#FF6348';
      case 'desert': return '#FDCB6E';
      case 'underwater': return '#0984E3';
      default: return '#6C5CE7';
    }
  };

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: interaction.position.x - 40,
        top: interaction.position.y - 40,
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: getThemeColor(),
        transform: [{ scale }],
        opacity,
      }}
    />
  );
};

// Hook for managing themed interactions
export const useThemedInteractions = () => {
  const [interactions, setInteractions] = React.useState<InteractionFeedback[]>([]);

  const triggerInteraction = (
    type: InteractionFeedback['type'],
    position: { x: number; y: number },
    theme: InteractionFeedback['theme'],
    intensity: InteractionFeedback['intensity'] = 'medium'
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const interaction: InteractionFeedback = {
      id,
      type,
      position,
      theme,
      intensity,
    };

    setInteractions(prev => [...prev, interaction]);
  };

  const removeInteraction = (id: string) => {
    setInteractions(prev => prev.filter(interaction => interaction.id !== id));
  };

  return {
    interactions,
    triggerInteraction,
    removeInteraction,
  };
};