import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, Modal, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getStudents, getAlerts } from '../../../services/api';

export default function AdminDashboard() {
  const [mapExpanded, setMapExpanded] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    getStudents().then(setStudents);
    getAlerts().then(setAlerts);
    const interval = setInterval(() => {
      getStudents().then(data => setStudents([...data]));
      getAlerts().then(data => setAlerts([...data]));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const activeAlerts = alerts.filter(a => a.type === 'danger' || a.type === 'warning');

  const renderMarkers = () =>
    students.map(student => (
      <Marker
        key={student.id}
        coordinate={{ latitude: student.latitude, longitude: student.longitude }}
      >
        <View style={[styles.markerContainer, student.gender === 'male' ? styles.markerMale : styles.markerFemale]}>
          <MaterialCommunityIcons
            name={student.gender === 'male' ? 'face-man' : 'face-woman'}
            size={18}
            color="#FFF"
          />
        </View>
        <Callout>
          <View style={styles.callout}>
            <Text style={styles.calloutName}>{student.name}</Text>
            <Text style={styles.calloutGender}>{student.gender} • {student.status}</Text>
          </View>
        </Callout>
      </Marker>
    ));

  const initialRegion = {
    latitude: 10.2952207,
    longitude: 123.8955044,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerGreeting}>Good day 👋</Text>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
          </View>
          <View style={styles.headerAvatar}>
            <MaterialCommunityIcons name="shield-account" size={26} color="#1E2F97" />
          </View>
        </View>

        {/* Stat Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#EEF2FF' }]}>
              <MaterialCommunityIcons name="account-group" size={22} color="#1E2F97" />
            </View>
            <Text style={styles.statNumber}>{students.length}</Text>
            <Text style={styles.statLabel}>Active Students</Text>
          </View>
          <View style={[styles.statCard, { marginLeft: 14 }]}>
            <View style={[styles.statIconWrap, { backgroundColor: '#FEE2E2' }]}>
              <MaterialCommunityIcons name="alert-octagon" size={22} color="#E8313A" />
            </View>
            <Text style={[styles.statNumber, { color: '#E8313A' }]}>{activeAlerts.length}</Text>
            <Text style={styles.statLabel}>Active Alerts</Text>
          </View>
        </View>

        {/* MAP CARD */}
        <View style={styles.mapCard}>
          <View style={styles.mapHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>Live Tracking</Text>
              <Text style={styles.cardSub}>{students.length} student{students.length !== 1 ? 's' : ''} on campus</Text>
            </View>
            <TouchableOpacity style={styles.expandBtn} onPress={() => setMapExpanded(true)}>
              <MaterialCommunityIcons name="fullscreen" size={22} color="#1E2F97" />
            </TouchableOpacity>
          </View>
          <View style={styles.mapContainer}>
            <MapView style={styles.map} initialRegion={initialRegion}>
              {renderMarkers()}
            </MapView>
          </View>
        </View>

        {/* System Status */}
        <View style={styles.statusCard}>
          <Text style={styles.cardTitle}>System Status</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <View style={[styles.statusDot, { backgroundColor: '#059669' }]} />
              <Text style={styles.statusLabel}>Background Workers</Text>
            </View>
            <Text style={styles.statusValueOk}>Online</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <View style={[styles.statusDot, { backgroundColor: '#059669' }]} />
              <Text style={styles.statusLabel}>Location Sync Server</Text>
            </View>
            <Text style={styles.statusValueOk}>Online</Text>
          </View>
        </View>
      </ScrollView>

      {/* FULL SCREEN MAP MODAL */}
      <Modal visible={mapExpanded} animationType="slide">
        <View style={{ flex: 1 }}>
          <MapView style={{ flex: 1 }} initialRegion={initialRegion}>
            {renderMarkers()}
          </MapView>
          <TouchableOpacity style={styles.closeMapBtn} onPress={() => setMapExpanded(false)}>
            <MaterialCommunityIcons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F7FF' },
  container: { paddingBottom: 40 },

  // Header
  header: {
    backgroundColor: '#1E2F97',
    paddingTop: 20,
    paddingBottom: 28,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerGreeting: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '500', marginBottom: 2 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff' },
  headerAvatar: {
    backgroundColor: '#fff',
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },

  // Stats
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 20, marginBottom: 4 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    elevation: 3,
    shadowColor: '#1E2F97',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  statIconWrap: { padding: 10, borderRadius: 14, alignSelf: 'flex-start', marginBottom: 12 },
  statNumber: { fontSize: 32, fontWeight: '800', color: '#1E2F97', marginBottom: 4 },
  statLabel: { fontSize: 13, color: '#6B7280', fontWeight: '500' },

  // Map Card
  mapCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
    padding: 18,
    elevation: 3,
    shadowColor: '#1E2F97',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  mapHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  cardSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2, fontWeight: '500' },
  expandBtn: { backgroundColor: '#EEF2FF', padding: 9, borderRadius: 12 },
  mapContainer: { height: 240, width: '100%', borderRadius: 14, overflow: 'hidden' },
  map: { width: '100%', height: '100%' },
  markerContainer: { padding: 5, borderRadius: 20, borderWidth: 2, borderColor: '#fff', elevation: 4 },
  markerMale: { backgroundColor: '#1E2F97' },
  markerFemale: { backgroundColor: '#F97316' },
  callout: { padding: 6, minWidth: 130 },
  calloutName: { fontWeight: '700', fontSize: 14, color: '#111827', marginBottom: 2 },
  calloutGender: { fontSize: 12, color: '#6B7280', textTransform: 'capitalize' },
  closeMapBtn: {
    position: 'absolute', top: 50, right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)', padding: 12, borderRadius: 24,
  },

  // Status Card
  statusCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
    padding: 18,
    elevation: 3,
    shadowColor: '#1E2F97',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 14, color: '#4B5563', fontWeight: '500' },
  statusValueOk: { fontSize: 13, color: '#059669', fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#F3F4F6' },
});
