/**
 * Analytics Dashboard - Standalone component for viewing AI gameplay analytics
 * 
 * This component provides a comprehensive view of AI performance data,
 * game balance insights, and performance metrics for optimization.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { aiAnalytics, AnalyticsSession } from '@/utils/AIAnalytics';
import { AIMetrics } from '@/pete_ai';
import { UI_PALETTE } from '@/constants/GameColors';

interface AnalyticsDashboardProps {
  visible: boolean;
  onClose: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ visible, onClose }) => {
  const [sessionHistory, setSessionHistory] = useState<AnalyticsSession[]>([]);
  const [exportData, setExportData] = useState<any>(null);
  const [selectedSession, setSelectedSession] = useState<AnalyticsSession | null>(null);

  useEffect(() => {
    if (visible) {
      refreshData();
    }
  }, [visible]);

  const refreshData = () => {
    const history = aiAnalytics.getSessionHistory();
    const exportedData = aiAnalytics.exportAnalyticsData();
    
    setSessionHistory(history);
    setExportData(exportedData);
    
    if (history.length > 0) {
      setSelectedSession(history[history.length - 1]); // Select most recent
    }
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const formatPercent = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.dashboard}>
        <View style={styles.header}>
          <Text style={styles.title}>AI Analytics Dashboard</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          
          {/* Summary Statistics */}
          {exportData && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Summary Statistics</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{exportData.summary.totalSessions}</Text>
                  <Text style={styles.statLabel}>Total Sessions</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{formatDuration(exportData.summary.totalPlaytime)}</Text>
                  <Text style={styles.statLabel}>Total Playtime</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{formatPercent(exportData.summary.averageAccuracy)}</Text>
                  <Text style={styles.statLabel}>Avg Accuracy</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{exportData.summary.averageFPS.toFixed(1)}</Text>
                  <Text style={styles.statLabel}>Avg FPS</Text>
                </View>
              </View>
            </View>
          )}

          {/* Session History */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Sessions</Text>
            {sessionHistory.slice(-5).reverse().map((session, index) => (
              <TouchableOpacity
                key={session.sessionId}
                style={[
                  styles.sessionItem,
                  selectedSession?.sessionId === session.sessionId && styles.sessionItemSelected
                ]}
                onPress={() => setSelectedSession(session)}
              >
                <View style={styles.sessionHeader}>
                  <Text style={styles.sessionId}>
                    {new Date(session.startTime).toLocaleTimeString()}
                  </Text>
                  <Text style={styles.sessionDuration}>
                    {formatDuration((session.endTime || Date.now()) - session.startTime)}
                  </Text>
                </View>
                
                {session.metrics && (
                  <View style={styles.sessionStats}>
                    <Text style={styles.sessionStat}>
                      Accuracy: {formatPercent(session.metrics.accuracy)}
                    </Text>
                    <Text style={styles.sessionStat}>
                      Score: {session.metrics.score}
                    </Text>
                    <Text style={styles.sessionStat}>
                      Level: {session.metrics.level}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Detailed Session Analysis */}
          {selectedSession && selectedSession.metrics && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Session Details</Text>
              
              {/* Performance Metrics */}
              <View style={styles.metricsSection}>
                <Text style={styles.metricsTitle}>Performance Metrics</Text>
                <View style={styles.metricsGrid}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Accuracy</Text>
                    <Text style={styles.metricValue}>{formatPercent(selectedSession.metrics.accuracy)}</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Reaction Time</Text>
                    <Text style={styles.metricValue}>{selectedSession.metrics.averageReactionTime.toFixed(0)}ms</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Dodge Success</Text>
                    <Text style={styles.metricValue}>{formatPercent(selectedSession.metrics.dodgeSuccessRate)}</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>FPS</Text>
                    <Text style={styles.metricValue}>{selectedSession.metrics.averageFPS.toFixed(1)}</Text>
                  </View>
                </View>
              </View>

              {/* Game Insights */}
              {selectedSession.insights && (
                <View style={styles.insightsSection}>
                  <Text style={styles.metricsTitle}>Game Balance Insights</Text>
                  
                  <View style={styles.insightItem}>
                    <Text style={styles.insightLabel}>Difficulty Rating:</Text>
                    <Text style={[
                      styles.insightValue,
                      { color: selectedSession.insights.levelDifficulty.difficultyRating === 'balanced' ? '#4CAF50' : '#FF9800' }
                    ]}>
                      {selectedSession.insights.levelDifficulty.difficultyRating.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                  
                  <View style={styles.insightItem}>
                    <Text style={styles.insightLabel}>FPS Stability:</Text>
                    <Text style={styles.insightValue}>
                      {selectedSession.insights.performanceImpact.fpsStability.toFixed(1)}%
                    </Text>
                  </View>
                  
                  <Text style={styles.recommendationsTitle}>Recommendations:</Text>
                  {selectedSession.insights.recommendations.map((rec, index) => (
                    <Text key={index} style={styles.recommendationItem}>
                      • {rec}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={refreshData}
            >
              <Text style={styles.controlButtonText}>Refresh Data</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.controlButton, styles.exportButton]}
              onPress={() => {
                const data = aiAnalytics.exportAnalyticsData();
                console.log('📊 Full Analytics Export:', JSON.stringify(data, null, 2));
              }}
            >
              <Text style={styles.controlButtonText}>Export JSON</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.controlButton, styles.clearButton]}
              onPress={() => {
                aiAnalytics.clearAnalyticsData();
                setSessionHistory([]);
                setExportData(null);
                setSelectedSession(null);
              }}
            >
              <Text style={styles.controlButtonText}>Clear All</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: 2000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dashboard: {
    width: '95%',
    height: '90%',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2d2d2d',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    width: 32,
    height: 32,
    backgroundColor: '#666',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: UI_PALETTE.primary,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: '#2d2d2d',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#ccc',
  },
  sessionItem: {
    backgroundColor: '#2d2d2d',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  sessionItemSelected: {
    borderColor: UI_PALETTE.primary,
    backgroundColor: '#333',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sessionId: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sessionDuration: {
    color: '#aaa',
    fontSize: 12,
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sessionStat: {
    color: '#ccc',
    fontSize: 11,
  },
  metricsSection: {
    marginBottom: 16,
  },
  metricsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFB74D',
    marginBottom: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    backgroundColor: '#2d2d2d',
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 11,
    color: '#aaa',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#87CEEB',
  },
  insightsSection: {
    backgroundColor: '#2d2d2d',
    padding: 12,
    borderRadius: 8,
  },
  insightItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  insightLabel: {
    fontSize: 12,
    color: '#ccc',
  },
  insightValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  recommendationsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#A5D6A7',
    marginTop: 8,
    marginBottom: 6,
  },
  recommendationItem: {
    fontSize: 11,
    color: '#A5D6A7',
    marginBottom: 4,
    paddingLeft: 8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 8,
  },
  controlButton: {
    flex: 1,
    backgroundColor: UI_PALETTE.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  exportButton: {
    backgroundColor: '#4CAF50',
  },
  clearButton: {
    backgroundColor: '#f44336',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});