import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, Modal, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getStudents, getAlerts } from '../../../services/api';

export default function AdminDashboard() {
  const [mapExpanded, setMapExpanded] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [studentData, alertData] = await Promise.all([
        getStudents(),
        getAlerts()
      ]);
      setStudents(studentData || []);
      setAlerts(alertData || []);
      setError(null);
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
      setError("Failed to fetch live data.");
    } finally {
      setLoading(false);
      setRefreshing(true);
      // Small timeout to show the refresh icon briefly
      setTimeout(() => setRefreshing(false), 500); 
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 10000); // Poll every 10 seconds instead of 3 to reduce load
    return () => clearInterval(interval);
  }, [fetchData]);

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

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color="#1E2F97" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} colors={["#1E2F97"]} />
        }
      >
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

        {error && (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="alert-circle" size={20} color="#fff" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

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
          <View style={styles.mapHeaderRow}>
             <Text style={styles.cardTitle}>System Status</Text>
             <View style={[styles.statusBadge, students.length > 0 ? styles.statusBadgeOnline : styles.statusBadgeOffline]}>
                <Text style={styles.statusBadgeText}>{students.length > 0 ? 'LIVE' : 'IDLE'}</Text>
             </View>
          </View>
          
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <View style={[styles.statusDot, { backgroundColor: students.length > 0 ? '#059669' : '#9CA3AF' }]} />
              <Text style={styles.statusLabel}>Backend Connectivity</Text>
            </View>
            <Text style={students.length > 0 ? styles.statusValueOk : styles.statusValueNone}>
              {students.length > 0 ? 'Connected' : 'Waiting for Data...'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <View style={[styles.statusDot, { backgroundColor: '#059669' }]} />
              <Text style={styles.statusLabel}>API Service</Text>
            </View>
            <Text style={styles.statusValueOk}>Active</Text>
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
    paddingTop: 15,
    paddingBottom: 22,
    paddingHorizontal: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerGreeting: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500', marginBottom: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerAvatar: {
    backgroundColor: '#fff',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },

  // Stats
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 16, marginBottom: 4 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    elevation: 2,
    shadowColor: '#1E2F97',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  statIconWrap: { padding: 8, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 10 },
  statNumber: { fontSize: 26, fontWeight: '800', color: '#1E2F97', marginBottom: 2 },
  statLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500' },

  // Map Card
  mapCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    padding: 14,
    elevation: 2,
    shadowColor: '#1E2F97',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  mapHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  cardSub: { fontSize: 11, color: '#9CA3AF', marginTop: 1, fontWeight: '500' },
  expandBtn: { backgroundColor: '#EEF2FF', padding: 8, borderRadius: 10 },
  mapContainer: { height: 210, width: '100%', borderRadius: 12, overflow: 'hidden' },
  map: { width: '100%', height: '100%' },
  markerContainer: { padding: 4, borderRadius: 18, borderWidth: 1.5, borderColor: '#fff', elevation: 3 },
  markerMale: { backgroundColor: '#1E2F97' },
  markerFemale: { backgroundColor: '#F97316' },
  callout: { padding: 5, minWidth: 120 },
  calloutName: { fontWeight: '700', fontSize: 13, color: '#111827', marginBottom: 1 },
  calloutGender: { fontSize: 11, color: '#6B7280', textTransform: 'capitalize' },
  closeMapBtn: {
    position: 'absolute', top: 50, right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 20,
  },

  // Status Card
  statusCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    padding: 14,
    elevation: 2,
    shadowColor: '#1E2F97',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusLabel: { fontSize: 13, color: '#4B5563', fontWeight: '500' },
  statusValueOk: { fontSize: 12, color: '#059669', fontWeight: '700' },
  statusValueNone: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusBadgeOnline: { backgroundColor: '#D1FAE5' },
  statusBadgeOffline: { backgroundColor: '#F3F4F6' },
  statusBadgeText: { fontSize: 10, fontWeight: '800', color: '#059669' },
  divider: { height: 1, backgroundColor: '#F3F4F6' },
  
  // New Styles
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FF' },
  loadingText: { marginTop: 10, fontSize: 15, color: '#1E2F97', fontWeight: '600' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8313A',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    gap: 8
  },
  errorText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
