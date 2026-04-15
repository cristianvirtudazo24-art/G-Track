import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState, useEffect, useCallback } from 'react';
import { FlatList, StyleSheet, Text, View, RefreshControl, ActivityIndicator, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStudentNotifications } from '../../../services/api';

interface AlertItem {
  id: string;
  title?: string;
  body: string;
  time: string;
  type: 'info' | 'warning' | 'danger';
}

const ALERT_CONFIG: Record<string, { color: string; bg: string; icon: string; defaultTitle: string }> = {
  info:    { color: '#1E2F97', bg: '#EEF2FF', icon: 'information', defaultTitle: 'Announcement' },
  warning: { color: '#F97316', bg: '#FFF7ED', icon: 'alert', defaultTitle: 'Security Warning' },
  danger:  { color: '#E8313A', bg: '#FEE2E2', icon: 'alert-octagon', defaultTitle: 'Urgent Alert' },
};

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      const studentId = await AsyncStorage.getItem('studentId');
      if (!studentId) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const rawData = await getStudentNotifications(studentId);
      const dataArray = Array.isArray(rawData) 
        ? rawData 
        : (rawData?.notifications || rawData?.data || []);

      const mapped = dataArray.map((item: any) => ({
        id: String(item.id),
        title: item.title || ALERT_CONFIG[item.type]?.defaultTitle || 'Admin Broadcast',
        body: item.text || item.message || 'No message content',
        time: formatTimestamp(item.timestamp || item.created_at),
        type: item.type || 'info'
      }));
      setAlerts(mapped);
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();

    const sub = DeviceEventEmitter.addListener('refreshAlerts', fetchAlerts);
    return () => sub.remove();
  }, [fetchAlerts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAlerts();
  };

  const formatTimestamp = (ts: string) => {
    if (!ts) return 'recently';
    try {
      const date = new Date(ts);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffMins < 1440) return `${Math.floor(diffMins/60)}h ago`;
      return date.toLocaleDateString();
    } catch {
      return ts;
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#1E2F97" />
        <Text style={styles.loadingText}>Loading Announcements...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alerts</Text>
        <Text style={styles.headerSubtitle}>Notifications from campus admin</Text>
      </View>

      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F97316']} />
        }
        ListEmptyComponent={<Text style={styles.emptyText}>No alerts at this time.</Text>}
        renderItem={({ item }) => {
          const cfg = ALERT_CONFIG[item.type] ?? ALERT_CONFIG.info;
          return (
            <View style={styles.alertCard}>
              <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
                <MaterialCommunityIcons name={cfg.icon as any} size={22} color={cfg.color} />
              </View>
              <View style={styles.alertContent}>
                <View style={styles.alertHeader}>
                  <Text style={[styles.alertTitle, { color: cfg.color }]}>{item.title}</Text>
                  <Text style={styles.alertTime}>{item.time}</Text>
                </View>
                <Text style={styles.alertBody}>{item.body}</Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FF' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#1E2F97', fontWeight: '600' },
  header: {
    backgroundColor: '#1E2F97',
    paddingTop: 55,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 4 },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  list: { padding: 20, paddingBottom: 40 },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  iconWrap: { padding: 10, borderRadius: 14, marginRight: 14, marginTop: 2 },
  alertContent: { flex: 1 },
  alertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  alertTitle: { fontWeight: '700', fontSize: 15 },
  alertTime: { fontSize: 12, color: '#9CA3AF' },
  alertBody: { fontSize: 14, color: '#4B5563', lineHeight: 21 },
  emptyText: { textAlign: 'center', color: '#9CA3AF', fontSize: 16, marginTop: 60 },
});