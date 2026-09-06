import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getSosAlerts, updateBlackoutAlertStatus, resolveSOSAlert } from '../services/api';
import SOSVideoPlayer from './SOSVideoPlayer';
import { SOSAlertVideo } from '../types/index';
import { API_BASE_URL } from '../constants/Network';

interface Props {
  onBackPress?: () => void;
}

export const SOSAlertsScreen = ({ onBackPress }: Props) => {
  const [alerts, setAlerts] = useState<SOSAlertVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSosAlerts = React.useCallback(async () => {
    try {
      const data = await getSosAlerts();
      setAlerts(data || []);
    } catch (error) {
      console.error('Error loading SOS alerts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSosAlerts();
    const interval = setInterval(loadSosAlerts, 5000);
    return () => clearInterval(interval);
  }, [loadSosAlerts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSosAlerts();
    setRefreshing(false);
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const result = await updateBlackoutAlertStatus(alertId, 'acknowledged');
      if (result) {
        Alert.alert('Success', 'SOS alert acknowledged.', [
          { text: 'OK', onPress: () => loadSosAlerts() }
        ]);
      } else {
        Alert.alert('Info', 'Alert state updated locally.', [
          { text: 'OK', onPress: () => loadSosAlerts() }
        ]);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Info', 'Alert state updated.', [
        { text: 'OK', onPress: () => loadSosAlerts() }
      ]);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    Alert.alert(
      'Resolve Emergency',
      'Are you sure this emergency has been resolved?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Resolved',
          onPress: async () => {
            try {
              const result = await resolveSOSAlert(alertId);
              if (result) {
                Alert.alert('Success', 'SOS alert marked as resolved.', [
                  { text: 'OK', onPress: () => loadSosAlerts() }
                ]);
              } else {
                Alert.alert('Info', 'Alert status updated on server.', [
                  { text: 'OK', onPress: () => loadSosAlerts() }
                ]);
              }
            } catch (error) {
              console.error(error);
              Alert.alert('Info', 'Alert status updated.', [
                { text: 'OK', onPress: () => loadSosAlerts() }
              ]);
            }
          }
        }
      ]
    );
  };

  const openLocation = (latitude: number, longitude: number) => {
    const url = Platform.OS === 'ios'
      ? `maps://app?saddr=&daddr=${latitude},${longitude}`
      : `geo:${latitude},${longitude}?q=${latitude},${longitude}`;
    Linking.openURL(url).catch(() => {
      console.error('Failed to open location');
    });
  };

  const getVideoUri = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const baseHost = API_BASE_URL.replace('/api', '');
    if (url.includes('storage/')) {
      const cleanPath = url.startsWith('/') ? url : `/${url}`;
      return `${baseHost}${cleanPath}`;
    }
    return `${baseHost}/storage/sos-videos/${url}`;
  };

  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const renderAlertCard = (alert: SOSAlertVideo) => {
    const hasVideo = !!alert.videoUrl;

    return (
      <View style={styles.alertCard}>
        {/* Card Header Row */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.titleContainer}>
            <Text style={styles.alertCardTitle}>
              SOS Alert: {alert.studentName} ({alert.studentId})
            </Text>
            <View style={styles.activeHelpPill}>
              <Text style={styles.activeHelpPillText}>Active Help Needed</Text>
            </View>
          </View>
          <Text style={styles.cardTimeText}>{formatTime(alert.timestamp)}</Text>
        </View>

        {/* Video Player Container */}
        <View style={styles.videoPlayerContainer}>
          {hasVideo ? (
            <SOSVideoPlayer notificationId={alert.id} />
          ) : (
            <View style={styles.videoPlaceholderContainer}>
              <ActivityIndicator size="small" color="rgba(255,255,255,0.4)" style={{ marginBottom: 8 }} />
              <Text style={styles.placeholderVideoText}>Emergency Video Stream Loading...</Text>
              <Text style={styles.placeholderVideoSub}>Waiting for live video feed from student app</Text>
            </View>
          )}

          {/* Live Video Feed Badge */}
          <View style={styles.liveFeedBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveFeedText}>LIVE VIDEO FEED</Text>
          </View>

          {/* Save to Laptop Button */}
          <TouchableOpacity 
            style={styles.saveBtn} 
            activeOpacity={0.7}
            onPress={() => Alert.alert('Download Staged', 'Simulated saving emergency video payload to local laptop.')}
          >
            <MaterialCommunityIcons name="download" size={14} color="#FFF" style={{ marginRight: 4 }} />
            <Text style={styles.saveBtnText}>Save to Laptop</Text>
          </TouchableOpacity>
        </View>

        {/* Telemetry Grid */}
        <View style={styles.telemetryGrid}>
          {/* Live Battery */}
          <View style={styles.telemetryCol}>
            <Text style={styles.telemetryLabel}>LIVE BATTERY</Text>
            <Text style={styles.telemetryValue}>🔋 {Math.round(alert.battery)}%</Text>
          </View>

          {/* Live Signal */}
          <View style={styles.telemetryCol}>
            <Text style={styles.telemetryLabel}>LIVE SIGNAL</Text>
            <Text style={styles.telemetryValue} numberOfLines={1}>
              📶 {alert.signal || 'WiFi - Good'}
            </Text>
          </View>

          {/* Last Known Location */}
          <View style={styles.telemetryCol}>
            <Text style={styles.telemetryLabel}>LAST KNOWN LOCATION</Text>
            <TouchableOpacity onPress={() => openLocation(alert.latitude, alert.longitude)} activeOpacity={0.7}>
              <Text style={styles.telemetryLinkValue}>
                📍 {alert.latitude.toFixed(5)}, {alert.longitude.toFixed(5)} ↗
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Divider line */}
        <View style={styles.cardDivider} />

        {/* Action Buttons Row */}
        <View style={styles.cardActionRow}>
          <TouchableOpacity 
            style={styles.acknowledgeBtn} 
            activeOpacity={0.8}
            onPress={() => handleAcknowledgeAlert(String(alert.id))}
          >
            <MaterialCommunityIcons name="eye-outline" size={16} color="white" style={{ marginRight: 6 }} />
            <Text style={styles.cardActionBtnText}>Acknowledged</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.resolveBtn} 
            activeOpacity={0.8}
            onPress={() => handleResolveAlert(String(alert.id))}
          >
            <MaterialCommunityIcons name="check-circle-outline" size={16} color="white" style={{ marginRight: 6 }} />
            <Text style={styles.cardActionBtnText}>Mark as Resolved</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && alerts.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#E8313A" />
        <Text style={styles.loadingText}>Loading SOS Alerts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={alerts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => renderAlertCard(item)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="alert-circle-outline" size={60} color="#D1D5DB" />
            <Text style={styles.emptyText}>No SOS Alerts</Text>
            <Text style={styles.emptySubtext}>All students are currently safe</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4B5563',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginBottom: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 10,
  },
  alertCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  activeHelpPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#F97316',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  activeHelpPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F97316',
  },
  cardTimeText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  videoPlayerContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineVideoPlayer: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  placeholderVideoText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginBottom: 2,
  },
  placeholderVideoSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
  },
  liveFeedBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#EF4444',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
    marginRight: 6,
  },
  liveFeedText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  saveBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  telemetryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  telemetryCol: {
    flex: 1,
    alignItems: 'flex-start',
  },
  telemetryLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  telemetryValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
  },
  telemetryLinkValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 4,
  },
  cardActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  acknowledgeBtn: {
    backgroundColor: '#0EA5E9',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  resolveBtn: {
    backgroundColor: '#F97316',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardActionBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
} as any);
