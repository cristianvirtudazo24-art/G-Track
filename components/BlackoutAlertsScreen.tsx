import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getBlackoutAlerts, updateBlackoutAlertStatus } from '../services/api';
import { BlackoutAlert } from '../types/index';

interface Props {
  onBackPress?: () => void;
}

export const BlackoutAlertsScreen = ({ onBackPress }: Props) => {
  const [alerts, setAlerts] = useState<BlackoutAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadBlackoutAlerts();
    const interval = setInterval(loadBlackoutAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadBlackoutAlerts = async () => {
    try {
      setLoading(true);
      const data = await getBlackoutAlerts();
      setAlerts(data || []);
    } catch (error) {
      console.error('Error loading Blackout alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBlackoutAlerts();
    setRefreshing(false);
  };

  const handleAcknowledge = async (alert: BlackoutAlert) => {
    try {
      setUpdatingId(String(alert.id));
      const result = await updateBlackoutAlertStatus(alert.id, 'acknowledged');
      
      if (result) {
        Alert.alert('Success', 'Alert acknowledged', [
          { text: 'OK', onPress: () => loadBlackoutAlerts() }
        ]);
      } else {
        Alert.alert('Error', 'Failed to acknowledge alert');
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      Alert.alert('Error', 'Failed to acknowledge alert');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMarkResolved = async (alert: BlackoutAlert) => {
    Alert.alert(
      'Mark as Resolved',
      'Are you sure the power has been restored?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Yes, Resolved',
          onPress: async () => {
            try {
              setUpdatingId(String(alert.id));
              const result = await updateBlackoutAlertStatus(alert.id, 'resolved');
              
              if (result) {
                Alert.alert('Success', 'Alert marked as resolved', [
                  { text: 'OK', onPress: () => loadBlackoutAlerts() }
                ]);
              } else {
                Alert.alert('Error', 'Failed to resolve alert');
              }
            } catch (error) {
              console.error('Error resolving alert:', error);
              Alert.alert('Error', 'Failed to resolve alert');
            } finally {
              setUpdatingId(null);
            }
          },
        },
      ]
    );
  };

  const openLocation = (latitude: number, longitude: number) => {
    const url = `geo:${latitude},${longitude}`;
    Linking.openURL(url).catch(() => {
      console.error('Failed to open location');
    });
  };

  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return '#10B981';
      case 'acknowledged':
        return '#F97316';
      default:
        return '#E8313A';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'check-circle';
      case 'acknowledged':
        return 'alert-circle';
      default:
        return 'lightning-bolt-circle';
    }
  };

  const renderAlertCard = (alert: BlackoutAlert) => {
    const isProcessing = updatingId === String(alert.id);
    const statusColor = getStatusColor(alert.status);

    return (
      <View style={styles.alertCard}>
        {/* Header with status badge */}
        <View style={styles.cardHeader}>
          <View style={styles.studentInfo}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <MaterialCommunityIcons name={getStatusIcon(alert.status) as any} size={20} color="white" />
            </View>
            <View style={styles.studentDetails}>
              <Text style={styles.studentName}>{alert.studentName}</Text>
              <Text style={styles.studentId}>ID: {alert.studentId}</Text>
              <View style={styles.statusTag}>
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {alert.status.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Date and Time */}
        <View style={styles.timeSection}>
          <MaterialCommunityIcons name="clock-outline" size={16} color="#9CA3AF" />
          <Text style={styles.timeText}>{formatTime(alert.timestamp)}</Text>
        </View>

        {/* Information Grid */}
        <View style={styles.infoGrid}>
          {/* Battery */}
          <View style={styles.infoItem}>
            <View style={styles.infoIconWrap}>
              <MaterialCommunityIcons
                name={alert.battery > 50 ? 'battery' : alert.battery > 20 ? 'battery-medium' : 'battery-low'}
                size={18}
                color={alert.battery > 50 ? '#10B981' : alert.battery > 20 ? '#F97316' : '#E8313A'}
              />
            </View>
            <View>
              <Text style={styles.infoLabel}>Battery</Text>
              <Text style={styles.infoValue}>{Math.round(alert.battery)}%</Text>
            </View>
          </View>

          {/* Signal/WiFi */}
          <View style={styles.infoItem}>
            <View style={styles.infoIconWrap}>
              <MaterialCommunityIcons name="wifi" size={18} color="#1E2F97" />
            </View>
            <View>
              <Text style={styles.infoLabel}>Signal</Text>
              <Text style={styles.infoValue}>{alert.signal || 'N/A'}</Text>
            </View>
          </View>

          {/* Location */}
          <View style={styles.infoItem}>
            <View style={styles.infoIconWrap}>
              <MaterialCommunityIcons name="map-marker" size={18} color="#E8313A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Last Known Location</Text>
              <TouchableOpacity onPress={() => openLocation(alert.latitude, alert.longitude)}>
                <Text style={styles.infoValue}>
                  {alert.latitude.toFixed(3)}, {alert.longitude.toFixed(3)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Message */}
        {alert.message && alert.message !== 'Blackout Alert' && (
          <View style={styles.messageSection}>
            <Text style={styles.messageLabel}>Details</Text>
            <Text style={styles.messageText}>{alert.message}</Text>
          </View>
        )}

        {/* Action Buttons */}
        {alert.status !== 'resolved' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acknowledgeButton]}
              onPress={() => handleAcknowledge(alert)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check" size={18} color="white" />
                  <Text style={styles.actionButtonText}>Acknowledged</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.resolveButton]}
              onPress={() => handleMarkResolved(alert)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check-all" size={18} color="white" />
                  <Text style={styles.actionButtonText}>Mark Resolved</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Resolved Status */}
        {alert.status === 'resolved' && (
          <View style={styles.resolvedBanner}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
            <Text style={styles.resolvedText}>Issue Resolved</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading && alerts.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#F97316" />
        <Text style={styles.loadingText}>Loading Blackout Alerts...</Text>
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
            <MaterialCommunityIcons name="lightning-bolt-outline" size={60} color="#D1D5DB" />
            <Text style={styles.emptyText}>No Blackout Alerts</Text>
            <Text style={styles.emptySubtext}>All students have power</Text>
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
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  studentId: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statusTag: {
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFF7ED',
    gap: 8,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F97316',
  },
  infoGrid: {
    padding: 16,
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
  },
  infoIconWrap: {
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginTop: 3,
  },
  messageSection: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  messageText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  acknowledgeButton: {
    backgroundColor: '#F97316',
    shadowColor: '#F97316',
  },
  resolveButton: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  resolvedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#ECFDF5',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 8,
  },
  resolvedText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
});
