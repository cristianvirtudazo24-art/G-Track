import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

// Mock data for Admin Notifications
const MOCK_ALERTS = [
  { id: '1', title: 'Emergency Drill', body: 'Earthquake drill at 2:00 PM. Please proceed to the open field.', time: '10 mins ago', type: 'info' },
  { id: '2', title: 'Security Alert', body: 'Unidentified person reported near Gate 2. Stay in your classrooms.', time: '1 hour ago', type: 'warning' },
];

export default function AlertsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Alerts</Text>
      </View>

      <FlatList
        data={MOCK_ALERTS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
          <View style={styles.alertCard}>
            <View style={[styles.indicator, { backgroundColor: item.type === 'warning' ? '#EF4444' : '#2563EB' }]} />
            <View style={styles.alertContent}>
              <View style={styles.alertHeader}>
                <Text style={styles.alertTitle}>{item.title}</Text>
                <Text style={styles.alertTime}>{item.time}</Text>
              </View>
              <Text style={styles.alertBody}>{item.body}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 40, paddingTop: 60, backgroundColor: '#2563EB' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  alertCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, flexDirection: 'row', elevation: 2, overflow: 'hidden' },
  indicator: { width: 6 },
  alertContent: { flex: 1, padding: 15 },
  alertHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  alertTitle: { fontWeight: 'bold', fontSize: 16, color: '#111827' },
  alertTime: { fontSize: 12, color: '#6B7280' },
  alertBody: { fontSize: 14, color: '#4B5563', lineHeight: 20 }
});