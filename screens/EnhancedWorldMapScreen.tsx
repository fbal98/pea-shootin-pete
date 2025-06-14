import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { PanGestureHandler, PinchGestureHandler, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useLevelProgressionStore } from '../store/levelProgressionStore';
import { AtmosphericBackground } from '../components/ui/AtmosphericBackground';
import { DynamicPath } from '../components/ui/DynamicPath';
import { EnhancedWorldNode } from '../components/ui/EnhancedWorldNode';
import { useCinematicCamera } from '../components/ui/CinematicCamera';
import { UI_PALETTE } from '@/constants/GameColors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface WorldNode {
  id: string;
  levelId: number;
  name: string;
  theme: 'beach' | 'space' | 'city' | 'forest' | 'arctic' | 'volcano' | 'desert' | 'underwater';
  position: { x: number; y: number };
  connections: string[];
  locked: boolean;
  completed: boolean;
  stars: number;
  requirements?: {
    previousNodes?: string[];
    minStars?: number;
    specialUnlock?: string;
  };
  landmark?: {
    type: 'boss' | 'challenge' | 'bonus' | 'special';
    icon: string;
    description: string;
  };
}

interface WorldTheme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  nodeColor: string;
  pathColor: string;
  landmark: string;
  description: string;
}

const WORLD_THEMES: Record<string, WorldTheme> = {
  beach: {
    id: 'beach',
    name: 'Sunny Beach',
    primaryColor: '#FFD93D',
    secondaryColor: '#6BCF7F',
    backgroundColor: '#87CEEB',
    nodeColor: '#F4A460',
    pathColor: '#DEB887',
    landmark: '🏖️',
    description: 'Tropical paradise with bouncing beach balls',
  },
  space: {
    id: 'space',
    name: 'Cosmic Void',
    primaryColor: '#6C5CE7',
    secondaryColor: '#A29BFE',
    backgroundColor: '#2D3436',
    nodeColor: '#74B9FF',
    pathColor: '#81ECEC',
    landmark: '🚀',
    description: 'Zero gravity balloon popping in deep space',
  },
  city: {
    id: 'city',
    name: 'Metro Heights',
    primaryColor: '#FF7675',
    secondaryColor: '#FD79A8',
    backgroundColor: '#636E72',
    nodeColor: '#FDCB6E',
    pathColor: '#E17055',
    landmark: '🏙️',
    description: 'Urban jungle with neon balloon lights',
  },
  forest: {
    id: 'forest',
    name: 'Mystic Woods',
    primaryColor: '#00B894',
    secondaryColor: '#55A3FF',
    backgroundColor: '#00BF63',
    nodeColor: '#98FB98',
    pathColor: '#8FBC8F',
    landmark: '🌲',
    description: 'Enchanted forest with magical floating orbs',
  },
  arctic: {
    id: 'arctic',
    name: 'Frozen Peaks',
    primaryColor: '#74B9FF',
    secondaryColor: '#FFFFFF',
    backgroundColor: '#B2DFDB',
    nodeColor: '#E1F5FE',
    pathColor: '#BBDEFB',
    landmark: '🗻',
    description: 'Icy mountains with crystalline bubble formations',
  },
  volcano: {
    id: 'volcano',
    name: 'Molten Core',
    primaryColor: '#FF6348',
    secondaryColor: '#FF9F43',
    backgroundColor: '#2C2C2C',
    nodeColor: '#FF7979',
    pathColor: '#FDCB6E',
    landmark: '🌋',
    description: 'Volcanic caverns with lava bubble chambers',
  },
  desert: {
    id: 'desert',
    name: 'Golden Dunes',
    primaryColor: '#FDCB6E',
    secondaryColor: '#E17055',
    backgroundColor: '#F39C12',
    nodeColor: '#F8C471',
    pathColor: '#D68910',
    landmark: '🏜️',
    description: 'Endless sands with mirages and sand balloons',
  },
  underwater: {
    id: 'underwater',
    name: 'Abyssal Depths',
    primaryColor: '#0984E3',
    secondaryColor: '#6C5CE7',
    backgroundColor: '#2980B9',
    nodeColor: '#74B9FF',
    pathColor: '#00CEC9',
    landmark: '🌊',
    description: 'Deep ocean trenches with bioluminescent spheres',
  },
};

// Enhanced world map layout with more nodes and connections
const WORLD_NODES: WorldNode[] = [
  // Beach World (Levels 1-10)
  {
    id: 'beach_1',
    levelId: 1,
    name: 'Shore Start',
    theme: 'beach',
    position: { x: 100, y: 800 },
    connections: ['beach_2'],
    locked: false,
    completed: true,
    stars: 3,
  },
  {
    id: 'beach_2',
    levelId: 2,
    name: 'Tide Pools',
    theme: 'beach',
    position: { x: 200, y: 750 },
    connections: ['beach_3'],
    locked: false,
    completed: true,
    stars: 2,
  },
  {
    id: 'beach_3',
    levelId: 3,
    name: 'Palm Paradise',
    theme: 'beach',
    position: { x: 300, y: 700 },
    connections: ['beach_boss'],
    locked: false,
    completed: false,
    stars: 0,
  },
  {
    id: 'beach_boss',
    levelId: 4,
    name: 'Tsunami Challenge',
    theme: 'beach',
    position: { x: 400, y: 650 },
    connections: ['forest_1'],
    locked: true,
    completed: false,
    stars: 0,
    landmark: {
      type: 'boss',
      icon: '🌊',
      description: 'Massive wave of beach balls to conquer',
    },
  },

  // Forest World (Levels 5-15)
  {
    id: 'forest_1',
    levelId: 5,
    name: 'Forest Entry',
    theme: 'forest',
    position: { x: 500, y: 600 },
    connections: ['forest_2', 'forest_branch'],
    locked: true,
    completed: false,
    stars: 0,
    requirements: { previousNodes: ['beach_boss'] },
  },
  {
    id: 'forest_2',
    levelId: 6,
    name: 'Canopy Climb',
    theme: 'forest',
    position: { x: 600, y: 550 },
    connections: ['forest_3'],
    locked: true,
    completed: false,
    stars: 0,
  },
  {
    id: 'forest_branch',
    levelId: 7,
    name: 'Secret Grove',
    theme: 'forest',
    position: { x: 450, y: 500 },
    connections: ['forest_3'],
    locked: true,
    completed: false,
    stars: 0,
    landmark: {
      type: 'bonus',
      icon: '🍄',
      description: 'Hidden path with magical mushroom balloons',
    },
  },
  {
    id: 'forest_3',
    levelId: 8,
    name: 'Ancient Oak',
    theme: 'forest',
    position: { x: 700, y: 500 },
    connections: ['city_1'],
    locked: true,
    completed: false,
    stars: 0,
  },

  // City World (Levels 9-20)
  {
    id: 'city_1',
    levelId: 9,
    name: 'Neon District',
    theme: 'city',
    position: { x: 800, y: 450 },
    connections: ['city_2'],
    locked: true,
    completed: false,
    stars: 0,
    requirements: { previousNodes: ['forest_3'] },
  },
  {
    id: 'city_2',
    levelId: 10,
    name: 'Rooftop Rush',
    theme: 'city',
    position: { x: 850, y: 350 },
    connections: ['city_challenge'],
    locked: true,
    completed: false,
    stars: 0,
  },
  {
    id: 'city_challenge',
    levelId: 11,
    name: 'Skyscraper Showdown',
    theme: 'city',
    position: { x: 900, y: 250 },
    connections: ['space_1'],
    locked: true,
    completed: false,
    stars: 0,
    landmark: {
      type: 'challenge',
      icon: '🏢',
      description: 'Navigate through towering balloon mazes',
    },
  },

  // Space World (Levels 12-25)
  {
    id: 'space_1',
    levelId: 12,
    name: 'Launch Pad',
    theme: 'space',
    position: { x: 950, y: 150 },
    connections: ['space_2'],
    locked: true,
    completed: false,
    stars: 0,
    requirements: { previousNodes: ['city_challenge'] },
  },
  {
    id: 'space_2',
    levelId: 13,
    name: 'Asteroid Belt',
    theme: 'space',
    position: { x: 900, y: 50 },
    connections: ['space_station'],
    locked: true,
    completed: false,
    stars: 0,
  },
  {
    id: 'space_station',
    levelId: 14,
    name: 'Orbital Station',
    theme: 'space',
    position: { x: 800, y: 100 },
    connections: ['arctic_1'],
    locked: true,
    completed: false,
    stars: 0,
    landmark: {
      type: 'special',
      icon: '🛸',
      description: 'Zero gravity balloon physics challenge',
    },
  },
  
  // Arctic World
  {
    id: 'arctic_1',
    levelId: 15,
    name: 'Ice Fields',
    theme: 'arctic',
    position: { x: 700, y: 200 },
    connections: ['volcano_1'],
    locked: true,
    completed: false,
    stars: 0,
  },
  
  // Volcano World
  {
    id: 'volcano_1',
    levelId: 16,
    name: 'Lava Caves',
    theme: 'volcano',
    position: { x: 600, y: 300 },
    connections: ['desert_1'],
    locked: true,
    completed: false,
    stars: 0,
  },
  
  // Desert World
  {
    id: 'desert_1',
    levelId: 17,
    name: 'Sand Dunes',
    theme: 'desert',
    position: { x: 500, y: 400 },
    connections: ['underwater_1'],
    locked: true,
    completed: false,
    stars: 0,
  },
  
  // Underwater World
  {
    id: 'underwater_1',
    levelId: 18,
    name: 'Coral Reef',
    theme: 'underwater',
    position: { x: 400, y: 500 },
    connections: [],
    locked: true,
    completed: false,
    stars: 0,
  },
];

interface EnhancedWorldMapScreenProps {
  onBack: () => void;
  onLevelSelect: (levelId: number) => void;
}

export const EnhancedWorldMapScreen: React.FC<EnhancedWorldMapScreenProps> = ({ 
  onBack, 
  onLevelSelect 
}) => {
  const [selectedNode, setSelectedNode] = useState<WorldNode | null>(null);
  const infoPanelAnim = useRef(new Animated.Value(350)).current; // Start off-screen

  const { cameraControls, cameraTransform } = useCinematicCamera();

  useEffect(() => {
    // Animate info panel based on selection
    Animated.timing(infoPanelAnim, {
      toValue: selectedNode ? 0 : 350, // Slide in or out
      duration: 400,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [selectedNode, infoPanelAnim]);

  const handleNodePress = (node: WorldNode) => {
    if (node.locked) {
      // Maybe show a "Locked" message
      return;
    }
    setSelectedNode(node);
    cameraControls.focusOn(node.position, 1.2);
  };

  const handleLevelStart = () => {
    if (selectedNode) {
      onLevelSelect(selectedNode.levelId);
    }
  };

  const renderPaths = () => {
    return WORLD_NODES.map(node =>
      node.connections.map(connectionId => {
        const connectedNode = WORLD_NODES.find(n => n.id === connectionId);
        if (!connectedNode) return null;
        const pathStatus = node.completed ? 'completed' : node.locked ? 'locked' : 'available';
        return (
          <DynamicPath
            key={`path_${node.id}_${connectionId}`}
            from={node.position}
            to={connectedNode.position}
            theme={node.theme}
            status={pathStatus}
          />
        );
      })
    ).flat().filter(Boolean);
  };

  return (
    <View style={styles.container}>
      <AtmosphericBackground theme={'forest'} intensity={0.8} />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={32} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>World Map</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="information-circle-outline" size={32} color="white" />
        </TouchableOpacity>
      </View>

      <PinchGestureHandler onGestureEvent={() => {}} onHandlerStateChange={() => {}}>
        <Animated.View style={styles.mapContainer}>
          <PanGestureHandler onGestureEvent={() => {}} onHandlerStateChange={() => {}}>
            <Animated.View style={[styles.mapContent, cameraTransform]}>
              {renderPaths()}
              {WORLD_NODES.map(node => (
                <EnhancedWorldNode
                  key={node.id}
                  node={node}
                  isSelected={selectedNode?.id === node.id}
                  onPress={handleNodePress}
                />
              ))}
            </Animated.View>
          </PanGestureHandler>
        </Animated.View>
      </PinchGestureHandler>

      {selectedNode && (
        <Animated.View style={[styles.infoPanel, { transform: [{ translateY: infoPanelAnim }] }]}>
          <Text style={styles.infoTitle}>{selectedNode.name}</Text>
          <Text style={styles.infoDescription}>{selectedNode.landmark?.description || `Level ${selectedNode.levelId}`}</Text>
          
          <View style={styles.infoStats}>
             <View style={styles.statItem}>
              <Ionicons name="star" size={20} color="#FFD700" />
              <Text style={styles.statText}>{selectedNode.stars} / 3</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="trophy-outline" size={20} color="#C0C0C0" />
              <Text style={styles.statText}>00:45</Text>
            </View>
             <View style={styles.statItem}>
              <Ionicons name="analytics-outline" size={20} color="#87CEEB" />
              <Text style={styles.statText}>98%</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.playButton}
            onPress={handleLevelStart}
          >
            <Text style={styles.playButtonText}>PLAY</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E4620',
  },
  header: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    zIndex: 10,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  mapContainer: {
    flex: 1,
  },
  mapContent: {
    width: 1200,
    height: 1000,
  },
  infoPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  infoTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  infoStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  playButton: {
    backgroundColor: UI_PALETTE.primary,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: UI_PALETTE.primary_shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    height: 56,
  },
  playButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 1,
  },
});