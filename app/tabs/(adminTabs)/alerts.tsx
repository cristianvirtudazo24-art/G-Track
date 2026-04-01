import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { getAlerts } from '../../../services/api';

const ALERT_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  danger:  { color: '#E8313A', bg: '#FEE2E2', icon: 'alert-octagon', label: 'DANGER' },
  warning: { color: '#F97316', bg: '#FFF7ED', icon: 'alert',         label: 'WARNING' },
  info:    { color: '#1E2F97', bg: '#EEF2FF', icon: 'information',    label: 'INFO' },
};

export default function AdminAlertsScreen() {
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    getAlerts().then(setAlerts);
    const interval = setInterval(() => {
      getAlerts().then(data => setAlerts([...data]));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Incident Reports</Text>
        <Text style={styles.headerSubtitle}>Real-time alerts & student emergencies</Text>
      </View>

      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.emptyText}>No alerts actively recorded.</Text>}
        renderItem={({ item }) => {
          const cfg = ALERT_CONFIG[item.type] ?? ALERT_CONFIG.info;
          return (
            <View style={styles.alertCard}>
              <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
                <MaterialCommunityIcons name={cfg.icon as any} size={22} color={cfg.color} />
              </View>
              <View style={styles.alertContent}>
                <View style={styles.alertHeader}>
                  <Text style={[styles.alertType, { color: cfg.color }]}>{cfg.label}</Text>
                  <Text style={styles.alertTime}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
                </View>
                <Text style={styles.alertBody}>{item.text}</Text>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F7FF' },
  header: {
    backgroundColor: '#1E2F97',
    paddingTop: 20,
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
  alertType: { fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  alertTime: { fontSize: 12, color: '#9CA3AF' },
  alertBody: { fontSize: 14, color: '#4B5563', lineHeight: 21, marginTop: 2 },
  emptyText: { textAlign: 'center', color: '#9CA3AF', fontSize: 16, marginTop: 60 },
});
