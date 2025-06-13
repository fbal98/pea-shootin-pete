import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { PanGestureHandler, PinchGestureHandler, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useLevelProgressionStore } from '../store/levelProgressionStore';
import { AtmosphericBackground } from '../components/ui/AtmosphericBackground';
import { DynamicPath } from '../components/ui/DynamicPath';
import { EnhancedWorldNode } from '../components/ui/EnhancedWorldNode';
import { CinematicCamera, useCinematicCamera } from '../components/ui/CinematicCamera';
// import { usePerformanceOptimizer } from '../utils/PerformanceOptimizer';

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
  const [currentTheme, setCurrentTheme] = useState<WorldTheme>(WORLD_THEMES.beach);
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0 });

  const { cameraControls, cameraTransform, translateX, translateY, scale } = useCinematicCamera();
  
  // Simplified performance settings for now
  const lod = { animationQuality: 'high' as const, particleCount: 30 };
  const shouldRenderObject = (pos: any, camera: any) => true;
  const shouldEnableEffect = (effect: any) => true;
  const isInViewport = (pos: any, size: any, camera: any, scale: any) => true;

  // Animation values for pan and zoom (keeping original functionality)
  const lastPan = useRef({ x: 0, y: 0 });
  const lastScale = useRef(1);

  const levelProgressionStore = useLevelProgressionStore();

  useEffect(() => {
    // Update camera position for performance calculations
    const updateCameraPosition = () => {
      setCameraPosition({
        x: -(translateX as any)._value,
        y: -(translateY as any)._value,
      });
    };

    const listener = translateX.addListener(updateCameraPosition);
    const listener2 = translateY.addListener(updateCameraPosition);

    return () => {
      translateX.removeListener(listener);
      translateY.removeListener(listener2);
    };
  }, [translateX, translateY]);

  const handleNodePress = (node: WorldNode) => {
    if (node.locked) {
      return;
    }

    setSelectedNode(node);
    setCurrentTheme(WORLD_THEMES[node.theme]);

    // Use cinematic camera for smooth focusing
    if (cameraControls) {
      cameraControls.focusOn(node.position, 1.5);
    }
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

  const getCurrentWorldTheme = (): string => {
    if (!selectedNode) return 'beach';
    
    // Find the dominant theme in the current viewport
    const visibleNodes = WORLD_NODES.filter(node =>
      isInViewport(
        node.position,
        { width: 60, height: 60 },
        cameraPosition,
        (scale as any)._value
      )
    );
    
    if (visibleNodes.length === 0) return 'beach';
    
    // Return the theme of the first visible node, or selected node theme
    return selectedNode?.theme || visibleNodes[0].theme;
  };

  const renderPaths = () => {
    return WORLD_NODES.map(node =>
      node.connections.map(connectionId => {
        const connectedNode = WORLD_NODES.find(n => n.id === connectionId);
        if (!connectedNode) return null;

        // Performance culling for paths
        if (!shouldRenderObject(node.position, cameraPosition)) {
          return null;
        }

        const pathStatus = node.completed ? 'completed' : node.locked ? 'locked' : 'available';

        return (
          <DynamicPath
            key={`path_${node.id}_${connectionId}`}
            from={node.position}
            to={connectedNode.position}
            theme={node.theme}
            status={pathStatus}
            animated={shouldEnableEffect('complex')}
          />
        );
      })
    ).flat().filter(Boolean);
  };

  const renderNodes = () => {
    return WORLD_NODES.map(node => {
      // Performance culling for nodes
      if (!shouldRenderObject(node.position, cameraPosition)) {
        return null;
      }

      return (
        <EnhancedWorldNode
          key={node.id}
          node={node}
          isSelected={selectedNode?.id === node.id}
          onPress={handleNodePress}
          scale={scale}
        />
      );
    }).filter(Boolean);
  };

  const atmosphericIntensity = shouldEnableEffect('complex') ? 
    (lod.animationQuality === 'high' ? 1 : lod.animationQuality === 'medium' ? 0.7 : 0.4) : 0.2;

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      {/* Atmospheric Background */}
      <AtmosphericBackground 
        theme={getCurrentWorldTheme() as any} 
        intensity={atmosphericIntensity}
      />

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

      {/* Performance indicator (dev mode) */}
      {__DEV__ && (
        <View style={styles.performanceIndicator}>
          <Text style={styles.performanceText}>
            LOD: {lod.animationQuality} | Particles: {lod.particleCount}
          </Text>
        </View>
      )}

      {/* Map Container with Cinematic Camera */}
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
                cameraTransform,
              ]}
            >
              {/* Dynamic Paths */}
              {renderPaths()}

              {/* Enhanced Nodes */}
              {renderNodes()}
            </Animated.View>
          </PanGestureHandler>
        </Animated.View>
      </PinchGestureHandler>

      {/* Selected Node Info */}
      {selectedNode && (
        <Animated.View 
          style={[
            styles.nodeInfo, 
            { backgroundColor: currentTheme.primaryColor }
          ]}
        >
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
        </Animated.View>
      )}

      {/* Enhanced Theme Legend */}
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
    zIndex: 10,
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
  performanceIndicator: {
    position: 'absolute',
    top: 100,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 4,
    zIndex: 10,
  },
  performanceText: {
    color: 'white',
    fontSize: 10,
  },
  mapContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  mapContent: {
    width: 1200,
    height: 1000,
  },
  nodeInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 10,
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
    zIndex: 10,
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