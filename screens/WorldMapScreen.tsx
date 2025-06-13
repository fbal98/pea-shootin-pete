import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { PanGestureHandler, PinchGestureHandler, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Line, Polygon } from 'react-native-svg';
import { getColorScheme } from '../constants/GameColors';
import { useLevelProgressionStore } from '../store/levelProgressionStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface WorldNode {
  id: string;
  levelId: number;
  name: string;
  theme: 'beach' | 'space' | 'city' | 'forest' | 'arctic' | 'volcano' | 'desert' | 'underwater';
  position: { x: number; y: number };
  connections: string[]; // Node IDs this connects to
  locked: boolean;
  completed: boolean;
  stars: number; // 0-3 stars earned
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

// World map layout with nodes and connections
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

  // Add more worlds following the same pattern...
];

interface WorldMapScreenProps {
  onBack: () => void;
  onLevelSelect: (levelId: number) => void;
}

export const WorldMapScreen: React.FC<WorldMapScreenProps> = ({ onBack, onLevelSelect }) => {
  const [selectedNode, setSelectedNode] = useState<WorldNode | null>(null);
  const [currentTheme, setCurrentTheme] = useState<WorldTheme>(WORLD_THEMES.beach);

  // Animation values for pan and zoom
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const lastPan = useRef({ x: 0, y: 0 });
  const lastScale = useRef(1);

  const levelProgressionStore = useLevelProgressionStore();

  const handleNodePress = (node: WorldNode) => {
    if (node.locked) {
      // Show unlock requirements
      return;
    }

    setSelectedNode(node);
    setCurrentTheme(WORLD_THEMES[node.theme]);

    // Animate to center the node
    const centerX = screenWidth / 2 - node.position.x;
    const centerY = screenHeight / 2 - node.position.y;

    Animated.parallel([
      Animated.spring(translateX, {
        toValue: centerX,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: centerY,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLevelStart = () => {
    if (selectedNode) {
      onLevelSelect(selectedNode.levelId);
    }
  };

  const onPanGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { useNativeDriver: true }
  );

  const onPanHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      lastPan.current = {
        x: lastPan.current.x + event.nativeEvent.translationX,
        y: lastPan.current.y + event.nativeEvent.translationY,
      };
      translateX.setOffset(lastPan.current.x);
      translateY.setOffset(lastPan.current.y);
      translateX.setValue(0);
      translateY.setValue(0);
    }
  };

  const onPinchGestureEvent = Animated.event([{ nativeEvent: { scale: scale } }], {
    useNativeDriver: true,
  });

  const onPinchHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      lastScale.current *= event.nativeEvent.scale;
      scale.setOffset(lastScale.current);
      scale.setValue(1);
    }
  };

  const renderPath = (from: WorldNode, to: WorldNode) => {
    const theme = WORLD_THEMES[from.theme];
    return (
      <Line
        key={`path_${from.id}_${to.id}`}
        x1={from.position.x}
        y1={from.position.y}
        x2={to.position.x}
        y2={to.position.y}
        stroke={theme.pathColor}
        strokeWidth={4}
        strokeDasharray={from.completed ? '0' : '10,5'}
        opacity={from.locked ? 0.3 : 0.8}
      />
    );
  };

  const renderNode = (node: WorldNode) => {
    const theme = WORLD_THEMES[node.theme];
    const nodeSize = node.landmark ? 50 : 40;

    return (
      <TouchableOpacity
        key={node.id}
        style={[
          styles.nodeContainer,
          {
            left: node.position.x - nodeSize / 2,
            top: node.position.y - nodeSize / 2,
            width: nodeSize,
            height: nodeSize,
          },
        ]}
        onPress={() => handleNodePress(node)}
        disabled={node.locked}
      >
        <View
          style={[
            styles.node,
            {
              backgroundColor: node.locked ? '#666666' : theme.nodeColor,
              borderColor: node.completed ? '#FFD700' : theme.primaryColor,
              borderWidth: selectedNode?.id === node.id ? 4 : 2,
            },
          ]}
        >
          {node.landmark ? (
            <Text style={styles.landmarkIcon}>{node.landmark.icon}</Text>
          ) : (
            <Text style={styles.levelNumber}>{node.levelId}</Text>
          )}

          {node.locked && (
            <View style={styles.lockOverlay}>
              <Ionicons name="lock-closed" size={16} color="white" />
            </View>
          )}
        </View>

        {node.completed && (
          <View style={styles.starsContainer}>
            {[1, 2, 3].map(star => (
              <Ionicons
                key={star}
                name={star <= node.stars ? 'star' : 'star-outline'}
                size={8}
                color={star <= node.stars ? '#FFD700' : '#CCCCCC'}
              />
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>World Map</Text>

        <TouchableOpacity style={styles.infoButton}>
          <Ionicons name="information-circle" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Map Container */}
      <PinchGestureHandler
        onGestureEvent={onPinchGestureEvent}
        onHandlerStateChange={onPinchHandlerStateChange}
      >
        <Animated.View style={styles.mapContainer}>
          <PanGestureHandler
            onGestureEvent={onPanGestureEvent}
            onHandlerStateChange={onPanHandlerStateChange}
          >
            <Animated.View
              style={[
                styles.mapContent,
                {
                  transform: [
                    { translateX: translateX },
                    { translateY: translateY },
                    { scale: scale },
                  ],
                },
              ]}
            >
              {/* SVG for paths */}
              <Svg width={1200} height={1000} style={StyleSheet.absoluteFill}>
                {WORLD_NODES.map(node =>
                  node.connections.map(connectionId => {
                    const connectedNode = WORLD_NODES.find(n => n.id === connectionId);
                    return connectedNode ? renderPath(node, connectedNode) : null;
                  })
                ).flat()}
              </Svg>

              {/* Nodes */}
              {WORLD_NODES.map(renderNode)}
            </Animated.View>
          </PanGestureHandler>
        </Animated.View>
      </PinchGestureHandler>

      {/* Selected Node Info */}
      {selectedNode && (
        <View style={[styles.nodeInfo, { backgroundColor: currentTheme.primaryColor }]}>
          <View style={styles.nodeInfoHeader}>
            <Text style={styles.nodeInfoTitle}>{selectedNode.name}</Text>
            <Text style={styles.nodeInfoTheme}>{currentTheme.name}</Text>
          </View>

          <Text style={styles.nodeInfoDescription}>
            {selectedNode.landmark?.description || currentTheme.description}
          </Text>

          <View style={styles.nodeInfoStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Level</Text>
              <Text style={styles.statValue}>{selectedNode.levelId}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Stars</Text>
              <Text style={styles.statValue}>{selectedNode.stars}/3</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Status</Text>
              <Text style={styles.statValue}>
                {selectedNode.completed ? 'Complete' : selectedNode.locked ? 'Locked' : 'Available'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.playButton,
              { backgroundColor: selectedNode.locked ? '#666666' : '#4CAF50' },
            ]}
            onPress={handleLevelStart}
            disabled={selectedNode.locked}
          >
            <Text style={styles.playButtonText}>
              {selectedNode.completed ? 'Replay Level' : 'Start Level'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Theme Legend */}
      <View style={styles.themeLegend}>
        {Object.values(WORLD_THEMES)
          .slice(0, 4)
          .map(theme => (
            <View key={theme.id} style={styles.themeItem}>
              <View style={[styles.themeColor, { backgroundColor: theme.nodeColor }]} />
              <Text style={styles.themeName}>{theme.landmark}</Text>
            </View>
          ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  infoButton: {
    padding: 8,
  },
  mapContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  mapContent: {
    width: 1200,
    height: 1000,
  },
  nodeContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  node: {
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  levelNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  landmarkIcon: {
    fontSize: 24,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 2,
  },
  nodeInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  nodeInfoHeader: {
    marginBottom: 12,
  },
  nodeInfoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  nodeInfoTheme: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  nodeInfoDescription: {
    fontSize: 14,
    color: 'white',
    marginBottom: 16,
    lineHeight: 20,
  },
  nodeInfoStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  playButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  playButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  themeLegend: {
    position: 'absolute',
    top: 100,
    left: 20,
    gap: 8,
  },
  themeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  themeName: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
});
