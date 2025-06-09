import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePerformanceMonitor } from '@/utils/PerformanceMonitor';

interface DebugFPSCounterProps {
  visible?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const DebugFPSCounter: React.FC<DebugFPSCounterProps> = ({
  visible = __DEV__, // Only visible in development by default
  position = 'top-right',
}) => {
  const { metrics } = usePerformanceMonitor(visible);

  if (!visible || !metrics) {
    return null;
  }

  const getPositionStyle = () => {
    switch (position) {
      case 'top-left':
        return { top: 50, left: 10 };
      case 'top-right':
        return { top: 50, right: 10 };
      case 'bottom-left':
        return { bottom: 50, left: 10 };
      case 'bottom-right':
        return { bottom: 50, right: 10 };
      default:
        return { top: 50, right: 10 };
    }
  };

  const getFPSColor = (fps: number) => {
    if (fps >= 55) return '#4CAF50'; // Green
    if (fps >= 45) return '#FF9800'; // Orange
    if (fps >= 30) return '#FF5722'; // Red-Orange
    return '#F44336'; // Red
  };

  return (
    <View style={[styles.container, getPositionStyle()]}>
      <View style={styles.content}>
        <Text style={[styles.fpsText, { color: getFPSColor(metrics.fps) }]}>
          {metrics.fps.toFixed(1)} FPS
        </Text>
        <Text style={styles.detailText}>Avg: {metrics.averageFps.toFixed(1)}</Text>
        <Text style={styles.detailText}>Frame: {metrics.frameTime.toFixed(1)}ms</Text>
        {metrics.droppedFrames > 0 && (
          <Text style={styles.warningText}>Dropped: {metrics.droppedFrames}</Text>
        )}
        {metrics.memoryUsage && (
          <Text style={styles.detailText}>
            Mem: {(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 9999,
    pointerEvents: 'none',
  },
  content: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 80,
  },
  fpsText: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  detailText: {
    fontSize: 10,
    color: '#cccccc',
    fontFamily: 'monospace',
    textAlign: 'center',
    marginTop: 2,
  },
  warningText: {
    fontSize: 10,
    color: '#ff6b6b',
    fontFamily: 'monospace',
    textAlign: 'center',
    marginTop: 2,
  },
});
