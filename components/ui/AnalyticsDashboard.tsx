/**
 * Analytics Dashboard - Standalone component for viewing AI gameplay analytics
 * 
 * This component provides a comprehensive view of AI performance data,
 * game balance insights, and performance metrics for optimization.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { aiAnalytics, AnalyticsSession } from '@/utils/AIAnalytics';
import { AIMetrics } from '@/pete_ai';
import { UI_PALETTE } from '@/constants/GameColors';
import { balanceAnalyzer, LevelBalanceOverview, PersonaBalanceReport, BALANCE_PERSONAS } from '@/utils/BalanceAnalyzer';

interface AnalyticsDashboardProps {
  visible: boolean;
  onClose: () => void;
}

type DashboardTab = 'analytics' | 'balance' | 'reports';

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ visible, onClose }) => {
  const [sessionHistory, setSessionHistory] = useState<AnalyticsSession[]>([]);
  const [exportData, setExportData] = useState<any>(null);
  const [selectedSession, setSelectedSession] = useState<AnalyticsSession | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>('analytics');
  const [balanceReports, setBalanceReports] = useState<LevelBalanceOverview[]>([]);
  const [isRunningBalanceTest, setIsRunningBalanceTest] = useState<boolean>(false);

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

  const runBalanceTest = async (levelId: number) => {
    setIsRunningBalanceTest(true);
    try {
      console.log(`🎯 Starting balance test for Level ${levelId}`);
      const report = await balanceAnalyzer.runLevelBalanceTest(levelId, `Level ${levelId}`, 10);
      setBalanceReports(prev => {
        const filtered = prev.filter(r => r.levelId !== levelId);
        return [...filtered, report].sort((a, b) => a.levelId - b.levelId);
      });
      
      Alert.alert(
        'Balance Test Complete',
        `Level ${levelId} analysis complete. Check the Balance tab for results.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Balance test failed:', error);
      Alert.alert('Error', 'Balance test failed. Check console for details.');
    } finally {
      setIsRunningBalanceTest(false);
    }
  };

  const exportBalanceData = () => {
    const data = balanceAnalyzer.exportBalanceData();
    console.log('📊 Balance Data Export:', JSON.stringify(data, null, 2));
    Alert.alert(
      'Data Exported',
      'Balance data has been exported to console. Check your development tools.',
      [{ text: 'OK' }]
    );
  };

  const getHealthColor = (score: number): string => {
    if (score >= 0.8) return '#4CAF50'; // Green
    if (score >= 0.6) return '#FFB74D'; // Orange  
    if (score >= 0.4) return '#FF9800'; // Dark Orange
    return '#f44336'; // Red
  };

  const getBalanceScoreColor = (score: string): string => {
    switch (score) {
      case 'healthy': return '#4CAF50';
      case 'too_easy': return '#2196F3';
      case 'too_hard': return '#FF9800';
      case 'needs_review': return '#FFB74D';
      case 'broken': return '#f44336';
      default: return '#ccc';
    }
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

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'analytics' && styles.activeTab]}
            onPress={() => setActiveTab('analytics')}
          >
            <Text style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]}>
              Analytics
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'balance' && styles.activeTab]}
            onPress={() => setActiveTab('balance')}
          >
            <Text style={[styles.tabText, activeTab === 'balance' && styles.activeTabText]}>
              Balance Testing
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reports' && styles.activeTab]}
            onPress={() => setActiveTab('reports')}
          >
            <Text style={[styles.tabText, activeTab === 'reports' && styles.activeTabText]}>
              Reports
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          
          {/* Analytics Tab Content */}
          {activeTab === 'analytics' && (
            <>
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

                  {/* Balance Metrics Display */}
                  {selectedSession.metrics.balanceMetrics && (
                    <View style={styles.metricsSection}>
                      <Text style={styles.metricsTitle}>Balance Metrics</Text>
                      
                      {/* Sweet Spot Ratio */}
                      <View style={styles.balanceMetricGroup}>
                        <Text style={styles.balanceMetricTitle}>Sweet Spot Ratio</Text>
                        <View style={styles.balanceMetricRow}>
                          <Text style={styles.balanceMetricLabel}>Almost Win:</Text>
                          <Text style={styles.balanceMetricValue}>
                            {formatPercent(selectedSession.metrics.balanceMetrics.sweetSpotRatio.almostWinRate * 100)}
                          </Text>
                        </View>
                        <View style={styles.balanceMetricRow}>
                          <Text style={styles.balanceMetricLabel}>Clutch Win:</Text>
                          <Text style={styles.balanceMetricValue}>
                            {formatPercent(selectedSession.metrics.balanceMetrics.sweetSpotRatio.clutchWinRate * 100)}
                          </Text>
                        </View>
                        <View style={styles.balanceMetricRow}>
                          <Text style={styles.balanceMetricLabel}>Dominant Win:</Text>
                          <Text style={styles.balanceMetricValue}>
                            {formatPercent(selectedSession.metrics.balanceMetrics.sweetSpotRatio.dominantWinRate * 100)}
                          </Text>
                        </View>
                      </View>

                      {/* Cognitive Load */}
                      <View style={styles.balanceMetricGroup}>
                        <Text style={styles.balanceMetricTitle}>Cognitive Load</Text>
                        <View style={styles.balanceMetricRow}>
                          <Text style={styles.balanceMetricLabel}>Avg Threats:</Text>
                          <Text style={styles.balanceMetricValue}>
                            {selectedSession.metrics.balanceMetrics.cognitiveLoad.averageSimultaneousThreats.toFixed(1)}
                          </Text>
                        </View>
                        <View style={styles.balanceMetricRow}>
                          <Text style={styles.balanceMetricLabel}>Peak Threats:</Text>
                          <Text style={styles.balanceMetricValue}>
                            {selectedSession.metrics.balanceMetrics.cognitiveLoad.peakSimultaneousThreats}
                          </Text>
                        </View>
                      </View>

                      {/* Engagement Quality */}
                      <View style={styles.balanceMetricGroup}>
                        <Text style={styles.balanceMetricTitle}>Engagement Quality</Text>
                        <View style={styles.balanceMetricRow}>
                          <Text style={styles.balanceMetricLabel}>Satisfaction:</Text>
                          <Text style={styles.balanceMetricValue}>
                            {formatPercent(selectedSession.metrics.balanceMetrics.engagementQuality.satisfactionScore * 100)}
                          </Text>
                        </View>
                        <View style={styles.balanceMetricRow}>
                          <Text style={styles.balanceMetricLabel}>Flow State:</Text>
                          <Text style={styles.balanceMetricValue}>
                            {formatPercent(selectedSession.metrics.balanceMetrics.flowState.immersionScore * 100)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

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
            </>
          )}

          {/* Balance Testing Tab Content */}
          {activeTab === 'balance' && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Level Balance Testing</Text>
                <Text style={styles.sectionDescription}>
                  Run comprehensive balance tests across all 5 personas to identify level tuning opportunities.
                </Text>
                
                {/* Test Controls */}
                <View style={styles.balanceControls}>
                  <View style={styles.balanceControlRow}>
                    {[1, 2, 3, 4, 5, 6].map(levelId => (
                      <TouchableOpacity
                        key={levelId}
                        style={[
                          styles.levelTestButton,
                          isRunningBalanceTest && styles.levelTestButtonDisabled
                        ]}
                        onPress={() => runBalanceTest(levelId)}
                        disabled={isRunningBalanceTest}
                      >
                        <Text style={styles.levelTestButtonText}>Test L{levelId}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  
                  {isRunningBalanceTest && (
                    <View style={styles.testingIndicator}>
                      <Text style={styles.testingText}>Running balance test... This may take a few seconds.</Text>
                    </View>
                  )}
                </View>

                {/* Personas Reference */}
                <View style={styles.personasSection}>
                  <Text style={styles.metricsTitle}>Testing Personas</Text>
                  {BALANCE_PERSONAS.map(persona => (
                    <View key={persona.id} style={styles.personaItem}>
                      <Text style={styles.personaName}>{persona.name}</Text>
                      <Text style={styles.personaDescription}>{persona.description}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* Reports Tab Content */}
          {activeTab === 'reports' && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Balance Reports</Text>
                
                {balanceReports.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>
                      No balance reports yet. Run some tests in the Balance Testing tab to generate reports.
                    </Text>
                  </View>
                ) : (
                  balanceReports.map(report => (
                    <View key={report.levelId} style={styles.reportCard}>
                      <View style={styles.reportHeader}>
                        <Text style={styles.reportTitle}>{report.levelName}</Text>
                        <View style={styles.healthIndicator}>
                          <Text style={[styles.healthScore, { color: getHealthColor(report.overallHealthScore) }]}>
                            {(report.overallHealthScore * 100).toFixed(0)}%
                          </Text>
                        </View>
                      </View>

                      {/* Critical Issues */}
                      {report.criticalIssues.length > 0 && (
                        <View style={styles.issuesSection}>
                          <Text style={styles.issuesTitle}>⚠️ Critical Issues</Text>
                          {report.criticalIssues.map((issue, index) => (
                            <Text key={index} style={styles.issueItem}>• {issue}</Text>
                          ))}
                        </View>
                      )}

                      {/* Persona Results */}
                      <View style={styles.personaResults}>
                        <Text style={styles.metricsTitle}>Persona Results</Text>
                        {report.personaReports.map(personaReport => (
                          <View key={personaReport.persona.id} style={styles.personaResult}>
                            <View style={styles.personaResultHeader}>
                              <Text style={styles.personaResultName}>{personaReport.persona.name}</Text>
                              <Text style={[
                                styles.personaBalanceScore,
                                { color: getBalanceScoreColor(personaReport.balanceScore) }
                              ]}>
                                {personaReport.balanceScore.replace('_', ' ').toUpperCase()}
                              </Text>
                            </View>
                            <View style={styles.personaStats}>
                              <Text style={styles.personaStat}>
                                Completion: {formatPercent(personaReport.testResults.completionRate * 100)}
                              </Text>
                              <Text style={styles.personaStat}>
                                Attempts: {personaReport.testResults.averageAttempts.toFixed(1)}
                              </Text>
                              <Text style={styles.personaStat}>
                                Health: {formatPercent(personaReport.healthScore * 100)}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>

                      {/* Priority Recommendations */}
                      {report.priorityRecommendations.length > 0 && (
                        <View style={styles.recommendationsSection}>
                          <Text style={styles.recommendationsTitle}>🎯 Priority Recommendations</Text>
                          {report.priorityRecommendations.map((rec, index) => (
                            <Text key={index} style={styles.recommendationItem}>• {rec}</Text>
                          ))}
                        </View>
                      )}
                    </View>
                  ))
                )}

                {/* Report Controls */}
                <View style={styles.controls}>
                  <TouchableOpacity 
                    style={[styles.controlButton, styles.exportButton]}
                    onPress={exportBalanceData}
                  >
                    <Text style={styles.controlButtonText}>Export Balance Data</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.controlButton, styles.clearButton]}
                    onPress={() => setBalanceReports([])}
                  >
                    <Text style={styles.controlButtonText}>Clear Reports</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

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
  
  // Tab Navigation Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#2d2d2d',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: UI_PALETTE.primary,
    backgroundColor: '#333',
  },
  tabText: {
    fontSize: 12,
    color: '#ccc',
    fontWeight: '500',
  },
  activeTabText: {
    color: UI_PALETTE.primary,
    fontWeight: 'bold',
  },
  
  // Balance Metrics Styles
  balanceMetricGroup: {
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  balanceMetricTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFB74D',
    marginBottom: 6,
  },
  balanceMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  balanceMetricLabel: {
    fontSize: 11,
    color: '#aaa',
  },
  balanceMetricValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#87CEEB',
  },
  
  // Balance Testing Styles
  sectionDescription: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 16,
    lineHeight: 16,
  },
  balanceControls: {
    marginBottom: 20,
  },
  balanceControlRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  levelTestButton: {
    backgroundColor: UI_PALETTE.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  levelTestButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.5,
  },
  levelTestButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  testingIndicator: {
    backgroundColor: '#2d2d2d',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  testingText: {
    color: '#FFB74D',
    fontSize: 12,
    fontStyle: 'italic',
  },
  
  // Personas Section Styles
  personasSection: {
    backgroundColor: '#2d2d2d',
    padding: 12,
    borderRadius: 8,
  },
  personaItem: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  personaName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 2,
  },
  personaDescription: {
    fontSize: 10,
    color: '#aaa',
    lineHeight: 14,
  },
  
  // Report Styles
  emptyState: {
    backgroundColor: '#2d2d2d',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#aaa',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  reportCard: {
    backgroundColor: '#2d2d2d',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  healthIndicator: {
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  healthScore: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  // Issues Section
  issuesSection: {
    backgroundColor: '#4a2c2c',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  issuesTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginBottom: 6,
  },
  issueItem: {
    fontSize: 11,
    color: '#ffaaaa',
    marginBottom: 2,
  },
  
  // Persona Results
  personaResults: {
    marginBottom: 12,
  },
  personaResult: {
    backgroundColor: '#333',
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  personaResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  personaResultName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  personaBalanceScore: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  personaStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  personaStat: {
    fontSize: 9,
    color: '#aaa',
  },
  
  // Recommendations Section
  recommendationsSection: {
    backgroundColor: '#2c4a2c',
    padding: 10,
    borderRadius: 6,
  },
});